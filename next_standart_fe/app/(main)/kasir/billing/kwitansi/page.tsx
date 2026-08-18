'use client';

import postData from '@/lib/axios/postData';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';

const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

const KwitansiPage = () => {
    const searchParams = useSearchParams();
    const kodeTagihan  = searchParams.get('kode_tagihan') || '';
    const [data, setData]   = useState<any>(null);
    const [load, setLoad]   = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!kodeTagihan) { setError('Kode tagihan tidak ditemukan'); setLoad(false); return; }
        postData('/kasir/kwitansi-print', { kode_tagihan: kodeTagihan })
            .then(res => setData(res.data.data))
            .catch(() => setError('Gagal memuat data kwitansi'))
            .finally(() => setLoad(false));
    }, [kodeTagihan]);

    if (load) return (
        <div className="flex justify-content-center align-items-center h-screen">
            <i className="pi pi-spinner pi-spin text-4xl text-primary" />
        </div>
    );
    if (error) return (
        <div className="flex justify-content-center align-items-center h-screen text-red-500">
            <div className="text-center">
                <i className="pi pi-exclamation-circle text-4xl mb-3 block" />
                <p>{error}</p>
            </div>
        </div>
    );
    if (!data) return null;

    const { klinik, tagihan, detail_items, pembayaran, total_dibayar, sisa_tagihan, tanggal_cetak } = data;

    return (
        <div className="min-h-screen bg-gray-100 flex justify-content-center py-4">
            <div className="bg-white shadow-lg" style={{ width: '400px', padding: '24px', fontFamily: 'monospace' }}>
                {/* Tombol cetak (tidak ikut tercetak) */}
                <div className="flex gap-2 mb-4 no-print">
                    <Button label="Cetak" icon="pi pi-print" onClick={() => window.print()} size="small" />
                    <Button label="Tutup" icon="pi pi-times" severity="secondary" outlined onClick={() => window.close()} size="small" />
                </div>

                {/* Header Klinik */}
                <div className="text-center mb-3">
                    <h3 className="font-bold text-lg m-0">{klinik.nama || 'KLINIK'}</h3>
                    <p className="text-sm text-color-secondary m-0">{klinik.alamat}</p>
                    {klinik.telepon && <p className="text-sm m-0">Telp: {klinik.telepon}</p>}
                </div>

                <Divider style={{ borderTop: '2px dashed #ccc' }} />
                <p className="text-center font-bold text-lg mb-2">KWITANSI PEMBAYARAN</p>

                {/* Info Tagihan */}
                <div className="text-sm mb-3">
                    <div className="flex justify-content-between mb-1">
                        <span>No. Tagihan</span>
                        <span className="font-bold">{tagihan.kode_tagihan}</span>
                    </div>
                    <div className="flex justify-content-between mb-1">
                        <span>Pasien</span>
                        <span>{tagihan.nama_pasien}</span>
                    </div>
                    <div className="flex justify-content-between mb-1">
                        <span>No. RM</span>
                        <span>{tagihan.no_rm}</span>
                    </div>
                    <div className="flex justify-content-between mb-1">
                        <span>Penjamin</span>
                        <span>{tagihan.nama_penjamin || 'Umum'}</span>
                    </div>
                    <div className="flex justify-content-between mb-1">
                        <span>Tgl. Kunjungan</span>
                        <span>{tagihan.tanggal_kunjungan?.slice(0, 10)}</span>
                    </div>
                </div>

                <Divider style={{ borderTop: '1px dashed #ccc' }} />

                {/* Detail Item */}
                <p className="font-bold text-sm mb-1">Rincian:</p>
                {detail_items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-content-between text-sm mb-1">
                        <div>
                            <span className="text-color-secondary text-xs">[{item.jenis_item}]</span> {item.nama_item} x{item.qty}
                        </div>
                        <span>{formatRupiah(item.subtotal)}</span>
                    </div>
                ))}

                <Divider style={{ borderTop: '1px dashed #ccc' }} />

                {/* Summary */}
                <div className="text-sm">
                    <div className="flex justify-content-between mb-1">
                        <span className="font-bold">Total Tagihan</span>
                        <span className="font-bold">{formatRupiah(tagihan.total_tagihan)}</span>
                    </div>
                    {pembayaran && (
                        <>
                            <div className="flex justify-content-between mb-1">
                                <span>Metode Bayar</span>
                                <span className="font-semibold uppercase">{pembayaran.metode_pembayaran}</span>
                            </div>
                            <div className="flex justify-content-between mb-1">
                                <span>Jumlah Bayar</span>
                                <span className="font-bold text-green-700">{formatRupiah(pembayaran.jumlah_bayar)}</span>
                            </div>
                        </>
                    )}
                    <div className="flex justify-content-between mb-1">
                        <span>Total Terbayar</span>
                        <span className="font-bold text-green-700">{formatRupiah(total_dibayar)}</span>
                    </div>
                    {sisa_tagihan > 0 && (
                        <div className="flex justify-content-between font-bold text-red-600">
                            <span>Sisa Tagihan</span>
                            <span>{formatRupiah(sisa_tagihan)}</span>
                        </div>
                    )}
                </div>

                <Divider style={{ borderTop: '2px dashed #ccc' }} />

                {/* Footer */}
                <div className="text-center text-xs text-color-secondary">
                    <p className="m-0">Dicetak: {new Date(tanggal_cetak).toLocaleString('id-ID')}</p>
                    <p className="m-0 mt-2">Terima kasih atas kepercayaan Anda.</p>
                    {klinik.pimpinan && <p className="m-0 mt-3 font-bold">{klinik.pimpinan}</p>}
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; }
                }
            `}</style>
        </div>
    );
};

export default KwitansiPage;
