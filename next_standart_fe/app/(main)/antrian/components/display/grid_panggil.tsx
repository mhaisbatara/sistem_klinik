'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { ComponentProps, AntrianItem, OPT_STATUS_PANGGIL } from '../interfaces';
import { apiEndpointPanggil } from '../endpoints';
import { getTzUser } from '@/lib/tools/dateTools';

const AUTO_REFRESH_SECONDS = 30;

// ─── Audio: Chime 2 nada (C5 → E5) ──────────────────────────────────────────
const playChime = () => {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const notes = [523.25, 659.25]; // C5 → E5
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            const t = ctx.currentTime + i * 0.4;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.45, t + 0.05);
            gain.gain.linearRampToValueAtTime(0, t + 0.45);
            osc.start(t);
            osc.stop(t + 0.5);
        });
    } catch (_) {
        console.warn('AudioContext tidak tersedia');
    }
};

// ─── TTS: Text to Speech Bahasa Indonesia ───────────────────────────────────
const speakNomor = (item: AntrianItem) => {
    try {
        if (!('speechSynthesis' in window)) {
            console.warn('SpeechSynthesis tidak tersedia di browser ini');
            return;
        }
        window.speechSynthesis.cancel();

        const poliName = item.nama_poli || 'Poliklinik';
        const teks = `Nomor antrian ${item.no_antrian}, atas nama ${item.nama_pasien}, silakan menuju ke ${poliName}`;
        const utter = new SpeechSynthesisUtterance(teks);
        utter.lang = 'id-ID';
        utter.rate = 0.88;
        utter.pitch = 1.05;
        utter.volume = 1;

        const speak = () => {
            const voices = window.speechSynthesis.getVoices();
            const idVoice = voices.find(
                (v) => v.lang === 'id-ID' || v.lang.startsWith('id')
            );
            if (idVoice) utter.voice = idVoice;
            window.speechSynthesis.speak(utter);
        };

        if (window.speechSynthesis.getVoices().length > 0) {
            setTimeout(speak, 800); // delay setelah chime
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                setTimeout(speak, 800);
            };
        }
    } catch (_) {
        console.warn('SpeechSynthesis error');
    }
};

const getSeverity = (s: string) => {
    if (s === 'dipanggil') return 'success';
    if (s === 'selesai')   return 'secondary';
    if (s === 'dilewati')  return 'warning';
    return 'info';
};

const getStatusLabel = (s: string) => {
    if (s === 'dipanggil') return 'Dipanggil';
    if (s === 'selesai')   return 'Selesai';
    if (s === 'dilewati')  return 'Dilewati';
    return 'Menunggu';
};

const getStatusIcon = (s: string) => {
    if (s === 'dipanggil') return 'pi-volume-up';
    if (s === 'selesai')   return 'pi-check-circle';
    if (s === 'dilewati')  return 'pi-step-forward';
    return 'pi-clock';
};

