const express = require("express");
const { Pool } = require("pg");
const moment = require("moment-timezone"); 
require("dotenv").config();

const app = express();
const PORT = 3000;

// DB pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Middleware to capture raw body
app.use((req, res, next) => {
  let data = "";
  req.setEncoding("utf8");
  req.on("data", chunk => (data += chunk));
  req.on("end", () => {
    req.rawBody = data;
    next();
  });
});

app.post("/iclock/cdata", async (req, res) => {
  const table = req.query.table;

  if (table === "ATTLOG" && req.rawBody) {
    console.log("🕒 Attendance Log Received:\n", req.rawBody);

    const lines = req.rawBody.trim().split(/\r?\n/);

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 3) continue;

      const pin = parts[0];
      const rawDateTime = parts[1] + " " + parts[2];

      const dateTime = moment.tz(rawDateTime, "YYYY-MM-DD HH:mm:ss", "Asia/Manila").toDate();
      const attendanceDate = moment(dateTime).tz("Asia/Manila").format("YYYY-MM-DD");
      const hour = moment(dateTime).tz("Asia/Manila").hour();

      try {
        // Get employee info by PIN (may or may not have user_id)
        const result = await pool.query(
          "SELECT user_id, first_name, last_name FROM employee_list WHERE id_number = $1",
          [pin]
        );

        let user_id = null;
        let employeeName = pin;

        if (result.rows.length > 0) {
          user_id = result.rows[0].user_id;
          const { first_name, last_name } = result.rows[0];
          employeeName = `${first_name || ""} ${last_name || ""}`.trim() || pin;
        }

        // Determine AM/PM slot
        let columnToUpdate = null;
        if (hour >= 6 && hour < 12) columnToUpdate = "am_checkin";
        else if (hour >= 11 && hour < 13) columnToUpdate = "am_checkout";
        else if (hour >= 13 && hour < 17) columnToUpdate = "pm_checkin";
        else if (hour >= 16 && hour <= 20) columnToUpdate = "pm_checkout";

        if (!columnToUpdate) {
          console.warn(`⚠️ Skipped: No valid slot for ${rawDateTime}`);
          continue;
        }

        // Choose the proper unique constraint
        const constraintName = user_id ? "unique_attendance_per_user" : "unique_attendance_per_pin";

        // UPSERT: insert if not exists, else update the correct slot & name
        await pool.query(
          `
          INSERT INTO attendance_logs (user_id, pin, name, attendance_date, ${columnToUpdate})
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT ON CONSTRAINT ${constraintName}
          DO UPDATE
          SET ${columnToUpdate} = COALESCE(attendance_logs.${columnToUpdate}, EXCLUDED.${columnToUpdate}),
              name = EXCLUDED.name,
              user_id = COALESCE(attendance_logs.user_id, EXCLUDED.user_id),
              updated_at = NOW()
          `,
          [user_id || null, pin, employeeName, attendanceDate, dateTime]
        );

        console.log(`✅ ${columnToUpdate} saved for ${employeeName} (${pin}) at ${moment(dateTime).tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss")}`);

      } catch (err) {
        console.error("❌ DB Insert/Update Error:", err.message);
      }
    }
  }

  res.send("OK");
});


app.listen(PORT, () => {
  console.log(`🚀 Attendance server listening on port ${PORT}`);
});
