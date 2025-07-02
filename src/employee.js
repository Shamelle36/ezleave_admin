import React, { useState } from 'react';
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
  faSearch,
  faEye,
  faArrowLeft,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import 'react-calendar/dist/Calendar.css';
import './dashboardCalendar.css';
import { height, width } from '@fortawesome/free-solid-svg-icons/fa0';
import { BiBorderBottom } from 'react-icons/bi';

function Employees() {

  const [employeeRecord, setEmployeeRecords] = useState([
    {
      id: '001',
      name: 'Shamelle Anne Tadeja',
      position: 'Manager',
      department: 'Human Resource Management Office',
      status: 'Active',
      employmentType: 'Permanent',
      joiningDate: 'March 01, 2024',
      salary: '$1200.00'
    },
    {
      id: '002',
      name: 'Shamelle Anne Tadeja',
      position: 'Manager',
      department: 'Human Resource Management Office',
      status: 'Active',
      employmentType: 'Permanent',
      joiningDate: 'March 01, 2024',
      salary: '$1200.00'
    }
  ])

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
            <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faSignOutAlt} style={styles.icon} /> Logout</Link></li>
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
                    <button style={styles.btnAddEmployee}><FontAwesomeIcon icon={faPlus} style={styles.btnIconAdd}/>Add Employee</button>
                </div>

                <div style={styles.secondRow}>
                    <FontAwesomeIcon icon={faSearch} style={styles.searchIcon}/>
                    <input style={styles.searchInput} type='text' placeholder='Search employees by id, status, etc..'/>

                    <select style={styles.filterStatus}>
                      <option selected disabled hidden>Status: All</option>
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>Retired</option>
                      <option>End of Contract</option>
                    </select>

                    <select style={styles.filterStatus2}>
                      <option selected disabled hidden>Employment Type: All</option>
                      <option>Permanent</option>
                      <option>Contractual</option>
                      <option>Job Order</option>
                      <option>Casual</option>
                    </select>

                    <select style={styles.filterStatus2}>
                            <option disabled selected hidden>Department: All</option>
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


                <div style={styles.table}>
                  <table style={styles.employeeTable}>
                      <thead>
                        <tr>
                          <th style={styles.columnName}><input type='checkbox'/></th>
                          <th style={styles.columnName}>ID</th>
                          <th style={styles.columnName}>Name</th>
                          <th style={styles.columnName}>Position</th>
                          <th style={styles.columnName}>Department</th>
                          <th style={styles.columnName}>Status</th>
                          <th style={styles.columnName}>Employment Type</th>
                          <th style={styles.columnName}>Joining Date</th>
                          <th style={styles.columnName}>Salary</th>
                          <th style={styles.columnName}>View</th>
                        </tr>
                      </thead>

                      <tbody>
                        {employeeRecord.map((record, index) => (
                          <tr key={index}>
                            <td style={styles.rowName}><input type='checkbox'/></td>
                            <td style={styles.rowName}>{record.id}</td>
                            <td style={styles.rowName}>{record.name}</td>
                            <td style={styles.rowName}>{record.position}</td>
                            <td style={styles.rowName}>{record.department}</td>
                            <td style={styles.rowName}>{record.status}</td>
                            <td style={styles.rowName}>{record.employmentType}</td>
                            <td style={styles.rowName}>{record.joiningDate}</td>
                            <td style={styles.rowName}>{record.salary}</td>
                            <td style={styles.rowName}><FontAwesomeIcon icon={faEye}/></td>
                          </tr>
                        ))}
                      </tbody>
                  </table>
                </div>

                <div style={styles.pageNumber}>
                  <div style={styles.pages}>
                    <p style={styles.txtBottom}>Pagination</p>
                  </div>
                  
                  <div style={styles.pages}>
                    <p style={styles.txtBottom}>Total Entries: 200 entries</p>
                    <p style={styles.txtBottom}>Show</p>

                    <select style={styles.optionNumber}>
                      <option>10</option>
                      <option>20</option>
                      <option>30</option>
                      <option>40</option>
                      <option>50</option>
                    </select>

                    <p style={styles.txtBottom}>of 50 rows</p>

                    <p style={styles.txtBottom}>Page</p>
                    
                    <div style={styles.btnNext}>
                        <button style={styles.btnArrowLeft}><FontAwesomeIcon icon={faArrowLeft} style={styles.btnIconNext}/></button>
                        <p style={styles.numberPage}>1</p>
                        <button style={styles.btnArrowRight}><FontAwesomeIcon icon={faArrowRight} style={styles.btnIconNext}/></button>
                    </div>
                  </div>
                </div>
                
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
    padding: '10px'
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
    color: '#2B2B2B'
  },
  rowName: {
    padding: '10px 0 10px 10px',
    fontSize: '13px',
    backgroundColor: '#fefcf5'
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
  numberPage: {

  }

};

export default Employees;