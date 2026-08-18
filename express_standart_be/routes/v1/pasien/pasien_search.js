/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file pasien_search.js
 * @description Endpoint untuk mencari data pasien lama
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
import Joi from "joi";
import DB from "../../../core/config/knex.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import {
  Logging,
  validatePayload,
} from "../components/tools/servertool.js";
import { status } from "../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;
  const oPayload = body;
  const username = req?.auth?.username || "";

  try {
    const cValidation = await validatePayload(
      {
        search: Joi.string().min(2).required().label("Kata Pencarian"),
      },
      {
        "string.base": "{#label} harus berupa teks",
        "string.empty": "{#label} tidak boleh kosong",
        "string.min": "{#label} minimal {#limit} karakter",
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

    const keyword = `%${oPayload.search}%`;

    const vaData = await DB("mst_pasien")
      .select(
        "no_rm",
        "nik",
        "nama_pasien",
        "tanggal_lahir",
        "jenis_kelamin",
        "no_hp",
        "email",
        "nama_ibu_kandung",
        "tempat_lahir",
        "golongan_darah",
        "agama",
        "status_perkawinan",
        "pekerjaan",
        "pendidikan",
        "kewarganegaraan",
        "provinsi",
        "kota_kabupaten",
        "kecamatan",
        "kelurahan",
        "detail_alamat",
        "kode_pos"
      )
      .where(function () {
        this.whereILike("no_rm", keyword)
          .orWhereILike("nik", keyword)
          .orWhereILike("nama_pasien", keyword);
      })
      .limit(10);

    return res.status(200).json({
      status: status.SUKSES,
      message: vaData.length > 0 ? "Data ditemukan" : "Tidak ada data yang cocok",
      datetime: formatDateSystem(),
      data: vaData,
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };

    Logging(error, {
      file: "/pasien/pasien_search.js",
      func: "search",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
