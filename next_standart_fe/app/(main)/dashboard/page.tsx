'use client';

import { useEffect, useState } from 'react';
import postData from '@/lib/axios/postData';
import { Chart } from 'primereact/chart';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { useRouter } from 'next/navigation';

interface TrenKunjungan {
    tanggal: string;
    hari: string;
    jumlah: number;
}

interface PasienPoli {
    nama_poli: string;
    count: number;
    percentage: number;
}

interface DashboardData {
    kunjungan_hari_ini: number;
    pendapatan_hari_ini: number;
    pasien_menunggu: number;
    okupansi_poli: string;
    tren_kunjungan: TrenKunjungan[];
    pasien_per_poli: PasienPoli[];
}

const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val).replace('Rp', 'Rp ');
};

const DashboardPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardData>({
        kunjungan_hari_ini: 0,
        pendapatan_hari_ini: 0,
        pasien_menunggu: 0,
        okupansi_poli: '100%',
        tren_kunjungan: [],
        pasien_per_poli: [],
    });

    const getDashboardData = async () => {
        setLoading(true);
        try {
            const res = await postData('/dashboard/dashboard-data', {});
            if (res.data?.data) {
                setData(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getDashboardData();
    }, []);

    // Line Chart Data & Options
    const chartData = {
        labels: data.tren_kunjungan.map((item) => item.hari),
        datasets: [
            {
                label: 'Kunjungan',
                data: data.tren_kunjungan.map((item) => item.jumlah),
                fill: true,
                borderColor: '#1E293B',
                backgroundColor: 'rgba(254, 243, 199, 0.45)', // Cream / light orange tint like design
                tension: 0.45,
                pointBackgroundColor: '#1E293B',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            },
        ],
    };

    const chartOptions = {
        maintainAspectRatio: false,
        aspectRatio: 0.6,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#1E293B',
                padding: 10,
                cornerRadius: 8,
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#64748B',
                    font: {
                        family: 'Inter, sans-serif',
                        size: 12,
                        weight: '500',
                    },
                },
            },
            y: {
                grid: {
                    color: '#F1F5F9',
                },
                ticks: {
                    color: '#94A3B8',
                    stepSize: 1,
                    font: {
                        family: 'Inter, sans-serif',
                        size: 11,
                    },
                },
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="p-2 md:p-4 surface-ground min-h-screen">
            {/* Top Stat Cards Row */}
            <div className="grid mb-4">
                {/* Card 1: Kunjungan Hari Ini */}
                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="card p-4 surface-card border-round-xl shadow-1 hover:shadow-3 transition-all transition-duration-200 h-full flex flex-column justify-content-between">
                        <div className="flex align-items-center justify-content-between mb-3">
                            <div
                                className="flex align-items-center justify-content-center border-circle surface-900"
                                style={{ width: '44px', height: '44px' }}
                            >
                                <i className="pi pi-users text-white text-xl" />
                            </div>
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-color-secondary tracking-wider block mb-1 uppercase" style={{ letterSpacing: '0.08em' }}>
                                KUNJUNGAN HARI INI
                            </span>
                            {loading ? (
                                <Skeleton width="4rem" height="2.5rem" />
                            ) : (
                                <span className="text-4xl font-bold text-900">
                                    {data.kunjungan_hari_ini}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Card 2: Pendapatan Hari Ini */}
                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="card p-4 surface-card border-round-xl shadow-1 hover:shadow-3 transition-all transition-duration-200 h-full flex flex-column justify-content-between">
                        <div className="flex align-items-center justify-content-between mb-3">
                            <div
                                className="flex align-items-center justify-content-center border-circle surface-900"
                                style={{ width: '44px', height: '44px' }}
                            >
                                <i className="pi pi-wallet text-amber-400 text-xl" />
                            </div>
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-color-secondary tracking-wider block mb-1 uppercase" style={{ letterSpacing: '0.08em' }}>
                                PENDAPATAN HARI INI
                            </span>
                            {loading ? (
                                <Skeleton width="7rem" height="2.5rem" />
                            ) : (
                                <span className="text-3xl font-bold text-900">
                                    {formatRupiah(data.pendapatan_hari_ini)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Card 3: Pasien Menunggu */}
                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="card p-4 surface-card border-round-xl shadow-1 hover:shadow-3 transition-all transition-duration-200 h-full flex flex-column justify-content-between">
                        <div className="flex align-items-center justify-content-between mb-3">
                            <div
                                className="flex align-items-center justify-content-center border-circle surface-900"
                                style={{ width: '44px', height: '44px' }}
                            >
                                <i className="pi pi-clock text-amber-400 text-xl" />
                            </div>
                            <Tag
                                value="Normal"
                                severity="success"
                                className="px-3 py-1 text-xs font-medium border-round-pill bg-green-100 text-green-700 border-none"
                            />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-color-secondary tracking-wider block mb-1 uppercase" style={{ letterSpacing: '0.08em' }}>
                                PASIEN MENUNGGU
                            </span>
                            {loading ? (
                                <Skeleton width="4rem" height="2.5rem" />
                            ) : (
                                <span className="text-4xl font-bold text-900">
                                    {data.pasien_menunggu}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Card 4: Okupansi Poli */}
                <div className="col-12 sm:col-6 lg:col-3">
                    <div className="card p-4 surface-card border-round-xl shadow-1 hover:shadow-3 transition-all transition-duration-200 h-full flex flex-column justify-content-between">
                        <div className="flex align-items-center justify-content-between mb-3">
                            <div
                                className="flex align-items-center justify-content-center border-circle surface-900"
                                style={{ width: '44px', height: '44px' }}
                            >
                                <i className="pi pi-heart-fill text-amber-400 text-xl" />
                            </div>
                            <Tag
                                value="Stabil"
                                severity="success"
                                className="px-3 py-1 text-xs font-medium border-round-pill bg-green-100 text-green-700 border-none"
                            />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-color-secondary tracking-wider block mb-1 uppercase" style={{ letterSpacing: '0.08em' }}>
                                OKUPANSI POLI
                            </span>
                            {loading ? (
                                <Skeleton width="5rem" height="2.5rem" />
                            ) : (
                                <span className="text-4xl font-bold text-900">
                                    {data.okupansi_poli}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Row: Chart (Left 8) + Pasien per Poli (Right 4) */}
            <div className="grid">
                {/* Left Panel: Tren Kunjungan */}
                <div className="col-12 lg:col-8">
                    <div className="card p-4 surface-card border-round-xl shadow-1 h-full flex flex-column">
                        <div className="flex align-items-center justify-content-between mb-4">
                            <h3 className="text-xl font-bold text-900 m-0">
                                Tren Kunjungan (7 Hari)
                            </h3>
                            <Button
                                icon="pi pi-refresh"
                                text
                                rounded
                                size="small"
                                severity="secondary"
                                onClick={getDashboardData}
                                tooltip="Refresh Data"
                            />
                        </div>
                        <div className="flex-1" style={{ minHeight: '320px', position: 'relative' }}>
                            {loading ? (
                                <div className="flex align-items-center justify-content-center h-full">
                                    <Skeleton width="100%" height="280px" />
                                </div>
                            ) : (
                                <Chart
                                    type="line"
                                    data={chartData}
                                    options={chartOptions}
                                    style={{ width: '100%', height: '100%', minHeight: '300px' }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Pasien per Poli */}
                <div className="col-12 lg:col-4">
                    <div className="card p-4 surface-card border-round-xl shadow-1 h-full flex flex-column justify-content-between">
                        <div>
                            <h3 className="text-xl font-bold text-900 m-0 mb-4">
                                Pasien per Poli
                            </h3>

                            {loading ? (
                                <div className="flex flex-column gap-4">
                                    <Skeleton height="3rem" />
                                    <Skeleton height="3rem" />
                                </div>
                            ) : data.pasien_per_poli.length === 0 ? (
                                <p className="text-color-secondary text-sm py-4 text-center">
                                    Belum ada antrian pasien per poli hari ini.
                                </p>
                            ) : (
                                <div className="flex flex-column gap-4">
                                    {data.pasien_per_poli.map((poli, index) => (
                                        <div key={index} className="flex flex-column gap-2">
                                            <div className="flex justify-content-between align-items-center">
                                                <span className="font-semibold text-800 text-sm">
                                                    {poli.nama_poli}
                                                </span>
                                                <span className="font-bold text-900 text-sm">
                                                    {poli.count}
                                                </span>
                                            </div>
                                            {/* Progress bar line matching design */}
                                            <div
                                                className="surface-200 border-round overflow-hidden"
                                                style={{ height: '8px', width: '100%' }}
                                            >
                                                <div
                                                    className="surface-900 border-round h-full transition-all transition-duration-500"
                                                    style={{ width: `${poli.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-2">
                            <Button
                                label="Lihat Detail Poli"
                                severity="secondary"
                                outlined
                                className="w-full surface-50 border-300 text-900 font-semibold hover:surface-100 py-3"
                                onClick={() => router.push('/antrian')}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;