/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file page.tsx
 * @description File index untuk routing v1
 * 
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-07-14
 * 
 * @contributors
 * - Fadil <risqullah.s.fadhilah@gmail.com>
 * 
 * @lastModified Fadil (2026-08-03)
 * @version 1.0.1
 */


import express from "express";
import RefreshToken from "./auth/refresh_token.js";
import Login from "./auth/login.js";
import Setup from "./setup/index.js";
import Contoh from "./contoh/index.js";
import Function from "./components/index.js";
import AntrianAwal from "./master/antrian_awal/index.js";
import MasterPoli from "./master/poli/index.js";
import Pasien from "./pasien/index.js";
import Antrian from "./antrian/index.js";
import DokterDropdown from "./master/dokter_dropdown.js";
import PenjaminDropdown from "./master/penjamin_dropdown.js";
import PoliDropdown from "./master/poli_dropdown.js";
import Wilayah from "./master/wilayah.js";

import {
  contextMiddleware,
  validateAccessToken,
} from "../../middleware/validate_header.js";
const router = express.Router();

//auth
router.use("/auth/refresh-token", [], RefreshToken);
router.use("/auth/login", [], Login);

// Modul
// Setup
router.use(
  "/setup",
  [validateAccessToken, contextMiddleware],
  Setup
);
// Setup
router.use(
  "/contoh",
  [validateAccessToken, contextMiddleware],
  Contoh
);

// Function
router.use(
  "/function",
  [validateAccessToken, contextMiddleware],
  Function
);

// Master Specific Routes (Mount BEFORE catch-all /master)
router.use(
  "/master/poli",
  [validateAccessToken, contextMiddleware],
  MasterPoli
);
router.use("/master/dokter-dropdown",   [validateAccessToken, contextMiddleware], DokterDropdown);
router.use("/master/penjamin-dropdown", [validateAccessToken, contextMiddleware], PenjaminDropdown);
router.use("/master/poli-dropdown",     [validateAccessToken, contextMiddleware], PoliDropdown);
router.use("/master/wilayah",           [validateAccessToken, contextMiddleware], Wilayah);

// Master Antrian Awal
router.use(
  "/master",
  [validateAccessToken, contextMiddleware],
  AntrianAwal
);

// Pasien
router.use(
  "/pasien",
  [validateAccessToken, contextMiddleware],
  Pasien
);

// Antrian Poli
router.use(
  "/antrian",
  [validateAccessToken, contextMiddleware],
  Antrian
);

export default router;
