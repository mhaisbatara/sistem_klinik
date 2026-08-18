/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file wilayah.js
 * @description Endpoint proxy wilayah Indonesia (Provinsi, Kota/Kab, Kecamatan, Kelurahan)
 *              Data bersumber dari ibnux/data-indonesia dengan memory cache per hari
 *
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-08-16
 */

import express from "express";
import { Logging } from "../components/tools/servertool.js";
import { status } from "../components/tools/general.js";
import { formatDateSystem } from "../components/tools/date_tools.js";

const router = express.Router();
const BASE_URL = "https://ibnux.github.io/data-indonesia";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam

// Memory cache: { key: { data, ts } }
const _cache = {};

async function fetchWithCache(key, url) {
  const now = Date.now();
  if (_cache[key] && now - _cache[key].ts < CACHE_TTL_MS) {
    return _cache[key].data;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url} (${res.status})`);
  const data = await res.json();
  _cache[key] = { data, ts: now };
  return data;
}

// GET /wilayah/provinsi
router.post("/provinsi", async (req, res) => {
  const username = req?.auth?.username || "";
  try {
    const data = await fetchWithCache("provinsi", `${BASE_URL}/provinsi.json`);
    return res.status(200).json({ status: status.SUKSES, message: "OK", datetime: formatDateSystem(), data });
  } catch (error) {
    Logging(error, { file: "/master/wilayah.js", func: "provinsi", request: {}, response: {}, user: username });
    return res.status(500).json({ status: status.BAD_REQUEST, message: "Gagal memuat data provinsi", datetime: formatDateSystem() });
  }
});

// POST /wilayah/kabupaten  { id_provinsi }
router.post("/kabupaten", async (req, res) => {
  const username = req?.auth?.username || "";
  const { id_provinsi } = req.body || {};
  if (!id_provinsi) {
    return res.status(400).json({ status: status.BAD_REQUEST, message: "id_provinsi wajib diisi", datetime: formatDateSystem() });
  }
  try {
    const data = await fetchWithCache(`kab_${id_provinsi}`, `${BASE_URL}/kabupaten/${id_provinsi}.json`);
    return res.status(200).json({ status: status.SUKSES, message: "OK", datetime: formatDateSystem(), data });
  } catch (error) {
    Logging(error, { file: "/master/wilayah.js", func: "kabupaten", request: req.body, response: {}, user: username });
    return res.status(500).json({ status: status.BAD_REQUEST, message: "Gagal memuat data kabupaten", datetime: formatDateSystem() });
  }
});

// POST /wilayah/kecamatan  { id_kabupaten }
router.post("/kecamatan", async (req, res) => {
  const username = req?.auth?.username || "";
  const { id_kabupaten } = req.body || {};
  if (!id_kabupaten) {
    return res.status(400).json({ status: status.BAD_REQUEST, message: "id_kabupaten wajib diisi", datetime: formatDateSystem() });
  }
  try {
    const data = await fetchWithCache(`kec_${id_kabupaten}`, `${BASE_URL}/kecamatan/${id_kabupaten}.json`);
    return res.status(200).json({ status: status.SUKSES, message: "OK", datetime: formatDateSystem(), data });
  } catch (error) {
    Logging(error, { file: "/master/wilayah.js", func: "kecamatan", request: req.body, response: {}, user: username });
    return res.status(500).json({ status: status.BAD_REQUEST, message: "Gagal memuat data kecamatan", datetime: formatDateSystem() });
  }
});

// POST /wilayah/kelurahan  { id_kecamatan }
router.post("/kelurahan", async (req, res) => {
  const username = req?.auth?.username || "";
  const { id_kecamatan } = req.body || {};
  if (!id_kecamatan) {
    return res.status(400).json({ status: status.BAD_REQUEST, message: "id_kecamatan wajib diisi", datetime: formatDateSystem() });
  }
  try {
    const data = await fetchWithCache(`kel_${id_kecamatan}`, `${BASE_URL}/kelurahan/${id_kecamatan}.json`);
    return res.status(200).json({ status: status.SUKSES, message: "OK", datetime: formatDateSystem(), data });
  } catch (error) {
    Logging(error, { file: "/master/wilayah.js", func: "kelurahan", request: req.body, response: {}, user: username });
    return res.status(500).json({ status: status.BAD_REQUEST, message: "Gagal memuat data kelurahan", datetime: formatDateSystem() });
  }
});

export default router;
