/**
 * @project Sistem Klinik
 * @file keuangan/buku_kas/buku_kas_create.js
 * @description POST: tambah entri buku kas manual (kasbon, operasional, dll).
 *   Kategori 'pembayaran pasien' DILARANG — reserved untuk auto-kasir.
 */

import express from "express";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging, validatePayload } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";
import { generateId } from "../../kasir/tools/kode_generator.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;
  const oPayload = body || {};
  const username = req?.auth?.username || "";

  try {
    const cValidation = await validatePayload(
      {
        tanggal:    Joi.string().required().label("Tanggal"),
        jenis:      Joi.string().valid("masuk", "keluar").required().label("Jenis"),
        kategori:   Joi.string().required().label("Kategori"),
        keterangan: Joi.string().allow("", null).optional().label("Keterangan"),
        jumlah:     Joi.number().min(1).required().label("Jumlah"),
      },
      {
        "any.required": "{#label} wajib diisi",
        "any.only":     "{#label} tidak valid",
        "number.min":   "{#label} harus lebih dari 0",
      },
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

    // Larang kategori yang reserved untuk kasir otomatis
    if (
      oPayload.kategori?.toLowerCase().trim() === "pembayaran pasien"
    ) {
      return res.status(400).json({
        status:   status.GAGAL,
        message:  "Kategori 'pembayaran pasien' tidak dapat diinput manual. Gunakan modul kasir.",
        datetime: formatDateSystem(),
      });
    }

    await DB("trx_buku_kas").insert({
      id:         generateId("KAS"),
      tanggal:    oPayload.tanggal,
      jenis:      oPayload.jenis,
      kategori:   oPayload.kategori,
      keterangan: oPayload.keterangan || null,
      jumlah:     oPayload.jumlah,
      email_user: username,
    });

    return res.status(200).json({
      status:   status.SUKSES,
      message:  "Entri buku kas berhasil ditambahkan",
      datetime: formatDateSystem(),
    });
  } catch (error) {
    const oResult = {
      status:   status.BAD_REQUEST,
      message:  "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "keuangan/buku_kas/buku_kas_create.js", func: "create", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
