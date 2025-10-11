import React, { useEffect, useState } from "react";
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
} from "@fortawesome/free-solid-svg-icons";
import "react-calendar/dist/Calendar.css";
import "./dashboardCalendar.css";

function EmployeeProfile() {
  const { id } = useParams();
  const location = useLocation();
  const [employee, setEmployee] = useState(null);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [role, setRole] = useState(localStorage.getItem("role") || "admin");
      
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
      const user = JSON.parse(localStorage.getItem("admin")); // get current session
  
      if (user) {
        await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, role: user.role }),
        });
      }
  
      localStorage.removeItem("admin"); // clear session
      navigate("/"); // redirect to login
    };

  // Fetch employee + leave balances + attendance logs
  useEffect(() => {
    fetch(`http://localhost:5000/api/employees/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setEmployee(data);
        setLeaveBalances(data.leaveBalances || []);
        setAttendanceLogs(data.attendanceLogs || []);
      })
      .catch((err) => console.error("❌ Error fetching employee:", err));
  }, [id]);

  return (
    <div style={styles.dashboardContainer}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>
            <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: "8px" }} />
          </button>
        </div>
        <div>
          <input type="text" placeholder="Search..." style={styles.search} />
          <FontAwesomeIcon icon={faBell} style={styles.iconBell} />
        </div>
      </div>

      {/* Sidebar */}
      <div style={styles.sidebar}>
        <img
          src={require("./images/logo_ez.png")}
          alt="logo"
          style={styles.logo}
        />
           <ul style={styles.sidebarList}>
  {allowedMenus.map((item) => {
    const isActive = location.pathname === item.to; // Check if current route matches

    return (
      <li
        key={item.name}
        style={{
          ...(isActive ? styles.btnActive : {}), // Apply active tab background
        }}
      >
        <Link
          style={{
            ...styles.sb,
            ...(isActive ? styles.btnActive : {}),
          }}
          to={item.to}
        >
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
      </div>

      {/* Main Content */}
      <div style={styles.content1}>

       {showLogoutModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                style={styles.confirmBtn}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

        {!employee ? (
          <p>Employee not found.</p>
        ) : (
          <div>
            {/* Tabs */}
            <div style={styles.tabContainer}>
              <button
                style={tabButtonStyle(activeTab === "overview")}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </button>
              <button
                style={tabButtonStyle(activeTab === "attendance")}
                onClick={() => setActiveTab("attendance")}
              >
                Attendance Record
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div style={styles.overviewCon}>
                <div style={styles.profileInfo}>
                  <div style={styles.profileContainer}>
                    <div style={styles.imageWrapper}>
                      {employee.profile_picture ? (
                        <img
                          src={employee.profile_picture}
                          alt="Profile"
                          style={styles.profileImage}
                        />
                      ) : (
                        <div style={styles.initialsPlaceholder}>
                          {employee.full_name
                            ?.split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <p style={styles.fname}>{employee.full_name}</p>
                  </div>

                  <div style={styles.info}>
                    <label style={styles.lbl}>ID Number</label>
                    <p>{employee.id_number}</p>
                  </div>

                  <div style={styles.info}>
                    <label style={styles.lbl}>Contact Number</label>
                    <p>{employee.contact_number}</p>
                  </div>

                  <div style={styles.info}>
                    <label style={styles.lbl}>Position</label>
                    <p>{employee.position}</p>
                  </div>

                  <div style={styles.info}>
                    <label style={styles.lbl}>Department</label>
                    <p>{employee.department}</p>
                  </div>

                  <div style={styles.info}>
                    <label style={styles.lbl}>Status</label>
                    <p>{employee.employment_status}</p>
                  </div>
                </div>

                {/* Leave Credits */}
                <div style={styles.lvlCrdt}>
                  <p style={styles.leaveCreditsLbl}>Leave Credits</p>
                  {leaveBalances.length > 0 ? (
                    leaveBalances.map((leave, idx) => (
                      <div key={idx} style={styles.lvType}>
                        <div style={styles.lblLeave}>
                          <p>{leave.leave_type}</p>
                        </div>
                        <div style={styles.lvlBal}>
                          <div style={styles.sickL}>
                            <p style={styles.lblEn}>{leave.total_days}</p>
                            <p style={styles.lblName}>Entitled</p>
                          </div>
                          <div style={styles.sickL}>
                            <p style={styles.lblUs}>{leave.used_days}</p>
                            <p style={styles.lblName}>Used</p>
                          </div>
                          <div style={styles.sickL}>
                            <p style={styles.lblRe}>{leave.remaining}</p>
                            <p style={styles.lblName}>Remaining</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No leave records found.</p>
                  )}
                </div>
              </div>
            )}

            {/* Attendance Tab */}
           {activeTab === "attendance" && (
              <div style={styles.attendanceContainer}>
                {attendanceLogs.length > 0 ? (
                  <>
                    {/* 📊 Summary Cards */}
                    <div style={styles.cardsRow}>
                      <div style={{ ...styles.card, backgroundColor: "#D5F5E3" }}>
                        <h4 style={styles.cardTitle}>Present</h4>
                        <p style={styles.cardValue}>
                          {attendanceLogs.filter(log => log.am_checkin || log.pm_checkin).length}
                        </p>
                      </div>
                      <div style={{ ...styles.card, backgroundColor: "#FADBD8" }}>
                        <h4 style={styles.cardTitle}>Absent</h4>
                        <p style={styles.cardValue}>
                          {attendanceLogs.filter(log => !log.am_checkin && !log.pm_checkin).length}
                        </p>
                      </div>
                      <div style={{ ...styles.card, backgroundColor: "#FCF3CF" }}>
                        <h4 style={styles.cardTitle}>Late</h4>
                        <p style={styles.cardValue}>
                          {attendanceLogs.filter(log => {
                            // Example: late if AM In after 9:00 AM
                            if (!log.am_checkin) return false;
                            const checkin = new Date(`1970-01-01T${log.am_checkin}`);
                            const nineAM = new Date("1970-01-01T09:00:00");
                            return checkin > nineAM;
                          }).length}
                        </p>
                      </div>
                      <div style={{ ...styles.card, backgroundColor: "#D6EAF8" }}>
                        <h4 style={styles.cardTitle}>On-leave</h4>
                        <p style={styles.cardValue}>
                          {attendanceLogs.filter(log => log.status === "on-leave").length}
                        </p>
                      </div>
                    </div>

                    {/* 📅 Attendance Table */}
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
                          {attendanceLogs.map((log, idx) => (
                            <tr
                              key={idx}
                              style={{
                                ...styles.tr,
                                backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = "#f1f5f9")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  idx % 2 === 0 ? "#ffffff" : "#f9fafb")
                              }
                            >
                              <td style={styles.td}>
                                {new Date(log.attendance_date).toLocaleDateString()}
                              </td>
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



          </div>
        )}
      </div>
    </div>
  );
}



const tabButtonStyle = (active) => ({
  backgroundColor: active ? '#5ab049ff' : '#ffffffff',
  color: active ? '#fefcf5' : 'black',
  border: 'none',
  borderBottom: active ? 'none' : 'none',
  cursor: 'pointer',
  fontWeight: active? '600': 'normal',
  borderRadius: '5px',
  padding: '10px 16px',
  fontSize: '14px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
  boxShadow: active ? 'inset 1px 1px 2px rgba(44, 44, 44, 0.44)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
});


const styles = {
  dashboardContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F8F8F8',
  },
  sidebar: {
    backgroundColor: '#009205',
    width: '280px',
    height: '100vh',
    margin: '0',
    position: 'fixed',
    padding: '20px',
    boxSizing: 'border-box',
  },
  logo: {
    width: '100px',
    height: 'auto',
    display: 'block',
    margin: '20px auto',
  },
  sidebarList: {
    listStyleType: 'none',
    padding: '0',
    margin: '0',
  },
  sb: {
    color: '#fff',
    textDecoration: 'none',
    padding: '10px 15px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '16px',
    gap: '10px',
    transition: 'background-color 0.2s ease',
  },
  icon: {
    color: '#fff',
  },
  search: {
    padding: '10px',
    width: '300px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    marginRight: '20px',
  },
  iconBell: {
    color: '#fff',
    fontSize: '24px',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px',
    backgroundColor: '#009205',
    position: 'fixed',
    top: '0',
    left: '280px',
    width: 'calc(100% - 280px)',
    zIndex: 1000,
    boxSizing: 'border-box',
  },
  content1: {
    marginLeft: '280px',
    padding: '80px 20px 20px 15px',
    minHeight: '100vh',
    backgroundColor: '#F8F8F8',
    boxSizing: 'border-box',
    
  },
  btnActive: {
    backgroundColor: '#A8FC0080',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  tabContainer: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
  },
  backBtn: {
    backgroundColor: '#009205',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '20px',
  },
  profileContainer: {
    display: 'flex',
    marginBottom: '20px'
  },
  imageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    border:'1px solid rgba(205, 205, 205, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px',
    width: '100px',
    height: '100px',
    borderRadius: '10px'
  },
  profileInfo: {
    backgroundColor: '#ffffffff',
    width: '400px',
    height: 'auto',
    padding: '20px',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '5px',
  },
  info: {
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(205, 205, 205, 1)',
    marginBottom: '15px'
  },
  fname: {
    marginTop: '5px',
    marginBottom: '10px',
    fontWeight: '500',
    marginLeft: '20px'
  },
  lbl: {
    fontSize: '14px',
  },
  overviewCon: {
    display: 'flex',
    flexDirection: 'row',
    gap: '30px',
    
  },
  lvlCrdt: {
    backgroundColor: '#fff',
    padding: '10px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    borderRadius: '10px',
    height: '500px',
    overflowY: 'auto',  
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },

  lvType: {
    border: '1px solid rgba(205, 205, 205, 1)',
    padding: '10px',
    borderRadius: '10px',
    flex: '0 0 auto', 
  },

  lvlBal: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between', 
    gap: '15px',
  },

  sickL: {
    display: 'flex',
    flexDirection: 'row',
    borderRadius: '5px',
    flex: 1, 
    minWidth: '120px',
  },

  lblEn: {
    backgroundColor: '#D6EAF8',
    padding: '10px 20px',
    fontSize: '25px',
    fontWeight: '600',
    borderRight: '1px solid #000',
    borderRadius: '5px 0 0 5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    color: '#1B4F72'
  },
  lblUs: {
    backgroundColor: '#FADBD8',
    padding: '10px 20px',
    fontSize: '25px',
    fontWeight: '600',
    borderRight: '1px solid #000',
    borderRadius: '5px 0 0 5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    color: '#922B21',
  },
  lblRe: {
    backgroundColor: '#D5F5E3',
    padding: '10px 20px',
    fontSize: '25px',
    fontWeight: '600',
    borderRight: '1px solid #000',
    borderRadius: '5px 0 0 5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    color: '#145A32',
  },
  lblName: {
    padding: '16px 20px',
    backgroundColor: '#fbfcf8',
    borderRadius: '0 5px 5px 0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    width: '150px'
  },
  lblLeave: {
    borderBottom: '1px solid rgba(205, 205, 205, 1)',
    marginBottom: '5px',
    fontSize: '16px',
    fontWeight: '600'
  },
  leaveCreditsLbl: {
    fontSize: '20px',
    fontWeight: '600'
  },
  
  attendanceContainer: {
    marginTop: "20px",
    boxSizing: 'border-box',
    width: '80vw'
  },

  cardsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "20px",
  },

  card: {
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#2c3e50",
  },

  cardValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#2c3e50",
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "10px",
    border: "1px solid #e0e0e0",
    width: '100%'
  },

  table: {
    borderCollapse: "collapse",
    fontSize: "15px",
    width: '100%'
  },
  th: {
    textAlign: "left",
    padding: "12px 15px",
    backgroundColor: "#f4f6f8",
    color: "#374151",
    fontWeight: "600",
    borderBottom: "2px solid #e5e7eb",
  },
  tr: {
    transition: "background 0.2s ease",
  },
  td: {
    padding: "12px 15px",
    borderBottom: "1px solid #f0f0f0",
    color: "#374151",
  },
  noRecords: {
    textAlign: "center",
    padding: "20px",
    color: "#888",
  },

};

export default EmployeeProfile;
