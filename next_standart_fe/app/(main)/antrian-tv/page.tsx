'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import postData from '@/lib/axios/postData';
import { apiEndpointData, apiEndpointPoli } from '../antrian/components/endpoints';

interface AntrianTVItem {
    id: string;
    no_antrian: string;
    no_rm: string;
    kode_poli: string;
    nama_poli?: string;
    kode_penjamin?: string;
    nama_penjamin?: string;
    nama_dokter?: string;
    tanggal: string;
    status_panggil: 'menunggu' | 'dipanggil' | 'selesai' | 'dilewati';
    nama_pasien: string;
    nik?: string;
}

interface PoliOption {
    kode_poli: string;
    nama_poli: string;
}

// ─── Audio Chime (3 Harmonic Tones: C5 → E5 → G5) ───────────────────────────
const playChime = () => {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = freq;
            const t = ctx.currentTime + i * 0.3;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.4, t + 0.04);
            gain.gain.linearRampToValueAtTime(0, t + 0.35);
            osc.start(t);
            osc.stop(t + 0.4);
        });
    } catch (_) {
        console.warn('AudioContext tidak didukung');
    }
};

// ─── TTS Speech Synthesis ──────────────────────────────────────────────────
const speakAntrian = (item: AntrianTVItem) => {
    try {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();

        const poliName = item.nama_poli || 'Poliklinik';
        const teks = `Nomor antrian ${item.no_antrian}, atas nama ${item.nama_pasien}, silakan menuju ke ${poliName}`;
        const utter = new SpeechSynthesisUtterance(teks);
        utter.lang = 'id-ID';
        utter.rate = 0.85;
        utter.pitch = 1.05;
        utter.volume = 1;

        const doSpeak = () => {
            const voices = window.speechSynthesis.getVoices();
            const idVoice = voices.find((v) => v.lang === 'id-ID' || v.lang.startsWith('id'));
            if (idVoice) utter.voice = idVoice;
            window.speechSynthesis.speak(utter);
        };

        if (window.speechSynthesis.getVoices().length > 0) {
            setTimeout(doSpeak, 900);
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                setTimeout(doSpeak, 900);
            };
        }
    } catch (_) {
        console.warn('SpeechSynthesis error');
    }
};

