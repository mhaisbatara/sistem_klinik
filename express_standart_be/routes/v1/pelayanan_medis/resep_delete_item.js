/**
 * @project Sistem Klinik
 * @file pelayanan_medis/resep_delete_item.js
 * @description Endpoint hapus satu item detail resep
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
    if (!oPayload.detail_id) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "detail_id resep wajib diisi",
        datetime: formatDateSystem(),
      });
    }

    const existing = await DB("trx_resep_detail").where("id", oPayload.detail_id).first();
    if (!existing) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Item resep tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    await DB("trx_resep_detail").where("id", oPayload.detail_id).delete();

    // Jika tidak ada detail lagi, hapus resep header juga
    const countRemain = await DB("trx_resep_detail")
      .where("kode_resep", existing.kode_resep)
      .count("id as c")
      .first();

    if (parseInt(countRemain.c || 0) === 0) {
      await DB("trx_resep").where("kode_resep", existing.kode_resep).delete();
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: "Item resep berhasil dihapus",
      datetime: formatDateSystem(),
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "pelayanan_medis/resep_delete_item.js", func: "delete", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
