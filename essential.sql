-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.30 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table sistem_klinik.access_token
CREATE TABLE IF NOT EXISTS `access_token` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `user_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `expired` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `expires_at` datetime DEFAULT NULL,
  `datetime` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table sistem_klinik.access_token: ~155 rows (approximately)
DELETE FROM `access_token`;

-- Dumping structure for table sistem_klinik.config
CREATE TABLE IF NOT EXISTS `config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kode` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `keterangan` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `tz` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table sistem_klinik.config: ~6 rows (approximately)
DELETE FROM `config`;
INSERT INTO `config` (`id`, `kode`, `keterangan`, `tz`, `created_at`, `updated_at`) VALUES
	(1, 'msNamaPerusahaan', 'tasdasd', 'UTC', '2026-04-26 11:54:48', '2026-04-26 12:10:34'),
	(2, 'msAlamatPerusahaan', '', 'UTC', '2026-04-26 11:54:48', '2026-04-26 12:10:34'),
	(3, 'msKotaPerusahaan', '', 'UTC', '2026-04-26 11:54:48', '2026-04-26 12:10:34'),
	(4, 'msTeleponPerusahaan', '', 'UTC', '2026-04-26 11:54:48', '2026-04-26 12:10:34'),
	(5, 'msNamaPimpinan', '', 'UTC', '2026-04-26 11:54:48', '2026-04-26 12:10:34'),
	(6, 'msLogoPerusahaan', 'logo_perusahaan.png', 'UTC', '2026-04-26 11:54:48', '2026-04-26 12:10:34');

-- Dumping structure for table sistem_klinik.log
CREATE TABLE IF NOT EXISTS `log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tgl` date DEFAULT NULL,
  `controller` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `function` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `request` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `response` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `stack` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `user` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tz` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `datetime` datetime DEFAULT NULL,
  `datetime_eng` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table sistem_klinik.log: ~4 rows (approximately)
DELETE FROM `log`;

