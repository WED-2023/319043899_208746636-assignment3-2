const db = require('./MySql');

async function testConnection() {
  console.log("Starting MySQL connection test...");
  try {
    const result = await db.query('SELECT 1');
    console.log('✅ MySQL connection test succeeded:', result);
  } catch (err) {
    console.error('❌ MySQL connection test failed:', err.message);
  }
}

testConnection();