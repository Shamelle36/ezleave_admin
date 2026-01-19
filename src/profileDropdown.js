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
  faSpinner,
  faCamera,
  faKey
} from "@fortawesome/free-solid-svg-icons";
import "./ProfileDropdown.css";

const API_URL = "https://ezleave-admin-api.onrender.com";

const ProfileDropdown = ({
  showSettingsModal,
  setShowSettingsModal,
  showProfileModal,
  setShowProfileModal,
  showLogoutModal,
  setShowLogoutModal,
  isMobile = false,
  profileData,
  admin,
  navigate,
  setProfileData,
  setAdmin
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [, setShowNotifications] = useState(false);
  
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

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [viewAllNotifications, setViewAllNotifications] = useState([]);

  // Add these states with your other modal states at the top of the component
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  // Fetch profile - Now relying on props from parent component
  useEffect(() => {
    const fetchProfile = async () => {
      // If we don't have profile data, the parent component should fetch it
      if (!profile && !admin) {
        console.warn("No profile data available - parent should fetch");
        return;
      }
    };

    fetchProfile();
  }, [profile, admin]);

  // Fetch notifications
 // Update the fetchNotifications function with better debugging
useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const leaveRes = await fetch(`${API_URL}/api/leave-requests`);
      const leaveData = await leaveRes.json();
      
      // DEBUG: Log the actual API response structure
      console.log('API Response for leave-requests:', leaveData);
      
      // Check if leaveData is an array
      if (!Array.isArray(leaveData)) {
        console.error('leaveData is not an array:', leaveData);
        setNotifications([]);
        return;
      }

      // Extract notifications properly
      const extractedNotifications = [];
      
      leaveData.forEach((item, index) => {
        console.log(`Item ${index}:`, {
          id: item.id,
          hasNotification: !!item.notification,
          notificationType: typeof item.notification,
          notificationValue: item.notification
        });
        
        if (item.notification) {
          // Handle different notification structures
          if (Array.isArray(item.notification)) {
            // If notification is an array
            item.notification.forEach((notif, notifIndex) => {
              extractedNotifications.push({
                id: notif.id || `notif-${item.id}-${notifIndex}`,
                type: notif.type || "leave_filed",
                message: notif.message || `${item.first_name || ''} ${item.last_name || ''} filed a ${item.leave_type || ''} request`,
                createdAt: notif.created_at || notif.createdAt || new Date().toISOString(),
                isRead: notif.is_read || notif.isRead || false,
                read: notif.read || false
              });
            });
          } else if (typeof item.notification === 'object') {
            // If notification is an object
            extractedNotifications.push({
              id: item.notification.id || `notif-${item.id}`,
              type: item.notification.type || "leave_filed",
              message: item.notification.message || `${item.first_name || ''} ${item.last_name || ''} filed a ${item.leave_type || ''} request`,
              createdAt: item.notification.created_at || item.notification.createdAt || new Date().toISOString(),
              isRead: item.notification.is_read || item.notification.isRead || false,
              read: item.notification.read || false
            });
          }
        }
      });
      
      console.log('Extracted notifications:', extractedNotifications);
      console.log('Unread count:', extractedNotifications.filter(n => !n.isRead && !n.read).length);
      
      // Sort by date (newest first)
      const sortedNotifications = extractedNotifications.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setNotifications(sortedNotifications);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setNotifications([]);
    }
  };

  fetchNotifications();
  const interval = setInterval(fetchNotifications, 60000);
  return () => clearInterval(interval);
}, []);

