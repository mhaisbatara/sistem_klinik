/**
 * @project Sistem Klinik
 * @file kasir/tagihan/tagihan_detail.js
 * @description POST: detail lengkap satu tagihan beserta rincian item (trx_detail_tagihan).
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

    // Ambil tagihan utama
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
        "k.tanggal_kunjungan", "k.jam_masuk", "k.jam_selesai", "k.keluhan_awal",
        "pol.nama_poli",
        "d.nama_dokter", "d.spesialisasi",
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

    // Ambil detail item
    const detailItems = await DB("trx_detail_tagihan")
      .where("kode_tagihan", oPayload.kode_tagihan)
      .orderBy("jenis_item");

    // Ambil riwayat pembayaran
    const pembayaranList = await DB("trx_pembayaran")
      .where("kode_tagihan", oPayload.kode_tagihan)
      .orderBy("tanggal_bayar", "asc");

    const totalDibayar = pembayaranList.reduce(
      (sum, p) => sum + parseFloat(p.jumlah_bayar || 0),
      0
    );
    const sisaTagihan = parseFloat(tagihan.total_tagihan || 0) - totalDibayar;

    return res.status(200).json({
      status:   status.SUKSES,
      message:  "Detail tagihan berhasil diambil",
      datetime: formatDateSystem(),
      data: {
        tagihan,
        detail_items:   detailItems,
        pembayaran:     pembayaranList,
        total_dibayar:  totalDibayar,
        sisa_tagihan:   sisaTagihan,
      },
    });
  } catch (error) {
    const oResult = {
      status:   status.BAD_REQUEST,
      message:  "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "kasir/tagihan/tagihan_detail.js", func: "detail", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
