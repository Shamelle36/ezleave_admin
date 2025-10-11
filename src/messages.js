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
  faBell
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';

function Messages() {
  const users = [
    { id: 1, name: 'Reyland Tanglao', message: 'Hey!! goodluck!!', time: '10:00 am', unread: 0 },
    { id: 2, name: 'Jovie Mohinay', message: 'Hey!! goodluck!!', time: '10:00 am', unread: 2 },
    { id: 3, name: 'Clarence Amoyan', message: 'Hey!! goodluck!!', time: '10:00 am', unread: 1 },
  ];

  const [selectedUser, setSelectedUser] = useState(users[0]);
  const location = useLocation();
  const [messages, setMessages] = useState([
    { sender: 'me', text: 'Hey!', time: '10:05 am' },
    { sender: 'me', text: 'Good luck!', time: '10:10 am' },
    { sender: 'other', text: 'Thanks!', time: '10:20 am' },
    { sender: 'other', text: 'Same to you!', time: '10:23 am' },
  ]);
  const [input, setInput] = useState('');

  const navigate = useNavigate();
   const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [role, setRole] = useState(localStorage.getItem("role") || "admin");
        
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

  const handleSend = () => {
    if (input.trim() !== '') {
      setMessages([...messages, { sender: 'me', text: input, time: '10:30 am' }]);
      setInput('');
    }
  };

  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.header}>
        <input type="text" placeholder="Search..." style={styles.search} />
        <FontAwesomeIcon icon={faBell} style={styles.iconBell} />
      </div>

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
      

      <div style={styles.chatContainer}>

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


        <div style={styles.chatSidebar}>
          <input placeholder="Search..." style={styles.chatSearchBar} />
          {users.map((user) => {
  const isSelected = selectedUser.id === user.id;

  return (
    <div
      key={user.id}
      style={{
        ...styles.userItem,
        backgroundColor: isSelected ? '#F1FFED' : 'transparent',
            }}
            onClick={() => setSelectedUser(user)}
            >
            <div style={styles.userCircle}></div>
            <div>
                <div style={{
                ...styles.username,
                color: isSelected ? '#009205' : '#fff'
                }}>
                {user.name}
                </div>
                <div style={{
                ...styles.previewText,
                color: isSelected ? '#009205' : '#fff'
                }}>
                {user.message}
                </div>
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

        <div style={styles.chatArea}>
          <div style={styles.chatHeader}>
            <div style={styles.userCircleLarge}></div>
            <div>
              <div style={styles.headerName}>{selectedUser.name}</div>
              <div style={styles.onlineStatus}><span style={styles.greenDot}></span> Online</div>
            </div>
          </div>

          <div style={styles.messagesArea}>
            {messages.map((msg, idx) => (
              <div key={idx} style={msg.sender === 'me' ? styles.messageRight : styles.messageLeft}>
                <div style={styles.messageBox(msg.sender === 'me')}>{msg.text}</div>
                <div style={styles.messageTime}>{msg.time}</div>
              </div>
            ))}
          </div>

          <div style={styles.inputArea}>
            <button style={styles.addButton}>+</button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type message"
              style={styles.inputField}
            />
            <button onClick={handleSend} style={styles.sendButton}>Send</button>
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
    padding: '20px',  
  },
  chatSidebar: {
    width: '300px',
    backgroundColor: '#009205',
    padding: '15px',
    overflowY: 'auto',
    borderRadius: '10px 0 0 10px',
    alignItems: 'flex-start',
  },
  chatSearchBar: {
    width: '100%',
    padding: '8px 15px',
    borderRadius: '20px',
    border: '1px solid #ccc',
    marginBottom: '10px',
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px',
    marginBottom: '6px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  userCircle: {
    width: '40px',
    height: '40px',
    backgroundColor: '#fff',
    borderRadius: '50%',
    marginRight: '10px',
  },
  username: {
    fontWeight: 'bold',
    fontSize: '14px',
    color: 'white'
  },
  previewText: {
    fontSize: '12px',
    color: 'white',
  },
  time: {
    fontSize: '10px',
    color: '#888',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f4f4f4',
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#009205',
    color: 'white',
    borderRadius: '0 10px 0 0'
  },
  userCircleLarge: {
    width: '50px',
    height: '50px',
    backgroundColor: '#fff',
    borderRadius: '50%',
    marginRight: '15px',
  },
  headerName: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  onlineStatus: {
    fontSize: '12px',
  },
  greenDot: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    backgroundColor: 'limegreen',
    borderRadius: '50%',
    marginRight: '5px',
  },
  messagesArea: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
  },
  messageLeft: {
    marginBottom: '15px',
    alignSelf: 'flex-start',
  },
  messageRight: {
    marginBottom: '15px',
    alignSelf: 'flex-end',
    textAlign: 'right',
  },
  messageBox: (fromMe) => ({
    backgroundColor: fromMe ? '#009205' : '#ddd',
    color: fromMe ? '#fff' : '#000',
    padding: '10px 15px',
    borderRadius: '8px',
    maxWidth: '60%',
  }),
  messageTime: {
    fontSize: '10px',
    color: '#666',
    marginTop: '3px',
  },
  inputArea: {
    display: 'flex',
    padding: '10px 20px',
    borderTop: '1px solid #ccc',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: '0 0 10px 0'
  },
  inputField: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '50px',
    margin: '0 10px',
  },
  addButton: {
    backgroundColor: 'transparent',
    fontSize: '24px',
    color: 'green',
    border: 'none',
    cursor: 'pointer',
  },
  sendButton: {
    padding: '8px 16px',
    backgroundColor: '#009025',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  btnActive: {
    backgroundColor: '#A8FC0080',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  },
  
  
};

export default Messages;