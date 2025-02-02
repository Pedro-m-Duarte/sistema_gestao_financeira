from sqlalchemy import  ForeignKey
from sqlalchemy.orm import relationship
from db import db

class Layout(db.Model):
    """
    Layout model representing user-specific layouts.
    """
    __tablename__ = "layouts"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    user = relationship("User", back_populates="layouts")
    graphics = relationship("Graphic", back_populates="layout", cascade="all, delete-orphan")

    def to_dict(self):
        """
        Convert the model instance to a dictionary.
        """
        return {
            "id": self.id,
            "user_id": self.user_id,
        }
