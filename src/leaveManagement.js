import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  faSignature,
  faFilePdf,
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
    const [userRole, setUserRole] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [filteredRequests, setFilteredRequests] = useState([]);

const [signatureMethod, setSignatureMethod] = useState(""); // "e-sign" or "traditional"
    const [signatureData, setSignatureData] = useState("");
    const [isSigning, setIsSigning] = useState(false);
    const [showActualCSForm, setShowActualCSForm] = useState(false);
    const [csFormData, setCsFormData] = useState(null);
    const [daysWithPay, setDaysWithPay] = useState(0); // NEW: Days with pay state
    const [showSignatureChoice, setShowSignatureChoice] = useState(false); // NEW: Show signature choice modal
    const [realTimeFormData, setRealTimeFormData] = useState({
  action_type: "",
  action_remarks: "",
  days_with_pay: 0
});
const [isGeneratingCSForm, setIsGeneratingCSForm] = useState(false);
const [isGeneratingForm, setIsGeneratingForm] = useState(false);
const [formGenerationTimeout, setFormGenerationTimeout] = useState(null);
const [isTyping, setIsTyping] = useState(false);
const generationTriggerRef = useRef(false);

    useEffect(() => {
        let role = localStorage.getItem("role") || "";
        // Normalize: lowercase and replace underscores with spaces
        role = role.toLowerCase().replace("_", " ");
        setUserRole(role);
    }, []);

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
        const user = JSON.parse(localStorage.getItem("admin"));
        if (user) {
            await fetch("http://localhost:5000/api/auth/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, role: user.role }),
            });
        }
        localStorage.removeItem("admin");
        navigate("/");
    };

    useEffect(() => {
        if (requests && requests.length > 0) {
            let filtered = requests;
            if (searchQuery.trim()) {
                filtered = filtered.filter(req => 
                    req.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    req.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    req.middle_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    req.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    req.leave_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    req.id_number?.toString().includes(searchQuery)
                );
            }
            if (statusFilter !== "all") {
                filtered = filtered.filter(req => 
                    req.status?.toLowerCase() === statusFilter.toLowerCase()
                );
            }
            setFilteredRequests(filtered);
        } else {
            setFilteredRequests(requests || []);
        }
    }, [requests, searchQuery, statusFilter]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleStatusFilter = (e) => {
        setStatusFilter(e.target.value);
    };

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
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
                setLeaveBalances((prev) => [...prev, ...parsed]);
                alert('CSV uploaded and merged into leave balances (frontend only).');
            },
        });
    };

    const fetchLeaveBalances = () => {
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
        }, 800);
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
                            const match = req.inclusive_dates.match(/\[(.*?),(.*?)[)\]]/);
                            if (match) {
                                from = new Date(match[1]);
                                to = new Date(match[2]);
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

    useEffect(() => {
        const dayStr = date.toISOString().split("T")[0];
        const filtered = leaveRecords.filter((record) => {
            if (!record.range.from || !record.range.to) return false;
            const fromStr = record.range.from.toISOString().split("T")[0];
            const toStr = record.range.to.toISOString().split("T")[0];
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

const handleApprove = (requestId, remarks = "Approved via dashboard") => {
  const admin = JSON.parse(localStorage.getItem("admin"));
  if (!admin) return alert("No admin logged in!");

  const role = admin.role?.toLowerCase().replace(" ", "_");

  // If mayor, office head, or HR admin, show actual CS form directly (but don't generate until state is set)
  if (role === "mayor" || role === "office_head" || role === "admin") {
    const request = requests.find(req => req.id === requestId);
    if (request) {
      // set all required state first
      setSelectedRequest(request);
      setDaysWithPay(request.number_of_days || 0);
      setActionType("approve");
      setActionRemarks(remarks);

      // tell the effect to generate the form once those state updates commit
      generationTriggerRef.current = true;

      // also show loading for UX
      setIsGeneratingCSForm(true);
    }
    return;
  }

  // Original approval logic for other roles
  (async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/leave-requests/${requestId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionBy: admin.id || admin.email,
          remarks,
          role,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setRequests(prev =>
          prev.map(req =>
            req.id === requestId
              ? {
                  ...req,
                  status: role === "mayor" ? "Approved" : req.status,
                  [`${role}_status`]: "Approved",
                  approver_name: data.approver_name,
                  remarks,
                }
              : req
          )
        );
        alert(`Leave request approved by ${data.approver_name} (${role.replace("_", " ")})`);
      } else {
        alert(data.error || "Failed to approve request");
      }
    } catch (err) {
      console.error(err);
      alert("Error approving leave request");
    }
  })();
};

const handleReject = (requestId, remarks = "Rejected via dashboard") => {
  const admin = JSON.parse(localStorage.getItem("admin"));
  if (!admin) return alert("No admin logged in!");

  const role = admin.role?.toLowerCase().replace(" ", "_");

  // If mayor/office_head/admin, show CS form for rejection (but don't generate until state is set)
  if (role === "mayor" || role === "office_head" || role === "admin") {
    const request = requests.find(req => req.id === requestId);
    if (request) {
      setSelectedRequest(request);
      setActionType("reject");
      setActionRemarks(remarks || "Rejected via CS Form");

      // mark for generation after state commit
      generationTriggerRef.current = true;
      setIsGeneratingCSForm(true);
    }
    return;
  }

  // Original rejection logic for other roles
  (async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/leave-requests/${requestId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionBy: admin.id || admin.email,
          remarks,
          role,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setRequests(prev =>
          prev.map(req =>
            req.id === requestId
              ? {
                  ...req,
                  status: "Rejected",
                  [`${role}_status`]: "Rejected",
                  approver_name: admin.name || admin.email,
                  approved_by: role,
                  approver_date: new Date(),
                  remarks,
                }
              : req
          )
        );
        alert(`Leave request rejected by ${admin.name || admin.email}`);
      } else {
        alert(data.error || "Failed to reject request");
      }
    } catch (err) {
      console.error(err);
      alert("Error rejecting leave request");
    }
  })();
};

useEffect(() => {
  // Only run when a generation was intentionally requested
  if (!generationTriggerRef.current) return;

  // Basic sanity checks
  if (!selectedRequest || !actionType) {
    // Cancel trigger if missing data
    generationTriggerRef.current = false;
    setIsGeneratingCSForm(false);
    return;
  }

  // call the generator
  generateAndShowCSForm()
    .catch(err => {
      console.error("generateAndShowCSForm error in effect:", err);
    })
    .finally(() => {
      // Reset trigger so subsequent manual clicks require explicit handlers again
      generationTriggerRef.current = false;
    });
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedRequest, actionType, daysWithPay]);

const generateAndShowCSForm = async () => {
  if (isGeneratingForm) {
    console.log("Form generation already in progress, skipping...");
    return;
  }

  try {
    setIsGeneratingForm(true);

    if (!selectedRequest || !selectedRequest.id) {
      alert("No leave request data available");
      setIsGeneratingForm(false);
      setIsGeneratingCSForm(false);
      return;
    }

    const admin = JSON.parse(localStorage.getItem("admin"));
    const role = admin.role?.toLowerCase().replace(" ", "_");

    // Build payload from the latest committed states
    const payload = {
      leave_application_id: selectedRequest.id,
      days_with_pay: daysWithPay,
      requesting_role: role,
      action_type: actionType,
      action_remarks: actionRemarks,
      real_time_data: {
        action_type: actionType,
        action_remarks: actionRemarks,
        days_with_pay: daysWithPay
      }
    };

    console.log("Generating CS Form with payload:", payload);

    const res = await fetch("http://localhost:5000/api/generate-cs-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    setCsFormData({
      blob,
      url,
      timestamp: Date.now()
    });

    // Show the actual form in the modal
    setShowActualCSForm(true);
  } catch (err) {
    console.error("Error generating CS Form:", err);
    alert("Failed generating CS Form: " + err.message);
  } finally {
    setIsGeneratingCSForm(false);
    setIsGeneratingForm(false);
  }
};

    const handleSignatureMethod = (method) => {
  setSignatureMethod(method);
  setShowSignatureChoice(false);

  if (method === "e-sign") {
    setIsSigning(true);
    // emulate e-sign flow then complete approval
    setTimeout(() => {
      setSignatureData("Mayor_E_Signature_" + Date.now());
      setIsSigning(false);
      // Ensure we have selectedRequest; if not, abort
      if (!selectedRequest) {
        alert("No selected request for signing");
        return;
      }
      completeCSFormApproval();
    }, 2000);
  } else {
    // For traditional signing: open print and then complete
    if (csFormData && csFormData.url) {
      const newWindow = window.open(csFormData.url);
      if (newWindow) {
        newWindow.onload = () => {
          newWindow.print();
          // After print command, proceed to complete approval
          completeCSFormApproval();
        };
      } else {
        // If popup blocked or failed, still complete
        completeCSFormApproval();
      }
    } else {
      // If no form to print, still proceed (backend will record signature method null)
      completeCSFormApproval();
    }
  }
    };

    const completeCSFormApproval = async () => {
  try {
    const admin = JSON.parse(localStorage.getItem("admin"));
    if (!admin || !selectedRequest) {
      alert("Missing admin or selected request");
      return;
    }

    const role = admin.role?.toLowerCase().replace(" ", "_");

    const res = await fetch(`http://localhost:5000/api/leave-requests/${selectedRequest.id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionBy: admin.id || admin.email,
        remarks: `Approved with CS Form No. 6 - ${daysWithPay} days with pay`,
        role,
        cs_form_signed: true,
        signature_method: signatureMethod,
        signature_data: signatureMethod === "e-sign" ? signatureData : null,
        days_with_pay: daysWithPay
      }),
    });

    if (res.ok) {
      setRequests(prev =>
        prev.map(req =>
          req.id === selectedRequest.id
            ? {
                ...req,
                status: "Approved",
                mayor_status: "Approved",
                approver_name: admin.name || admin.email,
                remarks: `Approved with CS Form No. 6 - ${daysWithPay} days with pay`,
                days_with_pay: daysWithPay
              }
            : req
        )
      );

      alert(`Leave request approved with ${signatureMethod === "e-sign" ? "E-Signature" : "Traditional Signature"} - ${daysWithPay} days with pay`);

      // Close modals and clear form data
      setShowActualCSForm(false);
      setCsFormData(null);
      setShowSignatureChoice(false);

      // Refresh latest requests from server
      fetchRequests();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to approve via CS Form");
    }
  } catch (err) {
    console.error("Error approving with CS Form:", err);
    alert("Error approving leave request");
  }
    };

    // NEW: Handle confirm button click - show signature choice
    const handleConfirmApproval = () => {
        setShowSignatureChoice(true);
    };

    const handlePrintCSForm = async (requestData) => {
        try {
            if (!requestData || !requestData.id) {
                console.error("No request data provided");
                alert("No leave request data available");
                return;
            }

            const data = {
                leave_application_id: requestData.id,
                agency_name: "MUNICIPALITY OF PALUAN",
                agency_address: "Brgy. 10-Alipaoy, Paluan, Occidental Mindoro"
            };

            console.log("Sending request with data:", data);

            const res = await fetch("http://localhost:5000/api/generate-cs-form", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const newWindow = window.open(url);
            
            if (newWindow) {
                newWindow.onload = () => {
                    newWindow.print();
                };
            }
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Failed generating PDF: " + err.message);
        }
    };

    const handleRejectWithCSForm = async (requestId, remarks) => {
        try {
            const admin = JSON.parse(localStorage.getItem("admin"));
            const role = admin.role?.toLowerCase().replace(" ", "_");

            const res = await fetch(`http://localhost:5000/api/leave-requests/${requestId}/reject`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    actionBy: admin.id || admin.email,
                    remarks,
                    role,
                }),
            });

            if (res.ok) {
                setRequests(prev =>
                    prev.map(req =>
                        req.id === requestId
                            ? {
                                ...req,
                                status: "Rejected",
                                [`${role}_status`]: "Rejected",
                                approver_name: admin.name || admin.email,
                                remarks,
                            }
                            : req
                    )
                );
                alert(`Leave request rejected by ${admin.name || admin.email}`);
                setShowActionModal(false);
                fetchRequests();
            }
        } catch (err) {
            console.error("Error rejecting request:", err);
            alert("Error rejecting leave request");
        }
    };

    // Add this function to fetch requests
    const fetchRequests = () => {
        fetch("http://localhost:5000/api/leave-requests")
            .then((res) => res.json())
            .then((data) => setRequests(data))
            .catch((err) => console.error("Error fetching requests:", err));
    };

    useEffect(() => {
  if (!isTyping) return; // only if user is typing

  const timer = setTimeout(() => {
    generateAndShowCSForm(); // the state is now UPDATED
    setIsTyping(false);
  }, 300);

  return () => clearTimeout(timer);
}, [actionRemarks, daysWithPay]);


