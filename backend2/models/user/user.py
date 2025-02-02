"""
Defines the User model for the database.
"""

from sqlalchemy.sql import func
from sqlalchemy import Boolean
from db import db

class User(db.Model):
    """
    User model representing application users.
    """
    __tablename__ = "users"


    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String, unique=True, nullable=False)
    preference_auto_update_panel_items = db.Column(Boolean, nullable=True, default = True)
    preference_auto_download_pdf_report_copy = db.Column(Boolean, nullable=True, default = False)
    created_at = db.Column(db.DateTime, nullable=False, default=func.now())

    def to_dict(self):
        """
        Convert the model instance to a dictionary.
        """
        return {
            "id": self.id,
            "username": self.username,
            "preference_auto_update_panel_items": self.preference_auto_update_panel_items,
            "preference_auto_download_pdf_report_copy": self.preference_auto_download_pdf_report_copy,
            "created_at": self.created_at,
        }
