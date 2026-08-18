/**
 * @project Sistem Klinik
 * @file keuangan/klaim_bpjs/klaim_bpjs_create.js
 * @description POST: buat atau ajukan batch klaim BPJS dari kunjungan metode bpjs.
 *   Mengubah status_klaim dari 'draft' → 'diajukan'.
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
        // Jika kode_kunjungan_list dikirim, ajukan klaim spesifik
        // Jika tidak, ajukan semua yang berstatus 'draft'
        kode_kunjungan_list: Joi.array().items(Joi.string()).optional(),
        no_sep_map:          Joi.object().optional(), // { kode_kunjungan: no_sep }
      },
      {},
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

    const tanggalKlaim = new Date().toISOString().slice(0, 10);
    let diajukanList = [];
    let dibuatList   = [];

    await DB.transaction(async (trx) => {
      let targetKunjungan = [];

      if (oPayload.kode_kunjungan_list && oPayload.kode_kunjungan_list.length > 0) {
        // Mode: ajukan kunjungan spesifik
        targetKunjungan = oPayload.kode_kunjungan_list;
      } else {
        // Mode: ajukan semua draft yang ada
        const drafts = await trx("trx_klaim_bpjs")
          .where("status_klaim", "draft")
          .select("kode_kunjungan");
        targetKunjungan = drafts.map((d) => d.kode_kunjungan);
      }

      for (const kodeKunjungan of targetKunjungan) {
        const noSep = oPayload.no_sep_map?.[kodeKunjungan] || null;

        const existing = await trx("trx_klaim_bpjs")
          .where("kode_kunjungan", kodeKunjungan)
          .first();

        if (existing) {
          if (existing.status_klaim === "draft") {
            // Update draft → diajukan
            await trx("trx_klaim_bpjs")
              .where("kode_kunjungan", kodeKunjungan)
              .update({
                status_klaim:  "diajukan",
                no_sep:        noSep || existing.no_sep,
                tanggal_klaim: tanggalKlaim,
              });
            diajukanList.push(kodeKunjungan);
          }
          // skip jika sudah diajukan/diverifikasi/dst
        } else {
          // Cek tagihan untuk dapatkan nominal
          const tagihan = await trx("trx_tagihan")
            .where("kode_kunjungan", kodeKunjungan)
            .first();

          await trx("trx_klaim_bpjs").insert({
            id:             generateId("BPJ"),
            kode_kunjungan: kodeKunjungan,
            no_sep:         noSep,
            status_klaim:   "diajukan",
            nominal_klaim:  tagihan?.total_tagihan || 0,
            tanggal_klaim:  tanggalKlaim,
          });
          dibuatList.push(kodeKunjungan);
        }
      }
    });

    const totalDiproses = diajukanList.length + dibuatList.length;

    return res.status(200).json({
      status:   status.SUKSES,
      message:  `${totalDiproses} klaim BPJS berhasil diajukan`,
      datetime: formatDateSystem(),
      data: {
        diajukan:         diajukanList,
        dibuat_dan_diajukan: dibuatList,
        total:            totalDiproses,
      },
    });
  } catch (error) {
    const oResult = {
      status:   status.BAD_REQUEST,
      message:  "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "keuangan/klaim_bpjs/klaim_bpjs_create.js", func: "create", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
