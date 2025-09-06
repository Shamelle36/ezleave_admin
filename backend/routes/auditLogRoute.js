// routes/auditLogRoutes.js
import express from "express";
import sql from "../config/db.js"; // ✅ use default export, not { sql }

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await sql`
      SELECT a.id, a.created_at, a.activity, a.details, a.ip_address,
             u.email, u.full_name, u.role
      FROM audit_logs a
      JOIN userAdmin u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `;

    res.json(result); // postgres.js already returns rows
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ error: "Error fetching logs" });
  }
});

export default router;
