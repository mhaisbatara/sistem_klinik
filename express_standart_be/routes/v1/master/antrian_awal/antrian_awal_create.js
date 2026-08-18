/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file antrian_awal_create.js
 * @description Endpoint untuk membuat data antrian awal baru
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-15
 *
 * @contributors
 * - Fadil <risqullah.s.fadhilah@gmail.com>
 *
 * @lastModified Fadil (2026-08-15)
 * @version 1.0.0
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
import {
  getLastKodeRegister,
  setLastKodeRegister,
} from "../../components/tools/getter_setter.js";

const router = express.Router();

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
        no_antrian: Joi.string().max(5).required().label("Nomor Antrian"),
        status: Joi.string()
          .valid("tersedia", "diambil", "dipanggil", "selesai", "nonaktif")
          .optional()
          .label("Status"),
      },
      {
        "string.base": "{#label} harus berupa teks",
        "string.empty": "{#label} tidak boleh kosong",
        "string.max": "{#label} tidak boleh lebih dari {#limit} karakter",
        "any.only": "{#label} tidak valid",
        "any.required": "{#label} wajib diisi",
      },
      oPayload,
      {
        uniqueField: ["no_antrian"],
        table: "mst_antrian_awal",
        allowUnknown: true,
      }
    );

    if (cValidation) {
      return res.status(422).json({
        status: status.BAD_REQUEST,
        message: cValidation || "Terdapat kesalahan pada data anda",
        datetime: formatDateSystem(),
      });
    }

    let cKodeAntrian = "";

    await DB.transaction(async (trx) => {
      cKodeAntrian = await getLastKodeRegister("NAA", 3, true, trx);

      const oData = {
        kode_antrian: cKodeAntrian,
        no_antrian: oPayload.no_antrian,
        status: oPayload.status || "tersedia",
        created_at: formatDateSystem(),
        updated_at: formatDateSystem(),
      };

      await trx("mst_antrian_awal").insert(oData);
      await setLastKodeRegister("NAA", trx);

      await ChangesLog(
        {
          description: "Tambah Nomor Antrian Awal",
          tableName: "mst_antrian_awal",
          referenceCode: cKodeAntrian,
          action: "CREATE",
          dataBefore: null,
          dataAfter: oData,
          user: username,
          tz: oPayload.tz || "UTC",
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: "Nomor antrian berhasil ditambahkan",
      datetime: formatDateSystem(),
      data: { kode_antrian: cKodeAntrian },
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };

    Logging(error, {
      file: "/master/antrian_awal/antrian_awal_create.js",
      func: "create",
      request: body,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
