/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file index.js
 * @description Router index untuk master poli (mst_poli)
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-16
 * @version 1.0.0
 */

import express from "express";
const router = express.Router();

import poliData   from "./poli_data.js";
import poliCreate from "./poli_create.js";
import poliUpdate from "./poli_update.js";
import poliDelete from "./poli_delete.js";

router.use("/poli-data",   poliData);
router.use("/poli-create", poliCreate);
router.use("/poli-update", poliUpdate);
router.use("/poli-delete", poliDelete);

export default router;
