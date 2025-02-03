"""
Defines the Fatura model for the database.
"""

from sqlalchemy.sql import func
from sqlalchemy import Boolean, Double
from db import db

class Fatura(db.Model):
    """
    Fatura model representing application Faturas.
    """
    __tablename__ = "fatura"


    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String, unique=True, nullable=False)
    categoria = db.Column(db.String, unique=True, nullable=False)
    valor = db.Column(Double, nullable=False)
    categoria = db.Column(db.String, nullable=False)
    data = db.Column(db.DateTime, nullable=True, default= func.now())

    def to_dict(self):
        """
        Convert the model instance to a dictionary.
        """
        return {
            "id" : self.id,
            "nome" : self.nome,
            "categoria" : self.categoria,
            "valor" : self.valor,
            "categoria" : self.categoria,
            "data" : self.data,
        }
