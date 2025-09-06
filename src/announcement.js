import React, { useEffect, useState } from 'react';
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
import './dashboardCalendar.css';

function Announcement() {
  const [showModal, setShowModal] = useState(false);

  const [announcements, setAnnouncements] = useState(() => {
    // load from localStorage if available
    const saved = localStorage.getItem('announcements');
    return saved
      ? JSON.parse(saved)
      : [
          {
            title: 'Power Interruption',
            details: 'There will be a scheduled power interruption in the municipal hall.',
            priority: 'Urgent',
            posted_on: '2025-07-28',
            posted_by: 'Admin User',
            position: 'System Admin',
          },
        ];
  });

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    details: '',
    priority: 'Normal',
  });

  // save announcements to localStorage
  useEffect(() => {
    localStorage.setItem('announcements', JSON.stringify(announcements));
  }, [announcements]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAnnouncement((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addAnnouncement = () => {
    const today = new Date().toISOString().split('T')[0];
    const newPost = {
      ...newAnnouncement,
      posted_on: today,
      posted_by: 'Admin User',
      position: 'System Admin',
    };

    setAnnouncements([newPost, ...announcements]);
    setNewAnnouncement({ title: '', details: '', priority: 'Normal' });
    setShowModal(false);
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
          <li><Link style={styles.sb} to="/audit_logs"><FontAwesomeIcon icon={faClipboardList} style={styles.icon} /> Audit Logs</Link></li>
          <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faUserCog} style={styles.icon} /> User Management</Link></li>
          <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faCog} style={styles.icon} /> Settings</Link></li>
          <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faSignOutAlt} style={styles.icon} /> Logout</Link></li>
        </ul>
      </div>

      <div style={styles.content}>
        <div style={styles.announcementBoard}>
          <p style={{ fontSize: '20px', fontWeight: '600' }}>Announcement</p>

          <div style={styles.announcementFilter}>
            <div style={styles.announcementLeft}>
              <input style={styles.searchInput} placeholder="Search" />
              <select style={styles.filterBtn}>
                <option>Priority</option>
                <option>High</option>
                <option>Normal</option>
                <option>Urgent</option>
              </select>
              <select style={styles.filterBtn}>
                <option>Visibility</option>
                <option>All Employee</option>
              </select>
            </div>
            <div>
              <button style={styles.postBtn} onClick={() => setShowModal(true)}>Post</button>
            </div>
          </div>

          {announcements.map((announcement, index) => (
            <div
              key={index}
              style={{
                ...styles.announcementCardContent,
                borderLeft: `10px solid ${getPriorityColor(announcement.priority)}`,
              }}
            >
              <div style={styles.announcementRow1}>
                <div style={styles.announcementSender}>
                  <div style={styles.announcementProfile}></div>
                  <div style={styles.announcementName}>
                    <p style={styles.lblName}>{announcement.posted_by}</p>
                    <p style={styles.lblPosition}>{announcement.position}</p>
                  </div>
                </div>
                <div style={styles.announcementDate}>
                  <p style={styles.lblDate}>{announcement.posted_on}</p>
                  <p style={styles.lblPriority}>{announcement.priority}</p>
                </div>
              </div>

              <div style={styles.announcementDetails}>
                <div style={styles.announcementText}>
                  <p style={styles.lblTitle}>{announcement.title}</p>
                  <p style={styles.lblDetails}>{announcement.details}</p>
                </div>
                <div style={styles.announcementRead}>
                  <button style={styles.readBtn}>Read More</button>
                </div>
              </div>
            </div>
          ))}

          {showModal && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalContainer}>
                <p style={styles.postAnnouncement}>Post Announcement</p>
                <div style={styles.modalInputs}>
                  <div style={styles.inputsRow}>
                    <div>
                      <label>To:</label>
                      <select style={styles.selects}>
                        <option>All Employee</option>
                      </select>
                    </div>
                    <div>
                      <select
                        style={styles.selects}
                        name="priority"
                        value={newAnnouncement.priority}
                        onChange={handleInputChange}
                      >
                        <option value="High">High</option>
                        <option value="Normal">Normal</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div style={styles.inputsRow2}>
                    <label>Title:</label>
                    <input
                      type="text"
                      name="title"
                      value={newAnnouncement.title}
                      onChange={handleInputChange}
                      placeholder="Enter title..."
                      style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                  </div>
                  <div style={styles.inputsRow2}>
                    <label>Details:</label>
                    <textarea
                      name="details"
                      value={newAnnouncement.details}
                      onChange={handleInputChange}
                      style={styles.txtArea}
                    />
                  </div>
                  <div style={styles.btnUploads}>
                    <button style={styles.btnFile}>Upload File</button>
                    <button style={styles.btnImage}>Upload Image</button>
                  </div>
                </div>
                <div style={styles.btnBottom}>
                  <button style={styles.btnPost} onClick={addAnnouncement}>Post</button>
                  <button style={styles.btnCancel} onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Priority colors
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High': return '#FF5C5C';
    case 'Normal': return '#F5A623';
    case 'Urgent': return '#D0021B';
    default: return '#4A90E2';
  }
};

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
  searchInput: {
    width: '400px',
    padding: '5px',
    borderRadius: '5px',
    border: '1px solid #00000070'
  },

  btnActive: {
      backgroundColor: '#A8FC0080',
      borderRadius: '5px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  },

  announcementFilter: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px'
  },

  announcementLeft: {
    display: 'flex',
    gap: '10px',
  },

  filterBtn: {
    padding: '5px',
    borderRadius: '5px',
    border: '1px solid #00000070'
  },

  postBtn: {
    padding: '5px 20px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#A8FC0080',
    boxShadow: '2px 2px 2px rgba(0, 0, 0, 0.16)'
  },

  announcementCardContent: {
    backgroundColor: '#fcf8fc',
    padding: '15px',
    borderRadius: '10px',
    borderLeft: '10px solid #4a90e2',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
    marginTop: ' 20px'
  },

  announcementProfile: {
    backgroundColor: '#6ecf68',
    width: '40px',
    height: '40px',
    borderRadius: '50px'
  },

  announcementSender: {
    display: 'flex',
    flexDirection: 'row',
    gap: '10px'
  },
  
  lblName: {
    fontWeight: '500',
    fontSize: '14px',
  },

  lblPosition: {
    fontSize: '12px',
    color: '#6d6d6dfb'
  },

  announcementRow1: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  announcementDate: {
    display:'flex',
    flexDirection: 'row',
    gap: '5px',
    alignItems: 'center'
  },

  lblDate: {
    fontSize: '12px',
  },

  lblPriority: {
    fontSize: '14px',
    backgroundColor: '#ff5c5c',
    padding: '2px 3px',
    borderRadius: '5px',
    color: '#fff',
    fontWeight: '500'
  },

  announcementDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: '5px',
    marginTop: '10px'
  },

  lblTitle: {
    fontWeight: '600',
    fontSize: '20px'
  },

  lblDetails: {
    fontSize: '14px',
  },

  readBtn: {
    padding: '5px 10px',
    fontWeight: '500',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#4a90e2',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out'
  },

  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },

  modalContainer: {
    backgroundColor: '#ffffff',
    width: '500px',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  inputsColumn: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  btnFile: {
    padding: '8px 15px',
    borderRadius: '6px',
    backgroundColor: '#ff574b',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    marginRight: '10px',
    boxShadow: '1px 1px 2px rgba(0, 0, 0, 0.57)',
    fontWeight: '500'
  },

  btnImage: {
    padding: '8px 15px',
    borderRadius: '6px',
    backgroundColor: '#9cff4b',
    color: '#000',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '1px 1px 2px rgba(0, 0, 0, 0.57)',
    fontWeight: '500'
  },

  inputsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px'
  },

  inputsRow2: {
    display: 'flex',
    flexDirection: 'column'
  },

  btnBottom: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
    justifyContent: 'flex-end'
  },

  btnPost: {
    backgroundColor: '#001eff',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },

  btnCancel: {
    backgroundColor: '#ccc',
    color: '#000',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },

  modalInputs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },

  txtArea: {
    width: '100%',
    height: '100px',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
    resize: 'vertical',
  },

  selects: {
    padding: '3px 10px',
    marginLeft: '5px',
    borderRadius: '5px',
  },

  postAnnouncement: {
    borderBottom: '1px solid #dcdcdcff',
    fontSize: '20px',
    fontWeight: '500'
  }
};


export default Announcement;