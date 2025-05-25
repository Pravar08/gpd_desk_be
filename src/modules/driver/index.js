const express = require('express');
const DriverRouter = express.Router();
const {pool} = require('../../db'); // adjust to your DB config path
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


  DriverRouter.get('/driver/list_by_customer', async (req, res) => {
    const limit = parseInt(req.query.customerId) 
  
    try {
      const result = await pool.query(
        `SELECT * FROM fetch_driver_basic_details_list_customerId($1)`,
        [limit]
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
      const result = await pool.query(
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
  DriverRouter.put('/driver/update', async (req, res) => {
    const {
      driver_id,
      full_name,
      father_name,
      date_of_birth,
      gender,
      aadhaar_number,
      pan_number,
      address,
      pincode,
      contact_number,
      emergency_contact,
      email,
      blood_group,
      company_id,
      driving_license_number,
      issuing_authority,
      license_expiry_date,
      license_issue_date,
      driving_experience,
      driving_history,
      assigned_vehicle,
      insurance_number,
      educational_qualification,
      training_and_certification,
      training_issue_date
    } = req.body;
  
    // Basic Validation
    if (!driver_id) {
      return res.status(400).json({ message: 'Driver ID is required' });
    }
  
    try {
      await pool.query(
        `SELECT update_driver(
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25
        )`,
        [
          driver_id,
          full_name,
          father_name,
          date_of_birth,
          gender,
          aadhaar_number,
          pan_number,
          address,
          pincode,
          contact_number,
          emergency_contact,
          email,
          blood_group,
          company_id,
          driving_license_number,
          issuing_authority,
          license_expiry_date,
          license_issue_date,
          driving_experience,
          driving_history,
          assigned_vehicle,
          insurance_number,
          educational_qualification,
          training_and_certification,
          training_issue_date
        ]
      );
  
      return res.status(200).json({ message: 'Driver updated successfully' });
    } catch (error) {
      console.error('Error updating driver:', error);
      return res.status(500).json({ message: 'Failed to update driver', error: error.message });
    }
  });
  DriverRouter.put('/soft-delete-driver', async (req, res) => {
    const { driver_id } = req.body;
  
    if (!driver_id) {
      return res.status(400).json({ message: 'Driver ID is required' });
    }
  
    try {
      await pool.query(
        `SELECT soft_delete_driver($1)`,
        [driver_id]
      );
  
      return res.status(200).json({ message: 'Driver soft-deleted successfully' });
    } catch (error) {
      console.error('Error soft deleting driver:', error);
      return res.status(500).json({ message: 'Failed to soft delete driver', error: error.message });
    }
  });
  
module.exports = DriverRouter;
