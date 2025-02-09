import time
from db import db
from models import ReportStatus


class ReportStatusDAO:
    @classmethod
    def query_report_status(cls, id):
        attempts = 0
        while attempts < 3:
            try:
                result = db.session.execute(
                    db.select(ReportStatus)
                    .distinct(ReportStatus.id)
                    .filter(ReportStatus.id == id)
                ).first()
                return result.ReportStatus.status if result else None
            except Exception as e:
                attempts += 1
                if attempts < 3:
                    time.sleep(5)
                else:
                    print("Failed to query report status after 3 attempts")
                    return "failed"

    @classmethod
    def insert_report_status(cls, report_status):
        attempts = 0
        while attempts < 3:
            try:
                new = ReportStatus(
                    id=report_status['id'], status=report_status['status'])
                db.session.add(new)
                db.session.commit()
                return
            except Exception as e:
                db.session.rollback()
                attempts += 1
                if attempts < 3:
                    time.sleep(5)
                else:
                    print("Failed to insert report status after 3 attempts")

    @classmethod
    def update_report_status(cls, report_status):
        attempts = 0
        while attempts < 3:
            try:
                status = db.session.execute(
                    db.select(ReportStatus)
                    .distinct(ReportStatus.id)
                    .filter(ReportStatus.id == report_status['id'])
                ).first()
                if status:
                    status.ReportStatus.status = report_status['status']
                    db.session.commit()
                else:
                    print(
                        f"No report status found with ID {report_status['id']}")
                return
            except Exception as e:
                print(
                    f"Attempt {attempts + 1}: Error updating report status: {e}")
                db.session.rollback()
                attempts += 1
                if attempts < 3:
                    time.sleep(5)
                else:
                    print("Failed to update report status after 3 attempts")
