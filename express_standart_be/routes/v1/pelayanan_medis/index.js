/**
 * @project Sistem Klinik
 * @file pelayanan_medis/index.js
 * @description Router index untuk modul pelayanan medis
 */

import express from "express";
const router = express.Router();

import kunjunganData      from "./kunjungan_data.js";
import kunjunganDetail    from "./kunjungan_detail.js";
import kunjunganSelesai   from "./kunjungan_selesai.js";
import layananMedisData   from "./layanan_medis_data.js";
import layananMedisCreate from "./layanan_medis_create.js";
import layananMedisDelete from "./layanan_medis_delete.js";
import permintaanLabData   from "./permintaan_lab_data.js";
import permintaanLabCreate from "./permintaan_lab_create.js";
import permintaanLabDelete from "./permintaan_lab_delete.js";
import resepData           from "./resep_data.js";
import resepCreate         from "./resep_create.js";
import resepDeleteItem     from "./resep_delete_item.js";
import pemeriksaanVitalsData from "./pemeriksaan_vitals_data.js";
import pemeriksaanVitalsSave from "./pemeriksaan_vitals_save.js";

// Kunjungan
router.use("/kunjungan-data",    kunjunganData);
router.use("/kunjungan-detail",  kunjunganDetail);
router.use("/kunjungan-selesai", kunjunganSelesai);

// Pemeriksaan Vitals & SOAP
router.use("/vitals-data",       pemeriksaanVitalsData);
router.use("/vitals-save",       pemeriksaanVitalsSave);

// Layanan Medis
router.use("/layanan-data",      layananMedisData);
router.use("/layanan-create",    layananMedisCreate);
router.use("/layanan-delete",    layananMedisDelete);

// Permintaan Lab
router.use("/lab-data",          permintaanLabData);
router.use("/lab-create",        permintaanLabCreate);
router.use("/lab-delete",        permintaanLabDelete);

// Resep
router.use("/resep-data",        resepData);
router.use("/resep-create",      resepCreate);
router.use("/resep-delete-item", resepDeleteItem);

export default router;