-- Dumping structure for table sistem_klinik.log_perubahan
CREATE TABLE IF NOT EXISTS `log_perubahan` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `aksi` enum('CREATE','UPDATE','DELETE','RESTORE') CHARACTER SET armscii8 COLLATE armscii8_bin NOT NULL,
  `keterangan` varchar(255) NOT NULL,
  `nama_tabel` varchar(50) NOT NULL,
  `kode_referensi` varchar(36) CHARACTER SET armscii8 COLLATE armscii8_bin NOT NULL,
  `data_sebelum` json DEFAULT NULL,
  `data_sesudah` json DEFAULT NULL,
  `tz` varchar(50) DEFAULT 'UTC',
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at_eng` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_log_perubahan_tabel_ref` (`nama_tabel`,`kode_referensi`),
  KEY `idx_log_perubahan_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=279 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table sistem_klinik.log_perubahan: ~0 rows (approximately)
DELETE FROM `log_perubahan`;
INSERT INTO `log_perubahan` (`id`, `aksi`, `keterangan`, `nama_tabel`, `kode_referensi`, `data_sebelum`, `data_sesudah`, `tz`, `created_by`, `created_at`, `created_at_eng`) VALUES
	(277, 'CREATE', 'Tambah Supplier', 'mst_supplier', 'SPL0001', NULL, '{"tz": "Asia/Jakarta", "kode": "SPL0001", "nama": "adasdads", "alamat": "adasasd", "hp_cp_1": null, "hp_cp_2": null, "telepon": "09877812231", "rekening": "123123123", "nama_cp_1": null, "nama_cp_2": null, "plafond_1": 0, "plafond_2": 0, "created_at": "2026-08-03 06:26:29", "created_by": "superadmin@admin.com", "email_cp_1": null, "email_cp_2": null, "updated_at": "2026-08-03 06:26:29", "alamat_cp_1": null, "alamat_cp_2": null, "telepon_cp_1": null, "telepon_cp_2": null, "kode_kategori": "KAT001"}', 'Asia/Jakarta', 'superadmin@admin.com', '2026-08-03 06:26:29', '2026-08-03 13:26:29'),
	(278, 'DELETE', 'Hapus Supplier', 'mst_supplier', 'SPL0001', '{"id": 3, "tz": "Asia/Jakarta", "kode": "SPL0001", "nama": "adasdads", "alamat": "adasasd", "hp_cp_1": null, "hp_cp_2": null, "telepon": "09877812231", "rekening": "123123123", "nama_cp_1": null, "nama_cp_2": null, "plafond_1": "0.00", "plafond_2": "0.00", "created_at": "2026-08-03T06:26:29.000Z", "created_by": "superadmin@admin.com", "email_cp_1": null, "email_cp_2": null, "updated_at": "2026-08-03T06:26:29.000Z", "updated_by": null, "alamat_cp_1": null, "alamat_cp_2": null, "telepon_cp_1": null, "telepon_cp_2": null, "kode_kategori": "KAT001"}', NULL, 'Asia/Jakarta', 'superadmin@admin.com', '2026-08-03 06:26:33', '2026-08-03 13:26:33');

-- Dumping structure for table sistem_klinik.mst_navigation
CREATE TABLE IF NOT EXISTS `mst_navigation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `menu` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tz` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table sistem_klinik.mst_navigation: ~1 rows (approximately)
DELETE FROM `mst_navigation`;
INSERT INTO `mst_navigation` (`id`, `menu`, `role`, `tz`, `created_at`, `updated_at`) VALUES
	(6, '[{"label":"HOME","items":[{"label":"Dashboard","icon":"pi pi-fw pi-home","to":"/dashboard"}]},{"label":"Pelayanan and Antrean","items":[{"label":"Antrian Awal","icon":"pi pi-fw pi-ticket","to":"/antrian-awal"},{"label":"Pendaftaran","icon":"pi pi-fw pi-user-plus","to":"/pendaftaran"},{"label":"Antrian","icon":"pi pi-fw pi-list","to":"/antrian"},{"label":"Display TV","icon":"pi pi-fw pi-desktop","to":"/display-tv"}]},{"label":"Pelayanan Medis","items":[{"label":"Pemeriksaan Dokter","icon":"pi pi-fw pi-user-edit","to":"/pemeriksaan-dokter"},{"label":"Rekam Medis","icon":"pi pi-fw pi-book","to":"/rekam-medis"}]},{"label":"SETUP","items":[{"label":"Users","icon":"pi pi-fw pi-users","to":"/setup/users"},{"label":"Config Perusahaan","icon":"pi pi-fw pi-building","to":"/setup/config"}]}]', 'master', 'UTC', '2026-01-02 16:53:30', NULL);

-- Dumping structure for table sistem_klinik.mst_payment_methods
CREATE TABLE IF NOT EXISTS `mst_payment_methods` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `method_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `method_type` enum('MANUAL_TRANSFER','PG_VA','PG_QRIS','PG_EWALLET','PG_CREDIT_CARD','PG_RETAIL') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `logo_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pg_provider` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pg_channel_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_fee_type` enum('FIXED','PERCENTAGE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FIXED',
  `admin_fee_value` double NOT NULL DEFAULT '0',
  `requires_unique_code` tinyint(1) NOT NULL DEFAULT '0',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `tz` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `method_code` (`method_code`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table sistem_klinik.mst_payment_methods: ~0 rows (approximately)
DELETE FROM `mst_payment_methods`;

-- Dumping structure for table sistem_klinik.mst_shift
CREATE TABLE IF NOT EXISTS `mst_shift` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `kode` varchar(36) CHARACTER SET armscii8 COLLATE armscii8_bin NOT NULL,
  `nama` varchar(255) CHARACTER SET armscii8 COLLATE armscii8_bin NOT NULL,
  `waktu_mulai` time NOT NULL DEFAULT '00:00:00',
  `waktu_selesai` time NOT NULL DEFAULT '00:00:00',
  `status` enum('0','1') CHARACTER SET armscii8 COLLATE armscii8_bin NOT NULL DEFAULT '1',
  `tz` varchar(50) CHARACTER SET armscii8 COLLATE armscii8_bin DEFAULT 'UTC',
  `created_by` varchar(50) CHARACTER SET armscii8 COLLATE armscii8_bin DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_by` varchar(50) CHARACTER SET armscii8 COLLATE armscii8_bin DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_gudang_kode` (`kode`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=armscii8 COLLATE=armscii8_bin ROW_FORMAT=DYNAMIC;

-- Dumping data for table sistem_klinik.mst_shift: ~0 rows (approximately)
DELETE FROM `mst_shift`;

-- Dumping structure for table sistem_klinik.mst_supplier
CREATE TABLE IF NOT EXISTS `mst_supplier` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `kode` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `alamat` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telepon` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kode_kategori` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rekening` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plafond_1` decimal(15,2) DEFAULT '0.00',
  `plafond_2` decimal(15,2) DEFAULT '0.00',
  `nama_cp_1` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_cp_1` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telepon_cp_1` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hp_cp_1` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat_cp_1` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama_cp_2` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_cp_2` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telepon_cp_2` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hp_cp_2` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat_cp_2` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tz` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'UTC',
  `created_by` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_by` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_kode` (`kode`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table sistem_klinik.mst_supplier: ~0 rows (approximately)
DELETE FROM `mst_supplier`;

-- Dumping structure for table sistem_klinik.nomor_faktur
CREATE TABLE IF NOT EXISTS `nomor_faktur` (
  `kode` char(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `id` double DEFAULT NULL,
  PRIMARY KEY (`kode`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table sistem_klinik.nomor_faktur: ~0 rows (approximately)
DELETE FROM `nomor_faktur`;
INSERT INTO `nomor_faktur` (`kode`, `id`) VALUES
	('SPL', 1);

-- Dumping structure for table sistem_klinik.trx_mutasi_gudang_dari
CREATE TABLE IF NOT EXISTS `trx_mutasi_gudang_dari` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `faktur` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `faktur_kirim` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal_transaksi` date DEFAULT NULL,
  `gudang_kirim` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gudang_terima` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kode_barang` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qty` decimal(20,6) DEFAULT NULL,
  `satuan` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `created_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_kirim` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_terima` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tz` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `created_at` datetime DEFAULT NULL,
  `created_at_eng` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Dumping data for table sistem_klinik.trx_mutasi_gudang_dari: ~0 rows (approximately)
DELETE FROM `trx_mutasi_gudang_dari`;
INSERT INTO `trx_mutasi_gudang_dari` (`id`, `faktur`, `faktur_kirim`, `tanggal_transaksi`, `gudang_kirim`, `gudang_terima`, `kode_barang`, `qty`, `satuan`, `status`, `created_by`, `user_kirim`, `user_terima`, `tz`, `created_at`, `created_at_eng`, `updated_at`) VALUES
	(1, 'BA23110001', 'BK23110001', '2026-08-03', 'GDG01', 'GDG02', 'BRG001', 10.000000, 'ZAK', '1', 'admin', 'STF001', 'STF002', 'Asia/Jakarta', '2026-08-03 12:05:47', '2026-08-03 12:05:47', '2026-08-03 12:05:47'),
	(2, 'BA23110001', 'BK23110001', '2026-08-03', 'GDG01', 'GDG02', 'BRG002', 5.000000, 'BATANG', '1', 'admin', 'STF001', 'STF002', 'Asia/Jakarta', '2026-08-03 12:05:47', '2026-08-03 12:05:47', '2026-08-03 12:05:47'),
	(3, 'BA23110003', 'BK23110003', '2026-08-03', 'GDG02', 'GDG03', 'BRG001', 8.000000, 'ZAK', '1', 'admin', 'STF002', 'STF003', 'Asia/Jakarta', '2026-08-03 12:05:47', '2026-08-03 12:05:47', '2026-08-03 12:05:47'),
	(4, 'BA23110003', 'BK23110003', '2026-08-03', 'GDG02', 'GDG03', 'BRG003', 2.000000, 'PAIL', '1', 'admin', 'STF002', 'STF003', 'Asia/Jakarta', '2026-08-03 12:05:47', '2026-08-03 12:05:47', '2026-08-03 12:05:47');

-- Dumping structure for table sistem_klinik.trx_mutasi_gudang_ke
CREATE TABLE IF NOT EXISTS `trx_mutasi_gudang_ke` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `faktur` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal_transaksi` date DEFAULT NULL,
  `gudang_kirim` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gudang_terima` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kode_barang` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qty` decimal(20,6) DEFAULT NULL,
  `satuan` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `created_by` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_kirim` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_terima` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tz` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `created_at` datetime DEFAULT NULL,
  `created_at_eng` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Dumping data for table sistem_klinik.trx_mutasi_gudang_ke: ~0 rows (approximately)
