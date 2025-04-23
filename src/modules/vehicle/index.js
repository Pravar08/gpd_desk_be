const express = require('express');
const VehicleRouter = express.Router();
const pool = require('../../db'); // adjust to your DB config path

VehicleRouter.post('/vehicle/add', async (req, res) => {
    const {
      licensePlate,
      vin,
      imeiNumber,
      companyName, // renamed from companyName
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
    } = req.body;
  
    // Validate companyName is a number
    const parsedCompanyId = parseInt(companyName);
    if (isNaN(parsedCompanyId)) {
      return res.status(400).json({ error: 'Invalid customer ID (companyId)' });
    }
  
    // Validate sensorsTaken is array
    if (!Array.isArray(sensorsTaken)) {
      return res.status(400).json({ error: 'sensorsTaken must be an array' });
    }
  
    try {
      const result = await db.pool.query(
        `SELECT add_vehicle_with_details(
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24,
          $25, $26, $27, $28, $29, $30, $31
        )`,
        [
          licensePlate,
          vin,
          imeiNumber,
          parsedCompanyId,
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
  
      const insertedVehicleId = result.rows[0]?.add_vehicle_with_details;
      res.status(201).json({ message: 'Vehicle added successfully', vehicleId: insertedVehicleId });
  
    } catch (error) {
      console.error('Error adding vehicle:', error);
      res.status(500).json({ error: error.message });
    }
  });
  


VehicleRouter.get('/vehicle/fetch', async (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
  
    try {
      const { rows } = await pool.query(`SELECT * FROM fetch_vehicle_list_with_basic_details($1, $2)`, [limit, offset]);
      res.status(200).json(rows);
    } catch (err) {
      console.error('Error fetching user details:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  VehicleRouter.get('/vehicle/get/:id', async (req, res) => {
    const vehicleId = parseInt(req.params.id);
    try {
        const query = `SELECT * FROM fetch_full_vehicle_details($1)`;
        const values = [vehicleId];
        const data=await pool.query(query,values)
      res.json(data.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch vehicle details' });
    }
  });
module.exports = VehicleRouter;
