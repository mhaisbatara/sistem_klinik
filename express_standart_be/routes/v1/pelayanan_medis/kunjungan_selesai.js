/**
 * @project Sistem Klinik
 * @file pelayanan_medis/kunjungan_selesai.js
 * @description Endpoint update status kunjungan menjadi selesai
 */

import express from "express";
import Joi from "joi";
import DB from "../../../core/config/knex.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { Logging, validatePayload } from "../components/tools/servertool.js";
import { status } from "../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;
  const oPayload = body || {};
  const username = req?.auth?.username || "";

  try {
    const cValidation = await validatePayload(
      { kode_kunjungan: Joi.string().required().label("Kode Kunjungan") },
      { "any.required": "{#label} wajib diisi" },
      oPayload
    );

    if (cValidation) {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: cValidation,
        datetime: formatDateSystem(),
      });
    }

    const oKunjungan = await DB("trx_kunjungan")
      .where("kode_kunjungan", oPayload.kode_kunjungan)
      .first();

    if (!oKunjungan) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Kunjungan tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    if (oKunjungan.status_kunjungan === "selesai") {
      return res.status(400).json({
        status: status.GAGAL,
        message: "Kunjungan sudah selesai",
        datetime: formatDateSystem(),
      });
    }

    await DB("trx_kunjungan")
      .where("kode_kunjungan", oPayload.kode_kunjungan)
      .update({
        status_kunjungan: "selesai",
        jam_selesai: DB.fn.now(),
      });

    if (oKunjungan.kode_antrian) {
      await DB("trx_antrian")
        .where("id", oKunjungan.kode_antrian)
        .update({
          status_panggil: "selesai",
        });
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: "Kunjungan berhasil diselesaikan",
      datetime: formatDateSystem(),
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "pelayanan_medis/kunjungan_selesai.js", func: "selesai", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
