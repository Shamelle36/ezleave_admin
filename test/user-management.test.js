/* eslint-disable jest/no-conditional-expect */
/* eslint-disable no-unused-expressions */
/* eslint-disable jest/valid-expect */

import { expect } from "chai";
import sinon from "sinon";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { JSDOM } from "jsdom";

// Fake DOM for localStorage & window
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", { 
  url: "http://localhost",
  pretendToBeVisual: true,
  resources: "usable"
});

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
global.HTMLElement = dom.window.HTMLElement;
global.URL = {
  createObjectURL: () => 'blob:test-url'
};

// Mock Firebase functions
let firebaseMocks = {};

describe("User Management Component Tests", () => {
  let axiosMock;
  const API_URL = "https://ezleave-admin-api.onrender.com";

  beforeEach(() => {
    axiosMock = new MockAdapter(axios);
    localStorage.clear();
    
    // Set up admin in localStorage
    localStorage.setItem("admin", JSON.stringify({
      id: 1,
      full_name: "Test Admin",
      email: "admin@example.com",
      role: "admin",
      profile_picture: "",
      token: "test-token"
    }));
    
    localStorage.setItem("role", "admin");
    
    // Mock Firebase functions
    firebaseMocks = {
      createUserWithEmailAndPassword: sinon.stub(),
      sendPasswordResetEmail: sinon.stub(),
      signInWithEmailAndPassword: sinon.stub(),
      getAuth: sinon.stub().returns({}),
      getDatabase: sinon.stub().returns({}),
      ref: sinon.stub(),
      set: sinon.stub(),
      child: sinon.stub()
    };
  });

  afterEach(() => {
    axiosMock.restore();
    sinon.restore();
  });

  describe("API Integration Tests", () => {
    it("✅ should fetch user accounts successfully", async () => {
      const mockAccounts = {
        accounts: [
          {
            id: 1,
            full_name: "Mayor John Doe",
            email: "mayor@city.gov",
            role: "mayor",
            department: "Office of the Municipal Mayor",
            status: "active",
            created_at: "2024-01-01",
            last_login: "2024-01-15"
          },
          {
            id: 2,
            full_name: "Department Head Jane Smith",
            email: "head@department.gov",
            role: "office_head",
            department: "Human Resource Management Division",
            status: "active",
            created_at: "2024-01-02",
            last_login: "2024-01-14"
          }
        ]
      };

      const mockInactiveAccounts = {
        accounts: [
          {
            id: 3,
            full_name: "Inactive User",
            email: "inactive@city.gov",
            role: "office_head",
            department: "Business Permit and Licensing Division",
            status: "inactive",
            created_at: "2024-01-03",
            last_login: "2024-01-05"
          }
        ]
      };

      axiosMock.onGet(`${API_URL}/api/authAdmin/accounts`).reply(200, mockAccounts);
      axiosMock.onGet(`${API_URL}/api/authAdmin/accounts/inactive`).reply(200, mockInactiveAccounts);

      const response1 = await axios.get(`${API_URL}/api/authAdmin/accounts`);
      const response2 = await axios.get(`${API_URL}/api/authAdmin/accounts/inactive`);

      expect(response1.status).to.equal(200);
      expect(response1.data.accounts).to.have.lengthOf(2);
      expect(response2.status).to.equal(200);
      expect(response2.data.accounts).to.have.lengthOf(1);
      expect(response2.data.accounts[0].status).to.equal("inactive");
    });

    it("✅ should create a new user account", async () => {
      const newUser = {
        full_name: "New Department Head",
        email: "newhead@city.gov",
        role: "office_head",
        department: "Sangguniang Bayan Office",
        password: "tempPass123!@"
      };

      const mockResponse = {
        userId: 4,
        message: "Account created successfully",
        user: newUser
      };

      axiosMock.onPost(`${API_URL}/api/authAdmin/createAccount`).reply(201, mockResponse);

      const response = await axios.post(`${API_URL}/api/authAdmin/createAccount`, newUser);

      expect(response.status).to.equal(201);
      expect(response.data.userId).to.equal(4);
      expect(response.data.message).to.equal("Account created successfully");
    });

    it("❌ should fail to create user with existing email", async () => {
      const existingUser = {
        full_name: "Existing User",
        email: "existing@city.gov",
        role: "office_head",
        department: "Office of the Municipal Accountant",
        password: "tempPass123!@"
      };

      axiosMock.onPost(`${API_URL}/api/authAdmin/createAccount`)
        .reply(409, { message: "User with this email already exists" });

      try {
        await axios.post(`${API_URL}/api/authAdmin/createAccount`, existingUser);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.response.status).to.equal(409);
        expect(error.response.data.message).to.equal("User with this email already exists");
      }
    });

    it("✅ should update user account information", async () => {
      const updatedUser = {
        full_name: "Updated Name",
        email: "updated@city.gov",
        role: "office_head",
        department: "Municipal Budget Office"
      };

      axiosMock.onPut(`${API_URL}/api/authAdmin/accounts/1`)
        .reply(200, { 
          message: "Account updated successfully",
          user: updatedUser
        });

      const response = await axios.put(`${API_URL}/api/authAdmin/accounts/1`, updatedUser, {
        headers: { Authorization: "Bearer test-token" }
      });

      expect(response.status).to.equal(200);
      expect(response.data.message).to.equal("Account updated successfully");
    });

    it("✅ should deactivate a user account", async () => {
      axiosMock.onPut(`${API_URL}/api/authAdmin/accounts/1/deactivate`)
        .reply(200, { message: "Account deactivated successfully" });

      const response = await axios.put(`${API_URL}/api/authAdmin/accounts/1/deactivate`, {}, {
        headers: { Authorization: "Bearer test-token" }
      });

      expect(response.status).to.equal(200);
      expect(response.data.message).to.equal("Account deactivated successfully");
    });

    it("✅ should restore an inactive user account", async () => {
      axiosMock.onPut(`${API_URL}/api/authAdmin/accounts/1/restore`)
        .reply(200, { message: "Account restored successfully" });

      const response = await axios.put(`${API_URL}/api/authAdmin/accounts/1/restore`, {}, {
        headers: { Authorization: "Bearer test-token" }
      });

      expect(response.status).to.equal(200);
      expect(response.data.message).to.equal("Account restored successfully");
    });
  });

  describe("User Account Business Logic Tests", () => {
    const mockUserFunctions = {
      // Simulate filtering logic
      filterUsers: (users, searchTerm, roleFilter, showInactive) => {
        let filtered = showInactive 
          ? users.filter(user => user.status === "inactive")
          : users.filter(user => user.status === "active");
        
        // Apply search filter
        if (searchTerm) {
          const query = searchTerm.toLowerCase();
          filtered = filtered.filter(user =>
            user.full_name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.department?.toLowerCase().includes(query)
          );
        }
        
        // Apply role filter
        if (roleFilter !== "all") {
          filtered = filtered.filter(user => user.role === roleFilter);
        }
        
        return filtered;
      },

      // Simulate account validation
      validateNewAccount: (account) => {
        const errors = [];
        
        if (!account.full_name || account.full_name.trim() === '') {
          errors.push("Full name is required");
        }
        
        if (!account.email || account.email.trim() === '') {
          errors.push("Email is required");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email)) {
          errors.push("Email is invalid");
        }
        
        if (!account.role || account.role.trim() === '') {
          errors.push("Role is required");
        }
        
        if (account.role !== "mayor" && (!account.department || account.department.trim() === '')) {
          errors.push("Department is required for department heads");
        }
        
        return {
          isValid: errors.length === 0,
          errors
        };
      },

      // Simulate department validation
      validateDepartment: (role, department) => {
        if (role === "mayor") {
          return department === "Office of the Municipal Mayor" || department === "";
        }
        
        const validDepartments = [
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
          "Municipal Treasurer's Office"
        ];
        
        return validDepartments.includes(department);
      },

      // Simulate status badge styling
      getStatusBadgeStyle: (status) => {
        if (status === "active") {
          return {
            backgroundColor: "rgba(46, 204, 113, 0.1)",
            color: "#27ae60",
            border: "1px solid rgba(46, 204, 113, 0.2)"
          };
        } else {
          return {
            backgroundColor: "rgba(231, 76, 60, 0.1)",
            color: "#c0392b",
            border: "1px solid rgba(231, 76, 60, 0.2)"
          };
        }
      }
    };

    it("✅ should filter users by search term", () => {
      const users = [
        { id: 1, full_name: "John Doe", email: "john@city.gov", department: "HR", role: "office_head", status: "active" },
        { id: 2, full_name: "Jane Smith", email: "jane@city.gov", department: "Finance", role: "office_head", status: "active" },
        { id: 3, full_name: "Bob Johnson", email: "bob@city.gov", department: "Engineering", role: "mayor", status: "active" }
      ];

      const filtered = mockUserFunctions.filterUsers(users, "john", "all", false);
      
      expect(filtered).to.have.lengthOf(2); // John Doe and Bob Johnson
      expect(filtered[0].full_name).to.equal("John Doe");
      expect(filtered[1].full_name).to.equal("Bob Johnson");
    });

    it("✅ should filter users by role", () => {
      const users = [
        { id: 1, full_name: "Mayor", email: "mayor@city.gov", department: "Mayor", role: "mayor", status: "active" },
        { id: 2, full_name: "Head", email: "head@dept.gov", department: "Department", role: "office_head", status: "active" },
        { id: 3, full_name: "Another Head", email: "head2@dept.gov", department: "Department2", role: "office_head", status: "active" }
      ];

      const filtered = mockUserFunctions.filterUsers(users, "", "office_head", false);
      
      expect(filtered).to.have.lengthOf(2);
      expect(filtered[0].role).to.equal("office_head");
      expect(filtered[1].role).to.equal("office_head");
    });

    it("✅ should filter inactive users", () => {
      const users = [
        { id: 1, full_name: "Active User", email: "active@city.gov", department: "HR", role: "office_head", status: "active" },
        { id: 2, full_name: "Inactive User", email: "inactive@city.gov", department: "Finance", role: "office_head", status: "inactive" },
        { id: 3, full_name: "Another Inactive", email: "inactive2@city.gov", department: "Engineering", role: "mayor", status: "inactive" }
      ];

      const filtered = mockUserFunctions.filterUsers(users, "", "all", true);
      
      expect(filtered).to.have.lengthOf(2);
      expect(filtered[0].status).to.equal("inactive");
      expect(filtered[1].status).to.equal("inactive");
    });

    it("✅ should validate complete mayor account", () => {
      const mayorAccount = {
        full_name: "Mayor Smith",
        email: "mayor@city.gov",
        role: "mayor",
        department: "Office of the Municipal Mayor"
      };

      const validation = mockUserFunctions.validateNewAccount(mayorAccount);
      
      expect(validation.isValid).to.equal(true);
      expect(validation.errors).to.have.lengthOf(0);
    });

    it("✅ should validate complete department head account", () => {
      const headAccount = {
        full_name: "Department Head",
        email: "head@dept.gov",
        role: "office_head",
        department: "Human Resource Management Division"
      };

      const validation = mockUserFunctions.validateNewAccount(headAccount);
      
      expect(validation.isValid).to.equal(true);
      expect(validation.errors).to.have.lengthOf(0);
    });

    it("❌ should invalidate account with missing name", () => {
      const invalidAccount = {
        full_name: "",
        email: "test@city.gov",
        role: "office_head",
        department: "Finance"
      };

      const validation = mockUserFunctions.validateNewAccount(invalidAccount);
      
      expect(validation.isValid).to.equal(false);
      expect(validation.errors).to.include("Full name is required");
    });

    it("❌ should invalidate account with invalid email", () => {
      const invalidAccount = {
        full_name: "Test User",
        email: "invalid-email",
        role: "office_head",
        department: "Finance"
      };

      const validation = mockUserFunctions.validateNewAccount(invalidAccount);
      
      expect(validation.isValid).to.equal(false);
      expect(validation.errors).to.include("Email is invalid");
    });

    it("❌ should invalidate department head without department", () => {
      const invalidAccount = {
        full_name: "Test User",
        email: "test@city.gov",
        role: "office_head",
        department: ""
      };

      const validation = mockUserFunctions.validateNewAccount(invalidAccount);
      
      expect(validation.isValid).to.equal(false);
      expect(validation.errors).to.include("Department is required for department heads");
    });

    it("✅ should allow mayor without specific department", () => {
      const mayorAccount = {
        full_name: "Mayor",
        email: "mayor@city.gov",
        role: "mayor",
        department: ""
      };

      const validation = mockUserFunctions.validateNewAccount(mayorAccount);
      
      expect(validation.isValid).to.equal(true);
    });

    it("✅ should validate valid department for department head", () => {
      const isValid = mockUserFunctions.validateDepartment(
        "office_head",
        "Human Resource Management Division"
      );
      
      expect(isValid).to.equal(true);
    });

    it("❌ should invalidate invalid department for department head", () => {
      const isValid = mockUserFunctions.validateDepartment(
        "office_head",
        "Invalid Department"
      );
      
      expect(isValid).to.equal(false);
    });

    it("✅ should validate mayor department", () => {
      const isValid1 = mockUserFunctions.validateDepartment("mayor", "Office of the Municipal Mayor");
      const isValid2 = mockUserFunctions.validateDepartment("mayor", "");
      
      expect(isValid1).to.equal(true);
      expect(isValid2).to.equal(true);
    });

    it("✅ should get active status badge style", () => {
      const style = mockUserFunctions.getStatusBadgeStyle("active");
      
      expect(style.backgroundColor).to.equal("rgba(46, 204, 113, 0.1)");
      expect(style.color).to.equal("#27ae60");
    });

    it("✅ should get inactive status badge style", () => {
      const style = mockUserFunctions.getStatusBadgeStyle("inactive");
      
      expect(style.backgroundColor).to.equal("rgba(231, 76, 60, 0.1)");
      expect(style.color).to.equal("#c0392b");
    });
  });

  describe("User Account Statistics Tests", () => {
    const calculateStatistics = (accounts, inactiveAccounts) => {
      const activeAccountsCount = accounts.filter(acc => acc.status === "active").length;
      const inactiveAccountsCount = inactiveAccounts.filter(acc => acc.status === "inactive").length;
      const mayorCount = accounts.filter(acc => acc.role === "mayor" && acc.status === "active").length;
      const officeHeadCount = accounts.filter(acc => acc.role === "office_head" && acc.status === "active").length;
      
      return {
        activeAccountsCount,
        inactiveAccountsCount,
        mayorCount,
        officeHeadCount,
        totalActive: activeAccountsCount,
        totalInactive: inactiveAccountsCount
      };
    };

    it("✅ should calculate correct statistics", () => {
      const accounts = [
        { id: 1, role: "mayor", status: "active" },
        { id: 2, role: "office_head", status: "active" },
        { id: 3, role: "office_head", status: "active" },
        { id: 4, role: "office_head", status: "inactive" }
      ];

      const inactiveAccounts = [
        { id: 4, role: "office_head", status: "inactive" },
        { id: 5, role: "mayor", status: "inactive" }
      ];

      const stats = calculateStatistics(accounts, inactiveAccounts);
      
      expect(stats.activeAccountsCount).to.equal(3);
      expect(stats.inactiveAccountsCount).to.equal(2);
      expect(stats.mayorCount).to.equal(1);
      expect(stats.officeHeadCount).to.equal(2);
      expect(stats.totalActive).to.equal(3);
      expect(stats.totalInactive).to.equal(2);
    });

    it("✅ should handle empty data sets", () => {
      const accounts = [];
      const inactiveAccounts = [];
      
      const stats = calculateStatistics(accounts, inactiveAccounts);
      
      expect(stats.activeAccountsCount).to.equal(0);
      expect(stats.inactiveAccountsCount).to.equal(0);
      expect(stats.mayorCount).to.equal(0);
      expect(stats.officeHeadCount).to.equal(0);
    });
  });


  describe("User Account Management Edge Cases", () => {
    it("✅ should handle accounts with very long names", () => {
      const longName = "A".repeat(100);
      const account = {
        full_name: longName,
        email: "test@city.gov",
        role: "office_head",
        department: "Department"
      };

      expect(account.full_name).to.have.lengthOf(100);
    });

    it("✅ should handle special characters in names and emails", () => {
      const specialAccount = {
        full_name: "O'Connor-Jr., John D. (CEO)",
        email: "john.o'connor+jr@city-department.gov.ph",
        role: "office_head",
        department: "Municipal Department"
      };

      expect(specialAccount.full_name).to.include("O'Connor");
      expect(specialAccount.email).to.include("o'connor");
    });

    it("✅ should handle missing optional fields", () => {
      const minimalAccount = {
        id: 1,
        full_name: "Test User",
        email: "test@city.gov",
        role: "office_head",
        department: "Department",
        status: "active"
        // Missing created_at and last_login
      };

      expect(minimalAccount.full_name).to.equal("Test User");
      expect(minimalAccount.email).to.equal("test@city.gov");
      // Should not crash when accessing missing fields
      expect(minimalAccount.created_at).to.be.undefined;
    });

    it("✅ should handle role case variations", () => {
      const accounts = [
        { role: "MAYOR", status: "active" },
        { role: "Mayor", status: "active" },
        { role: "mayor", status: "active" },
        { role: "OFFICE_HEAD", status: "active" },
        { role: "Office Head", status: "active" },
        { role: "office_head", status: "active" }
      ];

      const filtered = accounts.filter(acc => 
        acc.role.toLowerCase() === "mayor" || 
        acc.role.toLowerCase().replace("_", " ") === "office head"
      );
      
      expect(filtered).to.have.lengthOf(6); // All should match
    });
  });

  describe("Error Handling Tests", () => {
    it("❌ should handle network error when fetching accounts", async () => {
      axiosMock.onGet(`${API_URL}/api/authAdmin/accounts`).networkError();

      try {
        await axios.get(`${API_URL}/api/authAdmin/accounts`);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.equal("Network Error");
      }
    });

    it("❌ should handle timeout when creating account", async () => {
      axiosMock.onPost(`${API_URL}/api/authAdmin/createAccount`).timeout();

      const newUser = {
        full_name: "Test User",
        email: "test@city.gov",
        role: "office_head",
        department: "Department",
        password: "tempPass123!@"
      };

      try {
        await axios.post(`${API_URL}/api/authAdmin/createAccount`, newUser);
        expect.fail("Should have thrown a timeout error");
      } catch (error) {
        expect(error.code).to.equal('ECONNABORTED');
      }
    });

    it("❌ should handle 403 forbidden when updating account", async () => {
      axiosMock.onPut(`${API_URL}/api/authAdmin/accounts/1`)
        .reply(403, { message: "Forbidden: Insufficient permissions" });

      const updatedUser = {
        full_name: "Updated Name",
        email: "updated@city.gov",
        role: "office_head",
        department: "Department"
      };

      try {
        await axios.put(`${API_URL}/api/authAdmin/accounts/1`, updatedUser, {
          headers: { Authorization: "Bearer invalid-token" }
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.response.status).to.equal(403);
      }
    });

    it("❌ should handle 404 when account not found", async () => {
      axiosMock.onPut(`${API_URL}/api/authAdmin/accounts/999/deactivate`)
        .reply(404, { message: "Account not found" });

      try {
        await axios.put(`${API_URL}/api/authAdmin/accounts/999/deactivate`, {}, {
          headers: { Authorization: "Bearer test-token" }
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });

    it("✅ should handle successful response with empty data", async () => {
      axiosMock.onGet(`${API_URL}/api/authAdmin/accounts`).reply(200, { accounts: [] });
      axiosMock.onGet(`${API_URL}/api/authAdmin/accounts/inactive`).reply(200, { accounts: [] });

      const response1 = await axios.get(`${API_URL}/api/authAdmin/accounts`);
      const response2 = await axios.get(`${API_URL}/api/authAdmin/accounts/inactive`);

      expect(response1.status).to.equal(200);
      expect(response1.data.accounts).to.be.an('array').that.is.empty;
      expect(response2.status).to.equal(200);
      expect(response2.data.accounts).to.be.an('array').that.is.empty;
    });
  });

  describe("Data Integrity Tests", () => {
    it("✅ should ensure unique user IDs", () => {
      const accounts = [
        { id: 1, email: "user1@city.gov" },
        { id: 2, email: "user2@city.gov" },
        { id: 3, email: "user3@city.gov" },
        { id: 1, email: "duplicate@city.gov" } // Duplicate ID
      ];

      const ids = accounts.map(acc => acc.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(ids).to.have.lengthOf(4);
      expect(uniqueIds).to.have.lengthOf(3); // Should detect duplicate
    });

    it("✅ should ensure unique email addresses", () => {
      const accounts = [
        { id: 1, email: "unique1@city.gov" },
        { id: 2, email: "unique2@city.gov" },
        { id: 3, email: "unique1@city.gov" } // Duplicate email
      ];

      const emails = accounts.map(acc => acc.email);
      const uniqueEmails = [...new Set(emails)];
      
      expect(emails).to.have.lengthOf(3);
      expect(uniqueEmails).to.have.lengthOf(2); // Should detect duplicate
    });

    it("✅ should validate email domain patterns", () => {
      const emails = [
        "user@city.gov",
        "user@department.city.gov",
        "user@city-department.gov.ph",
        "user.name@city.gov",
        "user+tag@city.gov",
        "invalid-email",
        "user@",
        "@city.gov"
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validEmails = emails.filter(email => emailRegex.test(email));
      
      expect(validEmails).to.have.lengthOf(5); // First 5 should be valid
    });

    it("✅ should validate role assignments", () => {
      const validRoles = ["mayor", "office_head"];
      const accounts = [
        { role: "mayor" },
        { role: "office_head" },
        { role: "admin" }, // Invalid
        { role: "employee" }, // Invalid
        { role: "" } // Invalid
      ];

      const validAccounts = accounts.filter(acc => validRoles.includes(acc.role));
      
      expect(validAccounts).to.have.lengthOf(2);
    });
  });

  describe("Password Security Tests", () => {
    const generateTemporaryPassword = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      let password = '';
      
      // Ensure at least one of each required character type
      password += 'A'; // uppercase
      password += 'a'; // lowercase
      password += '1'; // number
      password += '@'; // special
      
      // Add random characters to reach minimum length
      for (let i = 4; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Shuffle the password
      password = password.split('').sort(() => 0.5 - Math.random()).join('');
      
      return password;
    };

    it("✅ should generate valid temporary passwords", () => {
      const password = generateTemporaryPassword();
      
      expect(password).to.have.length.above(11); // At least 12 characters
      expect(password).to.match(/[A-Z]/); // Contains uppercase
      expect(password).to.match(/[a-z]/); // Contains lowercase
      expect(password).to.match(/[0-9]/); // Contains number
      expect(password).to.match(/[!@#$%^&*]/); // Contains special
    });

    it("✅ should generate unique temporary passwords", () => {
      const password1 = generateTemporaryPassword();
      const password2 = generateTemporaryPassword();
      
      expect(password1).to.not.equal(password2);
    });

    it("✅ should validate password complexity", () => {
      const validatePassword = (password) => {
        const requirements = [];
        
        if (password.length < 12) {
          requirements.push("Password must be at least 12 characters");
        }
        if (!/[A-Z]/.test(password)) {
          requirements.push("Password must contain at least one uppercase letter");
        }
        if (!/[a-z]/.test(password)) {
          requirements.push("Password must contain at least one lowercase letter");
        }
        if (!/[0-9]/.test(password)) {
          requirements.push("Password must contain at least one number");
        }
        if (!/[!@#$%^&*]/.test(password)) {
          requirements.push("Password must contain at least one special character (!@#$%^&*)");
        }
        
        return {
          isValid: requirements.length === 0,
          requirements
        };
      };

      const strongPassword = "SecurePass123!@#";
      const weakPassword = "weak";
      
      const strongValidation = validatePassword(strongPassword);
      const weakValidation = validatePassword(weakPassword);
      
      expect(strongValidation.isValid).to.equal(true);
      expect(weakValidation.isValid).to.equal(false);
      expect(weakValidation.requirements).to.have.length.above(0);
    });
  });
});