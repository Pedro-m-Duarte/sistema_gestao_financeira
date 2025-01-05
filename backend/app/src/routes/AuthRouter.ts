import axios from "axios";
import { Request, Response, Router } from "express";
import { SessionData } from "express-session";
import { sequelizeStore, zabbixApiUrl } from "../../server";
import User from "../db/models/User";
import { isNotAuth } from "../middlewares/Authenticated";

export default Router()
    .post("/login", isNotAuth, async (req: Request, res: Response) => {
        const { user, password } = req.body;

        if (!user || !password) return res.status(200).json({
            success: false,
            error: "Parâmetros de solicitação inválidos."
        });

        const zabbixAuthResponse = await axios.post(zabbixApiUrl, {
            jsonrpc: "2.0",
            method: "user.login",
            params: {
                user: user,
                password: password,
                userData: true
            },
            id: 1,
            auth: null
        });
        const zabbixAuthResponseData = zabbixAuthResponse.data;

        if (!zabbixAuthResponseData.result) {
            if (zabbixAuthResponseData.error.code == -32602) return res.status(200).json({
                success: false,
                error: "O usuário informado não existe.",
                zabbixErrorCode: zabbixAuthResponseData.error.code
            });
            if (zabbixAuthResponseData.error.code == -32500) return res.status(200).json({
                success: false,
                error: `Senha incorreta para o usuário ${user}.`,
                zabbixErrorCode: zabbixAuthResponseData.error.code
            });

            return res.status(200).json({
                success: false,
                error: "Erro interno da API do Zabbix.",
                zabbixErrorCode: zabbixAuthResponseData.error.code
            });
        }

        const findDBUser = await User.findOrCreate({
            where: {
                username: user
            },
            defaults: {
                username: user,
                preferenceAutoUpdatePanelItems: '60', // Padrão é a cada 60s (1min)
                preferenceAutoDownloadPDFReportCopy: 'ask' // Padrão é 'ask'
            }
        });
        const dbUser = findDBUser[0];

        req.session.user = {
            userId: dbUser.id,
            username: user,
            savedAuth: zabbixAuthResponseData.result.sessionid,
            isZabbixAdmin: zabbixAuthResponseData.result.roleid === '3'
        }
 
        res.json({
            success: true,
            message: `Logado com sucesso. Auth do Zabbix: ${zabbixAuthResponseData.result.sessionid}.`,
            data: {
                SID: req.session.id,
                sessionid: req.session.user.savedAuth,
                username: user,
                isZabbixAdmin: req.session.user.isZabbixAdmin
            }
        })
    })
    .post("/logout", async (req: Request, res: Response) => {
        const { sID } = req.body;

        if (!sID) return res.status(200).json({
            success: false,
            errorId: -2,
            error: "Parâmetros de solicitação inválidos."
        });

        const findU: SessionData = await new Promise((resolve, reject) => {
            sequelizeStore.get(String(sID), (err, session) => {
                if (err) reject(err)
                resolve(session)
            })
        });

        if (!findU || !findU.user.userId) return res.status(200).json({
            success: false,
            errorId: -2,
            error: "Sessão inválida informada."
        });

        const savedAuth = findU.user.savedAuth;
        const logoutResponse = await axios.post(zabbixApiUrl, {
            jsonrpc: "2.0",
            method: "user.logout",
            params: [],
            id: 1,
            auth: savedAuth
        });

        if (!logoutResponse.data.result) return res.status(200).json({
            success: false,
            error: "Erro interno da API do Zabbix."
        });

        req.session.user = null;
        req.session.destroy(() => { });

        res.json({
            success: true,
            message: `Deslogado com sucesso. Auth do Zabbix: ${savedAuth}.`
        });
    })
    .get("/validade", async (req: Request, res: Response) => {
        const { sID } = req.query;

        if (!sID) return res.status(200).json({
            success: false,
            errorId: -2,
            error: "Parâmetros de solicitação inválidos."
        });

        const findU: SessionData = await new Promise((resolve, reject) => {
            sequelizeStore.get(String(sID), (err, session) => {
                if (err) reject(err)
                resolve(session)
            })
        });

        if (!findU || !findU.user.userId) {
            // req.session.user = null;
            await req.session.destroy(() => { }); // Logout forçado
            return res.json({
                valid: false,
                message: "Sessão inválida informada. Sessão destruída."
            });
        }

        res.json({
            valid: true,
            SID: req.session.id
        });
    })