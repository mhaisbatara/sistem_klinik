/**
 * @project Sistem Klinik
 * @file pelayanan_medis/kunjungan_data.js
 * @description Endpoint list data kunjungan untuk Rekam Medis & Pemeriksaan Dokter
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

  const keyword       = oPayload.keyword || "";
  const kodePoli      = oPayload.kode_poli || "";
  const statusKunj    = oPayload.status_kunjungan || "";
  const tanggal       = oPayload.tanggal || "";
  const sortField     = oPayload.sortField || "k.tanggal_kunjungan";
  const sortOrder     = oPayload.sortOrder || "desc";
  const hasPagination = oPayload.page !== undefined || oPayload.perPage !== undefined;

  try {
    // Sync otomatis: Pastikan semua trx_antrian ber-status 'dipanggil' / 'selesai' ada di trx_kunjungan
    const unmappedAntrian = await DB("trx_antrian as a")
      .leftJoin("trx_kunjungan as k", "a.id", "k.kode_antrian")
      .select("a.*")
      .whereNull("k.id")
      .whereIn("a.status_panggil", ["dipanggil", "selesai"]);

    if (unmappedAntrian.length > 0) {
      for (const record of unmappedAntrian) {
        let dokterSip = null;
        if (record.kode_dokter) {
          const dokter = await DB("mst_dokter").where("id", record.kode_dokter).first();
          if (dokter) dokterSip = dokter.no_sip;
        }

        const dateTag = new Date(record.tanggal).toISOString().slice(0, 10).replace(/-/g, "").slice(2);
        const countKunj = await DB("trx_kunjungan").count("id as c").first();
        const seqKunj   = String(parseInt(countKunj.c || 0) + 1).padStart(3, "0");
        const kunjId    = `IDK${dateTag}${seqKunj}`;
        const kodeKunj  = `KNJ${dateTag}${seqKunj}`;

        await DB("trx_kunjungan").insert({
          id: kunjId,
          kode_kunjungan: kodeKunj,
          kode_antrian: record.id,
          no_rm: record.no_rm,
          kode_poli: record.kode_poli,
          no_sip: dokterSip,
          kode_penjamin: record.kode_penjamin || null,
          tanggal_kunjungan: record.tanggal,
          jam_masuk: record.created_at || formatDateSystem(),
          jam_selesai: record.status_panggil === "selesai" ? (record.created_at || formatDateSystem()) : null,
          status_kunjungan: record.status_panggil === "dipanggil" ? "diperiksa" : "selesai",
          created_at: record.created_at || formatDateSystem(),
        });
      }
    }
    const baseQuery = DB("trx_kunjungan as k")
      .leftJoin("mst_pasien as p",   "k.no_rm",         "p.no_rm")
      .leftJoin("mst_dokter as d",   "k.no_sip",        "d.no_sip")
      .leftJoin("mst_poli as pol",   "k.kode_poli",     "pol.kode_poli")
      .leftJoin("mst_penjamin as pj","k.kode_penjamin", "pj.kode_penjamin")
      .modify((qb) => {
        if (kodePoli)   qb.where("k.kode_poli", kodePoli);
        if (statusKunj) qb.where("k.status_kunjungan", statusKunj);
        if (tanggal)    qb.where("k.tanggal_kunjungan", tanggal);
        if (keyword) {
          const like = `%${keyword}%`;
          qb.where(function () {
            this.whereILike("p.nama_pasien",     like)
              .orWhereILike("p.no_rm",           like)
              .orWhereILike("p.nik",             like)
              .orWhereILike("k.kode_kunjungan",  like)
              .orWhereILike("d.nama_dokter",     like);
          });
        }
      });

    const selectFields = [
      "k.id",
      "k.kode_kunjungan",
      "k.kode_antrian",
      "k.no_rm",
      "k.kode_poli",
      "pol.nama_poli",
      "k.no_sip",
      "d.nama_dokter",
      "d.spesialisasi",
      "k.kode_penjamin",
      "pj.nama_penjamin",
      DB.raw("DATE_FORMAT(k.tanggal_kunjungan, '%Y-%m-%d') as tanggal_kunjungan"),
      "k.jam_masuk",
      "k.jam_selesai",
      "k.keluhan_awal",
      "k.status_kunjungan",
      "k.created_at",
      "p.nik",
      "p.nama_pasien",
      "p.jenis_kelamin",
      DB.raw("DATE_FORMAT(p.tanggal_lahir, '%Y-%m-%d') as tanggal_lahir"),
      "p.no_hp",
    ];

    let totalData = 0;
    let vaData    = [];

    if (hasPagination) {
      const page    = parseInt(oPayload.page)    || 1;
      const perPage = parseInt(oPayload.perPage) || 10;
      const offset  = (page - 1) * perPage;

      const countResult = await baseQuery.clone().count("k.id as total").first();
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
      message: "Data kunjungan berhasil diambil",
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
    Logging(error, { file: "pelayanan_medis/kunjungan_data.js", func: "data", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
