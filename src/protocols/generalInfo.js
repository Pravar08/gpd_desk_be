function parseTirePressureData(buffer) {
    const sensorCount = buffer[0];
    const sensors = [];
  
    for (let i = 0; i < sensorCount; i++) {
      const offset = 1 + i * 3;
      const tempWord = buffer.readUInt16BE(offset);
      const humidity = buffer[offset + 2];
  
      let temperature = null;
      let isValid = true;
  
      if ((tempWord & 0x1000) !== 0) isValid = false; // Bit 12 indicates invalid temperature
      if (isValid) {
        temperature = (tempWord & 0x0FFF) / 10; // Bits 11-0 are the temperature value
        if ((tempWord & 0x8000) !== 0) temperature *= -1; // Bit 15 indicates negative temperature
      }
  
      sensors.push({
        temperature: isValid ? `${temperature}°C` : "Invalid",
        humidity: humidity !== 255 ? `${humidity}%` : "Invalid"
      });
    }
  
    return { sensorCount, sensors };
  }
  function parseFuelData(buffer) {
    const fuelHex = buffer.slice(0, 2).toString('hex'); // 2 bytes for fuel value
    const fuelValue = parseInt(fuelHex, 16) / 10; // Convert to decimal and divide by 10
    return `${fuelValue}L`;
  }
  
  function parseReportData(buffer) {
    const reportType = buffer[0];
    const accOnTime = buffer.readUInt32BE(1); // DWORD
    const tripMileage = buffer.readUInt32BE(5) / 10; // DWORD, unit: 0.1km
    const tripStartTime = parseTimestamp(buffer.slice(9, 15));
    const tripEndTime = parseTimestamp(buffer.slice(15, 21));
  
    return {
      reportType: reportType === 0 ? "Trip Report" : "Unknown",
      accOnTime: `${accOnTime} minutes`,
      tripMileage: `${tripMileage} km`,
      tripStartTime,
      tripEndTime
    };
  }
  
  function parseTimestamp(buffer) {
    const year = buffer[0] + 2000;
    const month = buffer[1];
    const day = buffer[2];
    const hour = buffer[3];
    const minute = buffer[4];
    const second = buffer[5];
    return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")} ${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
  }
  function parseVoltageData(buffer) {
    const voltageHex = buffer.slice(0, 2).toString('hex'); // 2 bytes for voltage value
    const voltageValue = parseInt(voltageHex, 16) / 100; // Convert to decimal and divide by 100
    return `${voltageValue}V`;
  }
  function parseExternalVoltage(buffer) {
    const voltageHex = buffer.slice(0, 2).toString('hex'); // 2 bytes for voltage value
    const voltageValue = parseInt(voltageHex, 16) / 100; // Convert to decimal and divide by 100
    return `${voltageValue}V`;
  }

  function parseSimCardInfo(buffer) {
    // Parse IMEI (8 bytes)
    const imeiBuffer = buffer.slice(0, 8);
    const imei = Array.from(imeiBuffer)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
      .replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1$2$3$4$5$6$7$8');
  
    // Parse IMSI (8 bytes)
    const imsiBuffer = buffer.slice(8, 16);
    const imsi = Array.from(imsiBuffer)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
      .replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1$2$3$4$5$6$7$8');
  
    // Parse ICCID (10 bytes)
    const iccidBuffer = buffer.slice(16, 26);
    const iccid = Array.from(iccidBuffer)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
      .replace(
        /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
        '$1$2$3$4$5$6$7$8$9$10'
      );
  
    return { imei, imsi, iccid };
  }
  function generalInfoPacketParse(packet) {
    const buffer = Buffer.from(packet, 'hex');
    const startBit = buffer.slice(0, 2).toString('hex');
    const length = buffer.slice(2, 4).readUInt16BE(0);
    const protocolNumber = buffer[4].toString(16);
    const dataType = buffer[5].toString(16).padStart(2, '0');
    const serialNumber = buffer.slice(buffer.length - 6, buffer.length - 4).toString('hex');
    const errorCheck = buffer.slice(buffer.length - 4, buffer.length - 2).toString('hex');
    const stopBit = buffer.slice(buffer.length - 2).toString('hex');
  
    let dataContent;

    switch (dataType) {
      case 'ff':
        dataContent = parseTirePressureData(buffer.slice(6, buffer.length - 6));
        break;
      case 'fb':
        dataContent = parseReportData(buffer.slice(6, buffer.length - 6));
        break;
      case 'fe':
        dataContent = parseFuelData(buffer.slice(6, buffer.length - 6));
        break;
      case 'fd':
        dataContent = parseVoltageData(buffer.slice(6, buffer.length - 6));
        break;
      case '00':
        dataContent = parseExternalVoltage(buffer.slice(6, buffer.length - 6));
        break;
        case '0a': // SIM Card Information
        dataContent = parseSimCardInfo(buffer.slice(6, buffer.length - 6));
        break;
      default:
        dataContent = "Unknown Data Type";
    }
  
    return {data:{
      startBit,
      length,
      protocolNumber,
      dataType,
      dataContent,
      serialNumber,
      errorCheck,
      stopBit}
    };
  }
  
  // Example packets
  const tirePressurePacket = '7979000E94FF0101113F2A000C887B0D0A';
  const reportPacket = '79791C0094FB000000005B0000000016071E080A3816071E080B0B000C888F0D0A';
  const externalVotl='797900089400049F00032D9F0D0A'
  const voltAnalog='7979090094FD097A000F692A0D0A'
  const fuelData='7979090094FE097A000F692A0D0A'
  const simCardPacket = '79790020940A012345678912345608617020100340480460040515602540898602B52616C004254000032D9F0D0A';
  console.log('SIM Card Data:', JSON.stringify(generalInfoPacketParse(simCardPacket), null, 2));
  console.log('Tire Pressure Data:', JSON.stringify(generalInfoPacketParse(tirePressurePacket), null, 2));
  console.log('Report Data:', JSON.stringify(generalInfoPacketParse(reportPacket), null, 2));
  console.log('externalVotl Data:', JSON.stringify(generalInfoPacketParse(externalVotl), null, 2));
  console.log('voltAnalog Data:', JSON.stringify(generalInfoPacketParse(voltAnalog), null, 2));
  console.log('voltAnalog Data:', JSON.stringify(generalInfoPacketParse(fuelData), null, 2));




  module.exports={generalInfoPacketParse }