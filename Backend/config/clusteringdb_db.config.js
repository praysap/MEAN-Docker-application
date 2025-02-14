const mysql = require('mysql');


const dbClust = mysql.createPool({
  connectionLimit : 5, //important
    host: process.env.DB_Host_Ews,
    user: process.env.DB_User,
     database: process.env.DB_Database_Clust,
     password: process.env.DB_Password_Ews,
     debug    :  false
});


module.exports = dbClust;

