const express = require("express");
const { Pool } = require("pg");
const moment = require("moment-timezone"); 
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// DB pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Late thresholds configuration
const LATE_THRESHOLDS = {
  1: { hour: 8, minute: 1 },   // Monday: 8:01 AM is late
  2: { hour: 8, minute: 31 },  // Tuesday: 8:31 AM is late
  3: { hour: 8, minute: 31 },  // Wednesday: 8:31 AM is late
  4: { hour: 8, minute: 31 },  // Thursday: 8:31 AM is late
  5: { hour: 8, minute: 31 },  // Friday: 8:31 AM is late
  // Saturday and Sunday have no late thresholds (weekends)
};

// Helper function to create notification
const createNotification = async (user_id, message, type = 'attendance') => {
  try {
    if (!user_id) {
      console.log('⚠️ No user_id for notification');
      return;
    }

    console.log(`📩 Creating notification for user ${user_id}: ${message}`);
    
    const result = await pool.query(
      `INSERT INTO notifications (user_id, message) 
       VALUES ($1, $2) 
       RETURNING *`,
      [user_id, message]
    );

    console.log(`✅ Created notification ID: ${result.rows[0].id}`);
    
    // Optional: Send push notification
    try {
      const tokenResult = await pool.query(
        `SELECT expo_push_token FROM employee_push_tokens WHERE user_id = $1 LIMIT 1`,
        [user_id]
      );

      if (tokenResult.rows.length > 0 && tokenResult.rows[0].expo_push_token) {
        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: tokenResult.rows[0].expo_push_token,
            sound: "default",
            title: "Attendance Recorded",
            body: message,
            data: { type: type }
          }),
        });
        console.log("📤 Push notification sent");
      }
    } catch (pushError) {
      console.warn("⚠️ Could not send push notification:", pushError.message);
    }

    return result.rows[0];
  } catch (error) {
    console.error("❌ Error creating notification:", error.message);
  }
};

// Helper function to determine which attendance slot based on time of day
// Helper function to determine which attendance slot based on time of day
const determineAttendanceSlot = (dateTime) => {
  const scanTime = moment(dateTime).tz("Asia/Manila");
  const hour = scanTime.hour();
  const minute = scanTime.minute();
  
  // Convert to minutes since midnight for easier comparison
  const minutesSinceMidnight = hour * 60 + minute;
  
  // Define clear boundaries
  const MORNING_CHECKIN_END = 720;    // 12:00 PM
  const MORNING_CHECKOUT_START = 660; // 11:00 AM
  const MORNING_CHECKOUT_END = 840;   // 2:00 PM
  const AFTERNOON_CHECKIN_START = 750; // 12:30 PM
  const AFTERNOON_CHECKIN_END = 1020;  // 5:00 PM
  
  // Morning check-in: 4:00 AM - 12:00 PM
  if (minutesSinceMidnight >= 240 && minutesSinceMidnight < MORNING_CHECKIN_END) {
    return { 
      slot: 'am_checkin', 
      type: 'Morning check-in'
    };
  }
  // Morning check-out: 11:00 AM - 2:00 PM
  else if (minutesSinceMidnight >= MORNING_CHECKOUT_START && minutesSinceMidnight < MORNING_CHECKOUT_END) {
    return { 
      slot: 'am_checkout', 
      type: 'Morning check-out'
    };
  }
  // Afternoon check-in: 12:30 PM - 5:00 PM
  else if (minutesSinceMidnight >= AFTERNOON_CHECKIN_START && minutesSinceMidnight < AFTERNOON_CHECKIN_END) {
    return { 
      slot: 'pm_checkin', 
      type: 'Afternoon check-in'
    };
  }
  // Afternoon check-out: 2:00 PM - 11:59 PM
  else if (minutesSinceMidnight >= MORNING_CHECKOUT_END) {
    return { 
      slot: 'pm_checkout', 
      type: 'Afternoon check-out'
    };
  }
  // Night shift check-in: 12:00 AM - 4:00 AM
  else if (minutesSinceMidnight < 240) {
    return { 
      slot: 'am_checkin', 
      type: 'Morning check-in (night shift)'
    };
  }
  // Handle the gap between 12:00 PM - 12:30 PM
  // This is the lunch break period
  else if (minutesSinceMidnight >= MORNING_CHECKIN_END && minutesSinceMidnight < AFTERNOON_CHECKIN_START) {
    // If closer to 12:00 PM, treat as morning checkout
    // If closer to 12:30 PM, treat as afternoon check-in
    const distanceToNoon = minutesSinceMidnight - MORNING_CHECKIN_END; // 0-30
    const distanceTo1230 = AFTERNOON_CHECKIN_START - minutesSinceMidnight; // 0-30
    
    if (distanceToNoon <= distanceTo1230) {
      return { 
        slot: 'am_checkout', 
        type: 'Morning check-out (lunch time)'
      };
    } else {
      return { 
        slot: 'pm_checkin', 
        type: 'Afternoon check-in (lunch time)'
      };
    }
  }
  
  // Fallback - should never reach here
  return { 
    slot: 'pm_checkout', 
    type: 'Afternoon check-out'
  };
};

