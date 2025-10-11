import sql from "../config/db.js";  // using postgres client

// Helper to format PH time
const formatPHTime = (date) => {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
};

// 📌 Get all attendance logs
export const getAttendanceLogs = async (req, res) => {
  try {
    const { date } = req.query; // optional filter by date (YYYY-MM-DD)
    let result;

    if (date) {
      result = await sql`
        SELECT id, pin, name, attendance_date, 
               am_checkin, am_checkout, pm_checkin, pm_checkout
        FROM attendance_logs
        WHERE attendance_date = ${date}
        ORDER BY pin ASC
      `;
    } else {
      result = await sql`
        SELECT id, pin, name, attendance_date, 
               am_checkin, am_checkout, pm_checkin, pm_checkout
        FROM attendance_logs
        ORDER BY attendance_date DESC
      `;
    }

    // Format response (PH time)
    const logs = result.map((row) => ({
      id: row.id,
      pin: row.pin,
      name: row.name,
      attendance_date: new Date(row.attendance_date).toISOString().split("T")[0], // YYYY-MM-DD
      am_checkin: formatPHTime(row.am_checkin),
      am_checkout: formatPHTime(row.am_checkout),
      pm_checkin: formatPHTime(row.pm_checkin),
      pm_checkout: formatPHTime(row.pm_checkout),
    }));

    res.json(logs);
  } catch (err) {
    console.error("❌ Error fetching attendance logs:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

