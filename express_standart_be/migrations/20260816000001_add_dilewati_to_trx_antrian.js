/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Sistem Klinik
 * @file 20260816000001_add_dilewati_to_trx_antrian.js
 * @description Migration script untuk menambahkan status 'dilewati' pada status_panggil di trx_antrian.
 */

export async function up(knex) {
  return knex.raw(`
    ALTER TABLE trx_antrian 
    MODIFY COLUMN status_panggil ENUM('menunggu', 'dipanggil', 'selesai', 'dilewati') 
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci 
    DEFAULT 'menunggu';
  `);
}

export async function down(knex) {
  return knex.raw(`
    ALTER TABLE trx_antrian 
    MODIFY COLUMN status_panggil ENUM('menunggu', 'dipanggil', 'selesai') 
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci 
    DEFAULT 'menunggu';
  `);
}
