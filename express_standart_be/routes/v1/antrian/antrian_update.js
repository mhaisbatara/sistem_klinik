/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file antrian_update.js
 * @description Endpoint untuk mengedit data antrian poli
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
        id:             Joi.string().required().label("ID Antrian"),
        kode_poli:      Joi.string().allow("", null).optional().label("Tujuan Poli"),
        kode_penjamin:  Joi.string().allow("", null).optional().label("Penjamin"),
        kode_dokter:    Joi.string().allow("", null).optional().label("Dokter"),
        status_panggil: Joi.string().valid("menunggu", "dipanggil", "selesai", "dilewati").optional().label("Status Panggil"),
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
      const record = await trx("trx_antrian").where("id", oPayload.id).forUpdate().first();
      if (!record) {
        const error = new Error(`Data antrian ${oPayload.id} tidak ditemukan`);
        error.statusCode = 404;
        throw error;
      }

      const updateData = {};
      if (oPayload.kode_poli !== undefined)      updateData.kode_poli      = oPayload.kode_poli;
      if (oPayload.kode_penjamin !== undefined)  updateData.kode_penjamin  = oPayload.kode_penjamin;
      if (oPayload.kode_dokter !== undefined)    updateData.kode_dokter    = oPayload.kode_dokter || null;
      if (oPayload.status_panggil !== undefined) updateData.status_panggil = oPayload.status_panggil;

      await trx("trx_antrian").where("id", oPayload.id).update(updateData);

      updatedRecord = { ...record, ...updateData };

      await ChangesLog(
        {
          description:   `Update Data Antrian Poli - No. ${record.no_antrian}`,
          tableName:     "trx_antrian",
          referenceCode: record.id,
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
      message: "Data antrian poli berhasil diperbarui",
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
      file: "/antrian/antrian_update.js",
      func: "update",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
