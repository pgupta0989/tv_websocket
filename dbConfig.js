const sql = require("mssql");
var request;
// config for your database
const config = {
    user: 'MONETA_X_DB',
    password: 'Montexa@321',
    server: 'SG2NWPLS14SQL-v09.shr.prod.sin2.secureserver.net', 
    database: 'MONETA_X_DB', 
    synchronize: true,
    trustServerCertificate: true,
  };

  function dbConnect() {
    sql.connect(config, function (err) { 
        console.log('DB Connected');   
        if (err) console.log(err);
        // create Request object
        request = new sql.Request(); 
    });
  }

  module.exports = {request, dbConnect}