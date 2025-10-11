const express = require("express");
const { Pool } = require("pg");
const moment = require("moment-timezone"); // ✅ For PH time
require("dotenv").config();

const app = express();
const PORT = 3000;

// DB pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Middleware: capture raw body
app.use((req, res, next) => {
  let data = "";
  req.setEncoding("utf8");
  req.on("data", (chunk) => {
    data += chunk;
  });
  req.on("end", () => {
    req.rawBody = data;
    next();
  });
});

// Handle only ATTLOG
app.post("/iclock/cdata", async (req, res) => {
  const table = req.query.table;

  if (table === "ATTLOG" && req.rawBody) {
    console.log("🕒 Attendance Log Received:");
    console.log(req.rawBody);

    const lines = req.rawBody.trim().split(/\r?\n/);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        const pin = parts[0]; // PIN from WL10 = id_number
        const rawDateTime = parts[1] + " " + parts[2]; 

        // ✅ Convert to PH Time
        const dateTime = moment.tz(rawDateTime, "YYYY-MM-DD HH:mm:ss", "Asia/Manila").toDate();
        const attendanceDate = moment(dateTime).tz("Asia/Manila").format("YYYY-MM-DD");
        const hour = moment(dateTime).tz("Asia/Manila").hour();

        try {
          // 🔎 Check if employee exists
          const result = await pool.query(
            "SELECT user_id, first_name, last_name FROM employee_list WHERE id_number = $1",
            [pin]
          );

          if (result.rows.length === 0) {
            console.warn(`⚠️ Skipped: No employee found for PIN=${pin}`);
            continue; 
          }

          const { user_id, first_name, last_name } = result.rows[0];
          const employeeName = `${first_name} ${last_name}`;

          // ⏰ Decide which slot to fill
          let columnToUpdate = null;
          if (hour >= 6 && hour < 12) columnToUpdate = "am_checkin";
          else if (hour >= 11 && hour < 13) columnToUpdate = "am_checkout";
          else if (hour >= 13 && hour < 17) columnToUpdate = "pm_checkin";
          else if (hour >= 16 && hour <= 20) columnToUpdate = "pm_checkout";

          if (!columnToUpdate) {
            console.warn(`⚠️ Skipped: No valid slot for ${rawDateTime}`);
            continue;
          }

          // 💾 Insert row if not exists
          await pool.query(
            `
            INSERT INTO attendance_logs (user_id, pin, name, attendance_date)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, attendance_date) DO NOTHING
            `,
            [user_id, pin, employeeName, attendanceDate]
          );

          // 🛡️ Only update slot if empty
          const updateResult = await pool.query(
            `
            UPDATE attendance_logs
            SET ${columnToUpdate} = $3, updated_at = NOW()
            WHERE user_id = $1 AND attendance_date = $2 AND ${columnToUpdate} IS NULL
            `,
            [user_id, attendanceDate, dateTime]
          );

          if (updateResult.rowCount > 0) {
            console.log(
              `✅ ${columnToUpdate} saved for ${employeeName} (${pin}/${user_id}) at ${moment(dateTime)
                .tz("Asia/Manila")
                .format("YYYY-MM-DD HH:mm:ss")}`
            );
          } else {
            console.log(
              `ℹ️ Slot ${columnToUpdate} already filled for ${employeeName} (${pin}/${user_id}) on ${attendanceDate}`
            );
          }
        } catch (err) {
          console.error("❌ DB Insert Error:", err.message);
        }
      }
    }
  }

  res.send("OK");
});

// Default route
app.use((req, res) => res.send("OK"));

app.listen(PORT, () => {
  console.log(`🚀 Debug server listening on port ${PORT}`);
});
