from datetime import datetime
from flask import request, jsonify
from flask_restx import Namespace, Resource, fields
from db import db
from models.fatura.fatura import Fatura
from sqlalchemy import func

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
        "data": fields.Date(required=True),  # Changed to fields.Date
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
        "data": fields.Date(required=True),  # Changed to fields.Date
    },
)

# Define Swagger API model for search parameters
fatura_search = fatura_ns.model(
    "Search",
    {
        "id": fields.Integer(),
        "nome": fields.String(),
        "categoria": fields.String(),
        "data_beg": fields.Date(),  # Changed to fields.Date
        "data_end": fields.Date(),  # Changed to fields.Date
    },
)


# Define Swagger API model for sum by categoria
sum_by_categoria_model = fatura_ns.model(
    "SumByCategoria",
    {
        "categoria": fields.String(required=True, description="Nome da categoria"),
        "total_valor": fields.Float(required=True, description="Valor total gasto na categoria "),
    },
)

# Define Swagger API model for categorias
categorias_model = fatura_ns.model(
    "Categorias",
    {
        "categorias": fields.List(fields.String, description="List of unique categorias"),
    },
)

@fatura_ns.route("/categorias")
class FaturaCategorias(Resource):
    @fatura_ns.marshal_with(categorias_model)
    def get(self):
        """
        Get all distinct categorias from the Fatura table.
        """
        categorias = db.session.query(Fatura.categoria).distinct().all()

        response = {"categorias": [row.categoria for row in categorias]}

        return response



@fatura_ns.route("/getTotalAmountByCartegory")
class FaturaSumByCategoria(Resource):
    @fatura_ns.marshal_list_with(sum_by_categoria_model)
    @fatura_ns.param("categoria", "Filter by categoria (optional)")
    @fatura_ns.param("data_inicio", "Start date for filtering (optional, format: YYYY-MM-DD)")
    @fatura_ns.param("data_fim", "End date for filtering (optional, format: YYYY-MM-DD)")
    def get(self):
        """
        Sum the 'valor' field grouped by 'categoria'.
        Optionally filter by a specific categoria and/or a date range.
        """
        from sqlalchemy import func
        from datetime import datetime

        categoria_filter = request.args.get("categoria", "").strip()
        data_inicio = request.args.get("data_inicio")
        data_fim = request.args.get("data_fim")

        query = db.session.query(Fatura.categoria, func.sum(Fatura.valor).label("total_valor"))

        if categoria_filter:
            query = query.filter(Fatura.categoria.ilike(f"%{categoria_filter}%"))

        if data_inicio and data_fim:
            try:
                data_inicio = datetime.strptime(data_inicio, "%Y-%m-%d").date()
                data_fim = datetime.strptime(data_fim, "%Y-%m-%d").date()
                query = query.filter(Fatura.data.between(data_inicio, data_fim))
            except ValueError:
                return {"error": "Invalid date format. Use YYYY-MM-DD"}, 400

        result = query.group_by(Fatura.categoria).all()

        response = [
            {"categoria": row.categoria, "total_valor": row.total_valor} for row in result
        ]

        return response

@fatura_ns.route("/create")
class FaturaNew(Resource):
    @fatura_ns.expect(fatura_create_model, validate=True)
    @fatura_ns.marshal_with(fatura_model, code=201)
    def post(self):
        """Create a new fatura."""
        data = request.json
        fatura_date = datetime.strptime(data["data"], "%Y-%m-%d").date()
        new_fatura = Fatura(
            nome=data["nome"],
            descricao=data["descricao"],
            valor=data["valor"],
            categoria=data["categoria"],
            data=fatura_date,  # Use the parsed date object
        )
        db.session.add(new_fatura)
        db.session.commit()
        return new_fatura, 201

@fatura_ns.route("/")
class FaturaList(Resource):
    """
    Resource for listing and creating faturas.
    """

    @fatura_ns.marshal_list_with(fatura_model)
    @fatura_ns.param("id", "Filter by id (optional)")
    @fatura_ns.param("nome", "Filter by nome (optional)")
    @fatura_ns.param("categoria", "Filter by categoria (optional)")
    @fatura_ns.param("data_beg", "Beg date for filtering (optional, format: YYYY-MM-DD)")
    @fatura_ns.param("data_end", "End date for filtering (optional, format: YYYY-MM-DD)")
    def get(self):
        """Search faturas using optional filters."""
        query = Fatura.query

        fatura_id = request.args.get("id", "")
        nome = request.args.get("nome", "")
        categoria_filter = request.args.get("categoria", "").strip()
        data_beg = request.args.get("data_beg")
        data_end = request.args.get("data_end")

        # Extract search parameters
        if fatura_id:
            query = query.filter(Fatura.id == fatura_id)
        if nome:
            query = query.filter(Fatura.nome.ilike(f"%{nome}%"))
        if categoria_filter:
            query = query.filter(Fatura.categoria.ilike(f"%{categoria_filter}%"))

        if data_beg and data_end:
            try:
                data_beg = datetime.strptime(data_beg, "%Y-%m-%d").date()
                data_end = datetime.strptime(data_end, "%Y-%m-%d").date()
                query = query.filter(Fatura.data.between(data_beg, data_end))
            except ValueError:
                return {"error": "Invalid date format. Use YYYY-MM-DD"}, 400

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