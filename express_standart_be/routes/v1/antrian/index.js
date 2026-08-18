/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file index.js
 * @description Router index untuk modul antrian poli
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-16
 * @version 1.0.0
 */

import express from "express";
const router = express.Router();

import antrianData   from "./antrian_data.js";
import antrianPanggil from "./antrian_panggil.js";
import antrianCreate  from "./antrian_create.js";
import antrianUpdate  from "./antrian_update.js";
import antrianDelete  from "./antrian_delete.js";
import antrianReset   from "./antrian_reset.js";

router.use("/antrian-data",    antrianData);
router.use("/antrian-panggil", antrianPanggil);
router.use("/antrian-create",  antrianCreate);
router.use("/antrian-update",  antrianUpdate);
router.use("/antrian-delete",  antrianDelete);
router.use("/antrian-reset",   antrianReset);

export default router;
