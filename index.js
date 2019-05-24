
const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const http = require('http');
const app = express()//instancia de express
const server = http.createServer(app)//creando el server con http y express como handle request
const io = socketio(server)//iniciando el server de socket.io
const PORT = process.env.PORT || 3000

//corriendo el servidor
server.listen(PORT, () => {
  console.log(`Server running in http://localhost:${PORT}`)
})

app.use(express.static(path.join(__dirname, 'view')))
const Gacela = require("./Gacela");
const Error_manager = require('./errorManager');
let g = new Gacela;
let e = new Error_manager;
//escuchando el evento connection
io.on('connection', function(socket){
      socket.on('activar', function(num){
        try{
          if(!g.bot.active){
            console.log("Iniciando Bot...")
            g.bot.active=true;
            io.emit('activarApagado', true);
            g.consultarNulos(g,e,io);
          }
        }catch(er){
            e.guardarError(null,null,null,er);
        }
      })

    
    socket.on('initializate', function(data){
        socket.emit('initializate',{
          active:g.bot.active,
          totalReg:g.bot.totalRegister,
          poblados:g.bot.poblados,
          gacela:g.bot.siGacela,
          nogacela:g.bot.noGacela,
          errores:e.cantErrores,
          fechaInicio:g.bot.dateInit,
          trabajo:g.bot.minutes+" minutos",
          promedio:g.bot.promedio.toFixed(2)+" seg/reg"
        })
    });
    
    

    socket.on('desactivar', function(num){
      try{
          if(g.bot.active){
            console.log("Desactivando Bot...")
            g.apagarGacelaBot();
          }
      }catch(er){
          e.guardarError(null,null,null,er);
      }
    })
})
 
console.log("Servidor Express escuchando en modo %s", app.settings.env);
 
