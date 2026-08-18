/**
 * @project Sistem Klinik
 * @file pelayanan_medis/permintaan_lab_delete.js
 * @description Endpoint hapus permintaan lab
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

  try {
    if (!oPayload.id) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "id permintaan lab wajib diisi",
        datetime: formatDateSystem(),
      });
    }

    const existing = await DB("trx_permintaan_lab").where("id", oPayload.id).first();
    if (!existing) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Permintaan lab tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    await DB("trx_permintaan_lab").where("id", oPayload.id).delete();

    return res.status(200).json({
      status: status.SUKSES,
      message: "Permintaan lab berhasil dihapus",
      datetime: formatDateSystem(),
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "pelayanan_medis/permintaan_lab_delete.js", func: "delete", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
