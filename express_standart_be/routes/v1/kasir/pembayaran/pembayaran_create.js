/**
 * @project Sistem Klinik
 * @file kasir/pembayaran/pembayaran_create.js
 * @description POST: catat pembayaran tagihan. Support cicilan.
 *   Auto-insert ke trx_buku_kas dan trx_klaim_bpjs (jika metode bpjs).
 */

import express from "express";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging, validatePayload } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";
import { generateKodePembayaran, generateId } from "../tools/kode_generator.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;
  const oPayload = body || {};
  const username = req?.auth?.username || "";

  try {
    const cValidation = await validatePayload(
      {
        kode_tagihan:       Joi.string().required().label("Kode Tagihan"),
        metode_pembayaran:  Joi.string()
          .valid("tunai", "qris", "transfer", "bpjs", "asuransi")
          .required()
          .label("Metode Pembayaran"),
        jumlah_bayar: Joi.number().min(1).required().label("Jumlah Bayar"),
      },
      {
        "any.required": "{#label} wajib diisi",
        "any.only":     "{#label} tidak valid",
        "number.min":   "{#label} harus lebih dari 0",
      },
      oPayload,
      { allowUnknown: true }
    );

    if (cValidation) {
      return res.status(422).json({
        status:   status.BAD_REQUEST,
        message:  cValidation,
        datetime: formatDateSystem(),
      });
    }

    await DB.transaction(async (trx) => {
      // Cek tagihan ada
      const tagihan = await trx("trx_tagihan")
        .where("kode_tagihan", oPayload.kode_tagihan)
        .forUpdate()
        .first();

      if (!tagihan) {
        throw new Error("Tagihan tidak ditemukan");
      }
      if (tagihan.status_pembayaran === "lunas") {
        throw new Error("Tagihan ini sudah lunas");
      }

      // Hitung total yang sudah dibayar sebelumnya
      const totalSebelumnya = await trx("trx_pembayaran")
        .where("kode_tagihan", oPayload.kode_tagihan)
        .sum("jumlah_bayar as total")
        .first();

      const dibayarSebelumnya = parseFloat(totalSebelumnya?.total || 0);
      const totalTagihan      = parseFloat(tagihan.total_tagihan || 0);
      const jumlahBayar       = parseFloat(oPayload.jumlah_bayar);
      const totalAkumulasi    = dibayarSebelumnya + jumlahBayar;

      // Validasi: tidak boleh bayar lebih dari sisa
      const sisa = totalTagihan - dibayarSebelumnya;
      if (jumlahBayar > sisa) {
        throw new Error(
          `Jumlah bayar (Rp ${jumlahBayar.toLocaleString("id-ID")}) melebihi sisa tagihan (Rp ${sisa.toLocaleString("id-ID")})`
        );
      }

      const tanggalBayar = new Date().toISOString().slice(0, 19).replace('T', ' ');

      // Insert ke trx_pembayaran
      await trx("trx_pembayaran").insert({
        id:                generateId("PBY"),
        kode_tagihan:      oPayload.kode_tagihan,
        metode_pembayaran: oPayload.metode_pembayaran,
        jumlah_bayar:      jumlahBayar,
        tanggal_bayar:     tanggalBayar,
        email_kasir:       username,
      });

      // Update status_pembayaran di trx_tagihan
      const newStatus = totalAkumulasi >= totalTagihan ? "lunas" : "sebagian";
      await trx("trx_tagihan")
        .where("kode_tagihan", oPayload.kode_tagihan)
        .update({ status_pembayaran: newStatus });

      // Auto-insert ke trx_buku_kas
      await trx("trx_buku_kas").insert({
        id:         generateId("KAS"),
        tanggal:    tanggalBayar.slice(0, 10),
        jenis:      "masuk",
        kategori:   "pembayaran pasien",
        keterangan: `Pembayaran tagihan ${oPayload.kode_tagihan} via ${oPayload.metode_pembayaran}`,
        jumlah:     jumlahBayar,
        email_user: username,
      });

      // Jika metode bpjs — siapkan draft klaim
      if (oPayload.metode_pembayaran === "bpjs") {
        const kunjungan = await trx("trx_kunjungan")
          .where("kode_kunjungan", tagihan.kode_kunjungan)
          .first();

        // Cek apakah sudah ada klaim untuk kunjungan ini
        const existingKlaim = await trx("trx_klaim_bpjs")
          .where("kode_kunjungan", tagihan.kode_kunjungan)
          .first();

        if (!existingKlaim) {
          await trx("trx_klaim_bpjs").insert({
            id:             generateId("BPJ"),
            kode_kunjungan: tagihan.kode_kunjungan,
            no_sep:         null,
            status_klaim:   "draft",
            nominal_klaim:  jumlahBayar,
            tanggal_klaim:  tanggalBayar.slice(0, 10),
          });
        }
      }

      // Simpan untuk response
      res._kasirResult = {
        kode_tagihan:     oPayload.kode_tagihan,
        metode_pembayaran: oPayload.metode_pembayaran,
        jumlah_bayar:     jumlahBayar,
        total_dibayar:    totalAkumulasi,
        sisa_tagihan:     totalTagihan - totalAkumulasi,
        status_pembayaran: newStatus,
        tanggal_bayar:    tanggalBayar,
      };
    });

    return res.status(200).json({
      status:   status.SUKSES,
      message:  "Pembayaran berhasil dicatat",
      datetime: formatDateSystem(),
      data:     res._kasirResult,
    });
  } catch (error) {
    if (
      error.message.includes("tidak ditemukan") ||
      error.message.includes("sudah lunas") ||
      error.message.includes("melebihi sisa")
    ) {
      return res.status(400).json({
        status:   status.GAGAL,
        message:  error.message,
        datetime: formatDateSystem(),
      });
    }

    const oResult = {
      status:   status.BAD_REQUEST,
      message:  "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "kasir/pembayaran/pembayaran_create.js", func: "create", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
