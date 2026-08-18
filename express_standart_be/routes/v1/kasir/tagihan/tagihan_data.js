/**
 * @project Sistem Klinik
 * @file kasir/tagihan/tagihan_data.js
 * @description POST: list trx_tagihan dengan filter, pagination, dan sorting.
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
  const statusPembayaran = oPayload.status_pembayaran || "";
  const tanggal          = oPayload.tanggal           || "";
  const tanggalMulai     = oPayload.tanggal_mulai     || "";
  const tanggalSelesai   = oPayload.tanggal_selesai   || "";
  const noRm             = oPayload.no_rm             || "";
  const sortField        = oPayload.sortField         || "t.tanggal";
  const sortOrder        = oPayload.sortOrder         || "desc";
  const hasPagination    = oPayload.page !== undefined || oPayload.perPage !== undefined;

  try {
    const baseQuery = DB("trx_tagihan as t")
      .leftJoin("trx_kunjungan as k",  "t.kode_kunjungan", "k.kode_kunjungan")
      .leftJoin("mst_pasien as p",     "t.no_rm",          "p.no_rm")
      .leftJoin("mst_dokter as d",     "k.no_sip",         "d.no_sip")
      .leftJoin("mst_poli as pol",     "k.kode_poli",      "pol.kode_poli")
      .leftJoin("mst_penjamin as pj",  "t.kode_penjamin",  "pj.kode_penjamin")
      .modify((qb) => {
        if (statusPembayaran) qb.where("t.status_pembayaran", statusPembayaran);
        if (tanggal)          qb.where("t.tanggal", tanggal);
        if (tanggalMulai)     qb.where("t.tanggal", ">=", tanggalMulai);
        if (tanggalSelesai)   qb.where("t.tanggal", "<=", tanggalSelesai);
        if (noRm)             qb.where("t.no_rm", noRm);
        if (keyword) {
          const like = `%${keyword}%`;
          qb.where(function () {
            this.whereILike("p.nama_pasien",    like)
              .orWhereILike("t.no_rm",          like)
              .orWhereILike("t.kode_tagihan",   like)
              .orWhereILike("k.kode_kunjungan", like);
          });
        }
      });

    const selectFields = [
      "t.kode_tagihan",
      "t.kode_kunjungan",
      "t.no_rm",
      "t.kode_penjamin",
      "pj.nama_penjamin",
      "t.total_tagihan",
      "t.status_pembayaran",
      "t.tanggal",
      "p.nama_pasien",
      "p.nik",
      "p.no_hp",
      "k.tanggal_kunjungan",
      "pol.nama_poli",
      "d.nama_dokter",
      // Akumulasi pembayaran
      DB.raw(`(
        SELECT COALESCE(SUM(pb.jumlah_bayar), 0)
        FROM trx_pembayaran pb
        WHERE pb.kode_tagihan = t.kode_tagihan
      ) as total_dibayar`),
    ];

    let vaData    = [];
    let totalData = 0;

    if (hasPagination) {
      const page    = parseInt(oPayload.page)    || 1;
      const perPage = parseInt(oPayload.perPage) || 10;
      const offset  = (page - 1) * perPage;

      const countResult = await baseQuery.clone().count("t.kode_tagihan as total").first();
      totalData = parseInt(countResult?.total || 0);

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
    }

    return res.status(200).json({
      status:     status.SUKSES,
      message:    "Data tagihan berhasil diambil",
      datetime:   formatDateSystem(),
      data:       vaData,
      total_data: totalData,
    });
  } catch (error) {
    const oResult = {
      status:   status.BAD_REQUEST,
      message:  "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "kasir/tagihan/tagihan_data.js", func: "data", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
