/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file poli_create.js
 * @description Endpoint untuk menambah data master poli baru
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-16
 * @version 1.0.0
 */

import express from "express";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import {
  Logging,
  ChangesLog,
  validatePayload,
} from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;
  const oPayload = body || {};
  const username = req?.auth?.username || "";

  try {
    if (!oPayload || Object.keys(oPayload).length < 1) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Invalid request body",
        datetime: formatDateSystem(),
      });
    }

    const cValidation = await validatePayload(
      {
        nama_poli: Joi.string().max(100).required().label("Nama Poli"),
        kode_poli: Joi.string().max(20).allow("", null).optional().label("Kode Poli"),
      },
      {
        "string.base":  "{#label} harus berupa teks",
        "string.empty": "{#label} tidak boleh kosong",
        "any.required": "{#label} wajib diisi",
      },
      oPayload,
      { allowUnknown: true }
    );

    if (cValidation) {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: cValidation,
        datetime: formatDateSystem(),
      });
    }

    let oNewPoli = {};

    await DB.transaction(async (trx) => {
      let finalKode = oPayload.kode_poli ? oPayload.kode_poli.trim().toUpperCase() : "";

      if (!finalKode) {
        // Auto generate kode_poli: POL01, POL02, POL06, dst
        const maxKodeRes = await trx("mst_poli").max("kode_poli as max_kode").forUpdate().first();
        let nextNo = 1;
        if (maxKodeRes?.max_kode) {
          const match = maxKodeRes.max_kode.match(/\d+/);
          if (match) nextNo = parseInt(match[0]) + 1;
        }
        finalKode = `POL${String(nextNo).padStart(2, "0")}`;
      }

      // Check if kode_poli already exists
      const existingKode = await trx("mst_poli").where("kode_poli", finalKode).first();
      if (existingKode) {
        const error = new Error(`Kode Poli '${finalKode}' sudah digunakan`);
        error.statusCode = 422;
        throw error;
      }

      // Auto generate ID (e.g. 0006)
      const maxIdRes = await trx("mst_poli").max("id as max_id").forUpdate().first();
      let nextIdInt = 1;
      if (maxIdRes?.max_id) {
        nextIdInt = parseInt(maxIdRes.max_id) + 1;
      }
      const finalId = String(nextIdInt).padStart(4, "0");

      oNewPoli = {
        id: finalId,
        kode_poli: finalKode,
        nama_poli: oPayload.nama_poli,
      };

      await trx("mst_poli").insert(oNewPoli);

      await ChangesLog(
        {
          description:   `Tambah Master Poli - ${oPayload.nama_poli} (${finalKode})`,
          tableName:     "mst_poli",
          referenceCode: finalKode,
          action:        "CREATE",
          dataBefore:    null,
          dataAfter:     oNewPoli,
          user:          username,
          tz:            oPayload.tz || "UTC",
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: `Poli '${oNewPoli.nama_poli}' (${oNewPoli.kode_poli}) berhasil ditambahkan`,
      datetime: formatDateSystem(),
      data: oNewPoli,
    });
  } catch (error) {
    if (error.statusCode === 422) {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: error.message,
        datetime: formatDateSystem(),
      });
    }

    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };

    Logging(error, {
      file: "/master/poli/poli_create.js",
      func: "create",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
