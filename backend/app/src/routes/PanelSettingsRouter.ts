import { Request, Response, Router } from "express";
import { sequelizeStore } from "../../server";
import { SessionData } from "express-session";
import PanelSettings from "../db/models/PanelSettings";
import { PanelSettingType } from "../utils/PanelSettingsAdapter";

export default Router()
    .post("/update", async (req: Request, res: Response) => {
        const { sID, setting, value } = req.body;

        if (!sID || !setting || value === undefined) return res.status(200).json({
            success: false,
            errorId: -2,
            error: "Parâmetros de solicitação inválidos."
        });

        const findU: SessionData = await new Promise((resolve, reject) => {
            sequelizeStore.get(String(sID), (err, session) => {
                if (err) reject(err)
                resolve(session)
            })
        })

        if (!findU || !findU.user.userId) return res.status(200).json({
            success: false,
            errorId: -2,
            error: "Sessão inválida informada."
        });

        try {
            if (!findU.user.isZabbixAdmin) return res.status(200).json({
                success: false,
                error: "O usuário associado a esta sessão não tem permissão para alterar uma configuração do Painel Titan."
            });

            const settingData = await PanelSettings.findOne({
                where: {
                    setting: Object.keys(PanelSettingType).find(key => key === setting)
                }
            });

            const updatedSettingData = await settingData.update({
                value: JSON.stringify(value)
            })

            return res.json({
                success: true,
                message: "Configuração do Painel Titan atualizada.",
                newValue: JSON.parse(updatedSettingData.value),
            });
        } catch (err) {
            console.log(err);
            return res.status(200).json({
                success: false,
                errorId: -2,
                error: "Um erro interno no Backend ocorreu ao atualizar uma configuração do Painel Titan."
            });
        }
    })
    .get("/get", async (req: Request, res: Response) => {
        const { sID, setting } = req.query

        if (!sID || !setting) return res.status(200).json({
            success: false,
            errorId: -2,
            error: "Parâmetros de solicitação inválidos."
        })

        const findU: SessionData = await new Promise((resolve, reject) => {
            sequelizeStore.get(String(sID), (err, session) => {
                if (err) reject(err)
                resolve(session)
            })
        })

        if (!findU || !findU.user.userId) return res.status(200).json({
            success: false,
            errorId: -2,
            error: "Sessão inválida informada."
        });

        try {
            const settingData = await PanelSettings.findOne({
                where: {
                    setting: Object.keys(PanelSettingType).find(key => key === setting)
                }
            });

            if (!settingData) return res.status(200).json({
                success: false,
                error: "Não foi possível encontrar dados para esta configuração do painel."
            });
            
            return res.json({
                success: true,
                value: JSON.parse(settingData.value)
            });
        } catch (err) {
            console.log(err);
            return res.status(200).json({
                success: false,
                errorId: -2,
                error: "Um erro interno no Backend ocorreu ao buscar os dados para essa configuração do painel."
            });
        }
    });