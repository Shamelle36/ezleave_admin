import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
  faFilter,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './dashboardCalendar.css';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

function LeaveManagement() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('summary');
    const [csvData, setCsvData] = useState([]);
    const [leaveBalances, setLeaveBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date());
    const [requests, setRequests] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);


  const [leaveRecords, setLeaveRecords] = useState([]);

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

    const goToLeaveCalendar = () => {
        navigate('/leaveCalendar');
    }
    
const handleFileUpload = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data;
        setCsvData(parsed);

        // ✅ Instead of saving to DB, merge into local state
        setLeaveBalances((prev) => [...prev, ...parsed]);

        alert('CSV uploaded and merged into leave balances (frontend only).');
      },
    });
  };


  const fetchLeaveBalances = () => {
    // ✅ Demo/mock leave balances instead of Supabase fetch
    setLoading(true);
    setTimeout(() => {
      setLeaveBalances([
        {
          id: 1,
          id_number: '20230001',
          leave_type: 'Vacation Leave',
          entitled: 15,
          used: 5,
          employees: { full_name: 'Juan Dela Cruz' },
        },
        {
          id: 2,
          id_number: '20230002',
          leave_type: 'Sick Leave',
          entitled: 10,
          used: 2,
          employees: { full_name: 'Maria Santos' },
        },
      ]);
      setLoading(false);
    }, 800); // simulate async
  };

  useEffect(() => {
    fetchLeaveBalances();
  }, []);


  useEffect(() => {
    if (activeTab === "summary") {
      fetch("http://localhost:5000/api/leave-requests")
        .then((res) => res.json())
        .then((data) => {
          const formatted = data.map((req) => {
            let from = null;
            let to = null;

            if (req.inclusive_dates) {
                // Example: "[2025-09-18,2025-09-19)"
                const match = req.inclusive_dates.match(/\[(.*?),(.*?)[)\]]/);
                if (match) {
                from = new Date(match[1]); // ✅ convert to Date
                to = new Date(match[2]);   // ✅ convert to Date
                }
            }

            return {
                name: req.first_name && req.last_name
                ? `${req.first_name} ${req.last_name}`
                : req.user_id,
                department: req.office_department,
                leaveType: req.leave_type,
                entitled: 0,
                used: 0,
                remaining: 0,
                status: req.status,
                approvedBy: req.approved_by || "N/A",
                dateFiled: new Date(req.date_filing),
                range: { from, to }
            };
            });


          setLeaveRecords(formatted);
        })
        .catch((err) => console.error("Error fetching summary:", err));
    }
  }, [activeTab]);

  // Whenever date or records change → filter
  useEffect(() => {
  const dayStr = date.toISOString().split("T")[0]; // "YYYY-MM-DD"

  const filtered = leaveRecords.filter((record) => {
    if (!record.range.from || !record.range.to) return false;

    const fromStr = record.range.from.toISOString().split("T")[0];
    const toStr = record.range.to.toISOString().split("T")[0];

    // ✅ check if selected day falls in range
    return dayStr >= fromStr && dayStr <= toStr;
  });

  setFilteredRecords(filtered);
}, [date, leaveRecords]);


  useEffect(() => {
    if (activeTab === "requests") {
      fetch("http://localhost:5000/api/leave-requests")
        .then((res) => res.json())
        .then((data) => setRequests(data))
        .catch((err) => console.error("Error fetching requests:", err));
    }
  }, [activeTab]);

  
  
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

            <div style={styles.tabContainer}>
                <button
                    style={tabButtonStyle(activeTab === 'summary')}
                     onClick={() => setActiveTab('summary')}
                >
                    Leave Summary
                </button>
                <button
                    style={tabButtonStyle(activeTab === 'calendar')}
                    onClick={() => setActiveTab('calendar')}
                >
                    Leave Calendar
                </button>
                <button
                    style={tabButtonStyle(activeTab === 'requests')}
                    onClick={() => setActiveTab('requests')}
                >
                    Leave Requests
                </button>
                
                <button
                    style={tabButtonStyle(activeTab === 'leave_balances')}
                    onClick={() => setActiveTab('leave_balances')}
                >
                    Leave Balances
                </button>
            </div>


            {activeTab === 'summary' && (
            <>
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
                                <p style={styles.txtData}>{filteredRecords.length}</p>
                            </div>
                        </div>
                        </div>
                    </div>

                    <div style={styles.card1}>
                        <div style={styles.cardContent}>
                            <div style={styles.cardData}>
                                <div style={styles.data1}>
                                    <p style={styles.txtlabel}>Approved Leaves</p>
                                    <p style={styles.txtData}>{filteredRecords.filter(l => l.status === 'Approved').length}</p>
                                </div>
                        </div>
                        </div>
                    </div>

                    <div style={styles.card2}>
                        <div style={styles.cardContent}>
                            <div style={styles.cardData}>

                                <div style={styles.data1}>
                                    <p style={styles.txtlabel}>Pending Leaves</p>
                                    <p style={styles.txtData}>{filteredRecords.filter(l => l.status === 'Pending').length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                     <div style={styles.card3}>
                        <div style={styles.cardContent}>
                            <div style={styles.cardData}>
                                <div style={styles.data1}>
                                    <p style={styles.txtlabel}>Rejected Leaves</p>
                                    <p style={styles.txtData}>{filteredRecords.filter(l => l.status === 'Rejected').length}</p>
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
                        {filteredRecords.length > 0 ? (
                            filteredRecords.map((record, index) => (
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
                                <td style={styles.td}>
                                {record.dateFiled
                                    ? record.dateFiled.toLocaleDateString()
                                    : "N/A"}
                                </td>
                                <td style={styles.td}>
                                {record.range.from
                                    ? record.range.from.toLocaleDateString()
                                    : "N/A"}{" "}
                                -{" "}
                                {record.range.to
                                    ? record.range.to.toLocaleDateString()
                                    : "N/A"}
                                </td>
                            </tr>
                            ))
                        ) : (
                            <tr>
                            <td style={styles.td} colSpan="15" align="center">
                                No leave requests found for this day
                            </td>
                            </tr>
                        )}
                        </tbody>

                </table>
            </div>
            </>
            )}

            {activeTab === "requests" && (
                <div style={styles.leaveRequests}>
                <table style={styles.leaveRequestsTable}>
                    <thead style={styles.leaveRequeststhead}>
                        <tr>
                            <th style={styles.leaveRequestsColumn}>ID</th>
                            <th style={styles.leaveRequestsColumn}>Name</th>
                            <th style={styles.leaveRequestsColumn}>Department</th>
                            <th style={styles.leaveRequestsColumn}>Position</th>
                            <th style={styles.leaveRequestsColumn}>Leave Type</th>
                            <th style={styles.leaveRequestsColumn}>Dates</th>
                            <th style={styles.leaveRequestsColumn}>Days</th>
                            <th style={styles.leaveRequestsColumn}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                            {Array.isArray(requests) && requests.length > 0 ? (
                                requests.map((req) => (
                                <tr key={req.id}>
                                    <td style={styles.leaveRequestsRows} >{req.id_number}</td>
                                    <td style={styles.leaveRequestsRows}>{req.first_name} {req.middle_name} {req.last_name}</td>
                                    <td style={styles.leaveRequestsRows}>{req.office_department}</td>
                                    <td style={styles.leaveRequestsRows}>{req.position}</td>
                                    <td style={styles.leaveRequestsRows}>{req.leave_type}</td>
                                    <td style={styles.leaveRequestsRows}>{String(req.inclusive_dates)}</td>
                                    <td style={styles.leaveRequestsRows}>{req.number_of_days}</td>
                                    <td style={styles.leaveRequestsRows}>{req.status}</td>
                                </tr>
                                ))
                            ) : (
                                <tr>
                                <td>
                                    No leave requests found
                                </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            

            {activeTab === 'leave_balances' && (
                <div style={styles.leaveBalance}>
                    <button
                    style={styles.uploadButton}
                    onClick={() => setActiveTab('upload')}
                    onMouseEnter={(e) => Object.assign(e.target.style, styles.uploadButtonHover)}
                    onMouseLeave={(e) => Object.assign(e.target.style, styles.uploadButton)}
                    >
                    Upload Balances
                    </button>

                    {loading ? (
                    <p style={styles.loadingText}>Loading...</p>
                    ) : (
                    <table style={styles.table2}>
                        <thead>
                        <tr>
                            <th style={styles.thNew}>Employee</th>
                            <th style={styles.thNew}>Leave Type</th>
                            <th style={styles.thNew}>Entitled</th>
                            <th style={styles.thNew}>Used</th>
                            <th style={styles.thNew}>Remaining</th>
                            <th style={styles.thNew}>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {leaveBalances.map((leave) => (
                            <tr 
                            key={leave.id}
                            onMouseEnter={(e) => e.target.parentNode.style.backgroundColor = 'rgba(207, 255, 112, 0.5)'}
                            onMouseLeave={(e) => e.target.parentNode.style.backgroundColor = 'transparent'}
                            >
                            <td style={styles.tdNew}>
                                <div style={styles.employeeCell}>
                                <img
                                    src={leave.employees?.profile_url || '/default-avatar.png'}
                                    alt="Profile"
                                    style={styles.employeeImage}
                                />
                                <div>
                                    <div style={styles.employeeName}>{leave.employees?.full_name || 'N/A'}</div>
                                    <div style={styles.employeeId}>{leave.id_number}</div>
                                </div>
                                </div>
                            </td>
                            <td style={styles.tdNew}>
                                <span style={{
                                ...styles.leaveTypeBadge,
                                ...(leave.leave_type === 'Annual' ? styles.annualLeave :
                                    leave.leave_type === 'Sick' ? styles.sickLeave :
                                    leave.leave_type === 'Personal' ? styles.personalLeave :
                                    styles.maternityLeave)
                                }}>
                                {leave.leave_type}
                                </span>
                            </td>
                            <td style={styles.tdNew}>{leave.entitled}</td>
                            <td style={styles.tdNew}>{leave.used}</td>
                            <td style={styles.tdNew}>
                                {(leave.entitled ?? 0) - (leave.used ?? 0)}
                            </td>
                            <td style={styles.td}>
                            <button onClick={() => {
                                console.log('Leave ID Number:', leave.id_number);
                                navigate(`/employeeProfile/${leave.id_number}`)}} 
                                style={styles.viewButton}>
                                View Details
                            </button>
                            </td>                            
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    )}
                </div>
            )}

            {activeTab === 'calendar' && (
                <div style={styles.leaveCalendar}>
                    <div style={styles.calendarContent}>
                        <div style={styles.calendarRow1}>
                            <button style={styles.calendarButton}>
                                <FontAwesomeIcon icon={faCalendarAlt} style={styles.calendarIcon}/>
                                April 2025
                            </button>
                            <input
                                type="text"
                                placeholder="Search by employee name, department"
                                style={styles.calendarSearch}
                            />
                            <button style={styles.calendarFilter}>
                                <FontAwesomeIcon icon={faFilter} style={styles.filterIcon}/>
                                Filter
                            </button>
                        </div>

                    <table style={styles.calendarTable}>
                        <thead>
                            <tr>
                                <th style={styles.thCalendar}>Employees</th>
                                <th style={styles.thCalendar}>
                                    <div style={{display: 'flex', flexDirection: 'column'}}>
                                        <p>02</p>
                                        <p style={styles.calendarDay}>Sun</p>
                                    </div>
                                </th>
                                <th style={styles.thCalendar}>
                                    <div style={{display: 'flex', flexDirection: 'column'}}>
                                        <p>03</p>
                                        <p style={styles.calendarDay}>Mon</p>
                                    </div>
                                </th>
                                <th style={styles.thCalendar}>
                                    <div style={{display: 'flex', flexDirection: 'column'}}>
                                        <p>04</p>
                                        <p style={styles.calendarDay}>Tue</p>
                                    </div>
                                </th>
                                <th style={styles.thCalendar}>
                                    <div style={{display: 'flex', flexDirection: 'column'}}>
                                        <p>05</p>
                                        <p style={styles.calendarDay}>Wed</p>
                                    </div>
                                </th>
                                <th style={styles.thCalendar}>
                                    <div style={{display: 'flex', flexDirection: 'column'}}>
                                        <p>06</p>
                                        <p style={styles.calendarDay}>Thu</p>
                                    </div>
                                </th>
                                <th style={styles.thCalendar}>
                                    <div style={{display: 'flex', flexDirection: 'column'}}>
                                        <p>07</p>
                                        <p style={styles.calendarDay}>Fri</p>
                                    </div>
                                </th>
                                <th style={styles.thCalendar}>
                                    <div style={{display: 'flex', flexDirection: 'column'}}>
                                        <p>08</p>
                                        <p style={styles.calendarDay}>Sat</p>
                                    </div>
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {[...Array(6)].map((_, idx) => (
                            <tr key={idx}>
                                <td style={styles.tdCalendar}>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <img src="https://via.placeholder.com/32" alt="avatar" style={styles.calendarPic} />
                                    <div>
                                    <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap' }}>Renz Retuya</div>
                                    <div style={{ fontSize: 12, color: '#888' }}>Officer 1</div>
                                    <div style={{ fontSize: 11, color: '#aaa' }}>123456789</div>
                                    </div>
                                </div>
                                </td>
                                <td style={styles.tdCalendar}/>
                                <td style={styles.tdCalendar}/>
                                <td style={styles.tdCalendar}/>
                                <td style={styles.tdCalendar}/>
                                <td style={styles.tdCalendar}/>
                                <td style={styles.tdCalendar}/>
                                <td style={styles.tdCalendar}/>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>

                    <div style={styles.calendarBox}>
                        <div style={styles.calendarLeave}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                <span>Leave Types</span>
                                <select style={styles.selectCalendar}>
                                    <option>This Month</option>
                                    <option>This Year</option>
                                </select>
                            </div>
                            <div style={{ marginTop: 12 }}>
                                {[
                                    { label: 'SL', name: 'Sick Leave', color: '#f44336', value: 5 },
                                    { label: 'VL', name: 'Vacation Leave', color: '#3f51b5', value: 2 },
                                    { label: 'MFL', name: 'Mandatory/Forced Leave', color: '#4caf50', value: 0 },
                                    { label: 'ML', name: 'Maternity Leave', color: '#ff9800', value: 0 },
                                    { label: 'PL', name: 'Paternity Leave', color: '#8bc34a', value: 0 },
                                    { label: 'SPL', name: 'Solo Parent Leave', color: '#e91e63', value: 0 },
                                ].map((type) => (
                                    <div key={type.label} style={{ marginBottom: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 20, height: 20, backgroundColor: type.color, borderRadius: 4 }} />
                                            <div style={{ fontSize: 12, fontWeight: 500 }}>{type.label} - {type.name}</div>
                                        </div>
                                        <div style={{ height: 6, backgroundColor: '#eee', borderRadius: 4, marginTop: 4 }}>
                                            <div style={{
                                            width: `${type.value * 10}%`,
                                            height: '100%',
                                            backgroundColor: type.color,
                                            borderRadius: 4
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                    </div>

                    <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>Unnotified Leave</span>
                        <select style={styles.selectCalendar}>
                            <option>This Month</option>
                            <option>This Year</option>
                        </select>
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src="https://via.placeholder.com/40" alt="avatar" style={{ width: '30px', height: '30px' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>Renz Retuya</div>
                            <div style={{ fontSize: 12, color: '#777' }}>Officer 1</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>Duration: <strong>02–03 May 2025</strong></div>
                            <div style={{ fontSize: 12 }}>No. of Days: <strong>02</strong></div>
                        </div>
                        <div style={{
                            background: '#fbd103',
                            color: '#000',
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: 8,
                            fontSize: 12,
                        }}>
                            Pending
                        </div>
                        </div>
                    </div>
                    </div>
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
  fontWeight: active ? '600' : 'normal',
  borderRadius: '5px',
  padding: '10px 16px',
  fontSize: '14px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
  boxShadow: active
    ? 'inset 1px 1px 2px rgba(44, 44, 44, 0.44)'
    : '0 2px 4px rgba(0, 0, 0, 0.1)',
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
  tabContainer: {
    display: 'flex',
    gap: '10px',
    padding: '10px 0 20px',
    borderBottom: '1px solid #e0e0e0',
    marginBottom: '10px',
    flexWrap: 'wrap',
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
        alignItems: 'center',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        padding: '5px 10px'
    },
    btnActive: {
        backgroundColor: '#A8FC0080',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
    },

    leaveBalance: {
        padding: 24,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        margin: '16px 0',
    },

    uploadButton: {
        backgroundColor: '#4b83deff',
        color: '#ffffff',
        border: 'none',
        borderRadius: 8,
        padding: '8px 10px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        marginBottom: 24,
        transition: 'all 0.2s ease-in-out',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
    },

    uploadButtonHover: {
        backgroundColor: '#0134a2ff',
        transform: 'translateY(-1px)',
        boxShadow: '0 2px 5px rgba(59, 131, 246, 0.22)',
    },

    loadingText: {
        textAlign: 'center',
        padding: 40,
        fontSize: 16,
        color: '#6B7280',
        fontStyle: 'italic',
    },

    table2: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },

    thNew: {
        backgroundColor: '#F9FAFB',
        padding: '16px 20px',
        textAlign: 'left',
        fontSize: 12,
        fontWeight: 600,
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid #E5E7EB',
        width: '250px'
    },

    tdNew: {
        padding: '16px 20px',
        borderBottom: '1px solid #F3F4F6',
        fontSize: 14,
        color: '#1F2937',
        verticalAlign: 'middle',
    },

    employeeCell: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },

    employeeImage: {
        width: 40,
        height: 40,
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid #E5E7EB',
        backgroundColor: '#F3F4F6',
    },

    employeeName: {
        fontSize: 14,
        fontWeight: 600,
        color: '#1F2937',
        marginBottom: 2,
    },

    employeeId: {
        fontSize: 12,
        color: '#6B7280',
        fontFamily: 'monospace',
    },

    tableRowHover: {
        backgroundColor: '#F9FAFB',
        transition: 'background-color 0.15s ease-in-out',
    },

    viewButton: {
        backgroundColor: '#ffe056ff',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '5px',
        fontWeight: '500',
        fontSize: '14px'
    },

    leaveCalendar: {
        display: 'flex',
        gap: '24px'
    },

    calendarContent: {
        flex: 2,
    },

    calendarRow1: {
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: 12
    },

    calendarButton: {
        background: '#D9D9D9', 
        border: 'none', 
        borderRadius: 6, 
        padding: '8px 12px',
        fontWeight: 500,
    },

    calendarIcon: {
        marginRight: '10px'
    },

    calendarSearch: {
        marginLeft: 'auto',
        padding: '8px 12px',
        borderRadius: 6,
        border: '1px solid #ccc',
        width: 300,
    },

    calendarFilter: {
        marginLeft: 8, 
        background: '#5ab049', 
        color: '#fff', 
        border: 'none', 
        borderRadius: 6, 
        padding: '8px 12px'
    },

    filterIcon: {
        marginRight: '10px'
    },

    calendarTable: {
        width: '100%', 
        borderCollapse: 'separate', 
        textAlign: 'left',
        backgroundColor: '#ffffffff',
        borderRadius: '10px',
        border: '1px solid #000',
        borderSpacing: '0',
        overflow: 'hidden',
    },

    thCalendar: {
        width: '200px',
        fontSize: '14px',
        padding: '10px',
        fontWeight: '600',
        border: '1px solid #ddd',
        borderTopRadius: '10px'
    },

    calendarDay: {
        color: '#9c9c9cff'
    },

    tdCalendar: {
        border: '1px solid #ddd', 
        padding: '8px',
    },

    calendarPic: {
        borderRadius: '50%',
        width: '50px',
        height: '50px'
    },

    calendarBox: {
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 16,
        marginTop: '50px'
    },

    calendarLeave: {
        background: '#fff', 
        padding: 16, 
        borderRadius: 12, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    },

    selectCalendar: {
        backgroundColor: '#b5ffb4ff',
        border: 'none',
        borderRadius: '5px',
        boxShadow: '1px 1px 2px rgba(0, 0, 0, 0.37)',
        padding: '0 5px',
        fontSize: '12px'
    },
    leaveRequests: {

    },

    leaveRequestsTable: {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },

    leaveRequeststhead: {
        backgroundColor: '#F9FAFB',
    },
    leaveRequestsColumn: {
        padding: '16px 20px',
        textAlign: 'left',
        fontSize: 12,
        fontWeight: 600,
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid #E5E7EB',
        width: '200px'
    },

    leaveRequestsRows: {
        padding: '16px 20px',
        borderBottom: '1px solid #F3F4F6',
        fontSize: 14,
        color: '#1F2937',
        verticalAlign: 'middle',
    },
    



};

export default LeaveManagement;