DELETE FROM `trx_mutasi_gudang_ke`;
INSERT INTO `trx_mutasi_gudang_ke` (`id`, `faktur`, `tanggal_transaksi`, `gudang_kirim`, `gudang_terima`, `kode_barang`, `qty`, `satuan`, `status`, `created_by`, `user_kirim`, `user_terima`, `tz`, `created_at`, `created_at_eng`, `updated_at`) VALUES
	(1, 'BK23110001', '2026-08-03', 'GDG01', 'GDG02', 'BRG001', 10.000000, 'ZAK', '1', 'admin', 'STF001', 'STF002', 'Asia/Jakarta', '2026-08-03 12:05:47', '2026-08-03 12:05:47', '2026-08-03 12:05:47'),
	(2, 'BK23110001', '2026-08-03', 'GDG01', 'GDG02', 'BRG002', 5.000000, 'BATANG', '1', 'admin', 'STF001', 'STF002', 'Asia/Jakarta', '2026-08-03 12:05:47', '2026-08-03 12:05:47', '2026-08-03 12:05:47'),
	(3, 'BK23110002', '2026-08-03', 'GDG01', 'GDG03', 'BRG003', 15.000000, 'PAIL', '0', 'admin', 'STF001', 'STF003', 'Asia/Jakarta', '2026-08-03 12:05:47', '2026-08-03 12:05:47', '2026-08-03 12:05:47'),
	(4, 'BK23110003', '2026-08-03', 'GDG02', 'GDG03', 'BRG001', 8.000000, 'ZAK', '1', 'admin', 'STF002', 'STF003', 'Asia/Jakarta', '2026-08-03 12:05:47', '2026-08-03 12:05:47', '2026-08-03 12:05:47'),
	(5, 'BK23110003', '2026-08-03', 'GDG02', 'GDG03', 'BRG003', 2.000000, 'PAIL', '1', 'admin', 'STF002', 'STF003', 'Asia/Jakarta', '2026-08-03 12:05:47', '2026-08-03 12:05:47', '2026-08-03 12:05:47');

