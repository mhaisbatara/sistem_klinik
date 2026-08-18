'use client';

import { useFormik } from 'formik';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { showError, showSuccess } from '../../../../lib/tools/generalTools';
import { signIn } from 'next-auth/react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import Image from 'next/image';
import axios from 'axios';
import { LoginFormik, LoginState } from './component/interfaces';

const LoginPage = () => {
  const router = useRouter();
  const toast = useRef<Toast>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<LoginState>({
    load: false,
    googleLoad: false,
  });

  const formik = useFormik<LoginFormik>({
    initialValues: {
      username: '',
      password: '',
      remember_me: false
    },
    validate: (data: LoginFormik) => {
      let errors = {} as Record<keyof LoginFormik, string>;

      if (!data.username) {
        errors.username = 'Username wajib diisi';
      }
      if (!data.password) {
        errors.password = 'Password wajib diisi';
      }

      return errors;
    },
    onSubmit: (data) => {
      handleSubmit(data);
    }
  });

  const handleSubmit = async (data: LoginFormik) => {
    setState((p) => ({ ...p, load: true }));
    try {
      const { data: vaLogin } = await axios.post('/api/auth/login', {
        username: data.username,
        password: data.password,
        remember_me: data.remember_me ? '1' : '0'
      });

      const nAuth = await signIn('credentials', {
        userData: JSON.stringify(vaLogin.data),
        redirect: false
      });

      if (nAuth?.error) {
        showError(toast, 'Username atau password salah.');
      } else {
        showSuccess(toast, 'Login Berhasil!');
        setTimeout(() => router.push('/'), 500);
      }
    } catch (error: any) {
      const e = error?.response?.data || error;
      showError(toast, e.message || 'Terjadi kesalahan, silakan coba lagi nanti');
    } finally {
      setState((p) => ({ ...p, load: false }));
    }
  };

  const handleGoogleLogin = async () => {
    setState((p) => ({ ...p, googleLoad: true }));
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      showError(toast, 'Gagal terhubung dengan Google.');
      setState((p) => ({ ...p, googleLoad: false }));
    }
  };

  const [isShortScreen, setIsShortScreen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsShortScreen(window.innerHeight < 820);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const layout = {
    cardHeight: isShortScreen ? '96vh' : '90vh',
    leftPanelPadding: isShortScreen ? 'p-3 md:p-5' : 'p-5 md:p-6',
    headerMargin: isShortScreen ? 'mb-2' : 'mb-4',
    fieldMargin: isShortScreen ? 'mb-2' : 'mb-3',
    inputPadding: isShortScreen ? 'py-2 px-3' : 'py-3 px-3',
    logoTop: isShortScreen ? '1.5rem' : '2.5rem',
  };

  return (
    <>
      <Toast ref={toast} />

      {/* CSS Keyframes dengan performa GPU teroptimasi */}
      <style>{`
        @keyframes floatMainCard {
          0%, 100% { transform: rotate(-5deg) translate(-10px, -5px); }
          50% { transform: rotate(-4deg) translate(-10px, -14px); }
        }
        @keyframes floatWidgetOne {
          0%, 100% { transform: rotate(4deg) translate(8px, 8px); }
          50% { transform: rotate(5deg) translate(8px, 1px); }
        }
        @keyframes floatWidgetThree {
          0%, 100% { transform: rotate(-4deg) translate(8px, 8px); }
          50% { transform: rotate(-4deg) translate(8px, 1px); }
        }
        @keyframes floatWidgetTwo {
          0%, 100% { transform: rotate(8deg) translate(4px, -8px); }
          50% { transform: rotate(7deg) translate(4px, -15px); }
        }
        @keyframes pulseAmbient {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(1.1); opacity: 0.35; }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .anim-main-card {
          animation: floatMainCard 5.5s ease-in-out infinite;
        }
        .anim-widget-one {
          animation: floatWidgetOne 4.5s ease-in-out infinite;
        }
        .anim-widget-two {
          animation: floatWidgetTwo 5s ease-in-out infinite;
        }
        .anim-widget-three {
          animation: floatWidgetThree 5.2s ease-in-out infinite;
        }
        .anim-ambient {
          animation: pulseAmbient 8s ease-in-out infinite;
        }
        .pulse-dot {
          animation: pulseDot 1.8s infinite;
        }
      `}</style>

      {/* Container Utama locked h-screen */}
      <div className="flex w-full h-screen align-items-center justify-content-center p-2 md:p-3 surface-100 overflow-hidden">
        {/* Main Card */}
        <div
          className="flex w-full surface-0 border-round-3xl shadow-3 overflow-hidden"
          style={{
            maxWidth: '1200px',
            height: layout.cardHeight,
            maxHeight: layout.cardHeight,
            transition: 'all 0.3s ease'
          }}
        >
          {/* Panel Kiri (SaaS Store Value Propositions Showcase - Swapped Left) */}
          <div className="hidden md:flex w-8 p-4">
            <div
              className="w-full h-full border-round-2xl flex flex-column justify-content-between p-5 relative overflow-hidden"
              style={{
                background: 'radial-gradient(circle, #F4FAF7 0%, #E2F2E9 100%)',
                backgroundImage: 'radial-gradient(rgba(16, 185, 129, 0.2) 1.5px, transparent 1.5px)',
                backgroundSize: '24px 24px',
                border: '1px solid #E2E8F0'
              }}
            >
              {/* Efek Ambient Glow Halus */}
              <div
                className="absolute bg-green-200 opacity-25 filter blur-3xl border-circle anim-ambient"
                style={{ width: '300px', height: '300px', top: '-10%', right: '-10%', pointerEvents: 'none' }}
              ></div>
              <div
                className="absolute bg-teal-200 opacity-30 filter blur-3xl border-circle"
                style={{ width: '250px', height: '250px', bottom: '-10%', left: '-10%', pointerEvents: 'none' }}
              ></div>
              <div
                className="absolute bg-emerald-100 opacity-20 filter blur-2xl border-circle"
                style={{ width: '180px', height: '180px', top: '40%', left: '20%', pointerEvents: 'none' }}
              ></div>

              {/* Teks Header Hero */}
              <div className="text-center z-1 mt-2">
                <span className="inline-block bg-white-alpha-80 text-green-700 text-xs font-bold px-3 py-1 border-round-20 mb-2 uppercase tracking-wider border-1 border-white-alpha-30 shadow-1">
                  MICROVA STORE
                </span>
                <h2 className="text-2xl font-bold text-900 m-0 line-height-2">
                  Eksplorasi Layanan <span className="text-green-600">SaaS Terbaik</span>
                </h2>
              </div>

              {/* Tampilan Ilustrasi Glassmorphism Katalog SaaS Store */}
              <div className="flex-grow-1 flex align-items-center justify-content-center my-3 z-1 overflow-hidden">
                <div
                  className="relative w-full flex align-items-center justify-content-center"
                  style={{
                    maxWidth: '340px',
                    height: isShortScreen ? '220px' : '280px',
                    transition: 'all 0.3s'
                  }}
                >
                  {/* Kartu Dasar Utama (Frosted Acrylic Glass Catalog) */}
                  <div
                    className="absolute p-4 flex flex-column shadow-1 gap-3 anim-main-card border-1"
                    style={{
                      width: '310px',
                      height: '220px',
                      borderRadius: '20px',
                      background: 'rgba(255, 255, 255, 0.75)',
                      borderColor: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      // boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.5) inset'
                    }}
                  >
                    {/* Header Store Catalog */}
                    <div className="flex align-items-center justify-content-between border-bottom-1 border-100 pb-2">
                      <div className="flex align-items-center gap-2">
                        <div className="bg-green-600 border-circle flex align-items-center justify-content-center" style={{ width: '22px', height: '22px' }}>
                          <i className="pi pi-shopping-bag text-white text-xs"></i>
                        </div>
                        <span className="text-800 font-bold text-xs">Katalog Aplikasi</span>
                      </div>
                      <span className="text-500 font-semibold cursor-pointer hover:text-green-600" style={{ fontSize: '0.65rem' }}>Lihat Semua</span>
                    </div>

                    {/* Daftar Produk Layanan */}
                    <div className="flex flex-column gap-2">
                      {/* Produk 1 */}
                      <div className="flex align-items-center justify-content-between p-2 bg-white-alpha-60 border-round-xl border-1 border-white-alpha-30 shadow-1">
                        <div className="flex align-items-center gap-3">
                          <div className="bg-green-100 text-green-700 border-round-lg flex align-items-center justify-content-center shadow-1" style={{ width: '28px', height: '28px' }}>
                            <i className="pi pi-chart-line text-sm"></i>
                          </div>
                          <div className="flex flex-column text-left">
                            <span className="text-900 font-bold text-xs">Akuntansi</span>
                            <span className="text-500 font-medium" style={{ fontSize: '0.55rem' }}>Sistem Keuangan</span>
                          </div>
                        </div>
                        <span className="bg-green-100 text-green-700 font-bold border-round-xl px-3 py-1 flex align-items-center gap-1" style={{ fontSize: '0.6rem' }}>
                          <span className="w-2 h-2 bg-green-500 border-circle inline-block pulse-dot"></span> Aktif
                        </span>
                      </div>

                      {/* Produk 2 */}
                      <div className="flex align-items-center justify-content-between p-2 bg-white-alpha-60 border-round-xl border-1 border-white-alpha-30 shadow-1">
                        <div className="flex align-items-center gap-3">
                          <div className="bg-blue-100 text-blue-700 border-round-lg flex align-items-center justify-content-center shadow-1" style={{ width: '28px', height: '28px' }}>
                            <i className="pi pi-shop text-sm"></i>
                          </div>
                          <div className="flex flex-column text-left">
                            <span className="text-900 font-bold text-xs">Kasir POS</span>
                            <span className="text-500 font-medium" style={{ fontSize: '0.55rem' }}>Kasir Retail</span>
                          </div>
                        </div>
                        <span className="bg-green-100 text-green-700 font-bold border-round-xl px-3 py-1 flex align-items-center gap-1" style={{ fontSize: '0.6rem' }}>
                          <span className="w-2 h-2 bg-green-500 border-circle inline-block pulse-dot"></span> Aktif
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Widget Melayang 1 (Cloud Support) */}
                  <div
                    className="absolute shadow-3 p-2 flex align-items-center gap-3 anim-widget-three border-1"
                    style={{
                      width: '155px',
                      bottom: '-10px',
                      left: '-40px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.85)',
                      borderColor: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                    }}
                  >
                    <div className="bg-green-50 text-green-600 border-circle flex align-items-center justify-content-center shadow-1" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                      <i className="pi pi-cloud text-xs"></i>
                    </div>
                    <div className="flex flex-column text-left">
                      <span className="text-400 font-bold" style={{ fontSize: '0.5rem' }}>CLOUD STORAGE</span>
                      <span className="text-800 font-bold text-xs">Online System</span>
                    </div>
                  </div>

                  {/* Widget Melayang 2 (Ticketing System) */}
                  <div
                    className="absolute shadow-3 p-2 flex align-items-center gap-3 anim-widget-one border-1"
                    style={{
                      width: '155px',
                      bottom: '5px',
                      right: '-10px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.85)',
                      borderColor: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                    }}
                  >
                    <div className="bg-green-50 text-green-600 border-circle flex align-items-center justify-content-center shadow-1" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                      <i className="pi pi-bolt text-xs"></i>
                    </div>
                    <div className="flex flex-column text-left">
                      <span className="text-400 font-bold" style={{ fontSize: '0.5rem' }}>TICKETING</span>
                      <span className="text-800 font-bold text-xs">Support 24/7</span>
                    </div>
                  </div>

                  {/* Widget Melayang 3 (Security) */}
                  <div
                    className="absolute shadow-3 p-2 flex align-items-center gap-3 anim-widget-two border-1"
                    style={{
                      width: '145px',
                      top: '-15px',
                      right: '-15px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.85)',
                      borderColor: 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                    }}
                  >
                    <div className="bg-blue-50 text-blue-600 border-circle flex align-items-center justify-content-center shadow-1" style={{ width: '26px', height: '26px', flexShrink: 0 }}>
                      <i className="pi pi-shield text-xs"></i>
                    </div>
                    <span className="text-700 font-bold text-xs">Terverifikasi</span>
                  </div>

                </div>
              </div>

              {/* Tagline & Indikator Halaman */}
              <div className="text-center z-1 mb-1">
                <p className="text-600 line-height-3 m-0 max-w-sm mx-auto text-xs">
                  Satu akun untuk mengelola, berlangganan, dan memantau seluruh kebutuhan perangkat lunak bisnis Anda langsung dalam satu hub store terpadu.
                </p>

                {/* Indikator Slider */}
                <div className="flex justify-content-center gap-1 mt-3">
                  <div className="bg-green-600 border-round-xl" style={{ width: '20px', height: '4px' }}></div>
                  <div className="bg-300 border-round-xl" style={{ width: '6px', height: '4px' }}></div>
                  <div className="bg-300 border-round-xl" style={{ width: '6px', height: '4px' }}></div>
                </div>
              </div>

            </div>
          </div>

          {/* Panel Kanan (Form Login) */}
          <div className={`w-full md:w-6 flex flex-column justify-content-center align-items-center relative ${layout.leftPanelPadding}`}>

            {/* Form Body */}
            <div className="w-full" style={{ maxWidth: '380px' }}>
              <div className={`flex flex-column align-items-center relative w-full py-2 ${layout.headerMargin}`}>
                {/* Background Grid */}
                <div className="absolute w-full" style={{ height: '80px', top: '0', zIndex: 0, pointerEvents: 'none' }}>
                  <div
                    className="absolute"
                    style={{
                      width: '120px',
                      height: '80px',
                      right: 'calc(50% + 30px)',
                      backgroundImage: 'linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)',
                      backgroundSize: '15px 15px',
                      opacity: 0.5,
                      maskImage: 'radial-gradient(ellipse at right, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 100%)',
                      WebkitMaskImage: 'radial-gradient(ellipse at right, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 100%)'
                    }}
                  />
                  <div
                    className="absolute"
                    style={{
                      width: '120px',
                      height: '80px',
                      left: 'calc(50% + 30px)',
                      backgroundImage: 'linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)',
                      backgroundSize: '15px 15px',
                      opacity: 0.5,
                      maskImage: 'radial-gradient(ellipse at left, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 100%)',
                      WebkitMaskImage: 'radial-gradient(ellipse at left, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 100%)'
                    }}
                  />
                </div>

                {/* Wadah Logo Utama */}
                <div
                  className="flex align-items-center justify-content-center mb-2 z-1"
                  style={{
                    width: isShortScreen ? '46px' : '54px',
                    height: isShortScreen ? '46px' : '54px',
                    position: 'relative'
                  }}
                >
                  <Image
                    src="/layout/images/logo.png"
                    alt="Microva Logo"
                    width={isShortScreen ? 46 : 54}
                    height={isShortScreen ? 46 : 54}
                    className="object-contain"
                    priority
                  />
                </div>

                <h2 className={`${isShortScreen ? 'text-xl' : 'text-2xl'} font-bold text-900 m-0 mb-1 z-1`}>Selamat Datang</h2>
                <p className="text-500 m-0 text-center text-xs z-1">Silakan masuk ke akun Anda</p>
              </div>

              <form onSubmit={formik.handleSubmit}>
                {/* Input Username */}
                <div className={`field ${layout.fieldMargin}`}>
                  <label htmlFor="username" className="block text-700 font-semibold mb-1 text-xs">
                    Email / Username
                  </label>
                  <div className="relative w-full flex align-items-center">
                    <i className="pi pi-user text-400 z-2 absolute" style={{ left: '1rem', fontSize: '1rem' }} />
                    <InputText
                      id="username"
                      disabled={state.load || state.googleLoad}
                      className={`w-full border-round-lg text-sm surface-border ${formik.errors.username && formik.touched.username ? 'p-invalid' : ''}`}
                      style={{ paddingLeft: '3rem', paddingBlock: isShortScreen ? '0.65rem' : '0.85rem' }}
                      placeholder="Masukkan username Anda"
                      value={formik.values.username}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </div>
                  {formik.errors.username && formik.touched.username && (
                    <small className="p-error block text-xs mt-1">{formik.errors.username}</small>
                  )}
                </div>

                {/* Input Password */}
                <div className={`field ${layout.fieldMargin}`}>
                  <label htmlFor="password" className="block text-700 font-semibold mb-1 text-xs">
                    Password
                  </label>
                  <div className="relative w-full flex align-items-center">
                    <i className="pi pi-key text-400 z-2 absolute" style={{ left: '1rem', fontSize: '1rem' }} />
                    <InputText
                      id="password"
                      disabled={state.load || state.googleLoad}
                      type={showPassword ? 'text' : 'password'}
                      className={`w-full border-round-lg text-sm surface-border ${formik.errors.password && formik.touched.password ? 'p-invalid' : ''}`}
                      style={{ paddingLeft: '3rem', paddingRight: '3rem', paddingBlock: isShortScreen ? '0.65rem' : '0.85rem' }}
                      placeholder="Masukkan password Anda"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    <i
                      className={`pi ${showPassword ? 'pi-eye-slash' : 'pi-eye'} text-500 cursor-pointer z-2 absolute`}
                      style={{ right: '1rem' }}
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  </div>
                  {formik.errors.password && formik.touched.password && (
                    <small className="p-error block text-xs mt-1">{formik.errors.password}</small>
                  )}
                </div>

                {/* Remember Me & Lupa Password */}
                <div className="flex align-items-center justify-content-between mb-3">
                  <div className="flex align-items-center">
                    <Checkbox
                      inputId="remember_me"
                      disabled={state.load || state.googleLoad}
                      checked={!!formik.values.remember_me}
                      onChange={(e) => formik.setFieldValue('remember_me', e.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="remember_me" className="text-xs text-600 cursor-pointer select-none">
                      Ingat Saya
                    </label>
                  </div>
                  <a href="/auth/reset_password" className="text-xs text-green-600 no-underline font-semibold hover:underline">
                    Lupa password?
                  </a>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-column gap-2">
                  <Button
                    loading={state.load}
                    disabled={state.googleLoad}
                    type="submit"
                    label="Masuk"
                    className="w-full text-sm border-round-lg bg-green-600 border-none hover:bg-green-700 transition-colors"
                    style={{ paddingBlock: isShortScreen ? '0.65rem' : '0.85rem' }}
                  />

                  {/* <div className="flex align-items-center my-1">
                    <div className="border-top-1 border-200 w-full"></div>
                    <span className="px-2 text-400 text-xs font-semibold">ATAU</span>
                    <div className="border-top-1 border-200 w-full"></div>
                  </div> */}

                  {/* <Button
                    loading={state.googleLoad}
                    disabled={state.load}
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full text-sm border-round-lg bg-white text-700 border-300 hover:bg-gray-50 transition-all flex justify-content-center align-items-center gap-2"
                    style={{ paddingBlock: isShortScreen ? '0.65rem' : '0.85rem' }}
                  >
                    <i className="pi pi-google text-red-500 text-base"></i>
                    <span>Lanjutkan dengan Google</span>
                  </Button> */}

                  {/* <div className="text-center mt-2">
                    <span className="text-500 text-xs">Belum memiliki akun? </span>
                    <button
                      type="button"
                      disabled={state.load || state.googleLoad}
                      onClick={() => router.push("/auth/register")}
                      className="bg-transparent border-none text-green-600 font-bold text-xs cursor-pointer p-0 hover:underline inline-flex align-items-center gap-1 transition-all"
                    >
                      Daftar Sekarang <i className="pi pi-arrow-right text-100" style={{ fontSize: '0.65rem' }}></i>
                    </button>
                  </div> */}
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default LoginPage;