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
  faAdd,
  faTrash,
  faSearch,
  faPen
} from '@fortawesome/free-solid-svg-icons';
import 'react-calendar/dist/Calendar.css';
import './dashboardCalendar.css';
import { width } from '@fortawesome/free-solid-svg-icons/fa0';
import { useState } from 'react';

function Announcement() {
    const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: 'System Maintenance',
      status: 'Active',
      dateAdded: '2025-06-17',
      lastUpdated: '2025-06-17',
      checked: false,
    },
    {
      id: 2,
      title: 'New Policy Update',
      status: 'Inactive',
      dateAdded: '2025-06-15',
      lastUpdated: '2025-06-16',
      checked: false,
    },
  ]);

  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setAnnouncements(prev =>
      prev.map(item => ({ ...item, checked: newSelectAll }))
    );
  };

  const handleCheckboxChange = (id) => {
    setAnnouncements(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
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
            <li><Link style={styles.sb} to="/dashboard"><FontAwesomeIcon icon={faTachometerAlt} style={styles.icon} /> Dashboard</Link></li>
            <li><Link style={styles.sb} to="/employee"><FontAwesomeIcon icon={faUsers} style={styles.icon} /> Employees</Link></li>
            <li><Link style={styles.sb} to="/attendance"><FontAwesomeIcon icon={faCalendarCheck} style={styles.icon} /> Attendance</Link></li>
            <li><Link style={styles.sb} to="/leaveManagement"><FontAwesomeIcon icon={faCalendarAlt} style={styles.icon} /> Leave Management</Link></li>
            <li><Link style={styles.sb} to="/messages"><FontAwesomeIcon icon={faEnvelope} style={styles.icon} /> Message</Link></li>
            <li style={styles.btnActive}><Link style={styles.sb} to="/announcement"><FontAwesomeIcon icon={faBullhorn} style={styles.icon} /> Announcement</Link></li>
            <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faClipboardList} style={styles.icon} /> Audit Logs</Link></li>
            <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faUserCog} style={styles.icon} /> User Management</Link></li>
            <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faCog} style={styles.icon} /> Settings</Link></li>
            <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faSignOutAlt} style={styles.icon} /> Logout</Link></li>
          </ul>
      </div>
      
      <div style={styles.content}>

      <div style={styles.btnAddDel}>
                <h3>Announcement</h3>
            </div>
        
                <div style={styles.rows}>

                    <div style={styles.row1}>
                        <div style={styles.btnAddDel}>
                        </div>

                        <div style={styles.btnAddDel}>
                            <input style={styles.searchInput} placeholder='Search'/>
                            
                            <button style={styles.btnAdd}>
                                        Search
                            </button>
                            
                            <select style={styles.btnFilter}>
                                <option disabled selected>Filter</option>
                            </select>
                        </div>
                    </div>

                    <div style={styles.row1}>
                        <div style={styles.btnAddDel}>
                            <button style={styles.btnAdd}>
                                    <FontAwesomeIcon icon={faAdd} style={styles.iconAdd} />
                                        Add Announcement
                            </button>
                            <button style={styles.btnDel}>
                                    <FontAwesomeIcon icon={faTrash} style={styles.iconAdd} />
                                        Delete
                            </button>
                        </div>
                    </div>

            </div>

<table style={styles.table}>
  <thead>
    <tr>
      <th style={styles.th}>
        <input
          type="checkbox"
          checked={selectAll}
          onChange={handleSelectAll}
        />
      </th>
      <th style={styles.th}>Title</th>
      <th style={styles.th}>Status</th>
      <th style={styles.th}>Date Added</th>
      <th style={styles.th}>Last Updated</th>
      <th style={styles.th}>Actions</th>
    </tr>
  </thead>
  <tbody>
    {announcements.map(item => (
      <tr key={item.id}>
        <td style={styles.td}>
          <input
            type="checkbox"
            checked={item.checked}
            onChange={() => handleCheckboxChange(item.id)}
          />
        </td>
        <td style={styles.td}>{item.title}</td>
        <td style={styles.td}>{item.status}</td>
        <td style={styles.td}>{item.dateAdded}</td>
        <td style={styles.td}>{item.lastUpdated}</td>
        <td style={styles.td}>
          <button style={styles.actionBtn1}>
            <FontAwesomeIcon icon={faPen} style={{fontSize: '12px'}}/>  Edit</button>
          <button style={styles.actionBtn}>
            <FontAwesomeIcon icon={faSearch} style={{fontSize: '12px'}}/>  View</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

      </div>

      
      </div>
  );
}

const styles = {
  dashboardContainer: {
    minHeight: '100vh',
    backgroundColor: '#F8F8F8',
    display: 'flex'
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
    flex: 1
  },
  header1: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '20px',
    justifyContent: 'flex-start',
  },
  rows:{
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '20px'
  },
  btnAddDel: {
    display: 'flex',
    flexDirection: 'row',
    gap: '10px'
  },
  btnAdd: {
    backgroundColor: '#0088FF',
    padding: '5px 10px',
    border: 'none',
    borderRadius: '5px',
    fontWeight: '500',
    color: 'white'
  },
  btnDel: {
    backgroundColor: '#FF5353',
    padding: '5px 10px',
    border: 'none',
    borderRadius: '5px',
    fontWeight: '500',
    color: 'white'
  },
  iconAdd: {
    fontWeight: '600',
    paddingRight: '5px'
  },
  searchInput: {
    width: '400px',
    padding: '5px',
    borderRadius: '5px',
    border: '1px solid #00000070'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '8px',
    overflow: 'hidden',
    },
th: {
  textAlign: 'left',
  padding: '12px',
  backgroundColor: '#A8FC0080',
  borderBottom: '1px solid #ccc',
},
td: {
  padding: '12px',
  borderBottom: '1px solid #eee',
},
actionBtn: {
  marginRight: '10px',
  padding: '5px 10px',
  border: '1px solid #000000',
  borderRadius: '4px',
  cursor: 'pointer',
  backgroundColor: '#fff'
},
actionBtn1: {
  marginRight: '10px',
  padding: '5px 10px',
  backgroundColor: '#007BFF',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
},
btnFilter: {
    borderRadius: '5px',
    width: '100px'
},
btnActive: {
    backgroundColor: '#A8FC0080',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
},


  
};

export default Announcement;