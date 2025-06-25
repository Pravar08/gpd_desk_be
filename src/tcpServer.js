const net = require('net');
const { generalInfoPacketParse } = require('./protocols/generalInfo');
const { parsePacketAlarm } = require('./protocols/alarm');
const { Worker } = require('worker_threads');
const path = require('path');
// const { produceToKafka } = require('./kafka');
const { query, pool } = require('./db');
const { loginPacketInsertion, extractIMEIFromPacket } = require('./modules/login');
const { insertLatLong } = require('./modules/latLong');
const clientTerminalMap = new Map();
let maxConnections = 0;
const uniqueConnections = new Set();
const CryptoJS = require("crypto-js");

const password = "123456";
const fixedKey = "f3b9e1c82d5c4b7593e1f8a2c2e7b354";

// Encrypt it (simulate frontend)
const encrypted = CryptoJS.AES.encrypt(password, fixedKey).toString();
console.log("Encrypted:", encrypted);

// Now try decrypting it (simulate backend)
const decrypted = CryptoJS.AES.decrypt(encrypted, fixedKey).toString(CryptoJS.enc.Utf8);
console.log("Decrypted password:", decrypted);

// CRC-16 lookup table
const crctab16 = [
  0x0000, 0x1189, 0x2312, 0x329B, 0x4624, 0x57AD, 0x6536, 0x74BF,
  0x8C48, 0x9DC1, 0xAF5A, 0xBED3, 0xCA6C, 0xDBE5, 0xE97E, 0xF8F7,
  0x1081, 0x0108, 0x3393, 0x221A, 0x56A5, 0x472C, 0x75B7, 0x643E,
  0x9CC9, 0x8D40, 0xBFDB, 0xAE52, 0xDAED, 0xCB64, 0xF9FF, 0xE876,
  0x2102, 0x308B, 0x0210, 0x1399, 0x6726, 0x76AF, 0x4434, 0x55BD,
  0xAD4A, 0xBCC3, 0x8E58, 0x9FD1, 0xEB6E, 0xFAE7, 0xC87C, 0xD9F5,
  0x3183, 0x200A, 0x1291, 0x0318, 0x77A7, 0x662E, 0x54B5, 0x453C,
  0xBDCB, 0xAC42, 0x9ED9, 0x8F50, 0xFBEF, 0xEA66, 0xD8FD, 0xC974,
  0x4204, 0x538D, 0x6116, 0x709F, 0x0420, 0x15A9, 0x2732, 0x36BB,
  0xCE4C, 0xDFC5, 0xED5E, 0xFCD7, 0x8868, 0x99E1, 0xAB7A, 0xBAF3,
  0x5285, 0x430C, 0x7197, 0x601E, 0x14A1, 0x0528, 0x37B3, 0x263A,
  0xDECD, 0xCF44, 0xFDDF, 0xEC56, 0x98E9, 0x8960, 0xBBFB, 0xAA72,
  0x6306, 0x728F, 0x4014, 0x519D, 0x2522, 0x34AB, 0x0630, 0x17B9,
  0xEF4E, 0xFEC7, 0xCC5C, 0xDDD5, 0xA96A, 0xB8E3, 0x8A78, 0x9BF1,
  0x7387, 0x620E, 0x5095, 0x411C, 0x35A3, 0x242A, 0x16B1, 0x0738,
  0xFFCF, 0xEE46, 0xDCDD, 0xCD54, 0xB9EB, 0xA862, 0x9AF9, 0x8B70,
  0x8408, 0x9581, 0xA71A, 0xB693, 0xC22C, 0xD3A5, 0xE13E, 0xF0B7,
  0x0840, 0x19C9, 0x2B52, 0x3ADB, 0x4E64, 0x5FED, 0x6D76, 0x7CFF,
  0x9489, 0x8500, 0xB79B, 0xA612, 0xD2AD, 0xC324, 0xF1BF, 0xE036,
  0x18C1, 0x0948, 0x3BD3, 0x2A5A, 0x5EE5, 0x4F6C, 0x7DF7, 0x6C7E,
  0xA50A, 0xB483, 0x8618, 0x9791, 0xE32E, 0xF2A7, 0xC03C, 0xD1B5,
  0x2942, 0x38CB, 0x0A50, 0x1BD9, 0x6F66, 0x7EEF, 0x4C74, 0x5DFD,
  0xB58B, 0xA402, 0x9699, 0x8710, 0xF3AF, 0xE226, 0xD0BD, 0xC134,
  0x39C3, 0x284A, 0x1AD1, 0x0B58, 0x7FE7, 0x6E6E, 0x5CF5, 0x4D7C,
  0xC60C, 0xD785, 0xE51E, 0xF497, 0x8028, 0x91A1, 0xA33A, 0xB2B3,
  0x4A44, 0x5BCD, 0x6956, 0x78DF, 0x0C60, 0x1DE9, 0x2F72, 0x3EFB,
  0xD68D, 0xC704, 0xF59F, 0xE416, 0x90A9, 0x8120, 0xB3BB, 0xA232,
  0x5AC5, 0x4B4C, 0x79D7, 0x685E, 0x1CE1, 0x0D68, 0x3FF3, 0x2E7A,
  0xE70E, 0xF687, 0xC41C, 0xD595, 0xA12A, 0xB0A3, 0x8238, 0x93B1,
  0x6B46, 0x7ACF, 0x4854, 0x59DD, 0x2D62, 0x3CEB, 0x0E70, 0x1FF9,
  0xF78F, 0xE606, 0xD49D, 0xC514, 0xB1AB, 0xA022, 0x92B9, 0x8330,
  0x7BC7, 0x6A4E, 0x58D5, 0x495C, 0x3DE3, 0x2C6A, 0x1EF1, 0x0F78,
];


