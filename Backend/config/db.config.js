// const mysql = require('mysql2');

// const connection = mysql.createConnection({
//   connectionLimit : 5, //important
//    host: process.env.DB_Host,
//     user: process.env.DB_User,
//      database: process.env.DB_Database,
//      password: process.env.DB_Password,
     
//   debug: false
// });
// console.log("process.env.database_name",process.env.DB_Database);

// // Connect to MySQL
// connection.connect((err) => {
//   if (err) {
//     console.error('Error connecting to MySQL database:', err);
//   } else {
//     console.log('Connected to MySQL database');
//   }
// });

// // Handle connection errors
// connection.on('error', (err) => {
//   console.error('MySQL database error:', err.message);
// });

// module.exports = connection;



// const mysql = require('mysql2');
// const config = {
//   connectionLimit: 5, // Important for connection pooling
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   debug: false,
// };

// // Create a connection to the MySQL server
// const connection = mysql.createConnection(config);

// // Connect to MySQL server
// connection.connect((err) => {
//   if (err) {
//     console.error('Error connecting to MySQL server:', err);
//     return;
//   }
//   console.log('Connected to MySQL server');

//   // Step 1: Create the database if it doesn't exist
//   const createDatabaseQuery = `CREATE DATABASE IF NOT EXISTS ${process.env.DB_Database}`;
//   connection.query(createDatabaseQuery, (err) => {
//     if (err) {
//       console.error('Error creating database:', err);
//       return;
//     }
//     console.log(`Database "${process.env.DB_Database}" created or already exists.`);

//     // Step 2: Switch to the newly created database
//     connection.changeUser({ database: process.env.DB_Database }, (err) => {
//       if (err) {
//         console.error('Error switching to database:', err);
//         return;
//       }
//       console.log(`Using database "${process.env.DB_Database}".`);

//       // Step 3: Create tables if they don't exist
//       const createTableQueries = [
//         `
//        CREATE TABLE IF NOT EXISTS new_users (
//           user_id int(11) NOT NULL AUTO_INCREMENT,
//   name text DEFAULT NULL,
//   email text DEFAULT NULL,
//   password text DEFAULT NULL,
//   username text DEFAULT NULL,
//   otp text DEFAULT NULL,
//   role text DEFAULT NULL,
//   user_status text DEFAULT NULL,
//   token text DEFAULT NULL,
//   updated_at text DEFAULT NULL,
//   registered text DEFAULT NULL,
//   recentPasswordHashes text DEFAULT NULL,
//   PRIMARY KEY (user_id)

// )
//         `,
//         `
//       CREATE TABLE IF NOT EXISTS user_session (
//           user_id int(11) DEFAULT NULL,
//           ip_address varchar(100) DEFAULT NULL,
//           mac_address varchar(100) DEFAULT NULL,
//           login_time varchar(100) DEFAULT NULL,
//           logout_time varchar(100) DEFAULT NULL,
//           id int(11) NOT NULL AUTO_INCREMENT,
//           PRIMARY KEY (id)
//       )
//         `
//       ];

//       // Execute each table creation query
//       createTableQueries.forEach((query) => {
//         connection.query(query, (err) => {
//           if (err) {
//             console.error('Error creating table:', err);
//             return;
//           }
//           console.log('Table created or already exists.');
//         });
//       });
//     });
//   });
// });

// // Handle connection errors
// connection.on('error', (err) => {
//   console.error('MySQL database error:', err.message);
// });

// module.exports = connection;


const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("hws", "root", "root", {
  host: "localhost",
  dialect: "mysql",
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

module.exports = sequelize;