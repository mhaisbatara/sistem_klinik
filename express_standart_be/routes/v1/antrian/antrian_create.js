/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file antrian_create.js
 * @description Endpoint untuk menambah data antrian poli secara manual
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-16
 * @version 1.0.0
 */

import express from "express";
import Joi from "joi";
import DB from "../../../core/config/knex.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import {
  Logging,
  ChangesLog,
  validatePayload,
} from "../components/tools/servertool.js";
import { status } from "../components/tools/general.js";

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
        no_rm:         Joi.string().required().label("No. Rekam Medis"),
        kode_poli:     Joi.string().required().label("Tujuan Poli"),
        kode_penjamin: Joi.string().allow("", null).optional().label("Penjamin"),
        kode_dokter:   Joi.string().allow("", null).optional().label("Dokter"),
        tanggal:       Joi.string().allow("", null).optional().label("Tanggal"),
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

    const pasien = await DB("mst_pasien").where("no_rm", oPayload.no_rm).first();
    if (!pasien) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: `No. Rekam Medis ${oPayload.no_rm} tidak ditemukan`,
        datetime: formatDateSystem(),
      });
    }

    const today = new Date();
    const targetDate = oPayload.tanggal || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    let oTrxAntrian = {};

    await DB.transaction(async (trx) => {
      const maxRes = await trx("trx_antrian")
        .where({ kode_poli: oPayload.kode_poli, tanggal: targetDate })
        .select(trx.raw("MAX(CAST(no_antrian AS UNSIGNED)) as max_no"))
        .forUpdate()
        .first();

      const maxVal = maxRes?.max_no || 0;
      const nextNoInt = parseInt(maxVal || 0) + 1;
      const nextNo = String(nextNoInt).padStart(3, "0");

      const dateStr = targetDate.replace(/-/g, "").slice(2);
      const cleanPoliCode = String(oPayload.kode_poli).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      const poliTag = cleanPoliCode.slice(0, 8);
      const trxId = `TRX${dateStr}${poliTag}${nextNo}`;

      oTrxAntrian = {
        id:             trxId,
        no_antrian:     nextNo,
        no_rm:          oPayload.no_rm,
        kode_poli:      oPayload.kode_poli,
        kode_penjamin:  oPayload.kode_penjamin || "",
        kode_dokter:    oPayload.kode_dokter || null,
        tanggal:        targetDate,
        status_panggil: "menunggu",
        created_at:     formatDateSystem(),
      };

      await trx("trx_antrian").insert(oTrxAntrian);

      await ChangesLog(
        {
          description:   `Tambah Manual Antrian Poli - No. ${nextNo} (${pasien.nama_pasien})`,
          tableName:     "trx_antrian",
          referenceCode: trxId,
          action:        "CREATE",
          dataBefore:    null,
          dataAfter:     oTrxAntrian,
          user:          username,
          tz:            oPayload.tz || "UTC",
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data antrian poli berhasil ditambahkan",
      datetime: formatDateSystem(),
      data: oTrxAntrian,
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };

    Logging(error, {
      file: "/antrian/antrian_create.js",
      func: "create",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
