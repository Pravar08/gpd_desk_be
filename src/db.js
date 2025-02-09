const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  host: 'localhost',           // Host (same as in pgAdmin)
  port: 5432,                  // Default PostgreSQL port
  user: 'postgres',            // Your PostgreSQL username
  password: '987654321',       // Your PostgreSQL password
  database: 'gps_dev',         // The name of your database
  max: 10,                     // Max connections in the pool
  idleTimeoutMillis: 30000,    // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Timeout for new connections (in ms)
});

// Query wrapper for executing SQL queries
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release(); // Always release the client back to the pool
  }
};

module.exports = {
  query,  // Export query function
};
