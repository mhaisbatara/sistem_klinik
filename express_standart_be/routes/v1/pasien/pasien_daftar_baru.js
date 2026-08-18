/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file pasien_daftar_baru.js
 * @description Endpoint untuk mendaftarkan pasien baru (belum punya No. RM)
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

  // Format ID: TRX + YYMMDD + Poli + 3-digit
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
        kode_poli:          Joi.string().max(20).required().label("Tujuan Poli"),
        nik:                Joi.string().max(50).required().label("NIK"),
        nama_pasien:        Joi.string().max(100).required().label("Nama Pasien"),
        email:              Joi.string().email({ tlds: { allow: false } }).max(40).required().label("Email"),
        detail_alamat:      Joi.string().required().label("Detail Alamat"),
        kode_antrian_awal:  Joi.string().max(20).allow("", null).optional().label("Kode Antrian Awal"),
        // Optional fields
        nama_ibu_kandung:   Joi.string().max(100).allow("", null).optional().label("Nama Ibu Kandung"),
        tanggal_lahir:      Joi.string().allow("", null).optional().label("Tanggal Lahir"),
        tempat_lahir:       Joi.string().max(50).allow("", null).optional().label("Tempat Lahir"),
        jenis_kelamin:      Joi.string().valid("L", "P").allow(null).optional().label("Jenis Kelamin"),
        golongan_darah:     Joi.string().valid("A", "B", "AB", "O", "-").allow(null).optional().label("Golongan Darah"),
        agama:              Joi.string().max(20).allow("", null).optional().label("Agama"),
        status_perkawinan:  Joi.string().valid("Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati").allow(null).optional().label("Status Perkawinan"),
        pekerjaan:          Joi.string().max(50).allow("", null).optional().label("Pekerjaan"),
        pendidikan:         Joi.string().max(30).allow("", null).optional().label("Pendidikan"),
        kewarganegaraan:    Joi.string().max(30).allow("", null).optional().label("Kewarganegaraan"),
        provinsi:           Joi.string().max(50).allow("", null).optional().label("Provinsi"),
        kota_kabupaten:     Joi.string().max(50).allow("", null).optional().label("Kota/Kabupaten"),
        kecamatan:          Joi.string().max(50).allow("", null).optional().label("Kecamatan"),
        kelurahan:          Joi.string().max(50).allow("", null).optional().label("Kelurahan"),
        kode_pos:           Joi.string().max(10).allow("", null).optional().label("Kode Pos"),
        no_hp:              Joi.string().max(20).allow("", null).optional().label("No. HP"),
        kode_penjamin:      Joi.string().max(20).allow("", null).optional().label("Penjamin"),
        kode_dokter:        Joi.string().max(20).allow("", null).optional().label("Dokter Tujuan"),
      },
      {
        "string.base":  "{#label} harus berupa teks",
        "string.empty": "{#label} tidak boleh kosong",
        "string.max":   "{#label} maksimal {#limit} karakter",
        "string.email": "{#label} tidak valid",
        "any.only":     "{#label} tidak valid",
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

    // 1. Cek NIK sudah terdaftar di mst_pasien atau belum
    const existingPasien = await DB("mst_pasien").where("nik", oPayload.nik).first();
    if (existingPasien) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "NIK sudah terdaftar sebagai pasien lama, gunakan menu Pasien Lama",
        datetime: formatDateSystem(),
      });
    }

    let cIdReg = "";
    let cNoRm  = "";
    let trxAntrian = {};
    let namaPoli = "";

    await DB.transaction(async (trx) => {
      // Ambil nama poli untuk response
      const poliData = await trx("mst_poli").where("kode_poli", oPayload.kode_poli).first();
      namaPoli = poliData?.nama_poli || oPayload.kode_poli;

      cIdReg     = await getLastKodeRegister("REG", 6, true, trx);
      cNoRm      = await getLastKodeRegister("RM",  6, true, trx);

      // Generate antrian poli PER POLI PER HARI (dengan row lock .forUpdate())
      trxAntrian = await generateTrxAntrianPoli(trx, oPayload.kode_poli);

      // Insert antrian poli (trx_antrian)
      const oTrxAntrian = {
        id:             trxAntrian.id,
        no_antrian:     trxAntrian.no_antrian,
        no_rm:          cNoRm,
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

      // Insert master biodata pasien (hanya kolom biodata, TANPA data kunjungan)
      const oData = {
        id:                cIdReg,
        no_rm:             cNoRm,
        nik:               oPayload.nik,
        nama_pasien:       oPayload.nama_pasien,
        email:             oPayload.email,
        detail_alamat:     oPayload.detail_alamat,
        nama_ibu_kandung:  oPayload.nama_ibu_kandung  || null,
        tanggal_lahir:     oPayload.tanggal_lahir     || null,
        tempat_lahir:      oPayload.tempat_lahir      || null,
        jenis_kelamin:     oPayload.jenis_kelamin     || null,
        golongan_darah:    oPayload.golongan_darah    || null,
        agama:             oPayload.agama             || null,
        status_perkawinan: oPayload.status_perkawinan || null,
        pekerjaan:         oPayload.pekerjaan         || null,
        pendidikan:        oPayload.pendidikan        || null,
        kewarganegaraan:   oPayload.kewarganegaraan   || "WNI",
        provinsi:          oPayload.provinsi          || null,
        kota_kabupaten:    oPayload.kota_kabupaten    || null,
        kecamatan:         oPayload.kecamatan         || null,
        kelurahan:         oPayload.kelurahan         || null,
        kode_pos:          oPayload.kode_pos          || null,
        no_hp:             oPayload.no_hp             || null,
        created_at:        formatDateSystem(),
      };

      await trx("mst_pasien").insert(oData);
      await setLastKodeRegister("REG", trx);
      await setLastKodeRegister("RM",  trx);

      await ChangesLog(
        {
          description:   `Pendaftaran Pasien Baru - ${oPayload.nama_pasien}`,
          tableName:     "mst_pasien",
          referenceCode: cIdReg,
          action:        "CREATE",
          dataBefore:    null,
          dataAfter:     oData,
          user:          username,
          tz:            oPayload.tz || "UTC",
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Pasien baru berhasil didaftarkan",
      datetime: formatDateSystem(),
      data: {
        id:           cIdReg,
        no_rm:        cNoRm,
        nama_pasien:  oPayload.nama_pasien,
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
      file: "/pasien/pasien_daftar_baru.js",
      func: "daftar_baru",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
