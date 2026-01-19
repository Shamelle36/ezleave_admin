// Attendance.jsx - Updated with proper profile data handling
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
  faChevronDown,
  faBars,
  faTimes,
  faAngleLeft,
  faAngleRight,
  faAnglesLeft,
  faAnglesRight
} from '@fortawesome/free-solid-svg-icons';
import 'react-calendar/dist/Calendar.css';
import './dashboard-responsive.css';
import './attendance-responsive.css';
import { useNavigate, useLocation } from 'react-router-dom';
import ProfileDropdown from './profileDropdown.js';

function Attendance() {
  const [date, setDate] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [openExport, setOpenExport] = useState(false);
  const tableRef = useRef();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [role, setRole] = useState(localStorage.getItem("role") || "admin");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [admin, setAdmin] = useState(JSON.parse(localStorage.getItem("admin")) || null); // Get from localStorage
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    role: "",
    profile_picture: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showTimeSettingsModal, setShowTimeSettingsModal] = useState(false);
  const [showLocalHolidayModal, setShowLocalHolidayModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: faTachometerAlt, to: "/dashboard" },
    { name: "Employees", icon: faUsers, to: "/employee" },
    { name: "Attendance", icon: faCalendarCheck, to: "/attendance" },
    { name: "Leave Management", icon: faCalendarAlt, to: "/leaveManagement" },
    { name: "Announcement", icon: faBullhorn, to: "/announcement" },
    { name: "Audit Logs", icon: faClipboardList, to: "/audit_logs" },
    { name: "User Management", icon: faUserCog, to: "/userManagement" },
  ];
  
  const API_URL = "https://ezleave-admin-api.onrender.com";

  const allowedMenus = menuItems.filter((item) => {
    if (role === "admin") return true;
    if (role === "mayor" || role === "office_head") {
      return [
        "Dashboard",
        "Employees",
        "Leave Management",
      ].includes(item.name);
    }
    return false;
  });

  useEffect(() => {
      const checkMobile = () => {
        if (typeof window !== 'undefined') setIsMobileView(window.innerWidth <= 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);
  

  // Load admin data from localStorage on component mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("admin"));
    if (storedUser) {
      setAdmin(storedUser);
      setProfileData({
        full_name: storedUser.full_name || storedUser.name || "",
        email: storedUser.email || "",
        role: storedUser.role || "",
        profile_picture: storedUser.profile_picture || ""
      });
    }
  }, []);

  useEffect(() => {
          const fetchInitialProfile = async () => {
            try {
              const storedUser = JSON.parse(localStorage.getItem("admin"));
              if (!storedUser) return;
      
              const url =
                storedUser.role === "office_head"
                  ? `${API_URL}/api/authAdmin/user/${storedUser.id}`
                  : `${API_URL}/api/auth/useradmin/${storedUser.id}`;
      
              const res = await fetch(url);
              const data = await res.json();
      
              if (res.ok) {
                setAdmin(data);
                setProfileData(data);
              } else {
                console.error("Error loading initial profile:", data.message);
              }
            } catch (err) {
              console.error("Error loading initial profile:", err);
            }
          };
      
          fetchInitialProfile();
        }, []);

useEffect(() => {
        if (!showProfileModal) return;
    
        const fetchProfileData = async () => {
          try {
            const storedUser = JSON.parse(localStorage.getItem("admin"));
            if (!storedUser) return;
    
            const url =
              storedUser.role === "office_head"
                ? `${API_URL}/api/authAdmin/user/${storedUser.id}`
                : `${API_URL}/api/auth/useradmin/${storedUser.id}`;
    
            const res = await fetch(url);
            const data = await res.json();
    
            if (res.ok) {
              setProfileData(data);
            } else {
              console.error("Error loading profile:", data.message);
            }
          } catch (err) {
            console.error("Error loading profile:", err);
          }
        };
    
        fetchProfileData();
      }, [showProfileModal]);

  const handleLogout = async () => {
    const user = JSON.parse(localStorage.getItem("admin"));

    if (user) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: user.role }),
      });
    }

    localStorage.removeItem("admin");
    navigate("/");
  };

  // 📌 Fetch attendance logs from backend
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const formattedDate = date.toISOString().split("T")[0];
        const response = await fetch(`${API_URL}/api/attendance?date=${formattedDate}`);
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
          department: log.department || "Not Specified"
        }));

        setEmployees(mapped);
        setFilteredEmployees(mapped);
        setCurrentPage(1);
      } catch (err) {
        console.error("❌ Error fetching attendance:", err);
      }
    };

    fetchAttendance();
  }, [date]);

  // Filter employees based on search and filters
  useEffect(() => {
    let filtered = employees;
    
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedStatus) {
      filtered = filtered.filter(emp => 
        emp.status.toLowerCase() === selectedStatus.toLowerCase()
      );
    }
    
    if (selectedDepartment) {
      filtered = filtered.filter(emp => 
        emp.department === selectedDepartment
      );
    }
    
    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, selectedDepartment, employees]);

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

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  // Pagination handlers
  const handlePaginationClick = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top of table smoothly
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const paginate = (pageNumber) => handlePaginationClick(pageNumber);
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      handlePaginationClick(currentPage + 1);
    }
  };
  const goToPrevPage = () => {
    if (currentPage > 1) {
      handlePaginationClick(currentPage - 1);
    }
  };
  const goToFirstPage = () => handlePaginationClick(1);
  const goToLastPage = () => handlePaginationClick(totalPages);

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
        return <span style={{ ...style, backgroundColor: "green" }} className="attendance-status-badge">Present</span>;
      case "Absent":
        return <span style={{ ...style, backgroundColor: "red" }} className="attendance-status-badge">Absent</span>;
      case "On-Leave":
        return <span style={{ ...style, backgroundColor: "#f5c518", color: "#000" }} className="attendance-status-badge">On-Leave</span>;
      default:
        return <span style={{ ...style, backgroundColor: "gray" }} className="attendance-status-badge">N/A</span>;
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
    const url = `${API_URL}/api/export?date=${formattedDate}&format=${format}`;
    window.open(url, "_blank");
    setOpenExport(false);
  };

  // Calculate summary counts based on filtered employees
  const presentCount = filteredEmployees.filter(e => e.status === 'Present').length;
  const absentCount = filteredEmployees.filter(e => e.status === 'Absent').length;
  const onLeaveCount = filteredEmployees.filter(e => e.status === 'On-Leave').length;

  // Get unique departments for filter
  const departments = [...new Set(employees.map(emp => emp.department))].filter(Boolean);

  return (
    <div style={styles.dashboardContainer}>
      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          className="hamburger"
          onClick={() => setIsSidebarOpen(true)}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <img src={require('./images/logo_ez.png')} alt="logo" className="mobile-logo" />
        <div className="mobile-header-right">
          <ProfileDropdown
            showSettingsModal={showSettingsModal}
            setShowSettingsModal={setShowSettingsModal}
            showProfileModal={showProfileModal}
            setShowProfileModal={setShowProfileModal}
            showLogoutModal={showLogoutModal}
            setShowLogoutModal={setShowLogoutModal}
            showNotificationModal={showNotificationModal}
            setShowNotificationModal={setShowNotificationModal}
            isMobile={isMobileView}
            profileData={profileData}
            admin={admin}
          />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="mobile-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Desktop Sidebar */}
      <div className={`mobile-sidebar attendance-desktop-sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={styles.sidebar}>
        <div className="sidebar-header">
          <button 
            className="sidebar-close-btn"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <img 
            className='logo-sidebar' 
            src={require('./images/logo_ez.png')} 
            alt="logo" 
          />
        </div>

        <img 
          src={require('./images/logo_ez.png')} 
          alt="logo" 
          style={styles.logo} 
          className='logo-desktop'
        />

        <ul className='sidebar-menu-link' style={styles.sidebarList}>
          {allowedMenus.map((item) => {
            const isActive = location.pathname === item.to;

            return (
              <li
                key={item.name}
                style={{
                  ...(isActive ? styles.btnActive : {}),
                }}
              >
                <Link
                  style={{
                    ...styles.sb,
                    ...(isActive ? styles.btnActive : {}),
                  }}
                  to={item.to}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <FontAwesomeIcon icon={item.icon} style={styles.icon} /> {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Desktop Header */}
      <div className="desktop-header" style={styles.header}>
        <div style={styles.headerRight}>
           <ProfileDropdown
            showSettingsModal={showSettingsModal}
            setShowSettingsModal={setShowSettingsModal}
            showProfileModal={showProfileModal}
            setShowProfileModal={setShowProfileModal}
            showLogoutModal={showLogoutModal}
            setShowLogoutModal={setShowLogoutModal}
            isMobile={false}
            profileData={profileData} 
            admin={admin} 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="content" style={styles.content}>

        {showLogoutModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent} className="modal-content">
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


        <div className="attendance-header-section" style={styles.header1}>
          <h1 className="attendance-title">Attendance</h1>
          <div className="attendance-title-line" style={styles.line}></div>

          <div className="attendance-date-nav" style={styles.dateNav}>
            <button className='attendance-nav-button' style={styles.navButton} onClick={goToPreviousDay}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <span className="date-text" style={styles.dateText}>{formatDate(date)}</span>
            <button className='attendance-nav-button' style={styles.navButton} onClick={goToNextDay}>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="attendance-summary-cards" style={styles.summaryCards}>
          <div className="attendance-card" style={styles.card}>
            <div className="attendance-card-content" style={styles.cardContent}>
              <div className="attendance-card-data" style={styles.cardData}>
                <div className="attendance-data1" style={styles.data1}>
                  <p className="attendance-txtData" style={styles.txtData}>{presentCount}</p>
                  <p className="attendance-txtlabel" style={styles.txtlabel}>Total Present</p>
                </div>
              </div>
            </div>
          </div>

          <div className="attendance-card" style={styles.card}>
            <div className="attendance-card-content" style={styles.cardContent}>
              <div className="attendance-card-data" style={styles.cardData}>
                <div className="attendance-data1" style={styles.data1}>
                  <p className="attendance-txtData" style={styles.txtData}>{absentCount}</p>
                  <p className="attendance-txtlabel" style={styles.txtlabel}>Total Absent</p>
                </div>
              </div>
            </div>
          </div>

          <div className="attendance-card" style={styles.card}>
            <div className="attendance-card-content" style={styles.cardContent}>
              <div className="attendance-card-data" style={styles.cardData}>
                <div className="attendance-data1" style={styles.data1}>
                  <p className="attendance-txtData" style={styles.txtData}>{onLeaveCount}</p>
                  <p className="attendance-txtlabel" style={styles.txtlabel}>Total on-leave</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters + Actions */}
        <div className="attendance-inputs-section" style={styles.inputs}>
          <div className="attendance-row1" style={styles.row1}>
            <div className="attendance-firstRow" style={styles.firstRow}>
              <FontAwesomeIcon icon={faSearch} style={styles.iconSearch} className="attendance-iconSearch" />
              <input 
                className="attendance-input1" 
                style={styles.input1} 
                placeholder='Search Employee' 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="attendance-firstRow" style={styles.firstRow}>
              <select 
                className="attendance-filter" 
                style={styles.filter}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="On-Leave">On-Leave</option>
              </select>
            </div>
          </div>

          <div className="attendance-row2" style={styles.row2}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setOpenExport(!openExport)} className="attendance-btn1" style={styles.btn1}>
                <FontAwesomeIcon icon={faUpload} style={styles.iconBtn} />
                Export
              </button>

              {openExport && (
                <div className="attendance-dropdown" style={styles.dropdown}>
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

            <button onClick={handlePrint} className="attendance-btn2" style={styles.btn2}>
              <FontAwesomeIcon icon={faPrint} style={styles.iconBtn1} />
              Print
            </button>
            <button onClick={handleRefresh} className="attendance-btn3" style={styles.btn3}>
              <FontAwesomeIcon icon={faRefresh} style={styles.iconBtn1} />
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="attendance-table-container" style={styles.tableCon}>
          <div className="attendance-table-wrapper" ref={tableRef}>
            <table className="attendance-table" style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th} className="attendance-th" rowSpan={2}>
                    Employee Name
                  </th>
                  <th style={styles.th} className="attendance-th" colSpan={2}>
                    Clock In & Out
                  </th>
                  <th style={styles.th} className="attendance-th" rowSpan={2}>
                    Status
                  </th>
                  <th style={styles.th} className="attendance-th" rowSpan={2}>Date</th>
                </tr>
                <tr>
                  <th style={styles.th} className="attendance-th">AM</th>
                  <th style={styles.th} className="attendance-th">PM</th>
                </tr>
              </thead>

              <tbody>
                {currentItems.map((emp, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{emp.name}<br />{emp.id}</td>

                    {/* AM clock in/out */}
                    <td style={styles.td}>
                      {emp.amCheckin || emp.amCheckout ? (
                        <div className="attendance-timeTrack" style={styles.timeTrack}>
                          <div style={styles.time}>{emp.amCheckin || "—"}</div>
                          <div style={styles.trackLine} className="attendance-trackLine">
                            <div style={styles.dot}></div>
                            <div style={styles.lineTable} className="attendance-lineTable"></div>
                            <div style={styles.dot}></div>
                          </div>
                          <div style={styles.time}>{emp.amCheckout || "—"}</div>
                        </div>
                      ) : "—"}
                    </td>

                    {/* PM clock in/out */}
                    <td style={styles.td}>
                      {emp.pmCheckin || emp.pmCheckout ? (
                        <div className="attendance-timeTrack" style={styles.timeTrack}>
                          <div style={styles.time}>{emp.pmCheckin || "—"}</div>
                          <div style={styles.trackLine} className="attendance-trackLine">
                            <div style={styles.dot}></div>
                            <div style={styles.lineTable} className="attendance-lineTable"></div>
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

        {/* Pagination */}
        {filteredEmployees.length > 0 && (
          <div className="attendance-pagination" style={styles.pagination}>
            <div className="attendance-pagination-info" style={styles.paginationInfo}>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredEmployees.length)} of {filteredEmployees.length} entries
            </div>
            
            <div className="attendance-pagination-controls" style={styles.paginationControls}>
  {/* First Page */}
  <button 
    onClick={(e) => {
      e.preventDefault();
      goToFirstPage();
    }}
    disabled={currentPage === 1}
    style={currentPage === 1 ? styles.paginationButtonDisabled : styles.paginationButton}
    className="attendance-pagination-first"
  >
    <FontAwesomeIcon icon={faAnglesLeft} />
  </button>
  
  {/* Previous Page */}
  <button 
    onClick={(e) => {
      e.preventDefault();
      goToPrevPage();
    }}
    disabled={currentPage === 1}
    style={currentPage === 1 ? styles.paginationButtonDisabled : styles.paginationButton}
    className="attendance-pagination-prev"
  >
    <FontAwesomeIcon icon={faAngleLeft} />
  </button>
  
  {/* Page Numbers - Simple version */}
  {Array.from({ length: totalPages }, (_, i) => {
    const pageNum = i + 1;
    
    // For many pages, only show some pages
    if (totalPages > 10) {
      // Always show first, last, and pages around current
      const shouldShow = 
        pageNum === 1 || 
        pageNum === totalPages || 
        (pageNum >= currentPage - 2 && pageNum <= currentPage + 2);
      
      if (!shouldShow) {
        // Show ellipsis for gaps
        if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
          return <span key={`ellipsis-${pageNum}`} style={styles.paginationEllipsis}>...</span>;
        }
        return null;
      }
    }
    
    return (
      <button
        key={pageNum}
        onClick={(e) => {
          e.preventDefault();
          console.log('Page button clicked:', pageNum);
          paginate(pageNum);
        }}
        style={currentPage === pageNum ? styles.paginationButtonActive : styles.paginationButton}
        className="attendance-pagination-number"
      >
        {pageNum}
      </button>
    );
  })}
  
  {/* Next Page */}
  <button 
    onClick={(e) => {
      e.preventDefault();
      goToNextPage();
    }}
    disabled={currentPage === totalPages}
    style={currentPage === totalPages ? styles.paginationButtonDisabled : styles.paginationButton}
    className="attendance-pagination-next"
  >
    <FontAwesomeIcon icon={faAngleRight} />
  </button>
  
  {/* Last Page */}
  <button 
    onClick={(e) => {
      e.preventDefault();
      goToLastPage();
    }}
    disabled={currentPage === totalPages}
    style={currentPage === totalPages ? styles.paginationButtonDisabled : styles.paginationButton}
    className="attendance-pagination-last"
  >
    <FontAwesomeIcon icon={faAnglesRight} />
  </button>
</div>
            
            <div className="attendance-pagination-perpage" style={styles.paginationPerPage}>
              <span>Items per page:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  // You can add functionality to change items per page if needed
                }}
                style={styles.paginationSelect}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        )}
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
    width: "20px"
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
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    position: "relative",
    marginLeft: 'auto',
    justifyContent: 'flex-end'
  },
  profileContainer: {
    position: "relative",
    cursor: "pointer",
    backgroundColor: '#ffffff',
    padding: '5px 15px',
    borderRadius: '5px'
  },
  profileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  profileImage: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  profileDetails: {
    display: "flex",
    flexDirection: "column",
    lineHeight: "1.1",
  },
  profileName: {
    fontWeight: "600",
    fontSize: "12px",
  },
  profileRole: {
    fontSize: "10px",
    color: "#888",
  },
  dropdownIcon: {
    fontSize: "12px",
    color: "#666",
    transition: "transform 0.3s",
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
    gap: '8px',
    backgroundColor: '#fff',
    padding: '8px 12px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  navButton: {
    backgroundColor: 'transparent',
    color: '#6B7280',
    border: '1px solid #E5E7EB',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '36px',
  },
  dateText: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#374151',
    minWidth: '220px',
    textAlign: 'center',
  },
  summaryCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '32px',
  },
  card: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #E5E7EB',
    transition: 'transform 0.2s, boxShadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  cardData: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  data1: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: '8px',
  },
  txtData: {
    fontSize: '32px',
    fontWeight: '700',
    margin: '0',
    color: '#111827',
    textAlign: 'center',
  },
  txtlabel: {
    fontSize: '14px',
    textAlign: 'center',
    margin: '0',
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
    overflow: 'visible',
    maxHeight: 'none',
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
    padding: '10px 25px',
    width: '250px',
    border: '1px solid #eee',
    borderRadius: '10px',
    fontSize: '12px',
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  iconSearch: {
    position: 'absolute',
    margin: '15px 10px',
    fontSize: '12px',
    color: '#00000050'
  },
  filter: {
    borderRadius: '10px',
    padding: '5px 10px',
    border: '1px solid #eee',
    fontSize: '12px',
    maxHeight: '100px',
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
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
    padding: '10px 10px',
    borderRadius: '10px',
    fontWeight: '600',
    backgroundColor: 'white',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  btn2: {
    padding: '5px 10px',
    backgroundColor: '#46810390',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  btn3: {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#00B7FF',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
  // Pagination Styles
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    flexWrap: 'wrap',
    gap: '15px',
  },
  paginationInfo: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  paginationControls: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
  },
  paginationButton: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    transition: 'all 0.2s',
    minWidth: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationButtonActive: {
    padding: '8px 12px',
    border: '1px solid #009205',
    backgroundColor: '#009205',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    minWidth: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationButtonDisabled: {
    padding: '8px 12px',
    border: '1px solid #e0e0e0',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    cursor: 'not-allowed',
    fontSize: '14px',
    color: '#999',
    minWidth: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationPerPage: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#666',
  },
  paginationSelect: {
    padding: '6px 10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
  },
  // Profile Modal Styles
  modalOverlayProfile: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContentProfile: {
    background: "#fff",
    borderRadius: "18px",
    width: "420px",
    padding: "32px 28px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "fadeIn 0.3s ease",
  },
  modalTitle: {
    fontSize: "1.6rem",
    fontWeight: "600",
    color: "#2b2b2b",
    marginBottom: "24px",
  },
  profileSection: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "24px",
  },
  formSection: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  label: {
    fontSize: "0.9rem",
    color: "#555",
    fontWeight: "500",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  inputDisabled: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
    background: "#f8f9fa",
    fontSize: "0.95rem",
    color: "#888",
  },
  modalButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "26px",
    width: "100%",
  },
  saveBtn: {
    flex: 1,
    background: "#007bff",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "background 0.3s ease",
    marginRight: "8px",
  },
  cancelButton: {
    flex: 1,
    background: "#f1f1f1",
    color: "#333",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "background 0.3s ease",
  },
  modalImage: {
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginRight: '20px',
  },
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    width: "400px",
    textAlign: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },
  modalActions: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "space-around",
  },
  cancelBtn: {
    backgroundColor: "#ccc",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  confirmBtn: {
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default Attendance;