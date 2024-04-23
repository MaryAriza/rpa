const Conection = require("./Conecction");
const botScrach = require("./botScratch");
let date = require('date-and-time');
const { encodingLength } = require("dns-packet");

class Gacela {

    constructor(puerto) {
        //this.coneccion = new Conection("175.0.10.113", "Bot", "Bot2021**", "pobladores");
        this.coneccion = new Conection("175.0.10.62", "SA_LEGAL", "legal2021**", "legal");
        this.query = this.coneccion.crearConeccion();
        this.socket = null;
        this.err = null;
        this.datos = null;
        this.bot = new botScrach();
        this.con = this.coneccion.conection_enable();
        let _this = this;
        this.con.on(("error"), function (err) {
            //console.log("se capturo el error")
            _this.handlerError(err, _this);
        })
        this.usuario=0;
        this.puerto=puerto;
    }

    handlerError(err, _this) {
        //console.log(err.code);
        _this.bot.desactivateBot();
        setTimeout(() => {
            _this.con = _this.coneccion.conection_enable();
            _this.consultarNulos(_this, _this.err, _this.socket, true)
            _this.con.on("error", (err) => {
                _this.handlerError(err, _this);
            })
        }, 600000);
    }

    async consultarNulos(g, err, socket, restart) {
        try {
           // let numeroDocumento = 1000063127;
            let _this = this;
            this.err = err;
            this.socket = socket;
            let sql = "SELECT * FROM legalbot INNER JOIN factura  on resgistroId = numRegistro INNER JOIN transaccion on transaccion.facturaId = factura.facturaId  WHERE transaccion.estado = 'Aceptada' AND legalbot.estado is null ORDER BY RAND()";
            this.query(sql, function (error, results) {
                // console.log(results)
                if (error) {
                    err.guardarError(null, sql, "", error, socket)
                }
                _this.bot.buscarPlacas(results, g, err, socket, restart);
            });
        } catch (e) {
            //console.log(e);//err.guardarError(null,sql,"",error,socket)
        }
    }

    async errrorRegistro(numMatricula, error) {
        try {
            console.log(error);
            let _this = this;
            let sql = "UPDATE legal.legalbot SET estado = 0 , ubicacion = '"+ error +"' WHERE numMatricula ='" + numMatricula + "' ";
            try {
                this.query(sql, (error, results, fields) => {
                    if (error) {
                        err.guardarError(page, sql, placa, error, socket);
                    } else if (results.changedRows == 0) {
                       return 1;
                    }else  {
                        
                        return true;
                    }
                });
            } catch (e) {
                err.guardarError(page, sql, placa, e, socket);
                //guardar error ,hacer ping al servidor, cuando sea alive detener la ejecucion del ping e intentar actualizar la placa nuevamente, intentar 3 veces. sino no actualizar, si lo logra colocar como corregido.
            }
           
        } catch (e) {
            //guardar error ,hacer ping al servidor, cuando sea alive detener la ejecucion del ping e intentar actualizar la placa nuevamente, intentar 3 veces. sino no actualizar, si lo logra colocar como corregido.
        }
    }

    async countNull(socket, err) {
        try {
            let _this = this;
            let sql = "SELECT COUNT(*) FROM pobladores.legal WHERE fechaPoblado IS NULL and numeroDocumento = 1000063127 order by DATE(fechaCarga) , RAND()";
            return new Promise(function (resolve, reject) {
                _this.query(sql, function (error, results) {
                    // console.log(results)
                    if (error) {
                        err.guardarError(null, sql, "", error, socket)
                    } else {
                        socket.emit("cantidadP", results[0]["COUNT(*)"]);
                        resolve(results[0]["COUNT(*)"]);
                    }
                });
            })

        } catch (e) {
            //console.log(e);//err.guardarError(null,sql,"",error,socket)
        }
    }

    async consultarUnNulo(g, err, socket) {
        try {
            let _this = this;
            let sql = "SELECT * FROM legalbot INNER JOIN factura  on resgistroId = numRegistro INNER JOIN transaccion on transaccion.facturaId = factura.facturaId  WHERE transaccion.estado = 'Aceptada' AND legalbot.estado is null ORDER BY  RAND() LIMIT 50";
            return new Promise(function (resolve, reject) {
                _this.query(sql, function (error, results) {
                    if (error) {
                        err.guardarError(null, sql, "", error, socket)
                    } else {
                        if(results == ''){
                            process.exit(0);
                        }else{

                            resolve(results);
                        }
                    }
                });
            })


        } catch (e) {
            //console.log(e);//err.guardarError(null,sql,"",error,socket)
        }
    }

    async updateU(g,direccion,numMatricula,listaNombres, err, socket) {
        try {
            //console.log(direccion)
            //console.log(numMatricula)
            let _this = this;
            let sql = "UPDATE `legal`.`legalbot` SET `ubicacion` = '"+direccion+"' , valor = '"+listaNombres+"' ,estado = 1 WHERE (`numMatricula` = '"+numMatricula+"');";

            return new Promise(function (resolve, reject) {
                _this.query(sql, function (error, results) {
                    if (error) {
                        err.guardarError(null, sql, "", error, socket)
                    } else {

                      
                        resolve(results);
                              
                    }
                });
            })


        } catch (e) {
            //console.log(e);//err.guardarError(null,sql,"",error,socket)
        }
    }


    apagarGacelaBot() {
        this.bot.desactivateBot();
    }
    finalizar() {
        this.bot.finish = true;
    }

    async actualizar_placas(placa, codigofasecolda, aseguradora, fechaVencimiento, vigente, marca, modelo, tipo, cedula, page, err, socket) {
        let fecha = this.transformarFecha(fechaVencimiento);
        let sql = "UPDATE pobladores.gacela SET cedulagacela='" + cedula + "', aseguradoragacela='" + aseguradora + "', modelogacela='" + modelo + "', vigentegacela='" + vigente + "',fechavencgacela='" + fecha +
            "' ,marcagacela ='" + marca + "',lineagacela='" + tipo + "', codigo_fasecolda='" + codigofasecolda + "', fechapobladogacela = now(), editandogacela=2 WHERE placagacela ='" + placa + "'";
        try {
            this.query(sql, (error, results, fields) => {
                if (error) {
                    err.guardarError(page, sql, placa, error, socket);
                } else if (results.changedRows == 0) {
                    // console.log("No se actualizaron datos");
                }
            });
        } catch (e) {
            err.guardarError(page, sql, placa, e, socket);
            //guardar error ,hacer ping al servidor, cuando sea alive detener la ejecucion del ping e intentar actualizar la placa nuevamente, intentar 3 veces. sino no actualizar, si lo logra colocar como corregido.
        }
    }

    transformarFecha(fecha) {
        if (fecha != null) {
            let fechaSep = "";
            if (fecha.indexOf("/") != -1) {
                fechaSep = fecha.split("/");
            } else if (fecha.indexOf("-") != -1) {
                fechaSep = fecha.split("-");
            } else {
                fechaSep = ["0001", "01", "01"];
            }
            let año = (fechaSep[0].length == 4) ? fechaSep[0] : fechaSep[2];
            let mes = fechaSep[1];
            let dia = (fechaSep[2].length == 4) ? fechaSep[0] : fechaSep[2];
            return [año, mes, dia].join("-");
        } else {
            return null
        }

    }
}

module.exports = Gacela;