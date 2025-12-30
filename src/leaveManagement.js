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
  faEraser,
  faTrash,
  faExclamationTriangle,
  faWarning,
  faCalendarDay,
  faTimes,
  faBars,
  faEye,
  faDownload
} from '@fortawesome/free-solid-svg-icons';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './dashboardCalendar.css';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import SignatureCanvas from 'react-signature-canvas';
import './leave-management-responsive.css';
import './dashboard-responsive.css'; 

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
    const [savedPDFs, setSavedPDFs] = useState([]);
const [showSavedPDFsModal, setShowSavedPDFsModal] = useState(false);

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

// E-Signature Refs and State
const sigCanvasRef = useRef(null);
const [showESignPad, setShowESignPad] = useState(false);
const [signatureImage, setSignatureImage] = useState(null);
const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);

// Add these with your other signature states
const [uploadedSignature, setUploadedSignature] = useState(null);
const [showUploadSignature, setShowUploadSignature] = useState(false);
const [isUploadingSignature, setIsUploadingSignature] = useState(false);
const [uploadedSignaturePreview, setUploadedSignaturePreview] = useState(null);

const [leaveCalendarData, setLeaveCalendarData] = useState([]);
const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());
const [calendarView, setCalendarView] = useState('day'); // 'day', 'month'
const [selectedDepartment, setSelectedDepartment] = useState('all');
const [calendarLoading, setCalendarLoading] = useState(false);

// NEW STATE FOR OVERLAPPING CHECK
const [overlapCheckResult, setOverlapCheckResult] = useState(null);
const [showOverlapModal, setShowOverlapModal] = useState(false);
const [forceApprove, setForceApprove] = useState(false);
const [overlapCheckLoading, setOverlapCheckLoading] = useState(false);

const [rejectionReason, setRejectionReason] = useState(""); // For pre-defined reasons
const [customRejectionReason, setCustomRejectionReason] = useState(""); // For custom input
const [showCustomReasonInput, setShowCustomReasonInput] = useState(false);
// Add near other state declarations
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const [showProfileMenu, setShowProfileMenu] = useState(false);

// Pre-defined rejection reasons
const rejectionReasons = [
  "Overlapping of leave with existing approved leaves",
  "Incomplete documentation",
  "Violation of leave policy",
  "Department scheduling conflict",
  "Pending work deliverables",
  "Other (specify below)"
];


  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "http://10.115.128.197:5000";

      // Add this useEffect near your other useEffect hooks
useEffect(() => {
  // Function to disable scrolling
  const disableScroll = () => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
  };
  
  // Function to enable scrolling
  const enableScroll = () => {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
  };
  
  // Check if any modal is open
  const isModalOpen = 
    showActionModal || 
    showUploadModal || 
    showActualCSForm || 
    showSignatureChoice || 
    showESignPad || 
    showUploadSignature || 
    showSavedPDFsModal ||
    showOverlapModal ||
    isGeneratingCSForm;
    
  if (isModalOpen) {
    disableScroll();
  } else {
    enableScroll();
  }
  
  // Cleanup on unmount
  return () => {
    enableScroll();
  };
}, [
  showActionModal, 
  showUploadModal, 
  showActualCSForm, 
  showSignatureChoice, 
  showESignPad, 
  showUploadSignature, 
  showSavedPDFsModal,
  showOverlapModal,
  isGeneratingCSForm
]);


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
            await fetch(`${API_URL}/api/auth/logout`, {
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
        console.log("📊 Fetching leave summary data...");
        fetch(`${API_URL}/api/leave-requests`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                console.log("📊 Raw leave summary data received:", data);
                
                const formatted = data.map((req, index) => {
                    console.log(`Processing request ${index}:`, req);
                    
                    // Parse inclusive dates - handle multiple formats
                    let from = null;
                    let to = null;
                    
                    if (req.inclusive_dates) {
                        try {
                            // Handle string format like "[2024-01-01,2024-01-05)"
                            if (typeof req.inclusive_dates === 'string') {
                                const match = req.inclusive_dates.match(/\[(.*?),(.*?)[)\]]/);
                                if (match) {
                                    from = new Date(match[1].trim());
                                    to = new Date(match[2].trim());
                                } else {
                                    // Try to parse as direct dates
                                    const dates = req.inclusive_dates.split(',');
                                    if (dates.length >= 2) {
                                        from = new Date(dates[0].replace(/[\[\]]/g, '').trim());
                                        to = new Date(dates[1].replace(/[)\]]/g, '').trim());
                                    }
                                }
                            }
                            
                            // Validate dates
                            if (from && isNaN(from.getTime())) {
                                console.warn("Invalid from date:", req.inclusive_dates);
                                from = null;
                            }
                            if (to && isNaN(to.getTime())) {
                                console.warn("Invalid to date:", req.inclusive_dates);
                                to = null;
                            }
                            
                        } catch (err) {
                            console.error("Error parsing dates for request:", req.id, err);
                        }
                    }
                    
                    // Use the inclusive_date fields as fallback
                    if ((!from || !to) && req.inclusive_date_start && req.inclusive_date_end) {
                        try {
                            from = new Date(req.inclusive_date_start);
                            to = new Date(req.inclusive_date_end);
                        } catch (err) {
                            console.error("Error parsing fallback dates:", err);
                        }
                    }
                    
                    console.log(`Request ${req.id} dates:`, { from, to });
                    
                    // Get employee name
                    const employeeName = req.first_name && req.last_name 
                        ? `${req.first_name} ${req.last_name}`
                        : req.name || `Employee ${req.user_id || index + 1}`;
                    
                    // Get department
                    const department = req.department || req.office_department || 'N/A';
                    
                    return {
                        id: req.id || index,
                        name: employeeName,
                        department: department,
                        leaveType: req.leave_type || 'N/A',
                        entitled: req.entitled || 0,
                        used: req.used || 0,
                        remaining: req.balance || (req.entitled - req.used) || 0,
                        status: req.status || 'Pending',
                        approvedBy: req.approver_name || req.approved_by || "N/A",
                        dateFiled: req.date_filing ? new Date(req.date_filing) : null,
                        range: { from, to }
                    };
                });
                
                console.log("📊 Formatted leave records:", formatted);
                setLeaveRecords(formatted);
            })
            .catch((err) => {
                console.error("❌ Error fetching summary:", err);
                // Fallback to empty array to prevent crashes
                setLeaveRecords([]);
            });
    }
}, [activeTab]);


useEffect(() => {
    const dayStr = date.toLocaleDateString("en-CA");

    const filtered = leaveRecords.filter((record) => {
        if (!record.dateFiled) return false;

        const filedStr = record.dateFiled.toLocaleDateString("en-CA");

        return filedStr === dayStr;
    });

    console.log(`📊 Filtered records count: ${filtered.length}`);
    setFilteredRecords(filtered);
}, [date, leaveRecords]);



    useEffect(() => {
        if (activeTab === "requests") {
            fetch(`${API_URL}/api/leave-requests`)
                .then((res) => res.json())
                .then((data) => setRequests(data))
                .catch((err) => console.error("Error fetching requests:", err));
        }
    }, [activeTab]);

const checkOverlappingLeaves = async (leaveRequestId) => {
  try {
    setOverlapCheckLoading(true);
    
    const request = requests.find(req => req.id === leaveRequestId);
    if (!request) {
      throw new Error("Leave request not found");
    }

    console.log("🔍 Checking overlaps for request:", {
      id: request.id,
      user_id: request.user_id,
      inclusive_dates: request.inclusive_dates, // Should be "[2025-12-14,2025-12-16)"
      department: request.department
    });

    // If inclusive_dates doesn't exist, we need to fetch it
    let inclusiveDates = request.inclusive_dates;
    
    if (!inclusiveDates) {
      console.log("⚠️ inclusive_dates not found in request, fetching from backend...");
      // The backend fix above should make this unnecessary
      throw new Error("inclusive_dates not available in leave request data");
    }

    console.log("✅ Using inclusive_dates:", inclusiveDates);

    const leaveRequestForBackend = {
      user_id: request.user_id,
      inclusive_dates: inclusiveDates,
      id: request.id,
      department: request.department
    };

    console.log("📤 Sending to backend:", leaveRequestForBackend);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${API_URL}/api/leave-requests/check-overlapping-leaves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leaveRequestForBackend),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ Overlap check result:", data);
    setOverlapCheckResult(data);
    
    return data;
  } catch (error) {
    console.error('❌ Error checking overlapping leaves:', error);
    
    const fallbackResult = { 
      hasOverlap: false, 
      violations: [],
      error: error.message,
      canProceed: true
    };
    
    setOverlapCheckResult(fallbackResult);
    return fallbackResult;
  } finally {
    setOverlapCheckLoading(false);
  }
};

// MODIFIED: handleApprove function with overlapping check
const handleApprove = async (requestId, remarks = "Approved via dashboard") => {
  const admin = JSON.parse(localStorage.getItem("admin"));
  if (!admin) return alert("No admin logged in!");

  const role = admin.role?.toLowerCase().replace(" ", "_");
  const request = requests.find(req => req.id === requestId);

  // ❗ BLOCK: If office head rejected → no one can approve
  if (request.office_head_status === "Rejected" && role !== "office_head") {
    alert("This leave has already been rejected by the Office Head and cannot be approved.");
    return;
  }

  // For office_head role, check for overlapping leaves
  if (role === "office_head") {
    try {
      setOverlapCheckLoading(true);
      const overlapCheck = await checkOverlappingLeaves(requestId);
      setOverlapCheckResult(overlapCheck);
      
      if (overlapCheck.hasOverlap) {
        // Show overlapping leaves warning modal
        setShowOverlapModal(true);
        setSelectedRequest(request);
        setActionType("approve");
        setActionRemarks(remarks);
        return; // Don't proceed yet, wait for user decision
      }
    } catch (error) {
      console.error("Error checking overlapping leaves:", error);
      // Continue with approval if check fails
    } finally {
      setOverlapCheckLoading(false);
    }
  }

  // CS Form path for approval (mayor, office_head, admin)
  if (role === "mayor" || role === "office_head" || role === "admin") {
    if (request) {
      setSelectedRequest(request);
      setDaysWithPay(request.number_of_days || 0);
      setActionType("approve");
      setActionRemarks(remarks);
      generationTriggerRef.current = true;
      setIsGeneratingCSForm(true);
    }
    return;
  }

  // Normal approval path (for roles other than the ones above)
  (async () => {
    try {
      const res = await fetch(`${API_URL}/api/leave-requests/${requestId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionBy: admin.id || admin.email,
          remarks,
          role,
          forceApprove: false // For office_head, this will be handled in backend
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

// NEW FUNCTION: Handle force approval after overlap warning
const handleForceApprove = async () => {
  if (!selectedRequest) return;

  const admin = JSON.parse(localStorage.getItem("admin"));
  if (!admin) return alert("No admin logged in!");

  const role = admin.role?.toLowerCase().replace(" ", "_");
  
  try {
    const res = await fetch(`${API_URL}/api/leave-requests/${selectedRequest.id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actionBy: admin.id || admin.email,
        remarks: actionRemarks || "Approved despite overlapping leaves",
        role,
        forceApprove: true
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setRequests(prev =>
        prev.map(req =>
          req.id === selectedRequest.id
            ? {
                ...req,
                status: role === "mayor" ? "Approved" : req.status,
                [`${role}_status`]: "Approved",
                approver_name: data.approver_name,
                remarks: actionRemarks || "Approved despite overlapping leaves",
              }
            : req
        )
      );
      
      alert(`Leave request approved (with overlapping leaves warning) by ${data.approver_name}`);
      setShowOverlapModal(false);
      setOverlapCheckResult(null);
    } else {
      alert(data.error || "Failed to approve request");
    }
  } catch (err) {
    console.error(err);
    alert("Error approving leave request");
  }
};

// NEW FUNCTION: Handle normal approval (proceed without force)
const handleProceedApproval = () => {
  setShowOverlapModal(false);
  // Proceed with normal CS Form generation
  if (selectedRequest) {
    setDaysWithPay(selectedRequest.number_of_days || 0);
    generationTriggerRef.current = true;
    setIsGeneratingCSForm(true);
  }
};

const handleReject = (requestId, remarks = "Rejected via dashboard") => {
  const admin = JSON.parse(localStorage.getItem("admin"));
  if (!admin) return alert("No admin logged in!");

  const role = admin.role?.toLowerCase().replace(" ", "_");
  const request = requests.find(req => req.id === requestId);

  // CHECK: If head has already rejected, block further actions
  if (request.office_head_status === "Rejected" && role !== "office_head") {
    alert("This leave request has been rejected by the Office Head and cannot be processed further.");
    return;
  }

  // If mayor/office_head/admin, show CS form for rejection with options
  if (role === "mayor" || role === "office_head" || role === "admin") {
    if (request) {
      setSelectedRequest(request);
      setActionType("reject");
      setRejectionReason(""); // Reset rejection reason
      setCustomRejectionReason(""); // Reset custom reason
      setShowCustomReasonInput(false); // Reset custom input visibility
      setActionRemarks(remarks || "Rejected via CS Form");
      generationTriggerRef.current = true;
      setIsGeneratingCSForm(true);
    }
    return;
  }

  // Original rejection logic for other roles
  (async () => {
    try {
      const res = await fetch(`${API_URL}/api/leave-requests/${requestId}/reject`, {
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

const handleRejectionReasonChange = (reason) => {
  setRejectionReason(reason);
  
  // Check if "Other" is selected
  if (reason === "Other (specify below)") {
    setShowCustomReasonInput(true);
    setActionRemarks(""); // Clear action remarks initially
  } else {
    setShowCustomReasonInput(false);
    // Set the selected reason as action remarks
    setActionRemarks(reason);
  }
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
    
    if (!admin) {
      alert("Authentication required. Please log in again.");
      setIsGeneratingForm(false);
      setIsGeneratingCSForm(false);
      return;
    }

    const role = admin.role?.toLowerCase().replace(" ", "_");

    // Prepare signature data based on method
    let finalSignatureData = null;
    
    if (signatureMethod === "upload") {
      finalSignatureData = uploadedSignature || signatureData;
      console.log("📤 Using uploaded signature for form generation");
    } else if (signatureMethod === "e-sign") {
      finalSignatureData = signatureData;
      console.log("🖋️ Using e-signature for form generation");
    }
    // For traditional method, signature data remains null

    // Build payload with user data INCLUDING SIGNATURE DATA
    const payload = {
      leave_application_id: selectedRequest.id,
      days_with_pay: daysWithPay,
      requesting_role: role,
      action_type: actionType,
      action_remarks: actionRemarks,
      user_id: admin.id,
      user_data: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        full_name: admin.full_name
      },
      real_time_data: {
        action_type: actionType,
        action_remarks: actionRemarks,
        days_with_pay: daysWithPay
      },
      // Include signature information
      signature_method: signatureMethod,
      signature_data: finalSignatureData
    };

    console.log("📦 Final payload for form generation:", {
      signature_method: payload.signature_method,
      has_signature_data: !!payload.signature_data
    });

    const res = await fetch(`${API_URL}/api/generate-cs-form`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    setCsFormData({
      blob,
      url,
      timestamp: Date.now()
    });

    setShowActualCSForm(true);
    
    // For traditional method, show signature choice modal after form is generated
    if (signatureMethod === "traditional") {
      setShowSignatureChoice(true);
    }
    
  } catch (err) {
    console.error("Error generating CS Form:", err);
    alert("Failed generating CS Form: " + err.message);
  } finally {
    setIsGeneratingCSForm(false);
    setIsGeneratingForm(false);
  }
};

// Add a function to clear all signature states
const clearSignatureStates = () => {
  setSignatureMethod("");
  setSignatureData("");
  setSignatureImage(null);
  setUploadedSignature(null);
  setUploadedSignaturePreview(null);
  setShowSignatureChoice(false);
  setShowESignPad(false);
  setShowUploadSignature(false);
  setIsSigning(false);
  setIsSignatureEmpty(true);
};

const compressSignatureImage = (base64Image, maxWidth = 300, quality = 0.5) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Image;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scaleFactor = Math.min(maxWidth / img.width, 1); // Don't enlarge
      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Compress to JPEG for smaller size (or PNG with lower quality)
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      console.log(`Compressed from ${base64Image.length} to ${compressedBase64.length} bytes`);
      resolve(compressedBase64);
    };
    
    img.onerror = () => {
      console.log('Image loading error, returning original');
      resolve(base64Image); // Fallback to original
    };
  });
};

// Handle signature image upload
const handleSignatureUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setIsUploadingSignature(true);
  
  try {
    // Convert file to base64
    const base64 = await convertToBase64(file);
    
    // COMPRESS the image first
    const compressedBase64 = await compressSignatureImage(base64, 300, 0.5);
    
    // Then remove background
    const processedSignature = await removeSignatureBackground(compressedBase64);
    
    setUploadedSignature(processedSignature);
    setUploadedSignaturePreview(processedSignature);
    
    console.log("✅ Signature uploaded, compressed, and processed");
  } catch (error) {
    console.error("Error processing signature:", error);
    alert("Failed to process signature image. Please try again with a clearer image.");
  } finally {
    setIsUploadingSignature(false);
  }
};

// Convert file to base64
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Remove background using backend API
const removeSignatureBackground = async (base64Image) => {
  try {
    const response = await fetch(`${API_URL}/api/remove-signature-background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      throw new Error('Background removal failed');
    }

    const data = await response.json();
    return data.processedImage;
  } catch (error) {
    console.error('Background removal error:', error);
    // Fallback: return original image if background removal fails
    return base64Image;
  }
};

const handleUseUploadedSignature = async () => {
  if (!uploadedSignature) {
    alert("Please upload a signature first");
    return;
  }

  console.log("💾 Processing uploaded signature...");
  
  try {
    // Save the uploaded signature to state
    setSignatureImage(uploadedSignature);
    setSignatureData(uploadedSignature);
    setSignatureMethod("upload");  // CRITICAL: Set method to "upload"
    
    // Save signature to database
    if (selectedRequest) {
      const admin = JSON.parse(localStorage.getItem("admin"));
      const role = admin.role?.toLowerCase().replace(" ", "_");
      
      console.log("💾 Saving uploaded signature to database...");
      const saved = await saveSignatureToDatabase(selectedRequest.id, uploadedSignature, role);
      if (saved) {
        console.log("✅ Uploaded signature saved to database");
      }
    }
    
    // Close all signature modals
    setShowUploadSignature(false);
    setShowSignatureChoice(false);
    setUploadedSignature(null);
    setUploadedSignaturePreview(null);
    
    console.log("✅ Uploaded signature saved. Signature method:", signatureMethod);
    
    // IMPORTANT: Don't automatically generate form - wait for user to click Approve/Reject
    // Just show success message
    alert("Signature uploaded successfully! Click 'Approve Request' or 'Reject Request' to proceed.");
    
  } catch (error) {
    console.error("Error using uploaded signature:", error);
    alert("Failed to save signature. Please try again.");
  }
};



// E-Signature Functions
const handleSignatureMethod = (method) => {
  setSignatureMethod(method);
  setShowSignatureChoice(false);

  if (method === "e-sign") {
    setShowESignPad(true);
    setIsSigning(true);
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

// Add this useEffect to debug signature state
useEffect(() => {
  console.log("🔄 Signature state updated:", {
    signatureMethod,
    hasSignatureData: !!signatureData,
    signatureDataLength: signatureData ? signatureData.length : 0
  });
}, [signatureMethod, signatureData]);

// Remove or fix this problematic useEffect
useEffect(() => {
  if ((signatureMethod === "e-sign" || signatureMethod === "upload") && signatureData && isSigning === false) {
    console.log("🟢 Signature is now ready, generating CS Form...");
    generateAndShowCSForm();
  }
}, [signatureData, isSigning, signatureMethod]);



const saveSignatureToDatabase = async (leaveApplicationId, signatureData, role) => {
  try {
    const res = await fetch(`${API_URL}/api/save-signature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leave_application_id: leaveApplicationId,
        signature_data: signatureData,
        requesting_role: role
      }),
    });

    if (res.ok) {
      console.log("Signature saved successfully to database");
      return true;
    } else {
      console.error("Failed to save signature to database");
      return false;
    }
  } catch (err) {
    console.error("Error saving signature:", err);
    return false;
  }
};


