const mysql = require('mysql');

class Conection {
    // constructor(){
    //   this.host = "175.0.10.201";
    //   this.user = "Architect01";
    //   this.password = "@DM1N1STR4D0R2016";
    //   this.dbname = "pobladores";
    //   this.conection = null
    // }

    constructor(host, user, password, dbname) {
        this.host = host;
        this.user = user;
        this.password = password;
        this.dbname = dbname;
        this.pool = null
        this.interval = 0;
        this.connection = null;
    }


    crearConeccion() {
        try {
            this.pool = mysql.createPool({
                host: this.host,
                user: this.user,
                password: this.password,
                database: this.dbname,
                ssl: false,
                dateStrings: true
            });

            let _this = this;

            var query = function (sql, callback) {
                _this.pool.getConnection(function (err, conn) {
                    if (err) {
                        callback(err, null);
                    } else {
                        conn.query(sql, function (err, results) {
                            callback(err, results);
                        });
                        conn.release();
                    }
                });
            };
            return query;
        } catch (e) {
            //console.log(e.stack);
            return false;
        }
    }

    conection_enable() {
        try {
            this.connection = mysql.createConnection({
                host: this.host,
                user: this.user,
                password: this.password,
                database: this.dbname
            });
            this.conectar();
            return this.connection;
        } catch (e) {
            //console.log(e);
            return false;
        }
    }

    conectar() {
        this.connection.connect();
    }

    desconectar() {
        this.connection.end();
    }
}

module.exports = Conection;