from flask import request, jsonify
from flask_restx import Namespace, Resource
from db import db
from models.layout_table import LayoutTable
from models.graphic import Graphic
from models.item import Item
from models.template_or_server import TemplateOrServer

# Define API namespace
layout_ns = Namespace("layouts", description="Layout Operations")

@layout_ns.route("/createLayout")
class CreateLayout(Resource):
    """Creates a new layout."""

    def post(self):
        data = request.json
        template_or_server_id = data.get("templateOrServerId")
        template_or_server_name = data.get("templateOrServerName")
        layout_name = data.get("layoutName")
        graphics = data.get("graphics", [])
        is_server = data.get("isServer")
        created_by_admin_page = data.get("createdByAdminPage")

        template_or_server = TemplateOrServer.query.get(template_or_server_id)
        if not template_or_server:
            template_or_server = TemplateOrServer(
                templateId=template_or_server_id,
                name=template_or_server_name,
                isServer=is_server
            )
            db.session.add(template_or_server)
            db.session.commit()

        layout = LayoutTable(
            templateOrServerId=template_or_server_id,
            layoutName=layout_name,
            createdByAdminPage=created_by_admin_page
        )
        db.session.add(layout)
        db.session.commit()

        for graphic_data in graphics:
            graphic = Graphic(
                name=graphic_data["name"],
                chartType=graphic_data["chartType"],
                layoutId=layout.id,
                width=graphic_data["width"],
                height=graphic_data["height"]
            )
            db.session.add(graphic)
            db.session.commit()

            for item_data in graphic_data["items"]:
                item = Item(
                    name=item_data["name"],
                    itemId=item_data["itemId"],
                    colorLine=item_data["colorLine"],
                    graphicId=graphic.id,
                    key=item_data["key"],
                    isDicoveryItem=item_data["isDicoveryItem"]
                )
                db.session.add(item)
                db.session.commit()

        return jsonify({"message": "Layout created successfully", "layout": layout.to_dict()}), 201

@layout_ns.route("/deleteLayout")
class DeleteLayout(Resource):
    """Deletes a layout."""

    def post(self):
        data = request.json
        layout_id = data.get("layoutId")
        layout = LayoutTable.query.get(layout_id)
        if not layout:
            return jsonify({"message": "Layout not found"}), 404

        graphics = Graphic.query.filter_by(layoutId=layout_id).all()
        for graphic in graphics:
            items = Item.query.filter_by(graphicId=graphic.id).all()
            for item in items:
                db.session.delete(item)
            db.session.delete(graphic)

        db.session.delete(layout)
        db.session.commit()

        return jsonify({"message": "Layout deleted successfully"}), 200

@layout_ns.route("/getLayoutByServer")
class GetLayoutByServer(Resource):
    """Gets layouts by server."""

    def post(self):
        data = request.json
        template_or_server_ids = data.get("templateOrServerIds")
        if not template_or_server_ids:
            return jsonify({"message": "Invalid templateOrServerIds"}), 400

        layouts = LayoutTable.query.filter(LayoutTable.templateOrServerId.in_(template_or_server_ids)).all()
        response = []

        for layout in layouts:
            graphics = Graphic.query.filter_by(layoutId=layout.id).all()
            layout_data = {
                "serverID": layout.templateOrServerId,
                "layoutId": layout.id,
                "name": layout.layoutName,
                "graphics": []
            }
            for graphic in graphics:
                items = Item.query.filter_by(graphicId=graphic.id).all()
                graphic_data = {
                    "graphicId": graphic.id,
                    "name": graphic.name,
                    "width": graphic.width,
                    "height": graphic.height,
                    "chartType": graphic.chartType,
                    "items": [{
                        "itemId": item.itemId,
                        "name": item.name,
                        "key": item.key,
                        "colorLine": item.colorLine,
                        "isDicoveryItem": item.isDicoveryItem
                    } for item in items]
                }
                layout_data["graphics"].append(graphic_data)
            response.append(layout_data)

        return jsonify(response), 200

@layout_ns.route("/getAllLayouts")
class GetAllLayouts(Resource):
    """Gets all layouts."""

    def get(self):
        layouts = LayoutTable.query.all()
        response = [{
            "serverName": layout.templateOrServer.name,
            "layoutId": layout.id,
            "layoutName": layout.layoutName
        } for layout in layouts]

        return jsonify(response), 200
