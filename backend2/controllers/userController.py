from flask import request, jsonify
from flask_restx import Namespace, Resource, fields
from db import db
from models.user.user import User

# Define API namespace
user_ns = Namespace("users", description="User Operations")

# Define Swagger API model
user_model = user_ns.model(
    "User",
    {
        "id": fields.Integer(readonly=True),
        "username": fields.String(required=True, description="Unique username"),
        "preference_auto_update_panel_items": fields.Boolean(
            description="Auto-update preference", default=True
        ),
        "preference_auto_download_pdf_report_copy": fields.Boolean(
            description="Download preference", default=False
        ),
        "created_at": fields.DateTime(readonly=True),
    },
)

@user_ns.route("/")
class UserList(Resource):
    """
    Resource for listing and creating users.
    """

    @user_ns.marshal_list_with(user_model)
    def get(self):
        """Retrieve all users."""
        return User.query.all()

    @user_ns.expect(user_model, validate=True)
    @user_ns.marshal_with(user_model, code=201)
    def post(self):
        """Create a new user."""
        data = request.json
        new_user = User(
            username=data["username"],
            preference_auto_update_panel_items=data.get("preference_auto_update_panel_items", True),
            preference_auto_download_pdf_report_copy=data.get("preference_auto_download_pdf_report_copy", False),
        )
        db.session.add(new_user)
        db.session.commit()
        return new_user, 201

@user_ns.route("/<int:user_id>")
class UserResource(Resource):
    """
    Resource for retrieving, updating, and deleting a single user.
    """

    @user_ns.marshal_with(user_model)
    def get(self, user_id):
        """Retrieve a user by ID."""
        return User.query.get_or_404(user_id)

    @user_ns.expect(user_model, validate=True)
    @user_ns.marshal_with(user_model)
    def put(self, user_id):
        """Update a user."""
        user = User.query.get_or_404(user_id)
        data = request.json
        for field in ["username", "preference_auto_update_panel_items", "preference_auto_download_pdf_report_copy"]:
            if field in data:
                setattr(user, field, data[field])
        db.session.commit()
        return user

    @user_ns.response(204, "User deleted successfully")
    def delete(self, user_id):
        """Delete a user."""
        user = User.query.get_or_404(user_id)
        db.session.delete(user)
        db.session.commit()
        return "", 204
