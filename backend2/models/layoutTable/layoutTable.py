from sqlalchemy import Boolean, ForeignKey
from sqlalchemy.orm import relationship
from db import db


class LayoutTable(db.Model):
    """
    LayoutTable model representing layout configurations.
    """
    __tablename__ = "layout_tables"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    template_or_server_id = db.Column(db.Integer, ForeignKey("template_or_server.template_id"), nullable=False)
    layout_name = db.Column(db.String, nullable=False)
    created_by_admin_page = db.Column(Boolean, nullable=False)

    # Relationships
    template_or_server = relationship("TemplateOrServer", back_populates="layout_tables")
    graphics = relationship("Graphic", back_populates="layout", cascade="all, delete-orphan")

    def to_dict(self):
        """
        Convert the model instance to a dictionary.
        """
        return {
            "id": self.id,
            "template_or_server_id": self.template_or_server_id,
            "layout_name": self.layout_name,
            "created_by_admin_page": self.created_by_admin_page,
        }