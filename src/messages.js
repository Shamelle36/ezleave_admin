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
import ProfileDropdown from './profileDropdown';

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, onValue, off, query, orderByChild, equalTo, update, onDisconnect, serverTimestamp } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCo4mCzk0ciAlOYvgrpKpkazjcRsE4wZ4I",
  authDomain: "ezleave-chat.firebaseapp.com",
  databaseURL: "https://ezleave-chat-default-rtdb.firebaseio.com",
  projectId: "ezleave-chat",
  storageBucket: "ezleave-chat.firebasestorage.app",
  messagingSenderId: "1002626168552",
  appId: "1:1002626168552:web:b3a673fb9902c764997b5d",
  measurementId: "G-1WMJBQBJFD"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);


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
  const typingTimeoutRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [role, setRole] = useState(localStorage.getItem("role") || "admin");
  const getFullId = (type, id) => `${type}:${id}`;

  const [admin, setAdmin] = useState(JSON.parse(localStorage.getItem("admin")) || null); // Get from localStorage
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileData, setProfileData] = useState({
      full_name: "",
      email: "",
      role: "",
      profile_picture: "",
    });

  const myFullId = adminData && adminType ? `${adminType}:${adminData.id}` : null;
  const messagesRef = useRef(null);
  const onlineRef = useRef(null);
  const typingRef = useRef(null);
  const userStatusRef = useRef(null);
  
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

  const API_URL = "https://ezleave-admin-api.onrender.com";

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


useEffect(() => {
  scrollToBottom();
}, [messages]);

