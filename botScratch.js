const puppeteer = require('puppeteer-extra');
const cheerio = require('cheerio');
const Gacela = require('./Gacela');
let date = require('date-and-time');
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const { Console } = require('console');
puppeteer.use(pluginStealth());


class botScrach {

    constructor() {
        this.delay = async (s) => {
            return new Promise(resolve => setTimeout(resolve, s * 1000));
        }
        this.count = 0;
        this.count2 = 0;
        this.poblados = 0;
        this.aux = 0;
        this.handlerInterval = null;
        this.dateInit = "No iniciado";
        this.datefinish = null;
        this.siGacela = 0;
        this.noGacela = 0;
        this.totalRegister = 0;
        this.porPoblar = 0;
        this.active = false;
        this.minutes = 0;
        this.promedio = 0;
        this.finish = false;
    }

    resetValues() {
        this.count = 0;
        this.count2 = 0;
        this.poblados = 0;
        this.aux = 0;
        this.dateInit = "No iniciado";
        this.datefinish = null;
        this.siGacela = 0;
        this.noGacela = 0;
        this.totalRegister = 0;
        this.porPoblar = 0;
        this.active = false;
        this.minutes = 0;
        this.promedio = 0;
    }

    iniciarContador(err, socket) {
        let now = new Date();
        this.dateInit = date.format(now, 'YYYY/MM/DD HH:mm:ss');
        socket.emit("datoInicio", this.dateInit);
        var _this = this;
        this.handlerInterval = setInterval(() => {
            _this.count++;
            if (_this.count - _this.aux == 90000) {
                err.guardarError(null, null, null, { message: "el tiempo de espera de respuesta de la pagina tardo mas de un minuto y medio" }, socket)
            }
        }, 1);
    }

    async iniciarSesion(page, user , pass) {
        try {
            console.log("iniciando sesion");
            await page.goto('https://certificados.supernotariado.gov.co/certificado');
           // console.log("Cargo la pagina en: "+this.count+" ms");
            this.aux = this.count;
            console.log("dsdsd")
            await page.click(".btnInicio");
            console.log("dsdsd")
           
            await this.delay(3);
            await page.type('#formLogin > table > tbody > tr > td > input[type="text"]', user);
            await this.delay(3);
            await page.type('#formLogin > table > tbody > tr > td > input[type="password"]', pass);
         //   await page.click('input[type="password"]');
            await page.click("#formLogin > div > table > tbody > tr > td > button[type='submit']");
            
         
            //console.log("dio click en el loging en: "+Number(this.count-this.aux)+" ms");
           this.aux = this.count;
        } catch (e) {
           // console.log(e.stack)
            //guardar error ,hacer ping a gacela, si es false hacer alive de internet, si es alive continuar con el ping a gacela, cuando sea alive detener la ejecucion del ping e intentar realizar nuevamente la consulta, intentar 3 veces. sino no iniciar el bot hasta que se haga manualmente, si lo logra colocar como corregido.
        }
    }

    desactivateBot() {
        this.active = false;
    }

