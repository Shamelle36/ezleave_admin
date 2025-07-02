import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const LeaveCalendar = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= numDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const days = getDaysInMonth(currentMonth);

  const employees = [
    {
      id: '123456789',
      name: 'Renz Retuya',
      role: 'Officer 1',
      img: 'https://i.pravatar.cc/40?u=renz',
      leaves: [
        { type: 'Vacation Leave', start: '2025-04-03', end: '2025-04-05' },
        { type: 'Sick Leave', start: '2025-04-02', end: '2025-04-02' },
        { type: 'Maternity Leave', start: '2025-04-05', end: '2025-04-07' },
      ],
    },
  ];

  const leaveColors = {
    'Sick Leave': 'red',
    'Vacation Leave': 'blue',
    'Maternity Leave': 'orange',
  };

  const isWithinLeave = (date, leave) => {
    const current = new Date(date);
    const start = new Date(leave.start);
    const end = new Date(leave.end);
    return current >= start && current <= end;
  };

  const formatMonthYear = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const navigate = useNavigate();

  const goToLeaveSummary = () => {
    navigate('/leaveManagement');
  }

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
          <li style={styles.btnActive}><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faCalendarAlt} style={styles.icon} /> Leave Management</Link></li>
          <li><Link style={styles.sb} to="/messages"><FontAwesomeIcon icon={faEnvelope} style={styles.icon} /> Message</Link></li>
          <li><Link style={styles.sb} to="/announcement"><FontAwesomeIcon icon={faBullhorn} style={styles.icon} /> Announcement</Link></li>
          <li><Link style={styles.sb} to="/audit_logs"><FontAwesomeIcon icon={faClipboardList} style={styles.icon} /> Audit Logs</Link></li>
          <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faUserCog} style={styles.icon} /> User Management</Link></li>
          <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faCog} style={styles.icon} /> Settings</Link></li>
          <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faSignOutAlt} style={styles.icon} /> Logout</Link></li>
        </ul>
      </div>

      <div style={styles.content}>
        <div style={styles.buttons}>
          <button style={styles.btnLeave} onClick={goToLeaveSummary}>Leave Summary</button>
          <button style={styles.btnLeave}>Leave Calendar</button>
          <button style={styles.btnLeave}>Employee Requests</button>
        </div>

        <div style={styles.header1}>
          <h3>Employees on Leave</h3>
        </div>

        <div style={styles.calendar}>
          <div style={styles.calHeader}>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>←</button>
            <h2>{formatMonthYear(currentMonth)}</h2>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>→</button>
          </div>

          <div style={styles.main}>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Employees</th>
                    {days.slice(0, 7).map((d, i) => (
                      <th key={i} style={styles.th}>{d.getDate()}<br />{d.toLocaleString('default', { weekday: 'short' })}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => (
                    <tr key={i}>
                      <td style={styles.td}>
                        <div style={styles.empInfo}>
                          <img src={emp.img} alt={emp.name} style={styles.img} />
                          <div>
                            <div style={styles.empName}>{emp.name}</div>
                            <div style={styles.empRole}>{emp.role}</div>
                          </div>
                        </div>
                      </td>
                      {days.slice(0, 7).map((date, j) => {
                        const leave = emp.leaves.find(l => isWithinLeave(date, l));
                        return (
                          <td key={j} style={styles.td}>
                            {leave && (
                              <div style={{ ...styles.leaveBlock, backgroundColor: leaveColors[leave.type] }}>
                                {leave.type}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

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
  buttons: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  btnLeave: {
    padding: '10px 15px',
    backgroundColor: '#009205',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  calendar: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
  },
  calHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '20px',
  },
  main: {
    overflowX: 'auto',
  },
  tableWrapper: {
    width: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
  },
  th: {
    padding: '10px',
    border: '1px solid #ccc',
    textAlign: 'center',
    minWidth: '120px'
  },
  td: {
    padding: '10px',
    border: '1px solid #ccc',
    textAlign: 'center',
    minWidth: '120px'
  },
  empInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  img: {
    width: '35px',
    height: '35px',
    borderRadius: '50%'
  },
  empName: {
    fontWeight: 'bold'
  },
  empRole: {
    fontSize: '12px',
    color: '#555'
  },
  leaveBlock: {
    padding: '5px',
    color: 'white',
    fontSize: '12px',
    borderRadius: '4px',
    textAlign: 'center'
  },
  btnActive: {
    backgroundColor: '#A8FC0080',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  }
};

export default LeaveCalendar;
