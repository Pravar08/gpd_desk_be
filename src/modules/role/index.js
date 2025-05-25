const express = require("express");
const RoleRouter = express.Router();
const {pool} = require('../../db'); // Your PostgreSQL pool instance


RoleRouter.post("/role/add", async (req, res) => {
    const { role_name, permissions, reporting_to } = req.body;
    try {
      await pool.query(
        `SELECT insert_role($1, $2, $3)`,
        [role_name, permissions, reporting_to]
      );
      res.status(201).json({ message: "Role inserted successfully" });
    } catch (error) {
      console.error("Insert Role Error:", error);
      res.status(500).json({ error: "Failed to insert role" });
    }
  });
  
  // Fetch Roles
  RoleRouter.get("/role/all", async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM fetch_roles()`);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Fetch Roles Error:", error);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });
  
  // Edit Role
  RoleRouter.put("/role/edit/:id", async (req, res) => {
    const roleId = req.params.id;
    const { role_name, permissions, reporting_to } = req.body;
    try {
      await pool.query(
        `SELECT update_role($1, $2, $3, $4)`,
        [roleId, role_name, permissions, reporting_to]
      );
      res.status(200).json({ message: "Role updated successfully" });
    } catch (error) {
      console.error("Edit Role Error:", error);
      res.status(500).json({ error: "Failed to update role" });
    }
  });
  
  // Delete Role (soft delete)
  RoleRouter.delete("/role/delete/:id", async (req, res) => {
    const roleId = req.params.id;
    try {
      await pool.query(`SELECT delete_role($1)`, [roleId]);
      res.status(200).json({ message: "Role deleted (status set to 0)" });
    } catch (error) {
      console.error("Delete Role Error:", error);
      res.status(500).json({ error: "Failed to delete role" });
    }
  });
module.exports = RoleRouter;
  