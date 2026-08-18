/**
 * @project Sistem Klinik
 * @file pelayanan_medis/resep_data.js
 * @description Endpoint list resep + detail + info obat by kode_kunjungan. Juga list semua obat untuk dropdown.
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
    let vaResep = [];
    if (kodeKunj) {
      vaResep = await DB("trx_resep as r")
        .leftJoin("trx_resep_detail as rd", "r.kode_resep", "rd.kode_resep")
        .leftJoin("mst_obat as mo",         "rd.kode_obat", "mo.kode_obat")
        .select(
          "r.id as resep_id", "r.kode_resep", "r.tanggal_resep",
          "r.catatan", "r.status_dispensing",
          "rd.id as detail_id", "rd.kode_obat",
          "mo.nama_obat", "mo.satuan", "mo.harga_jual",
          "rd.dosis", "rd.jumlah", "rd.aturan_pakai"
        )
        .where("r.kode_kunjungan", kodeKunj)
        .orderBy("r.tanggal_resep", "asc");
    }

    // Dropdown obat
    const vaObat = await DB("mst_obat")
      .select("kode_obat", "nama_obat", "satuan", "harga_jual")
      .orderBy("nama_obat", "asc");

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data resep berhasil diambil",
      datetime: formatDateSystem(),
      data: vaResep,
      obat_options: vaObat,
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "pelayanan_medis/resep_data.js", func: "data", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
