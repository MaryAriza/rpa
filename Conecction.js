const mysql = require('mysql');

class Conection{
    // constructor(){
    //   this.host = "175.0.10.201";
    //   this.user = "Architect01";
    //   this.password = "@DM1N1STR4D0R2016";
    //   this.dbname = "pobladores";
    //   this.conection = null
    // }

    constructor(host,user,password,dbname){
      this.host = host;
      this.user = user;
      this.password = password;
      this.dbname = dbname;
      this.conection = null
      this.interval = 0;
    }
      
    
    crearConeccion() {
      try{
        this.connection = mysql.createConnection({
          host     : this.host,
          user     : this.user,
          password : this.password,
          database : this.dbname
        });
        return this.connection;
      }catch(e){
        console.log(e.stack);
        return false;
      }   
    }
   
    conectar(){
      this.connection.connect();
    }
  
    desconectar(){
      this.connection.end();
    }
  }

module.exports = Conection;