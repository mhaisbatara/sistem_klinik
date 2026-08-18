'use client';

import postData from '@/lib/axios/postData';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { showError } from '@/lib/tools/generalTools';
import { useSession } from 'next-auth/react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';

const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const OPT_METODE = [
    { label: 'Semua Metode', value: '' },
    { label: 'Tunai',    value: 'tunai'    },
    { label: 'QRIS',     value: 'qris'     },
    { label: 'Transfer', value: 'transfer' },
    { label: 'BPJS',     value: 'bpjs'     },
    { label: 'Asuransi', value: 'asuransi' },
];

const Page = () => {
    const toast = useRef<Toast>(null);
    const { data: session } = useSession();

    const [load, setLoad]         = useState(false);
    const [data, setData]         = useState<any[]>([]);
    const [totalData, setTotalData] = useState(0);
    const [totalNominal, setTotalNominal] = useState(0);
    const [rekapMetode, setRekapMetode]   = useState<any[]>([]);
    const [page, setPage]         = useState(1);
    const [rows, setRows]         = useState(10);
    const [first, setFirst]       = useState(0);
    const [keyword, setKeyword]   = useState('');
    const [metode, setMetode]     = useState('');
    const [tanggalMulai, setTanggalMulai]   = useState('');
    const [tanggalSelesai, setTanggalSelesai] = useState('');

    const getData = async () => {
        setLoad(true);
        try {
            const res = await postData('/kasir/pembayaran-data', {
                page, perPage: rows,
                keyword:          keyword   || undefined,
                metode_pembayaran: metode   || undefined,
                tanggal_mulai:    tanggalMulai   || undefined,
                tanggal_selesai:  tanggalSelesai || undefined,
            });
            setData(res.data.data);
            setTotalData(res.data.total_data);
            setTotalNominal(res.data.total_nominal || 0);
            setRekapMetode(res.data.rekap_metode || []);
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memuat data');
        } finally {
            setLoad(false);
        }
    };

    useEffect(() => { getData(); }, [page, rows, keyword, metode, tanggalMulai, tanggalSelesai]); // eslint-disable-line

    const onLazyLoad = (e: any) => {
        setFirst(e.first);
        setRows(e.rows);
        setPage(typeof e.page === 'number' ? e.page + 1 : page);
    };

    const metodeColor: Record<string, string> = {
        tunai: 'success', qris: 'info', transfer: 'warning', bpjs: 'primary', asuransi: 'secondary'
    };

    return (
        <>
            <Toast ref={toast} position="top-right" />

            <div className="card p-0 mb-3">
                <div className="p-4 border-bottom-1 border-300">
                    <h2 className="text-3xl font-bold flex align-items-center gap-2 mb-1">
                        <i className="pi pi-history text-purple-600 text-3xl" />
                        Riwayat Transaksi Kasir
                    </h2>
                    <p className="text-color-secondary">Rekap pembayaran dan dasar tutup shift kasir.</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid mb-3">
                <div className="col-12 md:col-4">
                    <Card className="text-center shadow-1">
                        <div className="text-color-secondary text-sm mb-1">Total Transaksi</div>
                        <div className="text-3xl font-bold text-primary">{totalData}</div>
                    </Card>
                </div>
                <div className="col-12 md:col-4">
                    <Card className="text-center shadow-1">
                        <div className="text-color-secondary text-sm mb-1">Total Nominal</div>
                        <div className="text-2xl font-bold text-green-600">{formatRupiah(totalNominal)}</div>
                    </Card>
                </div>
                <div className="col-12 md:col-4">
                    <Card className="text-center shadow-1">
                        <div className="text-color-secondary text-sm mb-2">Per Metode</div>
                        <div className="flex flex-wrap gap-1 justify-content-center">
                            {rekapMetode.map((r, i) => (
                                <Tag key={i} value={`${r.metode_pembayaran}: ${formatRupiah(r.total)}`}
                                    severity={(metodeColor[r.metode_pembayaran] as any) || 'info'} />
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            <div className="card p-4">
                {/* Filter */}
                <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                    <div className="flex align-items-center gap-2 flex-wrap">
                        <span className="p-input-icon-left">
                            <i className="pi pi-search" />
                            <InputText value={keyword} onChange={e => { setKeyword(e.target.value); setPage(1); }}
                                placeholder="Cari pasien, tagihan..." className="w-15rem" />
                        </span>
                        <Dropdown value={metode} options={OPT_METODE}
                            onChange={e => { setMetode(e.value); setPage(1); }}
                            placeholder="Semua Metode" className="w-12rem" />
                        <Calendar value={tanggalMulai ? new Date(tanggalMulai) : null}
                            onChange={e => { setTanggalMulai(e.value ? new Date(e.value).toISOString().slice(0, 10) : ''); setPage(1); }}
                            dateFormat="dd/mm/yy" placeholder="Dari Tanggal" showIcon showButtonBar className="w-12rem" />
                        <Calendar value={tanggalSelesai ? new Date(tanggalSelesai) : null}
                            onChange={e => { setTanggalSelesai(e.value ? new Date(e.value).toISOString().slice(0, 10) : ''); setPage(1); }}
                            dateFormat="dd/mm/yy" placeholder="Sampai Tanggal" showIcon showButtonBar className="w-12rem" />
                    </div>
                    <Button label="Refresh" icon="pi pi-refresh" severity="secondary" outlined onClick={getData} />
                </div>

                <DataTable value={data} loading={load} lazy paginator
                    first={first} rows={rows} totalRecords={totalData}
                    onPage={onLazyLoad} rowsPerPageOptions={[10, 25, 50]}
                    responsiveLayout="scroll" emptyMessage="Tidak ada data transaksi."
                    className="p-datatable-gridlines text-sm">
                    <Column field="kode_tagihan" header="No. Tagihan" body={(r) => <span className="font-bold text-primary">{r.kode_tagihan}</span>} />
                    <Column header="Pasien" body={(r) => (
                        <div>
                            <span className="font-semibold block">{r.nama_pasien || '—'}</span>
                            <small className="text-color-secondary">RM: {r.no_rm}</small>
                        </div>
                    )} />
                    <Column header="Metode" body={(r) => (
                        <Tag value={r.metode_pembayaran?.toUpperCase()}
                            severity={(metodeColor[r.metode_pembayaran] as any) || 'info'} />
                    )} style={{ width: '100px' }} />
                    <Column header="Jumlah Bayar" body={(r) => <span className="font-bold text-green-700">{formatRupiah(r.jumlah_bayar)}</span>} style={{ width: '140px' }} />
                    <Column field="tanggal_bayar" header="Tgl. Bayar" style={{ width: '120px' }}
                        body={(r) => <span>{r.tanggal_bayar?.slice(0, 10)}</span>} />
                    <Column field="email_kasir" header="Kasir" style={{ width: '160px' }}
                        body={(r) => <small>{r.email_kasir}</small>} />
                </DataTable>
            </div>
        </>
    );
};

export default Page;
