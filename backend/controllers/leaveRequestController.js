import sql from "../config/db.js"; // assuming you're using postgres client

export async function getLeaveRequests(req, res) {
  try {
    const result = await sql`
      SELECT 
        lr.id,
        el.id_number, 
        lr.user_id,
        lr.office_department,
        lr.position,
        lr.salary,
        lr.date_filing,
        lr.leave_type,
        lr.details,
        lr.inclusive_dates,
        lr.number_of_days,
        lr.commutation_requested,
        lr.status,
        lr.created_at,
        lr.updated_at,
        lr.first_name,
        lr.middle_name,
        lr.last_name
      FROM leave_applications lr
      JOIN employee_list el
        ON lr.user_id = el.user_id
      ORDER BY lr.created_at DESC;
    `;
    
    // postgres.js returns array, pg returns {rows: []}
    res.json(result.rows ? result.rows : result);
  } catch (err) {
    console.error("Error fetching leave requests:", err);
    res.status(500).json({ error: "Failed to fetch leave requests" });
  }
}

