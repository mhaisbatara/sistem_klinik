'use client';

import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { ComponentProps, LayananMedisItem, PermintaanLabItem, ResepDetailItem } from '../interfaces';
import {
    apiEndpointVitalsSave,
    apiEndpointLayananCreate,
    apiEndpointLayananDelete,
    apiEndpointLabCreate,
    apiEndpointLabDelete,
    apiEndpointResepCreate,
    apiEndpointResepDeleteItem,
    apiEndpointKunjunganSelesai,
} from '../endpoints';

const formatRupiah = (v: number | null | undefined) =>
    v !== null && v !== undefined
        ? `Rp ${Number(v).toLocaleString('id-ID')}`
        : '—';

const FormPemeriksaan = ({ state, setState, toast, getData, openPemeriksaan }: ComponentProps) => {
    const k = state.activeKunjungan;
    const v = state.vitals;

    // Vitals Form States
    const [tekananDarah, setTekananDarah] = useState('');
    const [suhu, setSuhu]                 = useState<number | null>(null);
    const [nadi, setNadi]                 = useState<number | null>(null);
    const [respirasi, setRespirasi]       = useState<number | null>(null);
    const [beratBadan, setBeratBadan]     = useState<number | null>(null);
    const [tinggiBadan, setTinggiBadan]   = useState<number | null>(null);

    // SOAP & Diagnosis States
    const [subjektif, setSubjektif]       = useState('');
    const [objektif, setObjektif]         = useState('');
    const [assessment, setAssessment]     = useState('');
    const [plan, setPlan]                 = useState('');
    const [icd10Code, setIcd10Code]       = useState('');
    const [icd10Deskripsi, setIcd10Deskripsi] = useState('');

    const [loadVitalsSave, setLoadVitalsSave] = useState(false);

    // Form states for adding Layanan
    const [jenisLayanan, setJenisLayanan] = useState<'konsultasi' | 'tindakan'>('konsultasi');
    const [namaLayanan, setNamaLayanan]   = useState('');
    const [qtyLayanan, setQtyLayanan]     = useState<number>(1);
    const [hargaLayanan, setHargaLayanan] = useState<number>(0);
    const [ketLayanan, setKetLayanan]     = useState('');
    const [loadLayananAdd, setLoadLayananAdd] = useState(false);

    // Form states for adding Lab
    const [selectedTarif, setSelectedTarif] = useState<string>('');
    const [loadLabAdd, setLoadLabAdd]       = useState(false);

    // Form states for adding Resep
    const [selectedObat, setSelectedObat]     = useState<string>('');
    const [dosisObat, setDosisObat]           = useState<string>('');
    const [jumlahObat, setJumlahObat]         = useState<number>(1);
    const [aturanObat, setAturanObat]         = useState<string>('');
    const [loadResepAdd, setLoadResepAdd]     = useState(false);

    const [loadSelesai, setLoadSelesai]       = useState(false);

    useEffect(() => {
        if (v) {
            setTekananDarah(v.tekanan_darah || '');
            setSuhu(v.suhu !== null && v.suhu !== undefined ? Number(v.suhu) : null);
            setNadi(v.nadi !== null && v.nadi !== undefined ? Number(v.nadi) : null);
            setRespirasi(v.respirasi !== null && v.respirasi !== undefined ? Number(v.respirasi) : null);
            setBeratBadan(v.berat_badan !== null && v.berat_badan !== undefined ? Number(v.berat_badan) : null);
            setTinggiBadan(v.tinggi_badan !== null && v.tinggi_badan !== undefined ? Number(v.tinggi_badan) : null);
            setSubjektif(v.subjektif || '');
            setObjektif(v.objektif || '');
            setAssessment(v.assessment || '');
            setPlan(v.plan || '');
            setIcd10Code(v.icd10_code || '');
            setIcd10Deskripsi(v.icd10_deskripsi || '');
        } else {
            setTekananDarah('');
            setSuhu(null);
            setNadi(null);
            setRespirasi(null);
            setBeratBadan(null);
            setTinggiBadan(null);
            setSubjektif('');
            setObjektif('');
            setAssessment('');
            setPlan('');
            setIcd10Code('');
            setIcd10Deskripsi('');
        }
    }, [v, state.showPemeriksaan]);

    const handleClose = () => {
        setState(p => ({ ...p, showPemeriksaan: false, activeKunjungan: null }));
    };

    // --- Vitals & SOAP Handler ---
    const handleSaveVitals = async () => {
        if (!k) return;
        setLoadVitalsSave(true);
        try {
            const res = await postData(apiEndpointVitalsSave, {
                kode_kunjungan: k.kode_kunjungan,
                no_sip: k.no_sip,
                tekanan_darah: tekananDarah,
                suhu,
                nadi,
                respirasi,
                berat_badan: beratBadan,
                tinggi_badan: tinggiBadan,
                subjektif,
                objektif,
                assessment,
                plan,
                icd10_code: icd10Code,
                icd10_deskripsi: icd10Deskripsi,
            });
            showSuccess(toast, res.data?.message || 'Data vitals & diagnosis berhasil disimpan');
            if (openPemeriksaan) await openPemeriksaan(k);
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal menyimpan data vitals');
        } finally {
            setLoadVitalsSave(false);
        }
    };

    // --- Layanan Handlers ---
    const handleAddLayanan = async () => {
        if (!k) return;
        if (!namaLayanan.trim()) {
            showError(toast, 'Nama layanan wajib diisi');
            return;
        }
        setLoadLayananAdd(true);
        try {
            const res = await postData(apiEndpointLayananCreate, {
                kode_kunjungan: k.kode_kunjungan,
                no_sip: k.no_sip,
                jenis_layanan: jenisLayanan,
                nama_layanan: namaLayanan,
                qty: qtyLayanan,
                harga: hargaLayanan,
                keterangan: ketLayanan,
            });
            showSuccess(toast, res.data?.message || 'Layanan medis berhasil ditambahkan');
            setNamaLayanan('');
            setQtyLayanan(1);
            setHargaLayanan(0);
            setKetLayanan('');
            if (openPemeriksaan) await openPemeriksaan(k);
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal menambah layanan');
        } finally {
            setLoadLayananAdd(false);
        }
    };

    const handleDeleteLayanan = async (id: string) => {
        if (!k) return;
        try {
            const res = await postData(apiEndpointLayananDelete, { id });
            showSuccess(toast, res.data?.message || 'Layanan medis berhasil dihapus');
            if (openPemeriksaan) await openPemeriksaan(k);
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal menghapus layanan');
        }
    };

    // --- Lab Handlers ---
    const handleAddLab = async () => {
        if (!k || !selectedTarif) {
            showError(toast, 'Pilih tarif lab terlebih dahulu');
            return;
        }
        setLoadLabAdd(true);
        try {
            const res = await postData(apiEndpointLabCreate, {
                kode_kunjungan: k.kode_kunjungan,
                no_sip: k.no_sip,
                kode_tarif: selectedTarif,
            });
            showSuccess(toast, res.data?.message || 'Permintaan lab berhasil ditambahkan');
            setSelectedTarif('');
            if (openPemeriksaan) await openPemeriksaan(k);
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal menambah lab');
        } finally {
            setLoadLabAdd(false);
        }
    };

    const handleDeleteLab = async (id: string) => {
        if (!k) return;
        try {
            const res = await postData(apiEndpointLabDelete, { id });
            showSuccess(toast, res.data?.message || 'Permintaan lab berhasil dihapus');
            if (openPemeriksaan) await openPemeriksaan(k);
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal menghapus lab');
        }
    };

    // --- Resep Handlers ---
    const handleAddResep = async () => {
        if (!k || !selectedObat) {
            showError(toast, 'Pilih obat terlebih dahulu');
            return;
        }
        setLoadResepAdd(true);
        try {
            const res = await postData(apiEndpointResepCreate, {
                kode_kunjungan: k.kode_kunjungan,
                no_sip: k.no_sip,
                kode_obat: selectedObat,
                dosis: dosisObat,
                jumlah: jumlahObat,
                aturan_pakai: aturanObat,
            });
            showSuccess(toast, res.data?.message || 'Item resep berhasil ditambahkan');
            setSelectedObat('');
            setDosisObat('');
            setJumlahObat(1);
            setAturanObat('');
            if (openPemeriksaan) await openPemeriksaan(k);
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal menambah item resep');
        } finally {
            setLoadResepAdd(false);
        }
    };

    const handleDeleteResepItem = async (detailId: string) => {
        if (!k) return;
        try {
            const res = await postData(apiEndpointResepDeleteItem, { detail_id: detailId });
            showSuccess(toast, res.data?.message || 'Item resep berhasil dihapus');
            if (openPemeriksaan) await openPemeriksaan(k);
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal menghapus item resep');
        }
    };

    // --- Selesai Pemeriksaan ---
    const handleSelesaiPemeriksaan = async () => {
        if (!k) return;
        setLoadSelesai(true);
        try {
            const res = await postData(apiEndpointKunjunganSelesai, { kode_kunjungan: k.kode_kunjungan });
            showSuccess(toast, res.data?.message || 'Pemeriksaan selesai!');
            handleClose();
            if (getData) await getData();
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal menyelesaikan pemeriksaan');
        } finally {
            setLoadSelesai(false);
        }
    };

    const headerEl = k ? (
        <div className="flex align-items-center gap-2">
            <i className="pi pi-stethoscope text-orange-600 text-xl" />
            <span>Pemeriksaan Dokter — <b>{k.nama_pasien}</b> ({k.kode_kunjungan})</span>
        </div>
    ) : 'Pemeriksaan Dokter';

    const footerEl = (
        <div className="flex justify-content-between align-items-center">
            <Button label="Tutup" severity="secondary" outlined onClick={handleClose} />
            <Button
                label="Selesai Pemeriksaan"
                icon="pi pi-check-circle"
                severity="success"
                loading={loadSelesai}
                onClick={handleSelesaiPemeriksaan}
            />
        </div>
    );

    return (
        <Dialog
            header={headerEl}
            footer={footerEl}
            visible={state.showPemeriksaan}
            style={{ width: '1000px', maxWidth: '98vw' }}
            modal
            onHide={handleClose}
            maximizable
        >
            {k && (
                <>
                    {/* Ringkasan Pasien */}
                    <div className="p-3 border-round surface-100 mb-3 flex flex-wrap justify-content-between gap-2 text-sm">
                        <span><b>No. RM:</b> {k.no_rm}</span>
                        <span><b>NIK:</b> {k.nik}</span>
                        <span><b>Poli:</b> {k.nama_poli}</span>
                        <span><b>Dokter:</b> {k.nama_dokter || '—'}</span>
                        <span><b>Penjamin:</b> {k.nama_penjamin || 'Umum'}</span>
                    </div>

                    <TabView>
                        {/* TAB 1: VITALS & DIAGNOSIS / SOAP */}
                        <TabPanel header="Vitals & Diagnosis (SOAP)" leftIcon="pi pi-activity mr-2">
                            <div className="p-3 border-round border-1 border-300 surface-50 mb-3">
                                <p className="font-bold text-sm mb-3 text-blue-700">📊 Tanda-Tanda Vital (Vitals Sign)</p>
                                <div className="grid p-fluid text-xs">
                                    <div className="col-12 md:col-2">
                                        <label className="font-semibold block mb-1">Tekanan Darah</label>
                                        <InputText
                                            value={tekananDarah}
                                            onChange={(e) => setTekananDarah(e.target.value)}
                                            placeholder="120/80 mmHg"
                                        />
                                    </div>
                                    <div className="col-6 md:col-2">
                                        <label className="font-semibold block mb-1">Suhu (°C)</label>
                                        <InputNumber
                                            value={suhu}
                                            onValueChange={(e) => setSuhu(e.value)}
                                            minFractionDigits={1}
                                            maxFractionDigits={1}
                                            placeholder="36.5"
                                        />
                                    </div>
                                    <div className="col-6 md:col-2">
                                        <label className="font-semibold block mb-1">Nadi (x/mnt)</label>
                                        <InputNumber
                                            value={nadi}
                                            onValueChange={(e) => setNadi(e.value)}
                                            placeholder="80"
                                        />
                                    </div>
                                    <div className="col-6 md:col-2">
                                        <label className="font-semibold block mb-1">Respirasi (x/mnt)</label>
                                        <InputNumber
                                            value={respirasi}
                                            onValueChange={(e) => setRespirasi(e.value)}
                                            placeholder="20"
                                        />
                                    </div>
                                    <div className="col-6 md:col-2">
                                        <label className="font-semibold block mb-1">Berat Badan (kg)</label>
                                        <InputNumber
                                            value={beratBadan}
                                            onValueChange={(e) => setBeratBadan(e.value)}
                                            minFractionDigits={1}
                                            maxFractionDigits={2}
                                            placeholder="65.0"
                                        />
                                    </div>
                                    <div className="col-6 md:col-2">
                                        <label className="font-semibold block mb-1">Tinggi Badan (cm)</label>
                                        <InputNumber
                                            value={tinggiBadan}
                                            onValueChange={(e) => setTinggiBadan(e.value)}
                                            minFractionDigits={1}
                                            maxFractionDigits={1}
                                            placeholder="170"
                                        />
                                    </div>
                                </div>

                                <p className="font-bold text-sm mt-4 mb-3 text-blue-700">📝 Anamnesis / Rekam Medis (SOAP)</p>
                                <div className="grid p-fluid text-xs">
                                    <div className="col-12 md:col-6">
                                        <label className="font-semibold block mb-1">Subjektif / Keluhan (S)</label>
                                        <InputTextarea
                                            value={subjektif}
                                            onChange={(e) => setSubjektif(e.target.value)}
                                            rows={3}
                                            placeholder="Keluhan utama pasien..."
                                        />
                                    </div>
                                    <div className="col-12 md:col-6">
                                        <label className="font-semibold block mb-1">Objektif / Pemeriksaan Fisik (O)</label>
                                        <InputTextarea
                                            value={objektif}
                                            onChange={(e) => setObjektif(e.target.value)}
                                            rows={3}
                                            placeholder="Hasil pemeriksaan fisik..."
                                        />
                                    </div>
                                    <div className="col-12 md:col-6">
                                        <label className="font-semibold block mb-1">Assessment / Penilaian (A)</label>
                                        <InputTextarea
                                            value={assessment}
                                            onChange={(e) => setAssessment(e.target.value)}
                                            rows={3}
                                            placeholder="Penilaian & analisa..."
                                        />
                                    </div>
                                    <div className="col-12 md:col-6">
                                        <label className="font-semibold block mb-1">Plan / Rencana Tindakan (P)</label>
                                        <InputTextarea
                                            value={plan}
                                            onChange={(e) => setPlan(e.target.value)}
                                            rows={3}
                                            placeholder="Rencana pengobatan & edukasi..."
                                        />
                                    </div>
                                </div>

                                <p className="font-bold text-sm mt-4 mb-3 text-blue-700">🏷️ Diagnosis ICD-10</p>
                                <div className="grid p-fluid text-xs">
                                    <div className="col-12 md:col-3">
                                        <label className="font-semibold block mb-1">Kode ICD-10</label>
                                        <InputText
                                            value={icd10Code}
                                            onChange={(e) => setIcd10Code(e.target.value)}
                                            placeholder="cth. J00, E11"
                                        />
                                    </div>
                                    <div className="col-12 md:col-9">
                                        <label className="font-semibold block mb-1">Deskripsi Diagnosis</label>
                                        <InputText
                                            value={icd10Deskripsi}
                                            onChange={(e) => setIcd10Deskripsi(e.target.value)}
                                            placeholder="cth. Acute nasopharyngitis (common cold)"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-content-end mt-4">
                                    <Button
                                        label="Simpan Vitals & Diagnosis"
                                        icon="pi pi-save"
                                        severity="primary"
                                        loading={loadVitalsSave}
                                        onClick={handleSaveVitals}
                                    />
                                </div>
                            </div>
                        </TabPanel>

                        {/* TAB 2: LAYANAN MEDIS */}
                        <TabPanel header="Konsultasi & Tindakan" leftIcon="pi pi-heart mr-2">
                            <div className="p-3 border-round border-1 border-300 surface-50 mb-3">
                                <p className="font-bold text-sm mb-2 text-blue-700">+ Tambah Layanan / Tindakan</p>
                                <div className="grid p-fluid">
                                    <div className="col-12 md:col-3">
                                        <label className="text-xs font-semibold">Jenis Layanan</label>
                                        <Dropdown
                                            value={jenisLayanan}
                                            options={[
                                                { label: 'Konsultasi', value: 'konsultasi' },
                                                { label: 'Tindakan', value: 'tindakan' },
                                            ]}
                                            onChange={(e) => setJenisLayanan(e.value)}
                                        />
                                    </div>
                                    <div className="col-12 md:col-4">
                                        <label className="text-xs font-semibold">Nama Layanan</label>
                                        <InputText
                                            value={namaLayanan}
                                            onChange={(e) => setNamaLayanan(e.target.value)}
                                            placeholder="cth. Nebulizer, Jahit Luka"
                                        />
                                    </div>
                                    <div className="col-6 md:col-2">
                                        <label className="text-xs font-semibold">Harga (Rp)</label>
                                        <InputNumber
                                            value={hargaLayanan}
                                            onValueChange={(e) => setHargaLayanan(e.value || 0)}
                                            mode="currency"
                                            currency="IDR"
                                            locale="id-ID"
                                        />
                                    </div>
                                    <div className="col-6 md:col-1">
                                        <label className="text-xs font-semibold">Qty</label>
                                        <InputNumber
                                            value={qtyLayanan}
                                            onValueChange={(e) => setQtyLayanan(e.value || 1)}
                                            min={1}
                                        />
                                    </div>
                                    <div className="col-12 md:col-2 flex align-items-end">
                                        <Button
                                            label="Tambah"
                                            icon="pi pi-plus"
                                            loading={loadLayananAdd}
                                            onClick={handleAddLayanan}
                                        />
                                    </div>
                                </div>
                            </div>

                            <DataTable value={state.vaLayanan} className="text-sm" responsiveLayout="scroll" size="small">
                                <Column field="jenis_layanan" header="Jenis"
                                    body={(r: LayananMedisItem) => (
                                        <Tag value={r.jenis_layanan} severity={r.jenis_layanan === 'konsultasi' ? 'info' : 'warning'} />
                                    )}
                                />
                                <Column field="nama_layanan" header="Nama Layanan" />
                                <Column field="qty" header="Qty" style={{ width: '60px' }} />
                                <Column field="harga" header="Harga" body={(r) => formatRupiah(r.harga)} />
                                <Column header="Subtotal" body={(r: LayananMedisItem) => formatRupiah(r.qty * r.harga)} />
                                <Column
                                    header="Hapus"
                                    style={{ width: '60px', textAlign: 'center' }}
                                    body={(r: LayananMedisItem) => (
                                        <Button
                                            icon="pi pi-trash"
                                            severity="danger"
                                            text
                                            rounded
                                            size="small"
                                            onClick={() => handleDeleteLayanan(r.id)}
                                        />
                                    )}
                                />
                            </DataTable>
                        </TabPanel>

                        {/* TAB 3: PERMINTAAN LAB */}
                        <TabPanel header="Permintaan Lab" leftIcon="pi pi-flask mr-2">
                            <div className="p-3 border-round border-1 border-300 surface-50 mb-3">
                                <p className="font-bold text-sm mb-2 text-blue-700">+ Order Pemeriksaan Lab</p>
                                <div className="grid p-fluid">
                                    <div className="col-12 md:col-9">
                                        <label className="text-xs font-semibold">Pilih Pemeriksaan Lab (Master Tarif)</label>
                                        <Dropdown
                                            value={selectedTarif}
                                            options={state.tarifOptions.map((t) => ({
                                                label: `${t.nama_layanan} — ${formatRupiah(t.tarif)}`,
                                                value: t.kode_tarif,
                                            }))}
                                            onChange={(e) => setSelectedTarif(e.value)}
                                            placeholder="— Pilih Pemeriksaan Lab —"
                                            filter
                                        />
                                    </div>
                                    <div className="col-12 md:col-3 flex align-items-end">
                                        <Button
                                            label="Tambah Lab"
                                            icon="pi pi-plus"
                                            loading={loadLabAdd}
                                            onClick={handleAddLab}
                                        />
                                    </div>
                                </div>
                            </div>

                            <DataTable value={state.vaLab} className="text-sm" responsiveLayout="scroll" size="small">
                                <Column field="kode_permintaan" header="Kode" />
                                <Column field="jenis_pemeriksaan" header="Jenis Pemeriksaan" />
                                <Column field="tarif" header="Tarif" body={(r: PermintaanLabItem) => formatRupiah(r.tarif)} />
                                <Column field="status" header="Status"
                                    body={(r: PermintaanLabItem) => (
                                        <Tag value={r.status} severity={r.status === 'selesai' ? 'success' : r.status === 'diproses' ? 'warning' : 'info'} />
                                    )}
                                />
                                <Column
                                    header="Hapus"
                                    style={{ width: '60px', textAlign: 'center' }}
                                    body={(r: PermintaanLabItem) => (
                                        <Button
                                            icon="pi pi-trash"
                                            severity="danger"
                                            text
                                            rounded
                                            size="small"
                                            onClick={() => handleDeleteLab(r.id)}
                                        />
                                    )}
                                />
                            </DataTable>
                        </TabPanel>

                        {/* TAB 4: RESEP OBAT */}
                        <TabPanel header="Resep Obat" leftIcon="pi pi-tablet mr-2">
                            <div className="p-3 border-round border-1 border-300 surface-50 mb-3">
                                <p className="font-bold text-sm mb-2 text-blue-700">+ Resepkan Obat</p>
                                <div className="grid p-fluid">
                                    <div className="col-12 md:col-4">
                                        <label className="text-xs font-semibold">Obat</label>
                                        <Dropdown
                                            value={selectedObat}
                                            options={state.obatOptions.map((o) => ({
                                                label: `${o.nama_obat} (${o.satuan}) — ${formatRupiah(o.harga_jual)}`,
                                                value: o.kode_obat,
                                            }))}
                                            onChange={(e) => setSelectedObat(e.value)}
                                            placeholder="— Pilih Obat —"
                                            filter
                                        />
                                    </div>
                                    <div className="col-6 md:col-2">
                                        <label className="text-xs font-semibold">Dosis</label>
                                        <InputText
                                            value={dosisObat}
                                            onChange={(e) => setDosisObat(e.target.value)}
                                            placeholder="cth. 500mg"
                                        />
                                    </div>
                                    <div className="col-6 md:col-2">
                                        <label className="text-xs font-semibold">Jumlah</label>
                                        <InputNumber
                                            value={jumlahObat}
                                            onValueChange={(e) => setJumlahObat(e.value || 1)}
                                            min={1}
                                        />
                                    </div>
                                    <div className="col-12 md:col-4">
                                        <label className="text-xs font-semibold">Aturan Pakai</label>
                                        <InputText
                                            value={aturanObat}
                                            onChange={(e) => setAturanObat(e.target.value)}
                                            placeholder="cth. 3x1 sehari sesudah makan"
                                        />
                                    </div>
                                    <div className="col-12 flex justify-content-end mt-2">
                                        <Button
                                            label="Tambah Obat Ke Resep"
                                            icon="pi pi-plus"
                                            className="w-auto"
                                            loading={loadResepAdd}
                                            onClick={handleAddResep}
                                        />
                                    </div>
                                </div>
                            </div>

                            <DataTable value={state.vaResep} className="text-sm" responsiveLayout="scroll" size="small">
                                <Column field="nama_obat" header="Nama Obat" body={(r: ResepDetailItem) => r.nama_obat || '—'} />
                                <Column field="dosis" header="Dosis" body={(r) => r.dosis || '—'} />
                                <Column field="jumlah" header="Jumlah" style={{ width: '60px' }} />
                                <Column field="aturan_pakai" header="Aturan Pakai" body={(r) => r.aturan_pakai || '—'} />
                                <Column field="harga_jual" header="Harga/pcs" body={(r: ResepDetailItem) => formatRupiah(r.harga_jual)} />
                                <Column header="Subtotal" body={(r: ResepDetailItem) => formatRupiah((r.jumlah || 0) * (r.harga_jual || 0))} />
                                <Column
                                    header="Hapus"
                                    style={{ width: '60px', textAlign: 'center' }}
                                    body={(r: ResepDetailItem) => (
                                        <Button
                                            icon="pi pi-trash"
                                            severity="danger"
                                            text
                                            rounded
                                            size="small"
                                            onClick={() => handleDeleteResepItem(r.detail_id)}
                                        />
                                    )}
                                />
                            </DataTable>
                        </TabPanel>
                    </TabView>
                </>
            )}
        </Dialog>
    );
};

export default FormPemeriksaan;
