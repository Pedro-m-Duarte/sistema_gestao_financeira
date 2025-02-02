from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from db import db

class Graphic(db.Model):
    """
    Graphic model representing chart configurations.
    """
    __tablename__ = "graphics"

    # Primary Key
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Columns
    name = db.Column(db.String, nullable=False)
    chart_type = db.Column(db.String, nullable=False)
    width = db.Column(db.Integer, nullable=False)
    height = db.Column(db.Integer, nullable=False)

    # ForeignKey
    layout_id = db.Column(db.Integer, ForeignKey("layout_tables.id"), nullable=False)

    # Relationship to LayoutTable
    layout = relationship("LayoutTable", back_populates="graphics")

    def to_dict(self):
        """
        Convert the model instance to a dictionary.
        """
        return {
            "id": self.id,
            "name": self.name,
            "chart_type": self.chart_type,
            "width": self.width,
            "height": self.height,
            "layout_id": self.layout_id,
        }