export default function AntrianTVPage() {
    const searchParams = useSearchParams();
    const paramPoli = searchParams.get('kode_poli') || '';

    const [dataAntrian, setDataAntrian]   = useState<AntrianTVItem[]>([]);
    const [poliList, setPoliList]         = useState<PoliOption[]>([]);
    const [selectedPoli, setSelectedPoli] = useState<string>(paramPoli);
    const [currentTime, setCurrentTime]   = useState<Date | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMuted, setIsMuted]           = useState(false);
    const [loadData, setLoadData]         = useState(false);
    const isFirstFetchRef   = useRef(true);
    const prevCallingMapRef = useRef<Record<string, string>>({});

    // ── Live Clock Update ───────────────────────────────────────────────────
    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // ── Fetch Master Poliklinik from mst_poli ────────────────────────────────
    const loadPoliList = useCallback(async () => {
        try {
            const res = await postData(apiEndpointPoli, {});
            setPoliList(res.data?.data || []);
        } catch {
            /* silent */
        }
    }, []);

    // ── Fetch Today's Queue Data ────────────────────────────────────────────
    const fetchAntrian = useCallback(async () => {
        setLoadData(true);
        try {
            const payload: any = {
                sortField: 'a.no_antrian',
                sortOrder: 'asc',
            };
            if (selectedPoli && selectedPoli.trim() !== '' && selectedPoli !== 'all') {
                payload.kode_poli = selectedPoli;
            }
            const res = await postData(apiEndpointData, payload);
            const list: AntrianTVItem[] = res.data?.data || [];
            setDataAntrian(list);

            const newCallingMap: Record<string, string> = {};

            list.forEach((item) => {
                if (item.status_panggil === 'dipanggil') {
                    const callKey = `${item.id}_${item.no_antrian}`;
                    newCallingMap[item.kode_poli] = callKey;

                    // HANYA bunyikan suara jika BUKAN fetch awal saat masuk halaman
                    // Suara baru berbunyi ketika Admin Poli menekan tombol Panggil secara realtime
                    if (!isFirstFetchRef.current) {
                        if (
                            (!selectedPoli || item.kode_poli === selectedPoli) &&
                            prevCallingMapRef.current[item.kode_poli] !== callKey
                        ) {
                            if (!isMuted) {
                                playChime();
                                speakAntrian(item);
                            }
                        }
                    }
                }
            });

            prevCallingMapRef.current = newCallingMap;
            if (isFirstFetchRef.current) {
                isFirstFetchRef.current = false;
            }
        } catch (err) {
            console.error('Fetch antrian error:', err);
        } finally {
            setLoadData(false);
        }
    }, [selectedPoli, isMuted]);

    // Listener interaksi pertama untuk membuka izin audio browser jika diblokir autoplay
    useEffect(() => {
        const handleUserGesture = () => {
            try {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioCtx) {
                    const ctx = new AudioCtx();
                    if (ctx.state === 'suspended') ctx.resume();
                }
            } catch {}
        };
        window.addEventListener('click', handleUserGesture, { once: true });
        window.addEventListener('touchstart', handleUserGesture, { once: true });
        return () => {
            window.removeEventListener('click', handleUserGesture);
            window.removeEventListener('touchstart', handleUserGesture);
        };
    }, []);

    // ── Initial Load & Auto Refresh (Polling 3s) ───────────────────────────
    useEffect(() => {
        loadPoliList();
    }, [loadPoliList]);

    useEffect(() => {
        fetchAntrian();
        const interval = setInterval(fetchAntrian, 3000);
        return () => clearInterval(interval);
    }, [fetchAntrian]);

    // ── Fullscreen Toggle ──────────────────────────────────────────────────
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
        }
    };

    // ── Derived Data ──────────────────────────────────────────────────────
    const formattedDate = currentTime
        ? currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : '';

    const formattedTime = currentTime
        ? currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '';

    const dropdownOptions = [
        { label: 'Semua Poliklinik', value: '' },
        ...poliList.map((p) => ({ label: p.nama_poli, value: p.kode_poli })),
    ];

    const isSinglePoli = Boolean(selectedPoli && selectedPoli.trim() !== '' && selectedPoli !== 'all');

    const currentPoliLabel = isSinglePoli
        ? poliList.find((p) => p.kode_poli === selectedPoli)?.nama_poli || 'Poliklinik'
        : 'Semua Poliklinik';

    // Data khusus jika dalam mode Single Poli
    const singlePoliAntrian = selectedPoli ? dataAntrian.filter((i) => i.kode_poli === selectedPoli) : [];
    const singleCalling = singlePoliAntrian.find((i) => i.status_panggil === 'dipanggil');
    const singleWaitingList = singlePoliAntrian
        .filter((i) => i.status_panggil === 'menunggu')
        .sort((a, b) => parseInt(a.no_antrian) - parseInt(b.no_antrian));
    const singleSkippedList = singlePoliAntrian.filter((i) => i.status_panggil === 'dilewati');
    const singleDokterName = singleCalling?.nama_dokter || '—';

    return (
        <div className="surface-900 text-white min-h-screen flex flex-column justify-content-between p-3 select-none"
            style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>

            {/* ══ HEADER TV BAR ═══════════════════════════════════════════════ */}
            <header className="surface-800 border-round-2xl p-3 shadow-8 border-1 border-blue-900 flex flex-column md:flex-row align-items-center justify-content-between gap-3 mb-3"
                style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
                
                {/* Brand & Logo */}
                <div className="flex align-items-center gap-3">
                    <div className="bg-blue-600 border-circle p-3 flex align-items-center justify-content-center shadow-4">
                        <i className="pi pi-desktop text-3xl text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-wide text-white m-0 uppercase flex align-items-center gap-2">
                            SISTEM KLINIK UTAMA
                            <Tag value={currentPoliLabel} severity="info" className="text-xs px-2 py-1 uppercase tracking-wider" />
                        </h1>
                        <p className="text-blue-300 text-xs md:text-sm m-0 font-medium">
                            Monitor Layar Antrian Poliklinik Real-Time &amp; Panggilan Suara Otomatis
                        </p>
                    </div>
                </div>

                {/* Standby Beacon & Controls */}
                <div className="flex flex-wrap align-items-center justify-content-center md:justify-content-end gap-3">
                    {/* Poli Selector */}
                    <Dropdown
                        value={selectedPoli}
                        options={dropdownOptions}
                        onChange={(e) => setSelectedPoli(e.value)}
                        placeholder="Pilih Poli"
                        className="w-16rem surface-700 text-white border-blue-800"
                    />

                    {/* Status Badge */}
                    <div className="flex align-items-center gap-2 surface-900 border-round-pill px-3 py-2 border-1 border-blue-800">
                        <span className={`w-3rem h-1rem border-circle ${singleCalling || (!selectedPoli && dataAntrian.some(i => i.status_panggil === 'dipanggil')) ? 'bg-green-500 animate-ping' : 'bg-blue-500'}`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                            {singleCalling || (!selectedPoli && dataAntrian.some(i => i.status_panggil === 'dipanggil')) ? 'PANGGILAN AKTIF' : 'STANDBY'}
                        </span>
                    </div>

                    {/* Button Mute/Unmute Audio */}
                    <Button
                        icon={isMuted ? 'pi pi-volume-off' : 'pi pi-volume-up'}
                        severity={isMuted ? 'danger' : 'success'}
                        outlined
                        rounded
                        tooltip={isMuted ? 'Audio Dibisukan' : 'Audio Aktif'}
                        onClick={() => setIsMuted(!isMuted)}
                    />

                    {/* Button Tes Suara */}
                    <Button
                        icon="pi pi-bell"
                        severity="info"
                        outlined
                        rounded
                        tooltip="Tes Panggilan Suara"
                        onClick={() => {
                            playChime();
                            speakAntrian({
                                id: 'test',
                                no_antrian: '001',
                                no_rm: 'RM-000',
                                kode_poli: 'POLI',
                                nama_poli: currentPoliLabel,
                                nama_pasien: 'Pasien Percobaan',
                                tanggal: '',
                                status_panggil: 'dipanggil',
                            });
                        }}
                    />

                    {/* Fullscreen Button */}
                    <Button
                        icon={isFullscreen ? 'pi pi-window-minimize' : 'pi pi-window-maximize'}
                        severity="secondary"
                        outlined
                        rounded
                        tooltip="Toggle Fullscreen TV"
                        onClick={toggleFullscreen}
                    />

                    {/* Jam Digital Realtime */}
                    <div className="bg-blue-950 border-1 border-blue-700 border-round-xl px-4 py-2 text-center min-w-11rem shadow-4">
                        <div className="text-xs text-blue-300 font-bold uppercase">{formattedDate}</div>
                        <div className="text-2xl md:text-3xl font-black tracking-wider text-yellow-400 font-mono m-0">{formattedTime}</div>
                    </div>
                </div>
            </header>

            {/* ══ MAIN BODY CONTENT (SINGLE-POLI vs MULTI-POLI MODE) ═════════ */}
            <main className="flex-grow-1 w-full">
                {isSinglePoli ? (
                    /* ─────────────────────────────────────────────────────────────
                       MODE A: SINGLE-POLI FOCUS VIEW (1 POLIKLINIK FULLSCREEN)
                       ───────────────────────────────────────────────────────────── */
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1.25rem',
                        width: '100%',
                        alignItems: 'stretch',
                    }}>
                        
                        {/* LEFT COLUMN: HERO CALL / STANDBY CARD */}
                        <div style={{ flex: '1.3 1 400px', width: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div className={`card h-full p-5 border-round-2xl shadow-8 flex flex-column justify-content-between text-center transition-all transition-duration-500 border-3 ${
                                singleCalling
                                    ? 'bg-blue-950 border-cyan-400 shadow-blue-500'
                                    : 'surface-800 border-slate-700'
                            }`} style={{
                                minHeight: '400px',
                                background: singleCalling
                                    ? 'radial-gradient(circle, #1e3a8a 0%, #0f172a 100%)'
                                    : 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
                            }}>
                                {/* Header Poli & Dokter */}
                                <div>
                                    <h2 className="text-3xl md:text-5xl font-black tracking-wider text-white m-0 uppercase flex align-items-center justify-content-center gap-3">
                                        <i className="pi pi-building text-cyan-400 text-3xl md:text-5xl" />
                                        {currentPoliLabel}
                                    </h2>
                                    <p className="text-cyan-300 text-base md:text-xl font-bold mt-2 mb-0">
                                        {singleDokterName !== '—' ? `dr. ${singleDokterName}` : 'Poliklinik Spesialis'}
                                    </p>
                                </div>

                                {/* Body Display: Active Call vs Standby State */}
                                <div className="my-4">
                                    {singleCalling ? (
                                        <div className="animate-pulse">
                                            <span className="bg-cyan-500 text-slate-950 font-black text-sm md:text-lg px-4 py-2 border-round-pill uppercase tracking-widest inline-block mb-3 shadow-4">
                                                <i className="pi pi-volume-up mr-2" /> NOMOR ANTRIAN DIPANGGIL
                                            </span>
                                            <div className="text-8xl md:text-9xl font-black font-mono text-yellow-400 my-2 tracking-tight"
                                                style={{ fontSize: 'clamp(6rem, 14vw, 11rem)', lineHeight: 1 }}>
                                                {singleCalling.no_antrian}
                                            </div>
                                            <h3 className="text-3xl md:text-5xl font-extrabold text-white mb-2 line-clamp-1">
                                                {singleCalling.nama_pasien}
                                            </h3>
                                            <div className="text-sm md:text-xl text-blue-200">
                                                No. RM: <b className="text-yellow-300">{singleCalling.no_rm}</b>
                                                {singleCalling.nama_penjamin ? ` · ${singleCalling.nama_penjamin}` : ''}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-4 flex flex-column align-items-center justify-content-center">
                                            <div className="text-7xl font-black font-mono text-slate-600 my-2">
                                                —
                                            </div>
                                            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-300 mb-2">
                                                Silakan Menunggu Panggilan
                                            </h3>
                                            <p className="text-slate-400 text-sm md:text-base max-w-26rem">
                                                Nomor antrian akan otomatis tampil dan dipanggil saat Admin Poli memanggil pasien.
                                            </p>
                                            <span className="text-sm text-cyan-400 font-extrabold mt-3 bg-slate-900 px-4 py-2 border-round-pill border-1 border-blue-900">
                                                {singleWaitingList.length} Pasien Menunggu
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Status */}
                                <div className="surface-900 border-round-xl p-3 border-1 border-slate-700 text-xs md:text-sm text-slate-400 font-semibold">
                                    Status Layar TV: <b className="text-white uppercase">{singleCalling ? 'Sedang Melayani Pasien' : 'Standby / Siap Melayani'}</b>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: WAITING QUEUE LIST */}
                        <div style={{ flex: '1 1 320px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Card Antrian Menunggu */}
                            <div className="card surface-800 border-round-2xl p-4 shadow-8 border-1 border-slate-700 flex-grow-1 flex flex-column"
                                style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}>
                                <div className="flex align-items-center justify-content-between mb-3 pb-2 border-bottom-1 border-slate-700">
                                    <span className="font-extrabold text-lg md:text-xl text-cyan-400 uppercase flex align-items-center gap-2">
                                        <i className="pi pi-list text-cyan-400" />
                                        Antrian Menunggu ({singleWaitingList.length})
                                    </span>
                                    {loadData && <i className="pi pi-spin pi-spinner text-cyan-400" />}
                                </div>

                                {singleWaitingList.length === 0 ? (
                                    <div className="flex-grow-1 flex flex-column align-items-center justify-content-center text-slate-500 py-5">
                                        <i className="pi pi-inbox text-5xl mb-3" />
                                        <span className="text-base font-semibold">Tidak ada antrian menunggu di {currentPoliLabel}</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-column gap-2 overflow-y-auto" style={{ maxHeight: '450px' }}>
                                        {singleWaitingList.map((item, idx) => (
                                            <div key={item.id} className="surface-900 border-round-xl p-3 border-1 border-slate-700 flex align-items-center justify-content-between hover:border-cyan-500 transition-colors">
                                                <div className="flex align-items-center gap-3">
                                                    <span className="bg-blue-600 text-white text-2xl font-black px-3 py-2 border-round-lg font-mono">
                                                        {item.no_antrian}
                                                    </span>
                                                    <div>
                                                        <h4 className="text-base md:text-lg font-bold text-white mb-1 mt-0 line-clamp-1">{item.nama_pasien}</h4>
                                                        <small className="text-slate-400">RM: {item.no_rm} {item.nama_penjamin ? `· ${item.nama_penjamin}` : ''}</small>
                                                    </div>
                                                </div>
                                                <Tag value={`Urutan #${idx + 1}`} severity="info" className="text-xs font-bold" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Card Antrian Dilewati */}
                            {singleSkippedList.length > 0 && (
                                <div className="card surface-800 border-round-2xl p-3 shadow-6 border-1 border-slate-700"
                                    style={{ background: '#1e293b' }}>
                                    <div className="flex align-items-center justify-content-between mb-2">
                                        <span className="font-extrabold text-xs md:text-sm text-yellow-400 uppercase flex align-items-center gap-2">
                                            <i className="pi pi-step-forward text-yellow-400" />
                                            Antrian Dilewati ({singleSkippedList.length})
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {singleSkippedList.map((item) => (
                                            <span key={item.id}
                                                className="bg-yellow-950 text-yellow-300 border-1 border-yellow-700 px-3 py-1 border-round-lg text-sm font-bold font-mono">
                                                No. {item.no_antrian} ({item.nama_pasien})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* ─────────────────────────────────────────────────────────────
                       MODE B: MULTI-POLI GRID VIEW (6 LAYAR POLI mst_poli)
                       ───────────────────────────────────────────────────────────── */
                    poliList.length === 0 ? (
                        <div className="surface-800 border-round-2xl p-5 text-center text-slate-400 border-1 border-slate-700 my-5 w-full">
                            <i className="pi pi-spin pi-spinner text-5xl mb-3 text-blue-500" />
                            <h3 className="text-2xl font-bold text-white mb-2">Memuat Layar Poliklinik...</h3>
                            <p className="text-sm">Menyiapkan data master poliklinik dari database mst_poli.</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: '1rem',
                            width: '100%',
                        }}>
                            {poliList.map((poli) => {
                                const kode = poli.kode_poli;
                                const nama = poli.nama_poli;

                                const poliAntrian = dataAntrian.filter((i) => i.kode_poli === kode);
                                const currentlyCalling = poliAntrian.find((i) => i.status_panggil === 'dipanggil');
                                const waitingList = poliAntrian
                                    .filter((i) => i.status_panggil === 'menunggu')
                                    .sort((a, b) => parseInt(a.no_antrian) - parseInt(b.no_antrian));
                                const dokterName = currentlyCalling?.nama_dokter || '—';

                                return (
                                    <div key={kode} className="w-full">
                                        <div className={`card h-full p-4 border-round-2xl shadow-8 flex flex-column justify-content-between transition-all transition-duration-300 border-2 ${
                                            currentlyCalling
                                                ? 'bg-blue-950 border-cyan-400 shadow-blue-500'
                                                : 'surface-800 border-slate-700'
                                        }`} style={{
                                            minHeight: '260px',
                                            background: currentlyCalling
                                                ? 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)'
                                                : 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
                                        }}>
                                            
                                            {/* Header Box Poli */}
                                            <div className="flex align-items-center justify-content-between pb-2 border-bottom-1 border-slate-700">
                                                <div>
                                                    <h3 className="text-xl md:text-2xl font-black text-white m-0 tracking-wide uppercase line-clamp-1 flex align-items-center gap-2">
                                                        <i className="pi pi-building text-cyan-400 text-lg" />
                                                        {nama}
                                                    </h3>
                                                    <small className="text-slate-400 block mt-1 font-semibold">
                                                        {dokterName !== '—' ? `dr. ${dokterName}` : 'Poliklinik Spesialis'}
                                                    </small>
                                                </div>
                                                <Tag
                                                    value={currentlyCalling ? 'DIPANGGIL' : 'STANDBY'}
                                                    severity={currentlyCalling ? 'success' : 'secondary'}
                                                    className="text-xs px-2 py-1 font-bold"
                                                />
                                            </div>

                                            {/* Display Body: Nomor Dipanggil vs Default Standby */}
                                            <div className="my-3 text-center">
                                                {currentlyCalling ? (
                                                    <div className="animate-pulse">
                                                        <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest block mb-1">
                                                            NOMOR DIPANGGIL
                                                        </span>
                                                        <div className="text-6xl md:text-7xl font-black font-mono text-yellow-400 my-1 tracking-tight"
                                                            style={{ lineHeight: 1 }}>
                                                            {currentlyCalling.no_antrian}
                                                        </div>
                                                        <div className="text-lg font-bold text-white line-clamp-1 mt-1">
                                                            {currentlyCalling.nama_pasien}
                                                        </div>
                                                        <div className="text-xs text-blue-200">
                                                            RM: <b>{currentlyCalling.no_rm}</b>
                                                            {currentlyCalling.nama_penjamin ? ` · ${currentlyCalling.nama_penjamin}` : ''}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="py-2 flex flex-column align-items-center justify-content-center">
                                                        <div className="text-5xl font-black font-mono text-slate-600 my-1">
                                                            —
                                                        </div>
                                                        <p className="text-slate-400 text-xs md:text-sm m-0 font-medium">
                                                            Silakan Menunggu Panggilan
                                                        </p>
                                                        <span className="text-xs text-cyan-400 font-bold mt-2 bg-slate-900 px-3 py-1 border-round-pill">
                                                            {waitingList.length} Pasien Menunggu
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Footer Box Poli: Antrian Menunggu Berikutnya */}
                                            <div className="surface-900 border-round-xl p-2 border-1 border-slate-700 text-xs">
                                                <div className="flex justify-content-between align-items-center text-slate-400 mb-1 font-semibold">
                                                    <span>Antrian Berikutnya:</span>
                                                    <span className="text-cyan-400 font-bold">{waitingList.length} Antrian</span>
                                                </div>
                                                {waitingList.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {waitingList.slice(0, 3).map((item) => (
                                                            <span key={item.id} className="bg-blue-900 text-blue-200 px-2 py-1 border-round font-mono font-bold">
                                                                {item.no_antrian}
                                                            </span>
                                                        ))}
                                                        {waitingList.length > 3 && (
                                                            <span className="text-slate-400 px-1 py-1 font-bold">
                                                                +{waitingList.length - 3} lagi
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-500 italic">Belum ada antrian berikutnya</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </main>

            {/* ══ FOOTER RUNNING TEXT TICKER ══════════════════════════════════ */}
            <footer className="surface-800 border-round-2xl p-2 mt-3 shadow-8 border-1 border-blue-900 overflow-hidden flex align-items-center relative"
                style={{ background: '#0f172a' }}>
                <div className="bg-blue-600 text-white font-black text-xs md:text-sm uppercase px-3 py-2 border-round mr-3 flex-shrink-0 flex align-items-center gap-2 z-3 shadow-3">
                    <i className="pi pi-megaphone" /> INFORMASI KLINIK UTAMA
                </div>
                <div className="overflow-hidden whitespace-nowrap w-full relative flex align-items-center">
                    <div className="text-sm md:text-base font-semibold text-blue-200 tracking-wide inline-block"
                        style={{
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                            animation: 'ticker 30s linear infinite',
                        }}>
                        Selamat Datang di Sistem Klinik Utama • Harap Menyiapkan Kartu Identitas (KTP / BPJS) Saat Nomor Antrian Dipanggil • Utamakan Keselamatan &amp; Kebersihan Bersama • Jam Pelayanan Poliklinik: Senin - Sabtu (08:00 - 16:00 WIB) • Terima Kasih Atas Kepercayaan Anda.
                    </div>
                </div>
                <style jsx>{`
                    @keyframes ticker {
                        0% { transform: translateX(100%); }
                        100% { transform: translateX(-100%); }
                    }
                `}</style>
            </footer>
        </div>
    );
}
