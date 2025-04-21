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
 function extractIMEIFromPacket(packetHex) {
    console.log('Packet Check:', packetHex);

    // Convert continuous hex string into an array of byte pairs
    let bytes = packetHex.match(/.{1,2}/g); // Splits into 2-character hex values

    if (!bytes || bytes.length < 12) {
        console.log('Invalid packet format');
        return null;
    }

    // Terminal ID is located at bytes index 4 to 11 (8 bytes)
    let terminalIDBytes = bytes.slice(4, 12);

    // Convert BCD encoded bytes to a string
    let imei = terminalIDBytes.map(byte => byte.padStart(2, '0')).join("");
    console.log('Extracted IMEI (before processing):', imei);

    // Ensure it's 15 digits by removing any leading zero
    if (imei.length === 16 && imei.startsWith("0")) {
        imei = imei.slice(1);
    }

    console.log('Final IMEI:', imei);
    return imei;
}



module.exports = {routerLoginPacket,loginPacketInsertion,extractIMEIFromPacket};
