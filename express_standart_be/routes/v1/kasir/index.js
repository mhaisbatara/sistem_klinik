/**
 * @project Sistem Klinik
 * @file kasir/index.js
 * @description Router aggregator untuk modul Kasir
 */

import express from "express";
const router = express.Router();

import tagihanGenerate    from "./tagihan/tagihan_generate.js";
import tagihanData        from "./tagihan/tagihan_data.js";
import tagihanDetail      from "./tagihan/tagihan_detail.js";
import pembayaranCreate   from "./pembayaran/pembayaran_create.js";
import pembayaranData     from "./pembayaran/pembayaran_data.js";
import kwitansiPrint      from "./kwitansi/kwitansi_print.js";

// Tagihan
router.use("/tagihan-generate",     tagihanGenerate);
router.use("/tagihan-data",         tagihanData);
router.use("/tagihan-detail",       tagihanDetail);

// Pembayaran
router.use("/pembayaran-create",    pembayaranCreate);
router.use("/pembayaran-data",      pembayaranData);

// Kwitansi
router.use("/kwitansi-print",       kwitansiPrint);

export default router;
