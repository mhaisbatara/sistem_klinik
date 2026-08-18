/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file poli_update.js
 * @description Endpoint untuk mengedit data master poli
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
        kode_poli: Joi.string().required().label("Kode Poli"),
        nama_poli: Joi.string().max(100).required().label("Nama Poli"),
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

    let updatedRecord = null;

    await DB.transaction(async (trx) => {
      const record = await trx("mst_poli").where("kode_poli", oPayload.kode_poli).forUpdate().first();
      if (!record) {
        const error = new Error(`Kode Poli '${oPayload.kode_poli}' tidak ditemukan`);
        error.statusCode = 404;
        throw error;
      }

      await trx("mst_poli").where("kode_poli", oPayload.kode_poli).update({
        nama_poli: oPayload.nama_poli,
      });

      updatedRecord = { ...record, nama_poli: oPayload.nama_poli };

      await ChangesLog(
        {
          description:   `Update Master Poli - ${record.nama_poli} -> ${oPayload.nama_poli}`,
          tableName:     "mst_poli",
          referenceCode: record.kode_poli,
          action:        "UPDATE",
          dataBefore:    record,
          dataAfter:     updatedRecord,
          user:          username,
          tz:            oPayload.tz || "UTC",
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: `Poli '${updatedRecord.nama_poli}' berhasil diperbarui`,
      datetime: formatDateSystem(),
      data: updatedRecord,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        status: status.NOT_FOUND,
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
      file: "/master/poli/poli_update.js",
      func: "update",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
