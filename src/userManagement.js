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
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import ProfileDropdown from "./profileDropdown";
import './user-management-responsive.css'; 

function UserManagement() {
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [newAccount, setNewAccount] = useState({
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

   const [admin, setAdmin] = useState(JSON.parse(localStorage.getItem("admin")) || null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileData, setProfileData] = useState({
      full_name: "",
      email: "",
      role: "",
      profile_picture: "",
    });

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
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Filter accounts based on search and role filter
  useEffect(() => {
    let filtered = accounts;
    
    if (searchTerm) {
      filtered = filtered.filter(account =>
        account.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (roleFilter !== "all") {
      filtered = filtered.filter(account => account.role === roleFilter);
    }
    
    setFilteredAccounts(filtered);
  }, [accounts, searchTerm, roleFilter]);

  const handleCreateAccount = async () => {
    if (!newAccount.full_name || !newAccount.email || !newAccount.role || (newAccount.role !== "mayor" && !newAccount.department)) {
      alert("Please complete all required fields before submission.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/authAdmin/createAccount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAccount),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Account successfully created. Password setup instructions have been emailed to the user.");
        setNewAccount({ full_name: "", email: "", role: "", department: "" });
        setShowModal(false);
        fetchAccounts();
        
        // Clear message after 5 seconds
        setTimeout(() => setMessage(""), 5000);
      } else {
        setMessage(`❌ ${data.message || "Account creation failed. Please verify the information and try again."}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ System error occurred. Please contact IT support or try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditAccount = (acc) => {
    setSelectedAccount(acc);
    setEditModal(true);
  };

 const handleSaveEdit = async () => {
  if (!selectedAccount) return;
  
  setLoading(true);
  try {
    // Use the new endpoint
    const res = await fetch(`${API_URL}/api/authAdmin/accounts/${selectedAccount.id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        // Add authorization if needed
        "Authorization": `Bearer ${admin?.token || ""}`
      },
      body: JSON.stringify({
        full_name: selectedAccount.full_name,
        email: selectedAccount.email,
        role: selectedAccount.role,
        department: selectedAccount.department,
      }),
    });
    
    const data = await res.json();
    
    if (res.ok) {
      setEditModal(false);
      setMessage("✅ Account information successfully updated.");
      
      // Update the local state
      setAccounts(prevAccounts => 
        prevAccounts.map(acc => 
          acc.id === selectedAccount.id ? { ...acc, ...selectedAccount } : acc
        )
      );
      
      // Clear message after 5 seconds
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

  const handleResetPassword = async (accountId) => {
    if (window.confirm("Confirm password reset? The user will receive email instructions to create a new password.")) {
      try {
        const res = await fetch(`${API_URL}/api/authAdmin/reset-password/${accountId}`, {
          method: "POST",
        });
        
        if (res.ok) {
          setMessage("✅ Password reset instructions have been sent to the user's email.");
        } else {
          setMessage("❌ Password reset email could not be sent.");
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
          showProfileModal={showProfileModal}
          setShowProfileModal={setShowProfileModal}
          isMobile={true}
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
          showProfileModal={showProfileModal}
          setShowProfileModal={setShowProfileModal}
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
        </div>
        <button className="add-btn" style={styles.addBtn} onClick={() => setShowModal(true)}>
          <FontAwesomeIcon icon={faPlus} style={styles.btnIcon} />
          Add New User
        </button>
      </div>

      {/* Statistics Overview */}
      <div className="stats-container" style={styles.statsContainer}>
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-icon-container mayor" style={styles.statIconContainer}>
            <FontAwesomeIcon icon={faUserShield} style={styles.statIcon} />
          </div>
          <div className="stat-content" style={styles.statContent}>
            <h3 className="stat-number" style={styles.statNumber}>
              {accounts.filter(a => a.role === "mayor").length}
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
              {accounts.filter(a => a.role === "office_head").length}
            </h3>
            <p className="stat-label" style={styles.statLabel}>Department Heads</p>
          </div>
        </div>
        
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-icon-container total" style={styles.statIconContainer}>
            <FontAwesomeIcon icon={faUsers} style={styles.statIcon} />
          </div>
          <div className="stat-content" style={styles.statContent}>
            <h3 className="stat-number" style={styles.statNumber}>{accounts.length}</h3>
            <p className="stat-label" style={styles.statLabel}>Total System Users</p>
          </div>
        </div>
        
        <div className="stat-card" style={styles.statCard}>
          <div className="stat-icon-container active" style={styles.statIconContainer}>
            <FontAwesomeIcon icon={faCheckCircle} style={styles.statIcon} />
          </div>
          <div className="stat-content" style={styles.statContent}>
            <h3 className="stat-number" style={styles.statNumber}>{accounts.length}</h3>
            <p className="stat-label" style={styles.statLabel}>Active Accounts</p>
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

      {/* Search and Filter Controls */}
      <div className="filter-bar" style={styles.filterBar}>
        <div className="search-box" style={styles.searchBox}>
          <FontAwesomeIcon icon={faSearch} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Find users by name, email, or department..."
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
        </div>
      </div>

      {/* User Accounts Directory */}
      <div className="table-container" style={styles.tableContainer}>
        
        <div className="table-wrapper" style={styles.tableWrapper}>
          <table className="table" style={styles.table}>
            <thead>
              <tr>
                <th className="th" style={styles.th}>USER PROFILE</th>
                <th className="th" style={styles.th}>ACCESS LEVEL</th>
                <th className="th" style={styles.th}>DEPARTMENT</th>
                <th className="th" style={styles.th}>Email Address</th>
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
                        <div className="user-avatar" style={styles.userAvatar}>
                          {acc.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info" style={styles.userInfo}>
                          <div className="user-name" style={styles.userName}>{acc.full_name}</div>
                          <div className="user-id" style={styles.userId}>Employee ID: {acc.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="td" style={styles.td}>
                      <span style={{
                        ...styles.roleBadge,
                        ...(acc.role === "Mayor" ? styles.roleMayor : styles.roleOfficeHead)
                      }}>
                        {acc.role}
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
                      <span className="status-badge" style={styles.statusBadge}>
                        <FontAwesomeIcon icon={faCheckCircle} style={styles.statusIcon} />
                        Active
                      </span>
                    </td>
                    <td className="td" style={styles.td}>
                      <div className="action-buttons" style={styles.actionButtons}>
                        <button 
                          className="view-btn"
                          style={styles.viewBtn}
                          onClick={() => handleEditAccount(acc)}
                          title="View User Details"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button 
                          className="edit-btn"
                          style={styles.editBtn}
                          onClick={() => handleEditAccount(acc)}
                          title="Edit User Information"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data" style={styles.noData}>
                    <div className="empty-state" style={styles.emptyState}>
                      <FontAwesomeIcon icon={faUsers} style={styles.emptyIcon} />
                      <p className="empty-text" style={styles.emptyText}>No user accounts match your criteria</p>
                      {searchTerm || roleFilter !== "all" ? (
                        <p className="empty-subtext" style={styles.emptySubtext}>
                          Adjust your search parameters or reset filters
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
                      department: role === "Mayor" ? "Office of the Municipal Mayor" : "",
                    });
                  }}
                  className="form-select"
                  style={styles.formSelect}
                >
                  <option value="">Select Access Privilege</option>
                  <option value="Mayor">Mayor</option>
                  <option value="Office Head">Department Head</option>
                </select>
              </div>

              {newAccount.role !== "Mayor" && newAccount.role !== "" && (
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
                <p className="info-text" style={styles.infoText}>
                  Upon creation, the user will receive automated email instructions for password setup and system access.
                </p>
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
                    Processing Registration...
                  </>
                ) : (
                  <>
                    Create User Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Details Modal */}
      {editModal && selectedAccount && (
        <div style={styles.modalOverlay}>
          <div className="modal" style={styles.modal}>
            <div className="modal-header" style={styles.modalHeader}>
              <h3 className="modal-title" style={styles.modalTitle}>User Account Details</h3>
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
                <div className="preview-avatar" style={styles.previewAvatar}>
                  {selectedAccount.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="preview-info" style={styles.previewInfo}>
                  <h4 className="preview-name" style={styles.previewName}>{selectedAccount.full_name}</h4>
                  <p className="preview-email" style={styles.previewEmail}>{selectedAccount.email}</p>
                </div>
              </div>
              
              <div className="form-group" style={styles.formGroup}>
                <label className="form-label" style={styles.formLabel}>Full Name</label>
                <input
                  type="text"
                  value={selectedAccount.full_name}
                  onChange={(e) => setSelectedAccount({ ...selectedAccount, full_name: e.target.value })}
                  className="form-input"
                  style={styles.formInput}
                />
              </div>
              
              <div className="form-group" style={styles.formGroup}>
                <label className="form-label" style={styles.formLabel}>Email Address</label>
                <input
                  type="email"
                  value={selectedAccount.email}
                  onChange={(e) => setSelectedAccount({ ...selectedAccount, email: e.target.value })}
                  className="form-input"
                  style={styles.formInput}
                />
              </div>
              
              <div className="form-group" style={styles.formGroup}>
                <label className="form-label" style={styles.formLabel}>Access Level</label>
                <div className="read-only-field" style={styles.readOnlyField}>
                  {selectedAccount.role}
                </div>
              </div>
              
              <div className="form-group" style={styles.formGroup}>
                <label className="form-label" style={styles.formLabel}>Department Assignment</label>
                <div className="read-only-field" style={styles.readOnlyField}>
                  {selectedAccount.department}
                </div>
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
              >
                <FontAwesomeIcon icon={faSave} style={styles.saveIcon} />
                Save Changes
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
    marginLeft: "300px", 
    flex: 1, 
    marginTop: "80px",
    maxWidth: "calc(100% - 280px)",
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
  btnIcon: {
    fontSize: "16px"
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
    backgroundColor: "#fafafa"
  },
  tableTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#2c3e50",
    margin: "0"
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
    backgroundColor: "#009205",
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
    border: "1px solid rgba(229, 229, 229, 1)"
  },
  roleOfficeHead: {
    border: "1px solid rgba(229, 229, 229, 1)"
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
    backgroundColor: "rgba(46, 204, 113, 0.1)",
    color: "#27ae60",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    border: "1px solid rgba(46, 204, 113, 0.2)"
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

  // Information Panel
  modalInfo: {
    backgroundColor: "#ffffffff",
    padding: "15px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "20px",
    border: "1px solid #c8e6c9"
  },
  infoIcon: {
    color: "#000000ff",
    fontSize: "16px"
  },
  infoText: {
    fontSize: "14px",
    color: "#000000ff",
    margin: "0"
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
    backgroundColor: "#009205",
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
    margin: "0"
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