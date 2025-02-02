# pylint: disable=no-member
"""
Main flask file, to create flask app
"""
import os
import logging
import logging.handlers as handlers

from flask import Flask, make_response, jsonify
from flask.logging import default_handler
from flask_restx import Api
from werkzeug.exceptions import HTTPException
from flask_cors import CORS
from flask_migrate import Migrate

from controllers.userController import user_ns  # Import the user namespace
# import controllers.swagger as swagger
from db import db

from exceptions.conflict_exception import ConflictException
from exceptions.invalid_parameter_exception import InvalidParameterException
from exceptions.missing_parameter_exception import MissingParameterException
from exceptions.not_found_exception import NotFoundException
from utils.json_encoder import ComplexEncoder
from utils.request_formatter import RequestFormatter


app = Flask(__name__)
app.json_encoder = ComplexEncoder
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get('DB_DEFAULT')
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
# app.config['API_TITLE'] = "SD API"
# app.config['API_VERSION'] = "1"
# app.config['OPENAPI_VERSION'] = "3.0.2"

# remove default stream handler
app.logger.removeHandler(default_handler)
logging.getLogger('werkzeug').setLevel(logging.ERROR)
# add RotationFileHandler to logging configuration
HANDLER = handlers.RotatingFileHandler(os.path.join('logs', 'api.log'), maxBytes=50000, backupCount=10)
HANDLER.setFormatter(RequestFormatter('[%(asctime)s] %(module)s %(levelname)s - %(url)s: %(message)s'))
HANDLER.setLevel(logging.DEBUG)
logging.basicConfig(level=logging.INFO, handlers=[HANDLER])

# Initialize the database
db.init_app(app)

# Initialize API with Swagger support
api = Api(
    app,
    title="SD API",
    version="1.0",
    description="An API for financial managment",
    doc="/swagger",  # Swagger UI will be available at /swagger
)

# Register namespaces
api.add_namespace(user_ns, path="/api/users")


# db.init_app(app)
# # api = Api(app)

# Create database tables before the first request
with app.app_context():
    db.create_all()

migrate = Migrate(app, db)


@app.before_request
def before_request():
    """
    Function to execute before all requests, to log them all
    :param response: flask response object
    :return:
    """
    app.logger.info('Requested')


@app.after_request
def after_request(response):
    """
    Function to execute after all requests, to log them all
    :param response: flask response object
    :return:
    """
    app.logger.info('Completed')
    return response


@app.errorhandler(Exception)
def handle_exception(exception):
    """
    Catch exceptions from flask routes
    :param exception: exception raised
    :return:
    """
    app.logger.exception(exception)
    if isinstance(exception, HTTPException):
        app.logger.info('Erro que eu nao sei')
        return make_response(jsonify(description=str(exception)), exception.code)
    if isinstance(exception, MissingParameterException):
        app.logger.info('400')
        return make_response(jsonify(description=str(exception)), 400)
    if isinstance(exception, NotFoundException):
        app.logger.info('404')
        return make_response(jsonify(description=str(exception)), 404)
    if isinstance(exception, ConflictException):
        app.logger.info('409')
        return make_response(jsonify(description=str(exception)), 409)
    if isinstance(exception, InvalidParameterException):
        app.logger.info('422')
        return make_response(jsonify(description=str(exception)), 422)
    app.logger.info('500')
    return make_response(jsonify(description=str(exception)), 500)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug = True)
