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
  faArrowLeft,
  faSync,
  faWifi
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useRef } from 'react';
import './message-responsive.css';
import ProfileDropdown from './profileDropdown';

import { initializeApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  set, 
  push, 
  onValue, 
  off, 
  query, 
  orderByChild, 
  update, 
  onDisconnect, 
  serverTimestamp,
  get,
  connectDatabaseEmulator
} from 'firebase/database';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// For debugging - disable persistence to prevent caching issues
// import { enableLogging } from "firebase/database";
// enableLogging(true); // Uncomment for detailed Firebase logs

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
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [connectionDetails, setConnectionDetails] = useState('');
  const messagesEndRef = useRef(null);
  const [retryCount, setRetryCount] = useState(0);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [role, setRole] = useState(localStorage.getItem("role") || "admin");

  const [admin, setAdmin] = useState(JSON.parse(localStorage.getItem("admin")) || null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    role: "",
    profile_picture: "",
  });

  const messagesRef = useRef(null);
  const onlineRef = useRef(null);
  const typingRef = useRef(null);
  const userStatusRef = useRef(null);
  const typingCleanupRef = useRef(null);
  const conversationListenerRef = useRef(null);
  const connectionListenerRef = useRef(null);
  
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

  // Initialize Firebase connection monitor
  useEffect(() => {
    const monitorConnection = () => {
      const connectedRef = ref(database, ".info/connected");
      connectionListenerRef.current = onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
          console.log('✅ Firebase Realtime Database CONNECTED');
          setConnectionStatus("Connected");
          setConnectionDetails("Real-time connection established");
        } else {
          console.log('🔴 Firebase Realtime Database DISCONNECTED');
          setConnectionStatus("Disconnected");
          setConnectionDetails("Trying to reconnect...");
        }
      });
    };

    monitorConnection();

    return () => {
      if (connectionListenerRef.current) {
        off(connectionListenerRef.current);
      }
    };
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

  // Main initialization effect
  useEffect(() => {
    const checkAndConnect = async () => {
      try {
        const admin = JSON.parse(localStorage.getItem("admin"));
        if (!admin) {
          console.log('❌ No admin data found in localStorage');
          navigate("/");
          return;
        }

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
        initializeFirebaseListeners(admin, adminType);
        
      } catch (error) {
        console.error('❌ Error in checkAndConnect:', error);
        setConnectionStatus("Error");
        setConnectionDetails(`Initialization failed: ${error.message}`);
      }
    };
    
    checkAndConnect();
    
    // Cleanup function
    return () => {
      cleanupFirebaseListeners();
    };
  }, []);

  const initializeFirebaseListeners = (admin, adminType) => {
    if (!admin || !adminType) return;
    
    const myId = `${adminType}:${admin.id}`;
    console.log('🔥 Initializing Firebase listeners for:', myId);
    
    setConnectionStatus("Connecting...");
    setConnectionDetails(`Setting up connection for ${myId}`);
    
    try {
      // Set online status
      userStatusRef.current = ref(database, `users/${myId}`);
      
      const userStatusData = {
        online: true,
        lastSeen: serverTimestamp(),
        name: admin.full_name || admin.name || 'Unknown',
        email: admin.email || '',
        type: adminType,
        id: admin.id,
        lastActive: Date.now()
      };
      
      console.log('🟢 Setting online status:', userStatusData);
      
      set(userStatusRef.current, userStatusData)
        .then(() => {
          console.log('✅ Online status set successfully');
          
          // Set onDisconnect to mark as offline
          onDisconnect(userStatusRef.current).update({
            online: false,
            lastSeen: serverTimestamp(),
            lastActive: serverTimestamp()
          }).then(() => {
            console.log('✅ OnDisconnect handler set');
          }).catch(disconnectError => {
            console.error('❌ Error setting onDisconnect:', disconnectError);
          });
          
          // Listen for online status of other users
          onlineRef.current = ref(database, 'users');
          onValue(onlineRef.current, (snapshot) => {
            const statusData = snapshot.val();
            const newOnlineStatus = {};
            
            if (statusData) {
              Object.keys(statusData).forEach(userKey => {
                if (userKey !== myId && statusData[userKey]) {
                  newOnlineStatus[userKey] = statusData[userKey].online === true;
                }
              });
              
              setOnlineStatus(newOnlineStatus);
              console.log('✅ Online users loaded:', Object.keys(newOnlineStatus).filter(k => newOnlineStatus[k]).length);
            }
          }, (error) => {
            console.error('❌ Error listening to online status:', error);
          });
          
          setConnectionStatus("Connected");
          setConnectionDetails(`Connected as ${myId}`);
          
        })
        .catch(error => {
          console.error('❌ Error setting online status:', error);
          setConnectionStatus("Error");
          setConnectionDetails(`Failed to set online status: ${error.message}`);
          
          // Retry after 3 seconds
          setTimeout(() => {
            if (retryCount < 3) {
              console.log(`🔄 Retrying connection (attempt ${retryCount + 1})`);
              setRetryCount(prev => prev + 1);
              initializeFirebaseListeners(admin, adminType);
            }
          }, 3000);
        });
        
    } catch (error) {
      console.error('❌ Error in initializeFirebaseListeners:', error);
      setConnectionStatus("Error");
      setConnectionDetails(`Initialization error: ${error.message}`);
    }
  };

  // Listen for messages when a user is selected
  useEffect(() => {
    if (!selectedUser || !adminData || !adminType) {
      console.log('⚠️ Cannot setup message listener: Missing data');
      return;
    }
    
    const myId = `${adminType}:${adminData.id}`;
    const otherId = `${selectedUser.account_type}:${selectedUser.id}`;
    
    // Create conversation ID
    const conversationId = [myId, otherId].sort().join('_');
    console.log('📡 Setting up listener for conversation:', conversationId);
    
    // Clear any existing messages first
    setMessages([]);
    
    // Setup typing listener
    setupTypingListener(myId, otherId);
    
    // Listen for messages in this conversation
    const messagesRefPath = ref(database, `conversations/${conversationId}/messages`);
    conversationListenerRef.current = messagesRefPath;
    
    // Use query to order by timestamp
    const messagesQuery = query(messagesRefPath, orderByChild('timestamp'));
    
    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const messagesData = snapshot.val();
      console.log('📨 Received messages data for conversation:', conversationId);
      
      if (messagesData) {
        // Convert object to array and sort by timestamp
        const messagesArray = Object.keys(messagesData).map(key => ({
          id: key,
          ...messagesData[key]
        })).sort((a, b) => a.timestamp - b.timestamp);
        
        // Filter out any messages with null/undefined values
        const validMessages = messagesArray.filter(msg => 
          msg.message && msg.senderId && msg.receiverId
        );
        
        const formattedMessages = validMessages.map(msg => ({
          id: msg.id,
          sender: msg.senderId === myId ? 'me' : 'other',
          text: msg.message,
          time: msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }) : 'Just now',
          delivered: true,
          read_status: msg.read || false,
          timestamp: msg.timestamp || Date.now(),
          senderName: msg.senderName || 'Unknown'
        }));
        
        console.log('📊 Formatted messages:', formattedMessages.length);
        setMessages(formattedMessages);
        
        // Mark messages as read
        markMessagesAsReadInFirebase(conversationId, myId);
      } else {
        console.log('📭 No messages in this conversation');
        setMessages([]);
      }
      setMessageLoading(false);
    }, (error) => {
      console.error('❌ Error in message listener:', error);
      setMessageLoading(false);
    });
    
    // Cleanup previous listener
    return () => {
      if (conversationListenerRef.current) {
        off(conversationListenerRef.current);
      }
      // Cleanup typing listener
      if (typingCleanupRef.current) {
        typingCleanupRef.current();
      }
    };
  }, [selectedUser, adminData, adminType]);

  // Setup typing indicator listener
  const setupTypingListener = (myId, otherId) => {
    // Cleanup previous typing listener
    if (typingCleanupRef.current) {
      typingCleanupRef.current();
    }
    
    // Listen for typing indicators from the other user
    const typingRefPath = ref(database, `typing/${otherId}/${myId}`);
    
    const unsubscribe = onValue(typingRefPath, (snapshot) => {
      const isTyping = snapshot.val();
      console.log('⌨️ Typing status:', isTyping);
      setIsTyping(isTyping === true);
    });
    
    // Store cleanup function
    typingCleanupRef.current = () => {
      off(typingRefPath);
    };
  };

  // Cleanup Firebase listeners
  const cleanupFirebaseListeners = () => {
    console.log('🧹 Cleaning up Firebase listeners');
    
    if (conversationListenerRef.current) {
      off(conversationListenerRef.current);
    }
    if (onlineRef.current) {
      off(onlineRef.current);
    }
    if (typingCleanupRef.current) {
      typingCleanupRef.current();
    }
    
    // Set offline status on cleanup
    if (userStatusRef.current && adminData && adminType) {
      const myId = `${adminType}:${adminData.id}`;
      const userRef = ref(database, `users/${myId}`);
      update(userRef, {
        online: false,
        lastSeen: serverTimestamp()
      }).catch(error => {
        console.error('❌ Error setting offline status:', error);
      });
    }
  };

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

  // Handle typing indicator
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    if (!selectedUser || !adminData || !adminType) return;

    const myId = `${adminType}:${adminData.id}`;
    const otherId = `${selectedUser.account_type}:${selectedUser.id}`;
    const typingRefPath = ref(database, `typing/${myId}/${otherId}`);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.length > 0) {
      // Set typing indicator
      set(typingRefPath, true).catch(error => {
        console.error('❌ Error setting typing indicator:', error);
      });
      
      // Clear typing indicator after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        set(typingRefPath, false).catch(error => {
          console.error('❌ Error clearing typing indicator:', error);
        });
      }, 2000);
    } else {
      // Clear typing indicator immediately if input is empty
      set(typingRefPath, false).catch(error => {
        console.error('❌ Error clearing typing indicator:', error);
      });
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

    // Cleanup Firebase listeners
    cleanupFirebaseListeners();

    localStorage.removeItem("admin");
    localStorage.removeItem("admin_type");
    navigate("/");
  };

  // Fetch all accounts for messaging
  useEffect(() => {
    if (adminData && adminType) {
      fetchAllAccounts();
    }
  }, [adminData, adminType]);

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
          console.log('👥 Loaded users:', transformedUsers.length);
        }
      }
    } catch (error) {
      console.error('Error fetching all accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send message function - UPDATED
  const sendMessage = async () => {
    if (input.trim() === '' || !selectedUser || !adminData || !adminType) {
      console.error('❌ Cannot send: Missing required data');
      return false;
    }

    const myId = `${adminType}:${adminData.id}`;
    const otherId = `${selectedUser.account_type}:${selectedUser.id}`;
    
    // Ensure consistent sorting for conversation ID
    const ids = [myId, otherId].sort();
    const conversationId = `${ids[0]}_${ids[1]}`;
    
    console.log('📤 Sending message:', { 
      myId, 
      otherId, 
      conversationId, 
      messageText: input.trim() 
    });

    const messageText = input.trim();
    const timestamp = Date.now();
    const tempId = `temp_${timestamp}`;
    
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
      timestamp: timestamp,
      isOptimistic: true
    };
    
    // Add to UI immediately
    setMessages(prev => [...prev, tempMessage]);
    setInput('');
    
    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    try {
      const typingRefPath = ref(database, `typing/${myId}/${otherId}`);
      await set(typingRefPath, false);
    } catch (error) {
      console.warn('⚠️ Error clearing typing indicator:', error);
    }
    
    try {
      // Check Firebase connection first
      console.log('🔍 Checking Firebase connection...');
      const connectedRef = ref(database, ".info/connected");
      const connectedSnapshot = await get(connectedRef);
      
      if (!connectedSnapshot.val()) {
        throw new Error('Firebase is not connected. Please check your internet connection.');
      }
      
      console.log('✅ Firebase is connected');

      // 1. Save to Firebase
      const messagesRefPath = ref(database, `conversations/${conversationId}/messages`);
      const messageRef = push(messagesRefPath);
      
      const messageKey = messageRef.key;
      
      const messageData = {
        id: messageKey,
        senderId: myId,
        receiverId: otherId,
        message: messageText,
        timestamp: timestamp,
        read: false,
        senderName: adminData.full_name || adminData.name || 'Unknown',
        createdAt: serverTimestamp()
      };
      
      console.log('🔥 Saving to Firebase:', messageData);
      
      await set(messageRef, messageData);
      
      console.log('✅ Message saved to Firebase');

      // 2. Update conversation metadata
      const conversationRef = ref(database, `conversations/${conversationId}`);
      await update(conversationRef, {
        lastMessage: messageText,
        lastMessageTime: timestamp,
        lastMessageSender: myId,
        participants: {
          [myId]: true,
          [otherId]: true
        }
      });
      
      console.log('✅ Conversation metadata updated');

      // 3. Try to save to your database (optional - don't fail if this doesn't work)
      try {
        const token = localStorage.getItem("token");
        if (token) {
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
              firebaseId: messageKey,
              timestamp: timestamp
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('💾 Database save response:', data);
          } else {
            console.warn('⚠️ Database save failed, but Firebase saved successfully');
          }
        }
      } catch (dbError) {
        console.warn('⚠️ Error saving to database (non-critical):', dbError.message);
      }
      
      // Update optimistic message with real Firebase ID
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { 
          ...msg, 
          id: messageKey, 
          delivered: true,
          isOptimistic: false
        } : msg
      ));
      
      console.log('🎉 Message sent successfully!');
      scrollToBottom();
      return true;
      
    } catch (error) {
      console.error("❌ ERROR sending message:", {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Mark optimistic message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { 
          ...msg, 
          delivered: false, 
          error: true,
          errorMessage: error.message,
          isOptimistic: false
        } : msg
      ));
      
      // Determine user-friendly error message
      let userErrorMessage = 'Failed to send message. ';
      
      if (error.code) {
        switch (error.code) {
          case 'PERMISSION_DENIED':
            userErrorMessage += 'Permission denied by Firebase. Please check database rules.';
            break;
          case 'UNAVAILABLE':
            userErrorMessage += 'Firebase service unavailable. Please check your connection.';
            break;
          case 'NETWORK_ERROR':
            userErrorMessage += 'Network error. Please check your internet connection.';
            break;
          default:
            userErrorMessage += `Error: ${error.code}`;
        }
      } else if (error.message.includes('not connected')) {
        userErrorMessage = 'Not connected to Firebase. Please check your internet connection and refresh the page.';
      } else {
        userErrorMessage += error.message;
      }
      
      // Show alert
      alert(userErrorMessage);
      
      // Suggest reconnection
      if (error.code === 'UNAVAILABLE' || error.message.includes('not connected')) {
        if (window.confirm('Would you like to try reconnecting to Firebase?')) {
          window.location.reload();
        }
      }
      
      return false;
    }
  };

  const markMessagesAsReadInFirebase = async (conversationId, myId) => {
    try {
      const messagesRefPath = ref(database, `conversations/${conversationId}/messages`);
      const snapshot = await get(messagesRefPath);
      
      if (snapshot.exists()) {
        const updates = {};
        
        snapshot.forEach((childSnapshot) => {
          const message = childSnapshot.val();
          if (message.receiverId === myId && !message.read) {
            updates[`${childSnapshot.key}/read`] = true;
          }
        });
        
        if (Object.keys(updates).length > 0) {
          await update(messagesRefPath, updates);
          console.log('📖 Marked messages as read in Firebase');
        }
      }
    } catch (error) {
      console.error('Error marking messages as read in Firebase:', error);
    }
  };

  const handleSend = async () => {
    await sendMessage();
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Force refresh conversation
  const refreshConversation = async () => {
    if (!selectedUser || !adminData || !adminType) return;
    
    console.log('🔄 Manually refreshing conversation...');
    setMessageLoading(true);
    
    // Clear current messages
    setMessages([]);
    
    // Re-fetch from database
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/admin/messages/conversation/${adminData.id}/${adminType}/${selectedUser.id}/${selectedUser.account_type}`,
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
              delivered: true
            };
          });
          setMessages(formattedMessages);
          console.log('🔄 Refreshed messages from database:', formattedMessages.length);
        }
      }
    } catch (error) {
      console.error('Error refreshing conversation:', error);
    } finally {
      setMessageLoading(false);
    }
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
      return 'hidden';
    }
    
    return isUserListOpen ? 'open' : 'closed';
  };

  const getChatAreaClass = () => {
    if (!isMobile) return '';
    return selectedUser ? 'visible' : 'hidden';
  };

  // Check if user is online
  const isUserOnline = (userId, userType) => {
    const userKey = `${userType}:${userId}`;
    return onlineStatus[userKey] || false;
  };

  // Reconnect to Firebase
  const reconnectToFirebase = () => {
    console.log('🔄 Manually reconnecting to Firebase...');
    setConnectionStatus("Reconnecting...");
    setConnectionDetails("Manual reconnection initiated");
    
    // Cleanup existing listeners
    cleanupFirebaseListeners();
    
    // Reinitialize
    if (adminData && adminType) {
      setTimeout(() => {
        initializeFirebaseListeners(adminData, adminType);
      }, 1000);
    }
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Connection Status Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '30px',
        backgroundColor: connectionStatus === 'Connected' ? '#4CAF50' : 
                        connectionStatus === 'Connecting' ? '#FF9800' : '#f44336',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 2000,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FontAwesomeIcon icon={connectionStatus === 'Connected'} />
          <span>Firebase: {connectionStatus}</span>
          {connectionStatus !== 'Connected' && (
            <button 
              onClick={reconnectToFirebase}
              style={{
                background: 'transparent',
                border: '1px solid white',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '3px',
                fontSize: '10px',
                cursor: 'pointer',
                marginLeft: '10px'
              }}
            >
              Reconnect
            </button>
          )}
        </div>
        <div style={{ fontSize: '10px', opacity: 0.8 }}>
          {connectionDetails}
        </div>
      </div>

      <div className="mobile-header" style={{ marginTop: '30px' }}>
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

      {/* Sidebar */}
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

        {/* Sidebar Menu */}
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

        {/* Chat Area */}
        {selectedUser ? (
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
                  {isMobile && (
                    <FontAwesomeIcon 
                      icon={faArrowLeft} 
                      style={styles.backIcon} 
                      onClick={() => {
                        setSelectedUser(null);
                        setIsUserListOpen(true);
                      }} 
                    />
                  )}
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
                  <button 
                    onClick={refreshConversation}
                    style={{
                      marginLeft: 'auto',
                      background: 'transparent',
                      border: '1px solid #ddd',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#009205'
                    }}
                    title="Refresh conversation"
                  >
                    <FontAwesomeIcon icon={faSync} />
                  </button>
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
                    <button 
                      onClick={refreshConversation}
                      style={{
                        marginTop: '10px',
                        padding: '8px 16px',
                        backgroundColor: '#009205',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      Refresh
                    </button>
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
                          <div className='messageBox' style={{
                            ...styles.messageBox(msg.sender === 'me'),
                            opacity: msg.isOptimistic ? 0.7 : 1,
                            border: msg.error ? '1px solid #f44336' : 'none'
                          }}>
                            {msg.text}
                            {msg.error && (
                              <div style={{
                                fontSize: '10px',
                                color: '#f44336',
                                marginTop: '4px'
                              }}>
                                Failed to send
                              </div>
                            )}
                          </div>
                          <div style={styles.messageFooter}>
                            <div className='messageTime' style={styles.messageTime}>
                              {msg.time}
                              {msg.isOptimistic && ' (Sending...)'}
                            </div>
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
                  style={{
                    ...styles.sendButton,
                    opacity: connectionStatus !== 'Connected' ? 0.5 : 1,
                    cursor: connectionStatus !== 'Connected' ? 'not-allowed' : 'pointer'
                  }}
                  disabled={!input.trim() || connectionStatus !== 'Connected'}
                  title={connectionStatus !== 'Connected' ? 'Not connected to Firebase' : 'Send message'}
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </div>
            </>
          </div>
        ) : !isMobile ? (
          <div className='chatArea' style={styles.chatArea}>
            <div style={styles.noChatSelected}>
              <div style={styles.welcomeIcon}>
                <FontAwesomeIcon icon={faEnvelope} style={styles.welcomeIconStyle} />
              </div>
              <h3>Welcome to Messages</h3>
              <p>Select a contact to start messaging</p>
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: connectionStatus === 'Connected' ? '#4CAF50' : '#f44336'
                  }}></div>
                  <span style={{
                    fontSize: '14px',
                    color: connectionStatus === 'Connected' ? '#4CAF50' : '#f44336'
                  }}>
                    {connectionStatus}
                  </span>
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  maxWidth: '300px',
                  margin: '0 auto'
                }}>
                  {connectionDetails}
                </div>
                {connectionStatus !== 'Connected' && (
                  <button 
                    onClick={reconnectToFirebase}
                    style={{
                      marginTop: '15px',
                      padding: '8px 16px',
                      backgroundColor: '#009205',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Reconnect to Firebase
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
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
    position: 'relative',
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