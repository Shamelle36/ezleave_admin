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
        lr.last_name,
        el.profile_picture
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

export async function getLeaveRequestsCount(req, res) {
  try {
    const [result] = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'Pending')::int   AS pending,
        COUNT(*) FILTER (WHERE status = 'Approved')::int  AS approved,
        COUNT(*) FILTER (WHERE status = 'Rejected')::int  AS rejected,
        COUNT(*)::int AS total
      FROM leave_applications;
    `;

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching leave request counts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


// Approve a leave request
export async function approveLeaveRequest(req, res) {
  const { id } = req.params; // leave request ID
  const actionBy = req.body.actionBy || "Admin"; // who approved
  const remarks = req.body.remarks || null;

  if (!id) {
    return res.status(400).json({ error: "Leave request ID is required" });
  }

  try {
    const result = await sql`
      UPDATE leave_applications
      SET status = 'Approved',
          updated_at = NOW(),
          approved_by = ${actionBy},
          remarks = ${remarks}
      WHERE id = ${id}
      RETURNING *;
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    res.status(200).json({ message: "Leave request approved", data: result[0] });
  } catch (error) {
    console.error("Error approving leave request:", error);
    res.status(500).json({ error: "Failed to approve leave request" });
  }
}

// Reject a leave request
export async function rejectLeaveRequest(req, res) {
  const { id } = req.params;
  const actionBy = req.body.actionBy || "Admin";
  const remarks = req.body.remarks || null;

  if (!id) {
    return res.status(400).json({ error: "Leave request ID is required" });
  }

  try {
    const result = await sql`
      UPDATE leave_applications
      SET status = 'Rejected',
          updated_at = NOW(),
          approved_by = ${actionBy},
          remarks = ${remarks}
      WHERE id = ${id}
      RETURNING *;
    `;

    if (!result || result.length === 0) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    res.status(200).json({ message: "Leave request rejected", data: result[0] });
  } catch (error) {
    console.error("Error rejecting leave request:", error);
    res.status(500).json({ error: "Failed to reject leave request" });
  }
}

