/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file antrian_awal_reset.js
 * @description Endpoint untuk mereset semua antrian awal (terpakai -> tersedia)
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
import DB from "../../../../core/config/knex.js";
import { Logging, ChangesLog } from "../../components/tools/servertool.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;
  const oPayload = body;
  const username = req?.auth?.username || "";

  try {
    let jumlahReset = 0;

    await DB.transaction(async (trx) => {
      // Ambil semua yang perlu direset (diambil / dipanggil / selesai) untuk log
      const recordsTerpakai = await trx("mst_antrian_awal")
        .whereIn("status", ["diambil", "dipanggil", "selesai"])
        .select("kode_antrian", "no_antrian", "status");

      jumlahReset = recordsTerpakai.length;

      if (jumlahReset > 0) {
        // Reset hanya yang bukan tersedia/nonaktif
        await trx("mst_antrian_awal")
          .whereIn("status", ["diambil", "dipanggil", "selesai"])
          .update({ status: "tersedia", updated_at: formatDateSystem() });

        // Log perubahan
        await ChangesLog(
          {
            description: `Reset ${jumlahReset} Nomor Antrian Awal`,
            tableName: "mst_antrian_awal",
            referenceCode: "RESET",
            action: "UPDATE",
            dataBefore: recordsTerpakai,
            dataAfter: { status: "tersedia", jumlah: jumlahReset },
            user: username,
            tz: oPayload.tz || "UTC",
          },
          trx
        );
      }
    });

    return res.status(200).json({
      status: status.SUKSES,
      message:
        jumlahReset > 0
          ? `${jumlahReset} nomor antrian berhasil direset`
          : "Tidak ada antrian yang perlu direset",
      datetime: formatDateSystem(),
      data: { jumlah_reset: jumlahReset },
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };

    Logging(error, {
      file: "/master/antrian_awal/antrian_awal_reset.js",
      func: "reset",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
