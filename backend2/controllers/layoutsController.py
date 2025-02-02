from flask import Flask, request, jsonify
from flask_restx import Api, Resource, fields
from flask_sqlalchemy import SQLAlchemy
from flask_session import Session
import json


layout_model = api.model('Layout', {
    'name': fields.String(required=True, description='The layout name'),
    'data': fields.Raw(required=True, description='The layout data')
})

class Layout(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    data = db.Column(db.Text, nullable=False)

    def __repr__(self):
        return f'<Layout {self.name}>'

@ns.route('/list')
class LayoutList(Resource):
    def get(self):
        s_id = request.args.get('sID')

        if not s_id:
            return {'success': False, 'errorId': -2, 'error': 'Invalid request parameters.'}, 200

        # Assuming session management is handled elsewhere or similarly to Flask-Session
        session_data = get_session_data(s_id)
        if not session_data or 'user' not in session_data or 'userId' not in session_data['user']:
            return {'success': False, 'errorId': -2, 'error': 'Invalid session provided.'}, 200

        layouts = Layout.query.filter_by(user_id=session_data['user']['userId']).all()
        data = [{'name': layout.name, **json.loads(layout.data)} for layout in layouts]

        return {'success': True, 'layouts': data}

@ns.route('/create')
class LayoutCreate(Resource):
    @api.expect(layout_model)
    def post(self):
        data = request.json
        layout_data = data.get('layout')
        s_id = data.get('sID')
        server_id = data.get('serverID')
        server_name = data.get('serverName')
        server_type = data.get('serverType')
        layout_custom_name = data.get('layoutCustomName')

        if not all([layout_data, s_id, server_id, server_name, server_type, layout_custom_name]):
            return {'success': False, 'errorId': -2, 'error': 'Invalid request parameters.'}, 200

        session_data = get_session_data(s_id)
        if not session_data or 'user' not in session_data or 'userId' not in session_data['user']:
            return {'success': False, 'errorId': -2, 'error': 'Invalid session provided.'}, 200

        new_layout = Layout(
            name=layout_custom_name,
            user_id=session_data['user']['userId'],
            data=json.dumps({
                'layout': layout_data,
                'serverID': server_id,
                'serverName': server_name,
                'serverType': server_type,
                'layoutCustomName': layout_custom_name
            })
        )
        db.session.add(new_layout)
        db.session.commit()

        layouts = Layout.query.filter_by(user_id=session_data['user']['userId']).all()
        data = [{'name': layout.name, **json.loads(layout.data)} for layout in layouts]

        return {
            'success': True,
            'message': f'Layout saved with ID #{new_layout.id}.',
            'layoutId': new_layout.id,
            'layoutName': layout_custom_name,
            'data': data
        }

def get_session_data(session_id):
    # Implement session retrieval logic here
    pass

if __name__ == '__main__':
    db.create_all()
    app.run(debug=True)