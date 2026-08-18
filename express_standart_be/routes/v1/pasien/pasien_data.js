/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file pasien_data.js
 * @description Endpoint untuk list data pendaftaran/kunjungan pasien
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-16
 *
 * @contributors
 * - Fadil <risqullah.s.fadhilah@gmail.com>
 *
 * @lastModified Fadil (2026-08-16)
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
  const oPayload = body;
  const username = req?.auth?.username || "";

  const keyword   = oPayload.keyword   || "";
  const sortField = oPayload.sortField || "a.created_at";
  const sortOrder = oPayload.sortOrder || "desc";
  const hasPagination = oPayload.page !== undefined || oPayload.perPage !== undefined;

  try {
    const baseQuery = DB("trx_antrian as a")
      .join("mst_pasien as p", "a.no_rm", "p.no_rm")
      .leftJoin("mst_dokter as d", "a.kode_dokter", "d.id")
      .leftJoin("mst_penjamin as pj", "a.kode_penjamin", "pj.kode_penjamin")
      .leftJoin("mst_poli as pol", "a.kode_poli", "pol.kode_poli")
      .modify((qb) => {
        if (keyword) {
          const lower = `%${keyword}%`;
          qb.where(function () {
            this.whereILike("p.nama_pasien", lower)
              .orWhereILike("p.no_rm", lower)
              .orWhereILike("p.nik", lower)
              .orWhereILike("p.no_hp", lower)
              .orWhereILike("a.id", lower);
          });
        }
        if (oPayload.tanggal_dari) {
          qb.where("a.created_at", ">=", oPayload.tanggal_dari);
        }
        if (oPayload.tanggal_sampai) {
          qb.where("a.created_at", "<=", oPayload.tanggal_sampai + " 23:59:59");
        }
      });

    const selectFields = [
      "a.id as id_trx",
      "p.id",
      "p.no_rm",
      "a.id as kode_antrian",
      "a.no_antrian",
      "a.kode_poli",
      "pol.nama_poli",
      "p.nik",
      "p.nama_pasien",
      "p.jenis_kelamin",
      "p.tanggal_lahir",
      "p.no_hp",
      "p.email",
      "a.kode_penjamin",
      "pj.nama_penjamin",
      "a.kode_dokter",
      "d.nama_dokter",
      "d.spesialisasi",
      "a.created_at",
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
      message: "Data ditemukan",
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
      file: "/pasien/pasien_data.js",
      func: "data",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
