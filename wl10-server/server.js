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

// Helper function to get time settings for a specific day
const getTimeSettingsForDay = async (dateTime) => {
  try {
    const dayOfWeek = moment(dateTime).tz("Asia/Manila").day(); // 0 = Sunday
    
    const dayMapping = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };
    
    const dayName = dayMapping[dayOfWeek];
    
    const result = await pool.query(
      `SELECT * FROM attendance_time_settings WHERE day_of_week = $1`,
      [dayName]
    );
    
    if (result.rows.length === 0) {
      return { isDayOff: true, timeSettings: null };
    }
    
    const timeSettings = result.rows[0];
    
    if (!timeSettings.is_active) {
      return { isDayOff: true, timeSettings: timeSettings };
    }
    
    return { isDayOff: false, timeSettings: timeSettings };
  } catch (error) {
    console.error('❌ Error getting time settings:', error.message);
    return { isDayOff: true, timeSettings: null };
  }
};

// Helper function to check if scan is within working hours and determine which slot
const validateAndDetermineSlot = (scanDateTime, timeSettings) => {
  if (!timeSettings) {
    return { isValid: false, slot: null, type: null, isLate: false, isEarly: false };
  }

  const scanTime = moment(scanDateTime).tz("Asia/Manila");
  const scanTimeStr = scanTime.format("HH:mm:ss");
  
  const startTime = moment.tz(timeSettings.start_time, "HH:mm:ss", "Asia/Manila");
  const endTime = moment.tz(timeSettings.end_time, "HH:mm:ss", "Asia/Manila");
  
  // Check if scan is within working hours
  if (scanTime.isBefore(startTime) || scanTime.isAfter(endTime)) {
    return { isValid: false, slot: null, type: null, isLate: false, isEarly: false };
  }
  
  // Calculate work duration
  const workDuration = endTime.diff(startTime, 'minutes');
  
  // More flexible time windows that cover the entire workday
  // AM check-in: First 4 hours of workday (until lunch)
  const amCheckinEnd = startTime.clone().add(4 * 60, 'minutes');
  
  // AM check-out: Middle 2 hours of workday (lunch period)
  const amCheckoutStart = startTime.clone().add(3.5 * 60, 'minutes'); // 3.5 hours after start
  const amCheckoutEnd = startTime.clone().add(5.5 * 60, 'minutes'); // 5.5 hours after start
  
  // PM check-in: Next 4 hours after lunch
  const pmCheckinStart = startTime.clone().add(5 * 60, 'minutes'); // 5 hours after start
  const pmCheckinEnd = startTime.clone().add(9 * 60, 'minutes'); // 9 hours after start
  
  // PM check-out: Last 4 hours of workday
  const pmCheckoutStart = startTime.clone().add(8.5 * 60, 'minutes'); // 8.5 hours after start
  
  // Determine which slot the scan belongs to
  if (scanTime.isBetween(startTime, amCheckinEnd, null, '[)')) {
    // AM Check-in: Late if ANY time after exact start time
    const isLate = scanTime.isAfter(startTime);
    
    return { 
      isValid: true, 
      slot: 'am_checkin', 
      type: 'Morning check-in',
      isLate: isLate,
      isEarly: false
    };
  } else if (scanTime.isBetween(amCheckoutStart, amCheckoutEnd, null, '[)')) {
    // AM Check-out: Expected around 4 hours after start, early if before that
    const expectedCheckout = startTime.clone().add(4 * 60, 'minutes');
    const isEarly = scanTime.isBefore(expectedCheckout);
    
    return { 
      isValid: true, 
      slot: 'am_checkout', 
      type: 'Morning check-out',
      isLate: false,
      isEarly: isEarly
    };
  } else if (scanTime.isBetween(pmCheckinStart, pmCheckinEnd, null, '[)')) {
    // PM Check-in: Expected around 5 hours after start, late if after that
    const expectedCheckin = startTime.clone().add(5 * 60, 'minutes');
    const isLate = scanTime.isAfter(expectedCheckin);
    
    return { 
      isValid: true, 
      slot: 'pm_checkin', 
      type: 'Afternoon check-in',
      isLate: isLate,
      isEarly: false
    };
  } else if (scanTime.isBetween(pmCheckoutStart, endTime, null, '[)')) {
    // PM Check-out: Early if before end time
    const isEarly = scanTime.isBefore(endTime);
    
    return { 
      isValid: true, 
      slot: 'pm_checkout', 
      type: 'Afternoon check-out',
      isLate: false,
      isEarly: isEarly
    };
  }
  
  // If scan is in between defined windows, still allow it but determine the closest slot
  // This handles scans that might be in transition periods
  const timeFromStart = scanTime.diff(startTime, 'minutes');
  
  if (timeFromStart < 4 * 60) { // Less than 4 hours from start
    const isLate = scanTime.isAfter(startTime);
    return { 
      isValid: true, 
      slot: 'am_checkin', 
      type: 'Morning check-in',
      isLate: isLate,
      isEarly: false
    };
  } else if (timeFromStart >= 4 * 60 && timeFromStart < 5 * 60) { // Between 4-5 hours
    const expectedCheckout = startTime.clone().add(4 * 60, 'minutes');
    const isEarly = scanTime.isBefore(expectedCheckout);
    return { 
      isValid: true, 
      slot: 'am_checkout', 
      type: 'Morning check-out',
      isLate: false,
      isEarly: isEarly
    };
  } else if (timeFromStart >= 5 * 60 && timeFromStart < 8.5 * 60) { // Between 5-8.5 hours
    const expectedCheckin = startTime.clone().add(5 * 60, 'minutes');
    const isLate = scanTime.isAfter(expectedCheckin);
    return { 
      isValid: true, 
      slot: 'pm_checkin', 
      type: 'Afternoon check-in',
      isLate: isLate,
      isEarly: false
    };
  } else if (timeFromStart >= 8.5 * 60) { // More than 8.5 hours
    const isEarly = scanTime.isBefore(endTime);
    return { 
      isValid: true, 
      slot: 'pm_checkout', 
      type: 'Afternoon check-out',
      isLate: false,
      isEarly: isEarly
    };
  }
  
  return { isValid: false, slot: null, type: null, isLate: false, isEarly: false };
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

        // Get time settings for this day
        const daySettings = await getTimeSettingsForDay(dateTime);
        
        // Check if it's a day off
        if (daySettings.isDayOff) {
          console.log(`🚫 ${employeeName} (${pin}) scanned on a day off (${attendanceDate})`);
          
          // Send notification for day off scan
          if (user_id) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = dayNames[dayOfWeek];
            await createNotification(
              user_id, 
              `Today is ${dayName} (day off). Attendance scanning is not allowed on non-working days.`, 
              'warning'
            );
          }
          
          console.log(`❌ Day off attendance NOT recorded for ${employeeName} (${pin})`);
          continue; // Skip database recording completely
        }

        // Validate scan time and determine slot based on time settings
        const validation = validateAndDetermineSlot(dateTime, daySettings.timeSettings);
        
        if (!validation.isValid) {
          console.warn(`⚠️ Scan time ${formattedTime} is outside working hours (${daySettings.timeSettings.start_time} - ${daySettings.timeSettings.end_time}) for ${employeeName}`);
          continue;
        }

        const columnToUpdate = validation.slot;
        const checkinType = validation.type;

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

        console.log(`✅ ${columnToUpdate} saved for ${employeeName} (${pin}) at ${formattedDateTime}`);

        // Create notification if user_id exists
        if (user_id) {
          let message = `${checkinType} recorded at ${formattedTime}`;
          
          if (validation.isLate) {
            message = `⚠️ Late ${checkinType.toLowerCase()} at ${formattedTime}`;
          } else if (validation.isEarly) {
            message = `⚠️ Early ${checkinType.toLowerCase()} at ${formattedTime}`;
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

app.listen(PORT, () => {
  console.log(`🚀 Attendance server listening on port ${PORT}`);
});