// CRC-16 Calculation
function getCrc16(data) {
  let fcs = 0xffff; // Initial value
  for (let i = 0; i < data.length; i++) {
    fcs = (fcs >> 8) ^ crctab16[(fcs ^ data[i]) & 0xff];
  }
  return ~fcs & 0xffff; // Return negated 16-bit CRC
}

// Send Response Packet
function sendResponsePacketLogin(socket, serialNumber) {
  
  const startBit = Buffer.from([0x78, 0x78]);
  const packetLength = Buffer.from([0x05]); // Response packet length
  const protocolNumber = Buffer.from([0x01]);

  // Convert serial number to buffer
  const serialBuffer = Buffer.from(serialNumber, 'hex');

  // Prepare data for CRC calculation
  const crcData = Buffer.concat([packetLength, protocolNumber, serialBuffer]);

  // Calculate CRC (little-endian)
  const crcValue = getCrc16(crcData);
  const errorCheck = Buffer.from([(crcValue >> 8) & 0xFF, crcValue & 0xFF]);

  const stopBit = Buffer.from([0x0D, 0x0A]);
  const responsePacket = Buffer.concat([startBit, crcData, errorCheck, stopBit]);

  console.log('Sending response packet:', responsePacket);
  socket.write(responsePacket);
  return {responseData:responsePacket.toString('hex'),data:serialNumber}
}

function sendHeartbeatPacket(socket, serialNumber) {
  const startBit = Buffer.from([0x78, 0x78]); // Start bit: 0x78 0x78
  const packetLength = Buffer.from([0x05]); // Response packet length
  const protocolNumber = Buffer.from([0X13]); // Protocol number for heartbeat (0x02)

  // Convert serial number to buffer (hex string to byte array)
  const serialBuffer = Buffer.from(serialNumber, 'hex');

  // Prepare data for CRC calculation (packetLength + protocolNumber + serialBuffer)
  const crcData = Buffer.concat([packetLength, protocolNumber, serialBuffer]);
  console.log('CRC calculation:', crcData.toString('hex'))

  // Calculate CRC (using the getCrc16 function)
  const crcValue = getCrc16(crcData);
  const errorCheck = Buffer.from([(crcValue >> 8) & 0xFF, crcValue & 0xFF]); // Get the high and low byte of the CRC

  const stopBit = Buffer.from([0x0D, 0x0A]); // Stop bit: 0x0D 0x0A (End of packet)

  // Construct the full response packet
  const responsePacket = Buffer.concat([startBit, crcData, errorCheck, stopBit]);

  console.log('Sending heartbeat response packet:', responsePacket.toString('hex').toUpperCase());
  
  // Send the response packet via the socket
  socket.write(responsePacket);
  return{responseData:responsePacket.toString('hex'),data:serialBuffer}
}


// function extractLatLong(packet) {
//   // Check if packet length is correct
//   if (packet.length < 38) {
//       throw new Error('Packet is too short');
//   }

