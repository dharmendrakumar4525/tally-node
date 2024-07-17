const mysql = require('mysql2/promise');

// Database connection details
const connectionConfig = {
  host: '52.23.174.242',
  user: 'root',
  password: 'place-your-password-here',
  database: 'tally_database_name',
  connectionLimit: 2000,
  queueLimit: 0,
  allowPublicKeyRetrieval: true,
};

// Function to initialize the database
async function initializeDatabase() {
  try {
    // Create a connection to the MySQL server (without specifying the database)
    const connection = await mysql.createConnection({
      host: connectionConfig.host,
      user: connectionConfig.user,
      password: connectionConfig.password,
      allowPublicKeyRetrieval: connectionConfig.allowPublicKeyRetrieval
    });

    // Create the database if it does not exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${connectionConfig.database}\``);

    // Close the initial connection
    await connection.end();

    // Create a connection pool with the new or existing database
    const pool = mysql.createPool(connectionConfig);
    console.log('Database connected and ready.');
    
    return pool;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Export the initializeDatabase function (not invoking it)
module.exports = initializeDatabase;
