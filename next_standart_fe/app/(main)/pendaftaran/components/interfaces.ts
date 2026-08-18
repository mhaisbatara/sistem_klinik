import { Session } from 'next-auth';
import { Toast } from 'primereact/toast';
import { RefObject } from 'react';

// ─── Dropdown option types ────────────────────────────────────────────────────
export interface AntrianOption {
    kode_antrian: string;
    no_antrian: string;
    status: string;
}

export interface DokterOption {
    id: string;
    nama_dokter: string;
    spesialisasi: string | null;
}

export interface PenjaminOption {
    kode_penjamin: string;
    nama_penjamin: string;
    jenis: string;
}

export interface PoliOption {
    kode_poli: string;
    nama_poli: string;
}

export interface WilayahOption {
    id: string;
    nama: string;
}

export interface PasienResult {
    no_rm: string;
    nik: string;
    nama_pasien: string;
    tanggal_lahir: string | null;
    jenis_kelamin: string | null;
    no_hp: string | null;
    email: string;
    kode_penjamin: string | null;
    kode_dokter: string | null;
    kode_poli: string | null;
    nama_ibu_kandung: string | null;
    tempat_lahir: string | null;
    golongan_darah: string | null;
    agama: string | null;
    status_perkawinan: string | null;
    pekerjaan: string | null;
    pendidikan: string | null;
    kewarganegaraan: string | null;
    provinsi: string | null;
    kota_kabupaten: string | null;
    kecamatan: string | null;
    kelurahan: string | null;
    detail_alamat: string;
    kode_pos: string | null;
}

// ─── Form values ─────────────────────────────────────────────────────────────
export interface FormBaru {
    kode_poli: string;       // wajib — poli tujuan kunjungan ini
    nik: string;
    nama_pasien: string;
    email: string;
    detail_alamat: string;
    nama_ibu_kandung: string;
    tanggal_lahir: string;
    tempat_lahir: string;
    jenis_kelamin: string;
    golongan_darah: string;
    agama: string;
    status_perkawinan: string;
    pekerjaan: string;
    pendidikan: string;
    kewarganegaraan: string;
    id_provinsi: string;
    provinsi: string;
    id_kabupaten: string;
    kota_kabupaten: string;
    id_kecamatan: string;
    kecamatan: string;
    id_kelurahan: string;
    kelurahan: string;
    kode_pos: string;
    no_hp: string;
    kode_penjamin: string;
    kode_dokter: string;
    tz: string;
}

export interface FormLama {
    no_rm: string;
    kode_poli: string;       // wajib — bisa berbeda dari kunjungan sebelumnya
    kode_penjamin: string;   // bisa berubah per kunjungan
    kode_dokter: string;
    tz: string;
}

// ─── Page State ───────────────────────────────────────────────────────────────
export interface State {
    load: boolean;
    loadAntrian: boolean;   // untuk badge antrian loket di header
    loadDokter: boolean;
    loadPenjamin: boolean;
    loadPoli: boolean;
    loadSearch: boolean;
    activeTab: number;
    session: Session | null;
    antrianOptions: AntrianOption[];  // untuk badge info di header saja
    dokterOptions: DokterOption[];
    penjaminOptions: PenjaminOption[];
    poliOptions: PoliOption[];
    // Pasien Lama
    searchQuery: string;
    searchResults: PasienResult[];
    selectedPasien: PasienResult | null;
}

// ─── Component Props ──────────────────────────────────────────────────────────
export interface FormBaruProps {
    state: State;
    setState: React.Dispatch<React.SetStateAction<State>>;
    toast: RefObject<Toast>;
}

export interface FormLamaProps {
    state: State;
    setState: React.Dispatch<React.SetStateAction<State>>;
    toast: RefObject<Toast>;
}

// ─── Static options ───────────────────────────────────────────────────────────
export const OPT_JENIS_KELAMIN = [
    { label: 'Laki-laki', value: 'L' },
    { label: 'Perempuan', value: 'P' },
];

export const OPT_GOLONGAN_DARAH = [
    { label: 'A', value: 'A' },
    { label: 'B', value: 'B' },
    { label: 'AB', value: 'AB' },
    { label: 'O', value: 'O' },
    { label: 'Tidak Diketahui', value: '-' },
];

export const OPT_STATUS_KAWIN = [
    { label: 'Belum Kawin', value: 'Belum Kawin' },
    { label: 'Kawin', value: 'Kawin' },
    { label: 'Cerai Hidup', value: 'Cerai Hidup' },
    { label: 'Cerai Mati', value: 'Cerai Mati' },
];

export const OPT_AGAMA = [
    { label: 'Islam', value: 'Islam' },
    { label: 'Kristen', value: 'Kristen' },
    { label: 'Katolik', value: 'Katolik' },
    { label: 'Hindu', value: 'Hindu' },
    { label: 'Buddha', value: 'Buddha' },
    { label: 'Konghucu', value: 'Konghucu' },
    { label: 'Lainnya', value: 'Lainnya' },
];

export const OPT_PEKERJAAN = [
    { label: 'Pegawai Negeri Sipil (PNS)', value: 'Pegawai Negeri Sipil (PNS)' },
    { label: 'TNI / Polri', value: 'TNI / Polri' },
    { label: 'Pegawai Swasta', value: 'Pegawai Swasta' },
    { label: 'Wiraswasta / Wirausaha', value: 'Wiraswasta / Wirausaha' },
    { label: 'Pedagang', value: 'Pedagang' },
    { label: 'Petani', value: 'Petani' },
    { label: 'Nelayan', value: 'Nelayan' },
    { label: 'Buruh', value: 'Buruh' },
    { label: 'Karyawan BUMN / BUMD', value: 'Karyawan BUMN / BUMD' },
    { label: 'Dokter', value: 'Dokter' },
    { label: 'Bidan / Perawat', value: 'Bidan / Perawat' },
    { label: 'Tenaga Kesehatan Lainnya', value: 'Tenaga Kesehatan Lainnya' },
    { label: 'Guru / Dosen', value: 'Guru / Dosen' },
    { label: 'Pengacara / Notaris', value: 'Pengacara / Notaris' },
    { label: 'Akuntan', value: 'Akuntan' },
    { label: 'Arsitek / Insinyur', value: 'Arsitek / Insinyur' },
    { label: 'Programmer / IT', value: 'Programmer / IT' },
    { label: 'Seniman / Kreator Konten', value: 'Seniman / Kreator Konten' },
    { label: 'Ibu Rumah Tangga', value: 'Ibu Rumah Tangga' },
    { label: 'Pelajar / Mahasiswa', value: 'Pelajar / Mahasiswa' },
    { label: 'Pensiunan', value: 'Pensiunan' },
    { label: 'Tidak Bekerja', value: 'Tidak Bekerja' },
    { label: 'Lainnya', value: 'Lainnya' },
];

export const OPT_PENDIDIKAN = [
    { label: 'Tidak Sekolah', value: 'Tidak Sekolah' },
    { label: 'SD / Sederajat', value: 'SD / Sederajat' },
    { label: 'SMP / Sederajat', value: 'SMP / Sederajat' },
    { label: 'SMA / SMK / Sederajat', value: 'SMA / SMK / Sederajat' },
    { label: 'D1 / D2', value: 'D1 / D2' },
    { label: 'D3 / Diploma', value: 'D3 / Diploma' },
    { label: 'S1 / D4', value: 'S1 / D4' },
    { label: 'S2 / Magister', value: 'S2 / Magister' },
    { label: 'S3 / Doktor', value: 'S3 / Doktor' },
    { label: 'Lainnya', value: 'Lainnya' },
];
