import React from 'react';
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
  faNoteSticky,
  faBars,
  faTimes,
  faAngleLeft,
  faAngleRight,
  faAnglesLeft,
  faAnglesRight,
  faChevronDown,
  faUpload,
  faPrint,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import './dashboardCalendar.css';
import './audit-logs-responsive.css';
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
  const location = useLocation();
  const API_URL = "https://ezleave-admin-api.onrender.com";
  
  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [role, setRole] = useState(localStorage.getItem("role") || "admin");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: faTachometerAlt, to: "/dashboard" },
    { name: "Employees", icon: faUsers, to: "/employee" },
    { name: "Leave Management", icon: faCalendarAlt, to: "/leaveManagement" },
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
        "Leave Management",
      ].includes(item.name);
    }
    return false;
  });

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

  // Pagination handlers for mobile
  const handlePaginationClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      handlePaginationClick(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      handlePaginationClick(currentPage - 1);
    }
  };

  const goToFirstPage = () => handlePaginationClick(1);
  const goToLastPage = () => handlePaginationClick(totalPages);

  return (
    <div style={styles.dashboardContainer}>
      {/* Mobile Header */}
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
            profileData={profileData}
            admin={admin}
          />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="mobile-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Desktop Sidebar */}
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
        </ul>
      </div>

      {/* Desktop Header */}
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

      {/* Main Content */}
      <div className="content" style={styles.content}>
        {showLogoutModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent} className="modal-content">
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

        {/* Header Section */}
        <div className="audit-header-section" style={styles.pageHeader}>
          <h1 className="audit-title">Audit Logs</h1>
          <div className="audit-title-line" style={styles.line}></div>
        </div>

        {/* Monitoring Overview - Mobile Responsive Cards */}
        <div className="audit-monitoring-overview" style={styles.monitoringOverview}>
          <div className="audit-overview-card" style={styles.overviewStatCard}>
            <div className="audit-card-content" style={styles.overviewStatCardContent}>
              <div className="audit-card-data" style={styles.overviewStatData}>
                <div className="audit-data1" style={styles.overviewStatNumberContainer}>
                  <p className="audit-txtData" style={styles.overviewStatNumber}>{monitoringStats.totalLogs}</p>
                  <p className="audit-txtlabel" style={styles.overviewStatLabel}>Total Activities</p>
                </div>
              </div>
            </div>
          </div>

          <div className="audit-overview-card" style={styles.overviewStatCard}>
            <div className="audit-card-content" style={styles.overviewStatCardContent}>
              <div className="audit-card-data" style={styles.overviewStatData}>
                <div className="audit-data1" style={styles.overviewStatNumberContainer}>
                  <p className="audit-txtData" style={styles.overviewStatNumber}>{monitoringStats.suspiciousAlerts}</p>
                  <p className="audit-txtlabel" style={styles.overviewStatLabel}>Suspicious Activities</p>
                </div>
              </div>
            </div>
          </div>

          <div className="audit-overview-card" style={styles.overviewStatCard}>
            <div className="audit-card-content" style={styles.overviewStatCardContent}>
              <div className="audit-card-data" style={styles.overviewStatData}>
                <div className="audit-data1" style={styles.overviewStatNumberContainer}>
                  <p className="audit-txtData" style={styles.overviewStatNumber}>{monitoringStats.highRisk}</p>
                  <p className="audit-txtlabel" style={styles.overviewStatLabel}>High Risk</p>
                </div>
              </div>
            </div>
          </div>

          <div className="audit-overview-card" style={styles.overviewStatCard}>
            <div className="audit-card-content" style={styles.overviewStatCardContent}>
              <div className="audit-card-data" style={styles.overviewStatData}>
                <div className="audit-data1" style={styles.overviewStatNumberContainer}>
                  <p className="audit-txtData" style={styles.overviewStatNumber}>{monitoringStats.mediumRisk}</p>
                  <p className="audit-txtlabel" style={styles.overviewStatLabel}>Medium Risk</p>
                </div>
              </div>
            </div>
          </div>

          <div className="audit-overview-card" style={styles.overviewStatCard}>
            <div className="audit-card-content" style={styles.overviewStatCardContent}>
              <div className="audit-card-data" style={styles.overviewStatData}>
                <div className="audit-data1" style={styles.overviewStatNumberContainer}>
                  <p className="audit-txtData" style={styles.overviewStatNumber}>{monitoringStats.lowRisk}</p>
                  <p className="audit-txtlabel" style={styles.overviewStatLabel}>Low Risk</p>
                </div>
              </div>
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
            <div className="audit-patterns-grid" style={styles.patternsGrid}>
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
        <div className="attendance-inputs-section" style={styles.filtersContainer}>
          <div className="attendance-row1" style={styles.filterRow}>
            <div className="attendance-firstRow" style={styles.searchContainer}>
              <FontAwesomeIcon icon={faSearch} style={styles.searchIcon} />
              <input
                type="text"
                className="attendance-input1"
                style={styles.searchInput}
                placeholder="Search logs, patterns, or details..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="attendance-firstRow" style={styles.filterGroup}>
              <select 
                className="attendance-filter"
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
          </div>

          <div className="attendance-row2" style={styles.actionRow}>
            <button
              style={{
                ...styles.suspiciousToggle,
                ...(showSuspiciousOnly ? styles.suspiciousToggleActive : {})
              }}
              className="attendance-btn1"
              onClick={() => {
                setShowSuspiciousOnly(!showSuspiciousOnly);
                setCurrentPage(1);
              }}
            >
              <FontAwesomeIcon icon={faExclamationTriangle} />
              {showSuspiciousOnly ? 'Show All Logs' : 'Show Suspicious Only'}
            </button>

            <button
              onClick={exportSuspiciousLogs}
              className="attendance-btn2"
              style={styles.exportButton}
              disabled={auditLogs.length === 0}
            >
              <FontAwesomeIcon icon={faDownload} style={styles.iconBtn1} />
              Export CSV
            </button>

            <button onClick={() => window.location.reload()} className="attendance-btn3" style={styles.btn3}>
              <FontAwesomeIcon icon={faRefresh} style={styles.iconBtn1} />
              Refresh
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="attendance-table-container" style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <div>
              Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredLogs.length)} of {filteredLogs.length} records
              {showSuspiciousOnly && ' (Suspicious activities only)'}
            </div>
          </div>
          
          <div className="attendance-table-wrapper" style={styles.tableWrapper}>
            <table className="attendance-table" style={styles.table}>
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
            <div className="attendance-pagination" style={styles.paginationContainer}>
              <div className="attendance-pagination-info" style={styles.paginationInfo}>
                Page {currentPage} of {totalPages} • {filteredLogs.length} total logs
              </div>
              
              <div className="attendance-pagination-controls" style={styles.paginationControls}>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    goToFirstPage();
                  }}
                  disabled={currentPage === 1}
                  style={currentPage === 1 ? styles.paginationButtonDisabled : styles.paginationButton}
                  className="attendance-pagination-first"
                >
                  <FontAwesomeIcon icon={faAnglesLeft} />
                </button>
                
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    goToPrevPage();
                  }}
                  disabled={currentPage === 1}
                  style={currentPage === 1 ? styles.paginationButtonDisabled : styles.paginationButton}
                  className="attendance-pagination-prev"
                >
                  <FontAwesomeIcon icon={faAngleLeft} />
                </button>
                
                {getPageNumbers().map((number, index) => (
                  number === '...' ? (
                    <span key={`ellipsis-${index}`} style={styles.paginationEllipsis}>...</span>
                  ) : (
                    <button
                      key={number}
                      onClick={(e) => {
                        e.preventDefault();
                        paginate(number);
                      }}
                      style={{
                        ...styles.paginationButton,
                        ...(currentPage === number ? styles.activePageButton : {})
                      }}
                      className="attendance-pagination-number"
                    >
                      {number}
                    </button>
                  )
                ))}
                
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    goToNextPage();
                  }}
                  disabled={currentPage === totalPages}
                  style={currentPage === totalPages ? styles.paginationButtonDisabled : styles.paginationButton}
                  className="attendance-pagination-next"
                >
                  <FontAwesomeIcon icon={faAngleRight} />
                </button>
                
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    goToLastPage();
                  }}
                  disabled={currentPage === totalPages}
                  style={currentPage === totalPages ? styles.paginationButtonDisabled : styles.paginationButton}
                  className="attendance-pagination-last"
                >
                  <FontAwesomeIcon icon={faAnglesRight} />
                </button>
              </div>
              
              <div className="attendance-pagination-perpage" style={styles.paginationPerPage}>
                <span>Items per page:</span>
                <select 
                  value={recordsPerPage} 
                  onChange={(e) => {
                    // You can add functionality to change items per page if needed
                  }}
                  style={styles.paginationSelect}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
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
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    position: "relative",
    marginLeft: 'auto',
    justifyContent: 'flex-end'
  },
  content: {
    marginLeft: '300px',
    padding: '20px',
    backgroundColor: '#F8F8F8',
    marginTop: '60px', 
    overflow: 'hidden',
    minHeight: 'calc(100vh - 60px)',
    boxSizing: 'border-box',
  },
  pageHeader: {
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
  // Monitoring Overview Styles
  monitoringOverview: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  overviewStatCard: {
    backgroundColor: '#fff',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #E5E7EB',
    transition: 'transform 0.2s',
    textAlign: 'center',
  },
  overviewStatCardContent: {
    marginTop: '0',
  },
  overviewStatData: {
    gap: '0',
  },
  overviewStatNumberContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewStatNumber: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    margin: '0',
    lineHeight: '1.2',
  },
  overviewStatLabel: {
    fontSize: '13px',
    color: '#6B7280',
    margin: '8px 0 0 0',
    textAlign: 'center',
  },
  // Patterns Container
  patternsContainer: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
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
    fontSize: '18px',
  },
  patternsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1F2937',
    margin: 0,
  },
  patternsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '12px',
  },
  patternCard: {
    padding: '14px',
    backgroundColor: '#FEF2F2',
    borderRadius: '8px',
    border: '1px solid #DC2626',
  },
  patternDescription: {
    fontSize: '13px',
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
    padding: '3px 10px',
    borderRadius: '10px',
    fontSize: '10px',
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
    fontSize: '11px',
    color: '#6B7280',
  },
  // Filters Section
  filtersContainer: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  filterRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '12px',
    flexWrap: 'wrap',
  },
  searchContainer: {
    flex: '1',
    minWidth: '250px',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#999',
    fontSize: '14px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 15px 10px 35px',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    transition: 'all 0.2s ease',
  },
  filterGroup: {
    minWidth: '200px',
  },
  roleFilter: {
    width: '100%',
    padding: '10px 15px',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  actionRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  suspiciousToggle: {
    padding: '10px 16px',
    backgroundColor: 'white',
    color: '#DC2626',
    border: '1px solid #DC2626',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  suspiciousToggleActive: {
    backgroundColor: '#DC2626',
    color: 'white',
  },
  exportButton: {
    padding: '10px 16px',
    backgroundColor: '#46810390',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  // Table Container
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #E5E7EB',
    overflow: 'hidden',
    marginBottom: '32px',
  },
  tableHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
    fontSize: '14px',
    color: '#6B7280',
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
    padding: '14px 20px',
    textAlign: 'left',
    backgroundColor: '#F9FAFB',
    color: '#374151',
    fontWeight: '600',
    fontSize: '12px',
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
    padding: '16px 20px',
    fontSize: '13px',
    color: '#374151',
    verticalAlign: 'middle',
    borderBottom: '1px solid #E5E7EB',
  },
  dateTimeCell: {
    fontSize: '12px',
    color: '#6B7280',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  userCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  userName: {
    fontWeight: '500',
    color: '#1F2937',
    fontSize: '13px',
  },
  userEmail: {
    fontSize: '11px',
    color: '#6B7280',
  },
  roleBadge: (role) => ({
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
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
    maxWidth: '200px',
    lineHeight: '1.4',
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
  },
  severityBadge: (severity) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: 
      severity === 'high' ? '#FEE2E2' :
      severity === 'medium' ? '#FEF3C7' :
      severity === 'low' ? '#D1FAE5' : '#F3F4F6',
    width: 'fit-content',
  }),
  severityDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'currentColor',
  },
  scoreBadge: {
    backgroundColor: 'white',
    color: 'inherit',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '9px',
    fontWeight: '700',
  },
  normalBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  detailsCell: {
    maxWidth: '250px',
    lineHeight: '1.5',
    color: '#4B5563',
    fontSize: '12px',
  },
  viewDetailsButton: {
    padding: '6px 12px',
    backgroundColor: '#F3F4F6',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
  },
  expandedDetails: {
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  },
  expandedContent: {
    padding: '16px',
  },
  expandedSection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #E5E7EB',
  },
  expandedTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '12px',
  },
  analysisRow: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '10px',
    gap: '10px',
    fontSize: '13px',
  },
  analysisLabel: {
    minWidth: '100px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#6B7280',
  },
  analysisValue: {
    fontSize: '13px',
    color: '#1F2937',
    flex: 1,
  },
  severityBadgeInline: (severity) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '10px',
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
  ipAddress: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    padding: '3px 6px',
    borderRadius: '4px',
    border: '1px solid #E5E7EB',
  },
  noSuspiciousActivity: {
    padding: '12px',
    backgroundColor: '#F0FDF4',
    borderRadius: '6px',
    color: '#065F46',
    textAlign: 'center',
    fontSize: '13px',
  },
  noDataCell: {
    padding: '40px 20px',
    textAlign: 'center',
  },
  noData: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    color: '#9CA3AF',
  },
  noDataIcon: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  noDataHint: {
    fontSize: '12px',
    color: '#D1D5DB',
    marginTop: '4px',
  },
  // Pagination Styles
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderTop: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
    flexWrap: 'wrap',
    gap: '15px',
  },
  paginationInfo: {
    fontSize: '13px',
    color: '#6B7280',
    fontWeight: '500',
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  paginationButton: {
    padding: '6px 10px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#333',
    transition: 'all 0.2s',
    minWidth: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationButtonDisabled: {
    padding: '6px 10px',
    border: '1px solid #e0e0e0',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    cursor: 'not-allowed',
    fontSize: '13px',
    color: '#999',
    minWidth: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePageButton: {
    backgroundColor: '#009205',
    color: '#fff',
    borderColor: '#009205',
  },
  paginationEllipsis: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    fontSize: '13px',
    color: '#9CA3AF',
  },
  paginationPerPage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#666',
  },
  paginationSelect: {
    padding: '5px 8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
  },
  // Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    width: "400px",
    textAlign: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },
  modalActions: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "space-around",
  },
  cancelBtn: {
    backgroundColor: "#ccc",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  confirmBtn: {
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  // Button Styles from Attendance
  btn1: {
    padding: '10px 10px',
    borderRadius: '10px',
    fontWeight: '600',
    backgroundColor: 'white',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  btn2: {
    padding: '5px 10px',
    backgroundColor: '#46810390',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  btn3: {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#00B7FF',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  iconBtn1: {
    color: 'white',
    fontSize: '12px',
    margin: '5px 5px 0'
  },
  btnActive: {
    backgroundColor: '#A8FC0080',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  },
};

export default AuditLogs;