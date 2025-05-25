const express = require("express");
const customerRouter = express.Router();
const pool = require('../../db'); // adjust this to your actual pool path
customerRouter.post('/customers/create', async (req, res) => {
  const {
    companyName,
    companyType,
    officialContact,
    sensorsTaken,
    branches,
    address,
    city,
    state,
    country,
    zipCode,
    contactName,
    role,
    mobile,
    email,
    username,
    password // ✅ Include password from request body
  } = req.body;

  try {
    const result = await pool.query(
      'SELECT create_customer_with_details($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)',
      [
        companyName,
        companyType,
        officialContact,
        sensorsTaken,
        branches,
        address,
        city,
        state,
        country,
        zipCode,
        contactName,
        role,
        mobile,
        email,
        username,
        password // ✅ Pass it to the DB function
      ]
    );

    res.json({ message: result.rows[0].create_customer_with_details });
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).json({ error: err.message });
  }
});
customerRouter.post('/customers/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM check_customer_login($1, $2)',
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const customer = result.rows[0];
    res.json({ message: 'Login successful', customer });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
customerRouter.post('/customers/fetch', async (req, res) => {
  const { pagenumber, limit } = req.body;
  const OFFSET = (pagenumber) * limit
  try {
    const result = await pool.query(
      'SELECT * FROM get_basic_customer_info_paginated($1, $2)',
      [limit, OFFSET]
    );


    const customer = result.rows;
    res.json({ message: 'Login successful', data:customer });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

customerRouter.post('/customers/fetch_inactive', async (req, res) => {
  const { pagenumber, limit } = req.body;
  const OFFSET = (pagenumber) * limit
  try {
    const result = await pool.query(
      'SELECT * FROM get_basic_customer_info_inactive_paginated($1, $2)',
      [limit, OFFSET]
    );


    const customer = result.rows;
    res.json({ message: 'Login successful', data:customer });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Update Customer
customerRouter.put('/customers/update/:id', async (req, res) => {
  const { id } = req.params;
  const {
    companyName,
    companyType,
    officialContact,
    sensorsTaken,
    branches,
    address,
    city,
    state,
    country,
    zipCode,
    contactName,
    role,
    mobile,
    email,
    username,
    status=1
  } = req.body;

  try {
    const result = await pool.query(
      'SELECT update_customer_with_details($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)',
      [
        parseInt(id),
        companyName,
        companyType,
        officialContact,
        sensorsTaken,
        branches,
        address,
        city,
        state,
        country,
        zipCode,
        contactName,
        role,
        mobile,
        email,
        username,
        1
      ]
    );
    res.json({ message: result.rows[0].update_customer_with_details });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Customer
customerRouter.delete('/customers/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT delete_customer_by_id($1)',
      [parseInt(id)]
    );
    res.json({ message: result.rows[0].delete_customer_by_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


customerRouter.post('/customers/active/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT active_customer_by_id($1)',
      [parseInt(id)]
    );
    res.json({ message: result.rows[0].delete_customer_by_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

customerRouter.get('/customers/details/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT get_full_customer_info_json($1)',
      [id]
    );
    res.json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

customerRouter.get('/customers/branch/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `select branches from customer_details
WHERE id=${id}
`
    );
    res.json({ data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = {customerRouter};
