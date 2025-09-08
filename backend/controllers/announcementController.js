import sql from "../config/db.js";

// Get all announcements
export const getAnnouncements = async (req, res) => {
  try {
    const result = await sql`SELECT a.*, u.fullname AS posted_by, u.role AS position
                             FROM announcement a
                             JOIN userAdmin u ON a.created_by = u.id
                             ORDER BY a.created_at DESC`;
    res.json(result);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Post new announcement
export const createAnnouncement = async (req, res) => {
  const { title, details, priority, created_by } = req.body;

  try {
    const result = await sql`
      INSERT INTO announcement (title, details, priority, created_by)
      VALUES (${title}, ${details}, ${priority}, ${created_by})
      RETURNING *;
    `;
    res.json(result[0]);
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
