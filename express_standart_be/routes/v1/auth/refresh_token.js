/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file page.tsx
 * @description File untuk get token ulang jika ada token yang anomali tpi sesi masih jalan
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

import express from "express";
import Joi from "joi";
import { formatDateSystem } from "../components/tools/date_tools.js";
import { generateUserTokens, Logging, validatePayload } from "../components/tools/servertool.js";
import DB from "../../../core/config/knex.js";
import { status } from "../components/tools/general.js";

const router = express.Router();

router.post("/", async (req, res) => {
    const oPayload = req.body

    try {

        const cValidation = await validatePayload(
            {
                user_code: Joi.string().required().label("User Code"),
                refresh_token: Joi.string().required().label("Refresh Token"),
                remember_me: Joi.alternatives().try(
                    Joi.string().valid('1', '0', 'true', 'false'),
                    Joi.boolean()
                ).required().label("Remember me")
            },
            { "any.required": "{#label} wajib diisi" },
            oPayload
        );

        if (cValidation) {
            const oResult = {
                status: status.BAD_REQUEST,
                message: cValidation || "Terdapat kesalahan pada data anda",
                datetime: formatDateSystem(),
            };

            return res.status(422).json(oResult);
        }

        const storedToken = await DB("access_token")
            .where("user_code", oPayload.user_code)
            .andWhere("token", oPayload.refresh_token)
            .andWhere("expired", "0")
            .first();

        if (!storedToken) {
            return res.status(401).json({
                status: status.GAGAL,
                message: "Sesi telah berakhir sepenuhnya. Harap login kembali dengan password.",
                datetime: formatDateSystem()
            });
        }

        const oUser = await DB("user_credential")
            .where("user_code", oPayload.user_code)
            .select("user_code", "username", "role", "fullname", "status")
            .first();

        if (!oUser || oUser.status != "1") {
            await DB("access_token").where("user_code", oPayload.user_code).update({ expired: "1" });
            return res.status(403).json({
                status: status.GAGAL,
                message: "Akun Anda dinonaktifkan atau tidak ditemukan.",
                datetime: formatDateSystem()

            });
        }

        const oToken = await generateUserTokens(oUser, oPayload.remember_me == '1');

        return res.status(200).json({
            status: status.SUKSES,
            message: "Sesi berhasil diperpanjang",
            datetime: formatDateSystem(),
            data: {
                access_token: oToken.access_token,
                refresh_token: oToken.refresh_token
            }
        });

    } catch (error) {
        const oResult = {
            status: status.BAD_REQUEST,
            message: "Sistem sedang maintenance harap tunggu sebentar",
            datetime: formatDateSystem(),
        };

        Logging(error, {
            file: "v1/auth/refresh_token.js",
            func: "data",
            request: oPayload,
            response: oResult,
            user: oPayload?.username || "",
        });

        return res.status(500).json(oResult);
    }
});

export default router;