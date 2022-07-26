const mysql = require('mysql');

var mysqlConnection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'ariba05',
    database : 'rentacar',
});

mysqlConnection.connect((err)=>{
    if(err)
    {
        console.log("Conneection Failed");
    }
    else if(!err)
    {
        console.log("Connected");
    }
});

module.exports = mysqlConnection;