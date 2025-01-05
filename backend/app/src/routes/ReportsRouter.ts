import { Request, Response, Router } from "express";
import { SessionData } from "express-session";
import { sequelizeStore } from "../../server";
import Report from "../db/models/Reports";
import { ServerReport, exportReportAsRawFile, generateReport, sendReportToEmail } from "../utils/ReporterUtils";
import { Op } from "sequelize";

export default Router()
    .post("/generate", async (req: Request, res: Response) => {
        const { sID, server, timePeriod, customDateStart, customDateEnd, isToAutoGenerateComments } = req.body;

        if (!sID || !server || !timePeriod
            // !customDateStart || !customDateEnd || // Esses são opcionais
            // !isToAutoGenerateComments // Pode vir null quando for desativado, e depois null é considerado falso abaixo
        ) {
            return res.status(200).json({
                success: false,
                errorId: -2,
                error: "Parâmetros de solicitação inválidos."
            });
        };

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

            try {
                const userReports = await Report.findAll({
                    where: {
                        userId: findU.user.userId,
                    },
                    order: [["createdAt", "DESC"]],
                });

                // Mantém o usuário sempre com os 10 relatórios mais rencentes
                // e apaga os mais antigos a partir do 11o caso exista
                if (userReports.length >= 10) {
                    const reportsToDelete = userReports.slice(9); // Pega os relatórios mais antigos
                    await Report.destroy({
                        where: {
                            id: reportsToDelete.map(report => report.id),
                        },
                    });
                }

                const report = await generateReport(
                    findU.user.savedAuth, findU.user.userId, server, timePeriod, customDateStart,
                    customDateEnd, (isToAutoGenerateComments ? isToAutoGenerateComments : false)
                );
                return res.json({
                    success: true,
                    message: `Relatório gerado com o ID #${report.id}.`,
                    generatedReport: report
                })
            } catch (err) {
                console.log(err);
                return res.status(200).json({
                    success: false,
                    error: "Um erro interno no Backend ocorreu ao gerar este relatório."
                });
            }
        } catch (err) {
            return res.status(200).json({
                success: false,
                errorId: -2,
                error: "Não foi possível validar a sessão informada."
            });
        }
    })
    .get("/history", async (req: Request, res: Response) => {
        const { sID, server } = req.query

        if (!sID || !server) return res.status(200).json({
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

        let whereCondition = {
            serverId: Number(server)
        };
        // Se o usuário for administrador do Zabbix, incluir também relatórios com userId null
        if (findU.user.isZabbixAdmin) {
            whereCondition[Op.or] = [
                { userId: Number(findU.user.userId) },
                { userId: null }
            ];
        } else {
            whereCondition["userId"] = Number(findU.user.userId)
        }
        const reports = await Report.findAll({
            where: whereCondition
        });
        const data = reports.map((report) => {
            return {
                id: report.id,
                ...JSON.parse(report.data)
            }
        });

        res.json({
            success: true,
            reports: data
        });
    })
    .post("/export", async (req: Request, res: Response) => {
        const { sID, re, reConclusion } = req.body;

        if (!sID || !re || !reConclusion) return res.status(200).json({
            success: false,
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
            const report = re as unknown as ServerReport
            const pdfRaw = await exportReportAsRawFile(report, reConclusion, findU.user.savedAuth);
            return res.send(Buffer.from(pdfRaw));
        } catch (err) {
            console.log(err);
            return res.status(200).json({
                success: false,
                errorId: -2,
                error: "Um erro interno no Backend ocorreu ao gerar este relatório ou ao exportá-lo como PDF."
            });
        }
    })
    .post("/sendtoemail", async (req: Request, res: Response) => {
        const { sID, re, reConclusion, emails } = req.body;

        if (!sID || !re || !reConclusion || !emails) return res.status(200).json({
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
            const report = re as unknown as ServerReport
            const pdfRaw = await exportReportAsRawFile(report, reConclusion, findU.user.savedAuth);

            const pdfFile = Buffer.from(pdfRaw);
            const success = await sendReportToEmail(emails as string[], report, pdfFile, findU.user.savedAuth);
            if (!success) throw Error("Cannot send email to the given email address.");

            return res.json({
                success: true,
                message: `Relatório enviado com sucesso para o(s) email(s) ${emails.join(', ')}.`,
                reportId: report.id,
                reportPDFBase64: pdfFile.toString('base64')
            });
        } catch (err) {
            console.log(err);
            return res.status(200).json({
                success: false,
                errorId: -2,
                error: "Um erro interno no Backend ocorreu ao exportar o relatório com PDF ou ao enviá-lo para o(s) email(s) informado(s)."
            });
        }
    })