/**
 * @project Sistem Klinik
 * @file kasir/tagihan/tagihan_generate.js
 * @description POST: generate atau regenerate tagihan untuk satu kunjungan.
 */

import express from "express";
import Joi from "joi";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging, validatePayload } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";
import { generateTagihan } from "../tools/tagihan_generator.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;
  const oPayload = body || {};
  const username = req?.auth?.username || "";

  try {
    const cValidation = await validatePayload(
      {
        kode_kunjungan: Joi.string().required().label("Kode Kunjungan"),
      },
      { "any.required": "{#label} wajib diisi" },
      oPayload,
      { allowUnknown: true }
    );

    if (cValidation) {
      return res.status(422).json({
        status:   status.BAD_REQUEST,
        message:  cValidation,
        datetime: formatDateSystem(),
      });
    }

    const result = await generateTagihan(
      oPayload.kode_kunjungan,
      username,
      oPayload.kode_penjamin || null
    );

    return res.status(200).json({
      status:   status.SUKSES,
      message:  `Tagihan ${result.kode_tagihan} berhasil di-generate (${result.jumlah_item} item, total Rp ${result.total_tagihan.toLocaleString("id-ID")})`,
      datetime: formatDateSystem(),
      data:     result,
    });
  } catch (error) {
    // Error dari generateTagihan (validasi bisnis) → 400
    if (
      error.message.includes("tidak ditemukan") ||
      error.message.includes("tidak dapat di-regenerate")
    ) {
      return res.status(400).json({
        status:   status.GAGAL,
        message:  error.message,
        datetime: formatDateSystem(),
      });
    }

    const oResult = {
      status:   status.BAD_REQUEST,
      message:  "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "kasir/tagihan/tagihan_generate.js", func: "generate", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
