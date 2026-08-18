/**
 * @project Sistem Klinik
 * @file dashboard/index.js
 * @description Router index untuk modul dashboard
 */

import express from "express";
const router = express.Router();

import dashboardData from "./dashboard_data.js";

router.use("/dashboard-data", dashboardData);

export default router;
