/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file page.tsx
 * @description File induk dari page users
 * 
 * @author Fadil <risqullah.s.fadhilah@gmail.com>
 * @created 2026-07-14
 * 
 * @contributors
 * - Fadil <risqullah.s.fadhilah@gmail.com>
 * 
 * @lastModified Fadil (2026-08-03)
 * @version 1.0.1
 */


'use client'
import postData from "@/lib/axios/postData";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { showError, showSuccess } from "@/lib/tools/generalTools";
import { useFormik } from "formik";
import { initValue, NavState, State } from "./components/interfaces";
import Table from "./components/display/table";
import { FilterMatchMode } from "primereact/api";
import Form from "./components/display/form";
import { useSession } from "next-auth/react";
import { DataRekap } from "@/types/print-tools";
import Print from "./components/display/print";
import { apiEndpointGetNavDataEdit, apiEndpointUpdateNav } from "./components/endpoints";
import NavForm from "./components/display/navbar";

const Page = () => {
    const toast = useRef<Toast>(null)
    const { data: session } = useSession()

    const [state, setState] = useState<State>({
        load: false,
        data: [],
        add: false,
        edit: false,
        delete: false,
        selectedData: [],
        searchVal: '',
        filters: {
            global: { value: null, matchMode: FilterMatchMode.CONTAINS },
            status: { value: null, matchMode: FilterMatchMode.EQUALS },
            role: { value: null, matchMode: FilterMatchMode.EQUALS },
        },
        session: null,
        submittedData: null,
    })

    const [dataRekap, setDataRekap] = useState<DataRekap>({
        data: {},
        totalData: 0,
        head: [],
        load: false,
        columnStyles: {},
        show: false,
        adjust: false,
        fileName: `laporan-user-${new Date().toISOString().slice(0, 10)}`,
        judul1: 'Laporan USER',
        judul2: ''
    });

    const [navBar, setNavBar] = useState<NavState>({
        data: [],
        menu: [],
        user_code: "",
        load: false,
        show: false,
    })

    const formik = useFormik({
        initialValues: {
            user_code: '',
            fullname: '',
            username: '',
            password: '',
            telp: '',
            status: '0',
            role: 'employee',
        },
        validate: (data: initValue) => {
            let errors = {} as initValue;
            // Validasi name
            if (!data.fullname) {
                errors.fullname = 'Nama wajib diisi';
            } else if (data.fullname.length < 3) {
                errors.fullname = 'Nama harus terdiri dari minimal 3 karakter';
            } else if (!/^[a-zA-Z\s]+$/.test(data.fullname)) {
                errors.fullname = 'Nama hanya boleh berisi huruf dan spasi';
            }

            // Validasi username
            if (!data.username) {
                errors.username = 'Username wajib diisi';
            }

            // Validasi password
            if (!data.password && !state.edit) {
                errors.password = 'Password wajib diisi';
            }

            if (data.password) {
                if (data.password.length < 8) {
                    errors.password = 'Password harus terdiri dari minimal 8 karakter';
                } else if (!/[A-Z]/.test(data.password)) {
                    errors.password = 'Password harus mengandung huruf besar';
                } else if (!/[a-z]/.test(data.password)) {
                    errors.password = 'Password harus mengandung huruf kecil';
                } else if (!/[0-9]/.test(data.password)) {
                    errors.password = 'Password harus mengandung angka';
                } else if (!/[\W_]/.test(data.password)) {
                    errors.password = 'Password harus mengandung simbol';
                }
            }

            // Validasi no_hp
            if (!data.telp) {
                errors.telp = 'Nomor HP wajib diisi';
            } else if (!/^(08|(\+62))\d{8,13}$/.test(data.telp)) {
                errors.telp = 'Nomor HP harus dimulai dengan 08 dan panjang 9-13 digit';
            }

            console.log(errors)
            return errors;
        },
        onSubmit: (data) => {
            setState(p => ({ ...p, submittedData: data }));
        },
    });


    const getData = async (apiEndpoint: string) => {
        setState((p) => ({ ...p, load: true }));
        try {
            const res = await postData(apiEndpoint, {
                status: state.filters.status.value,
                role: state.filters.role.value,
                search: state.filters.global.value,
                first: state.first,
                page: state.page,
                rows: state.rows,
            });
            setState((p) => ({
                ...p,
                data: res.data.data
            }));

        } catch (error: any) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setState((p) => ({ ...p, load: false }));
        }
    }

    const getNav = async (user_code: string) => {
        setNavBar((p) => ({ ...p, load: true }));

        try {
            const headers = {
                'X-Level': '1',
            };
            const vaData = await postData(apiEndpointGetNavDataEdit, { user_code: user_code }, headers);
            let res = vaData.data;
            console.log(res);
            setNavBar((p) => ({
                ...p,
                data: JSON.parse(JSON.stringify(res.data)),
                menu: JSON.parse(JSON.stringify(res.menu)),
                user_code,
                show: true
            }));
        } catch (error: any) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setNavBar((p) => ({ ...p, load: false }));
        }
    };

    const handleSaveNavbar = async () => {
        setNavBar((p) => ({ ...p, load: true }));

        try {
            console.log(navBar.menu)
            const res = await postData(
                apiEndpointUpdateNav,
                {
                    user_code: navBar.user_code,
                    menu: JSON.stringify(navBar.menu),
                },

            );
            showSuccess(toast, res.data.message);
            setNavBar((p) => ({ ...p, show: false, }));
        } catch (error: any) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setNavBar((p) => ({ ...p, load: false }));
        }
    }


    useEffect(() => {
        if (session) {
            setState((prev) => ({
                ...prev,
                session: session
            }));
        }
    }, [session]);



    return <>
        <div className="p-4">
            <Toast ref={toast} position="top-right" />

            {/* <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls"
                onChange={handleImport}
                style={{ display: "none" }}
            /> */}


            <Table getNav={getNav} dataRekap={dataRekap} setDataRekap={setDataRekap} state={state} toast={toast} setState={setState} formik={formik} getData={getData} />
            <Print dataRekap={dataRekap} setDataRekap={setDataRekap} state={state} toast={toast} setState={setState} formik={formik} getData={getData} />
            <NavForm navBar={navBar} setNavBar={setNavBar} handleSaveNavbar={handleSaveNavbar} />

        </div>
    </>
}

export default Page