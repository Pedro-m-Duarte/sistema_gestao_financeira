from flask import request, jsonify
from flask_restx import Namespace, Resource
from db import db
from models.report.report import Report
from utils.reporter_utils import generate_report, export_report_as_raw_file, send_report_to_email
from sqlalchemy import desc, or_

report_ns = Namespace("reports", description="Report Operations")

@report_ns.route("/generate")
class GenerateReport(Resource):
    def post(self):
        data = request.json
        sID = data.get("sID")
        server = data.get("server")
        time_period = data.get("timePeriod")
        custom_date_start = data.get("customDateStart")
        custom_date_end = data.get("customDateEnd")
        is_auto_generate_comments = data.get("isToAutoGenerateComments", False)

        if not sID or not server or not time_period:
            return jsonify({"success": False, "errorId": -2, "error": "Parâmetros de solicitação inválidos."}), 200

        findU = db.session.query(SessionData).filter_by(sID=sID).first()
        if not findU or not findU.user.userId:
            return jsonify({"success": False, "errorId": -2, "error": "Sessão inválida informada."}), 200

        user_reports = Report.query.filter_by(userId=findU.user.userId).order_by(desc("createdAt")).all()

        if len(user_reports) >= 10:
            reports_to_delete = user_reports[9:]
            Report.query.filter(Report.id.in_([r.id for r in reports_to_delete])).delete(synchronize_session=False)
            db.session.commit()

        report = generate_report(
            findU.user.savedAuth, findU.user.userId, server, time_period, custom_date_start,
            custom_date_end, is_auto_generate_comments
        )
        return jsonify({"success": True, "message": f"Relatório gerado com o ID #{report.id}.", "generatedReport": report.to_dict()})

@report_ns.route("/history")
class ReportHistory(Resource):
    def get(self):
        sID = request.args.get("sID")
        server = request.args.get("server")

        if not sID or not server:
            return jsonify({"success": False, "errorId": -2, "error": "Parâmetros de solicitação inválidos."}), 200

        findU = db.session.query(SessionData).filter_by(sID=sID).first()
        if not findU or not findU.user.userId:
            return jsonify({"success": False, "errorId": -2, "error": "Sessão inválida informada."}), 200

        where_condition = {"serverId": int(server)}
        if findU.user.isZabbixAdmin:
            where_condition["userId"] = or_(int(findU.user.userId), None)
        else:
            where_condition["userId"] = int(findU.user.userId)

        reports = Report.query.filter_by(**where_condition).all()
        data = [{"id": r.id, **r.to_dict()} for r in reports]
        return jsonify({"success": True, "reports": data})

@report_ns.route("/export")
class ExportReport(Resource):
    def post(self):
        data = request.json
        sID = data.get("sID")
        re = data.get("re")
        re_conclusion = data.get("reConclusion")

        if not sID or not re or not re_conclusion:
            return jsonify({"success": False, "error": "Parâmetros de solicitação inválidos."}), 200

        findU = db.session.query(SessionData).filter_by(sID=sID).first()
        if not findU or not findU.user.userId:
            return jsonify({"success": False, "errorId": -2, "error": "Sessão inválida informada."}), 200

        pdf_raw = export_report_as_raw_file(re, re_conclusion, findU.user.savedAuth)
        return pdf_raw

@report_ns.route("/sendtoemail")
class SendReportEmail(Resource):
    def post(self):
        data = request.json
        sID = data.get("sID")
        re = data.get("re")
        re_conclusion = data.get("reConclusion")
        emails = data.get("emails")

        if not sID or not re or not re_conclusion or not emails:
            return jsonify({"success": False, "error": "Parâmetros de solicitação inválidos."}), 200

        findU = db.session.query(SessionData).filter_by(sID=sID).first()
        if not findU or not findU.user.userId:
            return jsonify({"success": False, "errorId": -2, "error": "Sessão inválida informada."}), 200

        pdf_raw = export_report_as_raw_file(re, re_conclusion, findU.user.savedAuth)
        success = send_report_to_email(emails, re, pdf_raw, findU.user.savedAuth)
        if not success:
            return jsonify({"success": False, "error": "Erro ao enviar o relatório por email."}), 200

        return jsonify({"success": True, "message": f"Relatório enviado com sucesso para {', '.join(emails)}.", "reportId": re.id, "reportPDFBase64": pdf_raw.encode("base64")})
