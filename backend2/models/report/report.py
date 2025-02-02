from sqlalchemy.sql import func
from sqlalchemy import  ForeignKey, BigInteger, Text
from sqlalchemy.orm import relationship
from db import db

class Report(db.Model):
    """
    Report model representing generated reports.
    """
    __tablename__ = "reports"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    server_id = db.Column(db.Integer, nullable=False)
    generated_at = db.Column(BigInteger, nullable=False)
    generated_time_period = db.Column(Text, nullable=False)
    data = db.Column(Text, nullable=False)
    user_id = db.Column(db.Integer, ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=func.now())

    # Relationship to User
    user = relationship("User", back_populates="reports")

    def to_dict(self):
        """
        Convert the model instance to a dictionary.
        """
        return {
            "id": self.id,
            "server_id": self.server_id,
            "generated_at": self.generated_at,
            "generated_time_period": self.generated_time_period,
            "data": self.data,
            "user_id": self.user_id,
            "created_at": self.created_at,
        }

