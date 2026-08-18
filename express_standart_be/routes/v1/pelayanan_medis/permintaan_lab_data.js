/**
 * @project Sistem Klinik
 * @file pelayanan_medis/permintaan_lab_data.js
 * @description List permintaan lab by kunjungan + list master tarif lab
 */

import express from "express";
import DB from "../../../core/config/knex.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { Logging } from "../components/tools/servertool.js";
import { status } from "../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;
  const oPayload = body || {};
  const username = req?.auth?.username || "";
  const kodeKunj = oPayload.kode_kunjungan || "";

  try {
    // Permintaan lab untuk kunjungan ini
    let vaLab = [];
    if (kodeKunj) {
      vaLab = await DB("trx_permintaan_lab as pl")
        .leftJoin("mst_tarif_layanan as tl", "pl.kode_tarif", "tl.kode_tarif")
        .select(
          "pl.id", "pl.kode_permintaan", "pl.kode_kunjungan", "pl.no_sip",
          "pl.jenis_pemeriksaan", "pl.kode_tarif", "tl.tarif", "tl.nama_layanan as nama_tarif",
          "pl.tanggal_permintaan", "pl.status"
        )
        .where("pl.kode_kunjungan", kodeKunj)
        .orderBy("pl.tanggal_permintaan", "asc");
    }

    // Semua master tarif lab (untuk dropdown)
    const vaTarif = await DB("mst_tarif_layanan")
      .where("is_active", 1)
      .orderBy("nama_layanan", "asc");

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data permintaan lab berhasil diambil",
      datetime: formatDateSystem(),
      data: vaLab,
      tarif_options: vaTarif,
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "pelayanan_medis/permintaan_lab_data.js", func: "data", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
