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
        CREATE TABLE Likes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        recipe_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (recipe_id, user_id)
        );
    `);

    console.log("Recipes table created successfully.");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    await connection.end();
  }
})();
