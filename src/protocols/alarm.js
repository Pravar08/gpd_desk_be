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
    
    // Return latitude and longitude as decimal degrees
    return {
      latitude: latScaled.toFixed(8), // Show 8 decimal places
      longitude: lonScaled.toFixed(8) // Show 8 decimal places
    };
  }

  function getAlarmType(alarmCode) {
    const alarmMap = {
      '00': 'Normal',
      '01': 'SOS alarm',
      '02': 'Power Cut Alarm',
      '03': 'Vibration alarm',
      '06': 'Over speed alarm',
      '09': 'Moving alarm',
      '0E': 'Low battery (external) alarm',
      '13': 'Removal alarm',
      '29': 'Accelerate Alarm'
    };
  
    return alarmMap[alarmCode] || 'Unknown alarm type'; // Default to 'Unknown alarm type' if code is not found
  }
function parsePacketAlarm(packet) {
    const buffer = Buffer.from(packet, 'hex');
    
    // Start Bit
    const startBit = buffer.slice(0, 2).toString('hex');
    
    // Length
    const length = buffer.slice(2, 3).readUInt8(0);
    
    // Protocol Number
    const protocolNumber = buffer.slice(3, 4).toString('hex');
    console.log(protocolNumber)
    
    // Date and Time
    const year = buffer.slice(4, 5).toString('hex');
    const month = buffer.slice(5, 6).toString('hex');
    const day = buffer.slice(6, 7).toString('hex');
    const hour = buffer.slice(7, 8).toString('hex');
    const minute = buffer.slice(8, 9).toString('hex');
    const second = buffer.slice(9, 10).toString('hex');
    console.log('Time',year, month, day, hour, minute, second)
    const dateTime = `20${year.toString(16)}-${month.toString(16)}-${day.toString(16)} ${hour.toString(16)}:${minute.toString(16)}:${second.toString(16)}`;
    
    // GPS Information Length and Satellites
    const gpsInfo = buffer[10];
    const satellites = buffer[11];
    
    // Latitude (4 bytes)
    const latitude = buffer.slice(12, 16).readUInt32BE(0);
    const latDecimal = latitude / 30000;
    const latitudeValue = `${Math.floor(latDecimal)}°${(latDecimal % 1) * 60}`;
    
    // Longitude (4 bytes)
    const longitude = buffer.slice(16, 20).readUInt32BE(0);
    const lonDecimal = longitude / 30000;
    const longitudeValue = `${Math.floor(lonDecimal)}°${(lonDecimal % 1) * 60}`;
    
    // Speed (1 byte)
    const speed = buffer[19];
    console.log('speefd',speed)
    // Course (2 bytes)
    const course = buffer.slice(21, 23).readUInt16BE(0);
    
    // LBS Information (MCC, MNC, LAC, Cell ID)
    const mcc = buffer.slice(23, 25).readUInt16BE(0);
    const mnc = buffer.slice(25, 26).readUInt8(0);
    const lac = buffer.slice(26, 28).readUInt16BE(0);
    const cellId = buffer.slice(28, 32).readUInt32BE(0);
    
    // Terminal Information (Voltage Level, GSM Signal, Alarm/Language)
    const voltageLevel = buffer[32];
    const gsmSignalStrength = buffer[33];
    const alarm = buffer.slice(34,35).toString('hex');
    console.log("SHOW ALARM",alarm)
    const consoledAlarm=getAlarmType(alarm)
    const language = buffer[35];
    
    // Serial Number
    const serialNumber = buffer.slice(36, 38).toString('hex');
    
    // Error Check
    const errorCheck = buffer.slice(38, 39).toString('hex');
    
    // Stop Bit
    const stopBit = buffer.slice(39, 40).toString('hex');
    const latLong=extractLatLong(buffer)
    return {
      startBit,
      length,
      protocolNumber,
      dateTime,
      gpsInformation: {
        gpsLength: gpsInfo,
        satellites,
        latitude: latLong.latitude,
        longitude: latLong.longitude,
        speed: `${speed} km/h`,
        course
      },
      lbsInformation: {
        mcc,
        mnc,
        lac,
        cellId
      },
      terminalInfo: {
        voltageLevel,
        gsmSignalStrength,
        alarm: consoledAlarm,
        language
      },
      serialNumber,
      errorCheck,
      stopBit
    };
  }
  
  // Example packet to parse
  const packet = "787825260B0B0F0E241DCF027AC8870C4657E60014020901CC00287D001F726506040101003656A40D0A";
  const parsedData = parsePacketAlarm(packet);
  console.log(parsedData);
  module.exports = {parsePacketAlarm};