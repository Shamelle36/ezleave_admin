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
  faCheckCircle,
  faUserPlus,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useState } from 'react';
import './dashboardCalendar.css';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { height, width } from '@fortawesome/free-solid-svg-icons/fa0';

function Dashboard() {
  const [date, setDate] = useState(new Date());

  const cardsData = [
  {
    title: 'Total Employees',
    description: '5% increase more than last month',
    value: 200,
    background: styles.card, 
    paddingTop: '5px',
  },
  {
    title: 'Total Employees',
    description: '3% less than last month',
    value: 200,
    background: styles.card,
    paddingTop: '20px',
  },
  {
    title: 'Total Employees',
    description: '5% less than last month',
    value: 200,
    background: styles.card,
    paddingTop: '20px',
  },
  {
    title: 'Total Employees',
    description: '2% increase more than last month',
    value: 200,
    background: styles.card1,
    paddingTop: '5px',
  },
  {
    title: 'Total Employees',
    description: '2% less than last month',
    value: 200,
    background: styles.card2,
    paddingTop: '20px',
  },
  {
    title: 'Total Employees',
    description: '2% less than last month',
    value: 200,
    background: styles.card3,
    paddingTop: '20px',
  },
];


  const employees = [
    { id: 1, name: 'Shamelle Tadeja', department: 'HR', timein: '8:00 AM', timeout: '4:00 PM', status: 'On-Time' },
    { id: 2, name: 'Reyland Tanglao', department: 'Finance', timein: '8:00 AM', timeout: '4:00 PM', status: 'Late' },
    { id: 3, name: 'Renz Retuya', department: 'IT', timein: '8:00 AM', timeout: '4:00 PM', status: 'Absent' },
    { id: 4, name: 'Angel Salgado', department: 'IT', timein: '8:00 AM', timeout: '4:00 PM', status: 'On-Time' },
    { id: 5, name: 'Jared Tamangan', department: 'Financer', timein: '8:00 AM', timeout: '4:00 PM', status: 'Absent' }
  ];

  const leave = [
    { id: 1, name: 'Shamelle Tadeja', leaveType: 'Vacation', department: 'HR', date: '2023-10-01', status: 'Approved' },
    { id: 2, name: 'Reyland Tanglao', leaveType: 'Sick', department: 'Finance', date: '2023-10-02', status: 'Pending' },
    { id: 3, name: 'Renz Retuya', leaveType: 'Emergency', department: 'IT', date: '2023-10-03', status: 'Rejected' },
    { id: 4, name: 'Angel Salgado', leaveType: 'Vacation', department: 'IT', date: '2023-10-04', status: 'Approved' },
    { id: 5, name: 'Jared Tamangan', leaveType: 'Sick', department: 'Financer', date: '2023-10-05', status: 'Pending' }
  ];

  const notifications = [
    { id: 1, message: 'Shamelle Tadeja\'s leave request approved.', type: 'Leave_Approval' },
    { id: 2, message: 'New employee onboarded in HR department.', type: 'New_Hire' },
    { id: 3, message: 'Reyland Tanglao\'s attendance marked as late today.', type: 'Attendance_Alert' },
    { id: 4, message: 'System update scheduled for 11 PM tonight.', type: 'System_Notice' },
  ];

  const getNotificationStyle = (type) => {
  switch (type) {
    case 'Leave_Approval':
      return { icon: faCheckCircle, color: '#28a745' }; 
    case 'New_Hire':
      return { icon: faUserPlus, color: '#007bff' }; 
    case 'Attendance_Alert':
      return { icon: faClock, color: '#ffc107' }; 
    case 'System_Notice':
      return { icon: faBell, color: '#17a2b8' }; 
    case 'Reminder':
      return { icon: faCalendarAlt, color: '#dc3545' }; 
    default:
      return { icon: faBell, color: '#6c757d' }; 
  }
};


  const data = [
    { name: 'Present', value: 400 },
    { name: 'Absent', value: 300 },
    { name: 'Late', value: 100 },
    { name: 'Leave', value: 200 },
  ];

  const dataBar = [
    { month: 'Jan', value: 15, fill: '#FF0000' },
    { month: 'Feb', value: 18, fill: '#FFA500' },
    { month: 'Mar', value: 9, fill: '#FFA500' },
    { month: 'Apr', value: 13, fill: '#FF0000' },
    { month: 'May', value: 22, fill: '#FFA500' },
    { month: 'Jun', value: 27, fill: '#0000FF' },
    { month: 'Jul', value: 17, fill: '#FF0000' },
    { month: 'Aug', value: 9, fill: '#0000FF' },
    { month: 'Sep', value: 14, fill: '#0000FF' },
    { month: 'Oct', value: 21, fill: '#FF0000' },
    { month: 'Nov', value: 15, fill: '#0000FF' },
    { month: 'Dec', value: 7, fill: '#FFA500' },
  ];

  const COLORS = ['#005EFF', '#FF0042', '#FFCC00', '#FF0599'];

  const RADIAN = Math.PI / 180;

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        fontSize="10"
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
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
            <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faTachometerAlt} style={styles.icon} /> Dashboard</Link></li>
            <li><Link style={styles.sb} to="/employee"><FontAwesomeIcon icon={faUsers} style={styles.icon} /> Employees</Link></li>
            <li><Link style={styles.sb} to="/attendance"><FontAwesomeIcon icon={faCalendarCheck} style={styles.icon} /> Attendance</Link></li>
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
              {cardsData.map((card, index) => (
                <div key={index} style={card.background}>
                  <p style={{ fontSize: '15px', fontWeight: '500' }}>{card.title}</p>
                  <p style={{ fontSize: '12px', paddingTop: '5px' }}>{card.description}</p>
                  <p style={{ fontSize: '25px', paddingTop: card.paddingTop, fontWeight: '600' }}>
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

          
          <div style={styles.calendar}>
            <Calendar
              onChange={setDate}
              value={date}
              locale="en-US"
              formatShortWeekday={(_, date) => {
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return days[date.getDay()];
              }}
              next2Label={null}
              prev2Label={null}
            />
          </div>
        </div>

        <div style={styles.row2}>
          <div style={styles.tableContainer}>
            <h5 style={{padding: '5px'}}>Attendance Status</h5>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Time In</th>
                  <th style={styles.th}>Time Out</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td style={styles.td}>{emp.id}</td>
                    <td style={styles.td}>{emp.name}</td>
                    <td style={styles.td}>{emp.department}</td>
                    <td style={styles.td}>{emp.timein}</td>
                    <td style={styles.td}>{emp.timeout}</td>
                    <td style={styles.td}>{emp.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.tableContainer}>
            <h5 style={{padding: '5px'}}>Leave Status</h5>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Leave Type</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leave.map(item => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.id}</td>
                    <td style={styles.td}>{item.name}</td>
                    <td style={styles.td}>{item.leaveType}</td>
                    <td style={styles.td}>{item.department}</td>
                    <td style={styles.td}>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={styles.row3}>
          <div style={styles.chartContainer}>
            <h4>Attendance Statistics</h4>
            <div style={styles.pieAndLegend}>
              <PieChart width={200} height={185}>
                <Pie
                  data={data}
                  cx={90}
                  cy={90}
                  innerRadius={35}
                  outerRadius={60}
                  labelLine={false}
                  label={renderCustomizedLabel}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
              <div style={styles.legendContainer}>
                {data.map((entry, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: COLORS[index % COLORS.length],
                      marginRight: 8
                    }} />
                    <span style={{ fontSize: '13px' }}>{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.cardBar}>
            <div style={styles.header5}>
              <h3 style={styles.title}>Monthly Leaves Filed</h3>
              <select style={styles.dropdown}>
                <option>Leave Type</option>
                <option>Vacation</option>
                <option>Sick</option>
                <option>Emergency</option>
              </select>
            </div>
            <div style={{ width: '330px' }}>
              <ResponsiveContainer width={"100%"} height={165}>
                <BarChart data={dataBar}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#000' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#000' }}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.notificationContainer}>
           <ul style={styles.notificationList}>
                {notifications.map(notification => {
                  const { icon, color } = getNotificationStyle(notification.type);

                  return (
                    <li key={notification.id} style={styles.notificationItem}>
                      <FontAwesomeIcon
                        icon={icon}
                        style={{ ...styles.notificationIcon, color }}
                      />

                      <span style={styles.notificationText}>
                        {notification.message}
                      </span>

                      <button style={styles.viewButton}>View Details</button>
                    </li>
                  );
                })}
              </ul>
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
    marginLeft: '280px', 
    minHeight: '100vh',
    backgroundColor: '#F8F8F8',
    paddingTop: '70px', 
    width: 'calc(100% - 280px)', 
    boxSizing: 'border-box',
  },
  cnt1: {
    display: 'flex',
    flexDirection: 'row',
    margin: '0 auto',
    padding: '20px',
    gap: '20px',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  cards: {
    display: 'flex',
    flexWrap: 'wrap',
    flex: '2', 
    justifyContent: 'space-between',
    gap: '5px',
    flex: '1 1 600px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px',
    margin: '10px 0', 
    textAlign: 'left',
    width: 'calc(33.333% - 10px)', 
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  card1:{
    backgroundColor: '#07A5FA55',
    borderRadius: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px',
    margin: '10px 0', 
    textAlign: 'left',
    width: 'calc(33.333% - 10px)', 
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  card2: {
    backgroundColor: '#EA050555',
    borderRadius: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px',
    margin: '10px 0', 
    textAlign: 'left',
    width: 'calc(33.333% - 10px)', 
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  card3: {
    backgroundColor: '#FAAB0055',
    borderRadius: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px',
    margin: '10px 0', 
    textAlign: 'left',
    width: 'calc(33.333% - 10px)', 
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  calendar: {
    borderRadius: '8px',
    maxWidth: '550px',
    minWidth: '280px', 
    padding: '10px',
    flex: '1 1 auto', 
    minWidth: '280px',
    boxSizing: 'border-box',
    flex: '1 1 250px',
  },

  row2: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '20px',
    alignItems: 'flex-start',
    gap: '20px',
    flexWrap: 'wrap', 
  },
  tableContainer: {
    flex: '1 1 60%', 
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '10px',
    minWidth: '300px', 
    maxWidth: '580px', 
    boxSizing: 'border-box',
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
  },
  th: {
    fontSize: '12px',
    padding: '10px',
    borderBottom: '1px solid #ddd',
    textAlign: 'left',
  },
  td: {
    padding: '10px',
    fontSize: '12px',
    backgroundColor: 'white',
    borderBottom: '1px solid #f2f2f2',
  },

  row3: {
    display: 'flex',
    flexDirection: 'row',
    padding: '20px',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    gap: '20px',
    flexWrap: 'wrap', 
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '10px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'column',
    flex: '1 1 300px', 
    minWidth: '280px', 
    maxWidth: '400px',
    boxSizing: 'border-box',
  },
  pieAndLegend: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  legendContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  cardBar: {
    backgroundColor: '#fff',
    padding: '10px',
    borderRadius: '10px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
    flex: '1 1 350px',
    minWidth: '300px',
    maxWidth: '450px',
    boxSizing: 'border-box',
  },
  header5: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  title: {
    margin: 0,
    fontSize: '15px',
  },
  dropdown: {
    padding: '6px 10px',
    borderRadius: '6px',
    backgroundColor: 'white',
    border: '1px solid black',
    color: '#000',
    fontWeight: '600',
    cursor: 'pointer',
  },
  notificationContainer: {
    borderRadius: '12px',
    flex: '1 1 350px',
    minWidth: '300px',
    maxWidth: '550px',
    boxSizing: 'border-box',
  },
  notificationList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  notificationItem: {
    padding: '10px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    backgroundColor: '#fff',
    boxShadow: '0 1px 5px rgba(0,0,0,0.1)',
    borderRadius: '5px',
    marginBottom: '11px',
  },

  notificationIcon: {
    fontSize: '16px',
    color: '#009205',
    flexShrink: 0,
  },

  notificationText: {
    flex: 1,
    fontSize: '13px',          
    marginRight: '10px',
    whiteSpace: 'nowrap',      
    overflow: 'hidden',
    textOverflow: 'ellipsis',  
  },


  viewButton: {
    backgroundColor: '#FDFF76',
    color: '#4F4F4F',
    border: 'none',
    padding: '5px 5px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '12px',
    width: '100px',
    fontWeight: '600',
  },
};

export default Dashboard;