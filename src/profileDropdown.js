import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCog, faCog, faSignOutAlt, faBell } from "@fortawesome/free-solid-svg-icons";
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
  admin
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const profile = profileData || admin;

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      const userId = localStorage.getItem("userId");
      const role = localStorage.getItem("userRole"); // admin, office_head, mayor
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
        profile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
      }
    };

    fetchProfile();
  }, []);

  // Fetch notifications (same as before)
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

  const handleProfileClick = () => { setShowProfileModal(true); setShowProfileMenu(false); };
  const handleSettingsClick = () => { setShowSettingsModal(true); setShowProfileMenu(false); };
  const handleLogoutClick = () => { setShowLogoutModal(true); setShowProfileMenu(false); };
  const handleNotificationClick = () => { 
    setShowNotifications(!showNotifications); 
    setShowProfileMenu(false);
    // If you want to trigger the notification modal instead of inline dropdown:
    // setShowNotificationModal(true);
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
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
  );
};

export default ProfileDropdown;