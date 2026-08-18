/**
 * @project Sistem Klinik
 * @file pelayanan_medis/kunjungan_detail.js
 * @description Endpoint detail satu kunjungan: info pasien+dokter, layanan medis, lab, resep
 */

import express from "express";
import DB from "../../../core/config/knex.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { Logging } from "../components/tools/servertool.js";
import { status } from "../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;
  const oPayload  = body || {};
  const username  = req?.auth?.username || "";
  const kodeKunj  = oPayload.kode_kunjungan || "";

  try {
    if (!kodeKunj) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "kode_kunjungan wajib diisi",
        datetime: formatDateSystem(),
      });
    }

    // Info kunjungan + pasien + dokter + poli
    const oKunjungan = await DB("trx_kunjungan as k")
      .leftJoin("mst_pasien as p",   "k.no_rm",         "p.no_rm")
      .leftJoin("mst_dokter as d",   "k.no_sip",        "d.no_sip")
      .leftJoin("mst_poli as pol",   "k.kode_poli",     "pol.kode_poli")
      .leftJoin("mst_penjamin as pj","k.kode_penjamin", "pj.kode_penjamin")
      .select(
        "k.kode_kunjungan", "k.kode_antrian", "k.no_rm", "k.kode_poli",
        "pol.nama_poli", "k.no_sip", "d.nama_dokter", "d.spesialisasi",
        "k.kode_penjamin", "pj.nama_penjamin", "k.tanggal_kunjungan",
        "k.jam_masuk", "k.jam_selesai", "k.keluhan_awal", "k.status_kunjungan",
        "p.nik", "p.nama_pasien", "p.jenis_kelamin", "p.tanggal_lahir",
        "p.no_hp", "p.golongan_darah", "p.agama", "p.detail_alamat"
      )
      .where("k.kode_kunjungan", kodeKunj)
      .first();

    if (!oKunjungan) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Kunjungan tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    // Layanan medis
    const vaLayanan = await DB("trx_layanan_medis")
      .where("kode_kunjungan", kodeKunj)
      .orderBy("created_at", "asc");

    // Permintaan lab
    const vaLab = await DB("trx_permintaan_lab as pl")
      .leftJoin("mst_tarif_layanan as tl", "pl.kode_tarif", "tl.kode_tarif")
      .select(
        "pl.id", "pl.kode_permintaan", "pl.kode_kunjungan", "pl.no_sip",
        "pl.jenis_pemeriksaan", "pl.kode_tarif", "tl.tarif",
        "pl.tanggal_permintaan", "pl.status"
      )
      .where("pl.kode_kunjungan", kodeKunj)
      .orderBy("pl.tanggal_permintaan", "asc");

    // Resep + detail obat
    const vaResep = await DB("trx_resep as r")
      .leftJoin("trx_resep_detail as rd", "r.kode_resep", "rd.kode_resep")
      .leftJoin("mst_obat as mo",         "rd.kode_obat", "mo.kode_obat")
      .select(
        "r.id as resep_id", "r.kode_resep", "r.tanggal_resep", "r.catatan",
        "r.status_dispensing", "rd.id as detail_id", "rd.kode_obat",
        "mo.nama_obat", "mo.satuan", "mo.harga_jual",
        "rd.dosis", "rd.jumlah", "rd.aturan_pakai"
      )
      .where("r.kode_kunjungan", kodeKunj)
      .orderBy("r.tanggal_resep", "asc");

    // Pemeriksaan Vitals & SOAP
    const oPemeriksaan = await DB("trx_pemeriksaan")
      .where("kode_kunjungan", kodeKunj)
      .first();

    return res.status(200).json({
      status: status.SUKSES,
      message: "Detail kunjungan berhasil diambil",
      datetime: formatDateSystem(),
      data: {
        kunjungan: oKunjungan,
        pemeriksaan: oPemeriksaan || null,
        layanan_medis: vaLayanan,
        permintaan_lab: vaLab,
        resep: vaResep,
      },
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "pelayanan_medis/kunjungan_detail.js", func: "detail", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