    async buscarPlacas(arr, g, err, socket, restart) {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        this.active = true;
        if (!restart) {
            this.iniciarContador(err, socket);
        }
        try {
            await this.delay(1)
           // await this.iniciarSesion(page, 'NI9008213161','BIrE3Ix@h*wX');
            await this.iniciarSesion(page, 'CC100063127','NovusLegal2022');
            await this.delay(5);
           // await page.click(".vehiculo a");
           await this.delay(2);
           console.log("Inicio la busqueda en: " + Number(this.count - this.aux) + " ms");
           this.aux = this.count;
           this.totalRegister = arr.length;
           this.porPoblar = arr.length;
            socket.emit("totalP", this.totalRegister);
            socket.emit("cantidadP", this.porPoblar);
            console.log(arr.length)
            await this.buscarCadaPlaca(page, arr.length, g, err, socket);
            let now = new Date();
            this.datefinish = date.format(now, 'YYYY/MM/DD HH:mm:ss');
            let second = date.subtract(date.parse(this.datefinish, 'YYYY/MM/DD HH:mm:ss'), date.parse(this.dateInit, 'YYYY/MM/DD HH:mm:ss')).toSeconds();
            this.promedio = (second / this.poblados)
            this.minutes = date.subtract(date.parse(this.datefinish, 'YYYY/MM/DD HH:mm:ss'), date.parse(this.dateInit, 'YYYY/MM/DD HH:mm:ss')).toMinutes();
            console.log("Bot finalizado");
            if (arr.length == 0) {
                socket.emit('activarApagado', false);
                clearInterval(this.handlerInterval);
                socket.emit("reset", true);
                this.resetValues();
                await browser.close();
                await err.guardarRegistro(this.totalRegister, this.poblados, this.siGacela, this.noGacela, this.dateInit, this.datefinish, this.promedio, this.minutes, err.cantErrores)
                process.exit(0);
            }
        } catch (e) {
            err.guardarError(page, null, null, e, socket);
            //guardar error ,hacer ping a gacela, si es false hacer alive de internet, si es alive continuar con el ping a gacela, cuando sea alive detener la ejecucion del ping e intentar realizar nuevamente la consulta, intentar 3 veces. sino no iniciar el bot hasta que se haga manualmente, si lo logra colocar como corregido.
        }
    }

    async buscarCadaPlaca(page, length, g, err, socket) {
        while (length >= 1) {
            if (this.active) {
                try {
                 
                    console.log('LLEGUE')
                    console.log("one_reg[0].length");
                    let one_reg = await g.consultarUnNulo(g, err, socket);
                    console.log(one_reg[0].numMatricula);
                    console.log(one_reg[0].codigo);
                    let r = await this.result(page, one_reg[0].numMatricula.toString(),one_reg[0].codigo.toString() , length , err, socket, g);
                    console.log("r")
                    console.log(r)
                
                    if (r != false) {
                        g.actualizar_placas(one_reg[0].placagacela, r.codigofasecolda, r.aseguradora, r.fechaVencimiento, r.vigente, r.marca, r.modelo, r.tipo, r.cedula, page, err, socket);
                        //console.log("Dio esta respuesta en : "+Number(this.count-this.aux)+" ms");
                        this.poblados++;
                        await this.demo(2000,1200);
                        //this.porPoblar--;
                        socket.emit("totalPoblado", this.poblados);
                        //socket.emit("cantidadP", this.porPoblar);
                        let now = new Date();
                        this.datefinish = date.format(now, 'YYYY/MM/DD HH:mm:ss');
                        let second = date.subtract(date.parse(this.datefinish, 'YYYY/MM/DD HH:mm:ss'), date.parse(this.dateInit, 'YYYY/MM/DD HH:mm:ss')).toSeconds();
                        this.minutes = date.subtract(date.parse(this.datefinish, 'YYYY/MM/DD HH:mm:ss'), date.parse(this.dateInit, 'YYYY/MM/DD HH:mm:ss')).toMinutes();
                        this.promedio = (second / this.poblados);
                        socket.emit("datoPromedio", this.promedio.toFixed(2) + " seg/reg");
                        socket.emit("datoTrabajo", this.minutes + " minutos");
                        socket.emit("tiempoTomado", (this.count - this.aux) / 1000);
                        //console.log("Fecha de inicio: " + this.dateInit + ", fecha de fin: " + this.datefinish + ", Cantidad de registros: " + this.poblados + ", promedio de tiempo por cada registro: " + this.promedio + " seg, Ultima Placa actualizada: " + one_reg[0].placagacela + ", proceso hecho en " + this.minutes + " minutos");
                        this.aux = this.count;
                        await this.refrescarTexto(page, '#placa', 12);
                        length = await g.countNull(socket, err);
                    }else{

                        //process.exit(0);
                    }
                } catch (e) {
                    err.guardarError(page, null, one_reg[0].placagacela, e, socket);
                    //guardar error ,hacer ping a gacela, si es false hacer alive de internet, si es alive continuar con el ping a gacela, cuando sea alive detener la ejecucion del ping e intentar realizar nuevamente la consulta, intentar 3 veces. sino no iniciar el bot hasta que se haga manualmente, si lo logra colocar como corregido.
                }
            } else {
                break;
            }
        }
    }

