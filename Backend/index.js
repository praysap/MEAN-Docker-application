const http = require('http');
const express = require('express');
const dotenv = require('dotenv');
const app = express();
const https = require("https");
// const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
// const session = require('express-session');
// const Sequelize = require('sequelize');
const config = process.env;
const IP = require('ip');
const moment = require('moment-timezone');
const fs = require('fs');
const { constants } = require('crypto')
// create express app
const helmet = require('helmet');
// const frameguard = require("frameguard");
// app.use(helmet());
app.use(helmet.frameguard({ action: "SAMEORIGIN" }));
// Set up Global configuration access
dotenv.config();
var dbConn = require('../Backend/config/db.config.js');
const sequelize = require("./src/database/db.config.js");
const sqlite3 = require('sqlite3').verbose();
// setup the server port
const port = process.env.PORT || 5000;
console.log("process.env.PORT",process.env.PORT)

// parser request data content type application


app.use(bodyParser.urlencoded({
  extended: true
}));

app.disable('etag');
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'max-age=3600; public');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('ETag', '');
  next();
});

const dbPath = '../Backend/clusterdb.db';
// parser request data content type application/json
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World');
  return;
});
app.set('env', 'production');
app.use(cors({
  origin: ["http://10.228.12.65"]
}));     

const userElasticRouter = require('./src/routes/elastic.route.js');
const userRouter = require('./src/routes/users.route.js');
//const dashRouter = require('./src/routes/dash.route.js');
const { send } = require('process');

// create users routes
app.use('/api/v1/users', userRouter);

app.use('/', userElasticRouter);

//app.use('/dash',dashRouter)



app.get('/', (req, res) => {
  res.send('Hello World!');
});



// user_logs stored in mysql database 
// app.post('/store-info', (req, res) => {
//   // Get client IP from the request
//   const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
// //console.log(clientIp);
//   // Get current URL from the request body
//   const { currentUrl } = req.body;

//   // Store the client IP and current URL in the database
//   const sql = 'INSERT INTO user_logs (ip_address, attack_data) VALUES (?, ?)';
//   dbConn.query(sql, [clientIp, currentUrl], (err, result) => {
//       if (err) {
//           console.error('Error storing data:', err.stack);
//           res.status(500).json({ error: 'Internal Server Error' });
//           return;
//       }
//       res.status(200).json({ message: 'Data stored successfully' });
//   });
// });

app.post('/store-info', (req, res) => {
  // Get client IP from the request
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  // Get current URL from the request body
  const { currentUrl } = req.body;

  // Extract IPv4 address from potential IPv6 format
  const ipv4Address = clientIp.includes(':') ? clientIp.split(':').pop() : clientIp;

  // Get current UTC timestamp
  
  const currentDate = new Date();
  // Convert UTC timestamp to IST
  const currentIST = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');

  // Store the client IP and current URL in the database with IST timestamp
  const sql = 'INSERT INTO user_logs (ip_address, attack_data, created_at) VALUES (?, ?, ?)';
  db.run(sql, [ipv4Address, currentUrl, currentIST], function(err) {
    if (err) {
      console.error('Error storing data:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    console.log(`Data stored successfully with ID: ${this.lastID}`);
    res.status(200).json({ message: 'Data stored successfully' });
  });
});
const options = {
  key: fs.readFileSync("server.key"),
  cert: fs.readFileSync("server.cert"),
  ciphers: "ECDHE-RSA-AES256-GCM-SHA384:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA:HIGH:!AES128"
};

app.get('*', function (req, res) {
  const clientIp = IP.address();
  console.log(clientIp);
  res.status(404).send('Page Not Found');
});

// listen to the port
//comment below at time of production
app.listen(port, () => {
  secureOptions: constants.SSL_OP_NO_TLSv1 | constants.SSL_OP_NO_TLSv1_1
  console.log(`app running on ${port}`)
});

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the sqlite3 database.');
  }
});

(async () => {
  try {
    await sequelize.sync({ alter: true }); // Ensures tables match the model
    console.log("Database & tables created!");
  } catch (error) {
    console.error("Error syncing database:", error);
  }
})();


app.timeout = 20000;

