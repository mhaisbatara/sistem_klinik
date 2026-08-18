/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file antrian_reset.js
 * @description Endpoint untuk me-reset status antrian poli hari ini
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-16
 * @version 1.0.0
 */

import express from "express";
import DB from "../../../core/config/knex.js";
import { formatDateSystem } from "../components/tools/date_tools.js";
import {
  Logging,
  ChangesLog,
} from "../components/tools/servertool.js";
import { status } from "../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { body } = req;
  const oPayload = body || {};
  const username = req?.auth?.username || "";

  try {
    const today = new Date();
    const targetDate = oPayload.tanggal || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const kodePoli = oPayload.kode_poli || "";
    const targetStatus = oPayload.target_status || "menunggu";

    let affectedCount = 0;

    await DB.transaction(async (trx) => {
      const qb = trx("trx_antrian").where("tanggal", targetDate);
      if (kodePoli) {
        qb.where("kode_poli", kodePoli);
      }

      affectedCount = await qb.update({
        status_panggil: targetStatus,
      });

      await ChangesLog(
        {
          description:   `Reset Status Antrian Poli (${kodePoli || "Semua Poli"}) Tanggal ${targetDate} ke '${targetStatus}'`,
          tableName:     "trx_antrian",
          referenceCode: `RESET-${targetDate}-${kodePoli || "ALL"}`,
          action:        "UPDATE",
          dataBefore:    { tanggal: targetDate, kode_poli: kodePoli },
          dataAfter:     { status_panggil: targetStatus, affected: affectedCount },
          user:          username,
          tz:            oPayload.tz || "UTC",
        },
        trx
      );
    });

    return res.status(200).json({
      status: status.SUKSES,
      message: `Berhasil mereset ${affectedCount} data antrian poli`,
      datetime: formatDateSystem(),
      data: { affected_rows: affectedCount, target_status: targetStatus },
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };

    Logging(error, {
      file: "/antrian/antrian_reset.js",
      func: "reset",
      request: oPayload,
      response: oResult,
      user: username,
    });

    return res.status(500).json(oResult);
  }
});

export default router;
