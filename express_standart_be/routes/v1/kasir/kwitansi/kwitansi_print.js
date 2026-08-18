/**
 * @project Sistem Klinik
 * @file kasir/kwitansi/kwitansi_print.js
 * @description POST: ambil data lengkap untuk cetak kwitansi pembayaran.
 *   Return JSON; FE handle render + window.print().
 */

import express from "express";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging, validatePayload } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;
  const oPayload = body || {};
  const username = req?.auth?.username || "";

  try {
    const cValidation = await validatePayload(
      {
        kode_tagihan: Joi.string().required().label("Kode Tagihan"),
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

    // Data tagihan utama
    const tagihan = await DB("trx_tagihan as t")
      .leftJoin("trx_kunjungan as k",  "t.kode_kunjungan", "k.kode_kunjungan")
      .leftJoin("mst_pasien as p",     "t.no_rm",          "p.no_rm")
      .leftJoin("mst_dokter as d",     "k.no_sip",         "d.no_sip")
      .leftJoin("mst_poli as pol",     "k.kode_poli",      "pol.kode_poli")
      .leftJoin("mst_penjamin as pj",  "t.kode_penjamin",  "pj.kode_penjamin")
      .where("t.kode_tagihan", oPayload.kode_tagihan)
      .select(
        "t.*",
        "p.nama_pasien", "p.nik", "p.tanggal_lahir", "p.jenis_kelamin", "p.no_hp", "p.detail_alamat",
        "k.tanggal_kunjungan", "k.kode_kunjungan",
        "pol.nama_poli",
        "d.nama_dokter",
        "pj.nama_penjamin", "pj.jenis as jenis_penjamin"
      )
      .first();

    if (!tagihan) {
      return res.status(404).json({
        status:   status.NOT_FOUND,
        message:  "Tagihan tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    // Detail item tagihan
    const detailItems = await DB("trx_detail_tagihan")
      .where("kode_tagihan", oPayload.kode_tagihan)
      .orderBy("jenis_item");

    // Semua transaksi pembayaran
    const pembayaranList = await DB("trx_pembayaran")
      .where("kode_tagihan", oPayload.kode_tagihan)
      .orderBy("tanggal_bayar", "asc");

    // Pilih pembayaran yang diminta (boleh filter per id pembayaran)
    const targetPembayaran = oPayload.pembayaran_id
      ? pembayaranList.find((p) => String(p.id) === String(oPayload.pembayaran_id))
      : pembayaranList[pembayaranList.length - 1]; // default: pembayaran terakhir

    const totalDibayar = pembayaranList.reduce(
      (s, p) => s + parseFloat(p.jumlah_bayar || 0), 0
    );

    // Konfigurasi klinik dari mst_config atau mst_setting
    let config = {};
    try {
      const configRows = await DB("mst_config").select("key", "value").catch(() => []);
      if (configRows.length > 0) {
        configRows.forEach(r => { config[r.key] = r.value; });
      } else {
        // Coba mst_setting jika mst_config tidak ada
        const settingRows = await DB("mst_setting").select("key", "value").catch(() => []);
        settingRows.forEach(r => { config[r.key] = r.value; });
      }
    } catch (_) {
      // Tabel config tidak ada — lanjutkan dengan nilai kosong
    }

    return res.status(200).json({
      status:   status.SUKSES,
      message:  "Data kwitansi berhasil diambil",
      datetime: formatDateSystem(),
      data: {
        klinik: {
          nama:     config.msNamaPerusahaan || "Klinik",
          alamat:   config.msAlamatPerusahaan || "",
          kota:     config.msKotaPerusahaan || "",
          telepon:  config.msTeleponPerusahaan || "",
          pimpinan: config.msNamaPimpinan || "",
          logo:     config.msLogoPerusahaan || "",
        },
        tagihan,
        detail_items:       detailItems,
        pembayaran:         targetPembayaran,
        semua_pembayaran:   pembayaranList,
        total_dibayar:      totalDibayar,
        sisa_tagihan:       parseFloat(tagihan.total_tagihan || 0) - totalDibayar,
        tanggal_cetak:      formatDateSystem(),
        cetak_oleh:         username,
      },
    });
  } catch (error) {
    const oResult = {
      status:   status.BAD_REQUEST,
      message:  "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "kasir/kwitansi/kwitansi_print.js", func: "print", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