const handleRemarksChange = (newValue) => {
  setActionRemarks(newValue);
  setRealTimeFormData(prev => ({
    ...prev,
    action_remarks: newValue,
  }));

  setIsTyping(true);
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
                    {/* HEADER WITH SEARCH AND FILTERS */}
                    <div style={styles.requestsHeader}>
                    <div style={styles.headerTitle}>
                        <h2 style={styles.requestsTitle}>Leave Requests</h2>
                        <p style={styles.requestsSubtitle}>Review and manage employee leave applications</p>
                    </div>
                    <div style={styles.headerControls}>
                        <div style={styles.searchBox}>
                            <FontAwesomeIcon icon={faSearch} style={styles.searchIcon} />
                            <input 
                                type="text" 
                                placeholder="Search requests..." 
                                style={styles.searchInput}
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                        </div>
                        <select 
                            style={styles.statusFilter}
                            value={statusFilter}
                            onChange={handleStatusFilter}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        {/* Add Clear Filters button */}
                        <button 
                            style={styles.clearFilterBtn}
                            onClick={clearFilters}
                            disabled={!searchQuery && statusFilter === "all"}
                        >
                            Clear Filters
                        </button>
                    </div>
                    </div>

                    {/* MAIN CONTENT */}
                    <div style={styles.requestsContent}>
                    {/* LEFT TABLE - IMPROVED DESIGN */}
                    <div style={styles.leftSection}>
                        <div style={styles.tableHeader}>
                            <h3 style={styles.tableTitle}>
                                Pending Requests ({filteredRequests.filter(req => req.status === 'Pending').length})
                                {filteredRequests.length !== requests.length && ` (Filtered: ${filteredRequests.length})`}
                            </h3>
                            <div style={styles.tableActions}>
                                <button style={styles.refreshBtn} onClick={handleRefresh}>
                                    <FontAwesomeIcon icon={faRefresh} />
                                </button>
                            </div>
                        </div> 

                        <div style={styles.tableContainer}>
                        <table style={styles.leaveRequestsTable}>
                            <thead style={styles.leaveRequeststhead}>
                            <tr>
                                <th style={styles.leaveRequestsColumn}>Employee</th>
                                <th style={styles.leaveRequestsColumn}>Leave Type</th>
                                <th style={styles.leaveRequestsColumn}>Duration</th>
                                <th style={styles.leaveRequestsColumn}>Status</th>
                                <th style={styles.leaveRequestsColumn}>Date Filed</th>
                            </tr>
                            </thead>
                            <tbody>
                            {Array.isArray(filteredRequests) && filteredRequests.length > 0 ? (
                                filteredRequests.map((req) => (
                                <tr
                                    key={req.id}
                                    onClick={() => setSelectedRequest(req)}
                                    style={{ 
                                    ...styles.leaveRequestsRow,
                                    backgroundColor: selectedRequest?.id === req.id ? '#f0f9ff' : 'transparent'
                                    }}
                                >
                                    <td style={styles.leaveRequestsRows}>
                                    <div style={styles.employeeCell}>
                                        <img
                                        src={req.profile_picture || "/default-avatar.png"}
                                        alt={`${req.first_name} ${req.last_name}`}
                                        style={styles.employeeAvatar}
                                        />
                                        <div style={styles.employeeDetails}>
                                        <div style={styles.employeeName}>
                                            {req.first_name} {req.middle_name} {req.last_name}
                                        </div>
                                        <div style={styles.employeeDept}>{req.department}</div>
                                        </div>
                                    </div>
                                    </td>
                                    <td style={styles.leaveRequestsRows}>
                                    <span style={styles.leaveTypeTag}>
                                        {req.leave_type}
                                    </span>
                                    </td>
                                    <td style={styles.leaveRequestsRows}>
                                    <div style={styles.durationCell}>
                                        <div style={styles.durationDates}>
                                        {req.inclusive_date_start} - {req.inclusive_date_end}
                                        </div>
                                        <div style={styles.durationDays}>
                                        {req.number_of_days} day{req.number_of_days > 1 ? 's' : ''}
                                        </div>
                                    </div>
                                    </td>
                                    <td style={styles.leaveRequestsRows}>
                                    <span style={{
                                        ...styles.statusBadge,
                                        ...(req.status === 'Approved' ? styles.statusApproved : 
                                            req.status === 'Rejected' ? styles.statusRejected : 
                                            styles.statusPending)
                                    }}>
                                        {req.status}
                                    </span>
                                    </td>
                                    <td style={styles.leaveRequestsRows}>
                                    {new Date(req.date_filing).toLocaleDateString()}
                                    </td>
                                </tr>
                                ))
                            ) : (
                                <tr>
                                <td colSpan="5" style={styles.noRequests}>
                                    <div style={styles.emptyState}>
                                    <FontAwesomeIcon icon={faCalendarAlt} style={styles.emptyIcon} />
                                    <p style={styles.emptyText}>No leave requests found</p>
                                    </div>
                                </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                        </div>
                    </div>

                    {/* RIGHT PANEL - IMPROVED DESIGN */}
                    <div style={styles.rightSection}>
                        {selectedRequest ? (
                        <>
                            {/* EMPLOYEE HEADER */}
                            <div style={styles.employeeHeader}>
                            <div style={styles.employeeCard}>
                                <img
                                src={selectedRequest.profile_picture || "/default-avatar.png"}
                                alt="profile"
                                style={styles.profilePicture}
                                />
                                <div style={styles.employeeInfo}>
                                <h3 style={styles.employeeName}>
                                    {selectedRequest.first_name} {selectedRequest.middle_name} {selectedRequest.last_name}
                                </h3>
                                <p style={styles.employeePosition}>{selectedRequest.position}</p>
                                <div style={styles.employeeMeta}>
                                    <span style={styles.employeeId}>ID: {selectedRequest.id_number}</span>
                                    <span style={styles.employeeDept}>{selectedRequest.department}</span>
                                </div>
                                </div>
                            </div>
                            </div>

                            {/* LEAVE DETAILS */}
                            <div style={styles.detailsSection}>
                            <h4 style={styles.sectionTitle}>Leave Details</h4>
                            
                            <div style={styles.detailsGrid}>
                                <div style={styles.detailItem}>
                                <label style={styles.detailLabel}>Leave Type</label>
                                <span style={styles.detailValue}>{selectedRequest.leave_type}</span>
                                </div>
                                <div style={styles.detailItem}>
                                <label style={styles.detailLabel}>Duration</label>
                                <span style={styles.detailValue}>
                                    {selectedRequest.inclusive_date_start} to {selectedRequest.inclusive_date_end}
                                </span>
                                </div>
                                <div style={styles.detailItem}>
                                <label style={styles.detailLabel}>Total Days</label>
                                <span style={styles.detailValue}>
                                    {selectedRequest.number_of_days} day{selectedRequest.number_of_days > 1 ? 's' : ''}
                                </span>
                                </div>
                                <div style={styles.detailItem}>
                                <label style={styles.detailLabel}>Date Filed</label>
                                <span style={styles.detailValue}>
                                    {new Date(selectedRequest.date_filing).toLocaleDateString()}
                                </span>
                                </div>
                            </div>

                            {/* REASON SECTION */}
                            <div style={styles.reasonSection}>
                                <label style={styles.detailLabel}>Reason for Leave</label>
                                <div style={styles.reasonBox}>
                                <p style={styles.reasonText}>
                                    {selectedRequest.reason || "No reason provided"}
                                </p>
                                </div>
                            </div>

                            {/* APPROVAL PROGRESS */}
                            <div style={styles.approvalSection}>
                                <h4 style={styles.sectionTitle}>Approval Progress</h4>
                                <div style={styles.approvalSteps}>
                                <div style={styles.approvalStep}>
                                    <div style={{
                                    ...styles.stepIndicator,
                                    ...(selectedRequest.office_head_status === 'Approved' ? styles.stepCompleted : 
                                        selectedRequest.office_head_status === 'Rejected' ? styles.stepRejected : 
                                        styles.stepPending)
                                    }}>
                                    {selectedRequest.office_head_status === 'Approved' ? '✓' : 
                                    selectedRequest.office_head_status === 'Rejected' ? '✗' : '1'}
                                    </div>
                                    <div style={styles.stepInfo}>
                                    <span style={styles.stepTitle}>Office Head</span>
                                    <span style={styles.stepStatus}>
                                        {selectedRequest.office_head_status || 'Pending'}
                                        {selectedRequest.office_head_date && ` • ${new Date(selectedRequest.office_head_date).toLocaleDateString()}`}
                                    </span>
                                    </div>
                                </div>

                                <div style={styles.approvalStep}>
                                    <div style={{
                                    ...styles.stepIndicator,
                                    ...(selectedRequest.hr_status === 'Approved' ? styles.stepCompleted : 
                                        selectedRequest.hr_status === 'Rejected' ? styles.stepRejected : 
                                        selectedRequest.office_head_status === 'Approved' ? styles.stepCurrent : 
                                        styles.stepPending)
                                    }}>
                                    {selectedRequest.hr_status === 'Approved' ? '✓' : 
                                    selectedRequest.hr_status === 'Rejected' ? '✗' : '2'}
                                    </div>
                                    <div style={styles.stepInfo}>
                                    <span style={styles.stepTitle}>HR Department</span>
                                    <span style={styles.stepStatus}>
                                        {selectedRequest.hr_status || 'Pending'}
                                        {selectedRequest.hr_date && ` • ${new Date(selectedRequest.hr_date).toLocaleDateString()}`}
                                    </span>
                                    </div>
                                </div>

                                <div style={styles.approvalStep}>
                                    <div style={{
                                    ...styles.stepIndicator,
                                    ...(selectedRequest.mayor_status === 'Approved' ? styles.stepCompleted : 
                                        selectedRequest.mayor_status === 'Rejected' ? styles.stepRejected : 
                                        selectedRequest.hr_status === 'Approved' ? styles.stepCurrent : 
                                        styles.stepPending)
                                    }}>
                                    {selectedRequest.mayor_status === 'Approved' ? '✓' : 
                                    selectedRequest.mayor_status === 'Rejected' ? '✗' : '3'}
                                    </div>
                                    <div style={styles.stepInfo}>
                                    <span style={styles.stepTitle}>Mayor's Office</span>
                                    <span style={styles.stepStatus}>
                                        {selectedRequest.mayor_status || 'Pending'}
                                        {selectedRequest.mayor_date && ` • ${new Date(selectedRequest.mayor_date).toLocaleDateString()}`}
                                    </span>
                                    </div>
                                </div>
                                </div>
                            </div>

                            {/* ACTION BUTTONS - MODIFIED FOR MAYOR, OFFICE HEAD, AND HR ADMIN */}
                            <div style={styles.actionSection}>
                                {(userRole === "office head" && 
                                (!selectedRequest.office_head_status || selectedRequest.office_head_status === "Pending")) ||
                                (userRole === "admin" && 
                                selectedRequest.office_head_status === "Approved" && 
                                (!selectedRequest.hr_status || selectedRequest.hr_status === "Pending")) ||
                                (userRole === "mayor" && 
                                selectedRequest.hr_status === "Approved" && 
                                (!selectedRequest.mayor_status || selectedRequest.mayor_status === "Pending")) ? (
                                <div style={styles.actionButtons}>
                                    <button
                                    style={styles.approveBtn}
                                    onClick={() => {
                                        // Set action type and remarks first
                                        setActionType("approve");
                                        setActionRemarks("Approved via dashboard");
                                        // For mayor, office head, and HR admin, show CS form
                                        if (userRole === "mayor" || userRole === "office head" || userRole === "admin") {
                                            handleApprove(selectedRequest.id, "Approved via dashboard");
                                        } else {
                                            setShowActionModal(true);
                                        }
                                    }}
                                    >
                                    <FontAwesomeIcon icon={faCheckCircle} style={styles.iconApprove} />
                                    {(userRole === "mayor" || userRole === "office head" || userRole === "admin") 
                                        ? "Approve with CS Form" 
                                        : "Approve Request"}
                                    </button>
                                    <button
                                        style={styles.rejectBtn}
                                        onClick={() => {
                                            // Set action type and generate CS form directly
                                            setActionType("reject");
                                            setActionRemarks("Pending rejection reason..."); // Default text
                                            handleReject(selectedRequest.id, "Pending rejection reason...");
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faTimesCircle} style={styles.iconReject} />
                                        {(userRole === "mayor" || userRole === "office head" || userRole === "admin") 
                                            ? "Reject with CS Form" 
                                            : "Reject Request"}
                                    </button>
                                </div>
                                ) : (
                                <div style={styles.finalStatus}>
                                    <div style={{
                                    ...styles.finalStatusBadge,
                                    ...(selectedRequest.status === 'Approved' ? styles.statusApproved : 
                                        selectedRequest.status === 'Rejected' ? styles.statusRejected : 
                                        styles.statusPending)
                                    }}>
                                    {selectedRequest.status}
                                    </div>
                                    <p style={styles.finalStatusText}>
                                    Processed by {selectedRequest.approver_name} on {" "}
                                    {new Date(selectedRequest.approver_date).toLocaleDateString()}
                                    </p>
                                    {selectedRequest.remarks && (
                                    <p style={styles.remarksText}>
                                        <strong>Remarks:</strong> {selectedRequest.remarks}
                                    </p>
                                    )}
                                </div>
                                )}
                            </div>

                            </div>
                        </>
                        ) : (
                        <div style={styles.noSelection}>
                            <FontAwesomeIcon icon={faUsers} style={styles.noSelectionIcon} />
                            <h3 style={styles.noSelectionTitle}>Select a Request</h3>
                            <p style={styles.noSelectionText}>
                            Click on a leave request from the list to view details and take action
                            </p>
                        </div>
                        )}
                    </div>
                    </div>

                    {/* CS FORM MODAL */}
{showActualCSForm && csFormData && selectedRequest && (
  <div style={styles.modalOverlay}>
    <div style={styles.actualFormModal}>
      <h3 style={styles.modalTitle}>CS Form No. 6 - Application for Leave</h3>
      
      {/* Show role-specific information */}
      <div style={styles.roleInfo}>
        <p style={styles.roleText}>
          Acting as: <strong>{userRole}</strong>
          {userRole === "admin" && " (HR Department)"}
          {userRole === "office head" && " (Department Head)"}
          {userRole === "mayor" && " (Mayor's Office)"}
        </p>
        <p style={styles.roleText}>
          Action: <strong>{actionType === "approve" ? "APPROVAL" : "REJECTION"}</strong>
        </p>
      </div>
      
      {/* REAL-TIME FORM CONTROLS */}
      <div style={styles.realTimeControls}>
        <h4>Form Details</h4>
        
        {/* Show different sections based on action type */}
        {actionType === "approve" && (
          <>
            {/* APPROVAL SECTION */}
            <div style={styles.approvalSection}>
              <h5 style={styles.sectionSubtitle}>Approval Details</h5>
              
              {/* Remarks Section for Approval */}
              <div style={styles.remarksSection}>
                <label style={styles.remarksLabel}>Approval Remarks:</label>
             <textarea
  style={styles.remarksTextarea}
  value={actionRemarks}
  onChange={(e) => handleRemarksChange(e.target.value)}
  placeholder="Enter approval remarks..."
  rows={3}
/>


     {isTyping && (
      <p style={{color: '#666', fontSize: '12px', margin: '5px 0'}}>
        Form will update when you stop typing...
      </p>
    )}
              </div>
              
              {/* Days with Pay for approval - Only show for Mayor */}
              {userRole === "mayor" && (
                <div style={styles.daysWithPaySection}>
                  <h5>Days with Pay</h5>
                  <div style={styles.daysInputContainer}>
                    <input
                      type="number"
                      style={styles.daysInput}
                      value={daysWithPay}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setDaysWithPay(value);
                        setRealTimeFormData(prev => ({
                          ...prev,
                          days_with_pay: value
                        }));
                        // Update form immediately when days change
                        setTimeout(() => generateAndShowCSForm(), 100);
                      }}
                      min="0"
                      max={selectedRequest.number_of_days}
                    />
                    <span style={styles.daysNote}>out of {selectedRequest.number_of_days} total days</span>
                  </div>
                </div>
              )}
              
              {/* Special note for HR admin */}
              {userRole === "admin" && (
                <div style={styles.hrNote}>
                  <p style={styles.noteText}>
                    <strong>Note:</strong> As HR Admin, your approval will populate the leave credit values in Section 7.A
                  </p>
                </div>
              )}
            </div>
          </>
        )}
        
        {actionType === "reject" && (
          <>
            {/* REJECTION SECTION */}
            <div style={styles.rejectionSection}>
              <h5 style={styles.sectionSubtitle}>Rejection Details</h5>
              
              {/* Reason for Rejection */}
              <div style={styles.remarksSection}>
                <label style={styles.remarksLabel}>Reason for Disapproval:</label>
                <textarea
  style={styles.remarksTextarea}
  value={actionRemarks}
  onChange={(e) => handleRemarksChange(e.target.value)}
  placeholder="Enter reason for disapproval..."
  rows={3}
/>

    {isTyping && (
      <p style={{color: '#666', fontSize: '12px', margin: '5px 0'}}>
        Form will update when you stop typing...
      </p>
    )}
                {!actionRemarks.trim() && (
                  <p style={{color: 'red', fontSize: '12px', margin: '5px 0'}}>
                    Please provide a reason for rejection
                  </p>
                )}
              </div>
            </div>
          </>
        )}
        
        {/* Manual Refresh Button */}
        <button
          style={styles.refreshFormBtn}
          onClick={() => generateAndShowCSForm()}
        >
          <FontAwesomeIcon icon={faRefresh} />
          Refresh Form Preview
        </button>
      </div>

      

      {/* PDF Preview */}
<div style={styles.formPreviewContainer}>
  {isTyping ? (
    <div style={styles.typingIndicator}>
      <p>Updating form... (waiting for you to finish typing)</p>
    </div>
  ) : isGeneratingForm ? (
    <div style={styles.generatingPreview}>
      <div style={styles.loadingSpinner}></div>
      <p>Generating form preview...</p>
    </div>
  ) : csFormData ? (
    <iframe 
      src={csFormData.url} 
      style={styles.formIframe}
      title="CS Form No. 6"
      key={csFormData.timestamp}
    />
  ) : (
    <div style={styles.loadingPreview}>
      <p>Generating form preview...</p>
    </div>
  )}
</div>

      <div style={styles.formActions}>
        <button
          style={styles.printFormBtn}
          onClick={() => {
            const newWindow = window.open(csFormData.url);
            if (newWindow) {
              newWindow.onload = () => {
                newWindow.print();
              };
            }
          }}
        >
          <FontAwesomeIcon icon={faPrint} />
          Print Form
        </button>
        
        <button
          style={actionType === "approve" ? styles.confirmApproveBtn : styles.confirmRejectBtn}
          onClick={() => {
            if (actionType === "approve") {
              handleConfirmApproval();
            } else {
              // For rejection, make sure we have the remarks before proceeding
              if (actionRemarks.trim()) {
                handleConfirmApproval();
              } else {
                alert("Please provide a reason for rejection");
              }
            }
          }}
          disabled={actionType === "reject" && !actionRemarks.trim()}
        >
          {actionType === "approve" ? "Approve Request" : "Reject Request"}
        </button>
        
        <button
          style={styles.cancelBtn}
          onClick={() => {
            setShowActualCSForm(false);
            setCsFormData(null);
            setActionType(null);
            setActionRemarks("");
            setRealTimeFormData({
              action_type: "",
              action_remarks: "",
              days_with_pay: 0
            });
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

{/* LOADING MODAL */}
{isGeneratingCSForm && (
  <div style={styles.modalOverlay}>
    <div style={styles.loadingModal}>
      <div style={styles.loadingSpinner}></div>
      <h3 style={styles.loadingTitle}>Generating CS Form</h3>
      <p style={styles.loadingText}>Please wait while we prepare your form...</p>
    </div>
  </div>
)}

<style>{spinAnimation}</style>


            {showSignatureChoice && (
                <div style={styles.modalOverlay}>
                    <div style={styles.signatureChoiceModal}>
                        <h3 style={styles.modalTitle}>Select Signature Method</h3>
                        
                        <div style={styles.signatureOptions}>
                            <p style={styles.signatureDescription}>
                                How would you like to sign the CS Form No. 6?
                            </p>
                            
                            <div style={styles.signatureButtons}>
                                <button
                                    style={styles.eSignBtn}
                                    onClick={() => handleSignatureMethod("e-sign")}
                                    disabled={isSigning}
                                >
                                    <FontAwesomeIcon icon={faSignature} />
                                    {isSigning ? " Signing..." : " E-Signature"}
                                    <span style={styles.methodDescription}>Sign digitally using your electronic signature</span>
                                </button>
                                
                                <button
                                    style={styles.traditionalSignBtn}
                                    onClick={() => handleSignatureMethod("traditional")}
                                >
                                    <FontAwesomeIcon icon={faPrint} />
                                    Print & Sign
                                    <span style={styles.methodDescription}>Print the form and sign manually</span>
                                </button>
                            </div>
                        </div>

                        <div style={styles.modalActions}>
                            <button
                                style={styles.cancelBtn}
                                onClick={() => {
                                    setShowSignatureChoice(false);
                                }}
                            >
                                Back
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

const spinAnimation = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

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

leaveRequests: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  requestsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  headerTitle: {
    flex: 1,
  },
  requestsTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1F2937',
    margin: '0 0 4px 0',
  },
  requestsSubtitle: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0,
  },
  headerControls: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: '#6B7280',
    fontSize: '14px',
  },
  searchInput: {
    padding: '10px 12px 10px 36px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    width: '250px',
    backgroundColor: '#F9FAFB',
  },
  statusFilter: {
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
  },
  requestsContent: {
    display: 'flex',
    gap: '24px',
    height: 'calc(100vh - 200px)',
  },
  leftSection: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 20px 0 20px',
    borderBottom: '1px solid #F3F4F6',
  },
  tableTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1F2937',
    margin: 0,
  },
  tableActions: {
    display: 'flex',
    gap: '8px',
  },
  refreshBtn: {
    padding: '8px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: '#6B7280',
  },
  tableContainer: {
    flex: 1,
    overflow: 'auto',
  },
  leaveRequestsTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  leaveRequeststhead: {
    backgroundColor: '#F9FAFB',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  leaveRequestsColumn: {
    padding: '16px 20px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #E5E7EB',
  },
  leaveRequestsRow: {
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    borderBottom: '1px solid #F3F4F6',
  },
  leaveRequestsRows: {
    padding: '16px 20px',
    fontSize: '14px',
    color: '#1F2937',
    verticalAlign: 'middle',
  },
  employeeCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  employeeAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    objectFit: 'cover',
  },
  employeeDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  employeeName: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#1F2937',
  },
  employeeDept: {
    fontSize: '12px',
    color: '#6B7280',
  },
  leaveTypeTag: {
    padding: '4px 8px',
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  },
  durationCell: {
    display: 'flex',
    flexDirection: 'column',
  },
  durationDates: {
    fontSize: '14px',
    color: '#1F2937',
  },
  durationDays: {
    fontSize: '12px',
    color: '#6B7280',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusApproved: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  noRequests: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    color: '#6B7280',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    margin: 0,
  },
  rightSection: {
    width: '400px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'auto',
  },
  employeeHeader: {
    padding: '24px',
    borderBottom: '1px solid #F3F4F6',
  },
  employeeCard: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  profilePicture: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    objectFit: 'cover',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1F2937',
    margin: '0 0 4px 0',
  },
  employeePosition: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '0 0 8px 0',
  },
  employeeMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  employeeId: {
    fontSize: '12px',
    color: '#6B7280',
  },
  detailsSection: {
    padding: '24px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1F2937',
    margin: '0 0 16px 0',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '20px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailLabel: {
    fontSize: '12px',
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: '14px',
    color: '#1F2937',
    fontWeight: '500',
  },
  reasonSection: {
    marginBottom: '24px',
  },
  reasonBox: {
    padding: '12px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
  },
  reasonText: {
    fontSize: '14px',
    color: '#4B5563',
    lineHeight: '1.5',
    margin: 0,
  },
  approvalSection: {
    marginBottom: '24px',
  },
  approvalSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  approvalStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  stepIndicator: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
  },
  stepCompleted: {
    backgroundColor: '#10B981',
    color: '#ffffff',
  },
  stepRejected: {
    backgroundColor: '#EF4444',
    color: '#ffffff',
  },
  stepCurrent: {
    backgroundColor: '#3B82F6',
    color: '#ffffff',
  },
  stepPending: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  stepInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  stepTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1F2937',
  },
  stepStatus: {
    fontSize: '12px',
    color: '#6B7280',
  },
  actionSection: {
    padding: '20px',
    borderTop: '1px solid #F3F4F6',
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
  },
  approveBtn: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: '#10B981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background-color 0.2s ease',
  },
  rejectBtn: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: '#EF4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background-color 0.2s ease',
  },
  finalStatus: {
    textAlign: 'center',
  },
  finalStatusBadge: {
    display: 'inline-block',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  finalStatusText: {
    fontSize: '12px',
    color: '#6B7280',
    margin: '0 0 8px 0',
  },
  remarksText: {
    fontSize: '12px',
    color: '#4B5563',
    margin: 0,
    fontStyle: 'italic',
  },
  noSelection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    textAlign: 'center',
    color: '#6B7280',
  },
  noSelectionIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  noSelectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  noSelectionText: {
    fontSize: '14px',
    margin: 0,
    lineHeight: '1.5',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1F2937',
    margin: '0 0 16px 0',
  },
  modalBody: {
    marginBottom: '24px',
  },
  modalText: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '0 0 16px 0',
    lineHeight: '1.5',
  },
  confirmApproveBtn: {
    padding: '10px 20px',
    backgroundColor: '#10B981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  confirmRejectBtn: {
    padding: '10px 20px',
    backgroundColor: '#EF4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  clearFilterBtn: {
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#6B7280',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
},

