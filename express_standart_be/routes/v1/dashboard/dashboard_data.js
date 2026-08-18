/**
 * @project Sistem Klinik
 * @file dashboard/dashboard_data.js
 * @description Endpoint untuk mengambil data statistik dashboard
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

  try {
    const getLocalDateStr = (d = new Date()) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const todayStr = getLocalDateStr(new Date());

    // 1. Kunjungan Hari Ini (count dari trx_antrian hari ini)
    const kunjunganTodayRes = await DB("trx_antrian")
      .where("tanggal", todayStr)
      .count("id as count")
      .first();
    const kunjunganHariIni = parseInt(kunjunganTodayRes?.count || 0);

    // 2. Pendapatan Hari Ini (sum total_tagihan dari trx_tagihan hari ini)
    const pendapatanTodayRes = await DB("trx_tagihan")
      .where("tanggal", todayStr)
      .sum("total_tagihan as total")
      .first();
    const pendapatanHariIni = parseFloat(pendapatanTodayRes?.total || 0);

    // 3. Pasien Menunggu (count status_panggil = 'menunggu' hari ini)
    const pasienMenungguRes = await DB("trx_antrian")
      .where({ tanggal: todayStr, status_panggil: "menunggu" })
      .count("id as count")
      .first();
    const pasienMenunggu = parseInt(pasienMenungguRes?.count || 0);

    // 4. Okupansi Poli (% poli aktif hari ini vs total mst_poli)
    const totalPoliRes = await DB("mst_poli").count("id as count").first();
    const totalPoliCount = parseInt(totalPoliRes?.count || 1);

    const activePoliRes = await DB("trx_antrian")
      .where("tanggal", todayStr)
      .countDistinct("kode_poli as count")
      .first();
    const activePoliCount = parseInt(activePoliRes?.count || 0);

    // Jika belum ada antrian hari ini, hitung dari data antrian terakhir/default 100% atau persentase real
    let okupansiPoliPercent = 100;
    if (activePoliCount > 0) {
      okupansiPoliPercent = Math.min(100, Math.round((activePoliCount / totalPoliCount) * 100));
    }

    // 5. Pasien Per Poli (group count by kode_poli hari ini)
    const pasienPerPoliData = await DB("trx_antrian as a")
      .join("mst_poli as p", "a.kode_poli", "p.kode_poli")
      .select("p.nama_poli", "a.kode_poli")
      .count("a.id as count")
      .where("a.tanggal", todayStr)
      .groupBy("a.kode_poli", "p.nama_poli")
      .orderBy("count", "desc");

    // Format pasien per poli
    const maxPatientCount = Math.max(1, ...pasienPerPoliData.map(item => parseInt(item.count || 0)));
    const pasienPerPoliFormatted = pasienPerPoliData.map(item => ({
      nama_poli: item.nama_poli,
      count: parseInt(item.count || 0),
      percentage: Math.min(100, Math.round((parseInt(item.count || 0) / maxPatientCount) * 100)),
    }));

    // 6. Tren Kunjungan 7 Hari (harian untuk 7 hari terakhir)
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const trenKunjungan7Hari = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateStr(d);
      const dayName = dayNames[d.getDay()];

      const dayCountRes = await DB("trx_antrian")
        .where("tanggal", dateStr)
        .count("id as count")
        .first();

      let dayCount = parseInt(dayCountRes?.count || 0);

      // Jika data antrian tipis, ambil dari trx_tagihan sebagai visual trend jika ada
      if (dayCount === 0) {
        const tagihanDayRes = await DB("trx_tagihan")
          .where("tanggal", dateStr)
          .count("id as count")
          .first();
        dayCount = parseInt(tagihanDayRes?.count || 0);
      }

      trenKunjungan7Hari.push({
        tanggal: dateStr,
        hari: dayName,
        jumlah: dayCount,
      });
    }

    return res.status(200).json({
      status: status.SUKSES,
      message: "Data dashboard berhasil diambil",
      datetime: formatDateSystem(),
      data: {
        kunjungan_hari_ini: kunjunganHariIni,
        pendapatan_hari_ini: pendapatanHariIni,
        pasien_menunggu: pasienMenunggu,
        okupansi_poli: `${okupansiPoliPercent}%`,
        tren_kunjungan: trenKunjungan7Hari,
        pasien_per_poli: pasienPerPoliFormatted,
      },
    });
  } catch (error) {
    const oResult = {
      status: status.BAD_REQUEST,
      message: "Sistem sedang maintenance harap tunggu sebentar",
      datetime: formatDateSystem(),
    };
    Logging(error, { file: "dashboard/dashboard_data.js", func: "data", request: oPayload, response: oResult, user: username });
    return res.status(500).json(oResult);
  }
});

export default router;
