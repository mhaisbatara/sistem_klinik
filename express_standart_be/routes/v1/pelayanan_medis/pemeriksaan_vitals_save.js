/**
 * @project Sistem Klinik
 * @file pelayanan_medis/pemeriksaan_vitals_save.js
 * @description Endpoint untuk menyimpan (insert/update) data vitals & SOAP pada trx_pemeriksaan
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
        tekanan_darah:  Joi.string().allow("", null).optional().label("Tekanan Darah"),
        suhu:           Joi.number().allow(null).optional().label("Suhu Body"),
        nadi:           Joi.number().allow(null).optional().label("Nadi"),
        respirasi:      Joi.number().allow(null).optional().label("Respirasi"),
        berat_badan:    Joi.number().allow(null).optional().label("Berat Badan"),
        tinggi_badan:   Joi.number().allow(null).optional().label("Tinggi Badan"),
        subjektif:      Joi.string().allow("", null).optional().label("Subjektif (S)"),
        objektif:       Joi.string().allow("", null).optional().label("Objektif (O)"),
        assessment:     Joi.string().allow("", null).optional().label("Assessment (A)"),
        plan:           Joi.string().allow("", null).optional().label("Plan (P)"),
        icd10_code:     Joi.string().allow("", null).optional().label("Kode ICD-10"),
        icd10_deskripsi: Joi.string().allow("", null).optional().label("Deskripsi ICD-10"),
      },
      { "any.required": "{#label} wajib diisi" },
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

    const existing = await DB("trx_pemeriksaan")
      .where("kode_kunjungan", oPayload.kode_kunjungan)
      .first();

    const dataSave = {
      no_sip:          oPayload.no_sip || null,
      tekanan_darah:   oPayload.tekanan_darah || null,
      suhu:            oPayload.suhu !== undefined && oPayload.suhu !== "" ? oPayload.suhu : null,
      nadi:            oPayload.nadi !== undefined && oPayload.nadi !== "" ? oPayload.nadi : null,
      respirasi:       oPayload.respirasi !== undefined && oPayload.respirasi !== "" ? oPayload.respirasi : null,
      berat_badan:     oPayload.berat_badan !== undefined && oPayload.berat_badan !== "" ? oPayload.berat_badan : null,
      tinggi_badan:    oPayload.tinggi_badan !== undefined && oPayload.tinggi_badan !== "" ? oPayload.tinggi_badan : null,
      subjektif:       oPayload.subjektif || null,
      objektif:        oPayload.objektif || null,
      assessment:      oPayload.assessment || null,
      plan:            oPayload.plan || null,
      icd10_code:      oPayload.icd10_code || null,
      icd10_deskripsi:  oPayload.icd10_deskripsi || null,
    };

    if (existing) {
      await DB("trx_pemeriksaan")
        .where("id", existing.id)
        .update(dataSave);
    } else {
      const countRes = await DB("trx_pemeriksaan").count("id as c").first();
      const seq      = String(parseInt(countRes.c || 0) + 1).padStart(4, "0");
      const id       = `PMK${seq}`;

      await DB("trx_pemeriksaan").insert({
        id,
        kode_kunjungan: oPayload.kode_kunjungan,
        ...dataSave,
        created_at: formatDateSystem(),
      });
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data pemeriksaan vitals & diagnosis berhasil disimpan",
      datetime: formatDateSystem(),
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "pelayanan_medis/pemeriksaan_vitals_save.js", func: "save", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
