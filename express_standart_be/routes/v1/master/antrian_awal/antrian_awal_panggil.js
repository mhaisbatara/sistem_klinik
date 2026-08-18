/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file antrian_awal_panggil.js
 * @description Endpoint untuk mengubah status antrian awal
 *              Alur: tersedia -> diambil -> dipanggil -> selesai
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-15
 *
 * @contributors
 * - Fadil <risqullah.s.fadhilah@gmail.com>
 *
 * @lastModified Fadil (2026-08-15)
 * @version 1.0.1
 */

import express from "express";
import { status } from "../../components/tools/general.js";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import {
  Logging,
  ChangesLog,
  validatePayload,
} from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";

const router = express.Router();

// Aturan transisi status yang diizinkan
const TRANSISI_STATUS = {
  diambil: {
    from: ["tersedia"],
    label: "Pasien mengambil nomor antrian",
    errorMsg: (no, current) =>
      `Nomor ${no} tidak dapat diambil karena status saat ini: ${current}`,
  },
  dipanggil: {
    from: ["diambil"],
    label: "Panggil nomor antrian ke loket",
    errorMsg: (no, current) =>
      `Nomor ${no} tidak dapat dipanggil karena status saat ini: ${current}. Harus diambil dulu.`,
  },
  selesai: {
    from: ["dipanggil"],
    label: "Antrian selesai dilayani",
    errorMsg: (no, current) =>
      `Nomor ${no} tidak dapat diselesaikan karena status saat ini: ${current}. Harus dipanggil dulu.`,
  },
};

router.post("/", async (req, res) => {
  const { body } = req;
  const oPayload = body;
  const username = req?.auth?.username || "";

  try {
    if (!oPayload || Object.keys(oPayload).length < 1) {
      return res.status(400).json({
        status: status.BAD_REQUEST,
        message: "Invalid request body",
        datetime: formatDateSystem(),
      });
    }

    const cValidation = await validatePayload(
      {
        kode_antrian: Joi.string().required().label("Kode Antrian"),
        aksi: Joi.string()
          .valid("diambil", "dipanggil", "selesai")
          .required()
          .label("Aksi"),
      },
      {
        "string.base": "{#label} harus berupa teks",
        "string.empty": "{#label} tidak boleh kosong",
        "any.only": "{#label} tidak valid. Pilih: diambil / dipanggil / selesai",
        "any.required": "{#label} wajib diisi",
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

    const aksi = oPayload.aksi;
    const aturan = TRANSISI_STATUS[aksi];
    let updatedRecord = null;

    await DB.transaction(async (trx) => {
      const record = await trx("mst_antrian_awal")
        .where("kode_antrian", oPayload.kode_antrian)
        .forUpdate()
        .first();

      if (!record) {
        const error = new Error("Nomor antrian tidak ditemukan");
        error.statusCode = 404;
        throw error;
      }

      if (record.status === "nonaktif") {
        const error = new Error(
          `Nomor antrian ${record.no_antrian} tidak aktif`
        );
        error.statusCode = 422;
        throw error;
      }

      if (!aturan.from.includes(record.status)) {
        const error = new Error(aturan.errorMsg(record.no_antrian, record.status));
        error.statusCode = 422;
        throw error;
      }

      await trx("mst_antrian_awal")
        .where("kode_antrian", oPayload.kode_antrian)
        .update({ status: aksi, updated_at: formatDateSystem() });

      updatedRecord = { ...record, status: aksi };

      await ChangesLog(
        {
          description: `${aturan.label} - Nomor ${record.no_antrian}`,
          tableName: "mst_antrian_awal",
          referenceCode: oPayload.kode_antrian,
          action: "UPDATE",
          dataBefore: record,
          dataAfter: updatedRecord,
          user: username,
          tz: oPayload.tz || "UTC",
        },
        trx
      );
    });

    const pesanAksi = {
      diambil: `Nomor antrian ${updatedRecord.no_antrian} berhasil diambil pasien`,
      dipanggil: `Nomor antrian ${updatedRecord.no_antrian} berhasil dipanggil`,
      selesai: `Nomor antrian ${updatedRecord.no_antrian} selesai dilayani`,
    };

    return res.status(200).json({
      status: status.SUKSES,
      message: pesanAksi[aksi],
      datetime: formatDateSystem(),
      data: updatedRecord,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        status: status.NOT_FOUND,
        message: error.message,
        datetime: formatDateSystem(),
      });
    }

    if (error.statusCode === 422) {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: error.message,
        datetime: formatDateSystem(),
      });
    }

    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };

    Logging(error, {
      file: "/master/antrian_awal/antrian_awal_panggil.js",
      func: "panggil",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
