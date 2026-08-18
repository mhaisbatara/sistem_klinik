'use client';

import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Skeleton } from 'primereact/skeleton';
import { ComponentProps, LayananMedisItem, PermintaanLabItem, ResepItem } from '../interfaces';

const formatRupiah = (v: number | null | undefined) =>
    v !== null && v !== undefined
        ? `Rp ${Number(v).toLocaleString('id-ID')}`
        : '—';

const DetailPanel = ({ state, setState }: ComponentProps) => {
    const k = state.selectedKunjungan;
    const d = state.detail;
    const p = d?.pemeriksaan;

    const handleClose = () => setState(p => ({ ...p, showDetail: false, selectedKunjungan: null, detail: null }));

    const headerEl = k ? (
        <div className="flex align-items-center gap-2">
            <i className="pi pi-file-edit text-blue-600" />
            <span>Detail Kunjungan — <b>{k.kode_kunjungan}</b></span>
        </div>
    ) : 'Detail Kunjungan';

    return (
        <Dialog
            header={headerEl}
            visible={state.showDetail}
            style={{ width: '950px', maxWidth: '98vw' }}
            modal
            onHide={handleClose}
            maximizable
        >
            {state.loadDetail ? (
                <div className="p-4">
                    <Skeleton className="mb-3" height="2rem" />
                    <Skeleton className="mb-2" height="1.5rem" />
                    <Skeleton height="10rem" />
                </div>
            ) : d ? (
                <>
                    {/* Info Pasien & Kunjungan */}
                    <div className="grid mb-3">
                        <div className="col-12 md:col-6">
                            <div className="p-3 border-round surface-50 border-1 border-300">
                                <p className="font-bold text-sm text-color-secondary mb-2 uppercase">Info Pasien</p>
                                <div className="flex flex-column gap-1 text-sm">
                                    <span><b>Nama:</b> {d.kunjungan.nama_pasien || '—'}</span>
                                    <span><b>No. RM:</b> {d.kunjungan.no_rm}</span>
                                    <span><b>NIK:</b> {d.kunjungan.nik}</span>
                                    <span><b>Tgl. Lahir:</b> {d.kunjungan.tanggal_lahir?.slice(0, 10) || '—'}</span>
                                    <span><b>No. HP:</b> {d.kunjungan.no_hp || '—'}</span>
                                    <span><b>Gol. Darah:</b> {d.kunjungan.golongan_darah || '—'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 md:col-6">
                            <div className="p-3 border-round surface-50 border-1 border-300">
                                <p className="font-bold text-sm text-color-secondary mb-2 uppercase">Info Kunjungan</p>
                                <div className="flex flex-column gap-1 text-sm">
                                    <span><b>Poli:</b> {d.kunjungan.nama_poli || d.kunjungan.kode_poli}</span>
                                    <span><b>Dokter:</b> {d.kunjungan.nama_dokter || '—'}</span>
                                    <span><b>Penjamin:</b> {d.kunjungan.nama_penjamin || 'Umum'}</span>
                                    <span><b>Tgl. Kunjungan:</b> {d.kunjungan.tanggal_kunjungan?.slice(0, 10)}</span>
                                    <span><b>Keluhan:</b> {d.kunjungan.keluhan_awal || '—'}</span>
                                    <span>
                                        <b>Status:</b>{' '}
                                        <Tag
                                            value={d.kunjungan.status_kunjungan}
                                            severity={d.kunjungan.status_kunjungan === 'selesai' ? 'success' : d.kunjungan.status_kunjungan === 'diperiksa' ? 'warning' : 'info'}
                                        />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tab Detail */}
                    <TabView>
                        {/* Tab Vitals & SOAP */}
                        <TabPanel header="Vitals & Diagnosis (SOAP)" leftIcon="pi pi-activity mr-2">
                            {!p ? (
                                <p className="text-color-secondary text-sm p-2">Belum ada data pemeriksaan vitals & SOAP.</p>
                            ) : (
                                <div className="flex flex-column gap-3 text-sm">
                                    {/* Vital Signs Grid */}
                                    <div className="p-3 border-round surface-100 border-1 border-300">
                                        <p className="font-bold text-sm text-blue-700 mb-2">📊 Tanda-Tanda Vital</p>
                                        <div className="grid">
                                            <div className="col-6 md:col-2"><b>Tekanan Darah:</b> {p.tekanan_darah || '—'}</div>
                                            <div className="col-6 md:col-2"><b>Suhu:</b> {p.suhu !== null && p.suhu !== undefined ? `${p.suhu} °C` : '—'}</div>
                                            <div className="col-6 md:col-2"><b>Nadi:</b> {p.nadi ? `${p.nadi} x/mnt` : '—'}</div>
                                            <div className="col-6 md:col-2"><b>Respirasi:</b> {p.respirasi ? `${p.respirasi} x/mnt` : '—'}</div>
                                            <div className="col-6 md:col-2"><b>Berat Badan:</b> {p.berat_badan ? `${p.berat_badan} kg` : '—'}</div>
                                            <div className="col-6 md:col-2"><b>Tinggi Badan:</b> {p.tinggi_badan ? `${p.tinggi_badan} cm` : '—'}</div>
                                        </div>
                                    </div>

                                    {/* SOAP */}
                                    <div className="p-3 border-round surface-50 border-1 border-300">
                                        <p className="font-bold text-sm text-blue-700 mb-2">📝 Rekam Medis (SOAP)</p>
                                        <div className="grid">
                                            <div className="col-12 md:col-6 mb-2">
                                                <span className="font-semibold block text-color-secondary">Subjektif (S):</span>
                                                <p className="m-0 surface-card p-2 border-round border-1 border-200">{p.subjektif || '—'}</p>
                                            </div>
                                            <div className="col-12 md:col-6 mb-2">
                                                <span className="font-semibold block text-color-secondary">Objektif (O):</span>
                                                <p className="m-0 surface-card p-2 border-round border-1 border-200">{p.objektif || '—'}</p>
                                            </div>
                                            <div className="col-12 md:col-6 mb-2">
                                                <span className="font-semibold block text-color-secondary">Assessment (A):</span>
                                                <p className="m-0 surface-card p-2 border-round border-1 border-200">{p.assessment || '—'}</p>
                                            </div>
                                            <div className="col-12 md:col-6 mb-2">
                                                <span className="font-semibold block text-color-secondary">Plan (P):</span>
                                                <p className="m-0 surface-card p-2 border-round border-1 border-200">{p.plan || '—'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ICD-10 */}
                                    <div className="p-3 border-round surface-50 border-1 border-300">
                                        <p className="font-bold text-sm text-blue-700 mb-2">🏷️ Diagnosis ICD-10</p>
                                        <span><b>Kode ICD-10:</b> <Tag value={p.icd10_code || '—'} severity="info" /></span>
                                        <span className="ml-3"><b>Deskripsi:</b> {p.icd10_deskripsi || '—'}</span>
                                    </div>
                                </div>
                            )}
                        </TabPanel>

                        {/* Tab Layanan Medis */}
                        <TabPanel header="Layanan Medis" leftIcon="pi pi-heart mr-2">
                            {d.layanan_medis.length === 0 ? (
                                <p className="text-color-secondary text-sm p-2">Belum ada layanan medis.</p>
                            ) : (
                                <DataTable
                                    value={d.layanan_medis}
                                    className="text-sm"
                                    responsiveLayout="scroll"
                                    size="small"
                                >
                                    <Column field="jenis_layanan" header="Jenis"
                                        body={(r: LayananMedisItem) => (
                                            <Tag value={r.jenis_layanan} severity={r.jenis_layanan === 'konsultasi' ? 'info' : 'warning'} />
                                        )}
                                    />
                                    <Column field="nama_layanan" header="Nama Layanan" />
                                    <Column field="qty"          header="Qty" style={{ width: '60px' }} />
                                    <Column field="harga"        header="Harga" body={(r) => formatRupiah(r.harga)} />
                                    <Column header="Subtotal"    body={(r: LayananMedisItem) => formatRupiah(r.qty * r.harga)} />
                                    <Column field="keterangan"   header="Keterangan" body={(r) => r.keterangan || '—'} />
                                </DataTable>
                            )}
                        </TabPanel>

                        {/* Tab Permintaan Lab */}
                        <TabPanel header="Pemeriksaan Lab" leftIcon="pi pi-flask mr-2">
                            {d.permintaan_lab.length === 0 ? (
                                <p className="text-color-secondary text-sm p-2">Belum ada permintaan lab.</p>
                            ) : (
                                <DataTable
                                    value={d.permintaan_lab}
                                    className="text-sm"
                                    responsiveLayout="scroll"
                                    size="small"
                                >
                                    <Column field="kode_permintaan"   header="Kode" />
                                    <Column field="jenis_pemeriksaan" header="Jenis Pemeriksaan" />
                                    <Column field="tarif"             header="Tarif" body={(r: PermintaanLabItem) => formatRupiah(r.tarif)} />
                                    <Column field="tanggal_permintaan" header="Tanggal" body={(r) => r.tanggal_permintaan?.slice(0, 10)} />
                                    <Column field="status"            header="Status"
                                        body={(r: PermintaanLabItem) => (
                                            <Tag value={r.status} severity={r.status === 'selesai' ? 'success' : r.status === 'diproses' ? 'warning' : 'info'} />
                                        )}
                                    />
                                </DataTable>
                            )}
                        </TabPanel>

                        {/* Tab Resep */}
                        <TabPanel header="Resep Obat" leftIcon="pi pi-tablet mr-2">
                            {d.resep.length === 0 ? (
                                <p className="text-color-secondary text-sm p-2">Belum ada resep obat.</p>
                            ) : (
                                <DataTable
                                    value={d.resep}
                                    className="text-sm"
                                    responsiveLayout="scroll"
                                    size="small"
                                    rowGroupMode="rowspan"
                                    groupRowsBy="kode_resep"
                                >
                                    <Column field="kode_resep"   header="No. Resep" />
                                    <Column field="nama_obat"    header="Nama Obat" body={(r: ResepItem) => r.nama_obat || '—'} />
                                    <Column field="dosis"        header="Dosis"     body={(r) => r.dosis || '—'} />
                                    <Column field="jumlah"       header="Jml"       style={{ width: '60px' }} />
                                    <Column field="aturan_pakai" header="Aturan Pakai" body={(r) => r.aturan_pakai || '—'} />
                                    <Column field="harga_jual"   header="Harga/pcs" body={(r: ResepItem) => formatRupiah(r.harga_jual)} />
                                    <Column header="Subtotal"    body={(r: ResepItem) => formatRupiah((r.jumlah || 0) * (r.harga_jual || 0))} />
                                </DataTable>
                            )}
                        </TabPanel>
                    </TabView>
                </>
            ) : (
                <p className="p-4 text-color-secondary">Gagal memuat detail kunjungan.</p>
            )}
        </Dialog>
    );
};

export default DetailPanel;
