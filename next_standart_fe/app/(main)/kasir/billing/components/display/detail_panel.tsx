'use client';

import { Sidebar } from 'primereact/sidebar';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {
    ComponentProps, DetailItem, StatusPembayaran, formatRupiah, OPT_METODE_PEMBAYARAN
} from '../interfaces';

const getSeverity = (s: StatusPembayaran) =>
    s === 'lunas' ? 'success' : s === 'sebagian' ? 'warning' : 'danger';

const getJenisColor = (jenis: string) => {
    switch (jenis) {
        case 'konsultasi': return 'bg-blue-100 text-blue-700';
        case 'tindakan':   return 'bg-orange-100 text-orange-700';
        case 'obat':       return 'bg-green-100 text-green-700';
        case 'lab':        return 'bg-purple-100 text-purple-700';
        default:           return 'bg-gray-100 text-gray-700';
    }
};

const DetailPanel = ({ state, setState, toast, getDetail, onBayar, onPrintKwitansi }: ComponentProps) => {
    const { detail, selectedTagihan } = state;

    const sisaDibayar = detail
        ? parseFloat(String(detail.tagihan?.total_tagihan || 0)) - detail.total_dibayar
        : 0;

    const nominalInput = typeof state.formNominal === 'number' ? state.formNominal : 0;
    const sisaSetelahInput = sisaDibayar - nominalInput;

    const handleOpenBayar = () => {
        setState(p => ({ ...p, showBayar: true, formMetode: '', formNominal: '' }));
    };

    const handlePrintKwitansi = () => {
        if (!selectedTagihan) return;
        if (onPrintKwitansi) {
            onPrintKwitansi(selectedTagihan.kode_tagihan);
        } else {
            window.open(`/kasir/billing/kwitansi?kode_tagihan=${selectedTagihan.kode_tagihan}`, '_blank');
        }
    };

    if (!selectedTagihan) return null;

    return (
        <>
            {/* Side Panel Detail */}
            <Sidebar
                visible={state.showDetail}
                onHide={() => setState(p => ({ ...p, showDetail: false, detail: null }))}
                position="right"
                style={{ width: '520px' }}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-receipt text-primary text-xl" />
                        <span className="font-bold text-lg">Detail Tagihan</span>
                    </div>
                }
            >
                {state.loadDetail ? (
                    <div className="flex justify-content-center align-items-center h-12rem">
                        <i className="pi pi-spinner pi-spin text-4xl text-primary" />
                    </div>
                ) : detail ? (
                    <div className="flex flex-column gap-3">
                        {/* Info Tagihan */}
                        <div className="surface-50 border-round p-3">
                            <div className="flex justify-content-between align-items-center mb-2">
                                <span className="font-bold text-lg text-primary">{detail.tagihan.kode_tagihan}</span>
                                <Tag value={detail.tagihan.status_pembayaran === 'lunas' ? 'Lunas' : detail.tagihan.status_pembayaran === 'sebagian' ? 'Sebagian' : 'Belum Bayar'}
                                    severity={getSeverity(detail.tagihan.status_pembayaran)} />
                            </div>
                            <div className="grid text-sm">
                                <div className="col-6"><span className="text-color-secondary">Pasien</span><br/><span className="font-semibold">{detail.tagihan.nama_pasien || '—'}</span></div>
                                <div className="col-6"><span className="text-color-secondary">No. RM</span><br/><span>{detail.tagihan.no_rm}</span></div>
                                <div className="col-6"><span className="text-color-secondary">Poli</span><br/><span>{detail.tagihan.nama_poli || '—'}</span></div>
                                <div className="col-6"><span className="text-color-secondary">Dokter</span><br/><span>{detail.tagihan.nama_dokter || '—'}</span></div>
                                <div className="col-6"><span className="text-color-secondary">Penjamin</span><br/><span>{detail.tagihan.nama_penjamin || 'Umum'}</span></div>
                                <div className="col-6"><span className="text-color-secondary">Tgl. Tagihan</span><br/><span>{detail.tagihan.tanggal?.slice(0, 10)}</span></div>
                            </div>
                        </div>

                        {/* Rincian Item */}
                        <div>
                            <p className="font-semibold mb-2">Rincian Item</p>
                            <DataTable value={detail.detail_items} className="text-sm" size="small">
                                <Column header="Item" body={(r: DetailItem) => (
                                    <div>
                                        <span className={`inline-block px-2 py-1 border-round text-xs font-semibold mb-1 ${getJenisColor(r.jenis_item)}`}>{r.jenis_item}</span>
                                        <div className="font-semibold">{r.nama_item}</div>
                                    </div>
                                )} />
                                <Column field="qty" header="Qty" style={{ width: '50px' }} />
                                <Column header="Harga" body={(r: DetailItem) => formatRupiah(r.harga_satuan)} style={{ width: '110px' }} />
                                <Column header="Subtotal" body={(r: DetailItem) => <span className="font-bold">{formatRupiah(r.subtotal)}</span>} style={{ width: '120px' }} />
                            </DataTable>
                        </div>

                        <Divider />

                        {/* Ringkasan Pembayaran */}
                        <div className="surface-50 border-round p-3">
                            <div className="flex justify-content-between mb-2">
                                <span className="text-color-secondary">Total Tagihan</span>
                                <span className="font-bold text-xl">{formatRupiah(detail.tagihan.total_tagihan)}</span>
                            </div>
                            {detail.total_dibayar > 0 && (
                                <div className="flex justify-content-between mb-2">
                                    <span className="text-color-secondary">Sudah Dibayar</span>
                                    <span className="text-green-600 font-semibold">{formatRupiah(detail.total_dibayar)}</span>
                                </div>
                            )}
                            {detail.tagihan.status_pembayaran !== 'lunas' && (
                                <div className="flex justify-content-between">
                                    <span className="text-color-secondary font-bold">Sisa Tagihan</span>
                                    <span className="text-red-600 font-bold text-xl">{formatRupiah(detail.sisa_tagihan)}</span>
                                </div>
                            )}
                        </div>

                        {/* Riwayat Pembayaran */}
                        {detail.pembayaran.length > 0 && (
                            <div>
                                <p className="font-semibold mb-2">Riwayat Pembayaran</p>
                                {detail.pembayaran.map((p, i) => (
                                    <div key={i} className="flex justify-content-between align-items-center surface-50 border-round p-2 mb-1 text-sm">
                                        <div>
                                            <span className="font-semibold">{formatRupiah(p.jumlah_bayar)}</span>
                                            <small className="block text-color-secondary">{p.metode_pembayaran} — {p.tanggal_bayar?.slice(0, 10)}</small>
                                        </div>
                                        <span className="text-color-secondary text-xs">{p.email_kasir}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Tombol Aksi */}
                        <div className="flex gap-2 mt-2">
                            {detail.tagihan.status_pembayaran !== 'lunas' && (
                                <Button
                                    label="Bayar"
                                    icon="pi pi-credit-card"
                                    className="flex-1"
                                    severity="success"
                                    onClick={handleOpenBayar}
                                />
                            )}
                            <Button
                                label="Cetak Invoice"
                                icon="pi pi-print"
                                className="flex-1"
                                severity="secondary"
                                outlined
                                onClick={handlePrintKwitansi}
                            />
                        </div>
                    </div>
                ) : null}
            </Sidebar>

            {/* Dialog Pembayaran */}
            <Dialog
                visible={state.showBayar}
                onHide={() => setState(p => ({ ...p, showBayar: false }))}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-credit-card text-green-600 text-xl" />
                        <span className="font-bold">Form Pembayaran</span>
                    </div>
                }
                style={{ width: '440px' }}
                modal
            >
                {detail && (
                    <div className="flex flex-column gap-3">
                        <div className="surface-50 border-round p-3 text-sm">
                            <div className="flex justify-content-between mb-1">
                                <span className="text-color-secondary">Tagihan</span>
                                <span className="font-bold">{detail.tagihan.kode_tagihan}</span>
                            </div>
                            <div className="flex justify-content-between mb-1">
                                <span className="text-color-secondary">Pasien</span>
                                <span>{detail.tagihan.nama_pasien}</span>
                            </div>
                            <div className="flex justify-content-between mb-1">
                                <span className="text-color-secondary">Total Tagihan</span>
                                <span className="font-bold">{formatRupiah(detail.tagihan.total_tagihan)}</span>
                            </div>
                            {detail.total_dibayar > 0 && (
                                <div className="flex justify-content-between mb-1">
                                    <span className="text-color-secondary">Sudah Dibayar</span>
                                    <span className="text-green-600">{formatRupiah(detail.total_dibayar)}</span>
                                </div>
                            )}
                            <div className="flex justify-content-between">
                                <span className="font-bold">Sisa Tagihan</span>
                                <span className="text-red-600 font-bold">{formatRupiah(sisaDibayar)}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 font-semibold text-sm">Metode Pembayaran <span className="text-red-500">*</span></label>
                            <Dropdown
                                value={state.formMetode}
                                options={OPT_METODE_PEMBAYARAN}
                                onChange={e => setState(p => ({ ...p, formMetode: e.value }))}
                                placeholder="Pilih metode..."
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-semibold text-sm">Jumlah Bayar <span className="text-red-500">*</span></label>
                            <InputNumber
                                value={typeof state.formNominal === 'number' ? state.formNominal : null}
                                onValueChange={e => setState(p => ({ ...p, formNominal: e.value ?? '' }))}
                                mode="currency"
                                currency="IDR"
                                locale="id-ID"
                                className="w-full"
                                placeholder="Masukkan nominal..."
                                min={0}
                                max={sisaDibayar}
                            />
                            {/* Real-time sisa */}
                            {nominalInput > 0 && (
                                <div className={`mt-2 p-2 border-round text-sm font-semibold ${sisaSetelahInput <= 0 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                                    {sisaSetelahInput <= 0
                                        ? '✓ Tagihan akan LUNAS'
                                        : `Sisa setelah bayar: ${formatRupiah(sisaSetelahInput)}`
                                    }
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 justify-content-end mt-2">
                            <Button label="Batal" severity="secondary" outlined
                                onClick={() => setState(p => ({ ...p, showBayar: false }))} />
                            <Button
                                label="Bayar & Cetak Kwitansi"
                                icon="pi pi-check"
                                severity="success"
                                loading={state.loadBayar}
                                disabled={!state.formMetode || !state.formNominal}
                                onClick={onBayar}
                            />
                        </div>
                    </div>
                )}
            </Dialog>
        </>
    );
};

export default DetailPanel;
