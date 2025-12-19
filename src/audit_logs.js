import React from 'react';
import { Link } from 'react-router-dom';
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
} from '@fortawesome/free-solid-svg-icons';
import 'react-calendar/dist/Calendar.css';
import { useState, useEffect } from 'react';
import './dashboardCalendar.css';

function AuditLogs() {

const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/audit-logs")
      .then((res) => res.json())
      .then((data) => setAuditLogs(data))
      .catch((err) => console.error("Error fetching logs:", err));
  }, []);


  return (
    <div style={styles.dashboardContainer}>

      <div style={styles.header}>
        <input type="text" placeholder="Search..." style={styles.search} />
        <FontAwesomeIcon icon={faBell} style={styles.iconBell} />
      </div>

      <div style={styles.sidebar}>
        <img src={require('./images/logo_ez.png')} alt="logo" style={styles.logo} />
          <ul style={styles.sidebarList}>
            <li><Link style={styles.sb} to="/dashboard"><FontAwesomeIcon icon={faTachometerAlt} style={styles.icon} /> Dashboard</Link></li>
            <li><Link style={styles.sb} to="/employee"><FontAwesomeIcon icon={faUsers} style={styles.icon} /> Employees</Link></li>
            <li><Link style={styles.sb} to="/attendance"><FontAwesomeIcon icon={faCalendarCheck} style={styles.icon} /> Attendance</Link></li>
            <li><Link style={styles.sb} to="/leaveManagement"><FontAwesomeIcon icon={faCalendarAlt} style={styles.icon} /> Leave Management</Link></li>
            <li><Link style={styles.sb} to="/messages"><FontAwesomeIcon icon={faEnvelope} style={styles.icon} /> Message</Link></li>
            <li><Link style={styles.sb} to="/announcement"><FontAwesomeIcon icon={faBullhorn} style={styles.icon} /> Announcement</Link></li>
            <li style={styles.btnActive}><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faClipboardList} style={styles.icon} /> Audit Logs</Link></li>
            <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faUserCog} style={styles.icon} /> User Management</Link></li>
            <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faSignOutAlt} style={styles.icon} /> Logout</Link></li>
          </ul>
      </div>

<div style={styles.content1}>
  <h2 style={{ marginBottom: '20px' }}>Audit Logs</h2>
  <div style={styles.tableWrapper}>
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.thStyle}>Date & Time</th>
          <th style={styles.thStyle}>User</th>
          <th style={styles.thStyle}>Role</th>
          <th style={styles.thStyle}>Activity</th>
          <th style={styles.thStyle}>Details</th>
          <th style={styles.thStyle}>IP</th>
        </tr>
      </thead>
      <tbody>
        {auditLogs.map((log) => (
          <tr key={log.id} style={{ borderBottom: '1px solid #ddd' }}>
            <td style={styles.tdStyle}>{log.created_at}</td>
            <td style={styles.tdStyle}>{log.full_name}</td>
            <td style={styles.tdStyle}>{log.role}</td>
            <td style={styles.tdStyle}>{log.activity}</td>
            <td style={styles.tdStyle}>{log.details}</td>
            <td style={styles.tdStyle}>{log.ip_address}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
    margin: '0',
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
  content: {
    marginLeft: '300px', 
    padding: '20px',
    backgroundColor: '#F8F8F8',
    marginTop: '60px', 
    overflow: 'hidden'
  },
  header1: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '20px',
    justifyContent: 'flex-start',
  },
  btnActive: {
    backgroundColor: '#A8FC0080',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
    },

    content1: {
        marginLeft: '280px', 
        padding: '100px 20px 20px 20px', 
        minHeight: '100vh',
        backgroundColor: '#F8F8F8',
        boxSizing: 'border-box',
    },

    tableWrapper: {
        display: 'flex',
        justifyContent: 'center',
    },

    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        backgroundColor: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        overflow: 'auto'
    },

    tdStyle: {
        padding: '10px',
        verticalAlign: 'top',
        borderBottom: '1px solid #eee',
        fontSize: '14px'
    },

    thStyle: {
        padding: '10px',
        backgroundColor: '#A8FC0020',
        width: '400px',
        fontSize: '15px'
    }

};

export default AuditLogs;