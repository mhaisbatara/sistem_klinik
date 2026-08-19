'use client';

import { useFormik } from 'formik';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { useState, useCallback, useRef } from 'react';
import postData from '@/lib/axios/postData';
import { showError } from '@/lib/tools/generalTools';
import { getTzUser } from '@/lib/tools/dateTools';
import { printAntrianTicket, TicketData } from '@/lib/tools/printTicket';
import {
    FormLama, FormLamaProps, PasienResult,
} from '../interfaces';
import {
    apiEndpointSearch, apiEndpointDaftarLama,
} from '../endpoints';

// ─── InfoRow — Helper untuk baris data biodata readonly ──
const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex justify-content-between border-bottom-1 border-200 py-2">
        <span className="text-color-secondary text-sm font-medium w-6">{label}</span>
        <span className="font-semibold text-sm w-6 text-right text-800">{value || '—'}</span>
    </div>
);

interface FormLamaExt extends FormLama {
    kode_antrian_awal?: string;
}

const INIT: FormLamaExt = {
    no_rm: '', kode_poli: '', kode_penjamin: '', kode_dokter: '', kode_antrian_awal: '', tz: '',
};

const FormLamaComponent = ({ state, setState, toast }: FormLamaProps) => {
    const [loadSubmit, setLoadSubmit] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [resultData, setResultData] = useState<(TicketData & { id?: string }) | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const selected = state.selectedPasien;

    const isInvalid = (name: keyof FormLamaExt) => !!(formik.touched[name] && formik.errors[name]);
    const errMsg = (name: keyof FormLamaExt) =>
        isInvalid(name)
            ? <small className="p-error">{formik.errors[name]}</small>
            : <small className="p-error">&nbsp;</small>;

    const formik = useFormik<FormLamaExt>({
        initialValues: INIT,
        validate: (v) => {
            const e: Partial<Record<keyof FormLamaExt, string>> = {};
            if (!v.no_rm)         e.no_rm         = 'Pilih pasien terlebih dahulu.';
            if (!v.kode_poli)     e.kode_poli     = 'Poli tujuan wajib dipilih.';
            if (!v.kode_penjamin) e.kode_penjamin = 'Penjamin wajib dipilih.';
            return e;
        },
        onSubmit: async (values) => {
            setLoadSubmit(true);
            try {
                const body = {
                    no_rm:             values.no_rm,
                    kode_poli:         values.kode_poli,
                    kode_penjamin:     values.kode_penjamin,
                    kode_dokter:       values.kode_dokter       || null,
                    kode_antrian_awal: values.kode_antrian_awal || null,
                    tz:                getTzUser(),
                };
                const res = await postData(apiEndpointDaftarLama, body, { 'X-Level': '1' });
                const data = res.data?.data;
                const selPenjamin = state.penjaminOptions.find((p) => p.kode_penjamin === values.kode_penjamin);
                const selDokter   = state.dokterOptions.find((d) => d.id === values.kode_dokter);
                setResultData({
                    id:            data?.id,
                    no_rm:         data?.no_rm,
                    nama_pasien:   data?.nama_pasien,
                    no_antrian:    data?.no_antrian,
                    nama_poli:     data?.nama_poli,
                    nama_penjamin: selPenjamin ? selPenjamin.nama_penjamin : undefined,
                    nama_dokter:   selDokter ? selDokter.nama_dokter : undefined,
                });
                setShowResult(true);
                formik.resetForm();
                setState((p) => ({ ...p, selectedPasien: null, searchQuery: '', searchResults: [] }));
            } catch (error: any) {
                const e = error?.response?.data || error;
                showError(toast, e?.message || 'Terjadi Kesalahan');
            } finally {
                setLoadSubmit(false);
            }
        },
    });

    // Debounced search
    const handleSearch = useCallback((value: string) => {
        setState((p) => ({ ...p, searchQuery: value }));
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (value.length < 2) {
            setState((p) => ({ ...p, searchResults: [] }));
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setState((p) => ({ ...p, loadSearch: true }));
            try {
                const res = await postData(apiEndpointSearch, { search: value });
                setState((p) => ({ ...p, searchResults: res.data?.data || [] }));
            } catch {
                setState((p) => ({ ...p, searchResults: [] }));
            } finally {
                setState((p) => ({ ...p, loadSearch: false }));
            }
        }, 400);
    }, [setState]);

    const handleSelectPasien = (p: PasienResult) => {
        setState((prev) => ({
            ...prev,
            selectedPasien: p,
            searchResults: [],
            searchQuery: `${p.nama_pasien} — ${p.no_rm}`,
        }));
        formik.setFieldValue('no_rm', p.no_rm);
        formik.setFieldValue('kode_poli', '');
        formik.setFieldValue('kode_penjamin', '');
        formik.setFieldValue('kode_dokter', '');
    };

    const poliOptions = [
        ...state.poliOptions.map((p) => ({ label: p.nama_poli, value: p.kode_poli })),
    ];

    const penjaminOptions = [
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

    const antrianAwalOpts = [
        { label: '— Tanpa Kartu Antrian Loket —', value: '' },
        ...state.antrianOptions.map((a) => ({
            label: `Nomor ${a.no_antrian} (Dipanggil di Loket)`,
            value: a.kode_antrian,
        })),
    ];

    return (
        <>
            {/* Dialog Sukses */}
            <Dialog
                header="✅ Kunjungan Berhasil Didaftarkan"
                visible={showResult}
                onHide={() => setShowResult(false)}
                modal style={{ width: '440px' }}
                footer={
                    <div className="flex justify-content-between gap-2 w-full">
                        <Button
                            label="Cetak Nomor Antrian"
                            icon="pi pi-print"
                            onClick={() => printAntrianTicket(resultData)}
                        />
                        <Button
                            label="Tutup"
                            icon="pi pi-times"
                            severity="secondary"
                            outlined
                            onClick={() => setShowResult(false)}
                        />
                    </div>
                }
            >
                <div className="flex flex-column align-items-center text-center gap-3 py-3">
                    <i className="pi pi-check-circle text-green-500 text-6xl" />
                    <div>
                        <p className="text-color-secondary mb-1">Kunjungan baru terdaftar</p>
                        <h2 className="text-3xl font-bold text-green-600 mb-1">{resultData?.no_rm}</h2>
                        <p className="font-semibold">{resultData?.nama_pasien}</p>

                        <div className="surface-100 border-round p-3 mt-3 flex flex-column gap-1">
                            <span className="text-xs text-color-secondary uppercase tracking-wider font-bold">Nomor Antrian Poli</span>
                            <span className="font-bold text-blue-600 text-3xl">{resultData?.no_antrian}</span>
                            <span className="text-sm font-medium text-color-secondary">{resultData?.nama_poli}</span>
                        </div>

                        <Button
                            label="Cetak Struk Antrian"
                            icon="pi pi-print"
                            severity="success"
                            className="mt-3 w-full"
                            onClick={() => printAntrianTicket(resultData)}
                        />

                        <p className="text-sm text-color-secondary mt-3">ID Pendaftaran: {resultData?.id}</p>
                    </div>
                </div>
            </Dialog>

            <div className="flex flex-column gap-4">
                {/* ── STEP 1: Cari Pasien ── */}
                <div className="card p-4">
                    <h4 className="text-lg font-semibold mb-3 flex align-items-center gap-2">
                        <i className="pi pi-search text-blue-500" /> Langkah 1 — Cari Pasien Lama
                    </h4>
                    <div className="flex flex-column gap-2">
                        <label className="font-semibold text-sm">Cari berdasarkan No. RM / NIK / Nama Pasien</label>
                        <span className="p-input-icon-left w-full">
                            <i className={`pi ${state.loadSearch ? 'pi-spinner pi-spin' : 'pi-search'}`} />
                            <InputText
                                tabIndex={1}
                                value={state.searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Ketik minimal 2 karakter No. RM, NIK, atau Nama..."
                                className="w-full"
                            />
                        </span>

                        {/* Hasil Pencarian */}
                        {state.searchResults.length > 0 && !state.selectedPasien && (
                            <div className="border-1 border-round border-300 overflow-hidden surface-0 mt-1"
                                style={{ maxHeight: '280px', overflowY: 'auto' }}>
                                {state.searchResults.map((p) => (
                                    <div key={p.no_rm}
                                        className="flex align-items-center justify-between px-3 py-2 border-bottom-1 border-100 cursor-pointer hover:surface-100 transition-colors transition-duration-150"
                                        onClick={() => handleSelectPasien(p)}
                                    >
                                        <div>
                                            <p className="font-semibold mb-0 text-blue-700">{p.nama_pasien}</p>
                                            <p className="text-sm text-color-secondary mb-0">No. RM: {p.no_rm} | NIK: {p.nik}</p>
                                        </div>
                                        <div className="flex flex-column align-items-end gap-1">
                                            {p.jenis_kelamin && (
                                                <Tag value={p.jenis_kelamin === 'L' ? '♂ Laki-laki' : '♀ Perempuan'}
                                                    severity={p.jenis_kelamin === 'L' ? 'info' : 'danger'} />
                                            )}
                                            <small className="text-color-secondary">{p.no_hp || '—'}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {state.searchQuery.length >= 2 && !state.loadSearch && state.searchResults.length === 0 && !state.selectedPasien && (
                            <small className="text-color-secondary">Tidak ada data pasien yang cocok.</small>
                        )}
                    </div>
                </div>

                {/* ── STEP 2: Data Kunjungan (Aktif) & Biodata (Readonly) ── */}
                {selected && (
                    <form onSubmit={formik.handleSubmit} className="flex flex-column gap-4">

                        {/* SECTION 1: DATA KUNJUNGAN (Aktif - Wajib Diisi) */}
                        <div className="card p-4 surface-card border-left-4 border-blue-500">
                            <div className="flex justify-content-between align-items-center mb-3">
                                <div>
                                    <h4 className="text-lg font-semibold mb-1 flex align-items-center gap-2 text-blue-700">
                                        <i className="pi pi-building text-blue-600" /> Section 1 — Data Kunjungan Hari Ini
                                    </h4>
                                    <p className="text-xs text-color-secondary mb-0">
                                        Isi poli tujuan, penjamin, dan dokter untuk kunjungan ini. Nomor antrian poli digenerate otomatis per poli per hari.
                                    </p>
                                </div>
                                <Button type="button" icon="pi pi-times" label="Ganti Pasien" severity="secondary" outlined size="small"
                                    onClick={() => {
                                        setState((p) => ({ ...p, selectedPasien: null, searchQuery: '', searchResults: [] }));
                                        formik.resetForm();
                                    }} />
                            </div>

                            <div className="grid">
                                {/* Poli Tujuan — wajib */}
                                <div className="col-12 md:col-6">
                                    <div className="flex flex-column gap-1">
                                        <label className="font-semibold text-sm">
                                            Poli Tujuan <span className="text-red-500">*</span>
                                        </label>
                                        <Dropdown
                                            tabIndex={2}
                                            value={formik.values.kode_poli}
                                            options={poliOptions}
                                            onChange={(e) => formik.setFieldValue('kode_poli', e.value)}
                                            placeholder={state.loadPoli ? 'Memuat...' : 'Pilih Poli Tujuan'}
                                            disabled={state.loadPoli}
                                            className={isInvalid('kode_poli') ? 'p-invalid w-full' : 'w-full'}
                                            filter />
                                        {errMsg('kode_poli')}
                                    </div>
                                </div>

                                {/* Penjamin — wajib */}
                                <div className="col-12 md:col-6">
                                    <div className="flex flex-column gap-1">
                                        <label className="font-semibold text-sm">
                                            Kode Penjamin <span className="text-red-500">*</span>
                                        </label>
                                        <Dropdown
                                            tabIndex={3}
                                            value={formik.values.kode_penjamin}
                                            options={penjaminOptions}
                                            onChange={(e) => formik.setFieldValue('kode_penjamin', e.value)}
                                            placeholder={state.loadPenjamin ? 'Memuat...' : 'Pilih Penjamin'}
                                            disabled={state.loadPenjamin}
                                            className={isInvalid('kode_penjamin') ? 'p-invalid w-full' : 'w-full'} />
                                        {errMsg('kode_penjamin')}
                                    </div>
                                </div>

                                {/* Dokter Tujuan */}
                                <div className="col-12 md:col-6">
                                    <div className="flex flex-column gap-1">
                                        <label className="font-semibold text-sm">
                                            Dokter Tujuan <small className="text-color-secondary">(Opsional)</small>
                                        </label>
                                        <Dropdown
                                            tabIndex={4}
                                            value={formik.values.kode_dokter}
                                            options={dokterOptions}
                                            onChange={(e) => formik.setFieldValue('kode_dokter', e.value)}
                                            placeholder={state.loadDokter ? 'Memuat...' : 'Pilih Dokter'}
                                            disabled={state.loadDokter} className="w-full" filter />
                                        <small className="p-error">&nbsp;</small>
                                    </div>
                                </div>

                                {/* Kartu Antrian Loket */}
                                <div className="col-12 md:col-6">
                                    <div className="flex flex-column gap-1">
                                        <label className="font-semibold text-sm">
                                            Kartu Antrian Loket <small className="text-color-secondary">(Opsional)</small>
                                        </label>
                                        <Dropdown
                                            tabIndex={5}
                                            value={formik.values.kode_antrian_awal}
                                            options={antrianAwalOpts}
                                            onChange={(e) => formik.setFieldValue('kode_antrian_awal', e.value)}
                                            placeholder="Pilih nomor antrian loket dipanggil..."
                                            className="w-full" />
                                        <small className="text-color-secondary">Status antrian loket ini akan otomatis diubah menjadi &apos;selesai&apos;</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2-5: BIODATA PASIEN (Readonly) */}
                        <div className="card p-4 surface-100 border-1 border-300">
                            <div className="flex align-items-center justify-content-between mb-3 border-bottom-1 border-300 pb-2">
                                <h4 className="text-lg font-semibold mb-0 flex align-items-center gap-2 text-700">
                                    <i className="pi pi-lock text-500" /> Biodata Pasien (Readonly)
                                </h4>
                                <Tag value="Biodata Tetap" severity="secondary" icon="pi pi-shield" />
                            </div>

                            <div className="grid">
                                {/* Identitas Pasien */}
                                <div className="col-12 md:col-6">
                                    <div className="p-3 surface-0 border-round mb-3">
                                        <h5 className="text-sm font-bold text-indigo-700 mb-2 border-bottom-1 border-100 pb-1">
                                            Identitas Pasien
                                        </h5>
                                        <InfoRow label="No. Rekam Medis" value={selected.no_rm} />
                                        <InfoRow label="NIK" value={selected.nik} />
                                        <InfoRow label="Nama Pasien" value={selected.nama_pasien} />
                                        <InfoRow label="Nama Ibu Kandung" value={selected.nama_ibu_kandung} />
                                        <InfoRow label="Tempat, Tgl Lahir" value={`${selected.tempat_lahir || '—'}, ${selected.tanggal_lahir?.slice(0, 10) || '—'}`} />
                                        <InfoRow label="Jenis Kelamin" value={selected.jenis_kelamin === 'L' ? 'Laki-laki' : selected.jenis_kelamin === 'P' ? 'Perempuan' : null} />
                                        <InfoRow label="Golongan Darah" value={selected.golongan_darah} />
                                        <InfoRow label="Agama" value={selected.agama} />
                                        <InfoRow label="Status Kawin" value={selected.status_perkawinan} />
                                        <InfoRow label="Kewarganegaraan" value={selected.kewarganegaraan} />
                                    </div>
                                </div>

                                {/* Education, Alamat & Kontak */}
                                <div className="col-12 md:col-6">
                                    <div className="p-3 surface-0 border-round mb-3">
                                        <h5 className="text-sm font-bold text-teal-700 mb-2 border-bottom-1 border-100 pb-1">
                                            Pendidikan &amp; Pekerjaan
                                        </h5>
                                        <InfoRow label="Pendidikan" value={selected.pendidikan} />
                                        <InfoRow label="Pekerjaan" value={selected.pekerjaan} />
                                    </div>

                                    <div className="p-3 surface-0 border-round mb-3">
                                        <h5 className="text-sm font-bold text-orange-700 mb-2 border-bottom-1 border-100 pb-1">
                                            Alamat &amp; Kontak
                                        </h5>
                                        <InfoRow label="Wilayah" value={`${selected.kelurahan || '—'}, ${selected.kecamatan || '—'}, ${selected.kota_kabupaten || '—'}, ${selected.provinsi || '—'}`} />
                                        <InfoRow label="Detail Alamat" value={selected.detail_alamat} />
                                        <InfoRow label="Kode Pos" value={selected.kode_pos} />
                                        <InfoRow label="Email" value={selected.email} />
                                        <InfoRow label="No. HP" value={selected.no_hp} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-content-end gap-2 pb-4">
                            <Button type="button" label="Batal" icon="pi pi-times"
                                severity="secondary" outlined
                                onClick={() => {
                                    formik.resetForm();
                                    setState((p) => ({ ...p, selectedPasien: null, searchQuery: '', searchResults: [] }));
                                }} />
                            <Button type="submit" label="Daftarkan Kunjungan" icon="pi pi-check"
                                severity="success" loading={loadSubmit} tabIndex={6} />
                        </div>
                    </form>
                )}
            </div>
        </>
    );
};

export default FormLamaComponent;
