/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file antrian_data.js
 * @description Endpoint untuk me-list data antrian poli
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-16
 * @version 1.0.0
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

  const keyword        = oPayload.keyword || "";
  const kodePoli       = oPayload.kode_poli || "";
  const statusPanggil  = oPayload.status_panggil || "";
  const tanggal        = oPayload.tanggal || "";
  const sortField      = oPayload.sortField || "a.no_antrian";
  const sortOrder      = oPayload.sortOrder || "asc";
  const hasPagination  = oPayload.page !== undefined || oPayload.perPage !== undefined;

  try {
    const baseQuery = DB("trx_antrian as a")
      .join("mst_pasien as p", "a.no_rm", "p.no_rm")
      .leftJoin("mst_poli as pol", "a.kode_poli", "pol.kode_poli")
      .leftJoin("mst_penjamin as pj", "a.kode_penjamin", "pj.kode_penjamin")
      .leftJoin("mst_dokter as d", "a.kode_dokter", "d.id")
      .modify((qb) => {
        if (kodePoli) {
          qb.where("a.kode_poli", kodePoli);
        }
        if (statusPanggil) {
          qb.where("a.status_panggil", statusPanggil);
        }
        if (tanggal) {
          qb.where("a.tanggal", tanggal);
        }
        if (keyword) {
          const lower = `%${keyword}%`;
          qb.where(function () {
            this.whereILike("p.nama_pasien", lower)
              .orWhereILike("p.no_rm", lower)
              .orWhereILike("p.nik", lower)
              .orWhereILike("a.no_antrian", lower)
              .orWhereILike("a.id", lower);
          });
        }
      });

    const selectFields = [
      "a.id",
      "a.no_antrian",
      "a.no_rm",
      "a.kode_poli",
      "pol.nama_poli",
      "a.kode_penjamin",
      "pj.nama_penjamin",
      "a.kode_dokter",
      "d.nama_dokter",
      "d.spesialisasi",
      "a.tanggal",
      "a.status_panggil",
      "a.created_at",
      "p.nik",
      "p.nama_pasien",
      "p.jenis_kelamin",
      "p.tanggal_lahir",
      "p.no_hp",
      "p.email",
    ];

    let totalData = 0;
    let vaData = [];

    if (hasPagination) {
      const page    = parseInt(oPayload.page)    || 1;
      const perPage = parseInt(oPayload.perPage) || 10;
      const offset  = (page - 1) * perPage;

      const countResult = await baseQuery.clone().count("a.id as total").first();
      totalData = parseInt(countResult.total || 0);

      vaData = await baseQuery
        .clone()
        .select(selectFields)
        .orderBy(sortField, sortOrder)
        .limit(perPage)
        .offset(offset);
    } else {
      vaData = await baseQuery
        .clone()
        .select(selectFields)
        .orderBy(sortField, sortOrder);
      totalData = vaData.length;
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data antrian poli berhasil diambil",
      datetime: formatDateSystem(),
      data: vaData,
      total_data: totalData,
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };

    Logging(error, {
      file: "/antrian/antrian_data.js",
      func: "data",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
