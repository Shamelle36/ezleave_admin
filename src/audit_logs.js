import React from 'react';
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
  faDownload,
  faFilter,
  faSearch,
  faExclamationTriangle,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import 'react-calendar/dist/Calendar.css';
import { useState, useEffect } from 'react';
import './dashboardCalendar.css';

function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [summary, setSummary] = useState({ totalLogs: 0, suspiciousAlerts: 0 });

  const API_URL = "https://ezleave-admin-api.onrender.com";

  useEffect(() => {
    // Fetch audit logs
    fetch(`${API_URL}/api/audit-logs`)
      .then((res) => res.json())
      .then((data) => {
        // If using the first approach (combined response)
        if (data.logs && data.summary) {
          setAuditLogs(data.logs);
          setSummary(data.summary);
        } else {
          // If using separate endpoints
          setAuditLogs(data);
          
          // Fetch summary separately
          fetch(`${API_URL}/api/audit-logs/summary`)
            .then(res => res.json())
            .then(summaryData => setSummary({
              totalLogs: summaryData.total_logs,
              suspiciousAlerts: summaryData.suspicious_alerts
            }))
            .catch(err => console.error("Error fetching summary:", err));
        }
      })
      .catch((err) => console.error("Error fetching logs:", err));
  }, []);

  // Filter logs based on search term and role
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.activity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'All' || log.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  // Get unique roles for filter
  const uniqueRoles = ['All', ...new Set(auditLogs.map(log => log.role).filter(Boolean))];

  // Calculate pagination
  const totalPages = Math.ceil(filteredLogs.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredLogs.slice(indexOfFirstRecord, indexOfLastRecord);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pageNumbers.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pageNumbers;
  };


  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <li><Link style={styles.sb} to="/employee"><FontAwesomeIcon icon={faUsers} style={styles.icon} /> Employees</Link></li>
          <li><Link style={styles.sb} to="/attendance"><FontAwesomeIcon icon={faCalendarCheck} style={styles.icon} /> Attendance</Link></li>
          <li><Link style={styles.sb} to="/leaveManagement"><FontAwesomeIcon icon={faCalendarAlt} style={styles.icon} /> Leave Management</Link></li>
          <li><Link style={styles.sb} to="/messages"><FontAwesomeIcon icon={faEnvelope} style={styles.icon} /> Message</Link></li>
          <li><Link style={styles.sb} to="/announcement"><FontAwesomeIcon icon={faBullhorn} style={styles.icon} /> Announcement</Link></li>
          <li style={styles.btnActive}><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faClipboardList} style={styles.icon} /> Audit Logs</Link></li>
          <li><Link style={styles.sb} to="/userManagement"><FontAwesomeIcon icon={faUserCog} style={styles.icon} /> User Management</Link></li>
        </ul>
      </div>

      <div style={styles.content}>
        {/* Header Section */}
        <div style={styles.pageHeader}>
          <div>
            <h2 style={styles.pageTitle}>Audit Logs</h2>
          </div>
        </div>

        {/* Filters Section */}
        <div style={styles.filtersContainer}>
          <div style={styles.searchContainer}>
            <FontAwesomeIcon icon={faSearch} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name, activity, or details..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
          
          <div style={styles.filterGroup}>
            <FontAwesomeIcon icon={faFilter} style={styles.filterIcon} />
            <select 
              style={styles.roleFilter}
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1); // Reset to first page on filter change
              }}
            >
              {uniqueRoles.map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{filteredLogs.length}</div>
            <div style={styles.statLabel}>Total Logs</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{summary.suspiciousAlerts}</div>
            <div style={styles.statLabel}>Monitoring of Suspicious Alerts</div>
          </div>
        </div>

        {/* Table Section */}
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <div>Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredLogs.length)} of {filteredLogs.length} records</div>
          </div>
          
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeaderCell}>Date & Time</th>
                  <th style={styles.tableHeaderCell}>User</th>
                  <th style={styles.tableHeaderCell}>Role</th>
                  <th style={styles.tableHeaderCell}>Activity</th>
                  <th style={styles.tableHeaderCell}>Details</th>
                  <th style={styles.tableHeaderCell}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.length > 0 ? (
                  currentRecords.map((log, index) => (
                    <tr 
                      key={log.id || index} 
                      style={{
                        ...(index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd),
                        ...(log.activity.toLowerCase().includes('suspicious') || 
                            log.activity.toLowerCase().includes('signup') ? {
                          backgroundColor: '#FFF8E1',
                        } : {})
                      }}
                    >
                      <td style={styles.tableCell}>
                        <div style={styles.dateTimeCell}>
                          {formatDateTime(log.created_at)}
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.userCell}>
                          <div style={styles.userName}>{log.full_name || 'N/A'}</div>
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={styles.roleBadge(log.role)}>
                          {log.role || 'N/A'}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.activityCell}>{log.activity || 'N/A'}</div>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.detailsCell}>
                          {log.details || 'No details available'}
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <code style={styles.ipAddress}>{log.ip_address || 'N/A'}</code>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={styles.noDataCell}>
                      <div style={styles.noData}>
                        <div style={styles.noDataIcon}>📋</div>
                        <div>No audit logs found</div>
                        {searchTerm && (
                          <div style={styles.noDataHint}>
                            Try adjusting your search or filter
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredLogs.length > 0 && (
            <div style={styles.paginationContainer}>
              <div style={styles.paginationInfo}>
                Page {currentPage} of {totalPages}
              </div>
              <div style={styles.paginationControls}>
                <button 
                  style={styles.paginationButton}
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                
                {getPageNumbers().map((number, index) => (
                  number === '...' ? (
                    <span key={`ellipsis-${index}`} style={styles.paginationEllipsis}>...</span>
                  ) : (
                    <button
                      key={number}
                      style={{
                        ...styles.paginationButton,
                        ...(currentPage === number ? styles.activePageButton : {})
                      }}
                      onClick={() => paginate(number)}
                    >
                      {number}
                    </button>
                  )
                ))}
                
                <button 
                  style={styles.paginationButton}
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
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
    minHeight: '100vh',
    backgroundColor: '#F8F8F8',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
  content: {
    marginLeft: '280px',
    padding: '100px 40px 40px 40px',
    minHeight: '100vh',
    backgroundColor: '#F8F8F8',
    boxSizing: 'border-box',
    maxWidth: 'calc(100% - 280px)',
  },
  btnActive: {
    backgroundColor: '#A8FC0080',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  },

  // Enhanced styles for audit logs content
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1A1A1A',
  },
 
  filtersContainer: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  searchContainer: {
    flex: '1',
    minWidth: '300px',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#999',
    fontSize: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 20px 12px 40px',
    border: '1px solid #E0E0E0',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    transition: 'border-color 0.2s ease',
    ':focus': {
      outline: 'none',
      borderColor: '#009205',
      boxShadow: '0 0 0 2px rgba(0, 146, 5, 0.1)',
    },
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '200px',
  },
  filterIcon: {
    color: '#666',
    fontSize: '14px',
  },
  roleFilter: {
    flex: '1',
    padding: '12px 16px',
    border: '1px solid #E0E0E0',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
    ':focus': {
      outline: 'none',
      borderColor: '#009205',
    },
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    textAlign: 'center',
    border: '1px solid #F0F0F0',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#009205',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #F0F0F0',
    overflow: 'hidden',
  },
  tableHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #F0F0F0',
    fontSize: '14px',
    color: '#666',
    backgroundColor: '#FAFAFA',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '1000px',
  },
  tableHeaderCell: {
    padding: '16px 24px',
    textAlign: 'left',
    backgroundColor: '#FAFAFA',
    color: '#333',
    fontWeight: '600',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '2px solid #F0F0F0',
    whiteSpace: 'nowrap',
  },
  tableRowEven: {
    backgroundColor: 'white',
  },
  tableRowOdd: {
    backgroundColor: '#FAFAFA',
  },
  tableCell: {
    padding: '20px 24px',
    fontSize: '14px',
    color: '#333',
    verticalAlign: 'top',
    borderBottom: '1px solid #F0F0F0',
  },
  dateTimeCell: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '500',
  },
  userCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  userName: {
    fontWeight: '500',
    color: '#1A1A1A',
  },
  roleBadge: (role) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: role === 'Admin' ? '#E8F5E9' : 
                    role === 'HR' ? '#E3F2FD' : 
                    role === 'Manager' ? '#FFF3E0' : '#F5F5F5',
    color: role === 'Admin' ? '#2E7D32' : 
           role === 'HR' ? '#1565C0' : 
           role === 'Manager' ? '#EF6C00' : '#666',
  }),
  activityCell: {
    fontWeight: '500',
    maxWidth: '200px',
    lineHeight: '1.4',
  },
  detailsCell: {
    maxWidth: '300px',
    lineHeight: '1.5',
    color: '#555',
  },
  ipAddress: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#666',
    backgroundColor: '#F8F8F8',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #EEE',
  },
  noDataCell: {
    padding: '60px 20px',
    textAlign: 'center',
  },
  noData: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    color: '#999',
  },
  noDataIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  noDataHint: {
    fontSize: '13px',
    color: '#BBB',
    marginTop: '4px',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderTop: '1px solid #F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  paginationInfo: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  paginationButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    border: '1px solid #E0E0E0',
    backgroundColor: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#F5F5F5',
      borderColor: '#009205',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      backgroundColor: '#F8F8F8',
    },
  },
  activePageButton: {
    backgroundColor: '#009205',
    color: 'white',
    borderColor: '#009205',
    ':hover': {
      backgroundColor: '#007A04',
    },
  },
  paginationEllipsis: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    fontSize: '14px',
    color: '#999',
  },
};

export default AuditLogs;