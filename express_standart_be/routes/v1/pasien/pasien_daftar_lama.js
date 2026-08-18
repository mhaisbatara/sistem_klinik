/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file pasien_daftar_lama.js
 * @description Endpoint untuk mendaftarkan kunjungan baru pasien lama (sudah punya No. RM)
 *              Sistem otomatis generate trx_antrian (antrian poli) PER POLI PER HARI saat submit.
 *              Jika kode_antrian_awal dikirim, status antrian awal diubah menjadi 'selesai'.
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-16
 * @lastModified Fadil (2026-08-16)
 * @version 1.2.0
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
import {
  getLastKodeRegister,
  setLastKodeRegister,
} from "../components/tools/getter_setter.js";

const router = express.Router();

/**
 * Generate ID & no_antrian trx_antrian: PER POLI PER HARI dengan ROW LOCK (.forUpdate())
 */
async function generateTrxAntrianPoli(trx, kodePoli) {
  const today = new Date();
  const yy = String(today.getFullYear()).slice(2);
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yy}${mm}${dd}`;
  const todayFull = `${today.getFullYear()}-${mm}-${dd}`;

  // Query MAX no_antrian khusus untuk kode_poli & tanggal hari ini
  // .forUpdate() mencegah race condition dari submit bersamaan
  const result = await trx("trx_antrian")
    .where({ kode_poli: kodePoli, tanggal: todayFull })
    .select(trx.raw("MAX(CAST(no_antrian AS UNSIGNED)) as max_no"))
    .forUpdate()
    .first();

  const maxVal = result?.max_no || 0;
  const nextNoInt = parseInt(maxVal || 0) + 1;
  const nextNo = String(nextNoInt).padStart(3, "0");

  const cleanPoliCode = String(kodePoli).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const poliTag = cleanPoliCode.slice(0, 8);
  const trxId = `TRX${dateStr}${poliTag}${nextNo}`;

  return {
    id:         trxId,
    no_antrian: nextNo,
    tanggal:    todayFull,
  };
}

router.post("/", async (req, res) => {
  const { body } = req;
  const oPayload = body;
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
        no_rm:              Joi.string().required().label("No. Rekam Medis"),
        kode_poli:          Joi.string().max(20).required().label("Tujuan Poli"),
        kode_antrian_awal:  Joi.string().max(20).allow("", null).optional().label("Kode Antrian Awal"),
        kode_penjamin:      Joi.string().max(20).allow("", null).optional().label("Penjamin"),
        kode_dokter:        Joi.string().max(20).allow("", null).optional().label("Dokter Tujuan"),
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

    // Ambil biodata terbaru dari no_rm
    const biodataLama = await DB("mst_pasien")
      .where("no_rm", oPayload.no_rm)
      .orderBy("created_at", "desc")
      .first();

    if (!biodataLama) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: `No. Rekam Medis ${oPayload.no_rm} tidak ditemukan`,
        datetime: formatDateSystem(),
      });
    }

    let trxAntrian = {};
    let namaPoli = "";

    await DB.transaction(async (trx) => {
      // Ambil nama poli untuk response
      const poliData = await trx("mst_poli").where("kode_poli", oPayload.kode_poli).first();
      namaPoli = poliData?.nama_poli || oPayload.kode_poli;

      trxAntrian = await generateTrxAntrianPoli(trx, oPayload.kode_poli);

      // Insert antrian poli & kunjungan baru (trx_antrian)
      const oTrxAntrian = {
        id:             trxAntrian.id,
        no_antrian:     trxAntrian.no_antrian,
        no_rm:          biodataLama.no_rm,
        kode_poli:      oPayload.kode_poli,
        kode_penjamin:  oPayload.kode_penjamin || "",
        kode_dokter:    oPayload.kode_dokter || null,
        tanggal:        trxAntrian.tanggal,
        status_panggil: "menunggu",
        created_at:     formatDateSystem(),
      };
      await trx("trx_antrian").insert(oTrxAntrian);

      // Jika kode_antrian_awal dikirim, update status mst_antrian_awal menjadi 'selesai'
      if (oPayload.kode_antrian_awal) {
        await trx("mst_antrian_awal")
          .where("kode_antrian", oPayload.kode_antrian_awal)
          .update({
            status: "selesai",
            updated_at: formatDateSystem(),
          });
      }

      await ChangesLog(
        {
          description:   `Kunjungan Baru Pasien Lama - ${biodataLama.nama_pasien} (${biodataLama.no_rm})`,
          tableName:     "trx_antrian",
          referenceCode: trxAntrian.id,
          action:        "CREATE",
          dataBefore:    null,
          dataAfter:     oTrxAntrian,
          user:          username,
          tz:            oPayload.tz || "UTC",
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Kunjungan baru berhasil didaftarkan",
      datetime: formatDateSystem(),
      data: {
        id:           trxAntrian.id,
        no_rm:        biodataLama.no_rm,
        nama_pasien:  biodataLama.nama_pasien,
        no_antrian:   trxAntrian.no_antrian,
        kode_antrian: trxAntrian.id,
        nama_poli:    namaPoli,
      },
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };

    Logging(error, {
      file: "/pasien/pasien_daftar_lama.js",
      func: "daftar_lama",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
