const Conection = require("./Conecction");
const botScrach = require("./botScratch");
let date = require('date-and-time');

class Gacela{

    constructor(){
        this.coneccion = new Conection("175.0.10.201","Architect01","@DM1N1STR4D0R2016","pobladores");
        this.con =this.coneccion.crearConeccion();
        var _this = this;
        this.socket=null;
        this.err=null;
        this.datos= null;
        this.bot= new botScrach();
        this.con.on(("error"),function(err){
            _this.handlerError(err,_this);
        })
    }

    handlerError(err,_this){
        console.log(err.code);
        this.bot.desactivateBot();
        setTimeout(()=>{
            _this.con = _this.coneccion.crearConeccion();
            _this.consultarNulos(_this,_this.err,_this.socket,true)
            _this.con.on("error",(err)=>{
                _this.handlerError(err,_this);
            })
        },600000);
    }

    async consultarNulos(g,err,socket,restart){
        try{
            let _this=this;
            this.err = err;
            this.socket = socket;
            let sql = "SELECT * FROM pobladores.gacela WHERE editandogacela IS NULL";
            this.con.query(sql, function (error, results, fields) {
                if(error){
                    err.guardarError(null,sql,"",error,socket)
                }
                _this.bot.buscarPlacas(results,g,err,socket,restart);
            });
        }catch(e){
            console.log(e);//err.guardarError(null,sql,"",error,socket)
        }
    }

    async countNull(socket,err){
        try{
            let _this=this;
            let connect = this.con;
            let sql = "SELECT COUNT(*) FROM pobladores.gacela WHERE editandogacela IS NULL";
            return new Promise(function(resolve,reject){
                connect.query(sql, function (error, results, fields) {
                    if(error){
                        err.guardarError(null,sql,"",error,socket)
                    }else{
                        socket.emit("cantidadP",results[0]["COUNT(*)"]);
                        resolve(results[0]["COUNT(*)"]);
                    }
                });
            })
            
        }catch(e){
            console.log(e);//err.guardarError(null,sql,"",error,socket)
        }
    }

    async consultarUnNulo(g,err,socket){
        try{
            let _this=this;
            let connect = this.con;
            let sql = "SELECT * FROM pobladores.gacela WHERE editandogacela IS NULL order by RAND() desc LIMIT 50";
            return new Promise(function(resolve,reject){
                connect.query(sql, function (error, results, fields) {
                    if(error){
                        err.guardarError(null,sql,"",error,socket)
                    }else{
                        resolve(results);                    
                    }
                });
            })
            
        }catch(e){
            console.log(e);//err.guardarError(null,sql,"",error,socket)
        }
    }


    apagarGacelaBot(){
        this.bot.desactivateBot();
    }
    finalizar(){
        this.bot.finish =true;
    }

    async actualizar_placas(placa,aseguradora,fechaVencimiento,vigente,marca,modelo,tipo,cedula,page, err,socket){
        let fecha= this.transformarFecha(fechaVencimiento);
        let sql="UPDATE pobladores.gacela SET cedulagacela='"+cedula+"', aseguradoragacela='"+aseguradora+"', modelogacela='"+modelo+"', vigentegacela='"+vigente+"',fechavencgacela='"+fecha+
        "' ,marcagacela ='"+marca+"',lineagacela='"+tipo+"', fechapobladogacela = CURDATE(), editandogacela=2, asesorgacela=1 WHERE placagacela ='"+placa+"'";
        try{
            let s_this=this;
            this.con.query(sql,(error, results, fields)=>{
                if (error){
                    err.guardarError(page,sql,placa,error,socket);
                } else if(results.changedRows==0){
                    console.log(sql)
                    console.log("No se actualizaron los datos de la placa "+placa,results);
                }
            });
        }catch(e){
            err.guardarError(page,sql,placa,e,socket);
            //guardar error ,hacer ping al servidor, cuando sea alive detener la ejecucion del ping e intentar actualizar la placa nuevamente, intentar 3 veces. sino no actualizar, si lo logra colocar como corregido.
        }
    }

    transformarFecha(fecha){
        if(fecha!=null){
            let fechaSep="";
            if(fecha.indexOf("/")!=-1){
                fechaSep=fecha.split("/");
            }else if(fecha.indexOf("-")!=-1){
                fechaSep=fecha.split("-");
            }else{
                fechaSep=["0001","01","01"];
            }
            let año=(fechaSep[0].length==4)?fechaSep[0]:fechaSep[2];
            let mes=fechaSep[1];
            let dia=(fechaSep[2].length==4)?fechaSep[0]:fechaSep[2];
            return [año,mes,dia].join("-");
        }else{
            return null
        }
        
    }
}

module.exports = Gacela;