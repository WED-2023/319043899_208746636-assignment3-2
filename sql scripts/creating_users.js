const mysql = require("mysql2/promise");
require("dotenv").config();
(async () => {
    console.log("Environment Variables:", {
        host: process.env.host,
        user: process.env.user,
        password: process.env.DBpassword,
        database: process.env.database,
        port: process.env.DBport,
      });
  const connection = await mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.DBpassword,
    database: process.env.database,
    port: process.env.port,
  });

  try {
    console.log("Starting the script...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        firstname VARCHAR(255) NOT NULL,
        lastname VARCHAR(255) NOT NULL,
        country VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        profilePic VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Users table created successfully.");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    await connection.end();
  }
})();