'use client';

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { useState } from 'react';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { getTzUser } from '@/lib/tools/dateTools';
import { ComponentProps } from '../interfaces';
import { apiEndpointMasterPoliCreate, apiEndpointMasterPoliUpdate } from '../endpoints';

const MasterPoliFormModal = ({ state, setState, formikMasterPoli, toast, getMasterPoliData }: ComponentProps) => {
    const [loadSubmit, setLoadSubmit] = useState(false);

    const isEdit = state.editMasterPoli;
    const isAdd  = state.addMasterPoli;
    const isVisible = isAdd || isEdit;

    const handleClose = () => {
        setState((p) => ({ ...p, addMasterPoli: false, editMasterPoli: false }));
        formikMasterPoli.resetForm();
    };

    const handleSubmitForm = async () => {
        formikMasterPoli.handleSubmit();
        if (!formikMasterPoli.isValid) return;

        setLoadSubmit(true);
        try {
            const body = {
                ...formikMasterPoli.values,
                tz: getTzUser(),
            };

            const endpoint = isEdit ? apiEndpointMasterPoliUpdate : apiEndpointMasterPoliCreate;
            const res = await postData(endpoint, body, { 'X-Level': '1' });

            showSuccess(toast, res.data?.message || 'Data master poli berhasil disimpan');
            handleClose();
            if (getMasterPoliData) await getMasterPoliData();
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadSubmit(false);
        }
    };

    const isInvalid = (name: string) => !!(formikMasterPoli.touched[name] && formikMasterPoli.errors[name]);

    return (
        <Dialog
            header={isEdit ? '✏️ Edit Poliklinik' : '➕ Tambah Poliklinik Baru'}
            visible={isVisible}
            style={{ width: '420px' }}
            modal
            onHide={handleClose}
            footer={
                <div className="flex justify-content-end gap-2">
                    <Button label="Batal" icon="pi pi-times" severity="secondary" outlined onClick={handleClose} />
                    <Button
                        label={isEdit ? 'Simpan Perubahan' : 'Tambah Poli'}
                        icon="pi pi-check"
                        severity="success"
                        loading={loadSubmit}
                        onClick={handleSubmitForm}
                    />
                </div>
            }
        >
            <div className="flex flex-column gap-3 py-2">
                {/* Kode Poli */}
                <div className="flex flex-column gap-1">
                    <label className="font-semibold text-sm">
                        Kode Poli {!isEdit && <span className="text-color-secondary font-normal">(Kosongkan untuk auto-generate e.g. POL06)</span>}
                    </label>
                    <InputText
                        value={formikMasterPoli.values.kode_poli}
                        onChange={(e) => formikMasterPoli.setFieldValue('kode_poli', e.target.value)}
                        placeholder="Contoh: POL06 (Opsional)"
                        disabled={isEdit}
                        className="w-full uppercase"
                    />
                </div>

                {/* Nama Poli */}
                <div className="flex flex-column gap-1">
                    <label className="font-semibold text-sm">
                        Nama Poliklinik <span className="text-red-500">*</span>
                    </label>
                    <InputText
                        value={formikMasterPoli.values.nama_poli}
                        onChange={(e) => formikMasterPoli.setFieldValue('nama_poli', e.target.value)}
                        placeholder="Contoh: Poli Syaraf, Poli THT..."
                        className={isInvalid('nama_poli') ? 'p-invalid w-full' : 'w-full'}
                    />
                    {isInvalid('nama_poli') && <small className="p-error">{formikMasterPoli.errors.nama_poli}</small>}
                </div>
            </div>
        </Dialog>
    );
};

export default MasterPoliFormModal;
