
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

//escuchando el evento connection
io.on('connection', function(socket){
      const Gacela = require("./Gacela");
      const Error_manager = require('./errorManager');
      let g = new Gacela;
      let e = new Error_manager;
    socket.on('activar', function(num){
      try{
          console.log("Iniciando Bot...")
          g.consultarNulos(g,e,io);
      }catch(er){
          e.guardarError(null,null,null,er);
      }
    })

    
    // socket.on('initializate', function(data){
    //   socket.emit('initializate', 1);
    // });

    socket.on('desactivar', function(num){
      try{
          console.log("Desactivando Bot...")
          g.apagarGacelaBot();
      }catch(er){
          e.guardarError(null,null,null,er);
      }
    })
})
 
console.log("Servidor Express escuchando en modo %s", app.settings.env);
 
