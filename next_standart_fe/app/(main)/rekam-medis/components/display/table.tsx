'use client';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { ComponentProps, KunjunganItem, OPT_STATUS_KUNJUNGAN } from '../interfaces';

const getSeverity = (s: string) => {
    switch (s) {
        case 'diperiksa': return 'warning';
        case 'selesai':   return 'success';
        case 'batal':     return 'danger';
        default:          return 'info';
    }
};

const TableComponent = ({ state, setState, toast, getData, getDetail, onLazyLoad }: ComponentProps) => {
    const poliOpts = [
        { label: '— Semua Poli —', value: '' },
        ...state.poliOptions.map(p => ({ label: p.nama_poli, value: p.kode_poli })),
    ];

    const handleDetail = (row: KunjunganItem) => {
        setState(p => ({ ...p, selectedKunjungan: row, showDetail: true }));
        if (getDetail) getDetail(row.kode_kunjungan);
    };

    return (
        <div className="card p-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div className="flex align-items-center gap-2 flex-wrap">
                    <span className="p-input-icon-left w-17rem">
                        <i className="pi pi-search" />
                        <InputText
                            value={state.keyword}
                            onChange={e => setState(p => ({ ...p, keyword: e.target.value, page: 1, first: 0 }))}
                            placeholder="Cari nama pasien, No. RM, dokter..."
                            className="w-full"
                        />
                    </span>
                    <Dropdown
                        value={state.selectedPoli}
                        options={poliOpts}
                        onChange={e => setState(p => ({ ...p, selectedPoli: e.value, page: 1, first: 0 }))}
                        placeholder="Poli"
                        className="w-12rem"
                        filter
                    />
                    <Dropdown
                        value={state.selectedStatus}
                        options={OPT_STATUS_KUNJUNGAN}
                        onChange={e => setState(p => ({ ...p, selectedStatus: e.value, page: 1, first: 0 }))}
                        placeholder="Status Kunjungan"
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
                        showIcon
                        showButtonBar
                        className="w-12rem"
                    />
                </div>
                <Button
                    label="Refresh"
                    icon="pi pi-refresh"
                    severity="secondary"
                    outlined
                    onClick={() => { if (getData) getData(); }}
                />
            </div>

            <DataTable
                value={state.data}
                loading={state.load}
                lazy
                paginator
                first={state.first}
                rows={state.rows}
                totalRecords={state.totalData}
                onPage={onLazyLoad}
                onSort={onLazyLoad}
                sortField={state.sortField}
                sortOrder={state.sortOrder === 'asc' ? 1 : -1}
                rowsPerPageOptions={[10, 25, 50]}
                responsiveLayout="scroll"
                emptyMessage="Tidak ada data kunjungan ditemukan."
                className="p-datatable-gridlines text-sm"
                rowClassName={(r: KunjunganItem) => ({ 'surface-100': r.status_kunjungan === 'selesai' })}
            >
                <Column
                    field="kode_kunjungan"
                    header="No. Kunjungan"
                    sortable
                    style={{ width: '160px' }}
                    body={(r: KunjunganItem) => (
                        <span className="font-bold text-primary">{r.kode_kunjungan}</span>
                    )}
                />
                <Column
                    field="nama_pasien"
                    header="Pasien"
                    body={(r: KunjunganItem) => (
                        <div>
                            <span className="font-semibold block">{r.nama_pasien || '—'}</span>
                            <small className="text-color-secondary">RM: {r.no_rm} | NIK: {r.nik}</small>
                        </div>
                    )}
                />
                <Column field="nama_poli"    header="Poli"   body={(r) => <span>{r.nama_poli || r.kode_poli}</span>} />
                <Column field="nama_dokter"  header="Dokter" body={(r) => <span>{r.nama_dokter || '—'}</span>} />
                <Column
                    field="tanggal_kunjungan"
                    header="Tgl. Kunjungan"
                    sortable
                    style={{ width: '130px' }}
                    body={(r) => <span>{r.tanggal_kunjungan?.slice(0, 10)}</span>}
                />
                <Column
                    field="status_kunjungan"
                    header="Status"
                    sortable
                    style={{ width: '120px' }}
                    body={(r) => <Tag value={r.status_kunjungan} severity={getSeverity(r.status_kunjungan)} />}
                />
                <Column
                    header="Detail"
                    style={{ width: '80px', textAlign: 'center' }}
                    body={(r: KunjunganItem) => (
                        <Button
                            icon="pi pi-eye"
                            rounded
                            text
                            severity="info"
                            tooltip="Lihat Detail"
                            onClick={() => handleDetail(r)}
                        />
                    )}
                />
            </DataTable>
        </div>
    );
};

export default TableComponent;
