import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
  faCheckCircle,
  faClock,
  faTimesCircle,
  faChevronLeft,
  faChevronRight,
  faUser,
  faSearch,
  faPrint,
  faRefresh,
  faUpload,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import 'react-calendar/dist/Calendar.css';
import './dashboardCalendar.css';
import {useNavigate, useLocation} from 'react-router-dom';

function Attendance() {
  const [date, setDate] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [openExport, setOpenExport] = useState(false);
  const tableRef = useRef();
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

  // 📌 Fetch attendance logs from backend
  useEffect(() => {
  const fetchAttendance = async () => {
    try {
      const formattedDate = date.toISOString().split("T")[0];
      const response = await fetch(`http://localhost:5000/api/attendance?date=${formattedDate}`);
      const data = await response.json();

      const mapped = data.map(log => ({
        name: log.name,
        id: log.pin,
        amCheckin: log.am_checkin,
        amCheckout: log.am_checkout,
        pmCheckin: log.pm_checkin,
        pmCheckout: log.pm_checkout,
        status: log.am_checkin || log.pm_checkin ? "Present" : log.status || "Absent",
        date: log.attendance_date,
      }));

      setEmployees(mapped);
    } catch (err) {
      console.error("❌ Error fetching attendance:", err);
    }
  };

  fetchAttendance();
  const interval = setInterval(fetchAttendance, 5000); // ⏳ fetch every 5s
  return () => clearInterval(interval);
}, [date]);


  const formatDate = (date) =>
    date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  const goToPreviousDay = () => {
    const prev = new Date(date);
    prev.setDate(prev.getDate() - 1);
    setDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    setDate(next);
  };

  const getStatusBadge = (status) => {
    let style = {
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: "5px",
      fontSize: "12px",
      fontWeight: "600",
      color: "white",
      textTransform: "uppercase",
    };

    switch (status) {
      case "Present":
        return <span style={{ ...style, backgroundColor: "green" }}>Present</span>;
      case "Absent":
        return <span style={{ ...style, backgroundColor: "red" }}>Absent</span>;
      case "On-Leave":
        return <span style={{ ...style, backgroundColor: "#f5c518", color: "#000" }}>On-Leave</span>;
      default:
        return <span style={{ ...style, backgroundColor: "gray" }}>N/A</span>;
    }
  };


  const handlePrint = () => {
    const printContent = tableRef.current.innerHTML;
    const printWindow = window.open("", "", "width=900,height=700");
    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');

            body { 
              font-family: 'Poppins', sans-serif; 
              padding: 20px; 
              color: #333;
            }

            header {
              text-align: center;
              margin-bottom: 15px;
            }

            h2 { 
              margin: 0;
              font-weight: 600; 
              color: #222;
            }

            .report-date {
              font-size: 13px;
              color: #555;
              margin-top: 3px;
            }

            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px; 
              font-size: 13px;
            }

            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: center; 
              vertical-align: middle;
            }

            th { 
              background-color: #007bff; 
              color: white; 
              font-weight: 600; 
              text-transform: uppercase;
              font-size: 12px;
            }

            thead tr:nth-child(2) th {
              background-color: #f1f1f1;
              color: #333;
              font-size: 11px;
              font-weight: 500;
            }

            tr:nth-child(even) { background-color: #fafafa; }
            tr:hover { background-color: #f5f5f5; }

            img.status-icon {
              width: 10px;
              height: 22px;
              vertical-align: middle;
            }

            .status-text {
              display: block;
              margin-top: 2px;
              font-size: 11px;
              font-weight: 500;
            }

            footer {
              margin-top: 25px;
              text-align: center;
              font-size: 11px;
              color: #777;
            }

            @media print {
              body { padding: 0; }
              header, footer { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <header>
            <h2>Attendance Report</h2>
            <div class="report-date">${new Date().toLocaleDateString()}</div>
          </header>

          ${printContent}

          <footer>
            Generated by Attendance System | ${new Date().toLocaleTimeString()}
          </footer>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };



  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExport = (format) => {
    const formattedDate = date.toISOString().split("T")[0];
    const url = `http://localhost:5000/api/export?date=${formattedDate}&format=${format}`;
    window.open(url, "_blank");
    setOpenExport(false);
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Header */}
      <div style={styles.header}>
        <input type="text" placeholder="Search..." style={styles.search} />
        <FontAwesomeIcon icon={faBell} style={styles.iconBell} />
      </div>

      {/* Sidebar */}
      <div style={styles.sidebar}>
        <img src={require('./images/logo_ez.png')} alt="logo" style={styles.logo} />
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
      <div style={styles.content}>

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

        <div style={styles.header1}>
          <h1>Attendance</h1>
          <div style={styles.line}></div>

          <div style={styles.dateNav}>
            <button style={styles.navButton} onClick={goToPreviousDay}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <span style={styles.dateText}>{formatDate(date)}</span>
            <button style={styles.navButton} onClick={goToNextDay}>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={styles.summaryCards}>
          <div style={styles.card}>
            <p style={styles.txtSum}>Present Summary</p>
            <div style={styles.cardContent}>
              <div style={styles.cardData}>
                <div style={styles.data1}>
                  <p style={styles.txtlabel}>Total Present</p>
                  <p style={styles.txtData}>{employees.filter(e => e.status === 'Present').length}</p>
                </div>
                <div style={styles.divider}></div>
                <div style={styles.data1}>
                  <p style={styles.txtlabel}>On-Time</p>
                  <p style={styles.txtData}>—</p>
                </div>
                <div style={styles.divider}></div>
                <div style={styles.data1}>
                  <p style={styles.txtlabel}>Early clock-in</p>
                  <p style={styles.txtData}>—</p>
                </div>
                <div style={styles.divider}></div>
                <div style={styles.data1}>
                  <p style={styles.txtlabel}>Late clock-in</p>
                  <p style={styles.txtData}>—</p>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <p style={styles.txtSum}>Absent Summary</p>
            <div style={styles.cardContent}>
              <div style={styles.cardData}>
                <div style={styles.data1}>
                  <p style={styles.txtlabel}>Total Absent</p>
                  <p style={styles.txtData}>{employees.filter(e => e.status === 'Absent').length}</p>
                </div>
                <div style={styles.divider}></div>
                <div style={styles.data1}>
                  <p style={styles.txtlabel}>No clock-in</p>
                  <p style={styles.txtData}>—</p>
                </div>
                <div style={styles.divider}></div>
                <div style={styles.data1}>
                  <p style={styles.txtlabel}>No clock-out</p>
                  <p style={styles.txtData}>—</p>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <p style={styles.txtSum}>Leave Summary</p>
            <div style={styles.cardContent}>
              <div style={styles.cardData}>
                <div style={styles.data1}>
                  <p style={styles.txtlabel}>Total on-leave</p>
                  <p style={styles.txtData}>{employees.filter(e => e.status === 'On-Leave').length}</p>
                </div>
                <div style={styles.divider}></div>
                <div style={styles.data1}>
                  <p style={styles.txtlabel}>Day Off</p>
                  <p style={styles.txtData}>{employees.filter(e => e.status === 'Day-off').length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters + Actions */}
        <div style={styles.inputs}>
          <div style={styles.row1}>
            <div style={styles.firstRow}>
              <FontAwesomeIcon icon={faSearch} style={styles.iconSearch} />
              <input style={styles.input1} placeholder='Search Employee' />
            </div>

            <div style={styles.firstRow}>
              <select style={styles.filter}>
                <option disabled selected>Status</option>
                <option>Present</option>
                <option>Late</option>
                <option>Absent</option>
                <option>On-Leave</option>
              </select>

              <select style={styles.filter}>
                <option disabled selected hidden>Department</option>
                <option>Human Resource</option>
                <option>Accounting</option>
                <option>Engineering</option>
                <option>IT</option>
              </select>
            </div>
          </div>

          <div style={styles.row2}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setOpenExport(!openExport)} style={styles.btn1}>
                <FontAwesomeIcon icon={faUpload} style={styles.iconBtn} />
                Export
              </button>

              {openExport && (
                <div style={styles.dropdown}>
                  <div style={styles.dropdownItem} onClick={() => handleExport("excel")}>
                    Excel (.xlsx)
                  </div>
                  <div style={styles.dropdownItem} onClick={() => handleExport("word")}>
                    Word (.docx)
                  </div>
                  <div style={styles.dropdownItem} onClick={() => handleExport("pdf")}>
                    PDF (.pdf)
                  </div>
                </div>
              )}
            </div>


            <button onClick={handlePrint} style={styles.btn2}>
              <FontAwesomeIcon icon={faPrint} style={styles.iconBtn1} />
              Print
            </button>
            <button onClick={handleRefresh} style={styles.btn3}>
              <FontAwesomeIcon icon={faRefresh} style={styles.iconBtn1} />
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
            <div ref={tableRef} style={styles.tableCon}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                          <th style={styles.th} rowSpan={2}>
                            Employee Name
                          </th>
                          <th style={styles.th} colSpan={2}>
                            Clock In & Out
                          </th>
                          <th style={styles.th} rowSpan={2}>
                            Status
                          </th>
                          <th style={styles.th} rowSpan={2}>Date</th>
                        </tr>
                        <tr>
                          <th style={styles.th}>AM</th>
                          <th style={styles.th}>PM</th>
                        </tr>
                    </thead>

                    <tbody>
                    {employees.map((emp, index) => (
                        <tr key={index}>
                        <td style={styles.td}>{emp.name}<br />{emp.id}</td>

                        {/* AM clock in/out */}
                        <td style={styles.td}>
                            {emp.amCheckin || emp.amCheckout ? (
                            <div style={styles.timeTrack}>
                                <div style={styles.time}>{emp.amCheckin || "—"}</div>
                                <div style={styles.trackLine}>
                                <div style={styles.dot}></div>
                                <div style={styles.lineTable}></div>
                                <div style={styles.dot}></div>
                                </div>
                                <div style={styles.time}>{emp.amCheckout || "—"}</div>
                            </div>
                            ) : "—"}
                        </td>

                        {/* PM clock in/out */}
                        <td style={styles.td}>
                            {emp.pmCheckin || emp.pmCheckout ? (
                            <div style={styles.timeTrack}>
                                <div style={styles.time}>{emp.pmCheckin || "—"}</div>
                                <div style={styles.trackLine}>
                                <div style={styles.dot}></div>
                                <div style={styles.lineTable}></div>
                                <div style={styles.dot}></div>
                                </div>
                                <div style={styles.time}>{emp.pmCheckout || "—"}</div>
                            </div>
                            ) : "—"}
                        </td>

                        <td style={styles.td}>{getStatusBadge(emp.status)}</td>
                        <td style={styles.td}>{emp.date}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
      </div>
    </div>
  );
}


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
    justifyContent: 'flex-end', 
    padding: '10px',
    backgroundColor: '#009205',
    position: 'fixed',
    top: '0',
    left: '280px', 
    width: 'calc(100% - 280px)', 
    zIndex: 1000, 
    boxSizing: 'border-box',
  },
  content: {
    marginLeft: '300px',
    padding: '20px',
    backgroundColor: '#F8F8F8',
    marginTop: '60px', 
    overflow: 'hidden'
  },
  header1: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '20px',
    justifyContent: 'flex-start',
  },
  line: {
    width: '2px',
    height: '40px',
    backgroundColor: 'black',
    marginTop: '10px',
  },
  dateNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
    navButton: {
        backgroundColor: '#C4C4C433',
        color: 'black',
        border: 'none',
        padding: ' 5px 10px',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    dateText: {
        fontSize: '18px',
        fontWeight: '500',
        color: 'black',
    },
    summaryCards: {
        display: 'flex',
        flexDirection: 'row',
        gap: '30px',
        marginTop: '20px',
    },
    card: {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        justifyContent: 'space-between',
    },
    cardContent: {
        display: 'flex',
        flexDirection: 'row',
        gap: '10px',
        marginTop: '10px'
    },
    cardData: {
        display: 'flex',
        flexDirection: 'row',
        gap: '20px',
    },
    data1: {
        display: 'flex',
        flexDirection: 'column'
    },
    txtData: {
        fontSize: '25px',
        fontWeight: 'bold',
        marginTop: '3px'
    },
    txtlabel: {
        fontSize: '14px',
    },
    divider: {
        width: '1px',
        height: '35px',
        backgroundColor: '#00000050',
        marginTop: '10px'
    },
    table:{
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        marginTop: '20px',
        marginBottom: '20px'
    },
    tableCon:{
        overflow: 'auto',
        maxHeight: '400px',
    },
    th:{
        backgroundColor: '#A8FC0015',
        padding: '12px',
        textAlign: 'center',
        fontWeight: '500',
        fontSize: '14px',
        border: '1px solid #eee',
        width: '300px'
    },
    td: {
        padding: '12px',
        fontSize: '12px',
        border: '1px solid #eee',
    },
    timeTrack: {
        display: 'flex',
        gap: '10px',
        whiteSpace: 'nowrap',
    },

    time: {
        fontWeight: '500',
    },

    trackLine: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    dot: {
        width: '5px',
        height: '5px',
        backgroundColor: '#555',
        borderRadius: '50%',
    },

    duration: {
        fontSize: '12px',
        color: '#999',
        marginLeft: '10px',
        marginRight: '10px'
    },
    lineTable:{
        width: '50px',
        height: '1px',
        backgroundColor: 'black'
    },
    inputs: {
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'row', 
        justifyContent: 'space-between'
    },
    input1:{
        padding: '5px 25px',
        width: '250px',
        border: '1px solid #eee',
        borderRadius: '5px',
        fontSize: '12px'
    },
    iconSearch: {
        position: 'absolute',
        margin: '10px 10px',
        fontSize: '12px',
        color: '#00000050'
    },
    filter: {
        width: '120px',
        borderRadius: '5px',
        padding: '5px',
        border: '1px solid #eee',
        fontSize: '12px',
        maxHeight: '100px'
    },
    firstRow: {
        display: 'flex', 
        flexDirection: 'row',
        gap: '10px'
    },
    row1: {
        display: 'flex', 
        flexDirection: 'row',
        gap: '10px'
    },
    row2: {
        gap: '10px',
        display: 'flex', 
        flexDirection: 'row'
    },
    btn1: {
        padding: '5px 10px',
        borderRadius: '5px',
        fontWeight: '600',
        backgroundColor: 'white',
        border: '1px solid #00000060',
        cursor: 'pointer'
    },
    btn2: {
        padding: '5px 10px',
        backgroundColor: '#46810390',
        border: 'none',
        borderRadius: '5px',
        color: 'white',
        fontWeight: '600',
        cursor: 'pointer'
    },
    btn3: {
        padding: '5px 10px',
        border: 'none',
        borderRadius: '5px',
        backgroundColor: '#00B7FF',
        color: 'white',
        fontWeight: '600',
        cursor: 'pointer'
    },
    iconBtn: {
        fontSize: '12px',
        margin: '5px 5px 0'
    },
    iconBtn1: {
        color: 'white',
        fontSize: '12px',
        margin: '5px 5px 0'
    },
    btnActive: {
        backgroundColor: '#A8FC0080',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
    },
    dropdown: {
      position: "absolute",
      top: "100%",
      left: 0,
      background: "white",
      border: "1px solid #ddd",
      borderRadius: "8px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      zIndex: 1000,
      minWidth: "160px",
      marginTop: "5px",
    },
    dropdownItem: {
      padding: "10px",
      cursor: "pointer",
      fontSize: "14px",
      transition: "background 0.2s",
    },



};

export default Attendance;