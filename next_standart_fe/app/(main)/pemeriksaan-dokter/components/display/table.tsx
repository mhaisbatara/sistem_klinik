'use client';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { ComponentProps, KunjunganItem } from '../interfaces';

const TableComponent = ({ state, setState, toast, getData, openPemeriksaan, onLazyLoad }: ComponentProps) => {
    const poliOpts = [
        { label: '— Semua Poli —', value: '' },
        ...state.poliOptions.map(p => ({ label: p.nama_poli, value: p.kode_poli })),
    ];

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
                            placeholder="Cari nama pasien, No. RM..."
                            className="w-full"
                        />
                    </span>
                    <Dropdown
                        value={state.selectedPoli}
                        options={poliOpts}
                        onChange={e => setState(p => ({ ...p, selectedPoli: e.value, page: 1, first: 0 }))}
                        placeholder="Poli"
                        className="w-14rem"
                        filter
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
                emptyMessage="Tidak ada pasien dalam antrean pemeriksaan."
                className="p-datatable-gridlines text-sm"
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
                <Column field="nama_poli" header="Poli" body={(r) => <span>{r.nama_poli || r.kode_poli}</span>} />
                <Column field="nama_dokter" header="Dokter" body={(r) => <span>{r.nama_dokter || '—'}</span>} />
                <Column
                    field="status_kunjungan"
                    header="Status"
                    style={{ width: '120px' }}
                    body={(r: KunjunganItem) => (
                        <Tag value={r.status_kunjungan} severity={r.status_kunjungan === 'diperiksa' ? 'warning' : 'info'} />
                    )}
                />
                <Column
                    header="Aksi"
                    style={{ width: '130px', textAlign: 'center' }}
                    body={(r: KunjunganItem) => (
                        <Button
                            label="Periksa"
                            icon="pi pi-stethoscope"
                            size="small"
                            severity="warning"
                            onClick={() => { if (openPemeriksaan) openPemeriksaan(r); }}
                        />
                    )}
                />
            </DataTable>
        </div>
    );
};

export default TableComponent;
