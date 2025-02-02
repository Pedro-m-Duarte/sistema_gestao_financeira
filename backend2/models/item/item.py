from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from db import db

class Item(db.Model):
    """
    Item model representing data points in a graphic.
    """
    __tablename__ = "items"

    # Primary Key
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Columns
    name = db.Column(db.String, nullable=False)
    item_id = db.Column(db.String, nullable=False)
    key = db.Column(db.String, nullable=False)
    color_line = db.Column(db.String, nullable=False)
    is_discovery_item = db.Column(Boolean, nullable=False)

    # ForeignKey
    graphic_id = db.Column(db.Integer, ForeignKey("graphics.id"), nullable=False)

    # Relationship to Graphic
    graphic = relationship("Graphic", back_populates="items")

    def to_dict(self):
        """
        Convert the model instance to a dictionary.
        """
        return {
            "id": self.id,
            "name": self.name,
            "item_id": self.item_id,
            "key": self.key,
            "color_line": self.color_line,
            "is_discovery_item": self.is_discovery_item,
            "graphic_id": self.graphic_id,
        }