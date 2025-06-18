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
  faTimesCircle,
  faChevronLeft,
  faChevronRight,
  faUser,
  faSearch,
  faPrint,
  faDownLeftAndUpRightToCenter,
  faUpDown,
  faFileExport,
  faExpandArrowsAlt,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useState } from 'react';
import './dashboardCalendar.css';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { height, width } from '@fortawesome/free-solid-svg-icons/fa0';
import { BiBorderRight } from 'react-icons/bi';
import { faUpload } from '@fortawesome/free-solid-svg-icons/faUpload';

function LeaveManagement() {

const [date, setDate] = useState(new Date());

  const [leaveRecords, setLeaveRecords] = useState([
    {
      name: 'Reyland S. Tanglao',
      department: 'Human Resource Management Division',
      leaveType: 'Vacation Leave',
      entitled: 15,
      used: 5,
      remaining: 10,
      status: 'Approved',
      approvedBy: 'Marites D. Lopez',
      dateFiled: 'May 1, 2025',
      range: { from: 'May 3, 2025', to: 'May 5, 2025' },
    },
    {
      name: 'Raven P. Quijano',
      department: 'Office of the Municipal Mayor',
      leaveType: 'Sick Leave',
      entitled: 10,
      used: 2,
      remaining: 8,
      status: 'Pending',
      approvedBy: '—',
      dateFiled: 'May 2, 2025',
      range: { from: 'May 4, 2025', to: 'May 4, 2025' },
    },
    {
      name: 'Angel Love B. Salgado',
      department: 'Municipal Health Office',
      leaveType: 'Maternity Leave',
      entitled: 105,
      used: 20,
      remaining: 85,
      status: 'Approved',
      approvedBy: 'Dr. Eliza R. Santos',
      dateFiled: 'April 15, 2025',
      range: { from: 'May 3, 2025', to: 'August 15, 2025' },
    },
    {
      name: 'Angel Love B. Salgado',
      department: 'Municipal Health Office',
      leaveType: 'Maternity Leave',
      entitled: 105,
      used: 20,
      remaining: 85,
      status: 'Approved',
      approvedBy: 'Dr. Eliza R. Santos',
      dateFiled: 'April 15, 2025',
      range: { from: 'May 3, 2025', to: 'August 15, 2025' },
    },
    {
      name: 'Reyland S. Tanglao',
      department: 'Human Resource Management Division',
      leaveType: 'Vacation Leave',
      entitled: 15,
      used: 5,
      remaining: 10,
      status: 'Approved',
      approvedBy: 'Marites D. Lopez',
      dateFiled: 'May 1, 2025',
      range: { from: 'May 3, 2025', to: 'May 5, 2025' },
    },
    {
      name: 'Raven P. Quijano',
      department: 'Office of the Municipal Mayor',
      leaveType: 'Sick Leave',
      entitled: 10,
      used: 2,
      remaining: 8,
      status: 'Pending',
      approvedBy: '—',
      dateFiled: 'May 2, 2025',
      range: { from: 'May 4, 2025', to: 'May 4, 2025' },
    },
    
  ]);

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  const goToPreviousDay = () => {
    const prev = new Date(date);
    prev.setDate(prev.getDate() - 1);
    setDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    setDate(next);
  };

    const handlePrint = () => {
        window.print();
    };

    const handleRefresh = () => {
        window.location.reload(); 
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
                <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faCalendarAlt} style={styles.icon} /> Leave Management</Link></li>
                <li><Link style={styles.sb} to="/messages"><FontAwesomeIcon icon={faEnvelope} style={styles.icon} /> Message</Link></li>
                <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faBullhorn} style={styles.icon} /> Announcement</Link></li>
                <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faClipboardList} style={styles.icon} /> Audit Logs</Link></li>
                <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faUserCog} style={styles.icon} /> User Management</Link></li>
                <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faCog} style={styles.icon} /> Settings</Link></li>
                <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faSignOutAlt} style={styles.icon} /> Logout</Link></li>
            </ul>
        </div>

        <div style={styles.content}>

            <div style={styles.buttons}>
                <button style={styles.btnLeave}>Leave Summary</button>
                <button style={styles.btnLeave}>Leave Calendar</button>
                <button style={styles.btnLeave}>Employee Requests</button>
            </div>

            <div style={styles.header1}>
                <h3>Overview</h3>
                <div style={styles.line}></div>

                 <div style={styles.dateNav}>
                        <button style={styles.navButton} onClick={goToPreviousDay}>
                        <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <span style={styles.dateText}>{formatDate(date)}</span>
                        <button style={styles.navButton} onClick={goToNextDay}>
                        <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                </div>

            </div>

                <div style={styles.summaryCards}>

                    <div style={styles.card}>
                        <div style={styles.cardContent}>
                            <div style={styles.cardData}>
                                <div style={styles.data1}>
                                <p style={styles.txtlabel}>Total Requests</p>
                                <p style={styles.txtData}>{leaveRecords.length}</p>
                            </div>
                        </div>
                        </div>
                    </div>

                    <div style={styles.card1}>
                        <div style={styles.cardContent}>
                            <div style={styles.cardData}>
                                <div style={styles.data1}>
                                    <p style={styles.txtlabel}>Approved Leaves</p>
                                    <p style={styles.txtData}>{leaveRecords.filter(l => l.status === 'Approved').length}</p>
                                </div>
                        </div>
                        </div>
                    </div>

                    <div style={styles.card2}>
                        <div style={styles.cardContent}>
                            <div style={styles.cardData}>

                                <div style={styles.data1}>
                                    <p style={styles.txtlabel}>Pending Leaves</p>
                                    <p style={styles.txtData}>{leaveRecords.filter(l => l.status === 'Pending').length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                     <div style={styles.card3}>
                        <div style={styles.cardContent}>
                            <div style={styles.cardData}>
                                <div style={styles.data1}>
                                    <p style={styles.txtlabel}>Rejected Leaves</p>
                                    <p style={styles.txtData}>{leaveRecords.filter(l => l.status === 'Rejected').length}</p>
                                </div>
                            </div>
                        </div>
                    </div>


                    
                </div>

            <div style={styles.inputs}>

                <div style={styles.row1}>
                    <div style={styles.firstRow}>
                        <FontAwesomeIcon icon={faSearch} style={styles.iconSearch}/>
                        <input style={styles.input1} placeholder='Search Employee'/>
                    </div>

                    <div style={styles.firstRow}>
                        <select style={styles.filter}>
                            <option disabled selected>Leave Type</option>
                            <option>Sick Leave</option>
                            <option>Vacation Leave</option>
                            <option>Absent</option>
                            <option>On-Leave</option>
                        </select>

                        <select style={styles.filter}>
                            <option disabled selected>Department</option>
                            <option>Office of the Municipal Mayor</option>
                            <option>Human Resource Management Division</option>
                            <option>Business Permit and Licensing Division</option>
                            <option>Sangguniang Bayan Office</option>
                            <option>Office of the Municipal Accountant</option>
                            <option>Office of the Assessor</option>
                            <option>Municipal Budget Office</option>
                            <option>Municipal Planning and Development Office</option>
                            <option>Office of the Municipal Engineer</option>                     
                            <option>Municipal Risk Reduction and Management Office</option>                     
                            <option>Municipal Social Welfare and Development Office</option>                     
                            <option>Municipal Environment and Natural Resources Office</option>                     
                            <option>Office of the Municipal Agriculturist</option>                     
                            <option>Municipal General Services Office</option>                     
                            <option>Municipal Public Employment Service Office</option>                     
                            <option>Municipal Health Office</option>                     
                            <option>Municipal Treasurer's Office</option>                     
                        </select>
                    </div>
                </div> 
                

                <div style={styles.row2}>
                    <button style={styles.btn1}>
                        <FontAwesomeIcon icon={faUpload} style={styles.iconBtn}/>
                        Export
                    </button>
                    <button onClick={handlePrint} style={styles.btn2}>
                        <FontAwesomeIcon icon={faPrint} style={styles.iconBtn1}/>
                        Print
                    </button>
                    <button onClick={handleRefresh} style={styles.btn3}>
                        <FontAwesomeIcon icon={faRefresh} style={styles.iconBtn1}/>
                        Refresh
                    </button>
                </div>

            </div>

            <div style={styles.tableCon}>
            
            <table style={styles.table}>
                <thead>
                <tr>
                    <th style={styles.th}>No.</th>
                    <th style={styles.th}>Employee Name</th>
                    <th style={styles.th}>Department</th>
                    <th style={styles.th}>Leave Type</th>
                    <th style={styles.th}>Entitled</th>
                    <th style={styles.th}>Used</th>
                    <th style={styles.th}>Remaining</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Approved By</th>
                    <th style={styles.th}>Date Filed</th>
                    <th style={styles.th}>Range</th>
                </tr>
                </thead>
                <tbody>
                {leaveRecords.map((record, index) => (
                    <tr key={index}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>{record.name}</td>
                    <td style={styles.td}>{record.department}</td>
                    <td style={styles.td}>{record.leaveType}</td>
                    <td style={styles.td}>{record.entitled}</td>
                    <td style={styles.td}>{record.used}</td>
                    <td style={styles.td}>{record.remaining}</td>
                    <td style={styles.td}>{record.status}</td>
                    <td style={styles.td}>{record.approvedBy}</td>
                    <td style={styles.td}>{record.dateFiled}</td>
                    <td style={styles.td}>{record.range.from} - {record.range.to}</td>
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
    marginLeft: '300px', // Adjusted to account for the sidebar width
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
  line: {
    width: '2px',
    height: '40px',
    backgroundColor: 'black',
    marginTop: '10px',
  },
  dateNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
    navButton: {
        backgroundColor: '#C4C4C433',
        color: 'black',
        border: 'none',
        padding: ' 5px 10px',
        borderRadius: '5px',
        cursor: 'pointer',
    },
    dateText: {
        fontSize: '18px',
        fontWeight: '500',
        color: 'black',
    },
    summaryCards: {
        display: 'flex',
        flexDirection: 'row',
        gap: '30px',
        marginTop: '20px',
    },
    card: {
        backgroundColor: '#C5DEF2',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        justifyContent: 'space-between',
        width: '300px'
    },
    card1: {
        backgroundColor: '#F2C6DF',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        justifyContent: 'space-between',
        width: '300px'
    },
    card2: {
        backgroundColor: '#DBCDF0',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        justifyContent: 'space-between',
        width: '300px'
    },
    card3: {
        backgroundColor: '#F8D9C4',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        justifyContent: 'space-between',
        width: '300px'
    },
    cardContent: {
        display: 'flex',
        flexDirection: 'row',
        gap: '10px',
        marginTop: '10px'
    },
    cardData: {
        display: 'flex',
        flexDirection: 'row',
        gap: '20px',
    },
    data1: {
        display: 'flex',
        flexDirection: 'column'
    },
    txtData: {
        fontSize: '25px',
        fontWeight: 'bold',
        marginTop: '3px'
    },
    txtlabel: {
        fontSize: '14px',
    },
    txtSum: {
        fontSize: '16px',
        fontWeight: '600'
    },
    divider: {
        width: '1px',
        height: '35px',
        backgroundColor: '#00000050',
        marginTop: '10px'
    },
    table:{
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        marginTop: '20px',
        marginBottom: '20px',
        minWidth: '3000px'
    },
    tableCon:{
        overflow: 'auto',
        maxHeight: '400px',
    },
    th:{
        backgroundColor: '#A8FC0015',
        padding: '12px',
        textAlign: 'left',
        fontWeight: '500',
        fontSize: '14px',
        border: '1px solid #eee',
        width: '300px'
    },
    td: {
        padding: '12px',
        fontSize: '12px',
        border: '1px solid #eee',
    },
    timeTrack: {
        display: 'flex',
        gap: '10px',
        whiteSpace: 'nowrap',
    },

    time: {
        fontWeight: '500',
    },

    trackLine: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    dot: {
        width: '5px',
        height: '5px',
        backgroundColor: '#555',
        borderRadius: '50%',
    },

    duration: {
        fontSize: '12px',
        color: '#999',
        marginLeft: '10px',
        marginRight: '10px'
    },
    lineTable:{
        width: '50px',
        height: '1px',
        backgroundColor: 'black'
    },
    inputs: {
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'row', 
        justifyContent: 'space-between'
    },
    input1:{
        padding: '5px 25px',
        width: '250px',
        border: '1px solid #eee',
        borderRadius: '5px',
        fontSize: '12px'
    },
    iconSearch: {
        position: 'absolute',
        margin: '10px 10px',
        fontSize: '12px',
        color: '#00000050'
    },
    filter: {
        width: '120px',
        borderRadius: '5px',
        padding: '5px',
        border: '1px solid #eee',
        fontSize: '12px',
        maxHeight: '100px'
    },
    firstRow: {
        display: 'flex', 
        flexDirection: 'row',
        gap: '10px'
    },
    row1: {
        display: 'flex', 
        flexDirection: 'row',
        gap: '10px'
    },
    row2: {
        gap: '10px',
        display: 'flex', 
        flexDirection: 'row'
    },
    btn1: {
        padding: '5px 10px',
        border: 'none',
        borderRadius: '5px',
        fontWeight: '600',
        backgroundColor: 'white',
        border: '1px solid #00000060',
        cursor: 'pointer'
    },
    btn2: {
        padding: '5px 10px',
        backgroundColor: '#46810390',
        border: 'none',
        borderRadius: '5px',
        color: 'white',
        fontWeight: '600',
        cursor: 'pointer'
    },
    btn3: {
        padding: '5px 10px',
        border: 'none',
        borderRadius: '5px',
        backgroundColor: '#00B7FF',
        color: 'white',
        fontWeight: '600',
        cursor: 'pointer'
    },
    iconBtn: {
        fontSize: '12px',
        margin: '5px 5px 0'
    },
    iconBtn1: {
        color: 'white',
        fontSize: '12px',
        margin: '5px 5px 0'
    },
    buttons: {
        display: 'flex',
        flexDirection: 'row',
        gap: '20px',
        marginBottom: '10px',
    },
    btnLeave: {
        border: 'none',
        borderRadius: '5px',
        backgroundColor: 'none',
        alignItems: 'center',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        padding: '5px 10px'
    }


};

export default LeaveManagement;