// NEW STYLES FOR CS FORM
csFormModal: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '12px',
    width: '600px',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
},
csFormPreview: {
    border: '2px solid #333',
    padding: '20px',
    marginBottom: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
},
formSection: {
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '1px solid #ddd',
},
formRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    padding: '5px 0',
},
formLabel: {
    fontWeight: 'bold',
    color: '#333',
    minWidth: '150px',
},
formValue: {
    color: '#555',
    flex: 1,
    textAlign: 'right',
},
signatureOptions: {
    marginBottom: '20px',
    textAlign: 'center',
},
signatureButtons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginTop: '15px',
},
eSignBtn: {
    padding: '12px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
},
traditionalSignBtn: {
    padding: '12px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
},
printBtn: {
    padding: '10px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
},

// Add to your styles object
actionTypeSection: {
    marginBottom: '20px',
    textAlign: 'center',
},
actionTypeButtons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginTop: '15px',
},
approveActionBtn: {
    padding: '12px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
},
rejectActionBtn: {
    padding: '12px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
},
rejectionOptions: {
    marginBottom: '20px',
},

// Add these new styles
actualFormModal: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    width: '90%',
    height: '90%',
    maxWidth: '1200px',
    maxHeight: '90vh',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
},
formPreviewContainer: {
    flex: 1,
    border: '2px solid #333',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '20px',
},
formIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
},
formActions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    alignItems: 'center',
},
printFormBtn: {
    padding: '12px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
},
confirmApproveBtn: {
    padding: '12px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
},

