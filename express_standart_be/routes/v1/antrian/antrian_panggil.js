/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file antrian_panggil.js
 * @description Endpoint untuk memproses panggilan antrian poli
 *              Aksi: dipanggil (panggil/panggil ulang), selesai, dilewati, menunggu (kembalikan ke antrian)
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

const ACTION_DESCRIPTIONS = {
  dipanggil: "Panggil / Panggil Ulang Pasien",
  selesai:   "Selesaikan Kunjungan Pasien",
  dilewati:  "Lewati Antrian Pasien",
  menunggu:  "Kembalikan Pasien ke Antrian Menunggu",
};

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
        id:   Joi.string().required().label("ID Antrian"),
        aksi: Joi.string()
          .valid("dipanggil", "selesai", "dilewati", "menunggu")
          .required()
          .label("Aksi Pemanggilan"),
      },
      {
        "string.base":  "{#label} harus berupa teks",
        "string.empty": "{#label} tidak boleh kosong",
        "any.only":     "{#label} tidak valid. Pilih: dipanggil / selesai / dilewati / menunggu",
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

    const aksi = oPayload.aksi;
    let updatedRecord = null;

    await DB.transaction(async (trx) => {
      const record = await trx("trx_antrian")
        .where("id", oPayload.id)
        .forUpdate()
        .first();

      if (!record) {
        const error = new Error(`Data antrian ${oPayload.id} tidak ditemukan`);
        error.statusCode = 404;
        throw error;
      }

      // Jika aksi = dipanggil, ubah antrian lain di poli & tanggal yang sama yang sedang 'dipanggil' menjadi 'dilewati' (jika ada)
      if (aksi === "dipanggil") {
        await trx("trx_antrian")
          .where({
            kode_poli: record.kode_poli,
            tanggal: record.tanggal,
            status_panggil: "dipanggil",
          })
          .whereNot("id", record.id)
          .update({
            status_panggil: "dilewati",
          });
      }

      await trx("trx_antrian")
        .where("id", oPayload.id)
        .update({
          status_panggil: aksi,
        });

      // --- SINKRONISASI KE trx_kunjungan ---
      const existingKunjungan = await trx("trx_kunjungan")
        .where("kode_antrian", record.id)
        .first();

      let targetStatusKunjungan = "menunggu";
      if (aksi === "dipanggil") targetStatusKunjungan = "diperiksa";
      else if (aksi === "selesai") targetStatusKunjungan = "selesai";
      else if (aksi === "dilewati") targetStatusKunjungan = "batal";
      else if (aksi === "menunggu") targetStatusKunjungan = "menunggu";

      if (!existingKunjungan && (aksi === "dipanggil" || aksi === "selesai")) {
        // Cari no_sip dokter dari mst_dokter jika kode_dokter diisi
        let dokterSip = null;
        if (record.kode_dokter) {
          const dokter = await trx("mst_dokter").where("id", record.kode_dokter).first();
          if (dokter) dokterSip = dokter.no_sip;
        }

        const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, "").slice(2);
        const countKunj = await trx("trx_kunjungan").count("id as c").first();
        const seqKunj   = String(parseInt(countKunj.c || 0) + 1).padStart(3, "0");
        const kunjId    = `IDK${dateTag}${seqKunj}`;
        const kodeKunj  = `KNJ${dateTag}${seqKunj}`;

        await trx("trx_kunjungan").insert({
          id: kunjId,
          kode_kunjungan: kodeKunj,
          kode_antrian: record.id,
          no_rm: record.no_rm,
          kode_poli: record.kode_poli,
          no_sip: dokterSip,
          kode_penjamin: record.kode_penjamin || null,
          tanggal_kunjungan: record.tanggal,
          jam_masuk: formatDateSystem(),
          jam_selesai: aksi === "selesai" ? formatDateSystem() : null,
          status_kunjungan: targetStatusKunjungan,
          created_at: formatDateSystem(),
        });
      } else if (existingKunjungan) {
        const updateData = { status_kunjungan: targetStatusKunjungan };
        if (aksi === "selesai") {
          updateData.jam_selesai = formatDateSystem();
        }
        await trx("trx_kunjungan")
          .where("id", existingKunjungan.id)
          .update(updateData);
      }

      // Join data pasien untuk detail response
      updatedRecord = await trx("trx_antrian as a")
        .join("mst_pasien as p", "a.no_rm", "p.no_rm")
        .leftJoin("mst_poli as pol", "a.kode_poli", "pol.kode_poli")
        .leftJoin("mst_dokter as d", "a.kode_dokter", "d.id")
        .select(
          "a.id",
          "a.no_antrian",
          "a.no_rm",
          "a.kode_poli",
          "pol.nama_poli",
          "a.kode_penjamin",
          "a.kode_dokter",
          "d.nama_dokter",
          "a.tanggal",
          "a.status_panggil",
          "p.nama_pasien",
          "p.nik"
        )
        .where("a.id", oPayload.id)
        .first();

      await ChangesLog(
        {
          description:   `${ACTION_DESCRIPTIONS[aksi]} - No. Antrian ${record.no_antrian} (${updatedRecord.nama_pasien})`,
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

    const messages = {
      dipanggil: `Nomor antrian ${updatedRecord.no_antrian} (${updatedRecord.nama_pasien}) dipanggil`,
      selesai:   `Nomor antrian ${updatedRecord.no_antrian} (${updatedRecord.nama_pasien}) telah selesai`,
      dilewati:  `Nomor antrian ${updatedRecord.no_antrian} (${updatedRecord.nama_pasien}) dilewati`,
      menunggu:  `Nomor antrian ${updatedRecord.no_antrian} (${updatedRecord.nama_pasien}) dikembalikan ke status menunggu`,
    };

    return res.status(200).json({
      status: status.SUKSES,
      message: messages[aksi],
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
      file: "/antrian/antrian_panggil.js",
      func: "panggil",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
