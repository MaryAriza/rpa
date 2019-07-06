const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const Gacela = require('./Gacela');
let date = require('date-and-time');

class botScrach {

    constructor (){
        this.delay = async (s) => {
                return new Promise(resolve => setTimeout(resolve, s * 1000));
            }
        this.count = 0;
        this.count2=0;
        this.poblados=0;
        this.aux = 0;
        this.handlerInterval=null;
        this.dateInit="No iniciado";
        this.datefinish=null;
        this.siGacela=0;
        this.noGacela=0;
        this.totalRegister=0;
        this.porPoblar=0;
        this.active=false;
        this.minutes=0;
        this.promedio=0;
        this.finish=false;
    }

    resetValues(){
        this.count = 0;
        this.count2=0;
        this.poblados=0;
        this.aux = 0;
        this.dateInit="No iniciado";
        this.datefinish=null;
        this.siGacela=0;
        this.noGacela=0;
        this.totalRegister=0;
        this.porPoblar=0;
        this.active=false;
        this.minutes=0;
        this.promedio=0;
    }

    iniciarContador(err,socket){
        let now= new Date();
        this.dateInit  = date.format(now, 'YYYY/MM/DD HH:mm:ss');
        socket.emit("datoInicio",this.dateInit);
        var _this = this;
        this.handlerInterval = setInterval(()=>{
            _this.count++;
            if(_this.count -_this.aux == 90000){
                err.guardarError(null,null,null,{message:"el tiempo de espera de respuesta de la pagina tardo mas de un minuto y medio"},socket)
            }
        },1);
    }

    async iniciarSesion(page,user,pass){
        try{
            console.log("iniciando sesion");
            await page.goto('http://consultas.laequidadseguros.coop:8081/gacelaplusF/login/usuarios');
            //console.log("Cargo la pagina en: "+this.count+" ms");
            this.aux=this.count;
            await page.type('#usuario', user);
            await page.type('#pass', pass);
            await page.click("input[type='submit']");
            //console.log("dio click en el loging en: "+Number(this.count-this.aux)+" ms");
            this.aux=this.count;
        }catch(e){
            console.log(e.stack)
            //guardar error ,hacer ping a gacela, si es false hacer alive de internet, si es alive continuar con el ping a gacela, cuando sea alive detener la ejecucion del ping e intentar realizar nuevamente la consulta, intentar 3 veces. sino no iniciar el bot hasta que se haga manualmente, si lo logra colocar como corregido.
        }
    }

    desactivateBot(){
        this.active=false;
    }

    async buscarPlacas(arr,g,err,socket,restart){
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        this.active=true;
        if(!restart){
            this.iniciarContador(err,socket);
            
        }
        try{
            await this.delay(1)
            await this.iniciarSesion(page,'Fsamper','equidad2020*');
            await this.delay(5);
            await page.click(".vehiculo a");
            await this.delay(2);
            console.log("Inicio la busqueda en: "+Number(this.count-this.aux)+" ms");
            this.aux=this.count;
            this.totalRegister=arr.length;
            this.porPoblar=arr.length;
            socket.emit("totalP",this.totalRegister);
            socket.emit("cantidadP",this.porPoblar);
            await this.buscarCadaPlaca(page,arr.length,g,err,socket);
            let now= new Date();
            this.datefinish = date.format(now, 'YYYY/MM/DD HH:mm:ss');
            let second = date.subtract(date.parse(this.datefinish, 'YYYY/MM/DD HH:mm:ss'), date.parse(this.dateInit, 'YYYY/MM/DD HH:mm:ss')).toSeconds();
            this.promedio =(second/this.poblados)
            this.minutes = date.subtract(date.parse(this.datefinish, 'YYYY/MM/DD HH:mm:ss'), date.parse(this.dateInit, 'YYYY/MM/DD HH:mm:ss')).toMinutes();                                    
            console.log("Bot finalizado");
            if(this.finish){
                socket.emit('activarApagado', false);
                clearInterval(this.handlerInterval);
                socket.emit("reset",true);
                this.resetValues();
                await browser.close();
                await err.guardarRegistro(this.totalRegister,this.poblados,this.siGacela,this.noGacela,this.dateInit,this.datefinish,this.promedio,this.minutes,err.cantErrores)

            }
        }catch(e){
            err.guardarError(page,null,null,e,socket);
            //guardar error ,hacer ping a gacela, si es false hacer alive de internet, si es alive continuar con el ping a gacela, cuando sea alive detener la ejecucion del ping e intentar realizar nuevamente la consulta, intentar 3 veces. sino no iniciar el bot hasta que se haga manualmente, si lo logra colocar como corregido.
        }
    }

