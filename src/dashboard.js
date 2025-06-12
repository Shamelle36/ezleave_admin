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
  faLeaf
} from '@fortawesome/free-solid-svg-icons';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useState } from 'react';
import './dashboardCalendar.css';
import { height, width } from '@fortawesome/free-solid-svg-icons/fa0';

function Dashboard() {

    const [date, setDate] = useState(new Date());

  return (
    <div style={styles.dashboardContainer}>

        <div style={styles.header}>
            <input type="text" placeholder="Search..." style={styles.search} />
            <FontAwesomeIcon icon={faBell} style={styles.iconBell} />
        </div>

        <div style={styles.sidebar}>
            <img src={require('./images/logo_ez.png')} alt="logo" style={styles.logo} />
                <ul style={styles.sidebarList}>
                    <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faTachometerAlt} style={styles.icon} /> Dashboard</Link></li>
                    <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faUsers} style={styles.icon} /> Employees</Link></li>
                    <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faCalendarCheck} style={styles.icon} /> Attendance</Link></li>
                    <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faCalendarAlt} style={styles.icon} /> Leave Management</Link></li>
                    <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faEnvelope} style={styles.icon} /> Message</Link></li>
                    <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faBullhorn} style={styles.icon} /> Announcement</Link></li>
                    <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faClipboardList} style={styles.icon} /> Audit Logs</Link></li>
                    <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faUserCog} style={styles.icon} /> User Management</Link></li>
                    <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faCog} style={styles.icon} /> Settings</Link></li>
                    <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faSignOutAlt} style={styles.icon} /> Logout</Link></li>
                </ul>
        </div>

        <div style={styles.content}>

            <div style={styles.cnt1}>
                <div style={styles.cards}>
                    <div style={styles.card}>
                        <h4>Total Employees</h4>
                        <h2 style={{fontSize: '30px'}}>200</h2>
                    </div>

                    <div style={styles.card}>
                        <h4>Total Employees</h4>
                        <h2 style={{fontSize: '30px'}}>200</h2>
                    </div>

                    <div style={styles.card}>
                        <h4>Total Employees</h4>
                        <h2 style={{fontSize: '30px'}}>200</h2>
                    </div>

                    <div style={styles.card}>
                        <h4>Total Employees</h4>
                        <h2 style={{fontSize: '30px'}}>200</h2>
                    </div>

                    <div style={styles.card}>
                        <h4>Total Employees</h4>
                        <h2 style={{fontSize: '30px'}}>200</h2>
                    </div>

                    <div style={styles.card}>
                        <h4>Total Employees</h4>
                        <h2 style={{fontSize: '30px'}}>200</h2>
                    </div>
                </div>

                <div style={styles.calendar}>
                    <Calendar
                        onChange={setDate}
                        value={date}
                    />
                </div>
            

            </div>
        </div>
    </div>
  );
}

const styles = {
  sidebar: {
    backgroundColor: '#009205',
    width: '280px',
    height: '100vh',
    margin: '0',
    position: 'fixed',
    padding: '20px',
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
},
  icon: {
    color: '#fff',
  },
  search: {
    padding: '10px', 
    width: '300px', 
    borderRadius: '5px', 
    border: '1px solid #ccc' 
  },
  iconBell: {
    color: '#fff',
    fontSize: '24px',
    marginLeft: '20px',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'right',
    padding: '10px',
    backgroundColor: '#009205',
    position: 'fixed',
    top: '0',
    width: '100%',
  },
  
  content: {
    marginLeft: '255px', 
    padding: '10px',
    height: '100vh',
  },
  cards: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: '20px',
    maxWidth: '1000px', 
    gap: '10px',
    flex: '2'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '20px',
    margin: '10px',
    textAlign: 'left',
    width: 'calc(33.333% - 40px)',
  },
  calendar: {
        borderRadius: '8px',
        padding: '20px',
        width: '500px'
    },
    cnt1: {
        display:'flex',
        flexDirection: 'row',
        marginTop: '40px'
    }

};

export default Dashboard;