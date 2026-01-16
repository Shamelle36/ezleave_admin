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
  faPlus,
  faCalendarPlus,
  faCalendarMinus,
  faFlag
} from '@fortawesome/free-solid-svg-icons';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useState, useRef } from 'react';
import './dashboardCalendar.css';
import './dashboard-responsive.css';
import './App.css';
import ProfileDropdown from './profileDropdown.js';
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
  const [activeTable, setActiveTable] = useState('attendance');
  const [hoverInfo, setHoverInfo] = useState(null); 
  const [notifications, setNotifications] = useState([]);
  const [isMobileView, setIsMobileView] = useState(false);

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
  const [apiHolidays, setApiHolidays] = useState([]);
  const [isLoadingApiHolidays, setIsLoadingApiHolidays] = useState(false);
  const [holidayYear, setHolidayYear] = useState(new Date().getFullYear());

  // Add Local Holiday state variables
  const [showLocalHolidayModal, setShowLocalHolidayModal] = useState(false);
  const [localHolidays, setLocalHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({
    date: '',
    name: '',
    description: '',
    is_recurring: false
  });
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
const [showNotificationModal, setShowNotificationModal] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: faTachometerAlt, to: "/dashboard" },
    { name: "Employees", icon: faUsers, to: "/employee" },
    { name: "Attendance", icon: faCalendarCheck, to: "/attendance" },
    { name: "Leave Management", icon: faCalendarAlt, to: "/leaveManagement" },
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
        "Leave Management",
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

  // Update holidays array to include local holidays
  const nationalHolidays = [
    { date: "2025-12-25", name: "Christmas Day", type: "national" },
    { date: "2025-12-30", name: "Rizal Day", type: "national" },
    { date: "2025-01-01", name: "New Year's Day", type: "national" }
  ];

  const holidays = [...apiHolidays, ...localHolidays];

  useEffect(() => {
  // Check if any modal is open
  const isAnyModalOpen = 
    showSettingsModal || 
    showTermsModal || 
    showTimeSettingsModal || 
    showLocalHolidayModal || 
    showProfileModal || 
    showLogoutModal ||
    showNotificationModal;
  
  if (isAnyModalOpen) {
    // Store current scroll position
    const scrollY = window.scrollY;
    
    // Prevent scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    // Restore scroll position when modal closes
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }
}, [showSettingsModal, showTermsModal, showNotificationModal, showTimeSettingsModal, showLocalHolidayModal, showProfileModal, showLogoutModal]);

  // Add this useEffect after your other useEffects
  useEffect(() => {
    if (showTermsModal) {
      fetchTermsAndConditions();
    }
  }, [showTermsModal]);

  useEffect(() => {
  // Load local holidays when dashboard loads
  fetchLocalHolidays();
}, []);

  // Add useEffect to load local holidays
