import React, { useState, useEffect } from 'react';
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
  faPlus,
  faEye,
  faTrash,
  faPen,
  faCircle,
  faDownload
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
  const fileInputRef = React.useRef(null);

  const [newEmployee, setNewEmployee] = useState({
    full_name: '',
    email: '',
    position: '',
    department_id: '',
    employment_status: '',
    gender: '',
    status: 'active',
    date_hired: '',
  });



  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

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

  const fetchDepartments = async () => {
  const { data, error } = await supabase.from('departments').select('*');
  if (!error) setDepartments(data);
};


const handleButtonClick = () => {
  fileInputRef.current.click();
}

const handleCSVUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 🗂 Fetch department data
  const { data: departments, error: deptError } = await supabase
    .from("departments")
    .select("id, name");

  if (deptError) {
    alert("Error fetching departments: " + deptError.message);
    return;
  }

  // 🧭 Map department names to IDs
  const departmentMap = Object.fromEntries(
    departments.map((d) => [d.name.trim(), d.id])
  );

  // 📦 Parse CSV and validate
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
            }
          : null;
      });

      // ✅ Final validation
      const isValid = (emp) =>
        emp &&
        emp.full_name &&
        emp.email &&
        emp.position &&
        emp.employment_status &&
        emp.department_id;

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


const handleDeleteClick = (employee) => {
  setEmployeeToDelete(employee);
  setShowDeleteModal(true);
};


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


const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    alert('Error signing out: ' + error.message);
  } else {
    window.location.href = '/'; // or navigate('/login') if using react-router
  }
};

const handleAddEmployee = async () => {
  const { full_name, email, position, department_id, employment_status, gender, status } = newEmployee;

  // Basic validation
  if (!full_name || !email || !position || !department_id || !employment_status || !gender || !status) {
    alert('Please fill in all required fields.');
    return;
  }

  const { error } = await supabase.from('employees').insert([
    {
      full_name,
      email,
      position,
      department_id,
      employment_status,
      gender,
      status,
      is_admin: false, // Assuming new employees are not admins by default
      date_hired: newEmployee.date_hired || new Date().toISOString().split('T')[0], // Default to today if not provided
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
      position: '',
      department_id: '',
      employment_status: '',
      gender: '',
      status: 'active',
      date_hired: '',
    });
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
          <button style={styles.btn1}>Manage Employees</button>
          <button style={styles.btn}>Directory</button>
        </div>

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
                  <th style={styles.columnName}>Name</th>
                  <th style={styles.columnName}>Position</th>
                  <th style={styles.columnName}>Department</th>
                  <th style={styles.columnName}>Employee Type</th>
                  <th style={styles.columnName}>Gender</th>
                  <th style={styles.columnName}>Status</th>
                  <th style={styles.columnName}>Email</th>
                  <th style={styles.columnName}>Date Hired</th>
                  <th style={styles.columnName}>Action</th>
                </tr>
              </thead>
              <tbody>
                {employeeRecord.map((record, index) => (
                  <tr key={record.id}>
                    <td style={styles.rowName}>{index + 1}</td>
                    <td style={styles.rowName}>{record.full_name}</td>
                    <td style={styles.rowName}>{record.position}</td>
                    <td style={styles.rowName}>{departments.find(d => d.id === record.department_id)?.name || '—'}</td>
                    <td style={styles.rowName}>{record.employment_status}</td>
                    <td style={styles.rowName}>{record.gender}</td>
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
                    <td style={styles.rowName}>{record.date_hired}</td>
                    <td style={styles.rowName}>
                      <button style={styles.viewBtn}>
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button style={styles.editBtn}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#fff', padding: 20, margin: '100px auto', width: 400, borderRadius: 10 }}>
            <p>Are you sure you want to import {employeesToUpload.length} employee(s)?</p>
            <button onClick={confirmUpload} style={{ marginRight: 10 }}>Yes</button>
            <button onClick={() => setShowConfirmModal(false)}>Cancel</button>
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
    marginBottom: '20px',
    gap: '20px',
    justifyContent: 'flex-start',
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
    backgroundColor: '#6FCB5C',
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
  pageNumber: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 10px 10px 10px',
  },
  pages: {
    display: 'flex', 
    flexDirection: 'row', 
    gap: '10px',
    alignItems: 'center'
  },
  btnNext: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#fefcf5',
    border: '1px solid rgb(195, 195, 195)',
    gap: '10px',
    borderRadius: '5px',
    padding: '2px'
  },
  btnArrowLeft: {
    padding: '0 10px',
    backgroundColor: '#fff',
    borderRight: '1px solid rgb(195, 195, 195)',
    borderLeft: 'none',
    borderTop: 'none',
    borderBottom: 'none'
  },
  btnArrowRight: {
    padding: '0 10px',
    backgroundColor: '#fff',
    borderRight: 'none',
    borderLeft: '1px solid rgb(195, 195, 195)',
    borderTop: 'none',
    borderBottom: 'none'
  },
  txtBottom: {
    fontSize: '13px',
  },
  optionNumber: {
    fontSize: '13px'
  },
  btnIconNext: {
    fontSize: '12px'
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
  
  
  
};

export default Employees;