import os 
from flask import Flask
from flask_mysqldb import MySQL

import hashlib

mysql = MySQL()  

def create_app():
    app = Flask(
    __name__,
    static_folder="../static",    
    static_url_path="/static"
)

    app.config['SECRET_KEY'] = 'secret_key'

    # MySQL Configuration
    app.config["MYSQL_HOST"] = "localhost"
    app.config["MYSQL_USER"] = "root"
    app.config["MYSQL_PASSWORD"] = "password"
    app.config["MYSQL_DB"] = "finance"

    mysql.init_app(app)  

    from .routes import main,api  
    app.register_blueprint(main)
    app.register_blueprint(api)

    return app
