import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import 'react-calendar/dist/Calendar.css';
import { supabase } from './lib/supabase'; // Ensure this import is valid
import './dashboardCalendar.css';
import { height, width } from '@fortawesome/free-solid-svg-icons/fa0';

function EmployeeProfile() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [departments, setDepartments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
  const fetchEmployeeAndDepartments = async () => {
    const [{ data: employeeData, error: employeeError }, { data: departmentData, error: departmentError }] = await Promise.all([
      supabase.from('employees').select('*').eq('id', id).single(),
      supabase.from('departments').select('id, name')
    ]);

    if (!employeeError) setEmployee(employeeData);
    if (!departmentError) setDepartments(departmentData);
  };

  fetchEmployeeAndDepartments();
}, [id]);

  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.header}>
        <div>
            <button
                onClick={() => navigate(-1)}
                style={styles.backBtn}
                >
                <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: '8px' }} />
            </button>
        </div>

        <div>
            <input type="text" placeholder="Search..." style={styles.search} />
            <FontAwesomeIcon icon={faBell} style={styles.iconBell} />
        </div>
      </div>

      <div style={styles.sidebar}>
        <img src={require('./images/logo_ez.png')} alt="logo" style={styles.logo} />
        <ul style={styles.sidebarList}>
          <li><Link style={styles.sb} to="/dashboard"><FontAwesomeIcon icon={faTachometerAlt} style={styles.icon} /> Dashboard</Link></li>
          <li style={styles.btnActive}><Link style={styles.sb} to="/employee"><FontAwesomeIcon icon={faUsers} style={styles.icon} /> Employees</Link></li>
          <li><Link style={styles.sb} to="/attendance"><FontAwesomeIcon icon={faCalendarCheck} style={styles.icon} /> Attendance</Link></li>
          <li><Link style={styles.sb} to="/leaveManagement"><FontAwesomeIcon icon={faCalendarAlt} style={styles.icon} /> Leave Management</Link></li>
          <li><Link style={styles.sb} to="/messages"><FontAwesomeIcon icon={faEnvelope} style={styles.icon} /> Message</Link></li>
          <li><Link style={styles.sb} to="/announcement"><FontAwesomeIcon icon={faBullhorn} style={styles.icon} /> Announcement</Link></li>
          <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faClipboardList} style={styles.icon} /> Audit Logs</Link></li>
          <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faUserCog} style={styles.icon} /> User Management</Link></li>
          <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faCog} style={styles.icon} /> Settings</Link></li>
          <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faSignOutAlt} style={styles.icon} /> Logout</Link></li>
        </ul>
      </div>

      <div style={styles.content1}>
        {!employee ? (
          <p>Loading...</p>
        ) : (
          <div>

            <div style={styles.tabContainer}>
                

                <button
                    style={tabButtonStyle(activeTab === 'overview')}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>

                <button
                    style={tabButtonStyle(activeTab === 'attendance')}
                    onClick={() => setActiveTab('attendance')}
                >
                    Attendance Record
                </button>
            </div>

            {activeTab === 'overview' && (
              <div style={styles.overviewCon}>
                  <div style={styles.profileInfo}>
                      <div style={styles.profileContainer}>
                        <div style={styles.imageWrapper}>
                            {employee.profile_url ? (
                              <img src={employee.profile_url} alt="Profile" style={styles.profileImage} />
                            ) : (
                              <div style={styles.initialsPlaceholder}>
                                {employee.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                              </div>
                            )}
                            </div>
                        <p style={styles.fname}>{employee.full_name}</p>
                      </div>

                        
                          <div style={styles.info}>
                            <label style={styles.lbl}>ID Number</label>
                            <p>{employee.id_number}</p>
                          </div>
                          
                          <div style={styles.info}>
                            <label style={styles.lbl}>Contact Number</label>
                            <p>{employee.contact_number}</p>
                          </div>

                          <div style={styles.info}>
                            <label style={styles.lbl}>Position</label>
                            <p>{employee.position}</p>
                          </div>

                          <div style={styles.info}>
                            <label style={styles.lbl}>Status</label>
                            <p>{employee.employment_status}</p>
                          </div>

                    </div>

                    <div style={styles.lvlCrdt}>
                      <p style={styles.leaveCreditsLbl}>Leave Credits</p>

                        <div style={styles.lvType}>

                          <div style={styles.lblLeave}>
                            <p>Sick Leave</p>
                          </div>

                          <div style={styles.lvlBal}>

                            <div style={styles.sickL}>
                              <p style={styles.lblEn}>15</p>
                              <p style={styles.lblName}>Entitled</p>
                            </div>

                            <div style={styles.sickL}>
                              <p style={styles.lblUs}>0</p>
                              <p style={styles.lblName}>Used</p>
                            </div>

                            <div style={styles.sickL}>
                              <p style={styles.lblRe}>15</p>
                              <p style={styles.lblName}>Remaining</p>
                            </div>

                          </div>
                        </div>
                    </div>

                </div>
            )}


            {activeTab === 'attendance' && (
              <div>
                <p>Attendance record details will go here...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const tabButtonStyle = (active) => ({
  backgroundColor: active ? '#5ab049ff' : '#ffffffff',
  color: active ? '#fefcf5' : 'black',
  border: 'none',
  borderBottom: active ? 'none' : 'none',
  cursor: 'pointer',
  fontWeight: active? '600': 'normal',
  borderRadius: '5px',
  padding: '10px 16px',
  fontSize: '14px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
  boxShadow: active ? 'inset 1px 1px 2px rgba(44, 44, 44, 0.44)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
});


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
    justifyContent: 'space-between',
    padding: '10px',
    backgroundColor: '#009205',
    position: 'fixed',
    top: '0',
    left: '280px',
    width: 'calc(100% - 280px)',
    zIndex: 1000,
    boxSizing: 'border-box',
  },
  content1: {
    marginLeft: '280px',
    padding: '80px 20px 20px 15px',
    minHeight: '100vh',
    backgroundColor: '#F8F8F8',
    boxSizing: 'border-box',
    
  },
  btnActive: {
    backgroundColor: '#A8FC0080',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  tabContainer: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
  },
  backBtn: {
    backgroundColor: '#009205',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '20px',
  },
  profileContainer: {
    display: 'flex',
    marginBottom: '20px'
  },
  imageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    border:'1px solid rgba(205, 205, 205, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px',
    width: '100px',
    height: '100px',
    borderRadius: '10px'
  },
  profileInfo: {
    backgroundColor: '#ffffffff',
    width: '400px',
    height: 'auto',
    padding: '20px',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '5px',
  },
  info: {
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(205, 205, 205, 1)',
    marginBottom: '15px'
  },
  fname: {
    marginTop: '5px',
    marginBottom: '10px',
    fontWeight: '500',
    marginLeft: '20px'
  },
  lbl: {
    fontSize: '14px',
  },
  overviewCon: {
    display: 'flex',
    flexDirection: 'row',
    gap: '30px',
    
  },
  lvlCrdt: {
    backgroundColor: '#ffffffff',
    padding: '10px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    borderRadius: '10px'
  },
  lvType: {
    border: '1px solid rgba(205, 205, 205, 1)',
    padding: '10px',
    borderRadius: '10px'
  },
  lvlBal: {
    display: 'flex',
    flexDirection: 'row',
    gap: '50px',
  },
  sickL: {
    display: 'flex',
    flexDirection: 'row',
    borderRadius: '5px'
  },
  lblEn: {
    backgroundColor: '#D6EAF8',
    padding: '10px 20px',
    fontSize: '25px',
    fontWeight: '600',
    borderRight: '1px solid #000',
    borderRadius: '5px 0 0 5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    color: '#1B4F72'
  },
  lblUs: {
    backgroundColor: '#FADBD8',
    padding: '10px 20px',
    fontSize: '25px',
    fontWeight: '600',
    borderRight: '1px solid #000',
    borderRadius: '5px 0 0 5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    color: '#922B21',
  },
  lblRe: {
    backgroundColor: '#D5F5E3',
    padding: '10px 20px',
    fontSize: '25px',
    fontWeight: '600',
    borderRight: '1px solid #000',
    borderRadius: '5px 0 0 5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    color: '#145A32',
  },
  lblName: {
    padding: '16px 20px',
    backgroundColor: '#fbfcf8',
    borderRadius: '0 5px 5px 0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    width: '150px'
  },
  lblLeave: {
    borderBottom: '1px solid rgba(205, 205, 205, 1)',
    marginBottom: '5px',
    fontSize: '16px',
    fontWeight: '600'
  },
  leaveCreditsLbl: {
    fontSize: '20px',
    fontWeight: '600'
  }

};

export default EmployeeProfile;
