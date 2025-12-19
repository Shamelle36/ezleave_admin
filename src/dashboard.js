import React, {useEffect} from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  faUserPlus,
  faClock,
  faBars,
  faTimes,
  faArrowRight,
  faCalendarDay,
  faStar,
  faUser,
  faBuilding,
  faCircle,
  faExclamationTriangle,
  faInfoCircle,
  faFileContract,
  faUserShield,
  faEdit,
  faSave,
  faHistory,
  faTrash,
  faArrowLeft,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useState, useRef } from 'react';
import './dashboardCalendar.css';
import './dashboard-responsive.css'; // Import the responsive CSS
import './App.css';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [date, setDate] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("Leave Type");
  const [employeeCount, setEmployeeCount] = useState(0);
  const [leaveCounts, setLeaveCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
  });
  const [monthlyLeaves, setMonthlyLeaves] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    role: "",
    profile_picture: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [role, setRole] = useState(localStorage.getItem("role") || "admin");
  const [department, setDepartment] = useState(localStorage.getItem("department") || "");
  const [officeHead, setOfficeHead] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTable, setActiveTable] = useState('attendance'); // 'attendance' or 'leave'
  const [hoverInfo, setHoverInfo] = useState(null); 
  const [notifications, setNotifications] = useState([]);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [isEditingTerms, setIsEditingTerms] = useState(false);
  const [termsVersions, setTermsVersions] = useState([]);
  const [activeTermsVersion, setActiveTermsVersion] = useState(null);
  const [newTermsVersion, setNewTermsVersion] = useState('');

  const [attendanceTimeSettings, setAttendanceTimeSettings] = useState({});
  const [showTimeSettingsModal, setShowTimeSettingsModal] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [isLoadingTimeSettings, setIsLoadingTimeSettings] = useState(false);
  const tooltipRef = useRef(null);

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

  const options = [
    "Vacation Leave",
    "Mandatory/Forced Leave",
    "Sick Leave",
    "Maternity Leave",
    "Paternity Leave",
    "Special Privilege Leave",
    "Solo Parent Leave",
    "Study Leave",
    "VAWC Leave",
    "Rehabilitation Leave",
    "Special Leave Benefits for Women",
    "Special Emergency (Calamity) Leave",
    "Monetization of Leave Credits",
    "Terminal Leave",
    "Adoption Leave"
  ];

  const holidays = [
    { date: "2025-12-25", name: "Christmas Day" },
    { date: "2025-12-30", name: "Rizal Day" },
    { date: "2025-01-01", name: "New Year’s Day" }
  ];

  // Add this useEffect after your other useEffects
useEffect(() => {
  if (showTermsModal) {
    fetchTermsAndConditions();
  }
}, [showTermsModal]);


const normalizeFilingDate = (str) => {
  if (!str) return null;

  // Example: "November 28, 2025"
  const [monthName, dayComma, year] = str.split(" ");
  const day = dayComma.replace(",", "");

  const monthIndex = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ].indexOf(monthName);

  if (monthIndex === -1) return null;

  const month = String(monthIndex + 1).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");

  return `${year}-${month}-${dayStr}`;
};

useEffect(() => {
  const fetchTimeSettings = async () => {
    setIsLoadingTimeSettings(true);
    try {
      const response = await fetch(`${API_URL}/api/attendance/settings/time`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceTimeSettings(data);
      } else {
        console.warn('Failed to fetch time settings from server');
        // Don't set any defaults - let the modal handle empty state
        setAttendanceTimeSettings({});
      }
    } catch (error) {
      console.error('Error fetching time settings:', error);
      setAttendanceTimeSettings({});
    } finally {
      setIsLoadingTimeSettings(false);
    }
  };

  fetchTimeSettings();
}, []);

const checkIfLate = (checkinTime, dayOfWeek) => {
  if (!checkinTime || !attendanceTimeSettings || Object.keys(attendanceTimeSettings).length === 0) return false;
  
  const dayMapping = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
  };
  
  const day = dayMapping[dayOfWeek];
  const settings = attendanceTimeSettings[day];
  
  // If no settings or day is inactive, don't mark as late
  if (!settings || !settings.is_active) return false;
  
  const [checkinHour, checkinMinute] = checkinTime.split(':').map(Number);
  const [startHour, startMinute] = settings.start.split(':').map(Number);
  
  const checkinTotal = checkinHour * 60 + checkinMinute;
  const startTotal = startHour * 60 + startMinute;
  
  return checkinTotal > startTotal;
};



// Helper function to format date in YYYY-MM-DD format using local timezone
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const renderTileContent = ({ date, view }) => {
  if (view !== "month") return null;

  const dateStr = formatDateLocal(date);
  const holiday = holidays.find(h => h.date === dateStr);
  const leavesOnThisDay = leaveRequests.filter(leave =>
    normalizeFilingDate(leave.date_filing) === dateStr
  );

  if (holiday || leavesOnThisDay.length > 0) {
    return (
      <div className="tile-content-container">
        <div
          className="tile-hover-trigger"
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setHoverInfo({
              x: rect.left + window.scrollX,
              y: rect.top + window.scrollY,
              date: dateStr,
              leaves: leavesOnThisDay,
              holiday,
              scrollX: window.scrollX,
              scrollY: window.scrollY
            });
          }}
          onMouseLeave={(e) => {
            // Don't immediately close - let the tooltip handle its own mouse leave
            setTimeout(() => {
              // Check if mouse is still over tooltip
              const tooltip = document.querySelector('.calendar-tooltip');
              if (!tooltip || !tooltip.matches(':hover')) {
                setHoverInfo(null);
              }
            }, 100);
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            cursor: 'pointer',
            zIndex: 2
          }}
        />
        
        {/* Visual indicators */}
        {holiday && (
          <FontAwesomeIcon 
            icon={faStar} 
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              fontSize: '10px',
              color: '#ff6b6b',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
            }} 
          />
        )}
        
        {leavesOnThisDay.length > 0 && !holiday && (
          <FontAwesomeIcon 
            icon={faClipboardList} 
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              fontSize: '10px',
              color: '#009205',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
            }} 
          />
        )}
      </div>
    );
  }

  return null;
};

