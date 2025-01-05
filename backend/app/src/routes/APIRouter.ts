import { Request, Response, Router } from "express";
import { compatibilityVersion } from "../../server";
import {  getPanelSettings } from "../utils/PanelSettingsAdapter";

export default Router()
    .get("/", (req: Request, res: Response) => {
        res.json({
            success: false,
            error: "Rota inválida."
        });
    })
    .get("/info", async (req: Request, res: Response) => {
        const settings = await getPanelSettings();
        const isDashAvailable = Boolean(settings.find(setting => setting.setting === "IsDashAvailable")!!.value);
        res.json({
            success: true,
            backendVersion: compatibilityVersion,
            isAvailable: isDashAvailable
        });
    })