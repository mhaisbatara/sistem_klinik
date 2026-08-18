/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file page.tsx
 * @description File untuk helper server tools
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

'use server'

import axios from "axios";
import { destroyCookie } from 'nookies'
import { signOut } from 'next-auth/react';
import { parse } from 'date-fns';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { findToValuesRecursive } from "./generalTools";
import NextAuth from 'next-auth';
import { auth } from "./authTools";
import { cookies } from "next/headers";
import { formatDateISO } from "./dateTools";

let isLoggingOut = false;

const logout = async (
    context: any = null,
    redirectToLogin: boolean = true
) => {
    if (isLoggingOut) return;
    isLoggingOut = true;

    const cookieNames = ["_A2R", "_A2F"];
    cookieNames.forEach((name) => {
        destroyCookie(context, name, { path: "/" });
    });

    if (typeof window !== "undefined") {
        if (redirectToLogin) {
            const base = window.location.origin;
            await signOut({ callbackUrl: `${base}/auth/login` });
        }
        return;
    }
    return;
};

export default logout;


const routeMiddleware = async (searchUrl: string) => {
    const session = await auth();

    if (!session?.user) {
        return '99';
    }

    if (session.expires) {
        const dSessionExp = new Date(session.expires);
        const dNow = new Date();

        if (!isNaN(dSessionExp.getTime()) && (dNow.getTime() > dSessionExp.getTime())) {
            return '99';
        }
    }

    if (session.user.user_code) {
        try {
            const baseApi = (process.env.API_URL || 'http://localhost:8000').replace(/\/+$/, '');
            const url = baseApi.endsWith('/api/v1') ? `${baseApi}/setup/nav/user-data` : `${baseApi}/api/v1/setup/nav/user-data`;

            const resp = await axios.post(
                url,
                { user_code: session.user.user_code },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Timestamp': formatDateISO(new Date()),
                        'Authorization': `Bearer ${session.access_token}`
                    }
                }
            );

            const menu = resp.data?.data;

            let urlFix = searchUrl;
            if (searchUrl.length > 1) {
                urlFix = searchUrl.replace(new RegExp(/\/$/), '');
            }

            const res = findToValuesRecursive(menu, urlFix);

            if (res.length < 1) {
                return '98';
            }
        } catch (error: any) {
            if (error?.response?.status === 401) {
                return '99';
            }
            console.error("routeMiddleware navigation check error:", error?.message);
        }
    } else {
        return '99';
    }

    return '00';
}

const refreshToken = async (userCode: string, refreshToken: string, rememberMe: string) => {
    const timestamp = formatDateISO(new Date());

    const credentialPayload = {
        user_code: userCode,
        refresh_token: refreshToken,
        remember_me: rememberMe,
    };

    const encryptedBody = credentialPayload;

    const baseApi = (process.env.API_URL || 'http://localhost:8000').replace(/\/+$/, '');
    const url = baseApi.endsWith('/api/v1') ? `${baseApi}/auth/refresh-token` : `${baseApi}/api/v1/auth/refresh-token`;

    const refreshResponse = await axios.post(
        url,
        encryptedBody,
        {
            headers: {
                'X-Timestamp': timestamp,
                'Content-Type': 'application/json',
            }
        }
    );

    return refreshResponse.data.data;
}

const clearSessionCookies = async () => {
    try {
        const cookieStore = await cookies();
        const isProd = process.env.NODE_ENV === 'production';

        const sessionCookieName = isProd
            ? '__Secure-next-auth.session-token'
            : 'next-auth.session-token';

        const csrfCookieName = isProd
            ? '__Host-next-auth.csrf-token'
            : 'next-auth.csrf-token';

        const callbackCookieName = isProd
            ? '__Secure-next-auth.callback-url'
            : 'next-auth.callback-url';

        cookieStore.delete(sessionCookieName);
        cookieStore.delete(csrfCookieName);
        cookieStore.delete(callbackCookieName);
    } catch (cookieError) {
        console.error("Gagal menghapus cookies:", cookieError);
    }
}

export { logout, routeMiddleware, refreshToken, clearSessionCookies };