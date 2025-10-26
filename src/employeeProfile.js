import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faUsers,
  faCalendarCheck,
  faCalendarAlt,
  faEnvelope,
  faBullhorn,
  faClipboardList,
  faUserCog,
  faCog,
  faSignOutAlt,
  faBell,
  faArrowLeft,
  faFileExport,
  faFilePdf,
  faFileExcel,
  faCompressAlt,
  faExpandAlt,
  faSearch,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import "react-calendar/dist/Calendar.css";
import "./dashboardCalendar.css";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";


// External libs for export
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

function EmployeeProfile() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [leaveCards, setLeaveCards] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const role = localStorage.getItem("role") || "admin";

  // UI states for leave card
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [compactView, setCompactView] = useState(false);
  
  // Filtered leave entries
  const filteredLeave = leaveCards;
  const visibleLeave = filteredLeave.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(filteredLeave.length / rowsPerPage);

  const menuItems = [
    { name: "Dashboard", icon: faTachometerAlt, to: "/dashboard" },
    { name: "Employees", icon: faUsers, to: "/employee" },
    { name: "Attendance", icon: faCalendarCheck, to: "/attendance" },
    { name: "Leave Management", icon: faCalendarAlt, to: "/leaveManagement" },
    { name: "Message", icon: faEnvelope, to: "/messages" },
    { name: "Announcement", icon: faBullhorn, to: "/announcement" },
    { name: "Audit Logs", icon: faClipboardList, to: "/audit_logs" },
    { name: "User Management", icon: faUserCog, to: "/userManagement" },
    { name: "Settings", icon: faCog, to: "#" },
  ];

  const allowedMenus = menuItems.filter((item) => {
    if (role === "admin") return true;
    if (role === "mayor" || role === "office_head") {
      return [
        "Dashboard",
        "Employees",
        "Attendance",
        "Leave Management",
        "Message",
        "Announcement",
      ].includes(item.name);
    }
    return false;
  });

  const handleLogout = async () => {
    const user = JSON.parse(localStorage.getItem("admin"));
    if (user) {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: user.role }),
      });
    }
    localStorage.removeItem("admin");
    navigate("/");
  };

  useEffect(() => {
    fetch(`http://localhost:5000/api/leave-cards/employeeLeave/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setEmployee(data.employee || null);
        setLeaveCards(data.leaveCards || []);
        setAttendanceLogs(data.attendanceLogs || []);
      })
      .catch((err) => console.error("❌ Error fetching employee:", err));
  }, [id]);

  // Export -> PDF - MANUAL TABLE CREATION
const exportToPDF = async () => {
  if (!employee || leaveCards.length === 0) return;

  try {
    const response = await fetch("http://localhost:5000/api/exportPdf/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee, leaveCards }),
    });

    if (!response.ok) throw new Error("Export failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    const middleInitial = employee.middle_name ? `${employee.middle_name.charAt(0)}.` : "";
    link.href = url;
    link.download = `${employee.last_name}, ${employee.first_name} ${middleInitial}.pdf`;
    link.click();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("❌ Error exporting PDF:", err);
  }
};



  // Export -> Excel (kept for reference)
  const exportToExcelAll = () => {
    if (!employee || leaveCards.length === 0) return;

    const wb = XLSX.utils.book_new();
    const excelData = [];

    // Add headers and metadata
    excelData.push(["Republic of the Philippines", "", "", "", "", "", "", "", "", "", ""]);
    excelData.push(["Province of Occidental Mindoro", "", "", "", "", "", "", "", "", "", ""]);
    excelData.push(["Municipality of Paluan", "", "", "", "", "", "", "", "", "", ""]);
    excelData.push(["", "", "", "", "", "", "", "", "", "", ""]);
    excelData.push(["EMPLOYEES LEAVE CARD", "", "", "", "", "", "", "", "", "", ""]);
    excelData.push(["", "", "", "", "", "", "", "", "", "", ""]);

    // Add employee info
    excelData.push([
      "NAME:",
      `${employee.last_name}, ${employee.first_name} ${employee.middle_name || ""}`.trim(),
      "", "", "", "", 
      "OFFICE:", employee.office || "MO", "", 
      "STATUS:", employee.employment_status || "Permanent"
    ]);
    excelData.push([
      "POSITION:",
      employee.position || "Administrative Aide I", "", "", "", "",
      "FTD:", "", "", "", ""
    ]);
    excelData.push(["", "", "", "", "", "", "", "", "", "", ""]);

    // Add table headers
    excelData.push([
      "PERIOD",
      "PARTICULARS",
      "VACATION LEAVE", "", "", "",
      "SICK LEAVE", "", "", "",
      "REMARKS"
    ]);
    excelData.push([
      "", "",
      "EARNED", "ABS. UND. W/P", "BALANCE", "ABS. UND. WOP",
      "EARNED", "ABS. UND. W/P", "BALANCE", "ABS. UND. WOP",
      ""
    ]);

    // Add leave card data
    leaveCards.forEach((lc) => {
      const row = [
        lc.period || "",
        lc.particulars || "",
        lc.vl_earned ?? "",
        lc.vl_used ?? "",              // ABS. UND. W/P
        lc.vl_balance ?? "",
        lc.vl_abs_wop ?? "",           // ABS. UND. WOP
        lc.sl_earned ?? "",
        lc.sl_used ?? "",              // ABS. UND. W/P
        lc.sl_balance ?? "",
        lc.sl_abs_wop ?? "",           // ABS. UND. WOP
        lc.remarks || ""
      ];
      excelData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "Leave Card");
    XLSX.writeFile(wb, `${employee.last_name}_${employee.first_name}_LeaveCard.xlsx`);
  };


  // UI helpers
  const onRowsPerPageChange = (n) => {
    setRowsPerPage(n);
    setPage(1);
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <img src={require("./images/logo_ez.png")} alt="logo" style={styles.logo} />
        <ul style={styles.sidebarList}>
          {allowedMenus.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <li key={item.name} style={isActive ? styles.btnActive : {}}>
                <Link style={{ ...styles.sb, ...(isActive ? styles.btnActive : {}) }} to={item.to}>
                  <FontAwesomeIcon icon={item.icon} style={styles.icon} /> {item.name}
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              style={styles.sb}
              to="#"
              onClick={(e) => {
                e.preventDefault();
                setShowLogoutModal(true);
              }}
            >
              <FontAwesomeIcon icon={faSignOutAlt} style={styles.icon} /> Logout
            </Link>
          </li>
        </ul>
      </aside>

      {/* Header */}
      <header style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <div style={styles.headerRight}>
          <input type="text" placeholder="Search..." style={styles.search} />
          <FontAwesomeIcon icon={faBell} style={styles.iconBell} />
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.content1}>
        {showLogoutModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <h3>Confirm Logout</h3>
              <p>Are you sure you want to log out?</p>
              <div style={styles.modalActions}>
                <button style={styles.cancelBtn} onClick={() => setShowLogoutModal(false)}>Cancel</button>
                <button style={styles.confirmBtn} onClick={handleLogout}>Logout</button>
              </div>
            </div>
          </div>
        )}

        {!employee ? (
          <p>Employee not found.</p>
        ) : (
          <>
            {/* Tabs */}
            <div style={styles.tabContainer}>
              <button style={tabButtonStyle(activeTab === "overview")} onClick={() => setActiveTab("overview")}>Overview</button>
              <button style={tabButtonStyle(activeTab === "attendance")} onClick={() => setActiveTab("attendance")}>Attendance</button>
            </div>

            {/* Overview */}
            {activeTab === "overview" && (
              <div style={styles.overviewCon}>
                <div style={styles.profileCard}>
                  <div style={styles.profileHeader}>
                    <div style={styles.profileImageWrapper}>
                      {employee.profile_picture ? (
                        <img src={employee.profile_picture} alt="Profile" style={styles.profileImage} />
                      ) : (
                        <div style={styles.initialsCircle}>
                          {employee.full_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div style={styles.profileHeaderText}>
                      <h2 style={styles.employeeName}>{employee.full_name}</h2>
                      <p style={styles.employeePosition}>{employee.position || "No position listed"}</p>
                      <p style={styles.employeeDepartment}>{employee.department || "-"}</p>

                      <div style={styles.badgesContainer}>
                        <div style={styles.smallBadge}><strong>ID:</strong> {employee.id_number}</div>
                        <div style={styles.smallBadge}><strong>Hired:</strong> {employee.date_hired ? new Date(employee.date_hired).toLocaleDateString() : "-"}</div>
                        <div style={styles.smallBadge}><strong>Status:</strong> {employee.employment_status}</div>
                      </div>
                    </div>
                  </div>

                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}><strong>Gender</strong><div style={styles.infoValue}>{employee.gender || "-"}</div></div>
                    <div style={styles.infoItem}><strong>Civil Status</strong><div style={styles.infoValue}>{employee.civil_status || "-"}</div></div>
                    <div style={styles.infoItem}><strong>Email</strong><div style={styles.infoValue}>{employee.email || "-"}</div></div>
                    <div style={styles.infoItem}><strong>Contact</strong><div style={styles.infoValue}>{employee.contact_number || "-"}</div></div>
                  </div>
                </div>

                {/* Leave Card */}
                <div style={styles.leaveCardWrapper}>
                  <div style={styles.leaveTopBar}>
                    <div style={styles.leaveTitleGroup}>
                      <h3 style={styles.leaveCardTitle}>Leave Card</h3>
                      <div style={styles.subText}>Records shown exactly as imported (top to bottom)</div>
                    </div>

                    <div style={styles.leaveControls}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button title="Toggle compact view" onClick={() => setCompactView(v => !v)} style={styles.iconBtn}>
                          <FontAwesomeIcon icon={compactView ? faExpandAlt : faCompressAlt} />
                        </button>

                        <div style={styles.exportGroup}>
                          <button style={styles.exportBtn} title="Export to PDF" onClick={exportToPDF}>
                            <FontAwesomeIcon icon={faFilePdf} /> PDF
                          </button>
                          <button style={styles.exportBtn} title="Export to Excel" onClick={exportToExcelAll}>
                            <FontAwesomeIcon icon={faFileExcel} /> Excel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div style={{ overflowX: "auto", maxHeight: compactView ? 380 : 560 }}>
                    <table style={{ ...styles.leaveCardTable, fontSize: compactView ? 12 : 13 }}>
                      <thead>
                        <tr>
                          <th rowSpan="2" style={styles.leaveCardTableTh}>#</th>
                          <th rowSpan="2" style={styles.leaveCardTableTh}>Period</th>
                          <th rowSpan="2" style={styles.leaveCardTableTh}>Particulars</th>
                          <th colSpan="4" style={styles.leaveCardTableTh}>Vacation Leave</th>
                          <th colSpan="4" style={styles.leaveCardTableTh}>Sick Leave</th>
                          <th rowSpan="2" style={styles.leaveCardTableTh}>Remarks</th>
                        </tr>
                        <tr>
                          {/* Vacation Leave columns */}
                          <th style={styles.leaveCardTableTh}>Earned</th>
                          <th style={styles.leaveCardTableTh}>ABS. UND. W/P</th>
                          <th style={styles.leaveCardTableTh}>Balance</th>
                          <th style={styles.leaveCardTableTh}>ABS. UND. WOP</th>

                          {/* Sick Leave columns */}
                          <th style={styles.leaveCardTableTh}>Earned</th>
                          <th style={styles.leaveCardTableTh}>ABS. UND. W/P</th>
                          <th style={styles.leaveCardTableTh}>Balance</th>
                          <th style={styles.leaveCardTableTh}>ABS. UND. WOP</th>
                        </tr>
                      </thead>

                      <tbody>
                        {visibleLeave.length ? (
                          visibleLeave.map((row, idx) => (
                            <tr
                              key={idx}
                              style={{
                                backgroundColor:
                                  ((page - 1) * rowsPerPage + idx) % 2 === 0 ? "#fff" : "#fbfbfb",
                              }}
                            >
                              <td style={styles.leaveCardTableTd}>{(page - 1) * rowsPerPage + idx + 1}</td>
                              <td style={styles.leaveCardTableTd}>{row.period || "-"}</td>
                              <td style={{ ...styles.leaveCardTableTd, textAlign: "left" }}>{row.particulars || "-"}</td>

                              {/* Vacation Leave */}
                              <td style={styles.leaveCardTableTd}>{row.vl_earned ?? "-"}</td>
                              <td style={styles.leaveCardTableTd}>{row.vl_used ?? "-"}</td>
                              <td style={styles.leaveCardTableTd}>{row.vl_balance ?? "-"}</td>
                              <td style={styles.leaveCardTableTd}>{row.vl_abs_wop ?? "-"}</td>

                              {/* Sick Leave */}
                              <td style={styles.leaveCardTableTd}>{row.sl_earned ?? "-"}</td>
                              <td style={styles.leaveCardTableTd}>{row.sl_used ?? "-"}</td>
                              <td style={styles.leaveCardTableTd}>{row.sl_balance ?? "-"}</td>
                              <td style={styles.leaveCardTableTd}>{row.sl_abs_wop ?? "-"}</td>

                              <td style={{ ...styles.leaveCardTableTd, textAlign: "left" }}>
                                {row.remarks || "-"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={12} style={{ padding: 18, textAlign: "center", color: "#666" }}>
                              No matching leave entries.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div style={styles.pagination}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button style={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                        <FontAwesomeIcon icon={faChevronLeft} />
                      </button>
                      <div style={{ fontSize: 13 }}>Page</div>
                      <div style={styles.pageInput}>{page}</div>
                      <div style={{ fontSize: 13 }}>of {totalPages}</div>
                      <button style={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>
                    </div>

                    <div style={{ color: "#666", fontSize: 13 }}>
                      Showing {(page - 1) * rowsPerPage + 1} - {Math.min(filteredLeave.length, page * rowsPerPage)} of {filteredLeave.length}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance */}
            {activeTab === "attendance" && (
              <div style={styles.attendanceContainer}>
                {attendanceLogs.length > 0 ? (
                  <>
                    <div style={styles.cardsRow}>
                      <div style={{ ...styles.card, backgroundColor: "#D5F5E3" }}>
                        <h4 style={styles.cardTitle}>Present</h4>
                        <p style={styles.cardValue}>{attendanceLogs.filter(log => log.am_checkin || log.pm_checkin).length}</p>
                      </div>
                      <div style={{ ...styles.card, backgroundColor: "#FADBD8" }}>
                        <h4 style={styles.cardTitle}>Absent</h4>
                        <p style={styles.cardValue}>{attendanceLogs.filter(log => !log.am_checkin && !log.pm_checkin).length}</p>
                      </div>
                      <div style={{ ...styles.card, backgroundColor: "#FCF3CF" }}>
                        <h4 style={styles.cardTitle}>Late</h4>
                        <p style={styles.cardValue}>
                          {attendanceLogs.filter(log => log.am_checkin && new Date(`1970-01-01T${log.am_checkin}`) > new Date("1970-01-01T09:00:00")).length}
                        </p>
                      </div>
                      <div style={{ ...styles.card, backgroundColor: "#D6EAF8" }}>
                        <h4 style={styles.cardTitle}>On-leave</h4>
                        <p style={styles.cardValue}>{attendanceLogs.filter(log => log.status === "on-leave").length}</p>
                      </div>
                    </div>

                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>AM In</th>
                            <th style={styles.th}>AM Out</th>
                            <th style={styles.th}>PM In</th>
                            <th style={styles.th}>PM Out</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceLogs.map((log, idx)=>(
                            <tr key={idx} style={{ backgroundColor: idx%2===0?"#ffffff":"#f9fafb" }}>
                              <td style={styles.td}>{new Date(log.attendance_date).toLocaleDateString()}</td>
                              <td style={styles.td}>{log.am_checkin || "-"}</td>
                              <td style={styles.td}>{log.am_checkout || "-"}</td>
                              <td style={styles.td}>{log.pm_checkin || "-"}</td>
                              <td style={styles.td}>{log.pm_checkout || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p style={styles.noRecords}>No attendance records found.</p>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ... (rest of the styles remain exactly the same as in your original code)
// Tab Button Styling and Styles remain the same...

const tabButtonStyle = (active) => ({
  backgroundColor: active ? '#5ab049ff' : '#fff',
  color: active ? '#fff' : '#333',
  border: 'none',
  cursor: 'pointer',
  fontWeight: active? '600': '500',
  borderRadius: '6px',
  padding: '10px 20px',
  fontSize: '14px',
  boxShadow: active ? 'inset 1px 1px 2px rgba(0,0,0,0.3)' : '0 2px 5px rgba(0,0,0,0.1)',
  transition: '0.2s',
});

// Styles remain exactly the same as in your original code...
const styles = {
  dashboardContainer: { display: 'flex', minHeight: '100vh', backgroundColor: '#f3f6f9' },
  sidebar: { backgroundColor: '#009205', width: '280px', height: '100vh', position: 'fixed', padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'start' },
  logo: { width: '120px', margin: '0 auto 30px', display: 'block' },
  sidebarList: { listStyle: 'none', padding: 0, margin: 0 },
  sb: { color: '#fff', textDecoration: 'none', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', borderRadius: '6px', marginBottom: '5px', transition: '0.2s' },
  btnActive: { backgroundColor: '#A8FC00', color: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' },
  icon: { color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', top: 0, left: '280px', width: 'calc(100% - 280px)', padding: '15px 25px', backgroundColor: '#009205', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', zIndex: 10 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '15px' },
  search: { padding: '8px 12px', borderRadius: '6px', border: 'none', fontSize: '14px' },
  iconBell: { fontSize: '22px', color: '#fff', cursor: 'pointer' },
  backBtn: { backgroundColor: '#fff', color: '#009205', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '16px' },
  content1: { marginLeft: '280px', padding: '100px 25px 25px 25px', flex: 1 },
  tabContainer: { display: 'flex', gap: '15px', marginBottom: '25px' },
  overviewCon: { display: 'flex', flexDirection: 'column', gap: '20px', flexWrap: 'wrap' },
  profileInfo: { display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' },

  /* PROFILE */
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "18px 20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  profileImageWrapper: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    overflow: "hidden",
    backgroundColor: "#f3fff3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
  },

  initialsCircle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#009205",
  },

  profileHeaderText: { display: "flex", flexDirection: "column" },
  employeeName: { fontSize: "20px", fontWeight: "700", color: "#222", marginBottom: 2 },
  employeePosition: { fontSize: "14px", fontWeight: "600", color: "#0b7b09", marginBottom: 2 },
  employeeDepartment: { fontSize: "13px", color: "#666" },

  badgesContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px 10px",
    marginTop: 8,
  },

  smallBadge: {
    background: "#f6f9f6",
    padding: "5px 10px",
    borderRadius: 8,
    fontSize: 12,
    color: "#333",
    fontWeight: 500,
  },

  infoGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "12px 20px",       
    marginTop: "10px",
  },

  infoItem: {
    flex: "1",       
    backgroundColor: "#f8fdf7",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #e0f2dd",
  },

  infoValue: {
    marginTop: 4,
    color: "#222",
    fontWeight: 600,
  },

  /* LEAVE CARD */
  leaveCardWrapper: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "18px",
    border: "1px solid #e6e6e6",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
  },
  leaveTopBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12 },
  leaveTitleGroup: { display: "flex", flexDirection: "column" },
  leaveCardTitle: { textAlign: "left", fontSize: "18px", fontWeight: "700", color: "#111", margin: 0 },
  subText: { fontSize: 12, color: "#666", marginTop: 6 },

  leaveControls: { display: "flex", gap: 12, alignItems: "center" },
  searchWrap: { display: "flex", alignItems: "center", gap: 8, background: "#f4f6f4", padding: "6px 10px", borderRadius: 8 },
  leaveSearch: { border: "none", outline: "none", background: "transparent", minWidth: 180 },
  rowsSelect: { padding: "6px 8px", borderRadius: 6, border: "1px solid #ddd" },
  iconBtn: { padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" },

  exportGroup: { display: "flex", gap: 8, flexWrap: "wrap" },
  exportBtn: { padding: "7px 10px", borderRadius: 6, border: "1px solid #d0d0d0", background: "#fff", cursor: "pointer", display: "flex", gap: 8, alignItems: "center", fontSize: 13 },

  leaveCardTable: {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
  color: "#111",
  border: "1px solid #e0e0e0",
  borderRadius: "10px",
  overflow: "hidden",
  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
},

leaveCardTableTh: {
  backgroundColor: "#f7f9f7",
  color: "#222",
  padding: "10px 12px",
  borderBottom: "1px solid #dcdcdc",
  borderRight: "1px solid #eaeaea",
  textAlign: "center",
  fontWeight: 700,
  whiteSpace: "nowrap",
},

leaveCardTableTd: {
  padding: "10px 12px",
  borderBottom: "1px solid #eaeaea",
  borderRight: "1px solid #f4f4f4",
  textAlign: "center",
  verticalAlign: "middle",
  fontWeight: 400,
  color: "#333",
  backgroundColor: "#fff",
},

  /* Pagination */
  pagination: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  pageBtn: { padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" },
  pageInput: { minWidth: 28, textAlign: "center", padding: "6px 8px", borderRadius: 6, border: "1px solid #eee", background: "#fafafa" },

  /* Attendance & misc */
  attendanceContainer: { width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' },
  cardsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' },
  card: { borderRadius: '10px', padding: '15px', textAlign: 'center', fontWeight: '600', color: '#333', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
  cardTitle: { fontSize: '14px', marginBottom: '8px' },
  cardValue: { fontSize: '20px', fontWeight: '700' },
  tableWrapper: { overflowX: 'auto', borderRadius: '10px', border: '1px solid #e0e0e0', width: '100%' },
  table: { borderCollapse: 'collapse', width: '100%' },
  th: { textAlign: 'left', padding: '12px 15px', backgroundColor: '#f4f6f8', fontWeight: '600', borderBottom: '2px solid #e5e7eb' },
  td: { padding: '12px 15px', borderBottom: '1px solid #f0f0f0' },
  noRecords: { textAlign: 'center', padding: '20px', color: '#888' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', padding: '30px', borderRadius: '10px', width: '400px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' },
  modalActions: { display: 'flex', justifyContent: 'space-around', marginTop: '20px' },
  cancelBtn: { padding: '10px 20px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fff', cursor: 'pointer' },
  confirmBtn: { padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#009205', color: '#fff', cursor: 'pointer' },
};

export default EmployeeProfile;