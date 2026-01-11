import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  faPlus,
  faEye,
  faTrash,
  faPen,
  faCircle,
  faDownload,
  faSearch,
  faTimes,
  faPenToSquare,
  faUser,
  faBars,
  faUpload,
  faFileContract,
  faClock,
  faUserShield,
  faEdit,
  faSave,
  faHistory,
  faArrowRight,
  faArrowLeft,
  faArchive,
  faRedo,
  faSignature, // Add this
  faCheck, // Add this
  faFolderOpen ,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import 'react-calendar/dist/Calendar.css';
import './dashboardCalendar.css';
import Papa from 'papaparse';
import * as XLSX from "xlsx";
import './employee-responsive.css';
import ProfileDropdown from './profileDropdown';

import * as tf from '@tensorflow/tfjs';

function Employees() {
  const [employeeRecord, setEmployeeRecords] = useState([]);
  const [filterEmploymentType, setFilterEmploymentType] = useState('');
  const location = useLocation();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [employeesToUpload, setEmployeesToUpload] = useState([]);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [employeesToEdit, setEmployeesToEdit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [view, setView] = useState(() => {
    const savedView = localStorage.getItem('employeesView');
    return savedView || 'list';
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [currentInactivePage, setCurrentInactivePage] = useState(1);
  const itemsPerPage = 8;
  const listEmployeePerPage = 10;
  const fileInputRef = React.useRef(null);
  const navigate = useNavigate();
  const [selectAll, setSelectAll] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterEmploymentStatus, setFilterEmploymentStatus] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [showUploadBalancesModal, setShowUploadBalancesModal] = useState(false);
  const [selectedBalancesFile, setSelectedBalancesFile] = useState(null);
  const [uploadingBalances, setUploadingBalances] = useState(false);
  const [uploadBalancesResult, setUploadBalancesResult] = useState(null);
  const [uploadBalancesProgress, setUploadBalancesProgress] = useState(0);

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedSignatureEmployee, setSelectedSignatureEmployee] = useState(null);
  const [employeeSignatures, setEmployeeSignatures] = useState({});
  const [newSignature, setNewSignature] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  
  
  const [newEmployee, setNewEmployee] = useState({
    first_name: '',
    last_name: '',
    email: '',
    position: '',
    department: '',
    employment_status: '',
    gender: '',
    status: 'active',
    date_hired: '',
    id_number: '',
    contact_number: '',
    civil_status: '',
    contract_start_date: '',
    contract_end_date: ''
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [role, setRole] = useState(localStorage.getItem("role") || "admin");
  const [userDepartment, setUserDepartment] = useState(localStorage.getItem("department") || "");
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [profileData, setProfileData] = useState({
    full_name: "",
    profile_picture: "",
    role: ""
  });
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [isEditingTerms, setIsEditingTerms] = useState(false);
  const [termsVersions, setTermsVersions] = useState([]);
  const [activeTermsVersion, setActiveTermsVersion] = useState(null);
  const [newTermsVersion, setNewTermsVersion] = useState('');
  
  const [attendanceTimeSettings, setAttendanceTimeSettings] = useState({});
  const [showTimeSettingsModal, setShowTimeSettingsModal] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [isLoadingTimeSettings, setIsLoadingTimeSettings] = useState(false);

  // Add state for reactivate modal
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [employeeToReactivate, setEmployeeToReactivate] = useState(null);
  
  // Add state for inactive modal
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [inactiveReason, setInactiveReason] = useState('');
  const [employeeToInactivate, setEmployeeToInactivate] = useState(null);

  // Add state for delete confirmation modal
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [employeeToDeletePermanently, setEmployeeToDeletePermanently] = useState(null);

  const [isVerifyingSignature, setIsVerifyingSignature] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [signatureCanvas, setSignatureCanvas] = useState(null);
  const canvasRef = useRef(null);

 const [isTfLoaded, setIsTfLoaded] = useState(false);
  const [signatureModel, setSignatureModel] = useState(null);
  const [predictionScore, setPredictionScore] = useState(null);
  const [tfModel, setTfModel] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  
  

  // Reasons for making employee inactive
  const inactiveReasons = [
    "Resigned",
    "Terminated",
    "End of Contract",
    "AWOL",
    "Leave of Absence",
    "Suspended",
    "Retired",
    "Other"
  ];

  // Add this function to your component
  const getMinMaxDates = () => {
    const today = new Date().toISOString().split('T')[0];
    return {
      maxDateHired: today, // Date hired cannot be in the future
      minContractEnd: newEmployee.contract_start_date || today, // End date cannot be before start date
    };
  };


  // Function to determine if contract dates should be shown
  const shouldShowContractDates = (employmentType) => {
    const fixedContractTypes = ['Temporary', 'Contractual', 'Casual', 'Job Order'];
    const cosTypes = ['COS'];
    const coterminousTypes = ['Coterminous'];
    
    const selectedType = employmentType || newEmployee.employment_status || '';
    
    // Show for fixed contract durations and coterminous
    return fixedContractTypes.includes(selectedType) || 
           cosTypes.includes(selectedType) || 
           coterminousTypes.includes(selectedType);
  };

  useEffect(() => {
    if (showTermsModal) {
      fetchTermsAndConditions();
    }
  }, [showTermsModal]);
  
  useEffect(() => {
    localStorage.setItem('employeesView', view);
  }, [view]);

  const menuItems = [
    { name: "Dashboard", icon: faTachometerAlt, to: "/dashboard" },
    { name: "Employees", icon: faUsers, to: "/employee" },
    { name: "Attendance", icon: faCalendarCheck, to: "/attendance" },
    { name: "Leave Management", icon: faCalendarAlt, to: "/leaveManagement" },
    { name: "Announcement", icon: faBullhorn, to: "/announcement" },
    { name: "Audit Logs", icon: faClipboardList, to: "/audit_logs" },
    { name: "User Management", icon: faUserCog, to: "/userManagement" },
  ];

  // Add this useEffect at the top of your component, after the state declarations
useEffect(() => {
  if (showSignatureModal || showUploadBalancesModal || showConfirmModal || 
      showBulkDeleteModal || showInactiveModal || showDeleteConfirmModal || 
      showReactivateModal || showSettingsModal || showTermsModal || 
      showTimeSettingsModal || showAddModal || showEditModal || 
      showViewModal || showProfileModal || showLogoutModal) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'auto';
  }
  
  // Cleanup function
  return () => {
    document.body.style.overflow = 'auto';
  };
}, [
  showSignatureModal, showUploadBalancesModal, showConfirmModal, 
  showBulkDeleteModal, showInactiveModal, showDeleteConfirmModal, 
  showReactivateModal, showSettingsModal, showTermsModal, 
  showTimeSettingsModal, showAddModal, showEditModal, 
  showViewModal, showProfileModal, showLogoutModal
]);


  // Function to view/upload signature
const handleSignatureClick = (employee) => {
  setSelectedSignatureEmployee(employee);
  loadEmployeeSignature(employee.id);
  setShowSignatureModal(true);
};

// Load employee's signature
const loadEmployeeSignature = async (employeeId) => {
  try {
    const response = await fetch(`${API_URL}/api/employees/${employeeId}/signature`);
    if (response.ok) {
      const data = await response.json();
      setEmployeeSignatures(prev => ({
        ...prev,
        [employeeId]: data.signature_url
      }));
      setSignaturePreview(data.signature_url);
    } else {
      // If no signature found, check if there's a signature in the employee record
      const employee = employeeRecord.find(emp => emp.id === employeeId);
      if (employee?.signature_url) {
        setEmployeeSignatures(prev => ({
          ...prev,
          [employeeId]: employee.signature_url
        }));
        setSignaturePreview(employee.signature_url);
      } else {
        setEmployeeSignatures(prev => ({
          ...prev,
          [employeeId]: null
        }));
        setSignaturePreview(null);
      }
    }
  } catch (error) {
    console.error('Error loading signature:', error);
  }
};

const handleSignatureFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    alert('Please upload a valid image file (PNG, JPEG, SVG)');
    return;
  }

  // Validate file size (max 5MB for better quality)
  if (file.size > 5 * 1024 * 1024) {
    alert('File size too large. Maximum size is 5MB.');
    return;
  }

  setNewSignature(file);
  
  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    const imageSrc = e.target.result;
    setSignaturePreview(imageSrc);
  };
  reader.readAsDataURL(file);
};

// Upload signature to server with Cloudinary support
const uploadSignature = async () => {
  if (!selectedSignatureEmployee || !newSignature) return;

  setIsUploadingSignature(true);
  
  try {
    const formData = new FormData();
    formData.append('signature', newSignature);

    const response = await fetch(
      `${API_URL}/api/employees/${selectedSignatureEmployee.id}/signature`,
      {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary
      }
    );

    if (response.ok) {
      const data = await response.json();
      
      // Update local state with Cloudinary URL
      setEmployeeSignatures(prev => ({
        ...prev,
        [selectedSignatureEmployee.id]: data.signature_url
      }));
      
      // Update signature preview with Cloudinary URL
      setSignaturePreview(data.signature_url);
      
      alert('Signature uploaded successfully!');
      setNewSignature(null);
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload signature');
    }
  } catch (error) {
    console.error('Error uploading signature:', error);
    alert(`Error: ${error.message}`);
  } finally {
    setIsUploadingSignature(false);
  }
};

// Delete signature
const deleteSignature = async () => {
  if (!selectedSignatureEmployee) return;

  if (!window.confirm('Are you sure you want to delete this signature?')) return;

  try {
    const response = await fetch(
      `${API_URL}/api/employees/${selectedSignatureEmployee.id}/signature`,
      {
        method: 'DELETE',
      }
    );

    if (response.ok) {
      // Update local state
      setEmployeeSignatures(prev => ({
        ...prev,
        [selectedSignatureEmployee.id]: null
      }));
      setSignaturePreview(null);
      setNewSignature(null);
      alert('Signature deleted successfully!');
    } else {
      throw new Error('Failed to delete signature');
    }
  } catch (error) {
    console.error('Error deleting signature:', error);
    alert('Failed to delete signature');
  }
};

// Load all signatures on component mount
useEffect(() => {
  const loadAllSignatures = async () => {
    try {
      // First try the dedicated endpoint
      const response = await fetch(`${API_URL}/api/employees/signatures/all`);
      if (response.ok) {
        const signatures = await response.json();
        setEmployeeSignatures(signatures);
      } else {
        // Fallback: extract signatures from employee records
        const signatureMap = {};
        employeeRecord.forEach(emp => {
          if (emp.signature_url) {
            signatureMap[emp.id] = emp.signature_url;
          }
        });
        setEmployeeSignatures(signatureMap);
      }
    } catch (error) {
      console.error('Error loading signatures:', error);
      // Fallback to extracting from employee records
      const signatureMap = {};
      employeeRecord.forEach(emp => {
        if (emp.signature_url) {
          signatureMap[emp.id] = emp.signature_url;
        }
      });
      setEmployeeSignatures(signatureMap);
    }
  };
  
  // Load signatures when employee records change
  if (employeeRecord.length > 0) {
    loadAllSignatures();
  }
}, [employeeRecord]); // Add employeeRecord as dependency

  const canViewAllDepartments = () => {
    const role = localStorage.getItem("role") || "admin";
    return role === "admin" || role === "mayor";
  };

  const canFilterAllDepartments = () => {
    const role = localStorage.getItem("role") || "admin";
    return role !== "office_head";
  };

  const allowedMenus = menuItems.filter((item) => {
    if (role === "admin") return true;
    if (role === "mayor" || role === "office_head") {
      return [
        "Dashboard",
        "Employees",
        "Leave Management",
      ].includes(item.name);
    }
    return false;
  });

