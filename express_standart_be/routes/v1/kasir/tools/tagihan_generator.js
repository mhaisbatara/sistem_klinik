/**
 * @project Sistem Klinik
 * @file kasir/tools/tagihan_generator.js
 * @description Generator tagihan per kunjungan.
 *   Mengumpulkan item dari 3 sumber: trx_layanan_medis, trx_resep_detail, trx_permintaan_lab
 *   lalu menginsert ke trx_tagihan & trx_detail_tagihan, dan update status kunjungan.
 */

import DB from "../../../../core/config/knex.js";
import { formatDateSystem } from "../../components/tools/date_tools.js";
import { generateKodeTagihan, generateId } from "./kode_generator.js";

/**
 * Generate atau regenerate tagihan untuk satu kunjungan.
 * Jika tagihan sudah ada (dan belum ada pembayaran), hapus detail lama dan buat ulang.
 *
 * @param {string}  kode_kunjungan
 * @param {string}  username            - email kasir yang melakukan generate
 * @param {string}  kode_penjamin       - nullable, dari trx_kunjungan
 * @param {object}  trx                 - Knex transaction instance (opsional; kalau null pakai DB.transaction)
 * @returns {Promise<{kode_tagihan: string, total_tagihan: number, items: array}>}
 */
export const generateTagihan = async (kode_kunjungan, username = "system", kode_penjamin = null, outerTrx = null) => {
  const execute = async (trx) => {
    // -------------------------------------------------------
    // 1. Cek kunjungan valid
    // -------------------------------------------------------
    const kunjungan = await trx("trx_kunjungan")
      .where("kode_kunjungan", kode_kunjungan)
      .first();

    if (!kunjungan) {
      throw new Error("Kunjungan tidak ditemukan");
    }

    // -------------------------------------------------------
    // 2. Cek tagihan yang sudah ada
    // -------------------------------------------------------
    const existingTagihan = await trx("trx_tagihan")
      .where("kode_kunjungan", kode_kunjungan)
      .first();

    if (existingTagihan) {
      // Tolak regenerate jika sudah ada pembayaran
      const hasPembayaran = await trx("trx_pembayaran")
        .where("kode_tagihan", existingTagihan.kode_tagihan)
        .first();

      if (hasPembayaran) {
        throw new Error(
          `Tagihan ${existingTagihan.kode_tagihan} sudah memiliki pembayaran dan tidak dapat di-regenerate`
        );
      }

      // Hapus detail lama untuk regenerate
      await trx("trx_detail_tagihan")
        .where("kode_tagihan", existingTagihan.kode_tagihan)
        .del();
      await trx("trx_tagihan")
        .where("kode_tagihan", existingTagihan.kode_tagihan)
        .del();
    }

    // -------------------------------------------------------
    // 3. Kumpulkan item dari 3 sumber
    // -------------------------------------------------------
    const detailItems = [];
    let totalTagihan = 0;

    // --- 3a. trx_layanan_medis (konsultasi & tindakan) ---
    const layananList = await trx("trx_layanan_medis")
      .where("kode_kunjungan", kode_kunjungan)
      .select("*");

    for (const lm of layananList) {
      const hargaSatuan = parseFloat(lm.harga_satuan || lm.harga || 0);
      const qty = parseInt(lm.qty || 1);
      const subtotal = hargaSatuan * qty;
      const jenisItem = lm.jenis_layanan === "konsultasi" ? "konsultasi" : "tindakan";

      detailItems.push({
        jenis_item:   jenisItem,
        nama_item:    lm.nama_layanan,
        qty:          qty,
        harga_satuan: hargaSatuan,
        subtotal:     subtotal,
      });
      totalTagihan += subtotal;
    }

    // --- 3b. trx_resep_detail JOIN mst_obat (obat) ---
    const resep = await trx("trx_resep")
      .where("kode_kunjungan", kode_kunjungan)
      .first();

    if (resep) {
      const resepDetail = await trx("trx_resep_detail as rd")
        .join("mst_obat as o", "rd.kode_obat", "o.kode_obat")
        .where("rd.kode_resep", resep.kode_resep)
        .select(
          "rd.*",
          "o.nama_obat",
          "o.harga_jual"
        );

      for (const rd of resepDetail) {
        const hargaSatuan = parseFloat(rd.harga_jual || 0);
        const qty = parseInt(rd.jumlah || 1);
        const subtotal = hargaSatuan * qty;

        detailItems.push({
          jenis_item:   "obat",
          nama_item:    rd.nama_obat || rd.kode_obat,
          qty:          qty,
          harga_satuan: hargaSatuan,
          subtotal:     subtotal,
        });
        totalTagihan += subtotal;
      }
    }

    // --- 3c. trx_permintaan_lab JOIN mst_tarif_layanan (lab) ---
    const labList = await trx("trx_permintaan_lab as pl")
      .leftJoin("mst_tarif_layanan as t", "pl.kode_tarif", "t.kode_tarif")
      .where("pl.kode_kunjungan", kode_kunjungan)
      .select(
        "pl.*",
        "t.harga as tarif_harga",
        "t.nama_layanan as tarif_nama"
      );

    for (const lab of labList) {
      const hargaSatuan = parseFloat(lab.tarif_harga || 0);
      const qty = 1;
      const subtotal = hargaSatuan * qty;

      detailItems.push({
        jenis_item:   "lab",
        nama_item:    lab.tarif_nama || lab.jenis_pemeriksaan,
        qty:          qty,
        harga_satuan: hargaSatuan,
        subtotal:     subtotal,
      });
      totalTagihan += subtotal;
    }

    // -------------------------------------------------------
    // 4. Insert trx_tagihan
    // -------------------------------------------------------
    const kodeTagihan = await generateKodeTagihan(trx);
    const tanggal = new Date().toISOString().slice(0, 10);

    await trx("trx_tagihan").insert({
      id:                 generateId("TGH"),
      kode_tagihan:       kodeTagihan,
      kode_kunjungan:     kode_kunjungan,
      no_rm:              kunjungan.no_rm,
      kode_penjamin:      kode_penjamin || kunjungan.kode_penjamin || null,
      total_tagihan:      totalTagihan,
      status_pembayaran:  "belum_bayar",
      tanggal:            tanggal,
    });

    // -------------------------------------------------------
    // 5. Insert trx_detail_tagihan
    // -------------------------------------------------------
    for (const item of detailItems) {
      await trx("trx_detail_tagihan").insert({
        id:           generateId("DTL"),
        kode_tagihan: kodeTagihan,
        jenis_item:   item.jenis_item,
        nama_item:    item.nama_item,
        qty:          item.qty,
        harga_satuan: item.harga_satuan,
        subtotal:     item.subtotal,
      });
    }

    // -------------------------------------------------------
    // 6. Update status kunjungan → selesai
    // -------------------------------------------------------
    await trx("trx_kunjungan")
      .where("kode_kunjungan", kode_kunjungan)
      .update({
        status_kunjungan: "selesai",
        jam_selesai:      trx.fn.now(),
      });

    // Sync ke trx_antrian jika ada
    if (kunjungan.kode_antrian) {
      await trx("trx_antrian")
        .where("id", kunjungan.kode_antrian)
        .update({ status_panggil: "selesai" });
    }

    return {
      kode_tagihan:  kodeTagihan,
      total_tagihan: totalTagihan,
      jumlah_item:   detailItems.length,
      items:         detailItems,
    };
  };

  // Jalankan dalam transaction yang ada, atau buat yang baru
  if (outerTrx) {
    return execute(outerTrx);
  } else {
    return DB.transaction(execute);
  }
};
