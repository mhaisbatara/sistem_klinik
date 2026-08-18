import { Session } from 'next-auth';
import { RefObject } from 'react';
import { Toast } from 'primereact/toast';

export interface KunjunganItem {
    id: string;
    kode_kunjungan: string;
    kode_antrian: string | null;
    no_rm: string;
    kode_poli: string;
    nama_poli: string | null;
    no_sip: string | null;
    nama_dokter: string | null;
    spesialisasi: string | null;
    kode_penjamin: string | null;
    nama_penjamin: string | null;
    tanggal_kunjungan: string;
    jam_masuk: string | null;
    jam_selesai: string | null;
    keluhan_awal: string | null;
    status_kunjungan: 'menunggu' | 'diperiksa' | 'selesai' | 'batal';
    created_at: string;
    nik: string;
    nama_pasien: string | null;
    jenis_kelamin: string | null;
    tanggal_lahir: string | null;
    no_hp: string | null;
    golongan_darah?: string | null;
    agama?: string | null;
    detail_alamat?: string | null;
}

export interface PemeriksaanVitals {
    id?: string;
    kode_kunjungan: string;
    no_sip?: string | null;
    subjektif?: string | null;
    objektif?: string | null;
    assessment?: string | null;
    plan?: string | null;
    icd10_code?: string | null;
    icd10_deskripsi?: string | null;
    tekanan_darah?: string | null;
    suhu?: number | null;
    nadi?: number | null;
    respirasi?: number | null;
    berat_badan?: number | null;
    tinggi_badan?: number | null;
}

export interface LayananMedisItem {
    id: string;
    kode_layanan: string;
    kode_kunjungan: string;
    no_sip: string | null;
    jenis_layanan: 'konsultasi' | 'tindakan';
    nama_layanan: string;
    qty: number;
    harga: number;
    keterangan: string | null;
    created_at: string;
}

export interface PermintaanLabItem {
    id: string;
    kode_permintaan: string;
    kode_kunjungan: string;
    no_sip: string | null;
    jenis_pemeriksaan: string;
    kode_tarif: string | null;
    tarif: number | null;
    nama_tarif: string | null;
    tanggal_permintaan: string;
    status: 'menunggu' | 'diproses' | 'selesai';
}

export interface ResepItem {
    resep_id: string;
    kode_resep: string;
    tanggal_resep: string;
    catatan: string | null;
    status_dispensing: 'menunggu' | 'diracik' | 'selesai';
    detail_id: string | null;
    kode_obat: string | null;
    nama_obat: string | null;
    satuan: string | null;
    harga_jual: number | null;
    dosis: string | null;
    jumlah: number | null;
    aturan_pakai: string | null;
}

export interface KunjunganDetail {
    kunjungan: KunjunganItem;
    pemeriksaan?: PemeriksaanVitals | null;
    layanan_medis: LayananMedisItem[];
    permintaan_lab: PermintaanLabItem[];
    resep: ResepItem[];
}

export interface State {
    load: boolean;
    loadDetail: boolean;
    data: KunjunganItem[];
    totalData: number;
    page: number;
    rows: number;
    first: number;
    keyword: string;
    sortField: string;
    sortOrder: string;
    selectedPoli: string;
    selectedStatus: string;
    selectedTanggal: string;
    poliOptions: { kode_poli: string; nama_poli: string }[];
    selectedKunjungan: KunjunganItem | null;
    detail: KunjunganDetail | null;
    showDetail: boolean;
    session: Session | null;
}

export interface ComponentProps {
    state: State;
    setState: React.Dispatch<React.SetStateAction<State>>;
    toast: RefObject<Toast>;
    getData?: () => Promise<void>;
    getDetail?: (kodeKunj: string) => Promise<void>;
    onLazyLoad?: (e: any) => void;
}

export const OPT_STATUS_KUNJUNGAN = [
    { label: 'Semua Status', value: '' },
    { label: 'Menunggu',    value: 'menunggu' },
    { label: 'Diperiksa',   value: 'diperiksa' },
    { label: 'Selesai',     value: 'selesai' },
    { label: 'Batal',       value: 'batal' },
];
