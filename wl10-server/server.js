const express = require("express");
const { Pool } = require("pg");
const moment = require("moment-timezone");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

/* ===================== DB POOL ===================== */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/* ===================== LATE THRESHOLDS ===================== */
const LATE_THRESHOLDS = {
  1: { hour: 8, minute: 1 },
  2: { hour: 8, minute: 31 },
  3: { hour: 8, minute: 31 },
  4: { hour: 8, minute: 31 },
  5: { hour: 8, minute: 31 },
};

/* ===================== NOTIFICATION ===================== */
const createNotification = async (user_id, message, type = "attendance") => {
  try {
    if (!user_id) return;

    await pool.query(
      `INSERT INTO notifications (user_id, message) VALUES ($1,$2)`,
      [user_id, message]
    );

    const tokenResult = await pool.query(
      `SELECT expo_push_token FROM employee_push_tokens WHERE user_id = $1 LIMIT 1`,
      [user_id]
    );

    if (tokenResult.rows.length && tokenResult.rows[0].expo_push_token) {
      fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: tokenResult.rows[0].expo_push_token,
          sound: "default",
          title: "Attendance Recorded",
          body: message,
          data: { type },
        }),
      }).catch(() => {});
    }
  } catch (err) {
    console.error("❌ Notification error:", err.message);
  }
};

/* ===================== SLOT ===================== */
const determineAttendanceSlot = async (dateTime, user_id, attendanceDate) => {
  const scan = moment(dateTime).tz("Asia/Manila");
  const mins = scan.hours() * 60 + scan.minutes();

  // Check if morning checkout already exists
  const morningCheckout = await pool.query(
    `SELECT am_checkout FROM attendance_logs WHERE attendance_date=$1 AND user_id=$2`,
    [attendanceDate, user_id]
  );

  if (morningCheckout.rows.length && morningCheckout.rows[0].am_checkout) {
    if (mins >= 12 * 60 && mins < 17 * 60) return { slot: "pm_checkin", type: "Afternoon check-in" }; // 12:00 PM - 5:00 PM
    return { slot: "pm_checkout", type: "Afternoon check-out" };
  }

  // Morning slots
  if (mins >= 4 * 60 && mins < 12 * 60) return { slot: "am_checkin", type: "Morning check-in" };
  if (mins >= 11 * 60 && mins < 14 * 60) return { slot: "am_checkout", type: "Morning check-out" };

  // Default PM slots
  if (mins >= 12 * 60 && mins < 17 * 60) return { slot: "pm_checkin", type: "Afternoon check-in" };
  return { slot: "pm_checkout", type: "Afternoon check-out" };
};

/* ===================== LATE CHECK ===================== */
const checkIfLate = (dateTime) => {
  const scan = moment(dateTime).tz("Asia/Manila");
  const day = scan.day();

  if (day >= 1 && day <= 5) {
    const t = LATE_THRESHOLDS[day];
    const threshold = scan.clone().hour(t.hour).minute(t.minute).second(0);

    if (scan.isAfter(threshold)) {
      return {
        isLate: true,
        minutesLate: scan.diff(threshold, "minutes"),
        thresholdTime: threshold.format("HH:mm"),
      };
    }
  }
  return { isLate: false, minutesLate: 0, thresholdTime: null };
};

/* ===================== RAW BODY ===================== */
app.use((req, res, next) => {
  let data = "";
  req.on("data", (c) => (data += c));
  req.on("end", () => {
    req.rawBody = data;
    next();
  });
});

/* ===================== ICLOCK ===================== */
app.get("/iclock", (_, res) => {
  res.type("text/plain").send("OK");
});

