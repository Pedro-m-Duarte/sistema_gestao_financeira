from sqlalchemy import Boolean
from sqlalchemy.orm import relationship
from db import db


class TemplateOrServer(db.Model):
    """
    TemplateOrServer model representing either a template or server configuration.
    """
    __tablename__ = "template_or_server"

    template_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    is_server = db.Column(Boolean, nullable=False)

    # Relationship to LayoutTable
    layout_tables = relationship("LayoutTable", back_populates="template_or_server", cascade="all, delete-orphan")

    def to_dict(self):
        """
        Convert the model instance to a dictionary.
        """
        return {
            "template_id": self.template_id,
            "name": self.name,
            "is_server": self.is_server,
        }
