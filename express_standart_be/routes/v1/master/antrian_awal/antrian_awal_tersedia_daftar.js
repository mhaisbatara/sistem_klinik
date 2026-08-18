/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file antrian_awal_tersedia_daftar.js
 * @description Endpoint untuk mendapatkan daftar antrian awal yang sedang dipanggil ke meja resepsionis (status: dipanggil)
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-16
 * @lastModified Fadil (2026-08-16)
 * @version 1.1.0
 */

import express from "express";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;
  const username = req?.auth?.username || "";

  try {
    // Antrian awal yang statusnya 'dipanggil' (sedang dipanggil ke loket resepsionis)
    const vaData = await DB("mst_antrian_awal")
      .where("status", "dipanggil")
      .select("kode_antrian", "no_antrian", "status")
      .orderBy("no_antrian", "asc");

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data ditemukan",
      datetime: formatDateSystem(),
      data: vaData,
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };

    Logging(error, {
      file: "/master/antrian_awal/antrian_awal_tersedia_daftar.js",
      func: "get",
      request: body,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
