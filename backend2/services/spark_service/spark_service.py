# from io import StringIO
# import os
# from pyspark.sql import SparkSession
# from services.dao.ReportStatusDAO import ReportStatusDAO
# import concurrent.futures
# from minio import Minio
# import pandas as pd

# class SparkService:
#     def __init__(cls):
#         # workarround for sparkSession poor error handling
#         with concurrent.futures.ThreadPoolExecutor() as executor:
#             future = executor.submit(cls.get_spark_session)
#             cls.spark = future.result(timeout=30)

#     @classmethod
#     def get_spark_session(cls):
#         spark_addr = os.environ.get('SPARK_ADDR')
#         spark_api_token = os.environ.get('SPARK_API_TOKEN')
#         return SparkSession.builder\
#             .config("spark.jars.packages", "org.postgresql:postgresql:42.6.0,mysql:mysql-connector-java:8.3.0") \
#             .remote(f"sc://{spark_addr}/;cluster=spark-connect;user_id=admin;api_token={spark_api_token}").getOrCreate()


#     @staticmethod
#     def get_jdbc_driver(db_type):
#         drivers = {
#             'mysql': 'com.mysql.cj.jdbc.Driver',
#             'postgres': 'org.postgresql.Driver',
#             'oracle': 'oracle.jdbc.driver.OracleDriver',
#             'sqlserver': 'com.microsoft.sqlserver.jdbc.SQLServerDriver',
#             'sqlite': 'org.sqlite.JDBC',
#             'db2': 'com.ibm.db2.jcc.DB2Driver',
#             'sybase': 'com.sybase.jdbc4.jdbc.SybDriver',
#             'h2': 'org.h2.Driver',
#             'hsqldb': 'org.hsqldb.jdbc.JDBCDriver',
#             'derby': 'org.apache.derby.jdbc.EmbeddedDriver',
#             'mariadb': 'com.mysql.cj.jdbc.Driver',
#             'redshift': 'com.amazon.redshift.jdbc.Driver',
#             'snowflake': 'net.snowflake.client.jdbc.SnowflakeDriver',
#             'teradata': 'com.teradata.jdbc.TeraDriver',
#             'sap': 'com.sap.db.jdbc.Driver',
#             'informix': 'com.informix.jdbc.IfxDriver',
#             'firebird': 'org.firebirdsql.jdbc.FBDriver',
#             'cassandra': 'com.github.adejanovski.cassandra.jdbc.CassandraDriver'
#             # Add more database types and their drivers as needed
#         }

#         driver = drivers.get(db_type.lower())
#         if not driver:
#             raise ValueError(
#                 f"No JDBC driver found for database type '{db_type}'")
#         return driver

#     def readFromJDBCSources(cls, type, host, port, usr, psswd, schema, table):

#         driver = cls.get_jdbc_driver(type)
#         connection_url_type = ''
#         if (type == 'postgres'):
#             connection_url_type = 'postgresql'
#         else:
#             connection_url_type = type
#         database_host = host
#         database_port = port
#         database_name = ''
#         if (schema == ''):
#             database_name = ''
#         else:
#             database_name = f'/{schema}'
#         table = table
#         user = usr
#         password = psswd
#         connection_url_type = connection_url_type if connection_url_type != "mariadb" else "mysql"
#         url = f"jdbc:{connection_url_type}://{database_host}:{database_port}{database_name}"
#         DF = (cls.spark.read
#               .format("jdbc")
#               .option("driver", driver)
#               .option("url", url)
#               .option("dbtable", table)
#               .option("user", user)
#               .option("password", password)
#               .load()
#               )
#         return DF

#     def execute_query(cls, query_id, db_type, host, port, usr, psswd, schema, table, select_list, filter_list, limit = None):

#         ReportStatusDAO.update_report_status(
#                 {'id': query_id, 'status': 'processing'})

#         df = cls.readFromJDBCSources(
#             db_type, host, port, usr, psswd, schema, table)

#         result_df = df.select(select_list)
#         limit = int(limit)
#         if len(filter_list) > 0:
#             result_df = result_df.filter(filter_list)
#         if limit is not None and limit != 0:
#             result_df = result_df.limit(limit)
#         cls.writeOnJDBCSources(result_df, query_id.replace("-", "_"))
#         ReportStatusDAO.update_report_status(
#             {'id': query_id, 'status': 'success'})
#         cls.spark.stop()

#     def execute_file_query(cls, query_id, separator, file_id, has_header, select_list, filter_list, limit):
#         ReportStatusDAO.update_report_status(
#                 {'id': query_id, 'status': 'processing'})
#         df = cls.getFromMinio(separator, has_header, file_id)
#         result_df = df.select(select_list)
#         limit = int(limit)
#         if len(filter_list) > 0:
#             result_df = result_df.filter(filter_list)
#         if limit is not None and limit != 0:
#             result_df = result_df.limit(limit)
#         cls.writeOnJDBCSources(result_df, query_id.replace("-", "_"))
#         ReportStatusDAO.update_report_status(
#             {'id': query_id, 'status': 'success'})
#         cls.spark.stop()

#     def getFromMinio(cls, separator, has_header, file_id):
#         try:
#             minio_url=os.environ.get('MINIO_URL')
#             minio_bucket=os.environ.get('MINIO_BUCKET_NAME')
#             file_name = f"{file_id}.csv"
#             client = Minio(
#                 minio_url,
#                 access_key=os.environ.get('MINIO_ACCESS_KEY'),
#                 secret_key=os.environ.get('MINIO_SECRET_KEY'),
#                 secure=False
#             )

#             minio_file = client.get_object(bucket_name=minio_bucket, object_name=file_name)
#             dataframe = pd.read_csv(StringIO(str(minio_file.data,'utf-8')),delimiter=separators[separator],header=0 if has_header else None)
#             df = cls.spark.createDataFrame(dataframe)
#             return df
#         except Exception as e:
#             raise Exception(f'File cannot be obtained: {e}')

#     def writeOnJDBCSources(cls, DF, tbl):
#         try:
#             driver = "org.postgresql.Driver"
#             url = os.environ.get('PROCESSED_REPORTS_DB_URL')
#             user = os.environ.get('PROCESSED_REPORTS_DB_USER')
#             password = os.environ.get('PROCESSED_REPORTS_DB_PSSWD')
#             # no caso de postgres, o nome da tabela será schemaName.tableName
#             table = f'"{tbl}"'
#             DF.write \
#                 .format("jdbc") \
#                 .option("driver", driver) \
#                 .option("url", url) \
#                 .option("dbtable", table) \
#                 .option("user", user) \
#                 .option("password", password) \
#                 .save()

#         except Exception as e:
#             raise Exception(f'Table cannot be writted: {e}')

# separators = {
#             'comma': ",",
#             'tab': "\t",
#             'semicolon': ";",
#             'space': "\s+"
#         }