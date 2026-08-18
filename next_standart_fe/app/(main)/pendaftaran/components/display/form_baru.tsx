'use client';

import { useFormik } from 'formik';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { useState, useCallback } from 'react';
import postData from '@/lib/axios/postData';
import { showError } from '@/lib/tools/generalTools';
import { getTzUser } from '@/lib/tools/dateTools';
import {
    FormBaru, FormBaruProps, WilayahOption,
    OPT_AGAMA, OPT_GOLONGAN_DARAH, OPT_JENIS_KELAMIN,
    OPT_STATUS_KAWIN, OPT_PEKERJAAN, OPT_PENDIDIKAN,
} from '../interfaces';
import {
    apiEndpointDaftarBaru,
    apiEndpointProvinsi, apiEndpointKabupaten,
    apiEndpointKecamatan, apiEndpointKelurahan,
} from '../endpoints';

// ─── Field helper — WAJIB di luar komponen agar tidak re-mount saat re-render ──
const Field = ({
    label, required, children,
}: {
    label: string; required?: boolean; children: React.ReactNode;
}) => (
    <div className="flex flex-column gap-1">
        <label className="font-semibold text-sm">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

interface FormBaruExt extends FormBaru {
    kode_antrian_awal?: string;
}

const INIT: FormBaruExt = {
    kode_poli: '',
    kode_penjamin: '',
    kode_dokter: '',
    kode_antrian_awal: '',
    nik: '', nama_pasien: '', email: '', detail_alamat: '',
    nama_ibu_kandung: '', tanggal_lahir: '', tempat_lahir: '',
    jenis_kelamin: '', golongan_darah: '', agama: '',
    status_perkawinan: '', pekerjaan: '', pendidikan: '',
    kewarganegaraan: 'WNI',
    id_provinsi: '', provinsi: '',
    id_kabupaten: '', kota_kabupaten: '',
    id_kecamatan: '', kecamatan: '',
    id_kelurahan: '', kelurahan: '',
    kode_pos: '', no_hp: '', tz: '',
};

const FormBaruComponent = ({ state, setState, toast }: FormBaruProps) => {
    const [loadSubmit, setLoadSubmit] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [resultData, setResultData] = useState<{
        no_rm: string; nama_pasien: string; no_antrian: string; nama_poli: string;
    } | null>(null);

    // Wilayah cascading state
    const [provinsiOptions, setProvinsiOptions]   = useState<WilayahOption[]>([]);
    const [kabupatenOptions, setKabupatenOptions] = useState<WilayahOption[]>([]);
    const [kecamatanOptions, setKecamatanOptions] = useState<WilayahOption[]>([]);
    const [kelurahanOptions, setKelurahanOptions] = useState<WilayahOption[]>([]);
    const [loadWilayah, setLoadWilayah]           = useState({ prov: false, kab: false, kec: false, kel: false });
    const [provinsiLoaded, setProvinsiLoaded]     = useState(false);

    const isInvalid = (name: keyof FormBaruExt) => !!(formik.touched[name] && formik.errors[name]);
    const errMsg = (name: keyof FormBaruExt) =>
        isInvalid(name)
            ? <small className="p-error">{formik.errors[name]}</small>
            : <small className="p-error">&nbsp;</small>;

    // ── Wilayah loaders ──────────────────────────────────────────────────────
    const handleProvinsiOpen = useCallback(async () => {
        if (provinsiLoaded) return;
        setLoadWilayah((p) => ({ ...p, prov: true }));
        try {
            const res = await postData(apiEndpointProvinsi, {});
            setProvinsiOptions(res.data?.data || []);
            setProvinsiLoaded(true);
        } catch { showError(toast, 'Gagal memuat data provinsi'); }
        finally { setLoadWilayah((p) => ({ ...p, prov: false })); }
    }, [provinsiLoaded, toast]);

    const handleProvinsiChange = useCallback(async (item: WilayahOption) => {
        formik.setFieldValue('id_provinsi',    item.id);
        formik.setFieldValue('provinsi',       item.nama);
        formik.setFieldValue('id_kabupaten',   '');
        formik.setFieldValue('kota_kabupaten', '');
        formik.setFieldValue('id_kecamatan',   '');
        formik.setFieldValue('kecamatan',      '');
        formik.setFieldValue('id_kelurahan',   '');
        formik.setFieldValue('kelurahan',      '');
        setKabupatenOptions([]); setKecamatanOptions([]); setKelurahanOptions([]);
        setLoadWilayah((p) => ({ ...p, kab: true }));
        try {
            const res = await postData(apiEndpointKabupaten, { id_provinsi: item.id });
            setKabupatenOptions(res.data?.data || []);
        } catch { showError(toast, 'Gagal memuat data kota/kabupaten'); }
        finally { setLoadWilayah((p) => ({ ...p, kab: false })); }
    }, [toast]); // eslint-disable-line

    const handleKabupatenChange = useCallback(async (item: WilayahOption) => {
        formik.setFieldValue('id_kabupaten',   item.id);
        formik.setFieldValue('kota_kabupaten', item.nama);
        formik.setFieldValue('id_kecamatan',   '');
        formik.setFieldValue('kecamatan',      '');
        formik.setFieldValue('id_kelurahan',   '');
        formik.setFieldValue('kelurahan',      '');
        setKecamatanOptions([]); setKelurahanOptions([]);
        setLoadWilayah((p) => ({ ...p, kec: true }));
        try {
            const res = await postData(apiEndpointKecamatan, { id_kabupaten: item.id });
            setKecamatanOptions(res.data?.data || []);
        } catch { showError(toast, 'Gagal memuat data kecamatan'); }
        finally { setLoadWilayah((p) => ({ ...p, kec: false })); }
    }, [toast]); // eslint-disable-line

    const handleKecamatanChange = useCallback(async (item: WilayahOption) => {
        formik.setFieldValue('id_kecamatan', item.id);
        formik.setFieldValue('kecamatan',    item.nama);
        formik.setFieldValue('id_kelurahan', '');
        formik.setFieldValue('kelurahan',    '');
        setKelurahanOptions([]);
        setLoadWilayah((p) => ({ ...p, kel: true }));
        try {
            const res = await postData(apiEndpointKelurahan, { id_kecamatan: item.id });
            setKelurahanOptions(res.data?.data || []);
        } catch { showError(toast, 'Gagal memuat data kelurahan'); }
        finally { setLoadWilayah((p) => ({ ...p, kel: false })); }
    }, [toast]); // eslint-disable-line

    const formik = useFormik<FormBaruExt>({
        initialValues: INIT,
        validate: (v) => {
            const e: Partial<Record<keyof FormBaruExt, string>> = {};
            if (!v.kode_poli)     e.kode_poli     = 'Poli tujuan wajib dipilih.';
            if (!v.kode_penjamin) e.kode_penjamin = 'Penjamin wajib dipilih.';
            if (!v.nik)           e.nik           = 'NIK wajib diisi.';
            if (!v.nama_pasien)   e.nama_pasien   = 'Nama pasien wajib diisi.';
            if (!v.email)         e.email         = 'Email wajib diisi.';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'Format email tidak valid.';
            if (!v.detail_alamat) e.detail_alamat = 'Detail alamat wajib diisi.';
            return e;
        },
        onSubmit: async (values) => {
            setLoadSubmit(true);
            try {
                const body: Record<string, any> = {
                    ...values,
                    tanggal_lahir: values.tanggal_lahir
                        ? new Date(values.tanggal_lahir).toISOString().slice(0, 10)
                        : null,
                    tz: getTzUser(),
                };
                delete body.id_provinsi;
                delete body.id_kabupaten;
                delete body.id_kecamatan;
                delete body.id_kelurahan;
                Object.keys(body).forEach((k) => { if (body[k] === '') body[k] = null; });

                const res = await postData(apiEndpointDaftarBaru, body, { 'X-Level': '1' });
                const data = res.data?.data;
                setResultData({
                    no_rm:       data?.no_rm,
                    nama_pasien: data?.nama_pasien,
                    no_antrian:  data?.no_antrian,
                    nama_poli:   data?.nama_poli,
                });
                setShowDialog(true);
                formik.resetForm();
                setKabupatenOptions([]);
                setKecamatanOptions([]);
                setKelurahanOptions([]);
            } catch (error: any) {
                const e = error?.response?.data || error;
                showError(toast, e?.message || 'Terjadi Kesalahan');
            } finally {
                setLoadSubmit(false);
            }
        },
    });

    const poliOptions = state.poliOptions.map((p) => ({ label: p.nama_poli, value: p.kode_poli }));
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

    const toWilayahOpts = (items: WilayahOption[]) => items.map((w) => ({ label: w.nama, value: w }));
    const findWilayah   = (items: WilayahOption[], id: string) => items.find((w) => w.id === id) ?? null;

    return (
        <>
            {/* Dialog sukses — tampilkan No. RM + No. Antrian Poli */}
            <Dialog
                header="✅ Pendaftaran Berhasil"
                visible={showDialog}
                onHide={() => setShowDialog(false)}
                modal
                style={{ width: '420px' }}
                footer={<Button label="Tutup" icon="pi pi-times" onClick={() => setShowDialog(false)} />}
            >
                <div className="flex flex-column align-items-center text-center gap-3 py-3">
                    <i className="pi pi-id-card text-green-500 text-6xl" />
                    <div>
                        <p className="text-color-secondary mb-1">Pasien baru berhasil didaftarkan</p>
                        <h2 className="text-3xl font-bold text-green-600 mb-1">{resultData?.no_rm}</h2>
                        <p className="font-semibold">{resultData?.nama_pasien}</p>
                        
                        <div className="surface-100 border-round p-3 mt-3 flex flex-column gap-1">
                            <span className="text-xs text-color-secondary uppercase tracking-wider font-bold">Nomor Antrian Poli</span>
                            <span className="font-bold text-blue-600 text-3xl">{resultData?.no_antrian}</span>
                            <span className="text-sm font-medium text-color-secondary">{resultData?.nama_poli}</span>
                        </div>

                        <p className="text-sm text-color-secondary mt-3">
                            Simpan No. Rekam Medis ini untuk kunjungan berikutnya.
                        </p>
                    </div>
                </div>
            </Dialog>

            <form onSubmit={formik.handleSubmit} className="flex flex-column gap-4">

                {/* ── SECTION 1: DATA KUNJUNGAN ── */}
                <div className="card p-4 surface-card border-left-4 border-blue-500">
                    <h4 className="text-lg font-semibold mb-3 flex align-items-center gap-2 text-blue-700">
                        <i className="pi pi-building text-blue-600" /> Section 1 — Data Kunjungan
                    </h4>
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <Field label="Poli Tujuan" required>
                                <Dropdown
                                    tabIndex={1}
                                    value={formik.values.kode_poli}
                                    options={poliOptions}
                                    onChange={(e) => formik.setFieldValue('kode_poli', e.value)}
                                    placeholder={state.loadPoli ? 'Memuat...' : poliOptions.length === 0 ? 'Tidak ada data poli' : 'Pilih Poli Tujuan'}
                                    disabled={state.loadPoli}
                                    className={isInvalid('kode_poli') ? 'p-invalid w-full' : 'w-full'}
                                    filter
                                />
                                {errMsg('kode_poli')}
                            </Field>
                        </div>
                        <div className="col-12 md:col-6">
                            <Field label="Kode Penjamin" required>
                                <Dropdown
                                    tabIndex={2}
                                    value={formik.values.kode_penjamin}
                                    options={penjaminOptions}
                                    onChange={(e) => formik.setFieldValue('kode_penjamin', e.value)}
                                    placeholder={state.loadPenjamin ? 'Memuat...' : 'Pilih Penjamin'}
                                    disabled={state.loadPenjamin}
                                    className={isInvalid('kode_penjamin') ? 'p-invalid w-full' : 'w-full'}
                                />
                                {errMsg('kode_penjamin')}
                            </Field>
                        </div>
                        <div className="col-12 md:col-6">
                            <Field label="Dokter Tujuan">
                                <Dropdown
                                    tabIndex={3}
                                    value={formik.values.kode_dokter}
                                    options={dokterOptions}
                                    onChange={(e) => formik.setFieldValue('kode_dokter', e.value)}
                                    placeholder={state.loadDokter ? 'Memuat...' : 'Pilih Dokter (Opsional)'}
                                    disabled={state.loadDokter} className="w-full" filter />
                                <small className="p-error">&nbsp;</small>
                            </Field>
                        </div>
                        <div className="col-12 md:col-6">
                            <Field label="Kartu Antrian Loket">
                                <Dropdown
                                    tabIndex={4}
                                    value={formik.values.kode_antrian_awal}
                                    options={antrianAwalOpts}
                                    onChange={(e) => formik.setFieldValue('kode_antrian_awal', e.value)}
                                    placeholder="Pilih nomor antrian loket dipanggil..."
                                    className="w-full"
                                />
                                <small className="text-color-secondary">Status antrian loket ini akan otomatis diubah menjadi &apos;selesai&apos;</small>
                            </Field>
                        </div>
                    </div>
                </div>

                {/* ── SECTION 2: IDENTITAS PASIEN ── */}
                <div className="card p-4">
                    <h4 className="text-lg font-semibold mb-3 flex align-items-center gap-2 text-indigo-700">
                        <i className="pi pi-id-card text-indigo-600" /> Section 2 — Identitas Pasien
                    </h4>
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <Field label="NIK" required>
                                <InputText
                                    tabIndex={5}
                                    value={formik.values.nik}
                                    onChange={(e) => formik.setFieldValue('nik', e.target.value)}
                                    placeholder="16 digit NIK" maxLength={50}
                                    className={isInvalid('nik') ? 'p-invalid w-full' : 'w-full'} />
                                {errMsg('nik')}
                            </Field>
                        </div>
                        <div className="col-12 md:col-6">
                            <Field label="Nama Pasien" required>
                                <InputText
                                    tabIndex={6}
                                    value={formik.values.nama_pasien}
                                    onChange={(e) => formik.setFieldValue('nama_pasien', e.target.value)}
                                    placeholder="Nama sesuai KTP" maxLength={100}
                                    className={isInvalid('nama_pasien') ? 'p-invalid w-full' : 'w-full'} />
                                {errMsg('nama_pasien')}
                            </Field>
                        </div>
                        <div className="col-12 md:col-6">
                            <Field label="Nama Ibu Kandung">
                                <InputText
                                    tabIndex={7}
                                    value={formik.values.nama_ibu_kandung}
                                    onChange={(e) => formik.setFieldValue('nama_ibu_kandung', e.target.value)}
                                    placeholder="Nama ibu kandung" maxLength={100} className="w-full" />
                                <small className="p-error">&nbsp;</small>
                            </Field>
                        </div>
                        <div className="col-12 md:col-3">
                            <Field label="Tempat Lahir">
                                <InputText
                                    tabIndex={8}
                                    value={formik.values.tempat_lahir}
                                    onChange={(e) => formik.setFieldValue('tempat_lahir', e.target.value)}
                                    placeholder="Kota lahir" maxLength={50} className="w-full" />
                                <small className="p-error">&nbsp;</small>
                            </Field>
                        </div>
                        <div className="col-12 md:col-3">
                            <Field label="Tanggal Lahir">
                                <Calendar
                                    tabIndex={9}
                                    value={formik.values.tanggal_lahir ? new Date(formik.values.tanggal_lahir) : null}
                                    onChange={(e) => formik.setFieldValue('tanggal_lahir', e.value)}
                                    dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" showIcon className="w-full" />
                                <small className="p-error">&nbsp;</small>
                            </Field>
                        </div>
                        <div className="col-12 md:col-4">
                            <Field label="Jenis Kelamin">
                                <Dropdown
                                    tabIndex={10}
                                    value={formik.values.jenis_kelamin}
                                    options={OPT_JENIS_KELAMIN}
                                    onChange={(e) => formik.setFieldValue('jenis_kelamin', e.value)}
                                    placeholder="Pilih Jenis Kelamin" className="w-full" />
                                <small className="p-error">&nbsp;</small>
                            </Field>
                        </div>
                        <div className="col-12 md:col-4">
                            <Field label="Golongan Darah">
                                <Dropdown
                                    tabIndex={11}
                                    value={formik.values.golongan_darah}
                                    options={OPT_GOLONGAN_DARAH}
                                    onChange={(e) => formik.setFieldValue('golongan_darah', e.value)}
                                    placeholder="Pilih Golongan Darah" className="w-full" />
                                <small className="p-error">&nbsp;</small>
                            </Field>
                        </div>
                        <div className="col-12 md:col-4">
                            <Field label="Agama">
                                <Dropdown
                                    tabIndex={12}
                                    value={formik.values.agama}
                                    options={OPT_AGAMA}
                                    onChange={(e) => formik.setFieldValue('agama', e.value)}
                                    placeholder="Pilih Agama" className="w-full" />
                                <small className="p-error">&nbsp;</small>
                            </Field>
                        </div>
                        <div className="col-12 md:col-6">
                            <Field label="Status Perkawinan">
                                <Dropdown
                                    tabIndex={13}
                                    value={formik.values.status_perkawinan}
                                    options={OPT_STATUS_KAWIN}
                                    onChange={(e) => formik.setFieldValue('status_perkawinan', e.value)}
                                    placeholder="Pilih Status Perkawinan" className="w-full" />
                                <small className="p-error">&nbsp;</small>
                            </Field>
                        </div>
                        <div className="col-12 md:col-6">
                            <Field label="Kewarganegaraan">
                                <InputText
                                    tabIndex={14}
                                    value={formik.values.kewarganegaraan}
                                    onChange={(e) => formik.setFieldValue('kewarganegaraan', e.target.value)}
                                    placeholder="WNI" maxLength={30} className="w-full" />
                                <small className="p-error">&nbsp;</small>
                            </Field>
                        </div>
                    </div>
                </div>

                {/* ── SECTION 3: PENDIDIKAN & PEKERJAAN ── */}
                <div className="card p-4">
                    <h4 className="text-lg font-semibold mb-3 flex align-items-center gap-2 text-teal-700">
                        <i className="pi pi-briefcase text-teal-600" /> Section 3 — Pendidikan &amp; Pekerjaan
                    </h4>
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <Field label="Pendidikan">
                                <Dropdown
                                    tabIndex={15}
                                    value={formik.values.pendidikan}
                                    options={OPT_PENDIDIKAN}
                                    onChange={(e) => formik.setFieldValue('pendidikan', e.value)}
                                    placeholder="Pilih Pendidikan Terakhir" className="w-full" />
                                <small className="p-error">&nbsp;</small>
                            </Field>
                        </div>
                        <div className="col-12 md:col-6">
                            <Field label="Pekerjaan">
                                <Dropdown
                                    tabIndex={16}
                                    value={formik.values.pekerjaan}
                                    options={OPT_PEKERJAAN}
                                    onChange={(e) => formik.setFieldValue('pekerjaan', e.value)}
                                    placeholder="Pilih Pekerjaan" className="w-full" filter />
                                <small className="p-error">&nbsp;</small>
                            </Field>
                        </div>
                    </div>
                </div>

                {/* ── SECTION 4: ALAMAT ── */}
                <div className="card p-4">
                    <h4 className="text-lg font-semibold mb-3 flex align-items-center gap-2 text-orange-700">
                        <i className="pi pi-map-marker text-orange-600" /> Section 4 — Alamat
                    </h4>
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <Field label="Provinsi">
                                <Dropdown
                                    tabIndex={17}
                                    value={findWilayah(provinsiOptions, formik.values.id_provinsi)}
                                    options={toWilayahOpts(provinsiOptions)}
                                    onChange={(e) => handleProvinsiChange(e.value)}
                                    onShow={handleProvinsiOpen}
                                    placeholder={loadWilayah.prov ? 'Memuat...' : 'Pilih Provinsi (Opsional)'}
                                    disabled={loadWilayah.prov}
                                    className="w-full" filter
                                    filterPlaceholder="Cari provinsi..."
                                    itemTemplate={(o) => <span>{o.label}</span>}
                                    valueTemplate={(o) => o
                                        ? <span>{o.label}</span>
                                        : <span className="text-color-secondary">Pilih Provinsi (Opsional)</span>}
                                />
                                <small className="p-error">&nbsp;</small>
                            </Field>
                        </div>
                        <div className="col-12 md:col-6">
                            <Field label="Kota / Kabupaten">
                                <Dropdown
                                    tabIndex={18}
                                    value={findWilayah(kabupatenOptions, formik.values.id_kabupaten)}
                                    options={toWilayahOpts(kabupatenOptions)}
                                    onChange={(e) => handleKabupatenChange(e.value)}
                                    placeholder={loadWilayah.kab ? 'Memuat...' : !formik.values.id_provinsi ? 'Pilih provinsi dahulu' : 'Pilih Kota/Kabupaten'}
                                    disabled={!formik.values.id_provinsi || loadWilayah.kab}
                                    className="w-full" filter
                                    filterPlaceholder="Cari kota/kabupaten..."
                                    itemTemplate={(o) => <span>{o.label}</span>}
                                    valueTemplate={(o) => o
                                        ? <span>{o.label}</span>
                                        : <span className="text-color-secondary">Pilih Kota/Kabupaten</span>}
                                />
                                <small className="p-error">&nbsp;</small>
                            </Field>
                        </div>
                        <div className="col-12 md:col-6">
                            <Field label="Kecamatan">
                                <Dropdown
                                    tabIndex={19}
                                    value={findWilayah(kecamatanOptions, formik.values.id_kecamatan)}
                                    options={toWilayahOpts(kecamatanOptions)}
                                    onChange={(e) => handleKecamatanChange(e.value)}
                                    placeholder={loadWilayah.kec ? 'Memuat...' : !formik.values.id_kabupaten ? 'Pilih kota dahulu' : 'Pilih Kecamatan'}
                                    disabled={!formik.values.id_kabupaten || loadWilayah.kec}
                                    className="w-full" filter
                                    filterPlaceholder="Cari kecamatan..."
                                    itemTemplate={(o) => <span>{o.label}</span>}
                                    valueTemplate={(o) => o
                                        ? <span>{o.label}</span>
                                        : <span className="text-color-secondary">Pilih Kecamatan</span>}
                                />
                                <small className="p-error">&nbsp;</small>
                            </Field>
                        </div>
                        <div className="col-12 md:col-6">
                            <Field label="Kelurahan / Desa">
                                <Dropdown
                                    tabIndex={20}
                                    value={findWilayah(kelurahanOptions, formik.values.id_kelurahan)}
                                    options={toWilayahOpts(kelurahanOptions)}
                                    onChange={(e) => {
                                        formik.setFieldValue('id_kelurahan', e.value.id);
                                        formik.setFieldValue('kelurahan', e.value.nama);
                                    }}
                                    placeholder={loadWilayah.kel ? 'Memuat...' : !formik.values.id_kecamatan ? 'Pilih kecamatan dahulu' : 'Pilih Kelurahan'}
                                    disabled={!formik.values.id_kecamatan || loadWilayah.kel}
                                    className="w-full" filter
                                    filterPlaceholder="Cari kelurahan..."
                                    itemTemplate={(o) => <span>{o.label}</span>}
                                    valueTemplate={(o) => o
                                        ? <span>{o.label}</span>
                                        : <span className="text-color-secondary">Pilih Kelurahan</span>}
                                />
                                <small className="p-error">&nbsp;</small>
                            </Field>
                        </div>
                        <div className="col-12">
                            <Field label="Detail Alamat" required>
                                <InputTextarea
                                    tabIndex={21}
                                    value={formik.values.detail_alamat}
                                    onChange={(e) => formik.setFieldValue('detail_alamat', e.target.value)}
                                    rows={3} placeholder="Nama jalan, nomor rumah, RT/RW, dll."
                                    className={isInvalid('detail_alamat') ? 'p-invalid w-full' : 'w-full'} />
                                {errMsg('detail_alamat')}
                            </Field>
                        </div>
                        <div className="col-12 md:col-4">
                            <Field label="Kode Pos">
                                <InputText
                                    tabIndex={22}
                                    value={formik.values.kode_pos}
                                    onChange={(e) => formik.setFieldValue('kode_pos', e.target.value)}
                                    placeholder="5 digit kode pos" maxLength={10} className="w-full" />
                                <small className="p-error">&nbsp;</small>
                            </Field>
                        </div>
                    </div>
                </div>

                {/* ── SECTION 5: KONTAK ── */}
                <div className="card p-4">
                    <h4 className="text-lg font-semibold mb-3 flex align-items-center gap-2 text-purple-700">
                        <i className="pi pi-phone text-purple-600" /> Section 5 — Kontak
                    </h4>
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <Field label="Email" required>
                                <InputText
                                    tabIndex={23}
                                    value={formik.values.email}
                                    onChange={(e) => formik.setFieldValue('email', e.target.value)}
                                    placeholder="email@domain.com" maxLength={40}
                                    className={isInvalid('email') ? 'p-invalid w-full' : 'w-full'} />
                                {errMsg('email')}
                            </Field>
                        </div>
                        <div className="col-12 md:col-6">
                            <Field label="No. HP">
                                <InputText
                                    tabIndex={24}
                                    value={formik.values.no_hp}
                                    onChange={(e) => formik.setFieldValue('no_hp', e.target.value)}
                                    placeholder="08xxxxxxxxxx" maxLength={20} className="w-full" />
                                <small className="p-error">&nbsp;</small>
                            </Field>
                        </div>
                    </div>
                </div>

                {/* Tombol Submit */}
                <div className="flex justify-content-end gap-2 pb-4">
                    <Button type="button" label="Reset Form" icon="pi pi-refresh"
                        severity="secondary" outlined
                        onClick={() => {
                            formik.resetForm();
                            setKabupatenOptions([]); setKecamatanOptions([]); setKelurahanOptions([]);
                        }} />
                    <Button type="submit" label="Daftarkan Pasien Baru" icon="pi pi-check"
                        severity="success" loading={loadSubmit} tabIndex={25} />
                </div>
            </form>
        </>
    );
};

export default FormBaruComponent;
