/**
 * @project Sistem Klinik
 * @file keuangan/buku_kas/buku_kas_data.js
 * @description POST: list trx_buku_kas dengan filter tanggal, jenis, dan pagination.
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

  const keyword        = oPayload.keyword       || "";
  const jenis          = oPayload.jenis         || ""; // masuk | keluar | ""
  const kategori       = oPayload.kategori      || "";
  const tanggalMulai   = oPayload.tanggal_mulai  || "";
  const tanggalSelesai = oPayload.tanggal_selesai || "";
  const tanggal        = oPayload.tanggal        || "";
  const sortField      = oPayload.sortField      || "bk.tanggal";
  const sortOrder      = oPayload.sortOrder      || "desc";
  const hasPagination  = oPayload.page !== undefined || oPayload.perPage !== undefined;

  try {
    const baseQuery = DB("trx_buku_kas as bk")
      .modify((qb) => {
        if (jenis)          qb.where("bk.jenis", jenis);
        if (kategori)       qb.where("bk.kategori", kategori);
        if (tanggal)        qb.where("bk.tanggal", tanggal);
        if (tanggalMulai)   qb.where("bk.tanggal", ">=", tanggalMulai);
        if (tanggalSelesai) qb.where("bk.tanggal", "<=", tanggalSelesai);
        if (keyword) {
          const like = `%${keyword}%`;
          qb.where(function () {
            this.whereILike("bk.keterangan", like)
              .orWhereILike("bk.kategori",   like)
              .orWhereILike("bk.email_user", like);
          });
        }
      });

    const selectFields = ["bk.*"];

    let vaData    = [];
    let totalData = 0;
    let totalMasuk  = 0;
    let totalKeluar = 0;

    // Hitung summary (tidak tergantung pagination)
    const summaryQuery = DB("trx_buku_kas as bk").modify((qb) => {
      if (jenis)          qb.where("bk.jenis", jenis);
      if (kategori)       qb.where("bk.kategori", kategori);
      if (tanggal)        qb.where("bk.tanggal", tanggal);
      if (tanggalMulai)   qb.where("bk.tanggal", ">=", tanggalMulai);
      if (tanggalSelesai) qb.where("bk.tanggal", "<=", tanggalSelesai);
    });

    const [masukSum, keluarSum] = await Promise.all([
      summaryQuery.clone().where("bk.jenis", "masuk").sum("bk.jumlah as total").first(),
      summaryQuery.clone().where("bk.jenis", "keluar").sum("bk.jumlah as total").first(),
    ]);
    totalMasuk  = parseFloat(masukSum?.total  || 0);
    totalKeluar = parseFloat(keluarSum?.total || 0);

    if (hasPagination) {
      const page    = parseInt(oPayload.page)    || 1;
      const perPage = parseInt(oPayload.perPage) || 10;
      const offset  = (page - 1) * perPage;

      const countResult = await baseQuery.clone().count("bk.id as total").first();
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
      status:        status.SUKSES,
      message:       "Data buku kas berhasil diambil",
      datetime:      formatDateSystem(),
      data:          vaData,
      total_data:    totalData,
      total_masuk:   totalMasuk,
      total_keluar:  totalKeluar,
      saldo_bersih:  totalMasuk - totalKeluar,
    });
  } catch (error) {
    const oResult = {
      status:   status.BAD_REQUEST,
      message:  "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "keuangan/buku_kas/buku_kas_data.js", func: "data", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
