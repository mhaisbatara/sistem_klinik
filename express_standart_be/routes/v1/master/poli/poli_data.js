/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file poli_data.js
 * @description Endpoint untuk me-list data master poli (mst_poli)
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-16
 * @version 1.0.0
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

  const keyword       = oPayload.keyword || "";
  const sortField     = oPayload.sortField || "kode_poli";
  const sortOrder     = oPayload.sortOrder || "asc";
  const hasPagination = oPayload.page !== undefined || oPayload.perPage !== undefined;

  try {
    const baseQuery = DB("mst_poli").modify((qb) => {
      if (keyword) {
        const lower = `%${keyword}%`;
        qb.where(function () {
          this.whereILike("nama_poli", lower).orWhereILike("kode_poli", lower);
        });
      }
    });

    let totalData = 0;
    let vaData = [];

    if (hasPagination) {
      const page    = parseInt(oPayload.page)    || 1;
      const perPage = parseInt(oPayload.perPage) || 10;
      const offset  = (page - 1) * perPage;

      const countResult = await baseQuery.clone().count("id as total").first();
      totalData = parseInt(countResult.total || 0);

      vaData = await baseQuery
        .clone()
        .select("id", "kode_poli", "nama_poli")
        .orderBy(sortField, sortOrder)
        .limit(perPage)
        .offset(offset);
    } else {
      vaData = await baseQuery
        .clone()
        .select("id", "kode_poli", "nama_poli")
        .orderBy(sortField, sortOrder);
      totalData = vaData.length;
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data master poli berhasil diambil",
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
      file: "/master/poli/poli_data.js",
      func: "data",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
