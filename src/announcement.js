import React, { useEffect, useState, useRef } from 'react';
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
} from '@fortawesome/free-solid-svg-icons';
import 'react-calendar/dist/Calendar.css';
import './dashboardCalendar.css';
import { FaEllipsisV } from "react-icons/fa";

function Announcement() {
  const [showModal, setShowModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    details: "",
    priority: "",
  });


  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const [files, setFiles] = useState([]);  
  const [images, setImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const toggleExpand = () => setExpanded(!expanded);
  const [menuOpen, setMenuOpen] = useState(false);

  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  
  useEffect(() => {
    fetch("http://localhost:5000/api/announcements")
      .then((res) => res.json())
      .then((data) => {
        setAnnouncements(Array.isArray(data) ? data : data.data || []);
      })
      .catch((err) => console.error("Error fetching announcements:", err));
  }, []);

  useEffect(() => {
    if (previewImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // Cleanup when component unmounts
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [previewImage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAnnouncement((prev) => ({ ...prev, [name]: value }));
  };

 const handleFileClick = () => fileInputRef.current.click();
  const handleImageClick = () => imageInputRef.current.click();

  const handleFileChange = (e) => {
    // Merge new files with existing files
    setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
  };

  const handleImageChange = (e) => {
    // Merge new images with existing images
    setImages((prev) => [...prev, ...Array.from(e.target.files)]);
  };

  const addAnnouncement = async () => {
    const formData = new FormData();
    formData.append("title", newAnnouncement.title);
    formData.append("details", newAnnouncement.details);
    formData.append("priority", newAnnouncement.priority);
    formData.append("created_by", 1);

    // Append documents
    files.forEach((file) => {
      formData.append("files", file);
    });

    // Append images
    images.forEach((img) => {
      formData.append("images", img);
    });

    try {
      const res = await fetch("http://localhost:5000/api/announcements", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to post announcement");

      const savedAnnouncement = await res.json();
      setAnnouncements([savedAnnouncement, ...announcements]);
      setNewAnnouncement({ title: "", details: "", priority: "Normal" });
      setFiles([]);
      setImages([]);
      setShowModal(false);
    } catch (error) {
      console.error("Error posting announcement:", error);
    }
  };

  const editAnnouncement = (id) => {
    const announcementToEdit = announcements.find(a => a.id === id);
    setNewAnnouncement({
      title: announcementToEdit.title,
      details: announcementToEdit.details,
      priority: announcementToEdit.priority,
    });
    setFiles([]);   // optionally reset files (or load existing ones if you want)
    setImages([]);
    setEditingAnnouncement(announcementToEdit);
    setIsEditMode(true); // open modal in edit mode
    setShowModal(true);
  };



  const deleteAnnouncement = (id) => {
    const announcementToDelete = announcements.find(a => a.id === id);
    setEditingAnnouncement(announcementToDelete);
    setShowDeleteModal(true);
  };

  const saveEditedAnnouncement = async () => {
    try {
      const formData = new FormData();
      formData.append("title", newAnnouncement.title);
      formData.append("details", newAnnouncement.details);
      formData.append("priority", newAnnouncement.priority);
      
      // Append new files/images if any
      files.forEach((file) => formData.append("files", file));
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
      setNewAnnouncement({ title: "", details: "", priority: "" });
      setFiles([]);
      setImages([]);
    } catch (err) {
      console.error(err);
    }
  };


  const confirmDeleteAnnouncement = async () => {
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
          <li><Link style={styles.sb} to="/employee"><FontAwesomeIcon icon={faUsers} style={styles.icon} /> Employees</Link></li>
          <li><Link style={styles.sb} to="/attendance"><FontAwesomeIcon icon={faCalendarCheck} style={styles.icon} /> Attendance</Link></li>
          <li><Link style={styles.sb} to="/leaveManagement"><FontAwesomeIcon icon={faCalendarAlt} style={styles.icon} /> Leave Management</Link></li>
          <li><Link style={styles.sb} to="/messages"><FontAwesomeIcon icon={faEnvelope} style={styles.icon} /> Message</Link></li>
          <li style={styles.btnActive}><Link style={styles.sb} to="/announcement"><FontAwesomeIcon icon={faBullhorn} style={styles.icon} /> Announcement</Link></li>
          <li><Link style={styles.sb} to="/audit_logs"><FontAwesomeIcon icon={faClipboardList} style={styles.icon} /> Audit Logs</Link></li>
          <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faUserCog} style={styles.icon} /> User Management</Link></li>
          <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faCog} style={styles.icon} /> Settings</Link></li>
          <li><Link style={styles.sb} to="#"><FontAwesomeIcon icon={faSignOutAlt} style={styles.icon} /> Logout</Link></li>
        </ul>
      </div>

      <div style={styles.content}>
        <div style={styles.announcementBoard}>
          <p style={{ fontSize: '20px', fontWeight: '600' }}>Announcement</p>

          <div style={styles.announcementFilter}>
            <div style={styles.announcementLeft}>
              <input style={styles.searchInput} placeholder="Search" />
              <select style={styles.filterBtn}>
                <option selected disabled>Priority</option>
                <option>Normal</option>
                <option>Urgent</option>
              </select>
              <select style={styles.filterBtn}>
                <option>Visibility</option>
                <option>All Employee</option>
              </select>
            </div>
            <div>
              <button style={styles.postBtn} onClick={() => setShowModal(true)}>Post</button>
            </div>
          </div>

          {announcements.length === 0 ? (
              <p style={styles.noAnnouncementText}>
                No announcements have been posted yet.
              </p>
            ) : (
              announcements.map((announcement, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.announcementCardContent,
                    borderLeft: `10px solid ${getPriorityColor(announcement.priority)}`,
                  }}
                >
                  <div style={styles.announcementRow1}>
                    <div style={styles.announcementSender}>
                      <div style={styles.announcementProfile}></div>
                      <div style={styles.announcementName}>
                        <p style={styles.lblName}>{announcement.posted_by}</p>
                        <p style={styles.lblPosition}>{announcement.position}</p>
                      </div>
                    </div>
                    <div style={styles.announcementDate}>
                      <p style={styles.lblDate}>{announcement.created_at}</p>
                      <p style={styles.lblPriority}>{announcement.priority}</p>
                      <button onClick={() => setMenuOpen(!menuOpen)}>
                        <FaEllipsisV />
                      </button>
                      {menuOpen && (
                        <div style={styles.menu}>
                          <button onClick={() => editAnnouncement(announcement.id)}>Edit</button>
                          <button onClick={() => deleteAnnouncement(announcement.id)}>Delete</button>
                        </div>
                      )}
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
                        WebkitLineClamp: expanded ? "unset" : 2, // 2 lines when collapsed
                      }}>
                      {announcement.details}
                      </p>

                      

                      {/* Show images if any */}
                      {announcement.images && announcement.images.length > 0 && (
                        <div style={{ marginTop: "10px" }}>
                          {announcement.images.map((img, i) => (
                            <img
                              key={i}
                              src={`http://localhost:5000${img}`} // serve from backend uploads
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
                              onClick={() =>
                                setPreviewImage(`http://localhost:5000${img}`)
                              }
                            />
                          ))}
                        </div>
                      )}

                      {/* Files */}
                        {announcement.files && announcement.files.length > 0 && (
                          <div style={{ marginTop: "10px" }}>
                            {announcement.files.map((file, i) => {
                              const fileName = file.split("/").pop(); // get actual file name
                              return (
                                <a
                                  key={i}
                                  href={`http://localhost:5000${file}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "inline-block",
                                    padding: "8px 14px",
                                    margin: "5px",
                                    borderRadius: "6px",
                                    backgroundColor: "#ffffffff",
                                    color: "#000",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    textDecoration: "none",
                                    transition: "0.2s",
                                    boxShadow: '1px 2px 1px rgba(34, 34, 34, 0.16)'
                                  }}
                                  onMouseEnter={(e) => (e.target.style.backgroundColor = "#f0f0f0ff")}
                                  onMouseLeave={(e) => (e.target.style.backgroundColor = "#ffffffff")}
                                >
                                 {fileName}
                                </a>
                              );
                            })}
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
              ))
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
                onClick={() => setPreviewImage(null)} // close on click
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
                <p style={styles.postAnnouncement}>Post Announcement</p>
                <div style={styles.modalInputs}>
                  <div style={styles.inputsRow}>
                    <div>
                      <label>To:</label>
                      <select style={styles.selects}>
                        <option>All Employee</option>
                      </select>
                    </div>
                    <div>
                      <select
                        style={styles.selects}
                        name="priority"
                        value={newAnnouncement.priority}
                        onChange={handleInputChange}
                      >
                        <option value="" disabled selected>Select Priority</option>
                        <option value="Normal">Normal</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div style={styles.inputsRow2}>
                    <label>Title:</label>
                    <input
                      type="text"
                      name="title"
                      value={newAnnouncement.title}
                      onChange={handleInputChange}
                      placeholder="Enter title..."
                      style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                  </div>
                  <div style={styles.inputsRow2}>
                    <label>Details:</label>
                    <textarea
                      name="details"
                      value={newAnnouncement.details}
                      onChange={handleInputChange}
                      style={styles.txtArea}
                    />
                  </div>

                   {files.length > 0 && (
                          <ul>
                            {files.map((f, i) => (
                              <li key={i}>{f.name}</li>
                            ))}
                          </ul>
                        )}

                        {images.length > 0 && (
                          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                            {images.map((img, i) => (
                              <img
                                key={i}
                                src={URL.createObjectURL(img)}
                                alt="preview"
                                width="80"
                                height="80"
                                style={{ borderRadius: "5px", objectFit: "cover" }}
                              />
                            ))}
                          </div>
                        )}

                  <div style={styles.btnUploads}>
                    <button style={styles.btnFile} onClick={handleFileClick}>Upload File</button>
                    <button style={styles.btnImage} onClick={handleImageClick}>Upload Image</button>
                  </div>

                  {/* Hidden Input */}
                        <input
                          type="file"
                          multiple
                          ref={fileInputRef}
                          style={{ display: "none" }}
                          onChange={handleFileChange}
                        />
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          ref={imageInputRef}
                          style={{ display: "none" }}
                          onChange={handleImageChange}
                        />                       

                </div>
                <div style={styles.btnBottom}>
                  <button
                    style={styles.btnPost}
                    onClick={isEditMode ? saveEditedAnnouncement : addAnnouncement}
                  >
                    {isEditMode ? "Save Changes" : "Post"}
                  </button>
                  <button
                    style={styles.btnCancel}
                    onClick={() => {
                      setShowModal(false);
                      setIsEditMode(false);
                      setEditingAnnouncement(null);
                      setNewAnnouncement({ title: "", details: "", priority: "" });
                      setFiles([]);
                      setImages([]);
                    }}
                  >
                    Cancel
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>


      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContainer}>
            <p>Are you sure you want to delete this announcement?</p>
            <div>
              <button onClick={confirmDeleteAnnouncement}>Yes, Delete</button>
              <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}


      </div>
    </div>
  );
}

// Priority colors
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Normal': return '#F5A623';
    case 'Urgent': return '#D0021B';
    default: return '#4A90E2';
  }
};

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
  searchInput: {
    width: '400px',
    padding: '5px',
    borderRadius: '5px',
    border: '1px solid #00000070'
  },

  btnActive: {
      backgroundColor: '#A8FC0080',
      borderRadius: '5px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  },

  announcementFilter: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px'
  },

  announcementLeft: {
    display: 'flex',
    gap: '10px',
  },

  filterBtn: {
    padding: '5px',
    borderRadius: '5px',
    border: '1px solid #00000070'
  },

  postBtn: {
    padding: '5px 20px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#A8FC0080',
    boxShadow: '2px 2px 2px rgba(0, 0, 0, 0.16)',
    fontWeight: 500
  },

  announcementCardContent: {
    backgroundColor: '#fcf8fc',
    padding: '15px',
    borderRadius: '10px',
    borderLeft: '10px solid #4a90e2',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
    marginTop: ' 20px'
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

  announcementRow1: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  announcementDate: {
    display:'flex',
    flexDirection: 'row',
    gap: '5px',
    alignItems: 'center'
  },

  lblDate: {
    fontSize: '12px',
  },

  lblPriority: {
    fontSize: '14px',
    backgroundColor: '#ff5c5c',
    padding: '2px 3px',
    borderRadius: '5px',
    color: '#fff',
    fontWeight: '500'
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
    fontSize: '20px'
  },

  lblDetails: {
    fontSize: '14px',
  },

  readBtn: {
    padding: '5px 10px',
    fontWeight: '500',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#4a90e2',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out'
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
    width: '500px',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

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
  noAnnouncementText: {
    textAlign: "center", 
    marginTop: "50px",
    color: "#777",
  }
};


export default Announcement;