-- Dumping structure for table sistem_klinik.user_credential
CREATE TABLE IF NOT EXISTS `user_credential` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_code` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fullname` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telp` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('0','1') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `tz` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `created_at` datetime DEFAULT NULL,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  CONSTRAINT `chk_status` CHECK ((`status` in (_utf8mb4'0',_utf8mb4'1')))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table sistem_klinik.user_credential: ~0 rows (approximately)
DELETE FROM `user_credential`;
INSERT INTO `user_credential` (`id`, `user_code`, `username`, `fullname`, `telp`, `role`, `password`, `status`, `tz`, `created_at`, `created_by`, `updated_by`, `updated_at`) VALUES
	(1, 'USR000000', 'superadmin@admin.com', 'Superadmin', '08100000000', 'superadmin', '5e7bd870d5c8563803be2973dd4403ef50c918d3b728f22787c9514d0f379f94d7f6bbb7e8b0a8cc338a6a18bd399aa8e5888a28b5f91452ad55fd6e2cf0b58c', '1', 'UTC', '2026-01-02 16:50:30', NULL, NULL, '2026-01-02 16:50:30');

-- Dumping structure for table sistem_klinik.user_navigation
CREATE TABLE IF NOT EXISTS `user_navigation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `menu` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `tz` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_user_navigation_uniqueid` (`user_code`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table sistem_klinik.user_navigation: ~1 rows (approximately)
DELETE FROM `user_navigation`;
INSERT INTO `user_navigation` (`id`, `user_code`, `menu`, `tz`, `created_at`, `updated_at`) VALUES
	(1, 'USR000000', '[{"label":"HOME","items":[{"label":"Dashboard","icon":"pi pi-fw pi-home","to":"/dashboard"}]},{"label":"Pelayanan and Antrean","items":[{"label":"Antrian Awal","icon":"pi pi-fw pi-ticket","to":"/antrian-awal"},{"label":"Pendaftaran","icon":"pi pi-fw pi-user-plus","to":"/pendaftaran"},{"label":"Antrian","icon":"pi pi-fw pi-list","to":"/antrian"},{"label":"Display TV","icon":"pi pi-fw pi-desktop","to":"/display-tv"}]},{"label":"Pelayanan Medis","items":[{"label":"Pemeriksaan Dokter","icon":"pi pi-fw pi-user-edit","to":"/pemeriksaan-dokter"},{"label":"Rekam Medis","icon":"pi pi-fw pi-book","to":"/rekam-medis"}]},{"label":"SETUP","items":[{"label":"Users","icon":"pi pi-fw pi-users","to":"/setup/users"},{"label":"Config Perusahaan","icon":"pi pi-fw pi-building","to":"/setup/config"}]}]', 'UTC', '2026-01-02 16:54:16', '2026-01-02 17:17:07');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

