/**
 * @project Sistem Klinik
 * @file 20260818000000_kasir_new_tables.js
 * @description Migration untuk modul Kasir & Keuangan:
 *   1. CREATE mst_tarif_layanan + seed data awal
 *   2. ALTER trx_layanan_medis (tambah kode_tarif, harga_satuan, subtotal)
 *   3. ALTER trx_pembayaran (tambah nilai 'asuransi' ke enum metode_pembayaran)
 */

export async function up(knex) {
  return knex.transaction(async (trx) => {

    // ========================================================
    // 1. CREATE mst_tarif_layanan (idempotent)
    // ========================================================
    const hasTarifTable = await trx.schema.hasTable("mst_tarif_layanan");
    if (!hasTarifTable) {
      await trx.schema.createTable("mst_tarif_layanan", (table) => {
        table.string("kode_tarif", 20).notNullable().primary();
        table.string("nama_layanan", 255).notNullable();
        table.enu("kategori", ["konsultasi", "tindakan", "lab"]).notNullable();
        table.string("kode_poli", 20).nullable();
        table.decimal("harga", 15, 2).defaultTo(0);
        table.enu("status", ["1", "0"]).defaultTo("1");
        table.datetime("created_at").defaultTo(trx.fn.now());
        table.datetime("updated_at").defaultTo(trx.fn.now());
      });

      // Seed data awal — konsultasi per poli
      const poliList = await trx("mst_poli").select("kode_poli", "nama_poli");

      const tarifSeed = [];
      // Tarif konsultasi umum (tanpa spesifik poli)
      tarifSeed.push({
        kode_tarif: "TAR-KON-UMUM",
        nama_layanan: "Konsultasi Umum",
        kategori: "konsultasi",
        kode_poli: null,
        harga: 50000,
        status: "1",
      });

      // Tarif konsultasi per poli
      for (let i = 0; i < poliList.length; i++) {
        const poli = poliList[i];
        const kode = `TAR-KON-${String(i + 1).padStart(3, "0")}`;
        tarifSeed.push({
          kode_tarif: kode,
          nama_layanan: `Konsultasi ${poli.nama_poli}`,
          kategori: "konsultasi",
          kode_poli: poli.kode_poli,
          harga: 75000,
          status: "1",
        });
      }

      // Tarif lab umum
      const labTarifs = [
        { kode_tarif: "TAR-LAB-001", nama_layanan: "Darah Lengkap",       harga: 85000  },
        { kode_tarif: "TAR-LAB-002", nama_layanan: "Urine Lengkap",       harga: 45000  },
        { kode_tarif: "TAR-LAB-003", nama_layanan: "Gula Darah Sewaktu",  harga: 35000  },
        { kode_tarif: "TAR-LAB-004", nama_layanan: "Gula Darah Puasa",    harga: 35000  },
        { kode_tarif: "TAR-LAB-005", nama_layanan: "Kolesterol Total",    harga: 55000  },
        { kode_tarif: "TAR-LAB-006", nama_layanan: "Asam Urat",           harga: 40000  },
        { kode_tarif: "TAR-LAB-007", nama_layanan: "Fungsi Ginjal (Ureum/Kreatinin)", harga: 75000 },
        { kode_tarif: "TAR-LAB-008", nama_layanan: "Fungsi Hati (SGOT/SGPT)",         harga: 90000 },
        { kode_tarif: "TAR-LAB-009", nama_layanan: "HbA1c",               harga: 120000 },
        { kode_tarif: "TAR-LAB-010", nama_layanan: "Widal",               harga: 60000  },
      ];
      for (const lab of labTarifs) {
        tarifSeed.push({ ...lab, kategori: "lab", kode_poli: null, status: "1" });
      }

      // Tarif tindakan umum
      const tindakanTarifs = [
        { kode_tarif: "TAR-TND-001", nama_layanan: "Injeksi / Suntik",    harga: 30000  },
        { kode_tarif: "TAR-TND-002", nama_layanan: "Pemasangan Infus",    harga: 75000  },
        { kode_tarif: "TAR-TND-003", nama_layanan: "Rawat Luka Kecil",    harga: 50000  },
        { kode_tarif: "TAR-TND-004", nama_layanan: "Rawat Luka Besar",    harga: 100000 },
        { kode_tarif: "TAR-TND-005", nama_layanan: "EKG",                 harga: 80000  },
        { kode_tarif: "TAR-TND-006", nama_layanan: "Nebulizer",           harga: 60000  },
      ];
      for (const tnd of tindakanTarifs) {
        tarifSeed.push({ ...tnd, kategori: "tindakan", kode_poli: null, status: "1" });
      }

      if (tarifSeed.length > 0) {
        await trx("mst_tarif_layanan").insert(tarifSeed);
      }
    }

    // ========================================================
    // 2. ALTER trx_layanan_medis — tambah kolom baru (idempotent)
    // ========================================================
    const hasLayananTable = await trx.schema.hasTable("trx_layanan_medis");
    if (hasLayananTable) {
      const hasKodeTarif    = await trx.schema.hasColumn("trx_layanan_medis", "kode_tarif");
      const hasHargaSatuan  = await trx.schema.hasColumn("trx_layanan_medis", "harga_satuan");
      const hasSubtotal     = await trx.schema.hasColumn("trx_layanan_medis", "subtotal");

      await trx.schema.alterTable("trx_layanan_medis", (table) => {
        if (!hasKodeTarif)   table.string("kode_tarif", 20).nullable().after("kode_kunjungan");
        if (!hasHargaSatuan) table.decimal("harga_satuan", 15, 2).defaultTo(0).after("qty");
        if (!hasSubtotal)    table.decimal("subtotal", 15, 2).defaultTo(0).after("harga_satuan");
      });

      // Migrate data lama: isi harga_satuan & subtotal dari kolom harga yang sudah ada
      const hasHarga = await trx.schema.hasColumn("trx_layanan_medis", "harga");
      if (hasHarga) {
        await trx.raw(`
          UPDATE trx_layanan_medis
          SET
            harga_satuan = COALESCE(harga_satuan, 0) + CASE WHEN harga_satuan = 0 THEN COALESCE(harga, 0) ELSE 0 END,
            subtotal     = CASE WHEN subtotal = 0 THEN COALESCE(harga, 0) * COALESCE(qty, 1) ELSE subtotal END
        `);
      }
    }

    // ========================================================
    // 3. ALTER trx_pembayaran — tambah 'asuransi' ke enum (idempotent)
    // ========================================================
    const hasPembayaranTable = await trx.schema.hasTable("trx_pembayaran");
    if (hasPembayaranTable) {
      // MySQL: modifikasi enum langsung via raw
      // Cek apakah 'asuransi' sudah ada di enum
      const [colInfo] = await trx.raw(`
        SELECT COLUMN_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'trx_pembayaran'
          AND COLUMN_NAME  = 'metode_pembayaran'
      `);
      const colType = colInfo?.[0]?.COLUMN_TYPE || "";
      if (!colType.includes("asuransi")) {
        await trx.raw(`
          ALTER TABLE trx_pembayaran
          MODIFY COLUMN metode_pembayaran
            ENUM('tunai','qris','transfer','bpjs','asuransi')
            NOT NULL DEFAULT 'tunai'
        `);
      }
    }

  }); // end transaction
}

