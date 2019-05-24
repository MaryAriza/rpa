const Gacela = require("./Gacela");
const Error_manager = require('./errorManager');
let g = new Gacela;
let e = new Error_manager;
try{
    
    g.consultarNulos(g,e);
}catch(er){
    e.guardarError(null,null,null,er);
}




 
