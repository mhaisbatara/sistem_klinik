/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file 20260816000000_restructure_pasien_and_trx_antrian.js
 * @description Migration script untuk memisahkan biodata mst_pasien dari data kunjungan trx_antrian.
 */

export async function up(knex) {
  return knex.transaction(async (trx) => {
    // 1. Tambahkan kolom kode_dokter pada trx_antrian jika belum ada
    const hasKodeDokter = await trx.schema.hasColumn("trx_antrian", "kode_dokter");
    if (!hasKodeDokter) {
      await trx.schema.alterTable("trx_antrian", (table) => {
        table.string("kode_dokter", 20).nullable().after("kode_penjamin");
      });
    }

    // 2. Migrasi data kunjungan dari mst_pasien ke trx_antrian sebelum menghapus duplikat/kolom
    const hasKodeAntrian = await trx.schema.hasColumn("mst_pasien", "kode_antrian");
    if (hasKodeAntrian) {
      const oldPasienRows = await trx("mst_pasien").select("*");
      for (const row of oldPasienRows) {
        if (row.kode_antrian) {
          const existingTrx = await trx("trx_antrian").where("id", row.kode_antrian).first();
          if (!existingTrx) {
            const tgl = row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
            await trx("trx_antrian").insert({
              id: row.kode_antrian,
              no_antrian: "001",
              no_rm: row.no_rm,
              kode_poli: row.kode_poli || "POL01",
              kode_penjamin: row.kode_penjamin || "",
              kode_dokter: row.kode_dokter || null,
              tanggal: tgl,
              status_panggil: "menunggu",
              created_at: row.created_at || new Date(),
            });
          }
        }
      }
    }

    // 3. Deduplikasi mst_pasien: Pertahankan baris terawal (created_at paling awal), hapus sisanya
    const duplicates = await trx("mst_pasien")
      .select("no_rm")
      .count("no_rm as cnt")
      .groupBy("no_rm")
      .having("cnt", ">", 1);

    for (const dup of duplicates) {
      const rows = await trx("mst_pasien")
        .where("no_rm", dup.no_rm)
        .orderBy("created_at", "asc")
        .orderBy("id", "asc");

      if (rows.length > 1) {
        const keepRow = rows[0];
        const deleteIds = rows.slice(1).map((r) => r.id);
        await trx("mst_pasien").whereIn("id", deleteIds).del();
      }
    }

    // 4. Drop kolom per-kunjungan di mst_pasien jika kolom tersebut ada
    const colsToDrop = ["kode_antrian", "kode_poli", "kode_penjamin", "kode_dokter"];
    for (const col of colsToDrop) {
      const hasCol = await trx.schema.hasColumn("mst_pasien", col);
      if (hasCol) {
        await trx.schema.alterTable("mst_pasien", (table) => {
          table.dropColumn(col);
        });
      }
    }

    // 5. Tambahkan constraint UNIQUE KEY pada no_rm di mst_pasien
    await trx.raw("ALTER TABLE mst_pasien ADD UNIQUE KEY uq_mst_pasien_no_rm (no_rm);");
  });
}

export async function down(knex) {
  return knex.transaction(async (trx) => {
    await trx.raw("ALTER TABLE mst_pasien DROP INDEX uq_mst_pasien_no_rm;");

    await trx.schema.alterTable("mst_pasien", (table) => {
      table.string("kode_antrian", 20).nullable();
      table.string("kode_poli", 20).nullable();
      table.string("kode_penjamin", 20).nullable();
      table.string("kode_dokter", 20).nullable();
    });

    const hasKodeDokter = await trx.schema.hasColumn("trx_antrian", "kode_dokter");
    if (hasKodeDokter) {
      await trx.schema.alterTable("trx_antrian", (table) => {
        table.dropColumn("kode_dokter");
      });
    }
  });
}
