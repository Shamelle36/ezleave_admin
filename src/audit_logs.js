import React from 'react';
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
  faDownload,
  faFilter,
  faSearch,
  faExclamationTriangle,
  faChevronLeft,
  faChevronRight,
  faEye,
  faFlag,
  faShieldAlt,
  faHistory,
  faChartLine,
  faNoteSticky
} from '@fortawesome/free-solid-svg-icons';
import 'react-calendar/dist/Calendar.css';
import { useState, useEffect } from 'react';
import './dashboardCalendar.css';
import ProfileDropdown from './profileDropdown';

function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSuspiciousOnly, setShowSuspiciousOnly] = useState(false);
  const [suspiciousLogs, setSuspiciousLogs] = useState([]);
  const [suspiciousPatterns, setSuspiciousPatterns] = useState([]);
  const [monitoringStats, setMonitoringStats] = useState({
    totalLogs: 0,
    suspiciousAlerts: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0
  });
  
  const recordsPerPage = 10;
  const [admin, setAdmin] = useState(JSON.parse(localStorage.getItem("admin")) || null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    role: "",
    profile_picture: "",
  });
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [timeRange, setTimeRange] = useState('all');
  const [realTimeUpdates, setRealTimeUpdates] = useState(false);
  
  const navigate = useNavigate();
  const API_URL = "https://ezleave-admin-api.onrender.com";

  // Suspicious activity patterns to monitor
  const SUSPICIOUS_PATTERNS = [
    {
      pattern: /(login.*fail|invalid.*password|failed.*login)/i,
      severity: 'high',
      description: 'Failed login attempts',
      weight: 3
    },
    {
      pattern: /(unauthorized|permission.*denied|access.*denied)/i,
      severity: 'high',
      description: 'Unauthorized access attempts',
      weight: 4
    },
    {
      pattern: /(delete|remove|drop|truncate)/i,
      severity: 'high',
      description: 'Data deletion activities',
      weight: 4
    },
    {
      pattern: /(admin.*created|superuser.*added)/i,
      severity: 'high',
      description: 'Admin user creation',
      weight: 5
    },
    {
      pattern: /(bulk.*delete|mass.*delete)/i,
      severity: 'critical',
      description: 'Bulk deletion operations',
      weight: 5
    },
    {
      pattern: /(password.*change|password.*reset)/i,
      severity: 'medium',
      description: 'Password changes',
      weight: 2
    },
    {
      pattern: /(export.*data|download.*all|backup)/i,
      severity: 'medium',
      description: 'Data export activities',
      weight: 2
    },
    {
      pattern: /(ip.*changed|location.*changed)/i,
      severity: 'medium',
      description: 'IP/location changes',
      weight: 2
    },
    {
      pattern: /(after.*hours|weekend|holiday)/i,
      severity: 'low',
      description: 'Non-working hour activities',
      weight: 1
    },
    {
      pattern: /(multiple.*devices|concurrent.*login)/i,
      severity: 'medium',
      description: 'Multiple device logins',
      weight: 2
    },
    {
      pattern: /(sensitive.*data|confidential)/i,
      severity: 'high',
      description: 'Sensitive data access',
      weight: 3
    },
    {
      pattern: /(system.*setting|configuration.*change)/i,
      severity: 'high',
      description: 'System configuration changes',
      weight: 3
    }
  ];

  // Thresholds for suspicious activity
  const SUSPICIOUS_THRESHOLDS = {
    high: { score: 5, color: '#DC2626' },
    medium: { score: 3, color: '#F59E0B' },
    low: { score: 1, color: '#10B981' }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("admin"));
    if (storedUser) {
      setAdmin(storedUser);
      setProfileData({
        full_name: storedUser.full_name || storedUser.name || "",
        email: storedUser.email || "",
        role: storedUser.role || "",
        profile_picture: storedUser.profile_picture || ""
      });
    }
  }, []);

  useEffect(() => {
    const fetchInitialProfile = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("admin"));
        if (!storedUser) return;

        const url = storedUser.role === "office_head" 
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

        const url = storedUser.role === "office_head" 
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

  // Analyze log for suspicious activity
  const analyzeSuspiciousActivity = (log) => {
    let score = 0;
    const detectedPatterns = [];
    const combinedText = `${log.activity} ${log.details}`.toLowerCase();

    SUSPICIOUS_PATTERNS.forEach(pattern => {
      if (pattern.pattern.test(combinedText)) {
        score += pattern.weight;
        detectedPatterns.push({
          description: pattern.description,
          severity: pattern.severity,
          weight: pattern.weight
        });
      }
    });

    // Additional analysis based on metadata
    if (log.ip_address) {
      // Check for unusual IP patterns (simplified)
      if (log.ip_address.startsWith('192.168.') || log.ip_address.startsWith('10.')) {
        // Internal IP - normal
      } else {
        // External IP - could be suspicious if combined with other factors
        if (score > 0) score += 1;
      }
    }

    // Time-based analysis
    const logTime = new Date(log.created_at);
    const hour = logTime.getHours();
    if (hour < 6 || hour > 22) {
      score += 1;
      detectedPatterns.push({
        description: 'Activity during non-working hours',
        severity: 'low',
        weight: 1
      });
    }

    // Determine severity level
    let severity = 'normal';
    if (score >= SUSPICIOUS_THRESHOLDS.high.score) {
      severity = 'high';
    } else if (score >= SUSPICIOUS_THRESHOLDS.medium.score) {
      severity = 'medium';
    } else if (score >= SUSPICIOUS_THRESHOLDS.low.score) {
      severity = 'low';
    }

    return {
      ...log,
      suspiciousScore: score,
      suspiciousSeverity: severity,
      suspiciousPatterns: detectedPatterns,
      isSuspicious: score > 0
    };
  };

  // Fetch and analyze audit logs
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const response = await fetch(`${API_URL}/api/audit-logs`);
        const data = await response.json();
        
        let logs = [];
        if (data.logs && data.summary) {
          logs = data.logs;
        } else {
          logs = data;
        }

        // Analyze each log for suspicious activity
        const analyzedLogs = logs.map(log => analyzeSuspiciousActivity(log));
        
        setAuditLogs(analyzedLogs);
        
        // Calculate statistics
        const suspiciousLogs = analyzedLogs.filter(log => log.isSuspicious);
        const highRisk = suspiciousLogs.filter(log => log.suspiciousSeverity === 'high').length;
        const mediumRisk = suspiciousLogs.filter(log => log.suspiciousSeverity === 'medium').length;
        const lowRisk = suspiciousLogs.filter(log => log.suspiciousSeverity === 'low').length;

        setMonitoringStats({
          totalLogs: analyzedLogs.length,
          suspiciousAlerts: suspiciousLogs.length,
          highRisk,
          mediumRisk,
          lowRisk
        });

        // Extract suspicious patterns for display
        const patterns = [];
        suspiciousLogs.forEach(log => {
          log.suspiciousPatterns.forEach(pattern => {
            const existing = patterns.find(p => p.description === pattern.description);
            if (existing) {
              existing.count++;
            } else {
              patterns.push({ ...pattern, count: 1 });
            }
          });
        });
        
        setSuspiciousPatterns(patterns.sort((a, b) => b.count - a.count).slice(0, 5));

      } catch (err) {
        console.error("Error fetching logs:", err);
      }
    };

    fetchAuditLogs();

    // Set up real-time updates if enabled
    if (realTimeUpdates) {
      const interval = setInterval(fetchAuditLogs, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [realTimeUpdates]);

  // Filter logs based on search term, role, and severity
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.activity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.suspiciousPatterns?.some(p => 
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesRole = selectedRole === 'All' || log.role === selectedRole;
    const matchesSeverity = selectedSeverity === 'All' || log.suspiciousSeverity === selectedSeverity;
    const matchesSuspicious = !showSuspiciousOnly || log.isSuspicious;
    
    return matchesSearch && matchesRole && matchesSeverity && matchesSuspicious;
  });

  // Get unique roles and severities for filters
  const uniqueRoles = ['All', ...new Set(auditLogs.map(log => log.role).filter(Boolean))];
  const uniqueSeverities = ['All', 'high', 'medium', 'low', 'normal'];

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

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#DC2626';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      case 'normal': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'high': return 'High Risk';
      case 'medium': return 'Medium Risk';
      case 'low': return 'Low Risk';
      case 'normal': return 'Normal';
      default: return 'Normal';
    }
  };

  const toggleLogDetails = (logId) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  const exportSuspiciousLogs = () => {
    const logsToExport = showSuspiciousOnly 
      ? filteredLogs 
      : auditLogs.filter(log => log.isSuspicious);
    
    const csvContent = [
      ['Timestamp', 'User', 'Role', 'Activity', 'Severity', 'Score', 'Patterns', 'IP Address', 'Details'],
      ...logsToExport.map(log => [
        log.created_at,
        log.full_name || 'N/A',
        log.role || 'N/A',
        log.activity || 'N/A',
        log.suspiciousSeverity,
        log.suspiciousScore,
        log.suspiciousPatterns.map(p => p.description).join('; '),
        log.ip_address || 'N/A',
        log.details || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suspicious-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.dashboardContainer}>
      <div className="attendance-desktop-header" style={styles.header}>
        <div style={styles.headerRight}>
          <ProfileDropdown
            showProfileModal={showProfileModal}
            setShowProfileModal={setShowProfileModal}
            isMobile={false}
            profileData={profileData}
            admin={admin}
          />
        </div>
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
            <h1>Audit Logs</h1>
          </div>
          
        </div>

        {/* Monitoring Overview */}
        <div style={styles.monitoringOverview}>
          <div style={styles.overviewStats}>
            <div style={styles.overviewStat}>
              <div style={styles.overviewStatNumber}>{monitoringStats.totalLogs}</div>
              <div style={styles.overviewStatLabel}>Total Activities</div>
            </div>
            <div style={styles.overviewStat}>
              <div style={styles.overviewStatNumber}>{monitoringStats.suspiciousAlerts}</div>
              <div style={styles.overviewStatLabel}>Suspicious Activities</div>
            </div>
            <div style={styles.overviewStat}>
              <div style={styles.overviewStatNumber}>{monitoringStats.highRisk}</div>
              <div style={styles.overviewStatLabel}>High Risk</div>
            </div>
            <div style={styles.overviewStat}>
              <div style={styles.overviewStatNumber}>{monitoringStats.mediumRisk}</div>
              <div style={styles.overviewStatLabel}>Medium Risk</div>
            </div>
            <div style={styles.overviewStat}>
              <div style={styles.overviewStatNumber}>{monitoringStats.lowRisk}</div>
              <div style={styles.overviewStatLabel}>Low Risk</div>
            </div>
          </div>
        </div>

        {/* Suspicious Patterns Section */}
        {suspiciousPatterns.length > 0 && (
          <div style={styles.patternsContainer}>
            <div style={styles.patternsHeader}>
              <FontAwesomeIcon icon={faExclamationTriangle} style={styles.patternsIcon} />
              <h4 style={styles.patternsTitle}>Detected Suspicious Patterns</h4>
            </div>
            <div style={styles.patternsGrid}>
              {suspiciousPatterns.map((pattern, index) => (
                <div key={index} style={styles.patternCard}>
                  <div style={styles.patternDescription}>{pattern.description}</div>
                  <div style={styles.patternDetails}>
                    <span style={styles.patternSeverity(pattern.severity)}>
                      {pattern.severity.toUpperCase()}
                    </span>
                    <span style={styles.patternCount}>{pattern.count} occurrences</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div style={styles.filtersContainer}>
          <div style={styles.searchContainer}>
            <FontAwesomeIcon icon={faSearch} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search logs, patterns, or details..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          

          <div style={styles.filterGroup}>
            <select 
              style={styles.roleFilter}
              value={selectedSeverity}
              onChange={(e) => {
                setSelectedSeverity(e.target.value);
                setCurrentPage(1);
              }}
            >
              {uniqueSeverities.map(severity => (
                <option key={severity} value={severity}>
                  {getSeverityLabel(severity)}
                </option>
              ))}
            </select>
          </div>

          <button
            style={{
              ...styles.suspiciousToggle,
              ...(showSuspiciousOnly ? styles.suspiciousToggleActive : {})
            }}
            onClick={() => {
              setShowSuspiciousOnly(!showSuspiciousOnly);
              setCurrentPage(1);
            }}
          >
            <FontAwesomeIcon icon={faExclamationTriangle} />
            {showSuspiciousOnly ? 'Show All Logs' : 'Show Suspicious Only'}
          </button>
        </div>

        {/* Table Section */}
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <div>
              Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredLogs.length)} of {filteredLogs.length} records
              {showSuspiciousOnly && ' (Suspicious activities only)'}
            </div>
          </div>
          
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeaderCell}>Date & Time</th>
                  <th style={styles.tableHeaderCell}>User</th>
                  <th style={styles.tableHeaderCell}>Role</th>
                  <th style={styles.tableHeaderCell}>Activity</th>
                  <th style={styles.tableHeaderCell}>Severity</th>
                  <th style={styles.tableHeaderCell}>Details</th>
                  <th style={styles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.length > 0 ? (
                  currentRecords.map((log, index) => (
                    <React.Fragment key={log.id || index}>
                      <tr 
                        style={{
                          ...(index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd),
                          ...(log.isSuspicious ? {
                            borderLeft: `4px solid ${getSeverityColor(log.suspiciousSeverity)}`
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
                            <div style={styles.userEmail}>{log.email || ''}</div>
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          <span style={styles.roleBadge(log.role)}>
                            {log.role || 'N/A'}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.activityCell}>
                            {log.activity || 'N/A'}
                            {log.isSuspicious && (
                              <FontAwesomeIcon 
                                icon={faExclamationTriangle} 
                                style={{ 
                                  marginLeft: '8px', 
                                  color: getSeverityColor(log.suspiciousSeverity) 
                                }} 
                              />
                            )}
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          {log.isSuspicious ? (
                            <div style={styles.severityBadge(log.suspiciousSeverity)}>
                              <span style={styles.severityDot}></span>
                              {getSeverityLabel(log.suspiciousSeverity)}
                              <div style={styles.scoreBadge}>{log.suspiciousScore}</div>
                            </div>
                          ) : (
                            <span style={styles.normalBadge}>Normal</span>
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.detailsCell}>
                            {log.details || 'No details available'}
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          <button
                            style={styles.viewDetailsButton}
                            onClick={() => toggleLogDetails(log.id || index)}
                          >
                            <FontAwesomeIcon icon={expandedLogId === (log.id || index) ? faChevronLeft : faEye} />
                            {expandedLogId === (log.id || index) ? 'Hide' : 'View'}
                          </button>
                        </td>
                      </tr>
                      {expandedLogId === (log.id || index) && (
                        <tr>
                          <td colSpan="7" style={styles.expandedDetails}>
                            <div style={styles.expandedContent}>
                              <div style={styles.expandedSection}>
                                <h5 style={styles.expandedTitle}>Suspicious Activity Analysis</h5>
                                {log.isSuspicious ? (
                                  <div>
                                    <div style={styles.analysisRow}>
                                      <span style={styles.analysisLabel}>Severity:</span>
                                      <span style={styles.analysisValue}>
                                        <span style={styles.severityBadgeInline(log.suspiciousSeverity)}>
                                          {getSeverityLabel(log.suspiciousSeverity)}
                                        </span>
                                      </span>
                                    </div>
                                    <div style={styles.analysisRow}>
                                      <span style={styles.analysisLabel}>IP Address:</span>
                                      <code style={styles.ipAddress}>{log.ip_address || 'N/A'}</code>
                                    </div>
                                    <div style={styles.analysisRow}>
                                      <span style={styles.analysisLabel}>Timestamp:</span>
                                      <span style={styles.analysisValue}>{formatDateTime(log.created_at)}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={styles.noSuspiciousActivity}>
                                    No suspicious patterns detected in this activity.
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={styles.noDataCell}>
                      <div style={styles.noData}>
                        <div style={styles.noDataIcon}><FontAwesomeIcon icon={faNoteSticky}/></div>
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
                Page {currentPage} of {totalPages} • {filteredLogs.length} total logs
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
    marginLeft: '300px',
    minHeight: '100vh',
    backgroundColor: '#F8F8F8',
    boxSizing: 'border-box',
    maxWidth: 'calc(100% - 280px)',
    paddingTop: '80px',
    paddingRight: '20px'
  },
  btnActive: {
    backgroundColor: '#A8FC0080',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  },

  
  pageTitle: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: '8px',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#666',
  },
  headerActions: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  exportButton: {
    padding: '10px 20px',
    backgroundColor: '#009205',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#007A04',
    },
    ':disabled': {
      backgroundColor: '#94A3B8',
      cursor: 'not-allowed',
    },
  },
  realTimeToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer',
  },

  // Monitoring Overview
  monitoringOverview: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    margin: '0 0 32px 0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #E5E7EB',
  },
  overviewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  overviewIcon: {
    color: '#009205',
    fontSize: '24px',
  },
  overviewTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1F2937',
    margin: 0,
  },
  overviewStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '20px',
  },
  overviewStat: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    transition: 'all 0.3s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
    },
  },
  overviewStatNumber: {
    fontSize: '36px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  overviewStatLabel: {
    fontSize: '14px',
    color: '#6B7280',
    fontWeight: '500',
  },

  // Suspicious Patterns
  patternsContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #E5E7EB',
  },
  patternsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  patternsIcon: {
    color: '#DC2626',
    fontSize: '20px',
  },
  patternsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1F2937',
    margin: 0,
  },
  patternsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  patternCard: {
    padding: '16px',
    backgroundColor: '#FEF2F2',
    borderRadius: '8px',
    border: '1px solid #DC2626',
  },
  patternDescription: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: '8px',
  },
  patternDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patternSeverity: (severity) => ({
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: 
      severity === 'high' ? '#FEE2E2' :
      severity === 'medium' ? '#FEF3C7' :
      severity === 'low' ? '#D1FAE5' : '#F3F4F6',
    color: 
      severity === 'high' ? '#991B1B' :
      severity === 'medium' ? '#92400E' :
      severity === 'low' ? '#065F46' : '#374151',
  }),
  patternCount: {
    fontSize: '12px',
    color: '#6B7280',
  },

  // Filters
  filtersContainer: {
    display: 'flex',
    gap: '16px',
    margin: '24px 0 24px 0',
    flexWrap: 'wrap',
    alignItems: 'center',
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
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    transition: 'all 0.2s ease',
    ':focus': {
      outline: 'none',
      borderColor: '#009205',
      boxShadow: '0 0 0 3px rgba(0, 146, 5, 0.1)',
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
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
    ':focus': {
      outline: 'none',
      borderColor: '#009205',
    },
  },
  suspiciousToggle: {
    padding: '12px 24px',
    backgroundColor: 'white',
    color: '#DC2626',
    border: '1px solid #DC2626',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#FEF2F2',
    },
  },
  suspiciousToggleActive: {
    backgroundColor: '#DC2626',
    color: 'white',
    ':hover': {
      backgroundColor: '#B91C1C',
    },
  },

  // Table Container
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    margin: '0 0 32px 0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #E5E7EB',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  tableHeaderActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  timeRangeSelect: {
    padding: '8px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '1200px',
  },
  tableHeaderCell: {
    padding: '16px 24px',
    textAlign: 'left',
    backgroundColor: '#F9FAFB',
    color: '#374151',
    fontWeight: '600',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '2px solid #E5E7EB',
    whiteSpace: 'nowrap',
  },
  tableRowEven: {
    backgroundColor: 'white',
  },
  tableRowOdd: {
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    padding: '20px 24px',
    fontSize: '14px',
    color: '#374151',
    verticalAlign: 'middle',
    borderBottom: '1px solid #E5E7EB',
  },
  dateTimeCell: {
    fontSize: '13px',
    color: '#6B7280',
    fontWeight: '500',
  },
  userCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  userName: {
    fontWeight: '500',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: '12px',
    color: '#6B7280',
  },
  roleBadge: (role) => ({
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: role === 'Admin' ? '#E8F5E9' : 
                    role === 'HR' ? '#E3F2FD' : 
                    role === 'Manager' ? '#FFF3E0' : '#F3F4F6',
    color: role === 'Admin' ? '#2E7D32' : 
           role === 'HR' ? '#1565C0' : 
           role === 'Manager' ? '#EF6C00' : '#6B7280',
  }),
  activityCell: {
    fontWeight: '500',
    maxWidth: '250px',
    lineHeight: '1.4',
    display: 'flex',
    alignItems: 'center',
  },
  severityBadge: (severity) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: 
      severity === 'high' ? '#FEE2E2' :
      severity === 'medium' ? '#FEF3C7' :
      severity === 'low' ? '#D1FAE5' : '#F3F4F6',
    
  }),
  severityDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'currentColor',
  },
  scoreBadge: {
    backgroundColor: 'white',
    color: 'inherit',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: '700',
  },
  normalBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  detailsCell: {
    maxWidth: '300px',
    lineHeight: '1.5',
    color: '#4B5563',
  },
  viewDetailsButton: {
    padding: '8px 16px',
    backgroundColor: '#F3F4F6',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#E5E7EB',
    },
  },
  expandedDetails: {
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  },
  expandedContent: {
    padding: '24px',
  },
  expandedSection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    border: '1px solid #E5E7EB',
  },
  expandedTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '16px',
  },
  analysisRow: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '12px',
    gap: '12px',
  },
  analysisLabel: {
    minWidth: '140px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6B7280',
  },
  analysisValue: {
    fontSize: '14px',
    color: '#1F2937',
    flex: 1,
  },
  severityBadgeInline: (severity) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: 
      severity === 'high' ? '#FEE2E2' :
      severity === 'medium' ? '#FEF3C7' :
      severity === 'low' ? '#D1FAE5' : '#F3F4F6',
    color: 
      severity === 'high' ? '#991B1B' :
      severity === 'medium' ? '#92400E' :
      severity === 'low' ? '#065F46' : '#374151',
  }),
  patternsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  patternTag: (severity) => ({
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    backgroundColor: 
      severity === 'high' ? '#FEE2E2' :
      severity === 'medium' ? '#FEF3C7' :
      severity === 'low' ? '#D1FAE5' : '#F3F4F6',
    color: 
      severity === 'high' ? '#991B1B' :
      severity === 'medium' ? '#92400E' :
      severity === 'low' ? '#065F46' : '#374151',
  }),
  ipAddress: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #E5E7EB',
  },
  noSuspiciousActivity: {
    padding: '16px',
    backgroundColor: '#F0FDF4',
    borderRadius: '6px',
    color: '#065F46',
    textAlign: 'center',
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
    color: '#9CA3AF',
  },
  noDataIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  noDataHint: {
    fontSize: '13px',
    color: '#D1D5DB',
    marginTop: '4px',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderTop: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  paginationInfo: {
    fontSize: '14px',
    color: '#6B7280',
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
    width: '40px',
    height: '40px',
    border: '1px solid #D1D5DB',
    backgroundColor: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#F3F4F6',
      borderColor: '#009205',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      backgroundColor: '#F9FAFB',
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
    width: '40px',
    height: '40px',
    fontSize: '14px',
    color: '#9CA3AF',
  },

  // Tips Section
  tipsContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    margin: '0 24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #E5E7EB',
  },
  tipsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  tipsIcon: {
    color: '#009205',
    fontSize: '20px',
  },
  tipsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1F2937',
    margin: 0,
  },
  tipsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
  },
  tipCard: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  tipNumber: {
    width: '32px',
    height: '32px',
    backgroundColor: '#009205',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    flexShrink: 0,
  },
  tipContent: {
    flex: 1,
  },
};

export default AuditLogs;