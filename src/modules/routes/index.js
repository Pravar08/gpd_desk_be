const express = require("express");
const RoutesRouter = express.Router();
const {pool} = require('../../db'); // Your PostgreSQL pool instance

RoutesRouter.post("/route/add", async (req, res) => {
  try {
    const {
      routeId,
      description,
      creationDate,
      startLocation,
      endLocation,
      totalDistance,
      estimatedTime,
      numberOfStops,
      priority,
      routeType,
      routeMapURL,
      fuelConsumption,
      estimatedCost,
      geofencingId,
      geofencingType,
      geofencingCreationDate,
      alertTrigger,
      circularGeofencing,
      polygonalGeofencing,
      centreCoordinates,
      vertexCoordinates,
      radius,
      assignedDriver,
      drivingLicense,
      contactNumber,
      assignedVehicle,
      vehicleNumber,
      vehicleOwner,
      ownerContact,
      notes,
      customer_id
    } = req.body;

    await pool.query(
      `SELECT insert_route(
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27, $28,
        $29, $30, $31
      )`,
      [
        routeId,
        description,
        creationDate,
        startLocation,
        endLocation,
        totalDistance,
        estimatedTime,
        numberOfStops,
        priority,
        routeType,
        routeMapURL,
        fuelConsumption,
        estimatedCost,
        geofencingId,
        geofencingType,
        geofencingCreationDate,
        alertTrigger,
        circularGeofencing,
        polygonalGeofencing,
        centreCoordinates,
        vertexCoordinates,
        radius,
        assignedDriver,
        assignedVehicle,
        customer_id,
        drivingLicense,
        contactNumber,
        vehicleNumber,
        vehicleOwner,
        ownerContact,
        notes
      ]
    );

    res.status(201).json({ message: "Route inserted successfully" });
  } catch (error) {
    console.error("Error inserting route:", error);
    res.status(500).json({ error: "Failed to insert route" });
  }
});

RoutesRouter.get('/route/get', async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
  
    try {
      const result = await pool.query(
        'SELECT * FROM fetch_route_basic_details($1, $2)',
        [limit, offset]
      );
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching routes:', err.message);
      res.status(500).json({ error: 'Internal Server Error',message:err.message });
    }
  });

  RoutesRouter.get('/route/get-full/:id', async (req, res) => {
    const routeId = parseInt(req.params.id);
  
    try {
      const result = await pool.query(
        'SELECT * FROM fetch_route_full_details($1)',
        [routeId]
      );
      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: 'Route not found' });
      }
    } catch (err) {
      console.error('Error fetching route full details:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  RoutesRouter.delete('/route/delete/:id', async (req, res) => {
    const routeId = parseInt(req.params.id);
  
    try {
      await pool.query('SELECT soft_delete_route($1)', [routeId]);
      res.json({ message: 'Route deleted (soft)' });
    } catch (err) {
      console.error('Error deleting route:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

module.exports = RoutesRouter;
