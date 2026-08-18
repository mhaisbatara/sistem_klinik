'use client';

import { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { ComponentProps, MasterPoliItem } from '../interfaces';
import { apiEndpointMasterPoliDelete } from '../endpoints';
import MasterPoliFormModal from './master_poli_form';
import { getTzUser } from '@/lib/tools/dateTools';

const MasterPoliTableComponent = ({
    state, setState, formikMasterPoli, toast, getMasterPoliData, onLazyLoadMasterPoli,
}: ComponentProps) => {
    const [selectedItem, setSelectedItem] = useState<MasterPoliItem | null>(null);
    const [loadDelete, setLoadDelete]     = useState(false);

    const handleEdit = (item: MasterPoliItem) => {
        formikMasterPoli.setValues({
            id:        item.id,
            kode_poli: item.kode_poli,
            nama_poli: item.nama_poli,
        });
        setState((p) => ({ ...p, editMasterPoli: true, addMasterPoli: false }));
    };

    const handleDeleteConfirm = async () => {
        if (!selectedItem) return;
        setLoadDelete(true);
        try {
            const res = await postData(apiEndpointMasterPoliDelete, {
                kode_poli: selectedItem.kode_poli,
                tz: getTzUser(),
            });
            showSuccess(toast, res.data?.message || 'Data poliklinik berhasil dihapus');
            setState((p) => ({ ...p, deleteMasterPoli: false }));
            setSelectedItem(null);
            if (getMasterPoliData) await getMasterPoliData();
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Gagal menghapus poliklinik');
        } finally {
            setLoadDelete(false);
        }
    };

    return (
        <div className="card p-4">
            {/* Modal Form Master Poli */}
            <MasterPoliFormModal
                state={state}
                setState={setState}
                formikMasterPoli={formikMasterPoli}
                toast={toast}
                getMasterPoliData={getMasterPoliData}
            />

            {/* Dialog Hapus Master Poli */}
            <Dialog
                header="⚠️ Konfirmasi Hapus Poliklinik"
                visible={state.deleteMasterPoli}
                style={{ width: '400px' }}
                modal
                onHide={() => setState((p) => ({ ...p, deleteMasterPoli: false }))}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="Batal" severity="secondary" outlined onClick={() => setState((p) => ({ ...p, deleteMasterPoli: false }))} />
                        <Button label="Hapus" severity="danger" icon="pi pi-trash" loading={loadDelete} onClick={handleDeleteConfirm} />
                    </div>
                }
            >
                <p>
                    Apakah Anda yakin ingin menghapus poliklinik <b>{selectedItem?.nama_poli}</b> ({selectedItem?.kode_poli})?
                </p>
            </Dialog>

            {/* Header Controls */}
            <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div className="flex align-items-center gap-2">
                    <span className="p-input-icon-left w-18rem">
                        <i className="pi pi-search" />
                        <InputText
                            value={state.masterPoliKeyword}
                            onChange={(e) => setState((p) => ({ ...p, masterPoliKeyword: e.target.value, masterPoliPage: 1 }))}
                            placeholder="Cari Kode atau Nama Poli..."
                            className="w-full"
                        />
                    </span>
                </div>

                <div className="flex align-items-center gap-2">
                    <Button
                        label="Tambah Poli Baru"
                        icon="pi pi-plus"
                        onClick={() => {
                            formikMasterPoli.resetForm();
                            setState((p) => ({ ...p, addMasterPoli: true, editMasterPoli: false }));
                        }}
                    />
                    <Button
                        label="Refresh"
                        icon="pi pi-refresh"
                        severity="secondary"
                        outlined
                        onClick={getMasterPoliData}
                    />
                </div>
            </div>

            {/* DataTable Master Poli */}
            <DataTable
                value={state.masterPoliData}
                loading={state.loadMasterPoli}
                lazy
                paginator
                first={state.masterPoliFirst}
                rows={state.masterPoliRows}
                totalRecords={state.masterPoliTotalData}
                onPage={onLazyLoadMasterPoli}
                onSort={onLazyLoadMasterPoli}
                sortField={state.masterPoliSortField}
                sortOrder={state.masterPoliSortOrder === 'asc' ? 1 : -1}
                rowsPerPageOptions={[10, 25, 50]}
                responsiveLayout="scroll"
                emptyMessage="Tidak ada data poliklinik ditemukan."
                className="p-datatable-gridlines text-sm"
            >
                <Column field="kode_poli" header="Kode Poli" sortable style={{ width: '150px' }}
                    body={(r) => <span className="font-bold text-blue-700">{r.kode_poli}</span>} />
                <Column field="nama_poli" header="Nama Poliklinik" sortable
                    body={(r) => <span className="font-bold">{r.nama_poli}</span>} />
                <Column
                    header="Aksi"
                    style={{ width: '120px', textAlign: 'center' }}
                    body={(r) => (
                        <div className="flex justify-content-center gap-1">
                            <Button icon="pi pi-pencil" severity="secondary" rounded text size="small"
                                tooltip="Edit Poli" onClick={() => handleEdit(r)} />
                            <Button icon="pi pi-trash" severity="danger" rounded text size="small"
                                tooltip="Hapus Poli" onClick={() => { setSelectedItem(r); setState((p) => ({ ...p, deleteMasterPoli: true })); }} />
                        </div>
                    )}
                />
            </DataTable>
        </div>
    );
};

export default MasterPoliTableComponent;
