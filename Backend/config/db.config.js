require("dotenv").config(); // Load environment variables

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.MYSQL_DB,  // Database name
  process.env.MYSQL_USER,      // Database username
  process.env.MYSQL_PASSWORD,  // Database password
  {
    host: process.env.DB_HOST, // Database host
    dialect: "mysql",
    logging: console.log, // Logs SQL queries (optional for debugging)
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  }
})();
