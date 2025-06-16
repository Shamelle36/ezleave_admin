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

function Attendance() {

    const [date, setDate] = useState(new Date());

  const [employees, setEmployees] = useState([
    {
      name: 'Reyland S. Tanglao',
      id: '123456789',
      timeIn: '8:00 AM',
      timeOut: '5:00 PM',
      duration: '8h 56m',
      status: 'Present',
      date: 'May 3, 2025',
    },
    {
      name: 'Raven P. Quijano',
      id: '0123456789',
      timeIn: null,
      timeOut: null,
      duration: null,
      status: 'Absent',
      date: 'May 3, 2025',
    },
    {
      name: 'Angel Love B. Salgado',
      id: '234567891',
      timeIn: '8:00 AM',
      timeOut: '5:00 PM',
      duration: '8h 56m',
      status: 'Present',
      date: 'May 3, 2025',
    },
    {
      name: 'Jambie Q. Malimbam',
      id: '789123456',
      timeIn: null,
      timeOut: null,
      duration: null,
      status: 'On-Leave',
      date: 'May 3, 2025',
    },
    {
      name: 'Jambie Q. Malimbam',
      id: '789123456',
      timeIn: null,
      timeOut: null,
      duration: null,
      status: 'On-Leave',
      date: 'May 3, 2025',
    },
    {
      name: 'Jambie Q. Malimbam',
      id: '789123456',
      timeIn: null,
      timeOut: null,
      duration: null,
      status: 'On-Leave',
      date: 'May 3, 2025',
    },
    {
      name: 'Jambie Q. Malimbam',
      id: '789123456',
      timeIn: null,
      timeOut: null,
      duration: null,
      status: 'On-Leave',
      date: 'May 3, 2025',
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present':
        return <FontAwesomeIcon icon={faCheckCircle} style={{ color: 'green' }} />;
      case 'Absent':
        return <FontAwesomeIcon icon={faTimesCircle} style={{ color: 'red' }} />;
      case 'On-Leave':
        return <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#f5c518' }} />;
      default:
        return null;
    }
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

            <div style={styles.header1}>
                <h1>Attendance </h1>
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
                    <p style={styles.txtSum}>Present Summary</p>

                    <div style={styles.cardContent}>
                        <div style={styles.cardData}>
                            <div style={styles.data1}>
                                <p style={styles.txtlabel}>Total Present</p>
                                <p style={styles.txtData}>110</p>
                            </div>
                            
                            <div style={styles.divider}></div>

                             <div style={styles.data1}>
                                <p style={styles.txtlabel}>On-Time</p>
                                <p style={styles.txtData}>{employees.filter(e => e.status === 'Present').length}</p>
                            </div>

                            <div style={styles.divider}></div>

                            <div style={styles.data1}>
                                <p style={styles.txtlabel}>Early clock-in</p>
                                <p style={styles.txtData}>100</p>
                            </div>

                            <div style={styles.divider}></div>

                            <div style={styles.data1}>
                                <p style={styles.txtlabel}>Late clock-in</p>
                                <p style={styles.txtData}>10</p>
                            </div>

                        </div>
                    </div>
                </div>
                <div style={styles.card}>
                    <p style={styles.txtSum}>Absent Summary</p>

                    <div style={styles.cardContent}>
                        <div style={styles.cardData}>
                            <div style={styles.data1}>
                                <p style={styles.txtlabel}>Total Absent</p>
                                <p style={styles.txtData}>{employees.filter(e => e.status === 'Absent').length}</p>
                            </div>
                            
                            <div style={styles.divider}></div>

                            <div style={styles.data1}>
                                <p style={styles.txtlabel}>No clock-in</p>
                                <p style={styles.txtData}>10</p>
                            </div>
                            
                            <div style={styles.divider}></div>

                            <div style={styles.data1}>
                                <p style={styles.txtlabel}>No clock-out</p>
                                <p style={styles.txtData}>10</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={styles.card}>
                    <p style={styles.txtSum}>Leave Summary</p>

                    <div style={styles.cardContent}>
                        <div style={styles.cardData}>

                            <div style={styles.data1}>
                                <p style={styles.txtlabel}>Total on-leave</p>
                                <p style={styles.txtData}>{employees.filter(e => e.status === 'On-Leave').length}</p>
                            </div>

                            <div style={styles.divider}></div>

                            <div style={styles.data1}>
                                <p style={styles.txtlabel}>Day Off</p>
                                <p style={styles.txtData}>{employees.filter(e => e.status === 'Day-off').length}</p>
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
                            <option disabled selected>Status</option>
                            <option>Present</option>
                            <option>Late</option>
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
                    <th style={styles.th}>
                        <FontAwesomeIcon icon={faUser} style={{ marginRight: '6px' }} />
                            Employee Name
                    </th>

                    <th style={styles.th}>
                        <FontAwesomeIcon icon={faClock} style={{ marginRight: '6px' }} />
                            Clock in & Out
                    </th>

                    <th style={styles.th}>
                        <FontAwesomeIcon icon={faUser} style={{ marginRight: '6px' }} />
                            Status
                        </th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Remarks</th>
                </tr>
                </thead>
                <tbody>
                {employees.map((emp, index) => (
                    <tr key={index}>
                    <td style={styles.td}>{emp.name}<br />{emp.id}</td>
                    <td style={styles.td}>
                       {emp.timeIn ? (
                            <div style={styles.timeTrack}>
                                <div style={styles.time}>{emp.timeIn}</div>
                                    <div style={styles.trackLine}>
                                        <div style={styles.dot}></div>
                                        <div style={styles.lineTable}></div>
                                        <div style={styles.duration}>{emp.duration}</div>
                                        <div style={styles.lineTable}></div>
                                        <div style={styles.dot}></div>
                                    </div>
                                <div style={styles.time}>{emp.timeOut}</div>
                            </div>
                        ) : (
                            '—'
                        )}
                        </td>
                    <td style={styles.td}>{getStatusIcon(emp.status)} {emp.status}</td>
                    <td style={styles.td}>{emp.date}</td>
                    <td style={styles.td}>—</td>
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
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        justifyContent: 'space-between',
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
        marginBottom: '20px'
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
    }


};

export default Attendance;