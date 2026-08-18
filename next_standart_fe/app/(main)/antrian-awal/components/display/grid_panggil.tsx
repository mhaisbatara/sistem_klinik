'use client';

import { Button } from 'primereact/button';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { GridPanggilProps, TableData } from '../interfaces';
import postData from '@/lib/axios/postData';
import { showError, showSuccess } from '@/lib/tools/generalTools';
import { apiEndpointPanggil, apiEndpointReset } from '../endpoints';
import { getTzUser } from '@/lib/tools/dateTools';

// ─── Audio: Chime 2 nada ────────────────────────────────────────────────────
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
const speakNomor = (noAntrian: string) => {
    try {
        if (!('speechSynthesis' in window)) {
            console.warn('SpeechSynthesis tidak tersedia di browser ini');
            return;
        }
        window.speechSynthesis.cancel();

        const teks = `Nomor antrian ${noAntrian}, silakan menuju ke loket`;
        const utter = new SpeechSynthesisUtterance(teks);
        utter.lang = 'id-ID';
        utter.rate = 0.85;
        utter.pitch = 1.05;
        utter.volume = 1;

        // Tunggu voices tersedia
        const speak = () => {
            const voices = window.speechSynthesis.getVoices();
            const idVoice = voices.find(
                (v) => v.lang === 'id-ID' || v.lang.startsWith('id')
            );
            if (idVoice) utter.voice = idVoice;
            window.speechSynthesis.speak(utter);
        };

        if (window.speechSynthesis.getVoices().length > 0) {
            setTimeout(speak, 900); // delay setelah chime
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                setTimeout(speak, 900);
            };
        }
    } catch (_) {
        console.warn('SpeechSynthesis error');
    }
};

// ─── Konfigurasi tampilan per status ────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
    bg: string; border: string; color: string;
    shadow: string; cursor: string; label: string;
}> = {
    tersedia: {
        bg: 'linear-gradient(135deg,#dcfce7,#bbf7d0)',
        border: '#22c55e', color: '#15803d',
        shadow: '0 2px 8px rgba(34,197,94,0.3)', cursor: 'pointer', label: ''
    },
    diambil: {
        bg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)',
        border: '#3b82f6', color: '#1d4ed8',
        shadow: '0 2px 8px rgba(59,130,246,0.3)', cursor: 'pointer', label: '📋'
    },
    dipanggil: {
        bg: 'linear-gradient(135deg,#fef9c3,#fde68a)',
        border: '#f59e0b', color: '#b45309',
        shadow: '0 2px 8px rgba(245,158,11,0.3)', cursor: 'pointer', label: '📢'
    },
    selesai: {
        bg: 'linear-gradient(135deg,#f3f4f6,#e5e7eb)',
        border: '#9ca3af', color: '#6b7280',
        shadow: 'none', cursor: 'not-allowed', label: '✅'
    },
    nonaktif: {
        bg: '#f9fafb',
        border: '#e5e7eb', color: '#d1d5db',
        shadow: 'none', cursor: 'not-allowed', label: '🚫'
    },
};

// Aksi berikutnya berdasarkan status
const NEXT_AKSI: Record<string, { aksi: string; label: string; pesan: string } | null> = {
    tersedia:  { aksi: 'diambil',   label: 'Tandai Diambil',  pesan: 'Pasien mengambil nomor ini?' },
    diambil:   { aksi: 'dipanggil', label: 'Panggil ke Loket', pesan: 'Panggil nomor antrian ini ke loket?' },
    dipanggil: { aksi: 'selesai',   label: 'Selesai Dilayani', pesan: 'Tandai antrian ini selesai dilayani?' },
    selesai:   null,
    nonaktif:  null,
};

const GridPanggil = ({ state, setState, toast, getGridData }: GridPanggilProps) => {
    const tersedia   = state.gridData.filter((d) => d.status === 'tersedia').length;
    const diambil    = state.gridData.filter((d) => d.status === 'diambil').length;
    const dipanggil  = state.gridData.filter((d) => d.status === 'dipanggil').length;
    const aktif      = state.gridData.filter((d) => d.status !== 'nonaktif');

    const handleAksi = (item: TableData) => {
        const next = NEXT_AKSI[item.status];
        if (!next) return;

        confirmDialog({
            message: (
                <div className="flex flex-column align-items-center text-center gap-3 py-2">
                    <i className="pi pi-bell text-blue-500 text-5xl" />
                    <div>
                        <h3 className="font-bold text-xl mb-1">Nomor {item.no_antrian} — {next.label}</h3>
                        <p className="text-color-secondary text-sm">{next.pesan}</p>
                    </div>
                </div>
            ) as any,
            header: 'Konfirmasi Aksi Antrian',
            acceptLabel: next.label,
            rejectLabel: 'Batal',
            acceptClassName: 'p-button-primary',
            rejectClassName: 'p-button-secondary p-button-outlined',
            accept: async () => {
                setState((p) => ({ ...p, loadGrid: true }));
                try {
                    const res = await postData(apiEndpointPanggil, {
                        kode_antrian: item.kode_antrian,
                        aksi: next.aksi,
                        tz: getTzUser(),
                    });
                    showSuccess(toast, res.data?.message || 'Berhasil');

                    // Hanya mainkan suara saat dipanggil ke loket
                    if (next.aksi === 'dipanggil') {
                        playChime();
                        speakNomor(item.no_antrian);
                    }

                    await getGridData();
                } catch (error: any) {
                    const e = error?.response?.data || error;
                    showError(toast, e?.message || 'Terjadi Kesalahan');
                } finally {
                    setState((p) => ({ ...p, loadGrid: false }));
                }
            },
        });
    };

    const handleReset = () => {
        confirmDialog({
            message: (
                <div className="flex flex-column align-items-center text-center gap-3 py-2">
                    <i className="pi pi-refresh text-orange-500 text-5xl" />
                    <div>
                        <h3 className="font-bold text-xl mb-1">Reset Semua Antrian?</h3>
                        <p className="text-color-secondary text-sm">
                            Semua nomor yang diambil/dipanggil akan dikembalikan ke tersedia.
                        </p>
                    </div>
                </div>
            ) as any,
            header: 'Konfirmasi Reset',
            acceptLabel: 'Ya, Reset',
            rejectLabel: 'Batal',
            acceptClassName: 'p-button-warning',
            rejectClassName: 'p-button-secondary p-button-outlined',
            accept: async () => {
                setState((p) => ({ ...p, loadGrid: true }));
                try {
                    const res = await postData(apiEndpointReset, { tz: getTzUser() });
                    showSuccess(toast, res.data?.message || 'Antrian berhasil direset');
                    await getGridData();
                } catch (error: any) {
                    const e = error?.response?.data || error;
                    showError(toast, e?.message || 'Terjadi Kesalahan');
                } finally {
                    setState((p) => ({ ...p, loadGrid: false }));
                }
            },
        });
    };

    return (
        <div className="card">
            <ConfirmDialog />

            {/* Header */}
            <div className="flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
                <div>
                    <h3 className="text-2xl font-semibold flex align-items-center gap-2 mb-1">
                        <i className="pi pi-bell text-blue-600 text-2xl" />
                        Panggil Antrian
                    </h3>
                    <p className="text-color-secondary text-sm">
                        Klik nomor sesuai kartu pasien untuk mengubah statusnya. Suara akan berbunyi saat <strong>Dipanggil</strong>.
                    </p>
                </div>
                <Button
                    label="Reset Semua"
                    icon="pi pi-refresh"
                    severity="warning"
                    outlined
                    size="small"
                    onClick={handleReset}
                    loading={state.loadGrid}
                />
            </div>

            {/* Counter */}
            <div className="flex gap-2 mb-4 flex-wrap">
                <Tag value={`🟢 Tersedia: ${tersedia}`}  severity="success"   className="text-sm px-3 py-2" />
                <Tag value={`🔵 Diambil: ${diambil}`}    severity="info"      className="text-sm px-3 py-2" />
                <Tag value={`🟡 Dipanggil: ${dipanggil}`} severity="warning"  className="text-sm px-3 py-2" />
                <Tag value={`Total Aktif: ${aktif.length}`} severity="secondary" className="text-sm px-3 py-2" />
            </div>

            {/* Legend */}
            <div className="flex gap-3 mb-4 flex-wrap text-sm text-color-secondary">
                <span>🟢 Tersedia = klik untuk tandai diambil</span>
                <span>🔵 Diambil = klik untuk panggil ke loket</span>
                <span>🟡 Dipanggil = klik untuk selesai</span>
                <span>✅ Selesai = tidak dapat diklik</span>
            </div>

            {/* Grid Tombol */}
            {state.loadGrid ? (
                <div className="flex justify-content-center align-items-center py-6">
                    <i className="pi pi-spinner pi-spin text-4xl text-blue-500" />
                </div>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                        gap: '12px',
                    }}
                >
                    {aktif.map((item) => {
                        const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.nonaktif;
                        const canClick = !!NEXT_AKSI[item.status];
                        const isDipanggil = item.status === 'dipanggil';
                        return (
                            <div
                                key={item.kode_antrian}
                                style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                            >
                                {/* Kartu nomor utama */}
                                <button
                                    onClick={() => handleAksi(item)}
                                    disabled={!canClick}
                                    title={`No. ${item.no_antrian} — ${item.status}`}
                                    style={{
                                        height: '84px',
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold',
                                        borderRadius: '12px',
                                        border: `2px solid ${cfg.border}`,
                                        background: cfg.bg,
                                        color: cfg.color,
                                        cursor: cfg.cursor,
                                        transition: 'all 0.18s ease',
                                        boxShadow: cfg.shadow,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '2px',
                                        width: '100%',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (canClick) {
                                            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.07)';
                                            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 18px ${cfg.border}66`;
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = cfg.shadow;
                                    }}
                                >
                                    <span style={{ lineHeight: 1 }}>{item.no_antrian}</span>
                                    {cfg.label && (
                                        <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>{cfg.label}</span>
                                    )}
                                </button>

                                {/* Tombol Panggil Ulang — hanya tampil saat dipanggil */}
                                {isDipanggil && (
                                    <button
                                        onClick={() => {
                                            playChime();
                                            speakNomor(item.no_antrian);
                                        }}
                                        title={`Panggil ulang nomor ${item.no_antrian}`}
                                        style={{
                                            padding: '4px 0',
                                            fontSize: '0.7rem',
                                            fontWeight: '600',
                                            borderRadius: '8px',
                                            border: '1.5px solid #f59e0b',
                                            background: '#fffbeb',
                                            color: '#b45309',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLButtonElement).style.background = '#fef3c7';
                                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(245,158,11,0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLButtonElement).style.background = '#fffbeb';
                                            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                                        }}
                                    >
                                        🔁 Panggil Ulang
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GridPanggil;
