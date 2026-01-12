import React, { useEffect, useState, useRef } from 'react';
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
  faImage,
  faTimes,
  faSpinner,
  faSearch,
  faChevronLeft,
  faChevronRight,
  faPen,
  faBars
} from '@fortawesome/free-solid-svg-icons';
import 'react-calendar/dist/Calendar.css';
import './dashboardCalendar.css';
import { FaEllipsisV } from "react-icons/fa";
import ProfileDropdown from './profileDropdown';
import './announcement-responsive.css';

function Announcement() {
  const [showModal, setShowModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    details: "",
    visibility: "All Employee",
  });
  const navigate = useNavigate();
  const location = useLocation();

  const imageInputRef = useRef(null);
  const [images, setImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [expanded, setExpanded] = useState({});
  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const [menuOpen, setMenuOpen] = useState(null);

  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("All");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const [isMobileView, setIsMobileView] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Loading states
  const [loading, setLoading] = useState({
    post: false,
    update: false,
    delete: false,
    fetch: false
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [role, setRole] = useState(localStorage.getItem("role") || "admin");
  const [hasEllipsis, setHasEllipsis] = useState({});
  
  // Add new state for image carousel
  const [imageCarouselStates, setImageCarouselStates] = useState({});
  const [admin, setAdmin] = useState(JSON.parse(localStorage.getItem("admin")) || null); // Get from localStorage
   const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileData, setProfileData] = useState({
      full_name: "",
      email: "",
      role: "",
      profile_picture: "",
    });

  const menuItems = [
    { name: "Dashboard", icon: faTachometerAlt, to: "/dashboard" },
    { name: "Employees", icon: faUsers, to: "/employee" },
    { name: "Attendance", icon: faCalendarCheck, to: "/attendance" },
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
  
  const API_URL = "https://ezleave-admin-api.onrender.com";


  useEffect(() => {
  const checkMobile = () => {
    if (typeof window !== 'undefined') setIsMobileView(window.innerWidth <= 768);
  };
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);

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

  const checkEllipsis = (id, element) => {
    if (!element) return;
    const isTruncated = element.scrollHeight > element.clientHeight;
    setHasEllipsis(prev => ({ ...prev, [id]: isTruncated }));
  };

  // Initialize carousel state for an announcement
  const initializeCarousel = (announcementId, imageCount) => {
    setImageCarouselStates(prev => ({
      ...prev,
      [announcementId]: {
        currentIndex: 0,
        totalImages: imageCount,
        showArrows: imageCount > 6
      }
    }));
  };

  // Navigate to next image in carousel
  const nextImage = (announcementId) => {
    setImageCarouselStates(prev => {
      const state = prev[announcementId];
      if (!state) return prev;
      
      return {
        ...prev,
        [announcementId]: {
          ...state,
          currentIndex: (state.currentIndex + 1) % state.totalImages
        }
      };
    });
  };

  // Navigate to previous image in carousel
  const prevImage = (announcementId) => {
    setImageCarouselStates(prev => {
      const state = prev[announcementId];
      if (!state) return prev;
      
      return {
        ...prev,
        [announcementId]: {
          ...state,
          currentIndex: (state.currentIndex - 1 + state.totalImages) % state.totalImages
        }
      };
    });
  };

  // Fetch announcements with loading state
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(prev => ({ ...prev, fetch: true }));
      try {
        const res = await fetch(`${API_URL}/api/announcements`);
        const data = await res.json();
        
        // Process data - only handle images now
        const cleanData = (Array.isArray(data) ? data : data.data || []).map((a) => {
          // Process images
          let processedImages = [];
          if (Array.isArray(a.images)) {
            processedImages = a.images;
          } else if (a.images) {
            processedImages = [a.images];
          }

          return {
            ...a,
            images: processedImages,
          };
        });
        setAnnouncements(cleanData);
        setFilteredAnnouncements(cleanData);
      } catch (err) {
        console.error("Error fetching announcements:", err);
      } finally {
        setLoading(prev => ({ ...prev, fetch: false }));
      }
    };

    fetchAnnouncements();
  }, []);

  // Update carousel initialization when announcements change
  useEffect(() => {
    announcements.forEach(announcement => {
      if (announcement.images && announcement.images.length > 0) {
        if (!imageCarouselStates[announcement.id]) {
          initializeCarousel(announcement.id, announcement.images.length);
        }
      }
    });
  }, [announcements]);

  // Apply search and filter whenever searchQuery, visibilityFilter, or announcements change
  useEffect(() => {
    let result = announcements;

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(announcement =>
        announcement.title.toLowerCase().includes(query) ||
        announcement.details.toLowerCase().includes(query) ||
        announcement.posted_by?.toLowerCase().includes(query)
      );
    }

    // Apply visibility filter
    if (visibilityFilter !== "All") {
      result = result.filter(announcement => 
        announcement.visibility === visibilityFilter || 
        (visibilityFilter === "All Employee" && !announcement.visibility)
      );
    }

    setFilteredAnnouncements(result);
  }, [searchQuery, visibilityFilter, announcements]);

  useEffect(() => {
    if (previewImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [previewImage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAnnouncement((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => imageInputRef.current.click();

  const handleImageChange = (e) => {
    setImages((prev) => [...prev, ...Array.from(e.target.files)]);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleVisibilityFilterChange = (e) => {
    setVisibilityFilter(e.target.value);
  };

  const addAnnouncement = async () => {
    const admin = JSON.parse(localStorage.getItem("admin"));
    
    const formData = new FormData();
    formData.append("title", newAnnouncement.title);
    formData.append("details", newAnnouncement.details);
    formData.append("visibility", newAnnouncement.visibility);
    formData.append("created_by", admin.id);

    // Only append images
    images.forEach((img) => {
      formData.append("images", img);
    });

    setLoading(prev => ({ ...prev, post: true }));

    try {
      const res = await fetch(`${API_URL}/api/announcements`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to post announcement");

      const savedAnnouncement = await res.json();
      setAnnouncements([savedAnnouncement, ...announcements]);
      setNewAnnouncement({ title: "", details: "", visibility: "All Employee" });
      setImages([]);
      setShowModal(false);
    } catch (error) {
      console.error("Error posting announcement:", error);
    } finally {
      setLoading(prev => ({ ...prev, post: false }));
    }
  };

  const editAnnouncement = (id) => {
    const announcementToEdit = announcements.find(a => a.id === id);
    setNewAnnouncement({
      title: announcementToEdit.title,
      details: announcementToEdit.details,
      visibility: announcementToEdit.visibility || "All Employee",
    });
    setImages([]);
    setEditingAnnouncement(announcementToEdit);
    setIsEditMode(true); 
    setShowModal(true);
  };

  const deleteAnnouncement = (id) => {
    const announcementToDelete = announcements.find(a => a.id === id);
    setEditingAnnouncement(announcementToDelete);
    setShowDeleteModal(true);
  };

  const saveEditedAnnouncement = async () => {
    setLoading(prev => ({ ...prev, update: true }));

    try {
      const formData = new FormData();
      formData.append("title", newAnnouncement.title);
      formData.append("details", newAnnouncement.details);
      formData.append("visibility", newAnnouncement.visibility);
      
      // Only append images
      images.forEach((img) => formData.append("images", img));

      const res = await fetch(`${API_URL}/api/announcements/${editingAnnouncement.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to save changes");
      const updated = await res.json();

      setAnnouncements(announcements.map(a => a.id === updated.id ? updated : a));
      setShowModal(false);
      setIsEditMode(false);
      setEditingAnnouncement(null);
      setNewAnnouncement({ title: "", details: "", visibility: "All Employee" });
      setImages([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  const confirmDeleteAnnouncement = async () => {
    setLoading(prev => ({ ...prev, delete: true }));

    try {
      const res = await fetch(`${API_URL}/api/announcements/${editingAnnouncement.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete announcement");
      setAnnouncements(announcements.filter(a => a.id !== editingAnnouncement.id));
      setShowDeleteModal(false);
      setEditingAnnouncement(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setVisibilityFilter("All");
  };

 return (
  <div className="dashboard-container" style={styles.dashboardContainer}>
    {/* Global Loading Overlay */}
    {(loading.post || loading.update || loading.delete) && (
      <div style={styles.globalLoadingOverlay}>
        <div className="globalLoadingContent" style={styles.globalLoadingContent}>
          <FontAwesomeIcon icon={faSpinner} spin style={styles.loadingSpinner} />
          <p style={styles.loadingText}>
            {loading.post && "Posting announcement..."}
            {loading.update && "Updating announcement..."}
            {loading.delete && "Deleting announcement..."}
          </p>
        </div>
      </div>
    )}

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
            showNotificationModal={showNotificationModal}
            setShowNotificationModal={setShowNotificationModal}
            isMobile={isMobileView}
            profileData={profileData}
            admin={admin}
          />
      </div>
    </div>

    {/* Mobile Sidebar Overlay */}
    {isSidebarOpen && (
      <div className="mobile-overlay" onClick={() => setIsSidebarOpen(false)}></div>
    )}

    {/* Desktop Header */}
    <div className="desktop-header attendance-desktop-header" style={styles.header}>
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

    {/* Sidebar */}
    <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={styles.sidebar}>
      {/* Mobile Sidebar Header */}
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

      {/* Desktop Logo */}
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

      <div className="announcementBoard" style={styles.announcementBoard}>
        <h1>Announcement</h1>

        <div className="announcementFilter" style={styles.announcementFilter}>
          <div className="announcementLeft" style={styles.announcementLeft}>
            <div className="searchContainer" style={styles.searchContainer}>
              <FontAwesomeIcon icon={faSearch} style={styles.searchIcon} />
              <input 
                className="searchInput"
                style={styles.searchInput} 
                placeholder="Search announcements..." 
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button 
                  style={styles.clearSearchBtn}
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              )}
            </div>
            
            {(searchQuery || visibilityFilter !== "All") && (
              <button 
                className="clearFilterBtn"
                style={styles.clearFilterBtn}
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
          <div>
            <button 
              className="postBtn"
              style={styles.postBtn} 
              onClick={() => setShowModal(true)}
              disabled={loading.post || loading.update || loading.delete}
            >
              <FontAwesomeIcon icon={faPen} style={{paddingRight: '5px'}}/> {loading.post ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>

        {loading.fetch ? (
          <div style={styles.loadingContainer}>
            <FontAwesomeIcon icon={faSpinner} spin style={styles.loadingSpinner} />
            <p>Loading announcements...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div style={styles.noResultsContainer}>
            <p style={styles.noAnnouncementText}>
              {announcements.length === 0 
                ? "No announcements have been posted yet." 
                : "No announcements match your search criteria."}
            </p>
            {(searchQuery || visibilityFilter !== "All") && (
              <button 
                style={styles.clearFilterBtn2}
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div style={styles.announcementsContainer}>
            <div style={styles.resultsCount}>
              Showing {filteredAnnouncements.length} of {announcements.length} announcements
            </div>
            
            {/* 2-Column Grid Layout */}
            <div className="announcementsGrid" style={styles.announcementsGrid}>
              {filteredAnnouncements.map((announcement, index) => {
                const carouselState = imageCarouselStates[announcement.id] || { 
                  currentIndex: 0, 
                  totalImages: 0, 
                  showArrows: false 
                };
                const imagesToShow = announcement.images || [];
                const hasCarousel = imagesToShow.length > 6;
                
                // Get visible images based on carousel state
                let visibleImages = imagesToShow;
                if (hasCarousel) {
                  const startIndex = carouselState.currentIndex;
                  const endIndex = Math.min(startIndex + 6, imagesToShow.length);
                  visibleImages = imagesToShow.slice(startIndex, endIndex);
                  
                  if (endIndex > imagesToShow.length) {
                    const remaining = 6 - (imagesToShow.length - startIndex);
                    visibleImages = [
                      ...imagesToShow.slice(startIndex),
                      ...imagesToShow.slice(0, remaining)
                    ];
                  }
                }

                return (
                  <div
                    key={announcement.id || index}
                    className="announcementCard"
                    style={styles.announcementCard}
                  >
                    <div className="announcementCardContent" style={styles.announcementCardContent}>
                      {/* Header Section */}
                      <div className="announcementHeader" style={styles.announcementHeader}>
                        <div style={styles.announcementSender}>
                          <div style={styles.announcementProfile}>
                            <img src={announcement.profile_picture} alt='Profile' style={styles.announcementProfile}/>
                          </div>
                          <div style={styles.announcementName}>
                            <p style={styles.lblName}>{announcement.posted_by}</p>
                            <p style={styles.lblPosition}>{announcement.position}</p>
                            {announcement.visibility && (
                              <p style={styles.lblVisibility}>
                                Visibility: {announcement.visibility}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="announcementDate" style={styles.announcementDate}>
                          <p style={styles.lblDate}>{announcement.created_at}</p>

                          <div style={{ position: "relative", display: "inline-block" }}>
                            <button
                              style={{
                                ...styles.menuDots,
                                ...((loading.update || loading.delete) && styles.menuDotsDisabled)
                              }}
                              onClick={() =>
                                setMenuOpen(menuOpen === announcement.id ? null : announcement.id)
                              }
                              onBlur={() => setMenuOpen(null)}
                              disabled={loading.update || loading.delete}
                            >
                              <FaEllipsisV />
                            </button>

                            {menuOpen === announcement.id && (
                              <div style={styles.menu}>
                                <button
                                  style={styles.buttonMenu1}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => editAnnouncement(announcement.id)}
                                  disabled={loading.update}
                                >
                                  {loading.update ? 'Editing...' : 'Edit'}
                                </button>
                                <button
                                  style={styles.buttonMenu}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => deleteAnnouncement(announcement.id)}
                                  disabled={loading.delete}
                                >
                                  {loading.delete ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div style={styles.announcementContent}>
                        <div style={styles.announcementText}>
                          <p style={styles.lblTitle}>{announcement.title}</p>
                          <p 
                            ref={(el) => {
                              if (el) {
                                setTimeout(() => checkEllipsis(announcement.id, el), 50);
                              }
                            }}
                            style={{
                              ...styles.lblDetails,
                              textAlign: "justify",
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              WebkitLineClamp: expanded[announcement.id] ? "unset" : 3,
                            }}
                          >
                            {announcement.details}
                          </p>
                        </div>

                        {/* Images Section with Carousel */}
                        {imagesToShow.length > 0 && (
                          <div className="imagesContainerWrapper" style={styles.imagesContainerWrapper}>
                            <div className="imagesContainer" style={styles.imagesContainer}>
                              {/* Left arrow for carousel */}
                              {hasCarousel && (
                                <button 
                                  className="carouselArrowLeft"
                                  style={styles.carouselArrowLeft}
                                  onClick={() => prevImage(announcement.id)}
                                  title="Previous images"
                                >
                                  <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                              )}
                              
                              {/* Images grid */}
                              <div className="imagesGrid" style={{
                                ...styles.imagesGrid,
                                marginLeft: hasCarousel ? '30px' : '0',
                                marginRight: hasCarousel ? '30px' : '0'
                              }}>
                                {visibleImages.map((img, i) => {
                                  const actualIndex = hasCarousel 
                                    ? (carouselState.currentIndex + i) % imagesToShow.length
                                    : i;
                                  
                                  return (
                                    <div key={i} style={styles.imageWrapper}>
                                      <img
                                        src={img} 
                                        alt={`attachment-${actualIndex}`}
                                        className="announcementImage"
                                        style={styles.announcementImage}
                                        onClick={() => setPreviewImage(img)}
                                        title={`Image ${actualIndex + 1} of ${imagesToShow.length}`}
                                      />
                                      {hasCarousel && imagesToShow.length > 6 && (
                                        <div style={styles.imageNumberBadge}>
                                          {actualIndex + 1}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {/* Right arrow for carousel */}
                              {hasCarousel && (
                                <button 
                                  className="carouselArrowRight"
                                  style={styles.carouselArrowRight}
                                  onClick={() => nextImage(announcement.id)}
                                  title="Next images"
                                >
                                  <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                              )}
                            </div>
                            
                            {/* Carousel indicators */}
                            {hasCarousel && imagesToShow.length > 6 && (
                              <div className="carouselIndicators" style={styles.carouselIndicators}>
                                {Array.from({ length: Math.ceil(imagesToShow.length / 6) }).map((_, i) => (
                                  <button
                                    key={i}
                                    style={{
                                      ...styles.carouselIndicator,
                                      ...(Math.floor(carouselState.currentIndex / 6) === i 
                                        ? styles.carouselIndicatorActive 
                                        : {})
                                    }}
                                    onClick={() => {
                                      setImageCarouselStates(prev => ({
                                        ...prev,
                                        [announcement.id]: {
                                          ...prev[announcement.id],
                                          currentIndex: i * 6
                                        }
                                      }));
                                    }}
                                    title={`View images ${i * 6 + 1}-${Math.min((i + 1) * 6, imagesToShow.length)}`}
                                  >
                                    {i + 1}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer Section */}
                      <div className="announcementFooter" style={styles.announcementFooter}>
                        {(hasEllipsis[announcement.id] || expanded[announcement.id]) && ( 
                         <button 
                            onClick={() => toggleExpand(announcement.id)} 
                            style={expanded[announcement.id] 
                              ? { ...styles.readBtn,  backgroundColor: "#fff", border: '1px solid #009205', color: '#009205'}   // Show Less style
                              : { ...styles.readBtn,  backgroundColor: "#009205", color: '#fff'  } // Read More style
                            }
                          >
                            {expanded[announcement.id] ? "Show Less" : "Read More"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {previewImage && (
          <div
            style={styles.previewOverlay}
            onClick={() => setPreviewImage(null)} 
          >
            <img
              src={previewImage}
              alt="preview"
              className="previewImageLarge"
              style={styles.previewImageLarge}
            />

            <button
              onClick={() => setPreviewImage(null)}
              className="closePreviewButton"
              style={styles.closePreviewButton}
            >
              ✕
            </button>
          </div>
        )}

        {showModal && (
          <div style={styles.modalOverlay}>
            <div className="modalContainer" style={styles.modalContainer}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  {isEditMode ? 'Edit Announcement' : 'Post Announcement'}
                </h2>
                <button
                  style={styles.closeButton}
                  onClick={() => {
                    setShowModal(false);
                    setIsEditMode(false);
                    setEditingAnnouncement(null);
                    setNewAnnouncement({ title: "", details: "", visibility: "All Employee" });
                    setImages([]);
                  }}
                  disabled={loading.post || loading.update}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <div className="modalBody" style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Title</label>
                  <input
                    type="text"
                    name="title"
                    value={newAnnouncement.title}
                    onChange={handleInputChange}
                    placeholder="Enter announcement title..."
                    style={styles.formInput}
                    disabled={loading.post || loading.update}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Details</label>
                  <textarea
                    name="details"
                    value={newAnnouncement.details}
                    onChange={handleInputChange}
                    placeholder="Enter announcement details..."
                    style={styles.formTextarea}
                    rows={5}
                    disabled={loading.post || loading.update}
                  />
                </div>

                {images.length > 0 && (
                  <div style={styles.attachmentsSection}>
                    <h4 style={styles.attachmentsTitle}>Image Attachments</h4>
                    <div style={styles.imagesPreview}>
                      {images.map((img, i) => (
                        <div key={i} style={styles.imagePreviewItem}>
                          <img
                            src={URL.createObjectURL(img)}
                            alt="preview"
                            style={styles.previewImage}
                          />
                          <button
                            onClick={() => removeImage(i)}
                            style={styles.removeImageButton}
                            disabled={loading.post || loading.update}
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={styles.uploadSection}>
                  <button 
                    style={{
                      ...styles.uploadButton,
                      ...((loading.post || loading.update) && styles.uploadButtonDisabled)
                    }} 
                    onClick={handleImageClick}
                    disabled={loading.post || loading.update}
                  >
                    <FontAwesomeIcon icon={faImage} style={styles.uploadIcon} />
                    Upload Image
                  </button>
                </div>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={imageInputRef}
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                  disabled={loading.post || loading.update}
                />                       
              </div>

              <div className="modalFooter" style={styles.modalFooter}>
                <button
                  className="cancelButton"
                  style={styles.cancelButton}
                  onClick={() => {
                    setShowModal(false);
                    setIsEditMode(false);
                    setEditingAnnouncement(null);
                    setNewAnnouncement({ title: "", details: "", visibility: "All Employee" });
                    setImages([]);
                  }}
                  disabled={loading.post || loading.update}
                >
                  Cancel
                </button>
                <button
                  className="submitButton"
                  style={{
                    ...styles.submitButton,
                    ...((loading.post || loading.update) && styles.submitButtonDisabled)
                  }}
                  onClick={isEditMode ? saveEditedAnnouncement : addAnnouncement}
                  disabled={loading.post || loading.update}
                >
                  {loading.post || loading.update ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '8px' }} />
                      {isEditMode ? "Saving..." : "Posting..."}
                    </>
                  ) : (
                    isEditMode ? "Save Changes" : "Post Announcement"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div style={styles.modalOverlay}>
            <div className="modalContainerDel" style={styles.modalContainerDel}>
              <p style={styles.questionDelete}>Are you sure you want to delete this announcement?</p>
              <div className="deleteButtons" style={styles.deleteButtons}>
                <button 
                  style={{
                    ...styles.deleteBtn,
                    ...(loading.delete && styles.deleteBtnDisabled)
                  }} 
                  onClick={confirmDeleteAnnouncement}
                  disabled={loading.delete}
                >
                  {loading.delete ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '8px' }} />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
                <button 
                  style={styles.cnldeleteBtn} 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={loading.delete}
                >
                  Cancel
                </button>
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
    minHeight: '100vh',
    backgroundColor: '#F8F8F8',
    display: 'flex'
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
    marginLeft: '300px', 
    backgroundColor: '#F8F8F8',
    marginTop: '80px', 
    flex: 1,
    marginBottom: '20px',
    marginRight: '20px'
  },
  
  // Search Container Styles
  searchContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    width: '400px',
    padding: '8px 35px 8px 35px',
    borderRadius: '5px',
    border: '1px solid #00000070',
    fontSize: '14px',
  },
  searchIcon: {
    position: 'absolute',
    left: '10px',
    color: '#666',
    fontSize: '14px',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px',
  },

  btnActive: {
    backgroundColor: '#A8FC0080',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  },

  announcementFilter: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px',
    alignItems: 'center',
  },

  announcementLeft: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },

  filterBtn: {
    padding: '8px 15px',
    borderRadius: '5px',
    border: '1px solid #00000070',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },

  clearFilterBtn: {
    padding: '8px 15px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    backgroundColor: '#f8f9fa',
    color: '#666',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  
  clearFilterBtn2: {
    padding: '10px 20px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    backgroundColor: '#f8f9fa',
    color: '#666',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '10px',
    transition: 'all 0.2s ease',
  },

  postBtn: {
    padding: '8px 20px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#006C03',
    boxShadow: '0 2px 2px rgba(0, 0, 0, 0.16)',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
    color: 'white',
  },

  // 2-Column Grid Styles
  announcementsContainer: {
    marginTop: '20px',
  },

  announcementsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))',
    gap: '20px',
    marginTop: '15px',
  },

  announcementCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e9ecef',
    transition: 'all 0.3s ease',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },

  announcementCardContent: {
    padding: '20px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },

  announcementHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: '15px',
  },

  announcementSender: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },

  announcementProfile: {
    backgroundColor: '#6ecf68',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    flexShrink: 0,
    objectFit: 'cover'
  },

  announcementName: {
    flex: 1,
  },

  lblName: {
    fontWeight: '600',
    fontSize: '16px',
    margin: 0,
    marginBottom: '4px',
  },

  lblPosition: {
    fontSize: '13px',
    color: '#6d6d6d',
    margin: 0,
    marginBottom: '4px',
  },
  
  lblVisibility: {
    fontSize: '12px',
    color: '#009205',
    fontStyle: 'italic',
    margin: 0,
    padding: '2px 6px',
    backgroundColor: '#f0f9f0',
    borderRadius: '4px',
    display: 'inline-block',
  },

  announcementDate: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
    marginLeft: '10px',
  },

  lblDate: {
    fontSize: '12px',
    color: '#666',
    margin: 0,
    textAlign: 'right',
  },

  menuDots: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    fontSize: '16px',
    color: '#666',
  },

  // Announcement Content
  announcementContent: {
    flex: 1,
    marginBottom: '15px',
  },

  announcementText: {
    marginBottom: '15px',
  },

  lblTitle: {
    fontWeight: '700',
    fontSize: '18px',
    margin: 0,
    marginBottom: '10px',
    color: '#333',
  },

  lblDetails: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#555',
    margin: 0,
  },

  // Images Container Wrapper
  imagesContainerWrapper: {
    marginTop: '10px',
    position: 'relative',
  },

  // Carousel Header
  carouselHeader: {
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  carouselCounter: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '500',
    backgroundColor: '#f0f0f0',
    padding: '4px 8px',
    borderRadius: '4px',
  },

  // Images Container with carousel
  imagesContainer: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    minHeight: '90px',
  },

  imagesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '8px',
    flex: 1,
  },

  imageWrapper: {
    position: 'relative',
  },

  announcementImage: {
    width: '100%',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '6px',
    cursor: 'pointer',
    border: '1px solid #e0e0e0',
    transition: 'transform 0.2s ease',
  },

  // Carousel Arrows
  carouselArrowLeft: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(0, 146, 5, 0.8)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    transition: 'all 0.2s ease',
  },

  carouselArrowRight: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(0, 146, 5, 0.8)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    transition: 'all 0.2s ease',
  },

  // Image Number Badge
  imageNumberBadge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Carousel Indicators
  carouselIndicators: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '10px',
  },

  carouselIndicator: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '1px solid #ddd',
    background: 'white',
    cursor: 'pointer',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },

  carouselIndicatorActive: {
    background: '#009205',
    color: 'white',
    borderColor: '#009205',
  },

  // Footer
  announcementFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: '15px',
    borderTop: '1px solid #f0f0f0',
  },

  readBtn: {
    padding: '6px 16px',
    fontWeight: '500',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out',
    fontSize: '13px',
  },


  // Preview Overlay
  previewOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },

  previewImageLarge: {
    maxWidth: '90%',
    maxHeight: '90%',
    borderRadius: '8px',
    boxShadow: '0 0 30px rgba(0,0,0,0.5)',
  },

  closePreviewButton: {
    position: 'absolute',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    fontSize: '20px',
    cursor: 'pointer',
    top: '20px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
  },


  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },

  modalContainer: {
    backgroundColor: '#ffffff',
    width: '600px',
    maxWidth: '90vw',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid #e9ecef',
    backgroundColor: '#f8f9fa',
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#666',
    padding: '8px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: '24px',
    flex: 1,
    overflowY: 'auto',
    maxHeight: '60vh',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '24px',
    borderTop: '1px solid #e9ecef',
    backgroundColor: '#f8f9fa',
  },

  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '20px',
  },
  formLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  },
  formSelect: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #e9ecef',
    fontSize: '14px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  formInput: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #e9ecef',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  formTextarea: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #e9ecef',
    fontSize: '14px',
    resize: 'vertical',
    minHeight: '120px',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  },

  uploadSection: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
  },
  uploadButton: {
    padding: '12px 20px',
    backgroundColor: '#f8f9fa',
    color: '#333',
    border: '2px dashed #e9ecef',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    fontWeight: '500',
  },
  uploadIcon: {
    marginRight: '8px',
    color: '#666',
  },

  attachmentsSection: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  },
  attachmentsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px',
  },
  imagesPreview: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  imagePreviewItem: {
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e9ecef',
  },
  previewImage: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
  },
  removeImageButton: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    fontSize: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#009205',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#f8f9fa',
    color: '#333',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Loading and Results Styles
  globalLoadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  globalLoadingContent: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  },
  loadingSpinner: {
    fontSize: '24px',
    color: '#009205',
    marginBottom: '10px',
  },
  loadingText: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '500',
    color: '#333',
  },
  
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: '#666',
  },
  
  noResultsContainer: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginTop: '20px',
  },
  
  noAnnouncementText: {
    textAlign: "center", 
    marginTop: "20px",
    color: "#777",
    fontSize: '16px',
  },
  
  resultsCount: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px',
    fontStyle: 'italic',
    paddingLeft: '5px',
  },

  // Menu Styles
  menu: {
    position: "absolute",
    top: "100%",
    right: 0,
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "6px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 9999,
    minWidth: "120px",
    display: 'flex',
    flexDirection: 'column'
  },
  buttonMenu: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: '14px',
    color: '#333',
    transition: 'background-color 0.2s ease',
  },
  buttonMenu1: {
    borderBottom: '1px solid #eee',
    borderRight: 'none',
    borderLeft: 'none',
    borderTop: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: '14px',
    color: '#333',
    transition: 'background-color 0.2s ease',
  },

  // Delete Modal
  deleteButtons: {
    display: 'flex',
    flexDirection: 'row',
    gap: '20px',
  },
  deleteBtn: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#ff4757',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  cnldeleteBtn: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#e9ecef',
    color: '#333',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  questionDelete: {
    fontSize: '18px',
    textAlign: 'center',
    marginBottom: '24px',
    color: '#333',
  },
  modalContainerDel: {
    backgroundColor: '#ffffff',
    width: '500px',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90vw',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginTop: '24px',
  },
  cancelBtn: {
    padding: '12px 24px',
    backgroundColor: '#f8f9fa',
    color: '#333',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  confirmBtn: {
    padding: '12px 24px',
    backgroundColor: '#009205',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },

  // Disabled states
  menuDotsDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  deleteBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

export default Announcement;