//   // Extract Latitude (4 bytes, starting at byte 12 to 15)
//   const latHex = packet.slice(24, 28);  // Correct 4-byte slice for latitude
//   const latBytes = latHex.toString('hex').match(/.{2}/g).map(byte => parseInt(byte, 16));

//   // Combine the bytes into a single 32-bit unsigned integer
//   const latValue = (latBytes[3] << 24) | (latBytes[2] << 16) | (latBytes[1] << 8) | latBytes[0];
//   console.log('Raw Latitude Hex:', latHex.toString('hex')); // Debugging log
//   console.log('Latitude Decimal:', latValue); // Debugging log

//   // Extract Longitude (4 bytes, starting at byte 16 to 19)
//   const lonHex = packet.slice(28, 32);  // Correct 4-byte slice for longitude
//   const lonBytes = lonHex.toString('hex').match(/.{2}/g).map(byte => parseInt(byte, 16));

//   // Combine the bytes into a single 32-bit unsigned integer
//   const lonValue = (lonBytes[3] << 24) | (lonBytes[2] << 16) | (lonBytes[1] << 8) | lonBytes[0];
//   console.log('Raw Longitude Hex:', lonHex.toString('hex')); // Debugging log
//   console.log('Longitude Decimal:', lonValue); // Debugging log

//   // Convert the value to a float and divide by 30,000.0 (scaling factor)
//   const latScaled = latValue / 30000.0;
//   const lonScaled = lonValue / 30000.0;
//   console.log('Scaled Latitude:', latScaled); // Debugging log
//   console.log('Scaled Longitude:', lonScaled); // Debugging log

//   // Extract the degrees
//   const latDegree = Math.floor(latScaled);
//   const lonDegree = Math.floor(lonScaled);

//   // Get the decimal part (fractional degrees)
//   const latDecimal = latScaled - latDegree;
//   const lonDecimal = lonScaled - lonDegree;

//   // Convert the decimal part to minutes
//   const latMinutes = Math.floor(latDecimal * 60);
//   const lonMinutes = Math.floor(lonDecimal * 60);

//   // Convert the remaining fractional part to seconds
//   const latSeconds = Math.round((latDecimal * 60 - latMinutes) * 60);
//   const lonSeconds = Math.round((lonDecimal * 60 - lonMinutes) * 60);

//   // Ensure the longitude is within valid range (-180 to 180)
//   if (lonDegree > 180) {
//       lonDegree -= 360;  // Adjust for Western hemisphere
//   }

//   // Return the latitude and longitude in degrees, minutes, and seconds format
//   return {
//       latitude: `${latDegree}°${latMinutes}'${latSeconds}"`,
//       longitude: `${lonDegree}°${lonMinutes}'${lonSeconds}"`
//   };
// }

function extractLatLong(packet) {
  // Latitude: 4 bytes (starting at byte 12)
  const latHex = packet.slice(11, 15);  // Extract 4 bytes for latitude (03 12 12 1d)
  console.log("Latitude Hex:", latHex.toString('hex')); // Debugging log
  const latDecimal = latHex.readUInt32BE(0);  // Convert to decimal (big-endian)
  console.log("Latitude Decimal:", latDecimal); // Debugging log
  
  // Longitude: 4 bytes (starting at byte 16)
  const lonHex = packet.slice(15, 19);  // Extract 4 bytes for longitude (08 4d 54 a2)
  console.log("Longitude Hex:", lonHex.toString('hex')); // Debugging log
  const lonDecimal = lonHex.readUInt32BE(0);  // Convert to decimal (big-endian)
  console.log("Longitude Decimal:", lonDecimal); // Debugging log
  
  // Convert latitude and longitude to decimal degrees (divide by 1800000)
  const scale = 1800000;
  
  const latScaled = latDecimal / scale;
  const lonScaled = lonDecimal / scale;
  const speed=packet[19]

  
  // Return latitude and longitude as decimal degrees
  return {
    latitude: latScaled.toFixed(8), // Show 8 decimal places
    longitude: lonScaled.toFixed(8) // Show 8 decimal places
    ,speed
  };
}








