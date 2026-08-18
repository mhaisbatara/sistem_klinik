/**
 * @project Sistem Klinik
 * @file pelayanan_medis/permintaan_lab_data.js
 * @description List permintaan lab by kunjungan dari trx_permintaan_lab
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
    let vaLab = [];
    if (kodeKunj) {
      vaLab = await DB("trx_permintaan_lab")
        .select(
          "id",
          "kode_permintaan",
          "kode_kunjungan",
          "no_sip",
          "jenis_pemeriksaan",
          "tanggal_permintaan",
          "status"
        )
        .where("kode_kunjungan", kodeKunj)
        .orderBy("tanggal_permintaan", "asc");
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data permintaan lab berhasil diambil",
      datetime: formatDateSystem(),
      data: vaLab,
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