const handleSaveSignature = async () => {
  if (sigCanvasRef.current) {
    const signatureDataURL = sigCanvasRef.current.toDataURL();
    if (sigCanvasRef.current.isEmpty()) {
      alert("Please provide a signature first.");
      return;
    }
    
    console.log("💾 Saving signature...");
    
    // Compress e-signature too
    const compressedSignature = await compressSignatureImage(signatureDataURL, 400, 0.7);
    
    // Save compressed signature to state
    setSignatureImage(compressedSignature);
    setSignatureData(compressedSignature);
    
    // Save signature to database
    if (selectedRequest) {
      const admin = JSON.parse(localStorage.getItem("admin"));
      const role = admin.role?.toLowerCase().replace(" ", "_");
      
      const saved = await saveSignatureToDatabase(selectedRequest.id, compressedSignature, role);
      if (saved) {
        console.log("✅ Signature saved to database");
      }
    }
    
    setShowESignPad(false);
    setIsSigning(false);
    
    console.log("✅ Compressed signature saved to state:", compressedSignature.length);
  }
};

const handleClearSignature = () => {
  if (sigCanvasRef.current) {
    sigCanvasRef.current.clear();
    setIsSignatureEmpty(true);
  }
};

const handleSignatureDraw = () => {
  if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
    setIsSignatureEmpty(false);
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

    // For rejection, validate that we have a reason
    if (actionType === "reject") {
      if (!rejectionReason && !actionRemarks.trim()) {
        alert("Please select or specify a reason for rejection");
        return;
      }
      
      const finalRemarks = showCustomReasonInput && customRejectionReason.trim() 
        ? customRejectionReason 
        : actionRemarks || rejectionReason;
      
      if (!finalRemarks.trim()) {
        alert("Please provide a reason for rejection");
        return;
      }
      
      setActionRemarks(finalRemarks);
    }

    console.log("🔐 Completing action with signature method:", signatureMethod);

    // ✅ STEP 1: Generate and save PDF to database
    console.log("📄 Generating and saving PDF to database...");
    
    const generatePayload = {
      leave_application_id: selectedRequest.id,
      days_with_pay: daysWithPay,
      requesting_role: role,
      action_type: actionType,
      action_remarks: actionRemarks,
      user_id: admin.id,
      signature_data: signatureData || uploadedSignature,
      signature_method: signatureMethod,
      save_to_db: true // ✅ CRITICAL: Tell backend to save PDF
    };

    // Generate PDF and save to database
    const generateRes = await fetch(`${API_URL}/api/generate-cs-form`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(generatePayload),
    });

    if (!generateRes.ok) {
      throw new Error("Failed to generate and save PDF");
    }

    // ✅ STEP 2: Now proceed with approval/rejection
    const endpoint = actionType === "approve" 
      ? `${API_URL}/api/leave-requests/${selectedRequest.id}/approve`
      : `${API_URL}/api/leave-requests/${selectedRequest.id}/reject`;

    const remarks = actionType === "approve" 
      ? `Approved with CS Form No. 6 - ${daysWithPay} days with pay`
      : actionRemarks || "Rejected via CS Form";

    const payload = {
      actionBy: admin.id || admin.email,
      remarks: remarks,
      role,
      cs_form_signed: true,
      signature_method: signatureMethod,
      signature_data: signatureData || uploadedSignature,
      days_with_pay: daysWithPay,
      forceApprove: forceApprove,
      rejection_reason: actionType === "reject" ? rejectionReason : null,
      custom_rejection_reason: actionType === "reject" ? customRejectionReason : null
    };

    const finalRes = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (finalRes.ok) {
      // Update frontend state
      setRequests(prev =>
        prev.map(req =>
          req.id === selectedRequest.id
            ? {
                ...req,
                status: actionType === "approve" ? "Approved" : "Rejected",
                mayor_status: actionType === "approve" ? "Approved" : "Rejected",
                approver_name: admin.name || admin.email,
                remarks: remarks,
                days_with_pay: daysWithPay,
                rejection_reason: actionType === "reject" ? rejectionReason : null,
                cs_form_generated: true // ✅ Add this flag
              }
            : req
        )
      );

      alert(`Leave request ${actionType === "approve" ? "approved" : "rejected"} and CS Form saved to database!`);

      // Close all modals
      setShowSignatureChoice(false);
      setShowESignPad(false);
      setShowUploadSignature(false);
      setShowActualCSForm(false);
      setCsFormData(null);
      setShowOverlapModal(false);
      
      // Clear all states
      setSignatureMethod("");
      setSignatureData("");
      setSignatureImage(null);
      setUploadedSignature(null);
      setUploadedSignaturePreview(null);
      setRejectionReason("");
      setCustomRejectionReason("");
      setShowCustomReasonInput(false);

      // Refresh requests
      fetchRequests();
    } else {
      const data = await finalRes.json();
      alert(data.error || `Failed to ${actionType} via CS Form`);
    }
  } catch (err) {
    console.error(`Error ${actionType === "approve" ? "approving" : "rejecting"} with CS Form:`, err);
    alert(`Error ${actionType === "approve" ? "approving" : "rejecting"} leave request`);
  }
};

// Add this function to your component
const viewSavedPDFs = async (leaveApplicationId) => {
  try {
    const response = await fetch(`${API_URL}/api/leave-pdfs/${leaveApplicationId}`);
    if (response.ok) {
      const pdfs = await response.json();
      
      // Create a modal to show saved PDFs
      setSavedPDFs(pdfs);
      setShowSavedPDFsModal(true);
    } else {
      alert("Failed to fetch saved PDFs");
    }
  } catch (error) {
    console.error("Error fetching saved PDFs:", error);
    alert("Error fetching saved PDFs");
  }
};

