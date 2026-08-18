'use client';

import postData from '@/lib/axios/postData';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { State, TagihanDetail } from './components/interfaces';
import {
    apiEndpointTagihanData, apiEndpointTagihanDetail,
    apiEndpointTagihanGenerate, apiEndpointPembayaranCreate
} from './components/endpoints';
import TableComponent from './components/display/table';
import DetailPanel from './components/display/detail_panel';
import KwitansiModal from './components/display/kwitansi_modal';

const Page = () => {
    const toast        = useRef<Toast>(null);
    const searchParams = useSearchParams();
    const { data: session } = useSession();

    const [state, setState] = useState<State>({
        load:              false,
        loadDetail:        false,
        loadBayar:         false,
        loadRegenerate:    false,
        data:              [],
        totalData:         0,
        page:              1,
        rows:              10,
        first:             0,
        keyword:           '',
        sortField:         't.tanggal',
        sortOrder:         'desc',
        selectedStatus:    '',
        selectedTanggal:   '',
        selectedTagihan:   null,
        detail:            null,
        showDetail:        false,
        showBayar:         false,
        showKwitansiModal: false,
        loadKwitansi:      false,
        kwitansiData:      null,
        formMetode:        '',
        formNominal:       '',
        session:           null,
    });

    const getData = async () => {
        setState(p => ({ ...p, load: true }));
        try {
            const res = await postData(apiEndpointTagihanData, {
                page:              state.page,
                perPage:           state.rows,
                keyword:           state.keyword,
                status_pembayaran: state.selectedStatus  || undefined,
                tanggal:           state.selectedTanggal || undefined,
                sortField:         state.sortField,
                sortOrder:         state.sortOrder,
            });
            setState(p => ({ ...p, data: res.data.data, totalData: res.data.total_data }));
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memuat data tagihan');
        } finally {
            setState(p => ({ ...p, load: false }));
        }
    };

    const getDetail = async (kodeTagihan: string) => {
        setState(p => ({ ...p, loadDetail: true, detail: null }));
        try {
            const res = await postData(apiEndpointTagihanDetail, { kode_tagihan: kodeTagihan });
            setState(p => ({ ...p, detail: res.data.data as TagihanDetail }));
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memuat detail tagihan');
        } finally {
            setState(p => ({ ...p, loadDetail: false }));
        }
    };

    const onPrintKwitansi = async (kodeTagihan: string) => {
        setState(p => ({ ...p, showKwitansiModal: true, loadKwitansi: true, kwitansiData: null }));
        try {
            const res = await postData('/kasir/kwitansi-print', { kode_tagihan: kodeTagihan });
            setState(p => ({ ...p, kwitansiData: res.data.data }));
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal memuat kwitansi');
            setState(p => ({ ...p, showKwitansiModal: false }));
        } finally {
            setState(p => ({ ...p, loadKwitansi: false }));
        }
    };

    const onBayar = async () => {
        if (!state.selectedTagihan || !state.formMetode || !state.formNominal) return;
        const kodeTagihan = state.selectedTagihan.kode_tagihan;
        setState(p => ({ ...p, loadBayar: true }));
        try {
            await postData(apiEndpointPembayaranCreate, {
                kode_tagihan:      kodeTagihan,
                metode_pembayaran: state.formMetode,
                jumlah_bayar:      state.formNominal,
            });
            showSuccess(toast, 'Pembayaran berhasil dicatat');
            setState(p => ({ ...p, showBayar: false }));
            // Refresh detail dan list
            await getDetail(kodeTagihan);
            await getData();
            // Buka Modal Kwitansi untuk cetak langsung
            await onPrintKwitansi(kodeTagihan);
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal mencatat pembayaran');
        } finally {
            setState(p => ({ ...p, loadBayar: false }));
        }
    };

    const onRegenerate = async (kodeKunjungan: string) => {
        setState(p => ({ ...p, loadRegenerate: true }));
        try {
            const res = await postData(apiEndpointTagihanGenerate, { kode_kunjungan: kodeKunjungan });
            showSuccess(toast, res.data.message || 'Tagihan berhasil di-regenerate');
            await getData();
        } catch (error: any) {
            showError(toast, error?.response?.data?.message || 'Gagal regenerate tagihan');
        } finally {
            setState(p => ({ ...p, loadRegenerate: false }));
        }
    };

    const onLazyLoad = (event: any) => {
        setState(prev => ({
            ...prev,
            first:     event.first,
            rows:      event.rows,
            page:      typeof event.page === 'number' ? event.page + 1 : prev.page,
            sortField: event.sortField || prev.sortField,
            sortOrder: event.sortOrder ? (event.sortOrder === 1 ? 'asc' : 'desc') : prev.sortOrder,
        }));
    };

    useEffect(() => { getData(); }, [state.page, state.rows, state.sortField, state.sortOrder, state.keyword, state.selectedStatus, state.selectedTanggal]); // eslint-disable-line

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
                        <i className="pi pi-credit-card text-primary text-3xl" />
                        Kasir &amp; Billing
                    </h2>
                    <p className="text-color-secondary">
                        Manajemen tagihan pasien, pembayaran cicilan, dan cetak kwitansi.
                    </p>
                </div>
            </div>

            <TableComponent
                state={state}
                setState={setState}
                toast={toast}
                getData={getData}
                getDetail={getDetail}
                onRegenerate={onRegenerate}
                onPrintKwitansi={onPrintKwitansi}
                onLazyLoad={onLazyLoad}
            />

            <DetailPanel
                state={state}
                setState={setState}
                toast={toast}
                getDetail={getDetail}
                onBayar={onBayar}
                onPrintKwitansi={onPrintKwitansi}
            />

            <KwitansiModal
                state={state}
                setState={setState}
                toast={toast}
            />
        </>
    );
};

export default Page;
