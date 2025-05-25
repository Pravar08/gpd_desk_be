const express = require('express');
const pool = require('../../db'); // PostgreSQL connection
const routerLatLongPacket = express.Router();

routerLatLongPacket.get('/latest-location/:serial_no', async (req, res) => {
    const { serial_no } = req.params;
    try {
        const result = await pool.query('SELECT * FROM fetch_latest_location_by_serial($1)', [serial_no]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No location data found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching latest location:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// ✅ Fetch Last 24 Hours Locations by Serial Number
routerLatLongPacket.get('/locations-last-24h/:serial_no', async (req, res) => {
    const { serial_no } = req.params;
    try {
        const result = await pool.query('SELECT * FROM fetch_locations_last_24h_by_serial($1)', [serial_no]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching last 24h locations:', error);
        res.status(500).json({ error: 'Database error' });
    }
});
routerLatLongPacket.get('/locations-last', async (req, res) => {
    const { serial_no } = req.params;
    try {
        const result = await pool.query('SELECT * FROM get_latest_vehicle_location_info()');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching last 24h locations:', error);
        res.status(500).json({ error: error });
    }
});


routerLatLongPacket.get('/vehicle-activity', async (req, res) => {
    const { serial_no, start_time, end_time } = req.query;
  
    if (!serial_no) {
      return res.status(400).json({ error: 'serial_no is required' });
    }
  
    // const query = {
    //   text: `
      
    //   `,
    //   [serial_no, start_time || null, end_time || null]
    // };
  
    try {
        const result = await pool.query(
            `SELECT * FROM get_vehicle_activity($1, $2, $3)`,
            [serial_no, start_time || null, end_time || null]
          );
      res.json(result.rows);
    } catch (err) {
      console.error('Error executing query:', err);
      res.status(500).json({ error: 'Internal server error', details: err });
    }
  });

async function insertLatLong(serial_no, latitude, longitude, speed) {
    try {
        await pool.query(
            "SELECT insert_lat_long_info($1, $2, $3, $4)", 
            [serial_no, latitude, longitude, speed]
        );
        console.log('Data inserted successfully');
    } catch (error) {
        console.error('Error inserting data:', error);
    }
}


module.exports = {routerLatLongPacket,insertLatLong};
