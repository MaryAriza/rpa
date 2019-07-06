
const Conection = require("./Conecction");
const isOnline = require('is-online'); //para comprobar internet
const ping = require('ping');//para hacerle ping al servidor
const connectionTester = require('connection-tester');//para comprobar coneccion con gacela
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
let date = require('date-and-time');

class ErrorManager{

    constructor(){
        this.coneccion = new Conection("localhost","root","","registrobot");
        this.con =this.coneccion.crearConeccion();
        this.cantErrores=0;
    }

    pingGacela(){
        return connectionTester.test('consultas.laequidadseguros.coop', 8081, 1000);
    }

    pingServidor(){
        return connectionTester.test('175.0.10.201', 80, 1000);
    }

    async guardarError(page,sql,placa,err,socket){
        let now= new Date();
        let html=null;
        let urlCapture =null;
        let ping_gacela = {success:false};
        let ping_servidor = {success:false};//a.alive
        let ping_internet=false;
        let fecha2 = date.format(now, 'YYYY-MM-DD-HH-mm-ss');
        if(page!=null){
            try{
                ping_gacela = await this.pingGacela();
                ping_servidor = await this.pingServidor();//a.alive
                ping_internet= await isOnline();
                if(!page.isClosed()){
                    html = await page.$eval('body', e => e.outerHTML);
                    await page.screenshot({path: './view/img/capturas/'+fecha2+"-"+placa+'.png'});
                    urlCapture = fecha2+'-'+placa+'.png';
                }
            }catch(e){

            }
        }
        

        let sql1=(sql!=null)?sql.replace(/'/g, "`"):"";
        let html1=(html!=null)?html.replace(/'/g, "`"):"";
        let error=(err!=null)?err.message.replace(/'/g, "`"):"";

        let query= "INSERT INTO error (placa_err,captura_err,sql_err,html_err,msg_err,ping_gacela_err,ping_servidor_err,ping_internet_err,fecha_error) VALUES ('"
            +placa+"','"
            +urlCapture+"','"
            +sql1+"','"
            +html1+"','"
            +error+"',"
            +ping_gacela.success+","
            +ping_servidor.success+","
            +ping_internet+","
            +"CURDATE())";
            let _this=this;
            this.con.query(query,(err, results, fields)=>{
                if (err){
                    console.log(err)
                } else if(results.affectedRows==0){
                    console.log("No se actualizaron los datos del error",results);
                }else{
                    _this.cantErrores++;
                    ping_gacela=(ping_gacela.success)?"primary":"danger";
                    ping_servidor=(ping_servidor.success)?"primary":"danger";
                    ping_internet=(ping_internet)?"primary":"danger";
                    socket.emit("datoErrores",_this.cantErrores);
                    socket.emit('nuevoError',{data:'<li class="sidebar-message">'
                    +'<a href="view/img/capturas?img='+urlCapture+'" target="_blank">'
                    +'<div class="small float-right m-t-xs">'+fecha2+'</div>'
                    +'<h4 class="text-warning">ID:'+results.insertId+'</h4>'
                    +'<h4 class="text-danger">'+error+'</h4>'
                    +'<div class="small">Placa:'+placa+'</div>'
                    +'<div class="small text-muted m-t-xs">SQL: "'+sql1+'"<br><br>'
                    +'<img width="100%" height="100" src="img/capturas/'+urlCapture+'" class="img-responsive" alt=""><br>'
                    +'<span class="label label-'+ping_internet+'">Internet</span>'
                    +'<span class="label label-'+ping_gacela+'">Gacela</span>'
                    +'<span class="label label-'+ping_servidor+'">Servidor</span>'
                    +'</div>'
                    +'</a>'
                    +'</li>'});
                    console.log("hubo un error");
                }
            });

    }

    listarRegistros(socket){
        try{
            let _this=this;
            let sql = "SELECT * FROM registro";
            this.con.query(sql, function (error, results, fields) {
                if(error){
                    _this.guardarError(null,sql,"",error,socket)
                }
                socket.emit("cant_ej",results.length);
                for ( let i in results){
                    // let fecha1 = date.format(date.parse(results[i].fecha_inicio_reg,'DD-MM-YYYY HH:mm:ss'));
                    // let fecha2 = date.format(results[i].fecha_fin_reg, 'DD-MM-YYYY HH:mm:ss');
                    let fecha1 = new Date(results[i].fecha_inicio_reg.toString())
                    let fechaInicio =date.format(fecha1,'DD/MM/YYYY HH:mm:ss');
                    let fecha2 = new Date(results[i].fecha_fin_reg.toString())
                    let fechaFin =date.format(fecha1,'DD/MM/YYYY HH:mm:ss');
                    socket.emit("addReg",{
                        html:'<li class="sidebar-message">'
                        +'<h6 class="text-success">'+fechaInicio+' ~ '+fechaFin+'</h6>'
                        +'<div class="small">Cargados: '+results[i].cargados_reg+'</div>'
                        +'<div class="small">Poblados: '+results[i].poblados_reg+'</div>'
                        +'<div class="small">Con datos: '+results[i].si_gacela_reg+'</div>'
                        +'<div class="small">Sin datos: '+results[i].no_gacela_reg+'</div>'
                        +'<div class="small">Promedio: '+results[i].promedio_reg+' seg/reg</div>'
                        +'<div class="small">Cantidad de errores: '+results[i].cant_errores_reg+' seg/reg</div>'
                        +'<div class="small">Tiempo de ejecucion: '+results[i].tiempo_min_reg+' min</div>'
                        +'</div>'
                        +'</li>'
                    })
                }
            });
        }catch(e){
            console.log(e);//err.guardarError(null,sql,"",error,socket)
        }
    }

    guardarRegistro(load,poblado,sigacela,nogacela,fechaInicio,fechaFin,datopromedio,datotrabajo,datoerrores){
        if(datopromedio=='Infinity'){
            datopromedio=0;
        }
        let sql = `INSERT INTO registro (cargados_reg,poblados_reg,no_gacela_reg,si_gacela_reg,fecha_inicio_reg,fecha_fin_reg,promedio_reg,tiempo_min_reg,cant_errores_reg)`
        +` VALUES (${load},${poblado},${nogacela},${sigacela},'${fechaInicio}','${fechaFin}',${datopromedio},${datotrabajo},${datoerrores})`
        this.con.query(sql,(error, results, fields)=>{
            if (error){
                console.log(error)
            } else if(results.affectedRows==0){
                console.log("No se insertaron los datos del registro",results);
            }else{
                console.log("Datos de la ejecucion guardados en la base de datos")
            }
        });
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
module.exports = ErrorManager;