/* ===================== ATTENDANCE PROCESS ===================== */
app.post("/iclock/cdata", async (req, res) => {
  res.type("text/plain").send("OK"); // Instant response

  if (req.query.table !== "ATTLOG" || !req.rawBody) return;

  const lines = req.rawBody.trim().split(/\r?\n/);

  for (const line of lines) {
    try {
      const [pin, d, t] = line.split(/\s+/);
      if (!pin || !d || !t) continue;

      const dateTime = moment.tz(`${d} ${t}`, "YYYY-MM-DD HH:mm:ss", "Asia/Manila").toDate();
      const attendanceDate = moment(dateTime).format("YYYY-MM-DD");
      const time = moment(dateTime).format("HH:mm");

      // Get employee info
      const emp = await pool.query(
        "SELECT user_id, first_name, last_name FROM employee_list WHERE id_number=$1",
        [pin]
      );

      const user_id = emp.rows[0]?.user_id || null;
      const name = emp.rows.length
        ? `${emp.rows[0].first_name || ""} ${emp.rows[0].last_name || ""}`.trim()
        : pin;

      // Determine slot
      const { slot, type } = await determineAttendanceSlot(dateTime, user_id, attendanceDate);
      let recordSlot = slot;

      // Fetch previous scan info
      const existing = await pool.query(
        user_id
          ? `SELECT am_checkin, am_checkout, pm_checkin, pm_checkout, scan_count, last_scan_time FROM attendance_logs WHERE attendance_date=$1 AND user_id=$2`
          : `SELECT am_checkin, am_checkout, pm_checkin, pm_checkout, scan_count, last_scan_time FROM attendance_logs WHERE attendance_date=$1 AND pin=$2`,
        user_id ? [attendanceDate, user_id] : [attendanceDate, pin]
      );

      let scan_count = 0;
      let last_scan_time = null;
      let slot_value = null;

      if (existing.rows.length) {
        slot_value = existing.rows[0][slot];
        scan_count = existing.rows[0].scan_count || 0;
        last_scan_time = existing.rows[0].last_scan_time;
      }

      // ====== SCAN LOGIC ======
      if (!last_scan_time || moment(dateTime).diff(last_scan_time, "minutes") > 5) {
        // reset after 5 minutes
        scan_count = 0;
      }

      let isLate = false,
        minutesLate = 0,
        threshold = null,
        msg = "";

      if (scan_count === 0) {
        // First scan → IN
        if (slot.endsWith("checkin") && slot === "am_checkin") {
          const late = checkIfLate(dateTime);
          isLate = late.isLate;
          minutesLate = late.minutesLate;
          threshold = late.thresholdTime;
        }
        slot_value = dateTime;
        scan_count = 1;
        msg = isLate
          ? `⚠️ Late ${type.toLowerCase()} at ${time} (${minutesLate} mins)`
          : `${type} recorded at ${time}`;
      } else if (scan_count >= 1 && scan_count < 3) {
        // 2nd-3rd consecutive scan → warning
        scan_count += 1;
        msg = `⚠️ Warning: consecutive scan for ${type.toLowerCase()} (${4 - scan_count} scans left before OUT)`;
      } else {
        // 4th scan → OUT
        if (slot.endsWith("checkin")) {
          recordSlot = slot.replace("checkin", "checkout");
        }
        slot_value = dateTime;
        scan_count = 0;
        msg = `${type.replace("check-in", "check-out")} OUT recorded at ${time}`;
      }

      const constraint = user_id ? "unique_attendance_per_user" : "unique_attendance_per_pin";

      // UPSERT attendance
      await pool.query(
        `
        INSERT INTO attendance_logs
          (user_id, pin, name, attendance_date, ${recordSlot}, is_late, minutes_late, late_threshold, scan_count, last_scan_time)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT ON CONSTRAINT ${constraint}
        DO UPDATE SET
          ${recordSlot} = COALESCE(attendance_logs.${recordSlot}, EXCLUDED.${recordSlot}),
          is_late = COALESCE(attendance_logs.is_late, EXCLUDED.is_late),
          minutes_late = COALESCE(attendance_logs.minutes_late, EXCLUDED.minutes_late),
          late_threshold = COALESCE(attendance_logs.late_threshold, EXCLUDED.late_threshold),
          scan_count = EXCLUDED.scan_count,
          last_scan_time = EXCLUDED.last_scan_time,
          updated_at = NOW()
        `,
        [user_id, pin, name, attendanceDate, slot_value, isLate, minutesLate, threshold, scan_count, dateTime]
      );

      // Send notification
      if (user_id) {
        createNotification(user_id, msg, "attendance").catch(() => {});
      }
    } catch (err) {
      console.error("❌ Attendance error:", err.message);
    }
  }
});

/* ===================== START SERVER ===================== */
app.listen(PORT, () => {
  console.log(`🚀 Attendance server running on port ${PORT}`);
});
