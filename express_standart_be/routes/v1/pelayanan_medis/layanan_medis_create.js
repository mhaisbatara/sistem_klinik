/**
 * @project Sistem Klinik
 * @file pelayanan_medis/layanan_medis_create.js
 * @description Endpoint tambah layanan medis (konsultasi/tindakan) langsung ke trx_detail_tagihan & auto-update trx_tagihan
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
        jenis_layanan:  Joi.string().valid("konsultasi", "tindakan").required().label("Jenis Layanan"),
        nama_layanan:   Joi.string().required().label("Nama Layanan"),
        qty:            Joi.number().min(1).default(1).label("Qty"),
        harga:          Joi.number().min(0).required().label("Harga"),
      },
      {
        "any.required":  "{#label} wajib diisi",
        "string.empty":  "{#label} tidak boleh kosong",
        "any.only":      "{#label} tidak valid",
      },
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

    const qty = parseInt(oPayload.qty || 1);
    const hargaSatuan = parseFloat(oPayload.harga || 0);
    const subtotal = qty * hargaSatuan;

    const getLocalDateStr = (d = new Date()) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    let targetKodeTagihan = "";

    await DB.transaction(async (trx) => {
      // 1. Cek / buat trx_tagihan untuk kunjungan ini
      let oTagihan = await trx("trx_tagihan")
        .where("kode_kunjungan", oPayload.kode_kunjungan)
        .first();

      if (!oTagihan) {
        // Ambil info kunjungan
        const oKunjungan = await trx("trx_kunjungan")
          .where("kode_kunjungan", oPayload.kode_kunjungan)
          .first();

        const countTagihan = await trx("trx_tagihan").count("id as c").first();
        const seq          = String(parseInt(countTagihan.c || 0) + 1).padStart(4, "0");
        const todayStr     = getLocalDateStr(new Date());
        const dateTag      = todayStr.replace(/-/g, "");
        const tagihanId    = `TGH${dateTag}${seq}`;
        const kodeTagihan  = `TGH-${dateTag}-${seq}`;

        oTagihan = {
          id: tagihanId,
          kode_tagihan: kodeTagihan,
          kode_kunjungan: oPayload.kode_kunjungan,
          no_rm: oKunjungan?.no_rm || null,
          kode_penjamin: oKunjungan?.kode_penjamin || "PJM01",
          total_tagihan: 0,
          status_pembayaran: "belum_bayar",
          tanggal: todayStr,
        };

        await trx("trx_tagihan").insert(oTagihan);
      }

      targetKodeTagihan = oTagihan.kode_tagihan;

      // 2. Insert ke trx_detail_tagihan
      const countDetail = await trx("trx_detail_tagihan").count("id as c").first();
      const detailSeq   = String(parseInt(countDetail.c || 0) + 1).padStart(4, "0");
      const todayStr    = getLocalDateStr(new Date());
      const detailId    = `DTL${todayStr.replace(/-/g, "")}${detailSeq}`;

      await trx("trx_detail_tagihan").insert({
        id: detailId,
        kode_tagihan: targetKodeTagihan,
        jenis_item: oPayload.jenis_layanan,
        nama_item: oPayload.nama_layanan,
        qty: qty,
        harga_satuan: hargaSatuan,
        subtotal: subtotal,
      });

      // 3. Update total_tagihan di trx_tagihan
      const sumRes = await trx("trx_detail_tagihan")
        .where("kode_tagihan", targetKodeTagihan)
        .sum("subtotal as total")
        .first();

      const newTotal = parseFloat(sumRes?.total || 0);

      await trx("trx_tagihan")
        .where("kode_tagihan", targetKodeTagihan)
        .update({ total_tagihan: newTotal });
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Layanan medis berhasil ditambahkan",
      datetime: formatDateSystem(),
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "pelayanan_medis/layanan_medis_create.js", func: "create", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
