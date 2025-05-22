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
    port: process.env.DBport,
  });

  try {
    console.log("Starting the script...");
    await connection.execute(`
      CREATE TABLE views (
        view_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        recipe_id INT NOT NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        UNIQUE KEY unique_view (user_id, recipe_id)
      )
    `);
    console.log("Views table created successfully.");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    await connection.end();
  }
})();