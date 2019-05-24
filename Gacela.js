const Conection = require("./Conecction");
const botScrach = require("./botScratch");
let date = require('date-and-time');

class Gacela{

    constructor(){
        this.coneccion = new Conection("175.0.10.201","Architect01","@DM1N1STR4D0R2016","pobladores");
        this.con =this.coneccion.crearConeccion();
        this.datos= null;
        this.bot= new botScrach();
    }

    async consultarNulos(g,err,socket){
        try{
            let _this=this;
            let sql = "SELECT * FROM pobladores.gacelabot WHERE editandogacela IS NULL";
            this.con.query(sql, function (error, results, fields) {
                if(error){
                    err.guardarError(null,sql,"",error,socket)
                }
                _this.bot.buscarPlacas(results,g,err,socket);
            });
        }catch(e){
            console.log(e);//err.guardarError(null,sql,"",error,socket)
        }
    }

    apagarGacelaBot(){
        this.bot.desactivateBot();
    }

    async actualizar_placas(placa,aseguradora,fechaVencimiento,vigente,marca,modelo,tipo,cedula,page, err,socket){
        let fecha= this.transformarFecha(fechaVencimiento);
        let sql="UPDATE pobladores.gacelabot SET cedulagacela='"+cedula+"', aseguradoragacela='"+aseguradora+"', modelogacela='"+modelo+"', vigentegacela='"+vigente+"',fechavencgacela='"+fecha+
        "' ,marcagacela ='"+marca+"',lineagacela='"+tipo+"', fechapobladogacela = CURDATE(), editandogacela=2, asesorgacela=1 WHERE placagacela ='"+placa+"'";
        try{
            let _this=this;
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