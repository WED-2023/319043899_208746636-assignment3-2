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
      CREATE TABLE IF NOT EXISTS recipes (
        recipe_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        picture VARCHAR(255) NOT NULL,
        time VARCHAR(255) NOT NULL,
        popularity VARCHAR(255) NOT NULL,
        diet_type ENUM('vegan', 'vegetarian', 'none') NOT NULL,
        gluten BOOLEAN NOT NULL,
        created_by INT NOT NULL,
        FOREIGN KEY (created_by) REFERENCES users(user_id),
        description TEXT NOT NULL
      )
    `);
    console.log("Recipes table created successfully.");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    await connection.end();
  }
})();