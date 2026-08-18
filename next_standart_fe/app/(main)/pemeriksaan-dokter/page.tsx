'use client';

import postData from '@/lib/axios/postData';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { showError } from '@/lib/tools/generalTools';
import { useSession } from 'next-auth/react';
import { DataTableStateEvent } from 'primereact/datatable';
import { State, KunjunganItem } from './components/interfaces';
import {
    apiEndpointKunjunganData,
    apiEndpointVitalsData,
    apiEndpointLayananData,
    apiEndpointLabData,
    apiEndpointResepData,
    apiEndpointPoli,
} from './components/endpoints';
import TableComponent from './components/display/table';
import FormPemeriksaan from './components/display/form_pemeriksaan';

const Page = () => {
    const toast = useRef<Toast>(null);
    const { data: session } = useSession();

    const [state, setState] = useState<State>({
        load: false,
        loadPemeriksaan: false,
        data: [],
        totalData: 0,
        page: 1,
        rows: 10,
        first: 0,
        keyword: '',
        sortField: 'k.tanggal_kunjungan',
        sortOrder: 'desc',
        selectedPoli: '',
        poliOptions: [],
        showPemeriksaan: false,
        activeKunjungan: null,

        vaLayanan: [],
        loadLayanan: false,

        vaLab: [],
        tarifOptions: [],
        loadLab: false,

        vaResep: [],
        obatOptions: [],
        loadResep: false,

        session: null,
    });

    const getData = async () => {
        setState(p => ({ ...p, load: true }));
        try {
            const payload = {
                page:             state.page,
                perPage:          state.rows,
                keyword:          state.keyword,
                kode_poli:        state.selectedPoli || undefined,
                status_kunjungan: 'diperiksa', // Hanya pasien yang sedang diperiksa
                sortField:        state.sortField,
                sortOrder:        state.sortOrder,
            };
            const res = await postData(apiEndpointKunjunganData, payload);
            setState(p => ({ ...p, data: res.data.data, totalData: res.data.total_data }));
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memuat data pasien');
        } finally {
            setState(p => ({ ...p, load: false }));
        }
    };

    const loadPoliOptions = async () => {
        try {
            const res = await postData(apiEndpointPoli, {});
            setState(p => ({ ...p, poliOptions: res.data?.data || [] }));
        } catch { /* silent */ }
    };

    const openPemeriksaan = async (kunjungan: KunjunganItem) => {
        setState(p => ({ ...p, activeKunjungan: kunjungan, showPemeriksaan: true, loadPemeriksaan: true }));
        try {
            const [resVitals, resLayanan, resLab, resResep] = await Promise.all([
                postData(apiEndpointVitalsData, { kode_kunjungan: kunjungan.kode_kunjungan }),
                postData(apiEndpointLayananData, { kode_kunjungan: kunjungan.kode_kunjungan }),
                postData(apiEndpointLabData, { kode_kunjungan: kunjungan.kode_kunjungan }),
                postData(apiEndpointResepData, { kode_kunjungan: kunjungan.kode_kunjungan }),
            ]);

            setState(p => ({
                ...p,
                vitals: resVitals.data?.data || null,
                vaLayanan: resLayanan.data?.data || [],
                vaLab: resLab.data?.data || [],
                tarifOptions: resLab.data?.tarif_options || [],
                vaResep: resResep.data?.data || [],
                obatOptions: resResep.data?.obat_options || [],
            }));
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memuat detail pemeriksaan');
        } finally {
            setState(p => ({ ...p, loadPemeriksaan: false }));
        }
    };

    const onLazyLoad = (event: DataTableStateEvent) => {
        setState(prev => ({
            ...prev,
            first: event.first,
            rows: event.rows,
            page: typeof event.page === 'number' ? event.page + 1 : prev.page,
            sortField: event.sortField || prev.sortField,
            sortOrder: event.sortOrder ? (event.sortOrder === 1 ? 'asc' : 'desc') : prev.sortOrder,
        }));
    };

    useEffect(() => {
        loadPoliOptions();
    }, []);

    useEffect(() => {
        getData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.page, state.rows, state.sortField, state.sortOrder, state.keyword, state.selectedPoli]);

    useEffect(() => {
        if (session) setState(p => ({ ...p, session }));
    }, [session]);

    return (
        <>
            <Toast ref={toast} position="top-right" />

            {/* Header */}
            <div className="card p-0 mb-3">
                <div className="p-4 border-bottom-1 border-300">
                    <h2 className="text-3xl font-bold flex align-items-center gap-2 mb-1">
                        <i className="pi pi-stethoscope text-orange-600 text-3xl" />
                        Pemeriksaan Dokter
                    </h2>
                    <p className="text-color-secondary">
                        Antarmuka dokter untuk input konsultasi, tindakan medis, permintaan laboratorium, dan resep obat pasien.
                    </p>
                </div>
            </div>

            {/* Table Active Patients */}
            <TableComponent
                state={state}
                setState={setState}
                toast={toast}
                getData={getData}
                openPemeriksaan={openPemeriksaan}
                onLazyLoad={onLazyLoad}
            />

            {/* Form Examination Dialog */}
            <FormPemeriksaan
                state={state}
                setState={setState}
                toast={toast}
                getData={getData}
                openPemeriksaan={openPemeriksaan}
            />
        </>
    );
};

export default Page;
