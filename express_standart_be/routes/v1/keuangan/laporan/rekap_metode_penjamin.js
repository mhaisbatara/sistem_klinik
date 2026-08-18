/**
 * @project Sistem Klinik
 * @file keuangan/laporan/rekap_metode_penjamin.js
 * @description POST: breakdown trx_pembayaran per metode_pembayaran dan per penjamin.
 */

import express from "express";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;
  const oPayload = body || {};
  const username = req?.auth?.username || "";

  const tanggalMulai   = oPayload.tanggal_mulai   || "";
  const tanggalSelesai = oPayload.tanggal_selesai || "";
  const tanggal        = oPayload.tanggal         || "";

  try {
    const filter = (qb) => {
      if (tanggal)        qb.where("pb.tanggal_bayar", tanggal);
      if (tanggalMulai)   qb.where("pb.tanggal_bayar", ">=", tanggalMulai);
      if (tanggalSelesai) qb.where("pb.tanggal_bayar", "<=", tanggalSelesai);
    };

    // Rekap per metode_pembayaran
    const rekapMetode = await DB("trx_pembayaran as pb")
      .modify(filter)
      .select("pb.metode_pembayaran")
      .sum("pb.jumlah_bayar as total")
      .count("pb.id as jumlah_transaksi")
      .groupBy("pb.metode_pembayaran")
      .orderBy("total", "desc");

    // Rekap per penjamin
    const rekapPenjamin = await DB("trx_pembayaran as pb")
      .join("trx_tagihan as t",    "pb.kode_tagihan",  "t.kode_tagihan")
      .leftJoin("mst_penjamin as pj", "t.kode_penjamin", "pj.kode_penjamin")
      .modify(filter)
      .select(
        "t.kode_penjamin",
        "pj.nama_penjamin",
        "pj.jenis as jenis_penjamin"
      )
      .sum("pb.jumlah_bayar as total")
      .count("pb.id as jumlah_transaksi")
      .groupBy("t.kode_penjamin", "pj.nama_penjamin", "pj.jenis")
      .orderBy("total", "desc");

    // Grand total
    const grandTotal = await DB("trx_pembayaran as pb")
      .modify(filter)
      .sum("pb.jumlah_bayar as total")
      .count("pb.id as jumlah_transaksi")
      .first();

    return res.status(200).json({
      status:   status.SUKSES,
      message:  "Rekap metode & penjamin berhasil diambil",
      datetime: formatDateSystem(),
      data: {
        grand_total:    parseFloat(grandTotal?.total || 0),
        jumlah_transaksi: parseInt(grandTotal?.jumlah_transaksi || 0),
        rekap_metode:   rekapMetode,
        rekap_penjamin: rekapPenjamin,
        filter: { tanggal, tanggal_mulai: tanggalMulai, tanggal_selesai: tanggalSelesai },
      },
    });
  } catch (error) {
    const oResult = {
      status:   status.BAD_REQUEST,
      message:  "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "keuangan/laporan/rekap_metode_penjamin.js", func: "data", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
