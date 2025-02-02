# from flask_restx import fields
# from controllers.swagger import api
# from pydantic import BaseModel
# from db import db

# class ReportStatus(db.Model):
#     __tablename__ = "reports_status"

#     id = db.Column(db.String(255), primary_key=True)
#     status = db.Column(db.String(255), primary_key=True)

#     def to_dict(self):
#         return self.__dict__

#     @staticmethod
#     def from_json(json_string):
#         pass

# class ColumnList(BaseModel):
#     columnName: str
#     operator: int
#     value: str

# class SelectedTables(BaseModel):
#     connectionId: str
#     tableName: str
#     columnList: list[str]
#     filterList: list[ColumnList]

# class ReportDTO(BaseModel, frozen=True):
#     selectedTables: list[SelectedTables]
#     limit: str

# report_filter_list = api.model('Connection Response', {
#     'columnName': fields.String(required=False, description='The name of the column'),
#     'operator': fields.Integer(required=False, description='The operator Enum'),
#     'value': fields.String(required=False, description='The value of the filter')
# })

# selected_tables = api.model('Shared Users Output', {
#     'connectionId': fields.String(required=True, description='The ID of the connection'),
#     'tableName': fields.String(required=True, description='The name of the table'),
#     'columnList': fields.List(
#         fields.String, required=True, description='The list of columns of the report'
#     ),
#     'filterList': fields.List(
#         fields.Nested(report_filter_list), description='The list of filters of the report'
#     )
# })

# report_config = api.model('Report Config', {
#     'selectedTables': fields.List(
#         fields.Nested(selected_tables), required=True, description='The list of selected tables'
#     ),
#     'limit': fields.String(required=False, description='The max number of rows'),
# })

# report_status = api.model('Report Status', {
#     'State': fields.String(readonly=True, description='Status of the report')
# })