    async buscarUnaPlaca(page, arr, g, err, socket) {
        for (let i in arr) {
            if (this.active) {
                try {
                    let r = await this.result(page, arr[i].placagacela, err, socket,g);

                    if (r != false) {
                        g.actualizar_placas(arr[i].placagacela, r.codigofasecolda, r.aseguradora, r.fechaVencimiento, r.vigente, r.marca, r.modelo, r.tipo, r.cedula, page, err, socket);
                        //console.log("Dio esta respuesta en : "+Number(this.count-this.aux)+" ms");
                        this.poblados++;
                        this.porPoblar--;
                        socket.emit("totalPoblado", this.poblados);
                        //socket.emit("cantidadP", this.porPoblar);
                        let now = new Date();
                        this.datefinish = date.format(now, 'YYYY/MM/DD HH:mm:ss');
                        let second = date.subtract(date.parse(this.datefinish, 'YYYY/MM/DD HH:mm:ss'), date.parse(this.dateInit, 'YYYY/MM/DD HH:mm:ss')).toSeconds();
                        this.minutes = date.subtract(date.parse(this.datefinish, 'YYYY/MM/DD HH:mm:ss'), date.parse(this.dateInit, 'YYYY/MM/DD HH:mm:ss')).toMinutes();
                        this.promedio = (second / this.poblados);
                        socket.emit("datoPromedio", this.promedio.toFixed(2) + " seg/reg");
                        socket.emit("datoTrabajo", this.minutes + " minutos");
                        socket.emit("tiempoTomado", (this.count - this.aux) / 1000);
                        //console.log("Fecha de inicio: " + this.dateInit + ", fecha de fin: " + this.datefinish + ", Cantidad de registros: " + this.poblados + ", promedio de tiempo por cada registro: " + this.promedio + " seg, Ultima Placa actualizada: " + arr[i].placagacela + ", proceso hecho en " + this.minutes + " minutos");
                        this.aux = this.count;
                        await this.refrescarTexto(page, '#placa', 12);
                    }
                } catch (e) {
                    err.guardarError(page, null, arr[i].placagacela, e, socket);
                    //guardar error ,hacer ping a gacela, si es false hacer alive de internet, si es alive continuar con el ping a gacela, cuando sea alive detener la ejecucion del ping e intentar realizar nuevamente la consulta, intentar 3 veces. sino no iniciar el bot hasta que se haga manualmente, si lo logra colocar como corregido.
                }
            } else {
                break;
            }
        }
    }
    async result2(page, numMatricula,length, err, socket,g) {
        try {
            console.log("asñp")
            this.count2++;
            await page.goto('https://certificados.supernotariado.gov.co/certificado/portal/business/transaction-result.snr');
            await this.delay(3);
            let html = await page.$eval('body', e => e.outerHTML);
            let $ = cheerio.load(html);
            await this.delay(13);    
            //deSacarga de ceRtifIcadO libertad  y tradicion     
            const fs = require('fs');  
            //     console.log("sfsdfsdfsdfsdf descargar recibO sfsdfsdfsdfsdf");
            //     await page.click("#formTransactionResult >div >table > tbody >tr >td >button");
            //     await this.delay(10);
            //     getCurrentFilenames();
           
            // fs.readFileSync("C:/Users/Mary.ariza/Downloads/recibo.pdf", "utf8");
            // try {
            //     fs.copyFile('C:/Users/Mary.ariza/Downloads/recibo.pdf', 'C:/xampp/htdocs/legal/recibo/recibo.pdf', (err) => {
            //         if (err) {
            //           console.log("Error Found:", err);
            //         }
            //         else {
            //             getCurrentFilenames();
            //             fs.readFileSync("C:/Users/Mary.ariza/Downloads/recibo.pdf", "utf8");
            //             fs.renameSync('C:/xampp/htdocs/legal/recibo/recibo.pdf', 'C:/xampp/htdocs/legal/recibo/'+numMatricula+'.pdf');
            //             fs.unlink("C:/Users/Mary.ariza/Downloads/recibo.pdf", (err => {
            //                 if (err) console.log(err);
            //             }));
            //         }
            //     });
            // }catch {
            //     console.log(err);
            // }

            function getCurrentFilenames() {
                console.log("\nCurrent filenames:");
                fs.readdirSync("C:/Users/Mary.ariza/Downloads/").forEach(file => {
                    console.log(file);
                });
            }

            await this.delay(30);
            console.log("sfsdfsdfsdfsdf descargar todos sfsdfsdfsdfsdf");
            await page.click("#formTransactionResult > div >table >tbody >tr > td:nth-child(2) >button");
          
            const texto = await page.evaluate(() => document.querySelector('#formTransactionResult > div >div:nth-child(1) >div >table > tbody > tr:nth-child(1) >td:nth-child(2) > span').innerText);
            console.log(texto);
      
            //await page.click("#formHistory >div >div >div >table >tbody >tr >td:nth-child(10) >a"); 
            await this.delay(10);
            //let direccion ="C:/xampp/htdocs/legal/libertad-tradicion/"+numMatricula+".zip";// 'midudev'
            let direccion ="C:/xampp/htdocs/legal/libertad-tradicion/"+numMatricula+".zip";// 'midudev'
            g.updateU(g,direccion,numMatricula,socket, err);
            getCurrentFilenames();
            fs.readFileSync("C:/Users/Mary.ariza/Downloads/comprimidoCertificadosTransaccionnull.zip", "utf8");
            try {
                fs.copyFile('C:/Users/Mary.ariza/Downloads/comprimidoCertificadosTransaccionnull.zip', 'C:/xampp/htdocs/legal/libertad-tradicion/'+numMatricula+'.zip', (err) => {
                    if (err) {
                    console.log("Error Found:", err);
                    }
                    else {
                        getCurrentFilenames();
                        fs.readFileSync("C:/Users/Mary.ariza/Downloads/comprimidoCertificadosTransaccionnull.zip", "utf8");
                        fs.unlink("C:/Users/Mary.ariza/Downloads/comprimidoCertificadosTransaccionnull.zip", (err => {
                            if (err) console.log(err);
                        }));
                    }
                });
            }catch {
                console.log(err);
            }
          
            //await page.type("input[name='formGeneracionCertificados:indiceMatricula']", '50N');
            await this.delay(5);
           // await page.click("body > div > div > ul > li[class='ui-selectonemenu-item ui-selectonemenu-list-item ui-corner-all ui-state-highlight']");
            await this.delay(3);
            console.log("estoy limpiando matricula")
            await page.click("input[name='formGeneracionCertificados:inpMatricula']", { clickCount: 2 });
            $("input[name='formGeneracionCertificados:inpMatricula']").val("");
            console.log("pase1")
            await this.delay(5);
            console.log("estoy llenando matricula")
            await page.type("input[name='formGeneracionCertificados:inpMatricula']", numMatricula);
            await this.delay(5);
            console.log("estoy acaptando los datos")
            console.log("modal");
            await page.click("#pageContent > form > div > div > div > button");
            await this.delay(15);
            console.log($('#modalDialog > div > span').text());
            console.log($('#modalDialog > div > span').text() == 'Error de validacion Matricula');
            if($('#modalDialog > div > span').text() == 'Error de validacion Matricula'){
                await this.delay(5);
                console.log("sfsdfsdfsdfsdf nError de validacion Matricula");
                await page.click('#frmClosePopup >button[id="frmClosePopup:closePopupButton"]');
                await this.delay(5);
                console.log("sfsdfsdfsdfsdf listo");
            }else{
                console.log("pase2");
                await this.delay(5);
                await page.click("#forgotPasswordForm > div > table >tbody >tr > td > button");  
                console.log("pase3");
                await this.delay(10);
                console.log("pase3");
                console.log($('#modalDialog > div > span').text());
                if($('#modalDialog > div > span').text() == 'Notificacion'){
                    
                    await this.delay(10);
                    console.log("pase 4");
                    await page.click("#frmClosePopup >button");
                    await this.delay(10);
                    await page.click("#forgotPasswordForm > div > table >tbody > tr > td:nth-child(2) > button");  
                    await this.delay(10);
                    console.log("sfsdfsdfsdfsdf Notificacion sfsdfsdfsdfsdf");
                    
                }
                if($('#modalDialog > div > span').text() == 'Matricula ya en carrito'){
                    console.log("pase matri");
                    await page.click("#frmClosePopup >button");
                    await this.delay(10);
                    await page.click("#forgotPasswordForm > div > table >tbody > tr > td:nth-child(2) > button");  
                    await this.delay(10);
                }
                
                console.log("sfsdfsdfsdfsdf Notificacion2 sfsdfsdfsdfsdf");
               
                await this.delay(10);
                console.log("sfsdfsdfsdfsdf Notificacion3 sfsdfsdfsdfsdf");
                await page.click("#carritoCompras > div > button:nth-of-type(2)");
                await this.delay(10);
                console.log("sfsdfsdfsdfsdf Notificacion4 sfsdfsdfsdfsdf");
                await page.click("#confirmationDialog> div:nth-of-type(3) > div > button");
                let transaccion = this.getData($);
                await this.delay(10);
                console.log("sfsdfsdfsdfsdf Notificacion5 sfsdfsdfsdfsdf");
                await page.click("#divMainPayment > div:nth-child(2) > a >div");
                await this.delay(10);
                console.log("sfsdfsdfsdfsdf Notificacion sfsdfsdfsdfsdf");
                await page.click("#formModalInformacionPago >div > table >tbody >tr:nth-child(3) >td:nth-child(2) >span");
                
                await this.delay(10);
                console.log("sfsdfsdfsdfsdf Notificacion sfsdfsdfsdfsdf");
                await page.click("#formModalInformacionPago >div > table >tbody > tr >td >button");
                await this.delay(40);
                console.log("sfsdfsdfsdfsdf Notificacion sfsdfsdfsdfsdf");
                await page.click("#frmClosePopup >button");
                await this.delay(10);
                console.log("sfsdfsdfsdfsdf descargar recibO sfsdfsdfsdfsdf");
                await page.click("#formTransactionResult >div >table > tbody >tr >td >button");
                await this.delay(10);
                console.log("sfsdfsdfsdfsdf descargar todos sfsdfsdfsdfsdf");
                await page.click("#formTransactionResult >div >table > tbody >tr >td:nth-child(2) >button");

                //let clase = this.llenarData($, 1 , '0101');
                //&& vigente != "" 
                // if (transaccion != "" ) {
                //     await page.click(" #externo");
                //     await this.delay(2);
                //     let c = await page.$eval('#documento', async (input, value) => {
                //         return await input.value;
                //     }, "");
                //     this.siGacela++;
                //     socket.emit("siGacela", this.siGacela)
                //     console.log("Registro con datos");
                //     return {
                //         codigofasecolda: codigofasecolda,
                //         aseguradora: aseguradora,
                //         vigente: vigente,
                //         fechaVencimiento: fechaVencimiento,
                //         modelo: modelo,
                //         marca: marca,
                //         tipo: tipo,
                //         cedula: c
                //     }
                // } else {
                //     this.noGacela++;
                //     socket.emit("noGacela", this.noGacela)
                //     console.log("Registro sin datos");
                //     return {
                //         codigofasecolda: 0,
                //         aseguradora: "GACELA",
                //         fechaVencimiento: "01-01-0001",
                //         vigente: "GACELA",
                //         marca: "GACELA",
                //         modelo: "GACELA",
                //         tipo: "GACELA",
                //         cedula: "0000"
    
                //     }
                // }
                
            }
           
            
        } catch (e) {
            await err.guardarError(page, null, placa, e, socket);
        }
        return false;
    }

