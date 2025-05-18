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
        timeToMake INT NOT NULL,
        popularity INT NOT NULL DEFAULT 0,
        dietCategory ENUM('vegan', 'vegetarian', 'none') NOT NULL,
        isGlutenFree BOOLEAN NOT NULL,
        created_by INT NOT NULL,
        description TEXT NOT NULL,
        ingredients JSON,
        cuisine VARCHAR(100),
        dishes INT,
        FOREIGN KEY (created_by) REFERENCES users(user_id)
      )
    `);

    console.log("Recipes table created successfully.");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    await connection.end();
  }
})();
