
const express = require('express');
const { pool } = require('../../db');
const userRouter = express.Router();



userRouter.post('/user/add-user', async (req, res) => {
    const {
      username,
      password,
      role,
      name,
      phone,
      email,
      dob,
      address
    } = req.body;
  
    try {
      const query = `
        SELECT insert_user_with_details(
          $1, $2, $3, $4, $5, $6, $7, $8
        )
      `;
  
      await pool.query(query, [
        username,
        password,
        role,
        name,
        phone,
        email,
        dob,
        address
      ]);
  
      res.status(201).json({ message: 'User inserted successfully' });
    } catch (error) {
      console.error('Error inserting user:', error.message);
      res.status(500).json({ error: error.message });
    }
  });
  userRouter.get('/user/details', async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
  
    try {
      const { rows } = await pool.query(`SELECT * FROM get_user_basic_details($1, $2);`, [limit, offset]);
      res.status(200).json(rows);
    } catch (err) {
      console.error('Error fetching user details:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  userRouter.get('/user/details-inactive', async (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
  
    try {
      const { rows } = await pool.query(`SELECT * FROM get_user_basic_details_inactive($1, $2);`, [limit, offset]);
      res.status(200).json(rows);
    } catch (err) {
      console.error('Error fetching user details:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  
  userRouter.delete('/user/delete/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
  
    if (!userId) {
      return res.status(400).json({ error: 'User detail is required and must be valid ' });
    }
  
    try {
      await pool.query('SELECT delete_user_by_id($1);', [userId]);
      res.status(200).json({ message: 'User deleted successfully ' });
    } catch (err) {
      console.error('Error deleting user:', err.message);
      res.status(500).json({ error: err});
    }
  });

  userRouter.post('/user/active/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
  
    if (!userId) {
      return res.status(400).json({ error: 'User detail is required and must be valid ' });
    }
  
    try {
      await pool.query('SELECT active_user_by_id($1);', [userId]);
      res.status(200).json({ message: 'User deleted successfully ' });
    } catch (err) {
      console.error('Error deleting user:', err.message);
      res.status(500).json({ error: err });
    }
  });
  
  userRouter.put('/user/update/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    const {
      username,
      password,
      role,
      name,
      phone,
      email,
      dob,
      address
    } = req.body;
  
    if (!userId) {
      return res.status(400).json({ error: 'User detail is required and must be valid' });
    }
  
    // Simple validation
    const requiredFields = { userId, role, name, phone, email, dob, address };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value || value.toString().trim() === '') {
        return res.status(400).json({ error: `${key} is required` });
      }
    }
  
    try {
        await pool.query(
            `SELECT update_user_with_details($1, $2, $3, $4, $5, $6, $7);`,
            [userId, role, name, phone, email, dob, address]
          );
      
      res.status(200).json({ message: 'User updated successfully' });
    } catch (err) {
      console.error('Error updating user:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  module.exports = userRouter;