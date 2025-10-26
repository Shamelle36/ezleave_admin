import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
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
import { width } from '@fortawesome/free-solid-svg-icons/fa0';

function LeaveManagement() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('summary');
    const [csvData, setCsvData] = useState([]);
    const [leaveBalances, setLeaveBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date());
    const [requests, setRequests] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionType, setActionType] = useState(null); // "approve" or "reject"
    const [actionRemarks, setActionRemarks] = useState(""); // remarks input by admin
    const [showActionModal, setShowActionModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [leaveRecords, setLeaveRecords] = useState([]);

     const [showLogoutModal, setShowLogoutModal] = useState(false);
        const [role, setRole] = useState(localStorage.getItem("role") || "admin");
      
        const menuItems = [
          { name: "Dashboard", icon: faTachometerAlt, to: "/dashboard" },
          { name: "Employees", icon: faUsers, to: "/employee" },
          { name: "Attendance", icon: faCalendarCheck, to: "/attendance" },
          { name: "Leave Management", icon: faCalendarAlt, to: "/leaveManagement" },
          { name: "Message", icon: faEnvelope, to: "/messages" },
          { name: "Announcement", icon: faBullhorn, to: "/announcement" },
          { name: "Audit Logs", icon: faClipboardList, to: "/audit_logs" },
          { name: "User Management", icon: faUserCog, to: "/userManagement" },
          { name: "Settings", icon: faCog, to: "#" },
        ];
      
        const allowedMenus = menuItems.filter((item) => {
          if (role === "admin") return true;
          if (role === "mayor" || role === "office_head") {
            return [
              "Dashboard",
              "Employees",
              "Attendance",
              "Leave Management",
              "Message",
              "Announcement",
            ].includes(item.name);
          }
          return false;
        });

         const handleLogout = async () => {
    const user = JSON.parse(localStorage.getItem("admin")); // get current session

    if (user) {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: user.role }),
      });
    }

    localStorage.removeItem("admin"); // clear session
    navigate("/"); // redirect to login
  };
      

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


const handleApprove = async (requestId, remarks = "Approved via dashboard") => {
  try {
    const res = await fetch(`http://localhost:5000/api/leave-requests/${requestId}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionBy: "Admin", remarks }),
    });
    const data = await res.json();

    if (res.ok) {
      // Update the request list with the full updated object from backend
      setRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, ...data } : req))
      );

      // Update the selected request if it’s the same one
      setSelectedRequest((prev) =>
        prev && prev.id === requestId ? { ...prev, ...data } : prev
      );

      alert("Leave request approved!");
    } else {
      alert(data.error || "Failed to approve request");
    }
  } catch (err) {
    console.error(err);
    alert("Error approving leave request");
  }
};


// Reject a leave request
const handleReject = async (requestId, remarks = "Rejected via dashboard") => {
  try {
    const res = await fetch(`http://localhost:5000/api/leave-requests/${requestId}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionBy: "Admin", remarks }),
    });
    const data = await res.json();
    if (res.ok) {
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? { ...req, status: "Rejected", action_by: "Admin", updated_at: new Date(), remarks }
            : req
        )
      );
      setSelectedRequest((prev) =>
        prev && prev.id === requestId
          ? { ...prev, status: "Rejected", action_by: "Admin", updated_at: new Date(), remarks }
          : prev
      );
      alert("Leave request rejected!");
    } else {
      alert(data.error || "Failed to reject request");
    }
  } catch (err) {
    console.error(err);
    alert("Error rejecting leave request");
  }
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
  {allowedMenus.map((item) => {
    const isActive = location.pathname === item.to; // Check if current route matches

    return (
      <li
        key={item.name}
        style={{
          ...(isActive ? styles.btnActive : {}), // Apply active tab background
        }}
      >
        <Link
          style={{
            ...styles.sb,
            ...(isActive ? styles.btnActive : {}),
          }}
          to={item.to}
        >
          <FontAwesomeIcon icon={item.icon} style={styles.icon} /> {item.name}
        </Link>
      </li>
    );
  })}

  <li>
    <Link
      style={styles.sb}
      to="#"
      onClick={(e) => {
        e.preventDefault();
        setShowLogoutModal(true);
      }}
    >
      <FontAwesomeIcon icon={faSignOutAlt} style={styles.icon} /> Logout
    </Link>
  </li>
