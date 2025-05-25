require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { startTCPServer } = require('./tcpServer');
const db = require('./db'); // Import the db module
const gpsLogsRoutes = require('./routes/gpsLogs');
const { customerRouter } = require('./modules/customer');
const userRouter = require('./modules/user');
const VehicleRouter = require('./modules/vehicle');
const DriverRouter = require('./modules/driver');
const RoutesRouter = require('./modules/routes');
const RoleRouter = require('./modules/role');
const { routerLatLongPacket } = require('./modules/latLong');

const getServerTime = async () => {
  try {
    const result = await db.query('SELECT NOW()');
    console.log('Server time:', result.rows[0]);
  } catch (err) {
    console.error('Error fetching server time:', err.stack);
  }
};
async function addVehicleWithDetails(vehicleData) {
  const {
    licensePlate,
    vin,
    imeiNumber,
    companyId, // now INT
    make,
    model,
    yearOfManufacture,
    color,
    vehicleType,
    seatingCapacity,
    engineCapacity,
    fuelType,
    transmissionType,
    bodyType,
    powerOutput,
    odometerReading,
    lastServiceDate,
    nextServiceDate,
    odometerMeterReading,
    registrationDate,
    insuranceExpiryDate,
    roadTaxExpiryDate,
    ownerName,
    ownerContact,
    ownerAddress,
    ownerAadhar,
    ownerDl,
    simNumber,
    sensorsTaken,
    subscriptionExpiry,
  } = vehicleData;

  try {
    const result = await db.pool.query(
      `SELECT add_vehicle_with_details(
        $1::TEXT, $2::TEXT, $3::TEXT, $4::INT, $5::TEXT, $6::TEXT, $7::TEXT, $8::TEXT,
        $9::TEXT, $10::TEXT, $11::TEXT, $12::TEXT, $13::TEXT, $14::TEXT, $15::TEXT, $16::TEXT,
        $17::DATE, $18::DATE, $19::TEXT, $20::DATE, $21::DATE, $22::DATE, $23::TEXT, $24::TEXT,
        $25::TEXT, $26::TEXT, $27::TEXT, $28::TEXT, $29::TEXT[], $30::DATE
      )`,
      [
        licensePlate,
        vin,
        imeiNumber,
        companyId, // must be INT
        make,
        model,
        yearOfManufacture,
        color,
        vehicleType,
        seatingCapacity,
        engineCapacity,
        fuelType,
        transmissionType,
        bodyType,
        powerOutput,
        odometerReading,
        lastServiceDate,
        nextServiceDate,
        odometerMeterReading,
        registrationDate,
        insuranceExpiryDate,
        roadTaxExpiryDate,
        ownerName,
        ownerContact,
        ownerAddress,
        ownerAadhar,
        ownerDl,
        simNumber,
        sensorsTaken,
        subscriptionExpiry
      ]
    );

    console.log('Vehicle added successfully with ID:', result.rows[0].add_vehicle_with_details);
  } catch (err) {
    console.error('Error inserting vehicle data:', err.message);
  }
}


// Example frontend data
const vehicleData = {
  licensePlate: 'ABC1203',
  vin: '1HGCM82633A123456',
  imeiNumber: '123456789012045',
  companyId: 1, // 🔥 actual INT customer_id
  make: 'Honda',
  model: 'Civic',
  yearOfManufacture: '2020',
  color: 'Blue',
  vehicleType: 'Sedan',
  seatingCapacity: '5',
  engineCapacity: '1.8L',
  fuelType: 'Petrol',
  transmissionType: 'Automatic',
  bodyType: 'Sedan',
  powerOutput: '140 hp',
  odometerReading: '15000',
  lastServiceDate: '2023-01-01',
  nextServiceDate: '2023-06-01',
  odometerMeterReading: '1000',
  registrationDate: '2020-05-15',
  insuranceExpiryDate: '2023-05-15',
  roadTaxExpiryDate: '2023-12-31',
  ownerName: 'John Doe',
  ownerContact: '1234567890',
  ownerAddress: '123 Main St',
  ownerAadhar: '1234-5678-9012',
  ownerDl: 'DL1234567890',
  simNumber: '9876543210',
  sensorsTaken: ['GPS', 'Temperature'],
  subscriptionExpiry: '2023-12-31',
};


// Add vehicle data
addVehicleWithDetails(vehicleData)
// Example: Fetch server time when the app starts
getServerTime();
const app = express();
app.use(cors()); // Enable CORS
app.use(express.json());

app.use('/api', gpsLogsRoutes);
app.use('/api', customerRouter);
app.use('/api',userRouter);
app.use('/api',VehicleRouter);
app.use('/api',DriverRouter);
app.use('/api',RoutesRouter);
app.use('/api',RoleRouter);
app.use('/api',routerLatLongPacket);







const PORT = process.env.PORT || 8000;

// app.use('/api', routes);

app.listen(PORT, () => {
  console.log('Express server running on http://localhost:${PORT}');
});

startTCPServer();