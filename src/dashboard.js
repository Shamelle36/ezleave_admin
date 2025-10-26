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
} from '@fortawesome/free-solid-svg-icons';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useState } from 'react';
import './dashboardCalendar.css';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { height, width } from '@fortawesome/free-solid-svg-icons/fa0';

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

  const handleSelect = (option) => {
    setSelected(option);
    setIsOpen(false);
  };
  
  
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
        const res = await fetch("http://localhost:5000/api/employees/count");
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
        `http://localhost:5000/api/employees/count?role=${encodeURIComponent(role)}&department=${encodeURIComponent(department)}`
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
  const fetchLeaveRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/leave-requests");
      const data = await res.json();
      setLeaveRequests(data);
    } catch (err) {
      console.error("Error fetching leave requests:", err);
    }
  };

  fetchLeaveRequests();

  // Optional auto-refresh every 5 mins
  const interval = setInterval(fetchLeaveRequests, 300000);
  return () => clearInterval(interval);
}, []);


 useEffect(() => {
  const today = new Date().toISOString().split("T")[0]; // e.g. "2025-10-03"

  const fetchAttendance = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/attendance?date=${today}`);
      
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

  // Refresh every 5 minutes (300000 ms)
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
    value: 0,
    background: styles.card1,
    paddingTop: '5px',
  },
  {
    title: 'Absent Employees',
    description: '2% less than last month',
    value: 0,
    background: styles.card2,
    paddingTop: '20px',
  },
  {
    title: 'Late Employees',
    description: '2% less than last month',
    value: 0,
    background: styles.card3,
    paddingTop: '20px',
  },
];

  const employees = [
    { id: 1, name: 'Shamelle Tadeja', department: 'HR', timein: '8:00 AM', timeout: '4:00 PM', status: 'On-Time' },
    { id: 2, name: 'Reyland Tanglao', department: 'Finance', timein: '8:00 AM', timeout: '4:00 PM', status: 'Late' },
    { id: 3, name: 'Renz Retuya', department: 'IT', timein: '8:00 AM', timeout: '4:00 PM', status: 'Absent' },
    { id: 4, name: 'Angel Salgado', department: 'IT', timein: '8:00 AM', timeout: '4:00 PM', status: 'On-Time' },
    { id: 5, name: 'Jared Tamangan', department: 'Financer', timein: '8:00 AM', timeout: '4:00 PM', status: 'Absent' }
  ];

  const leave = [
    { id: 1, name: 'Shamelle Tadeja', leaveType: 'Vacation', department: 'HR', date: '2023-10-01', status: 'Approved' },
    { id: 2, name: 'Reyland Tanglao', leaveType: 'Sick', department: 'Finance', date: '2023-10-02', status: 'Pending' },
    { id: 3, name: 'Renz Retuya', leaveType: 'Emergency', department: 'IT', date: '2023-10-03', status: 'Rejected' },
    { id: 4, name: 'Angel Salgado', leaveType: 'Vacation', department: 'IT', date: '2023-10-04', status: 'Approved' },
    { id: 5, name: 'Jared Tamangan', leaveType: 'Sick', department: 'Financer', date: '2023-10-05', status: 'Pending' }
  ];

  const notifications = [
    { id: 1, message: 'Shamelle Tadejas leave request approved.', type: 'Leave_Approval' },
    { id: 2, message: 'New employee onboarded in HR department.', type: 'New_Hire' },
    { id: 3, message: 'Reyland Tanglaos attendance marked as late today.', type: 'Attendance_Alert' },
    { id: 4, message: 'System update scheduled for 11 PM tonight.', type: 'System_Notice' },
  ];

  const getNotificationStyle = (type) => {
  switch (type) {
    case 'Leave_Approval':
      return { icon: faCheckCircle, color: '#28a745' }; 
    case 'New_Hire':
      return { icon: faUserPlus, color: '#007bff' }; 
    case 'Attendance_Alert':
      return { icon: faClock, color: '#ffc107' }; 
    case 'System_Notice':
      return { icon: faBell, color: '#17a2b8' }; 
    case 'Reminder':
      return { icon: faCalendarAlt, color: '#dc3545' }; 
    default:
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
          const res = await fetch("http://localhost:5000/api/leave-requests/monthly");
          const data = await res.json();
          setMonthlyLeaves(data);
        } catch (err) {
          console.error("Error fetching monthly leaves:", err);
        }
      };

      fetchMonthlyLeaves();
    }, []);

    useEffect(() => {
      const fetchMonthlyLeaves = async () => {
        try {
          const url = selected !== "Leave Type" 
            ? `http://localhost:5000/api/leave-requests/monthly?leaveType=${encodeURIComponent(selected)}`
            : "http://localhost:5000/api/leave-requests/monthly";

          const res = await fetch(url);
          const data = await res.json();
          setMonthlyLeaves(data);
        } catch (err) {
          console.error("Error fetching monthly leaves:", err);
        }
      };

      fetchMonthlyLeaves();
    }, [selected]); // 👈 refetch whenever dropdown changes


  const dataBar = [
    { month: 'Jan', value: 15, fill: '#FF0000' },
    { month: 'Feb', value: 18, fill: '#FFA500' },
    { month: 'Mar', value: 9, fill: '#FFA500' },
    { month: 'Apr', value: 13, fill: '#FF0000' },
    { month: 'May', value: 22, fill: '#FFA500' },
    { month: 'Jun', value: 27, fill: '#0000FF' },
    { month: 'Jul', value: 17, fill: '#FF0000' },
    { month: 'Aug', value: 9, fill: '#0000FF' },
    { month: 'Sep', value: 14, fill: '#0000FF' },
    { month: 'Oct', value: 21, fill: '#FF0000' },
    { month: 'Nov', value: 15, fill: '#0000FF' },
    { month: 'Dec', value: 7, fill: '#FFA500' },
  ];


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

  useEffect(() => {
  const fetchAdmin = async () => {
    const storedAdmin = JSON.parse(localStorage.getItem("admin"));
    if (!storedAdmin?.id) return;

    try {
      const res = await fetch(`http://localhost:5000/api/auth/useradmin/${storedAdmin.id}`);
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

      // ✅ Choose the correct API endpoint depending on the role
      const url =
        storedUser.role === "office_head"
          ? `http://localhost:5000/api/authAdmin/user/${storedUser.id}`
          : `http://localhost:5000/api/auth/useradmin/${storedUser.id}`;

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setAdmin(data);        // ✅ for header display
        setProfileData(data);  // ✅ for modal
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

      // ✅ Use the same correct route here
      const url =
        storedUser.role === "office_head"
          ? `http://localhost:5000/api/authAdmin/user/${storedUser.id}`
          : `http://localhost:5000/api/auth/useradmin/${storedUser.id}`;

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


  return (
    <div style={styles.dashboardContainer}>

     <div style={styles.header}>
        <input type="text" placeholder="Search..." style={styles.search} />

        <div style={styles.headerRight}>
          <FontAwesomeIcon icon={faBell} style={styles.iconBell} />

          {/* Profile Section */}
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
          </div>
        </div>
      </div>

{showProfileModal && (
  <div style={styles.modalOverlayProfile}>
    <div style={styles.modalContentProfile}>
      <h2 style={styles.modalTitle}>My Profile</h2>

      {/* Profile Photo Section */}
      <div style={styles.profileSection}>
        <div className="photoContainer">
          <img
            src={
              profileData.profile_picture ||
              "https://res.cloudinary.com/demo/image/upload/v1690000000/default-avatar.png"
            }
            alt="Profile"
            className="modalProfileImage"
          />
          <div className="photoOverlay">
            <label htmlFor="profileUpload" className="overlayText">
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

      {/* Form Fields */}
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

      {/* Buttons */}
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

    // ✅ Choose correct endpoint based on role
    const endpoint =
      storedUser.role === "office_head"
        ? `http://localhost:5000/api/authAdmin/update/${storedUser.id}`
        : `http://localhost:5000/api/auth/updateProfile/${storedUser.id}`;

    // Only include fields that exist to avoid UNDEFINED_VALUE
    const body = {};
    if (profileData.full_name) body.full_name = profileData.full_name;
    if (profileData.profile_picture) body.profile_picture = profileData.profile_picture;
    if (profileData.department && storedUser.role === "office_head") body.department = profileData.department;
    if (profileData.email && storedUser.role !== "office_head") body.email = profileData.email; // admins only

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
        setProfileData(result); // sync updated data
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

      {/* ✅ Inline style tag for hover effect */}
      <style>
        {`
          .photoContainer {
            position: relative;
            width: 120px;
            height: 120px;
            border-radius: 50%;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            cursor: pointer;
          }

          .modalProfileImage {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
            transition: transform 0.3s ease;
          }

          .photoOverlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.55);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
            border-radius: 50%;
          }

          .photoContainer:hover .photoOverlay {
            opacity: 1;
          }

          .photoContainer:hover .modalProfileImage {
            transform: scale(1.05);
          }

          .overlayText {
            font-size: 0.9rem;
            font-weight: 500;
          }
        `}
      </style>
    </div>
  </div>
)}

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


        <div style={styles.cnt1}>
          <div style={styles.cards}>
              {cardsData.map((card, index) => (
                <div key={index} style={card.background}>
                  <p style={{ fontSize: '15px', fontWeight: '500' }}>{card.title}</p>
                  <p style={{ fontSize: '12px', paddingTop: '5px' }}>{card.description}</p>
                  <p style={{ fontSize: '25px', paddingTop: card.paddingTop, fontWeight: '600' }}>
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

          
          <div style={styles.calendar}>
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
            />
          </div>
        </div>

        <div style={styles.row2}>
          <div style={styles.tableContainer}>
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
              attendance.slice(0, 7).map(emp => (   // 👈 only show first 6 records
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
                <td
                  colSpan="6"
                  style={{ textAlign: "center", padding: "10px", color: "#777" }}
                >
                  No attendance records found for today.
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>



          <div style={styles.tableContainer}>
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
                    leaveRequests.map(item => (
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

        <div style={styles.row3}>
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

          <div style={styles.notificationContainer}>
           <ul style={styles.notificationList}>
                {notifications.map(notification => {
                  const { icon, color } = getNotificationStyle(notification.type);

                  return (
                    <li key={notification.id} style={styles.notificationItem}>
                      <FontAwesomeIcon
                        icon={icon}
                        style={{ ...styles.notificationIcon, color }}
                      />

                      <span style={styles.notificationText}>
                        {notification.message}
                      </span>

                      <button style={styles.viewButton}>View Details</button>
                    </li>
                  );
                })}
              </ul>
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
  profileCaret: {
    fontSize: "14px",
    color: "#666",
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
  card1:{
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
    minWidth: '280px',
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
    minHeight: '300px'
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
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
    maxHeight: '160px', // 4 items * 40px
    overflowY: 'auto',
    border: '1px solid #000',
    borderTop: 'none',
    background: '#fff',
    zIndex: 10,
    
  },

  notificationContainer: {
    borderRadius: '12px',
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
    padding: '10px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    backgroundColor: '#fff',
    boxShadow: '0 1px 5px rgba(0,0,0,0.1)',
    borderRadius: '5px',
    marginBottom: '11px',
  },

  notificationIcon: {
    fontSize: '16px',
    color: '#009205',
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
    padding: '5px 5px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '12px',
    width: '100px',
    fontWeight: '600',
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
  photoContainer: {
    position: "relative",
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    overflow: "hidden",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    cursor: "pointer",
  },
  modalProfileImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "50%",
    transition: "transform 0.3s ease",
  },
  photoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.55)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
    transition: "opacity 0.3s ease",
    borderRadius: "50%",
  },
  overlayText: {
    fontSize: "0.9rem",
    fontWeight: "500",
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
};


export default Dashboard;