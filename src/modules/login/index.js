const express = require('express');
const pool = require('../../db'); // PostgreSQL connection
const routerLoginPacket = express.Router();


routerLoginPacket.get('/gps-login', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM fetch_login_packet_details()');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// ✅ Fetch GPS log by ID
routerLoginPacket.get('/gps-login/:id', async (req, res) => {
    const logId = req.params.id;
    try {
        const result = await pool.query('SELECT * FROM fetch_login_packet_details_by_serial_number($1)', [logId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Log not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching log by ID:', error);
        res.status(500).json({ error: 'Database error' });
    }
});


 const loginPacketInsertion=async(device_serial_number, imei, login_packet, response_packet)=>{

     pool.query('CALL insert_login_packet_details($1, $2, $3, $4)', [
        device_serial_number, imei, login_packet, response_packet
    ]);
    console.log('Login details inserted')
 }
 function extractIMEI(hexString) {
    // Convert hex string to an array of bytes
    console.log('dataaaa',hexString)
    let bytes = hexString.split(" ").map(byte => parseInt(byte, 16));
    console.log('bytes',bytes)
    // Terminal ID starts at the 4th byte (index 4) and is 8 bytes long
    let terminalIdBytes = bytes.slice(4, 12);
    console.log('terminalIdBytes',terminalIdBytes)
    
    // Convert bytes to a decimal IMEI number
    let imei = terminalIdBytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
    console.log('Login details ImEI',imei)
    return `${imei}`;
}



module.exports = {routerLoginPacket,loginPacketInsertion,extractIMEI};