// Add download function
const downloadPDF = async (pdfId) => {
  try {
    const response = await fetch(`${API_URL}/api/download-pdf/${pdfId}`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CS_Form_${pdfId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      alert("Failed to download PDF");
    }
  } catch (error) {
    console.error("Error downloading PDF:", error);
    alert("Error downloading PDF");
  }
};


 const handleConfirmApproval = async () => {
  console.log("🔄 handleConfirmApproval called with:", {
    actionType,
    signatureMethod,
    hasSignatureData: !!signatureData,
    hasUploadedSignature: !!uploadedSignature
  });

  try {
    // Validate rejection reason if rejecting
    if (actionType === "reject") {
      if (!rejectionReason && !actionRemarks.trim()) {
        alert("Please select or specify a reason for rejection");
        return;
      }
      
      if (rejectionReason === "Other (specify below)" && !customRejectionReason.trim()) {
        alert("Please specify the reason for rejection");
        return;
      }
    }

    // Check which signature method is being used
    if (signatureMethod === "upload") {
      // For upload method: check if we have signature data
      if (signatureData || uploadedSignature) {
        console.log("📤 Using uploaded signature for approval");
        await completeCSFormApproval();
      } else {
        // No uploaded signature yet, show upload modal
        setShowUploadSignature(true);
      }
    } else if (signatureMethod === "e-sign") {
      // For e-signature: check if we have signature data
      if (signatureData) {
        console.log("🖋️ Using e-signature for approval");
        await completeCSFormApproval();
      } else {
        // No e-signature yet, show drawing pad
        setShowESignPad(true);
        setIsSigning(true);
      }
    } else if (signatureMethod === "traditional") {
      // For traditional: generate form first, then print
      console.log("🖨️ Using traditional signature method");
      await generateAndShowCSForm();
      // The signature choice modal will handle the printing
    } else {
      // No signature method selected yet, show choices
      console.log("❓ No signature method selected, showing choices");
      setShowSignatureChoice(true);
    }
    
  } catch (error) {
    console.error("Error confirming approval:", error);
    alert("Error processing approval: " + error.message);
  }
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

            const res = await fetch(`${API_URL}/api/leave-requests/${requestId}/reject`, {
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
        fetch(`${API_URL}/api/leave-requests`)
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

//Leave Calendar

const fetchLeaveCalendarData = async (date, view = 'month') => {
  try {
    setCalendarLoading(true);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    
    const response = await fetch(`${API_URL}/api/leave-requests/leave-calendar/month/${year}/${month}`);
    const data = await response.json();
    
    if (response.ok) {
      setLeaveCalendarData(data);
    } else {
      console.error('Error fetching leave calendar data:', data.error);
      alert('Failed to fetch leave calendar data');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error fetching leave calendar data');
  } finally {
    setCalendarLoading(false);
  }
};

// Add this useEffect to fetch calendar data when date changes
useEffect(() => {
  if (activeTab === 'calendar') {
    fetchLeaveCalendarData(selectedCalendarDate, 'month');
  }
}, [selectedCalendarDate, activeTab]);

// Add these calendar navigation functions
const goToPreviousCalendarDay = () => {
  const prev = new Date(selectedCalendarDate);
  prev.setDate(prev.getDate() - 1);
  setSelectedCalendarDate(prev);
};

const goToNextCalendarDay = () => {
  const next = new Date(selectedCalendarDate);
  next.setDate(next.getDate() + 1);
  setSelectedCalendarDate(next);
};

const goToToday = () => {
  setSelectedCalendarDate(new Date());
};

const renderCalendarDays = () => {
  const year = selectedCalendarDate.getFullYear();
  const month = selectedCalendarDate.getMonth();
  
  // Get first day of month and total days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();
  const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDay; i++) {
    days.push(<div key={`empty-${i}`} style={styles.calendarDayEmpty}></div>);
  }
  
  // Add actual days of the month
  for (let day = 1; day <= totalDays; day++) {
    const currentDate = new Date(year, month, day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // FIXED: Proper date range checking with inclusive dates
    const employeesOnLeave = leaveCalendarData.employees?.filter(employee => {
      if (!employee.leave_start || !employee.leave_end) return false;
      
      try {
        const leaveStart = new Date(employee.leave_start);
        const leaveEnd = new Date(employee.leave_end);
        
        // Normalize dates to compare only the date part (ignore time)
        const normalizedCurrent = new Date(currentDate);
        normalizedCurrent.setHours(0, 0, 0, 0);
        
        const normalizedStart = new Date(leaveStart);
        normalizedStart.setHours(0, 0, 0, 0);
        
        const normalizedEnd = new Date(leaveEnd);
        normalizedEnd.setHours(0, 0, 0, 0);
        
        // Check if current date falls within the leave period (inclusive)
        return normalizedCurrent >= normalizedStart && normalizedCurrent <= normalizedEnd;
      } catch (error) {
        console.error('Error parsing dates for employee:', employee.employee_name, error);
        return false;
      }
    }) || [];
    
    // Debug logging for specific dates
    if (day === 2 && employeesOnLeave.length > 0) {
      console.log(`🔍 DEBUG December 2nd - Employees on leave:`, employeesOnLeave.map(e => ({
        name: e.employee_name,
        leave_type: e.leave_type,
        start: e.leave_start,
        end: e.leave_end,
        currentDate: dateStr
      })));
    }
    
    days.push(
      <div 
        key={day} 
        style={{
          ...styles.calendarDay,
          ...(isToday(currentDate) ? styles.calendarDayToday : {}),
          ...(employeesOnLeave.length > 0 ? styles.calendarDayWithLeave : {})
        }}
        title={employeesOnLeave.length > 0 ? 
          `${employeesOnLeave.length} employee(s) on leave:\n${employeesOnLeave.map(e => 
            `${e.employee_name} - ${e.leave_type}\n(${formatDisplayDate(e.leave_start)} to ${formatDisplayDate(e.leave_end)})`
          ).join('\n')}` : 
          `No leaves on ${currentDate.toLocaleDateString()}`
        }
      >
        <div style={styles.calendarDayNumber}>{day}</div>
        
        {/* Leave indicators */}
        {employeesOnLeave.length > 0 && (
          <div style={styles.leaveIndicators}>
            {employeesOnLeave.slice(0, 3).map((employee, index) => (
              <div 
                key={index}
                style={{
                  ...styles.leaveIndicator,
                  backgroundColor: getLeaveColor(employee.leave_type)
                }}
                title={`${employee.employee_name} - ${employee.leave_type} (${formatDisplayDate(employee.leave_start)} to ${formatDisplayDate(employee.leave_end)})`}
              >
                {getLeaveAbbreviation(employee.leave_type)}
              </div>
            ))}
            {employeesOnLeave.length > 3 && (
              <div style={styles.moreLeavesIndicator}>
                +{employeesOnLeave.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  
  return days;
};

// Helper function to format dates for display
const formatDisplayDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
};

// Helper function to check if a date is today
const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

// Helper function to get leave color
const getLeaveColor = (leaveType) => {
  switch (leaveType) {
    case 'Sick Leave': return '#f44336';
    case 'Vacation Leave': return '#3f51b5';
    case 'Maternity Leave': return '#ff9800';
    case 'Paternity Leave': return '#8bc34a';
    case 'Solo Parent Leave': return '#e91e63';
    case 'Emergency Leave': return '#ffc107';
    case 'Bereavement Leave': return '#757575';
    default: return '#4caf50';
  }
};

// Helper function to get leave abbreviation
const getLeaveAbbreviation = (leaveType) => {
  switch (leaveType) {
    case 'Sick Leave': return 'SL';
    case 'Vacation Leave': return 'VL';
    case 'Maternity Leave': return 'ML';
    case 'Paternity Leave': return 'PL';
    case 'Solo Parent Leave': return 'SPL';
    case 'Emergency Leave': return 'EL';
    case 'Bereavement Leave': return 'BL';
    default: return leaveType.substring(0, 2).toUpperCase();
  }
};


  return (
    <div style={styles.dashboardContainer}>
   <div className="mobile-header">
      <button 
        className="hamburger"
        onClick={() => setIsSidebarOpen(true)}
      >
        <FontAwesomeIcon icon={faBars} />
      </button>
      <img src={require('./images/logo_ez.png')} alt="logo" className="mobile-logo" />
      <div className="mobile-header-right">
        <div className="notification-badge-container" style={{position: 'relative'}}>
          <FontAwesomeIcon icon={faBell} className="mobile-icon-bell" />
          {/* Add notification badge if needed */}
        </div>
        <div className="mobile-profile">
          {/* Add profile image if needed */}
        </div>
      </div>
    </div>

    {/* Mobile Sidebar Overlay */}
    {isSidebarOpen && (
      <div className="mobile-overlay" onClick={() => setIsSidebarOpen(false)}></div>
    )}

    {/* Responsive Sidebar */}
    <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={styles.sidebar}>
      <div className="sidebar-header">
        <button 
          className="sidebar-close-btn"
          onClick={() => setIsSidebarOpen(false)}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <img 
          className='logo-sidebar' 
          src={require('./images/logo_ez.png')} 
          alt="logo" 
        />
      </div>

      <img 
        src={require('./images/logo_ez.png')} 
        alt="logo" 
        style={styles.logo} 
        className='logo-desktop'
      />

      <ul className='sidebar-menu-link' style={styles.sidebarList}>
        {allowedMenus.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <li
              key={item.name}
              style={{
                ...(isActive ? styles.btnActive : {}),
              }}
            >
              <Link
                style={{
                  ...styles.sb,
                  ...(isActive ? styles.btnActive : {}),
                }}
                to={item.to}
                onClick={() => setIsSidebarOpen(false)}
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
              setIsSidebarOpen(false);
            }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} style={styles.icon} /> Logout
          </Link>
        </li>
      </ul>
    </div>

    {/* Desktop Header */}
    <div className="desktop-header" style={styles.header}>
      <input type="text" placeholder="Search..." style={styles.search} />
      
      <div style={styles.headerRight}>
        <div className="notification-badge-container" style={{position: 'relative'}}>
          <FontAwesomeIcon icon={faBell} style={styles.iconBell} />
        </div>
        
        {/* Add profile container if needed */}
      </div>
    </div>

        

        <div className="content" style={styles.content}>

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

{/* NEW: Overlapping Leaves Warning Modal */}
{showOverlapModal && overlapCheckResult && (
  <div style={styles.modalOverlay}>
    <div style={styles.overlapWarningModal}>
      <div style={styles.warningHeader}>
        <FontAwesomeIcon icon={faExclamationTriangle} style={styles.warningIcon} />
        <h3 style={styles.warningTitle}>Overlapping Leaves Warning</h3>
      </div>
      
      <div style={styles.warningContent}>
        <p style={styles.warningText}>
          Approving this leave request would violate business rules:
        </p>
        
        <div style={styles.violationSummary}>
          <p style={styles.summaryText}>
            <strong>Total violations:</strong> {overlapCheckResult.violations?.length || 0}
          </p>
          <p style={styles.summaryText}>
            <strong>Can proceed:</strong> {overlapCheckResult.canProceed ? 'Yes' : 'No'}
          </p>
        </div>
        
        {overlapCheckResult.violations && overlapCheckResult.violations.length > 0 && (
          <div style={styles.violationsList}>
            <h4 style={styles.violationsTitle}>Violations:</h4>
            {overlapCheckResult.violations.map((violation, index) => (
              <div key={index} style={styles.violationItem}>
                <FontAwesomeIcon icon={faWarning} style={styles.violationIcon} />
                <div style={styles.violationDetails}>
                  <p style={styles.violationDate}>
                    <strong>Date:</strong> {new Date(violation.date).toLocaleDateString()}
                    {violation.is_holiday && <span style={styles.holidayBadge}> Holiday</span>}
                  </p>
                  <p style={styles.violationInfo}>
                    <strong>Current on leave:</strong> {violation.current_on_leave} | 
                    <strong> Max allowed:</strong> {violation.max_allowed}
                  </p>
                  <p style={styles.violationMessage}>
                    {violation.department}: Would exceed limit ({violation.current_on_leave}/{violation.max_allowed})
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div style={styles.businessRules}>
          <h4 style={styles.rulesTitle}>Business Rules:</h4>
          <ul style={styles.rulesList}>
            <li>Regular days: Maximum 3 employees from same department can be on leave</li>
            <li>Holidays (Christmas season): Maximum 50% of department employees can be on leave</li>
            <li>This check is performed at Office Head approval stage only</li>
          </ul>
        </div>
      </div>
      
      <div style={styles.overlapActions}>
        <button
          style={styles.cancelOverlapBtn}
          onClick={() => {
            setShowOverlapModal(false);
            setOverlapCheckResult(null);
            setForceApprove(false);
          }}
        >
          Cancel Approval
        </button>
        <button
          style={styles.forceApproveBtn}
          onClick={() => {
            setForceApprove(true);
            handleForceApprove();
          }}
        >
          Force Approve Anyway
        </button>
        <button
          style={styles.proceedBtn}
          onClick={handleProceedApproval}
        >
          Proceed to CS Form
        </button>
      </div>
      
      <div style={styles.overlapNote}>
        <p style={styles.noteText}>
          <strong>Note:</strong> Force approval bypasses overlapping leave restrictions. 
          Use only when absolutely necessary.
        </p>
      </div>
    </div>
  </div>
)}

{/* Loading Modal for Overlap Check */}
{overlapCheckLoading && (
  <div style={styles.modalOverlay}>
    <div style={styles.loadingModal}>
      <div style={styles.loadingSpinner}></div>
      <h3 style={styles.loadingTitle}>Checking for Overlapping Leaves</h3>
      <p style={styles.loadingText}>Please wait while we verify business rules...</p>
    </div>
  </div>
)}

            <div className="tabContainer" style={styles.tabContainer}>
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
            <div className='header1' style={styles.header1}>
                <h3>Overview</h3>
                <div className='line' style={styles.line}></div>

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

                <div className='summaryCards' style={styles.summaryCards}>
                    <div style={styles.card}>
                        <div style={styles.cardContent}>
                            <div style={styles.cardData}>
                                <div style={styles.data1}>
                                <p className='card-title' style={styles.txtlabel}>Total Requests</p>
                                <p className='card-value' style={styles.txtData}>{filteredRecords.length}</p>
                            </div>
                        </div>
                        </div>
                    </div>

                    <div style={styles.card1}>
                        <div style={styles.cardContent}>
                            <div style={styles.cardData}>
                                <div style={styles.data1}>
                                    <p className='card-title' style={styles.txtlabel}>Approved Leaves</p>
                                    <p className='card-value' style={styles.txtData}>{filteredRecords.filter(l => l.status === 'Approved').length}</p>
                                </div>
                        </div>
                        </div>
                    </div>

                    <div style={styles.card2}>
                        <div style={styles.cardContent}>
                            <div style={styles.cardData}>

                                <div style={styles.data1}>
                                    <p className='card-title' style={styles.txtlabel}>Pending Leaves</p>
                                    <p className='card-value' style={styles.txtData}>{filteredRecords.filter(l => l.status === 'Pending').length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                     <div style={styles.card3}>
                        <div style={styles.cardContent}>
                            <div style={styles.cardData}>
                                <div style={styles.data1}>
                                    <p className='card-title' style={styles.txtlabel}>Rejected Leaves</p>
                                    <p className='card-value' style={styles.txtData}>{filteredRecords.filter(l => l.status === 'Rejected').length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            <div className='inputs' style={styles.inputs}>

                <div className='row1' style={styles.row1}>
                    <div style={styles.firstRow}>
                        <FontAwesomeIcon icon={faSearch} style={styles.iconSearch}/>
                        <input className='input1' style={styles.input1} placeholder='Search Employee'/>
                    </div>

                    <div className='firstRow' style={styles.firstRow}>
                        <select className='filter' style={styles.filter}>
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
                
                <div className='row2' style={styles.row2}>
                    <button className='btn1' style={styles.btn1}>
                        <FontAwesomeIcon icon={faUpload} style={styles.iconBtn}/>
                        Export
                    </button>
                    <button onClick={handlePrint} className='btn2' style={styles.btn2}>
                        <FontAwesomeIcon icon={faPrint} style={styles.iconBtn1}/>
                        Print
                    </button>
                    <button onClick={handleRefresh} className='btn3' style={styles.btn3}>
                        <FontAwesomeIcon icon={faRefresh} style={styles.iconBtn1}/>
                        Refresh
                    </button>
                </div>
            </div>
        

            <div className='tableCon' style={styles.tableCon}>
                <table className='table' style={styles.table}>
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
                <div className='leaveRequests' style={styles.leaveRequests}>
                    {/* HEADER WITH SEARCH AND FILTERS */}
                    <div className='requestsHeader' style={styles.requestsHeader}>
                    <div style={styles.headerTitle}>
                        <h2 style={styles.requestsTitle}>Leave Requests</h2>
                        <p style={styles.requestsSubtitle}>Review and manage employee leave applications</p>
                    </div>
                    <div className='headerControls' style={styles.headerControls}>
                        <div style={styles.searchBox}>
                            <FontAwesomeIcon icon={faSearch} style={styles.searchIcon} />
                            <input 
                                type="text" 
                                placeholder="Search requests..." 
                                style={styles.searchInput}
                                value={searchQuery}
                                onChange={handleSearch}
                                className='searchInput'
                            />
                        </div>
                        <select 
                            style={styles.statusFilter}
                            value={statusFilter}
                            onChange={handleStatusFilter}
                            className='statusFilter'
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
                            className='clearFilterBtn'
                        >
                            Clear Filters
                        </button>
                    </div>
                    </div>

                    {/* MAIN CONTENT */}
                    <div className='requestsContent' style={styles.requestsContent}>
                    {/* LEFT TABLE - IMPROVED DESIGN */}
                    <div className='leftSection' style={styles.leftSection}>
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

                        <div className='tableContainer' style={styles.tableContainer}>
                        <table className='leaveRequestsTable' style={styles.leaveRequestsTable}>
                            <thead style={styles.leaveRequeststhead}>
                            <tr>
                                <th className='leaveRequestsColumn' style={styles.leaveRequestsColumn}>Employee</th>
                                <th className='leaveRequestsColumn' style={styles.leaveRequestsColumn}>Leave Type</th>
                                <th className='leaveRequestsColumn' style={styles.leaveRequestsColumn}>Duration</th>
                                <th className='leaveRequestsColumn' style={styles.leaveRequestsColumn}>Status</th>
                                <th className='leaveRequestsColumn' style={styles.leaveRequestsColumn}>Date Filed</th>
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
                                    <td className='leaveRequestsRows' style={styles.leaveRequestsRows}>
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
                                    <td className='leaveRequestsRows' style={styles.leaveRequestsRows}>
                                    <span style={styles.leaveTypeTag}>
                                        {req.leave_type}
                                    </span>
                                    </td>
                                    <td className='leaveRequestsRows' style={styles.leaveRequestsRows}>
                                    <div style={styles.durationCell}>
                                        <div style={styles.durationDates}>
                                        {req.inclusive_date_start} - {req.inclusive_date_end}
                                        </div>
                                        <div style={styles.durationDays}>
                                        {req.number_of_days} day{req.number_of_days > 1 ? 's' : ''}
                                        </div>
                                    </div>
                                    </td>
                                    <td className='leaveRequestsRows' style={styles.leaveRequestsRows}>
                                    <span style={{
                                        ...styles.statusBadge,
                                        ...(req.status === 'Approved' ? styles.statusApproved : 
                                            req.status === 'Rejected' ? styles.statusRejected : 
                                            styles.statusPending)
                                    }}>
                                        {req.status}
                                    </span>
                                    </td>
                                    <td className='leaveRequestsRows' style={styles.leaveRequestsRows}>
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
                    <div className="rightSection" style={styles.rightSection}>
                        {selectedRequest ? (
                        <>
                            {/* EMPLOYEE HEADER */}
                            <div className='employeeHeader' style={styles.employeeHeader}>
                            <div className='employeeCard' style={styles.employeeCard}>
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
                            
                            <div className='detailsGrid' style={styles.detailsGrid}>
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
                                <div className='approvalSteps' style={styles.approvalSteps}>
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
                            {/* Check if head has rejected - if so, don't show action buttons for HR/Mayor */}
                            {selectedRequest.office_head_status !== "Rejected" ? (
                              (userRole === "office head" && 
                              (!selectedRequest.office_head_status || selectedRequest.office_head_status === "Pending")) ||
                              (userRole === "admin" && 
                              selectedRequest.office_head_status === "Approved" && 
                              (!selectedRequest.hr_status || selectedRequest.hr_status === "Pending")) ||
                              (userRole === "mayor" && 
                              selectedRequest.hr_status === "Approved" && 
                              (!selectedRequest.mayor_status || selectedRequest.mayor_status === "Pending")) ? (
                                <div className='actionButtons' style={styles.actionButtons}>
                                  <button
                                    style={styles.approveBtn}
                                    className='approveBtn'
                                    onClick={() => {
                                      setActionType("approve");
                                      setActionRemarks("Approved via dashboard");
                                      // For office head, check overlapping leaves before proceeding
                                      if (userRole === "office head") {
                                        handleApprove(selectedRequest.id, "Approved via dashboard");
                                      } else {
                                        // For mayor and admin, proceed directly
                                        setDaysWithPay(selectedRequest.number_of_days || 0);
                                        generationTriggerRef.current = true;
                                        setIsGeneratingCSForm(true);
                                      }
                                    }}
                                    disabled={overlapCheckLoading}
                                  >
                                    <FontAwesomeIcon icon={faCheckCircle} style={styles.iconApprove} />
                                    {overlapCheckLoading ? "Checking..." : 
                                     (userRole === "office head" ? "Approve (Check Overlaps)" : 
                                      (userRole === "mayor" || userRole === "admin") ? "Approve with CS Form" : 
                                      "Approve Request")}
                                  </button>
                                  <button
                                    style={styles.rejectBtn}
                                    className='rejectBtn'
                                    onClick={() => {
                                      setActionType("reject");
                                      setActionRemarks("Pending rejection reason...");
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
                              )
                            ) : (
                              // Show rejection message when head has rejected
                              <div style={styles.finalStatus}>
                                <div style={styles.statusRejected}>
                                  Rejected by Office Head
                                </div>
                                <p style={styles.finalStatusText}>
                                  This request was rejected by the Office Head and cannot be processed further.
                                </p>
                                {selectedRequest.remarks && (
                                  <p style={styles.remarksText}>
                                    <strong>Rejection Reason:</strong> {selectedRequest.remarks}
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
                        {selectedRequest?.cs_form_generated && (
                          <button
                            style={styles.viewPDFsBtn}
                            onClick={() => viewSavedPDFs(selectedRequest?.id)}
                            title="View saved PDF forms"
                          >
                            <FontAwesomeIcon icon={faFilePdf} />
                            View Saved PDFs
                          </button>
                        )}
                    </div>
                    </div>



{showSavedPDFsModal && (
  <div style={styles.modalOverlay}>
    <div style={styles.savedPDFsModal}>
      <h3 style={styles.modalTitle}>Saved CS Forms</h3>
      
      <div style={styles.pdfsList}>
        {savedPDFs.length > 0 ? (
          savedPDFs.map((pdf) => (
            <div key={pdf.id} style={styles.pdfItem}>
              <div style={styles.pdfInfo}>
                <FontAwesomeIcon icon={faFilePdf} style={styles.pdfIcon} />
                <div>
                  <div style={styles.pdfName}>{pdf.pdf_filename}</div>
                  <div style={styles.pdfMeta}>
                    Generated by {pdf.generated_by} on{" "}
                    {new Date(pdf.generated_at).toLocaleString()}
                  </div>
                  {pdf.signature_method && (
                    <div style={styles.pdfMeta}>
                      Signed via: {pdf.signature_method}
                    </div>
                  )}
                </div>
              </div>
              <div style={styles.pdfActions}>
                <button
                  style={styles.downloadBtn}
                  onClick={() => downloadPDF(pdf.id)}
                >
                  <FontAwesomeIcon icon={faDownload} />
                  Download
                </button>
                <button
                  style={styles.viewBtn}
                  onClick={() => {
                    // Open PDF in new window
                    const url = `${API_URL}/api/download-pdf/${pdf.id}`;
                    window.open(url, '_blank');
                  }}
                >
                  <FontAwesomeIcon icon={faEye} />
                  View
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={styles.noPDFs}>
            <FontAwesomeIcon icon={faFilePdf} size="3x" />
            <p>No saved PDFs found</p>
          </div>
        )}
      </div>

      <div style={styles.modalActions}>
        <button
          style={styles.cancelBtn}
          onClick={() => setShowSavedPDFsModal(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

                    {/* CS FORM MODAL */}
{showActualCSForm && csFormData && selectedRequest && (
  <div style={styles.modalOverlay}>
    <div style={styles.actualFormModal}>
      <h3 style={styles.modalTitle}>CS Form No. 6 - Application for Leave</h3>
      
      <div style={styles.formModalLayout}>
        {/* LEFT SIDE - REJECTION/REASON SECTION */}
        <div style={styles.leftControlPanel}>
          <div style={styles.controlSection}>
            <h4 style={styles.controlSectionTitle}>
              {actionType === "approve" ? "Approval Details" : "Disapproval Details"}
            </h4>
            
            {actionType === "reject" && (
              <div style={styles.rejectionSection}>
                <h5 style={styles.rejectionTitle}>Select Reason for Disapproval:</h5>
                
                {/* Button choices for rejection reasons */}
                <div style={styles.rejectionButtonGrid}>
                  {rejectionReasons.map((reason, index) => (
                    <button
                      key={index}
                      style={{
                        ...styles.rejectionButton,
                        ...(rejectionReason === reason ? styles.rejectionButtonSelected : {})
                      }}
                      onClick={() => {
                        handleRejectionReasonChange(reason);
                        if (reason !== "Other (specify below)") {
                          setIsTyping(true);
                          setTimeout(() => {
                            generateAndShowCSForm();
                          }, 100);
                        }
                      }}
                    >
                      <div style={styles.rejectionButtonContent}>
                        <div style={styles.rejectionButtonText}>{reason}</div>
                        {rejectionReason === reason && (
                          <FontAwesomeIcon 
                            icon={faCheckCircle} 
                            style={styles.rejectionButtonIcon}
                          />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Custom reason input */}
                {showCustomReasonInput && (
                  <div style={styles.customReasonSection}>
                    <label style={styles.customReasonLabel}>Specify reason:</label>
                    <textarea
                      style={styles.customReasonTextarea}
                      value={customRejectionReason}
                      onChange={(e) => {
                        setCustomRejectionReason(e.target.value);
                        setActionRemarks(e.target.value);
                        setIsTyping(true);
                        clearTimeout(formGenerationTimeout);
                        const timeout = setTimeout(() => {
                          generateAndShowCSForm();
                        }, 500);
                        setFormGenerationTimeout(timeout);
                      }}
                      placeholder="Enter specific reason for rejection..."
                      rows={3}
                    />
                    {!customRejectionReason.trim() && (
                      <p style={styles.validationError}>
                        Please provide a reason for rejection
                      </p>
                    )}
                  </div>
                )}
                
                {/* Selected reason display */}
                {rejectionReason && !showCustomReasonInput && (
                  <div style={styles.selectedReasonDisplay}>
                    <div style={styles.selectedReasonLabel}>Selected Reason:</div>
                    <div style={styles.selectedReasonText}>{rejectionReason}</div>
                  </div>
                )}
              </div>
            )}
            
            {actionType === "approve" && (
              <div style={styles.daysWithPaySection}>
                <h5 style={styles.controlSectionTitle}>Days with Pay:</h5>
                <div style={styles.daysInputContainer}>
                  <input
                    type="number"
                    min="0"
                    max={selectedRequest.number_of_days || 30}
                    value={daysWithPay}
                    onChange={(e) => {
                      const value = Math.max(0, parseInt(e.target.value) || 0);
                      setDaysWithPay(value);
                      setIsTyping(true);
                      clearTimeout(formGenerationTimeout);
                      const timeout = setTimeout(() => {
                        generateAndShowCSForm();
                      }, 500);
                      setFormGenerationTimeout(timeout);
                    }}
                    style={styles.daysInput}
                  />
                  <span style={styles.daysNote}>
                    (Maximum: {selectedRequest.number_of_days || "N/A"} days requested)
                  </span>
                </div>
              </div>
            )}
            
            
          </div>
        </div>

        {/* RIGHT SIDE - FORM PREVIEW */}
        <div style={styles.rightFormPreview}>
          <div style={styles.formPreviewHeader}>
            <h4 style={styles.previewTitle}>Form Preview</h4>
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
          </div>
          
          <div style={styles.formPreviewContainer}>
            {isTyping ? (
              <div style={styles.typingIndicator}>
                <p>Updating form preview...</p>
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
        </div>
      </div>

      {/* ACTION BUTTONS AT BOTTOM */}
      <div style={styles.formActions}>
        <button
          style={styles.cancelBtn}
          onClick={() => {
            setShowActualCSForm(false);
            setCsFormData(null);
            setActionType(null);
            setActionRemarks("");
            setRejectionReason("");
            setCustomRejectionReason("");
            setShowCustomReasonInput(false);
            setRealTimeFormData({
              action_type: "",
              action_remarks: "",
              days_with_pay: 0
            });
            if (formGenerationTimeout) {
              clearTimeout(formGenerationTimeout);
            }
          }}
        >
          Cancel
        </button>
        
        <button
          style={actionType === "approve" ? styles.confirmApproveBtn : styles.confirmRejectBtn}
          onClick={() => {
            if (actionType === "reject") {
              if (!rejectionReason && !actionRemarks.trim()) {
                alert("Please select or specify a reason for rejection");
                return;
              }
              
              if (rejectionReason === "Other (specify below)" && !customRejectionReason.trim()) {
                alert("Please specify the reason for rejection");
                return;
              }
            }
            handleConfirmApproval();
          }}
          disabled={actionType === "reject" && !actionRemarks.trim()}
        >
          {actionType === "approve" ? "Approve Request" : "Reject Request"}
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
            onClick={() => {
              setSignatureMethod("e-sign");
              setShowSignatureChoice(false);
              setShowESignPad(true);
              setIsSigning(true);
            }}
            disabled={isSigning}
          >
            <FontAwesomeIcon icon={faSignature} />
            {isSigning ? " Signing..." : " Draw Signature"}
            <span style={styles.methodDescription}>Draw your signature using mouse or touchpad</span>
          </button>
          
          {/* ADD THIS NEW UPLOAD OPTION */}
          <button
            style={styles.uploadSignBtn}
            onClick={() => {
              setSignatureMethod("upload");
              setShowSignatureChoice(false);
              setShowUploadSignature(true);
            }}
          >
            <FontAwesomeIcon icon={faUpload} />
            Upload Signature
            <span style={styles.methodDescription}>Upload an image of your signature</span>
          </button>
          
          <button
            style={styles.traditionalSignBtn}
            onClick={() => {
              setSignatureMethod("traditional");
              setShowSignatureChoice(false);
              generateAndShowCSForm();
            }}
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


{/* E-SIGNATURE PAD MODAL */}
{showESignPad && (
  <div style={styles.modalOverlay}>
    <div style={styles.eSignModal}>
      <h3 style={styles.modalTitle}>Provide Your E-Signature</h3>
      
      <div style={styles.signatureInstructions}>
        <p>Draw your signature in the box below using your mouse or touchpad.</p>
      </div>

      <div style={styles.signaturePadContainer}>
        <SignatureCanvas
          ref={sigCanvasRef}
          penColor="black"
          canvasProps={{
            width: 500,
            height: 200,
            className: 'signature-canvas',
            style: {
              border: '2px solid #ccc',
              borderRadius: '8px',
              backgroundColor: '#fff'
            }
          }}
          onEnd={handleSignatureDraw}
        />
      </div>

      <div style={styles.signatureActions}>
        <button
          style={styles.clearSignatureBtn}
          onClick={handleClearSignature}
        >
          <FontAwesomeIcon icon={faEraser} />
          Clear Signature
        </button>
        
        <div style={styles.signatureMainActions}>
          <button
            style={styles.cancelBtn}
            onClick={() => {
              setShowESignPad(false);
              setIsSigning(false);
            }}
          >
            Cancel
          </button>
          
          <button
            style={styles.saveSignatureBtn}
            onClick={handleSaveSignature}
            disabled={isSignatureEmpty}
          >
            <FontAwesomeIcon icon={faCheckCircle} />
            Save Signature & Approve
          </button>
        </div>
      </div>

      {signatureImage && (
        <div style={styles.signaturePreview}>
          <h4>Signature Preview:</h4>
          <img 
            src={signatureImage} 
            alt="Your signature" 
            style={styles.previewImage}
          />
        </div>
      )}
    </div>
  </div>
)}

{/* Upload Signature Modal */}
{showUploadSignature && (
  <div style={styles.modalOverlay}>
    <div style={styles.uploadSignatureModal}>
      <h3 style={styles.modalTitle}>Upload Signature</h3>
      
      <div style={styles.uploadInstructions}>
        <p>Upload a clear image of your signature. We'll automatically remove the background.</p>
        <ul style={styles.instructionsList}>
          <li>Use a white background for best results</li>
          <li>Ensure signature is clear and dark</li>
          <li>PNG or JPG formats recommended</li>
        </ul>
      </div>

      <div style={styles.uploadSection}>
        <input
          type="file"
          accept=".png,.jpg,.jpeg"
          onChange={handleSignatureUpload}
          style={styles.fileInput}
          id="signature-upload"
          disabled={isUploadingSignature}
        />
        <label htmlFor="signature-upload" style={styles.uploadLabel}>
          <FontAwesomeIcon icon={faUpload} />
          {isUploadingSignature ? 'Processing...' : 'Choose Signature Image'}
        </label>
        
        {uploadedSignaturePreview && (
          <div style={styles.previewSection}>
            <h4>Preview (Background Removed):</h4>
            <div style={styles.previewContainer}>
              <img 
                src={uploadedSignaturePreview} 
                alt="Signature preview" 
                style={styles.signaturePreviewImg}
              />
            </div>
          </div>
        )}
      </div>

      <div style={styles.uploadActions}>
        <button
          style={styles.cancelBtn}
          onClick={() => {
            setShowUploadSignature(false);
            setUploadedSignature(null);
            setUploadedSignaturePreview(null);
          }}
        >
          Cancel
        </button>
        
        <button
          style={styles.useUploadedBtn}
          onClick={handleUseUploadedSignature}
          disabled={!uploadedSignature || isUploadingSignature}
        >
          <FontAwesomeIcon icon={faCheckCircle} />
          Use This Signature
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
      {/* Calendar Header */}
      <div style={styles.calendarHeader}>
        <div style={styles.calendarNavigation}>
          <button style={styles.navButton} onClick={() => {
            const prevMonth = new Date(selectedCalendarDate);
            prevMonth.setMonth(prevMonth.getMonth() - 1);
            setSelectedCalendarDate(prevMonth);
          }}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          
          <h2 style={styles.calendarTitle}>
            {selectedCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          
          <button style={styles.navButton} onClick={() => {
            const nextMonth = new Date(selectedCalendarDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            setSelectedCalendarDate(nextMonth);
          }}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
          
          <button style={styles.todayButton} onClick={goToToday}>
            Today
          </button>
        </div>
        
        <div style={styles.calendarControls}>
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
      </div>

      {/* Real Calendar Grid */}
      <div style={styles.calendarGrid}>
        {/* Weekday Headers */}
        <div style={styles.weekdayHeaders}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={styles.weekdayHeader}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div style={styles.calendarDays}>
          {calendarLoading ? (
            <div style={styles.calendarLoading}>
              Loading calendar data...
            </div>
          ) : (
            renderCalendarDays()
          )}
        </div>
      </div>
    </div>

    {/* Calendar Sidebar */}
    <div style={styles.calendarBox}>
      <div style={styles.calendarLeave}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <span>Leave Types</span>
          <select style={styles.selectCalendar}>
            <option>This Month</option>
            <option>This Week</option>
          </select>
        </div>
        <div style={{ marginTop: 12 }}>
          {[
            { label: 'SL', name: 'Sick Leave', color: '#f44336', count: leaveCalendarData.employees?.filter(e => e.leave_type === 'Sick Leave').length || 0 },
            { label: 'VL', name: 'Vacation Leave', color: '#3f51b5', count: leaveCalendarData.employees?.filter(e => e.leave_type === 'Vacation Leave').length || 0 },
            { label: 'ML', name: 'Maternity Leave', color: '#ff9800', count: leaveCalendarData.employees?.filter(e => e.leave_type === 'Maternity Leave').length || 0 },
            { label: 'PL', name: 'Paternity Leave', color: '#8bc34a', count: leaveCalendarData.employees?.filter(e => e.leave_type === 'Paternity Leave').length || 0 },
            { label: 'SPL', name: 'Solo Parent Leave', color: '#e91e63', count: leaveCalendarData.employees?.filter(e => e.leave_type === 'Solo Parent Leave').length || 0 },
          ].map((type) => (
            <div key={type.label} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 20, height: 20, backgroundColor: type.color, borderRadius: 4 }} />
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{type.label} - {type.name}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 'bold', color: type.color }}>
                  {type.count}
                </div>
              </div>
              <div style={{ height: 6, backgroundColor: '#eee', borderRadius: 4, marginTop: 4 }}>
                <div style={{
                  width: `${Math.min((type.count / Math.max(leaveCalendarData.employees?.length || 1, 1)) * 100, 100)}%`,
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
          <span>Today's Leave Summary</span>
        </div>
        <div style={{ marginTop: 12 }}>
          {leaveCalendarData.employees && leaveCalendarData.employees.length > 0 ? (
            leaveCalendarData.employees.slice(0, 3).map((employee) => (
              <div key={employee.id} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <img 
                  src={employee.profile_picture || "https://via.placeholder.com/30"} 
                  alt="avatar" 
                  style={{ width: '30px', height: '30px', borderRadius: '50%' }} 
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{employee.employee_name}</div>
                  <div style={{ fontSize: 12, color: '#777' }}>{employee.department}</div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>
                    <span style={{ 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      backgroundColor: employee.leave_type === 'Sick Leave' ? '#f4433620' : 
                                      employee.leave_type === 'Vacation Leave' ? '#3f51b520' : '#4caf5020',
                      color: employee.leave_type === 'Sick Leave' ? '#f44336' : 
                            employee.leave_type === 'Vacation Leave' ? '#3f51b5' : '#4caf50',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {employee.leave_type}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: '#666', fontSize: '14px', padding: '20px 0' }}>
              No employees on leave today
            </div>
          )}
          {leaveCalendarData.employees && leaveCalendarData.employees.length > 3 && (
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginTop: '8px' }}>
              +{leaveCalendarData.employees.length - 3} more employees on leave
            </div>
          )}
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

// E-Signature Modal Styles
eSignModal: {
  backgroundColor: '#fff',
  padding: '30px',
  borderRadius: '12px',
  width: '600px',
  maxHeight: '80vh',
  overflowY: 'auto',
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
},
signatureInstructions: {
  textAlign: 'center',
  marginBottom: '20px',
  color: '#666',
},
signaturePadContainer: {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '20px',
},
signatureActions: {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
},
clearSignatureBtn: {
  padding: '10px 16px',
  backgroundColor: '#ffc107',
  color: '#212529',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  alignSelf: 'flex-start',
},
signatureMainActions: {
  display: 'flex',
  gap: '15px',
  justifyContent: 'flex-end',
},
saveSignatureBtn: {
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
signaturePreview: {
  marginTop: '20px',
  padding: '15px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  border: '1px solid #dee2e6',
},
previewImage: {
  maxWidth: '200px',
  maxHeight: '100px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  marginTop: '10px',
},
todayButton: {
  backgroundColor: '#5ab049ff',
  color: '#fefcf5',
  border: 'none',
  borderRadius: '5px',
  padding: '5px 10px',
  cursor: 'pointer',
  marginLeft: '10px',
  fontSize: '12px',
},

// Add these new styles to your styles object
calendarHeader: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  padding: '20px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
},
calendarNavigation: {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
},
calendarTitle: {
  fontSize: '24px',
  fontWeight: '600',
  color: '#1F2937',
  margin: 0,
  minWidth: '250px',
  textAlign: 'center',
},
calendarControls: {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
},
calendarGrid: {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  overflow: 'hidden',
},
weekdayHeaders: {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  backgroundColor: '#F9FAFB',
  borderBottom: '1px solid #E5E7EB',
},
weekdayHeader: {
  padding: '15px 10px',
  textAlign: 'center',
  fontWeight: '600',
  color: '#374151',
  fontSize: '14px',
  textTransform: 'uppercase',
},
calendarDays: {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: '1px',
  backgroundColor: '#E5E7EB',
},
calendarDay: {
  backgroundColor: '#ffffff',
  minHeight: '100px',
  padding: '8px',
  border: '1px solid #E5E7EB',
  position: 'relative',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
},
calendarDayEmpty: {
  backgroundColor: '#F9FAFB',
  minHeight: '100px',
  border: '1px solid #E5E7EB',
},
calendarDayToday: {
  backgroundColor: '#e8f5e8',
  border: '2px solid #5ab049',
},
calendarDayWithLeave: {
  backgroundColor: '#fff8e1',
},
calendarDayNumber: {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1F2937',
  marginBottom: '5px',
},
leaveIndicators: {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
},
leaveIndicator: {
  fontSize: '10px',
  fontWeight: '600',
  color: 'white',
  padding: '2px 4px',
  borderRadius: '3px',
  textAlign: 'center',
  cursor: 'pointer',
},
moreLeavesIndicator: {
  fontSize: '9px',
  color: '#666',
  textAlign: 'center',
  fontStyle: 'italic',
},
calendarLoading: {
  gridColumn: '1 / -1',
  textAlign: 'center',
  padding: '40px',
  color: '#666',
  fontSize: '16px',
},

remarksTextarea: {
    width: '100%',
    height: '80px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    padding: '10px',
    fontSize: '14px',
    resize: 'vertical',
    boxSizing: 'border-box',
},

// NEW STYLES FOR OVERLAPPING CHECK MODAL
overlapWarningModal: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '12px',
    width: '700px',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
},
warningHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #ffc107',
},
warningIcon: {
    fontSize: '32px',
    color: '#ffc107',
},
warningTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#856404',
    margin: 0,
},
warningContent: {
    marginBottom: '25px',
},
warningText: {
    fontSize: '16px',
    color: '#856404',
    marginBottom: '20px',
    lineHeight: '1.5',
},
violationSummary: {
    backgroundColor: '#fff3cd',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #ffeaa7',
},
summaryText: {
    fontSize: '14px',
    color: '#856404',
    margin: '5px 0',
},
violationsList: {
    marginBottom: '25px',
},
violationsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '15px',
},
violationItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    marginBottom: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: '4px solid #ffc107',
    border: '1px solid #dee2e6',
},
violationIcon: {
    fontSize: '18px',
    color: '#ffc107',
    marginTop: '3px',
},
violationDetails: {
    flex: 1,
},
violationDate: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 5px 0',
},
holidayBadge: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    marginLeft: '8px',
},
violationInfo: {
    fontSize: '13px',
    color: '#666',
    margin: '0 0 5px 0',
},
violationMessage: {
    fontSize: '13px',
    color: '#856404',
    margin: 0,
    fontStyle: 'italic',
},
businessRules: {
    backgroundColor: '#e8f5e8',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '20px',
    border: '1px solid #c3e6cb',
},
rulesTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#155724',
    marginBottom: '10px',
},
rulesList: {
    margin: 0,
    paddingLeft: '20px',
},
li: {
    fontSize: '14px',
    color: '#155724',
    marginBottom: '8px',
    lineHeight: '1.4',
},
overlapActions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginTop: '25px',
},
cancelOverlapBtn: {
    padding: '12px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
},
forceApproveBtn: {
    padding: '12px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
},
proceedBtn: {
    padding: '12px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
},
overlapNote: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
},
noteText: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
    fontStyle: 'italic',
    textAlign: 'center',
},

// Add these styles to your styles object
rejectionSection: {
  marginBottom: '20px',
  padding: '15px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  border: '1px solid #dee2e6',
},
rejectionTitle: {
  fontSize: '16px',
  fontWeight: '600',
  color: '#dc3545',
  marginBottom: '15px',
},
rejectionOptions: {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginBottom: '15px',
},
rejectionOption: {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
},
rejectionRadio: {
  marginTop: '3px',
},
rejectionLabel: {
  fontSize: '14px',
  color: '#333',
  cursor: 'pointer',
  flex: 1,
},
customReasonSection: {
  marginTop: '15px',
  padding: '15px',
  backgroundColor: '#fff3cd',
  borderRadius: '6px',
  border: '1px solid #ffeaa7',
},
customReasonLabel: {
  display: 'block',
  fontSize: '14px',
  fontWeight: '600',
  color: '#856404',
  marginBottom: '8px',
},
customReasonTextarea: {
  width: '100%',
  height: '80px',
  borderRadius: '6px',
  border: '1px solid #ffc107',
  padding: '10px',
  fontSize: '14px',
  resize: 'vertical',
  boxSizing: 'border-box',
  backgroundColor: '#fff',
},
remarksSection: {
  marginTop: '15px',
},
remarksLabel: {
  display: 'block',
  fontSize: '14px',
  fontWeight: '600',
  color: '#495057',
  marginBottom: '8px',
},
remarksTextarea: {
  width: '100%',
  height: '80px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  padding: '10px',
  fontSize: '14px',
  resize: 'vertical',
  boxSizing: 'border-box',
},
daysLabel: {
  fontSize: '14px',
  fontWeight: '600',
  color: '#333',
},

// Add these new styles to your styles object
rejectionButtonGrid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '10px',
  marginBottom: '15px',
},
rejectionButton: {
  backgroundColor: '#ffffff',
  border: '2px solid #e0e0e0',
  borderRadius: '8px',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  display: 'flex',
  alignItems: 'center',
  padding: '10px'
},
rejectionButtonSelected: {
  backgroundColor: '#e8f5e8',
  borderColor: '#28a745',
  boxShadow: '0 4px 8px rgba(40, 167, 69, 0.2)',
},
rejectionButtonContent: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
},
rejectionButtonText: {
  fontSize: '12px',
  color: '#333',
  fontWeight: '500',
  flex: 1,
  textAlign: 'left',
},
rejectionButtonIcon: {
  color: '#28a745',
  fontSize: '16px',
  marginLeft: '10px',
},
selectedReasonDisplay: {
  backgroundColor: '#f0f9ff',
  border: '1px solid #b8daff',
  borderRadius: '8px',
  padding: '15px',
  marginBottom: '15px',
},
selectedReasonLabel: {
  fontSize: '12px',
  color: '#0066cc',
  fontWeight: '600',
  marginBottom: '5px',
  textTransform: 'uppercase',
},
selectedReasonText: {
  fontSize: '14px',
  color: '#333',
  fontWeight: '500',
},

// Add these new styles
actualFormModal: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    width: '90%',
    height: '90%',
    maxWidth: '1400px', // Increased width
    maxHeight: '90vh',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
},
formModalLayout: {
    display: 'flex',
    flex: 1,
    gap: '20px',
    marginBottom: '20px',
    minHeight: 0, // Important for flex children
},
leftControlPanel: {
    flex: 1,
    minWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '20px',
    overflowY: 'auto',
    border: '1px solid #dee2e6',
},
rightFormPreview: {
    flex: 2,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, // Important for flex children
},
controlSection: {
    flex: 1,
},
controlSectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 15px 0',
    paddingBottom: '10px',
    borderBottom: '2px solid #e0e0e0',
},
formPreviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
},
previewTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    margin: 0,
},
formPreviewContainer: {
    flex: 1,
    border: '2px solid #333',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
},
formIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
},
daysInputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '20px',
},
daysInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
},
daysNote: {
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
},
rejectionSection: {
    marginBottom: '20px',
},
rejectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#dc3545',
    marginBottom: '15px',
},
rejectionButtonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '10px',
    marginBottom: '15px',
    maxHeight: '300px',
    overflowY: 'auto',
    paddingRight: '5px',
},
rejectionButton: {
    backgroundColor: '#ffffff',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
},
rejectionButtonSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#28a745',
    boxShadow: '0 4px 8px rgba(40, 167, 69, 0.2)',
},
rejectionButtonContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
},
rejectionButtonText: {
    fontSize: '13px',
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'left',
},
rejectionButtonIcon: {
    color: '#28a745',
    fontSize: '16px',
    marginLeft: '10px',
},
customReasonSection: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#ffffffff',
    borderRadius: '6px',
    border: '1px solid #e5e3dbff',
},
customReasonLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#000000ff',
    marginBottom: '8px',
},
customReasonTextarea: {
    width: '100%',
    height: '80px',
    borderRadius: '6px',
    border: '1px solid #e6e3daff',
    padding: '10px',
    fontSize: '14px',
    resize: 'vertical',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
},
selectedReasonDisplay: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #b8daff',
    borderRadius: '8px',
    padding: '15px',
    marginTop: '15px',
},
selectedReasonLabel: {
    fontSize: '12px',
    color: '#0066cc',
    fontWeight: '600',
    marginBottom: '5px',
    textTransform: 'uppercase',
},
selectedReasonText: {
    fontSize: '14px',
    color: '#333',
    fontWeight: '500',
},
remarksSection: {
    marginTop: '20px',
},
remarksLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#495057',
    marginBottom: '8px',
},
remarksTextarea: {
    width: '100%',
    height: '80px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    padding: '10px',
    fontSize: '14px',
    resize: 'vertical',
    boxSizing: 'border-box',
},
validationError: {
    color: 'red',
    fontSize: '12px',
    margin: '5px 0 0 0',
},
formActions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: '20px',
    borderTop: '1px solid #e0e0e0',
},
printFormBtn: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
},
confirmApproveBtn: {
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
},
confirmRejectBtn: {
    padding: '12px 24px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
},
cancelBtn: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
},
typingIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#666',
    fontStyle: 'italic',
    backgroundColor: '#f8f9fa',
},
generatingPreview: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#666',
    backgroundColor: '#f8f9fa',
},
loadingPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#666',
    backgroundColor: '#f8f9fa',
},

uploadSignatureModal: {
  backgroundColor: '#fff',
  padding: '30px',
  borderRadius: '12px',
  width: '500px',
  maxHeight: '80vh',
  overflowY: 'auto',
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
},
uploadInstructions: {
  marginBottom: '20px',
  color: '#666',
},
instructionsList: {
  margin: '10px 0 0 20px',
  fontSize: '14px',
  color: '#666',
},
uploadSection: {
  marginBottom: '20px',
  textAlign: 'center',
},
fileInput: {
  display: 'none',
},
uploadLabel: {
  display: 'inline-block',
  padding: '12px 24px',
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
  margin: '0 auto 20px',
  '&:hover': {
    backgroundColor: '#0056b3',
  },
},
previewSection: {
  marginTop: '20px',
  padding: '15px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  border: '1px solid #dee2e6',
},
previewContainer: {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100px',
  backgroundColor: '#fff',
  borderRadius: '4px',
  padding: '10px',
  border: '1px solid #ccc',
},
signaturePreviewImg: {
  maxWidth: '200px',
  maxHeight: '100px',
  objectFit: 'contain',
},
uploadActions: {
  display: 'flex',
  gap: '15px',
  justifyContent: 'flex-end',
  marginTop: '20px',
},
useUploadedBtn: {
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
uploadSignBtn: {
  padding: '20px',
  backgroundColor: '#6c757d',
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

// Add to your styles object
savedPDFsModal: {
  backgroundColor: '#fff',
  padding: '30px',
  borderRadius: '12px',
  width: '700px',
  maxHeight: '80vh',
  overflowY: 'auto',
  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
},
pdfsList: {
  margin: '20px 0',
  maxHeight: '400px',
  overflowY: 'auto',
},
pdfItem: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '15px',
  marginBottom: '10px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  border: '1px solid #dee2e6',
},
pdfInfo: {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  flex: 1,
},
pdfIcon: {
  fontSize: '24px',
  color: '#dc3545',
},
pdfName: {
  fontWeight: '600',
  fontSize: '14px',
  color: '#333',
  marginBottom: '4px',
},
pdfMeta: {
  fontSize: '12px',
  color: '#666',
},
pdfActions: {
  display: 'flex',
  gap: '10px',
},
downloadBtn: {
  padding: '8px 12px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
},
viewBtn: {
  padding: '8px 12px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
},
noPDFs: {
  textAlign: 'center',
  padding: '40px',
  color: '#666',
},
viewPDFsBtn: {
  padding: '10px 16px',
  backgroundColor: '#6f42c1',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '10px',
  justifyContent: 'center',
  marginBottom: '10px',
  marginLeft: '10px',
  marginRight: '10px'
},

};

export default LeaveManagement;