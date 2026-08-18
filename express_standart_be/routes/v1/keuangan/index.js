/**
 * @project Sistem Klinik
 * @file keuangan/index.js
 * @description Router aggregator untuk modul Keuangan
 */

import express from "express";
const router = express.Router();

import bukuKasData   from "./buku_kas/buku_kas_data.js";
import bukuKasCreate from "./buku_kas/buku_kas_create.js";
import bukuKasDelete from "./buku_kas/buku_kas_delete.js";

import laporanLabaRugi      from "./laporan/laporan_laba_rugi.js";
import rekapMetodePenjamin  from "./laporan/rekap_metode_penjamin.js";

import klaimBpjsData         from "./klaim_bpjs/klaim_bpjs_data.js";
import klaimBpjsCreate       from "./klaim_bpjs/klaim_bpjs_create.js";
import klaimBpjsUpdateStatus from "./klaim_bpjs/klaim_bpjs_update_status.js";

// Buku Kas
router.use("/buku-kas-data",   bukuKasData);
router.use("/buku-kas-create", bukuKasCreate);
router.use("/buku-kas-delete", bukuKasDelete);

// Laporan
router.use("/laporan-laba-rugi",    laporanLabaRugi);
router.use("/rekap-metode-penjamin", rekapMetodePenjamin);

// Klaim BPJS
router.use("/klaim-bpjs-data",          klaimBpjsData);
router.use("/klaim-bpjs-create",        klaimBpjsCreate);
router.use("/klaim-bpjs-update-status", klaimBpjsUpdateStatus);

export default router;
