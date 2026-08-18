/**
 * @project Sistem Klinik
 * @file pelayanan_medis/layanan_medis_create.js
 * @description Endpoint tambah layanan medis (konsultasi/tindakan)
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
      {
        kode_kunjungan: Joi.string().required().label("Kode Kunjungan"),
        no_sip:         Joi.string().allow("", null).optional().label("No. SIP Dokter"),
        jenis_layanan:  Joi.string().valid("konsultasi", "tindakan").required().label("Jenis Layanan"),
        nama_layanan:   Joi.string().required().label("Nama Layanan"),
        qty:            Joi.number().min(1).default(1).label("Qty"),
        harga:          Joi.number().min(0).required().label("Harga"),
        keterangan:     Joi.string().allow("", null).optional().label("Keterangan"),
      },
      {
        "any.required":  "{#label} wajib diisi",
        "string.empty":  "{#label} tidak boleh kosong",
        "any.only":      "{#label} tidak valid",
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

    // Auto-generate ID & kode_layanan
    const countRes = await DB("trx_layanan_medis").count("id as c").first();
    const nextSeq  = (parseInt(countRes.c || 0) + 1).toString().padStart(4, "0");
    const id         = `LYN${nextSeq}`;
    const dateTag    = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const kode_layanan = `LYN-${dateTag}-${nextSeq}`;

    const oData = {
      id,
      kode_layanan,
      kode_kunjungan: oPayload.kode_kunjungan,
      no_sip:         oPayload.no_sip || null,
      jenis_layanan:  oPayload.jenis_layanan,
      nama_layanan:   oPayload.nama_layanan,
      qty:            oPayload.qty || 1,
      harga:          oPayload.harga,
      keterangan:     oPayload.keterangan || null,
    };

    await DB("trx_layanan_medis").insert(oData);

    return res.status(200).json({
      status: status.SUKSES,
      message: "Layanan medis berhasil ditambahkan",
      datetime: formatDateSystem(),
      data: oData,
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "pelayanan_medis/layanan_medis_create.js", func: "create", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