const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
};

  useEffect(() => {
    if (isMobile && selectedUser) {
      setIsUserListOpen(false);
    } else if (isMobile && !selectedUser) {
      setIsUserListOpen(true);
    }
  }, [selectedUser, isMobile]);

 useEffect(() => {
    const checkAndConnect = async () => {
      const admin = JSON.parse(localStorage.getItem("admin"));
      if (admin) {
        console.log("👤 Found admin data:", admin);
        setAdminData(admin);
        
        let adminType = '';
        
        if (admin.role) {
          console.log(`🎭 Admin role detected: ${admin.role}`);
          
          if (admin.role.toLowerCase() === 'mayor') {
            adminType = 'admin_account';
          } 
          else if (admin.role.toLowerCase() === 'office_head') {
            adminType = 'admin_account';
          }
          else if (admin.role.toLowerCase().includes('admin')) {
            if (admin.role.toLowerCase().includes('useradmin') || admin.role === 'admin') {
              adminType = 'useradmin';
            } else {
              adminType = 'admin_account';
            }
          } else {
            adminType = 'user';
          }
        } 
        else if (admin.table) {
          console.log(`📊 Admin table detected: ${admin.table}`);
          adminType = admin.table === 'useradmin' ? 'useradmin' : 
                     admin.table === 'admin_accounts' ? 'admin_account' : 'user';
        }
        else {
          const storedAdminType = localStorage.getItem('admin_type');
          if (storedAdminType) {
            adminType = storedAdminType;
          } else {
            adminType = 'useradmin';
          }
        }
        
        console.log(`🔧 FINAL admin type: ${adminType}`);
        setAdminType(adminType);
        localStorage.setItem('admin_type', adminType);
        
        // Initialize Firebase listeners
        initializeFirebaseListeners();
      } else {
        console.log('❌ No admin data found in localStorage');
        navigate("/");
      }
    };
    
    checkAndConnect();
    
    // Cleanup function
    return () => {
      cleanupFirebaseListeners();
    };
  }, []);

  const initializeFirebaseListeners = () => {
    if (!adminData || !adminType) return;
    
    const myId = `${adminType}:${adminData.id}`;
    console.log('🔥 Initializing Firebase listeners for:', myId);
    
    setConnectionStatus("Connecting...");
    
    // Set online status
    userStatusRef.current = ref(database, `status/${myId}`);
    set(userStatusRef.current, {
      online: true,
      lastSeen: serverTimestamp(),
      name: adminData.full_name || adminData.name
    });
    
    // Set onDisconnect to mark as offline
    onDisconnect(userStatusRef.current).set({
      online: false,
      lastSeen: serverTimestamp()
    });
    
    // Listen for online status of other users
    onlineRef.current = ref(database, 'status');
    onValue(onlineRef.current, (snapshot) => {
      const statusData = snapshot.val();
      const newOnlineStatus = {};
      
      if (statusData) {
        Object.keys(statusData).forEach(userKey => {
          if (userKey !== myId) {
            newOnlineStatus[userKey] = statusData[userKey].online === true;
          }
        });
        
        setOnlineStatus(newOnlineStatus);
        setConnectionStatus("Connected");
      }
    });
    
    // Listen for typing indicators
    typingRef.current = ref(database, `typing/${myId}`);
    onValue(typingRef.current, (snapshot) => {
      const typingData = snapshot.val();
      
      if (typingData && selectedUser) {
        const senderFullId = `${selectedUser.account_type}:${selectedUser.id}`;
        const myTypingRef = ref(database, `typing/${senderFullId}/${myId}`);
        
        if (typingData[senderFullId]) {
          setIsTyping(true);
          
          // Clear typing indicator after 2 seconds
          setTimeout(() => {
            set(myTypingRef, false);
          }, 2000);
        }
      }
    });
  };

  // Cleanup Firebase listeners
  const cleanupFirebaseListeners = () => {
    if (messagesRef.current) {
      off(messagesRef.current);
    }
    if (onlineRef.current) {
      off(onlineRef.current);
    }
    if (typingRef.current) {
      off(typingRef.current);
    }
    
    // Set offline status on cleanup
    if (userStatusRef.current) {
      set(userStatusRef.current, {
        online: false,
        lastSeen: serverTimestamp()
      });
    }
  };

  useEffect(() => {
    if (!selectedUser || !adminData || !adminType) return;
    
    const myId = `${adminType}:${adminData.id}`;
    const otherId = `${selectedUser.account_type}:${selectedUser.id}`;
    
    // Create conversation ID (sorted to ensure consistency)
    const conversationId = [myId, otherId].sort().join('_');
    
    console.log('📡 Listening to conversation:', conversationId);
    
    // Listen for messages in this conversation
    messagesRef.current = ref(database, `conversations/${conversationId}/messages`);
    const messagesQuery = query(messagesRef.current, orderByChild('timestamp'));
    
    onValue(messagesQuery, (snapshot) => {
      const messagesData = snapshot.val();
      if (messagesData) {
        const formattedMessages = Object.values(messagesData)
          .sort((a, b) => a.timestamp - b.timestamp)
          .map(msg => ({
            id: msg.id || msg.timestamp,
            sender: msg.senderId === myId ? 'me' : 'other',
            text: msg.message,
            time: new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            }),
            delivered: true,
            read_status: msg.read || false,
            timestamp: msg.timestamp
          }));
        
        setMessages(formattedMessages);
        
        // Mark messages as read
        markMessagesAsReadInFirebase(conversationId, myId);
      } else {
        setMessages([]);
      }
      setMessageLoading(false);
    });
    
    // Cleanup previous listener
    return () => {
      if (messagesRef.current) {
        off(messagesRef.current);
      }
    };
  }, [selectedUser, adminData, adminType]);




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



