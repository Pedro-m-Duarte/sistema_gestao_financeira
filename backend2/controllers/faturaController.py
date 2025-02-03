from datetime import datetime
from flask import request, jsonify
from flask_restx import Namespace, Resource, fields
from db import db
from models.fatura.fatura import Fatura

# Define API namespace
fatura_ns = Namespace("fatura", description="Fatura Operations")

# Define Swagger API model for creating Fatura
fatura_create_model = fatura_ns.model(
    "Fatura_create",
    {
        "nome": fields.String(required=True),
        "descricao": fields.String(required=True),
        "valor": fields.Float(required=True),
        "categoria": fields.String(required=True),
        "data": fields.DateTime(readonly=True),
    },
)

# Define Swagger API model for returning Fatura data
fatura_model = fatura_ns.model(
    "Fatura",
    {
        "id": fields.Integer(required=True),
        "nome": fields.String(required=True),
        "descricao": fields.String(required=True),
        "valor": fields.Float(required=True),
        "categoria": fields.String(required=True),
        "data": fields.DateTime(readonly=True),
    },
)

# Define Swagger API model for search parameters
fatura_search = fatura_ns.model(
    "Search",
    {
        "id": fields.Integer(),
        "nome": fields.String(),
        "categoria": fields.String(),
        "data_beg": fields.DateTime(),
        "data_end": fields.DateTime(),
    },
)


@fatura_ns.route("/create")
class FaturaNew(Resource):
    @fatura_ns.expect(fatura_create_model, validate=True)
    @fatura_ns.marshal_with(fatura_model, code=201)
    def post(self):
        """Create a new fatura."""
        data = request.json
        new_fatura = Fatura(
            nome=data["nome"],
            descricao=data["descricao"],
            valor=data["valor"],
            categoria=data["categoria"],
            data=data["data"],
        )
        db.session.add(new_fatura)
        db.session.commit()
        return new_fatura, 201


@fatura_ns.route("/")
class FaturaList(Resource):
    """
    Resource for listing and creating faturas.
    """

    @fatura_ns.expect(fatura_search)
    @fatura_ns.marshal_list_with(fatura_model)
    def post(self):
        """Search faturas using optional filters."""
        data = request.json
        query = Fatura.query

        # Extract search parameters
        if "id" in data:
            query = query.filter(Fatura.id == data["id"])
        if "nome" in data:
            query = query.filter(Fatura.nome.ilike(f"%{data['nome']}%"))
        if "categoria" in data:
            query = query.filter(Fatura.categoria.ilike(f"%{data['categoria']}%"))

        # Handle date range filtering
        data_beg = data.get("data_beg")
        data_end = data.get("data_end")

        if data_beg and data_end:
            try:
                # Define the expected date format
                data_format = "%Y-%m-%d %H:%M:%S"  # Adjust if needed

                # Convert string to datetime objects
                data_beg = datetime.strptime(data_beg, data_format)
                data_end = datetime.strptime(data_end, data_format)

                # Validate that data_beg > data_end
                if data_beg > data_end:
                    query = query.filter(Fatura.data.between(data_end, data_beg))
                else:
                    return {"error": "data_beg must be greater than data_end"}, 400
            except ValueError:
                return {"error": "Invalid date format. Use YYYY-MM-DD HH:MM:SS"}, 400

        return query.all()


@fatura_ns.route("/<int:fatura_id>")
class FaturaResource(Resource):
    """
    Resource for retrieving, updating, and deleting a single fatura.
    """

    @fatura_ns.response(204, "Fatura deleted successfully")
    def delete(self, fatura_id):
        """Delete a fatura."""
        fatura = Fatura.query.get_or_404(fatura_id)
        db.session.delete(fatura)
        db.session.commit()
        return fatura_id, 204