const GridPanggil = ({ state, setState, toast, getGridData }: ComponentProps) => {
    const router                          = useRouter();
    const [loadAction, setLoadAction]     = useState<string | null>(null);
    const [countdown, setCountdown]       = useState(AUTO_REFRESH_SECONDS);
    const [callHistory, setCallHistory]   = useState<AntrianItem[]>([]);
    const intervalRef                     = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Auto-refresh countdown ──────────────────────────────────────────────
    const triggerRefresh = useCallback(async () => {
        if (getGridData) await getGridData();
        setCountdown(AUTO_REFRESH_SECONDS);
    }, [getGridData]);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    triggerRefresh();
                    return AUTO_REFRESH_SECONDS;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [triggerRefresh]);

    // ── Pre-select poli pertama jika belum ada poli terpilih ────────────────
    useEffect(() => {
        if (!state.selectedPoli && state.poliOptions.length > 0) {
            setState((p) => ({ ...p, selectedPoli: state.poliOptions[0].kode_poli }));
        }
    }, [state.poliOptions, state.selectedPoli, setState]);

    // ── Derived state ───────────────────────────────────────────────────────
    const filteredData = state.gridData.filter((item) => {
        const matchPoli   = !state.selectedPoli || item.kode_poli === state.selectedPoli;
        const matchStatus = !state.selectedStatusFilter || item.status_panggil === state.selectedStatusFilter;
        return matchPoli && matchStatus;
    });

    const currentlyCalling = state.gridData.find(
        (i) => i.status_panggil === 'dipanggil' && (!state.selectedPoli || i.kode_poli === state.selectedPoli)
    );

    // Pasien menunggu terurut by no_antrian
    const waitingList = state.gridData
        .filter((i) => i.status_panggil === 'menunggu' && (!state.selectedPoli || i.kode_poli === state.selectedPoli))
        .sort((a, b) => parseInt(a.no_antrian) - parseInt(b.no_antrian));

    const nextWaiting = waitingList[0];

    const getPoliWaitingCount = (kode: string) =>
        state.gridData.filter((i) => i.kode_poli === kode && i.status_panggil === 'menunggu').length;

    const currentPoliName =
        state.poliOptions.find((p) => p.kode_poli === state.selectedPoli)?.nama_poli || 'Poliklinik';

    const poliOptionsDropdown = [
        { label: '— Pilih Poli —', value: '' },
        ...state.poliOptions.map((p) => ({ label: p.nama_poli, value: p.kode_poli })),
    ];

    // ── Aksi Panggil ───────────────────────────────────────────────────────
    const handleAksi = async (item: AntrianItem, aksi: 'dipanggil' | 'selesai' | 'dilewati' | 'menunggu') => {
        setLoadAction(item.id);
        try {
            const res = await postData(apiEndpointPanggil, { id: item.id, aksi, tz: getTzUser() });
            showSuccess(toast, res.data?.message || 'Status berhasil diperbarui');

            // Bunyikan chime & suara panggilan jika status dipanggil
            if (aksi === 'dipanggil') {
                playChime();
                speakNomor(item);
                const historyItem: AntrianItem = { ...item, status_panggil: 'dipanggil' as const };
                setCallHistory((prev) => [historyItem, ...prev].slice(0, 5));
            }

            if (getGridData) await getGridData();
            setCountdown(AUTO_REFRESH_SECONDS);
        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Gagal mengubah status antrian');
        } finally {
            setLoadAction(null);
        }
    };

    // ── Estimasi urutan tunggu ─────────────────────────────────────────────
    const getWaitingPosition = (item: AntrianItem) => {
        const idx = waitingList.findIndex((i) => i.id === item.id);
        return idx >= 0 ? idx + 1 : null;
    };

    return (
        <div className="flex flex-column gap-3">

            {/* ══ 1. SELECTOR POLI BESAR (HANYA DARI MASTER POLI) ═════════ */}
            <div className="card p-3">
                <div className="flex align-items-center justify-content-between mb-2">
                    <span className="font-bold text-sm uppercase text-color-secondary flex align-items-center gap-2">
                        <i className="pi pi-building text-blue-600" />
                        Pilih Poliklinik yang Dilayani
                    </span>

                    {/* Auto-refresh indicator */}
                    <div className="flex align-items-center gap-2">
                        <span className="text-xs text-color-secondary">
                            Auto-refresh dalam <b className={countdown <= 10 ? 'text-orange-500' : 'text-primary'}>{countdown}s</b>
                        </span>
                        <Button
                            label="Refresh"
                            icon="pi pi-refresh"
                            severity="secondary"
                            outlined
                            size="small"
                            loading={state.loadGrid}
                            onClick={() => triggerRefresh()}
                        />
                    </div>
                </div>

                <div className="grid m-0 gap-2">
                    {/* Kartu Poli Dinamis dari mst_poli (Tanpa "Semua Poli") */}
                    {state.poliOptions.map((poli) => {
                        const kode       = poli.kode_poli;
                        const isSelected = state.selectedPoli === kode;
                        const count      = getPoliWaitingCount(kode);

                        return (
                            <div
                                key={kode}
                                onClick={() => setState((p) => ({ ...p, selectedPoli: kode }))}
                                className={`
                                    col flex flex-column align-items-center justify-content-center
                                    p-3 border-2 border-round cursor-pointer
                                    transition-all transition-duration-200 text-center
                                    ${isSelected
                                        ? 'bg-blue-600 border-blue-700 text-white shadow-4'
                                        : 'surface-card border-300 hover:border-blue-400 hover:shadow-2'}
                                `}
                                style={{ minWidth: '130px', minHeight: '90px' }}
                            >
                                <i className={`pi pi-heart text-2xl mb-1 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                                <span className="font-bold text-sm line-clamp-1">{poli.nama_poli}</span>
                                <span className={`text-xs mt-1 px-2 py-1 border-round font-bold ${
                                    isSelected ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {count} menunggu
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ══ 2. BANNER UTAMA PEMANGGILAN ═════════════════════════════ */}
            <div className={`card p-4 border-round shadow-3 overflow-hidden border-2 transition-all transition-duration-500 ${
                currentlyCalling ? 'bg-blue-900 border-blue-500' : 'surface-900 border-700'
            }`}>
                <div className="flex flex-column md:flex-row align-items-center justify-content-between gap-4">
                    {/* Info Pasien Dipanggil */}
                    <div className="flex align-items-center gap-4 text-center md:text-left">
                        {/* Nomor Antrian Besar */}
                        <div className={`border-circle w-7rem h-7rem flex align-items-center justify-content-center shadow-3 flex-shrink-0 border-3 transition-all transition-duration-300 ${
                            currentlyCalling ? 'bg-white border-blue-300' : 'surface-800 border-600'
                        }`}>
                            <span className={`text-5xl font-black ${currentlyCalling ? 'text-blue-700' : 'text-400'}`}>
                                {currentlyCalling?.no_antrian || '—'}
                            </span>
                        </div>

                        <div className="text-white">
                            {currentlyCalling ? (
                                <>
                                    <div className="flex align-items-center gap-2 mb-2 justify-content-center md:justify-content-start flex-wrap">
                                        <span className="bg-blue-500 text-white text-xs px-2 py-1 border-round font-bold uppercase">
                                            {currentlyCalling.nama_poli || currentlyCalling.kode_poli}
                                        </span>
                                        <span className="bg-green-500 text-white text-xs px-2 py-1 border-round font-bold uppercase flex align-items-center gap-1">
                                            <i className="pi pi-volume-up text-xs" /> Sedang Dipanggil
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-extrabold mb-1 text-white m-0">
                                        {currentlyCalling.nama_pasien}
                                    </h2>
                                    <p className="text-blue-200 text-sm mb-0 m-0">
                                        No. RM: <b>{currentlyCalling.no_rm}</b>
                                        {currentlyCalling.nama_penjamin ? ` · ${currentlyCalling.nama_penjamin}` : ''}
                                        {currentlyCalling.nama_dokter ? ` · dr. ${currentlyCalling.nama_dokter}` : ''}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="flex align-items-center gap-2 mb-2">
                                        <span className="bg-blue-600 text-white text-xs px-2 py-1 border-round font-bold uppercase">{currentPoliName}</span>
                                    </div>
                                    <h2 className="text-2xl font-bold mb-1 text-400 m-0">Belum Ada Pasien Dipanggil</h2>
                                    <p className="text-400 text-sm mb-0 m-0">
                                        {waitingList.length > 0
                                            ? `${waitingList.length} pasien menunggu — klik "Panggil No. ${nextWaiting?.no_antrian}" untuk memanggil`
                                            : `Tidak ada antrian menunggu untuk ${currentPoliName}`}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Tombol Aksi Utama */}
                    <div className="flex flex-wrap justify-content-center gap-2 flex-shrink-0">
                        {currentlyCalling ? (
                            <>
                                <Button
                                    label="Panggil Ulang"
                                    icon="pi pi-volume-up"
                                    severity="info"
                                    size="large"
                                    loading={loadAction === currentlyCalling.id}
                                    onClick={() => handleAksi(currentlyCalling, 'dipanggil')}
                                />
                                <Button
                                    label="Periksa"
                                    icon="pi pi-stethoscope"
                                    severity="warning"
                                    size="large"
                                    onClick={() => router.push('/pemeriksaan-dokter')}
                                    tooltip="Arahkan ke Pemeriksaan Dokter"
                                />
                                <Button
                                    label="Lewati"
                                    icon="pi pi-step-forward"
                                    severity="warning"
                                    size="large"
                                    loading={loadAction === currentlyCalling.id}
                                    onClick={() => handleAksi(currentlyCalling, 'dilewati')}
                                />
                            </>
                        ) : nextWaiting ? (
                            <Button
                                label={`Panggil No. ${nextWaiting.no_antrian}`}
                                icon="pi pi-volume-up"
                                size="large"
                                className="p-button-raised font-bold"
                                loading={loadAction === nextWaiting.id}
                                onClick={() => handleAksi(nextWaiting, 'dipanggil')}
                            />
                        ) : null}
                    </div>
                </div>

                {/* Riwayat Pemanggilan (maks 5) */}
                {callHistory.length > 0 && (
                    <div className="mt-3 pt-3 border-top-1 border-700">
                        <span className="text-xs text-400 uppercase font-bold flex align-items-center gap-1">
                            <i className="pi pi-history text-xs text-blue-400" /> Riwayat Panggilan:
                        </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {callHistory.map((h, idx) => (
                                <span key={`${h.id}-${idx}`}
                                    className={`text-xs px-2 py-1 border-round border-1 text-300 ${idx === 0 ? 'font-bold text-blue-300 border-blue-400 bg-blue-950' : 'border-700 surface-800'}`}>
                                    No. {h.no_antrian} — {h.nama_pasien} ({h.nama_poli || h.kode_poli})
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ══ 3. FILTER STATUS ════════════════════════════════════════ */}
            <div className="flex flex-wrap align-items-center justify-content-between gap-2">
                <div className="flex align-items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-color-secondary">Filter:</span>
                    <Dropdown
                        value={state.selectedPoli}
                        options={poliOptionsDropdown}
                        onChange={(e) => setState((p) => ({ ...p, selectedPoli: e.value }))}
                        placeholder="Poli"
                        className="w-14rem"
                        filter
                    />
                    <Dropdown
                        value={state.selectedStatusFilter}
                        options={OPT_STATUS_PANGGIL}
                        onChange={(e) => setState((p) => ({ ...p, selectedStatusFilter: e.value }))}
                        placeholder="Status"
                        className="w-12rem"
                    />
                </div>
                <span className="text-sm font-bold text-blue-700">
                    {currentPoliName} · {filteredData.length} antrian
                </span>
            </div>

            {/* ══ 4. GRID DAFTAR ANTRIAN PASIEN ═══════════════════════════ */}
            <div>
                {filteredData.length === 0 ? (
                    <div className="card p-5 text-center text-color-secondary border-2 border-dashed border-300">
                        <i className="pi pi-inbox text-4xl mb-3 text-300" />
                        <p className="font-bold text-lg mb-1">
                            {state.selectedPoli
                                ? `Tidak ada antrian di ${currentPoliName} ${state.selectedStatusFilter ? `(${getStatusLabel(state.selectedStatusFilter)})` : ''}`
                                : 'Belum ada antrian'}
                        </p>
                        <p className="text-sm m-0">
                            Daftarkan pasien terlebih dahulu melalui menu Pendaftaran Pasien
                        </p>
                    </div>
                ) : (
                    <div className="grid m-0 gap-2">
                        {filteredData.map((item) => {
                            const isCallingThis = item.status_panggil === 'dipanggil';
                            const waitPos       = item.status_panggil === 'menunggu' ? getWaitingPosition(item) : null;

                            return (
                                <div key={item.id} className="col-12 sm:col-6 lg:col-4 xl:col-3 p-0">
                                    <div className={`card p-3 flex flex-column justify-content-between h-full border-2 border-round transition-all transition-duration-200 m-1 ${
                                        isCallingThis
                                            ? 'border-green-500 bg-green-50 shadow-4'
                                            : item.status_panggil === 'selesai'
                                                ? 'border-200 surface-50 opacity-70'
                                                : 'border-200 hover:border-blue-400 hover:shadow-2'
                                    }`}>
                                        {/* Header: No Antrian + Status */}
                                        <div className="flex justify-content-between align-items-start mb-2">
                                            <div className="flex align-items-center gap-2">
                                                <span className={`text-2xl font-black px-2 py-1 border-round ${
                                                    isCallingThis ? 'text-green-700 bg-green-100' : 'text-blue-700 bg-blue-50'
                                                }`}>
                                                    {item.no_antrian}
                                                </span>
                                                {waitPos && (
                                                    <span className="text-xs text-color-secondary font-semibold">
                                                        #{waitPos} tunggu
                                                    </span>
                                                )}
                                            </div>
                                            <Tag
                                                value={getStatusLabel(item.status_panggil)}
                                                severity={getSeverity(item.status_panggil)}
                                                icon={`pi ${getStatusIcon(item.status_panggil)}`}
                                            />
                                        </div>

                                        {/* Nama & RM */}
                                        <h4 className="text-base font-bold text-900 mb-1 mt-0 line-clamp-1">{item.nama_pasien}</h4>
                                        <p className="text-xs text-color-secondary mb-2 mt-0">RM: <b>{item.no_rm}</b></p>

                                        {/* Detail Poli / Penjamin / Dokter */}
                                        <div className="surface-100 border-round p-2 text-xs mb-2 flex flex-column gap-1">
                                            {!state.selectedPoli && (
                                                <div className="flex justify-content-between">
                                                    <span className="text-color-secondary">Poli</span>
                                                    <span className="font-semibold">{item.nama_poli || item.kode_poli}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-content-between">
                                                <span className="text-color-secondary">Penjamin</span>
                                                <span className="font-semibold">{item.nama_penjamin || 'Umum'}</span>
                                            </div>
                                            {item.nama_dokter && (
                                                <div className="flex justify-content-between">
                                                    <span className="text-color-secondary">Dokter</span>
                                                    <span className="font-semibold line-clamp-1">{item.nama_dokter}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tombol Aksi per Card */}
                                        <div className="flex gap-1 pt-1 border-top-1 border-100">
                                            {item.status_panggil === 'menunggu' && (
                                                <Button label="Panggil" icon="pi pi-volume-up" size="small"
                                                    className="w-full" loading={loadAction === item.id}
                                                    onClick={() => handleAksi(item, 'dipanggil')} />
                                            )}
                                            {item.status_panggil === 'dipanggil' && (
                                                <>
                                                    <Button label="Ulang" icon="pi pi-volume-up" severity="info"
                                                        size="small" className="w-full" loading={loadAction === item.id}
                                                        onClick={() => handleAksi(item, 'dipanggil')} />
                                                    <Button label="Periksa" icon="pi pi-stethoscope" severity="warning"
                                                        size="small" className="w-full"
                                                        onClick={() => router.push('/pemeriksaan-dokter')}
                                                        tooltip="Arahkan ke Pemeriksaan Dokter" />
                                                </>
                                            )}
                                            {item.status_panggil === 'dilewati' && (
                                                <Button label="Panggil Ulang" icon="pi pi-refresh" severity="warning"
                                                    size="small" className="w-full" loading={loadAction === item.id}
                                                    onClick={() => handleAksi(item, 'dipanggil')} />
                                            )}
                                            {item.status_panggil === 'selesai' && (
                                                <Button label="Kembalikan" icon="pi pi-undo" severity="secondary"
                                                    outlined size="small" className="w-full" loading={loadAction === item.id}
                                                    onClick={() => handleAksi(item, 'menunggu')}
                                                    tooltip="Kembalikan ke menunggu" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GridPanggil;
