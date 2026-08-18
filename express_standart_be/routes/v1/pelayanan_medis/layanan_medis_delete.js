/**
 * @project Sistem Klinik
 * @file pelayanan_medis/layanan_medis_delete.js
 * @description Endpoint hapus layanan medis dari trx_detail_tagihan & recalculate total_tagihan
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
        message: "id layanan wajib diisi",
        datetime: formatDateSystem(),
      });
    }

    const existing = await DB("trx_detail_tagihan").where("id", oPayload.id).first();
    if (!existing) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Layanan medis tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    await DB.transaction(async (trx) => {
      await trx("trx_detail_tagihan").where("id", oPayload.id).delete();

      // Recalculate total_tagihan
      const sumRes = await trx("trx_detail_tagihan")
        .where("kode_tagihan", existing.kode_tagihan)
        .sum("subtotal as total")
        .first();

      const newTotal = parseFloat(sumRes?.total || 0);

      await trx("trx_tagihan")
        .where("kode_tagihan", existing.kode_tagihan)
        .update({ total_tagihan: newTotal });
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Layanan medis berhasil dihapus",
      datetime: formatDateSystem(),
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "pelayanan_medis/layanan_medis_delete.js", func: "delete", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
