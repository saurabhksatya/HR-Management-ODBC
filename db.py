import oracledb

oracledb.init_oracle_client(
    lib_dir=r"C:\Users\saura\Downloads\instantclient-basic-windows.x64-23.26.3.0.0\instantclient_23_26"
)

# DB_USERNAME = "25BCE1084"
# DB_PASSWORD = "pass"


# DB_HOST = "172.16.8.54"
# DB_PORT = 1521
# DB_SERVICE = "orcl"


DB_USERNAME = "system"
DB_PASSWORD = "root"


DB_HOST = "localhost"
DB_PORT = 1521
DB_SERVICE = "xe"

def get_connection():

    dsn = f"{DB_HOST}:{DB_PORT}/{DB_SERVICE}"

    return oracledb.connect(
        user=DB_USERNAME,
        password=DB_PASSWORD,
        dsn=dsn
    )