const renderSignatureModal = () => {
  return (
    <div className="modal-overlay" style={styles.modalOverlay}>
      <div className="modal-content" style={{
        ...styles.modalContent,
        maxWidth: '800px',
        backgroundColor: '#fff',
        borderRadius: '10px',
        padding: '25px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #eee',
          paddingBottom: '15px'
        }}>
          <h3 style={{ margin: 0, color: '#2C3E50' }}>
            <FontAwesomeIcon icon={faSignature} style={{ marginRight: '10px' }} />
            E-Signature Management
            <span style={{
              marginLeft: '10px',
              fontSize: '14px',
              fontWeight: 'normal',
              color: employeeSignatures[selectedSignatureEmployee.id] ? '#28a745' : '#dc3545'
            }}>
              {employeeSignatures[selectedSignatureEmployee.id] ? '✓ Uploaded' : '⚠ Missing'}
            </span>
          </h3>
          <button
            onClick={() => {
              setShowSignatureModal(false);
              setSelectedSignatureEmployee(null);
              setSignaturePreview(null);
              setNewSignature(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Employee Info */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>
              {selectedSignatureEmployee.first_name} {selectedSignatureEmployee.last_name}
            </h4>
            <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#6c757d' }}>
              <span>ID: {selectedSignatureEmployee.id_number}</span>
              <span>Department: {selectedSignatureEmployee.department}</span>
              <span>Position: {selectedSignatureEmployee.position}</span>
            </div>
          </div>
          <div style={{
            padding: '8px 16px',
            backgroundColor: employeeSignatures[selectedSignatureEmployee.id] ? '#d4edda' : '#f8d7da',
            color: employeeSignatures[selectedSignatureEmployee.id] ? '#155724' : '#721c24',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {employeeSignatures[selectedSignatureEmployee.id] ? 'Signature Uploaded' : 'No Signature'}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
          {/* Left: Current Signature */}
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>Current Signature</h4>
            
            {/* Signature Preview */}
            <div style={{
              border: '2px dashed #dee2e6',
              borderRadius: '8px',
              padding: '20px',
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8f9fa',
              marginTop: '10px'
            }}>
              {signaturePreview ? (
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={signaturePreview} 
                    alt="Signature" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '150px',
                      objectFit: 'contain'
                    }}
                  />
                  {employeeSignatures[selectedSignatureEmployee.id] && (
                    <p style={{ marginTop: '10px', fontSize: '12px', color: '#28a745' }}>
                      <FontAwesomeIcon icon={faCheck} /> Signature on file
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#6c757d' }}>
                  <FontAwesomeIcon icon={faSignature} size="3x" style={{ marginBottom: '10px' }} />
                  <p>No signature uploaded</p>
                  <p style={{ fontSize: '12px' }}>Upload a signature image</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Upload/Update */}
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>
              {signaturePreview ? 'Update Signature' : 'Upload Signature'}
            </h4>
            
            <div style={{
              border: '1px solid #ced4da',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#fff',
              height: '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <FontAwesomeIcon icon={faUpload} size="2x" style={{ color: '#6c757d', marginBottom: '10px' }} />
                <p style={{ margin: '0 0 10px 0', color: '#495057' }}>
                  Drag & drop or click to browse
                </p>
                <input
                  type="file"
                  id="signature-upload"
                  accept=".png,.jpg,.jpeg,.svg"
                  onChange={handleSignatureFileChange}
                  style={{ display: 'none' }}
                  disabled={isUploadingSignature}
                />
                <label
                  htmlFor="signature-upload"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    borderRadius: '6px',
                    cursor: isUploadingSignature ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: isUploadingSignature ? 0.6 : 1
                  }}
                >
                  Browse Files
                </label>
                {newSignature && (
                  <p style={{ marginTop: '10px', fontSize: '12px', color: '#28a745' }}>
                    Selected: {newSignature.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          gap: '10px',
          borderTop: '1px solid #eee',
          paddingTop: '20px'
        }}>
          <div>
            {employeeSignatures[selectedSignatureEmployee.id] && (
              <button
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                onClick={deleteSignature}
                disabled={isUploadingSignature}
              >
                <FontAwesomeIcon icon={faTrash} /> Delete Signature
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              onClick={() => {
                setShowSignatureModal(false);
                setSelectedSignatureEmployee(null);
                setSignaturePreview(null);
                setNewSignature(null);
              }}
              disabled={isUploadingSignature}
            >
              Cancel
            </button>
            
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: newSignature ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: newSignature ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              onClick={uploadSignature}
              disabled={!newSignature || isUploadingSignature}
            >
              {isUploadingSignature ? (
                <>
                  <FontAwesomeIcon icon={faCircle} spin /> Uploading...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUpload} /> 
                  Upload Signature
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

  const departments = [
    "Office of the Municipal Mayor",
    "Human Resource Management Division",
    "Business Permit and Licensing Division",
    "Sangguniang Bayan Office",
    "Office of the Municipal Accountant",
    "Office of the Assessor",
    "Municipal Budget Office",
    "Municipal Planning and Development Office",
    "Municipal Engineering Office",
    "Municipal Disaster Risk Reduction and Management Office",
    "Municipal Social Welfare and Development Office",
    "Municipal Environment and Natural Resources Office",
    "Office of the Municipal Agriculturist",
    "Municipal General Services Office",
    "Municipal Public Employment Service Office",
    "Municipal Health Office",
    "Municipal Treasurer's Office",
  ];

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    const fetchInitialProfile = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("admin"));
        if (!storedUser) return;

        const url =
          storedUser.role === "office_head"
            ? `${API_URL}/api/authAdmin/user/${storedUser.id}`
            : `${API_URL}/api/auth/useradmin/${storedUser.id}`;

        const res = await fetch(url);
        const data = await res.json();

        if (res.ok) {
          setAdmin(data);
          setProfileData(data);
        } else {
          console.error("Error loading initial profile:", data.message);
        }
      } catch (err) {
        console.error("Error loading initial profile:", err);
      }
    };

    fetchInitialProfile();
  }, []);

  const API_URL = "https://ezleave-admin-api.onrender.com";

 const loadEmployees = async () => {
  try {
    const role = localStorage.getItem("role") || "admin";
    const department = localStorage.getItem("department") || "";

    const params = role === "mayor" 
      ? new URLSearchParams({ role }).toString()
      : new URLSearchParams({ role, department }).toString();
    
    const url = `${API_URL}/api/employees?${params}`;
    const res = await fetch(url);
    const data = await res.json();

    setEmployeeRecords(Array.isArray(data) ? data : [data]);
    
    // Extract signatures from employee records
    const signatureMap = {};
    const employees = Array.isArray(data) ? data : [data];
    employees.forEach(emp => {
      if (emp.signature_url) {
        signatureMap[emp.id] = emp.signature_url;
      }
    });
    setEmployeeSignatures(signatureMap);
    
  } catch (err) {
    console.error("Error loading employees:", err);
    setEmployeeRecords([]);
  }
};

  const canPerformActions = (employeeDepartment) => {
    const role = localStorage.getItem("role") || "admin";
    
    if (role === "admin") return true;
    if (role === "mayor") return false;
    if (role === "office_head") {
      const userDept = localStorage.getItem("department") || "";
      return employeeDepartment === userDept;
    }
    return false;
  };

  const canAddEmployees = () => {
    const role = localStorage.getItem("role") || "admin";
    return role !== "mayor";
  };

  const canImportCSV = () => {
    const role = localStorage.getItem("role") || "admin";
    return role !== "mayor";
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop().toLowerCase();

    if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        const rows = json.slice(3);
        const validRows = rows.filter(
          (row) => row.some(cell => cell && String(cell).trim() !== "")
        );

        const employees = validRows.map((row) => {
          const normalizeCivilStatus = (status) => {
            if (!status) return "Single";
            const lowerStatus = status.toLowerCase().trim();
            if (lowerStatus.includes('single')) return "Single";
            if (lowerStatus.includes('married')) return "Married";
            if (lowerStatus.includes('widowed')) return "Widowed";
            if (lowerStatus.includes('separated')) return "Separated";
            if (lowerStatus.includes('annulled')) return "Annulled";
            return "Single";
          };

          const civilStatus = row[12]?.toString().trim() || "";
          
          return {
            first_name: row[0]?.trim() || "",
            last_name: row[2]?.trim() || "",
            full_name: `${row[0] || ""} ${row[1] || ""} ${row[2] || ""}`.trim(),
            position: row[4]?.trim() || "",
            department: row[5]?.trim() || "",
            employment_status:
              row[6]?.toUpperCase().includes("PERMANENT") ? "Permanent" :
              row[6]?.toUpperCase().includes("COS") || row[6]?.toUpperCase().includes("JO") ? "Contractual" :
              row[6]?.toUpperCase().includes("ELECTIVE") || row[6]?.toUpperCase().includes("CO-TERM") ? "Temporary" :
              "Permanent",
            id_number: String(row[7] || "").replace(".0", ""),
            email: row[8]?.trim() || "",
            contact_number: String(row[9] || "").trim(),
            date_hired: row[10] ? new Date(row[10]).toISOString().split("T")[0] : "",
            gender: row[11]?.toString().toLowerCase().includes("female") ? "Female" : "Male",
            civil_status: normalizeCivilStatus(civilStatus),
            status: "active",
          };
        });

        setEmployeesToUpload(employees);
        setShowConfirmModal(true);
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const employeesRaw = results.data
            .filter(row => Object.values(row).some(cell => cell && cell.trim() !== ""))
            .map((row, index) => {
              const normalizeCivilStatus = (status) => {
                if (!status) return "Single";
                const lowerStatus = status.toLowerCase().trim();
                if (lowerStatus.includes('single')) return "Single";
                if (lowerStatus.includes('married')) return "Married";
                if (lowerStatus.includes('widowed')) return "Widowed";
                if (lowerStatus.includes('separated')) return "Separated";
                if (lowerStatus.includes('annulled')) return "Annulled";
                return "Single";
              };

              return {
                first_name: row.first_name?.trim() || "",
                last_name: row.last_name?.trim() || "",
                full_name: `${row.first_name || ""} ${row.last_name || ""}`.trim(),
                email: row.email?.trim() || "",
                position: row.position?.trim() || "",
                employment_status: row.employment_status?.trim() || "Permanent",
                department: row.department?.trim() || "",
                gender: row.gender?.trim() || "",
                date_hired: row.date_hired?.trim() || "",
                civil_status: normalizeCivilStatus(row.civil_status),
                contact_number: row.contact_number?.trim() || "",
                id_number: row.id_number?.trim() || "",
                status: row.status?.trim() || "active",
                contract_start_date: row.contract_start_date?.trim() || "",
                contract_end_date: row.contract_end_date?.trim() || "",
              };
            });

          setEmployeesToUpload(employeesRaw);
          setShowConfirmModal(true);
        },
      });
    }
  };

  const confirmUpload = async () => {
    if (employeesToUpload.length === 0) return;

    setShowConfirmModal(false);
    setIsDeleting(true);
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const validEmployees = employeesToUpload.filter(
        (emp) => Object.values(emp).some(value => value && String(value).trim() !== "")
      );

      let importedCount = 0;

      for (const emp of validEmployees) {
        try {
          const payload = { ...emp };
          if (!payload.id_number) delete payload.id_number;
          
          // Clear contract dates for permanent employees
          if (payload.employment_status === 'Permanent') {
            delete payload.contract_start_date;
            delete payload.contract_end_date;
          }

          const response = await fetch(`${API_URL}/api/employees`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            console.warn(`❌ Failed to import: ${emp.full_name}`);
            continue;
          }

          const savedEmployee = await response.json();
          setEmployeeRecords((prev) => [savedEmployee, ...prev]);

          importedCount++;
        } catch (err) {
          console.warn(`⚠️ Skipped due to error: ${emp.full_name}`, err);
        }
      }

      console.log(`🎉 Finished importing ${importedCount} / ${validEmployees.length} employees`);
    } catch (error) {
      console.error("Error importing employees:", error);
    } finally {
      setEmployeesToUpload([]);
      setTimeout(() => setIsDeleting(false), 400);
    }
  };

  // Updated delete function to set as inactive
  const handleDeleteClick = (employee) => {
    setEmployeeToInactivate(employee);
    setShowInactiveModal(true);
  };

  // New function to handle setting employee to inactive
  const confirmSetInactive = async () => {
    if (!employeeToInactivate || !inactiveReason) {
      alert("Please select a reason for making employee inactive");
      return;
    }

    setIsDeleting(true);
    
    try {
      const res = await fetch(`${API_URL}/api/employees/${employeeToInactivate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...employeeToInactivate, 
          status: "inactive",
          inactive_reason: inactiveReason,
          inactive_date: new Date().toISOString().split('T')[0]
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to set employee as inactive");
      }

      setEmployeeRecords((prev) =>
        prev.map(emp => 
          emp.id === employeeToInactivate.id 
            ? { ...emp, status: "inactive", inactive_reason: inactiveReason }
            : emp
        )
      );

      setShowInactiveModal(false);
      setEmployeeToInactivate(null);
      setInactiveReason('');
      
      alert(`Employee ${employeeToInactivate.first_name} ${employeeToInactivate.last_name} has been set to inactive. Reason: ${inactiveReason}`);
    } catch (error) {
      console.error("Set inactive error:", error);
      alert(error.message || "Failed to set employee as inactive");
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to delete inactive employee permanently
  const handleDeleteInactive = (employee) => {
    setEmployeeToDeletePermanently(employee);
    setShowDeleteConfirmModal(true);
  };

  // Function for permanent deletion
  const confirmPermanentDelete = async () => {
    if (!employeeToDeletePermanently) return;

    setIsDeleting(true);
    
    try {
      const res = await fetch(`${API_URL}/api/employees/${employeeToDeletePermanently.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error("Failed to delete employee");
      }

      setEmployeeRecords((prev) =>
        prev.filter((emp) => emp.id !== employeeToDeletePermanently.id)
      );

      alert("Employee permanently deleted!");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete employee");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmModal(false);
      setEmployeeToDeletePermanently(null);
    }
  };

  // 🗑️ BULK DELETE SELECTED EMPLOYEES
  const handleBulkDelete = async () => {
    if (selectedEmployees.length === 0) return;

    setIsDeleting(true);
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      for (const id of selectedEmployees) {
        await fetch(`${API_URL}/api/employees/${id}`, { method: "DELETE" });
      }

      setEmployeeRecords((prev) =>
        prev.filter((emp) => !selectedEmployees.includes(emp.id))
      );

      setSelectedEmployees([]);
      setSelectAll(false);
    } catch (err) {
      console.error("Bulk delete failed:", err);
    } finally {
      setTimeout(() => setIsDeleting(false), 400);
    }
  };

  // Add function to handle employee reactivation
  const handleReactivateClick = (employee) => {
    setEmployeeToReactivate(employee);
    setShowReactivateModal(true);
  };

  const confirmReactivate = async () => {
    if (!employeeToReactivate) return;

    setIsDeleting(true);
    
    try {
      const response = await fetch(`${API_URL}/api/employees/${employeeToReactivate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...employeeToReactivate, 
          status: "active",
          inactive_reason: ""
        })
      });

      if (!response.ok) throw new Error("Failed to reactivate employee");

      setEmployeeRecords((prev) =>
        prev.map((emp) =>
          emp.id === employeeToReactivate.id 
            ? { ...emp, status: "active", inactive_reason: "" } 
            : emp
        )
      );

      setShowReactivateModal(false);
      setEmployeeToReactivate(null);
      alert("Employee reactivated successfully!");
    } catch (error) {
      console.error("Reactivate error:", error);
      alert("Failed to reactivate employee");
    } finally {
      setIsDeleting(false);
    }
  };

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

const handleAddEmployee = async () => {
  try {
    console.log("Original newEmployee state:", newEmployee);
    
    const first_name = newEmployee.first_name.trim();
    const last_name = newEmployee.last_name.trim();

    console.log("Name - First:", first_name, "Last:", last_name);

    // Validate required fields
    if (!first_name || !last_name) {
      alert("First name and last name are required");
      return;
    }

    if (!newEmployee.email) {
      alert("Email is required");
      return;
    }

    const employeeData = {
      first_name,
      last_name,
      email: newEmployee.email,
      position: newEmployee.position,
      department: newEmployee.department,
      employment_status: newEmployee.employment_status,
      gender: newEmployee.gender,
      status: 'active',
      date_hired: newEmployee.date_hired,
      id_number: newEmployee.id_number,
      contact_number: newEmployee.contact_number,
      civil_status: newEmployee.civil_status,
      contract_start_date: newEmployee.contract_start_date || "",
      contract_end_date: newEmployee.contract_end_date || ""
      // REMOVED: No contract dates
    };

     if (shouldShowContractDates()) {
      employeeData.contract_start_date = newEmployee.contract_start_date;
      employeeData.contract_end_date = newEmployee.contract_end_date;
    }

    console.log("Data to be sent to API:", employeeData);

    const response = await fetch(`${API_URL}/api/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(employeeData),
    });

    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || "Failed to add employee");
      } catch (parseError) {
        throw new Error(errorText || "Failed to add employee");
      }
    }

    const savedEmployee = await response.json();
    console.log("Saved employee:", savedEmployee);

    setEmployeeRecords((prev) => [savedEmployee, ...prev]);

    setShowAddModal(false);
    alert("Employee added successfully!");
    
    // Reset form
    setNewEmployee({
      first_name: "",
      last_name: "",
      email: "",
      position: "",
      department: "",
      employment_status: "",
      gender: "",
      status: "active",
      date_hired: "",
      id_number: "",
      contact_number: "",
      civil_status: "",
      // REMOVED: contract_start_date: "",
      // REMOVED: contract_end_date: "",
    });
  } catch (error) {
    console.error("Add employee error:", error);
    alert(`Error adding employee: ${error.message}`);
  }
};

  const handleViewClick = (employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  const handleEditClick = (employee) => {
    // Only allow editing active employees
    if (employee.status === 'inactive') {
      alert('Inactive employees cannot be edited. Please reactivate them first.');
      return;
    }
    
    // Include contract dates in editable fields
    const { status, inactive_reason, ...editableFields } = employee;
    setEmployeesToEdit(editableFields);
    setShowEditModal(true);
  };

const handleEditSave = async () => {
  try {
    // Get current employee data to preserve status and inactive_reason
    const currentEmployee = employeeRecord.find(emp => emp.id === employeesToEdit.id);
    
    // Prepare data for update - preserve the original status and inactive_reason
    const updateData = {
      first_name: employeesToEdit.first_name,
      last_name: employeesToEdit.last_name,
      email: employeesToEdit.email,
      position: employeesToEdit.position,
      id_number: employeesToEdit.id_number,
      contact_number: employeesToEdit.contact_number,
      civil_status: employeesToEdit.civil_status,
      department: employeesToEdit.department,
      employment_status: employeesToEdit.employment_status,
      gender: employeesToEdit.gender,
      status: currentEmployee?.status || 'active',
      date_hired: employeesToEdit.date_hired,
      inactive_reason: currentEmployee?.inactive_reason || '' // Preserve inactive_reason
      // REMOVED: No contract dates
    };

    if (shouldShowContractDates(employeesToEdit.employment_status)) {
      updateData.contract_start_date = employeesToEdit.contract_start_date;
      updateData.contract_end_date = employeesToEdit.contract_end_date;
    }

    console.log("Sending update data:", updateData);

    const response = await fetch(`${API_URL}/api/employees/${employeesToEdit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Update failed:", errorText);
      throw new Error("Failed to update employee: " + errorText);
    }

    const updatedEmployee = await response.json();

    // Update local state with the response from backend
    setEmployeeRecords((prev) =>
      prev.map((emp) =>
        emp.id === employeesToEdit.id ? updatedEmployee : emp
      )
    );
    
    setShowEditModal(false);
    alert("Employee updated successfully!");
  } catch (error) {
    console.error("Error updating employee:", error);
    alert("Failed to update employee: " + error.message);
  }
};

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedEmployees(employeeRecord.filter(emp => emp.status === 'active').map((emp) => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  useEffect(() => {
    if (selectedEmployees.length === employeeRecord.filter(emp => emp.status === 'active').length && employeeRecord.filter(emp => emp.status === 'active').length > 0) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedEmployees, employeeRecord]);

  const handleSelectEmployee = (id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id)
        ? prev.filter((empId) => empId !== id)
        : [...prev, id]
    );
  };

  useEffect(() => {
    if (showViewModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => (document.body.style.overflow = 'auto');
  }, [showViewModal]);

  // Filter active employees for list view
  const filteredEmployees = employeeRecord
    .filter(emp => emp.status === 'active')
    .filter(emp => {
      const search = searchTerm.toLowerCase();
      const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.toLowerCase();
      const email = (emp.email || "").toLowerCase();
      const position = (emp.position || "").toLowerCase();
      return fullName.includes(search) || email.includes(search) || position.includes(search);
    })
    .filter(emp => filterDepartment ? emp.department === filterDepartment : true)
    .filter(emp => filterEmploymentStatus ? emp.employment_status === filterEmploymentStatus : true);

  // Filter inactive employees for inactive tab
  const inactiveEmployees = employeeRecord
    .filter(emp => emp.status === 'inactive')
    .filter(emp => {
      const search = searchTerm.toLowerCase();
      const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.toLowerCase();
      const email = (emp.email || "").toLowerCase();
      const position = (emp.position || "").toLowerCase();
      return fullName.includes(search) || email.includes(search) || position.includes(search);
    })
    .filter(emp => filterDepartment ? emp.department === filterDepartment : true)
    .filter(emp => filterEmploymentStatus ? emp.employment_status === filterEmploymentStatus : true);

  const totalPages = Math.ceil(filteredEmployees.length / listEmployeePerPage); 
  const totalInactivePages = Math.ceil(inactiveEmployees.length / listEmployeePerPage);

  // Helper function to generate pagination range
  const getPaginationRange = (currentPage, totalPages) => {
    const maxVisible = 3;
    let start = Math.max(currentPage - Math.floor(maxVisible / 2), 1);
    let end = start + maxVisible - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(end - maxVisible + 1, 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const canUploadBalances = () => {
    const role = localStorage.getItem("role") || "admin";
    return role !== "mayor";
  };

  const handleBalancesUpload = async () => {
    if (!selectedBalancesFile) {
      alert("Please select a file first!");
      return;
    }

    setUploadingBalances(true);
    setUploadBalancesProgress(0);
    setUploadBalancesResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedBalancesFile);

      const progressInterval = setInterval(() => {
        setUploadBalancesProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const res = await fetch(`${API_URL}/api/leave-cards/upload`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadBalancesProgress(100);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Upload failed: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      setUploadBalancesResult(data);
      
      if (data.inserted > 0) {
        setTimeout(() => {
          setShowUploadBalancesModal(false);
          setSelectedBalancesFile(null);
          setUploadBalancesResult(null);
          setUploadBalancesProgress(0);
        }, 2000);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadBalancesResult({
        error: err.message || "Failed to upload leave balances. Please check the file format and try again."
      });
    } finally {
      setUploadingBalances(false);
    }
  };

  useEffect(() => {
    const fetchInitialProfile = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("admin"));
        if (!storedUser) return;

        const url =
          storedUser.role === "office_head"
            ? `${API_URL}/api/authAdmin/user/${storedUser.id}`
            : `${API_URL}/api/auth/useradmin/${storedUser.id}`;

        const res = await fetch(url);
        const data = await res.json();

        if (res.ok) {
          setAdmin(data);
          setProfileData(data);
        } else {
          console.error("Error loading initial profile:", data.message);
        }
      } catch (err) {
        console.error("Error loading initial profile:", err);
      }
    };

    fetchInitialProfile();
  }, []);
  
  useEffect(() => {
    if (!showProfileModal) return;

    const fetchProfileData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("admin"));
        if (!storedUser) return;

        const url =
          storedUser.role === "office_head"
            ? `${API_URL}/api/authAdmin/user/${storedUser.id}`
            : `${API_URL}/api/auth/useradmin/${storedUser.id}`;

        const res = await fetch(url);
        const data = await res.json();

        if (res.ok) {
          setProfileData(data);
        } else {
          console.error("Error loading profile:", data.message);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };

    fetchProfileData();
  }, [showProfileModal]);

  useEffect(() => {
    const fetchTimeSettings = async () => {
      setIsLoadingTimeSettings(true);
      try {
        const response = await fetch(`${API_URL}/api/attendance/settings/time`);
        if (response.ok) {
          const data = await response.json();
          setAttendanceTimeSettings(data);
        } else {
          console.warn('Failed to fetch time settings from server');
          setAttendanceTimeSettings({});
        }
      } catch (error) {
        console.error('Error fetching time settings:', error);
        setAttendanceTimeSettings({});
      } finally {
        setIsLoadingTimeSettings(false);
      }
    };
  
    fetchTimeSettings();
  }, []);
  
  const fetchTermsAndConditions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/terms/active`);
      const data = await response.json();
      
      if (data && data.content) {
        setTermsContent(data.content);
        setActiveTermsVersion(data);
      } else {
        setTermsContent('');
        setActiveTermsVersion(null);
      }
      
      try {
        const versionsRes = await fetch(`${API_URL}/api/terms`);
        const versionsData = await versionsRes.json();
        
        if (Array.isArray(versionsData)) {
          setTermsVersions(versionsData);
        } else if (versionsData && Array.isArray(versionsData.data)) {
          setTermsVersions(versionsData.data);
        } else if (versionsData && versionsData.versions) {
          setTermsVersions(versionsData.versions);
        } else {
          setTermsVersions([]);
          console.warn('API returned non-array data:', versionsData);
        }
      } catch (versionsError) {
        console.error('Error fetching versions:', versionsError);
        setTermsVersions([]);
      }
    } catch (error) {
      console.error('Error fetching active terms:', error);
      setTermsContent('');
      setActiveTermsVersion(null);
      setTermsVersions([]);
    }
  };

  const saveTermsAndConditions = async () => {
    if (!termsContent.trim()) {
      alert('Please enter Terms & Conditions content');
      return;
    }

    const versionCount = Array.isArray(termsVersions) ? termsVersions.length : 0;
    const version = newTermsVersion || `v${versionCount + 1}.0`;
    
    try {
      const response = await fetch(`${API_URL}/api/terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version,
          content: termsContent
        })
      });

      if (response.ok) {
        alert('Terms & Conditions saved successfully!');
        setIsEditingTerms(false);
        fetchTermsAndConditions();
        setNewTermsVersion('');
      } else {
        const errorData = await response.json();
        alert(`Failed to save: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving terms:', error);
      alert('Error saving Terms & Conditions. Check console.');
    }
  };

  const activateTermsVersion = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/terms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: true })
      });

      if (response.ok) {
        fetchTermsAndConditions();
      }
    } catch (error) {
      console.error('Error activating version:', error);
    }
  };

  const deleteTermsVersion = async (id) => {
    if (window.confirm('Are you sure you want to delete this version?')) {
      try {
        const response = await fetch(`${API_URL}/api/terms/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          fetchTermsAndConditions();
        }
      } catch (error) {
        console.error('Error deleting version:', error);
      }
    }
  };

  return (
    <div className="dashboard-container" style={styles.dashboardContainer}>

      <div className="desktop-header" style={styles.header}>
        <div style={styles.headerRight}>
          <ProfileDropdown
            showSettingsModal={showSettingsModal}
            setShowSettingsModal={setShowSettingsModal}
            showProfileModal={showProfileModal}
            setShowProfileModal={setShowProfileModal}
            showLogoutModal={showLogoutModal}
            setShowLogoutModal={setShowLogoutModal}
            isMobile={false}
            profileData={profileData}
            admin={admin}
          />
        </div>
      </div>

      <div className="sidebar" style={styles.sidebar}>
        <img src={require('./images/logo_ez.png')} alt="logo" className="desktop-logo" style={styles.logo} />
        <ul className="sidebar-list" style={styles.sidebarList}>
          {allowedMenus.map((item) => {
            const isActive = location.pathname === item.to;

            return (
              <li
                key={item.name}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                style={{
                  ...(isActive ? styles.btnActive : {}),
                }}
              >
                <Link
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  style={{
                    ...styles.sb,
                    ...(isActive ? styles.btnActive : {}),
                  }}
                  to={item.to}
                >
                  <FontAwesomeIcon icon={item.icon} className="sidebar-icon" style={styles.icon} /> {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mobile-header">
        <button 
          className="hamburger"
          onClick={() => setIsSidebarOpen(true)}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <img src={require('./images/logo_ez.png')} alt="logo" className="mobile-logo" />
        <div className="mobile-header-right">
          <ProfileDropdown
            showSettingsModal={showSettingsModal}
            setShowSettingsModal={setShowSettingsModal}
            showProfileModal={showProfileModal}
            setShowProfileModal={setShowProfileModal}
            showLogoutModal={showLogoutModal}
            setShowLogoutModal={setShowLogoutModal}
            isMobile={true}
          />
        </div>
      </div>

      {/* Mobile Profile Dropdown */}
      {showProfileMenu && (
        <div className="mobile-profile-dropdown">
          <button className="dropdown-item" style={styles.dropdownItem} onClick={() => setShowProfileModal(true)}>
            <FontAwesomeIcon icon={faUserCog} className="dropdown-icon" style={styles.dropdownIcon} /> My Profile
          </button>
          <button className="dropdown-item" style={styles.dropdownItem}>
            <FontAwesomeIcon icon={faCog} className="dropdown-icon" style={styles.dropdownIcon} /> Settings
          </button>
          <button
            className="dropdown-item"
            style={styles.dropdownItem}
            onClick={() => setShowLogoutModal(true)}
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="dropdown-icon" style={styles.dropdownIcon} /> Logout
          </button>
        </div>
      )}

      {showSettingsModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.settingsModalContent}>
            <div style={styles.settingsModalHeader}>
              <h2 style={styles.settingsModalTitle}>
                <FontAwesomeIcon icon={faCog} /> Settings
              </h2>
              <button 
                style={styles.closeButton}
                onClick={() => setShowSettingsModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
      
            <div style={styles.settingsSections}>
              <button 
                style={styles.settingsSectionButton}
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowTermsModal(true);
                }}
              >
                <FontAwesomeIcon icon={faFileContract} style={{marginRight: '10px'}} />
                Terms & Conditions Management
              </button>
      
              <button 
                style={styles.settingsSectionButton}
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowTimeSettingsModal(true);
                }}
              >
                <FontAwesomeIcon icon={faClock} style={{marginRight: '10px'}} />
                Attendance Time Settings
              </button>
              
              <button style={styles.settingsSectionButton}>
                <FontAwesomeIcon icon={faBell} style={{marginRight: '10px'}} />
                Notification Settings
              </button>
              
              <button style={styles.settingsSectionButton}>
                <FontAwesomeIcon icon={faUserShield} style={{marginRight: '10px'}} />
                Privacy & Security
              </button>
              
              <button style={styles.settingsSectionButton}>
                <FontAwesomeIcon icon={faUsers} style={{marginRight: '10px'}} />
                User Permissions
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.termsModalContent}>
            <div style={styles.termsModalHeader}>
              <h2 style={styles.termsModalTitle}>
                <FontAwesomeIcon icon={faFileContract} /> Terms & Conditions
              </h2>
              <button 
                style={styles.closeButton}
                onClick={() => {
                  setShowTermsModal(false);
                  setIsEditingTerms(false);
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
      
            {/* Active Version Info */}
            <div style={styles.activeTermsCard}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h4>Active Version</h4>
                {activeTermsVersion && (
                  <span style={styles.activeBadge}>ACTIVE</span>
                )}
              </div>
              {activeTermsVersion ? (
                <div>
                  <p><strong>Version:</strong> {activeTermsVersion.version}</p>
                  <p><strong>Created:</strong> {new Date(activeTermsVersion.created_at).toLocaleDateString()}</p>
                </div>
              ) : (
                <p>No active terms found</p>
              )}
            </div>
      
            {/* Terms Content */}
            <div style={styles.termsContentSection}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                <h4>Terms & Conditions Content</h4>
                {!isEditingTerms ? (
                  <button 
                    style={styles.editButton}
                    onClick={() => setIsEditingTerms(true)}
                  >
                    <FontAwesomeIcon icon={faEdit} /> Edit
                  </button>
                ) : (
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button 
                      style={styles.saveButton}
                      onClick={saveTermsAndConditions}
                    >
                      <FontAwesomeIcon icon={faSave} /> Save
                    </button>
                    <button 
                      style={styles.cancelButton}
                      onClick={() => setIsEditingTerms(false)}
                    >
                      <FontAwesomeIcon icon={faTimes} /> Cancel
                    </button>
                  </div>
                )}
              </div>
      
              {isEditingTerms && (
                <div style={{marginBottom: '15px'}}>
                  <input
                    type="text"
                    placeholder="Version (e.g., v2.0)"
                    value={newTermsVersion}
                    onChange={(e) => setNewTermsVersion(e.target.value)}
                    style={styles.versionInput}
                  />
                </div>
              )}
      
              {isEditingTerms ? (
                <textarea
                  value={termsContent}
                  onChange={(e) => setTermsContent(e.target.value)}
                  style={styles.termsTextarea}
                  rows={15}
                  placeholder="Enter Terms & Conditions content here..."
                />
              ) : (
                <div style={styles.termsViewer}>
                  {termsContent || 'No Terms & Conditions content available.'}
                </div>
              )}
            </div>
      
            {/* Version History */}
            <div style={styles.versionHistory}>
              <h4><FontAwesomeIcon icon={faHistory} /> Version History</h4>
              <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                {termsVersions.map(version => (
                  <div 
                    key={version.id} 
                    style={{
                      ...styles.versionItem,
                      borderLeft: version.is_active ? '4px solid #009205' : '4px solid #ccc'
                    }}
                  >
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <strong>Version {version.version}</strong>
                        {version.is_active && <span style={styles.activeBadge}>ACTIVE</span>}
                      </div>
                      <p style={{fontSize: '12px', color: '#666', margin: '5px 0'}}>
                        Created: {new Date(version.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{display: 'flex', gap: '5px'}}>
                      {!version.is_active && (
                        <>
                          <button 
                            style={styles.smallButton}
                            onClick={() => activateTermsVersion(version.id)}
                          >
                            Activate
                          </button>
                          <button 
                            style={{...styles.smallButton, background: '#dc3545'}}
                            onClick={() => deleteTermsVersion(version.id)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showTimeSettingsModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.timeSettingsModalContent}>
            <div style={styles.timeSettingsModalHeader}>
              <h2 style={styles.timeSettingsModalTitle}>
                <FontAwesomeIcon icon={faClock} /> Attendance Time Settings
              </h2>
              <button 
                style={styles.closeButton}
                onClick={() => {
                  setShowTimeSettingsModal(false);
                  setEditingDay(null);
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
      
            <div style={styles.timeSettingsContent}>
              <p style={styles.timeSettingsDescription}>
                Set the official working hours for each day of the week. 
                Employees checking in after the start time will be marked as late.
              </p>
      
              {isLoadingTimeSettings ? (
                <div style={styles.loadingContainer}>
                  <p>Loading time settings...</p>
                </div>
              ) : (
                <>
                  <div style={styles.timeSettingsGrid}>
                    {[
                      { key: 'monday', label: 'Monday (Early Start)' },
                      { key: 'tuesday', label: 'Tuesday' },
                      { key: 'wednesday', label: 'Wednesday' },
                      { key: 'thursday', label: 'Thursday' },
                      { key: 'friday', label: 'Friday' },
                      { key: 'saturday', label: 'Saturday' },
                      { key: 'sunday', label: 'Sunday' }
                    ].map(({ key, label }) => {
                      const config = attendanceTimeSettings[key] || {};
                      const isActive = config.is_active !== undefined ? config.is_active : true;
                      const startTime = config.start || '';
                      const endTime = config.end || '';
                      const isTimeSet = startTime && endTime;
                      
                      return (
                        <div key={key} style={{
                          ...styles.timeSettingCard,
                          opacity: isActive ? 1 : 0.7,
                          borderColor: isActive ? '#e9ecef' : '#ccc'
                        }}>
                          <div style={styles.timeSettingHeader}>
                            <div>
                              <h4 style={styles.dayName}>
                                {label}
                              </h4>
                              {!isActive && (
                                <span style={styles.inactiveBadge}>INACTIVE</span>
                              )}
                            </div>
                            {editingDay === key ? (
                              <button 
                                style={styles.saveTimeButton}
                                onClick={() => setEditingDay(null)}
                              >
                                Done
                              </button>
                            ) : (
                              <button 
                                style={styles.editTimeButton}
                                onClick={() => setEditingDay(key)}
                                disabled={!isActive}
                              >
                                {isTimeSet ? 'Edit' : 'Add'}
                              </button>
                            )}
                          </div>
                          
                          {editingDay === key ? (
                            <div style={styles.timeInputs}>
                              <div style={styles.timeInputGroup}>
                                <label style={styles.timeLabel}>Start Time</label>
                                <input
                                  type="time"
                                  value={startTime}
                                  onChange={(e) => {
                                    setAttendanceTimeSettings(prev => ({
                                      ...prev,
                                      [key]: { 
                                        ...prev[key], 
                                        start: e.target.value,
                                        end: endTime || '17:00',
                                        is_active: true
                                      }
                                    }));
                                  }}
                                  style={styles.timeInput}
                                />
                              </div>
                              <div style={styles.timeInputGroup}>
                                <label style={styles.timeLabel}>End Time</label>
                                <input
                                  type="time"
                                  value={endTime}
                                  onChange={(e) => {
                                    setAttendanceTimeSettings(prev => ({
                                      ...prev,
                                      [key]: { 
                                        ...prev[key], 
                                        end: e.target.value,
                                        start: startTime || '08:00',
                                        is_active: true
                                      }
                                    }));
                                  }}
                                  style={styles.timeInput}
                                />
                              </div>
                            </div>
                          ) : (
                            <div style={styles.timeDisplay}>
                              {isTimeSet ? (
                                <>
                                  <div style={styles.timeSlot}>
                                    <FontAwesomeIcon icon={faArrowRight} style={styles.timeIcon} />
                                    <span style={styles.timeText}>Start: {startTime}</span>
                                  </div>
                                  <div style={styles.timeSlot}>
                                    <FontAwesomeIcon icon={faArrowLeft} style={styles.timeIcon} />
                                    <span style={styles.timeText}>End: {endTime}</span>
                                  </div>
                                </>
                              ) : (
                                <div style={styles.noTimeSet}>
                                  <FontAwesomeIcon icon={faClock} style={styles.noTimeIcon} />
                                  <span style={styles.noTimeText}>Time not set</span>
                                  <button 
                                    style={styles.addTimeButton}
                                    onClick={() => setEditingDay(key)}
                                  >
                                    <FontAwesomeIcon icon={faPlus} /> Add Time
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
      
                  <div style={styles.timeSettingsActions}>
                    <button 
                      style={styles.saveAllButton}
                      onClick={async () => {
                        try {
                          const settingsToSave = {};
                          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                          
                          days.forEach(day => {
                            const config = attendanceTimeSettings[day] || {};
                            if (config.start && config.end) {
                              settingsToSave[day] = {
                                start: config.start,
                                end: config.end,
                                is_active: config.is_active !== false
                              };
                            }
                          });
                          
                          if (Object.keys(settingsToSave).length === 0) {
                            alert('Please add at least one time setting');
                            return;
                          }
                          
                          const response = await fetch(`${API_URL}/api/attendance/settings/time`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(settingsToSave)
                          });
      
                          if (response.ok) {
                            alert('Attendance time settings saved successfully!');
                            setShowTimeSettingsModal(false);
                            setEditingDay(null);
                            
                            const refreshResponse = await fetch(`${API_URL}/api/attendance/settings/time`);
                            if (refreshResponse.ok) {
                              const data = await refreshResponse.json();
                              setAttendanceTimeSettings(data);
                            }
                          } else {
                            const errorData = await response.json();
                            alert(`Failed to save: ${errorData.error || 'Unknown error'}`);
                          }
                        } catch (error) {
                          console.error('Error saving time settings:', error);
                          alert('Error saving settings. Check console.');
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faSave} /> Save All Settings
                    </button>
                    <button 
                      style={styles.resetButton}
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to reset all time settings to default?')) {
                          try {
                            const response = await fetch(`${API_URL}/api/attendance/settings/time/reset`, {
                              method: 'POST'
                            });
      
                            if (response.ok) {
                              alert('Settings reset to default successfully!');
                              const refreshResponse = await fetch(`${API_URL}/api/attendance/settings/time`);
                              if (refreshResponse.ok) {
                                const data = await refreshResponse.json();
                                setAttendanceTimeSettings(data);
                              }
                            } else {
                              alert('Failed to reset settings');
                            }
                          } catch (error) {
                            console.error('Error resetting settings:', error);
                            alert('Error resetting settings');
                          }
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faHistory} /> Reset to Default
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="mobile-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Updated Sidebar with Mobile Header */}
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

        <img src={require('./images/logo_ez.png')} alt="logo" className="desktop-logo" style={styles.logo} />
        
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
        </ul>
      </div>

      <div className="content" style={styles.content}>
      
        {showLogoutModal && (
          <div className="modal-overlay" style={styles.modalOverlay}>
            <div className="modal-content" style={{...styles.modalContent, backgroundColor: '#fff', borderRadius: '10px', padding: '20px', maxWidth: '500px'}}>
              <h3 style={{marginBottom: '15px', color: '#2C3E50'}}>Confirm Logout</h3>
              <p style={{marginBottom: '20px', fontSize: '16px'}}>Are you sure you want to log out?</p>
              <div className="modal-actions" style={styles.modalActions}>
                <button
                  className="cancel-btn"
                  style={{...styles.cancelBtn, backgroundColor: '#6c757d'}}
                  onClick={() => setShowLogoutModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-btn"
                  style={{...styles.confirmBtn, backgroundColor: '#dc3545', border: 'none', borderRadius: '8px', padding: '10px', color: '#fff'}}
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload CSV Confirmation Modal - Updated Design */}
        {showConfirmModal && (
          <div className="modal-overlay" style={styles.modalOverlay}>
            <div className="modal-content" style={{...styles.modalContent, backgroundColor: '#fff', borderRadius: '10px', padding: '20px', maxWidth: '500px'}}>
              <h3 style={{marginBottom: '15px', color: '#2C3E50'}}>Confirm Import</h3>
              <p style={{marginBottom: '20px', fontSize: '16px'}}>
                Are you sure you want to import <strong>{employeesToUpload.length}</strong> employees?
              </p>
              <div className="modal-actions" style={styles.modalActions}>
                <button
                  className="cancel-btn"
                  style={{...styles.cancelBtn, backgroundColor: '#6c757d'}}
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-btn"
                  style={{...styles.confirmBtn, backgroundColor: '#28a745', border: 'none', borderRadius: '8px', padding: '10px', color: '#fff'}}
                  onClick={confirmUpload}
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Confirmation Modal - Updated Design */}
        {showBulkDeleteModal && (
          <div className="modal-overlay" style={styles.modalOverlay}>
            <div className="modal-content" style={{...styles.modalContent, backgroundColor: '#fff', borderRadius: '10px', padding: '20px', maxWidth: '500px'}}>
              <h3 style={{marginBottom: '15px', color: '#dc3545'}}>Confirm Bulk Deletion</h3>
              <p style={{marginBottom: '20px', fontSize: '16px'}}>
                You are about to permanently delete <strong>{selectedEmployees.length}</strong> employees.
                This action cannot be undone.
              </p>
              <div className="modal-actions" style={styles.modalActions}>
                <button
                  className="cancel-btn"
                  style={{...styles.cancelBtn, backgroundColor: '#6c757d'}}
                  onClick={() => setShowBulkDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-btn"
                  style={{...styles.confirmBtn, backgroundColor: '#dc3545', border: 'none', borderRadius: '8px', padding: '10px', color: '#fff'}}
                  onClick={() => {
                    setShowBulkDeleteModal(false);
                    handleBulkDelete();
                  }}
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Set Inactive Modal - Updated Design */}
        {showInactiveModal && employeeToInactivate && (
          <div className="modal-overlay" style={styles.modalOverlay}>
            <div className="modal-content" style={{...styles.modalContent, backgroundColor: '#fff', borderRadius: '10px', padding: '20px', maxWidth: '500px'}}>
              <h3 style={{marginBottom: '15px', color: '#d35400'}}>Set Employee as Inactive</h3>
              
              <p style={{marginBottom: '15px', fontSize: '16px'}}>
                Set <strong>{employeeToInactivate?.full_name}</strong> as inactive?
              </p>
              
              <div style={{marginBottom: '20px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '500', textAlign: 'left'}}>
                  Reason for Inactive Status:
                </label>
                <select
                  value={inactiveReason}
                  onChange={(e) => setInactiveReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                    backgroundColor: '#fff'
                  }}
                >
                  <option value="">Select a reason</option>
                  {inactiveReasons.map((reason, index) => (
                    <option key={index} value={reason}>{reason}</option>
                  ))}
                </select>
                {!inactiveReason && (
                  <p style={{color: '#e74c3c', fontSize: '12px', textAlign: 'left', marginTop: '5px'}}>
                    Please select a reason
                  </p>
                )}
              </div>
              
              <div className="modal-actions" style={styles.modalActions}>
                <button 
                  className="cancel-btn"
                  style={{...styles.cancelBtn, backgroundColor: '#6c757d'}}
                  onClick={() => {
                    setShowInactiveModal(false);
                    setEmployeeToInactivate(null);
                    setInactiveReason('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-btn"
                  onClick={confirmSetInactive} 
                  disabled={!inactiveReason}
                  style={{
                    ...styles.confirmBtn,
                    backgroundColor: inactiveReason ? '#d35400' : '#ccc',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#fff',
                    cursor: inactiveReason ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold'
                  }}
                >
                  Set as Inactive
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Inactive Employee Confirmation Modal */}
        {showDeleteConfirmModal && employeeToDeletePermanently && (
          <div className="modal-overlay" style={styles.modalOverlay}>
            <div className="modal-content" style={{...styles.modalContent, backgroundColor: '#fff', borderRadius: '10px', padding: '20px', maxWidth: '500px'}}>
              <h3 style={{marginBottom: '15px', color: '#dc3545'}}>Permanently Delete Employee</h3>
              <p style={{marginBottom: '20px', fontSize: '16px'}}>
                Are you sure you want to PERMANENTLY delete <strong>{employeeToDeletePermanently.first_name} {employeeToDeletePermanently.last_name}</strong>? 
                This action cannot be undone.
              </p>
              <div className="modal-actions" style={styles.modalActions}>
                <button
                  className="cancel-btn"
                  style={{...styles.cancelBtn, backgroundColor: '#6c757d'}}
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setEmployeeToDeletePermanently(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="confirm-btn"
                  style={{...styles.confirmBtn, backgroundColor: '#dc3545', border: 'none', borderRadius: '8px', padding: '10px', color: '#fff'}}
                  onClick={confirmPermanentDelete}
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reactivate Modal - Keep as is */}
        {showReactivateModal && employeeToReactivate && (
          <div className="modal-overlay" style={styles.modalOverlay}>
            <div className="modal-content" style={{...styles.modalContent, backgroundColor: '#fff', borderRadius: '10px', padding: '20px', maxWidth: '500px'}}>
              <h3 style={{marginBottom: '15px', color: '#009205'}}>Reactivate Employee</h3>
              <p style={{marginBottom: '20px', fontSize: '16px'}}>
                Are you sure you want to reactivate <strong>{employeeToReactivate.first_name} {employeeToReactivate.last_name}</strong>? 
                This will restore their access to the system.
              </p>
              <div className="modal-actions" style={styles.modalActions}>
                <button
                  className="cancel-btn"
                  style={{...styles.cancelBtn, backgroundColor: '#6c757d'}}
                  onClick={() => {
                    setShowReactivateModal(false);
                    setEmployeeToReactivate(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="confirm-btn"
                  style={{...styles.confirmBtn, backgroundColor: '#009205', border: 'none', borderRadius: '8px', padding: '10px', color: '#fff'}}
                  onClick={confirmReactivate}
                >
                  Activate
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="view-buttons" style={styles.buttons}>
          <button 
            className={`view-btn ${view === 'list' ? 'active' : ''}`}
            style={view === 'list' ? styles.btn1 : styles.btn}
            onClick={() => setView('list')}
          >
            Manage Employees
          </button>
          <button 
            className={`view-btn ${view === 'directory' ? 'active' : ''}`}
            style={view === 'directory' ? styles.btn1 : styles.btn}
            onClick={() => setView('directory')}
          >
            Directory
          </button>
           <button 
            className={`view-btn ${view === 'signatures' ? 'active' : ''}`}
            style={view === 'signatures' ? styles.btn1 : styles.btn}
            onClick={() => setView('signatures')}
          >
            Signature Management
          </button>
          <button 
            className={`view-btn ${view === 'inactive' ? 'active' : ''}`}
            style={view === 'inactive' ? styles.btn1 : styles.btn}
            onClick={() => setView('inactive')}
          >
            Inactive Employees
          </button>
        </div>

        {view === 'list' && (
          <div className="list-view" style={styles.content1}>
            <div className="filters-row" style={styles.firstRow}>

                {/* Search Input */}
                <div className="search-filters" style={{...styles.row1, display: 'flex', flexDirection: 'row', gap: '10px'}}>
                  <input
                    type="text"
                    placeholder="Search by name, email, or position..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    style={{ ...styles.searchInput, width: '300px' }}
                  />

                  {/* Department Filter - only show if user has permission */}
                  {canFilterAllDepartments() && (
                    <select
                      value={filterDepartment}
                      onChange={(e) => setFilterDepartment(e.target.value)}
                      className="department-filter"
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc', width: '200px' }}
                    >
                      <option value="">All Departments</option>
                      {departments.map((dept, idx) => (
                        <option key={idx} value={dept}>{dept}</option>
                      ))}
                    </select>
                  )}

                  {/* For department heads, show their department as fixed (no dropdown) */}
                  {role === "office_head" && (
                    <div style={{
                       padding: '6px 10px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        backgroundColor: '#ffffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '500',
                        fontSize: '12px',
                    }}>
                      {userDepartment || 'My Department'}
                    </div>
                  )}

                  {/* Employment Status Filter */}
                  <select
                    value={filterEmploymentStatus}
                    onChange={(e) => setFilterEmploymentStatus(e.target.value)}
                    className="employment-status-filter"
                    style={{ ...styles.filterDropdown, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc'}}
                  >
                    <option value="">All Employment Status</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Contractual">Contractual</option>
                    <option value="Permanent">Permanent</option>
                    <option value="Casual">Casual</option>
                    <option value="Job Order">Job Order</option>
                    <option value="Coterminous">Coterminous</option>
                  </select>
                </div>

                <div className="action-buttons" style={styles.row1}>
                  {canImportCSV() && (
                    <button className="import-btn" style={styles.importBtn} onClick={handleButtonClick}>
                      <FontAwesomeIcon icon={faDownload} className="import-icon" style={styles.iconImport} />
                      Import CSV
                    </button>
                  )}

                  {canUploadBalances() && (
                    <button 
                      className="upload-balances-btn" 
                      style={styles.uploadBalancesBtn} 
                      onClick={() => setShowUploadBalancesModal(true)}
                    >
                      <FontAwesomeIcon icon={faUpload} className="upload-icon" style={styles.iconUpload} />
                      Upload Balances
                    </button>
                  )}

                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    ref={fileInputRef}
                    onChange={handleCSVUpload}
                    className="file-input"
                    style={{ display: 'none' }}
                  />

                  {canAddEmployees() && (
                    <button className="add-employee-btn" style={styles.btnAddEmployee} onClick={() => setShowAddModal(true)}>
                      <FontAwesomeIcon icon={faPlus} className="add-icon" style={styles.btnIconAdd} />
                      Add Employee
                    </button>
                  )}

                  {selectedEmployees.length > 0 && role !== "mayor" && (
                    <button
                      className="bulk-delete-btn"
                      onClick={() => setShowBulkDeleteModal(true)}
                      style={{
                        background: 'linear-gradient(135deg, #e63946, #d62828)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '5px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                        transition: 'all 0.2s ease-in-out',
                        marginLeft: '10px',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                      onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      <span>Delete Selected ({selectedEmployees.length})</span>
                    </button>
                  )}
                </div>

            </div>

            <div className="table-container" style={styles.tableContainer}>
              <div className="table-wrapper" style={styles.table}>
                <table className="employee-table" style={styles.employeeTable}>
                  <thead>
                    <tr>
                      {role !== "mayor" && (
                        <th className="column-checkbox" style={styles.columnName}>
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="select-all-checkbox"
                            style={styles.checkbox}
                          />
                        </th>
                      )}
                      <th className="column-number" style={styles.columnName}>No.</th>
                      <th className="column-id" style={styles.columnName}>ID Number</th>
                      <th className="column-name" style={styles.columnName}>Name</th>
                      <th className="column-position" style={styles.columnName}>Position</th>
                      <th className="column-department" style={styles.columnName}>Department</th>
                      <th className="column-employment-status" style={styles.columnName}>Status of Employment</th>
                      <th className="column-signature" style={styles.columnName}>E-Signature</th>
                      <th className="column-actions" style={styles.columnName}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees
                        .slice((currentPage - 1) * listEmployeePerPage, currentPage * listEmployeePerPage)
                        .map((record, index) => (
                          <tr key={record.id} className="employee-row">
                            {role !== "mayor" && (
                              <td className="row-checkbox" style={styles.rowName}>
                                <input
                                  type="checkbox"
                                  checked={selectedEmployees.includes(record.id)}
                                  onChange={() => handleSelectEmployee(record.id)}
                                  className="employee-checkbox"
                                  style={styles.checkbox}
                                />
                              </td>
                            )}
                            <td className="row-number" style={styles.rowName}>{index + 1 + (currentPage - 1) * listEmployeePerPage}</td>
                            <td className="row-id" style={styles.rowName}>{record.id_number || '—'}</td>
                            <td className="row-name" style={styles.rowName}>{`${record.first_name || ''} ${record.last_name || ''}`.trim()}</td>
                            <td className="row-position" style={styles.rowName}>{record.position}</td>
                            <td className="row-department" style={{ 
                              ...styles.rowName, 
                              maxWidth: '220px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {record.department || '—'}
                            </td>
                            <td className="row-employment-status" style={styles.rowName}>{record.employment_status}</td>
                            <td className="row-signature" style={styles.rowName}>
                              {employeeSignatures[record.id] ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{
                                    width: '24px',
                                    height: '24px',
                                    backgroundColor: '#28a745',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}>
                                    <FontAwesomeIcon icon={faCheck} style={{ color: 'white', fontSize: '12px' }} />
                                  </div>
                                  <span style={{ fontSize: '12px', color: '#28a745' }}>Uploaded</span>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                  <div style={{
                                    width: '24px',
                                    height: '24px',
                                    backgroundColor: '#dc3545',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0 // Prevents the icon from shrinking
                                  }}>
                                    <FontAwesomeIcon icon={faTimes} style={{ color: 'white', fontSize: '12px' }} />
                                  </div>
                                  <span style={{
                                    fontSize: '12px',
                                    color: '#dc3545',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    width: '60px' // Important for flexbox text truncation
                                  }}>No Signature Attached</span>
                                </div>

                              )}
                            </td>
                            <td className="row-actions" style={styles.rowName}>
                              <button className="view-btn" style={styles.viewBtn} onClick={() => handleViewClick(record)}>
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              {canPerformActions(record.department) && (
                                <>
                                  <button 
                                    className="signature-btn" 
                                    style={{
                                      ...styles.viewBtn,
                                      backgroundColor: '#17a2b8',
                                      color: 'white',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      marginLeft: '5px',
                                      fontSize: '12px'
                                    }}
                                    onClick={() => handleSignatureClick(record)}
                                  >
                                    <FontAwesomeIcon icon={faSignature} /> Signature
                                  </button>
                                  <button className="edit-btn" style={styles.editBtn} onClick={() => handleEditClick(record)}>
                                    <FontAwesomeIcon icon={faPenToSquare} />
                                  </button>
                                  <button className="delete-btn" style={styles.delBtn} onClick={() => handleDeleteClick(record)}>
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={role !== "mayor" ? "8" : "7"} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                          No active employees found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
               {/* Pagination for Manage Employees */}
{filteredEmployees.length > 0 && (
  <div className="pagination-container" style={{
    ...styles.paginationContainer,
    position: 'static',
    transform: 'none',
    left: 'auto',
    marginTop: '20px',
    justifyContent: 'center'
  }}>
    {/* Previous Button */}
    <button
      className="page-btn prev-btn"
      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
      style={styles.pageBtn}
      disabled={currentPage === 1}
    >
      {'<'}
    </button>

    {/* First page + ellipsis if needed */}
    {getPaginationRange(currentPage, totalPages)[0] > 1 && (
      <>
        <button 
          className="page-btn" 
          onClick={() => setCurrentPage(1)} 
          style={styles.pageBtn}
        >
          1
        </button>
        {getPaginationRange(currentPage, totalPages)[0] > 2 && (
          <span className="pagination-ellipsis" style={{ padding: '0 8px' }}>…</span>
        )}
      </>
    )}

    {/* Visible page numbers */}
    {getPaginationRange(currentPage, totalPages).map((page) => (
      <button
        key={page}
        className={`page-btn ${currentPage === page ? 'active' : ''}`}
        onClick={() => setCurrentPage(page)}
        style={{
          ...styles.pageBtn,
          ...(currentPage === page ? styles.activePageBtn : {}),
        }}
      >
        {page}
      </button>
    ))}

    {/* Last page + ellipsis if needed */}
    {getPaginationRange(currentPage, totalPages).slice(-1)[0] < totalPages && (
      <>
        {getPaginationRange(currentPage, totalPages).slice(-1)[0] < totalPages - 1 && (
          <span className="pagination-ellipsis" style={{ padding: '0 8px' }}>…</span>
        )}
        <button 
          className="page-btn" 
          onClick={() => setCurrentPage(totalPages)} 
          style={styles.pageBtn}
        >
          {totalPages}
        </button>
      </>
    )}

    {/* Next Button */}
    <button
      className="page-btn next-btn"
      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
      style={styles.pageBtn}
      disabled={currentPage === totalPages}
    >
      {'>'}
    </button>
  </div>
)}
                
              </div>
            </div>

            {showSignatureModal && selectedSignatureEmployee && renderSignatureModal()}


            {showUploadBalancesModal && (
              <div className="modal-overlay" style={styles.modalOverlay}>
                <div className="modal-content" style={{...styles.modalContent, maxWidth: '500px', backgroundColor: '#fff', padding: '25px', borderRadius: '10px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                    <h3 style={{ margin: 0, color: '#2C3E50' }}>Upload Leave Balances</h3>
                    <button
                      onClick={() => {
                        setShowUploadBalancesModal(false);
                        setSelectedBalancesFile(null);
                        setUploadBalancesResult(null);
                        setUploadBalancesProgress(0);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        color: '#666'
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                  
                  <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    marginBottom: '15px',
                    border: '1px dashed #dee2e6'
                  }}>
                    <p style={{ fontSize: "14px", color: "#495057", margin: "0 0 10px 0" }}>
                      <strong>File Requirements:</strong>
                    </p>
                    <ul style={{ fontSize: "12px", color: "#6c757d", margin: 0, paddingLeft: '15px' }}>
                      <li>Excel format (.xlsx, .xls) only</li>
                      <li>Must match the leave card template structure</li>
                      <li>Include employee ID numbers for matching</li>
                      <li>First row should contain column headers</li>
                    </ul>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#495057' }}>
                      Select Excel File:
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setSelectedBalancesFile(file);
                        setUploadBalancesResult(null);
                        setUploadBalancesProgress(0);
                      }}
                      style={{ 
                        width: '100%', 
                        padding: '8px', 
                        border: '1px solid #ced4da', 
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      disabled={uploadingBalances}
                    />
                    {selectedBalancesFile && (
                      <p style={{ fontSize: "12px", color: "#28a745", margin: "5px 0 0 0" }}>
                        ✅ Selected: {selectedBalancesFile.name}
                      </p>
                    )}
                  </div>

                  {uploadingBalances && (
                    <div style={{ marginBottom: "15px" }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '5px',
                        fontSize: '14px',
                        color: '#495057'
                      }}>
                        <span>Uploading...</span>
                        <span>{uploadBalancesProgress}%</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${uploadBalancesProgress}%`,
                          height: '100%',
                          backgroundColor: '#28a745',
                          transition: 'width 0.3s ease',
                          borderRadius: '4px'
                        }} />
                      </div>
                    </div>
                  )}

                  {uploadBalancesResult && (
                    <div style={{ 
                      marginTop: "15px", 
                      padding: "12px", 
                      backgroundColor: uploadBalancesResult.error ? "#f8d7da" : "#d1ecf1", 
                      borderRadius: "6px",
                      border: `1px solid ${uploadBalancesResult.error ? "#f5c6cb" : "#bee5eb"}`
                    }}>
                      {uploadBalancesResult.error ? (
                        <div>
                          <p style={{ margin: "0 0 8px 0", color: "#721c24", fontWeight: "500" }}>
                            ❌ Upload Failed
                          </p>
                          <p style={{ margin: 0, fontSize: "13px", color: "#721c24" }}>
                            {uploadBalancesResult.error}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p style={{ margin: "0 0 8px 0", color: "#0c5460", fontWeight: "500" }}>
                            ✅ Upload Complete
                          </p>
                          <div style={{ fontSize: "13px", color: "#0c5460" }}>
                            <p style={{ margin: "2px 0" }}>
                              <strong>Successfully processed:</strong> {uploadBalancesResult.inserted || 0} records
                            </p>
                            <p style={{ margin: "2px 0" }}>
                              <strong>Skipped (no matching employee):</strong> {uploadBalancesResult.skipped || 0}
                            </p>
                            {uploadBalancesResult.errors && uploadBalancesResult.errors.length > 0 && (
                              <div style={{ marginTop: '8px' }}>
                                <p style={{ margin: "5px 0", fontWeight: "500" }}>Errors encountered:</p>
                                <ul style={{ 
                                  margin: "5px 0", 
                                  paddingLeft: '15px',
                                  fontSize: '12px',
                                  maxHeight: '100px',
                                  overflowY: 'auto'
                                }}>
                                  {uploadBalancesResult.errors.slice(0, 5).map((error, index) => (
                                    <li key={index}>{error}</li>
                                  ))}
                                  {uploadBalancesResult.errors.length > 5 && (
                                    <li>... and {uploadBalancesResult.errors.length - 5} more errors</li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button
                      style={{
                        ...styles.closeModalButton,
                        backgroundColor: '#6c757d'
                      }}
                      onClick={() => {
                        setShowUploadBalancesModal(false);
                        setSelectedBalancesFile(null);
                        setUploadBalancesResult(null);
                        setUploadBalancesProgress(0);
                      }}
                      disabled={uploadingBalances}
                    >
                      Cancel
                    </button>
                    <button
                      style={{
                        ...styles.uploadConfirmButton,
                        opacity: (!selectedBalancesFile || uploadingBalances) ? 0.6 : 1,
                        cursor: (!selectedBalancesFile || uploadingBalances) ? 'not-allowed' : 'pointer'
                      }}
                      onClick={handleBalancesUpload}
                      disabled={!selectedBalancesFile || uploadingBalances}
                    >
                      {uploadingBalances ? (
                        <>
                          <FontAwesomeIcon icon={faCircle} spin style={{ marginRight: '5px' }} />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faUpload} style={{ marginRight: '5px' }} />
                          Upload Balances
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showViewModal && selectedEmployee && (
              <div className="right-modal-overlay" style={styles.rightModalOverlay} onClick={() => setShowViewModal(false)}>
                <div
                  className="right-modal-card"
                  style={styles.rightModalCard}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="right-modal-header" style={styles.rightModalHeader}>
                    <h2 className="view-modal-header" style={styles.viewModalHeader}>Employee Details</h2>
                    <FontAwesomeIcon
                      icon={faTimes}
                      className="close-icon"
                      style={styles.closeIcon}
                      onClick={() => setShowViewModal(false)}
                    />
                  </div>

                  {/* Top Profile Section */}
                  <div className="top-section" style={styles.topSection}>
                    {selectedEmployee?.profile_picture ? (
                      <img
                        src={selectedEmployee.profile_picture}
                        alt="Profile"
                        className="profile-image"
                        style={styles.profileImage}
                      />
                    ) : (
                      <div className="default-avatar" style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: '50%',
                        backgroundColor: '#ddd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <FontAwesomeIcon icon={faUser} size="3x" color="#888" />
                      </div>
                    )}
                    <div className="profile-text" style={styles.profileText}>
                      <h3 className="employee-name" style={styles.employeeName}>
                        {selectedEmployee.full_name?.trim() || `${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`.trim()}
                      </h3>
                      <p className="employee-id" style={styles.employeeID}>ID: {selectedEmployee.id_number}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="details-container" style={styles.detailsContainer}>
                    <div className="detail-card" style={styles.detailCard}>
                      <h4 className="detail-header" style={styles.detailHeader}>Contact Information</h4>
                      <div className="two-column-grid" style={styles.twoColumnGrid}>
                        <div className="detail-item">
                          <label>Email</label>
                          <p>{selectedEmployee.email}</p>
                        </div>
                        <div className="detail-item">
                          <label>Contact Number</label>
                          <p>{selectedEmployee.contact_number}</p>
                        </div>
                      </div>
                    </div>

                    <div className="detail-card" style={styles.detailCard}>
                      <h4 className="detail-header" style={styles.detailHeader}>Employment Details</h4>
                      <div className="two-column-grid" style={styles.twoColumnGrid}>
                        <div className="detail-item">
                          <label>Department</label>
                          <p>{selectedEmployee.department}</p>
                        </div>
                        <div className="detail-item">
                          <label>Employment Status</label>
                          <p>{selectedEmployee.employment_status}</p>
                        </div>
                        <div className="detail-item">
                          <label>Date Hired</label>
                          <p>{new Date(selectedEmployee.date_hired).toLocaleDateString()}</p>
                        </div>
                        {/* Show contract dates only for non-permanent employees */}
                        {selectedEmployee.employment_status !== 'Permanent' && (
                          <>
                            <div className="detail-item">
                              <label>Contract Start</label>
                              <p>
                                {selectedEmployee.contract_start_date 
                                  ? new Date(selectedEmployee.contract_start_date).toLocaleDateString() 
                                  : 'N/A'}
                              </p>
                            </div>
                            <div className="detail-item">
                              <label>Contract End</label>
                              <p>
                                {selectedEmployee.contract_end_date 
                                  ? new Date(selectedEmployee.contract_end_date).toLocaleDateString() 
                                  : 'N/A'}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="detail-card" style={styles.detailCard}>
                      <h4 className="detail-header" style={styles.detailHeader}>Personal Information</h4>
                      <div className="two-column-grid" style={styles.twoColumnGrid}>
                        <div className="detail-item">
                          <label>Gender</label>
                          <p>{selectedEmployee.gender}</p>
                        </div>
                        <div className="detail-item">
                          <label>Civil Status</label>
                          <p>{selectedEmployee.civil_status}</p>
                        </div>
                        <div className="detail-item">
                          <label>Status</label>
                          <p>{selectedEmployee.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showEditModal && employeesToEdit && (
              <div className="modal-overlay" style={styles.modalOverlay}>
                <div className="modal-container" style={styles.modalContainer}>
                  <h3 className="modal-title" style={styles.modalTitle}>Edit Employee Information</h3>
                  <p className="modal-subtitle" style={styles.modalSubtitle}>
                    Update the necessary details below and click <strong>Save</strong> to apply changes.
                  </p>

                  <div className="modal-grid" style={styles.modalGrid}>
                    <input
                      placeholder="First Name"
                      className="modal-input"
                      style={styles.modalInput}
                      value={employeesToEdit.first_name || ''}
                      onChange={(e) =>
                        setEmployeesToEdit({ 
                          ...employeesToEdit, 
                          first_name: e.target.value.replace(/[^A-Za-z\s\-']/g, "") 
                        })
                      }
                    />

                    <input
                      placeholder="Last Name"
                      className="modal-input"
                      style={styles.modalInput}
                      value={employeesToEdit.last_name || ''}
                      onChange={(e) =>
                        setEmployeesToEdit({ 
                          ...employeesToEdit, 
                          last_name: e.target.value.replace(/[^A-Za-z\s\-']/g, "") 
                        })
                      }
                    />

                    {/* Email */}
                    <input
                      placeholder="Email"
                      className="modal-input"
                      style={styles.modalInput}
                      value={employeesToEdit.email || ''}
                      onChange={(e) =>
                        setEmployeesToEdit({ ...employeesToEdit, email: e.target.value })
                      }
                    />

                    {/* Position */}
                    <input
                      placeholder="Position"
                      className="modal-input"
                      style={styles.modalInput}
                      value={employeesToEdit.position || ''}
                      onChange={(e) =>
                        setEmployeesToEdit({ ...employeesToEdit, position: e.target.value.replace(/[0-9]/g, "") })
                      }
                    />

                    {/* ID Number */}
                    <input
                      placeholder="ID Number"
                      className="modal-input"
                      style={styles.modalInput}
                      value={employeesToEdit.id_number || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d{0,8}$/.test(value)) setEmployeesToEdit({ ...employeesToEdit, id_number: value });
                      }}
                    />

                    {/* Contact Number */}
                    <input
                      placeholder="Contact Number"
                      className="modal-input"
                      style={styles.modalInput}
                      value={employeesToEdit.contact_number || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d{0,11}$/.test(value)) setEmployeesToEdit({ ...employeesToEdit, contact_number: value });
                      }}
                    />

                    {/* Gender */}
                    <div className="gender-section" style={{ gridColumn: '1 / -1' }}>
                      <label className="input-label" style={styles.label}>Gender</label>
                      <div className="gender-container" style={styles.genderContainer}>
                        {['Male', 'Female'].map((g) => (
                          <div
                            key={g}
                            className={`gender-btn ${employeesToEdit.gender === g ? 'active' : ''}`}
                            style={{
                              ...styles.genderBtn,
                              ...(employeesToEdit.gender === g ? styles.genderBtnActive : {}),
                            }}
                            onClick={() => setEmployeesToEdit({ ...employeesToEdit, gender: g })}
                          >
                            {g}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Civil Status */}
                    <select
                      className="select-input"
                      style={styles.selectInput}
                      value={employeesToEdit.civil_status || ""}
                      onChange={(e) => setEmployeesToEdit({ ...employeesToEdit, civil_status: e.target.value })}
                    >
                      <option value="">Select Civil Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                      <option value="Annulled">Annulled</option>
                    </select>

                    {/* Department */}
                    <select
                      className="select-input"
                      style={styles.selectInput}
                      value={employeesToEdit.department || ""}
                      onChange={(e) => setEmployeesToEdit({ ...employeesToEdit, department: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept, idx) => (
                        <option key={idx} value={dept}>{dept}</option>
                      ))}
                    </select>

                    {/* Employment Type */}
                    <div className="employment-type-section" style={{ gridColumn: '1 / -1' }}>
                      <label className="input-label" style={styles.label}>Employment Type</label>
                      <div className="employment-type-container" style={styles.genderContainer}>
                        {['Temporary', 'Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous'].map((type) => (
                          <div
                            key={type}
                            className={`employment-type-btn ${employeesToEdit.employment_status === type ? 'active' : ''}`}
                            style={{
                              ...styles.genderBtn,
                              ...(employeesToEdit.employment_status === type ? styles.genderBtnActive : {}),
                            }}
                            onClick={() => setEmployeesToEdit({ ...employeesToEdit, employment_status: type })}
                          >
                            {type}
                          </div>
                        ))}
                      </div>
                    </div>

                    <input
                      placeholder="Select date hired"
                      type="text"
                      onFocus={(e) => (e.target.type = "date")}
                      onBlur={(e) => {
                        if (!e.target.value) e.target.type = "text";
                      }}
                      className="modal-input"
                      style={styles.modalInput}
                      value={employeesToEdit.date_hired || ""}
                      onChange={(e) =>
                        setEmployeesToEdit({
                          ...employeesToEdit,
                          date_hired: e.target.value,
                        })
                      }
                      max={new Date().toISOString().split("T")[0]}
                    />

                    {shouldShowContractDates(employeesToEdit.employment_status) && (
                      <input
                        placeholder="Contract Start Date"
                        type="text"
                        onFocus={(e) => (e.target.type = "date")}
                        onBlur={(e) => {
                          if (!e.target.value) e.target.type = "text";
                        }}
                        className="modal-input"
                        style={styles.modalInput}
                        value={employeesToEdit.contract_start_date || ""}
                        min={employeesToEdit.date_hired || undefined}
                        disabled={!employeesToEdit.date_hired}
                        onChange={(e) =>
                          setEmployeesToEdit({
                            ...employeesToEdit,
                            contract_start_date: e.target.value,
                            contract_end_date: "", // reset end date if start changes
                          })
                        }
                      />
                    )}

                    {shouldShowContractDates(employeesToEdit.employment_status) && (
                      <input
                        placeholder="Contract End Date"
                        type="text"
                        onFocus={(e) => (e.target.type = "date")}
                        onBlur={(e) => {
                          if (!e.target.value) e.target.type = "text";
                        }}
                        className="modal-input"
                        style={styles.modalInput}
                        value={employeesToEdit.contract_end_date || ""}
                        min={employeesToEdit.contract_start_date || undefined}
                        disabled={!employeesToEdit.contract_start_date}
                        onChange={(e) =>
                          setEmployeesToEdit({
                            ...employeesToEdit,
                            contract_end_date: e.target.value,
                          })
                        }
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="modal-actions" style={styles.modalActions}>
                    <button className="cancel-btn" style={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
                    <button className="save-btn" style={styles.saveBtn} onClick={handleEditSave}>Save</button>
                  </div>
                </div>
              </div>
            )}

            {showAddModal && (
              <div className="modal-overlay" style={styles.modalOverlay}>
                <div className="modal-container" style={styles.modalContainer}>
                  <h3 className="modal-title" style={styles.modalTitle}>Add New Employee</h3>
                    <p className="modal-subtitle" style={styles.modalSubtitle}>
                      Fill out the details below to add a new employee record.
                    </p>

                  <div className="modal-grid" style={styles.modalGrid}>
                    <input
                      placeholder="First Name"
                      className="modal-input"
                      style={styles.modalInput}
                      value={newEmployee.first_name}
                      onChange={(e) => setNewEmployee({ 
                        ...newEmployee, 
                        first_name: e.target.value.replace(/[^A-Za-z\s\-']/g, "") 
                      })}
                    />

                    <input
                      placeholder="Last Name"
                      className="modal-input"
                      style={styles.modalInput}
                      value={newEmployee.last_name}
                      onChange={(e) => setNewEmployee({ 
                        ...newEmployee, 
                        last_name: e.target.value.replace(/[^A-Za-z\s\-']/g, "") 
                      })}
                    />

                    <input
                      placeholder="Email"
                      className="modal-input"
                      style={styles.modalInput}
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    />

                    <input
                      placeholder="Position"
                      className="modal-input"
                      style={styles.modalInput}
                      value={newEmployee.position}
                      onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value.replace(/[0-9]/g, "") })}
                    />

                    <input
                      placeholder="ID Number"
                      className="modal-input"
                      style={styles.modalInput}
                      value={newEmployee.id_number}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d{0,8}$/.test(value)) setNewEmployee({ ...newEmployee, id_number: value });
                      }}
                    />

                    <input
                      placeholder="Contact Number"
                      className="modal-input"
                      style={styles.modalInput}
                      value={newEmployee.contact_number}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d{0,11}$/.test(value)) setNewEmployee({ ...newEmployee, contact_number: value });
                      }}
                    />

                    <div className="gender-section" style={{ gridColumn: '1 / -1' }}>
                      <label className="input-label" style={styles.label}>Gender</label>
                      <div className="gender-container" style={styles.genderContainer}>
                        {['Male', 'Female'].map((g) => (
                          <div
                            key={g}
                            className={`gender-btn ${newEmployee.gender === g ? 'active' : ''}`}
                            style={{
                              ...styles.genderBtn,
                              ...(newEmployee.gender === g ? styles.genderBtnActive : {}),
                            }}
                            onClick={() => setNewEmployee({ ...newEmployee, gender: g })}
                          >
                            {g}
                          </div>
                        ))}
                      </div>
                    </div>

                    <select
                      className="select-input"
                      style={styles.selectInput}
                      value={newEmployee.civil_status}
                      onChange={(e) => setNewEmployee({ ...newEmployee, civil_status: e.target.value })}
                    >
                      <option value="">Select Civil Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                      <option value="Annulled">Annulled</option>
                    </select>

                    <select
                      className="select-input"
                      style={styles.selectInput}
                      value={newEmployee.department}
                      onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept, idx) => (
                        <option key={idx} value={dept}>{dept}</option>
                      ))}
                    </select>

                    <div className="employment-type-section" style={{ gridColumn: '1 / -1' }}>
                      <label className="input-label" style={styles.label}>Employment Type</label>
                      <div className="employment-type-container" style={styles.genderContainer}>
                        {['Temporary', 'Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous'].map((type) => (
                          <div
                            key={type}
                            className={`employment-type-btn ${newEmployee.employment_status === type ? 'active' : ''}`}
                            style={{
                              ...styles.genderBtn,
                              ...(newEmployee.employment_status === type ? styles.genderBtnActive : {}),
                              fontSize: '12px',
                            }}
                            onClick={() => setNewEmployee({ ...newEmployee, employment_status: type })}
                          >
                            {type}
                          </div>
                        ))}
                      </div>
                    </div>

                    
                  
                  </div>

                    <input
                        placeholder="Select date hired"
                        type="text"
                        onFocus={(e) => {
                          e.target.type = 'date';
                        }}
                        onBlur={(e) => {
                          if (!e.target.value) {
                            e.target.type = 'text';
                          }
                        }}
                        className="modal-input"
                        style={styles.modalInput}
                        value={newEmployee.date_hired || ''}
                        onChange={(e) => setNewEmployee({ ...newEmployee, date_hired: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                      />

                         {shouldShowContractDates() && (
                            <input
                              placeholder="Contract Start Date"
                              type="text"
                              onFocus={(e) => (e.target.type = 'date')}
                              onBlur={(e) => {
                                if (!e.target.value) e.target.type = 'text';
                              }}
                              className="modal-input"
                              style={styles.modalInput}
                              value={newEmployee.contract_start_date || ''}
                              min={newEmployee.date_hired || undefined}
                              disabled={!newEmployee.date_hired}
                              onChange={(e) =>
                                setNewEmployee({
                                  ...newEmployee,
                                  contract_start_date: e.target.value,
                                  contract_end_date: '' // reset end date if start changes
                                })
                              }
                            />
                          )}

                          {shouldShowContractDates() && (
                            <input
                              placeholder="Contract End Date"
                              type="text"
                              onFocus={(e) => (e.target.type = 'date')}
                              onBlur={(e) => {
                                if (!e.target.value) e.target.type = 'text';
                              }}
                              className="modal-input"
                              style={styles.modalInput}
                              value={newEmployee.contract_end_date || ''}
                              min={newEmployee.contract_start_date || undefined}
                              disabled={!newEmployee.contract_start_date}
                              onChange={(e) =>
                                setNewEmployee({
                                  ...newEmployee,
                                  contract_end_date: e.target.value
                                })
                              }
                            />
                          )}


                  <div className="modal-actions" style={styles.modalActions}>
                    <button className="cancel-btn" style={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                    <button className="save-btn" style={styles.saveBtn} onClick={handleAddEmployee}>Save</button>
                  </div>
                </div>
              </div>
            )}

            {isDeleting && (
              <div className="loading-overlay" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2000,
                backdropFilter: 'blur(2px)',
              }}>
                <div className="spinner" style={{
                  width: 60,
                  height: 60,
                  border: '6px solid #ccc',
                  borderTop: '6px solid #007bff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                <p className="loading-text" style={{
                  marginTop: 20,
                  fontSize: 18,
                  fontWeight: '500',
                  color: '#333'
                }}>
                  {employeesToUpload.length > 0
                    ? `Importing ${employeesToUpload.length} employees...`
                    : selectedEmployees.length > 1
                      ? 'Deleting selected employees...'
                      : 'Processing...'}
                </p>
                <style>
                  {`@keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }`}
                </style>
              </div>
            )}

          </div>
        )}

        {view === 'directory' && (
          <div className="directory-view" style={styles.directory}>

            <div className="directory-header" style={styles.header1}>
              <div className="search-container">
                <FontAwesomeIcon icon={faSearch} className="search-icon" style={styles.searchIcon} />
                <input
                  placeholder='Search by name, email, or position'
                  className="search-input"
                  style={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="status-filter"
                style={styles.filterStatus}
                value={filterEmploymentStatus}
                onChange={(e) => setFilterEmploymentStatus(e.target.value)}
              >
                <option value="">Filter by Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {canFilterAllDepartments() ? (
                <select
                  className="department-filter"
                  style={styles.filterStatus2}
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                >
                  <option value="">Filter by Department</option>
                  {departments.map((dept, idx) => (
                    <option key={idx} value={dept}>{dept}</option>
                  ))}
                </select>
              ) : (
                <div style={{
                   padding: '6px 10px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    backgroundColor: '#ffffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '500',
                    fontSize: '12px',
                    marginLeft: '10px'
                }}>
                  {userDepartment || 'My Department'}
                </div>
              )}

              <select
                className="employment-type-filter"
                style={styles.filterStatus}
                value={filterEmploymentType}
                onChange={(e) => setFilterEmploymentType(e.target.value)}
              >
                <option value="">Filter by Employment Type</option>
                <option value="temporary">Temporary</option>
                <option value="permanent">Permanent</option>
                <option value="contract">Contract</option>
                <option value="casual">Casual</option>
              </select>
            </div>

            <div className="card-grid" style={styles.cardGrid}>
              {employeeRecord
                .filter(emp => {
                  const search = searchTerm.toLowerCase();
                  const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
                  const email = (emp.email || '').toLowerCase();
                  const position = (emp.position || '').toLowerCase();
                  return fullName.includes(search) || email.includes(search) || position.includes(search);
                })
                .filter(emp => filterDepartment ? (emp.department || '') === filterDepartment : true)
                .filter(emp => filterEmploymentStatus ? (emp.status || '') === filterEmploymentStatus : true)
                .filter(emp => filterEmploymentType ? (emp.employment_status || '').toLowerCase() === filterEmploymentType.toLowerCase() : true)
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map(emp => (
                  <div
                    key={emp.id}
                    className="employee-card"
                    style={{ ...styles.card, cursor: 'pointer' }}
                    onClick={() => navigate(`/employeeProfile/${emp.id}`)}
                  >
                    <div className="avatar-container" style={styles.avatarContainer}>
                      {emp.profile_picture ? (
                        <img src={emp.profile_picture} alt="Profile" className="avatar" style={styles.avatar} />
                      ) : (
                        <div className="default-avatar" style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: '50%',
                          backgroundColor: '#ddd',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <FontAwesomeIcon icon={faUser} size="3x" color="#888" />
                        </div>
                      )}
                    </div>

                    <div className="employee-info" style={styles.info}>
                      <p className="employee-name" style={styles.name}>{`${emp.first_name || ''} ${emp.last_name || ''}`.trim()}</p>
                      <p className="employee-position" style={styles.position}>{emp.position || '—'}</p>
                      <p className="employee-department" style={styles.department}>{emp.department || '—'}</p>
                      <div style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500',
                        backgroundColor: emp.status === 'active' ? '#d4edda' : '#f8d7da',
                        color: emp.status === 'active' ? '#155724' : '#721c24',
                        marginTop: '5px'
                      }}>
                        {emp.status === 'active' ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
              ))}
            </div>

            {/* Pagination for Directory */}
            {employeeRecord.filter(emp => {
              const search = searchTerm.toLowerCase();
              const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
              const email = (emp.email || '').toLowerCase();
              const position = (emp.position || '').toLowerCase();
              return fullName.includes(search) || email.includes(search) || position.includes(search);
            }).length > 0 && (
              <div className="pagination-container" style={{
                ...styles.paginationContainer,
                position: 'static',
                transform: 'none',
                left: 'auto',
                marginTop: '20px',
                justifyContent: 'center'
              }}>
                {/* Previous Button */}
                <button
                  className="page-btn prev-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  style={styles.pageBtn}
                  disabled={currentPage === 1}
                >
                  {'<'}
                </button>

                {/* First page + ellipsis if needed */}
                {getPaginationRange(currentPage, totalPages)[0] > 1 && (
                  <>
                    <button 
                      className="page-btn" 
                      onClick={() => setCurrentPage(1)} 
                      style={styles.pageBtn}
                    >
                      1
                    </button>
                    {getPaginationRange(currentPage, totalPages)[0] > 2 && (
                      <span className="pagination-ellipsis" style={{ padding: '0 8px' }}>…</span>
                    )}
                  </>
                )}

                {/* Visible page numbers */}
                {getPaginationRange(currentPage, totalPages).map((page) => (
                  <button
                    key={page}
                    className={`page-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      ...styles.pageBtn,
                      ...(currentPage === page ? styles.activePageBtn : {}),
                    }}
                  >
                    {page}
                  </button>
                ))}

                {/* Last page + ellipsis if needed */}
                {getPaginationRange(currentPage, totalPages).slice(-1)[0] < totalPages && (
                  <>
                    {getPaginationRange(currentPage, totalPages).slice(-1)[0] < totalPages - 1 && (
                      <span className="pagination-ellipsis" style={{ padding: '0 8px' }}>…</span>
                    )}
                    <button 
                      className="page-btn" 
                      onClick={() => setCurrentPage(totalPages)} 
                      style={styles.pageBtn}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                {/* Next Button */}
                <button
                  className="page-btn next-btn"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  style={styles.pageBtn}
                  disabled={currentPage === totalPages}
                >
                  {'>'}
                </button>
              </div>
            )}

          </div>
        )}

          {view === 'inactive' && (
          <div className="inactive-view" style={styles.content1}>
            <div className="filters-row" style={styles.firstRow}>
              {/* Search Input */}
              <div className="search-filters" style={{...styles.row1, display: 'flex', flexDirection: 'row', gap: '10px'}}>
                <input
                  type="text"
                  placeholder="Search inactive employees by name, email, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                  style={{ ...styles.searchInput, width: '300px' }}
                />

                {/* Department Filter */}
                {canFilterAllDepartments() ? (
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="department-filter"
                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc', width: '200px' }}
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept, idx) => (
                      <option key={idx} value={dept}>{dept}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    backgroundColor: '#ffffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '500',
                    fontSize: '12px'
                  }}>
                    {userDepartment || 'My Department'}
                  </div>
                )}

                {/* Employment Status Filter */}
                <select
                  value={filterEmploymentStatus}
                  onChange={(e) => setFilterEmploymentStatus(e.target.value)}
                  className="employment-status-filter"
                  style={{ ...styles.filterDropdown, padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc'}}
                >
                  <option value="">All Employment Status</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Contractual">Contractual</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Casual">Casual</option>
                  <option value="Job Order">Job Order</option>
                  <option value="Coterminous">Coterminous</option>
                </select>
              </div>
            </div>

            <div className="table-container" style={styles.tableContainer}>
              <div className="table-wrapper" style={styles.table}>
                <table className="employee-table" style={styles.employeeTable}>
                  <thead>
                    <tr>
                      <th className="column-number" style={styles.columnName}>No.</th>
                      <th className="column-id" style={styles.columnName}>ID Number</th>
                      <th className="column-name" style={styles.columnName}>Name</th>
                      <th className="column-position" style={styles.columnName}>Position</th>
                      <th className="column-department" style={styles.columnName}>Department</th>
                      <th className="column-employment-status" style={styles.columnName}>Status of Employment</th>
                      <th className="column-reason" style={styles.columnName}>Reason</th> {/* NEW COLUMN */}
                      <th className="column-status" style={styles.columnName}>Account Status</th>
                      <th className="column-actions" style={styles.columnName}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactiveEmployees.length > 0 ? (
                      inactiveEmployees
                        .slice((currentInactivePage - 1) * listEmployeePerPage, currentInactivePage * listEmployeePerPage)
                        .map((record, index) => (
                          <tr key={record.id} className="employee-row" style={{ opacity: 0.9 }}>
                            <td className="row-number" style={styles.rowName}>
                              {index + 1 + (currentInactivePage - 1) * listEmployeePerPage}
                            </td>
                            <td className="row-id" style={styles.rowName}>{record.id_number || '—'}</td>
                            <td className="row-name" style={styles.rowName}>
                              {`${record.first_name || ''} ${record.last_name || ''}`.trim()}
                            </td>
                            <td className="row-position" style={styles.rowName}>{record.position}</td>
                            <td className="row-department" style={{ 
                              ...styles.rowName, 
                              maxWidth: '220px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {record.department || '—'}
                            </td>
                            <td className="row-employment-status" style={styles.rowName}>{record.employment_status}</td>
                            
                            {/* NEW: Reason column */}
                            <td className="row-reason" style={styles.rowName}>
                              <div style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: record.inactive_reason ? '#fff3cd' : '#f8d7da',
                                color: record.inactive_reason ? '#856404' : '#721c24',
                                fontSize: '12px',
                                fontWeight: '500',
                                border: record.inactive_reason ? '1px solid #ffeaa7' : '1px solid #f5c6cb',
                                maxWidth: '150px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {record.inactive_reason || 'No reason specified'}
                              </div>
                            </td>
                            
                            <td className="row-status" style={styles.rowName}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: '#f8d7da',
                                color: '#721c24'
                              }}>
                                Inactive
                              </span>
                            </td>
                            <td className="row-actions" style={styles.rowName}>
                              {canPerformActions(record.department) && (
                                <>
                                  <button 
                                    className="reactivate-btn" 
                                    style={{
                                      ...styles.viewBtn,
                                      backgroundColor: '#28a745',
                                      color: 'white',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      marginLeft: '5px',
                                      fontSize: '12px'
                                    }}
                                    onClick={() => handleReactivateClick(record)}
                                  >
                                    <FontAwesomeIcon icon={faRedo} /> Activate
                                  </button>
                                  <button 
                                    className="delete-inactive-btn" 
                                    style={{
                                      backgroundColor: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      marginLeft: '5px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                    onClick={() => handleDeleteInactive(record)}
                                  >
                                    <FontAwesomeIcon icon={faTrash} /> Delete
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                          No inactive employees found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination for inactive employees */}
                {inactiveEmployees.length > 0 && (
                  <div className="pagination-container" style={styles.paginationContainer}>
                    {/* Previous Button */}
                    <button
                      className="page-btn prev-btn"
                      onClick={() => setCurrentInactivePage(prev => Math.max(prev - 1, 1))}
                      style={styles.pageBtn}
                      disabled={currentInactivePage === 1}
                    >
                      {'<'}
                    </button>

                    {/* First page + ellipsis if needed */}
                    {getPaginationRange(currentInactivePage, totalInactivePages)[0] > 1 && (
                      <>
                        <button 
                          className="page-btn" 
                          onClick={() => setCurrentInactivePage(1)} 
                          style={styles.pageBtn}
                        >
                          1
                        </button>
                        {getPaginationRange(currentInactivePage, totalInactivePages)[0] > 2 && (
                          <span className="pagination-ellipsis" style={{ padding: '0 8px' }}>…</span>
                        )}
                      </>
                    )}

                    {/* Visible page numbers */}
                    {getPaginationRange(currentInactivePage, totalInactivePages).map((page) => (
                      <button
                        key={page}
                        className={`page-btn ${currentInactivePage === page ? 'active' : ''}`}
                        onClick={() => setCurrentInactivePage(page)}
                        style={{
                          ...styles.pageBtn,
                          ...(currentInactivePage === page ? styles.activePageBtn : {}),
                        }}
                      >
                        {page}
                      </button>
                    ))}

                    {/* Last page + ellipsis if needed */}
                    {getPaginationRange(currentInactivePage, totalInactivePages).slice(-1)[0] < totalInactivePages && (
                      <>
                        {getPaginationRange(currentInactivePage, totalInactivePages).slice(-1)[0] < totalInactivePages - 1 && (
                          <span className="pagination-ellipsis" style={{ padding: '0 8px' }}>…</span>
                        )}
                        <button 
                          className="page-btn" 
                          onClick={() => setCurrentInactivePage(totalInactivePages)} 
                          style={styles.pageBtn}
                        >
                          {totalInactivePages}
                        </button>
                      </>
                    )}

                    {/* Next Button */}
                    <button
                      className="page-btn next-btn"
                      onClick={() => setCurrentInactivePage(prev => Math.min(prev + 1, totalInactivePages))}
                      style={styles.pageBtn}
                      disabled={currentInactivePage === totalInactivePages}
                    >
                      {'>'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

     {view === 'signatures' && (
  <div className="signatures-view" style={styles.content1}>

    {showSignatureModal && selectedSignatureEmployee && renderSignatureModal()}

    <div className="filters-row" style={styles.firstRow}>
      <div className="search-filters" style={{...styles.row1, display: 'flex', flexDirection: 'row', gap: '10px', width: '100%', justifyContent: 'space-between'}}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <FontAwesomeIcon icon={faSearch} style={{ 
              position: 'absolute', 
              left: '10px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#666' 
            }} />
            <input
              type="text"
              placeholder="Search employees by name, ID, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              style={{ 
                ...styles.searchInput, 
                width: '300px',
                paddingLeft: '35px'
              }}
            />
          </div>

          {canFilterAllDepartments() ? (
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="department-filter"
              style={{ 
                padding: '8px 12px', 
                borderRadius: '6px', 
                border: '1px solid #ccc', 
                width: '200px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
            >
              <option value="">All Departments</option>
              {departments.map((dept, idx) => (
                <option key={idx} value={dept}>{dept}</option>
              ))}
            </select>
          ) : (
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              backgroundColor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '500',
              fontSize: '14px',
              minWidth: '200px'
            }}>
              {userDepartment || 'My Department'}
            </div>
          )}

          <select
            value={filterEmploymentStatus}
            onChange={(e) => setFilterEmploymentStatus(e.target.value)}
            className="employment-status-filter"
            style={{ 
              padding: '8px 12px', 
              borderRadius: '6px', 
              border: '1px solid #ccc',
              fontSize: '14px',
              backgroundColor: '#fff',
              minWidth: '150px'
            }}
          >
            <option value="">All Employment Types</option>
            <option value="Temporary">Temporary</option>
            <option value="Contractual">Contractual</option>
            <option value="Permanent">Permanent</option>
            <option value="Casual">Casual</option>
            <option value="Job Order">Job Order</option>
            <option value="Coterminous">Coterminous</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            padding: '10px 15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#28a745',
                borderRadius: '50%'
              }}></div>
              <span style={{ fontSize: '12px', color: '#495057' }}>
                Signed: {Object.values(employeeSignatures).filter(s => s).length}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#dc3545',
                borderRadius: '50%'
              }}></div>
              <span style={{ fontSize: '12px', color: '#495057' }}>
                Missing: {employeeRecord.filter(emp => emp.status === 'active').length - Object.values(employeeSignatures).filter(s => s).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="signature-table-container" style={{ marginTop: '20px' }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'Arial, sans-serif'
        }}>
          <thead>
            <tr style={{
              backgroundColor: '#6FCB5C',
              color: '#fff',
              textAlign: 'left'
            }}>
              <th style={{ padding: '15px', fontWeight: '600', fontSize: '14px' }}>No.</th>
              <th style={{ padding: '15px', fontWeight: '600', fontSize: '14px' }}>Employee Name</th>
              <th style={{ padding: '15px', fontWeight: '600', fontSize: '14px' }}>ID Number</th>
              <th style={{ padding: '15px', fontWeight: '600', fontSize: '14px' }}>Department</th>
              <th style={{ padding: '15px', fontWeight: '600', fontSize: '14px' }}>Position</th>
              <th style={{ padding: '15px', fontWeight: '600', fontSize: '14px' }}>E-Signature Status</th>
              <th style={{ padding: '15px', fontWeight: '600', fontSize: '14px' }}>Last Updated</th>
              <th style={{ padding: '15px', fontWeight: '600', fontSize: '14px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employeeRecord
              .filter(emp => emp.status === 'active')
              .filter(emp => {
                const search = searchTerm.toLowerCase();
                const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
                const idNumber = (emp.id_number || '').toLowerCase();
                const department = (emp.department || '').toLowerCase();
                return fullName.includes(search) || idNumber.includes(search) || department.includes(search);
              })
              .filter(emp => filterDepartment ? emp.department === filterDepartment : true)
              .filter(emp => filterEmploymentStatus ? emp.employment_status === filterEmploymentStatus : true)
              .slice((currentPage - 1) * listEmployeePerPage, currentPage * listEmployeePerPage)
              .map((emp, index) => (
                <tr key={emp.id} style={{
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9',
                  transition: 'background-color 0.2s ease'
                }}>
                  <td style={{ padding: '15px', fontSize: '13px', color: '#333' }}>
                    {index + 1 + (currentPage - 1) * listEmployeePerPage}
                  </td>
                  <td style={{ padding: '15px', fontSize: '13px', color: '#333', fontWeight: '500' }}>
                    {emp.first_name} {emp.last_name}
                  </td>
                  <td style={{ padding: '15px', fontSize: '13px', color: '#666' }}>
                    {emp.id_number || '—'}
                  </td>
                  <td style={{ padding: '15px', fontSize: '13px', color: '#666', maxWidth: '200px' }}>
                    <div style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {emp.department || '—'}
                    </div>
                  </td>
                  <td style={{ padding: '15px', fontSize: '13px', color: '#666' }}>
                    {emp.position || '—'}
                  </td>
                  <td style={{ padding: '15px' }}>
                    {employeeSignatures[emp.id] ? (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '5px 12px',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        <FontAwesomeIcon icon={faCheck} />
                        Signature Uploaded
                      </div>
                    ) : (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '5px 12px',
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        <FontAwesomeIcon icon={faTimes} />
                        Signature Required
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '15px', fontSize: '12px', color: '#666' }}>
                    {employeeSignatures[emp.id] ? 'Recently uploaded' : 'Never'}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleSignatureClick(emp)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: employeeSignatures[emp.id] ? '#17a2b8' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        <FontAwesomeIcon icon={faSignature} />
                        {employeeSignatures[emp.id] ? 'View/Update' : 'Upload'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        
        {employeeRecord.filter(emp => emp.status === 'active').length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '50px 20px',
            color: '#666'
          }}>
            <FontAwesomeIcon icon={faSignature} size="3x" style={{ marginBottom: '20px', color: '#ddd' }} />
            <h3 style={{ margin: '0 0 10px 0', color: '#999' }}>No Active Employees</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>Add employees to manage their signatures</p>
          </div>
        )}
      </div>
    </div>

    {/* Pagination for Signature Management */}
    {employeeRecord.filter(emp => emp.status === 'active').length > 0 && (
      <div className="pagination-container" style={{
        ...styles.paginationContainer,
        position: 'static',
        transform: 'none',
        left: 'auto',
        marginTop: '20px',
        justifyContent: 'center'
      }}>
        {/* Previous Button */}
        <button
          className="page-btn prev-btn"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          style={styles.pageBtn}
          disabled={currentPage === 1}
        >
          {'<'}
        </button>

        {/* First page + ellipsis if needed */}
        {getPaginationRange(currentPage, totalPages)[0] > 1 && (
          <>
            <button 
              className="page-btn" 
              onClick={() => setCurrentPage(1)} 
              style={styles.pageBtn}
            >
              1
            </button>
            {getPaginationRange(currentPage, totalPages)[0] > 2 && (
              <span className="pagination-ellipsis" style={{ padding: '0 8px' }}>…</span>
            )}
          </>
        )}

        {/* Visible page numbers */}
        {getPaginationRange(currentPage, totalPages).map((page) => (
          <button
            key={page}
            className={`page-btn ${currentPage === page ? 'active' : ''}`}
            onClick={() => setCurrentPage(page)}
            style={{
              ...styles.pageBtn,
              ...(currentPage === page ? styles.activePageBtn : {}),
            }}
          >
            {page}
          </button>
        ))}

        {/* Last page + ellipsis if needed */}
        {getPaginationRange(currentPage, totalPages).slice(-1)[0] < totalPages && (
          <>
            {getPaginationRange(currentPage, totalPages).slice(-1)[0] < totalPages - 1 && (
              <span className="pagination-ellipsis" style={{ padding: '0 8px' }}>…</span>
            )}
            <button 
              className="page-btn" 
              onClick={() => setCurrentPage(totalPages)} 
              style={styles.pageBtn}
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next Button */}
        <button
          className="page-btn next-btn"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          style={styles.pageBtn}
          disabled={currentPage === totalPages}
        >
          {'>'}
        </button>
      </div>
    )}

  </div>
)}

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
    width: "20px"
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
  header1: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '10px',
    gap: '2px',
    justifyContent: 'flex-start',
    marginTop: '30px',
  },
  btnActive: {
    backgroundColor: '#A8FC0080',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  },
  content: {
    marginLeft: '300px',
    marginTop: '80px',
    width: 'calc(100% - 300px)', // Add this
    padding: '20px', // Add padding
    boxSizing: 'border-box', // Add this
    overflowX: 'auto', // Allow horizontal scrolling if needed
    minHeight: 'calc(100vh - 80px)', // Full height minus header
  },
  buttons: {
    display: 'flex',
    flexDirection: 'row',
    gap: '10px'
  },
  btn1: {
    padding: '10px 16px',
    borderRadius: '5px',
    backgroundColor: '#5ab049ff',
    boxShadow: 'inset 1px 1px 2px rgba(44, 44, 44, 0.44)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    color: '#fefcf5'
  },
  btn: {
    padding: '10px 16px',
    borderRadius: '5px',
    backgroundColor: '#fff',
    boxShadow: '1px 1px 2px rgba(44, 44, 44, 0.44)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500'
  },
  content1: {
    borderRadius: '5px',
    border: 'none',
    marginTop: '20px',
    width: '100%', // Changed from 1200px to 100%
    maxWidth: '100%', // Ensure it doesn't overflow
    boxSizing: 'border-box',
  },

  directory: {
    borderRadius: '5px',
    border: 'none',
    marginTop: '20px',
    width: '100%', // Make it responsive
    padding: '15px',
    boxSizing: 'border-box',
    backgroundColor: '#fff', // Optional: add background
    minHeight: 'calc(100vh - 150px)', // Adjust based on your needs
  },

  firstRow: {
    justifyContent: 'space-between',
    display: 'flex',
    flex: '1',
  },
  btnAddEmployee: {
    padding: '5px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#006C03',
    cursor: 'pointer',
    color: '#fefcf5',
    fontWeight: '600',
    boxShadow: '1px 1px 1px rgba(44, 44, 44, 0.44)',
  },
  btnIconAdd: {
    marginRight: '5px'
  },  
  secondRow: {
    marginTop: '15px',
    borderBottom: '1px solid rgb(185, 185, 185)',
    padding: '0 10px 10px 10px'
  },
  searchInput: {
    padding: '5px 22px',
    borderRadius: '5px',
    width: '300px',
    fontSize: '12px',
    border: '1px solid rgb(179, 179, 179)'
  },
  searchIcon: {
    position: 'absolute',
    color: 'rgb(136, 136, 136)',
    marginTop: '9px',
    fontSize: '12px',
    marginLeft: '8px'
  },
  filterStatus:{
    marginLeft: '10px',
    padding: '5px',
    borderRadius: '5px',
    border: '1px solid rgb(179, 179, 179)',
    fontSize: '12px',
  },
  filterStatus2:{
    marginLeft: '10px',
    padding: '5px',
    borderRadius: '5px',
    border: '1px solid rgb(179, 179, 179)',
    fontSize: '12px',
    width: '170px'
  },
  table: {
    maxWidth: '100%',
    marginBottom: '20px',
    marginTop: '20px',
  },
  employeeTable: {
    backgroundColor: '#f5f7f9',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: '1px solid rgb(216, 216, 216)',
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0',
    overflow: 'hidden',
  },
  columnName: {
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'left',
    backgroundColor: '#6FCB5C',
    color: '#ffffffff',
    textWrap: 'nowrap',
  },
  rowName: {
    padding: '10px',
    fontSize: '13px',
    backgroundColor: '#ffffffff',
    textWrap: 'nowrap',
  },
  viewBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    marginRight: '15px',
    color: '#5A5A5A',
    fontSize: '15px',
    transition: 'all 0.2s ease',
  },
  editBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    marginRight: '15px',
    color: '#5A5A5A',
    fontSize: '15px',
    transition: 'all 0.2s ease',
  },
  delBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    marginRight: '10px',
    color: '#5A5A5A',
    fontSize: '15px',
    transition: 'all 0.2s ease',
  },
  modalInputs: {
    display: 'block',
    width: '100%',
    marginBottom: 10,
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #ccc',
  },
  modalBtn: {
    marginTop: 20,
    textAlign: 'right',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px'
  },
  
  importBtn: {
    padding: '5px 10px',
    borderRadius: '5px',
    color: '#000',
    border: 'black solid 2px',
    cursor: 'pointer',
    marginRight: '10px',
    backgroundColor: '#fefcf5',
    fontSize: '12px',
    fontWeight: '500',
  },
  iconImport: {
    marginRight: '5px',
    fontSize: '12px',
  },
  genderInputs: {
    display: 'flex',
    gap: '20px',
    marginBottom: '10px',
    marginTop: '10px',
  },
  radioCircle: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  confirmModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  questionModal: {
    background: '#fff',
    padding: 20,
    borderRadius: 10,
    width: 400,
    boxShadow: '0 0 10px rgba(0,0,0,0.2)',
    textAlign: 'center'
  },
  btnYes: {
    padding: '8px 5px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '30px',
    width: '100px',
    fontSize: '15px',
    fontWeight: '600'
  },
  btnNo: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginLeft: '30px',
    marginTop: '30px',
    width: '100px',
    fontSize: '15px',
    fontWeight: '600'
  },


  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', // Responsive grid
    gap: '1.5rem',
    width: '100%',
    boxSizing: 'border-box',
  },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '1rem',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
    transition: 'transform 0.2s',
    width: '260px'
  },
  avatarContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  initials: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#ccc',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  info: {
    lineHeight: '1.4',
  },
  name: {
    fontWeight: '600',
    fontSize: '15px',
    color: '#222',
  },
  position: {
    color: '#666',
    fontSize: '12px',
  },
  department: {
    color: '#888',
    fontSize: '12px',
  },

  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '20px',
    position: 'fixed',
    transform: 'translateX(-50%)',
    left: '55%',
    bottom: '20px',
  },

pageBtn: {
  padding: '6px 10px',
  backgroundColor: '#ffffffff',
  border: '1px solid #d4d4d4ff',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 500,
},

activePageBtn: {
  backgroundColor: '#d4d4d4ff',
  fontWeight: '700',
},


viewModalCard: {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '32px',
  width: '500px',
  maxWidth: '95%',
  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.1)',
  fontFamily: 'Segoe UI, Roboto, sans-serif',
  textAlign: 'center',
},

viewCloseBtn: {
  marginTop: '24px',
  backgroundColor: '#0066CC',
  color: '#fff',
  padding: '10px 24px',
  border: 'none',
  borderRadius: '6px',
    fontSize: '14px',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease',
},

rightModalOverlay: {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.35)",
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  zIndex: 1000,
  backdropFilter: "blur(2px)",
  animation: "fadeIn 0.3s ease",
},

rightModalCard: {
  backgroundColor: "#fff",
  width: "500px",
  height: "90%",
  marginRight: "2%",
  borderRadius: "16px",
  boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
  padding: "30px",
  display: "flex",
  flexDirection: "column",
  animation: "slideIn 0.3s ease forwards",
},

rightModalHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  borderBottom: "1px solid #eee",
  paddingBottom: "8px",
},

closeIcon: {
  fontSize: "20px",
  color: "#666",
  cursor: "pointer",
  transition: "color 0.2s ease",
},

topSection: {
  display: "flex",
  alignItems: "center",
  gap: "18px",
  marginBottom: "25px",
},

profileImage: {
  width: "50px",
  height: "50px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "3px solid #f3f3f3",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
},

profileText: {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
},

employeeName: {
  fontSize: "18px",
  fontWeight: "600",
  color: "#222",
  margin: "0 0 4px 0",
},

employeePosition: {
  fontSize: "14px",
  color: "#666",
  margin: "0 0 4px 0",
},

employeeID: {
  fontSize: "13px",
  color: "#999",
},

detailsContainer: {
  display: "flex",
  flexDirection: "column",
  gap: "18px",
  flex: 1,
  overflowY: "scroll", // allow vertical scroll
  scrollbarWidth: "none", // hide scrollbar in Firefox
  msOverflowStyle: "none", // hide scrollbar in IE/Edge
},


detailCard: {
  backgroundColor: "#f8f8f8", // soft off-white
  borderRadius: "12px",
  padding: "16px 18px",
  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
},


detailCardHover: {
  transform: "translateY(-2px)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
},

detailHeader: {
  fontSize: "15px",
  fontWeight: "600",
  color: "#000000ff",
  marginBottom: "10px",
},

twoColumnGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "10px 18px",
  fontSize: "14px",
  color: "#444",
},

"@keyframes slideIn": {
  from: { transform: "translateX(100%)" },
  to: { transform: "translateX(0)" },
},

"@keyframes fadeIn": {
  from: { opacity: 0 },
  to: { opacity: 1 },
},

checkbox: {
  width: '15px',
  height: '15px',
  cursor: 'pointer',
  accentColor: '#28a745', 
  borderRadius: '4px',
},


  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },

  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '20px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },

  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '25px',
    width: '600px',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },

  modalTitle: {
    fontSize: '22px',
    fontWeight: '600',
    textAlign: 'left',
    color: '#2C3E50'
  },

  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },

  modalInput: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: '0.2s'
  },

  selectInput: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
    cursor: 'pointer'
  },

  label: {
    fontWeight: '500',
    marginBottom: '5px',
    display: 'block',
    fontSize: '14px',
    color: '#34495E'
  },

  genderContainer: {
    display: 'flex',
    gap: '10px',
    marginTop: '5px'
  },

  genderBtn: {
    flex: 1,
    padding: '8px 0',
    borderRadius: '8px',
    border: '1px solid #ccc',
    textAlign: 'center',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#333',
    backgroundColor: '#f7f7f7',
    transition: '0.2s'
  },

  genderBtnActive: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    borderColor: '#4CAF50',
    fontWeight: '600'
  },

  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '15px'
  },

  cancelBtn: {
    padding: '10px 22px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#E74C3C',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    transition: '0.2s'
  },

  
  saveBtn: {
    padding: '10px 22px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    transition: '0.2s'
  },

  confirmBtn: {
    padding: '10px 22px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    transition: '0.2s'
  },

  modalSubtitle: {
    fontSize: '14px',
    color: '#555',
    marginTop: '-10px',
    textAlign: 'left',
  },

  row1: {
    display: 'flex',
    flexDirection: 'row',
  },

  uploadBalancesBtn: {
    padding: '5px 10px',
    borderRadius: '5px',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    marginRight: '10px',
    backgroundColor: '#28a745',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  
  iconUpload: {
    marginRight: '5px',
    fontSize: '12px',
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

export default Employees;