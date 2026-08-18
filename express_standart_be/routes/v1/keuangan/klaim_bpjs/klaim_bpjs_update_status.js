/**
 * @project Sistem Klinik
 * @file keuangan/klaim_bpjs/klaim_bpjs_update_status.js
 * @description POST: update status_klaim BPJS sesuai alur verifikasi.
 *   Alur: draft → diajukan → diverifikasi → disetujui/ditolak → dibayar
 */

import express from "express";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging, validatePayload } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";

const router = express.Router();

// Alur transisi status yang valid
const VALID_TRANSITIONS = {
  draft:        ["diajukan"],
  diajukan:     ["diverifikasi", "ditolak"],
  diverifikasi: ["disetujui",    "ditolak"],
  disetujui:    ["dibayar"],
  ditolak:      ["draft"],   // bisa revisi dan diajukan ulang
  dibayar:      [],           // terminal state
};

router.post("/", async (req, res) => {
  const { body } = req;
  const oPayload = body || {};
  const username = req?.auth?.username || "";

  try {
    const cValidation = await validatePayload(
      {
        id:           Joi.alternatives().try(Joi.number(), Joi.string()).required().label("ID Klaim"),
        status_klaim: Joi.string()
          .valid("draft", "diajukan", "diverifikasi", "disetujui", "ditolak", "dibayar")
          .required()
          .label("Status Klaim"),
        no_sep:       Joi.string().allow("", null).optional().label("No. SEP"),
        catatan:      Joi.string().allow("", null).optional().label("Catatan"),
        nominal_klaim: Joi.number().min(0).optional().label("Nominal Klaim"),
      },
      {
        "any.required": "{#label} wajib diisi",
        "any.only":     "{#label} tidak valid",
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

    // Cek klaim ada
    const klaim = await DB("trx_klaim_bpjs").where("id", oPayload.id).first();
    if (!klaim) {
      return res.status(404).json({
        status:   status.NOT_FOUND,
        message:  "Klaim BPJS tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    // Validasi transisi status
    const allowedNext = VALID_TRANSITIONS[klaim.status_klaim] || [];
    if (!allowedNext.includes(oPayload.status_klaim)) {
      return res.status(400).json({
        status:   status.GAGAL,
        message:  `Tidak dapat mengubah status dari '${klaim.status_klaim}' ke '${oPayload.status_klaim}'. Status yang diizinkan: [${allowedNext.join(", ") || "tidak ada"}]`,
        datetime: formatDateSystem(),
      });
    }

    const updateData = {
      status_klaim: oPayload.status_klaim,
    };
    if (oPayload.no_sep !== undefined) updateData.no_sep = oPayload.no_sep || klaim.no_sep;
    if (oPayload.nominal_klaim !== undefined) updateData.nominal_klaim = oPayload.nominal_klaim;

    await DB("trx_klaim_bpjs").where("id", oPayload.id).update(updateData);

    return res.status(200).json({
      status:   status.SUKSES,
      message:  `Status klaim berhasil diubah menjadi '${oPayload.status_klaim}'`,
      datetime: formatDateSystem(),
      data: {
        id:             oPayload.id,
        status_lama:    klaim.status_klaim,
        status_baru:    oPayload.status_klaim,
        kode_kunjungan: klaim.kode_kunjungan,
      },
    });
  } catch (error) {
    const oResult = {
      status:   status.BAD_REQUEST,
      message:  "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "keuangan/klaim_bpjs/klaim_bpjs_update_status.js", func: "update", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
