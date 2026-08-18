/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file poli_delete.js
 * @description Endpoint untuk menghapus data master poli
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
      deletedRecord = await trx("mst_poli").where("kode_poli", oPayload.kode_poli).first();
      if (!deletedRecord) {
        const error = new Error(`Kode Poli '${oPayload.kode_poli}' tidak ditemukan`);
        error.statusCode = 404;
        throw error;
      }

      // Check if used in trx_antrian
      const usedInTrx = await trx("trx_antrian").where("kode_poli", oPayload.kode_poli).first();
      if (usedInTrx) {
        const error = new Error(`Poli '${deletedRecord.nama_poli}' tidak dapat dihapus karena sudah memiliki data riwayat antrian/kunjungan`);
        error.statusCode = 422;
        throw error;
      }

      await trx("mst_poli").where("kode_poli", oPayload.kode_poli).del();

      await ChangesLog(
        {
          description:   `Hapus Master Poli - ${deletedRecord.nama_poli} (${deletedRecord.kode_poli})`,
          tableName:     "mst_poli",
          referenceCode: oPayload.kode_poli,
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
      message: `Poli '${deletedRecord.nama_poli}' berhasil dihapus`,
      datetime: formatDateSystem(),
      data: { kode_poli: oPayload.kode_poli },
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: error.message,
        datetime: formatDateSystem(),
      });
    }

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
      file: "/master/poli/poli_delete.js",
      func: "delete",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