// Helper function to check if check-in is late
const checkIfLate = (dateTime) => {
  const scanTime = moment(dateTime).tz("Asia/Manila");
  const dayOfWeek = scanTime.day(); // 0 = Sunday, 1 = Monday, etc.
  
  // Check if it's a weekday (Monday = 1 to Friday = 5)
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    const threshold = LATE_THRESHOLDS[dayOfWeek];
    
    // Create threshold time for today
    const thresholdTime = scanTime.clone()
      .hour(threshold.hour)
      .minute(threshold.minute)
      .second(0)
      .millisecond(0);
    
    // Check if scan is after the threshold time
    if (scanTime.isAfter(thresholdTime)) {
      const minutesLate = scanTime.diff(thresholdTime, 'minutes');
      return {
        isLate: true,
        minutesLate: minutesLate,
        thresholdTime: thresholdTime.format('HH:mm')
      };
    }
  }
  
  return { isLate: false, minutesLate: 0, thresholdTime: null };
};

app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl}`);
  next();
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

app.get("/iclock", (req, res) => {
  console.log("📡 /iclock ping from device");
  res.type("text/plain").send("OK");
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
      const dayOfWeek = moment(dateTime).tz("Asia/Manila").day();
      const formattedTime = moment(dateTime).tz("Asia/Manila").format("HH:mm");
      const formattedDateTime = moment(dateTime).tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss");

      try {
        // Get employee info by PIN (may or may not have user_id)
        const result = await pool.query(
          "SELECT user_id, first_name, last_name FROM employee_list WHERE id_number = $1",
          [pin]
        );

        let user_id = null;
        let employeeName = pin;
        let firstName = "";
        let lastName = "";

        if (result.rows.length > 0) {
          user_id = result.rows[0].user_id;
          firstName = result.rows[0].first_name || "";
          lastName = result.rows[0].last_name || "";
          employeeName = `${firstName} ${lastName}`.trim() || pin;
        }

        // Determine which attendance slot based on time of day
        const slotInfo = determineAttendanceSlot(dateTime);
        const columnToUpdate = slotInfo.slot;
        const checkinType = slotInfo.type;

        // Check if this slot is already filled
        const existingLog = await pool.query(
          `SELECT ${columnToUpdate} FROM attendance_logs 
           WHERE attendance_date = $1 AND (pin = $2 OR user_id = $3)`,
          [attendanceDate, pin, user_id || null]
        );

        const isAlreadyRecorded = existingLog.rows.length > 0 && 
                                 existingLog.rows[0][columnToUpdate] !== null;

        // Check if already scanned in this slot
        if (isAlreadyRecorded) {
          console.log(`⚠️ ${employeeName} (${pin}) already has ${checkinType} recorded for ${attendanceDate}`);
          
          // Send notification for duplicate scan
          if (user_id) {
            await createNotification(
              user_id, 
              `You have already scanned your ${checkinType.toLowerCase()} for today.`, 
              'warning'
            );
          }
          continue; // Skip processing this scan
        }

        // Choose the proper unique constraint
        const constraintName = user_id ? "unique_attendance_per_user" : "unique_attendance_per_pin";

        // Check if it's a morning check-in and mark if late
        let isLate = false;
        let minutesLate = 0;
        let lateThreshold = null;
        
        if (columnToUpdate === 'am_checkin') {
          const lateCheck = checkIfLate(dateTime);
          isLate = lateCheck.isLate;
          minutesLate = lateCheck.minutesLate;
          lateThreshold = lateCheck.thresholdTime;
          
          if (isLate) {
            console.log(`⏰ ${employeeName} is ${minutesLate} minutes late (scanned at ${formattedTime}, threshold: ${lateThreshold})`);
          }
        }

        // UPSERT: insert if not exists, else update the correct slot & name
        const query = `
          INSERT INTO attendance_logs (user_id, pin, name, attendance_date, ${columnToUpdate}, is_late, minutes_late, late_threshold)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT ON CONSTRAINT ${constraintName}
          DO UPDATE
          SET ${columnToUpdate} = COALESCE(attendance_logs.${columnToUpdate}, EXCLUDED.${columnToUpdate}),
              name = EXCLUDED.name,
              user_id = COALESCE(attendance_logs.user_id, EXCLUDED.user_id),
              is_late = COALESCE(attendance_logs.is_late, EXCLUDED.is_late),
              minutes_late = COALESCE(attendance_logs.minutes_late, EXCLUDED.minutes_late),
              late_threshold = COALESCE(attendance_logs.late_threshold, EXCLUDED.late_threshold),
              updated_at = NOW()
          `;

        await pool.query(
          query,
          [user_id || null, pin, employeeName, attendanceDate, dateTime, isLate, minutesLate, lateThreshold]
        );

        console.log(`✅ ${checkinType} saved for ${employeeName} (${pin}) at ${formattedDateTime}`);

        // Create notification if user_id exists
        if (user_id) {
          let message = `${checkinType} recorded at ${formattedTime}`;
          
          if (isLate) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = dayNames[dayOfWeek];
            message = `⚠️ Late ${checkinType.toLowerCase()} on ${dayName} at ${formattedTime} (${minutesLate} minutes late, threshold: ${lateThreshold})`;
          }
          
          await createNotification(user_id, message, 'attendance');
        }

      } catch (err) {
        console.error("❌ DB Insert/Update Error:", err.message);
      }
    }
  }

  res.send("OK");
});

// Optional: Endpoint to manually adjust attendance if needed
app.post("/api/attendance/manual", async (req, res) => {
  try {
    const { user_id, pin, date, time, slot, reason } = req.body;
    
    if (!date || !time || (!user_id && !pin)) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const dateTime = moment.tz(`${date} ${time}`, "YYYY-MM-DD HH:mm", "Asia/Manila").toDate();
    const attendanceDate = moment(dateTime).tz("Asia/Manila").format("YYYY-MM-DD");
    
    let employeeName = pin;
    let firstName = "";
    let lastName = "";
    let resolvedUserId = user_id;
    let resolvedPin = pin;
    
    // Get employee info
    if (user_id) {
      const result = await pool.query(
        "SELECT first_name, last_name, id_number FROM employee_list WHERE user_id = $1",
        [user_id]
      );
      if (result.rows.length > 0) {
        firstName = result.rows[0].first_name || "";
        lastName = result.rows[0].last_name || "";
        employeeName = `${firstName} ${lastName}`.trim();
        resolvedPin = result.rows[0].id_number;
      }
    } else if (pin) {
      const result = await pool.query(
        "SELECT first_name, last_name, user_id FROM employee_list WHERE id_number = $1",
        [pin]
      );
      if (result.rows.length > 0) {
        resolvedUserId = result.rows[0].user_id;
        firstName = result.rows[0].first_name || "";
        lastName = result.rows[0].last_name || "";
        employeeName = `${firstName} ${lastName}`.trim() || pin;
      }
    }
    
    // Check if it's a morning check-in and mark if late
    let isLate = false;
    let minutesLate = 0;
    let lateThreshold = null;
    
    if (slot === 'am_checkin') {
      const lateCheck = checkIfLate(dateTime);
      isLate = lateCheck.isLate;
      minutesLate = lateCheck.minutesLate;
      lateThreshold = lateCheck.thresholdTime;
    }
    
    // Choose the proper unique constraint
    const constraintName = resolvedUserId ? "unique_attendance_per_user" : "unique_attendance_per_pin";
    
    // UPSERT: insert if not exists, else update the correct slot
    await pool.query(
      `
      INSERT INTO attendance_logs (user_id, pin, name, attendance_date, ${slot}, is_late, minutes_late, late_threshold, manual_adjustment, adjustment_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
      ON CONFLICT ON CONSTRAINT ${constraintName}
      DO UPDATE
      SET ${slot} = EXCLUDED.${slot},
          is_late = EXCLUDED.is_late,
          minutes_late = EXCLUDED.minutes_late,
          late_threshold = EXCLUDED.late_threshold,
          manual_adjustment = true,
          adjustment_reason = EXCLUDED.adjustment_reason,
          name = EXCLUDED.name,
          user_id = COALESCE(attendance_logs.user_id, EXCLUDED.user_id),
          updated_at = NOW()
      `,
      [resolvedUserId || null, resolvedPin || null, employeeName, attendanceDate, dateTime, isLate, minutesLate, lateThreshold, reason || 'Manual adjustment']
    );
    
    console.log(`✅ Manual ${slot} saved for ${employeeName} at ${date} ${time}`);
    
    res.json({ success: true, message: "Attendance manually recorded" });
    
  } catch (error) {
    console.error("❌ Manual attendance error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get late thresholds
app.get("/api/late-thresholds", (req, res) => {
  const thresholds = {};
  
  Object.keys(LATE_THRESHOLDS).forEach(day => {
    const threshold = LATE_THRESHOLDS[day];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    thresholds[dayNames[parseInt(day)]] = `${threshold.hour.toString().padStart(2, '0')}:${threshold.minute.toString().padStart(2, '0')}`;
  });
  
  res.json({
    late_thresholds: thresholds,
    description: "Late thresholds for morning check-in (AM check-in)",
    note: "Saturday and Sunday have no late thresholds"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Attendance server listening on port ${PORT}`);
  console.log(`📝 Late thresholds configured:`);
  console.log(`   • Monday: 8:01 AM`);
  console.log(`   • Tuesday - Friday: 8:31 AM`);
  console.log(`   • Saturday & Sunday: No late threshold`);
});