'use client';

import postData from '@/lib/axios/postData';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { useSession } from 'next-auth/react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const OPT_JENIS = [
    { label: 'Semua',  value: '' },
    { label: 'Masuk',  value: 'masuk'  },
    { label: 'Keluar', value: 'keluar' },
];

const Page = () => {
    const toast = useRef<Toast>(null);
    const { data: session } = useSession();

    const [load, setLoad]         = useState(false);
    const [loadSave, setLoadSave] = useState(false);
    const [data, setData]         = useState<any[]>([]);
    const [totalData, setTotalData] = useState(0);
    const [totalMasuk, setTotalMasuk]   = useState(0);
    const [totalKeluar, setTotalKeluar] = useState(0);
    const [page, setPage]   = useState(1);
    const [rows, setRows]   = useState(10);
    const [first, setFirst] = useState(0);
    const [jenis, setJenis] = useState('');
    const [tanggalMulai, setTanggalMulai]   = useState('');
    const [tanggalSelesai, setTanggalSelesai] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        tanggal:    new Date().toISOString().slice(0, 10),
        jenis:      'masuk',
        kategori:   '',
        keterangan: '',
        jumlah:     0,
    });

    const getData = async () => {
        setLoad(true);
        try {
            const res = await postData('/keuangan/buku-kas-data', {
                page, perPage: rows,
                jenis:            jenis || undefined,
                tanggal_mulai:    tanggalMulai   || undefined,
                tanggal_selesai:  tanggalSelesai || undefined,
            });
            setData(res.data.data);
            setTotalData(res.data.total_data);
            setTotalMasuk(res.data.total_masuk || 0);
            setTotalKeluar(res.data.total_keluar || 0);
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memuat data');
        } finally {
            setLoad(false);
        }
    };

    const handleSave = async () => {
        if (!form.kategori || !form.jumlah) { showError(toast, 'Kategori dan jumlah wajib diisi'); return; }
        setLoadSave(true);
        try {
            await postData('/keuangan/buku-kas-create', form);
            showSuccess(toast, 'Entri berhasil ditambahkan');
            setShowForm(false);
            setForm({ tanggal: new Date().toISOString().slice(0, 10), jenis: 'masuk', kategori: '', keterangan: '', jumlah: 0 });
            await getData();
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal menyimpan entri');
        } finally {
            setLoadSave(false);
        }
    };

    const handleDelete = (row: any) => {
        confirmDialog({
            message:    `Hapus entri "${row.kategori}" sebesar ${formatRupiah(row.jumlah)}?`,
            header:     'Konfirmasi Hapus',
            icon:       'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await postData('/keuangan/buku-kas-delete', { id: row.id });
                    showSuccess(toast, 'Entri berhasil dihapus');
                    await getData();
                } catch (error: any) {
                    showError(toast, error?.response?.data?.message || 'Gagal menghapus entri');
                }
            }
        });
    };

    useEffect(() => { getData(); }, [page, rows, jenis, tanggalMulai, tanggalSelesai]); // eslint-disable-line
    const onLazyLoad = (e: any) => { setFirst(e.first); setRows(e.rows); setPage(typeof e.page === 'number' ? e.page + 1 : page); };

    return (
        <>
            <Toast ref={toast} position="top-right" />
            <ConfirmDialog />

            <div className="card p-0 mb-3">
                <div className="p-4 border-bottom-1 border-300">
                    <h2 className="text-3xl font-bold flex align-items-center gap-2 mb-1">
                        <i className="pi pi-book text-blue-600 text-3xl" />
                        Buku Kas
                    </h2>
                    <p className="text-color-secondary">Pencatatan arus kas masuk dan keluar klinik.</p>
                </div>
            </div>

            {/* Summary */}
            <div className="grid mb-3">
                <div className="col-12 md:col-4">
                    <Card className="text-center shadow-1 border-left-3 border-green-500">
                        <div className="text-sm text-color-secondary mb-1">Total Masuk</div>
                        <div className="text-2xl font-bold text-green-600">{formatRupiah(totalMasuk)}</div>
                    </Card>
                </div>
                <div className="col-12 md:col-4">
                    <Card className="text-center shadow-1 border-left-3 border-red-500">
                        <div className="text-sm text-color-secondary mb-1">Total Keluar</div>
                        <div className="text-2xl font-bold text-red-600">{formatRupiah(totalKeluar)}</div>
                    </Card>
                </div>
                <div className="col-12 md:col-4">
                    <Card className={`text-center shadow-1 border-left-3 ${totalMasuk - totalKeluar >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
                        <div className="text-sm text-color-secondary mb-1">Saldo Bersih</div>
                        <div className={`text-2xl font-bold ${totalMasuk - totalKeluar >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                            {formatRupiah(totalMasuk - totalKeluar)}
                        </div>
                    </Card>
                </div>
            </div>

            <div className="card p-4">
                <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                    <div className="flex align-items-center gap-2 flex-wrap">
                        <Dropdown value={jenis} options={OPT_JENIS}
                            onChange={e => { setJenis(e.value); setPage(1); }}
                            placeholder="Semua Jenis" className="w-10rem" />
                        <Calendar value={tanggalMulai ? new Date(tanggalMulai) : null}
                            onChange={e => { setTanggalMulai(e.value ? new Date(e.value).toISOString().slice(0, 10) : ''); setPage(1); }}
                            dateFormat="dd/mm/yy" placeholder="Dari Tanggal" showIcon showButtonBar className="w-12rem" />
                        <Calendar value={tanggalSelesai ? new Date(tanggalSelesai) : null}
                            onChange={e => { setTanggalSelesai(e.value ? new Date(e.value).toISOString().slice(0, 10) : ''); setPage(1); }}
                            dateFormat="dd/mm/yy" placeholder="Sampai Tanggal" showIcon showButtonBar className="w-12rem" />
                    </div>
                    <div className="flex gap-2">
                        <Button label="Refresh" icon="pi pi-refresh" severity="secondary" outlined onClick={getData} />
                        <Button label="Tambah Entri" icon="pi pi-plus" onClick={() => setShowForm(true)} />
                    </div>
                </div>

                <DataTable value={data} loading={load} lazy paginator
                    first={first} rows={rows} totalRecords={totalData}
                    onPage={onLazyLoad} rowsPerPageOptions={[10, 25, 50]}
                    responsiveLayout="scroll" emptyMessage="Tidak ada data buku kas."
                    className="p-datatable-gridlines text-sm">
                    <Column field="tanggal" header="Tanggal" style={{ width: '110px' }} body={(r) => <span>{r.tanggal?.slice(0, 10)}</span>} />
                    <Column header="Jenis" style={{ width: '90px' }}
                        body={(r) => <Tag value={r.jenis} severity={r.jenis === 'masuk' ? 'success' : 'danger'} />} />
                    <Column field="kategori"   header="Kategori" />
                    <Column field="keterangan" header="Keterangan" body={(r) => <span className="text-color-secondary">{r.keterangan || '—'}</span>} />
                    <Column header="Jumlah" style={{ width: '140px' }}
                        body={(r) => <span className={`font-bold ${r.jenis === 'masuk' ? 'text-green-700' : 'text-red-700'}`}>{formatRupiah(r.jumlah)}</span>} />
                    <Column header="Input oleh" style={{ width: '160px' }} body={(r) => <small>{r.email_user}</small>} />
                    <Column header="" style={{ width: '60px', textAlign: 'center' }}
                        body={(r) => r.kategori !== 'pembayaran pasien' ? (
                            <Button icon="pi pi-trash" rounded text severity="danger" size="small"
                                tooltip="Hapus Entri" onClick={() => handleDelete(r)} />
                        ) : null} />
                </DataTable>
            </div>

            {/* Dialog Form Tambah */}
            <Dialog visible={showForm} onHide={() => setShowForm(false)}
                header={<div className="flex align-items-center gap-2"><i className="pi pi-plus text-primary" /><span className="font-bold">Tambah Entri Buku Kas</span></div>}
                style={{ width: '420px' }} modal>
                <div className="flex flex-column gap-3 pt-2">
                    <div>
                        <label className="block mb-1 font-semibold text-sm">Tanggal</label>
                        <Calendar value={new Date(form.tanggal)} onChange={e => setForm(f => ({ ...f, tanggal: e.value ? new Date(e.value).toISOString().slice(0, 10) : f.tanggal }))}
                            dateFormat="dd/mm/yy" className="w-full" showIcon />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-sm">Jenis</label>
                        <Dropdown value={form.jenis} options={[{ label: 'Masuk', value: 'masuk' }, { label: 'Keluar', value: 'keluar' }]}
                            onChange={e => setForm(f => ({ ...f, jenis: e.value }))} className="w-full" />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-sm">Kategori <span className="text-red-500">*</span></label>
                        <InputText value={form.kategori} onChange={e => setForm(f => ({ ...f, kategori: e.target.value }))}
                            placeholder="mis: Operasional, Kasbon..." className="w-full" />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-sm">Keterangan</label>
                        <InputTextarea value={form.keterangan} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))}
                            rows={2} className="w-full" placeholder="Deskripsi opsional..." />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold text-sm">Jumlah <span className="text-red-500">*</span></label>
                        <InputNumber value={form.jumlah || null} onValueChange={e => setForm(f => ({ ...f, jumlah: e.value ?? 0 }))}
                            mode="currency" currency="IDR" locale="id-ID" className="w-full" min={1} />
                    </div>
                    <div className="flex gap-2 justify-content-end">
                        <Button label="Batal" severity="secondary" outlined onClick={() => setShowForm(false)} />
                        <Button label="Simpan" icon="pi pi-check" loading={loadSave} onClick={handleSave} />
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default Page;
