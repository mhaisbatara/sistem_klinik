import { Session } from 'next-auth';
import { Toast } from 'primereact/toast';
import { RefObject } from 'react';

export interface PoliOption {
    kode_poli: string;
    nama_poli: string;
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

export interface AntrianItem {
    id: string;
    no_antrian: string;
    no_rm: string;
    kode_poli: string;
    nama_poli: string | null;
    kode_penjamin: string | null;
    nama_penjamin: string | null;
    kode_dokter: string | null;
    nama_dokter: string | null;
    spesialisasi: string | null;
    tanggal: string;
    status_panggil: 'menunggu' | 'dipanggil' | 'selesai' | 'dilewati';
    created_at: string;
    nik: string;
    nama_pasien: string;
    jenis_kelamin: string | null;
    tanggal_lahir: string | null;
    no_hp: string | null;
    email: string | null;
}

export interface MasterPoliItem {
    id: string;
    kode_poli: string;
    nama_poli: string;
}

export interface initValue {
    id?: string;
    no_rm: string;
    kode_poli: string;
    kode_penjamin: string;
    kode_dokter: string;
    tanggal: string;
    status_panggil?: string;
    tz?: string;
}

export interface FormMasterPoliValue {
    id?: string;
    kode_poli: string;
    nama_poli: string;
    tz?: string;
}

export interface State {
    load: boolean;
    loadGrid: boolean;
    loadPoli: boolean;
    loadDokter: boolean;
    loadPenjamin: boolean;
    loadMasterPoli: boolean;
    data: AntrianItem[];
    gridData: AntrianItem[];
    masterPoliData: MasterPoliItem[];
    poliOptions: PoliOption[];
    dokterOptions: DokterOption[];
    penjaminOptions: PenjaminOption[];
    selectedPoli: string;        // Filter poli aktif di grid panggil & table
    selectedStatusFilter: string; // Filter status panggil ('', 'menunggu', 'dipanggil', 'dilewati', 'selesai')
    selectedDateFilter: string;   // Filter tanggal antrian (default hari ini)
    add: boolean;
    edit: boolean;
    delete: boolean;
    reset: boolean;

    // Master Poli Modal State
    addMasterPoli: boolean;
    editMasterPoli: boolean;
    deleteMasterPoli: boolean;
    selectedMasterPoli: MasterPoliItem | null;

    selectedDatas: AntrianItem[];
    searchVal: string;
    filters: any;
    session: Session | null;
    submittedData: initValue | null;
    first: number;
    rows: number;
    page: number;
    keyword: string;
    totalData: number;
    sortField: string;
    sortOrder: string;
    activeTab: number;

    // Pagination Master Poli
    masterPoliFirst: number;
    masterPoliRows: number;
    masterPoliPage: number;
    masterPoliKeyword: string;
    masterPoliTotalData: number;
    masterPoliSortField: string;
    masterPoliSortOrder: string;
}

export interface ComponentProps {
    state: State;
    setState: React.Dispatch<React.SetStateAction<State>>;
    toast: RefObject<Toast>;
    getData?: (endpoint: string) => Promise<void>;
    getGridData?: () => Promise<void>;
    getMasterPoliData?: () => Promise<void>;
    formik?: any;
    formikMasterPoli?: any;
    onLazyLoad?: (e: any) => void;
    onLazyLoadMasterPoli?: (e: any) => void;
}

export const OPT_STATUS_PANGGIL = [
    { label: 'Semua Status', value: '' },
    { label: 'Menunggu', value: 'menunggu' },
    { label: 'Dipanggil', value: 'dipanggil' },
    { label: 'Dilewati', value: 'dilewati' },
    { label: 'Selesai', value: 'selesai' },
];
