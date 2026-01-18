import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faFilter,
  faEye,
  faKey,
  faCheckCircle,
  faTimesCircle,
  faUserShield,
  faBuilding,
  faEnvelopeOpen,
  faCalendar,
  faSave,
  faInfoCircle,
  faBars,
  faTimes,
  faUserSlash,
  faUserCheck,
  faArchive,
  faRedo,
  faFileExport
} from "@fortawesome/free-solid-svg-icons";
import ProfileDropdown from "./profileDropdown";
import './user-management-responsive.css'; 

// Firebase Configuration - Directly in the component file
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyATHtZYzpJWI752_8EcFn1QCwxPavOJXEM",
  authDomain: "ezleave-admin.firebaseapp.com",
  projectId: "ezleave-admin",
  storageBucket: "ezleave-admin.firebasestorage.app",
  messagingSenderId: "1016228054768",
  appId: "1:1016228054768:web:e0ec3759df6341ef0b2435"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);

function UserManagement() {
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [inactiveAccounts, setInactiveAccounts] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [newAccount, setNewAccount] = useState({
    full_name: "",
    email: "",
    role: "",
    department: "",
  });
  const [editingAccount, setEditingAccount] = useState({
    full_name: "",
    email: "",
    role: "",
    department: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [admin, setAdmin] = useState(JSON.parse(localStorage.getItem("admin")) || null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    role: "",
    profile_picture: "",
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  const departments = [
    "Office of the Municipal Mayor",
    "Human Resource Management Division",
    "Business Permit and Licensing Division",
    "Sangguniang Bayan Office",
    "Office of the Municipal Accountant",
    "Office of the Assessor",
    "Municipal Budget Office",
    "Municipal Planning and Development Office",
    "Office of the Municipal Engineer",
    "Municipal Risk Reduction and Management Office",
    "Municipal Social Welfare and Development Office",
    "Municipal Environment and Natural Resources Office",
    "Office of the Municipal Agriculturist",
    "Municipal General Services Office",
    "Municipal Public Employment Service Office",
    "Municipal Health Office",
    "Municipal Treasurer's Office",
  ];

  const API_URL = "https://ezleave-admin-api.onrender.com";

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') setIsMobileView(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

        const url = storedUser.role === "office_head" 
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

        const url = storedUser.role === "office_head" 
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

  // Fetch all user accounts
  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/authAdmin/accounts`);
      const data = await res.json();
      setAccounts(data.accounts || []);
      
      // Also fetch inactive accounts
      const inactiveRes = await fetch(`${API_URL}/api/authAdmin/accounts/inactive`);
      const inactiveData = await inactiveRes.json();
      setInactiveAccounts(inactiveData.accounts || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Filter accounts based on search and role filter
  useEffect(() => {
    const sourceAccounts = showInactive ? inactiveAccounts : accounts;
    let filtered = sourceAccounts;
    
    // Add status filtering based on the view
    if (!showInactive) {
      filtered = filtered.filter(account => account.status === "active");
    } else {
      filtered = filtered.filter(account => account.status === "inactive");
    }
    
    if (searchTerm) {
      filtered = filtered.filter(account =>
        account.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (roleFilter !== "all") {
      filtered = filtered.filter(account => account.role === roleFilter);
    }
    
    setFilteredAccounts(filtered);
  }, [accounts, inactiveAccounts, searchTerm, roleFilter, showInactive]);

const handleCreateAccount = async () => {
  if (!newAccount.full_name || !newAccount.email || !newAccount.role || (newAccount.role !== "mayor" && !newAccount.department)) {
    alert("Please complete all required fields before submission.");
    return;
  }

  setLoading(true);

  // STEP 0: Generate a single temp password here
  const tempPassword = Math.random().toString(36).slice(-10) + "A1@";

  try {
    // STEP 1: Create account in backend FIRST (send tempPassword)
    const backendData = {
      ...newAccount,
      password: tempPassword, // send temp password to backend
    };

    const resBackend = await fetch(`${API_URL}/api/authAdmin/createAccount`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backendData),
    });

    const dataBackend = await resBackend.json();

    if (!resBackend.ok) {
      throw new Error(dataBackend.message || "Backend account creation failed.");
    }

    console.log(`✅ Backend account created: ${dataBackend.userId}`);

    // STEP 2: Create Firebase user with the SAME temp password
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, newAccount.email, tempPassword);
    const firebaseUser = userCredential.user;
    console.log(`✅ Firebase user created: ${firebaseUser.uid}`);

    // STEP 3: Send password reset email via Firebase
    await sendPasswordResetEmail(firebaseAuth, newAccount.email, {
      url: `https://ezleave-admin.vercel.app/login`,
      handleCodeInApp: false,
    });
    console.log(`✅ Firebase password reset email sent to: ${newAccount.email}`);

    // SUCCESS: update frontend state
    setMessage("✅ Account created successfully! Password setup email sent via Firebase.");
    setNewAccount({ full_name: "", email: "", role: "", department: "" });
    setShowModal(false);
    fetchAccounts();

  } catch (err) {
    console.error("❌ Account creation error:", err.message);
    setMessage(`❌ ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  const handleViewAccount = (acc) => {
    setSelectedAccount(acc);
    setViewModal(true);
  };

  const handleEditAccount = (acc) => {
    if (acc.status === "inactive") {
      setMessage("⚠️ Inactive accounts cannot be edited. Please restore the account first.");
      setTimeout(() => setMessage(""), 5000);
      return;
    }
    
    setSelectedAccount(acc);
    setEditingAccount({
      id: acc.id,
      full_name: acc.full_name,
      email: acc.email,
      role: acc.role,
      department: acc.department,
      status: acc.status
    });
    setEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAccount) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/authAdmin/accounts/${editingAccount.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${admin?.token || ""}`
        },
        body: JSON.stringify({
          full_name: editingAccount.full_name,
          email: editingAccount.email,
          role: editingAccount.role,
          department: editingAccount.department,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setEditModal(false);
        setMessage("✅ Account information successfully updated.");
        
        if (showInactive) {
          setInactiveAccounts(prevAccounts => 
            prevAccounts.map(acc => 
              acc.id === editingAccount.id ? { ...acc, ...editingAccount } : acc
            )
          );
        } else {
          setAccounts(prevAccounts => 
            prevAccounts.map(acc => 
              acc.id === editingAccount.id ? { ...acc, ...editingAccount } : acc
            )
          );
        }
        
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(`❌ ${data.message || "Unable to update account. Please try again."}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ System error occurred. Please contact IT support.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (accountId, accountEmail) => {
    if (window.confirm("Confirm password reset? The user will receive email instructions to create a new password.")) {
      try {
        // Send password reset email via Firebase
        await sendPasswordResetEmail(firebaseAuth, accountEmail, {
          url: `https://ezleave-admin.vercel.app/login`,
          handleCodeInApp: false,
        });
        
        setMessage("✅ Password reset email sent successfully via Firebase.");
        
        // Also call backend to update password hash if needed
        const res = await fetch(`${API_URL}/api/authAdmin/reset-password/${accountId}`, {
          method: "POST",
        });
        
        if (!res.ok) {
          console.warn("Backend password reset failed, but Firebase email was sent.");
        }
        
      } catch (firebaseError) {
        console.error("❌ Firebase error:", firebaseError.message);
        
        // Fallback to backend-only reset
        try {
          const res = await fetch(`${API_URL}/api/authAdmin/reset-password/${accountId}`, {
            method: "POST",
          });
          
          const data = await res.json();
          
          if (res.ok) {
            setMessage("✅ Password reset instructions have been sent.");
          } else {
            setMessage(`❌ ${data.message || "Password reset failed."}`);
          }
        } catch (err) {
          console.error(err);
          setMessage("❌ System error occurred. Please contact IT support.");
        }
      }
    }
  };

  const handleDeactivateAccount = async (accountId, accountName) => {
    if (window.confirm(`Are you sure you want to deactivate ${accountName}? They will no longer be able to access the system.`)) {
      try {
        const res = await fetch(`${API_URL}/api/authAdmin/accounts/${accountId}/deactivate`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${admin?.token || ""}`
          },
        });
        
        const data = await res.json();
        
        if (res.ok) {
          setMessage("✅ Account successfully deactivated.");
          fetchAccounts();
          
          setTimeout(() => setMessage(""), 5000);
        } else {
          setMessage(`❌ ${data.message || "Unable to deactivate account."}`);
        }
      } catch (err) {
        console.error(err);
        setMessage("❌ System error occurred. Please contact IT support.");
      }
    }
  };

  const handleRestoreAccount = async (accountId, accountName) => {
    if (window.confirm(`Are you sure you want to restore ${accountName}? They will regain access to the system.`)) {
      try {
        const res = await fetch(`${API_URL}/api/authAdmin/accounts/${accountId}/restore`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${admin?.token || ""}`
          },
        });
        
        const data = await res.json();
        
        if (res.ok) {
          setMessage("✅ Account successfully restored.");
          fetchAccounts();
          
          setTimeout(() => setMessage(""), 5000);
        } else {
          setMessage(`❌ ${data.message || "Unable to restore account."}`);
        }
      } catch (err) {
        console.error(err);
        setMessage("❌ System error occurred. Please contact IT support.");
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
  };

  const getStatusBadgeStyle = (status) => {
    if (status === "active") {
      return {
        backgroundColor: "rgba(46, 204, 113, 0.1)",
        color: "#27ae60",
        border: "1px solid rgba(46, 204, 113, 0.2)"
      };
    } else {
      return {
        backgroundColor: "rgba(231, 76, 60, 0.1)",
        color: "#c0392b",
        border: "1px solid rgba(231, 76, 60, 0.2)"
      };
    }
  };

  const activeAccountsCount = accounts.filter(acc => acc.status === "active").length;
  const inactiveAccountsCount = inactiveAccounts.filter(acc => acc.status === "inactive").length;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert("Password copied to clipboard!");
      })
      .catch(err => {
        console.error("Failed to copy: ", err);
      });
  };

  const exportAccounts = () => {
    const dataToExport = showInactive ? inactiveAccounts : accounts;
    const csvContent = [
      ["ID", "Full Name", "Email", "Role", "Department", "Status", "Created At", "Last Login"],
      ...dataToExport.map(acc => [
        acc.id,
        acc.full_name,
        acc.email,
        acc.role,
        acc.department,
        acc.status,
        acc.created_at,
        acc.last_login
      ])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${showInactive ? 'inactive' : 'active'}_users_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-container" style={styles.dashboardContainer}>
      {/* Mobile Header */}
      <div className="mobile-header">
        <button 
          className="hamburger"
          onClick={() => setIsSidebarOpen(true)}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <img src={require("./images/logo_ez.png")} alt="logo" className="mobile-logo" />
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

      {/* Desktop Header */}
      <div className="desktop-header attendance-desktop-header" style={styles.header}>
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

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={styles.sidebar}>
        {/* Mobile Sidebar Header */}
        <div className="sidebar-header">
          <button 
            className="sidebar-close-btn"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <img 
            className='logo-sidebar' 
            src={require("./images/logo_ez.png")} 
            alt="logo" 
          />
        </div>

        {/* Desktop Logo */}
        <img 
          src={require("./images/logo_ez.png")} 
          alt="logo" 
          style={styles.logo} 
          className='logo-desktop'
        />
        
        <ul className='sidebar-menu-link' style={styles.sidebarList}>
          <li>
            <Link 
              style={styles.sb} 
              to="/dashboard"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FontAwesomeIcon icon={faTachometerAlt} style={styles.icon} /> Dashboard
            </Link>
          </li>
          <li>
            <Link 
              style={styles.sb} 
              to="/employee"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FontAwesomeIcon icon={faUsers} style={styles.icon} /> Employees
            </Link>
          </li>
          <li>
            <Link 
              style={styles.sb} 
              to="/attendance"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FontAwesomeIcon icon={faCalendarCheck} style={styles.icon} /> Attendance
            </Link>
          </li>
          <li>
            <Link 
              style={styles.sb} 
              to="/leaveManagement"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FontAwesomeIcon icon={faCalendarAlt} style={styles.icon} /> Leave Management
            </Link>
          </li>
          <li>
            <Link 
              style={styles.sb} 
              to="/announcement"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FontAwesomeIcon icon={faBullhorn} style={styles.icon} /> Announcement
            </Link>
          </li>
          <li>
            <Link 
              style={styles.sb} 
              to="/audit_logs"
              onClick={() => setIsSidebarOpen(false)}
            >
              <FontAwesomeIcon icon={faClipboardList} style={styles.icon} /> Audit Logs
            </Link>
          </li>
          <li style={styles.btnActive}>
            <Link style={styles.sb} to="#">
              <FontAwesomeIcon icon={faUserCog} style={styles.icon} /> User Management
            </Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content" style={styles.mainContent}>
        {/* Header Section */}
        <div className="page-header" style={styles.pageHeader}>
          <div>
            <h2 className="page-title" style={styles.pageTitle}>User Account Management</h2>
            <p className="page-subtitle" style={styles.pageSubtitle}>
              Manage system access for municipal administrators and department heads
            </p>
          </div>
          <div style={styles.headerActions}>
            <button 
              className="export-btn"
              style={styles.exportBtn}
              onClick={exportAccounts}
              title="Export to CSV"
            >
              <FontAwesomeIcon icon={faFileExport} style={styles.btnIcon} />
              Export
            </button>
            <button className="add-btn" style={styles.addBtn} onClick={() => setShowModal(true)}>
              <FontAwesomeIcon icon={faPlus} style={styles.btnIcon} />
              Add New User
            </button>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="stats-container" style={styles.statsContainer}>
          <div className="stat-card" style={styles.statCard}>
            <div className="stat-icon-container mayor" style={styles.statIconContainer}>
              <FontAwesomeIcon icon={faUserShield} style={styles.statIcon} />
            </div>
            <div className="stat-content" style={styles.statContent}>
              <h3 className="stat-number" style={styles.statNumber}>
                {accounts.filter(a => a.role === "mayor" && a.status === "active").length}
              </h3>
              <p className="stat-label" style={styles.statLabel}>Municipal Mayor</p>
            </div>
          </div>
          
          <div className="stat-card" style={styles.statCard}>
            <div className="stat-icon-container office-head" style={styles.statIconContainer}>
              <FontAwesomeIcon icon={faBuilding} style={styles.statIcon} />
            </div>
            <div className="stat-content" style={styles.statContent}>
              <h3 className="stat-number" style={styles.statNumber}>
                {accounts.filter(a => a.role === "office_head" && a.status === "active").length}
              </h3>
              <p className="stat-label" style={styles.statLabel}>Department Heads</p>
            </div>
          </div>
          
          <div className="stat-card" style={styles.statCard}>
            <div className="stat-icon-container total" style={styles.statIconContainer}>
              <FontAwesomeIcon icon={faUsers} style={styles.statIcon} />
            </div>
            <div className="stat-content" style={styles.statContent}>
              <h3 className="stat-number" style={styles.statNumber}>{activeAccountsCount}</h3>
              <p className="stat-label" style={styles.statLabel}>Active Users</p>
            </div>
          </div>
          
          <div className="stat-card" style={styles.statCard}>
            <div className="stat-icon-container active" style={styles.statIconContainer}>
              <FontAwesomeIcon icon={faArchive} style={styles.statIcon} />
            </div>
            <div className="stat-content" style={styles.statContent}>
              <h3 className="stat-number" style={styles.statNumber}>{inactiveAccountsCount}</h3>
              <p className="stat-label" style={styles.statLabel}>Inactive Accounts</p>
            </div>
          </div>
        </div>

        {/* System Notification */}
        {message && (
          <div className={message.includes("✅") ? "success-message" : "error-message"} style={message.includes("✅") ? styles.successMessage : styles.errorMessage}>
            <FontAwesomeIcon icon={message.includes("✅") ? faCheckCircle : faTimesCircle} style={styles.messageIcon} />
            {message}
          </div>
        )}

        {/* View Toggle */}
        <div className="view-toggle" style={styles.viewToggle}>
          <button 
            className={`toggle-btn ${!showInactive ? 'active' : ''}`}
            style={!showInactive ? styles.activeToggleBtn : styles.toggleBtn}
            onClick={() => setShowInactive(false)}
          >
            <FontAwesomeIcon icon={faUsers} /> Active Users ({activeAccountsCount})
          </button>
          <button 
            className={`toggle-btn ${showInactive ? 'active' : ''}`}
            style={showInactive ? styles.activeToggleBtn : styles.toggleBtn}
            onClick={() => setShowInactive(true)}
          >
            <FontAwesomeIcon icon={faArchive} /> Inactive Users ({inactiveAccountsCount})
          </button>
        </div>

        {/* Search and Filter Controls */}
        <div className="filter-bar" style={styles.filterBar}>
          <div className="search-box" style={styles.searchBox}>
            <FontAwesomeIcon icon={faSearch} style={styles.searchIcon} />
            <input
              type="text"
              placeholder={showInactive ? "Find inactive users..." : "Find users by name, email, or department..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              style={styles.searchInput}
            />
          </div>
          
          <div className="filter-controls" style={styles.filterControls}>
            <div className="filter-group" style={styles.filterGroup}>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="filter-select"
                style={styles.filterSelect}
              >
                <option value="all">All Access Levels</option>
                <option value="mayor">Executive Administration</option>
                <option value="office_head">Department Leadership</option>
              </select>
            </div>
            <button
              className="clear-filter-btn"
              style={styles.clearFilterBtn}
              onClick={clearFilters}
              disabled={!searchTerm && roleFilter === "all"}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* User Accounts Directory */}
        <div className="table-container" style={styles.tableContainer}>
          <div className="table-header" style={styles.tableHeader}>
            <h3 className="table-title" style={styles.tableTitle}>
              {showInactive ? "Inactive User Accounts" : "Active User Accounts"}
            </h3>
            <div className="table-summary" style={styles.tableSummary}>
              Showing {filteredAccounts.length} of {showInactive ? inactiveAccountsCount : activeAccountsCount} accounts
            </div>
          </div>
          
          <div className="table-wrapper" style={styles.tableWrapper}>
            <table className="table" style={styles.table}>
              <thead>
                <tr>
                  <th className="th" style={styles.th}>USER PROFILE</th>
                  <th className="th" style={styles.th}>ACCESS LEVEL</th>
                  <th className="th" style={styles.th}>DEPARTMENT</th>
                  <th className="th" style={styles.th}>EMAIL ADDRESS</th>
                  <th className="th" style={styles.th}>STATUS</th>
                  <th className="th" style={styles.th}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="table-row" style={styles.tableRow}>
                      <td className="td" style={styles.td}>
                        <div className="user-cell" style={styles.userCell}>
                          <div className="user-avatar" style={{
                            ...styles.userAvatar,
                            backgroundColor: acc.status === "inactive" ? "#95a5a6" : "#009205",
                            opacity: acc.status === "inactive" ? 0.7 : 1
                          }}>
                            {acc.full_name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div className="user-info" style={styles.userInfo}>
                            <div className="user-name" style={styles.userName}>{acc.full_name}</div>
                            <div className="user-id" style={styles.userId}>ID: {acc.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="td" style={styles.td}>
                        <span style={{
                          ...styles.roleBadge,
                          ...(acc.role === "mayor" ? styles.roleMayor : styles.roleOfficeHead),
                          opacity: acc.status === "inactive" ? 0.7 : 1
                        }}>
                          {acc.role === "mayor" ? "Municipal Mayor" : "Department Head"}
                        </span>
                      </td>
                      <td className="td" style={styles.td}>
                        <div className="dept-cell" style={styles.deptCell}>
                          <span className="dept-text" style={styles.deptText}>{acc.department}</span>
                        </div>
                      </td>
                      <td className="td" style={styles.td}>
                        <div className="email-cell" style={styles.emailCell}>
                          <span className="email-text" style={styles.emailText}>{acc.email}</span>
                        </div>
                      </td>
                      <td className="td" style={styles.td}>
                        <span className="status-badge" style={{
                          ...styles.statusBadge,
                          ...getStatusBadgeStyle(acc.status)
                        }}>
                          {acc.status === "active" ? (
                            <>
                              <FontAwesomeIcon icon={faCheckCircle} style={styles.statusIcon} />
                              Active
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faTimesCircle} style={styles.statusIcon} />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="td" style={styles.td}>
                        <div className="action-buttons" style={styles.actionButtons}>
                          <button 
                            className="view-btn"
                            style={styles.viewBtn}
                            onClick={() => handleViewAccount(acc)}
                            title="View User Details"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          {!showInactive ? (
                            <>
                              <button 
                                className="reset-btn"
                                style={styles.resetBtn}
                                onClick={() => handleResetPassword(acc.id, acc.email)}
                                title="Reset Password"
                              >
                                <FontAwesomeIcon icon={faKey} />
                              </button>
                              <button 
                                className="edit-btn"
                                style={{
                                  ...styles.editBtn,
                                  ...(acc.status === "inactive" ? styles.disabledBtn : {}),
                                  cursor: acc.status === "inactive" ? "not-allowed" : "pointer",
                                  opacity: acc.status === "inactive" ? 0.5 : 1
                                }}
                                onClick={() => acc.status !== "inactive" && handleEditAccount(acc)}
                                title={acc.status === "inactive" ? "Inactive accounts cannot be edited" : "Edit User Information"}
                                disabled={acc.status === "inactive"}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button 
                                className="deactivate-btn"
                                style={styles.deactivateBtn}
                                onClick={() => handleDeactivateAccount(acc.id, acc.full_name)}
                                title="Deactivate Account"
                              >
                                <FontAwesomeIcon icon={faUserSlash} />
                              </button>
                            </>
                          ) : (
                            <button 
                              className="restore-btn"
                              style={styles.restoreBtn}
                              onClick={() => handleRestoreAccount(acc.id, acc.full_name)}
                              title="Restore Account"
                            >
                              <FontAwesomeIcon icon={faRedo} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-data" style={styles.noData}>
                      <div className="empty-state" style={styles.emptyState}>
                        <FontAwesomeIcon icon={showInactive ? faArchive : faUsers} style={styles.emptyIcon} />
                        <p className="empty-text" style={styles.emptyText}>
                          {showInactive 
                            ? "No inactive accounts found" 
                            : "No user accounts match your criteria"}
                        </p>
                        {searchTerm || roleFilter !== "all" ? (
                          <p className="empty-subtext" style={styles.emptySubtext}>
                            Adjust your search parameters or reset filters
                          </p>
                        ) : showInactive ? (
                          <p className="empty-subtext" style={styles.emptySubtext}>
                            All user accounts are currently active
                          </p>
                        ) : (
                          <button 
                            className="create-first-btn"
                            style={styles.createFirstBtn}
                            onClick={() => setShowModal(true)}
                          >
                            Create Initial User Account
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create New Account Modal */}
        {showModal && (
          <div style={styles.modalOverlay}>
            <div className="modal" style={styles.modal}>
              <div className="modal-header" style={styles.modalHeader}>
                <h3 className="modal-title" style={styles.modalTitle}>Register New System User</h3>
                <button 
                  className="close-btn"
                  style={styles.closeBtn}
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body" style={styles.modalBody}>
                <div className="form-group" style={styles.formGroup}>
                  <label className="form-label" style={styles.formLabel}>
                    <FontAwesomeIcon icon={faUsers} style={styles.labelIcon} />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newAccount.full_name}
                    onChange={(e) => setNewAccount({ ...newAccount, full_name: e.target.value })}
                    className="form-input"
                    style={styles.formInput}
                    placeholder="Enter employee's full name"
                  />
                </div>
                
                <div className="form-group" style={styles.formGroup}>
                  <label className="form-label" style={styles.formLabel}>
                    <FontAwesomeIcon icon={faEnvelope} style={styles.labelIcon} />
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    value={newAccount.email}
                    onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                    className="form-input"
                    style={styles.formInput}
                    placeholder="Enter municipal email address"
                  />
                </div>
                
                <div className="form-group" style={styles.formGroup}>
                  <label className="form-label" style={styles.formLabel}>
                    <FontAwesomeIcon icon={faUserShield} style={styles.labelIcon} />
                    System Access Level
                  </label>
                  <select
                    value={newAccount.role}
                    onChange={(e) => {
                      const role = e.target.value;
                      setNewAccount({
                        ...newAccount,
                        role,
                        department: role === "mayor" ? "Office of the Municipal Mayor" : "",
                      });
                    }}
                    className="form-select"
                    style={styles.formSelect}
                  >
                    <option value="">Select Access Privilege</option>
                    <option value="mayor">Municipal Mayor</option>
                    <option value="office_head">Department Head</option>
                  </select>
                </div>

                {newAccount.role !== "mayor" && newAccount.role !== "" && (
                  <div className="form-group" style={styles.formGroup}>
                    <label className="form-label" style={styles.formLabel}>
                      <FontAwesomeIcon icon={faBuilding} style={styles.labelIcon} />
                      Assigned Department
                    </label>
                    <select
                      value={newAccount.department}
                      onChange={(e) =>
                        setNewAccount({ ...newAccount, department: e.target.value })
                      }
                      className="form-select"
                      style={styles.formSelect}
                    >
                      <option value="">Select Municipal Department</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="modal-info" style={styles.modalInfo}>
                  <FontAwesomeIcon icon={faInfoCircle} style={styles.infoIcon} />
                  <div>
                    <p className="info-text" style={styles.infoText}>
                      <strong>Firebase Authentication:</strong> User will be created in Firebase authentication system.
                    </p>
                    <p className="info-text" style={styles.infoText}>
                      <strong>Email Notification:</strong> Password setup instructions will be sent via Firebase email service.
                    </p>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={styles.modalFooter}>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="modal-cancel-btn"
                  style={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateAccount} 
                  className="modal-save-btn"
                  style={styles.modalSaveBtn}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={styles.spinner}></div>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} style={styles.saveIcon} />
                      Create User Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Display Modal */}
        {showPasswordModal && (
          <div style={styles.modalOverlay}>
            <div className="modal" style={styles.modal}>
              <div className="modal-header" style={styles.modalHeader}>
                <h3 className="modal-title" style={styles.modalTitle}>Temporary Password</h3>
                <button 
                  className="close-btn"
                  style={styles.closeBtn}
                  onClick={() => setShowPasswordModal(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body" style={styles.modalBody}>
                <div className="password-warning" style={styles.passwordWarning}>
                  <FontAwesomeIcon icon={faInfoCircle} style={styles.warningIcon} />
                  <p className="warning-text" style={styles.warningText}>
                    <strong>Important:</strong> Firebase email service is not available. Please share this temporary password with the user.
                  </p>
                </div>
                
                <div className="form-group" style={styles.formGroup}>
                  <label className="form-label" style={styles.formLabel}>
                    Temporary Password
                  </label>
                  <div className="password-display" style={styles.passwordDisplay}>
                    <code style={styles.passwordCode}>{temporaryPassword}</code>
                    <button 
                      className="copy-btn"
                      style={styles.copyBtn}
                      onClick={() => copyToClipboard(temporaryPassword)}
                    >
                      Copy
                    </button>
                  </div>
                </div>
                
                <div className="instructions" style={styles.instructions}>
                  <h4 style={styles.instructionsTitle}>Instructions for User:</h4>
                  <ol style={styles.instructionsList}>
                    <li>Share this password securely with the user</li>
                    <li>User should login with this password at the login page</li>
                    <li>After first login, user should change their password immediately</li>
                    <li>This password provides initial access only</li>
                  </ol>
                </div>
              </div>

              <div className="modal-footer" style={styles.modalFooter}>
                <button 
                  onClick={() => setShowPasswordModal(false)} 
                  className="modal-ok-btn"
                  style={styles.modalOkBtn}
                >
                  I've Saved the Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Account Details Modal */}
        {viewModal && selectedAccount && (
          <div style={styles.modalOverlay}>
            <div className="modal" style={styles.modal}>
              <div className="modal-header" style={styles.modalHeader}>
                <h3 className="modal-title" style={styles.modalTitle}>
                  {selectedAccount.status === "inactive" ? "Inactive " : ""}User Account Details
                </h3>
                <button 
                  className="close-btn"
                  style={styles.closeBtn}
                  onClick={() => setViewModal(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body" style={styles.modalBody}>
                <div className="user-preview" style={styles.userPreview}>
                  <div className="preview-avatar" style={{
                    ...styles.previewAvatar,
                    backgroundColor: selectedAccount.status === "inactive" ? "#95a5a6" : "#009205"
                  }}>
                    {selectedAccount.full_name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="preview-info" style={styles.previewInfo}>
                    <h4 className="preview-name" style={styles.previewName}>{selectedAccount.full_name}</h4>
                    <p className="preview-email" style={styles.previewEmail}>{selectedAccount.email}</p>
                    <span className="preview-status" style={{
                      ...styles.statusBadge,
                      ...getStatusBadgeStyle(selectedAccount.status)
                    }}>
                      {selectedAccount.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                
                <div className="form-group" style={styles.formGroup}>
                  <label className="form-label" style={styles.formLabel}>Full Name</label>
                  <div className="read-only-field" style={styles.readOnlyField}>
                    {selectedAccount.full_name}
                  </div>
                </div>
                
                <div className="form-group" style={styles.formGroup}>
                  <label className="form-label" style={styles.formLabel}>Email Address</label>
                  <div className="read-only-field" style={styles.readOnlyField}>
                    {selectedAccount.email}
                  </div>
                </div>
                
                <div className="form-group" style={styles.formGroup}>
                  <label className="form-label" style={styles.formLabel}>Access Level</label>
                  <div className="read-only-field" style={styles.readOnlyField}>
                    {selectedAccount.role === "mayor" ? "Municipal Mayor" : "Department Head"}
                  </div>
                </div>
                
                <div className="form-group" style={styles.formGroup}>
                  <label className="form-label" style={styles.formLabel}>Department Assignment</label>
                  <div className="read-only-field" style={styles.readOnlyField}>
                    {selectedAccount.department}
                  </div>
                </div>

                <div className="form-group" style={styles.formGroup}>
                  <label className="form-label" style={styles.formLabel}>Account Created</label>
                  <div className="read-only-field" style={styles.readOnlyField}>
                    {new Date(selectedAccount.created_at).toLocaleDateString()}
                  </div>
                </div>

                {selectedAccount.last_login && (
                  <div className="form-group" style={styles.formGroup}>
                    <label className="form-label" style={styles.formLabel}>Last Login</label>
                    <div className="read-only-field" style={styles.readOnlyField}>
                      {new Date(selectedAccount.last_login).toLocaleString()}
                    </div>
                  </div>
                )}

                {selectedAccount.status === "inactive" && selectedAccount.deactivated_at && (
                  <div className="form-group" style={styles.formGroup}>
                    <label className="form-label" style={styles.formLabel}>Deactivated On</label>
                    <div className="read-only-field" style={styles.readOnlyField}>
                      {new Date(selectedAccount.deactivated_at).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {selectedAccount.status === "inactive" ? (
                  <div className="modal-warning" style={styles.modalWarning}>
                    <FontAwesomeIcon icon={faInfoCircle} style={styles.warningIcon} />
                    <p className="warning-text" style={styles.warningText}>
                      This account is currently inactive. You can restore it to grant system access.
                    </p>
                    <button 
                      className="restore-account-btn"
                      style={styles.restoreAccountBtn}
                      onClick={() => {
                        setViewModal(false);
                        handleRestoreAccount(selectedAccount.id, selectedAccount.full_name);
                      }}
                    >
                      <FontAwesomeIcon icon={faRedo} /> Restore Account
                    </button>
                  </div>
                ) : (
                  <div className="modal-info" style={styles.modalInfo}>
                    <FontAwesomeIcon icon={faInfoCircle} style={styles.infoIcon} />
                    <p className="info-text" style={styles.infoText}>
                      This is a read-only view of user details. To edit user information, use the Edit button in the table.
                    </p>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={styles.modalFooter}>
                <button 
                  onClick={() => setViewModal(false)} 
                  className="modal-cancel-btn"
                  style={styles.modalCancelBtn}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Account Details Modal */}
        {editModal && editingAccount && (
          <div style={styles.modalOverlay}>
            <div className="modal" style={styles.modal}>
              <div className="modal-header" style={styles.modalHeader}>
                <h3 className="modal-title" style={styles.modalTitle}>
                  Edit User Account
                </h3>
                <button 
                  className="close-btn"
                  style={styles.closeBtn}
                  onClick={() => setEditModal(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body" style={styles.modalBody}>
                <div className="user-preview" style={styles.userPreview}>
                  <div className="preview-avatar" style={{
                    ...styles.previewAvatar,
                    backgroundColor: "#009205"
                  }}>
                    {editingAccount.full_name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="preview-info" style={styles.previewInfo}>
                    <h4 className="preview-name" style={styles.previewName}>{editingAccount.full_name}</h4>
                    <p className="preview-email" style={styles.previewEmail}>{editingAccount.email}</p>
                    <span className="preview-status" style={{
                      ...styles.statusBadge,
                      ...getStatusBadgeStyle(editingAccount.status)
                    }}>
                      {editingAccount.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                
                <div className="form-group" style={styles.formGroup}>
                  <label className="form-label" style={styles.formLabel}>Full Name</label>
                  <input
                    type="text"
                    value={editingAccount.full_name}
                    onChange={(e) => setEditingAccount({ ...editingAccount, full_name: e.target.value })}
                    className="form-input"
                    style={styles.formInput}
                    placeholder="Enter full name"
                  />
                </div>
                
                <div className="form-group" style={styles.formGroup}>
                  <label className="form-label" style={styles.formLabel}>Email Address</label>
                  <input
                    type="email"
                    value={editingAccount.email}
                    onChange={(e) => setEditingAccount({ ...editingAccount, email: e.target.value })}
                    className="form-input"
                    style={styles.formInput}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div className="form-group" style={styles.formGroup}>
                  <label className="form-label" style={styles.formLabel}>Access Level</label>
                  <div className="read-only-field" style={styles.readOnlyField}>
                    {editingAccount.role === "mayor" ? "Municipal Mayor" : "Department Head"}
                  </div>
                </div>
                
                <div className="form-group" style={styles.formGroup}>
                  <label className="form-label" style={styles.formLabel}>Department Assignment</label>
                  <div className="read-only-field" style={styles.readOnlyField}>
                    {editingAccount.department}
                  </div>
                </div>

                <div className="modal-info" style={styles.modalInfo}>
                  <FontAwesomeIcon icon={faInfoCircle} style={styles.infoIcon} />
                  <p className="info-text" style={styles.infoText}>
                    You can edit the user's name and email address. Access level and department cannot be changed.
                  </p>
                </div>
              </div>

              <div className="modal-footer" style={styles.modalFooter}>
                <button 
                  onClick={() => setEditModal(false)} 
                  className="modal-cancel-btn"
                  style={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEdit} 
                  className="modal-save-btn"
                  style={styles.modalSaveBtn}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={styles.spinner}></div>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} style={styles.saveIcon} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ----- Enhanced Styles -----
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
    width: "100px", 
    height: "auto", 
    display: "block", 
    margin: "20px auto" 
  },
  sidebarList: { 
    listStyleType: "none", 
    padding: "0", 
    margin: "0" 
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
    color: "#fff",
    width: "20px"
  },
  search: { 
    padding: "10px 15px", 
    width: "300px", 
    borderRadius: "8px", 
    border: "1px solid #ddd", 
    marginRight: "20px",
    fontSize: "14px",
    transition: "all 0.3s ease",
    ":focus": {
      outline: "none",
      borderColor: "#009205",
      boxShadow: "0 0 0 3px rgba(0, 146, 5, 0.1)"
    }
  },
  iconBell: { 
    color: "#fff", 
    fontSize: "22px", 
    cursor: "pointer",
    transition: "transform 0.3s ease",
    ":hover": {
      transform: "scale(1.1)"
    }
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
  btnActive: {
    backgroundColor: '#A8FC0080',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  },
  mainContent: { 
    marginLeft: '300px',
    backgroundColor: '#F8F8F8',
    marginTop: '80px', 
    overflow: 'hidden',
    marginRight: '20px'
  },
  
  // Page Header
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    paddingBottom: "20px",
    borderBottom: "1px solid #eaeaea"
  },
  pageTitle: {
    fontSize: "32px",
    fontWeight: "700",
    margin: "0 0 5px 0",
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#7f8c8d",
    margin: "0"
  },
  headerActions: {
    display: "flex",
    gap: "15px",
    alignItems: "center"
  },
  addBtn: {
    backgroundColor: "#009205",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.3s ease",
  },
  exportBtn: {
    backgroundColor: "#3498db",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.3s ease",
  },
  btnIcon: {
    fontSize: "16px"
  },

  // View Toggle
  viewToggle: {
    display: "flex",
    gap: "10px",
    marginBottom: "25px",
    backgroundColor: "#fff",
    padding: "8px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)"
  },
  toggleBtn: {
    flex: 1,
    padding: "12px 20px",
    backgroundColor: "transparent",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    color: "#7f8c8d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.3s ease"
  },
  activeToggleBtn: {
    flex: 1,
    padding: "12px 20px",
    backgroundColor: "#009205",
    border: "2px solid #009205",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(0, 146, 5, 0.2)"
  },

  // Statistics Cards
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "30px"
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    transition: "all 0.3s ease",
    border: "1px solid #f0f0f0",
    ":hover": {
      transform: "translateY(-5px)",
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)"
    }
  },
  statIconContainer: {
    width: "60px",
    height: "60px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&.mayor": {
      backgroundColor: "rgba(41, 128, 185, 0.1)",
      color: "#2980b9"
    },
    "&.office-head": {
      backgroundColor: "rgba(155, 89, 182, 0.1)",
      color: "#9b59b6"
    },
    "&.total": {
      backgroundColor: "rgba(52, 152, 219, 0.1)",
      color: "#3498db"
    },
    "&.active": {
      backgroundColor: "rgba(46, 204, 113, 0.1)",
      color: "#2ecc71"
    }
  },
  statIcon: {
    fontSize: "24px"
  },
  statContent: {
    flex: 1
  },
  statNumber: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 5px 0",
    lineHeight: "1"
  },
  statLabel: {
    fontSize: "14px",
    color: "#7f8c8d",
    margin: "0",
    fontWeight: "500"
  },

  // System Messages
  successMessage: {
    backgroundColor: "#d4edda",
    color: "#155724",
    padding: "15px 20px",
    borderRadius: "8px",
    marginBottom: "25px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "1px solid #c3e6cb",
    animation: "fadeIn 0.5s ease"
  },
  errorMessage: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    padding: "15px 20px",
    borderRadius: "8px",
    marginBottom: "25px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "1px solid #f5c6cb"
  },
  messageIcon: {
    fontSize: "18px"
  },

  // Filter and Search Bar
  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    gap: "20px",
    flexWrap: "wrap"
  },
  searchBox: {
    flex: "1",
    minWidth: "300px",
    position: "relative"
  },
  searchIcon: {
    position: "absolute",
    left: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#95a5a6",
    fontSize: "16px"
  },
  searchInput: {
    width: "100%",
    padding: "12px 20px 12px 45px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "15px",
    transition: "all 0.3s ease",
    backgroundColor: "#fff",
    ":focus": {
      outline: "none",
      borderColor: "#009205",
      boxShadow: "0 0 0 3px rgba(0, 146, 5, 0.1)"
    }
  },
  filterControls: {
    display: "flex",
    alignItems: "center",
    gap: "15px"
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  filterIcon: {
    color: "#7f8c8d",
    fontSize: "16px"
  },
  filterSelect: {
    padding: "12px 15px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "15px",
    backgroundColor: "#fff",
    minWidth: "150px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    ":focus": {
      outline: "none",
      borderColor: "#009205"
    }
  },
  clearFilterBtn: {
    padding: "12px 20px",
    backgroundColor: "#95a5a6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    ":hover:not(:disabled)": {
      backgroundColor: "#7f8c8d"
    },
    ":disabled": {
      opacity: "0.5",
      cursor: "not-allowed"
    }
  },

  // Table Container
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    border: "1px solid #f0f0f0",
    marginTop: "20px"
  },
  tableHeader: {
    padding: "20px 25px",
    borderBottom: "1px solid #eee",
    backgroundColor: "#fafafa",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  tableTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#2c3e50",
    margin: "0"
  },
  tableSummary: {
    fontSize: "14px",
    color: "#7f8c8d"
  },
  tableWrapper: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px"
  },
  th: {
    padding: "18px 25px",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: "600",
    color: "#7f8c8d",
    borderBottom: "2px solid #eee",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    backgroundColor: "#fafafa"
  },
  tableRow: {
    transition: "all 0.3s ease",
    borderBottom: "1px solid #f5f5f5",
    ":hover": {
      backgroundColor: "#f9f9f9"
    }
  },
  td: {
    padding: "20px 25px",
    verticalAlign: "middle"
  },

  // User Profile Cell
  userCell: {
    display: "flex",
    alignItems: "center",
    gap: "15px"
  },
  userAvatar: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "600"
  },
  userInfo: {
    display: "flex",
    flexDirection: "column"
  },
  userName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: "3px"
  },
  userId: {
    fontSize: "13px",
    color: "#95a5a6"
  },

  // Access Level Badge
  roleBadge: {
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  roleMayor: {
    backgroundColor: "rgba(41, 128, 185, 0.1)",
    color: "#2980b9",
    border: "1px solid rgba(41, 128, 185, 0.2)"
  },
  roleOfficeHead: {
    backgroundColor: "rgba(155, 89, 182, 0.1)",
    color: "#9b59b6",
    border: "1px solid rgba(155, 89, 182, 0.2)"
  },

  // Department Cell
  deptCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  deptIcon: {
    color: "#95a5a6",
    fontSize: "14px"
  },
  deptText: {
    fontSize: "14px",
    color: "#34495e"
  },

  // Email Contact Cell
  emailCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  emailIcon: {
    color: "#95a5a6",
    fontSize: "14px"
  },
  emailText: {
    fontSize: "14px",
    color: "#34495e"
  },

  // Status Indicator
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600"
  },
  statusIcon: {
    fontSize: "12px"
  },

  // Action Controls
  actionButtons: {
    display: "flex",
    gap: "8px"
  },
  viewBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    backgroundColor: "transparent",
    color: "#7f8c8d",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    fontSize: "14px",
    ":hover": {
      backgroundColor: "#f8f9fa",
      borderColor: "#009205",
      color: "#009205"
    }
  },
  resetBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    backgroundColor: "transparent",
    color: "#7f8c8d",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    fontSize: "14px",
    ":hover": {
      backgroundColor: "#e3f2fd",
      borderColor: "#2196F3",
      color: "#2196F3"
    }
  },
  editBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    backgroundColor: "transparent",
    color: "#7f8c8d",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    fontSize: "14px",
    ":hover": {
      backgroundColor: "#e8f5e9",
      borderColor: "#4CAF50",
      color: "#4CAF50"
    }
  },
  deactivateBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    backgroundColor: "transparent",
    color: "#7f8c8d",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    fontSize: "14px",
    ":hover": {
      backgroundColor: "#fdedec",
      borderColor: "#e74c3c",
      color: "#e74c3c"
    }
  },
  restoreBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    backgroundColor: "transparent",
    color: "#7f8c8d",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    fontSize: "14px",
    ":hover": {
      backgroundColor: "#e8f5e9",
      borderColor: "#2ecc71",
      color: "#27ae60"
    }
  },
  disabledBtn: {
    backgroundColor: "#f5f5f5",
    borderColor: "#ddd",
    color: "#bdc3c7",
    cursor: "not-allowed",
    ":hover": {
      backgroundColor: "#f5f5f5",
      borderColor: "#ddd",
      color: "#bdc3c7"
    }
  },

  // Empty State Display
  noData: {
    padding: "60px 20px",
    textAlign: "center"
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px"
  },
  emptyIcon: {
    fontSize: "60px",
    color: "#ddd",
    marginBottom: "10px"
  },
  emptyText: {
    fontSize: "18px",
    color: "#95a5a6",
    margin: "0",
    fontWeight: "600"
  },
  emptySubtext: {
    fontSize: "14px",
    color: "#bdc3c7",
    margin: "0"
  },
  createFirstBtn: {
    marginTop: "15px",
    padding: "10px 20px",
    backgroundColor: "#009205",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    ":hover": {
      backgroundColor: "#007a04"
    }
  },

  // Modal Interface
  modalOverlay: {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    padding: "20px",
    backdropFilter: "blur(5px)"
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "500px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
    animation: "modalSlideIn 0.4s ease"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "25px 30px",
    borderBottom: "1px solid #eee"
  },
  modalTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0"
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "28px",
    color: "#95a5a6",
    cursor: "pointer",
    padding: "0",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    transition: "all 0.3s ease",
    ":hover": {
      backgroundColor: "#f5f5f5",
      color: "#e74c3c"
    }
  },
  modalBody: {
    padding: "30px",
    overflowY: "auto",
    flex: "1"
  },
  
  // Form Components
  formGroup: {
    marginBottom: "25px"
  },
  formLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: "8px"
  },
  labelIcon: {
    color: "#000000ff",
    fontSize: "14px"
  },
  formInput: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "8px",
    border: "2px solid #e0e0e0",
    fontSize: "15px",
    transition: "all 0.3s ease",
    backgroundColor: "#fff",
    ":focus": {
      outline: "none",
      borderColor: "#009205",
      boxShadow: "0 0 0 4px rgba(0, 146, 5, 0.1)"
    }
  },
  formSelect: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "8px",
    border: "2px solid #e0e0e0",
    fontSize: "15px",
    backgroundColor: "#fff",
    cursor: "pointer",
    transition: "all 0.3s ease",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23009205' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 16px center",
    backgroundSize: "16px",
    ":focus": {
      outline: "none",
      borderColor: "#009205",
      boxShadow: "0 0 0 4px rgba(0, 146, 5, 0.1)"
    }
  },
  readOnlyField: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "8px",
    border: "2px solid #f0f0f0",
    fontSize: "15px",
    backgroundColor: "#f9f9f9",
    color: "#7f8c8d"
  },

  // Password Display
  passwordWarning: {
    backgroundColor: "#fff3cd",
    padding: "15px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
    border: "1px solid #ffeaa7"
  },
  passwordDisplay: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#f8f9fa",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #e9ecef"
  },
  passwordCode: {
    flex: 1,
    fontFamily: "monospace",
    fontSize: "16px",
    color: "#212529"
  },
  copyBtn: {
    padding: "8px 16px",
    backgroundColor: "#6c757d",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    ":hover": {
      backgroundColor: "#5a6268"
    }
  },
  instructions: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#e8f4fd",
    borderRadius: "8px",
    border: "1px solid #b8daff"
  },
  instructionsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#004085",
    margin: "0 0 10px 0"
  },
  instructionsList: {
    margin: "0",
    paddingLeft: "20px",
    color: "#004085"
  },

  // Information Panel
  modalInfo: {
    backgroundColor: "#e8f5e9",
    padding: "15px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginTop: "20px",
    border: "1px solid #c8e6c9"
  },
  infoIcon: {
    color: "#2e7d32",
    fontSize: "16px",
    marginTop: "2px"
  },
  infoText: {
    fontSize: "14px",
    color: "#1b5e20",
    margin: "0 0 5px 0"
  },

  // Warning Panel for Inactive Accounts
  modalWarning: {
    backgroundColor: "#fff3cd",
    padding: "20px",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "20px",
    border: "1px solid #ffeaa7"
  },
  warningIcon: {
    color: "#856404",
    fontSize: "16px"
  },
  warningText: {
    fontSize: "14px",
    color: "#856404",
    margin: "0"
  },
  restoreAccountBtn: {
    padding: "10px 15px",
    backgroundColor: "#009205",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    ":hover": {
      backgroundColor: "#007a04",
      transform: "translateY(-2px)"
    }
  },

  // User Preview Section
  userPreview: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px",
    paddingBottom: "20px",
    borderBottom: "1px solid #eee"
  },
  previewAvatar: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "600"
  },
  previewInfo: {
    flex: "1"
  },
  previewName: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 5px 0"
  },
  previewEmail: {
    fontSize: "15px",
    color: "#7f8c8d",
    margin: "0 0 10px 0"
  },

  // Modal Footer
  modalFooter: {
    padding: "25px 30px",
    borderTop: "1px solid #eee",
    display: "flex",
    justifyContent: "flex-end",
    gap: "15px"
  },
  modalCancelBtn: {
    padding: "12px 24px",
    backgroundColor: "transparent",
    color: "#7f8c8d",
    border: "2px solid #ddd",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    ":hover": {
      backgroundColor: "#f5f5f5",
      borderColor: "#bbb"
    }
  },
  modalSaveBtn: {
    padding: "12px 24px",
    backgroundColor: "#009205",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.3s ease",
    ":hover:not(:disabled)": {
      backgroundColor: "#007a04",
      transform: "translateY(-2px)",
      boxShadow: "0 6px 15px rgba(0, 146, 5, 0.4)"
    },
    ":disabled": {
      opacity: "0.6",
      cursor: "not-allowed",
      transform: "none"
    }
  },
  modalOkBtn: {
    padding: "12px 24px",
    backgroundColor: "#009205",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    ":hover": {
      backgroundColor: "#007a04",
      transform: "translateY(-2px)"
    }
  },
  saveIcon: {
    fontSize: "16px"
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  }
};

// Animation Keyframes
const keyframes = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(-30px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = keyframes;
document.head.appendChild(styleSheet);

export default UserManagement;