useEffect(() => {
  const fetchAllNotifications = async () => {
    if (showNotificationModal) {
      try {
        const leaveRes = await fetch(`${API_URL}/api/leave-requests`);
        const leaveData = await leaveRes.json();
        
        console.log('Fetching all notifications - API response:', leaveData);

        const allNotifications = [];
        
        if (Array.isArray(leaveData)) {
          leaveData.forEach((item, index) => {
            if (item.notification) {
              if (Array.isArray(item.notification)) {
                item.notification.forEach((n, notifIndex) => {
                  // Check if this notification is already added
                  const existingIndex = allNotifications.findIndex(
                    existing => existing.id === n.id || 
                               existing.notificationId === n.id
                  );
                  
                  if (existingIndex === -1) {
                    allNotifications.push({
                      id: n.id || `notif-${item.id}-${notifIndex}`,
                      notificationId: n.id,
                      type: n.type || "leave_filed",
                      message: n.message || `${item.first_name || ''} ${item.last_name || ''} filed a ${item.leave_type || ''} request`,
                      createdAt: n.created_at || n.createdAt || new Date().toISOString(),
                      isRead: n.is_read || n.isRead || false,
                      read: n.read || false,
                      leaveId: item.id,
                      leaveType: n.leave_type || item.leave_type,
                      status: item.status,
                      employeeName: `${item.first_name || ''} ${item.last_name || ''}`,
                      notification: n
                    });
                  }
                });
              } else if (typeof item.notification === 'object') {
                // Handle single notification object
                const n = item.notification;
                allNotifications.push({
                  id: n.id || `notif-${item.id}`,
                  notificationId: n.id,
                  type: n.type || "leave_filed",
                  message: n.message || `${item.first_name || ''} ${item.last_name || ''} filed a ${item.leave_type || ''} request`,
                  createdAt: n.created_at || n.createdAt || new Date().toISOString(),
                  isRead: n.is_read || n.isRead || false,
                  read: n.read || false,
                  leaveId: item.id,
                  leaveType: n.leave_type || item.leave_type,
                  status: item.status,
                  employeeName: `${item.first_name || ''} ${item.last_name || ''}`,
                  notification: n
                });
              }
            }
          });
        }

        // Sort by date (newest first)
        const sortedNotifications = allNotifications.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        console.log('All notifications (sorted):', sortedNotifications);
        console.log('Total unread:', sortedNotifications.filter(n => !(n.isRead || n.read)).length);
        
        setViewAllNotifications(sortedNotifications);
      } catch (err) {
        console.error("Error fetching all notifications:", err);
        setViewAllNotifications([]);
      }
    }
  };

  fetchAllNotifications();
}, [showNotificationModal]);

