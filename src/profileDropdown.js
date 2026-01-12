import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUserCog, 
  faCog, 
  faSignOutAlt, 
  faBell,
  faTimes,
  faEdit,
  faSave,
  faHistory,
  faTrash,
  faFileContract,
  faCalendarDay,
  faCalendarAlt,
  faCheckCircle,
  faClock,
  faUser,
  faBuilding,
  faCalendarPlus,
  faCalendarMinus,
  faFlag,
  faStar,
  faEnvelope,
  faIdBadge,
  faCalendar
} from "@fortawesome/free-solid-svg-icons";
import "./ProfileDropdown.css";

const API_URL = "https://ezleave-admin-api.onrender.com";

const ProfileDropdown = ({
  showSettingsModal,
  setShowSettingsModal,
  showProfileModal,
  setShowProfileModal,
  showLogoutModal,
  showNotificationModal,
  setShowNotificationModal,
  setShowLogoutModal,
  isMobile = false,
  profileData,
  admin,
  navigate
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Modal states
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [isEditingTerms, setIsEditingTerms] = useState(false);
  const [termsVersions, setTermsVersions] = useState([]);
  const [activeTermsVersion, setActiveTermsVersion] = useState(null);
  const [newTermsVersion, setNewTermsVersion] = useState('');

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

  // Profile modal states
  const [isUploading, setIsUploading] = useState(false);
  const [tempProfileData, setTempProfileData] = useState({
    full_name: "",
    email: "",
    role: "",
    profile_picture: "",
    department: "",
    created_at: ""
  });

  const profile = profileData || admin;

  // Initialize temp profile data when profile changes
  useEffect(() => {
    if (profile) {
      setTempProfileData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        role: profile.role || "",
        profile_picture: profile.profile_picture || "https://res.cloudinary.com/demo/image/upload/v1690000000/default-avatar.png",
        department: profile.department || "",
        created_at: profile.created_at || ""
      });
    }
  }, [profile]);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      const userId = localStorage.getItem("userId");
      const role = localStorage.getItem("userRole");
      if (!userId || !role) return;

      try {
        let endpoint = "";

        if (role === "admin") {
          endpoint = `${API_URL}/api/auth/useradmin/${userId}`;
        } else if (role === "office_head" || role === "mayor") {
          endpoint = `${API_URL}/api/authAdmin/user/${userId}`;
        }

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        // Note: profile is a function in props, should be setProfileData or setAdmin
        // This might need adjustment based on your parent component
      } catch (err) {
        console.error("Error fetching profile:", err);
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
      }
    };

    fetchProfile();
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
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
            isRead: item.notification.is_read || false,
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setNotifications(extractedNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("userRole");
    if (userId) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
    }
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    window.location.href = "/";
  };

  const handleProfileClick = () => { 
    setShowProfileModal(true); 
    setShowProfileMenu(false); 
  };
  
  const handleSettingsClick = () => { 
    setShowSettingsModal(true); 
    setShowProfileMenu(false); 
  };
  
  const handleLogoutClick = () => { 
    setShowLogoutModal(true); 
    setShowProfileMenu(false); 
  };
  
  const handleNotificationClick = () => { 
    setShowNotifications(!showNotifications); 
    setShowProfileMenu(false);
  };

  // Modal handlers
  const openTermsModal = () => {
    setShowSettingsModal(false);
    setShowTermsModal(true);
    fetchTermsAndConditions();
  };

  const openLocalHolidayModal = () => {
    setShowSettingsModal(false);
    setShowLocalHolidayModal(true);
    fetchLocalHolidays();
  };

  // Fetch Terms & Conditions
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

  // Local Holidays Functions
  const fetchLocalHolidays = async () => {
    setIsLoadingHolidays(true);
    try {
      const response = await fetch(`${API_URL}/api/holidays/local`);
      if (response.ok) {
        const data = await response.json();
        const holidaysWithType = data.map(holiday => ({
          ...holiday,
          date: holiday.date.split('T')[0],
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
        type: 'local'
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

  // Profile Modal Functions
  const handleProfilePictureUpload = async (file) => {
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
        setTempProfileData(prev => ({
          ...prev,
          profile_picture: data.secure_url,
        }));
        return data.secure_url;
      } else {
        alert("Upload failed");
        return null;
      }
    } catch (err) {
      console.error(err);
      alert("Upload error");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const saveProfileChanges = async () => {
    if (!tempProfileData.profile_picture) {
      alert("Please upload a profile image first.");
      return;
    }

    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("userRole");
    
    if (!userId || !role) {
      alert("User not found. Please login again.");
      return;
    }

    try {
      let endpoint = "";
      let body = {};

      if (role === "admin") {
        endpoint = `${API_URL}/api/auth/updateProfile/${userId}`;
        body = {
          full_name: tempProfileData.full_name,
          profile_picture: tempProfileData.profile_picture
        };
      } else if (role === "office_head" || role === "mayor") {
        endpoint = `${API_URL}/api/authAdmin/update/${userId}`;
        body = {
          full_name: tempProfileData.full_name,
          profile_picture: tempProfileData.profile_picture,
          department: tempProfileData.department
        };
      }

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (res.ok) {
        alert("✅ Profile updated successfully!");
        setShowProfileModal(false);
        // You might want to refresh the profile data in parent component
        if (profileData && typeof profileData === 'object') {
          // Update parent profile data if passed as mutable object
          Object.assign(profileData, result);
        }
      } else {
        alert(result.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("❌ Error updating profile:", err);
      alert("Error updating profile. See console.");
    }
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Modal Styles
  const modalStyles = {
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
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
      borderRadius: "12px",
      width: "400px",
      maxHeight: "80vh",
      overflowY: "auto",
      boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
      animation: "slideIn 0.3s ease",
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px",
      borderBottom: "1px solid #eee",
    },
    modalTitle: {
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
    // Terms Modal specific
    termsModalContent: {
      backgroundColor: "white",
      borderRadius: "12px",
      width: "800px",
      maxHeight: "90vh",
      overflowY: "auto",
      boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
      animation: "slideIn 0.3s ease",
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
    // Local Holiday Modal specific
    localHolidayModalContent: {
      backgroundColor: "white",
      borderRadius: "12px",
      width: "800px",
      maxHeight: "90vh",
      overflowY: "auto",
      boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
      animation: "slideIn 0.3s ease",
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
    // Profile Modal specific styles
    profileModalContent: {
      backgroundColor: "white",
      borderRadius: "12px",
      width: "450px",
      maxHeight: "85vh",
      overflowY: "auto",
      boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
      animation: "slideIn 0.3s ease",
    },
    profileSection: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px",
    },
    profileImageContainer: {
      position: "relative",
      width: "140px",
      height: "140px",
      marginBottom: "20px",
    },
    profileImage: {
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      objectFit: "cover",
      border: "3px solid #6FCB5C",
    },
    photoOverlay: {
      position: "absolute",
      bottom: "0",
      right: "0",
      background: "rgba(0, 0, 0, 0.7)",
      color: "white",
      padding: "5px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      cursor: "pointer",
    },
    profileDetails: {
      width: "100%",
      backgroundColor: "#f8f9fa",
      padding: "20px",
      borderRadius: "8px",
      marginBottom: "20px",
    },
    detailGroup: {
      marginBottom: "15px",
    },
    detailLabel: {
      fontSize: "12px",
      color: "#666",
      marginBottom: "5px",
      fontWeight: "500",
    },
    detailValue: {
      padding: "8px 12px",
      backgroundColor: "white",
      borderRadius: "6px",
      border: "1px solid #dee2e6",
      fontSize: "14px",
      color: "#333",
    },
    editInput: {
      padding: "8px 12px",
      backgroundColor: "white",
      borderRadius: "6px",
      border: "1px solid #007bff",
      fontSize: "14px",
      color: "#333",
      width: "100%",
      boxSizing: "border-box",
    },
    profileActions: {
      display: "flex",
      gap: "10px",
      width: "100%",
      padding: "0 20px 20px",
    },
    saveProfileButton: {
      flex: 1,
      background: "#007bff",
      color: "#fff",
      border: "none",
      padding: "10px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "14px",
    },
    closeProfileButton: {
      flex: 1,
      background: "#6c757d",
      color: "#fff",
      border: "none",
      padding: "10px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      fontSize: "14px",
    },
  };

  return (
    <>
      <div className="profile-container">
        <div className="profile-wrapper">
          {/* Notification Icon */}
          <div className="notification-container" onClick={handleNotificationClick}>
            <FontAwesomeIcon icon={faBell} className="notification-icon" />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </div>

          {/* Profile Section */}
          <div className="profile-info" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <img
              src={profile?.profile_picture || "https://res.cloudinary.com/demo/image/upload/v1690000000/default-avatar.png"}
              alt="Profile"
              className="profile-image"
            />
            <div className="profile-details">
              <p className="profile-name">{profile?.full_name || "Loading..."}</p>
              <p className="profile-role">{profile?.role || ""}</p>
            </div>
          </div>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <span className="unread-count">{unreadCount} unread</span>
                )}
              </div>
              <div className="notifications-list">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                    >
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-notifications">No notifications</div>
                )}
              </div>
              {notifications.length > 5 && (
                <div className="view-all-notifications" onClick={() => setShowNotificationModal(true)}>
                  View all notifications
                </div>
              )}
            </div>
          )}

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="profile-dropdown">
              <button className="dropdown-item" onClick={handleProfileClick}>
                <FontAwesomeIcon icon={faUserCog} className="dropdown-icon" /> My Profile
              </button>
              <button className="dropdown-item" onClick={handleSettingsClick}>
                <FontAwesomeIcon icon={faCog} className="dropdown-icon" /> Settings
              </button>
              <button className="dropdown-item" onClick={handleLogoutClick}>
                <FontAwesomeIcon icon={faSignOutAlt} className="dropdown-icon" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal - Copying Dashboard Design */}
      {showProfileModal && (
        <div style={{
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
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "18px",
            width: "420px",
            padding: "32px 28px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            animation: "fadeIn 0.3s ease",
          }}>
            <h2 style={{
              fontSize: "1.6rem",
              fontWeight: "600",
              color: "#2b2b2b",
              marginBottom: "24px",
              textAlign: "center",
              width: "100%",
            }}>
              My Profile
            </h2>

            {/* Profile Picture Section */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "24px",
              width: "100%",
            }}>
              <div style={{ position: "relative", textAlign: "center" }}>
                <img
                  src={tempProfileData.profile_picture || "https://res.cloudinary.com/demo/image/upload/v1690000000/default-avatar.png"}
                  alt="Profile"
                  style={{
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #6FCB5C',
                    marginBottom: '10px',
                  }}
                />
                <label 
                  htmlFor="profileUpload" 
                  style={{
                    position: "absolute",
                    bottom: "0",
                    right: "0",
                    background: "rgba(0, 0, 0, 0.7)",
                    color: "white",
                    padding: "5px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  {isUploading ? "Uploading..." : "Change"}
                </label>
                <input
                  id="profileUpload"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const imageUrl = await handleProfilePictureUpload(file);
                      if (imageUrl) {
                        setTempProfileData(prev => ({
                          ...prev,
                          profile_picture: imageUrl
                        }));
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Profile Details Form */}
            <div style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              marginBottom: "24px",
            }}>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}>
                <label style={{
                  fontSize: "0.9rem",
                  color: "#555",
                  fontWeight: "500",
                }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={tempProfileData.full_name}
                  onChange={(e) => setTempProfileData(prev => ({
                    ...prev,
                    full_name: e.target.value
                  }))}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    fontSize: "0.95rem",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  placeholder="Enter your full name"
                />
              </div>

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}>
                <label style={{
                  fontSize: "0.9rem",
                  color: "#555",
                  fontWeight: "500",
                }}>
                  Email
                </label>
                <input
                  type="text"
                  value={tempProfileData.email || "Not available"}
                  disabled
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    background: "#f8f9fa",
                    fontSize: "0.95rem",
                    color: "#888",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
              }}>
                <label style={{
                  fontSize: "0.9rem",
                  color: "#555",
                  fontWeight: "500",
                }}>
                  Role
                </label>
                <input
                  type="text"
                  value={tempProfileData.role || "Not specified"}
                  disabled
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    background: "#f8f9fa",
                    fontSize: "0.95rem",
                    color: "#888",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {tempProfileData.department && (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                }}>
                  <label style={{
                    fontSize: "0.9rem",
                    color: "#555",
                    fontWeight: "500",
                  }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={tempProfileData.department}
                    disabled
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                      background: "#f8f9fa",
                      fontSize: "0.95rem",
                      color: "#888",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              gap: "8px",
            }}>
              <button
                style={{
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
                  fontSize: "14px",
                }}
                onClick={saveProfileChanges}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Save Changes"}
              </button>

              <button
                style={{
                  flex: 1,
                  background: "#f1f1f1",
                  color: "#333",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "500",
                  transition: "background 0.3s ease",
                  fontSize: "14px",
                }}
                onClick={() => {
                  setShowProfileModal(false);
                  // Reset temp data to original profile data
                  if (profile) {
                    setTempProfileData({
                      full_name: profile.full_name || "",
                      email: profile.email || "",
                      role: profile.role || "",
                      profile_picture: profile.profile_picture || "https://res.cloudinary.com/demo/image/upload/v1690000000/default-avatar.png",
                      department: profile.department || "",
                      created_at: profile.created_at || ""
                    });
                  }
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div style={modalStyles.modalOverlay}>
          <div style={modalStyles.modalContent}>
            <div style={modalStyles.modalHeader}>
              <h2 style={modalStyles.modalTitle}>
                <FontAwesomeIcon icon={faCog} style={{marginRight: '10px'}} /> Settings
              </h2>
              <button 
                style={modalStyles.closeButton}
                onClick={() => setShowSettingsModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <button 
                style={modalStyles.settingsSectionButton}
                onClick={openTermsModal}
              >
                <FontAwesomeIcon icon={faFileContract} style={{marginRight: '10px'}} />
                Terms & Conditions Management
              </button>
              
              <button 
                style={modalStyles.settingsSectionButton}
                onClick={openLocalHolidayModal}
              >
                <FontAwesomeIcon icon={faCalendarDay} style={{marginRight: '10px'}} />
                Local Holiday Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div style={modalStyles.modalOverlay}>
          <div style={modalStyles.termsModalContent}>
            <div style={modalStyles.modalHeader}>
              <h2 style={modalStyles.modalTitle}>
                <FontAwesomeIcon icon={faFileContract} style={{marginRight: '10px'}} /> Terms & Conditions
              </h2>
              <button 
                style={modalStyles.closeButton}
                onClick={() => {
                  setShowTermsModal(false);
                  setIsEditingTerms(false);
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div style={modalStyles.activeTermsCard}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h4>Active Version</h4>
                {activeTermsVersion && (
                  <span style={modalStyles.activeBadge}>ACTIVE</span>
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

            <div style={{padding: "0 20px", marginBottom: "20px"}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                <h4>Terms & Conditions Content</h4>
                {!isEditingTerms ? (
                  <button 
                    style={modalStyles.editButton}
                    onClick={() => setIsEditingTerms(true)}
                  >
                    <FontAwesomeIcon icon={faEdit} /> Edit
                  </button>
                ) : (
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button 
                      style={modalStyles.saveButton}
                      onClick={saveTermsAndConditions}
                    >
                      <FontAwesomeIcon icon={faSave} /> Save
                    </button>
                    <button 
                      style={modalStyles.cancelButton}
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
                    style={modalStyles.versionInput}
                  />
                </div>
              )}

              {isEditingTerms ? (
                <textarea
                  value={termsContent}
                  onChange={(e) => setTermsContent(e.target.value)}
                  style={modalStyles.termsTextarea}
                  rows={15}
                  placeholder="Enter Terms & Conditions content here..."
                />
              ) : (
                <div style={modalStyles.termsViewer}>
                  {termsContent || 'No Terms & Conditions content available.'}
                </div>
              )}
            </div>

            <div style={{padding: "0 20px 20px"}}>
              <h4><FontAwesomeIcon icon={faHistory} /> Version History</h4>
              <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                {termsVersions.map(version => (
                  <div 
                    key={version.id} 
                    style={modalStyles.versionItem}
                  >
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <strong>Version {version.version}</strong>
                        {version.is_active && <span style={modalStyles.activeBadge}>ACTIVE</span>}
                      </div>
                      <p style={{fontSize: '12px', color: '#666', margin: '5px 0'}}>
                        Created: {new Date(version.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{display: 'flex', gap: '5px'}}>
                      {!version.is_active && (
                        <>
                          <button 
                            style={modalStyles.smallButton}
                            onClick={() => activateTermsVersion(version.id)}
                          >
                            Activate
                          </button>
                          <button 
                            style={{...modalStyles.smallButton, background: '#dc3545'}}
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

      {/* Local Holiday Modal */}
      {showLocalHolidayModal && (
        <div style={modalStyles.modalOverlay}>
          <div style={modalStyles.localHolidayModalContent}>
            <div style={modalStyles.modalHeader}>
              <h2 style={modalStyles.modalTitle}>
                <FontAwesomeIcon icon={faCalendarDay} style={{marginRight: '10px'}} /> Local Holiday Settings
              </h2>
              <button 
                style={modalStyles.closeButton}
                onClick={() => {
                  setShowLocalHolidayModal(false);
                  setEditingHoliday(null);
                  setNewHoliday({ date: '', name: '', description: '', is_recurring: false });
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div style={{padding: "20px"}}>
              {/* Add/Edit Holiday Form */}
              <div style={modalStyles.holidayFormSection}>
                <h4 style={modalStyles.sectionTitle}>
                  {editingHoliday ? 'Edit Local Holiday' : 'Add Local Holiday'}
                </h4>
                
                <div style={modalStyles.holidayForm}>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Holiday Date</label>
                    <input
                      type="date"
                      value={newHoliday.date}
                      onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})}
                      style={modalStyles.dateInput}
                    />
                  </div>
                  
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Holiday Name</label>
                    <input
                      type="text"
                      value={newHoliday.name}
                      onChange={(e) => setNewHoliday({...newHoliday, name: e.target.value})}
                      style={modalStyles.textInput}
                      placeholder="e.g., Local Foundation Day"
                    />
                  </div>
                  
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Description (Optional)</label>
                    <textarea
                      value={newHoliday.description}
                      onChange={(e) => setNewHoliday({...newHoliday, description: e.target.value})}
                      style={modalStyles.textareaInput}
                      placeholder="Brief description of the holiday"
                      rows={3}
                    />
                  </div>
                  
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={newHoliday.is_recurring}
                        onChange={(e) => setNewHoliday({...newHoliday, is_recurring: e.target.checked})}
                        style={modalStyles.checkboxInput}
                      />
                      Recurring Holiday (Repeat every year)
                    </label>
                  </div>
                  
                  <div style={modalStyles.formButtons}>
                    <button 
                      style={modalStyles.saveButton}
                      onClick={saveHoliday}
                    >
                      {editingHoliday ? 'Update Holiday' : 'Save Holiday'}
                    </button>
                    
                    {editingHoliday && (
                      <button 
                        style={modalStyles.cancelButton}
                        onClick={() => {
                          setEditingHoliday(null);
                          setNewHoliday({ date: '', name: '', description: '', is_recurring: false });
                        }}
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Holiday List */}
              <div style={{marginTop: "20px"}}>
                <h4 style={modalStyles.sectionTitle}>Local Holidays ({localHolidays.length})</h4>
                
                {isLoadingHolidays ? (
                  <div style={{textAlign: "center", padding: "20px", color: "#666"}}>
                    <p>Loading holidays...</p>
                  </div>
                ) : localHolidays.length > 0 ? (
                  <div style={modalStyles.holidayList}>
                    {localHolidays.map((holiday, index) => (
                      <div key={holiday.id || index} style={modalStyles.holidayItem}>
                        <div style={{flex: 1}}>
                          <div style={modalStyles.holidayDate}>
                            <FontAwesomeIcon icon={faCalendarAlt} style={{marginRight: '8px'}} />
                            {holiday.date}
                            {holiday.is_recurring && (
                              <span style={modalStyles.recurringBadge}>
                                <FontAwesomeIcon icon={faHistory} /> Yearly
                              </span>
                            )}
                          </div>
                          <div style={modalStyles.holidayName}>{holiday.name}</div>
                          {holiday.description && (
                            <div style={modalStyles.holidayDescription}>{holiday.description}</div>
                          )}
                        </div>
                        <div style={modalStyles.holidayActions}>
                          <button 
                            style={modalStyles.editHolidayButton}
                            onClick={() => editHoliday(holiday)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button 
                            style={modalStyles.deleteHolidayButton}
                            onClick={() => deleteHoliday(holiday.id)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={modalStyles.noHolidays}>
                    <FontAwesomeIcon icon={faCalendarDay} style={modalStyles.noHolidaysIcon} />
                    <p>No local holidays added yet.</p>
                    <p style={{fontSize: '14px', color: '#868e96', marginTop: '5px'}}>
                      Add local holidays to appear on the calendar.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileDropdown;