import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

function UserManagement() {
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [newAccount, setNewAccount] = useState({
    full_name: "",
    email: "",
    role: "",
    department: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);

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

  // Fetch all admin accounts
  const fetchAccounts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/authAdmin/accounts");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async () => {
    if (!newAccount.full_name || !newAccount.email || !newAccount.role || (newAccount.role !== "Mayor" && !newAccount.department)) {
      alert("Please fill out all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/authAdmin/createAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAccount),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Account created! Email sent for password setup.");
        setNewAccount({ full_name: "", email: "", role: "", department: "" });
        setShowModal(false);
        fetchAccounts();
      } else {
        setMessage(`❌ ${data.message || "Failed to create account."}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditAccount = (acc) => {
    setSelectedAccount(acc);
    setEditModal(true);
  };

  const handleSaveEdit = () => {
    // TODO: connect to API to update account
    setEditModal(false);
    setMessage("✅ Changes saved successfully.");
    fetchAccounts();
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Header */}
      <div style={styles.header}>
        <input type="text" placeholder="Search..." style={styles.search} />
        <FontAwesomeIcon icon={faBell} style={styles.iconBell} />
      </div>

      {/* Sidebar */}
      <div style={styles.sidebar}>
        <img src={require("./images/logo_ez.png")} alt="logo" style={styles.logo} />
        <ul style={styles.sidebarList}>
          <li>
            <Link style={styles.sb} to="/dashboard">
              <FontAwesomeIcon icon={faTachometerAlt} style={styles.icon} /> Dashboard
            </Link>
          </li>
          <li>
            <Link style={styles.sb} to="/employee">
              <FontAwesomeIcon icon={faUsers} style={styles.icon} /> Employees
            </Link>
          </li>
          <li>
            <Link style={styles.sb} to="/attendance">
              <FontAwesomeIcon icon={faCalendarCheck} style={styles.icon} /> Attendance
            </Link>
          </li>
          <li>
            <Link style={styles.sb} to="/leaveManagement">
              <FontAwesomeIcon icon={faCalendarAlt} style={styles.icon} /> Leave Management
            </Link>
          </li>
          <li>
            <Link style={styles.sb} to="/messages">
              <FontAwesomeIcon icon={faEnvelope} style={styles.icon} /> Message
            </Link>
          </li>
          <li>
            <Link style={styles.sb} to="/announcement">
              <FontAwesomeIcon icon={faBullhorn} style={styles.icon} /> Announcement
            </Link>
          </li>
          <li>
            <Link style={styles.sb} to="/audit_logs">
              <FontAwesomeIcon icon={faClipboardList} style={styles.icon} /> Audit Logs
            </Link>
          </li>
          <li style={styles.btnActive}>
            <Link style={styles.sb} to="#">
              <FontAwesomeIcon icon={faUserCog} style={styles.icon} /> User Management
            </Link>
          </li>
          <li>
            <Link style={styles.sb} to="#">
              <FontAwesomeIcon icon={faCog} style={styles.icon} /> Settings
            </Link>
          </li>
          <li>
            <Link style={styles.sb} to="#">
              <FontAwesomeIcon icon={faSignOutAlt} style={styles.icon} /> Logout
            </Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
<div style={styles.mainContent}>
        <h2 style={styles.pageTitle}>User Management</h2>
        <button style={styles.addBtn} onClick={() => setShowModal(true)}>
          <FontAwesomeIcon icon={faPlus} /> Create New Account
        </button>

        {message && <p style={styles.message}>{message}</p>}

        {/* Accounts Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.column}>Name</th>
                <th style={styles.column}>Email</th>
                <th style={styles.column}>Role</th>
                <th style={styles.column}>Department</th>
                <th style={styles.column}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.id} style={styles.tableRow}>
                  <td style={styles.row}>{acc.full_name}</td>
                  <td style={styles.row}>{acc.email}</td>
                  <td style={styles.row}>{acc.role}</td>
                  <td style={styles.row}>{acc.department}</td>
                  <td style={styles.row}>
                    <button style={styles.editBtn} onClick={() => handleEditAccount(acc)}>
                      <FontAwesomeIcon icon={faEdit} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create Account Modal */}
        {showModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3>Create Head / Mayor Account</h3>
              <label>Full Name</label>
              <input
                type="text"
                value={newAccount.full_name}
                onChange={(e) => setNewAccount({ ...newAccount, full_name: e.target.value })}
                style={styles.input}
              />
              <label>Email</label>
              <input
                type="email"
                value={newAccount.email}
                onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                style={styles.input}
              />
              <label>Role</label>
              <select
                value={newAccount.role}
                onChange={(e) => {
                  const role = e.target.value;
                  setNewAccount({
                    ...newAccount,
                    role,
                    department: role === "Mayor" ? "Office of the Municipal Mayor" : "",
                  });
                }}
                style={styles.input}
              >
                <option value="">Select Role</option>
                <option value="Mayor">Mayor</option>
                <option value="Office Head">Office Head</option>
              </select>

              {newAccount.role !== "Mayor" && (
                <>
                  <label>Department</label>
                  <select
                    value={newAccount.department}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, department: e.target.value })
                    }
                    style={styles.input}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <div style={styles.modalButtons}>
                <button onClick={handleCreateAccount} style={styles.saveBtn} disabled={loading}>
                  {loading ? "Creating..." : "Create"}
                </button>
                <button onClick={() => setShowModal(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Account Modal */}
        {editModal && selectedAccount && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3>Edit Account</h3>
              <label>Full Name</label>
              <input
                type="text"
                value={selectedAccount.full_name}
                onChange={(e) => setSelectedAccount({ ...selectedAccount, full_name: e.target.value })}
                style={styles.input}
              />
              <label>Email</label>
              <input
                type="email"
                value={selectedAccount.email}
                onChange={(e) => setSelectedAccount({ ...selectedAccount, email: e.target.value })}
                style={styles.input}
              />
              <label>Role</label>
              <input type="text" value={selectedAccount.role} readOnly style={styles.inputReadOnly} />
              <label>Department</label>
              <input type="text" value={selectedAccount.department} readOnly style={styles.inputReadOnly} />
              <div style={styles.modalButtons}>
                <button onClick={handleSaveEdit} style={styles.saveBtn}>
                  Save Changes
                </button>
                <button onClick={() => setEditModal(false)} style={styles.cancelBtn}>
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

// ----- Styles -----
const styles = {
  dashboardContainer: { 
    display: "flex", 
    minHeight: "100vh", 
    backgroundColor: "#F8F8F8" 
  },
  sidebar: {
    backgroundColor: "#009205",
    width: "280px",
    height: "100vh",
    position: "fixed",
    padding: "20px",
    boxSizing: "border-box",
  },
  logo: { 
    width: "100px", 
    height: "auto", 
    display: "block", 
    margin: "20px auto" 
  },
  sidebarList: { 
    listStyleType: "none", 
    padding: "0", 
    margin: "0" 
  },
  sb: { 
    color: "#fff", 
    textDecoration: "none", 
    padding: "10px 15px", 
    display: "flex", 
    alignItems: "center", 
    fontSize: "16px", 
    gap: "10px", 
    transition: "background-color 0.2s ease" 
  },
  icon: { 
    color: "#fff" 
  },
  search: { 
    padding: "10px", 
    width: "300px", 
    borderRadius: "5px", 
    border: "1px solid #ccc", 
    marginRight: "20px" 
  },
  iconBell: { 
    color: "#fff", 
    fontSize: "24px", 
    cursor: "pointer" 
  },
  header: { 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "flex-end", 
    padding: "10px", 
    backgroundColor: "#009205", 
    position: "fixed", 
    top: "0", 
    left: "280px", 
    width: "calc(100% - 280px)", 
    zIndex: 1000, 
    boxSizing: "border-box" 
  },
  btnActive: { 
    backgroundColor: "#A8FC0080", 
    borderRadius: "5px", 
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)" 
  },
  column: {
    padding: '10px',
    textAlign: 'left'
  },
  row: {
    padding: '10px'
  },
 mainContent: { marginLeft: "280px", padding: "30px", flex: 1, marginTop: "50px" },
  pageTitle: { fontSize: "28px", marginBottom: "20px", color: "#333" },
  addBtn: { backgroundColor: "#1976D2", color: "#fff", padding: "10px 20px", borderRadius: "6px", border: "none", cursor: "pointer", marginBottom: "20px" },
  tableContainer: { overflowX: "auto", background: "#fff", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableRow: { transition: "background 0.2s", cursor: "pointer", ":hover": { backgroundColor: "#f0f8ff" } },
  editBtn: { backgroundColor: "#0288D1", color: "#fff", padding: "6px 12px", borderRadius: "5px", border: "none", cursor: "pointer" },
  input: { width: "100%", padding: "8px", margin: "5px 0 15px", borderRadius: "5px", border: "1px solid #ccc" },
  inputReadOnly: { width: "100%", padding: "8px", margin: "5px 0 15px", borderRadius: "5px", border: "1px solid #eee", backgroundColor: "#f9f9f9" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modal: { background: "#fff", borderRadius: "12px", padding: "30px", width: "400px", display: "flex", flexDirection: "column", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" },
  modalButtons: { display: "flex", justifyContent: "flex-end", gap: "10px" },
  saveBtn: { backgroundColor: "#1976D2", color: "#fff", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer" },
  cancelBtn: { backgroundColor: "#ccc", color: "#333", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer" },
  message: { margin: "10px 0", fontWeight: "bold", color: "#1976D2" },
};

export default UserManagement;