daysWithPaySection: {
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6',
    },
    daysInputContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginTop: '10px',
    },
    daysInput: {
        width: '80px',
        padding: '8px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
        textAlign: 'center',
    },
    daysNote: {
        fontSize: '12px',
        color: '#666',
        fontStyle: 'italic',
    },
    signatureChoiceModal: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '12px',
        width: '500px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    },
    signatureDescription: {
        textAlign: 'center',
        marginBottom: '20px',
        color: '#666',
        fontSize: '14px',
    },
    signatureButtons: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        marginBottom: '20px',
    },
    eSignBtn: {
        padding: '20px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
    },
    traditionalSignBtn: {
        padding: '20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
    },
    methodDescription: {
        fontSize: '12px',
        fontWeight: 'normal',
        opacity: '0.9',
    },

    roleInfo: {
        padding: '10px',
        backgroundColor: '#e8f4fd',
        border: '1px solid #b8daff',
        borderRadius: '4px',
        marginBottom: '15px'
    },
    roleText: {
        margin: '0',
        fontSize: '14px',
        color: '#004085'
    },
    hrNote: {
        padding: '10px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        marginTop: '10px'
    },
    noteText: {
        margin: '0',
        fontSize: '13px',
        color: '#856404'
    },
    loadingModal: {
  backgroundColor: '#fff',
  padding: '40px',
  borderRadius: '12px',
  width: '400px',
  textAlign: 'center',
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
},
loadingSpinner: {
  border: '4px solid #f3f3f3',
  borderTop: '4px solid #5ab049ff',
  borderRadius: '50%',
  width: '50px',
  height: '50px',
  animation: 'spin 1s linear infinite',
  margin: '0 auto 20px',
},
loadingTitle: {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1F2937',
  margin: '0 0 10px 0',
},
loadingText: {
  fontSize: '14px',
  color: '#6B7280',
  margin: 0,
},

typingIndicator: {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#666',
  fontStyle: 'italic',
},
generatingPreview: {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#666',
},




};

export default LeaveManagement;