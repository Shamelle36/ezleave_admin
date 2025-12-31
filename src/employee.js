import React, { useState, useEffect } from 'react';
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
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import 'react-calendar/dist/Calendar.css';
import './dashboardCalendar.css';
import Papa from 'papaparse';
import * as XLSX from "xlsx";
import './employee-responsive.css';
import ProfileDropdown from './profileDropdown';

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
  const [employeesToEdit, setEmployeesToEdit] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [view, setView] = useState(() => {
    const savedView = localStorage.getItem('employeesView');
    return savedView || 'list';
  });
  const [currentPage, setCurrentPage] = useState(1);
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
  
  const [newEmployee, setNewEmployee] = useState({
    full_name: '',
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

  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "https://ezleave-admin.onrender.com";

  const loadEmployees = async () => {
    try {
      const role = localStorage.getItem("role") || "admin";
      const department = localStorage.getItem("department") || "";

      // For mayor: fetch all employees without department filter
      const params = role === "mayor" 
        ? new URLSearchParams({ role }).toString()
        : new URLSearchParams({ role, department }).toString();
      
      const url = `${API_URL}/api/employees?${params}`;
      const res = await fetch(url);
      const data = await res.json();

      setEmployeeRecords(Array.isArray(data) ? data : [data]);
    } catch (err) {
      console.error("Error loading employees:", err);
      setEmployeeRecords([]);
    }
  };

  const canPerformActions = (employeeDepartment) => {
    const role = localStorage.getItem("role") || "admin";
    
    if (role === "admin") return true;
    if (role === "mayor") return false; // Mayor cannot edit/delete any employees
    if (role === "office_head") {
      const userDept = localStorage.getItem("department") || "";
      return employeeDepartment === userDept;
    }
    return false;
  };

  const canAddEmployees = () => {
    const role = localStorage.getItem("role") || "admin";
    return role !== "mayor"; // Mayor cannot add employees
  };

  const canImportCSV = () => {
    const role = localStorage.getItem("role") || "admin";
    return role !== "mayor"; // Mayor cannot import CSV
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
        
        // Skip first 3 rows (index 0, 1, 2)
        const rows = json.slice(3);

        // Filter out empty rows (no first/last name or position)
        const validRows = rows.filter(
          (row) => row.some(cell => cell && String(cell).trim() !== "")
        );

        const employees = validRows.map((row) => ({
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
          gender: row[11]?.toLowerCase() === "female" ? "Female" : "Male",
          civil_status: row[12]?.trim() || "Single",
          status: "active",
        }));

        setEmployeesToUpload(employees);
        setShowConfirmModal(true);
      };
      reader.readAsArrayBuffer(file);
    } else {
      // fallback for CSV (existing Papa.parse)
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const employeesRaw = results.data
            .filter(row => Object.values(row).some(cell => cell && cell.trim() !== "")) // skip fully empty
            .map((row, index) => ({
              first_name: row.first_name?.trim() || "",
              last_name: row.last_name?.trim() || "",
              full_name: `${row.first_name || ""} ${row.last_name || ""}`.trim(),
              email: row.email?.trim() || "",
              position: row.position?.trim() || "",
              employment_status: row.employment_status?.trim() || "Permanent",
              department: row.department?.trim() || "",
              gender: row.gender?.trim() || "",
              date_hired: row.date_hired?.trim() || "",
              civil_status: row.civil_status?.trim() || "",
              contact_number: row.contact_number?.trim() || "",
              id_number: row.id_number?.trim() || "",
              status: row.status?.trim() || "active",
            }));

          setEmployeesToUpload(employeesRaw);
          setShowConfirmModal(true);
        },
      });
    }
  };

  const confirmUpload = async () => {
    if (employeesToUpload.length === 0) return;

    // Hide the modal immediately
    setShowConfirmModal(false);

    // Show loading overlay
    setIsDeleting(true);
    await new Promise((resolve) => setTimeout(resolve, 50)); // allow render

    try {
      // Only filter out completely empty entries
      const validEmployees = employeesToUpload.filter(
        (emp) => Object.values(emp).some(value => value && String(value).trim() !== "")
      );

      let importedCount = 0;

      for (const emp of validEmployees) {
        try {
          // Remove id_number if empty
          const payload = { ...emp };
          if (!payload.id_number) delete payload.id_number;

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
          console.log(`✅ Imported ${importedCount} / ${validEmployees.length}: ${emp.full_name}`);
        } catch (err) {
          console.warn(`⚠️ Skipped due to error: ${emp.full_name}`, err);
        }
      }

      console.log(`🎉 Finished importing ${importedCount} / ${validEmployees.length} employees`);
    } catch (error) {
      console.error("Error importing employees:", error);
    } finally {
      setEmployeesToUpload([]);
      setTimeout(() => setIsDeleting(false), 400); // smooth fade
    }
  };

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    await new Promise((resolve) => setTimeout(resolve, 50)); // let loader render

    try {
      const res = await fetch(`${API_URL}/api/employees/${employeeToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete employee");

      setEmployeeRecords((prev) =>
        prev.filter((emp) => emp.id !== employeeToDelete.id)
      );

      setShowDeleteModal(false);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setTimeout(() => setIsDeleting(false), 400); // small delay for smooth fade
    }
  };

  // 🗑️ BULK DELETE SELECTED EMPLOYEES
  const handleBulkDelete = async () => {
    if (selectedEmployees.length === 0) return;

    const confirmBulk = window.confirm(
      `Are you sure you want to delete ${selectedEmployees.length} selected employees?`
    );
    if (!confirmBulk) return;

    setIsDeleting(true);
    await new Promise((resolve) => setTimeout(resolve, 50)); // render loader

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

  const handleLogout = async () => {
    const user = JSON.parse(localStorage.getItem("admin")); // get current session

    if (user) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: user.role }),
      });
    }

    localStorage.removeItem("admin"); // clear session
    navigate("/"); // redirect to login
  };

  const handleAddEmployee = async () => {
    try {
      const response = await fetch(`${API_URL}/api/employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEmployee),
      });

      if (!response.ok) {
        throw new Error("Failed to add employee");
      }

      const savedEmployee = await response.json();

      // Update UI
      setEmployeeRecords((prev) => [savedEmployee, ...prev]);

      setShowAddModal(false);
      alert("Employee added successfully!");
      
      // reset form
      setNewEmployee({
        full_name: "",
        email: "",
        position: "",
        department_id: "",
        employment_status: "",
        gender: "",
        status: "active",
        date_hired: "",
        id_number: "",
        contact_number: "",
        civil_status: "",
      });
    } catch (error) {
      console.error(error);
      alert("Error adding employee");
    }
  };

  const handleViewClick = (employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  const handleEditClick = (employee) => {
    setEmployeesToEdit(employee);
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    await fetch(`${API_URL}/api/employees/${employeesToEdit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employeesToEdit),
    });

    setEmployeeRecords((prev) =>
      prev.map((emp) =>
        emp.id === employeesToEdit.id ? employeesToEdit : emp
      )
    );
    setShowEditModal(false);
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedEmployees(employeeRecord.map((emp) => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  useEffect(() => {
    // Keep "Select All" in sync with row selections
    if (selectedEmployees.length === employeeRecord.length && employeeRecord.length > 0) {
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

  const filteredEmployees = employeeRecord
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
  // Helper function to generate pagination range
  const getPaginationRange = (currentPage, totalPages) => {
    const maxVisible = 3; // show up to 5 page numbers
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
    return role !== "mayor"; // Mayor cannot upload balances
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

      // Simulate progress for better UX
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
      
      // Auto-close on success after delay
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
            // Don't set any defaults - let the modal handle empty state
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
    // Fetch active terms
    const response = await fetch(`${API_URL}/api/terms/active`);
    const data = await response.json();
    
    // Check if response is valid
    if (data && data.content) {
      setTermsContent(data.content);
      setActiveTermsVersion(data);
    } else {
      setTermsContent('');
      setActiveTermsVersion(null);
    }
    
    // Fetch all versions - handle potential errors
    try {
      const versionsRes = await fetch(`${API_URL}/api/terms`);
      const versionsData = await versionsRes.json();
      
      // Ensure versionsData is an array
      if (Array.isArray(versionsData)) {
        setTermsVersions(versionsData);
      } else if (versionsData && Array.isArray(versionsData.data)) {
        // Some APIs wrap arrays in a data property
        setTermsVersions(versionsData.data);
      } else if (versionsData && versionsData.versions) {
        // Some APIs use a versions property
        setTermsVersions(versionsData.versions);
      } else {
        // Default to empty array
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

  // Safely calculate next version number
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
        <input type="text" placeholder="Search..." className="search-input" style={styles.search} />
        <FontAwesomeIcon icon={faBell} className="bell-icon" style={styles.iconBell} />
      </div>

      <div className="sidebar" style={styles.sidebar}>
        <img src={require('./images/logo_ez.png')} alt="logo" className="desktop-logo" style={styles.logo} />
        <ul className="sidebar-list" style={styles.sidebarList}>
          {allowedMenus.map((item) => {
            const isActive = location.pathname === item.to; // Check if current route matches

            return (
              <li
                key={item.name}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                style={{
                  ...(isActive ? styles.btnActive : {}), // Apply active tab background
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

          <li className="sidebar-item">
            <Link
              className="sidebar-link"
              style={styles.sb}
              to="#"
              onClick={(e) => {
                e.preventDefault();
                setShowLogoutModal(true);
              }}
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="sidebar-icon" style={styles.icon} /> Logout
            </Link>
          </li>
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
                    {/* Define all days of the week */}
                    {[
                      { key: 'monday', label: 'Monday (Early Start)' },
                      { key: 'tuesday', label: 'Tuesday' },
                      { key: 'wednesday', label: 'Wednesday' },
                      { key: 'thursday', label: 'Thursday' },
                      { key: 'friday', label: 'Friday' },
                      { key: 'saturday', label: 'Saturday' },
                      { key: 'sunday', label: 'Sunday' }
                    ].map(({ key, label }) => {
                      // Get config or use default empty structure
                      const config = attendanceTimeSettings[key] || {};
                      
                      // Determine if day is active (default to true if not set)
                      const isActive = config.is_active !== undefined ? config.is_active : true;
                      
                      // Get start/end times or use empty strings
                      const startTime = config.start || '';
                      const endTime = config.end || '';
                      
                      // Check if time is set
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
                          // Prepare data for saving - only include days with times
                          const settingsToSave = {};
                          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                          
                          days.forEach(day => {
                            const config = attendanceTimeSettings[day] || {};
                            if (config.start && config.end) {
                              settingsToSave[day] = {
                                start: config.start,
                                end: config.end,
                                is_active: config.is_active !== false // Default to true if not set
                              };
                            }
                          });
                          
                          if (Object.keys(settingsToSave).length === 0) {
                            alert('Please add at least one time setting');
                            return;
                          }
                          
                          console.log('Saving settings:', settingsToSave);
                          
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
                            
                            // Refresh settings from server
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
                              // Refresh settings
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

        {/* Desktop Logo - hidden on mobile */}
        <img src={require('./images/logo_ez.png')} alt="logo" className="desktop-logo" style={styles.logo} />
        
        {/* Rest of your sidebar content remains the same */}
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
                />
              </div>
            </div>

      <div className="content" style={styles.content}>
      
        {showLogoutModal && (
          <div className="modal-overlay" style={styles.modalOverlay}>
            <div className="modal-content" style={styles.modalContent}>
              <h3>Confirm Logout</h3>
              <p>Are you sure you want to log out?</p>
              <div className="modal-actions" style={styles.modalActions}>
                <button
                  className="cancel-btn"
                  style={styles.cancelBtn}
                  onClick={() => setShowLogoutModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="confirm-btn"
                  style={styles.confirmBtn}
                  onClick={handleLogout}
                >
                  Logout
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

                  {/* Department Filter */}
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

                  

                  {showBulkDeleteModal && (
                    <div className="bulk-delete-modal" style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 1000,
                    }}>
                      <div className="bulk-delete-content" style={{
                        background: '#fff',
                        padding: '30px 25px',
                        width: '420px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        textAlign: 'center',
                        animation: 'fadeIn 0.3s ease-in-out',
                      }}>
                        <FontAwesomeIcon
                          icon={faTrash}
                          style={{ color: '#d62828', fontSize: '40px', marginBottom: '10px' }}
                        />
                        <h3 style={{ marginBottom: '10px', fontSize: '18px' }}>Confirm Bulk Deletion</h3>
                        <p style={{ marginBottom: '25px', color: '#555', fontSize: '15px' }}>
                          You are about to permanently delete <strong>{selectedEmployees.length}</strong> employees.
                          This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                          <button
                            className="confirm-bulk-delete"
                            onClick={() => {
                              setShowBulkDeleteModal(false);
                              handleBulkDelete();
                            }}
                            style={{
                              backgroundColor: '#d62828',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '10px 18px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            className="cancel-bulk-delete"
                            onClick={() => setShowBulkDeleteModal(false)}
                            style={{
                              backgroundColor: '#ccc',
                              color: '#333',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '10px 18px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                        <style>
                          {`@keyframes fadeIn {
                            from { opacity: 0; transform: translateY(-10px); }
                            to { opacity: 1; transform: translateY(0); }
                          }`}
                        </style>
                      </div>
                    </div>
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
                      <th className="column-actions" style={styles.columnName}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees
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
                          <td className="row-actions" style={styles.rowName}>
                            <button className="view-btn" style={styles.viewBtn} onClick={() => handleViewClick(record)}>
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                            {canPerformActions(record.department) && (
                              <>
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
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="pagination-container" style={styles.paginationContainer}>
                  {/* Previous Button */}
                  <button
                    className="page-btn prev-btn"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    style={styles.pageBtn}
                  >
                    {'<'}
                  </button>

                  {/* First page + ellipsis if needed */}
                  {getPaginationRange(currentPage, totalPages)[0] > 1 && (
                    <>
                      <button className="page-btn" onClick={() => setCurrentPage(1)} style={styles.pageBtn}>1</button>
                      {getPaginationRange(currentPage, totalPages)[0] > 2 && <span className="pagination-ellipsis" style={{ padding: '0 8px' }}>…</span>}
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
                      {getPaginationRange(currentPage, totalPages).slice(-1)[0] < totalPages - 1 && <span className="pagination-ellipsis" style={{ padding: '0 8px' }}>…</span>}
                      <button className="page-btn" onClick={() => setCurrentPage(totalPages)} style={styles.pageBtn}>{totalPages}</button>
                    </>
                  )}

                  {/* Next Button */}
                  <button
                    className="page-btn next-btn"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    style={styles.pageBtn}
                  >
                    {'>'}
                  </button>
                </div>
                
              </div>
            </div>

            {showConfirmModal && (
              <div className="confirm-modal" style={styles.confirmModal}>
                <div className="question-modal" style={styles.questionModal}>
                  <p style={{fontSize: '20px'}}>Are you sure you want to import {employeesToUpload.length} employees?</p>
                  <button className="btn-yes" onClick={confirmUpload} style={styles.btnYes}>Yes</button>
                  <button className="btn-no" onClick={() => setShowConfirmModal(false)} style={styles.btnNo}>Cancel</button>
                </div>
              </div>
            )}

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
                    {/* First Name */}
                    <input
                      placeholder="First Name"
                      className="modal-input"
                      style={styles.modalInput}
                      value={employeesToEdit.first_name}
                      onChange={(e) =>
                        setEmployeesToEdit({ ...employeesToEdit, first_name: e.target.value.replace(/[0-9]/g, "") })
                      }
                    />

                    {/* Last Name */}
                    <input
                      placeholder="Last Name"
                      className="modal-input"
                      style={styles.modalInput}
                      value={employeesToEdit.last_name}
                      onChange={(e) =>
                        setEmployeesToEdit({ ...employeesToEdit, last_name: e.target.value.replace(/[0-9]/g, "") })
                      }
                    />

                    {/* Email */}
                    <input
                      placeholder="Email"
                      className="modal-input"
                      style={styles.modalInput}
                      value={employeesToEdit.email}
                      onChange={(e) =>
                        setEmployeesToEdit({ ...employeesToEdit, email: e.target.value })
                      }
                    />

                    {/* Position */}
                    <input
                      placeholder="Position"
                      className="modal-input"
                      style={styles.modalInput}
                      value={employeesToEdit.position}
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
                        {['Temporary', 'Permanent', 'Contractual', 'Casual'].map((type) => (
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

                    {/* Status */}
                    <select
                      className="select-input"
                      style={styles.selectInput}
                      value={employeesToEdit.status || ""}
                      onChange={(e) => setEmployeesToEdit({ ...employeesToEdit, status: e.target.value })}
                    >
                      <option value="">Select Employment Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>

                    {/* Date Hired */}
                    <input
                      type="date"
                      className="modal-input"
                      style={styles.modalInput}
                      value={employeesToEdit.date_hired || ""}
                      onChange={(e) => setEmployeesToEdit({ ...employeesToEdit, date_hired: e.target.value })}
                    />
                  </div>

                  {/* Actions */}
                  <div className="modal-actions" style={styles.modalActions}>
                    <button className="cancel-btn" style={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
                    <button className="save-btn" style={styles.saveBtn} onClick={handleEditSave}>Save</button>
                  </div>
                </div>
              </div>
            )}

            {showDeleteModal && (
              <div className="delete-modal-overlay" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
              }}>
                <div className="delete-modal-content" style={{
                  background: '#fff',
                  padding: '30px 20px',
                  width: '400px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  textAlign: 'center'
                }}>
                  <p style={{ marginBottom: '25px', fontSize: '16px' }}>
                      This action will permanently remove <strong>{employeeToDelete?.full_name}</strong> from the employee list. Do you want to continue?                    
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                    <button 
                      className="confirm-delete-btn"
                      onClick={confirmDelete} 
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'red',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Delete
                    </button>
                    <button 
                      className="cancel-delete-btn"
                      onClick={() => setShowDeleteModal(false)} 
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#ccc',
                        color: '#333',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Cancel
                    </button>
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
                      onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value.replace(/[0-9]/g, "") })}
                    />

                    <input
                      placeholder="Last Name"
                      className="modal-input"
                      style={styles.modalInput}
                      value={newEmployee.last_name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value.replace(/[0-9]/g, "") })}
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

                    <select
                      className="select-input"
                      style={styles.selectInput}
                      value={newEmployee.status}
                      onChange={(e) => setNewEmployee({ ...newEmployee, status: e.target.value })}
                    >
                      <option value="">Select Employment Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>

                    <input
                      type="date"
                      className="modal-input"
                      style={styles.modalInput}
                      value={newEmployee.date_hired || ''}
                      onChange={(e) => setNewEmployee({ ...newEmployee, date_hired: e.target.value })}
                    />
                  </div>

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
                      : 'Deleting employee...'}
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
                    </div>
                  </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="pagination-container" style={styles.paginationContainer}>
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
    marginTop: '80px'
  },
  buttons: {
    display: 'flex',
    flexDirection: 'row',
    gap: '10px'
  },
  btn1: {
    padding: '5px 5px',
    borderRadius: '5px',
    backgroundColor: '#5ab049ff',
    boxShadow: 'inset 1px 1px 2px rgba(44, 44, 44, 0.44)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    color: '#fefcf5'
  },
  btn: {
    padding: '5px 5px',
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
    width: '1200px',
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
    display: 'flex',
    gap: '3rem',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    maxWidth: '1200px',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '1.5rem',
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
    fontSize: '14px',
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