    async result(page, numMatricula,codigo, length, err, socket,g) {
        try {
            this.count2++;
            await page.goto('https://certificados.supernotariado.gov.co/certificado/portal/business/generate.snr');
            await this.delay(3);
            let html = await page.$eval('body', e => e.outerHTML);
            let $ = cheerio.load(html);
            $("input[name='formGeneracionCertificados:inpMatricula']").val("");
            await this.delay(3);
            await page.click("input[name='formGeneracionCertificados:indiceMatricula']", { clickCount: 2 });
            await page.type("input[name='formGeneracionCertificados:indiceMatricula']", codigo );
            await this.delay(5);
           // await page.click("body > div > div > ul > li[class='ui-selectonemenu-item ui-selectonemenu-list-item ui-corner-all ui-state-highlight']");
            await this.delay(3);
            console.log("estoy limpiando matricula")
            await page.click("input[name='formGeneracionCertificados:inpMatricula']", { clickCount: 2 });
            $("input[name='formGeneracionCertificados:inpMatricula']").val("");
            console.log("pase1")
            await this.delay(5);
            console.log("estoy llenando matricula")
            await page.type("input[name='formGeneracionCertificados:inpMatricula']", numMatricula);
            await this.delay(5);
            console.log("estoy acaptando los datos")
            await page.click("#pageContent > form > div > div > div > button");
            await this.delay(15);
            console.log("modal")
            //leo si hay modal
            
            const texto = await page.evaluate(() => document.querySelector('#modalDialog > div > span').innerText);
            console.log(texto);
      

            if(texto == 'Error de validacion Matricula'){
                await this.delay(5);
               // console.log("sfsdfsdfsdfsdf nError de validacion Matricula");
                await page.click('#frmClosePopup >button[id="frmClosePopup:closePopupButton"]');
                await this.delay(5);
                var error  =   g.errrorRegistro(numMatricula, 'MATRICULA O CODIGO NO VALIDA');
                console.log("sfsdfsdfsdfsdf listo"+ error);
                    
            }else{

                console.log("pase2");
                await this.delay(5);
                await page.click("#forgotPasswordForm > div > table >tbody >tr > td > button");  
                console.log("pase3");
                await this.delay(10);
                console.log("pase3");
                const texto = await page.evaluate(() => document.querySelector('#modalDialog > div > span').innerText);
                console.log(texto);
                // if(texto == 'Notificacion'){
                    
                //     await this.delay(10);
                //     console.log("pase 4");
                //     await page.click("#frmClosePopup >button");
                //     await this.delay(10);
                //     await page.click("#forgotPasswordForm > div > table >tbody > tr > td:nth-child(2) > button");  
                //     await this.delay(10);
                //     console.log("sfsdfsdfsdfsdf Notificacion1 sfsdfsdfsdfsdf");
                    
                // }
                if(texto == 'Error Validacion'){
                    
                    console.log("pase 4 WJSHDHDAWJHD");
                    await this.delay(10);
                    console.log("pase 4");
                    await page.click("#frmClosePopup >button");
                    await this.delay(10);
                    await page.click("#forgotPasswordForm > div > table >tbody > tr > td:nth-child(2) > button");  
                    await this.delay(10);
                    console.log("sfsdfsdfsdfsdf Notificacion1 sfsdfsdfsdfsdf");
                    var error  =   g.errrorRegistro(numMatricula, 'MATRICULA EN OTRO PROCESO');
                  
                    await this.buscarCadaPlaca(page, arr.length, g, err, socket);
                    
                }
                if(texto == 'Matricula ya en carrito'){
                    console.log("pase matri");
                    await page.click("#frmClosePopup >button");
                    await this.delay(10);
                    await page.click("#forgotPasswordForm > div > table >tbody > tr > td:nth-child(2) > button");  
                    await this.delay(10);
                }
                
                console.log("sfsdfsdfsdfsdf Notificacion2 sfsdfsdfsdfsdf");
                if($('#frmClosePopup >button').length == 0){
                    
                    process.exit(0);
                }else{
                    await page.click("#frmClosePopup >button");
                }
                    
                //await page.click("#frmClosePopup >button");
                await this.delay(10);
                console.log("sfsdfsdfsdfsdf Notificacion3 sfsdfsdfsdfsdf");
                await page.click("#carritoCompras > div > button:nth-of-type(2)");
                await this.delay(10);
                console.log("sfsdfsdfsdfsdf Notificacion4 sfsdfsdfsdfsdf");
                await page.click("#confirmationDialog> div:nth-of-type(3) > div > button");
                let transaccion = this.getData($);
                await this.delay(10);
                console.log("sfsdfsdfsdfsdf Notificacion sfsdfsdfsdfsdf");
                await page.click("#divMainPayment > div:nth-child(2) > a >div");
                await this.delay(10);
                console.log("pilas acasfsdfsdfsdfsdf Notificacion llesfsdfsdfsdfsdf");
                const valor = await page.evaluate(() => document.querySelector('#formModalInformacionPago >div > table >tbody >tr:nth-child(3) >td:nth-child(2) >span').innerText);
                console.log(valor);
                //var expresionRegular = /\s*.\s*/;
                var listaNombres = valor.split(",");
                 listaNombres = listaNombres[0].replace('.', '')
                console.log(listaNombres);
                await this.delay(10);
                console.log("sfsdfsdfsdfsdf Notificacion sfsdfsdfsdfsdf");
               // await page.click("#formModalInformacionPago >div > table >tbody > tr >td >button");
                await this.delay(10);
                const errortran = await page.evaluate(() => document.querySelector('#modalDialog_title').innerText);
                console.log(errortran);
                if (errortran == 'Error de Transaccion'){
                    var error  =   g.errrorRegistro(numMatricula, 'ERROR DE TRANSACCION');
                }
                console.log("sfsdfsdfsdfsdf Notificacion sfsdfsdfsdfsdf");
                await page.click("#frmClosePopup >button");
                await this.delay(10);
                const fs = require('fs');  
                console.log("sfsdfsdfsdfsdf descargar recibO sfsdfsdfsdfsdf");
                await page.click("#formTransactionResult >div >table > tbody >tr >td >button");
                await this.delay(10);
                getCurrentFilenames();
                fs.readFileSync("C:/Users/Mary.ariza/Downloads/recibo.pdf", "utf8");
                try {
                    fs.copyFile('C:/Users/Mary.ariza/Downloads/recibo.pdf', 'C:/xampp/htdocs/legal/recibo/recibo.pdf', (err) => {
                        if (err) {
                          console.log("Error Found:", err);
                        }
                        else {
                            getCurrentFilenames();
                            fs.readFileSync("C:/Users/Mary.ariza/Downloads/recibo.pdf", "utf8");
                            fs.renameSync('C:/xampp/htdocs/legal/recibo/recibo.pdf', 'C:/xampp/htdocs/legal/recibo/'+numMatricula+'.pdf');
                            fs.unlink("C:/Users/Mary.ariza/Downloads/recibo.pdf", (err => {
                                if (err) console.log(err);
                            }));
                        }
                    });
                }catch {
                    console.log(err);
                }
    
                function getCurrentFilenames() {
                    console.log("\nCurrent filenames:");
                    fs.readdirSync("C:/Users/Mary.ariza/Downloads/").forEach(file => {
                        console.log(file);
                    });
                }
    
                await this.delay(10);
                console.log("sfsdfsdfsdfsdf descargar todos sfsdfsdfsdfsdf");
                await page.click("#formTransactionResult > div >table >tbody >tr > td:nth-child(2) >button");
                //await page.click("#formHistory >div >div >div >table >tbody >tr >td:nth-child(10) >a"); 
                const codTransac = await page.evaluate(() => document.querySelector('#formTransactionResult > div >div:nth-child(1) >div >table > tbody > tr:nth-child(1) >td:nth-child(2) > span').innerText);
                console.log(codTransac);
          
                await this.delay(10);
                let direccion ="C:/xampp/htdocs/legallibertad-tradicion/"+numMatricula+".zip";// 'midudev'
                g.updateU(g,direccion,numMatricula,listaNombres,socket, err);
                getCurrentFilenames();
                fs.readFileSync("C:/Users/Mary.ariza/Downloads/comprimidoCertificadosTransaccion"+codTransac+".zip", "utf8");
                try {
                    fs.copyFile('C:/Users/Mary.ariza/Downloads/comprimidoCertificadosTransaccion'+codTransac+'.zip', 'C:/xampp/htdocs/legal/libertad-tradicion/comprimidoCertificadosTransaccion'+codTransac+'.zip', (err) => {
                        if (err) {
                        console.log("Error Found:", err);
                        }
                        else {
                            getCurrentFilenames();
                            fs.readFileSync("C:/Users/Mary.ariza/Downloads/comprimidoCertificadosTransaccion"+codTransac+".zip", "utf8");
                            fs.renameSync('C:/xampp/htdocs/legallibertad-tradicion/comprimidoCertificadosTransaccion'+codTransac+'.zip', 'C:/xampp/htdocs/legal/libertad-tradicion/'+numMatricula+'.zip');
                            fs.unlink("C:/Users/Mary.ariza/Downloads/comprimidoCertificadosTransaccion"+codTransac+".zip", (err => {
                                if (err) console.log(err);
                            }));
                        }
                    });
                }catch {
                    console.log(err);
                }
              
                
            }
           
            
        } catch (e) {
            await err.guardarError(page, null, placa, e, socket);
        }
        return false;
    }

