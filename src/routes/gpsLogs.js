const express = require('express');
const pool = require('../db'); // PostgreSQL connection
const router = express.Router();

// Route: Fetch paginated GPS logs
router.get('/gps-logs', async (req, res) => {
    try {
        let limit = parseInt(req.query.limit) || 10; // Default limit: 10
        let page = parseInt(req.query.page) || 1;    // Default page: 1

        if (limit > 100) limit = 100; // Prevent too large requests
        if (page < 1) page = 1;       // Ensure valid page number

        const query = 'SELECT * FROM fetch_gps_logs($1, $2)';
        const { rows } = await pool.query(query, [limit, page]);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching GPS logs:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
