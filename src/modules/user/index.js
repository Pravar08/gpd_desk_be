
const express = require('express');
const { pool } = require('../../db');
const userRouter = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');
const FIXED_AES_SECRET_KEY='f3b9e1c82d5c4b7593e1f8a2c2e7b354'
userRouter.post('/user/username-verify', async (req, res) => {
  const { username } = req.body;
//  await  main()
  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }

  try {


    // Check in user_credentials
    const userResult = await pool.query(
      'SELECT frontend_id FROM user_credentials WHERE username = $1',
      [username]
    );

    if (userResult.rowCount > 0) {
      const secretKey = crypto.randomBytes(16).toString('hex'); // 128-bit key

      return res.status(200).json({
        success: true,
        type: 'user',
        secretKey,
        frontend_id: userResult.rows[0].frontend_id
      });
    }

    // Check in customer_credentials
    const customerResult = await pool.query(
      'SELECT frontend_id FROM customer_credentials WHERE username = $1',
      [username]
    );

    if (customerResult.rowCount > 0) {
      const secretKey = crypto.randomBytes(16).toString('hex');

      return res.status(200).json({
        success: true,
        type: 'customer',
        secretKey,
        frontend_id: customerResult.rows[0].frontend_id
      });
    }

    return res.status(404).json({ success: false, message: 'Username not found' });

  } catch (error) {
    console.error('Username verify error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


userRouter.post('/user/login', async (req, res) => {
  const { username, encryptedPassword, userType } = req.body;

  if (!username || !encryptedPassword || userType === undefined) {
    return res.status(400).json({ success: false, message: 'Missing login fields' });
  }

  const tableMap = {
    0: 'user_credentials',
    1: 'customer_credentials',
  };
  const tableName = tableMap[userType];

  if (!tableName) {
    return res.status(400).json({ success: false, message: 'Invalid user type' });
  }

  try {
    // Step 1: Fetch hashed password
    const result = await pool.query(
      `SELECT password FROM ${tableName} WHERE username = $1`,
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Step 2: Decrypt using fixed key
    let decryptedPassword = '';
    try {
      decryptedPassword = CryptoJS.AES.decrypt(encryptedPassword, FIXED_AES_SECRET_KEY).toString(CryptoJS.enc.Utf8);
      if (!decryptedPassword) {
        return res.status(400).json({
          success: false,
          message: 'Decryption failed. Encrypted password is invalid or corrupted.'
        });
      }
    } catch (err) {
      console.error('Decryption error:', err.message);
      return res.status(400).json({
        success: false,
        message: 'AES decryption failed',
        error: err.message
      });
    }

    const storedHashedPassword = result.rows[0].password;

    // Step 3: Compare decrypted with hash
    const isValid = await bcrypt.compare(decryptedPassword, storedHashedPassword);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Step 4: Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Step 5: Update token in DB
    await pool.query(
      `UPDATE ${tableName} SET session_token = $1 WHERE username = $2`,
      [sessionToken, username]
    );
let resPonse
    if(userType===0){
   const {rows} =await pool.query(
`Select username,role,name,phone,email,address,user_id from user_credentials
LEFT JOIN user_details ON user_details.user_id=user_credentials.id
WHERE username='${username}'`
    );
    resPonse=rows[0]
  }else{
    const {rows} =await pool.query(
      `Select customer_credentials.username,customer_credentials.role,contact_name,company_name,company_type,branches,sensors_taken,official_contact,customer_credentials.email,customer_id from customer_credentials
      LEFT JOIN customer_details ON customer_details.id=customer_credentials.customer_id
      WHERE username='${username}'`)
    resPonse=rows[0]

  }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      sessionToken,
      userType,
      userDetials:resPonse
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

userRouter.post('/user/verify-token', async (req, res) => {
  const { sessionToken } = req.body;

  if (!sessionToken) {
    return res.status(400).json({ success: false, message: 'Session token is required' });
  }

  try {
    const result = await pool.query(`SELECT * FROM verify_session_token($1)`, [sessionToken]);

    if (result.rowCount === 0) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
    }

    const { user_type, username,role } = result.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Token verified',
      userType: user_type,
      username,
      role
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


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
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = `
        SELECT insert_user_with_details(
          $1, $2, $3, $4, $5, $6, $7, $8
        )
      `;
  
      await pool.query(query, [
        username,
        hashedPassword,
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