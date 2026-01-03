import React from 'react';
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
  faPaperPlane,
  faPaperclip,
  faSmile,
  faSearch,
  faCircle,
  faCheckDouble,
  faCheck,
  faTimes,
  faBars,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useRef } from 'react';
import './message-responsive.css';

function Messages() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [adminType, setAdminType] = useState('');
  const [onlineStatus, setOnlineStatus] = useState({});
  const [typingStatus, setTypingStatus] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState(null);
  const typingTimeoutRef = useRef(null);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [role, setRole] = useState(localStorage.getItem("role") || "admin");
  const getFullId = (type, id) => `${type}:${id}`;

  
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

  const API_URL = "https://ezleave-admin-api.onrender.com" || "http://localhost:5000";

  useEffect(() => {
    if (isMobile && selectedUser) {
      setIsUserListOpen(false);
    } else if (isMobile && !selectedUser) {
      setIsUserListOpen(true);
    }
  }, [selectedUser, isMobile]);

// REPLACE your existing useEffect for admin data with this:
useEffect(() => {
  const checkAndConnect = async () => {
    const admin = JSON.parse(localStorage.getItem("admin"));
    if (admin) {
      console.log("👤 Found admin data:", admin);
      setAdminData(admin);
      
      // ✅ SIMPLIFIED FIX: Determine admin type based on role
      let adminType = '';
      
      // Check the role field first (most reliable)
      if (admin.role) {
        console.log(`🎭 Admin role detected: ${admin.role}`);
        
        // Check for mayor role
        if (admin.role.toLowerCase() === 'mayor') {
          adminType = 'admin_account'; // Mayors should be admin_account type
        } 
        // Check for office_head role
        else if (admin.role.toLowerCase() === 'office_head') {
          adminType = 'admin_account'; // Office heads should also be admin_account type
        }
        // Check for regular admin roles
        else if (admin.role.toLowerCase().includes('admin')) {
          // Check if it's useradmin or admin_account
          if (admin.role.toLowerCase().includes('useradmin') || admin.role === 'admin') {
            adminType = 'useradmin';
          } else {
            adminType = 'admin_account';
          }
        } else {
          // Default to user if no admin role detected
          adminType = 'user';
        }
      } 
      // If no role field, check table field
      else if (admin.table) {
        console.log(`📊 Admin table detected: ${admin.table}`);
        adminType = admin.table === 'useradmin' ? 'useradmin' : 
                   admin.table === 'admin_accounts' ? 'admin_account' : 'user';
      }
      // Last resort: check localStorage for stored admin type
      else {
        const storedAdminType = localStorage.getItem('admin_type');
        if (storedAdminType) {
          adminType = storedAdminType;
          console.log(`💾 Using stored admin type: ${adminType}`);
        } else {
          // Default to useradmin for safety
          adminType = 'useradmin';
          console.log(`⚠️ No admin type detected, defaulting to: ${adminType}`);
        }
      }
      
      console.log(`🔧 FINAL admin type: ${adminType}`);
      setAdminType(adminType);
      
      // Store admin type in localStorage for future use
      localStorage.setItem('admin_type', adminType);
      
      // Initialize WebSocket connection
      setTimeout(() => {
        initializeWebSocket();
      }, 500);
    } else {
      console.log('❌ No admin data found in localStorage');
      // Redirect to login if no admin data
      navigate("/");
    }
  };
  
  checkAndConnect();
  
  // Cleanup function
  return () => {
    if (socket) {
      console.log('🧹 Cleaning up WebSocket connection');
      socket.close();
    }
  };
}, []);

// KEEP your existing initializeWebSocket function as is

  useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);

 

  const closeMobileMenus = () => {
  if (isMobile) {
    setIsSidebarOpen(false);
    setIsUserListOpen(false);
  }
};
useEffect(() => {
  if (adminData && adminType) {
    initializeWebSocket();
  }

  return () => {
    if (socket) {
      socket.close();
    }
  };
}, [adminData, adminType]);

 const initializeWebSocket = () => {
    // Check if we have the required data
    if (!adminData || !adminData.id || !adminType) {
      console.error('❌ Cannot initialize WebSocket: Missing admin data');
      setConnectionStatus('Missing admin data');
      return;
    }
    
    // ✅ Connect with proper parameters
    let connectUrl;
    
    if (adminType === 'useradmin') {
      connectUrl = `${API_URL.replace('http', 'ws')}/?adminId=${adminData.id}&adminType=useradmin`;
    } else if (adminType === 'admin_account') {
      connectUrl = `${API_URL.replace('http', 'ws')}/?adminId=${adminData.id}&adminType=admin_account`;
    } else {
      // For regular users
      connectUrl = `${API_URL.replace('http', 'ws')}/?userId=${adminData.id}&userType=user`;
    }
    
    console.log(`🔗 Connecting to WebSocket: ${connectUrl}`);
    setConnectionStatus('Connecting...');
    
    const ws = new WebSocket(connectUrl);
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected successfully');
      setSocket(ws);
      setConnectionStatus('Connected');
      
      // Send connection message
      ws.send(JSON.stringify({
        type: 'connection',
        adminId: adminData.id,
        adminType: adminType,
        timestamp: new Date().toISOString()
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📩 WebSocket message received type:', data.type, 'data:', data);

        switch(data.type) {
          case 'connection_established':
            console.log('✅ WebSocket connection confirmed:', data.clientId);
            setConnectionStatus(`Connected as ${data.clientId}`);
            break;
          case 'new_message':
            console.log('💌 New message via WebSocket:', data);
            if (data.message) {
              handleNewMessage(data.message);
            }
            break;
          case 'typing':
            console.log('⌨️ Typing indicator:', data);
            if (data.senderId && data.senderType) {
              handleTypingStatus(`${data.senderType}:${data.senderId}`, data.isTyping);
            }
            break;
          case 'online_status':
            console.log('🟢 Online status:', data);
            handleOnlineStatus(data.userId, data.userType, data.isOnline);
            break;
          case 'message_sent':
            console.log('✈️ Message sent confirmation:', data);
            // You can update UI to show message was sent successfully
            break;
          case 'pong':
            // Heartbeat response, ignore
            break;
          default:
            console.log('📨 Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error, event.data);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionStatus('Connection Error');
    };

    ws.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', event.code, event.reason);
      setConnectionStatus('Disconnected');
      setSocket(null);
      
      // Try to reconnect after 3 seconds
      setTimeout(() => {
        if (adminData && adminType) {
          console.log('🔄 Attempting to reconnect WebSocket...');
          initializeWebSocket();
        }
      }, 3000);
    };
  };

const handleNewMessage = (messageData) => {
  if (!selectedUser || !adminData || !adminType) return;

  const myFullId = getFullId(adminType, adminData.id);
  const selectedFullId = getFullId(
    selectedUser.account_type,
    selectedUser.id
  );

  const { sender_id, receiver_id } = messageData;

  const isRelevant =
    (sender_id === selectedFullId && receiver_id === myFullId) ||
    (sender_id === myFullId && receiver_id === selectedFullId);

  if (!isRelevant) return;

  setMessages(prev => {
    if (prev.some(m => m.id === messageData.id)) return prev;

    return [
      ...prev,
      {
        id: messageData.id,
        sender: sender_id === myFullId ? 'me' : 'other',
        text: messageData.message,
        time: new Date(messageData.time).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        pinned: messageData.pinned || false,
        read_status: messageData.read_status || false,
        delivered: true
      }
    ];
  });

  requestAnimationFrame(() => {
    const el = document.getElementById('messagesArea');
    if (el) el.scrollTop = el.scrollHeight;
  });

  // Sidebar update stays
  setUsers(prev =>
    prev.map(user => {
      const userFullId = getFullId(user.account_type, user.id);

      if (userFullId === sender_id || userFullId === receiver_id) {
        return {
          ...user,
          message: messageData.message,
          time: new Date(messageData.time).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
        };
      }
      return user;
    })
  );
};


  const handleMessageRead = (messageId, senderId, senderType) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, read_status: true } : msg
    ));
  };

  const handleTypingStatus = (senderId, senderType, isTyping) => {
    if (selectedUser && 
        selectedUser.id.toString() === senderId.split(':')[1] && 
        selectedUser.account_type === senderType) {
      setIsTyping(isTyping);
    }
  };

  const handleOnlineStatus = (userId, userType, isOnline) => {
    setOnlineStatus(prev => ({
      ...prev,
      [`${userType}:${userId}`]: isOnline
    }));
  };

  const handleMessageDelivered = (messageId) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, delivered: true } : msg
    ));
  };

  // Handle typing indicator
  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    if (socket && socket.readyState === WebSocket.OPEN && selectedUser) {
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Send typing started
      socket.send(JSON.stringify({
        type: 'typing',
        isTyping: true,
        receiverId: selectedUser.id,
        receiverType: selectedUser.account_type
      }));

      // Set timeout to send typing stopped
      typingTimeoutRef.current = setTimeout(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'typing',
            isTyping: false,
            receiverId: selectedUser.id,
            receiverType: selectedUser.account_type
          }));
        }
      }, 1000);
    }
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

    if (socket) {
      socket.close();
    }

    localStorage.removeItem("admin");
    navigate("/");
  };

  // Fetch all accounts for messaging
  useEffect(() => {
    if (adminData && adminType) {
      fetchAllAccounts();
    }
  }, [adminData, adminType]);

  // Fetch conversation when a user is selected
  useEffect(() => {
    if (selectedUser && adminData && adminType) {
      fetchConversation(selectedUser.id, selectedUser.account_type);
      // Mark messages as read when conversation is opened
      markMessagesAsRead(selectedUser.id, selectedUser.account_type);
    }
  }, [selectedUser, adminData, adminType]);

  const fetchAllAccounts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `${API_URL}/api/admin/messages/accounts?current_admin_id=${adminData.id}&current_admin_type=${adminType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Transform API response to match component format
          const transformedUsers = data.data.map(account => ({
            id: account.id,
            name: account.full_name || `${account.first_name} ${account.last_name}`,
            account_type: account.account_type,
            email: account.email,
            role: account.role,
            department: account.department,
            message: "",
            time: "",
            unread: 0
          }));
          
          setUsers(transformedUsers);
        }
      }
    } catch (error) {
      console.error('Error fetching all accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (contactId, contactType) => {
    try {
      setMessageLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `${API_URL}/api/admin/messages/conversation/${adminData.id}/${adminType}/${contactId}/${contactType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const formattedMessages = data.data.map(msg => {
            const isFromMe = msg.sender_id === `${adminType}:${adminData.id}`;
            
            return {
              id: msg.id,
              sender: isFromMe ? 'me' : 'other',
              text: msg.message,
              time: new Date(msg.time).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              pinned: msg.pinned,
              read_status: msg.read_status,
              delivered: true // Assuming fetched messages are delivered
            };
          });
          setMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setMessageLoading(false);
    }
  };

