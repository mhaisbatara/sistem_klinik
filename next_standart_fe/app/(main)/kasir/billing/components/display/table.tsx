'use client';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import {
    ComponentProps, TagihanItem, OPT_STATUS_PEMBAYARAN, formatRupiah, StatusPembayaran
} from '../interfaces';

const getSeverity = (s: StatusPembayaran) => {
    switch (s) {
        case 'lunas':      return 'success';
        case 'sebagian':   return 'warning';
        case 'belum_bayar': return 'danger';
        default:           return 'info';
    }
};
const getLabel = (s: StatusPembayaran) => {
    switch (s) {
        case 'lunas':      return 'Lunas';
        case 'sebagian':   return 'Sebagian';
        case 'belum_bayar': return 'Belum Bayar';
        default:           return s;
    }
};

const TableComponent = ({ state, setState, toast, getData, getDetail, onRegenerate, onPrintKwitansi, onLazyLoad }: ComponentProps) => {

    const handleDetail = (row: TagihanItem) => {
        setState(p => ({ ...p, selectedTagihan: row, showDetail: true }));
        if (getDetail) getDetail(row.kode_tagihan);
    };

    return (
        <div className="card p-4">
            {/* Filter */}
            <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div className="flex align-items-center gap-2 flex-wrap">
                    <span className="p-input-icon-left w-17rem">
                        <i className="pi pi-search" />
                        <InputText
                            value={state.keyword}
                            onChange={e => setState(p => ({ ...p, keyword: e.target.value, page: 1, first: 0 }))}
                            placeholder="Cari tagihan, pasien, No. RM..."
                            className="w-full"
                        />
                    </span>
                    <Dropdown
                        value={state.selectedStatus}
                        options={OPT_STATUS_PEMBAYARAN}
                        onChange={e => setState(p => ({ ...p, selectedStatus: e.value, page: 1, first: 0 }))}
                        placeholder="Status Pembayaran"
                        className="w-13rem"
                    />
                    <Calendar
                        value={state.selectedTanggal ? new Date(state.selectedTanggal) : null}
                        onChange={e => {
                            const d = e.value ? new Date(e.value).toISOString().slice(0, 10) : '';
                            setState(p => ({ ...p, selectedTanggal: d, page: 1, first: 0 }));
                        }}
                        dateFormat="dd/mm/yy"
                        placeholder="Filter Tanggal"
                        showIcon showButtonBar
                        className="w-12rem"
                    />
                </div>
                <Button label="Refresh" icon="pi pi-refresh" severity="secondary" outlined
                    onClick={() => { if (getData) getData(); }} />
            </div>

            <DataTable
                value={state.data}
                loading={state.load}
                lazy paginator
                first={state.first}
                rows={state.rows}
                totalRecords={state.totalData}
                onPage={onLazyLoad}
                onSort={onLazyLoad}
                sortField={state.sortField}
                sortOrder={state.sortOrder === 'asc' ? 1 : -1}
                rowsPerPageOptions={[10, 25, 50]}
                responsiveLayout="scroll"
                emptyMessage="Tidak ada data tagihan."
                className="p-datatable-gridlines text-sm"
            >
                <Column
                    field="kode_tagihan"
                    header="No. Tagihan"
                    sortable style={{ width: '160px' }}
                    body={(r: TagihanItem) => <span className="font-bold text-primary">{r.kode_tagihan}</span>}
                />
                <Column
                    field="nama_pasien"
                    header="Pasien"
                    body={(r: TagihanItem) => (
                        <div>
                            <span className="font-semibold block">{r.nama_pasien || '—'}</span>
                            <small className="text-color-secondary">RM: {r.no_rm} | {r.nik}</small>
                        </div>
                    )}
                />
                <Column field="tanggal" header="Tgl. Tagihan" sortable style={{ width: '120px' }}
                    body={(r) => <span>{r.tanggal?.slice(0, 10)}</span>} />
                <Column
                    field="total_tagihan"
                    header="Total Tagihan"
                    sortable style={{ width: '140px' }}
                    body={(r: TagihanItem) => (
                        <div>
                            <span className="font-bold">{formatRupiah(r.total_tagihan)}</span>
                            {r.total_dibayar > 0 && r.status_pembayaran !== 'lunas' && (
                                <small className="block text-color-secondary">
                                    Dibayar: {formatRupiah(r.total_dibayar)}
                                </small>
                            )}
                        </div>
                    )}
                />
                <Column
                    field="status_pembayaran"
                    header="Status"
                    sortable style={{ width: '130px' }}
                    body={(r: TagihanItem) => (
                        <Tag value={getLabel(r.status_pembayaran)} severity={getSeverity(r.status_pembayaran)} />
                    )}
                />
                <Column
                    header="Aksi"
                    style={{ width: '130px', textAlign: 'center' }}
                    body={(r: TagihanItem) => (
                        <div className="flex gap-1 justify-content-center">
                            <Button
                                icon="pi pi-eye"
                                rounded text severity="info"
                                tooltip="Lihat Detail & Bayar"
                                onClick={() => handleDetail(r)}
                            />
                            <Button
                                icon="pi pi-print"
                                rounded text severity="secondary"
                                tooltip="Cetak Invoice / Kwitansi"
                                onClick={() => { if (onPrintKwitansi) onPrintKwitansi(r.kode_tagihan); }}
                            />
                            {r.status_pembayaran === 'belum_bayar' && (
                                <Button
                                    icon="pi pi-refresh"
                                    rounded text severity="warning"
                                    tooltip="Regenerate Tagihan"
                                    loading={state.loadRegenerate}
                                    onClick={() => { if (onRegenerate) onRegenerate(r.kode_kunjungan); }}
                                />
                            )}
                        </div>
                    )}
                />
            </DataTable>
        </div>
    );
};

export default TableComponent;
