import { Session } from 'next-auth';

export type StatusPembayaran = 'belum_bayar' | 'sebagian' | 'lunas';
export type MetodePembayaran = 'tunai' | 'qris' | 'transfer' | 'bpjs' | 'asuransi';

export interface TagihanItem {
    kode_tagihan:       string;
    kode_kunjungan:     string;
    no_rm:              string;
    kode_penjamin:      string | null;
    nama_penjamin:      string | null;
    total_tagihan:      number;
    status_pembayaran:  StatusPembayaran;
    tanggal:            string;
    nama_pasien:        string | null;
    nik:                string;
    no_hp:              string | null;
    tanggal_kunjungan:  string | null;
    nama_poli:          string | null;
    nama_dokter:        string | null;
    total_dibayar:      number;
}

export interface DetailItem {
    id:           number;
    kode_tagihan: string;
    jenis_item:   'konsultasi' | 'tindakan' | 'obat' | 'lab';
    nama_item:    string;
    qty:          number;
    harga_satuan: number;
    subtotal:     number;
}

export interface PembayaranRecord {
    id:                number;
    kode_tagihan:      string;
    metode_pembayaran: MetodePembayaran;
    jumlah_bayar:      number;
    tanggal_bayar:     string;
    email_kasir:       string;
}

export interface TagihanDetail {
    tagihan:       TagihanItem;
    detail_items:  DetailItem[];
    pembayaran:    PembayaranRecord[];
    total_dibayar: number;
    sisa_tagihan:  number;
}

export interface State {
    load:              boolean;
    loadDetail:        boolean;
    loadBayar:         boolean;
    loadRegenerate:    boolean;
    data:              TagihanItem[];
    totalData:         number;
    page:              number;
    rows:              number;
    first:             number;
    keyword:           string;
    sortField:         string;
    sortOrder:         string;
    selectedStatus:    string;
    selectedTanggal:   string;
    selectedTagihan:   TagihanItem | null;
    detail:            TagihanDetail | null;
    showDetail:        boolean;
    showBayar:         boolean;
    showKwitansiModal: boolean;
    loadKwitansi:      boolean;
    kwitansiData:      any | null;
    // Form pembayaran
    formMetode:        MetodePembayaran | '';
    formNominal:       number | '';
    session:           Session | null;
}

export interface ComponentProps {
    state:            State;
    setState:         React.Dispatch<React.SetStateAction<State>>;
    toast:            React.RefObject<any>;
    getData?:         () => Promise<void>;
    getDetail?:       (kode: string) => Promise<void>;
    onBayar?:         () => Promise<void>;
    onRegenerate?:    (kode: string) => Promise<void>;
    onPrintKwitansi?: (kodeTagihan: string) => Promise<void>;
    onLazyLoad?:      (e: any) => void;
}

export const OPT_STATUS_PEMBAYARAN = [
    { label: 'Semua Status', value: '' },
    { label: 'Belum Bayar',  value: 'belum_bayar' },
    { label: 'Sebagian',     value: 'sebagian' },
    { label: 'Lunas',        value: 'lunas' },
];

export const OPT_METODE_PEMBAYARAN = [
    { label: 'Tunai',     value: 'tunai' },
    { label: 'QRIS',      value: 'qris' },
    { label: 'Transfer',  value: 'transfer' },
    { label: 'BPJS',      value: 'bpjs' },
    { label: 'Asuransi',  value: 'asuransi' },
];

export const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
