/**
 * @project Sistem Klinik
 * @file pelayanan_medis/layanan_medis_data.js
 * @description Endpoint list layanan medis by kode_kunjungan
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
    if (!kodeKunj) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "kode_kunjungan wajib diisi",
        datetime: formatDateSystem(),
      });
    }

    const vaData = await DB("trx_layanan_medis")
      .where("kode_kunjungan", kodeKunj)
      .orderBy("created_at", "asc");

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data layanan medis berhasil diambil",
      datetime: formatDateSystem(),
      data: vaData,
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "pelayanan_medis/layanan_medis_data.js", func: "data", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
