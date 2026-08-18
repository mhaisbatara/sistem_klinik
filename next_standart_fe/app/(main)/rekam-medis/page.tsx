'use client';

import postData from '@/lib/axios/postData';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { showError } from '@/lib/tools/generalTools';
import { useSession } from 'next-auth/react';
import { DataTableStateEvent } from 'primereact/datatable';
import { State, KunjunganDetail } from './components/interfaces';
import { apiEndpointKunjunganData, apiEndpointKunjunganDetail, apiEndpointPoli } from './components/endpoints';
import TableComponent from './components/display/table';
import DetailPanel from './components/display/detail_panel';

const Page = () => {
    const toast = useRef<Toast>(null);
    const { data: session } = useSession();

    const [state, setState] = useState<State>({
        load: false,
        loadDetail: false,
        data: [],
        totalData: 0,
        page: 1,
        rows: 10,
        first: 0,
        keyword: '',
        sortField: 'k.tanggal_kunjungan',
        sortOrder: 'desc',
        selectedPoli: '',
        selectedStatus: '',
        selectedTanggal: '',
        poliOptions: [],
        selectedKunjungan: null,
        detail: null,
        showDetail: false,
        session: null,
    });

    const getData = async () => {
        setState(p => ({ ...p, load: true }));
        try {
            const payload = {
                page:              state.page,
                perPage:           state.rows,
                keyword:           state.keyword,
                kode_poli:         state.selectedPoli || undefined,
                status_kunjungan:  state.selectedStatus || undefined,
                tanggal:           state.selectedTanggal || undefined,
                sortField:         state.sortField,
                sortOrder:         state.sortOrder,
            };
            const res = await postData(apiEndpointKunjunganData, payload);
            setState(p => ({ ...p, data: res.data.data, totalData: res.data.total_data }));
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memuat data kunjungan');
        } finally {
            setState(p => ({ ...p, load: false }));
        }
    };

    const getDetail = async (kodeKunj: string) => {
        setState(p => ({ ...p, loadDetail: true, detail: null }));
        try {
            const res = await postData(apiEndpointKunjunganDetail, { kode_kunjungan: kodeKunj });
            setState(p => ({ ...p, detail: res.data.data as KunjunganDetail }));
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memuat detail kunjungan');
        } finally {
            setState(p => ({ ...p, loadDetail: false }));
        }
    };

    const loadPoliOptions = async () => {
        try {
            const res = await postData(apiEndpointPoli, {});
            setState(p => ({ ...p, poliOptions: res.data?.data || [] }));
        } catch { /* silent */ }
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
    }, [state.page, state.rows, state.sortField, state.sortOrder, state.keyword, state.selectedPoli, state.selectedStatus, state.selectedTanggal]);

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
                        <i className="pi pi-book text-blue-600 text-3xl" />
                        Rekam Medis
                    </h2>
                    <p className="text-color-secondary">
                        Riwayat kunjungan pasien beserta detail layanan medis, pemeriksaan laboratorium, dan resep obat.
                    </p>
                </div>
            </div>

            {/* Table */}
            <TableComponent
                state={state}
                setState={setState}
                toast={toast}
                getData={getData}
                getDetail={getDetail}
                onLazyLoad={onLazyLoad}
            />

            {/* Detail Dialog */}
            <DetailPanel
                state={state}
                setState={setState}
                toast={toast}
                getDetail={getDetail}
            />
        </>
    );
};

export default Page;
