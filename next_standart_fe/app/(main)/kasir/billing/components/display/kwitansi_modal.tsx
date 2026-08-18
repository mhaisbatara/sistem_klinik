'use client';

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { ComponentProps, formatRupiah } from '../interfaces';

const KwitansiModal = ({ state, setState }: ComponentProps) => {
    const { showKwitansiModal, loadKwitansi, kwitansiData } = state;

    const handlePrint = () => {
        const printContent = document.getElementById('printable-kwitansi');
        if (!printContent) return;
        const win = window.open('', '', 'width=450,height=650');
        if (win) {
            win.document.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Kwitansi ${kwitansiData?.tagihan?.kode_tagihan || ''}</title>
                        <style>
                            body { font-family: monospace; padding: 20px; font-size: 12px; color: #111; }
                            .text-center { text-align: center; }
                            .flex { display: flex; justify-content: space-between; }
                            .font-bold { font-weight: bold; }
                            .text-red { color: #dc2626; }
                            .text-green { color: #15803d; }
                            .text-secondary { color: #666; }
                            hr { border: none; border-top: 1px dashed #aaa; margin: 8px 0; }
                            .mb-1 { margin-bottom: 4px; }
                        </style>
                    </head>
                    <body>
                        ${printContent.innerHTML}
                        <script>
                            window.onload = function() {
                                window.print();
                                setTimeout(function() { window.close(); }, 300);
                            };
                        </script>
                    </body>
                </html>
            `);
            win.document.close();
        }
    };

    return (
        <Dialog
            visible={showKwitansiModal}
            onHide={() => setState(p => ({ ...p, showKwitansiModal: false, kwitansiData: null }))}
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-print text-primary text-xl" />
                    <span className="font-bold text-lg">Cetak Kwitansi / Invoice</span>
                </div>
            }
            style={{ width: '460px' }}
            modal
        >
            {loadKwitansi ? (
                <div className="flex justify-content-center align-items-center h-12rem">
                    <i className="pi pi-spinner pi-spin text-4xl text-primary" />
                </div>
            ) : kwitansiData ? (
                <div className="flex flex-column gap-3">
                    <div id="printable-kwitansi" className="surface-0 border-1 border-200 border-round p-3 font-monospace text-sm" style={{ backgroundColor: '#fff' }}>
                        {/* Header Klinik */}
                        <div className="text-center mb-2">
                            <h4 className="font-bold text-base m-0 text-900">{kwitansiData.klinik?.nama || 'KLINIK'}</h4>
                            <p className="text-xs text-color-secondary m-0">{kwitansiData.klinik?.alamat}</p>
                            {kwitansiData.klinik?.telepon && <p className="text-xs m-0">Telp: {kwitansiData.klinik?.telepon}</p>}
                        </div>

                        <Divider style={{ borderTop: '2px dashed #bbb', margin: '8px 0' }} />
                        <p className="text-center font-bold text-sm m-0 py-1">KWITANSI PEMBAYARAN</p>
                        <Divider style={{ borderTop: '1px dashed #bbb', margin: '8px 0' }} />

                        {/* Info Tagihan */}
                        <div className="text-xs mb-2">
                            <div className="flex justify-content-between mb-1">
                                <span>No. Tagihan</span>
                                <span className="font-bold text-primary">{kwitansiData.tagihan?.kode_tagihan}</span>
                            </div>
                            <div className="flex justify-content-between mb-1">
                                <span>Pasien</span>
                                <span className="font-semibold">{kwitansiData.tagihan?.nama_pasien || '—'}</span>
                            </div>
                            <div className="flex justify-content-between mb-1">
                                <span>No. RM</span>
                                <span>{kwitansiData.tagihan?.no_rm}</span>
                            </div>
                            <div className="flex justify-content-between mb-1">
                                <span>Penjamin</span>
                                <span>{kwitansiData.tagihan?.nama_penjamin || 'Umum'}</span>
                            </div>
                            <div className="flex justify-content-between mb-1">
                                <span>Tgl. Kunjungan</span>
                                <span>{kwitansiData.tagihan?.tanggal_kunjungan?.slice(0, 10) || '—'}</span>
                            </div>
                        </div>

                        <Divider style={{ borderTop: '1px dashed #bbb', margin: '8px 0' }} />

                        {/* Rincian Item */}
                        <p className="font-bold text-xs mb-1">Rincian Layanan &amp; Item:</p>
                        {kwitansiData.detail_items?.map((item: any, i: number) => (
                            <div key={i} className="flex justify-content-between text-xs mb-1">
                                <div className="pr-2">
                                    <span className="text-color-secondary">[{item.jenis_item}]</span> {item.nama_item} x{item.qty}
                                </div>
                                <span className="font-semibold">{formatRupiah(item.subtotal)}</span>
                            </div>
                        ))}

                        <Divider style={{ borderTop: '1px dashed #bbb', margin: '8px 0' }} />

                        {/* Summary */}
                        <div className="text-xs">
                            <div className="flex justify-content-between mb-1">
                                <span className="font-bold">Total Tagihan</span>
                                <span className="font-bold text-base">{formatRupiah(kwitansiData.tagihan?.total_tagihan || 0)}</span>
                            </div>
                            {kwitansiData.pembayaran && (
                                <>
                                    <div className="flex justify-content-between mb-1">
                                        <span>Metode Bayar</span>
                                        <span className="font-semibold uppercase">{kwitansiData.pembayaran.metode_pembayaran}</span>
                                    </div>
                                    <div className="flex justify-content-between mb-1">
                                        <span>Jumlah Bayar</span>
                                        <span className="font-bold text-green-700">{formatRupiah(kwitansiData.pembayaran.jumlah_bayar)}</span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-content-between mb-1">
                                <span>Total Terbayar</span>
                                <span className="font-bold text-green-700">{formatRupiah(kwitansiData.total_dibayar || 0)}</span>
                            </div>
                            {(kwitansiData.sisa_tagihan || 0) > 0 && (
                                <div className="flex justify-content-between font-bold text-red-600">
                                    <span>Sisa Tagihan</span>
                                    <span>{formatRupiah(kwitansiData.sisa_tagihan)}</span>
                                </div>
                            )}
                        </div>

                        <Divider style={{ borderTop: '2px dashed #bbb', margin: '8px 0' }} />

                        {/* Footer */}
                        <div className="text-center text-xs text-color-secondary">
                            <p className="m-0">Dicetak: {kwitansiData.tanggal_cetak?.slice(0, 19)}</p>
                            <p className="m-0 mt-1">Terima kasih atas kunjungan Anda.</p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 justify-content-end">
                        <Button
                            label="Tutup"
                            severity="secondary"
                            outlined
                            onClick={() => setState(p => ({ ...p, showKwitansiModal: false, kwitansiData: null }))}
                        />
                        <Button
                            label="Cetak / Print"
                            icon="pi pi-print"
                            onClick={handlePrint}
                        />
                    </div>
                </div>
            ) : (
                <p className="text-center text-color-secondary py-4">Data kwitansi tidak ditemukan.</p>
            )}
        </Dialog>
    );
};

export default KwitansiModal;
