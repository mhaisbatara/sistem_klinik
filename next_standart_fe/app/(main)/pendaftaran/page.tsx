'use client';

import { useEffect, useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import postData from '@/lib/axios/postData';
import { State } from './components/interfaces';
import {
    apiEndpointAntrian,
    apiEndpointDokter,
    apiEndpointPenjamin,
    apiEndpointPoli,
} from './components/endpoints';
import FormBaruComponent from './components/display/form_baru';
import FormLamaComponent from './components/display/form_lama';

const INIT_STATE: State = {
    load: false,
    loadAntrian: false,
    loadDokter: false,
    loadPenjamin: false,
    loadPoli: false,
    loadSearch: false,
    activeTab: 0,
    session: null,
    antrianOptions: [],
    dokterOptions: [],
    penjaminOptions: [],
    poliOptions: [],
    searchQuery: '',
    searchResults: [],
    selectedPasien: null,
};

export default function PendaftaranPage() {
    const toast = useRef<Toast>(null);
    const [state, setState] = useState<State>(INIT_STATE);

    // ── Badge info: antrian loket yang belum didaftarkan ────────────────────
    const loadAntrian = async () => {
        setState((p) => ({ ...p, loadAntrian: true }));
        try {
            const res = await postData(apiEndpointAntrian, {});
            setState((p) => ({ ...p, antrianOptions: res.data?.data || [] }));
        } catch {
            setState((p) => ({ ...p, antrianOptions: [] }));
        } finally {
            setState((p) => ({ ...p, loadAntrian: false }));
        }
    };

    const loadDokter = async () => {
        setState((p) => ({ ...p, loadDokter: true }));
        try {
            const res = await postData(apiEndpointDokter, {});
            setState((p) => ({ ...p, dokterOptions: res.data?.data || [] }));
        } catch {
            setState((p) => ({ ...p, dokterOptions: [] }));
        } finally {
            setState((p) => ({ ...p, loadDokter: false }));
        }
    };

    const loadPenjamin = async () => {
        setState((p) => ({ ...p, loadPenjamin: true }));
        try {
            const res = await postData(apiEndpointPenjamin, {});
            setState((p) => ({ ...p, penjaminOptions: res.data?.data || [] }));
        } catch {
            setState((p) => ({ ...p, penjaminOptions: [] }));
        } finally {
            setState((p) => ({ ...p, loadPenjamin: false }));
        }
    };

    const loadPoli = async () => {
        setState((p) => ({ ...p, loadPoli: true }));
        try {
            const res = await postData(apiEndpointPoli, {});
            setState((p) => ({ ...p, poliOptions: res.data?.data || [] }));
        } catch {
            setState((p) => ({ ...p, poliOptions: [] }));
        } finally {
            setState((p) => ({ ...p, loadPoli: false }));
        }
    };

    useEffect(() => {
        loadAntrian();
        loadDokter();
        loadPenjamin();
        loadPoli();
    }, []);

    const antrianCount = state.antrianOptions.length;

    return (
        <div className="grid">
            <div className="col-12">
                <Toast ref={toast} />

                {/* ── Header ── */}
                <div className="flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                    <div>
                        <h2 className="text-3xl font-bold mb-1">
                            <i className="pi pi-clipboard text-blue-600 mr-2" />
                            Pendaftaran Pasien
                        </h2>
                        <p className="text-color-secondary">
                            Daftarkan pasien baru atau kunjungan ulang pasien lama
                        </p>
                    </div>
                    {/* Badge info antrian loket (informatif saja, bukan untuk dipilih di form) */}
                    <div className="flex align-items-center gap-2">
                        <div className="flex align-items-center gap-2 surface-100 border-round px-3 py-2">
                            <i className="pi pi-users text-blue-500" />
                            <span className="text-sm font-medium">Antrian loket menunggu:</span>
                            <Badge
                                value={antrianCount}
                                severity={antrianCount > 0 ? 'success' : 'secondary'}
                            />
                        </div>
                        <Button
                            icon="pi pi-refresh"
                            severity="secondary"
                            outlined rounded
                            tooltip="Refresh jumlah antrian loket"
                            onClick={loadAntrian}
                            loading={state.loadAntrian}
                        />
                    </div>
                </div>

                {/* ── TabView ── */}
                <TabView
                    activeIndex={state.activeTab}
                    onTabChange={(e) => setState((p) => ({
                        ...p,
                        activeTab: e.index,
                        selectedPasien: null,
                        searchQuery: '',
                        searchResults: [],
                    }))}
                >
                    <TabPanel header={
                        <span className="flex align-items-center gap-2">
                            <i className="pi pi-user-plus" /> Pasien Baru
                        </span>
                    }>
                        <FormBaruComponent
                            state={state}
                            setState={setState}
                            toast={toast}
                        />
                    </TabPanel>

                    <TabPanel header={
                        <span className="flex align-items-center gap-2">
                            <i className="pi pi-history" /> Pasien Lama
                        </span>
                    }>
                        <FormLamaComponent
                            state={state}
                            setState={setState}
                            toast={toast}
                        />
                    </TabPanel>
                </TabView>
            </div>
        </div>
    );
}
