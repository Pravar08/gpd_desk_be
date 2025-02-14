const { Pool } = require('pg');

const pool = new Pool({
  host: '13.51.239.249',       // Use EC2 Public IP
  port: 5432,                  // PostgreSQL default port
  user: 'postgres',            // PostgreSQL username
  password: 'gps_desk_dev',       // PostgreSQL password
  database: 'postgres',         // Database name
  max: 20,                     // Increase max connections for workers
  idleTimeoutMillis: 30000,     // Close idle clients after 30 sec
  connectionTimeoutMillis: 5000 // Increase timeout for new connections
});

// Query wrapper for executing SQL queries
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { query, pool };
