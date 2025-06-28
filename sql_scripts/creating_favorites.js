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
    console.log("Starting the script to create FavoriteRecipes table...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS FavoriteRecipes (
        user_id INT NOT NULL,
        recipe_id BIGINT NOT NULL,
        PRIMARY KEY (user_id, recipe_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    console.log("FavoriteRecipes table created successfully.");
  } catch (error) {
    console.error("Error creating FavoriteRecipes table:", error);
  } finally {
    await connection.end();
  }
})();
