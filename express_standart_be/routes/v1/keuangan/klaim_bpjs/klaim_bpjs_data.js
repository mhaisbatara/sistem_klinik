/**
 * @project Sistem Klinik
 * @file keuangan/klaim_bpjs/klaim_bpjs_data.js
 * @description POST: list trx_klaim_bpjs dengan filter status_klaim & pagination.
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

  const statusKlaim    = oPayload.status_klaim    || "";
  const keyword        = oPayload.keyword         || "";
  const tanggalMulai   = oPayload.tanggal_mulai   || "";
  const tanggalSelesai = oPayload.tanggal_selesai || "";
  const sortField      = oPayload.sortField       || "kb.tanggal_klaim";
  const sortOrder      = oPayload.sortOrder       || "desc";
  const hasPagination  = oPayload.page !== undefined || oPayload.perPage !== undefined;

  try {
    const baseQuery = DB("trx_klaim_bpjs as kb")
      .leftJoin("trx_kunjungan as k",  "kb.kode_kunjungan", "k.kode_kunjungan")
      .leftJoin("mst_pasien as p",     "k.no_rm",           "p.no_rm")
      .leftJoin("trx_tagihan as t",    "k.kode_kunjungan",  "t.kode_kunjungan")
      .modify((qb) => {
        if (statusKlaim)    qb.where("kb.status_klaim", statusKlaim);
        if (tanggalMulai)   qb.where("kb.tanggal_klaim", ">=", tanggalMulai);
        if (tanggalSelesai) qb.where("kb.tanggal_klaim", "<=", tanggalSelesai);
        if (keyword) {
          const like = `%${keyword}%`;
          qb.where(function () {
            this.whereILike("p.nama_pasien",     like)
              .orWhereILike("kb.no_sep",         like)
              .orWhereILike("kb.kode_kunjungan", like)
              .orWhereILike("k.no_rm",           like);
          });
        }
      });

    const selectFields = [
      "kb.*",
      "p.nama_pasien",
      "p.nik",
      "k.no_rm",
      "k.tanggal_kunjungan",
      "t.kode_tagihan",
      "t.total_tagihan",
    ];

    let vaData    = [];
    let totalData = 0;

    if (hasPagination) {
      const page    = parseInt(oPayload.page)    || 1;
      const perPage = parseInt(oPayload.perPage) || 10;
      const offset  = (page - 1) * perPage;

      const countResult = await baseQuery.clone().count("kb.id as total").first();
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
      message:    "Data klaim BPJS berhasil diambil",
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
    Logging(error, { file: "keuangan/klaim_bpjs/klaim_bpjs_data.js", func: "data", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
