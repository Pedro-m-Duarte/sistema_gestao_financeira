import { Request, Response, Router } from "express";
import User from "../db/models/User";
import { sequelizeStore } from "../../server";
import { SessionData } from "express-session";
import { UserPreferences } from "../utils/BackendUtils";

export default Router()
    .post("/update", async (req: Request, res: Response) => {
        const { sID, prefs } = req.body;

        if (!sID || !prefs) return res.status(200).json({
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
            const newPreferences = prefs as UserPreferences;
            const user = await User.findOne({
                where: {
                    id: findU.user.userId
                }
            });
            await user.update({
                preferenceAutoUpdatePanelItems: newPreferences.autoUpdatePanelItems,
                preferenceAutoDownloadPDFReportCopy: newPreferences.autoDownloadPDFReportCopy
            })
            return res.json({
                success: true,
                message: "Preferências do usuário atualizadas.",
                prefs: newPreferences
            });
        } catch (err) {
            console.log(err);
            return res.status(200).json({
                success: false,
                errorId: -2,
                error: "Um erro interno no Backend ocorreu ao atualizar as preferências do usuário."
            });
        }
    })
    .get("/get", async (req: Request, res: Response) => {
        const { sID } = req.query

        if (!sID) return res.status(200).json({
            success: false,
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
            const user = await User.findOne({
                where: {
                    id: findU.user.userId
                }
            });
            return res.json({
                success: true,
                prefs: {
                    autoUpdatePanelItems: user.preferenceAutoUpdatePanelItems,
                    autoDownloadPDFReportCopy: user.preferenceAutoDownloadPDFReportCopy
                } as UserPreferences
            });
        } catch (err) {
            console.log(err);
            return res.status(200).json({
                success: false,
                errorId: -2,
                error: "Um erro interno no Backend ocorreu ao buscar as preferências do usuário."
            });
        }
    })
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const yourSchema = new Schema({
    name: String,
    age: Number
});
const YourModel = mongoose.model('YourModel', yourSchema);

mongoose.connect('mongodb://localhost/yourDatabase', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to database');
    // Busca todos os documentos
    YourModel.find({}, (err, docs) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Found documents:', docs);
        }
    });
}).catch(err => {
    console.error('Database connection error:', err);
});