</ul>
        </div>

        <div style={styles.content}>

              {showLogoutModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div style={styles.modalActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                style={styles.confirmBtn}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}


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
                    <div style={styles.leftSection}>
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
                                    <tr 
                                        key={req.id}
                                        onClick={() => setSelectedRequest(req)} 
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td style={styles.leaveRequestsRows}>{req.id_number}</td>
                                        <td style={styles.leaveRequestsRows}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <img
                                            src={req.profile_picture || "/default-avatar.png"}
                                            alt={`${req.first_name} ${req.last_name}`}
                                            style={{
                                                width: "55px",
                                                height: "55px",
                                                borderRadius: "5px",
                                                objectFit: "cover",
                                            }}
                                            />
                                            <span>
                                            {req.first_name} {req.middle_name} {req.last_name}
                                            </span>
                                        </div>
                                        </td>
                                        <td style={styles.leaveRequestsRows}>{req.department}</td>
                                        <td style={styles.leaveRequestsRows}>{req.position}</td>
                                        <td style={styles.leaveRequestsRows}>{req.leave_type}</td>
                                        <td style={styles.leaveRequestsRows}>
                                        {`${req.inclusive_date_start} - ${req.inclusive_date_end}`}
                                        </td>                                        
                                        <td style={styles.leaveRequestsRows}>{req.number_of_days}</td>
                                        <td style={styles.leaveRequestsRows}>{req.status}</td>
                                    </tr>
                                    ))
                                ) : (
                                    <tr>
                                    <td>No leave requests found</td>
                                    </tr>
                                )}
                                </tbody>

                            </table>
                        </div>

                        <div style={styles.rightSection}>
                                {selectedRequest ? (
                                    <>
                                    <div style={styles.employeeCard}>
                                        <img 
                                        src={selectedRequest.profile_picture || "/default-avatar.png"}
                                        alt="profile"
                                        style={styles.profile_picture}
                                        />
                                        <div style={styles.employeeInfo}>
                                            <p>{selectedRequest.first_name} {selectedRequest.middle_name} {selectedRequest.last_name}</p>
                                            <p style={{color: 'rgba(151, 151, 151, 1)', fontWeight: 'regular'}}>{selectedRequest.position}</p>
                                        </div>
                                    </div>

                                    <div style={styles.moreInfo}>
                                        <div style={styles.infoRow}>
                                        <p style={styles.infoLabel}>Employee ID:</p>
                                        <p style={styles.infoValue}>{selectedRequest.id_number}</p>
                                        </div>

                                        <div style={styles.infoRow}>
                                        <p style={styles.infoLabel}>Department:</p>
                                        <p style={styles.infoValue}>{selectedRequest.department}</p>
                                        </div>

                                        <div style={styles.infoRow}>
                                        <p style={styles.infoLabel}>Email:</p>
                                        <p style={styles.infoValue}>{selectedRequest.email}</p>
                                        </div>
                                    </div>

                                    <div style={styles.moreDetails}>
                                        <div style={styles.columnLeave}>
                                        <div style={styles.leaveRow1}>
                                            <p>{selectedRequest.number_of_days}</p>
                                            <p>Days</p>
                                        </div>

                                        <div style={styles.leaveRow}>
                                            <p style={styles.leaveColumnName}>Duration</p>
                                            <p style={styles.leaveRowValue}>
                                            {`${selectedRequest.inclusive_date_start} - ${selectedRequest.inclusive_date_end}`}
                                            </p>
                                        </div>

                                        <div style={styles.leaveRow}>
                                            <p style={styles.leaveColumnName}>Leave Type</p>
                                            <p style={styles.leaveRowValue}>{selectedRequest.leave_type}</p>
                                        </div>

                                        <div style={styles.leaveRow}>
                                            <p style={styles.leaveColumnName}>Status</p>
                                            <p style={styles.leaveRowValueStatus}>{selectedRequest.status}</p>
                                        </div>
                                        </div>

                                        <div style={styles.reasonDetails}>
                                        <p style={styles.reasonTxt}>Reason</p>
                                        <p style={styles.reasonTxtMore}>{selectedRequest.reason || "No reason provided"}</p>
                                        </div>
                                    </div>

                                    <div style={styles.leaveBalanceDetails}>
                                        <h3>{selectedRequest.leave_type}</h3>
                                        <div style={styles.leaveBalanceInfo}>
                                        <div style={styles.leaveBalanceRow}>
                                            <p style={styles.balanceTxtUsed}>{selectedRequest.used ?? 0}</p>
                                            <p style={styles.lblBalance}>Used</p>
                                        </div>

                                        <div style={styles.leaveBalanceRow}>
                                            <p style={styles.balanceTxtRemain}>
                                            {(selectedRequest.entitled ?? 0) - (selectedRequest.used ?? 0)}
                                            </p>
                                            <p style={styles.lblBalance}>Balance</p>
                                        </div>
                                        </div>
                                    </div>

                                    <div style={styles.actionButtons}>
                                        {selectedRequest.status === "Pending" ? (
                                            <>
                                                <button
                                                style={styles.approveBtn}
                                                onClick={() => {
                                                    setActionType("approve");
                                                    setActionRemarks(""); // optional notes
                                                    setShowActionModal(true);
                                                }}
                                                >
                                                <FontAwesomeIcon icon={faCheckCircle} style={styles.iconApprove} />
                                                Approve
                                                </button>
                                                <button
                                                style={styles.rejectBtn}
                                                onClick={() => {
                                                    setActionType("reject");
                                                    setActionRemarks(""); // must enter reason
                                                    setShowActionModal(true);
                                                }}                                                >
                                                <FontAwesomeIcon icon={faTimesCircle} style={styles.iconReject} />
                                                Reject
                                                </button>
                                            </>
                                            ) : (
                                            <div style={styles.approvalInfo}>
                                                <div style={styles.approvalDetails}>
                                                <p style={styles.approvalTxt}>
                                                    {selectedRequest.status} by {selectedRequest.action_by || "Admin"} on{" "}
                                                    {new Date(selectedRequest.updated_at).toLocaleDateString()}
                                                </p>
                                                {selectedRequest.remarks && (
                                                    <p style={{ fontSize: "14px", color: "#777", marginTop: "4px" }}>
                                                    Remarks: {selectedRequest.remarks}
                                                    </p>
                                                )}
                                                </div>
                                                <div style={styles.approvalDetails}>
                                                <button style={styles.historyBtn}>View History</button>
                                                </div>
                                            </div>
                                            )}

                                        </div>
                                    </>
                                ) : (
                                    <p style={{ textAlign: "center", marginTop: "50px" }}>Select a leave request to view details</p>
                                )}
                                </div>


                                {showActionModal && (
                                    <div style={styles.modalOverlay}>
                                        <div style={styles.modalContent}>
                                        <h3>{actionType === "approve" ? "Approve Leave Request" : "Reject Leave Request"}</h3>

                                        {actionType === "reject" && (
                                            <div style={{ margin: "12px 0" }}>
                                            <label>Reason for Rejection:</label>
                                            <textarea
                                                style={styles.textarea}
                                                value={actionRemarks}
                                                onChange={(e) => setActionRemarks(e.target.value)}
                                                placeholder="Enter reason..."
                                            />
                                            </div>
                                        )}

                                        {actionType === "approve" && (
                                            <div style={{ margin: "12px 0" }}>
                                            <label>Optional Note:</label>
                                            <textarea
                                                style={styles.textarea}
                                                value={actionRemarks}
                                                onChange={(e) => setActionRemarks(e.target.value)}
                                                placeholder="Optional remarks..."
                                            />
                                            </div>
                                        )}

                                        <div style={styles.modalActions}>
                                            <button
                                            style={styles.confirmBtn}
                                            onClick={() => {
                                                if (actionType === "approve") {
                                                handleApprove(selectedRequest.id, actionRemarks);
                                                } else {
                                                handleReject(selectedRequest.id, actionRemarks);
                                                }
                                                setShowActionModal(false);
                                            }}
                                            disabled={actionType === "reject" && !actionRemarks.trim()} // require reason for reject
                                            >
                                            Confirm
                                            </button>
                                            <button
                                            style={styles.cancelBtn}
                                            onClick={() => setShowActionModal(false)}
                                            >
                                            Cancel
                                            </button>
                                        </div>
                                        </div>
                                    </div>
                                    )}

                </div>
            )}

            

            {activeTab === 'leave_balances' && (
                <div style={styles.leaveBalance}>
                    <button
                    style={styles.uploadButton}
                    onClick={() => setShowUploadModal(true)}
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

                    {showUploadModal && (
                    <div style={styles.modalOverlay}>
                        <div style={styles.modalContent}>
                        <h3 style={{ marginBottom: "15px" }}>Upload Leave Card Excel</h3>

                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={(e) => setSelectedFile(e.target.files[0])}
                        />

                        {uploading ? (
                            <p>Uploading...</p>
                        ) : (
                            <button
                            style={styles.uploadConfirmButton}
                            onClick={async () => {
                                if (!selectedFile) return alert("Please select a file first!");

                                setUploading(true);
                                setUploadResult(null);

                                try {
                                const formData = new FormData();
                                formData.append("file", selectedFile);

                                const res = await fetch("http://localhost:5000/api/leave-cards/upload", {
                                    method: "POST",
                                    body: formData,
                                });
                                const data = await res.json();
                                setUploadResult(data);
                                } catch (err) {
                                console.error("Upload failed:", err);
                                alert("Failed to upload leave card.");
                                } finally {
                                setUploading(false);
                                }
                            }}
                            >
                            Upload
                            </button>
                        )}

                        {uploadResult && (
                            <div style={{ marginTop: "10px" }}>
                            <p><strong>Inserted:</strong> {uploadResult.inserted}</p>
                            <p><strong>Skipped (no matching employee):</strong> {uploadResult.skipped}</p>
                            </div>
                        )}

                        <button
                            style={styles.closeModalButton}
                            onClick={() => setShowUploadModal(false)}
                        >
                            Close
                        </button>
                        </div>
                    </div>
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
        display: 'flex',
        flexDirection: 'row',
    },

    leftSection: {
        flex: 4,
        marginRight: 24,
        overflowX: 'auto',
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

    rightSection: {
        flex: 1.5,
        backgroundColor: '#F2F2F2',
        padding: 16,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        height: 'fit-content',
    },

    profile_picture: {
        width: '50px',
        height: '50px',
        borderRadius: '8px',
        objectFit: 'cover',
        marginRight: '12px',
        border: '2px solid #E5E7EB',
        backgroundColor: '#F3F4F6',
    },

    employeeInfo: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: '600',
        color: '#1F2937',
        marginTop: '4px'
    },

    employeeCard: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    moreInfo: {
        marginTop: 15,
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
    },

    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 8,
    },

    moreDetails: {
        marginTop: 15,
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
    },

    columnLeave: {
        display: 'flex',
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'space-between',
    },

    leaveRow1: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#5ab049ff',
        color: '#fefcf5',
        padding: '10px 16px',
        borderRadius: '8px',
        justifyContent: 'center',
    },

    leaveColumnName: {
        color: '#6B7280',
        fontSize: '12px',
        marginBottom: '4px',
    },

    leaveRowValue: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#1F2937',
    },

    leaveRowValueStatus: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#1F2937',
        backgroundColor: '#FFDD00',
        padding: '4px 8px',
        borderRadius: '8px',
    },

    reasonDetails: {
        marginTop: 16,
        padding: 15,
        borderRadius: 12,
        border: '1px solid #E5E7EB',
    },

    reasonTxt: {
        fontSize: '14px',
        fontWeight: '600',
        marginBottom: 8,
        color: '#1F2937',
    },

    reasonTxtMore: {
        fontSize: '13px',
        color: '#4B5563',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: '100px',
        overflowY: 'auto',
        paddingRight: '8px',
        textAlign: 'justify',
    },

    leaveBalanceDetails: {
        marginTop: 16,
        padding: 15,
        borderRadius: 12,
        backgroundColor: '#ffffff',
    },

    leaveBalanceInfo: {
        display: 'flex',
        gap: 12,
        marginTop: 12,
        justifyContent: 'center',
    },

    leaveBalanceRow: {
        display: 'flex',
        flexDirection: 'row',
        borderRadius: '8px',
        alignItems: 'center',
        textAlign: 'center',
    },

    balanceTxtUsed: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#ffffffff',
        backgroundColor: '#ff5e5eff',
        padding: '10px 16px',
        borderTopLeftRadius: '8px',
        borderBottomLeftRadius: '8px',
        boxShadow: 'inset 1px 1px 2px rgba(44, 44, 44, 0.44)',
    },

    balanceTxtRemain: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#ffffffff',
        backgroundColor: '#003cffff',
        padding: '10px 16px',
        borderTopLeftRadius: '8px',
        borderBottomLeftRadius: '8px',
        boxShadow: 'inset 1px 1px 2px rgba(44, 44, 44, 0.44)',
    },


    lblBalance: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#1F2937',
        padding: '10px 40px',
        borderTopRightRadius: '8px',
        borderBottomRightRadius: '8px',
        boxShadow: 'inset 1px 1px 2px rgba(44, 44, 44, 0.44)',
        backgroundColor: '#f3f4f6',
    },

    actionButtons: {
        display: 'flex',
        gap: 12,
        marginTop: 16,
    },

    approveBtn: {
        backgroundColor: '#00d54eff',
        color: '#ffffff',
        border: 'none',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '1px 1px 1px rgba(0, 0, 0, 0.3)',
    },

    rejectBtn: {
        backgroundColor: '#ff3d3dff',
        color: '#ffffff',
        border: 'none',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '1px 1px 1px rgba(0, 0, 0, 0.3)',
    },

    iconApprove: {
        fontSize: '16px',
        marginRight: '4px',
    },
    
    iconReject: {
        fontSize: '16px',
        marginRight: '4px',
    },

    historyBtn: {
        backgroundColor: '#5ab049ff',
        color: '#fefcf5',
        border: 'none',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: '14px',
        fontWeight: 500,
    },

    approvalInfo: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 100,
    },

    approvalTxt: {
        fontSize: '14px',
        color: '#4B5563',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        textAlign: 'justify',
    },

    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },

    modalContent: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        width: '400px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        maxHeight: '80vh',
        overflowY: 'auto',
    },

    textarea: {
        width: '100%',
        height: '100px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        padding: '10px',
        fontSize: '14px',
        resize: 'vertical',
        boxSizing: 'border-box',
        marginTop: '10px',
    },

    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '20px',
    },

    confirmBtn: {
        backgroundColor: '#5ab049ff',
        color: '#fefcf5',
        border: 'none',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
    },

    cancelBtn: {
        backgroundColor: '#ff3d3dff',
        color: '#ffffff',
        border: 'none',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
    },

uploadConfirmButton: {
  backgroundColor: "#4CAF50",
  color: "#fff",
  border: "none",
  padding: "10px 20px",
  borderRadius: "6px",
  cursor: "pointer",
  marginTop: "10px",
},
closeModalButton: {
  backgroundColor: "#aaa",
  color: "#fff",
  border: "none",
  padding: "8px 16px",
  borderRadius: "6px",
  cursor: "pointer",
  marginTop: "10px",
},


};

export default LeaveManagement;