// Parse Incoming Packet
function parsePacket(data, socket,terminal) {
  // if (data[0] !== 0x78 || data[1] !== 0x78||data[0] !==0x79 || data[1] !== 0x79) {
  //   throw new Error('Invalid start marker');
  // }
console.log('term check',terminal)
  const packetLength = data[2];
  console.log('Packet Length:', packetLength);

  const protocolNumber = data[3];
  console.log('Protocol Number:', protocolNumber);

  if (protocolNumber === 0x01) {
    console.log('Login Message Protocol Detected');

    // Extract serial number correctly
    const serialNumber = data.slice(data.length - 6, data.length - 4).toString('hex');
    console.log('Serial Number:', serialNumber);

    const receivedCRC = (data[data.length - 4] << 8) | data[data.length - 3];
    console.log('Received CRC:', receivedCRC.toString(16).toUpperCase());

    const crcData = data.slice(2, data.length - 4);
    console.log('CRC Input Data:', crcData.toString('hex'));

    const calculatedCRC = getCrc16(crcData);
    console.log('Calculated CRC:', calculatedCRC.toString(16).toUpperCase());

    if (receivedCRC === calculatedCRC) {
      console.log('CRC validation passed. Sending response...');
     const responseLogin= sendResponsePacketLogin(socket, serialNumber);
     const imei=extractIMEIFromPacket(data.toString('hex'))
     console.log("IMEI CHECK",imei)
      //  loginPacketInsertion(responseLogin.data,imei,data.toString('hex'),responseLogin.responseData)
      } else {
      console.error(`CRC validation failed. Received: ${receivedCRC.toString(16).toUpperCase()}, Calculated: ${calculatedCRC.toString(16).toUpperCase()}`);
    }
  } 
  if (protocolNumber === 0x22) { // Protocol for GPS data
    console.log('GPS Data Protocol Detected');
    const serialNumber = data.slice(data.length - 6, data.length - 4).toString('hex');

    // Parse latitude and longitude
    const { latitude, longitude,speed } = extractLatLong(data);
    console.log(`Latitude: ${latitude}, Longitude: ${longitude},speed: ${speed}`);
    insertLatLong(terminal,latitude,longitude,speed)
    return {resData:''.responseData,data:JSON.stringify({Latitude:latitude,longitude,speed })}

    // No response needed for GPS data
  } 
  if (protocolNumber === 0x13) {
    console.log('Heartbeat Protocol Detected',data);
  
    // Extract terminal information from the packet
    const voltageLevel = data[4]; // Voltage Level (1 byte)
    const gsmSignalStrength = data[5]; // GSM Signal Strength (1 byte)
    const alarmLanguage = data.slice(6, 8).toString('hex'); // Alarm/Language (2 bytes)
    const serialNumber = data.slice(9, 11).toString('hex'); // Serial Number (2 bytes)
   const responseData= sendHeartbeatPacket(socket,serialNumber)
    return {resData:responseData.responseData,data:JSON.stringify({serialNumber:responseData.data})}
  
  }
  if(protocolNumber === 0x94){
  const responseData= generalInfoPacketParse(data)
  return {resData:'',data:JSON.stringify({serialNumber:responseData.data})}
  }if(protocolNumber === 0x26){
    const responseData= parsePacketAlarm(data)
  return {resData:'',data:JSON.stringify({serialNumber:responseData.data})}


  }
  else{
    return {resData:'unintegrated protocol',data:'Unknown protocol'}
  }
  
  
 
}


// Start TCP Server
// function startTCPServer() {
//   const uniqueConnections = new Set();
// let maxConnections = 0; // Track the max count of concurrent connections

// const server = net.createServer((socket) => {
//     const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;

//     // Add the device to the set
//     uniqueConnections.add(clientAddress);
//     console.log(`New device connected: ${clientAddress}`);
    
//     // Update max concurrent connections
//     if (uniqueConnections.size > maxConnections) {
//         maxConnections = uniqueConnections.size;
//     }

//     console.log('Current connections:', uniqueConnections.size);
//     console.log('Max connections observed:', maxConnections);

//     socket.on('data', (data) => {
//     console.log('Max connections observed:', maxConnections);

//         const hexData = data.toString('hex').toUpperCase();
//         console.log(`Received data from ${clientAddress}: ${hexData}`);

//         try {
//             parsePacket(data, socket);
//         } catch (error) {
//             console.error('Error parsing packet:', error.message);
//         }
//     });

//     socket.on('close', () => {
//         // Remove from the set when disconnected
//         uniqueConnections.delete(clientAddress);
//         console.log(`Device disconnected: ${clientAddress}`);
//         console.log('Current connections:', uniqueConnections.size);
//         console.log('Max connections observed:', maxConnections);
//     });

//     socket.on('error', (err) => {
//         console.error(`Socket error for ${clientAddress}:`, err.message);
//     });
// });

//   server.listen(2001, () => {
//     console.log('TCP server running on port 6000');
//   });
// }

async function getTerminalId(clientAddress) {
  try {
      const result = await pool.query(
          'SELECT terminal_id FROM active_connections_view WHERE client_address = $1 LIMIT 1',
          [clientAddress]
      );
      return result.rows.length ? result.rows[0].terminal_id : 'unknown';
  } catch (err) {
      console.error('❌ Error fetching terminal ID:', err.message);
      return null;
  }
}

// Worker Thread Pool Setup
const WORKER_COUNT = 4;
const workerPool = Array.from({ length: WORKER_COUNT }, () => 
    new Worker(path.join(__dirname, 'worker.js'))
);

// Function to get the next available worker (Round Robin)
let workerIndex = 0;
function getWorker() {
    const worker = workerPool[workerIndex];
    workerIndex = (workerIndex + 1) % WORKER_COUNT;
    return worker;
}

function startTCPServer() {
    const server = net.createServer((socket) => {
        const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
        uniqueConnections.add(clientAddress);
        maxConnections = Math.max(maxConnections, uniqueConnections.size);

        console.log(`New device connected: ${clientAddress} | Active Connections: ${uniqueConnections.size}`);

        socket.on('data', async (data) => {
          const hexData = data.toString('hex').toUpperCase();
          console.log(`Received data from ${clientAddress}: ${hexData}`);
      
          try {
            const protocolNumber = data[3];
            if (protocolNumber === 0x01) {
            const imei=extractIMEIFromPacket(data.toString('hex'))
            pool.query(`INSERT INTO active_connections (client_address, terminal_id, last_seen)
VALUES ($1, $2, NOW())
ON CONFLICT (client_address)
DO UPDATE SET last_seen = NOW();`,[clientAddress,imei])
            }else{
              pool.query(`UPDATE active_connections
SET last_seen = NOW()
WHERE client_address = $1;`,[clientAddress])
            }
            const terminal= await getTerminalId(clientAddress)
            const parsedData = parsePacket(data, socket,terminal);
                // console.log('Parsed Data:', parsedData);
              //  const addData={ rawData: hexData || '',  // Ensure rawData is not null
              //   parseData: `${parsedData.data}` || '{}',  // Fix property name
              //   resData: `${parsedData.resData}` || '' }
                // await query('CALL insert_gps_logs_bulk($1::JSONB);', [ {rawData: hexData || '',  // Ensure rawData is not null
                //   parseData: `${parsedData.data}` || '{}',  // Fix property name
                //   resData: `${parsedData.resData}` || '' }
                // ]);

// if(parsedData.resData!=='unintegrated protocol'){
//                 // Ensure parsedData is a proper string before sending to Kafka
//                 await produceToKafka('gps-data', clientAddress, JSON.stringify({
//                     clientAddress,
//                     rawData: hexData,  // Raw packet data as a hex string
//                     parsedData: parsedData.data,  // JSON string of parsed data
//                     responseData: parsedData.resData, // Ensure responseData is a string
//                     timestamp: new Date().toISOString(),
//                 }));}
              console.log(`📡 Data sent to Kafka directly from TCP server for ${clientAddress}`);
          } catch (error) {
              console.error('❌ Error sending data to Kafka:', error.message);
          }
      });

        socket.on('close', () => {
          uniqueConnections.delete(clientAddress);
          console.log(`❌ Device disconnected: ${clientAddress}`);
          console.log(`Current connections: ${uniqueConnections.size}`);
          socket.destroy(); // Ensure socket is fully closed
      });
        socket.on('error', (err) => {
            console.error(`Socket error for ${clientAddress}:`, err.message);
        });

        // Handle sudden socket timeoutFG
      
    });

    server.on('error', (err) => {
        console.error('TCP Server error:', err.message);
    });

    server.listen(2001, () => {
        console.log('✅ TCP Server is running on port 2001');
    });
}
async function cleanupConnections() {
  try {
      await pool.query('CALL cleanup_old_connections()');
      console.log('✅ Old connections cleaned up successfully');
  } catch (err) {
      console.error('❌ Error cleaning up connections:', err.message);
  }
}

// Run cleanup every 3 hours (10,800,000 milliseconds)
setInterval(cleanupConnections, 3 * 60 * 60 * 1000);

// Call once on startup
cleanupConnections();
// Start the server
module.exports = { startTCPServer,getCrc16 ,parsePacket};
