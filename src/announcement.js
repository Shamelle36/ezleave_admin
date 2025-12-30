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
} from '@fortawesome/free-solid-svg-icons';
import 'react-calendar/dist/Calendar.css';
import './dashboardCalendar.css';
import { FaEllipsisV } from "react-icons/fa";

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
  const [expanded, setExpanded] = useState(false);
  const toggleExpand = () => setExpanded(!expanded);
  const [menuOpen, setMenuOpen] = useState(null);

  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("All");

  // Loading states
  const [loading, setLoading] = useState({
    post: false,
    update: false,
    delete: false,
    fetch: false
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [role, setRole] = useState(localStorage.getItem("role") || "admin");
    
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

  const handleLogout = async () => {
    const user = JSON.parse(localStorage.getItem("admin"));

    if (user) {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: user.role }),
      });
    }

    localStorage.removeItem("admin");
    navigate("/");
  };

  // Fetch announcements with loading state
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(prev => ({ ...prev, fetch: true }));
      try {
        const res = await fetch("http://localhost:5000/api/announcements");
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
      const res = await fetch("http://localhost:5000/api/announcements", {
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

      const res = await fetch(`http://localhost:5000/api/announcements/${editingAnnouncement.id}`, {
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
      const res = await fetch(`http://localhost:5000/api/announcements/${editingAnnouncement.id}`, {
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
    <div style={styles.dashboardContainer}>
      {/* Global Loading Overlay */}
      {(loading.post || loading.update || loading.delete) && (
        <div style={styles.globalLoadingOverlay}>
          <div style={styles.globalLoadingContent}>
            <FontAwesomeIcon icon={faSpinner} spin style={styles.loadingSpinner} />
            <p style={styles.loadingText}>
              {loading.post && "Posting announcement..."}
              {loading.update && "Updating announcement..."}
              {loading.delete && "Deleting announcement..."}
            </p>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <input type="text" placeholder="Search..." style={styles.search} />
        <FontAwesomeIcon icon={faBell} style={styles.iconBell} />
      </div>

      <div style={styles.sidebar}>
        <img src={require('./images/logo_ez.png')} alt="logo" style={styles.logo} />
        <ul style={styles.sidebarList}>
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

        <div style={styles.announcementBoard}>
          <p style={{ fontSize: '20px', fontWeight: '600' }}>Announcement</p>

          <div style={styles.announcementFilter}>
            <div style={styles.announcementLeft}>
              <div style={styles.searchContainer}>
                <FontAwesomeIcon icon={faSearch} style={styles.searchIcon} />
                <input 
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
              
              <select 
                style={styles.filterBtn}
                value={visibilityFilter}
                onChange={handleVisibilityFilterChange}
              >
                <option value="All">All Visibility</option>
                <option value="All Employee">All Employee</option>
                <option value="Specific Department">Specific Department</option>
              </select>
              
              {(searchQuery || visibilityFilter !== "All") && (
                <button 
                  style={styles.clearFilterBtn}
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
            <div>
              <button 
                style={styles.postBtn} 
                onClick={() => setShowModal(true)}
                disabled={loading.post || loading.update || loading.delete}
              >
                {loading.post ? 'Posting...' : 'Post'}
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
            <div style={styles.announcementsList}>
              <div style={styles.resultsCount}>
                Showing {filteredAnnouncements.length} of {announcements.length} announcements
              </div>
              {filteredAnnouncements.map((announcement, index) => (
                <div
                  key={announcement.id || index}
                  style={{
                    ...styles.announcementCardContent,
                    borderLeft: '10px solid #4A90E2', // All announcements have same border color
                  }}
                >
                  <div style={styles.announcementRow1}>
                    <div style={styles.announcementSender}>
                      <div style={styles.announcementProfile}></div>
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
                    <div style={styles.announcementDate}>
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

                  <div style={styles.announcementDetails}>
                    <div style={styles.announcementText}>
                      <p style={styles.lblTitle}>{announcement.title}</p>
                      <p style={{
                        ...styles.lblDetails,
                        textAlign: "justify",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        WebkitLineClamp: expanded ? "unset" : 2, 
                      }}>
                      {announcement.details}
                      </p>

                      {/* Images */}
                      {announcement.images && announcement.images.length > 0 && (
                        <div style={{ marginTop: "10px" }}>
                          {announcement.images.map((img, i) => (
                            <img
                              key={i}
                              src={img} 
                              alt={`attachment-${i}`}
                              style={{ 
                                maxWidth: "120px",
                                maxHeight: "120px",
                                marginRight: "10px",
                                marginBottom: "10px",
                                cursor: "pointer",
                                borderRadius: "6px",
                                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                              }}
                              onClick={() => setPreviewImage(img)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={styles.announcementRead}>
                    {announcement.details.length > 100 && ( 
                      <button onClick={toggleExpand} style={styles.readBtn}>
                        {expanded ? "Show Less" : "Read More"}
                      </button>
                    )}                    
                  </div>
                </div>
              ))}
            </div>
          )}

          {previewImage && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.7)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
              }}
              onClick={() => setPreviewImage(null)} 
            >
              <img
                src={previewImage}
                alt="preview"
                style={{
                  maxWidth: "90%",
                  maxHeight: "90%",
                  borderRadius: "8px",
                  boxShadow: "0 0 20px rgba(0,0,0,0.5)",
                }}
              />

              <button
                onClick={() => setPreviewImage(null)}
                style={{
                  position: "absolute",
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  fontSize: "18px",
                  cursor: "pointer",
                  top: 10,
                  right: 100,
                  marginRight: '10px'
                }}
              >
                ✕
              </button>
            </div>
          )}

          {showModal && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalContainer}>
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

                <div style={styles.modalBody}>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Visibility</label>
                      <select
                        style={styles.formSelect}
                        name="visibility"
                        value={newAnnouncement.visibility}
                        onChange={handleInputChange}
                        disabled={loading.post || loading.update}
                      >
                        <option value="All Employee">All Employee</option>
                        <option value="Specific Department">Specific Department</option>
                      </select>
                    </div>
                  </div>

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

                <div style={styles.modalFooter}>
                  <button
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
        </div>

        {showDeleteModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContainerDel}>
              <p style={styles.questionDelete}>Are you sure you want to delete this announcement?</p>
              <div style={styles.deleteButtons}>
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
    padding: '20px',
    backgroundColor: '#F8F8F8',
    marginTop: '60px', 
    flex: 1
  },
  header1: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '20px',
    justifyContent: 'flex-start',
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
    backgroundColor: '#A8FC0080',
    boxShadow: '2px 2px 2px rgba(0, 0, 0, 0.16)',
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '14px',
  },

  announcementCardContent: {
    backgroundColor: '#fcf8fc',
    padding: '15px',
    borderRadius: '10px',
    borderLeft: '10px solid #4a90e2',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
    marginTop: '20px',
    marginBottom: '20px',
  },

  announcementProfile: {
    backgroundColor: '#6ecf68',
    width: '40px',
    height: '40px',
    borderRadius: '50px'
  },

  announcementSender: {
    display: 'flex',
    flexDirection: 'row',
    gap: '10px'
  },
  
  lblName: {
    fontWeight: '500',
    fontSize: '14px',
  },

  lblPosition: {
    fontSize: '12px',
    color: '#6d6d6dfb'
  },
  
  lblVisibility: {
    fontSize: '12px',
    color: '#009205',
    fontStyle: 'italic',
    marginTop: '2px',
  },

  announcementRow1: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  announcementDate: {
    display:'flex',
    flexDirection: 'row',
    gap: '10px',
    alignItems: 'center'
  },

  lblDate: {
    fontSize: '12px',
    color: '#666',
  },

  announcementDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: '5px',
    marginTop: '10px'
  },

  lblTitle: {
    fontWeight: '600',
    fontSize: '20px',
    marginBottom: '8px',
  },

  lblDetails: {
    fontSize: '14px',
    lineHeight: '1.6',
  },

  readBtn: {
    padding: '5px 10px',
    fontWeight: '500',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#4a90e2',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out',
    fontSize: '14px',
  },

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

  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',
    marginBottom: '20px',
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
  attachmentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  attachmentItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#fff',
    borderRadius: '6px',
    border: '1px solid #e9ecef',
  },
  attachmentIcon: {
    marginRight: '8px',
    color: '#666',
  },
  attachmentName: {
    flex: 1,
    fontSize: '14px',
    color: '#333',
  },
  removeButton: {
    background: 'none',
    border: 'none',
    color: '#ff4757',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: '10px',
    fontStyle: 'italic',
  },
  
  announcementsList: {
    marginTop: '20px',
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

  // Rest of existing styles...
  inputsColumn: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  btnFile: {
    padding: '8px 15px',
    borderRadius: '6px',
    backgroundColor: '#ff574b',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    marginRight: '10px',
    boxShadow: '1px 1px 2px rgba(0, 0, 0, 0.57)',
    fontWeight: '500'
  },
  btnImage: {
    padding: '8px 15px',
    borderRadius: '6px',
    backgroundColor: '#9cff4b',
    color: '#000',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '1px 1px 2px rgba(0, 0, 0, 0.57)',
    fontWeight: '500'
  },
  inputsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px'
  },
  inputsRow2: {
    display: 'flex',
    flexDirection: 'column'
  },
  btnBottom: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
    justifyContent: 'flex-end'
  },
  btnPost: {
    backgroundColor: '#001eff',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  btnCancel: {
    backgroundColor: '#ccc',
    color: '#000',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  modalInputs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  txtArea: {
    width: '100%',
    height: '100px',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
    resize: 'vertical',
  },
  selects: {
    padding: '3px 10px',
    marginLeft: '5px',
    borderRadius: '5px',
  },
  postAnnouncement: {
    borderBottom: '1px solid #dcdcdcff',
    fontSize: '20px',
    fontWeight: '500'
  },
  menuDots: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    fontSize: '16px'
  },
  menu: {
    position: "absolute",
    top: "100%",
    right: 0,
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "6px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
    zIndex: 9999,
    minWidth: "120px",
    display: 'flex',
    flexDirection: 'column'
  },
  buttonMenu: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '8px 12px',
    textAlign: 'left',
    fontSize: '14px',
  },
  buttonMenu1: {
    borderBottom: '1px solid #eee',
    borderRight: 'none',
    borderLeft: 'none',
    borderTop: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '8px 12px',
    textAlign: 'left',
    fontSize: '14px',
  },
  deleteButtons: {
    display: 'flex',
    flexDirection: 'row',
    gap: '20px',
  },
  deleteBtn: {
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '5px',
    backgroundColor: 'red',
    color: 'white',
    cursor: 'pointer'
  },
  cnldeleteBtn: {
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '5px',
    backgroundColor: 'rgba(200, 200, 200, 1)',
    cursor: 'pointer'
  },
  questionDelete: {
    fontSize: '20px',
    textAlign: 'center',
    marginBottom: '20px',
  },
  modalContainerDel: {
    backgroundColor: '#ffffff',
    width: '500px',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
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
};

export default Announcement;