export async function down(knex) {
  return knex.transaction(async (trx) => {

    // Revert ALTER trx_pembayaran (hapus 'asuransi')
    const hasPembayaran = await trx.schema.hasTable("trx_pembayaran");
    if (hasPembayaran) {
      await trx.raw(`
        ALTER TABLE trx_pembayaran
        MODIFY COLUMN metode_pembayaran
          ENUM('tunai','qris','transfer','bpjs')
          NOT NULL DEFAULT 'tunai'
      `);
    }

    // Revert kolom tambahan di trx_layanan_medis
    const hasLayanan = await trx.schema.hasTable("trx_layanan_medis");
    if (hasLayanan) {
      const hasKodeTarif   = await trx.schema.hasColumn("trx_layanan_medis", "kode_tarif");
      const hasHargaSatuan = await trx.schema.hasColumn("trx_layanan_medis", "harga_satuan");
      const hasSubtotal    = await trx.schema.hasColumn("trx_layanan_medis", "subtotal");
      await trx.schema.alterTable("trx_layanan_medis", (table) => {
        if (hasSubtotal)    table.dropColumn("subtotal");
        if (hasHargaSatuan) table.dropColumn("harga_satuan");
        if (hasKodeTarif)   table.dropColumn("kode_tarif");
      });
    }

    // Drop mst_tarif_layanan
    await trx.schema.dropTableIfExists("mst_tarif_layanan");
  });
}
