import { Request, Response, Router } from "express";
import { SessionData } from "express-session";
import { sequelizeStore } from "../../server";
import Layout from "../db/models/Layouts";

export default Router()
    .get("/list", async (req: Request, res: Response) => {
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

        if (!findU || !findU.user.userId) return res.status(200).json({
            success: false,
            errorId: -2,
            error: "Sessão inválida informada."
        });

        const layouts = await Layout.findAll({
            where: {
                userId: findU.user.userId
            }
        })

        const data = layouts.map((layout) => {
            // Layout #${layout.id}
            return {
                name: layout.name,
                ...JSON.parse(layout.data)
            }
        })

        res.json({
            success: true,
            layouts: data
        })
    })
    .post("/create", async (req: Request, res: Response) => {
        const { layout, sID, serverID, serverName, serverType, layoutCustomName } = req.body

        if (!layout || !sID || !serverID || !serverName || !serverType || !layoutCustomName) return res.status(200).json({
            success: false,
            errorId: -2,
            error: "Parâmetros de solicitação inválidos."
        });

        try {
            const findU: SessionData = await new Promise((resolve, reject) => {
                sequelizeStore.get(sID, (err, session) => {
                    if (err) reject(err)
                    resolve(session)
                })
            })

            if (!findU || !findU.user.userId) return res.status(200).json({
                success: false,
                errorId: -2,
                error: "Sessão inválida informada."
            });

            await Layout.create({
                name: layoutCustomName,
                userId: findU.user.userId,
                data: JSON.stringify({
                    layout,
                    serverID,
                    serverName,
                    serverType,
                    layoutCustomName
                })
            })

            const layouts = await Layout.findAll({
                where: {
                    userId: findU.user.userId
                }
            })

            const data = layouts.map((layout) => {
                // Layout #${layout.id}
                return {
                    name: layout.name,
                    ...JSON.parse(layout.data)
                }
            });

            return res.json({
                success: true,
                message: `Layout salvo com o ID #${layout.id}.`,
                layoutId: layout.id,
                layoutName: layoutCustomName,
                data
            })
        } catch (err) {
            return res.status(200).json({
                success: false,
                errorId: -2,
                error: "Sessão inválida informada."
            });
        }
    })
    .post("/delete", async (req: Request, res: Response) => {
        const { sID, layoutCustomName } = req.body

        if (!sID || !layoutCustomName) return res.status(200).json({
            success: false,
            errorId: -2,
            error: "Parâmetros de solicitação inválidos."
        });

        try {
            const findU: SessionData = await new Promise((resolve, reject) => {
                sequelizeStore.get(sID, (err, session) => {
                    if (err) reject(err)
                    resolve(session)
                })
            })

            if (!findU || !findU.user.userId) return res.status(200).json({
                success: false,
                errorId: -2,
                error: "Sessão inválida informada."
            });

            await Layout.destroy({
                where: {
                    name: layoutCustomName,
                    userId: findU.user.userId
                }
            })

            return res.json({
                success: true,
                message: "Layout deletado.",
                layoutName: layoutCustomName
            })
        } catch (err) {
            return res.status(200).json({
                success: false,
                errorId: -2,
                error: "Sessão inválida informada."
            });
        }
    })
    .post("/rename", async (req: Request, res: Response) => {
        const { sID, layoutName, newLayoutName } = req.body;

        if (!sID || !layoutName || !newLayoutName) return res.status(200).json({
            success: false,
            errorId: -2,
            error: "Parâmetros de solicitação inválidos."
        });

        try {
            const findU: SessionData = await new Promise((resolve, reject) => {
                sequelizeStore.get(sID, (err, session) => {
                    if (err) reject(err)
                    resolve(session)
                })
            })

            if (!findU || !findU.user.userId) return res.status(200).json({
                success: false,
                errorId: -2,
                error: "Sessão inválida informada."
            });

            const layout = await Layout.findOne({
                where: {
                    name: layoutName
                }
            });
            await layout.update({
                name: newLayoutName
            });

            const layouts = await Layout.findAll({
                where: {
                    userId: findU.user.userId
                }
            })

            const data = layouts.map((layout) => {
                // Layout #${layout.id}
                return {
                    name: layout.name,
                    ...JSON.parse(layout.data)
                }
            });

            return res.json({
                success: true,
                message: `O layout de ID #${layout.id} foi renomeado de '${layoutName}' para '${newLayoutName}'.`,
                layoutId: layout.id,
                oldLayoutName: layoutName,
                layoutName: newLayoutName,
                data
            })
        } catch (err) {
            return res.status(200).json({
                success: false,
                errorId: -2,
                error: "Sessão inválida informada."
            });
        }
    })
    