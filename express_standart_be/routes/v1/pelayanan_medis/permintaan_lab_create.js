/**
 * @project Sistem Klinik
 * @file pelayanan_medis/permintaan_lab_create.js
 * @description Endpoint tambah permintaan lab (jenis_pemeriksaan diisi langsung oleh dokter)
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
        kode_kunjungan:    Joi.string().required().label("Kode Kunjungan"),
        jenis_pemeriksaan: Joi.string().required().label("Jenis Pemeriksaan Lab"),
        no_sip:            Joi.string().allow("", null).optional().label("No. SIP Dokter"),
      },
      {
        "any.required": "{#label} wajib diisi",
        "string.empty": "{#label} tidak boleh kosong",
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

    // Auto-generate ID
    const countRes = await DB("trx_permintaan_lab").count("id as c").first();
    const nextSeq  = (parseInt(countRes.c || 0) + 1).toString().padStart(4, "0");
    const id       = `PLB${nextSeq}`;
    const dateTag  = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const kode_permintaan = `PLB-${dateTag}-${nextSeq}`;
    const tanggal = new Date().toISOString().slice(0, 10);

    const oData = {
      id,
      kode_permintaan,
      kode_kunjungan:    oPayload.kode_kunjungan,
      no_sip:            oPayload.no_sip || null,
      jenis_pemeriksaan: oPayload.jenis_pemeriksaan,
      tanggal_permintaan: tanggal,
      status:            "menunggu",
    };

    await DB("trx_permintaan_lab").insert(oData);

    return res.status(200).json({
      status: status.SUKSES,
      message: "Permintaan lab berhasil ditambahkan",
      datetime: formatDateSystem(),
      data: oData,
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "pelayanan_medis/permintaan_lab_create.js", func: "create", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
