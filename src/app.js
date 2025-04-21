require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { startTCPServer } = require('./tcpServer');
const db = require('./db'); // Import the db module
const gpsLogsRoutes = require('./routes/gpsLogs');
const { customerRouter } = require('./modules/customer');

const getServerTime = async () => {
  try {
    const result = await db.query('SELECT NOW()');
    console.log('Server time:', result.rows[0]);
  } catch (err) {
    console.error('Error fetching server time:', err.stack);
  }
};

// Example: Fetch server time when the app starts
getServerTime();
const app = express();
app.use(cors()); // Enable CORS
app.use(express.json());

app.use('/api', gpsLogsRoutes);
app.use('/api', customerRouter);

const PORT = process.env.PORT || 8000;

app.use(express.json());
// app.use('/api', routes);

app.listen(PORT, () => {
  console.log('Express server running on http://localhost:${PORT}');
});

startTCPServer();