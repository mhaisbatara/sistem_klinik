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
    nik: string;
    nama_pasien: string | null;
    jenis_kelamin: string | null;
    tanggal_lahir: string | null;
    no_hp: string | null;
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
    jenis_layanan: 'konsultasi' | 'tindakan';
    nama_layanan: string;
    qty: number;
    harga: number;
    keterangan: string | null;
}

export interface PermintaanLabItem {
    id: string;
    kode_permintaan: string;
    jenis_pemeriksaan: string;
    kode_tarif: string | null;
    tarif: number | null;
    nama_tarif: string | null;
    tanggal_permintaan: string;
    status: 'menunggu' | 'diproses' | 'selesai';
}

export interface TarifOption {
    id: string;
    kode_tarif: string;
    nama_layanan: string;
    tarif: number;
}

export interface ResepDetailItem {
    detail_id: string;
    kode_resep: string;
    kode_obat: string | null;
    nama_obat: string | null;
    satuan: string | null;
    harga_jual: number | null;
    dosis: string | null;
    jumlah: number | null;
    aturan_pakai: string | null;
}

export interface ObatOption {
    kode_obat: string;
    nama_obat: string;
    satuan: string;
    harga_jual: number;
}

export interface State {
    load: boolean;
    loadPemeriksaan: boolean;
    data: KunjunganItem[];
    totalData: number;
    page: number;
    rows: number;
    first: number;
    keyword: string;
    sortField: string;
    sortOrder: string;
    selectedPoli: string;
    poliOptions: { kode_poli: string; nama_poli: string }[];
    showPemeriksaan: boolean;
    activeKunjungan: KunjunganItem | null;

    // Vitals & SOAP
    vitals: PemeriksaanVitals | null;
    loadVitals: boolean;

    // Layanan Medis
    vaLayanan: LayananMedisItem[];
    loadLayanan: boolean;

    // Lab
    vaLab: PermintaanLabItem[];
    tarifOptions: TarifOption[];
    loadLab: boolean;

    // Resep
    vaResep: ResepDetailItem[];
    obatOptions: ObatOption[];
    loadResep: boolean;

    session: Session | null;
}

export interface ComponentProps {
    state: State;
    setState: React.Dispatch<React.SetStateAction<State>>;
    toast: RefObject<Toast>;
    getData?: () => Promise<void>;
    openPemeriksaan?: (k: KunjunganItem) => Promise<void>;
    onLazyLoad?: (e: any) => void;
}
