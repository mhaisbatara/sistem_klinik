/**
 * @project Sistem Klinik
 * @file kasir/pembayaran/pembayaran_data.js
 * @description POST: list riwayat trx_pembayaran dengan filter & pagination.
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

  const keyword          = oPayload.keyword           || "";
  const metodePembayaran = oPayload.metode_pembayaran || "";
  const tanggalBayar     = oPayload.tanggal_bayar     || "";
  const tanggalMulai     = oPayload.tanggal_mulai     || "";
  const tanggalSelesai   = oPayload.tanggal_selesai   || "";
  const emailKasir       = oPayload.email_kasir       || "";
  const sortField        = oPayload.sortField         || "pb.tanggal_bayar";
  const sortOrder        = oPayload.sortOrder         || "desc";
  const hasPagination    = oPayload.page !== undefined || oPayload.perPage !== undefined;

  try {
    const baseQuery = DB("trx_pembayaran as pb")
      .leftJoin("trx_tagihan as t",   "pb.kode_tagihan",     "t.kode_tagihan")
      .leftJoin("mst_pasien as p",    "t.no_rm",             "p.no_rm")
      .leftJoin("mst_penjamin as pj", "t.kode_penjamin",     "pj.kode_penjamin")
      .modify((qb) => {
        if (metodePembayaran) qb.where("pb.metode_pembayaran", metodePembayaran);
        if (tanggalBayar)     qb.where("pb.tanggal_bayar", tanggalBayar);
        if (tanggalMulai)     qb.where("pb.tanggal_bayar", ">=", tanggalMulai);
        if (tanggalSelesai)   qb.where("pb.tanggal_bayar", "<=", tanggalSelesai);
        if (emailKasir)       qb.where("pb.email_kasir", emailKasir);
        if (keyword) {
          const like = `%${keyword}%`;
          qb.where(function () {
            this.whereILike("p.nama_pasien",  like)
              .orWhereILike("t.kode_tagihan", like)
              .orWhereILike("t.no_rm",        like);
          });
        }
      });

    const selectFields = [
      "pb.id",
      "pb.kode_tagihan",
      "pb.metode_pembayaran",
      "pb.jumlah_bayar",
      "pb.tanggal_bayar",
      "pb.email_kasir",
      "t.no_rm",
      "t.total_tagihan",
      "t.status_pembayaran",
      "t.kode_penjamin",
      "pj.nama_penjamin",
      "p.nama_pasien",
      "p.nik",
    ];

    let vaData    = [];
    let totalData = 0;
    let totalNominal = 0;

    if (hasPagination) {
      const page    = parseInt(oPayload.page)    || 1;
      const perPage = parseInt(oPayload.perPage) || 10;
      const offset  = (page - 1) * perPage;

      const countResult = await baseQuery.clone().count("pb.id as total").first();
      totalData = parseInt(countResult?.total || 0);

      // Hitung total nominal untuk halaman (tutup shift)
      const sumResult = await baseQuery.clone().sum("pb.jumlah_bayar as total_nominal").first();
      totalNominal = parseFloat(sumResult?.total_nominal || 0);

      vaData = await baseQuery.clone()
        .select(selectFields)
        .orderBy(sortField, sortOrder)
        .limit(perPage)
        .offset(offset);
    } else {
      vaData = await baseQuery.clone()
        .select(selectFields)
        .orderBy(sortField, sortOrder);
      totalData = vaData.length;
      totalNominal = vaData.reduce((s, r) => s + parseFloat(r.jumlah_bayar || 0), 0);
    }

    // Rekap per metode (untuk tutup shift)
    const rekapMetode = await DB("trx_pembayaran as pb")
      .modify((qb) => {
        if (metodePembayaran) qb.where("pb.metode_pembayaran", metodePembayaran);
        if (tanggalBayar)     qb.where("pb.tanggal_bayar", tanggalBayar);
        if (tanggalMulai)     qb.where("pb.tanggal_bayar", ">=", tanggalMulai);
        if (tanggalSelesai)   qb.where("pb.tanggal_bayar", "<=", tanggalSelesai);
        if (emailKasir)       qb.where("pb.email_kasir", emailKasir);
      })
      .select("pb.metode_pembayaran")
      .sum("pb.jumlah_bayar as total")
      .count("pb.id as jumlah")
      .groupBy("pb.metode_pembayaran");

    return res.status(200).json({
      status:        status.SUKSES,
      message:       "Data pembayaran berhasil diambil",
      datetime:      formatDateSystem(),
      data:          vaData,
      total_data:    totalData,
      total_nominal: totalNominal,
      rekap_metode:  rekapMetode,
    });
  } catch (error) {
    const oResult = {
      status:   status.BAD_REQUEST,
      message:  "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "kasir/pembayaran/pembayaran_data.js", func: "data", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
