/**
 * @project Sistem Klinik
 * @file keuangan/laporan/laporan_laba_rugi.js
 * @description POST: breakdown pendapatan vs pengeluaran per kategori pada periode tertentu.
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

  try {
    const filter = (qb) => {
      if (tanggalMulai)   qb.where("tanggal", ">=", tanggalMulai);
      if (tanggalSelesai) qb.where("tanggal", "<=", tanggalSelesai);
    };

    // Pendapatan per kategori
    const pendapatan = await DB("trx_buku_kas")
      .modify(filter)
      .where("jenis", "masuk")
      .select("kategori")
      .sum("jumlah as total")
      .count("id as jumlah_transaksi")
      .groupBy("kategori")
      .orderBy("total", "desc");

    // Pengeluaran per kategori
    const pengeluaran = await DB("trx_buku_kas")
      .modify(filter)
      .where("jenis", "keluar")
      .select("kategori")
      .sum("jumlah as total")
      .count("id as jumlah_transaksi")
      .groupBy("kategori")
      .orderBy("total", "desc");

    const totalPendapatan = pendapatan.reduce(
      (s, r) => s + parseFloat(r.total || 0), 0
    );
    const totalPengeluaran = pengeluaran.reduce(
      (s, r) => s + parseFloat(r.total || 0), 0
    );
    const labaRugi = totalPendapatan - totalPengeluaran;

    // Trend bulanan (ringkasan per bulan)
    const trendBulanan = await DB("trx_buku_kas")
      .modify(filter)
      .select(
        DB.raw("DATE_FORMAT(tanggal, '%Y-%m') as bulan"),
        DB.raw("SUM(CASE WHEN jenis = 'masuk'  THEN jumlah ELSE 0 END) as pendapatan"),
        DB.raw("SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END) as pengeluaran"),
        DB.raw(
          "SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END) - SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END) as laba_rugi"
        )
      )
      .groupByRaw("DATE_FORMAT(tanggal, '%Y-%m')")
      .orderByRaw("DATE_FORMAT(tanggal, '%Y-%m') ASC");

    return res.status(200).json({
      status:   status.SUKSES,
      message:  "Laporan laba-rugi berhasil diambil",
      datetime: formatDateSystem(),
      data: {
        summary: {
          total_pendapatan:  totalPendapatan,
          total_pengeluaran: totalPengeluaran,
          laba_rugi:         labaRugi,
          status_laba_rugi:  labaRugi >= 0 ? "laba" : "rugi",
        },
        pendapatan,
        pengeluaran,
        trend_bulanan: trendBulanan,
        filter: { tanggal_mulai: tanggalMulai, tanggal_selesai: tanggalSelesai },
      },
    });
  } catch (error) {
    const oResult = {
      status:   status.BAD_REQUEST,
      message:  "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "keuangan/laporan/laporan_laba_rugi.js", func: "data", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
