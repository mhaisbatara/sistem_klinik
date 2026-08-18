'use client';

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { useState, useCallback, useRef } from 'react';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { getTzUser } from '@/lib/tools/dateTools';
import { ComponentProps, OPT_STATUS_PANGGIL } from '../interfaces';
import {
    apiEndpointCreate,
    apiEndpointUpdate,
    apiEndpointSearchPasien,
} from '../endpoints';

const FormModal = ({ state, setState, formik, toast, getData, getGridData }: ComponentProps) => {
    const [loadSubmit, setLoadSubmit] = useState(false);
    const [loadSearch, setLoadSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isEdit = state.edit;
    const isAdd  = state.add;
    const isVisible = isAdd || isEdit;

    const handleClose = () => {
        setState((p) => ({ ...p, add: false, edit: false }));
        formik.resetForm();
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleSearchPasien = useCallback((value: string) => {
        setSearchQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (value.length < 2) {
            setSearchResults([]);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setLoadSearch(true);
            try {
                const res = await postData(apiEndpointSearchPasien, { search: value });
                setSearchResults(res.data?.data || []);
            } catch {
                setSearchResults([]);
            } finally {
                setLoadSearch(false);
            }
        }, 400);
    }, []);

    const handleSelectPasien = (p: any) => {
        formik.setFieldValue('no_rm', p.no_rm);
        setSearchQuery(`${p.nama_pasien} (${p.no_rm})`);
        setSearchResults([]);
    };

    const handleSubmitForm = async () => {
        formik.handleSubmit();
        if (!formik.isValid) return;

        setLoadSubmit(true);
        try {
            const body = {
                ...formik.values,
                tz: getTzUser(),
            };

            const endpoint = isEdit ? apiEndpointUpdate : apiEndpointCreate;
            const res = await postData(endpoint, body, { 'X-Level': '1' });

            showSuccess(toast, res.data?.message || 'Data berhasil disimpan');
            handleClose();
            if (getData) await getData(apiEndpointCreate);
            if (getGridData) await getGridData();
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadSubmit(false);
        }
    };

    const poliOptions = [
        ...state.poliOptions.map((p) => ({ label: p.nama_poli, value: p.kode_poli })),
    ];

    const penjaminOptions = [
        { label: '— Tanpa Penjamin —', value: '' },
        ...state.penjaminOptions.map((p) => ({
            label: `${p.nama_penjamin} (${p.jenis})`,
            value: p.kode_penjamin,
        })),
    ];

    const dokterOptions = [
        { label: '— Belum ditentukan —', value: '' },
        ...state.dokterOptions.map((d) => ({
            label: `${d.nama_dokter}${d.spesialisasi ? ` (${d.spesialisasi})` : ''}`,
            value: d.id,
        })),
    ];

    const statusOptions = OPT_STATUS_PANGGIL.filter((o) => o.value !== '');

    const isInvalid = (name: string) => !!(formik.touched[name] && formik.errors[name]);

    return (
        <Dialog
            header={isEdit ? '✏️ Edit Data Antrian Poli' : '➕ Tambah Manual Antrian Poli'}
            visible={isVisible}
            style={{ width: '480px' }}
            modal
            onHide={handleClose}
            footer={
                <div className="flex justify-content-end gap-2">
                    <Button label="Batal" icon="pi pi-times" severity="secondary" outlined onClick={handleClose} />
                    <Button
                        label={isEdit ? 'Simpan Perubahan' : 'Tambah Antrian'}
                        icon="pi pi-check"
                        severity="success"
                        loading={loadSubmit}
                        onClick={handleSubmitForm}
                    />
                </div>
            }
        >
            <div className="flex flex-column gap-3 py-2">
                {/* Cari Pasien (Jika Tambah Baru) */}
                {!isEdit ? (
                    <div className="flex flex-column gap-1">
                        <label className="font-semibold text-sm">
                            Cari Pasien (No. RM / NIK / Nama) <span className="text-red-500">*</span>
                        </label>
                        <span className="p-input-icon-left w-full">
                            <i className={`pi ${loadSearch ? 'pi-spinner pi-spin' : 'pi-search'}`} />
                            <InputText
                                value={searchQuery}
                                onChange={(e) => handleSearchPasien(e.target.value)}
                                placeholder="Ketik minimal 2 karakter..."
                                className={isInvalid('no_rm') ? 'p-invalid w-full' : 'w-full'}
                            />
                        </span>
                        {formik.values.no_rm && (
                            <small className="text-green-600 font-semibold">RM Terpilih: {formik.values.no_rm}</small>
                        )}
                        {isInvalid('no_rm') && <small className="p-error">{formik.errors.no_rm}</small>}

                        {/* Dropdown Hasil Cari Pasien */}
                        {searchResults.length > 0 && (
                            <div className="border-1 border-round border-300 surface-0 overflow-hidden shadow-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                {searchResults.map((p) => (
                                    <div
                                        key={p.no_rm}
                                        className="p-2 border-bottom-1 border-100 cursor-pointer hover:surface-100"
                                        onClick={() => handleSelectPasien(p)}
                                    >
                                        <p className="font-bold text-sm mb-0">{p.nama_pasien}</p>
                                        <p className="text-xs text-color-secondary mb-0">RM: {p.no_rm} | NIK: {p.nik}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-column gap-1">
                        <label className="font-semibold text-sm">No. Rekam Medis</label>
                        <InputText value={formik.values.no_rm} disabled className="w-full" />
                    </div>
                )}

                {/* Poli Tujuan */}
                <div className="flex flex-column gap-1">
                    <label className="font-semibold text-sm">
                        Poli Tujuan <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                        value={formik.values.kode_poli}
                        options={poliOptions}
                        onChange={(e) => formik.setFieldValue('kode_poli', e.value)}
                        placeholder="Pilih Poli Tujuan"
                        className={isInvalid('kode_poli') ? 'p-invalid w-full' : 'w-full'}
                        filter
                    />
                    {isInvalid('kode_poli') && <small className="p-error">{formik.errors.kode_poli}</small>}
                </div>

                {/* Kode Penjamin */}
                <div className="flex flex-column gap-1">
                    <label className="font-semibold text-sm">Penjamin</label>
                    <Dropdown
                        value={formik.values.kode_penjamin}
                        options={penjaminOptions}
                        onChange={(e) => formik.setFieldValue('kode_penjamin', e.value)}
                        placeholder="Pilih Penjamin"
                        className="w-full"
                    />
                </div>

                {/* Dokter Tujuan */}
                <div className="flex flex-column gap-1">
                    <label className="font-semibold text-sm">Dokter Tujuan</label>
                    <Dropdown
                        value={formik.values.kode_dokter}
                        options={dokterOptions}
                        onChange={(e) => formik.setFieldValue('kode_dokter', e.value)}
                        placeholder="Pilih Dokter"
                        className="w-full"
                        filter
                    />
                </div>

                {/* Status Panggil (Hanya jika edit) */}
                {isEdit && (
                    <div className="flex flex-column gap-1">
                        <label className="font-semibold text-sm">Status Pemanggilan</label>
                        <Dropdown
                            value={formik.values.status_panggil}
                            options={statusOptions}
                            onChange={(e) => formik.setFieldValue('status_panggil', e.value)}
                            placeholder="Pilih Status"
                            className="w-full"
                        />
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default FormModal;
