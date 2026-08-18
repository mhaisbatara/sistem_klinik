'use client';

import postData from '@/lib/axios/postData';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';

const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const OPT_STATUS = [
    { label: 'Semua Status',   value: '' },
    { label: 'Draft',          value: 'draft'       },
    { label: 'Diajukan',       value: 'diajukan'    },
    { label: 'Diverifikasi',   value: 'diverifikasi'},
    { label: 'Disetujui',      value: 'disetujui'   },
    { label: 'Ditolak',        value: 'ditolak'     },
    { label: 'Dibayar',        value: 'dibayar'     },
];

const STATUS_SEVERITY: Record<string, any> = {
    draft:        'secondary',
    diajukan:     'info',
    diverifikasi: 'warning',
    disetujui:    'success',
    ditolak:      'danger',
    dibayar:      'success',
};

const STATUS_NEXT: Record<string, string[]> = {
    draft:        ['diajukan'],
    diajukan:     ['diverifikasi', 'ditolak'],
    diverifikasi: ['disetujui',    'ditolak'],
    disetujui:    ['dibayar'],
    ditolak:      ['draft'],
};

const Page = () => {
    const toast = useRef<Toast>(null);
    const [load, setLoad]     = useState(false);
    const [data, setData]     = useState<any[]>([]);
    const [totalData, setTotalData] = useState(0);
    const [page, setPage]     = useState(1);
    const [rows, setRows]     = useState(10);
    const [first, setFirst]   = useState(0);
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [tanggalMulai, setTanggalMulai]     = useState('');
    const [tanggalSelesai, setTanggalSelesai] = useState('');
    const [selectedRows, setSelectedRows]     = useState<any[]>([]);
    const [showUpdate, setShowUpdate] = useState(false);
    const [updateTarget, setUpdateTarget] = useState<any>(null);
    const [updateStatus, setUpdateStatus] = useState('');
    const [updateNoSep, setUpdateNoSep]   = useState('');
    const [updateCatatan, setUpdateCatatan] = useState('');
    const [loadUpdate, setLoadUpdate]     = useState(false);

    const getData = async () => {
        setLoad(true);
        try {
            const res = await postData('/keuangan/klaim-bpjs-data', {
                page, perPage: rows,
                keyword:          keyword       || undefined,
                status_klaim:     statusFilter  || undefined,
                tanggal_mulai:    tanggalMulai   || undefined,
                tanggal_selesai:  tanggalSelesai || undefined,
            });
            setData(res.data.data);
            setTotalData(res.data.total_data);
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memuat data');
        } finally {
            setLoad(false);
        }
    };

    const handleAjukanBatch = async () => {
        if (!selectedRows.length) { showError(toast, 'Pilih minimal 1 klaim'); return; }
        try {
            const res = await postData('/keuangan/klaim-bpjs-create', {
                kode_kunjungan_list: selectedRows.map(r => r.kode_kunjungan),
            });
            showSuccess(toast, res.data.message);
            setSelectedRows([]);
            await getData();
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal mengajukan klaim');
        }
    };

    const openUpdateDialog = (row: any) => {
        setUpdateTarget(row);
        setUpdateStatus('');
        setUpdateNoSep(row.no_sep || '');
        setUpdateCatatan('');
        setShowUpdate(true);
    };

    const handleUpdateStatus = async () => {
        if (!updateStatus) { showError(toast, 'Pilih status baru'); return; }
        setLoadUpdate(true);
        try {
            await postData('/keuangan/klaim-bpjs-update-status', {
                id:           updateTarget.id,
                status_klaim: updateStatus,
                no_sep:       updateNoSep  || undefined,
                catatan:      updateCatatan || undefined,
            });
            showSuccess(toast, `Status berhasil diubah ke '${updateStatus}'`);
            setShowUpdate(false);
            await getData();
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal update status');
        } finally {
            setLoadUpdate(false);
        }
    };

    useEffect(() => { getData(); }, [page, rows, keyword, statusFilter, tanggalMulai, tanggalSelesai]); // eslint-disable-line
    const onLazyLoad = (e: any) => { setFirst(e.first); setRows(e.rows); setPage(typeof e.page === 'number' ? e.page + 1 : page); };

    return (
        <>
            <Toast ref={toast} position="top-right" />

            <div className="card p-0 mb-3">
                <div className="p-4 border-bottom-1 border-300">
                    <h2 className="text-3xl font-bold flex align-items-center gap-2 mb-1">
                        <i className="pi pi-shield text-blue-600 text-3xl" />
                        Klaim BPJS
                    </h2>
                    <p className="text-color-secondary">Manajemen klaim BPJS dari draft hingga pembayaran.</p>
                </div>
            </div>

            <div className="card p-4">
                <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                    <div className="flex align-items-center gap-2 flex-wrap">
                        <span className="p-input-icon-left">
                            <i className="pi pi-search" />
                            <InputText value={keyword} onChange={e => { setKeyword(e.target.value); setPage(1); }}
                                placeholder="Cari pasien, no. SEP..." className="w-15rem" />
                        </span>
                        <Dropdown value={statusFilter} options={OPT_STATUS}
                            onChange={e => { setStatusFilter(e.value); setPage(1); }}
                            placeholder="Semua Status" className="w-12rem" />
                        <Calendar value={tanggalMulai ? new Date(tanggalMulai) : null}
                            onChange={e => { setTanggalMulai(e.value ? new Date(e.value).toISOString().slice(0, 10) : ''); setPage(1); }}
                            dateFormat="dd/mm/yy" placeholder="Dari Tgl." showIcon showButtonBar className="w-11rem" />
                        <Calendar value={tanggalSelesai ? new Date(tanggalSelesai) : null}
                            onChange={e => { setTanggalSelesai(e.value ? new Date(e.value).toISOString().slice(0, 10) : ''); setPage(1); }}
                            dateFormat="dd/mm/yy" placeholder="Sampai Tgl." showIcon showButtonBar className="w-11rem" />
                    </div>
                    <div className="flex gap-2">
                        <Button label="Refresh" icon="pi pi-refresh" severity="secondary" outlined onClick={getData} />
                        {selectedRows.length > 0 && (
                            <Button label={`Ajukan Klaim (${selectedRows.length})`} icon="pi pi-send" onClick={handleAjukanBatch} />
                        )}
                    </div>
                </div>

                <DataTable value={data} loading={load} lazy paginator
                    first={first} rows={rows} totalRecords={totalData}
                    onPage={onLazyLoad} rowsPerPageOptions={[10, 25, 50]}
                    selection={selectedRows} onSelectionChange={e => setSelectedRows(e.value)}
                    selectionMode="multiple" dataKey="id"
                    responsiveLayout="scroll" emptyMessage="Tidak ada data klaim BPJS."
                    className="p-datatable-gridlines text-sm">
                    <Column selectionMode="multiple" style={{ width: '40px' }} />
                    <Column field="kode_kunjungan" header="No. Kunjungan" body={(r) => <span className="font-bold text-primary">{r.kode_kunjungan}</span>} />
                    <Column header="Pasien" body={(r) => (
                        <div>
                            <span className="font-semibold block">{r.nama_pasien || '—'}</span>
                            <small className="text-color-secondary">RM: {r.no_rm}</small>
                        </div>
                    )} />
                    <Column field="no_sep" header="No. SEP" body={(r) => <span>{r.no_sep || '—'}</span>} style={{ width: '140px' }} />
                    <Column header="Nominal" body={(r) => <span className="font-semibold">{formatRupiah(r.nominal_klaim)}</span>} style={{ width: '130px' }} />
                    <Column field="tanggal_klaim" header="Tgl. Klaim" style={{ width: '110px' }} body={(r) => <span>{r.tanggal_klaim?.slice(0, 10)}</span>} />
                    <Column header="Status" style={{ width: '120px' }}
                        body={(r) => <Tag value={r.status_klaim} severity={STATUS_SEVERITY[r.status_klaim] || 'info'} />} />
                    <Column header="" style={{ width: '60px', textAlign: 'center' }}
                        body={(r) => (STATUS_NEXT[r.status_klaim]?.length ?? 0) > 0 ? (
                            <Button icon="pi pi-pencil" rounded text severity="info" size="small"
                                tooltip="Update Status" onClick={() => openUpdateDialog(r)} />
                        ) : null} />
                </DataTable>
            </div>

            {/* Dialog Update Status */}
            <Dialog visible={showUpdate} onHide={() => setShowUpdate(false)}
                header={<div className="flex align-items-center gap-2"><i className="pi pi-pencil text-primary" /><span className="font-bold">Update Status Klaim</span></div>}
                style={{ width: '380px' }} modal>
                {updateTarget && (
                    <div className="flex flex-column gap-3 pt-2">
                        <div className="surface-50 border-round p-2 text-sm">
                            <div><strong>Kunjungan:</strong> {updateTarget.kode_kunjungan}</div>
                            <div><strong>Pasien:</strong> {updateTarget.nama_pasien}</div>
                            <div className="flex align-items-center gap-2 mt-1">
                                <strong>Status saat ini:</strong>
                                <Tag value={updateTarget.status_klaim} severity={STATUS_SEVERITY[updateTarget.status_klaim]} />
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold text-sm">Status Baru <span className="text-red-500">*</span></label>
                            <Dropdown value={updateStatus}
                                options={(STATUS_NEXT[updateTarget.status_klaim] || []).map((s: string) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))}
                                onChange={e => setUpdateStatus(e.value)}
                                placeholder="Pilih status..." className="w-full" />
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold text-sm">No. SEP</label>
                            <InputText value={updateNoSep} onChange={e => setUpdateNoSep(e.target.value)}
                                placeholder="Nomor SEP BPJS..." className="w-full" />
                        </div>
                        <div>
                            <label className="block mb-1 font-semibold text-sm">Catatan</label>
                            <InputTextarea value={updateCatatan} onChange={e => setUpdateCatatan(e.target.value)}
                                rows={2} className="w-full" placeholder="Catatan opsional..." />
                        </div>
                        <div className="flex gap-2 justify-content-end">
                            <Button label="Batal" severity="secondary" outlined onClick={() => setShowUpdate(false)} />
                            <Button label="Simpan" icon="pi pi-check" loading={loadUpdate} onClick={handleUpdateStatus} />
                        </div>
                    </div>
                )}
            </Dialog>
        </>
    );
};

export default Page;
