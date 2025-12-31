import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserCog,
  faCog,
  faSignOutAlt,
  faBell
} from '@fortawesome/free-solid-svg-icons';
import './ProfileDropdown.css'; // Optional CSS file

const API_URL = "https://ezleave-admin-api.onrender.com";

const ProfileDropdown = ({ 
  showSettingsModal, 
  setShowSettingsModal,
  showProfileModal,
  setShowProfileModal,
  showLogoutModal,
  setShowLogoutModal,
  isMobile = false
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [profileData, setProfileData] = useState({
    full_name: "",
    profile_picture: "",
    role: ""
  });
  const [notifications, setNotifications] = useState([]);

  const getStoredAdmin = () => {
    try {
      const raw = localStorage.getItem("admin");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.error("Invalid admin in localStorage, clearing it.", err);
      localStorage.removeItem("admin");
      return null;
    }
  };

  // Fetch admin data
 useEffect(() => {
    const fetchAdmin = async () => {
      const storedAdmin = getStoredAdmin();
      if (!storedAdmin?.id) return;

      try {
        const endpoint = storedAdmin.role === "office_head"
          ? `${API_URL}/api/authAdmin/user/${storedAdmin.id}`
          : `${API_URL}/api/auth/useradmin/${storedAdmin.id}`;

        const res = await fetch(endpoint);
        if (!res.ok) {
          console.error("Failed to fetch admin data:", res.status);
          return;
        }
        const data = await res.json();
        setAdmin(data);
        setProfileData({
          full_name: data.full_name || "",
          profile_picture: data.profile_picture || "",
          role: data.role || ""
        });
      } catch (err) {
        console.error("Error fetching admin data:", err);
      }
    };

    fetchAdmin();
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
    const user = JSON.parse(localStorage.getItem("admin"));

    if (user) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: user.role }),
      });
    }

    localStorage.removeItem("admin");
    window.location.href = "/"; // Use window.location for navigation
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

  // For mobile view
  if (isMobile) {
    return (
      <div className="mobile-profile-container">
        <FontAwesomeIcon icon={faBell} className="mobile-icon-bell" />
        <div 
          className="mobile-profile" 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
        >
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

        {showProfileMenu && (
          <div className="mobile-profile-dropdown">
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
    );
  }

  // For desktop view
  return (
    <div className="profile-container">
      <div className="notification-badge-container">
        <FontAwesomeIcon icon={faBell} className="icon-bell" />
        {notifications.length > 0 && (
          <span className="notification-badge">
            {notifications.length}
          </span>
        )}
      </div>

      <div className="profile-wrapper">
        <div
          className="profile-info"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
        >
          <img
            src={
              admin?.profile_picture ||
              profileData?.profile_picture ||
              "https://res.cloudinary.com/demo/image/upload/v1690000000/default-avatar.png"
            }
            alt="Profile"
            className="profile-image"
          />
          <div className="profile-details">
            <p className="profile-name">
              {admin?.full_name || profileData?.full_name || "Loading..."}
            </p>
            <p className="profile-role">
              {admin?.role || profileData?.role || ""}
            </p>
          </div>
        </div>

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
  );
};

export default ProfileDropdown;