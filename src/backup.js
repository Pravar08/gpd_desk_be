const net = require('net');

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
function sendResponsePacket(socket, serialNumber) {
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

  console.log('Sending response packet:', responsePacket.toString('hex').toUpperCase());
  socket.write(responsePacket);
}

function extractLatLong(packet) {
  // Check if packet length is correct
  if (packet.length < 38) {
      throw new Error('Packet is too short');
  }

  // Extract Latitude (4 bytes, starting at byPte 12 to 15)
  const latHex = packet.slice(24, 28);  // Correct 4-byte slice for latitude
  const latDecimal = parseInt(latHex.toString('hex'), 16);  // Convert to decimal
  console.log('Raw Latitude Hex:', latHex.toString('hex')); // Debugging log
  console.log('Latitude Decimal:', latDecimal); // Debugging log

  // Extract Longitude (4 bytes, starting at byte 16 to 19)
  const lonHex = packet.slice(28, 32);  // Correct 4-byte slice for longitude
  const lonDecimal = parseInt(lonHex.toString('hex'), 16);  // Convert to decimal
  console.log('Raw Longitude Hex:', lonHex.toString('hex')); // Debugging log
  console.log('Longitude Decimal:', lonDecimal); // Debugging log

  // Adjust the raw data by dividing it by 100000 (not 1000000) to scale it correctly
  const latScaled = latDecimal / 100000;  // Try dividing by 100000
  const lonScaled = lonDecimal / 100000;  // Try dividing by 100000
  console.log('Scaled Latitude:', latScaled);  // Debugging log
  console.log('Scaled Longitude:', lonScaled);  // Debugging log

  // Convert latitude to degrees, minutes, and seconds
  const latDegree = Math.floor(latScaled);  // Integer part is degrees
  const latDecimalMinutes = latScaled - latDegree;  // Decimal part for minutes
  const latMinutes = Math.floor(latDecimalMinutes * 60);  // Convert to minutes
  const latSeconds = Math.round((latDecimalMinutes * 60 - latMinutes) * 60);  // Convert to seconds

  // Convert longitude to degrees, minutes, and seconds
  let lonDegree = Math.floor(lonScaled);  // Integer part is degrees
  let lonDecimalMinutes = lonScaled - lonDegree;  // Decimal part for minutes
  let lonMinutes = Math.floor(lonDecimalMinutes * 60);  // Convert to minutes
  let lonSeconds = Math.round((lonDecimalMinutes * 60 - lonMinutes) * 60);  // Convert to seconds

  // Ensure the longitude is in the correct range (-180 to 180)
  if (lonDegree > 180) {
      lonDegree = lonDegree - 360;  // Adjust for longitude in the Western hemisphere
  }

  // Ensure that latitude and longitude are within valid ranges
  if (latDegree < -90 || latDegree > 90 || lonDegree < -180 || lonDegree > 180) {
      console.error('Invalid latitude or longitude degrees:', latDegree, lonDegree); // Debugging log
      throw new Error('Invalid latitude or longitude degrees');
  }

  // Return latitude and longitude in degrees, minutes, seconds format
  return {
      latitude: `${latDegree}°${latMinutes}'${latSeconds}"`,
      longitude: `${lonDegree}°${lonMinutes}'${lonSeconds}"`
  };
}





// Example binary data (hex string) - You should replace it with your received data
// const data = "7878262219010d0d1734cf0312121d084d54a200141d01940a021200165e0000000002d15001c161220d0a";

// // Get the latitude and longitude
// const { latitudeRawValue, longitudeRawValue, latitude, longitude } = extractLatLon(data);

// // Print the results
// console.log(`Latitude Raw Value: ${latitudeRawValue}`);
// console.log(`Longitude Raw Value: ${longitudeRawValue}`);
// console.log(`Latitude: ${latitude}`);
// console.log(`Longitude: ${longitude}`);


// Parse Incoming Packet
function parsePacket(data, socket) {
  if (data[0] !== 0x78 || data[1] !== 0x78) {
    throw new Error('Invalid start marker');
  }

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
      sendResponsePacket(socket, serialNumber);
    } else {
      console.error(`CRC validation failed. Received: ${receivedCRC.toString(16).toUpperCase()}, Calculated: ${calculatedCRC.toString(16).toUpperCase()}`);
    }
  } 
  if (protocolNumber === 0x22) { // Protocol for GPS data
    console.log('GPS Data Protocol Detected');

    // Parse latitude and longitude
    const { latitude, longitude } = extractLatLong(data);
    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

    // No response needed for GPS data
  } 
  
  
  
  else {
    console.log('Unhandled Protocol:', protocolNumber);
  }
}




// Start TCP Server
function startTCPServer() {
  const server = net.createServer((socket) => {
    const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`Device connected: ${clientAddress}`);

    socket.on('data', (data) => {
      console.log(`Received binary data from ${clientAddress}:`, data.toString('hex'));
      try {
        parsePacket(data, socket);
      } catch (error) {
        console.error('Error parsing packet:', error.message);
      }
    });

    socket.on('close', () => {
      console.log(`Device disconnected: ${clientAddress}`);
    });

    socket.on('error', (err) => {
      console.error(`Socket error for ${clientAddress}:`, err.message);
    });
  });

  server.listen(6000, () => {
    console.log('TCP server running on port 6000');
  });
}

// Start the server
// module.exports = { startTCPServer };
