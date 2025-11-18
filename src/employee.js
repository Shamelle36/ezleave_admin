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
  faUser
} from '@fortawesome/free-solid-svg-icons';
import 'react-calendar/dist/Calendar.css';
import './dashboardCalendar.css';
import Papa from 'papaparse';
import * as XLSX from "xlsx";


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
  const [view, setView] = useState('list');
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
  

  const departments = [
    "Office of the Municipal Mayor",
    "Human Resource Management Division",
    "Business Permit and Licensing Division",
    "Sangguniang Bayan Office",
    "Office of the Municipal Accountant",
    "Office of the Assessor",
    "Municipal Budget Office",
    "Municipal Planning and Development Office",
    "Office of the Municipal Engineer",
    "Municipal Risk Reduction and Management Office",
    "Municipal Social Welfare and Development Office",
    "Municipal Environment and Natural Resources Office",
    "Office of the Municipal Agriculturist",
    "Municipal General Services Office",
    "Municipal Public Employment Service Office",
    "Municipal Health Office",
    "Municipal Treasurer’s Office",
  ];


  

    useEffect(() => {
      loadEmployees();
    }, []);

const loadEmployees = async () => {
    try {
      const role = localStorage.getItem("role") || "admin";
      const department = localStorage.getItem("department") || "";

      // For mayor: fetch all employees without department filter
      const params = role === "mayor" 
        ? new URLSearchParams({ role }).toString()
        : new URLSearchParams({ role, department }).toString();
      
      const url = `http://localhost:5000/api/employees?${params}`;
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

        const response = await fetch("http://localhost:5000/api/employees", {
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
    const res = await fetch(`http://localhost:5000/api/employees/${employeeToDelete.id}`, {
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
      await fetch(`http://localhost:5000/api/employees/${id}`, { method: "DELETE" });
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
      await fetch("http://localhost:5000/api/auth/logout", {
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
      const response = await fetch("http://localhost:5000/api/employees", {
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
    await fetch(`http://localhost:5000/api/employees/${employeesToEdit.id}`, {
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

        <div style={styles.buttons}>
          <button 
            style={view === 'list' ? styles.btn1 : styles.btn}
            onClick={() => setView('list')}
          >
          Manage Employees
          </button>
          <button 
            style={view === 'directory' ? styles.btn1 : styles.btn}
            onClick={() => setView('directory')}
          >
            Directory
          </button>
        </div>


        {view === 'list' && (
          <div style={styles.content1}>
            <div style={styles.firstRow}>

                {/* Search Input */}
                <div style={{...styles.row1, display: 'flex', flexDirection: 'row', gap: '10px'}}>
                  <input
                    type="text"
                    placeholder="Search by name, email, or position..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...styles.searchInput, width: '300px' }}
                  />

                  {/* Department Filter */}
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
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

                <div style={styles.row1}>
                  {canImportCSV() && (
                    <button style={styles.importBtn} onClick={handleButtonClick}>
                      <FontAwesomeIcon icon={faDownload} style={styles.iconImport} />
                      Import CSV
                    </button>
                  )}
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    ref={fileInputRef}
                    onChange={handleCSVUpload}
                    style={{ display: 'none' }}
                  />

                  {canAddEmployees() && (
                    <button style={styles.btnAddEmployee} onClick={() => setShowAddModal(true)}>
                      <FontAwesomeIcon icon={faPlus} style={styles.btnIconAdd} />
                      Add Employee
                    </button>
                  )}

                  {selectedEmployees.length > 0 && role !== "mayor" && (
                    <button
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
                    <div style={{
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
                      <div style={{
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


              <div style={styles.tableContainer}>
                <div style={styles.table}>
                  <table style={styles.employeeTable}>
                    <thead>
                      <tr>
                        {role !== "mayor" && (
                          <th style={styles.columnName}>
                            <input
                              type="checkbox"
                              checked={selectAll}
                              onChange={handleSelectAll}
                              style={styles.checkbox}
                            />
                          </th>
                        )}
                        <th style={styles.columnName}>No.</th>
                        <th style={styles.columnName}>ID Number</th>
                        <th style={styles.columnName}>Name</th>
                        <th style={styles.columnName}>Position</th>
                        <th style={styles.columnName}>Department</th>
                        <th style={styles.columnName}>Status of Employment</th>
                        <th style={styles.columnName}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees
                        .slice((currentPage - 1) * listEmployeePerPage, currentPage * listEmployeePerPage)
                        .map((record, index) => (
                          <tr key={record.id}>
                            {role !== "mayor" && (
                              <td style={styles.rowName}>
                                <input
                                  type="checkbox"
                                  checked={selectedEmployees.includes(record.id)}
                                  onChange={() => handleSelectEmployee(record.id)}
                                  style={styles.checkbox}
                                />
                              </td>
                            )}
                            <td style={styles.rowName}>{index + 1 + (currentPage - 1) * listEmployeePerPage}</td>
                            <td style={styles.rowName}>{record.id_number || '—'}</td>
                            <td style={styles.rowName}>{`${record.first_name || ''} ${record.last_name || ''}`.trim()}</td>
                            <td style={styles.rowName}>{record.position}</td>
                            <td style={{ 
                              ...styles.rowName, 
                              maxWidth: '220px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {record.department || '—'}
                            </td>
                            <td style={styles.rowName}>{record.employment_status}</td>
                            <td style={styles.rowName}>
                              <button style={styles.viewBtn} onClick={() => handleViewClick(record)}>
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              {canPerformActions(record.department) && (
                                <>
                                  <button style={styles.editBtn} onClick={() => handleEditClick(record)}>
                                    <FontAwesomeIcon icon={faPenToSquare} />
                                  </button>
                                  <button style={styles.delBtn} onClick={() => handleDeleteClick(record)}>
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
                <div style={styles.paginationContainer}>
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    style={styles.pageBtn}
                  >
                    {'<'}
                  </button>

                  {/* First page + ellipsis if needed */}
                  {getPaginationRange(currentPage, totalPages)[0] > 1 && (
                    <>
                      <button onClick={() => setCurrentPage(1)} style={styles.pageBtn}>1</button>
                      {getPaginationRange(currentPage, totalPages)[0] > 2 && <span style={{ padding: '0 8px' }}>…</span>}
                    </>
                  )}

                  {/* Visible page numbers */}
                  {getPaginationRange(currentPage, totalPages).map((page) => (
                    <button
                      key={page}
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
                      {getPaginationRange(currentPage, totalPages).slice(-1)[0] < totalPages - 1 && <span style={{ padding: '0 8px' }}>…</span>}
                      <button onClick={() => setCurrentPage(totalPages)} style={styles.pageBtn}>{totalPages}</button>
                    </>
                  )}

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    style={styles.pageBtn}
                  >
                    {'>'}
                  </button>
                </div>
                
                </div>
              </div>




            {showConfirmModal && (
              <div style={styles.confirmModal}>
                <div style={styles.questionModal}>
                  <p style={{fontSize: '20px'}}>Are you sure you want to import {employeesToUpload.length} employees?</p>
                  <button onClick={confirmUpload} style={styles.btnYes}>Yes</button>
                  <button onClick={() => setShowConfirmModal(false)} style={styles.btnNo}>Cancel</button>
                </div>
              </div>
            )}

            {showViewModal && selectedEmployee && (
              <div style={styles.rightModalOverlay} onClick={() => setShowViewModal(false)}>
                <div
                  style={styles.rightModalCard}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div style={styles.rightModalHeader}>
                    <h2 style={styles.viewModalHeader}>Employee Details</h2>
                    <FontAwesomeIcon
                      icon={faTimes}
                      style={styles.closeIcon}
                      onClick={() => setShowViewModal(false)}
                    />
                  </div>

                  {/* Top Profile Section */}
                  <div style={styles.topSection}>
                    {selectedEmployee?.profile_picture ? (
                      <img
                        src={selectedEmployee.profile_picture}
                        alt="Profile"
                        style={styles.profileImage}
                      />
                    ) : (
                      <div style={{
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
                    <div style={styles.profileText}>
                      <h3 style={styles.employeeName}>
                        {selectedEmployee.full_name?.trim() || `${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`.trim()}
                      </h3>
                      <p style={styles.employeeID}>ID: {selectedEmployee.id_number}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={styles.detailsContainer}>
                    <div style={styles.detailCard}>
                      <h4 style={styles.detailHeader}>Contact Information</h4>
                      <div style={styles.twoColumnGrid}>
                        <div>
                          <label>Email</label>
                          <p>{selectedEmployee.email}</p>
                        </div>
                        <div>
                          <label>Contact Number</label>
                          <p>{selectedEmployee.contact_number}</p>
                        </div>
                      </div>
                    </div>

                    <div style={styles.detailCard}>
                      <h4 style={styles.detailHeader}>Employment Details</h4>
                      <div style={styles.twoColumnGrid}>
                        <div>
                          <label>Department</label>
                          <p>{selectedEmployee.department}</p>
                        </div>
                        <div>
                          <label>Employment Status</label>
                          <p>{selectedEmployee.employment_status}</p>
                        </div>
                        <div>
                          <label>Date Hired</label>
                          <p>{new Date(selectedEmployee.date_hired).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    <div style={styles.detailCard}>
                      <h4 style={styles.detailHeader}>Personal Information</h4>
                      <div style={styles.twoColumnGrid}>
                        <div>
                          <label>Gender</label>
                          <p>{selectedEmployee.gender}</p>
                        </div>
                        <div>
                          <label>Civil Status</label>
                          <p>{selectedEmployee.civil_status}</p>
                        </div>
                        <div>
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
              <div style={styles.modalOverlay}>
                <div style={styles.modalContainer}>
                  <h3 style={styles.modalTitle}>Edit Employee Information</h3>
                  <p style={styles.modalSubtitle}>
                    Update the necessary details below and click <strong>Save</strong> to apply changes.
                  </p>

                  <div style={styles.modalGrid}>
                    {/* First Name */}
                    <input
                      placeholder="First Name"
                      style={styles.modalInput}
                      value={employeesToEdit.first_name}
                      onChange={(e) =>
                        setEmployeesToEdit({ ...employeesToEdit, first_name: e.target.value.replace(/[0-9]/g, "") })
                      }
                    />

                    {/* Last Name */}
                    <input
                      placeholder="Last Name"
                      style={styles.modalInput}
                      value={employeesToEdit.last_name}
                      onChange={(e) =>
                        setEmployeesToEdit({ ...employeesToEdit, last_name: e.target.value.replace(/[0-9]/g, "") })
                      }
                    />

                    {/* Email */}
                    <input
                      placeholder="Email"
                      style={styles.modalInput}
                      value={employeesToEdit.email}
                      onChange={(e) =>
                        setEmployeesToEdit({ ...employeesToEdit, email: e.target.value })
                      }
                    />

                    {/* Position */}
                    <input
                      placeholder="Position"
                      style={styles.modalInput}
                      value={employeesToEdit.position}
                      onChange={(e) =>
                        setEmployeesToEdit({ ...employeesToEdit, position: e.target.value.replace(/[0-9]/g, "") })
                      }
                    />

                    {/* ID Number */}
                    <input
                      placeholder="ID Number"
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
                      style={styles.modalInput}
                      value={employeesToEdit.contact_number || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d{0,11}$/.test(value)) setEmployeesToEdit({ ...employeesToEdit, contact_number: value });
                      }}
                    />

                    {/* Gender */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={styles.label}>Gender</label>
                      <div style={styles.genderContainer}>
                        {['Male', 'Female'].map((g) => (
                          <div
                            key={g}
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
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={styles.label}>Employment Type</label>
                      <div style={styles.genderContainer}>
                        {['Temporary', 'Permanent', 'Contractual', 'Casual'].map((type) => (
                          <div
                            key={type}
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
                      style={styles.modalInput}
                      value={employeesToEdit.date_hired || ""}
                      onChange={(e) => setEmployeesToEdit({ ...employeesToEdit, date_hired: e.target.value })}
                    />
                  </div>

                  {/* Actions */}
                  <div style={styles.modalActions}>
                    <button style={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
                    <button style={styles.saveBtn} onClick={handleEditSave}>Save</button>
                  </div>
                </div>
              </div>
            )}



              {showDeleteModal && (
                <div style={{
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
                  <div style={{
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
                <div style={styles.modalOverlay}>
                  <div style={styles.modalContainer}>
                    <h3 style={styles.modalTitle}>Add New Employee</h3>
                      <p style={styles.modalSubtitle}>
                        Fill out the details below to add a new employee record.
                      </p>

                    <div style={styles.modalGrid}>
                      <input
                        placeholder="First Name"
                        style={styles.modalInput}
                        value={newEmployee.first_name}
                        onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value.replace(/[0-9]/g, "") })}
                      />

                      <input
                        placeholder="Last Name"
                        style={styles.modalInput}
                        value={newEmployee.last_name}
                        onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value.replace(/[0-9]/g, "") })}
                      />

                      <input
                        placeholder="Email"
                        style={styles.modalInput}
                        value={newEmployee.email}
                        onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                      />

                      <input
                        placeholder="Position"
                        style={styles.modalInput}
                        value={newEmployee.position}
                        onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value.replace(/[0-9]/g, "") })}
                      />

                      <input
                        placeholder="ID Number"
                        style={styles.modalInput}
                        value={newEmployee.id_number}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d{0,8}$/.test(value)) setNewEmployee({ ...newEmployee, id_number: value });
                        }}
                      />

                      <input
                        placeholder="Contact Number"
                        style={styles.modalInput}
                        value={newEmployee.contact_number}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d{0,11}$/.test(value)) setNewEmployee({ ...newEmployee, contact_number: value });
                        }}
                      />

                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={styles.label}>Gender</label>
                        <div style={styles.genderContainer}>
                          {['Male', 'Female'].map((g) => (
                            <div
                              key={g}
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
                        style={styles.selectInput}
                        value={newEmployee.department}
                        onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept, idx) => (
                          <option key={idx} value={dept}>{dept}</option>
                        ))}
                      </select>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={styles.label}>Employment Type</label>
                        <div style={styles.genderContainer}>
                          {['Temporary', 'Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous'].map((type) => (
                            <div
                              key={type}
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
                        style={styles.modalInput}
                        value={newEmployee.date_hired || ''}
                        onChange={(e) => setNewEmployee({ ...newEmployee, date_hired: e.target.value })}
                      />
                    </div>

                    <div style={styles.modalActions}>
                      <button style={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                      <button style={styles.saveBtn} onClick={handleAddEmployee}>Save</button>
                    </div>
                  </div>
                </div>
              )}

        {isDeleting && (
          <div style={{
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
            <p style={{
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
        <div style={styles.directory}>

          <div style={styles.header1}>
            <div>
              <FontAwesomeIcon icon={faSearch} style={styles.searchIcon} />
              <input
                placeholder='Search by name, email, or position'
                style={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              style={styles.filterStatus}
              value={filterEmploymentStatus}
              onChange={(e) => setFilterEmploymentStatus(e.target.value)}
            >
              <option value="">Filter by Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
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

          <div style={styles.cardGrid}>
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
                  style={{ ...styles.card, cursor: 'pointer' }}
                  onClick={() => navigate(`/employeeProfile/${emp.id}`)}
                >
                  <div style={styles.avatarContainer}>
                    {emp.profile_picture ? (
                      <img src={emp.profile_picture} alt="Profile" style={styles.avatar} />
                    ) : (
                      <div style={{
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

                  <div style={styles.info}>
                    <p style={styles.name}>{`${emp.first_name || ''} ${emp.last_name || ''}`.trim()}</p>
                    <p style={styles.position}>{emp.position || '—'}</p>
                    <p style={styles.department}>{emp.department || '—'}</p>
                  </div>
                </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={styles.paginationContainer}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              style={styles.pageBtn}
            >{'<'}</button>

            {[...Array(Math.ceil(employeeRecord.length / itemsPerPage))].map((_, idx) => {
              const page = idx + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    ...styles.pageBtn,
                    ...(currentPage === page ? styles.activePageBtn : {}),
                  }}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(employeeRecord.length / itemsPerPage)))}
              style={styles.pageBtn}
            >{'>'}</button>
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
  }

};

export default Employees;