/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file index.js
 * @description Router index untuk modul pasien
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-16
 *
 * @version 1.0.0
 */

import express from "express";
const router = express.Router();

import pasienData       from "./pasien_data.js";
import pasienSearch     from "./pasien_search.js";
import pasienDaftarBaru from "./pasien_daftar_baru.js";
import pasienDaftarLama from "./pasien_daftar_lama.js";

router.use("/pasien-data",        pasienData);
router.use("/pasien-search",      pasienSearch);
router.use("/pasien-daftar-baru", pasienDaftarBaru);
router.use("/pasien-daftar-lama", pasienDaftarLama);

export default router;