    async buscarCadaPlaca(page, length,g,err,socket){
        while(length>1){
            if(this.active){
                try{
                    let one_reg= await g.consultarUnNulo(g,err,socket);
                    let r= await this.result(page,one_reg[0].placagacela,err,socket);
                    if(r!=false){
                        g.actualizar_placas(one_reg[0].placagacela,r.aseguradora,r.fechaVencimiento,r.vigente,r.marca,r.modelo,r.tipo,r.cedula,page,err,socket);
                        //console.log("Dio esta respuesta en : "+Number(this.count-this.aux)+" ms");
                        this.poblados++;
                        this.porPoblar--;
                        socket.emit("totalPoblado",this.poblados);
                        socket.emit("cantidadP",this.porPoblar);
                        let now= new Date();
                        this.datefinish = date.format(now, 'YYYY/MM/DD HH:mm:ss');
                        let second = date.subtract(date.parse(this.datefinish, 'YYYY/MM/DD HH:mm:ss'), date.parse(this.dateInit, 'YYYY/MM/DD HH:mm:ss')).toSeconds();
                        this.minutes = date.subtract(date.parse(this.datefinish, 'YYYY/MM/DD HH:mm:ss'), date.parse(this.dateInit, 'YYYY/MM/DD HH:mm:ss')).toMinutes();                        
                        this.promedio =(second/this.poblados);
                        socket.emit("datoPromedio",this.promedio.toFixed(2)+" seg/reg");
                        socket.emit("datoTrabajo",this.minutes+" minutos");
                        socket.emit("tiempoTomado",(this.count-this.aux)/1000);
                        console.log("Fecha de inicio: "+this.dateInit+", fecha de fin: "+this.datefinish+", Cantidad de registros: "+this.poblados+", promedio de tiempo por cada registro: "+ this.promedio+" seg, Ultima Placa actualizada: "+one_reg[0].placagacela+", proceso hecho en "+this.minutes+" minutos");
                        this.aux=this.count;
                        await this.refrescarTexto(page,'#placa',12);
                        length=await g.countNull(socket,err);
                    }
                }catch(e){s
                    err.guardarError(page,null,one_reg[0].placagacela,e,socket);
                    //guardar error ,hacer ping a gacela, si es false hacer alive de internet, si es alive continuar con el ping a gacela, cuando sea alive detener la ejecucion del ping e intentar realizar nuevamente la consulta, intentar 3 veces. sino no iniciar el bot hasta que se haga manualmente, si lo logra colocar como corregido.
                }
            }else{
                break;
            }
        }
     }

    async buscarUnaPlaca(page, arr,g,err,socket){
        for ( let i in arr){
            if(this.active){
                try{
                    let r= await this.result(page,arr[i].placagacela,err,socket);

                    if(r!=false){
                        g.actualizar_placas(arr[i].placagacela,r.aseguradora,r.fechaVencimiento,r.vigente,r.marca,r.modelo,r.tipo,r.cedula,page,err,socket);
                        //console.log("Dio esta respuesta en : "+Number(this.count-this.aux)+" ms");
                        this.poblados++;
                        this.porPoblar--;
                        socket.emit("totalPoblado",this.poblados);
                        socket.emit("cantidadP",this.porPoblar);
                        let now= new Date();
                        this.datefinish = date.format(now, 'YYYY/MM/DD HH:mm:ss');
                        let second = date.subtract(date.parse(this.datefinish, 'YYYY/MM/DD HH:mm:ss'), date.parse(this.dateInit, 'YYYY/MM/DD HH:mm:ss')).toSeconds();
                        this.minutes = date.subtract(date.parse(this.datefinish, 'YYYY/MM/DD HH:mm:ss'), date.parse(this.dateInit, 'YYYY/MM/DD HH:mm:ss')).toMinutes();                        
                        this.promedio =(second/this.poblados);
                        socket.emit("datoPromedio",this.promedio.toFixed(2)+" seg/reg");
                        socket.emit("datoTrabajo",this.minutes+" minutos");
                        socket.emit("tiempoTomado",(this.count-this.aux)/1000);
                        console.log("Fecha de inicio: "+this.dateInit+", fecha de fin: "+this.datefinish+", Cantidad de registros: "+this.poblados+", promedio de tiempo por cada registro: "+ this.promedio+" seg, Ultima Placa actualizada: "+arr[i].placagacela+", proceso hecho en "+this.minutes+" minutos");
                        this.aux=this.count;
                        await this.refrescarTexto(page,'#placa',12);
                    }
                }catch(e){
                    err.guardarError(page,null,arr[i].placagacela,e,socket);
                    //guardar error ,hacer ping a gacela, si es false hacer alive de internet, si es alive continuar con el ping a gacela, cuando sea alive detener la ejecucion del ping e intentar realizar nuevamente la consulta, intentar 3 veces. sino no iniciar el bot hasta que se haga manualmente, si lo logra colocar como corregido.
                }
            }else{
                break;
            }
        }
    }
    async result(page,placa,err,socket){
        try{
            this.count2++;
            //console.log("consultando la placa: "+placa)
            await this.delay(3);
            await page.type('#placa', placa);
            await page.click("#consultar");
            await this.delay(5);
            let html = await page.$eval('body', e => e.outerHTML);
            let $ = cheerio.load(html);
            let a = $("#polizasVar tbody > tr td");
            let b = $(".w-table > table > caption:contains('Guía de valores')").parent("table").children("tbody"); 
            b= (b[0]==undefined||b[0].children[1]==undefined)?"":b[0].children[1].children;
            if(a!=undefined){
                let aseguradora= this.quitarTabs(a[1]);
                let vigente= this.quitarTabs(a[6]);
                let fechaVencimiento= this.quitarTabs(a[5]);
                let modelo= this.quitarTabs(b[7]);
                let marca=  this.quitarTabs(b[5]);
                let tipo=  this.evaluarTope(this.quitarTabs(b[11]));
                if(aseguradora!="" &&vigente!="" &&fechaVencimiento!="" &&modelo!="" &&marca!=""){
                    await page.click(" #externo");
                    await this.delay(2);
                    let c = await page.$eval('#documento', async (input,value) => {
                        return await input.value;
                    },"");
                    this.siGacela++;
                    socket.emit("siGacela",this.siGacela)
                    return {
                        aseguradora: aseguradora,
                        vigente: vigente,
                        fechaVencimiento: fechaVencimiento,
                        modelo: modelo,
                        marca: marca,
                        tipo: tipo,
                        cedula:c
                    }
                }else{
                    this.noGacela++;
                    socket.emit("noGacela",this.noGacela)
                    return {
                        aseguradora: "GACELA",
                        fechaVencimiento: "01-01-0001",
                        vigente: "GACELA",
                        marca:"GACELA",
                        modelo: "GACELA",
                        tipo: "GACELA",
                        cedula: "0000"
                        
                    }
                }
            }
            
        }catch(e){
            await err.guardarError(page,null,placa,e,socket);
        }
        return false;
    } 

    async refrescarTexto(page,selector,it){
        try{
            let texto = await page.$eval('#externo', e => e.text);
            if(texto=="Realizar esta consulta con SISA"){
                await page.click("#externo"); 
            }
            await page.type(selector,'');
            for(let i = 0;i<it;i++){
                await page.keyboard.press('Backspace');
            }
             return true;
        }catch(e){
            return false;
        }
        
    }

    evaluarTope(str){
        if(str.indexOf(" TP ") !=-1){
            return this.quitarExcedente(str,/ TP /)+ " TP";
        }else if(str.indexOf(" AT ") !=-1){
            return this.quitarExcedente(str,/ AT /) + " AT";
        }else if(str.indexOf(" PT ") !=-1){
           return this.quitarExcedente(str,/ PT /) + " PT"; 
        }if(str.indexOf(" MT ") !=-1){
            return this.quitarExcedente(str,/ MT /) + " MT"; 
        }else{
           return str;
        }
    }

    quitarExcedente(str,exp){
        let a = str.split(exp);
        return a[0];
    }

    quitarTabs(a){
        let exp= /([\ \t]+(?=[\ \t])|^\s+|\s+$)/g;
        let result="";
        if(a!=undefined){
             result= (a.children!=undefined)?(a.children[0]!=undefined)?a.children[0].data.replace(exp, ""):"":"";
        }
        return result;
    }
}

module.exports = botScrach;