const sendMessage = async (receiverId, receiverType, messageText) => {
  try {
    const token = localStorage.getItem("token");
    
    const requestBody = {
      sender_id: adminData.id,
      sender_type: adminType,
      receiver_id: receiverId,
      receiver_type: receiverType,
      message: messageText
    };

    console.log('📤 Sending message via REST API:', requestBody);

    console.log('🔍 DEBUG sendMessage - Full request details:');
    console.log('📤 Request Body:', requestBody);
    console.log('👤 adminData:', adminData);
    console.log('🏷️ adminType:', adminType);
    console.log('📍 selectedUser:', selectedUser);

    // ✅ FIX: First send via WebSocket for real-time
    if (socket && socket.readyState === WebSocket.OPEN) {
      const wsMessage = {
        type: 'new_message',
        receiverId: receiverId,
        receiverType: receiverType,
        message: {
          id: Date.now(), // Temporary ID
          sender_id: `${adminType}:${adminData.id}`,
          sender_type: adminType,
          receiver_id: `${receiverType}:${receiverId}`,
          receiver_type: receiverType,
          message: messageText,
          time: new Date().toISOString(),
          sender_name: adminData.full_name || adminData.name,
          receiver_name: selectedUser?.name || '',
          pinned: false,
          read_status: false
        }
      };
      
      socket.send(JSON.stringify(wsMessage));
      console.log('📤 Message sent via WebSocket');
    }

    // Then send via REST API to save to database
    const response = await fetch(`${API_URL}/api/admin/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });
    
    let data;
    try {
      data = await response.json();
      console.log('📨 Server response:', data);
    } catch (e) {
      console.error('❌ Failed to parse response:', e);
      return false;
    }
    
    if (response.ok && data.success) {
      // Update the message with the real ID from database
      const newMessage = {
        id: data.data?.id || Date.now(),
        sender: 'me',
        text: messageText,
        time: new Date(data.data?.time || Date.now()).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        pinned: false,
        delivered: true,
        read_status: false
      };
      
      
      // Send typing stopped
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'typing',
          isTyping: false,
          receiverId: receiverId,
          receiverType: receiverType
        }));
      }
      
      // Scroll to bottom
      setTimeout(() => {
        const messagesArea = document.getElementById('messagesArea');
        if (messagesArea) {
          messagesArea.scrollTop = messagesArea.scrollHeight;
        }
      }, 100);
      
      return true;
    } else {
      console.error('❌ Server error response:', data);
      alert(`Error: ${data.message || 'Failed to send message'}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Network error sending message:', error);
    alert('Network error. Check console for details.');
    return false;
  }
};

  const markMessagesAsRead = async (contactId, contactType) => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/api/admin/messages/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          admin_id: adminData.id,
          admin_type: adminType,
          contact_id: contactId,
          contact_type: contactType
        })
      });
      
      // Send read status via WebSocket
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'messages_read',
          senderId: contactId,
          senderType: contactType
        }));
      }
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const togglePinMessage = async (messageId, currentlyPinned) => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/api/admin/messages/pin/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pinned: !currentlyPinned
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, pinned: !currentlyPinned } : msg
          ));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error toggling pin status:', error);
      return false;
    }
  };

  const handleSend = async () => {
  if (input.trim() !== '' && selectedUser && adminData && adminType) {
    // Immediately add message to UI
    const tempMessage = {
      id: Date.now(), // Temporary ID
      sender: 'me',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      pinned: false,
      delivered: false,
      read_status: false
    };
    
    setMessages(prev => [...prev, tempMessage]);
    
    // Clear input
    const messageText = input.trim();
    setInput('');
    
    // Scroll to bottom
    setTimeout(() => {
      const messagesArea = document.getElementById('messagesArea');
      if (messagesArea) {
        messagesArea.scrollTop = messagesArea.scrollHeight;
      }
    }, 100);
    
    // Send message to server
    const success = await sendMessage(
      selectedUser.id, 
      selectedUser.account_type, 
      messageText
    );
    
    if (!success) {
      // If sending failed, mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id ? { ...msg, delivered: false, error: true } : msg
      ));
    }
  }
};

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar color based on user type
  const getAvatarColor = (accountType) => {
    switch(accountType) {
      case 'user': return '#4CAF50';
      case 'useradmin': return '#2196F3';
      case 'admin_account': return '#FF9800';
      default: return '#9C27B0';
    }
  };

  // Get account type badge
  const getAccountTypeBadge = (accountType) => {
    switch(accountType) {
      case 'user': return { text: 'User', color: '#4CAF50' };
      case 'useradmin': return { text: 'Admin', color: '#2196F3' };
      case 'admin_account': return { text: 'Staff', color: '#FF9800' };
      default: return { text: 'Unknown', color: '#9C27B0' };
    }
  };

  const getChatSidebarClass = () => {
    if (!isMobile) return '';
    
    if (selectedUser) {
      return 'hidden'; // Hide sidebar when user is selected
    }
    
    return isUserListOpen ? 'open' : 'closed';
  };

  const getChatAreaClass = () => {
    if (!isMobile) return '';
    return selectedUser ? 'visible' : 'hidden';
  };

  // Check if user is online
  const isUserOnline = (userId, userType) => {
    return onlineStatus[`${userType}:${userId}`] || false;
  };

  return (
    <div style={styles.dashboardContainer}>

    <div className="mobile-header">
      <button 
        className="hamburger"
        onClick={() => setIsSidebarOpen(true)}
      >
        <FontAwesomeIcon icon={faBars} />
      </button>
      <img src={require('./images/logo_ez.png')} alt="logo" className="mobile-logo" />
      
    </div>

    {/* Mobile Sidebar Overlay */}
    {isSidebarOpen && (
      <div className="mobile-overlay" onClick={() => setIsSidebarOpen(false)}></div>
    )}

    {/* Sidebar - Updated with mobile classes */}
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

      {/* Desktop Logo */}
      <img 
        src={require('./images/logo_ez.png')} 
        alt="logo" 
        style={styles.logo} 
        className='logo-desktop'
      />

      {/* Sidebar Menu - Updated with onClick to close on mobile */}
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
                onClick={closeMobileMenus}
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
              closeMobileMenus();
            }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} style={styles.icon} /> Logout
          </Link>
        </li>
      </ul>
    </div>

      <div className='desktop-header' style={styles.header}>
        <input 
          type="text" 
          placeholder="Search..." 
          style={styles.search} 
          value={searchQuery}
          onChange={handleSearch}
        />
        <FontAwesomeIcon icon={faBell} style={styles.iconBell} />
      </div>

      <div className='desktop-sidebar' style={styles.sidebar}>
        <img src={require('./images/logo_ez.png')} alt="logo" style={styles.logo} />
        <ul style={styles.sidebarList}>
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
                >
                  <FontAwesomeIcon icon={item.icon} style={styles.icon} /> {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className='chatContainerMobile' style={styles.chatContainer}>
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

        <div className={`chatSidebar ${getChatSidebarClass()}`} style={styles.chatSidebar}>
          <div style={styles.searchContainer}>
            <FontAwesomeIcon icon={faSearch} style={styles.searchIcon} />
            <input 
              placeholder="Search contacts..." 
              style={styles.chatSearchBar} 
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          
          {loading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingSpinner}></div>
              <p style={styles.loadingText}>Loading contacts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={styles.noConversations}>
              <p style={styles.noConversationsText}>No contacts found</p>
            </div>
          ) : (
            <div style={styles.userList}>
              {filteredUsers.map((user) => {
                const isSelected = selectedUser && selectedUser.id === user.id;
                const avatarColor = getAvatarColor(user.account_type);
                const accountTypeBadge = getAccountTypeBadge(user.account_type);
                const isOnline = isUserOnline(user.id, user.account_type);

                return (
                  <div
                    key={`${user.account_type}-${user.id}`}
                    style={{
                      ...styles.userItem,
                      backgroundColor: isSelected ? '#F1FFED' : 'transparent',
                    }}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div style={styles.userAvatarContainer}>
                      <div 
                        style={{
                          ...styles.userAvatar,
                          backgroundColor: avatarColor
                        }}
                      >
                        {getUserInitials(user.name)}
                        {isOnline && (
                          <div style={styles.onlineIndicator}></div>
                        )}
                      </div>
                      {user.unread > 0 && (
                        <div style={styles.unreadBadge}>{user.unread}</div>
                      )}
                    </div>
                    <div style={styles.userInfo}>
                      <div style={styles.userMainInfo}>
                        <div style={{
                          ...styles.username,
                          color: isSelected ? '#009205' : '#fff'
                        }}>
                          {user.name}
                          {isOnline && (
                            <span style={styles.onlineText}> • Online</span>
                          )}
                        </div>
                        <div style={{
                          ...styles.accountTypeBadge,
                          backgroundColor: accountTypeBadge.color
                        }}>
                          {accountTypeBadge.text}
                        </div>
                      </div>
                      <div style={{
                        ...styles.previewText,
                        color: isSelected ? '#009205' : '#fff'
                      }}>
                        {user.message || 'No messages yet'}
                      </div>
                      {user.role && (
                        <div style={{
                          ...styles.userRole,
                          color: isSelected ? '#009205' : '#aaa'
                        }}>
                          {user.role}
                        </div>
                      )}
                    </div>
                    <div style={{
                      ...styles.time,
                      color: isSelected ? '#009205' : '#fff'
                    }}>
                      {user.time}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat Area - Only show when a user is selected */}
        {selectedUser && (
          <div className={`chatArea ${getChatAreaClass()}`} style={styles.chatArea}>
            <>
            {isMobile && (
                <button 
                  style={{
                    position: 'absolute',
                    top: '15px',
                    left: '15px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '18px',
                    color: '#009205',
                    cursor: 'pointer',
                    zIndex: 10
                  }}
                  onClick={() => {
                    setSelectedUser(null);
                    setIsUserListOpen(true);
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              )}

              <div className='chatHeader' style={styles.chatHeader}>
                <div className='selectedUserInfo' style={styles.selectedUserInfo}>
                  <FontAwesomeIcon icon={faArrowLeft} style={styles.backIcon} 
                    onClick={() => {
                      setSelectedUser(null);
                      setIsUserListOpen(true);
                    }} 
                  />
                  <div className='avatarContainer' style={styles.avatarContainer}>
                    <div 
                      className='userAvatarLarge'
                      style={{
                        ...styles.userAvatarLarge,
                        backgroundColor: getAvatarColor(selectedUser.account_type)
                      }}
                    >
                      {getUserInitials(selectedUser.name)}
                      {isUserOnline(selectedUser.id, selectedUser.account_type) && (
                        <div style={styles.onlineIndicatorLarge}></div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className='headerName' style={styles.headerName}>
                      {selectedUser.name}
                      <span 
                      className='accountTypeBadgeHeader'
                      style={{
                        ...styles.accountTypeBadgeHeader,
                        backgroundColor: getAccountTypeBadge(selectedUser.account_type).color
                      }}>
                        {getAccountTypeBadge(selectedUser.account_type).text}
                      </span>
                      {isUserOnline(selectedUser.id, selectedUser.account_type) && (
                        <span className='onlineStatus' style={styles.onlineStatus}>• Online</span>
                      )}
                    </div>
                    <div className='userDetails' style={styles.userDetails}>
                      {selectedUser.email && (
                        <span className='userEmail' style={styles.userEmail}>{selectedUser.email}</span>
                      )}
                      {selectedUser.department && (
                        <span className='userDepartment' style={styles.userDepartment}>{selectedUser.department}</span>
                      )}
                    </div>
                    {isTyping && (
                      <div style={styles.typingIndicator}>
                        <div style={styles.typingDots}>
                          <div style={styles.typingDot}></div>
                          <div style={styles.typingDot}></div>
                          <div style={styles.typingDot}></div>
                        </div>
                        <span style={styles.typingText}>typing...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className='messagesArea' style={styles.messagesArea} id="messagesArea">
                {messageLoading ? (
                  <div style={styles.loadingContainer}>
                    <div style={styles.loadingSpinner}></div>
                    <p style={styles.loadingText}>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={styles.noMessages}>
                    <FontAwesomeIcon icon={faEnvelope} style={styles.noMessagesIcon} />
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        style={msg.sender === 'me' ? styles.messageRight : styles.messageLeft}
                        className={msg.sender === 'me' ? 'messageRight' : 'messageLeft'}
                      >
                        <div style={styles.messageContent}>
                          <div className='messageBox' style={styles.messageBox(msg.sender === 'me')}>
                            {msg.text}
                            {msg.pinned && (
                              <FontAwesomeIcon 
                                icon={faPaperclip} 
                                style={styles.pinIcon} 
                                onClick={() => togglePinMessage(msg.id, msg.pinned)}
                                title="Pinned message"
                              />
                            )}
                          </div>
                          <div style={styles.messageFooter}>
                            <div className='messageTime' style={styles.messageTime}>{msg.time}</div>
                            {msg.sender === 'me' && (
                              <div style={styles.messageStatus}>
                                {msg.read_status ? (
                                  <FontAwesomeIcon icon={faCheckDouble} style={styles.readIcon} />
                                ) : msg.delivered ? (
                                  <FontAwesomeIcon icon={faCheckDouble} style={styles.deliveredIcon} />
                                ) : (
                                  <FontAwesomeIcon icon={faCheck} style={styles.sentIcon} />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {isMobile && !isUserListOpen && !selectedUser && (
                <button 
                  className="toggleUserListBtn"
                  onClick={() => setIsUserListOpen(true)}
                >
                  <FontAwesomeIcon icon={faUsers} />
                </button>
              )}

              <div className='inputArea' style={styles.inputArea}>
                <button style={styles.emojiButton}>
                  <FontAwesomeIcon icon={faSmile} />
                </button>
                <button style={styles.attachButton}>
                  <FontAwesomeIcon icon={faPaperclip} />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type your message here..."
                  style={styles.inputField}
                  className='inputField'
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSend();
                    }
                  }}
                />
                <button 
                  onClick={handleSend} 
                  style={styles.sendButton}
                  disabled={!input.trim()}
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </div>
            </>
          </div>
        )}

        {/* Show welcome screen when no user is selected on desktop */}
        {!selectedUser && !isMobile && (
          <div className='chatArea' style={styles.chatArea}>
            <div style={styles.noChatSelected}>
              <div style={styles.welcomeIcon}>
                <FontAwesomeIcon icon={faEnvelope} style={styles.welcomeIconStyle} />
              </div>
              <h3>Welcome to Messages</h3>
              <p>Select a contact to start messaging</p>
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
  chatContainer: {
    display: 'flex',
    marginLeft: '280px',
    marginTop: '60px',
    width: 'calc(100% - 280px)',
    height: 'calc(100vh - 80px)',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  chatSidebar: {
    width: '350px',
    backgroundColor: '#009205',
    padding: '15px',
    overflowY: 'auto',
    borderRadius: '10px 0 0 10px',
    display: 'flex',
    flexDirection: 'column',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: '15px',
  },
  searchIcon: {
    position: 'absolute',
    left: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#888',
  },
  chatSearchBar: {
    width: '100%',
    padding: '10px 15px 10px 40px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    fontSize: '14px',
  },
  userList: {
    flex: 1,
    overflowY: 'auto',
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    marginBottom: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    }
  },
  userAvatarContainer: {
    position: 'relative',
    marginRight: '12px',
  },
  userAvatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px',
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: '2px',
    right: '2px',
    width: '10px',
    height: '10px',
    backgroundColor: '#4CAF50',
    borderRadius: '50%',
    border: '2px solid #009205',
  },
  onlineIndicatorLarge: {
    position: 'absolute',
    bottom: '5px',
    right: '5px',
    width: '12px',
    height: '12px',
    backgroundColor: '#4CAF50',
    borderRadius: '50%',
    border: '2px solid white',
  },
  unreadBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: '#ff4444',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userMainInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  username: {
    fontWeight: 'bold',
    fontSize: '14px',
    color: 'white',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  onlineText: {
    fontSize: '11px',
    color: '#4CAF50',
    fontWeight: 'normal',
  },
  accountTypeBadge: {
    fontSize: '10px',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '10px',
    fontWeight: 'bold',
  },
  accountTypeBadgeHeader: {
    fontSize: '11px',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontWeight: 'bold',
    marginLeft: '10px',
    verticalAlign: 'middle',
  },
  previewText: {
    fontSize: '12px',
    color: 'white',
    opacity: 0.8,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginBottom: '2px',
  },
  userRole: {
    fontSize: '11px',
    fontStyle: 'italic',
  },
  userEmail: {
    fontSize: '12px',
    color: '#666',
    marginRight: '10px',
  },
  userDepartment: {
    fontSize: '12px',
    color: '#009205',
    backgroundColor: '#F1FFED',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  time: {
    fontSize: '11px',
    color: 'white',
    opacity: 0.7,
    whiteSpace: 'nowrap',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: '0 10px 10px 0',
    borderLeft: '1px solid #eee',
  },
  chatHeader: {
    padding: '15px 20px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedUserInfo: {
    display: 'flex',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: '15px',
  },
  userAvatarLarge: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '18px',
    position: 'relative',
  },
  headerName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  onlineStatus: {
    fontSize: '12px',
    color: '#4CAF50',
    fontWeight: 'normal',
  },
  userDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  typingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '5px',
  },
  typingDots: {
    display: 'flex',
    gap: '4px',
  },
  typingDot: {
    width: '6px',
    height: '6px',
    backgroundColor: '#666',
    borderRadius: '50%',
    animation: 'typing 1.4s infinite',
    '&:nth-child(2)': {
      animationDelay: '0.2s',
    },
    '&:nth-child(3)': {
      animationDelay: '0.4s',
    },
  },
  typingText: {
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
  },
  messagesArea: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fafafa',
  },
  messageLeft: {
    marginBottom: '15px',
    alignSelf: 'flex-start',
    maxWidth: '70%',
  },
  messageRight: {
    marginBottom: '15px',
    alignSelf: 'flex-end',
    textAlign: 'right',
    maxWidth: '70%',
  },
  messageContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  messageBox: (fromMe) => ({
    backgroundColor: fromMe ? '#009205' : '#e9ecef',
    color: fromMe ? '#fff' : '#333',
    padding: '10px 15px',
    borderRadius: '18px',
    wordWrap: 'break-word',
    fontSize: '14px',
    lineHeight: '1.4',
    position: 'relative',
    maxWidth: '100%',
  }),
  pinIcon: {
    fontSize: '12px',
    marginLeft: '8px',
    cursor: 'pointer',
    opacity: 0.7,
    '&:hover': {
      opacity: 1,
    }
  },
  messageFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '4px',
  },
  messageTime: {
    fontSize: '11px',
    color: '#888',
  },
  messageStatus: {
    display: 'flex',
    alignItems: 'center',
  },
  sentIcon: {
    fontSize: '12px',
    color: '#888',
  },
  deliveredIcon: {
    fontSize: '12px',
    color: '#009205',
  },
  readIcon: {
    fontSize: '12px',
    color: '#4CAF50',
  },
  inputArea: {
    display: 'flex',
    padding: '15px 20px',
    borderTop: '1px solid #eee',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  inputField: {
    flex: 1,
    padding: '12px 15px',
    border: '1px solid #ddd',
    borderRadius: '25px',
    margin: '0 10px',
    fontSize: '14px',
    outline: 'none',
    '&:focus': {
      borderColor: '#009205',
    }
  },
  emojiButton: {
    backgroundColor: 'transparent',
    fontSize: '20px',
    color: '#888',
    border: 'none',
    cursor: 'pointer',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      backgroundColor: '#f5f5f5',
    }
  },
  attachButton: {
    backgroundColor: 'transparent',
    fontSize: '20px',
    color: '#888',
    border: 'none',
    cursor: 'pointer',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      backgroundColor: '#f5f5f5',
    }
  },
  sendButton: {
    backgroundColor: '#009205',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    '&:hover': {
      backgroundColor: '#007a04',
    },
    '&:disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
    }
  },
  btnActive: {
    backgroundColor: '#A8FC0080',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    textAlign: 'center',
    minWidth: '300px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginTop: '20px',
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#ccc',
    color: '#333',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  confirmBtn: {
    padding: '10px 20px',
    backgroundColor: '#009205',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #009205',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#fff',
    marginTop: '10px',
    fontSize: '14px',
  },
  noConversations: {
    padding: '40px 20px',
    textAlign: 'center',
  },
  noConversationsText: {
    color: '#fff',
    fontSize: '14px',
    opacity: 0.7,
  },
  noChatSelected: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#666',
    textAlign: 'center',
  },
  welcomeIcon: {
    width: '80px',
    height: '80px',
    backgroundColor: '#f0f0f0',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  welcomeIconStyle: {
    fontSize: '40px',
    color: '#009205',
  },
  noMessages: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#666',
  },
  noMessagesIcon: {
    fontSize: '40px',
    color: '#ddd',
    marginBottom: '20px',
  },
  backIcon: {
    fontSize: '20px',
    color: '#009205',
    marginRight: '15px',
    cursor: 'pointer',
  },
};

export default Messages;