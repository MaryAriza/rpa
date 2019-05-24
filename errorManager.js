
const Conection = require("./Conecction");
const isOnline = require('is-online'); //para comprobar internet
const ping = require('ping');//para hacerle ping al servidor
const connectionTester = require('connection-tester');//para comprobar coneccion con gacela
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
let date = require('date-and-time');

class ErrorManager{

    constructor(){
        this.coneccion = new Conection("localhost","root","25840504","registrosbot");
        this.con =this.coneccion.crearConeccion();
        this.cantErrores=0;
    }

    pingGacela(){
        return connectionTester.test('consultas.laequidadseguros.coop', 8081, 1000);
    }

    async pingServidor(){
        return ping.promise.probe("175.0.10.201");
    }

    async guardarError(page,sql,placa,err,socket){
        let now= new Date();
        let html=null;
        let urlCapture =null;

        if(page!=null){
            try{
                if(!page.isClosed()){
                    html = await page.$eval('body', e => e.outerHTML);
                    let fecha2 = date.format(now, 'YYYY-MM-DD-HH-mm-ss');
                    await page.screenshot({path: './view/img/capturas/'+fecha2+"-"+placa+'.png'});
                    urlCapture = fecha2+placa+'.png';
                }
            }catch(e){

            }
        }
        
        let ping_gacela = await this.pingGacela();
        let ping_serv = await this.pingServidor();//a.alive
        let ping_servidor = ping_serv.alive;
        let  ping_internet= await isOnline();
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
            +ping_servidor+","
            +ping_internet+","
            +"CURDATE())";
            let _this=this;
            this.con.query(query,(error, results, fields)=>{
                if (error){
                    console.log(error)
                } else if(results.affectedRows==0){
                    console.log("No se actualizaron los datos del error",results);
                }else{
                    _this.cantErrores++;
                    socket.emit("datoErrores",_this.cantErrores);
                    console.log("hubo un error");
                }
            });

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

