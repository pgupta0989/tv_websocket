const express = require('express')
const app = express()
const https = require('https')
const { Server } = require('socket.io')
const cors = require('cors')
const sql = require('mssql')
const fs = require('fs');

const config = {
    user: 'MONETA_X_DB',
    password: 'Montexa@321',
    server: 'SG2NWPLS14SQL-v09.shr.prod.sin2.secureserver.net', 
    database: 'MONETA_X_DB', 
    synchronize: true,
    trustServerCertificate: true,
  };
  
  async function connect(){
    await sql.connect(config)
  }
  connect()
  app.use(cors())

//   app.use((req,res,next)=>{
//     res.setHeader('Access-Control-Allow-Origin','*');
//     res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE');
//     res.setHeader('Access-Control-Allow-Methods','Content-Type','Authorization');
//     next(); 
// })

  // Specify the paths to your SSL certificate and private key files
const sslOptions = {
  key: fs.readFileSync('./certificates/private.key'),
  cert: fs.readFileSync('./certificates/certificate.crt')
}

const server = https.createServer(sslOptions, app);

const io = new Server(server, {
  cors: {
    origin: "https://trading-view-chart-sigma.vercel.app/",
    methods: ['GET', 'POST']
  }
});

const clients = new Set();
var cTs ;
var subscribeCoin;
app.get('/', function (req, res) {
	res.send('Hello World');
});
app.get('/search', async function (req, res) {  
  fromDate = req.query.fromTs * 1000;
  //subscribeCoin = req.query.coin;
  const d = new Date(fromDate);
  prevTs = d.setDate(d.getDate() - 1);
  const prevDate = new Date(prevTs);
  //console.log(prevDate);
  toDate = req.query.toTs * 1000;
  const toDts = new Date(toDate);
  const toTss = toDts.setMinutes(toDts.getMinutes() - 2);
  //const toTss = new Date(toDts);
  //console.log('To : '+toDts);
  limit = req.query.limit;
  // connect to your database
  var querySql = "Select (DATETOINT/1000) as 'time', CLOSEV as 'close', HIGHV as high," 
                + " LOWV as low, OPENV as 'open', VOLUMEV as volume, 'force_direct' as conversionType,"
                + " '' as conversionSymbol from COIN_RATE"
                + " where DATETOINT >= "+ fromDate + 'and DATETOINT < ' + toTss
                //+ " and COIN = " + subscribeCoin
                //+ " where DATETOINT between "+ fromDate + " and " + toDate
                + " order by DATETOINT ASC offset 0 rows fetch next "+limit+" rows only"; 
  // query to the database and get the records
  const result = await sql.query(querySql)
  var suc = 'Error';
  var isFirstArr = false;
  if (result.recordset.length > 0) {
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
    "Data": result.recordset
  }
  //console.log(response)
  res.send(response);            
});

// Simulated live tracking data connect DB or fetch data from csv
const generateTradingData = async (socket) => {  
  var timeNow = Date.now();
  //console.log(cTs-timeNow);
  if (timeNow >= cTs) {
  var querySql = "Select (DATETOINT) as 'time', CLOSEV as 'close', HIGHV as high," 
                     + " LOWV as low, OPENV as 'open', VOLUMEV as volume, 'force_direct' as conversionType,"
                     + " '' as conversionSymbol from COIN_RATE"
                     + " where DATETOINT = "+ cTs
                     //+ " and COIN = " + subscribeCoin;
  const result = await sql.query(querySql)  
    if(result) {
      var tempTs = new Date(cTs);
      console.log('from if');
      cTs = tempTs.setMinutes(tempTs.getMinutes()+1);
      console.log(cTs);
      console.log(tempTs.toLocaleString());      
      return result.recordset[0]
    }
    // } else {
    //   //return 'nodata';
    //   return {
    //     "rawData" : "noData",
    //     "time": Date.now(),
    //     "close": Math.random() * 1 + 1,
    //     "high": Math.random() * 1.2,
    //     "low": Math.random() * 5,
    //     "open": Math.random() * 1.3 + 0.5,
    //     "volume": Math.random() * 0.8 + 10,
    //     "conversionType": "force_direct",
    //     "conversionSymbol": "noData"
    //   }; 
    //}
  } else {
    //return 'nodata';
    //console.log('from ielse');
    return {
      "rawData" : "noData",
      "time": Date.now(),
      "close": Math.random() * 1 + 1,
      "high": Math.random() * 1.2,
      "low": Math.random() * 5,
      "open": Math.random() * 1.3 + 0.5,
      "volume": Math.random() * 0.8 + 10,
      "conversionType": "force_direct",
      "conversionSymbol": "noData"
    };  
  }
};

// Broadcast tracking data to all connected clients
const broadcastTrackingData = async (socket) => {
    const trackingData = await generateTradingData(socket);
    console.log('in broadcast');
    const message = JSON.stringify(trackingData);
    // clients.forEach(client => {
    //   client.send('m', { data: message });
    // }) ;
    socket.broadcast.emit('m', { data: message });
};

io.on('connection', (socket) => {
  console.log(`User connected to  ${socket.id}`)
  clients.add(socket);
  const genTsDate = Date.now();
  const temp = new Date(genTsDate);
  const prevDate = temp.setMinutes(temp.getMinutes()-1);
  cTs = new Date(prevDate).setSeconds('0', '0');

  setInterval(async () => {
    await broadcastTrackingData(socket)
  }, 3000)

  socket.on('disconnect', () => {
      clients.delete(socket);
  });

})

server.listen(8000, () => {
  console.log('https server is running')
})