useEffect(() => {
  if (showLocalHolidayModal) {
    fetchLocalHolidays();
  }
}, [showLocalHolidayModal]);

  const normalizeFilingDate = (str) => {
    if (!str) return null;

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
    const checkMobile = () => {
      if (typeof window !== 'undefined') setIsMobileView(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when calendar tooltip is shown as modal on mobile
  useEffect(() => {
    if (hoverInfo && hoverInfo.isModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [hoverInfo]);

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

  // Fetch API holidays when component mounts
useEffect(() => {
  const currentYear = new Date().getFullYear();
  setHolidayYear(currentYear);
  fetchApiHolidays(currentYear);
}, []);

// Also fetch holidays when year changes in calendar
useEffect(() => {
  const year = date.getFullYear();
  if (year !== holidayYear) {
    setHolidayYear(year);
    fetchApiHolidays(year);
  }
}, [date]);

  // Fetch Philippine holidays from free API
const fetchApiHolidays = async (year) => {
  setIsLoadingApiHolidays(true);
  try {
    // Using Nager.Date API - free, no API key needed
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PH`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch holidays: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Format the API data to match our structure
    const formattedHolidays = data.map(holiday => ({
      id: `api-${holiday.date}`,
      date: holiday.date, // Already in YYYY-MM-DD format
      name: holiday.localName || holiday.name,
      type: 'national', // All from this API are national holidays
      description: holiday.types?.join(', ') || 'Public Holiday',
      isRecurring: true, // Most national holidays recur yearly
      source: 'api'
    }));
    
    console.log(`Fetched ${formattedHolidays.length} holidays for ${year}`);
    setApiHolidays(formattedHolidays);
    
  } catch (error) {
    console.error('Error fetching holidays from API:', error);
    
    // Fallback to basic Philippine holidays if API fails
  } finally {
    setIsLoadingApiHolidays(false);
  }
};

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
    
    if (!settings || !settings.is_active) return false;
    
    const [checkinHour, checkinMinute] = checkinTime.split(':').map(Number);
    const [startHour, startMinute] = settings.start.split(':').map(Number);
    
    const checkinTotal = checkinHour * 60 + checkinMinute;
    const startTotal = startHour * 60 + startMinute;
    
    return checkinTotal > startTotal;
  };

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
            const viewportHeight = window.innerHeight;
            const tooltipHeight = 400; // Estimated tooltip height
            const tooltipWidth = 300;
            
            // Calculate position to prevent overflow
            let top = rect.top + window.scrollY;
            let left = rect.left + window.scrollX;
            
            // Adjust if tooltip would overflow bottom of viewport
            if (top + tooltipHeight > window.scrollY + viewportHeight - 20) {
              top = Math.max(10, window.scrollY + viewportHeight - tooltipHeight - 20);
            }
            
            // Adjust if tooltip would overflow right of viewport
            if (left + tooltipWidth > window.scrollX + window.innerWidth - 20) {
              left = Math.max(10, window.scrollX + window.innerWidth - tooltipWidth - 20);
            }
            
            setHoverInfo({
              x: left,
              y: top,
              date: dateStr,
              leaves: leavesOnThisDay,
              holiday,
              scrollX: window.scrollX,
              scrollY: window.scrollY
            });
          }}
          onClick={(e) => {
            if (typeof window !== 'undefined' && window.innerWidth <= 768) {
              const rect = e.currentTarget.getBoundingClientRect();
              const viewportHeight = window.innerHeight;
              const tooltipHeight = 400;
              
              let top = rect.top + window.scrollY;
              if (top + tooltipHeight > window.scrollY + viewportHeight - 20) {
                top = Math.max(10, window.scrollY + viewportHeight - tooltipHeight - 20);
              }
              
              setHoverInfo({
                x: rect.left + window.scrollX,
                y: top,
                date: dateStr,
                leaves: leavesOnThisDay,
                holiday,
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                isModal: true
              });
            }
          }}
          onMouseLeave={(e) => {
            setTimeout(() => {
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
        
        {holiday && (
          <FontAwesomeIcon 
            icon={holiday.source === 'api' ? faFlag : faStar} 
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              fontSize: '10px',
              color: holiday.source === 'api' ? '#dc3545' : 
                     holiday.type === 'local' ? '#ff8c00' : '#ff6b6b',
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

  const API_URL = "https://ezleave-admin-api.onrender.com";

const fetchLocalHolidays = async () => {
  setIsLoadingHolidays(true);
  try {
    const response = await fetch(`${API_URL}/api/holidays/local`);
    if (response.ok) {
      const data = await response.json();
      // Ensure the date is in YYYY-MM-DD format and add type property
      const holidaysWithType = data.map(holiday => ({
        ...holiday,
        date: holiday.date.split('T')[0], // Remove time portion if present
        type: 'local'
      }));
      setLocalHolidays(holidaysWithType);
    } else {
      console.warn('Failed to fetch local holidays');
      setLocalHolidays([]);
    }
  } catch (error) {
    console.error('Error fetching local holidays:', error);
      setLocalHolidays([]);
  } finally {
    setIsLoadingHolidays(false);
  }
};

  // Add holiday functions
  const saveHoliday = async () => {
  if (!newHoliday.date || !newHoliday.name.trim()) {
    alert('Please fill in all required fields');
    return;
  }

  try {
    const url = editingHoliday 
      ? `${API_URL}/api/holidays/local/${editingHoliday.id}`
      : `${API_URL}/api/holidays/local`;
    
    const method = editingHoliday ? 'PUT' : 'POST';
    
    const holidayData = {
      ...newHoliday,
      type: 'local' // Add type property
    };
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(holidayData)
    });

    if (response.ok) {
      alert(editingHoliday ? 'Holiday updated successfully!' : 'Holiday added successfully!');
      fetchLocalHolidays();
      setNewHoliday({ date: '', name: '', description: '', is_recurring: false });
      setEditingHoliday(null);
    } else {
      const errorData = await response.json();
      alert(`Failed to save: ${errorData.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error saving holiday:', error);
    alert('Error saving holiday. Check console.');
  }
};

  const deleteHoliday = async (id) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      try {
        const response = await fetch(`${API_URL}/api/holidays/local/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          alert('Holiday deleted successfully!');
          fetchLocalHolidays();
        } else {
          alert('Failed to delete holiday');
        }
      } catch (error) {
        console.error('Error deleting holiday:', error);
        alert('Error deleting holiday');
      }
    }
  };

  const editHoliday = (holiday) => {
    setEditingHoliday(holiday);
    setNewHoliday({
      date: holiday.date,
      name: holiday.name,
      description: holiday.description || '',
      is_recurring: holiday.is_recurring || false
    });
  };

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
      
      const todayDate = new Date();
      const dayOfWeek = todayDate.getDay();

      let present = 0;
      let absent = 0;
      let late = 0;
      
      data.forEach(log => {
        const hasAttendance = log.am_checkin || log.pm_checkin;
        
        if (hasAttendance) {
          present++;
          
          if (log.am_checkin && checkIfLate(log.am_checkin, dayOfWeek)) {
            late++;
          }
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
      const leaveRes = await fetch(`${API_URL}/api/leave-requests`);
      const leaveData = await leaveRes.json();
      
      const extractedNotifications = leaveData
        .filter(item => item.notification)
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
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
    value: employeeCount,
    background: styles.card, 
    showForAll: true
  },
  {
    title: 'Pending Leave Requests',
    value: leaveCounts.pending,
    background: styles.card,
  },
  {
    title: 'Approved Leave Requests',
    value: leaveCounts.approved,
    background: styles.card,
  },
  {
    title: 'Present Employees',
    value: attendanceStats.present,
    background: styles.card1,
  },
  {
    title: 'Absent Employees',
    value: attendanceStats.absent,
    background: styles.card2,
  },
  {
    title: 'Late Employees',
    value: attendanceStats.late,
    background: styles.card3,
  },
];

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
  
  const fetchTermsAndConditions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/terms/active`);
      const data = await response.json();
      
      if (data && data.content) {
        setTermsContent(data.content);
        setActiveTermsVersion(data);
      } else {
        setTermsContent('');
        setActiveTermsVersion(null);
      }
      
      try {
        const versionsRes = await fetch(`${API_URL}/api/terms`);
        const versionsData = await versionsRes.json();
        
        if (Array.isArray(versionsData)) {
          setTermsVersions(versionsData);
        } else if (versionsData && Array.isArray(versionsData.data)) {
          setTermsVersions(versionsData.data);
        } else if (versionsData && versionsData.versions) {
          setTermsVersions(versionsData.versions);
        } else {
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

  const saveTermsAndConditions = async () => {
    if (!termsContent.trim()) {
      alert('Please enter Terms & Conditions content');
      return;
    }

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
            setProfileData={setProfileData}
          />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="mobile-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={styles.sidebar}>
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
            setProfileData={setProfileData}
          />
        </div>
      </div>

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
          <>
            {hoverInfo.isModal && (
                <div
                  className="calendar-backdrop"
                  onClick={() => setHoverInfo(null)}
                  style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    zIndex: 99998,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                  }}
                />
              )}
              <div
                className="calendar-tooltip"
                ref={tooltipRef}
                style={{
                  position: "fixed",
                  top: `${hoverInfo.y}px`,
                  left: `${hoverInfo.x - 280}px`,
                  background: "#ffffff",
                  padding: "16px",
                  borderRadius: "8px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.08)",
                  zIndex: 99999,
                  width: "300px",
                  maxHeight: "60vh",
                  border: "1px solid #e0e0e0",
                  animation: "slideIn 0.2s ease-out",
                  pointerEvents: "auto",
                }}
                onMouseEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseLeave={() => {
                  if (!hoverInfo.isModal) {
                    setHoverInfo(null);
                  }
                }}
                onWheel={(e) => {
                  e.stopPropagation();
                  const tooltip = e.currentTarget;
                  const isAtTop = tooltip.scrollTop === 0;
                  const isAtBottom = tooltip.scrollHeight - tooltip.scrollTop === tooltip.clientHeight;
                  
                  // Only prevent default when at boundaries
                  if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
                    e.preventDefault();
                  }
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
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
              }} className="calendar-tooltip-arrow" />

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
                      color: hoverInfo.holiday.type === 'local' ? "#ff8c00" : "#dc3545",
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
                      {hoverInfo.holiday.type === 'local' ? 'Local Holiday' : 'Public Holiday'}
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
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "8px"
                        }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            flex: 1,
                            minWidth: 0,
                            gap: "10px"
                          }}>
                            <div style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: leave.status === "Approved" ? "#28a745" : 
                                        leave.status === "Pending" ? "#ffc107" : "#dc3545",
                              flexShrink: 0
                            }} />
                            
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
          </>
        )}

        <div className="cnt1" style={styles.cnt1}>
          <div className="cards" style={styles.cards}>
            {cardsData.map((card, index) => (
              <div key={index} className="card-box" style={{
                        ...card.background,
                        marginBottom: index < 4 ? '20px' : 0 // Add margin to first 3 cards only
                      }}
              >
                <p className="card-value" style={styles.cardValue}>
                  {card.value}
                </p>
                <p className="card-title" style={styles.cardTitle}>{card.title}</p>
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
              // Added these props to prevent expansion
              view="month"
              maxDetail="month"
              minDetail="month"
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

          {/* Notifications Section */}
          <div className="notification-section">
            <div className="section-header">
              <h3>Recent Notifications</h3>
              <button className="nav-arrow">→</button>
            </div>
            <div className="notification-container">
              {notifications.length > 0 ? (
                <ul style={styles.notificationList}>
                  {(isMobileView ? notifications.slice(0,3) : notifications).map((notification, index) => {
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

            {/* Desktop Notifications */}
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
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
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
    flex: '4 1 0',
    justifyContent: 'space-between',
    gap: '5px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '30px',
    margin: '10px 0',
    textAlign: 'left',
    width: 'calc(50% - 10px)',
    boxSizing: 'border-box',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card1: {
    backgroundColor: '#07A5FA55',
    borderRadius: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '30px',
    margin: '10px 0',
    textAlign: 'left',
    width: 'calc(50% - 10px)',
    boxSizing: 'border-box',
    flexShrink: 0,
     display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card2: {
    backgroundColor: '#EA050555',
    borderRadius: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '30px',
    margin: '10px 0',
    textAlign: 'left',
    width: 'calc(50% - 10px)',
    boxSizing: 'border-box',
    flexShrink: 0,
     display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card3: {
    backgroundColor: '#FAAB0055',
    borderRadius: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '30px',
    margin: '10px 0',
    textAlign: 'left',
    width: 'calc(50% - 10px)',
    boxSizing: 'border-box',
    flexShrink: 0,
     display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardValue: {
    fontSize: '24px',
    fontWeight: '700',
  },

  cardTitle: {
    fontSize: '14px',
    color: '#555',
  },

  calendar: {
    borderRadius: '8px',
    maxWidth: '350px',
    minWidth: '280px',
    flex: '1 1 auto',
    boxSizing: 'border-box',
    paddingTop: '10px',
  },
  row2: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '20px',
    alignItems: 'flex-start',
    gap: '20px',
    flexWrap: 'nowrap', // Changed from 'wrap' to 'nowrap'
    width: '100%',
  },
  tableContainer: {
    flex: '1 1 auto', // Changed from '1' to '1 1 auto'
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '15px',
    minWidth: '300px',
    // REMOVED: maxWidth: '580px',
    width: '100%', // Added
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
    padding: '0 20px 20px 20px', // Changed to remove top padding
    justifyContent: 'space-between', // Changed from 'space-around'
    alignItems: 'stretch', // Changed from 'flex-start'
    gap: '20px',
    flexWrap: 'nowrap', // Changed from 'wrap'
    width: '100%',
    boxSizing: 'border-box',
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
    minWidth: '300px',
    boxSizing: 'border-box',
  },
  header5: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    gap: '50px'
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
    fontSize: '12px',
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

  // Settings Modal
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
    background: "#ffffffff",
    borderRadius: "8px",
    marginBottom: "10px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 1px 5px rgba(0,0,0,0.1)",
    border: "none"
  },

  // Terms Modal
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
    background: "#ffffffff",
    padding: "15px",
    margin: "20px",
    borderRadius: "8px",
    border: "1px solid #e9ecef",
  },
  activeBadge: {
    background: "#ffffffff",
    color: "black",
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid #28a745",
  },
  termsContentSection: {
    padding: "0 20px",
    marginBottom: "20px",
  },
  editButton: {
    background: "#28a745",
    color: "white",
    border: "none",
    padding: "5px 15px",
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
    resize: "vertical",
  },
  termsViewer: {
    background: "#ffffffff",
    padding: "20px",
    borderRadius: "8px",
    border: "1px solid #eee",
    minHeight: "200px",
    maxHeight: "300px",
    overflowY: "auto",
    whiteSpace: "pre-wrap",
    lineHeight: "1.6",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
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
    boxShadow: "0 1px 5px rgba(0,0,0,0.1)",
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

  // Time Settings Modal
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
  timeSettingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "15px",
    marginBottom: "30px",
  },
  timeSettingCard: {
    background: "#ffffffff",
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
    fontSize: "14px",
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
    border: "1px solid #e9ecef",
    padding: "5px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    backgroundColor: "white",
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
    background: "#009205",
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
    background: "#f5f5f5ff",
    color: "black",
    border: "1px solid #e9ecef",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
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

  // Local Holiday Modal Styles
  localHolidayModalContent: {
    backgroundColor: "white",
    borderRadius: "12px",
    width: "800px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    animation: "slideIn 0.3s ease",
  },
  localHolidayModalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid #eee",
  },
  localHolidayModalTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#333",
  },
  localHolidayContent: {
    padding: "20px",
  },
  holidayFormSection: {
    marginBottom: "30px",
    padding: "20px",
    backgroundColor: "#ffffffff",
    borderRadius: "8px",
    border: "1px solid #e9ecef",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "20px",
    color: "#333",
    fontSize: "18px",
  },
  holidayForm: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  formLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#495057",
  },
  dateInput: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
  },
  textInput: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
  },
  textareaInput: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    fontSize: "14px",
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    color: "#495057",
    cursor: "pointer",
  },
  checkboxInput: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  formButtons: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  holidayListSection: {
    marginTop: "20px",
  },
  holidayList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "400px",
    overflowY: "auto",
  },
  holidayItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    border: "1px solid #e9ecef",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  holidayInfo: {
    flex: 1,
  },
  holidayDate: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "5px",
    display: "flex",
    alignItems: "center",
  },
  recurringBadge: {
    backgroundColor: "#e7f5ff",
    color: "#228be6",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    marginLeft: "10px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  holidayName: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#333",
    marginBottom: "5px",
  },
  holidayDescription: {
    fontSize: "14px",
    color: "#666",
    fontStyle: "italic",
  },
  holidayActions: {
    display: "flex",
    gap: "10px",
  },
  editHolidayButton: {
    backgroundColor: "#ffc107",
    color: "#212529",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteHolidayButton: {
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  noHolidays: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#6c757d",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    border: "2px dashed #dee2e6",
  },
  noHolidaysIcon: {
    fontSize: "48px",
    color: "#adb5bd",
    marginBottom: "15px",
  },
  noHolidaysSubtext: {
    fontSize: "14px",
    color: "#868e96",
    marginTop: "5px",
  },
};

export default Dashboard;