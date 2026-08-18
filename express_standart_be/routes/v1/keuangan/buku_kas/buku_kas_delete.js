/**
 * @project Sistem Klinik
 * @file keuangan/buku_kas/buku_kas_delete.js
 * @description POST: hapus entri buku kas. Tolak jika berasal dari kasir otomatis.
 */

import express from "express";
import Joi from "joi";
import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { Logging, validatePayload } from "../../components/tools/servertool.js";
import { status } from "../../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;
  const oPayload = body || {};
  const username = req?.auth?.username || "";

  try {
    const cValidation = await validatePayload(
      {
        id: Joi.alternatives()
          .try(Joi.number(), Joi.string())
          .required()
          .label("ID"),
      },
      { "any.required": "{#label} wajib diisi" },
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

    // Ambil entri
    const entri = await DB("trx_buku_kas").where("id", oPayload.id).first();
    if (!entri) {
      return res.status(404).json({
        status:   status.NOT_FOUND,
        message:  "Entri buku kas tidak ditemukan",
        datetime: formatDateSystem(),
      });
    }

    // Larang hapus entri kasir otomatis
    if (entri.kategori?.toLowerCase().trim() === "pembayaran pasien") {
      return res.status(400).json({
        status:   status.GAGAL,
        message:  "Entri pembayaran pasien tidak dapat dihapus. Batalkan pembayaran melalui modul kasir.",
        datetime: formatDateSystem(),
      });
    }

    await DB("trx_buku_kas").where("id", oPayload.id).del();

    return res.status(200).json({
      status:   status.SUKSES,
      message:  "Entri buku kas berhasil dihapus",
      datetime: formatDateSystem(),
    });
  } catch (error) {
    const oResult = {
      status:   status.BAD_REQUEST,
      message:  "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "keuangan/buku_kas/buku_kas_delete.js", func: "delete", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