const processIncomingMessage = (messageData) => {
  if (!messageData || !adminData || !adminType) return;
  
  const myFullId = `${adminType}:${adminData.id}`;
  const senderFullId = messageData.sender_id;
  const receiverFullId = messageData.receiver_id;
  
  // Check if this message is for me
  if (receiverFullId !== myFullId) return;
  
  // Check if this is from the currently selected user
  const isFromSelectedUser = selectedUser && 
    senderFullId === `${selectedUser.account_type}:${selectedUser.id}`;
  
  // Add to messages if viewing this conversation
  if (isFromSelectedUser) {
    const newMessage = {
      id: messageData.id || Date.now(),
      sender: 'other',
      text: messageData.message,
      time: new Date(messageData.time || Date.now()).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      pinned: messageData.pinned || false,
      read_status: messageData.read_status || false,
      delivered: true
    };
    
    // Avoid duplicates
    setMessages(prev => {
      if (prev.some(m => m.id === newMessage.id)) return prev;
      return [...prev, newMessage];
    });
    
    // Auto-scroll to bottom
    setTimeout(() => {
      const el = document.getElementById('messagesArea');
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }
  
  // Update user list with latest message
  setUsers(prev => prev.map(user => {
    const userFullId = `${user.account_type}:${user.id}`;
    
    if (senderFullId === userFullId) {
      return {
        ...user,
        message: messageData.message,
        time: new Date(messageData.time || Date.now()).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        // Increment unread if not viewing this conversation
        unread: !isFromSelectedUser ? (user.unread || 0) + 1 : user.unread
      };
    }
    return user;
  }));
  
  // Mark as read if viewing this conversation
  if (isFromSelectedUser && !messageData.read_status) {
    markMessagesAsRead(selectedUser.id, selectedUser.account_type);
    
  }
  
  // Show notification if not viewing conversation
  if (!isFromSelectedUser) {
    console.log('📱 New message from:', messageData.sender_name);
    // You could add a toast notification here
  }
};

const handleIncomingMessage = (data) => {
  console.log('📥 handleIncomingMessage called with:', data);
  
  if (!data.message || !adminData || !adminType) {
    console.log('❌ Missing data, returning');
    return;
  }
  
  const messageData = data.message;
  const myFullId = `${adminType}:${adminData.id}`;
  
  console.log('🔍 Message details:', {
    messageId: messageData.id,
    sender_id: messageData.sender_id,
    receiver_id: messageData.receiver_id,
    myFullId: myFullId,
    isForMe: messageData.receiver_id === myFullId,
    isFromMe: messageData.sender_id === myFullId
  });
  
  // Check if message is for me
  if (messageData.receiver_id !== myFullId) {
    console.log('📨 Message not for me, ignoring');
    return;
  }
  
  const isForMe = messageData.receiver_id === myFullId;
  const isFromMe = messageData.sender_id === myFullId;
  
  // If message is from me, don't process it as incoming (it's outgoing)
  if (isFromMe) {
    console.log('📤 This is my own outgoing message, skipping');
    return;
  }
  
  // Extract sender ID from the sender_id format "type:id"
  let senderId, senderType;
  if (messageData.sender_id && messageData.sender_id.includes(':')) {
    const parts = messageData.sender_id.split(':');
    senderType = parts[0];
    senderId = parts[1];
  } else {
    console.log('❌ Invalid sender_id format:', messageData.sender_id);
    return;
  }
  
  console.log('👤 Extracted sender info:', { senderId, senderType });
  
  // Check if this message is from the currently selected user
  const isFromSelectedUser = selectedUser && 
    selectedUser.id.toString() === senderId && 
    selectedUser.account_type === senderType;
  
  console.log('🤔 Is from selected user?', {
    isFromSelectedUser,
    selectedUserId: selectedUser?.id,
    selectedUserType: selectedUser?.account_type,
    senderId,
    senderType
  });
  
  // **CRITICAL FIX**: Always update the user list FIRST
  setUsers(prev => {
    const updatedUsers = prev.map(user => {
      const userFullId = `${user.account_type}:${user.id}`;
      
      // Check if this user is the sender of this message
      if (messageData.sender_id === userFullId) {
        console.log(`📱 Updating user ${user.name} with new message`);
        
        const updatedUser = {
          ...user,
          message: messageData.message,
          time: new Date(messageData.time || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
        };
        
        // If this message is for me and not read, increment unread count
        // But only if I'm NOT viewing this conversation
        if (isForMe && !messageData.read_status && !isFromSelectedUser) {
          updatedUser.unread = (user.unread || 0) + 1;
          console.log(`📱 Incremented unread count for ${user.name}: ${updatedUser.unread}`);
        }
        
        return updatedUser;
      }
      return user;
    });
    
    console.log('👥 Updated user list');
    return updatedUsers;
  });
  
  // **NEW**: If it's a new message for me AND from the selected user, add to chat
  if (isForMe && isFromSelectedUser) {
    console.log('💬 Adding message to chat area:', messageData);
    
    const newMessage = {
      id: messageData.id || Date.now(),
      sender: 'other',
      text: messageData.message,
      time: new Date(messageData.time || Date.now()).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      pinned: messageData.pinned || false,
      read_status: messageData.read_status || false,
      delivered: true,
      timestamp: messageData.time || new Date().toISOString()
    };
    
    console.log('📝 New message object:', newMessage);
    
    // Add to messages, avoiding duplicates
    setMessages(prev => {
      const isDuplicate = prev.some(m => m.id === newMessage.id);
      console.log('🔍 Checking for duplicates:', { isDuplicate, prevLength: prev.length, newId: newMessage.id });
      
      if (isDuplicate) {
        console.log('⚠️ Duplicate message detected, skipping');
        return prev;
      }
      
      console.log('✅ Adding new message to state');
      const newMessages = [...prev, newMessage];
      console.log('📊 New messages length:', newMessages.length);
      return newMessages;
    });
    
    // Mark as read immediately
    if (!messageData.read_status) {
      console.log('📖 Marking message as read');
      markMessagesAsRead(selectedUser.id, selectedUser.account_type);
    }
  } else if (isForMe) {
    // Message is for me but not from selected user
    console.log(`📱 New message from ${senderType}:${senderId}, but not viewing this conversation`);
    
    // You could add a toast notification here
    // Example: showNotification(`New message from ${senderName}`);
  }
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
    const value = e.target.value;
    setInput(value);

    if (!selectedUser || !adminData || !adminType) return;

    const myId = `${adminType}:${adminData.id}`;
    const otherId = `${selectedUser.account_type}:${selectedUser.id}`;
    const typingRefPath = ref(database, `typing/${otherId}/${myId}`);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.length > 0) {
      // Set typing indicator
      set(typingRefPath, true);
    }

    typingTimeoutRef.current = setTimeout(() => {
      // Clear typing indicator
      set(typingRefPath, false);
    }, 1500);
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

    if (socketRef.current) {
      socketRef.current.disconnect();
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

  const markMessagesAsReadInFirebase = async (conversationId, myId) => {
    try {
      const messagesRef = ref(database, `conversations/${conversationId}/messages`);
      const snapshot = await onValue(messagesRef, (snapshot) => {
        const updates = {};
        
        snapshot.forEach((childSnapshot) => {
          const message = childSnapshot.val();
          if (message.receiverId === myId && !message.read) {
            updates[`${childSnapshot.key}/read`] = true;
          }
        });
        
        if (Object.keys(updates).length > 0) {
          update(messagesRef, updates);
        }
      }, { onlyOnce: true });
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

const sendMessage = async () => {
    if (input.trim() === '' || !selectedUser || !adminData || !adminType) {
      return false;
    }

    const myId = `${adminType}:${adminData.id}`;
    const otherId = `${selectedUser.account_type}:${selectedUser.id}`;
    const conversationId = [myId, otherId].sort().join('_');
    
    const messageText = input.trim();
    const timestamp = Date.now();
    const tempId = timestamp;
    
    // Create optimistic message
    const tempMessage = {
      id: tempId,
      sender: 'me',
      text: messageText,
      time: new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      delivered: false,
      read_status: false,
      timestamp: timestamp
    };
    
    // Add to UI immediately
    setMessages(prev => [...prev, tempMessage]);
    setInput('');
    
    try {
      // 1. Save to Firebase
      const messageRef = push(ref(database, `conversations/${conversationId}/messages`));
      const messageData = {
        id: messageRef.key,
        senderId: myId,
        receiverId: otherId,
        message: messageText,
        timestamp: timestamp,
        read: false,
        senderName: adminData.full_name || adminData.name
      };
      
      await set(messageRef, messageData);
      
      // 2. Update last message in conversation metadata
      const conversationRef = ref(database, `conversations/${conversationId}`);
      await update(conversationRef, {
        lastMessage: messageText,
        lastMessageTime: timestamp,
        participants: [myId, otherId]
      });
      
      // 3. Save to your database for persistence
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/admin/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sender_id: adminData.id,
          sender_type: adminType,
          receiver_id: selectedUser.id,
          receiver_type: selectedUser.account_type,
          message: messageText,
          firebaseId: messageRef.key
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('💾 Database save response:', data);
      }
      
      // Update optimistic message
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, delivered: true, id: messageRef.key } : msg
      ));
      
      return true;
    } catch (error) {
      console.error("❌ Error sending message:", error);
      // Mark as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, delivered: false, error: true } : msg
      ));
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
      
      if (socketRef.current) {
        socketRef.current.emit("messages_read", {
          senderId: contactId,
          senderType: contactType,
        });
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
    await sendMessage();
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

      <div className="desktop-header" style={styles.header}>
        <div style={styles.headerRight}>
          <ProfileDropdown
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
                    <div ref={messagesEndRef} />
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