    async demo(max,min) {
        console.log('Taking a break...');
        var a = '100';
        await this.delay(a);
        console.log(a);
    }
    async refrescarTexto(page, selector, it) {
        try {
            console.log("hola");
           
            await page.goto('https://consultas.laequidadseguros.coop:8081/gacelaplusF/sisa/resultados');

            await this.delay(5);

            let texto = await page.$eval('#externo', e => e.text);
            if (texto == "Realizar esta consulta con SISA") {
                await page.click("#externo");
            }
            await page.type(selector, '');
            for (let i = 0; i < it; i++) {
                await page.keyboard.press('Backspace');
            }
            return true;
        } catch (e) {
            return false;
        }

    }

    evaluarTope(str) {
        if (str.indexOf(" TP ") != -1) {
            return this.quitarExcedente(str, / TP /) + " TP";
        } else if (str.indexOf(" AT ") != -1) {
            return this.quitarExcedente(str, / AT /) + " AT";
        } else if (str.indexOf(" PT ") != -1) {
            return this.quitarExcedente(str, / PT /) + " PT";
        } if (str.indexOf(" MT ") != -1) {
            return this.quitarExcedente(str, / MT /) + " MT";
        } else {
            return str;
        }
    }

    quitarExcedente(str, exp) {
        let a = str.split(exp);
        return a[0];
    }

    quitarTabs(a) {
        let exp = /([\ \t]+(?=[\ \t])|^\s+|\s+$)/g;
        let result = "";
        if (a != undefined) {
            result = (a.children != undefined) ? (a.children[0] != undefined) ? a.children[0].data.replace(exp, "") : "" : "";
        }
        return result;
    }

    llenarData($,index,valor){
        let a = $("input[class='MuiOutlinedInput-input MuiInputBase-input MuiInputBase-inputAdornedStart css-kx05jp' type='text']");
        console.log(a )
        let validar = a.children[1];
        console.log(validar )
        return validar;
    }   


    
    getData($, index) {

        try{

            let a = $("#modalInformacionPago_title").text();
            return a

        }catch(e){
            //console.log(e.stack)
            return false;
        }
        
    }


}

module.exports = botScrach;

