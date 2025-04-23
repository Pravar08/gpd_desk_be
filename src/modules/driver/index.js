const express = require('express');
const DriverRouter = express.Router();
const pool = require('../../db'); // adjust to your DB config path
DriverRouter.post('/driver/add', async (req, res) => {
    const {
      fullName,
      fatherName,
      dateOfBirth,
      gender,
      aadhaarNumber,
      panNumber,
      address,
      pincode,
      contactNumber,
      emergencyContact,
      email,
      bloodGroup,
      drivingLicenseNumber,
      issuingAuthority,
      licenseExpiryDate,
      licenseIssueDate,
      drivingExperience,
      drivingHistory,
      educationalQualification,
      trainingAndCertification,
      trainingIssueDate,
      assignedVehicle,
      insuranceNumber,
      companyName // customer_id (integer)
    } = req.body;
  
    try {
      // Call the insert_driver stored procedure
      const result = await pool.query(
        `SELECT insert_driver(
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24
        )`,
        [
          fullName,
          fatherName,
          dateOfBirth,
          gender,
          aadhaarNumber,
          panNumber,
          address,
          pincode,
          contactNumber,
          emergencyContact,
          email,
          bloodGroup,
          companyName, // This should be an integer representing customer_id
          drivingLicenseNumber,
          issuingAuthority,
          licenseExpiryDate,
          licenseIssueDate,
          drivingExperience,
          drivingHistory,
          assignedVehicle,
          insuranceNumber,
          educationalQualification,
          trainingAndCertification,
          trainingIssueDate
        ]
      );
  
      res.status(201).json({ message: 'Driver added successfully' });
    } catch (error) {
      console.error('Error adding driver:', error);
      res.status(500).json({ error: error.message });
    }
  });


  DriverRouter.get('/driver/list', async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
  
    try {
      const result = await pool.query(
        `SELECT * FROM fetch_driver_basic_details_list($1, $2)`,
        [limit, offset]
      );
  
      res.status(200).json({
        message: 'Driver list fetched successfully',
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching driver list:', error);
      res.status(500).json({ error: error.message });
    }
  });

  DriverRouter.get('/driver/details/:driverId', async (req, res) => {
    const driverId = parseInt(req.params.driverId);
  
    if (!driverId) {
      return res.status(400).json({ error: 'Invalid or missing driver ID' });
    }
  
    try {
      const result = await db.pool.query(
        `SELECT * FROM fetch_driver_full_details($1)`,
        [driverId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }
  
      res.status(200).json({
        message: 'Driver details fetched successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching driver details:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  
module.exports = DriverRouter;