const handlePasswordChange = async () => {
  // Validation
  if (!passwordForm.currentPassword.trim()) {
    setPasswordError('Current password is required');
    return;
  }
  
  if (!passwordForm.newPassword.trim()) {
    setPasswordError('New password is required');
    return;
  }
  
  if (passwordForm.newPassword.length < 6) {
    setPasswordError('New password must be at least 6 characters');
    return;
  }
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    setPasswordError('New passwords do not match');
    return;
  }
  
  setIsChangingPassword(true);
  setPasswordError('');
  setPasswordSuccess('');
  
  try {
    // Determine which endpoint to use based on user role
    const userId = profile?.id || admin?.id;
    const userRole = profile?.role || admin?.role;
    
    if (!userId || !userRole) {
      throw new Error('User not found');
    }
    
    let endpoint = '';
    
    if (userRole === 'admin') {
      endpoint = `${API_URL}/api/auth/change-password/${userId}`;
    } else if (userRole === 'office_head' || userRole === 'mayor') {
      endpoint = `${API_URL}/api/authAdmin/change-password/${userId}`;
    } else {
      throw new Error('Invalid user role');
    }
    
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Auto close modal after 2 seconds
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } else {
      setPasswordError(data.message || 'Failed to change password');
    }
  } catch (error) {
    console.error('Error changing password:', error);
    setPasswordError('An error occurred. Please try again.');
  } finally {
    setIsChangingPassword(false);
  }
};

  const updateNotificationInState = (notificationId) => {
    setViewAllNotifications(prev => 
      prev.map(notif => {
        const notifId = notif.id;
        const notifNotificationId = notif.notificationId;
        const targetId = String(notificationId);
        
        if (
          String(notifId) === targetId ||
          (notifNotificationId && String(notifNotificationId) === targetId) ||
          (notif.notification?.id && String(notif.notification.id) === targetId)
        ) {
          return { 
            ...notif, 
            read: true, 
            isRead: true,
            ...(notif.notification && {
              notification: { 
                ...notif.notification, 
                read: true, 
                is_read: true 
              }
            })
          };
        }
        return notif;
      })
    );
    
    setNotifications(prev => 
      prev.map(notif => {
        const notifId = notif.id;
        const notifNotificationId = notif.notificationId;
        const targetId = String(notificationId);
        
        if (
          String(notifId) === targetId ||
          (notifNotificationId && String(notifNotificationId) === targetId) ||
          (notif.notification?.id && String(notif.notification.id) === targetId)
        ) {
          return { 
            ...notif, 
            read: true, 
            isRead: true,
            ...(notif.notification && {
              notification: { 
                ...notif.notification, 
                read: true, 
                is_read: true 
              }
            })
          };
        }
        return notif;
      })
    );
  };

  const markAsRead = async (notificationId) => {
    try {
      console.log('Marking notification as read:', notificationId);
      console.log('Current notifications:', viewAllNotifications.map(n => ({ 
        id: n.id, 
        notificationId: n.notificationId,
        notification: n.notification,
        isRead: n.isRead, 
        read: n.read 
      })));
      
      // Get the notification object to verify it exists
      const notificationToUpdate = viewAllNotifications.find(n => 
        String(n.id) === String(notificationId) ||
        (n.notificationId && String(n.notificationId) === String(notificationId)) ||
        (n.notification && String(n.notification.id) === String(notificationId))
      );
      
      if (!notificationToUpdate) {
        console.warn('Notification not found:', notificationId);
        return;
      }
      
      // Check if already read
      if (notificationToUpdate.isRead || notificationToUpdate.read) {
        console.log('Notification already marked as read');
        return;
      }

      // Extract the correct notification ID
      let actualNotificationId;
      
      if (notificationToUpdate.notificationId) {
        actualNotificationId = notificationToUpdate.notificationId;
      } else if (notificationToUpdate.notification?.id) {
        actualNotificationId = notificationToUpdate.notification.id;
      } else if (notificationToUpdate.id && typeof notificationToUpdate.id === 'number') {
        actualNotificationId = notificationToUpdate.id;
      } else if (notificationToUpdate.id && notificationToUpdate.id.toString().includes('notif-')) {
        actualNotificationId = notificationToUpdate.id.toString().replace('notif-', '');
      } else {
        actualNotificationId = notificationToUpdate.id;
      }
      
      console.log('Actual notification ID to send:', actualNotificationId);
      console.log('Notification object structure:', notificationToUpdate);

      // Call the API to mark as read on server
      const response = await fetch(`${API_URL}/api/leave-requests/notifications/${actualNotificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Mark as read response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Mark as read response:', data);
        
        // Update local state
        updateNotificationInState(notificationId);
        
        console.log('Successfully marked notification as read');
      } else {
        console.error('Failed to mark as read, status:', response.status);
        // Still update UI for better user experience
        updateNotificationInState(notificationId);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Update UI even if API fails for better UX
      updateNotificationInState(notificationId);
    }
  };

  // // UPDATED markAllAsRead function
  // const markAllAsRead = async () => {
  //   try {
  //     // Get user ID from profile or admin
  //     const userId = profile?.id || admin?.id;
      
  //     if (!userId) {
  //       alert("User not found. Please refresh the page.");
  //       return;
  //     }

  //     console.log('Marking all notifications as read for user:', userId);

  //     // Call the API to mark all as read
  //     const response = await fetch(`${API_URL}/api/leave-requests/notifications/mark-all-read`, {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ userId })
  //     });
      
  //     const data = await response.json();
  //     console.log('Mark all as read response:', data);
      
  //     if (data.success) {
  //       // Update local state - use both is_read and isRead for compatibility
  //       setViewAllNotifications(prev => 
  //         prev.map(notif => ({ ...notif, read: true, isRead: true }))
  //       );
        
  //       // Also update the main notifications list
  //       setNotifications(prev => 
  //         prev.map(notif => ({ ...notif, read: true, isRead: true }))
  //       );
        
  //       alert(data.message);
  //     } else {
  //       alert('Failed to mark all as read: ' + data.message);
  //       // Still update UI for better UX
  //       setViewAllNotifications(prev => 
  //         prev.map(notif => ({ ...notif, read: true, isRead: true }))
  //       );
  //       setNotifications(prev => 
  //         prev.map(notif => ({ ...notif, read: true, isRead: true }))
  //       );
  //     }
  //   } catch (error) {
  //     console.error('Error marking all notifications as read:', error);
  //     // Update UI even if API fails
  //     setViewAllNotifications(prev => 
  //       prev.map(notif => ({ ...notif, read: true, isRead: true }))
  //     );
  //     setNotifications(prev => 
  //       prev.map(notif => ({ ...notif, read: true, isRead: true }))
  //     );
  //     alert('Notifications marked as read locally. Please check your connection.');
  //   }
  // };

  const getNotificationIcon = (type, status) => {
    switch (type) {
      case 'leave_filed':
        return status === 'approved' ? faCheckCircle : 
               status === 'rejected' ? faTimes : 
               faClock;
      case 'announcement':
        return faBell;
      case 'reminder':
        return faClock;
      default:
        return faBell;
    }
  };

  const getNotificationColor = (type, status) => {
    switch (type) {
      case 'leave_filed':
        return status === 'approved' ? '#28a745' : 
               status === 'rejected' ? '#dc3545' : 
               '#009205';
      case 'announcement':
        return '#007bff';
      case 'reminder':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
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
  // Show the modal instead of the dropdown
  setShowNotificationModal(true); 
  setShowProfileMenu(false);
  // Don't show the dropdown anymore
  setShowNotifications(false);
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
        { 
          method: "POST", 
          body: formData 
        }
      );
      
      if (!res.ok) {
        throw new Error(`Upload failed with status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.secure_url) {
        // Update temp data immediately for preview
        setTempProfileData(prev => ({
          ...prev,
          profile_picture: data.secure_url,
        }));
        
        // Also update the parent component's data if needed
        if (typeof setProfileData === 'function') {
          setProfileData(prev => ({...prev, profile_picture: data.secure_url}));
        }
        
        return data.secure_url;
      } else {
        alert("Upload failed: No secure URL returned");
        return null;
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(`Upload error: ${err.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

const saveProfileChanges = async () => {
  // Use the profile prop directly instead of localStorage
  if (!profile) {
    alert("User not found. Please login again.");
    navigate("/");
    return;
  }

  const userId = profile.id;
  const userRole = profile.role;
  
  console.log("Debug - User data:", {
    userId,
    userRole,
    profileData: profile,
    adminData: admin
  });
  
  if (!userId || !userRole) {
    alert("User not found. Please login again.");
    navigate("/");
    return;
  }

  // Validate required fields
  if (!tempProfileData.full_name?.trim()) {
    alert("Full name is required");
    return;
  }

  try {
    // Get JWT token if it exists (from your auth system)
    const token = localStorage.getItem("token");
    
    // Prepare request body based on user role
    // Ensure all values are defined (not undefined)
    let endpoint = "";
    let body = {};

    // Clean up data - ensure no undefined values
    const cleanFullName = tempProfileData.full_name?.trim() || "";
    const cleanEmail = tempProfileData.email || ""; // Get email from temp data
    const cleanProfilePicture = tempProfileData.profile_picture || "";
    const cleanDepartment = tempProfileData.department || "";

    console.log("Cleaned data:", {
      cleanFullName,
      cleanEmail,
      cleanProfilePicture,
      cleanDepartment
    });

    if (userRole === "admin") {
      endpoint = `${API_URL}/api/auth/updateProfile/${userId}`;
      body = {
        full_name: cleanFullName,
        email: cleanEmail, // Add email field
        profile_picture: cleanProfilePicture
      };
    } else if (userRole === "office_head" || userRole === "mayor") {
      endpoint = `${API_URL}/api/authAdmin/update/${userId}`;
      body = {
        full_name: cleanFullName,
        email: cleanEmail, // Add email field
        profile_picture: cleanProfilePicture,
        department: cleanDepartment
      };
    } else {
      alert("Invalid user role");
      return;
    }

    // Remove any undefined properties from the body
    Object.keys(body).forEach(key => {
      if (body[key] === undefined) {
        delete body[key];
      }
    });

    console.log("Saving to endpoint:", endpoint);
    console.log("Sending data:", body);
    console.log("JSON stringified:", JSON.stringify(body));
    console.log("Token exists:", !!token);

    const headers = {
      "Content-Type": "application/json"
    };

    // Add Authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(body)
    });

    console.log("Response status:", res.status);

    // Try to get the response text first
    const responseText = await res.text();
    let result;
    
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse JSON:", responseText);
      result = { message: responseText || "Server error" };
    }

    console.log("Save response:", result);

    if (res.ok) {
      alert("✅ Profile updated successfully!");
      
      // Update parent component state
      if (typeof setProfileData === 'function') {
        setProfileData(prev => ({
          ...prev,
          full_name: cleanFullName,
          email: cleanEmail,
          profile_picture: cleanProfilePicture
        }));
      }
      
      // Update admin state if exists
      if (admin && typeof setAdmin === 'function') {
        setAdmin(prev => ({
          ...prev,
          full_name: cleanFullName,
          email: cleanEmail,
          profile_picture: cleanProfilePicture
        }));
      }
      
      setShowProfileModal(false);
      
      // Optionally refresh after a delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } else {
      console.error("Server error details:", result);
      
      // More detailed error messages
      if (res.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/";
      } else if (res.status === 404) {
        alert("User not found on server. Please contact support.");
      } else if (res.status === 500) {
        // Show backend error message
        const errorMsg = result.error || result.message || "Internal server error";
        alert(`Server error: ${errorMsg}\n\nPlease contact support if this continues.`);
      } else {
        alert(result.message || `Failed to update profile. Status: ${res.status}`);
      }
    }
  } catch (err) {
    console.error("❌ Network error updating profile:", err);
    alert("Network error. Please check your connection and try again.");
  }
};

  // Count unread notifications - check both isRead and is_read for compatibility
// Count unread notifications - check both isRead and is_read for compatibility
const unreadCount = notifications.filter(n => {
  // Check if notification is unread
  const isRead = n.isRead || n.read || n.notification?.is_read || n.notification?.read;
  return !isRead;
}).length;


  // Modal Styles (unchanged)
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

    formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '15px'
  },
  
  formLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#495057'
  },
  
  textInput: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box'
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
                  background: "#007bff",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  cursor: "pointer",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <FontAwesomeIcon icon={isUploading ? faSpinner : faCamera} spin={isUploading} />
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
                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                      alert("File size must be less than 5MB");
                      return;
                    }
                    
                    // Validate file type
                    if (!file.type.match('image.*')) {
                      alert("Please select an image file");
                      return;
                    }
                    
                    const imageUrl = await handleProfilePictureUpload(file);
                    if (imageUrl) {
                      console.log("Upload successful:", imageUrl);
                    }
                  }
                  e.target.value = ""; // Reset file input
                }}
              />
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

      {showNotificationModal && (
        <div style={modalStyles.modalOverlay}>
          <div style={{
            ...modalStyles.modalContent,
            width: '500px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={modalStyles.modalHeader}>
              <h2 style={modalStyles.modalTitle}>
                <FontAwesomeIcon icon={faBell} style={{marginRight: '10px'}} /> 
                All Notifications
              </h2>
            </div>

            <div style={{
              padding: '20px',
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {viewAllNotifications.length > 0 ? (
                viewAllNotifications.map((notification, index) => {
                  // Create a unique key for each notification
                  const uniqueKey = `${notification.id}-${index}-${notification.createdAt}`;
                  
                  // Check if notification is unread
                  const isUnread = !notification.isRead && !notification.read && 
                                  !notification.notification?.is_read && 
                                  !notification.notification?.read;
                  
                  return (
                    <div 
                      key={uniqueKey}
                      style={{
                        background: isUnread ? '#ffffff' : '#f8f9fa',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                        padding: '15px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                        borderLeft: isUnread ? '4px solid #009205' : '4px solid transparent'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Try to use notificationId first, then fall back to id
                        const idToMark = notification.notificationId || notification.id;
                        console.log('Clicking notification with ID:', idToMark, 'Full object:', notification);
                        markAsRead(idToMark);
                      }}
                    >
                      <div style={{display: 'flex', alignItems: 'flex-start', gap: '12px'}}>
                        <div style={{
                          background: getNotificationColor(notification.type, notification.status),
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          flexShrink: 0
                        }}>
                          <FontAwesomeIcon 
                            icon={getNotificationIcon(notification.type, notification.status)} 
                            size="sm"
                          />
                        </div>
                        
                        <div style={{flex: 1}}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '5px'
                          }}>
                            <p style={{
                              margin: 0,
                              fontWeight: isUnread ? '600' : '400',
                              color: isUnread ? '#212529' : '#495057',
                              fontSize: '14px',
                              lineHeight: '1.4'
                            }}>
                              {notification.message}
                            </p>
                            {isUnread && (
                              <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#009205',
                                flexShrink: 0,
                                marginLeft: '10px'
                              }} />
                            )}
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '8px'
                          }}>
                            <span style={{
                              fontSize: '12px',
                              color: '#6c757d',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}>
                              <FontAwesomeIcon icon={faClock} size="xs" />
                              {getTimeAgo(notification.createdAt)}
                            </span>
                            
                            {notification.leaveType && (
                              <span style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: getNotificationColor(notification.type, notification.status) + '20',
                                color: getNotificationColor(notification.type, notification.status),
                                fontWeight: '500'
                              }}>
                                {notification.leaveType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#6c757d'
                }}>
                  <FontAwesomeIcon 
                    icon={faBell} 
                    style={{fontSize: '48px', color: '#adb5bd', marginBottom: '15px'}}
                  />
                  <h4 style={{margin: '0 0 10px 0', color: '#495057'}}>
                    No notifications yet
                  </h4>
                  <p style={{margin: 0, fontSize: '14px'}}>
                    You're all caught up! Check back later for updates.
                  </p>
                </div>
              )}
            </div>

            <div style={{
              padding: '15px 20px',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8f9fa',
              borderBottomLeftRadius: '12px',
              borderBottomRightRadius: '12px'
            }}>
              <span style={{fontSize: '13px', color: '#6c757d'}}>
                {viewAllNotifications.filter(n => !n.isRead && !n.is_read).length} unread • {viewAllNotifications.length} total
              </span>
              <button 
                onClick={() => setShowNotificationModal(false)}
                style={{
                  background: '#009205',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                }}
              >
                Close
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

              <button 
                style={modalStyles.settingsSectionButton}
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowPasswordModal(true);
                }}
              >
                <FontAwesomeIcon icon={faKey} style={{marginRight: '10px'}} />
                Change Password
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
                    <div style={{display: "flex", gap: "5px"}}>
                      {!version.is_active && (
                        <>
                          <button 
                            style={modalStyles.smallButton}
                            onClick={() => activateTermsVersion(version.id)}
                          >
                            Activate
                          </button>
                          <button 
                            style={{...modalStyles.smallButton, background: "#dc3545"}}
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
                <FontAwesomeIcon icon={faCalendarDay} style={{marginRight: "10px"}} /> Local Holiday Settings
              </h2>
              <button 
                style={modalStyles.closeButton}
                onClick={() => {
                  setShowLocalHolidayModal(false);
                  setEditingHoliday(null);
                  setNewHoliday({ date: "", name: "", description: "", is_recurring: false });
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div style={{padding: "20px"}}>
              {/* Add/Edit Holiday Form */}
              <div style={modalStyles.holidayFormSection}>
                <h4 style={modalStyles.sectionTitle}>
                  {editingHoliday ? "Edit Local Holiday" : "Add Local Holiday"}
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
                      {editingHoliday ? "Update Holiday" : "Save Holiday"}
                    </button>
                    
                    {editingHoliday && (
                      <button 
                        style={modalStyles.cancelButton}
                        onClick={() => {
                          setEditingHoliday(null);
                          setNewHoliday({ date: "", name: "", description: "", is_recurring: false });
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
                            <FontAwesomeIcon icon={faCalendarAlt} style={{marginRight: "8px"}} />
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
                    <p style={{fontSize: "14px", color: "#868e96", marginTop: "5px"}}>
                      Add local holidays to appear on the calendar.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={modalStyles.modalOverlay}>
          <div style={{
            ...modalStyles.modalContent,
            width: '450px'
          }}>
            <div style={modalStyles.modalHeader}>
              <h2 style={modalStyles.modalTitle}>
                <FontAwesomeIcon icon={faKey} style={{marginRight: '10px'}} /> 
                Change Password
              </h2>
              <button 
                style={modalStyles.closeButton}
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              {passwordSuccess && (
                <div style={{
                  background: '#d4edda',
                  color: '#155724',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  border: '1px solid #c3e6cb'
                }}>
                  {passwordSuccess}
                </div>
              )}

              {passwordError && (
                <div style={{
                  background: '#f8d7da',
                  color: '#721c24',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  border: '1px solid #f5c6cb'
                }}>
                  {passwordError}
                </div>
              )}

              <div style={modalStyles.formGroup}>
                <label style={modalStyles.formLabel}>Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value
                  })}
                  style={modalStyles.textInput}
                  placeholder="Enter current password"
                />
              </div>

              <div style={modalStyles.formGroup}>
                <label style={modalStyles.formLabel}>New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value
                  })}
                  style={modalStyles.textInput}
                  placeholder="Enter new password (min. 6 characters)"
                />
              </div>

              <div style={modalStyles.formGroup}>
                <label style={modalStyles.formLabel}>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value
                  })}
                  style={modalStyles.textInput}
                  placeholder="Confirm new password"
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '10px',
                marginTop: '20px'
              }}>
                <button 
                  style={{
                    flex: 1,
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: isChangingPassword ? 0.7 : 1
                  }}
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin style={{marginRight: '8px'}} />
                      Changing...
                    </>
                  ) : 'Change Password'}
                </button>
                
                <button 
                  style={{
                    flex: 1,
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  disabled={isChangingPassword}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default ProfileDropdown;