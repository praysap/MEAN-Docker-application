const http = require('http');
const express = require('express');
const dotenv = require('dotenv');
const app = express();
const https = require("https");
const elasticRoutes = require("./src/routes/elastic.route.js");
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require("./src/routes/users.route.js");
const config = process.env;
const IP = require('ip');
const moment = require('moment-timezone');
const fs = require('fs');
const { constants } = require('crypto')

const helmet = require('helmet');

app.use(helmet.frameguard({ action: "SAMEORIGIN" }));

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
  origin: ["http://10.228.12.65", "http://localhost:4200","http://10.228.11.88:4200" ]
}));     

const userRouter = require('./src/routes/users.route.js');
//const dashRouter = require('./src/routes/dash.route.js');
const { send } = require('process');

app.use("/", routes);
app.use("/api/elastic", elasticRoutes);

app.use("/api/v1/users", userRouter);


app.get('/', (req, res) => {
  res.send('Hello World!');
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

// const db = new sqlite3.Database(dbPath, (err) => {
//   if (err) {
//     console.error('Error opening database:', err.message);
//   } else {
//     console.log('Connected to the sqlite3 database.');
//   }
// });

(async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    await sequelize.sync(); // ✅ NO alter
    console.log("Database synced");
  } catch (error) {
    console.error("Error syncing database:", error);
  }
})();


app.timeout = 20000;

