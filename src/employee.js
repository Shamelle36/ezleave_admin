import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import 'react-calendar/dist/Calendar.css';
import './dashboardCalendar.css';
import { supabase } from './lib/supabase';
import Papa from 'papaparse';

  function Employees() {
    const [employeeRecord, setEmployeeRecords] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [employeesToUpload, setEmployeesToUpload] = useState([]);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [employeesToEdit, setEmployeesToEdit] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [view, setView] = useState('list'); // 'list' or 'directory'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const fileInputRef = React.useRef(null);
    const navigate = useNavigate();

    const [newEmployee, setNewEmployee] = useState({
      full_name: '',
      email: '',
      position: '',
      department_id: '',
      employment_status: '',
      gender: '',
      status: 'active',
      date_hired: '',
      id_number: '',
      contact_number: '',
      civil_status: '',
    });

    // Fetch employees and departments on mount
    useEffect(() => {
      fetchEmployees();
      fetchDepartments();
    }, []);

    // Fetch employees and departments
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
        if (!error) {
          setEmployeeRecords(data)
        }
        else {
          console.error('Error fetching employees:', error.message);
        };
    };

    // Fetch departments
    const fetchDepartments = async () => {
      const { data, error } = await supabase.from('departments').select('*');
      if (!error) setDepartments(data);
    };

    // Handle file input click
    const handleButtonClick = () => {
      fileInputRef.current.click();
    }

    // Handle CSV upload and parse
    const handleCSVUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Fetch department data
      const { data: departments, error: deptError } = await supabase
        .from("departments")
        .select("id, name");

      if (deptError) {
        alert("Error fetching departments: " + deptError.message);
        return;
      }

      // Map department names to IDs
      const departmentMap = Object.fromEntries(
        departments.map((d) => [d.name.trim(), d.id])
      );

      // Parse CSV and validate
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const employeesRaw = results.data.map((row) => {
            const deptId = departmentMap[row.department?.trim()];
            return deptId
              ? {
                  full_name: row.full_name?.trim(),
                  email: row.email?.trim(),
                  position: row.position?.trim(),
                  employment_status: row.employment_status?.trim(),
                  department_id: deptId,
                  gender: row.gender?.trim(),
                  date_hired: row.date_hired?.trim() || new Date().toISOString().split('T')[0],
                  civil_status: row.civil_status?.trim(),
                }
              : null;
          });

          //  Final validation
          const isValid = (emp) =>
            emp &&
            emp.full_name &&
            emp.email &&
            emp.position &&
            emp.employment_status &&
            emp.department_id &&
            emp.gender &&
            emp.date_hired &&
            emp.civil_status;


          const validEmployees = employeesRaw.filter(isValid);

          if (validEmployees.length === 0) {
            alert(
              "No valid employees to upload. Please check your CSV for correct formatting and department names."
            );
            return;
          }

          setEmployeesToUpload(validEmployees);
          setShowConfirmModal(true);
        },
      });
    };

    // Confirm upload of employees
    const confirmUpload = async () => {
      setShowConfirmModal(false);

      try {
        const { error } = await supabase
          .from("employees")
          .insert(employeesToUpload);

        if (error) {
          console.error("Supabase insert error:", error);
          employeesToUpload.forEach((emp, i) =>
            console.log(`Employee ${i + 1}:`, emp)
          );
          alert("Error uploading employees: " + error.message);
        } else {
          alert("Employees imported successfully!");
          fetchEmployees();
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        alert("Unexpected error: " + err.message);
      }
    };

    // Handle delete button click
    const handleDeleteClick = (employee) => {
      setEmployeeToDelete(employee);
      setShowDeleteModal(true);
    };

    // Confirm delete action
    const confirmDelete = async () => {
      if (!employeeToDelete) return;

      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeToDelete.id);

      if (error) {
        alert('Error deleting employee: ' + error.message);
      } else {
        alert('Employee deleted successfully!');
        fetchEmployees(); // Refresh list
      }

      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    };

    // Handle logout
    const handleLogout = async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert('Error signing out: ' + error.message);
      } else {
        window.location.href = '/';
      }
    };

    // Handle adding a new employee
    const handleAddEmployee = async () => {
      const { full_name, email, position, department_id, employment_status, gender, status, id_number, contact_number, civil_status } = newEmployee;

      // Basic validation
      if (!full_name || !email || !position || !department_id || !employment_status || !gender || !status || !id_number || !contact_number || !civil_status ) {
        alert('Please fill in all required fields.');
        return;
      }

      const { error } = await supabase.from('employees').insert([
        {
          full_name,
          email,
          id_number,
          position,
          department_id,
          employment_status,
          gender,
          status,
          contact_number,
          is_admin: false, // Assuming new employees are not admins by default
          date_hired: newEmployee.date_hired || new Date().toISOString().split('T')[0], // Default to today if not provided
          civil_status,
        }
      ]);

      if (error) {
        console.error('Error adding employee:', error.message);
        alert('Error adding employee: ' + error.message);
      } else {
        alert('Employee added successfully!');
        setShowAddModal(false);
        setNewEmployee({
          full_name: '',
          email: '',
          id_number: '',
          contact_number: '',
          position: '',
          department_id: '',
          employment_status: '',
          gender: '',
          status: 'active',
          date_hired: '',
          civil_status,
        });
        fetchEmployees();
      }
    };

    // Handle view button click
    const handleViewClick = (employee) => {
      setSelectedEmployee(employee);
      setShowViewModal(true);
    }

    // Handle edit button click
    const handleEditClick = (employee) => {
      setEmployeesToEdit({
          id: employee.id,
          full_name: employee.full_name,
          position: employee.position,
          department_id: employee.department_id,
          id_number: employee.id_number || '', // Make sure this is included
          contact_number: employee.contact_number || '',
          employment_status: employee.employment_status,
          date_hired: employee.date_hired,
          civil_status: employee.civil_status,
        });

      setShowEditModal(true);
    }

    // Handle saving edits
    const handleEditSave = async () => {
      
      const { id, ...updates } = employeesToEdit;

      const { error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating employee:', error.message);
        alert('Error updating employee: ' + error.message);
      } else {
        alert('Employee updated successfully!');
        setShowEditModal(false);
        fetchEmployees();
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
          <li><Link style={styles.sb} to="/dashboard"><FontAwesomeIcon icon={faTachometerAlt} style={styles.icon} /> Dashboard</Link></li>
          <li style={styles.btnActive}><Link style={styles.sb} to="/employee"><FontAwesomeIcon icon={faUsers} style={styles.icon} /> Employees</Link></li>
          <li><Link style={styles.sb} to="/attendance"><FontAwesomeIcon icon={faCalendarCheck} style={styles.icon} /> Attendance</Link></li>
          <li><Link style={styles.sb} to="/leaveManagement"><FontAwesomeIcon icon={faCalendarAlt} style={styles.icon} /> Leave Management</Link></li>
          <li><Link style={styles.sb} to="/messages"><FontAwesomeIcon icon={faEnvelope} style={styles.icon} /> Message</Link></li>
          <li><Link style={styles.sb} to="/announcement"><FontAwesomeIcon icon={faBullhorn} style={styles.icon} /> Announcement</Link></li>
          <li><Link style={styles.sb} to="/audit_logs"><FontAwesomeIcon icon={faClipboardList} style={styles.icon} /> Audit Logs</Link></li>
          <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faUserCog} style={styles.icon} /> User Management</Link></li>
          <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faCog} style={styles.icon} /> Settings</Link></li>
          <li>
            <button style={{ ...styles.sb, background: 'none', border: 'none', cursor: 'pointer' }} onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} style={styles.icon} /> Logout
            </button>
          </li>
        </ul>
      </div>

      <div style={styles.content}>
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
              <p>List of Employee</p>
              <div>
                <button style={styles.importBtn} onClick={handleButtonClick}>
                  <FontAwesomeIcon icon={faDownload} style={styles.iconImport} />
                  Import CSV
                </button>
                <input 
                  type="file" 
                  accept=".csv" 
                  ref={fileInputRef}
                  onChange={handleCSVUpload} 
                  style={{display: 'none'}} 
                />
                <button style={styles.btnAddEmployee} onClick={() => setShowAddModal(true)}><FontAwesomeIcon icon={faPlus} style={styles.btnIconAdd} />Add Employee</button>
              </div>
            </div>

            <div style={styles.table}>
              <table style={styles.employeeTable}>
                <thead>
                  <tr>
                    <th style={styles.columnName}>No.</th>
                    <th style={styles.columnName}>ID Number</th>
                    <th style={styles.columnName}>Name</th>
                    <th style={styles.columnName}>Position</th>
                    <th style={styles.columnName}>Department</th>
                    <th style={styles.columnName}>Status of Employment</th>
                    <th style={styles.columnName}>Gender</th>
                    <th style={styles.columnName}>Civil Status</th>
                    <th style={styles.columnName}>Status</th>
                    <th style={styles.columnName}>Email</th>
                    <th style={styles.columnName}>Contact Number</th>
                    <th style={styles.columnName}>Date Hired</th>
                    <th style={styles.columnName}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeRecord.map((record, index) => (
                    <tr key={record.id}>
                      <td style={styles.rowName}>{index + 1}</td>
                      <td style={styles.rowName}>{record.id_number || '—'}</td>
                      <td style={styles.rowName}>{record.full_name}</td>
                      <td style={styles.rowName}>{record.position}</td>
                      <td style={styles.rowName}>{departments.find(d => d.id === record.department_id)?.name || '—'}</td>
                      <td style={styles.rowName}>{record.employment_status}</td>
                      <td style={styles.rowName}>{record.gender}</td>
                      <td style={styles.rowName}>{record.civil_status}</td>
                      <td style={styles.rowName}>
                        <FontAwesomeIcon
                          icon={faCircle}
                          style={{
                            color:
                              record.status === 'active'
                                ? 'green'
                                : record.status === 'inactive'
                                ? 'red'
                                : 'gray',
                            marginRight: 5,
                          }}
                        />
                        {record.status}
                      </td>
                      <td style={styles.rowName}>{record.email}</td>
                      <td style={styles.rowName}>{record.contact_number || '—'}</td>
                      <td style={styles.rowName}>{record.date_hired}</td>
                      <td style={styles.rowName}>
                        <button style={styles.viewBtn} onClick={() => handleViewClick(record)}>
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button style={styles.editBtn} onClick={() => handleEditClick(record)}>
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button style={styles.delBtn} onClick={() => handleDeleteClick(record)}>
                          <FontAwesomeIcon icon={faTrash}/>
                        </button>
                      </td>   
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <div style={styles.confirmModal}>
                  <div style={styles.viewModalCard}>
                    <div style={styles.profileSection}>
                      <img
                        src={selectedEmployee.profile_url || 'https://via.placeholder.com/100'}
                        alt="Profile"
                        style={styles.profileImage}
                      />
                      <h2 style={styles.viewModalHeader}>{selectedEmployee.full_name}</h2>
                      <p style={styles.viewSubtext}>{selectedEmployee.position}</p>
                      <p style={styles.viewSubtext}>{selectedEmployee.id_number}</p>
                    </div>

                    <div style={styles.viewModalContent}>
                      <div style={styles.viewRow}>
                        <label>Email:</label>
                        <span>{selectedEmployee.email}</span>
                      </div>
                      <div style={styles.viewRow}>
                        <label>Contact Number:</label>
                        <span>{selectedEmployee.contact_number}</span>
                      </div>
                      <div style={styles.viewRow}>
                        <label>Department:</label>
                        <span>{departments.find(d => d.id === selectedEmployee.department_id)?.name || '—'}</span>
                      </div>
                      <div style={styles.viewRow}>
                        <label>Employment Status:</label>
                        <span>{selectedEmployee.employment_status}</span>
                      </div>
                      <div style={styles.viewRow}>
                        <label>Gender:</label>
                        <span>{selectedEmployee.gender}</span>
                      </div>
                      <div style={styles.viewRow}>
                        <label>Civil Status:</label>
                        <span>{selectedEmployee.civil_status}</span>
                      </div>
                      <div style={styles.viewRow}>
                        <label>Status:</label>
                        <span>{selectedEmployee.status}</span>
                      </div>
                      <div style={styles.viewRow}>
                        <label>Date Hired:</label>
                        <span>{selectedEmployee.date_hired}</span>
                      </div>
                    </div>

                    <button onClick={() => setShowViewModal(false)} style={styles.viewCloseBtn}>
                      Close
                    </button>
                  </div>
                </div>
              )}

              
              {showEditModal && employeesToEdit && (
                  <div style={styles.confirmModal}>
                    <div style={{ ...styles.questionModal, width: '500px', textAlign: 'left' }}>
                      <h3>Edit Employee</h3>
                      <input 
                        style={styles.modalInputs}
                        value={employeesToEdit.full_name}
                        onChange={(e) => setEmployeesToEdit({ ...employeesToEdit, full_name: e.target.value })}
                        placeholder="Full Name"
                      />
                      <input 
                        style={styles.modalInputs}
                        value={employeesToEdit.email}
                        onChange={(e) => setEmployeesToEdit({ ...employeesToEdit, email: e.target.value })}
                        placeholder="Email"
                      />
                      <input 
                        style={styles.modalInputs}
                        value={employeesToEdit.position}
                        onChange={(e) => setEmployeesToEdit({ ...employeesToEdit, position: e.target.value })}
                        placeholder="Position"
                      />
                      <input
                        style={styles.modalInputs}
                        value={employeesToEdit.id_number || ''}
                        onChange={(e) => setEmployeesToEdit({ ...employeesToEdit, id_number: e.target.value })}  
                        placeholder='ID Number (e.g., 20230606)'
                      />
                      <input 
                        style={styles.modalInputs}
                        value={employeesToEdit.contact_number || ''}
                        onChange={(e) => setEmployeesToEdit({ ...employeesToEdit, contact_number: e.target.value })}
                        placeholder='Contact Number (e.g., 09171234567)'
                      />

                      <select
                        style={styles.modalInputs}
                        value={employeesToEdit.civil_status}
                        onChange={(e) => setEmployeesToEdit({...employeesToEdit, civil_status: e.target.value})}  
                      >
                        <option value="" disabled>Select Civil Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                        <option value="Annulled">Annulled</option>
                      </select>

                      <select
                        style={styles.modalInputs}
                        value={employeesToEdit.department_id}
                        onChange={(e) => setEmployeesToEdit({ ...employeesToEdit, department_id: e.target.value })}
                      >
                        <option value="" disabled>Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                      <select
                        style={styles.modalInputs}
                        value={employeesToEdit.employment_status}
                        onChange={(e) => setEmployeesToEdit({ ...employeesToEdit, employment_status: e.target.value })}
                      >
                        <option value="">Select Employment Type</option>
                        <option value="temporary">Temporary</option>
                        <option value="permanent">Permanent</option>
                        <option value="contract">Contract</option>
                        <option value="casual">Casual</option>
                      </select>
                      <select
                        style={styles.modalInputs}
                        value={employeesToEdit.status}
                        onChange={(e) => setEmployeesToEdit({ ...employeesToEdit, status: e.target.value })}
                      >
                        <option value="">Select Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                      <input 
                        type="date"
                        style={styles.modalInputs}
                        value={employeesToEdit.date_hired}
                        onChange={(e) => setEmployeesToEdit({ ...employeesToEdit, date_hired: e.target.value })}
                      />
                      <div style={styles.modalBtn}>
                        <button style={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
                        <button style={styles.saveBtn} onClick={handleEditSave}>Save</button>
                      </div>
                    </div>
                  </div>
              )}



              {showDeleteModal && (
                <div style={{
                  position: 'fixed', top: 0, left: 0,
                  width: '100%', height: '100%',
                  background: 'rgba(0,0,0,0.5)'
                }}>
                  <div style={{
                    background: '#fff', padding: 20,
                    margin: '100px auto', width: 400,
                    borderRadius: 10
                  }}>
                    <p>Are you sure you want to delete {employeeToDelete?.full_name}?</p>
                    <button onClick={confirmDelete} style={{ marginRight: 10, backgroundColor: 'red', color: '#fff' }}>
                      Yes, Delete
                    </button>
                    <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {showAddModal && (
                <div style={{
                  position: 'fixed',
                  top: 0, left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999
                }}>

                <div style={{
                  backgroundColor: 'white',
                  padding: 20,
                  borderRadius: 8,
                  width: 500,
                  boxShadow: '0 0 10px rgba(0,0,0,0.2)'
                }}>

                <h3>Add New Employee</h3>
                  <input 
                    placeholder="Full Name" 
                    style={styles.modalInputs} 
                    value={newEmployee.full_name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                  />
                  <input 
                    placeholder="Email" 
                    style={styles.modalInputs} 
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}  
                  />
                  <input 
                    placeholder="Position" 
                    style={styles.modalInputs} 
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}  
                  />
                  <input
                    type="text"
                    placeholder="ID Number (e.g., 20230606)"
                    value={newEmployee.id_number || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d{0,8}$/.test(value)) {
                        setNewEmployee(prev => ({
                          ...prev,
                          id_number: value
                        }));
                      }
                    }}
                    style={styles.modalInputs}
                  />
                  <input
                    type="text"
                    placeholder="Contact Number (e.g., 09171234567)"
                    value={newEmployee.contact_number}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d{0,11}$/.test(value)) {
                        setNewEmployee(prev => ({
                          ...prev,
                          contact_number: value
                        }));
                      }
                    }}
                    style={styles.modalInputs}
                  />
                  <label>Gender</label>
                    <div style={styles.genderInputs}>
                      <div style={styles.radioCircle}>
                        <input
                          type='radio' 
                          name='gender' 
                          value="Male"
                          checked={newEmployee.gender === 'Male'}
                          onChange={(e) => setNewEmployee({ ...newEmployee, gender: e.target.value })}
                        />
                        <label style={{fontSize: '15px'}}>Male</label>
                      </div>

                      <div style={styles.radioCircle}>
                        <input 
                          type='radio' 
                          name='gender' 
                          value="Female"
                          checked={newEmployee.gender === 'Female'}
                          onChange={(e) => setNewEmployee({ ...newEmployee, gender: e.target.value })}
                        />
                        <label style={{fontSize: '15px'}}>Female</label>
                      </div>
                    </div>

                      <select
                        style={styles.modalInputs}
                        value={employeesToEdit.civil_status}
                        onChange={(e) => setNewEmployee({...newEmployee, civil_status: e.target.value})}  
                      >
                        <option value="" disabled>Select Civil Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                        <option value="Annulled">Annulled</option>
                      </select>

                    <select 
                      style={styles.modalInputs}
                      value={newEmployee.department_id}
                      onChange={(e) => setNewEmployee({ ...newEmployee, department_id: e.target.value })}
                    >
                      <option value="" disabled hidden>Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>

                    <select 
                      style={styles.modalInputs}
                      value={newEmployee.employment_status}
                      onChange={(e) => setNewEmployee({ ...newEmployee, employment_status: e.target.value })}
                    >
                      <option value="">Select Employment Type</option>
                      <option value="temporary">Temporary</option>
                      <option value="permanent">Permanent</option>
                      <option value="contract">Contract</option>
                      <option value="casual">Casual</option>
                    </select>
                    <select 
                      style={styles.modalInputs}
                      value={newEmployee.status}
                      onChange={(e) => setNewEmployee({ ...newEmployee, status: e.target.value })}
                    >
                      <option value="">Select Employment Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <input
                      type="date"
                      placeholder="Date Hired"
                      style={styles.modalInputs}
                      value={newEmployee.date_hired || ''}
                      onChange={(e) => setNewEmployee({ ...newEmployee, date_hired: e.target.value })}
                      />

                    <div style={styles.modalBtn}>
                      <button onClick={() => setShowAddModal(false)} style={styles.cancelBtn}>Cancel</button>
                      <button style={styles.saveBtn} onClick={handleAddEmployee}>Save</button>
                    </div>
                </div>
              </div>
            )}
        </div>
      )}

      {view === 'directory' && (
        <div style={styles.directory}>

          <div style={styles.header1}>
            <div>
              <FontAwesomeIcon icon={faSearch} style={styles.searchIcon} />
              <input placeholder='Search' style={styles.searchInput}/>
            </div>

            <select style={styles.filterStatus}>
              <option value="">Filter by Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select style={styles.filterStatus2}>
              <option value="">Filter by Department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            <select style={styles.filterStatus}>
              <option value="">Filter by Employment Type</option>
              <option value="temporary">Temporary</option>
              <option value="permanent">Permanent</option>
              <option value="contract">Contract</option>
              <option value="casual">Casual</option>
            </select>

          </div>

          <div style={styles.cardGrid}>
            {employeeRecord
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((emp) => (
                <div
                  key={emp.id}
                  style={{ ...styles.card, cursor: 'pointer' }}
                  onClick={() => navigate(`/employeeProfile/${emp.id_number}`)}
                >
                  <div style={styles.avatarContainer}>
                    {emp.profile_url ? (
                      <img src={emp.profile_url} alt="Profile" style={styles.avatar} />
                    ) : (
                      <div style={styles.initials}>
                        {emp.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div style={styles.info}>
                    <p style={styles.name}>{emp.full_name}</p>
                    <p style={styles.position}>{emp.position}</p>
                    <p style={styles.department}>
                      {departments.find(d => d.id === emp.department_id)?.name || '—'}
                    </p>
                  </div>
                </div>
            ))}
          </div>


          <div style={styles.paginationContainer}>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                style={styles.pageBtn}
              >
                {'<'}
              </button>

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
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, Math.ceil(employeeRecord.length / itemsPerPage))
                  )
                }
                style={styles.pageBtn}
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
    backgroundColor: '#fff',
    boxShadow: '1px 1px 5px rgba(44, 44, 44, 0.44)',
    border: 'none',
    marginTop: '20px',
    width: '1200px',
  },
  firstRow: {
    justifyContent: 'space-between',
    display: 'flex',
    flex: '1',
    padding: '10px 10px 0 10px'
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
    overflowX: 'auto',
    marginLeft: '10px',
    marginRight: '10px',
    marginBottom: '20px',
    marginTop: '10px',

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
    padding: '10px 30px',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'left',
    backgroundColor: '#6FCB5C',
    color: '#2B2B2B',
    textWrap: 'nowrap',
  },
  rowName: {
    padding: '10px 0 10px 30px',
    fontSize: '13px',
    backgroundColor: '#fefcf5',
    textWrap: 'nowrap',
  },
  viewBtn: {
    backgroundColor: '#fff',
    border: 'none',
    cursor: 'pointer',
    color: '#1E90fd',
    marginRight: '15px'
  },
  editBtn: {
    backgroundColor: '#fff',
    border: 'none',
    cursor: 'pointer',
    color: '#FFA500',
    marginRight: '15px'
  },
  delBtn: {
    backgroundColor: '#fff',
    border: 'none',
    cursor: 'pointer',
    color: '#FF0000',
    marginRight: '10px'
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
  cancelBtn: {
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  saveBtn: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: '600'
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
  backgroundColor: '#e4e4e4',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 500,
},

activePageBtn: {
  backgroundColor: '#d4d4d4',
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

profileSection: {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: '20px',
},

profileImage: {
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  objectFit: 'cover',
  marginBottom: '10px',
  border: '2px solid #e0e0e0',
},

viewModalHeader: {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1A1A1A',
  margin: 0,
},

viewSubtext: {
  fontSize: '14px',
  color: '#666',
  marginBottom: '20px',
},

viewModalContent: {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  color: '#333',
  textAlign: 'left',
},

viewRow: {
  display: 'flex',
  justifyContent: 'space-between',
  borderBottom: '1px solid #e5e5e5',
  paddingBottom: '6px',
  fontSize: '14px',
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


  
  
  
  
};

export default Employees;