'use client';

import postData from '@/lib/axios/postData';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { showError } from '@/lib/tools/generalTools';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';

const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const Page = () => {
    const toast = useRef<Toast>(null);
    const [load, setLoad]                     = useState(false);
    const [tanggalMulai, setTanggalMulai]     = useState('');
    const [tanggalSelesai, setTanggalSelesai] = useState('');
    const [summary, setSummary]     = useState({ total_pendapatan: 0, total_pengeluaran: 0, laba_rugi: 0, status_laba_rugi: 'laba' });
    const [pendapatan, setPendapatan] = useState<any[]>([]);
    const [pengeluaran, setPengeluaran] = useState<any[]>([]);
    const [trendBulanan, setTrendBulanan] = useState<any[]>([]);

    const getData = async () => {
        setLoad(true);
        try {
            const res = await postData('/keuangan/laporan-laba-rugi', {
                tanggal_mulai:   tanggalMulai   || undefined,
                tanggal_selesai: tanggalSelesai || undefined,
            });
            const d = res.data.data;
            setSummary(d.summary || { total_pendapatan: 0, total_pengeluaran: 0, laba_rugi: 0, status_laba_rugi: 'laba' });
            setPendapatan(d.pendapatan || []);
            setPengeluaran(d.pengeluaran || []);
            setTrendBulanan(d.trend_bulanan || []);
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memuat laporan');
        } finally {
            setLoad(false);
        }
    };

    useEffect(() => { getData(); }, []); // eslint-disable-line

    return (
        <>
            <Toast ref={toast} position="top-right" />

            <div className="card p-0 mb-3">
                <div className="p-4 border-bottom-1 border-300">
                    <h2 className="text-3xl font-bold flex align-items-center gap-2 mb-1">
                        <i className="pi pi-chart-line text-orange-600 text-3xl" />
                        Laporan Laba-Rugi
                    </h2>
                    <p className="text-color-secondary">Breakdown pendapatan vs pengeluaran per kategori dan periode.</p>
                </div>
            </div>

            {/* Filter */}
            <div className="card p-3 mb-3">
                <div className="flex flex-wrap align-items-center gap-3">
                    <Calendar value={tanggalMulai ? new Date(tanggalMulai) : null}
                        onChange={e => setTanggalMulai(e.value ? new Date(e.value).toISOString().slice(0, 10) : '')}
                        dateFormat="dd/mm/yy" placeholder="Dari Tanggal" showIcon showButtonBar className="w-12rem" />
                    <Calendar value={tanggalSelesai ? new Date(tanggalSelesai) : null}
                        onChange={e => setTanggalSelesai(e.value ? new Date(e.value).toISOString().slice(0, 10) : '')}
                        dateFormat="dd/mm/yy" placeholder="Sampai Tanggal" showIcon showButtonBar className="w-12rem" />
                    <Button label="Terapkan" icon="pi pi-search" onClick={getData} loading={load} />
                    <Button label="Reset" icon="pi pi-times" severity="secondary" outlined
                        onClick={() => { setTanggalMulai(''); setTanggalSelesai(''); }} />
                </div>
            </div>

            {/* Summary */}
            <div className="grid mb-3">
                <div className="col-12 md:col-4">
                    <Card className="text-center shadow-2 border-left-3 border-green-500">
                        <div className="text-sm text-color-secondary mb-1">Total Pendapatan</div>
                        <div className="text-2xl font-bold text-green-700">{formatRupiah(summary.total_pendapatan)}</div>
                    </Card>
                </div>
                <div className="col-12 md:col-4">
                    <Card className="text-center shadow-2 border-left-3 border-red-500">
                        <div className="text-sm text-color-secondary mb-1">Total Pengeluaran</div>
                        <div className="text-2xl font-bold text-red-700">{formatRupiah(summary.total_pengeluaran)}</div>
                    </Card>
                </div>
                <div className="col-12 md:col-4">
                    <Card className={`text-center shadow-2 border-left-3 ${summary.laba_rugi >= 0 ? 'border-blue-500' : 'border-red-700'}`}>
                        <div className="text-sm text-color-secondary mb-1">
                            <Tag value={summary.status_laba_rugi.toUpperCase()} severity={summary.laba_rugi >= 0 ? 'success' : 'danger'} className="mr-1" />
                        </div>
                        <div className={`text-2xl font-bold ${summary.laba_rugi >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                            {formatRupiah(Math.abs(summary.laba_rugi))}
                        </div>
                    </Card>
                </div>
            </div>

            <div className="grid">
                {/* Pendapatan per Kategori */}
                <div className="col-12 md:col-6">
                    <div className="card p-4">
                        <h3 className="font-bold text-lg mb-3 text-green-700">
                            <i className="pi pi-arrow-up mr-2" />Pendapatan per Kategori
                        </h3>
                        <DataTable value={pendapatan} loading={load} emptyMessage="Tidak ada data."
                            responsiveLayout="scroll" className="text-sm">
                            <Column field="kategori" header="Kategori" />
                            <Column header="Jumlah Trx" field="jumlah_transaksi" style={{ width: '90px' }} />
                            <Column header="Total" body={(r) => <span className="font-bold text-green-700">{formatRupiah(r.total)}</span>} />
                        </DataTable>
                    </div>
                </div>

                {/* Pengeluaran per Kategori */}
                <div className="col-12 md:col-6">
                    <div className="card p-4">
                        <h3 className="font-bold text-lg mb-3 text-red-700">
                            <i className="pi pi-arrow-down mr-2" />Pengeluaran per Kategori
                        </h3>
                        <DataTable value={pengeluaran} loading={load} emptyMessage="Tidak ada data."
                            responsiveLayout="scroll" className="text-sm">
                            <Column field="kategori" header="Kategori" />
                            <Column header="Jumlah Trx" field="jumlah_transaksi" style={{ width: '90px' }} />
                            <Column header="Total" body={(r) => <span className="font-bold text-red-700">{formatRupiah(r.total)}</span>} />
                        </DataTable>
                    </div>
                </div>

                {/* Trend Bulanan */}
                <div className="col-12">
                    <div className="card p-4">
                        <h3 className="font-bold text-lg mb-3">Trend Bulanan</h3>
                        <DataTable value={trendBulanan} loading={load} emptyMessage="Tidak ada data."
                            responsiveLayout="scroll" className="text-sm">
                            <Column field="bulan" header="Bulan" style={{ width: '120px' }} />
                            <Column header="Pendapatan" body={(r) => <span className="text-green-700 font-semibold">{formatRupiah(r.pendapatan)}</span>} />
                            <Column header="Pengeluaran" body={(r) => <span className="text-red-700 font-semibold">{formatRupiah(r.pengeluaran)}</span>} />
                            <Column header="Laba/Rugi" body={(r) => (
                                <span className={`font-bold ${r.laba_rugi >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                                    {r.laba_rugi >= 0 ? '+' : ''}{formatRupiah(r.laba_rugi)}
                                </span>
                            )} />
                        </DataTable>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Page;
