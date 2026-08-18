/**
 * @project Sistem Klinik
 * @file kasir/tools/kode_generator.js
 * @description Generate kode transaksi kasir harian dengan row-lock untuk mencegah race condition.
 *   Format: TGH-YYMMDD-XXXX (contoh: TGH-260818-0001)
 */

import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";

/**
 * Generate kode tagihan harian baru.
 * Menggunakan tabel nomor_faktur dengan row-lock (SELECT FOR UPDATE).
 * @param {object} trx - Knex transaction instance
 * @returns {Promise<string>} kode_tagihan, contoh: TGH-260818-0001
 */
export const generateKodeTagihan = async (trx = DB) => {
  const today = new Date();
  const yy = String(today.getFullYear()).slice(2);
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yy}${mm}${dd}`;
  const kodeBase = `TGH-${dateStr}`;

  // Gunakan row-lock: SELECT ... FOR UPDATE pada tabel nomor_faktur
  const lockKey = `TGH${dateStr}`;

  // Cek apakah sudah ada counter untuk hari ini
  const existing = await trx("nomor_faktur")
    .where("kode", lockKey)
    .forUpdate()
    .first();

  let nextSeq;
  if (existing) {
    nextSeq = (parseInt(existing.id || 0) + 1);
    await trx("nomor_faktur").where("kode", lockKey).update({ id: nextSeq });
  } else {
    nextSeq = 1;
    await trx("nomor_faktur").insert({ kode: lockKey, id: nextSeq });
  }

  const seqStr = String(nextSeq).padStart(4, "0");
  return `${kodeBase}-${seqStr}`;
};

/**
 * Generate kode pembayaran harian baru.
 * Format: PAY-YYMMDD-XXXX
 * @param {object} trx - Knex transaction instance
 * @returns {Promise<string>} kode_pembayaran
 */
export const generateKodePembayaran = async (trx = DB) => {
  const today = new Date();
  const yy = String(today.getFullYear()).slice(2);
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yy}${mm}${dd}`;
  const lockKey = `PAY${dateStr}`;

  const existing = await trx("nomor_faktur")
    .where("kode", lockKey)
    .forUpdate()
    .first();

  let nextSeq;
  if (existing) {
    nextSeq = (parseInt(existing.id || 0) + 1);
    await trx("nomor_faktur").where("kode", lockKey).update({ id: nextSeq });
  } else {
    nextSeq = 1;
    await trx("nomor_faktur").insert({ kode: lockKey, id: nextSeq });
  }

  return `PAY-${dateStr}-${String(nextSeq).padStart(4, "0")}`;
};

/**
 * Generate unique ID string for table PK (max 20 chars).
 * @param {string} prefix
 * @returns {string} ID string (<= 20 chars)
 */
export const generateId = (prefix = "TRX") => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${ts}${rand}`.slice(0, 20);
};