const tileClassName = ({ date, view }) => {
  if (view !== "month") return "";

  const dateStr = formatDateLocal(date);
  
  const isHoliday = holidays.some(h => h.date === dateStr);
  const hasLeave = leaveRequests.some(
    leave => normalizeFilingDate(leave.date_filing) === dateStr
  );

  if (isHoliday) return "holiday-highlight";
  if (hasLeave) return "leave-highlight";

  return "";
};

  const handleSelect = (option) => {
    setSelected(option);
    setIsOpen(false);
  };

  const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "http://10.242.224.105:5000";

  // Fetch attendance statistics
  useEffect(() => {
  const fetchAttendanceStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`${API_URL}/api/attendance?date=${today}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Get day of week for today
      const todayDate = new Date();
      const dayOfWeek = todayDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Calculate stats from attendance data with late checking
      let present = 0;
      let absent = 0;
      let late = 0;
      
      data.forEach(log => {
        const hasAttendance = log.am_checkin || log.pm_checkin;
        
        if (hasAttendance) {
          present++;
          
          // Check if late in the morning
          if (log.am_checkin && checkIfLate(log.am_checkin, dayOfWeek)) {
            late++;
          }
          // Check if late in the afternoon (if no AM checkin but has PM checkin)
          else if (!log.am_checkin && log.pm_checkin && checkIfLate(log.pm_checkin, dayOfWeek)) {
            late++;
          }
        } else {
          absent++;
        }
      });

      setAttendanceStats({
        present,
        absent,
        late,
        leave: 0,
      });
    } catch (err) {
      console.error("❌ Error fetching attendance stats:", err);
    }
  };

  fetchAttendanceStats();
}, [attendanceTimeSettings]); 

  useEffect(() => {
    const counts = leaveRequests.reduce(
      (acc, curr) => {
        if (curr.status === "Pending") acc.pending += 1;
        else if (curr.status === "Approved") acc.approved += 1;
        else if (curr.status === "Rejected") acc.rejected += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );

    counts.total = leaveRequests.length;

    setLeaveCounts(counts);
  }, [leaveRequests]);

  useEffect(() => {
    const fetchEmployeeCount = async () => {
      try {
        const res = await fetch(`${API_URL}/api/employees/count`);
        const data = await res.json();
        setEmployeeCount(data.total);
      } catch (err) {
        console.error("Error fetching employee count:", err);
      }
    };

    fetchEmployeeCount();
  }, []);

  useEffect(() => {
    const fetchEmployeeCount = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/employees/count?role=${encodeURIComponent(role)}&department=${encodeURIComponent(department)}`
        );
        const data = await res.json();
        setEmployeeCount(data.total);
      } catch (err) {
        console.error("Error fetching employee count:", err);
      }
    };

    fetchEmployeeCount();
  }, [role, department]); 

 useEffect(() => {
  const fetchAllData = async () => {
    try {
      // Fetch leave requests (which contain notifications)
      const leaveRes = await fetch(`${API_URL}/api/leave-requests`);
      const leaveData = await leaveRes.json();
      
      // Extract notifications from leave requests
      const extractedNotifications = leaveData
        .filter(item => item.notification) // Only items with notifications
        .map(item => ({
          id: item.notification.id || `notif-${item.id}`,
          type: item.notification.type || "leave_filed",
          message: item.notification.message || `${item.first_name} ${item.last_name} filed a ${item.leave_type} request`,
          createdAt: item.notification.created_at || new Date().toISOString(),
          userId: item.user_id,
          isRead: item.notification.is_read || false,
          employeeName: `${item.first_name} ${item.last_name}`,
          leaveType: item.leave_type,
          status: item.status
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by date

      console.log("Extracted notifications:", extractedNotifications);
      setNotifications(extractedNotifications);
      setLeaveRequests(leaveData);

    } catch (err) {
      console.error("Error fetching data:", err);
      setNotifications([]);
    }
  };

  fetchAllData();

  const interval = setInterval(fetchAllData, 60000);
  return () => clearInterval(interval);
}, []);


  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    const fetchAttendance = async () => {
      try {
        const response = await fetch(`${API_URL}/api/attendance?date=${today}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const mapped = Array.isArray(data) ? data.map(log => ({
          name: log.name,
          id: log.pin,
          amCheckin: log.am_checkin,
          amCheckout: log.am_checkout,
          pmCheckin: log.pm_checkin,
          pmCheckout: log.pm_checkout,
          status: log.am_checkin || log.pm_checkin ? "Present" : "Absent",
          date: log.attendance_date,
        })) : [];

        setAttendance(mapped);
      } catch (err) {
        console.error("❌ Error fetching attendance:", err);
      }
    };

    fetchAttendance();

    const interval = setInterval(fetchAttendance, 5000);
    return () => clearInterval(interval);
  }, []);

  const cardsData = [
    {
      title: 'Total Employees',
      description: '5% increase more than last month',
      value: employeeCount,
      background: styles.card, 
      paddingTop: '5px',
    },
    {
      title: 'Pending Leave Requests',
      description: '3% less than last month',
      value: leaveCounts.pending,
      background: styles.card,
      paddingTop: '20px',
    },
    {
      title: 'Approved Leave Requests',
      description: '5% less than last month',
      value: leaveCounts.approved,
      background: styles.card,
      paddingTop: '20px',
    },
    {
      title: 'Present Employees',
      description: '2% increase more than last month',
      value: attendanceStats.present,
      background: styles.card1,
      paddingTop: '5px',
    },
    {
      title: 'Absent Employees',
      description: '2% less than last month',
      value: attendanceStats.absent,
      background: styles.card2,
      paddingTop: '20px',
    },
    {
      title: 'Late Employees',
      description: '2% less than last month',
      value: attendanceStats.late,
      background: styles.card3,
      paddingTop: '20px',
    },
  ];

  // FIXED: getNotificationStyle function with all notification types
  const getNotificationStyle = (type) => {
    console.log("Getting style for notification type:", type);
    
    switch (type) {
      case 'Leave_Approval':
      case 'leave_approved':
        return { icon: faCheckCircle, color: '#28a745' }; 
      case 'New_Hire':
      case 'new_hire':
        return { icon: faUserPlus, color: '#007bff' }; 
      case 'Attendance_Alert':
      case 'attendance_alert':
        return { icon: faClock, color: '#ffc107' }; 
      case 'System_Notice':
      case 'system_notice':
        return { icon: faInfoCircle, color: '#17a2b8' }; 
      case 'Reminder':
      case 'reminder':
        return { icon: faBell, color: '#dc3545' }; 
      case 'leave_filed':
        return { icon: faClipboardList, color: '#009205' };
      case 'warning':
      case 'alert':
        return { icon: faExclamationTriangle, color: '#ff9800' };
      default:
        console.log("Using default icon for type:", type);
        return { icon: faBell, color: '#6c757d' }; 
    }
  };

  const pieData =
    attendanceStats.present +
    attendanceStats.absent +
    attendanceStats.late +
    attendanceStats.leave === 0
      ? [{ name: "No Data", value: 1 }]
      : [
          { name: "Present", value: attendanceStats.present },
          { name: "Absent", value: attendanceStats.absent },
          { name: "Late", value: attendanceStats.late },
          { name: "Leave", value: attendanceStats.leave }
        ];

  const COLORS = ['#005EFF', '#FF0042', '#FFCC00', '#FF0599', '#ccc'];

  useEffect(() => {
    const fetchMonthlyLeaves = async () => {
      try {
        const url = selected !== "Leave Type" 
          ? `${API_URL}/api/leave-requests/monthly?leaveType=${encodeURIComponent(selected)}`
          : `${API_URL}/api/leave-requests/monthly`;

        const res = await fetch(url);
        const data = await res.json();
        setMonthlyLeaves(data);
      } catch (err) {
        console.error("Error fetching monthly leaves:", err);
      }
    };

    fetchMonthlyLeaves();
  }, [selected]);

  const RADIAN = Math.PI / 180;

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        fontSize="10"
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

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

  useEffect(() => {
    const fetchAdmin = async () => {
      const storedAdmin = JSON.parse(localStorage.getItem("admin"));
      if (!storedAdmin?.id) return;

      try {
        const res = await fetch(`${API_URL}/api/auth/useradmin/${storedAdmin.id}`);
        const data = await res.json();
        setAdmin(data);
      } catch (err) {
        console.error("Error fetching admin data:", err);
      }
    };

    fetchAdmin();
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
  
  // Add these functions after handleLogout (around line 400)

// Replace the existing fetchTermsAndConditions function with this:
const fetchTermsAndConditions = async () => {
  try {
    // Fetch active terms
    const response = await fetch(`${API_URL}/api/terms/active`);
    const data = await response.json();
    
    // Check if response is valid
    if (data && data.content) {
      setTermsContent(data.content);
      setActiveTermsVersion(data);
    } else {
      setTermsContent('');
      setActiveTermsVersion(null);
    }
    
    // Fetch all versions - handle potential errors
    try {
      const versionsRes = await fetch(`${API_URL}/api/terms`);
      const versionsData = await versionsRes.json();
      
      // Ensure versionsData is an array
      if (Array.isArray(versionsData)) {
        setTermsVersions(versionsData);
      } else if (versionsData && Array.isArray(versionsData.data)) {
        // Some APIs wrap arrays in a data property
        setTermsVersions(versionsData.data);
      } else if (versionsData && versionsData.versions) {
        // Some APIs use a versions property
        setTermsVersions(versionsData.versions);
      } else {
        // Default to empty array
        setTermsVersions([]);
        console.warn('API returned non-array data:', versionsData);
      }
    } catch (versionsError) {
      console.error('Error fetching versions:', versionsError);
      setTermsVersions([]);
    }
  } catch (error) {
    console.error('Error fetching active terms:', error);
    setTermsContent('');
    setActiveTermsVersion(null);
    setTermsVersions([]);
  }
};

// Update the saveTermsAndConditions function:
const saveTermsAndConditions = async () => {
  if (!termsContent.trim()) {
    alert('Please enter Terms & Conditions content');
    return;
  }

  // Safely calculate next version number
  const versionCount = Array.isArray(termsVersions) ? termsVersions.length : 0;
  const version = newTermsVersion || `v${versionCount + 1}.0`;
  
  try {
    const response = await fetch(`${API_URL}/api/terms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        content: termsContent
      })
    });

    if (response.ok) {
      alert('Terms & Conditions saved successfully!');
      setIsEditingTerms(false);
      fetchTermsAndConditions();
      setNewTermsVersion('');
    } else {
      const errorData = await response.json();
      alert(`Failed to save: ${errorData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error saving terms:', error);
    alert('Error saving Terms & Conditions. Check console.');
  }
};

// Activate a version
const activateTermsVersion = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/terms/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_active: true })
    });

    if (response.ok) {
      fetchTermsAndConditions();
    }
  } catch (error) {
    console.error('Error activating version:', error);
  }
};

// Delete a version
const deleteTermsVersion = async (id) => {
  if (window.confirm('Are you sure you want to delete this version?')) {
    try {
      const response = await fetch(`${API_URL}/api/terms/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchTermsAndConditions();
      }
    } catch (error) {
      console.error('Error deleting version:', error);
    }
  }
};

  return (
    <div style={styles.dashboardContainer}>
      {/* Mobile Header with Hamburger */}
      <div className="mobile-header">
        <button 
          className="hamburger"
          onClick={() => setIsSidebarOpen(true)}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <img src={require('./images/logo_ez.png')} alt="logo" className="mobile-logo" />
        <div className="mobile-header-right">
          <FontAwesomeIcon icon={faBell} className="mobile-icon-bell" />
          <div className="mobile-profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <img
              src={
                admin?.profile_picture ||
                profileData?.profile_picture ||
                "https://res.cloudinary.com/demo/image/upload/v1690000000/default-avatar.png"
              }
              alt="Profile"
              className="mobile-profile-image"
            />
          </div>
        </div>
      </div>

      {/* Mobile Profile Dropdown */}
      {showProfileMenu && (
        <div className="mobile-profile-dropdown">
          <button style={styles.dropdownItem} onClick={() => setShowProfileModal(true)}>
            <FontAwesomeIcon icon={faUserCog} style={styles.dropdownIcon} /> My Profile
          </button>
          <button style={styles.dropdownItem}>
            <FontAwesomeIcon icon={faCog} style={styles.dropdownIcon} /> Settings
          </button>
          <button
            style={styles.dropdownItem}
            onClick={() => setShowLogoutModal(true)}
          >
            <FontAwesomeIcon icon={faSignOutAlt} style={styles.dropdownIcon} /> Logout
          </button>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="mobile-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Settings Modal */}
{showSettingsModal && (
  <div style={styles.modalOverlay}>
    <div style={styles.settingsModalContent}>
      <div style={styles.settingsModalHeader}>
        <h2 style={styles.settingsModalTitle}>
          <FontAwesomeIcon icon={faCog} /> Settings
        </h2>
        <button 
          style={styles.closeButton}
          onClick={() => setShowSettingsModal(false)}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div style={styles.settingsSections}>
        <button 
          style={styles.settingsSectionButton}
          onClick={() => {
            setShowSettingsModal(false);
            setShowTermsModal(true);
          }}
        >
          <FontAwesomeIcon icon={faFileContract} style={{marginRight: '10px'}} />
          Terms & Conditions Management
        </button>

        <button 
          style={styles.settingsSectionButton}
          onClick={() => {
            setShowSettingsModal(false);
            setShowTimeSettingsModal(true);
          }}
        >
          <FontAwesomeIcon icon={faClock} style={{marginRight: '10px'}} />
          Attendance Time Settings
        </button>
        
        <button style={styles.settingsSectionButton}>
          <FontAwesomeIcon icon={faBell} style={{marginRight: '10px'}} />
          Notification Settings
        </button>
        
        <button style={styles.settingsSectionButton}>
          <FontAwesomeIcon icon={faUserShield} style={{marginRight: '10px'}} />
          Privacy & Security
        </button>
        
        <button style={styles.settingsSectionButton}>
          <FontAwesomeIcon icon={faUsers} style={{marginRight: '10px'}} />
          User Permissions
        </button>
      </div>
    </div>
  </div>
)}

{/* Terms & Conditions Modal */}
{showTermsModal && (
  <div style={styles.modalOverlay}>
    <div style={styles.termsModalContent}>
      <div style={styles.termsModalHeader}>
        <h2 style={styles.termsModalTitle}>
          <FontAwesomeIcon icon={faFileContract} /> Terms & Conditions
        </h2>
        <button 
          style={styles.closeButton}
          onClick={() => {
            setShowTermsModal(false);
            setIsEditingTerms(false);
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* Active Version Info */}
      <div style={styles.activeTermsCard}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h4>Active Version</h4>
          {activeTermsVersion && (
            <span style={styles.activeBadge}>ACTIVE</span>
          )}
        </div>
        {activeTermsVersion ? (
          <div>
            <p><strong>Version:</strong> {activeTermsVersion.version}</p>
            <p><strong>Created:</strong> {new Date(activeTermsVersion.created_at).toLocaleDateString()}</p>
          </div>
        ) : (
          <p>No active terms found</p>
        )}
      </div>

      {/* Terms Content */}
      <div style={styles.termsContentSection}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
          <h4>Terms & Conditions Content</h4>
          {!isEditingTerms ? (
            <button 
              style={styles.editButton}
              onClick={() => setIsEditingTerms(true)}
            >
              <FontAwesomeIcon icon={faEdit} /> Edit
            </button>
          ) : (
            <div style={{display: 'flex', gap: '10px'}}>
              <button 
                style={styles.saveButton}
                onClick={saveTermsAndConditions}
              >
                <FontAwesomeIcon icon={faSave} /> Save
              </button>
              <button 
                style={styles.cancelButton}
                onClick={() => setIsEditingTerms(false)}
              >
                <FontAwesomeIcon icon={faTimes} /> Cancel
              </button>
            </div>
          )}
        </div>

        {isEditingTerms && (
          <div style={{marginBottom: '15px'}}>
            <input
              type="text"
              placeholder="Version (e.g., v2.0)"
              value={newTermsVersion}
              onChange={(e) => setNewTermsVersion(e.target.value)}
              style={styles.versionInput}
            />
          </div>
        )}

        {isEditingTerms ? (
          <textarea
            value={termsContent}
            onChange={(e) => setTermsContent(e.target.value)}
            style={styles.termsTextarea}
            rows={15}
            placeholder="Enter Terms & Conditions content here..."
          />
        ) : (
          <div style={styles.termsViewer}>
            {termsContent || 'No Terms & Conditions content available.'}
          </div>
        )}
      </div>

      {/* Version History */}
      <div style={styles.versionHistory}>
        <h4><FontAwesomeIcon icon={faHistory} /> Version History</h4>
        <div style={{maxHeight: '200px', overflowY: 'auto'}}>
          {termsVersions.map(version => (
            <div 
              key={version.id} 
              style={{
                ...styles.versionItem,
                borderLeft: version.is_active ? '4px solid #009205' : '4px solid #ccc'
              }}
            >
              <div style={{flex: 1}}>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <strong>Version {version.version}</strong>
                  {version.is_active && <span style={styles.activeBadge}>ACTIVE</span>}
                </div>
                <p style={{fontSize: '12px', color: '#666', margin: '5px 0'}}>
                  Created: {new Date(version.created_at).toLocaleDateString()}
                </p>
              </div>
              <div style={{display: 'flex', gap: '5px'}}>
                {!version.is_active && (
                  <>
                    <button 
                      style={styles.smallButton}
                      onClick={() => activateTermsVersion(version.id)}
                    >
                      Activate
                    </button>
                    <button 
                      style={{...styles.smallButton, background: '#dc3545'}}
                      onClick={() => deleteTermsVersion(version.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)}

{showTimeSettingsModal && (
  <div style={styles.modalOverlay}>
    <div style={styles.timeSettingsModalContent}>
      <div style={styles.timeSettingsModalHeader}>
        <h2 style={styles.timeSettingsModalTitle}>
          <FontAwesomeIcon icon={faClock} /> Attendance Time Settings
        </h2>
        <button 
          style={styles.closeButton}
          onClick={() => {
            setShowTimeSettingsModal(false);
            setEditingDay(null);
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div style={styles.timeSettingsContent}>
        <p style={styles.timeSettingsDescription}>
          Set the official working hours for each day of the week. 
          Employees checking in after the start time will be marked as late.
        </p>

        {isLoadingTimeSettings ? (
          <div style={styles.loadingContainer}>
            <p>Loading time settings...</p>
          </div>
        ) : (
          <>
            <div style={styles.timeSettingsGrid}>
              {/* Define all days of the week */}
              {[
                { key: 'monday', label: 'Monday (Early Start)' },
                { key: 'tuesday', label: 'Tuesday' },
                { key: 'wednesday', label: 'Wednesday' },
                { key: 'thursday', label: 'Thursday' },
                { key: 'friday', label: 'Friday' },
                { key: 'saturday', label: 'Saturday' },
                { key: 'sunday', label: 'Sunday' }
              ].map(({ key, label }) => {
                // Get config or use default empty structure
                const config = attendanceTimeSettings[key] || {};
                
                // Determine if day is active (default to true if not set)
                const isActive = config.is_active !== undefined ? config.is_active : true;
                
                // Get start/end times or use empty strings
                const startTime = config.start || '';
                const endTime = config.end || '';
                
                // Check if time is set
                const isTimeSet = startTime && endTime;
                
                return (
                  <div key={key} style={{
                    ...styles.timeSettingCard,
                    opacity: isActive ? 1 : 0.7,
                    borderColor: isActive ? '#e9ecef' : '#ccc'
                  }}>
                    <div style={styles.timeSettingHeader}>
                      <div>
                        <h4 style={styles.dayName}>
                          {label}
                        </h4>
                        {!isActive && (
                          <span style={styles.inactiveBadge}>INACTIVE</span>
                        )}
                      </div>
                      {editingDay === key ? (
                        <button 
                          style={styles.saveTimeButton}
                          onClick={() => setEditingDay(null)}
                        >
                          Done
                        </button>
                      ) : (
                        <button 
                          style={styles.editTimeButton}
                          onClick={() => setEditingDay(key)}
                          disabled={!isActive}
                        >
                          {isTimeSet ? 'Edit' : 'Add'}
                        </button>
                      )}
                    </div>
                    
                    {editingDay === key ? (
                      <div style={styles.timeInputs}>
                        <div style={styles.timeInputGroup}>
                          <label style={styles.timeLabel}>Start Time</label>
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => {
                              setAttendanceTimeSettings(prev => ({
                                ...prev,
                                [key]: { 
                                  ...prev[key], 
                                  start: e.target.value,
                                  end: endTime || '17:00',
                                  is_active: true
                                }
                              }));
                            }}
                            style={styles.timeInput}
                          />
                        </div>
                        <div style={styles.timeInputGroup}>
                          <label style={styles.timeLabel}>End Time</label>
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => {
                              setAttendanceTimeSettings(prev => ({
                                ...prev,
                                [key]: { 
                                  ...prev[key], 
                                  end: e.target.value,
                                  start: startTime || '08:00',
                                  is_active: true
                                }
                              }));
                            }}
                            style={styles.timeInput}
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={styles.timeDisplay}>
                        {isTimeSet ? (
                          <>
                            <div style={styles.timeSlot}>
                              <FontAwesomeIcon icon={faArrowRight} style={styles.timeIcon} />
                              <span style={styles.timeText}>Start: {startTime}</span>
                            </div>
                            <div style={styles.timeSlot}>
                              <FontAwesomeIcon icon={faArrowLeft} style={styles.timeIcon} />
                              <span style={styles.timeText}>End: {endTime}</span>
                            </div>
                          </>
                        ) : (
                          <div style={styles.noTimeSet}>
                            <FontAwesomeIcon icon={faClock} style={styles.noTimeIcon} />
                            <span style={styles.noTimeText}>Time not set</span>
                            <button 
                              style={styles.addTimeButton}
                              onClick={() => setEditingDay(key)}
                            >
                              <FontAwesomeIcon icon={faPlus} /> Add Time
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={styles.timeSettingsActions}>
              <button 
                style={styles.saveAllButton}
                onClick={async () => {
                  try {
                    // Prepare data for saving - only include days with times
                    const settingsToSave = {};
                    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                    
                    days.forEach(day => {
                      const config = attendanceTimeSettings[day] || {};
                      if (config.start && config.end) {
                        settingsToSave[day] = {
                          start: config.start,
                          end: config.end,
                          is_active: config.is_active !== false // Default to true if not set
                        };
                      }
                    });
                    
                    if (Object.keys(settingsToSave).length === 0) {
                      alert('Please add at least one time setting');
                      return;
                    }
                    
                    console.log('Saving settings:', settingsToSave);
                    
                    const response = await fetch(`${API_URL}/api/attendance/settings/time`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(settingsToSave)
                    });

                    if (response.ok) {
                      alert('Attendance time settings saved successfully!');
                      setShowTimeSettingsModal(false);
                      setEditingDay(null);
                      
                      // Refresh settings from server
                      const refreshResponse = await fetch(`${API_URL}/api/attendance/settings/time`);
                      if (refreshResponse.ok) {
                        const data = await refreshResponse.json();
                        setAttendanceTimeSettings(data);
                      }
                    } else {
                      const errorData = await response.json();
                      alert(`Failed to save: ${errorData.error || 'Unknown error'}`);
                    }
                  } catch (error) {
                    console.error('Error saving time settings:', error);
                    alert('Error saving settings. Check console.');
                  }
                }}
              >
                <FontAwesomeIcon icon={faSave} /> Save All Settings
              </button>
              <button 
                style={styles.resetButton}
                onClick={async () => {
                  if (window.confirm('Are you sure you want to reset all time settings to default?')) {
                    try {
                      const response = await fetch(`${API_URL}/api/attendance/settings/time/reset`, {
                        method: 'POST'
                      });

                      if (response.ok) {
                        alert('Settings reset to default successfully!');
                        // Refresh settings
                        const refreshResponse = await fetch(`${API_URL}/api/attendance/settings/time`);
                        if (refreshResponse.ok) {
                          const data = await refreshResponse.json();
                          setAttendanceTimeSettings(data);
                        }
                      } else {
                        alert('Failed to reset settings');
                      }
                    } catch (error) {
                      console.error('Error resetting settings:', error);
                      alert('Error resetting settings');
                    }
                  }
                }}
              >
                <FontAwesomeIcon icon={faHistory} /> Reset to Default
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
)}


    <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={styles.sidebar}>
      <div className="sidebar-header">
        <button 
          className="sidebar-close-btn"
          onClick={() => setIsSidebarOpen(false)}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
        {/* MOVED: Logo inside sidebar header */}
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


        <li>
          <Link
            style={styles.sb}
            to="#"
            onClick={(e) => {
              e.preventDefault();
              setShowLogoutModal(true);
              setIsSidebarOpen(false);
            }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} style={styles.icon} /> Logout
          </Link>
        </li>
      </ul>
    </div>

      {/* Desktop Header */}
      <div className="desktop-header" style={styles.header}>
        <input type="text" placeholder="Search..." style={styles.search} />

        <div style={styles.headerRight}>
          <div className="notification-badge-container" style={{position: 'relative'}}>
            <FontAwesomeIcon icon={faBell} style={styles.iconBell} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                backgroundColor: '#ff4444',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {notifications.length}
              </span>
            )}
          </div>

          <div style={styles.profileContainer}>
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={styles.profileInfo}
            >
              <img
                src={
                  admin?.profile_picture ||
                  profileData?.profile_picture ||
                  "https://res.cloudinary.com/demo/image/upload/v1690000000/default-avatar.png"
                }
                alt="Profile"
                style={styles.profileImage}
              />
              <div style={styles.profileDetails}>
                <p style={styles.profileName}>
                  {admin?.full_name ||
                    profileData?.full_name ||
                    "Loading..."}
                </p>
                <p style={styles.profileRole}>
                  {admin?.role || profileData?.role || ""}
                </p>
              </div>
            </div>

            {showProfileMenu && (
              <div style={styles.profileDropdown}>
                <button style={styles.dropdownItem} onClick={() => setShowProfileModal(true)}>
                  <FontAwesomeIcon icon={faUserCog} style={styles.dropdownIcon} /> My Profile
                </button>
                <button 
                  style={styles.dropdownItem}
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowSettingsModal(true);
                  }}
                >
                  <FontAwesomeIcon icon={faCog} style={styles.dropdownIcon} /> Settings
                </button>
                <button
                  style={styles.dropdownItem}
                  onClick={() => setShowLogoutModal(true)}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} style={styles.dropdownIcon} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showProfileModal && (
        <div style={styles.modalOverlayProfile} className="profile-modal-overlay">
          <div style={styles.modalContentProfile} className="profile-modal-content">
            <h2 style={styles.modalTitle}>My Profile</h2>

            <div style={styles.profileSection}>
              <div className="photo-container">
                <img
                  src={
                    profileData.profile_picture ||
                    "https://res.cloudinary.com/demo/image/upload/v1690000000/default-avatar.png"
                  }
                  alt="Profile"
                  className="modal-profile-image"
                  style={styles.modalImage}
                  
                />
              <div className="photo-overlay">
                <label htmlFor="profileUpload" className="change-photo-btn">
                  {isUploading ? "Uploading..." : "Change Photo"}
                </label>

                <input
                  id="profileUpload"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    setIsUploading(true);
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("upload_preset", "profile_picture");

                    try {
                      const res = await fetch(
                        "https://api.cloudinary.com/v1_1/dlrveckcz/image/upload",
                        { method: "POST", body: formData }
                      );
                      const data = await res.json();

                      if (data.secure_url) {
                        setProfileData((prev) => ({
                          ...prev,
                          profile_picture: data.secure_url,
                        }));
                      } else {
                        alert("Upload failed");
                      }
                    } catch (err) {
                      console.error(err);
                      alert("Upload error");
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                />
              </div>
              </div>
            </div>

            <div style={styles.formSection}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, full_name: e.target.value })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="text"
                  value={profileData.email}
                  disabled
                  style={styles.inputDisabled}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Role</label>
                <input
                  type="text"
                  value={profileData.role}
                  disabled
                  style={styles.inputDisabled}
                />
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button
                style={styles.saveBtn}
                disabled={isUploading}
                onClick={async () => {
                  if (!profileData.profile_picture) {
                    alert("Please upload a profile image first.");
                    return;
                  }

                  const storedUser = JSON.parse(localStorage.getItem("admin"));
                  if (!storedUser) {
                    alert("User not found in localStorage.");
                    return;
                  }

                  const endpoint =
                    storedUser.role === "office_head"
                      ? `http://localhost:5000/api/authAdmin/update/${storedUser.id}`
                      : `http://localhost:5000/api/auth/updateProfile/${storedUser.id}`;

                  const body = {};
                  if (profileData.full_name) body.full_name = profileData.full_name;
                  if (profileData.profile_picture) body.profile_picture = profileData.profile_picture;
                  if (profileData.department && storedUser.role === "office_head") body.department = profileData.department;
                  if (profileData.email && storedUser.role !== "office_head") body.email = profileData.email;

                  try {
                    const res = await fetch(endpoint, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(body),
                    });

                    const result = await res.json();

                    if (res.ok) {
                      alert("✅ Profile updated successfully!");
                      setShowProfileModal(false);
                      setProfileData(result);
                    } else {
                      alert(result.message || "Failed to update profile.");
                    }
                  } catch (err) {
                    console.error("❌ Error updating profile:", err);
                    alert("Error updating profile. See console.");
                  }
                }}
              >
                {isUploading ? "Uploading..." : "Save Changes"}
              </button>

              <button style={styles.cancelButton} onClick={() => setShowProfileModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="content" style={styles.content}>
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

{hoverInfo && (
  <div
    className="calendar-tooltip"
    ref={tooltipRef}
    style={{
      position: "fixed",
      top: `${Math.max(10, hoverInfo.y - hoverInfo.scrollY)}px`,
      left: `${Math.max(10, hoverInfo.x - hoverInfo.scrollX - 280)}px`,
      background: "#ffffff",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.08)",
      zIndex: 9999,
      width: "300px",
      maxHeight: "400px",
      border: "1px solid #e0e0e0",
      animation: "slideIn 0.2s ease-out",
      pointerEvents: "auto",
    }}
    onMouseEnter={(e) => {
      // Prevent wheel events from scrolling the page
      e.preventDefault();
      e.stopPropagation();
    }}
    onMouseLeave={() => setHoverInfo(null)}
    onWheel={(e) => {
      // Only allow scrolling inside the tooltip, not the page
      e.stopPropagation();
      const tooltip = e.currentTarget;
      const isAtTop = tooltip.scrollTop === 0;
      const isAtBottom = tooltip.scrollHeight - tooltip.scrollTop === tooltip.clientHeight;
      
      if (e.deltaY < 0 && isAtTop) {
        // At top and scrolling up - prevent
        e.preventDefault();
      } else if (e.deltaY > 0 && isAtBottom) {
        // At bottom and scrolling down - prevent
        e.preventDefault();
      }
    }}
    onTouchStart={(e) => {
      // Prevent touch events from scrolling the page
      e.stopPropagation();
    }}
    onTouchMove={(e) => {
      // Only allow touch scrolling inside the tooltip
      e.stopPropagation();
    }}
  >
    {/* Rest of the tooltip content remains the same */}
    {/* Arrow pointing to calendar date */}
    <div style={{
      position: "absolute",
      top: "10px",
      right: "-8px",
      width: "0",
      height: "0",
      borderTop: "8px solid transparent",
      borderBottom: "8px solid transparent",
      borderLeft: "8px solid #ffffff",
      filter: "drop-shadow(1px 0px 1px rgba(0,0,0,0.1))",
      zIndex: 1
    }} />

    {/* Date Header - Clean and Professional */}
    <div style={{
      display: "flex",
      alignItems: "center",
      paddingBottom: "12px",
      borderBottom: "1px solid #f0f0f0"
    }}>
      <div style={{
        width: "40px",
        height: "40px",
        background: "#f8f9fa",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginRight: "12px",
        color: "#333333",
        fontWeight: "600",
        fontSize: "16px",
        border: "1px solid #e9ecef"
      }}>
        {new Date(hoverInfo.date).getDate()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: "12px",
          color: "#666666",
          fontWeight: "500",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: "2px"
        }}>
          {new Date(hoverInfo.date).toLocaleDateString('en-US', { weekday: 'short' })}
        </div>
        <div style={{
          fontSize: "15px",
          fontWeight: "600",
          color: "#212529",
          lineHeight: "1.2"
        }}>
          {new Date(hoverInfo.date).toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric'
          })}
        </div>
      </div>
    </div>

    {/* Holiday Section - Professional */}
    {hoverInfo.holiday && (
      <div style={{
        background: "#f8f9fa",
        padding: "12px",
        borderRadius: "6px",
        marginBottom: "12px",
        border: "1px solid #e9ecef"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "6px"
        }}>
          <div style={{
            width: "24px",
            height: "24px",
            background: "#f8f9fa",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: "10px",
            color: "#dc3545",
            fontSize: "14px",
            border: "1px solid #e9ecef"
          }}>
            <FontAwesomeIcon icon={faStar} />
          </div>
          <div style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#212529"
          }}>
            Public Holiday
          </div>
        </div>
        <div style={{
          fontSize: "13px",
          color: "#495057",
          paddingLeft: "34px",
          lineHeight: "1.4",
          display: "flex",
          alignItems: "flex-start",
          gap: "8px"
        }}>
          <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: "12px", marginTop: "2px", color: "#6c757d" }} />
          <span style={{ flex: 1 }}>{hoverInfo.holiday.name}</span>
        </div>
      </div>
    )}

    {/* Leaves Section - Enhanced with status beside name */}
    {hoverInfo.leaves.length > 0 && (
      <div>
        <div style={{
          display: "flex",
          alignItems: "center",
          paddingBottom: "10px",
          borderBottom: "1px solid #f0f0f0"
        }}>
          <div style={{
            width: "24px",
            height: "24px",
            background: "#f8f9fa",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: "10px",
            color: "#495057",
            fontSize: "14px",
            border: "1px solid #e9ecef"
          }}>
            <FontAwesomeIcon icon={faClipboardList} />
          </div>
          <div style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#212529"
          }}>
            Leave Requests ({hoverInfo.leaves.length})
          </div>
        </div>
        
        <div style={{
          maxHeight: "220px",
          overflowY: "auto",
          paddingRight: "4px"
        }}>
          {hoverInfo.leaves.map((leave, i) => (
            <div 
              key={i} 
              style={{
                background: "#ffffff",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "10px",
                border: "1px solid #e9ecef",
                transition: "all 0.2s ease",
                cursor: "default",
                position: "relative"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#dee2e6";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e9ecef";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Header row with name and status */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px"
              }}>
                {/* Left side: Employee info */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  flex: 1,
                  minWidth: 0,
                  gap: "10px"
                }}>
                  {/* Status dot */}
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: leave.status === "Approved" ? "#28a745" : 
                              leave.status === "Pending" ? "#ffc107" : "#dc3545",
                    flexShrink: 0
                  }} />
                  
                  {/* Employee icon and name */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flex: 1,
                    minWidth: 0
                  }}>
                    <FontAwesomeIcon 
                      icon={faUser} 
                      style={{ 
                        fontSize: "12px", 
                        color: "#6c757d",
                        flexShrink: 0
                      }} 
                    />
                    <span style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#212529",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {leave.first_name} {leave.last_name}
                    </span>
                  </div>
                </div>
                
                {/* Right side: Status badge */}
                <div style={{
                  marginLeft: "8px",
                  flexShrink: 0
                }}>
                  <span style={{
                    padding: "3px 8px",
                    background: leave.status === "Approved" ? "#f1f8f1" : 
                              leave.status === "Pending" ? "#fff8e6" : "#fdf2f2",
                    color: leave.status === "Approved" ? "#2b8a3e" : 
                          leave.status === "Pending" ? "#856404" : "#c92a2a",
                    borderRadius: "4px",
                    fontWeight: "500",
                    fontSize: "11px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    border: "1px solid",
                    borderColor: leave.status === "Approved" ? "#d4edda" : 
                               leave.status === "Pending" ? "#ffeaa7" : "#f8d7da",
                    whiteSpace: "nowrap"
                  }}>
                    {leave.status === "Approved" && <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: "9px" }} />}
                    {leave.status === "Pending" && <FontAwesomeIcon icon={faClock} style={{ fontSize: "9px" }} />}
                    {leave.status === "Rejected" && <FontAwesomeIcon icon={faTimes} style={{ fontSize: "9px" }} />}
                    {leave.status}
                  </span>
                </div>
              </div>
              
              {/* Leave type */}
              <div style={{
                fontSize: "12px",
                color: "#495057",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <FontAwesomeIcon 
                  icon={faCalendarDay} 
                  style={{ 
                    fontSize: "11px", 
                    color: "#868e96",
                    flexShrink: 0
                  }} 
                />
                <span style={{
                  fontWeight: "500",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}>
                  {leave.leave_type}
                </span>
              </div>
              
              {/* Department row */}
              {leave.department && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  paddingTop: "8px",
                  borderTop: "1px solid #f8f9fa"
                }}>
                  <FontAwesomeIcon 
                    icon={faBuilding} 
                    style={{ 
                      fontSize: "11px", 
                      color: "#868e96",
                      flexShrink: 0
                    }} 
                  />
                  <span style={{
                    fontSize: "11px",
                    color: "#6c757d",
                    fontWeight: "500",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {leave.department}
                  </span>
                </div>
              )}
              
              {/* Optional: Filing date if available */}
              {leave.date_filing && (
                <div style={{
                  fontSize: "10px",
                  color: "#adb5bd",
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <FontAwesomeIcon icon={faClock} style={{ fontSize: "9px" }} />
                  <span>Filed: {leave.date_filing}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* No Content Message - Professional */}
    {!hoverInfo.holiday && hoverInfo.leaves.length === 0 && (
      <div style={{
        textAlign: "center",
        padding: "20px 16px",
        color: "#6c757d",
        fontSize: "13px",
        background: "#f8f9fa",
        borderRadius: "6px",
        border: "1px solid #e9ecef"
      }}>
        <FontAwesomeIcon 
          icon={faCalendarAlt} 
          style={{ 
            fontSize: "24px", 
            marginBottom: "8px", 
            color: "#adb5bd"
          }} 
        />
        <div style={{
          fontWeight: "500",
          marginBottom: "4px"
        }}>
          No events scheduled
        </div>
        <div style={{
          fontSize: "11px",
          color: "#868e96"
        }}>
          {new Date(hoverInfo.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </div>
      </div>
    )}
  </div>
)}

        <div className="cnt1" style={styles.cnt1}>
          <div className="cards" style={styles.cards}>
            {cardsData.map((card, index) => (
              <div key={index} className="card-box" style={card.background}>
                <p className="card-title">{card.title}</p>
                <p className="card-desc">{card.description}</p>
                <p className="card-value">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="calendar" style={styles.calendar}>
            <Calendar
              onChange={setDate}
              value={date}
              locale="en-US"
              formatShortWeekday={(_, date) => {
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return days[date.getDay()];
              }}
              next2Label={null}
              prev2Label={null}
              tileContent={renderTileContent}
              tileClassName={tileClassName}
            />
          </div>
        </div>

        {/* MOBILE: Table Toggle Section */}
        <div className="table-toggle-section">
          <div className="toggle-header">
            <button 
              className={`toggle-btn ${activeTable === 'attendance' ? 'active' : ''}`}
              onClick={() => setActiveTable('attendance')}
            >
              Attendance Status
            </button>
            <button 
              className={`toggle-btn ${activeTable === 'leave' ? 'active' : ''}`}
              onClick={() => setActiveTable('leave')}
            >
              Leave Status
            </button>
          </div>

          {/* Attendance Table */}
          <div className={`toggle-content ${activeTable === 'attendance' ? 'active' : ''}`}>
            <div className="table-container" style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>AM (In / Out)</th>
                    <th style={styles.th}>PM (In / Out)</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length > 0 ? (
                    attendance.slice(0, 7).map(emp => (
                      <tr key={emp.id}>
                        <td style={styles.td}>{emp.id}</td>
                        <td style={styles.td}>{emp.name}</td>
                        <td style={styles.td}>
                          {emp.amCheckin || "-"} / {emp.amCheckout || "-"}
                        </td>
                        <td style={styles.td}>
                          {emp.pmCheckin || "-"} / {emp.pmCheckout || "-"}
                        </td>
                        <td style={styles.td}>{emp.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "#777" }}>
                        No attendance records found for today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <button className="mobile-view-all-btn" onClick={() => navigate('/attendance')}>
              View All Attendance <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>

          {/* Leave Status Table */}
          <div className={`toggle-content ${activeTable === 'leave' ? 'active' : ''}`}>
            <div className="table-container" style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Leave Type</th>
                    <th style={styles.th}>Department</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.length > 0 ? (
                    leaveRequests.slice(0, 7).map(item => (
                      <tr key={item.id}>
                        <td style={styles.td}>{item.id}</td>
                        <td style={styles.td}>{item.first_name} {item.last_name}</td>
                        <td style={styles.td}>{item.leave_type}</td>
                        <td style={styles.td}>{item.department}</td>
                        <td style={styles.td}>
                          {item.inclusive_date_start || "-"} 
                          {item.inclusive_date_end ? ` - ${item.inclusive_date_end}` : ""}
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              color:
                                item.status === "Approved"
                                  ? "green"
                                  : item.status === "Pending"
                                  ? "orange"
                                  : "red",
                              fontWeight: "bold"
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#777" }}>
                        No leave requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <button className="mobile-view-all-btn" onClick={() => navigate('/leaveManagement')}>
              View All Leave Requests <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </div>

        {/* MOBILE: Charts and Notifications Row */}
        <div className="row3">
          {/* Attendance Chart Section */}
          <div className="chart-section">
            <div className="section-header">
              <h3>Attendance Statistics</h3>
              <button className="nav-arrow">→</button>
            </div>
            <div className="chart-container">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <PieChart width={200} height={185}>
                  <Pie
                    data={pieData}
                    cx={90}
                    cy={90}
                    innerRadius={35}
                    outerRadius={60}
                    labelLine={false}
                    label={pieData.length === 1 ? false : renderCustomizedLabel}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
                {/* Mobile Legend */}
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  marginTop: '10px',
                  fontSize: '12px'
                }}>
                  {pieData.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: COLORS[index % COLORS.length],
                      }} />
                      <span>{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Leaves Section */}
          <div className="leaves-section">
            <div className="section-header">
              <h3>Monthly Leaves Filed</h3>
              <button className="nav-arrow">→</button>
            </div>
            
            {/* Mobile Dropdown */}
            <div className="leaves-dropdown-container">
              <div 
                className={`leaves-dropdown ${isOpen ? 'leaves-dropdown-open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
              >
                <span>{selected}</span>
                <span className={`leaves-dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
              </div>
              
              {isOpen && (
                <div className="leaves-dropdown-options">
                  {options.map((option, index) => (
                    <div
                      key={index}
                      className="leaves-dropdown-option"
                      onClick={() => handleSelect(option)}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '16px', width: '100%', height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyLeaves}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10, fill: '#000' }} 
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#000' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* FIXED: Notifications Section */}
          <div className="notification-section">
            <div className="section-header">
              <h3>Recent Notifications</h3>
              <button className="nav-arrow">→</button>
            </div>
            <div className="notification-container">
              {notifications.length > 0 ? (
                <ul style={styles.notificationList}>
                  {notifications.map((notification, index) => {
                    const { icon, color } = getNotificationStyle(notification.type || 'system_notice');
                    return (
                      <li key={notification.id || index} style={styles.notificationItem}>
                        <FontAwesomeIcon
                          icon={icon}
                          style={{ ...styles.notificationIcon, color }}
                        />
                        <span style={styles.notificationText}>
                          {notification.message || "New notification"}
                        </span>
                        <button 
                          style={styles.viewButton}
                          onClick={() => {
                            // Navigate based on notification type
                            if (notification.type === 'leave_filed' || notification.type === 'leave_approved') {
                              navigate('/leaveManagement');
                            } else if (notification.type === 'attendance_alert') {
                              navigate('/attendance');
                            } else if (notification.type === 'new_hire') {
                              navigate('/employee');
                            }
                          }}
                        >
                          View
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#777',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 1px 5px rgba(0,0,0,0.1)'
                }}>
                  <FontAwesomeIcon icon={faBell} style={{ fontSize: '24px', marginBottom: '10px', color: '#ccc' }} />
                  <p>No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DESKTOP: Original Tables Layout */}
        <div className="desktop-tables">
          <div className="row2" style={styles.row2}>
            <div className="table-container" style={styles.tableContainer}>
              <h5 style={{ padding: "5px" }}>Attendance Status</h5>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>AM (In / Out)</th>
                    <th style={styles.th}>PM (In / Out)</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length > 0 ? (
                    attendance.slice(0, 7).map(emp => (
                      <tr key={emp.id}>
                        <td style={styles.td}>{emp.id}</td>
                        <td style={styles.td}>{emp.name}</td>
                        <td style={styles.td}>
                          {emp.amCheckin || "-"} / {emp.amCheckout || "-"}
                        </td>
                        <td style={styles.td}>
                          {emp.pmCheckin || "-"} / {emp.pmCheckout || "-"}
                        </td>
                        <td style={styles.td}>{emp.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "10px", color: "#777" }}>
                        No attendance records found for today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-container" style={styles.tableContainer}>
              <h5 style={{ padding: '5px' }}>Leave Status</h5>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Leave Type</th>
                    <th style={styles.th}>Department</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.length > 0 ? (
                    leaveRequests.slice(0, 7).map(item => (
                      <tr key={item.id}>
                        <td style={styles.td}>{item.id}</td>
                        <td style={styles.td}>{item.first_name} {item.last_name}</td>
                        <td style={styles.td}>{item.leave_type}</td>
                        <td style={styles.td}>{item.department}</td>
                        <td style={styles.td}>
                          {item.inclusive_date_start || "-"} 
                          {item.inclusive_date_end ? ` - ${item.inclusive_date_end}` : ""}
                        </td>
                        <td style={styles.td}>
                          <span
                            style={{
                              color:
                                item.status === "Approved"
                                  ? "green"
                                  : item.status === "Pending"
                                  ? "orange"
                                  : "red",
                              fontWeight: "bold"
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "10px", color: "#777" }}>
                        No leave requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* DESKTOP: Charts and Notifications */}
        <div className="desktop-charts">
          <div className="row3" style={styles.row3}>
            <div style={styles.chartContainer}>
              <h4>Attendance Statistics</h4>
              <div style={styles.pieAndLegend}>
                <PieChart width={200} height={185}>
                  <Pie
                    data={pieData}
                    cx={90}
                    cy={90}
                    innerRadius={35}
                    outerRadius={60}
                    labelLine={false}
                    label={pieData.length === 1 ? false : renderCustomizedLabel}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>

                <div style={styles.legendContainer}>
                  {pieData.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: COLORS[index % COLORS.length],
                        marginRight: 8
                      }} />
                      <span style={{ fontSize: '13px' }}>{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={styles.cardBar}>
              <div style={styles.header5}>
                <h3 style={styles.title}>Monthly Leaves Filed</h3>

                <div style={{ width: '200px', position: 'relative' }}>
                  <div
                    onClick={() => setIsOpen(!isOpen)}
                    style={styles.dropdown}
                  >
                    {selected}
                  </div>

                  {isOpen && (
                    <div
                      style={styles.openDropdown}
                    >
                      {options.map((option, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelect(option)}
                          style={{
                            padding: '10px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ width: '330px' }}>
                <ResponsiveContainer width={"100%"} height={165}>
                  <BarChart data={monthlyLeaves}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#000' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#000' }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* FIXED: Desktop Notifications */}
            <div style={styles.notificationContainer}>
              <h4>Recent Notifications</h4>
              {notifications.length > 0 ? (
                <ul style={styles.notificationList}>
                  {notifications.slice(0, 3).map((notification, index) => {
                    const { type, message } = notification;
                    const { icon, color } = getNotificationStyle(type || 'system_notice');

                    return (
                      <li key={notification.id || index} style={styles.notificationItem}>
                        <FontAwesomeIcon
                          icon={icon}
                          style={{ ...styles.notificationIcon, color }}
                        />

                        <span style={styles.notificationText}>
                          {message || "New notification"}
                        </span>

                        <button 
                          style={styles.viewButton}
                          onClick={() => {
                            if (notification.type === 'leave_filed' || notification.type === 'leave_approved') {
                              navigate('/leaveManagement');
                            } else if (notification.type === 'attendance_alert') {
                              navigate('/attendance');
                            } else if (notification.type === 'new_hire') {
                              navigate('/employee');
                            }
                          }}
                        >
                          View Details
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#777',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 1px 5px rgba(0,0,0,0.1)'
                }}>
                  <FontAwesomeIcon icon={faBell} style={{ fontSize: '32px', marginBottom: '15px', color: '#ccc' }} />
                  <p>No notifications available</p>
                  <p style={{ fontSize: '12px', marginTop: '5px', color: '#999' }}>
                    Notifications will appear here when available
                  </p>
                </div>
              )}
            </div>

          </div>
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
    position: 'relative',
  },
  sidebar: {
    backgroundColor: '#009205',
    width: '280px',
    height: '100vh',
    position: 'fixed',
    padding: '20px',
    boxSizing: 'border-box',
    transition: 'transform 0.3s ease',
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
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    position: "relative",
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
  profileDropdown: {
    position: "absolute",
    top: "55px",
    right: "0",
    backgroundColor: "#fff",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    borderRadius: "10px",
    padding: "8px 0",
    width: "130px",
    zIndex: 1000,
  },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    width: "100%",
    border: "none",
    background: "none",
    textAlign: "left",
    fontSize: "14px",
    cursor: "pointer",
    color: "#333",
  },
  dropdownIcon: {
    fontSize: "14px",
  },
  content: {
    marginLeft: '280px',
    minHeight: '100vh',
    backgroundColor: '#F8F8F8',
    paddingTop: '70px',
    width: 'calc(100% - 280px)',
    boxSizing: 'border-box',
    overflowY: 'auto',  // Changed from overFlowY to overflowY
    overflowX: 'hidden', // Prevent horizontal scroll
    // Hide scrollbar for Webkit browsers
    scrollbarWidth: 'none', // For Firefox
    msOverflowStyle: 'none', // For IE/Edge
  },
  cnt1: {
    display: 'flex',
    flexDirection: 'row',
    margin: '0 auto',
    padding: '20px',
    gap: '20px',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  cards: {
    display: 'flex',
    flexWrap: 'wrap',
    flex: '2',
    justifyContent: 'space-between',
    gap: '5px',
    flex: '1 1 600px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px',
    margin: '10px 0',
    textAlign: 'left',
    width: 'calc(33.333% - 10px)',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  card1: {
    backgroundColor: '#07A5FA55',
    borderRadius: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px',
    margin: '10px 0',
    textAlign: 'left',
    width: 'calc(33.333% - 10px)',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  card2: {
    backgroundColor: '#EA050555',
    borderRadius: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px',
    margin: '10px 0',
    textAlign: 'left',
    width: 'calc(33.333% - 10px)',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  card3: {
    backgroundColor: '#FAAB0055',
    borderRadius: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px',
    margin: '10px 0',
    textAlign: 'left',
    width: 'calc(33.333% - 10px)',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  calendar: {
    borderRadius: '8px',
    maxWidth: '550px',
    minWidth: '280px',
    padding: '10px',
    flex: '1 1 auto',
    boxSizing: 'border-box',
    flex: '1 1 250px',
  },
  row2: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '20px',
    alignItems: 'flex-start',
    gap: '20px',
    flexWrap: 'wrap',
  },
  tableContainer: {
    flex: '1 1 60%',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '10px',
    minWidth: '300px',
    maxWidth: '580px',
    boxSizing: 'border-box',
    minHeight: '300px',
    overflowX: 'auto',
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    minWidth: '600px',
  },
  th: {
    fontSize: '12px',
    padding: '10px',
    borderBottom: '1px solid #ddd',
    textAlign: 'left',
  },
  td: {
    padding: '10px',
    fontSize: '12px',
    backgroundColor: 'white',
    borderBottom: '1px solid #f2f2f2',
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "150px",
  },
  row3: {
    display: 'flex',
    flexDirection: 'row',
    padding: '20px',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    gap: '20px',
    flexWrap: 'wrap',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '10px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'column',
    flex: '1 1 300px',
    minWidth: '280px',
    maxWidth: '400px',
    boxSizing: 'border-box',
  },
  pieAndLegend: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  legendContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  cardBar: {
    backgroundColor: '#fff',
    padding: '10px',
    borderRadius: '10px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
    flex: '1 1 350px',
    minWidth: '300px',
    maxWidth: '450px',
    boxSizing: 'border-box',
  },
  header5: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  title: {
    margin: 0,
    fontSize: '15px',
  },
  dropdown: {
    padding: '6px 10px',
    borderRadius: '6px',
    backgroundColor: 'white',
    border: '1px solid black',
    color: '#000',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '15px',
  },
  openDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    width: '100%',
    maxHeight: '160px',
    overflowY: 'auto',
    border: '1px solid #000',
    borderTop: 'none',
    background: '#fff',
    zIndex: 10,
  },
  notificationContainer: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '15px',
    flex: '1 1 350px',
    minWidth: '300px',
    maxWidth: '550px',
    boxSizing: 'border-box',
  },
  notificationList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  notificationItem: {
    padding: '12px 15px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px',
    backgroundColor: '#fff',
    boxShadow: '0 1px 5px rgba(0,0,0,0.1)',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  notificationIcon: {
    fontSize: '16px',
    flexShrink: 0,
  },
  notificationText: {
    flex: 1,
    fontSize: '13px',
    marginRight: '10px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  viewButton: {
    backgroundColor: '#FDFF76',
    color: '#4F4F4F',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    minWidth: '80px',
    textAlign: 'center',
  },
  btnActive: {
    backgroundColor: '#A8FC0080',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
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

  // Add these to your styles object:

settingsModalContent: {
  backgroundColor: "white",
  borderRadius: "12px",
  width: "400px",
  maxHeight: "80vh",
  overflowY: "auto",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  animation: "slideIn 0.3s ease",
},

settingsModalHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px",
  borderBottom: "1px solid #eee",
},

settingsModalTitle: {
  margin: 0,
  fontSize: "20px",
  color: "#333",
},

settingsSections: {
  padding: "20px",
},

settingsSectionButton: {
  width: "100%",
  padding: "15px",
  textAlign: "left",
  border: "none",
  background: "#f8f9fa",
  borderRadius: "8px",
  marginBottom: "10px",
  cursor: "pointer",
  fontSize: "16px",
  transition: "all 0.2s",
  display: "flex",
  alignItems: "center",
},

termsModalContent: {
  backgroundColor: "white",
  borderRadius: "12px",
  width: "800px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  animation: "slideIn 0.3s ease",
},

termsModalHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px",
  borderBottom: "1px solid #eee",
},

termsModalTitle: {
  margin: 0,
  fontSize: "20px",
  color: "#333",
},

closeButton: {
  background: "none",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  color: "#666",
},

activeTermsCard: {
  background: "#f8f9fa",
  padding: "15px",
  margin: "20px",
  borderRadius: "8px",
  border: "1px solid #e9ecef",
},

activeBadge: {
  background: "#28a745",
  color: "white",
  padding: "3px 10px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "bold",
},

termsContentSection: {
  padding: "0 20px",
  marginBottom: "20px",
},

editButton: {
  background: "#007bff",
  color: "white",
  border: "none",
  padding: "8px 15px",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "14px",
},

saveButton: {
  background: "#28a745",
  color: "white",
  border: "none",
  padding: "8px 15px",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "14px",
},

cancelButton: {
  background: "#6c757d",
  color: "white",
  border: "none",
  padding: "8px 15px",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "14px",
},

versionInput: {
  width: "100%",
  padding: "8px",
  border: "1px solid #ddd",
  borderRadius: "4px",
  fontSize: "14px",
},

termsTextarea: {
  width: "100%",
  padding: "15px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  fontSize: "14px",
  fontFamily: "inherit",
  resize: "vertical",
},

termsViewer: {
  background: "#f8f9fa",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #eee",
  minHeight: "200px",
  maxHeight: "300px",
  overflowY: "auto",
  whiteSpace: "pre-wrap",
  lineHeight: "1.6",
},

versionHistory: {
  padding: "0 20px 20px",
},

versionItem: {
  background: "#fff",
  padding: "15px",
  marginBottom: "10px",
  borderRadius: "8px",
  border: "1px solid #eee",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
},

smallButton: {
  background: "#007bff",
  color: "white",
  border: "none",
  padding: "5px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
},

// Add these new styles to your styles object:
timeSettingsModalContent: {
  backgroundColor: "white",
  borderRadius: "12px",
  width: "800px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  animation: "slideIn 0.3s ease",
},

timeSettingsModalHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px",
  borderBottom: "1px solid #eee",
},

timeSettingsModalTitle: {
  margin: 0,
  fontSize: "20px",
  color: "#333",
},

timeSettingsContent: {
  padding: "20px",
},

timeSettingsDescription: {
  color: "#666",
  marginBottom: "20px",
  fontSize: "14px",
  lineHeight: "1.5",
},

loadingContainer: {
  textAlign: "center",
  padding: "40px",
  color: "#666",
},

noSettingsContainer: {
  textAlign: "center",
  padding: "40px",
  color: "#666",
  border: "2px dashed #ddd",
  borderRadius: "8px",
  backgroundColor: "#f9f9f9",
},

timeSettingsGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: "15px",
  marginBottom: "30px",
},

timeSettingCard: {
  background: "#f8f9fa",
  padding: "15px",
  borderRadius: "8px",
  border: "1px solid #e9ecef",
},

timeSettingHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
},

dayName: {
  margin: 0,
  fontSize: "16px",
  color: "#333",
},

inactiveBadge: {
  backgroundColor: "#6c757d",
  color: "white",
  padding: "2px 8px",
  borderRadius: "12px",
  fontSize: "10px",
  fontWeight: "bold",
  marginLeft: "8px",
},

editTimeButton: {
  background: "#6c757d",
  color: "white",
  border: "none",
  padding: "5px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
},

saveTimeButton: {
  background: "#28a745",
  color: "white",
  border: "none",
  padding: "5px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
},

timeInputs: {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
},

timeInputGroup: {
  display: "flex",
  flexDirection: "column",
  gap: "5px",
},

timeLabel: {
  fontSize: "12px",
  color: "#666",
},

timeInput: {
  padding: "8px",
  border: "1px solid #ddd",
  borderRadius: "4px",
  fontSize: "14px",
},

timeDisplay: {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
},

timeSlot: {
  display: "flex",
  alignItems: "center",
  gap: "8px",
},

timeIcon: {
  fontSize: "12px",
  color: "#666",
},

timeText: {
  fontSize: "14px",
  color: "#333",
},

timeSettingsActions: {
  display: "flex",
  justifyContent: "center",
  gap: "15px",
  paddingTop: "20px",
  borderTop: "1px solid #eee",
},

saveAllButton: {
  background: "#007bff",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
},

resetButton: {
  background: "#6c757d",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
},

// Add to your styles object:
noTimeSet: {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '15px 0',
  gap: '10px',
  textAlign: 'center',
},

noTimeIcon: {
  fontSize: '24px',
  color: '#adb5bd',
  marginBottom: '5px',
},

noTimeText: {
  fontSize: '14px',
  color: '#6c757d',
  marginBottom: '5px',
},

addTimeButton: {
  background: '#007bff',
  color: 'white',
  border: 'none',
  padding: '6px 12px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
},

};

export default Dashboard;