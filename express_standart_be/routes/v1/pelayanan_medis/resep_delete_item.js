/**
 * @project Sistem Klinik
 * @file pelayanan_medis/resep_delete_item.js
 * @description Endpoint hapus satu item detail resep & hapus dari trx_detail_tagihan serta recalculate total_tagihan
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

    // Ambil resep header & mst_obat info
    const oResep = await DB("trx_resep").where("kode_resep", existing.kode_resep).first();
    const oObat  = await DB("mst_obat").where("kode_obat", existing.kode_obat).first();

    await DB.transaction(async (trx) => {
      // 1. Hapus dari trx_resep_detail
      await trx("trx_resep_detail").where("id", oPayload.detail_id).delete();

      // 2. Jika tidak ada detail lagi, hapus resep header juga
      const countRemain = await trx("trx_resep_detail")
        .where("kode_resep", existing.kode_resep)
        .count("id as c")
        .first();

      if (parseInt(countRemain.c || 0) === 0) {
        await trx("trx_resep").where("kode_resep", existing.kode_resep).delete();
      }

      // 3. Hapus item obat dari trx_detail_tagihan & recalculate
      if (oResep && oObat) {
        const oTagihan = await trx("trx_tagihan")
          .where("kode_kunjungan", oResep.kode_kunjungan)
          .first();

        if (oTagihan) {
          // Hapus 1 row obat dari trx_detail_tagihan
          const dtlObat = await trx("trx_detail_tagihan")
            .where({
              kode_tagihan: oTagihan.kode_tagihan,
              jenis_item: "obat",
              nama_item: oObat.nama_obat,
            })
            .first();

          if (dtlObat) {
            await trx("trx_detail_tagihan").where("id", dtlObat.id).delete();

            // Recalculate total_tagihan
            const sumRes = await trx("trx_detail_tagihan")
              .where("kode_tagihan", oTagihan.kode_tagihan)
              .sum("subtotal as total")
              .first();

            const newTotal = parseFloat(sumRes?.total || 0);
            await trx("trx_tagihan")
              .where("kode_tagihan", oTagihan.kode_tagihan)
              .update({ total_tagihan: newTotal });
          }
        }
      }
    });

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
