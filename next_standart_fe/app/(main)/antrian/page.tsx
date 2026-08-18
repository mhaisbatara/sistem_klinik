'use client';

import postData from '@/lib/axios/postData';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { showError } from '@/lib/tools/generalTools';
import { useFormik } from 'formik';
import { FilterMatchMode } from 'primereact/api';
import { useSession } from 'next-auth/react';
import { DataTableStateEvent } from 'primereact/datatable';
import { initValue, FormMasterPoliValue, State } from './components/interfaces';
import {
    apiEndpointData,
    apiEndpointPoli,
    apiEndpointDokter,
    apiEndpointPenjamin,
    apiEndpointMasterPoliData,
} from './components/endpoints';
import Table from './components/display/table';
import GridPanggil from './components/display/grid_panggil';
import MasterPoliTable from './components/display/master_poli_table';
import { TabPanel, TabView } from 'primereact/tabview';

const Page = () => {
    const toast = useRef<Toast>(null);
    const { data: session } = useSession();

    const [state, setState] = useState<State>({
        load: false,
        loadGrid: false,
        loadPoli: false,
        loadDokter: false,
        loadPenjamin: false,
        loadMasterPoli: false,
        data: [],
        gridData: [],
        masterPoliData: [],
        poliOptions: [],
        dokterOptions: [],
        penjaminOptions: [],
        selectedPoli: '',
        selectedStatusFilter: '',
        selectedDateFilter: '',
        add: false,
        edit: false,
        delete: false,
        reset: false,

        addMasterPoli: false,
        editMasterPoli: false,
        deleteMasterPoli: false,
        selectedMasterPoli: null,

        selectedDatas: [],
        searchVal: '',
        filters: { global: { value: null, matchMode: FilterMatchMode.CONTAINS } },
        session: null,
        submittedData: null,
        first: 0,
        rows: 10,
        page: 1,
        keyword: '',
        totalData: 0,
        sortField: 'a.no_antrian',
        sortOrder: 'asc',
        activeTab: 0,

        masterPoliFirst: 0,
        masterPoliRows: 10,
        masterPoliPage: 1,
        masterPoliKeyword: '',
        masterPoliTotalData: 0,
        masterPoliSortField: 'kode_poli',
        masterPoliSortOrder: 'asc',
    });

    const formik = useFormik<initValue>({
        initialValues: {
            id: '',
            no_rm: '',
            kode_poli: '',
            kode_penjamin: '',
            kode_dokter: '',
            tanggal: '',
            status_panggil: 'menunggu',
            tz: '',
        },
        validate: (data) => {
            const errors: Partial<initValue> = {};
            if (!data.no_rm) errors.no_rm = 'No. Rekam Medis wajib dipilih.';
            if (!data.kode_poli) errors.kode_poli = 'Poli Tujuan wajib dipilih.';
            return errors;
        },
        onSubmit: (data) => {
            setState((p) => ({ ...p, submittedData: data }));
        },
    });

    const formikMasterPoli = useFormik<FormMasterPoliValue>({
        initialValues: {
            id: '',
            kode_poli: '',
            nama_poli: '',
            tz: '',
        },
        validate: (data) => {
            const errors: Partial<FormMasterPoliValue> = {};
            if (!data.nama_poli) errors.nama_poli = 'Nama Poliklinik wajib diisi.';
            return errors;
        },
        onSubmit: () => {},
    });

    const loadDropdowns = async () => {
        setState((p) => ({ ...p, loadPoli: true, loadDokter: true, loadPenjamin: true }));
        try {
            const [resPoli, resDokter, resPenjamin] = await Promise.all([
                postData(apiEndpointPoli, {}),
                postData(apiEndpointDokter, {}),
                postData(apiEndpointPenjamin, {}),
            ]);
            setState((p) => ({
                ...p,
                poliOptions: resPoli.data?.data || [],
                dokterOptions: resDokter.data?.data || [],
                penjaminOptions: resPenjamin.data?.data || [],
            }));
        } catch {
            showError(toast, 'Gagal memuat data master dropdown');
        } finally {
            setState((p) => ({ ...p, loadPoli: false, loadDokter: false, loadPenjamin: false }));
        }
    };

    const getData = async (apiEndpoint: string) => {
        setState((p) => ({ ...p, load: true }));
        try {
            const oPayload = {
                page: state.page,
                perPage: state.rows,
                keyword: state.keyword,
                kode_poli: state.selectedPoli || undefined,
                status_panggil: state.selectedStatusFilter || undefined,
                tanggal: state.selectedDateFilter || undefined,
                sortField: state.sortField,
                sortOrder: state.sortOrder,
            };
            const res = await postData(apiEndpoint, oPayload);
            setState((p) => ({ ...p, data: res.data.data, totalData: res.data.total_data }));
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setState((p) => ({ ...p, load: false }));
        }
    };

    const getGridData = async () => {
        setState((p) => ({ ...p, loadGrid: true }));
        try {
            const res = await postData(apiEndpointData, {
                kode_poli: state.selectedPoli || undefined,
                tanggal: state.selectedDateFilter || undefined,
                sortField: 'a.no_antrian',
                sortOrder: 'asc',
            });
            setState((p) => ({ ...p, gridData: res.data.data || [] }));
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setState((p) => ({ ...p, loadGrid: false }));
        }
    };

    const getMasterPoliData = async () => {
        setState((p) => ({ ...p, loadMasterPoli: true }));
        try {
            const oPayload = {
                page: state.masterPoliPage,
                perPage: state.masterPoliRows,
                keyword: state.masterPoliKeyword,
                sortField: state.masterPoliSortField,
                sortOrder: state.masterPoliSortOrder,
            };
            const res = await postData(apiEndpointMasterPoliData, oPayload);
            setState((p) => ({
                ...p,
                masterPoliData: res.data.data || [],
                masterPoliTotalData: res.data.total_data || 0,
            }));
            // Refresh dropdown options juga saat master poli berubah
            const resPoli = await postData(apiEndpointPoli, {});
            setState((p) => ({ ...p, poliOptions: resPoli.data?.data || [] }));
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Gagal memuat master poli');
        } finally {
            setState((p) => ({ ...p, loadMasterPoli: false }));
        }
    };

    const onLazyLoad = (event: DataTableStateEvent) => {
        setState((prev) => {
            const newPage = typeof event.page === 'number' ? event.page + 1 : prev.page;
            return {
                ...prev,
                first: event.first,
                rows: event.rows,
                page: newPage,
                sortField: event.sortField || prev.sortField,
                sortOrder: event.sortOrder
                    ? event.sortOrder === 1
                        ? 'asc'
                        : 'desc'
                    : prev.sortOrder,
            };
        });
    };

    const onLazyLoadMasterPoli = (event: DataTableStateEvent) => {
        setState((prev) => {
            const newPage = typeof event.page === 'number' ? event.page + 1 : prev.masterPoliPage;
            return {
                ...prev,
                masterPoliFirst: event.first,
                masterPoliRows: event.rows,
                masterPoliPage: newPage,
                masterPoliSortField: event.sortField || prev.masterPoliSortField,
                masterPoliSortOrder: event.sortOrder
                    ? event.sortOrder === 1
                        ? 'asc'
                        : 'desc'
                    : prev.masterPoliSortOrder,
            };
        });
    };

    useEffect(() => {
        loadDropdowns();
        getGridData();
        getMasterPoliData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        getData(apiEndpointData);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        state.page,
        state.rows,
        state.sortField,
        state.sortOrder,
        state.keyword,
        state.selectedPoli,
        state.selectedStatusFilter,
        state.selectedDateFilter,
    ]);

    useEffect(() => {
        getMasterPoliData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        state.masterPoliPage,
        state.masterPoliRows,
        state.masterPoliSortField,
        state.masterPoliSortOrder,
        state.masterPoliKeyword,
    ]);

    useEffect(() => {
        if (session) setState((prev) => ({ ...prev, session }));
    }, [session]);

    return (
        <>
            <Toast ref={toast} position="top-right" />

            <div className="card p-0 mb-3">
                <div className="p-4 border-bottom-1 border-300">
                    <h2 className="text-3xl font-bold flex align-items-center gap-2 mb-1">
                        <i className="pi pi-ticket text-blue-600 text-3xl" />
                        Antrian Poli &amp; Master Poliklinik
                    </h2>
                    <p className="text-color-secondary">
                        Kelola dan panggil pasien sesuai antrian poliklinik serta atur data master Poliklinik.
                    </p>
                </div>
            </div>

            <TabView
                activeIndex={state.activeTab}
                onTabChange={(e) => setState((p) => ({ ...p, activeTab: e.index }))}
            >
                <TabPanel
                    header="Panggil Antrian Poli"
                    leftIcon="pi pi-bell mr-2"
                >
                    <GridPanggil
                        state={state}
                        setState={setState}
                        toast={toast}
                        getGridData={getGridData}
                    />
                </TabPanel>

                <TabPanel
                    header="Master Antrian Poli"
                    leftIcon="pi pi-list mr-2"
                >
                    <Table
                        state={state}
                        setState={setState}
                        formik={formik}
                        toast={toast}
                        getData={getData}
                        getGridData={getGridData}
                        onLazyLoad={onLazyLoad}
                    />
                </TabPanel>

                <TabPanel
                    header="Master Poli (mst_poli)"
                    leftIcon="pi pi-building mr-2"
                >
                    <MasterPoliTable
                        state={state}
                        setState={setState}
                        formikMasterPoli={formikMasterPoli}
                        toast={toast}
                        getMasterPoliData={getMasterPoliData}
                        onLazyLoadMasterPoli={onLazyLoadMasterPoli}
                    />
                </TabPanel>
            </TabView>
        </>
    );
};

export default Page;
