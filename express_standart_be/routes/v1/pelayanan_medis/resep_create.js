/**
 * @project Sistem Klinik
 * @file pelayanan_medis/resep_create.js
 * @description Endpoint tambah item resep. Jika resep sudah ada untuk kunjungan, tambah detail saja.
 */

import express from "express";
import Joi from "joi";
import DB from "../../../core/config/knex.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { Logging, validatePayload } from "../components/tools/servertool.js";
import { status } from "../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;
  const oPayload = body || {};
  const username = req?.auth?.username || "";

  try {
    const cValidation = await validatePayload(
      {
        kode_kunjungan: Joi.string().required().label("Kode Kunjungan"),
        no_sip:         Joi.string().allow("", null).optional().label("No. SIP Dokter"),
        kode_obat:      Joi.string().required().label("Obat"),
        dosis:          Joi.string().allow("", null).optional().label("Dosis"),
        jumlah:         Joi.number().min(1).required().label("Jumlah"),
        aturan_pakai:   Joi.string().allow("", null).optional().label("Aturan Pakai"),
      },
      { "any.required": "{#label} wajib diisi" },
      oPayload,
      { allowUnknown: true }
    );

    if (cValidation) {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: cValidation,
        datetime: formatDateSystem(),
      });
    }

    // Cek obat exists
    const oObat = await DB("mst_obat").where("kode_obat", oPayload.kode_obat).first();
    if (!oObat) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: "Obat tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    const tanggal = new Date().toISOString().slice(0, 10);
    let oResep = await DB("trx_resep").where("kode_kunjungan", oPayload.kode_kunjungan).first();

    await DB.transaction(async (trx) => {
      // Buat resep baru jika belum ada
      if (!oResep) {
        const countResep = await trx("trx_resep").count("id as c").first();
        const seqResep   = (parseInt(countResep.c || 0) + 1).toString().padStart(4, "0");
        const dateTag    = tanggal.replace(/-/g, "");
        const resepId    = `RSP${seqResep}`;
        const kodeResep  = `RSP-${dateTag}-${seqResep}`;

        oResep = {
          id:          resepId,
          kode_resep:  kodeResep,
          kode_kunjungan: oPayload.kode_kunjungan,
          no_sip:      oPayload.no_sip || null,
          tanggal_resep: tanggal,
          status_dispensing: "menunggu",
        };
        await trx("trx_resep").insert(oResep);
      }

      // Insert detail resep
      const countDetail = await trx("trx_resep_detail").count("id as c").first();
      const seqDetail   = (parseInt(countDetail.c || 0) + 1).toString().padStart(4, "0");
      const detailId    = `RSD${seqDetail}`;

      await trx("trx_resep_detail").insert({
        id:          detailId,
        kode_resep:  oResep.kode_resep,
        kode_obat:   oPayload.kode_obat,
        dosis:       oPayload.dosis || null,
        jumlah:      oPayload.jumlah,
        aturan_pakai: oPayload.aturan_pakai || null,
      });
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: `Obat "${oObat.nama_obat}" berhasil ditambahkan ke resep`,
      datetime: formatDateSystem(),
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "pelayanan_medis/resep_create.js", func: "create", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
