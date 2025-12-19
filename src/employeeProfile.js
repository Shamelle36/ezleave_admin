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
  faFilter,
  faSort,
  faCalendarDay,
  faClock,
  faUserClock,
  faCalendar,
  faTable,
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
  
  // Attendance states
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'descending' });
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  // Calculate leave card pagination
  const filteredLeave = leaveCards;
  const visibleLeave = useMemo(() => 
    filteredLeave.slice((page - 1) * rowsPerPage, page * rowsPerPage),
    [filteredLeave, page, rowsPerPage]
  );
  const totalPages = useMemo(() => 
    Math.ceil(filteredLeave.length / rowsPerPage),
    [filteredLeave.length, rowsPerPage]
  );

  useEffect(() => {
    if (activeTab === "attendance" && id) {
      fetchAllAttendanceData();
    }
  }, [activeTab, id]);

  const fetchAllAttendanceData = async () => {
    setLoadingAttendance(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/attendance/employee/${id}`
      );
      const data = await response.json();
      setAttendanceLogs(data.attendanceLogs || []);
    } catch (err) {
      console.error("❌ Error fetching attendance:", err);
      setAttendanceLogs([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Calculate attendance statistics
  const attendanceStats = useMemo(() => {
    if (!attendanceLogs.length) return null;

    const present = attendanceLogs.filter(log => 
      log.am_checkin || log.pm_checkin || log.status === 'Present'
    ).length;
    
    const absent = attendanceLogs.filter(log => 
      !log.am_checkin && !log.pm_checkin && log.status !== 'On-Leave'
    ).length;
    
    const late = attendanceLogs.filter(log => {
      if (log.am_checkin) {
        const checkinTime = new Date(`1970-01-01T${log.am_checkin}`);
        const lateTime = new Date("1970-01-01T09:00:00");
        return checkinTime > lateTime;
      }
      return false;
    }).length;
    
    const onLeave = attendanceLogs.filter(log => 
      log.status === 'On-Leave' || log.leave_status === 'Approved'
    ).length;

    const totalHours = attendanceLogs.reduce((total, log) => {
      if (log.total_hours) return total + parseFloat(log.total_hours);
      return total;
    }, 0);

    return { present, absent, late, onLeave, total: attendanceLogs.length, totalHours };
  }, [attendanceLogs]);

  // Filter and sort attendance data
  const filteredAndSortedAttendance = useMemo(() => {
    let filtered = attendanceLogs;

    if (attendanceFilter !== "all") {
      filtered = filtered.filter(log => {
        switch (attendanceFilter) {
          case "present":
            return log.am_checkin || log.pm_checkin || log.status === 'Present';
          case "absent":
            return !log.am_checkin && !log.pm_checkin && log.status !== 'On-Leave';
          case "late":
            if (log.am_checkin) {
              const checkinTime = new Date(`1970-01-01T${log.am_checkin}`);
              const lateTime = new Date("1970-01-01T09:00:00");
              return checkinTime > lateTime;
            }
            return false;
          case "on-leave":
            return log.status === 'On-Leave' || log.leave_status === 'Approved';
          default:
            return true;
        }
      });
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'attendance_date') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [attendanceLogs, attendanceFilter, sortConfig]);

  // Calendar functions
  const getAttendanceStatusForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const attendance = attendanceLogs.find(log => {
      const logDate = new Date(log.attendance_date).toISOString().split('T')[0];
      return logDate === dateStr;
    });

    if (!attendance) return null;

    if (attendance.status === 'On-Leave' || attendance.leave_status === 'Approved') {
      return 'on-leave';
    } else if (attendance.am_checkin || attendance.pm_checkin || attendance.status === 'Present') {
      if (attendance.am_checkin) {
        const checkinTime = new Date(`1970-01-01T${attendance.am_checkin}`);
        const lateTime = new Date("1970-01-01T09:00:00");
        if (checkinTime > lateTime) {
          return 'late';
        }
      }
      return 'present';
    } else {
      return 'absent';
    }
  };

  const getDayColor = (date) => {
    const status = getAttendanceStatusForDate(date);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    if (isWeekend) return '#f5f5f5';
    
    switch (status) {
      case 'present': return '#d4edda';
      case 'absent': return '#f8d7da';
      case 'late': return '#fff3cd';
      case 'on-leave': return '#cce7ff';
      default: return '#ffffff';
    }
  };

  const getDayBorderColor = (date) => {
    const status = getAttendanceStatusForDate(date);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    if (isWeekend) return '#ddd';
    
    switch (status) {
      case 'present': return '#28a745';
      case 'absent': return '#dc3545';
      case 'late': return '#ffc107';
      case 'on-leave': return '#17a2b8';
      default: return '#e9ecef';
    }
  };

  const getDayTooltip = (date) => {
    const status = getAttendanceStatusForDate(date);
    const dateStr = date.toLocaleDateString('en-PH');
    
    if (!status) return `${dateStr}: No data`;
    
    const statusText = {
      'present': 'Present',
      'absent': 'Absent',
      'late': 'Late',
      'on-leave': 'On Leave'
    }[status];
    
    return `${dateStr}: ${statusText}`;
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push(date);
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

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

  const exportToExcelAll = () => {
    if (!employee || leaveCards.length === 0) return;

    const wb = XLSX.utils.book_new();
    const excelData = [];

    excelData.push(["Republic of the Philippines", "", "", "", "", "", "", "", "", "", ""]);
    excelData.push(["Province of Occidental Mindoro", "", "", "", "", "", "", "", "", "", ""]);
    excelData.push(["Municipality of Paluan", "", "", "", "", "", "", "", "", "", ""]);
    excelData.push(["", "", "", "", "", "", "", "", "", "", ""]);
    excelData.push(["EMPLOYEES LEAVE CARD", "", "", "", "", "", "", "", "", "", ""]);
    excelData.push(["", "", "", "", "", "", "", "", "", "", ""]);

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

    leaveCards.forEach((lc) => {
      const row = [
        lc.period || "",
        lc.particulars || "",
        lc.vl_earned ?? "",
        lc.vl_used ?? "",
        lc.vl_balance ?? "",
        lc.vl_abs_wop ?? "",
        lc.sl_earned ?? "",
        lc.sl_used ?? "",
        lc.sl_balance ?? "",
        lc.sl_abs_wop ?? "",
        lc.remarks || ""
      ];
      excelData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "Leave Card");
    XLSX.writeFile(wb, `${employee.last_name}_${employee.first_name}_LeaveCard.xlsx`);
  };

  const onRowsPerPageChange = (n) => {
    setRowsPerPage(n);
    setPage(1);
  };

  // Enhanced Calendar Component
  const CalendarView = () => {
    const days = generateCalendarDays();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div style={styles.calendarContainer}>
        <div style={styles.calendarHeader}>
          <button 
            style={styles.calendarNavButton}
            onClick={() => navigateMonth('prev')}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <h3 style={styles.calendarTitle}>
            {currentMonth.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            style={styles.calendarNavButton}
            onClick={() => navigateMonth('next')}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
        
        <div style={styles.calendarGrid}>
          {weekDays.map(day => (
            <div key={day} style={styles.weekDayHeader}>
              {day}
            </div>
          ))}
          
          {days.map((date, index) => (
            <div
              key={index}
              style={{
                ...styles.calendarDay,
                backgroundColor: date ? getDayColor(date) : 'transparent',
                borderColor: date ? getDayBorderColor(date) : 'transparent',
                cursor: date ? 'pointer' : 'default'
              }}
              title={date ? getDayTooltip(date) : ''}
            >
              {date ? date.getDate() : ''}
            </div>
          ))}
        </div>
        
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, backgroundColor: '#d4edda', borderColor: '#28a745'}}></div>
            <span style={styles.legendText}>Present</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, backgroundColor: '#f8d7da', borderColor: '#dc3545'}}></div>
            <span style={styles.legendText}>Absent</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, backgroundColor: '#fff3cd', borderColor: '#ffc107'}}></div>
            <span style={styles.legendText}>Late</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, backgroundColor: '#cce7ff', borderColor: '#17a2b8'}}></div>
            <span style={styles.legendText}>On Leave</span>
          </div>
        </div>
      </div>
    );
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
                          <th style={styles.leaveCardTableTh}>Earned</th>
                          <th style={styles.leaveCardTableTh}>ABS. UND. W/P</th>
                          <th style={styles.leaveCardTableTh}>Balance</th>
                          <th style={styles.leaveCardTableTh}>ABS. UND. WOP</th>
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
                              <td style={styles.leaveCardTableTd}>{row.vl_earned ?? "-"}</td>
                              <td style={styles.leaveCardTableTd}>{row.vl_used ?? "-"}</td>
                              <td style={styles.leaveCardTableTd}>{row.vl_balance ?? "-"}</td>
                              <td style={styles.leaveCardTableTd}>{row.vl_abs_wop ?? "-"}</td>
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
                {loadingAttendance ? (
                  <div style={styles.loadingMessage}>
                    <div style={styles.loadingSpinner}></div>
                    Loading attendance data...
                  </div>
                ) : attendanceLogs.length > 0 ? (
                  <>
                    {/* Enhanced Statistics Cards */}
                    <div style={styles.cardsRow}>
                      <div style={styles.statCard}>
                        <div style={styles.cardIconContainer}>
                          <FontAwesomeIcon icon={faCalendarDay} style={styles.cardIcon} />
                        </div>
                        <div style={styles.cardContent}>
                          <h4 style={styles.cardTitle}>Present</h4>
                          <p style={styles.cardValue}>{attendanceStats?.present || 0}</p>
                          <small style={styles.cardSubtext}>
                            {attendanceStats ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0}%
                          </small>
                        </div>
                      </div>
                      <div style={styles.statCard}>
                        <div style={styles.cardIconContainer}>
                          <FontAwesomeIcon icon={faUserClock} style={styles.cardIcon} />
                        </div>
                        <div style={styles.cardContent}>
                          <h4 style={styles.cardTitle}>Absent</h4>
                          <p style={styles.cardValue}>{attendanceStats?.absent || 0}</p>
                          <small style={styles.cardSubtext}>
                            {attendanceStats ? Math.round((attendanceStats.absent / attendanceStats.total) * 100) : 0}%
                          </small>
                        </div>
                      </div>
                      <div style={styles.statCard}>
                        <div style={styles.cardIconContainer}>
                          <FontAwesomeIcon icon={faClock} style={styles.cardIcon} />
                        </div>
                        <div style={styles.cardContent}>
                          <h4 style={styles.cardTitle}>Late</h4>
                          <p style={styles.cardValue}>{attendanceStats?.late || 0}</p>
                          <small style={styles.cardSubtext}>
                            {attendanceStats ? Math.round((attendanceStats.late / attendanceStats.total) * 100) : 0}%
                          </small>
                        </div>
                      </div>
                      <div style={styles.statCard}>
                        <div style={styles.cardIconContainer}>
                          <FontAwesomeIcon icon={faCalendarAlt} style={styles.cardIcon} />
                        </div>
                        <div style={styles.cardContent}>
                          <h4 style={styles.cardTitle}>On Leave</h4>
                          <p style={styles.cardValue}>{attendanceStats?.onLeave || 0}</p>
                          <small style={styles.cardSubtext}>
                            {attendanceStats ? Math.round((attendanceStats.onLeave / attendanceStats.total) * 100) : 0}%
                          </small>
                        </div>
                      </div>
                    </div>

                    {/* Combined Calendar and Table Layout */}
                    <div style={styles.combinedLayout}>
                      {/* Calendar Section */}
                      <div style={styles.calendarSection}>
                        <CalendarView />
                      </div>

                      {/* Table Section */}
                      <div style={styles.tableSection}>
                        {/* Filter Controls */}
                        <div style={styles.filterGroup}>
                          <FontAwesomeIcon icon={faFilter} style={styles.filterIcon} />
                          <select 
                            value={attendanceFilter} 
                            onChange={(e) => setAttendanceFilter(e.target.value)}
                            style={styles.filterSelect}
                          >
                            <option value="all">All Records</option>
                            <option value="present">Present Only</option>
                            <option value="absent">Absent Only</option>
                            <option value="late">Late Arrivals</option>
                            <option value="on-leave">On Leave</option>
                          </select>
                          <div style={styles.recordCount}>
                            {filteredAndSortedAttendance.length} of {attendanceLogs.length} records
                          </div>
                        </div>

                        {/* Enhanced Attendance Table */}
                        <div style={styles.tableWrapper}>
                          <table style={styles.table}>
                            <thead>
                              <tr>
                                <th 
                                  style={styles.th} 
                                  onClick={() => handleSort('attendance_date')}
                                  className="sortable"
                                >
                                  Date
                                  <FontAwesomeIcon icon={faSort} style={styles.sortIcon} />
                                </th>
                                <th style={styles.th}>Day</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>AM In</th>
                                <th style={styles.th}>AM Out</th>
                                <th style={styles.th}>PM In</th>
                                <th style={styles.th}>PM Out</th>
                                <th style={styles.th}>Hours</th>
                                <th style={styles.th}>Leave Type</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredAndSortedAttendance.map((log, idx) => (
                                <tr key={idx} style={styles.tableRow}>
                                  <td style={styles.td}>
                                    {new Date(log.attendance_date).toLocaleDateString('en-PH', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </td>
                                  <td style={styles.td}>
                                    {new Date(log.attendance_date).toLocaleDateString('en-PH', {
                                      weekday: 'short'
                                    })}
                                  </td>
                                  <td style={styles.td}>
                                    <div style={{
                                      ...styles.statusBadge,
                                      ...getStatusStyle(log.status || 'Absent')
                                    }}>
                                      {log.status || 'Absent'}
                                    </div>
                                  </td>
                                  <td style={styles.td}>
                                    <div style={getTimeStyle(log.am_checkin, 'AM')}>
                                      {log.am_checkin ? log.am_checkin.substring(0, 5) : "-"}
                                    </div>
                                  </td>
                                  <td style={styles.td}>
                                    <div style={getTimeStyle(log.am_checkout, 'AM')}>
                                      {log.am_checkout ? log.am_checkout.substring(0, 5) : "-"}
                                    </div>
                                  </td>
                                  <td style={styles.td}>
                                    <div style={getTimeStyle(log.pm_checkin, 'PM')}>
                                      {log.pm_checkin ? log.pm_checkin.substring(0, 5) : "-"}
                                    </div>
                                  </td>
                                  <td style={styles.td}>
                                    <div style={getTimeStyle(log.pm_checkout, 'PM')}>
                                      {log.pm_checkout ? log.pm_checkout.substring(0, 5) : "-"}
                                    </div>
                                  </td>
                                  <td style={styles.td}>
                                    <div style={styles.hoursCell}>
                                      {log.total_hours ? `${parseFloat(log.total_hours).toFixed(1)}h` : "-"}
                                    </div>
                                  </td>
                                  <td style={styles.td}>
                                    {log.leave_type ? (
                                      <div style={styles.leaveType}>
                                        {log.leave_type}
                                      </div>
                                    ) : "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {filteredAndSortedAttendance.length === 0 && (
                          <div style={styles.noResults}>
                            <p>No attendance records match the current filter.</p>
                            <button 
                              style={styles.clearFilterBtn}
                              onClick={() => setAttendanceFilter('all')}
                            >
                              Clear Filter
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={styles.noRecords}>
                    <FontAwesomeIcon icon={faCalendarDay} style={styles.noRecordsIcon} />
                    <h3>No Attendance Records</h3>
                    <p>No attendance data found for this employee.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Helper functions for styling
const getStatusStyle = (status) => {
  const styles = {
    'Present': { backgroundColor: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' },
    'Absent': { backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
    'On-Leave': { backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
    'Late': { backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fed7aa' }
  };
  return styles[status] || styles['Absent'];
};

const getTimeStyle = (time, period) => ({
  padding: '3px 6px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: '500',
  backgroundColor: time ? '#f8fafc' : '#f1f5f9',
  color: time ? '#334155' : '#94a3b8',
  border: `1px solid ${time ? '#e2e8f0' : '#f1f5f9'}`,
  fontFamily: 'monospace',
  textAlign: 'center'
});

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

const styles = {
  dashboardContainer: { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' },
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

  profileImage: {
    width: "90px",
    height: "90px",
    borderRadius: "50%"
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

  /* Enhanced Attendance Styles */
  attendanceContainer: { width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' },
  
  // Combined Layout
  combinedLayout: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '20px',
    alignItems: 'flex-start'
  },
  calendarSection: {
    // Calendar will take the left side
  },
  tableSection: {
    // Table will take the right side
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  
  // Statistics Cards
  cardsRow: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
    gap: '12px' 
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'transform 0.2s ease',
    cursor: 'pointer'
  },
  cardIconContainer: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#f0fdf4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  cardIcon: {
    fontSize: '16px',
    color: '#009205'
  },
  cardContent: {
    flex: 1
  },
  cardTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    margin: '0 0 2px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  cardValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 2px 0',
    lineHeight: '1.2'
  },
  cardSubtext: {
    fontSize: '10px',
    color: '#94a3b8',
    fontWeight: '500'
  },

  // Filter Group
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#fff',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: '12px'
  },
  filterIcon: {
    color: '#64748b',
    fontSize: '12px'
  },
  filterSelect: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '12px',
    fontWeight: '500',
    color: '#334155',
    cursor: 'pointer'
  },
  recordCount: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },

  // Calendar Styles
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
    height: 'fit-content'
  },
  calendarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  calendarNavButton: {
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    cursor: 'pointer',
    color: '#64748b',
    fontSize: '10px',
    transition: 'all 0.2s ease'
  },
  calendarTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px',
    marginBottom: '12px'
  },
  weekDayHeader: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#64748b',
    fontSize: '10px',
    padding: '4px 2px'
  },
  calendarDay: {
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    border: '1px solid',
    fontSize: '10px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    minHeight: '28px'
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    paddingTop: '10px',
    borderTop: '1px solid #e2e8f0'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '9px',
    color: '#64748b'
  },
  legendColor: {
    width: '8px',
    height: '8px',
    borderRadius: '2px',
    border: '1px solid'
  },
  legendText: {
    fontSize: '9px'
  },

  // Enhanced Table
  tableWrapper: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    flex: 1
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px'
  },
  th: {
    padding: '10px 8px',
    backgroundColor: '#f8fafc',
    fontWeight: '600',
    color: '#334155',
    borderBottom: '1px solid #e2e8f0',
    textAlign: 'left',
    position: 'relative',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap'
  },
  sortIcon: {
    marginLeft: '2px',
    fontSize: '10px',
    color: '#94a3b8'
  },
  tableRow: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.2s ease'
  },
  td: {
    padding: '8px',
    color: '#475569',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '11px'
  },

  // Status and Time Styling
  statusBadge: {
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '600',
    textAlign: 'center',
    display: 'inline-block',
    minWidth: '60px'
  },
  hoursCell: {
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    fontSize: '11px'
  },
  leaveType: {
    padding: '2px 6px',
    backgroundColor: '#f0fdf4',
    color: '#166534',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '500',
    textAlign: 'center'
  },

  // Loading and Empty States
  loadingMessage: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#64748b',
    fontSize: '14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  loadingSpinner: {
    width: '24px',
    height: '24px',
    border: '2px solid #f1f5f9',
    borderTop: '2px solid #009205',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  noRecords: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#64748b'
  },
  noRecordsIcon: {
    fontSize: '36px',
    color: '#cbd5e1',
    marginBottom: '12px'
  },
  noResults: {
    textAlign: 'center',
    padding: '30px 20px',
    color: '#64748b',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  clearFilterBtn: {
    padding: '6px 12px',
    backgroundColor: '#009205',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    marginTop: '8px'
  },

  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', padding: '30px', borderRadius: '10px', width: '400px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' },
  modalActions: { display: 'flex', justifyContent: 'space-around', marginTop: '20px' },
  cancelBtn: { padding: '10px 20px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fff', cursor: 'pointer' },
  confirmBtn: { padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#009205', color: '#fff', cursor: 'pointer' },
};

// Add CSS animation for spinner
const spinnerStyle = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Inject the styles
const styleSheet = document.createElement('style');
styleSheet.innerText = spinnerStyle;
document.head.appendChild(styleSheet);

export default EmployeeProfile;