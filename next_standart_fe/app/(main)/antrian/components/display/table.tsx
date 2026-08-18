'use client';

import { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { ComponentProps, AntrianItem, OPT_STATUS_PANGGIL } from '../interfaces';
import { apiEndpointData, apiEndpointDelete, apiEndpointReset } from '../endpoints';
import FormModal from './form';
import { getTzUser } from '@/lib/tools/dateTools';

const getSeverity = (statusPanggil: string) => {
    switch (statusPanggil) {
        case 'dipanggil': return 'success';
        case 'selesai':   return 'secondary';
        case 'dilewati':  return 'warning';
        case 'menunggu':
        default:          return 'info';
    }
};

const TableComponent = ({
    state, setState, formik, toast, getData, getGridData, onLazyLoad,
}: ComponentProps) => {
    const [selectedItem, setSelectedItem] = useState<AntrianItem | null>(null);
    const [loadDelete, setLoadDelete]     = useState(false);
    const [loadReset, setLoadReset]       = useState(false);

    const poliOptions = [
        { label: '— Semua Poli —', value: '' },
        ...state.poliOptions.map((p) => ({ label: p.nama_poli, value: p.kode_poli })),
    ];

    const handleEdit = (item: AntrianItem) => {
        formik.setValues({
            id:             item.id,
            no_rm:          item.no_rm,
            kode_poli:      item.kode_poli,
            kode_penjamin:  item.kode_penjamin || '',
            kode_dokter:    item.kode_dokter || '',
            status_panggil: item.status_panggil,
            tanggal:        item.tanggal,
        });
        setState((p) => ({ ...p, edit: true, add: false }));
    };

    const handleDeleteConfirm = async () => {
        if (!selectedItem) return;
        setLoadDelete(true);
        try {
            const res = await postData(apiEndpointDelete, { id: selectedItem.id, tz: getTzUser() });
            showSuccess(toast, res.data?.message || 'Data antrian berhasil dihapus');
            setState((p) => ({ ...p, delete: false }));
            setSelectedItem(null);
            if (getData) await getData(apiEndpointData);
            if (getGridData) await getGridData();
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Gagal menghapus data');
        } finally {
            setLoadDelete(false);
        }
    };

    const handleResetConfirm = async () => {
        setLoadReset(true);
        try {
            const body = {
                kode_poli: state.selectedPoli || undefined,
                tanggal: state.selectedDateFilter || undefined,
                target_status: 'menunggu',
                tz: getTzUser(),
            };
            const res = await postData(apiEndpointReset, body);
            showSuccess(toast, res.data?.message || 'Status antrian berhasil di-reset');
            setState((p) => ({ ...p, reset: false }));
            if (getData) await getData(apiEndpointData);
            if (getGridData) await getGridData();
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Gagal mereset antrian');
        } finally {
            setLoadReset(false);
        }
    };

    return (
        <div className="card p-4">
            {/* Modal Edit / Create */}
            <FormModal
                state={state}
                setState={setState}
                formik={formik}
                toast={toast}
                getData={getData}
                getGridData={getGridData}
            />

            {/* Dialog Hapus */}
            <Dialog
                header="⚠️ Konfirmasi Hapus Antrian"
                visible={state.delete}
                style={{ width: '400px' }}
                modal
                onHide={() => setState((p) => ({ ...p, delete: false }))}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="Batal" severity="secondary" outlined onClick={() => setState((p) => ({ ...p, delete: false }))} />
                        <Button label="Hapus" severity="danger" icon="pi pi-trash" loading={loadDelete} onClick={handleDeleteConfirm} />
                    </div>
                }
            >
                <p>
                    Apakah Anda yakin ingin menghapus nomor antrian <b>{selectedItem?.no_antrian}</b> ({selectedItem?.nama_pasien})?
                </p>
            </Dialog>

            {/* Dialog Reset */}
            <Dialog
                header="🔄 Konfirmasi Reset Status Antrian Poli"
                visible={state.reset}
                style={{ width: '420px' }}
                modal
                onHide={() => setState((p) => ({ ...p, reset: false }))}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="Batal" severity="secondary" outlined onClick={() => setState((p) => ({ ...p, reset: false }))} />
                        <Button label="Reset Ke Status Menunggu" severity="warning" icon="pi pi-refresh" loading={loadReset} onClick={handleResetConfirm} />
                    </div>
                }
            >
                <p className="text-color-secondary mb-2">
                    Aksi ini akan mengubah seluruh status antrian pada{' '}
                    <b>{state.selectedPoli ? state.poliOptions.find((p) => p.kode_poli === state.selectedPoli)?.nama_poli : 'Semua Poli'}</b>{' '}
                    menjadi <b>&apos;menunggu&apos;</b>.
                </p>
                <p className="text-xs text-orange-600 font-semibold mb-0">
                    Pastikan aksi ini dilakukan setelah konfirmasi bagian administrasi poli.
                </p>
            </Dialog>

            {/* Header Controls Table */}
            <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div className="flex align-items-center gap-2 flex-wrap">
                    <span className="p-input-icon-left w-16rem">
                        <i className="pi pi-search" />
                        <InputText
                            value={state.keyword}
                            onChange={(e) => setState((p) => ({ ...p, keyword: e.target.value, page: 1 }))}
                            placeholder="Cari No. RM, Antrian, Nama..."
                            className="w-full"
                        />
                    </span>

                    <Dropdown
                        value={state.selectedPoli}
                        options={poliOptions}
                        onChange={(e) => {
                            setState((p) => ({ ...p, selectedPoli: e.value, page: 1 }));
                        }}
                        placeholder="Poli Tujuan"
                        className="w-14rem"
                        filter
                    />

                    <Dropdown
                        value={state.selectedStatusFilter}
                        options={OPT_STATUS_PANGGIL}
                        onChange={(e) => {
                            setState((p) => ({ ...p, selectedStatusFilter: e.value, page: 1 }));
                        }}
                        placeholder="Filter Status"
                        className="w-12rem"
                    />

                    <Calendar
                        value={state.selectedDateFilter ? new Date(state.selectedDateFilter) : null}
                        onChange={(e) => {
                            const dateStr = e.value ? new Date(e.value).toISOString().slice(0, 10) : '';
                            setState((p) => ({ ...p, selectedDateFilter: dateStr, page: 1 }));
                        }}
                        dateFormat="dd/mm/yy"
                        placeholder="Filter Tanggal"
                        showIcon
                        showButtonBar
                        className="w-12rem"
                    />
                </div>

                <div className="flex align-items-center gap-2">
                    <Button
                        label="Tambah Antrian"
                        icon="pi pi-plus"
                        onClick={() => {
                            formik.resetForm();
                            formik.setFieldValue('status_panggil', 'menunggu');
                            setState((p) => ({ ...p, add: true, edit: false }));
                        }}
                    />
                    <Button
                        label="Reset Antrian"
                        icon="pi pi-refresh"
                        severity="warning"
                        outlined
                        onClick={() => setState((p) => ({ ...p, reset: true }))}
                        tooltip="Reset status antrian poli hari ini"
                    />
                </div>
            </div>

            {/* Table Master */}
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
                rowsPerPageOptions={[10, 25, 50, 100]}
                responsiveLayout="scroll"
                emptyMessage="Tidak ada data antrian poli ditemukan."
                className="p-datatable-gridlines text-sm"
            >
                <Column field="no_antrian" header="No. Antrian" sortable style={{ width: '110px' }}
                    body={(r) => <span className="font-bold text-lg text-blue-700">{r.no_antrian}</span>} />
                <Column field="p.nama_pasien" header="Nama Pasien" sortable
                    body={(r) => (
                        <div>
                            <span className="font-bold block">{r.nama_pasien}</span>
                            <small className="text-color-secondary">RM: {r.no_rm} | NIK: {r.nik}</small>
                        </div>
                    )} />
                <Column field="pol.nama_poli" header="Poli Tujuan"
                    body={(r) => <span className="font-semibold">{r.nama_poli || r.kode_poli}</span>} />
                <Column field="pj.nama_penjamin" header="Penjamin"
                    body={(r) => <span>{r.nama_penjamin || 'Umum'}</span>} />
                <Column field="d.nama_dokter" header="Dokter"
                    body={(r) => <span>{r.nama_dokter || '—'}</span>} />
                <Column field="tanggal" header="Tanggal" sortable style={{ width: '120px' }}
                    body={(r) => <span>{r.tanggal?.slice(0, 10)}</span>} />
                <Column field="status_panggil" header="Status" sortable style={{ width: '130px' }}
                    body={(r) => <Tag value={r.status_panggil} severity={getSeverity(r.status_panggil)} />} />
                <Column
                    header="Aksi"
                    style={{ width: '100px', textAlign: 'center' }}
                    body={(r) => (
                        <div className="flex justify-content-center gap-1">
                            <Button icon="pi pi-pencil" severity="secondary" rounded text size="small"
                                tooltip="Edit Antrian" onClick={() => handleEdit(r)} />
                            <Button icon="pi pi-trash" severity="danger" rounded text size="small"
                                tooltip="Hapus Antrian" onClick={() => { setSelectedItem(r); setState((p) => ({ ...p, delete: true })); }} />
                        </div>
                    )}
                />
            </DataTable>
        </div>
    );
};

export default TableComponent;
