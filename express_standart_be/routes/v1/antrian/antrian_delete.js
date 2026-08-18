/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file antrian_delete.js
 * @description Endpoint untuk menghapus data antrian poli
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
        id: Joi.string().required().label("ID Antrian"),
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

    let deletedRecord = null;

    await DB.transaction(async (trx) => {
      deletedRecord = await trx("trx_antrian").where("id", oPayload.id).first();
      if (!deletedRecord) {
        const error = new Error(`Data antrian ${oPayload.id} tidak ditemukan`);
        error.statusCode = 404;
        throw error;
      }

      await trx("trx_antrian").where("id", oPayload.id).del();

      await ChangesLog(
        {
          description:   `Hapus Data Antrian Poli - No. ${deletedRecord.no_antrian}`,
          tableName:     "trx_antrian",
          referenceCode: oPayload.id,
          action:        "DELETE",
          dataBefore:    deletedRecord,
          dataAfter:     null,
          user:          username,
          tz:            oPayload.tz || "UTC",
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: `Nomor antrian ${deletedRecord.no_antrian} berhasil dihapus`,
      datetime: formatDateSystem(),
      data: { id: oPayload.id },
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
      file: "/antrian/antrian_delete.js",
      func: "delete",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
