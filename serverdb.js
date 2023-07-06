const express = require('express');
var app = express();

var sql = require("mssql");

// config for your database
var config = {
    user: 'MONETA_X_DB',
    password: 'Montexa@321',
    server: 'SG2NWPLS14SQL-v09.shr.prod.sin2.secureserver.net', 
    database: 'MONETA_X_DB', 
    synchronize: true,
    trustServerCertificate: true,
};

app.get('/search', function (req, res) {
    //var date      = new Date();
    //console.log(date.toJSON().split("T")[0]);
    var genTsDate = Date.now();
    var sec = new Date(genTsDate).setSeconds('00');
    cTs = sec/1000
    console.log(cTs)

    fromDate = req.query.fromTs * 1000;
    const d = new Date(fromDate);
    prevTs = d.setDate(d.getDate() - 1);
    const prevDate = new Date(prevTs);
    //console.log(prevDate);
    toDate = req.query.toTs * 1000;
    const toDts = new Date(toDate);
    //console.log('To : '+toDts);
    limit = req.query.limit;
    // connect to your database
    sql.connect(config, function (err) {    
        if (err) console.log(err);
        // create Request object
        var request = new sql.Request(); 
        var querySql = "Select (DATETOINT/1000) as 'time', CLOSEV as 'close', HIGHV as high," 
                     + " LOWV as low, OPENV as 'open', VOLUMEV as volume, 'force_direct' as conversionType,"
                     + " '' as conversionSymbol from COIN_RATE"
                     + " where DATETOINT between "+ fromDate + " and " + toDate
                     + " order by DATETOINT ASC offset 0 rows fetch next "+limit+" rows only"; 
        // query to the database and get the records
        request.query(querySql, function (err, recordset) {                    
            if (err) console.log(err)
            // recordset.recordset.push({
            //     "time": Math.floor(Date.now()/1000),
            //     "close": 1.7,
            //     "high": 2.4,
            //     "low": 1.5,
            //     "open": 1.6,
            //     "volume": 1500,
            //     "conversionType": "force_direct",
            //     "conversionSymbol": ""
            // })
            // send records as a response
            var suc = 'Error';
            var isFirstArr = false;
            if (recordset.recordset.length > 0) {
                suc = 'Success';
                isFirstArr = true;
            } 
            var response = {
                "Response": suc,
                "Type": 100,
                "Aggregated": false,
                "TimeTo": toDate,
                "TimeFrom": prevTs,
                "FirstValueInArray": isFirstArr,
                "ConversionType": {
                    "type": "force_direct",
                    "conversionSymbol": ""
                },
                "Data": recordset.recordset
            }
            //console.log(response)
            res.send(response);            
        });
    });
});

app.get('/', function (req, res) {
    console.log(req.query);    
    // connect to your database
    sql.connect(config, function (err) {    
        if (err) console.log(err);
        // create Request object
        var request = new sql.Request();           
        // query to the database and get the records
        request.query('select * from COIN_RATE', function (err, recordset) {            
            if (err) console.log(err)
            // send records as a response
            res.send(recordset);            
        });
    });
});

var server = app.listen(5000, function () {
    console.log('Server is running..');
});