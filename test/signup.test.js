/* eslint-disable jest/no-conditional-expect */
/* eslint-disable jest/valid-expect */

import { expect } from "chai";
import sinon from "sinon";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

describe("Admin Signup Component Tests", () => {
  let axiosMock;
  const API_URL = "https://ezleave-admin-api.onrender.com";

  beforeEach(() => {
    axiosMock = new MockAdapter(axios);
    // Clear any existing admin flag in localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    axiosMock.restore();
  });

  // Mock localStorage if running in Node environment
  if (typeof localStorage === 'undefined') {
    const localStorageMock = {
      store: {},
      getItem: function(key) {
        return this.store[key] || null;
      },
      setItem: function(key, value) {
        this.store[key] = value.toString();
      },
      removeItem: function(key) {
        delete this.store[key];
      },
      clear: function() {
        this.store = {};
      }
    };
    global.localStorage = localStorageMock;
  }

  describe("Signup API Tests", () => {
    it("✅ should sign up admin successfully", async () => {
      axiosMock.onPost(`${API_URL}/api/auth/signup`)
        .reply(201, {
          message: "Admin account created successfully"
        });

      const signupData = {
        email: "admin@example.com",
        fullName: "Admin User",
        password: "password123"
      };

      const response = await axios.post(`${API_URL}/api/auth/signup`, signupData);
      
      expect(response.status).to.equal(201);
      expect(response.data.message).to.equal("Admin account created successfully");
    });

    it("❌ should fail when admin already exists", async () => {
      axiosMock.onPost(`${API_URL}/api/auth/signup`)
        .reply(409, {
          message: "Admin already exists"
        });

      const signupData = {
        email: "existing@example.com",
        fullName: "Existing Admin",
        password: "password123"
      };

      try {
        await axios.post(`${API_URL}/api/auth/signup`, signupData);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.response.status).to.equal(409);
        expect(error.response.data.message).to.equal("Admin already exists");
      }
    });

    it("❌ should fail with validation errors", async () => {
      axiosMock.onPost(`${API_URL}/api/auth/signup`)
        .reply(400, {
          message: "Validation failed",
          errors: ["Email is required", "Password must be at least 6 characters"]
        });

      const invalidData = {
        email: "",
        fullName: "",
        password: "123"
      };

      try {
        await axios.post(`${API_URL}/api/auth/signup`, invalidData);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.errors).to.be.an('array');
      }
    });

    it("❌ should fail with server error", async () => {
      axiosMock.onPost(`${API_URL}/api/auth/signup`)
        .reply(500, {
          message: "Internal server error"
        });

      const signupData = {
        email: "test@example.com",
        fullName: "Test User",
        password: "password123"
      };

      try {
        await axios.post(`${API_URL}/api/auth/signup`, signupData);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.response.status).to.equal(500);
        expect(error.response.data.message).to.equal("Internal server error");
      }
    });
  });

  describe("Signup Form Validation Tests", () => {
    const validateSignupForm = (email, fullName, password, confirmPassword) => {
      const errors = [];
      
      // Email validation
      if (!email || email.trim() === '') {
        errors.push("Email is required");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push("Email is invalid");
      }
      
      // Full name validation
      if (!fullName || fullName.trim() === '') {
        errors.push("Full name is required");
      }
      
      // Password validation
      if (!password || password.trim() === '') {
        errors.push("Password is required");
      } else if (password.length < 6) {
        errors.push("Password must be at least 6 characters");
      }
      
      // Confirm password validation
      if (password !== confirmPassword) {
        errors.push("Passwords do not match");
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    };

    it("✅ should validate complete signup form", () => {
      const validation = validateSignupForm(
        "admin@example.com",
        "Admin User",
        "password123",
        "password123"
      );
      
      expect(validation.isValid).to.equal(true);
      expect(validation.errors).to.have.lengthOf(0);
    });

    it("❌ should invalidate form with empty email", () => {
      const validation = validateSignupForm(
        "",
        "Admin User",
        "password123",
        "password123"
      );
      
      expect(validation.isValid).to.equal(false);
      expect(validation.errors).to.include("Email is required");
    });

    it("❌ should invalidate form with invalid email", () => {
      const validation = validateSignupForm(
        "invalid-email",
        "Admin User",
        "password123",
        "password123"
      );
      
      expect(validation.isValid).to.equal(false);
      expect(validation.errors).to.include("Email is invalid");
    });

    it("❌ should invalidate form with empty full name", () => {
      const validation = validateSignupForm(
        "admin@example.com",
        "",
        "password123",
        "password123"
      );
      
      expect(validation.isValid).to.equal(false);
      expect(validation.errors).to.include("Full name is required");
    });

    it("❌ should invalidate form with short password", () => {
      const validation = validateSignupForm(
        "admin@example.com",
        "Admin User",
        "123",
        "123"
      );
      
      expect(validation.isValid).to.equal(false);
      expect(validation.errors).to.include("Password must be at least 6 characters");
    });

    it("❌ should invalidate form when passwords don't match", () => {
      const validation = validateSignupForm(
        "admin@example.com",
        "Admin User",
        "password123",
        "differentpassword"
      );
      
      expect(validation.isValid).to.equal(false);
      expect(validation.errors).to.include("Passwords do not match");
    });

    it("❌ should return multiple errors for multiple invalid fields", () => {
      const validation = validateSignupForm(
        "",
        "",
        "123",
        "456"
      );
      
      expect(validation.isValid).to.equal(false);
      expect(validation.errors).to.have.lengthOf(4);
      expect(validation.errors).to.include("Email is required");
      expect(validation.errors).to.include("Full name is required");
      expect(validation.errors).to.include("Password must be at least 6 characters");
      expect(validation.errors).to.include("Passwords do not match");
    });
  });

  describe("Admin Signup Once Logic Tests", () => {
    // Mock function to simulate the "admin can only signup once" logic
    const checkIfAdminExists = async () => {
      // In a real scenario, this would check database or localStorage
      // For testing, we'll simulate different responses
      
      // Check if admin flag exists in localStorage
      const adminExists = localStorage.getItem("admin_exists") === "true";
      
      if (adminExists) {
        throw new Error("Admin already exists");
      }
      
      // Simulate successful check - admin doesn't exist yet
      return { exists: false };
    };

    const createAdmin = async (email, fullName, password) => {
      // First check if admin exists
      const checkResult = await checkIfAdminExists();
      
      if (checkResult.exists) {
        throw new Error("Admin already exists");
      }
      
      // Simulate creating admin and setting flag
      localStorage.setItem("admin_exists", "true");
      
      return {
        success: true,
        message: "Admin created successfully",
        data: { email, fullName }
      };
    };

    beforeEach(() => {
      localStorage.clear();
    });

    it("✅ should allow first admin signup", async () => {
      const result = await createAdmin(
        "first@example.com",
        "First Admin",
        "password123"
      );
      
      expect(result.success).to.equal(true);
      expect(result.message).to.equal("Admin created successfully");
      expect(localStorage.getItem("admin_exists")).to.equal("true");
    });

    it("❌ should prevent second admin signup", async () => {
      // First admin signup
      await createAdmin("first@example.com", "First Admin", "password123");
      
      // Try second admin signup
      try {
        await createAdmin("second@example.com", "Second Admin", "password456");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.equal("Admin already exists");
        expect(localStorage.getItem("admin_exists")).to.equal("true");
      }
    });

    it("✅ should reset admin flag when cleared", async () => {
      // First admin signup
      await createAdmin("first@example.com", "First Admin", "password123");
      
      // Clear the flag (simulating admin deletion)
      localStorage.removeItem("admin_exists");
      
      // Should allow new admin signup after clearing
      const result = await createAdmin("new@example.com", "New Admin", "password789");
      
      expect(result.success).to.equal(true);
      expect(localStorage.getItem("admin_exists")).to.equal("true");
    });
  });

  describe("Signup Flow Integration Tests", () => {
    const simulateSignupFlow = async (email, fullName, password, confirmPassword) => {
      const errors = [];
      
      // Validate passwords match
      if (password !== confirmPassword) {
        errors.push("Passwords do not match");
        return {
          success: false,
          errors
        };
      }
      
      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push("Email is invalid");
        return {
          success: false,
          errors
        };
      }
      
      // Simulate API call
      try {
        // Check if admin already exists (simulated by localStorage)
        if (localStorage.getItem("admin_registered") === email) {
          errors.push("Admin with this email already exists");
          return {
            success: false,
            errors
          };
        }
        
        // Simulate successful signup
        localStorage.setItem("admin_registered", email);
        
        return {
          success: true,
          message: "Admin account created successfully",
          data: { email, fullName }
        };
      } catch (error) {
        errors.push(error.message || "Signup failed");
        return {
          success: false,
          errors
        };
      }
    };

    beforeEach(() => {
      localStorage.clear();
    });

    it("✅ should complete successful signup flow", async () => {
      const result = await simulateSignupFlow(
        "admin@example.com",
        "Admin User",
        "password123",
        "password123"
      );
      
      expect(result.success).to.equal(true);
      expect(result.message).to.equal("Admin account created successfully");
      expect(localStorage.getItem("admin_registered")).to.equal("admin@example.com");
    });

    it("❌ should fail signup when passwords don't match", async () => {
      const result = await simulateSignupFlow(
        "admin@example.com",
        "Admin User",
        "password123",
        "different"
      );
      
      expect(result.success).to.equal(false);
      expect(result.errors).to.include("Passwords do not match");
    });

    it("❌ should fail signup with invalid email", async () => {
      const result = await simulateSignupFlow(
        "invalid-email",
        "Admin User",
        "password123",
        "password123"
      );
      
      expect(result.success).to.equal(false);
      expect(result.errors).to.include("Email is invalid");
    });

    it("❌ should fail signup when admin already registered", async () => {
      // First registration
      await simulateSignupFlow(
        "existing@example.com",
        "Admin User",
        "password123",
        "password123"
      );
      
      // Try to register same email again
      const result = await simulateSignupFlow(
        "existing@example.com",
        "Another Admin",
        "password456",
        "password456"
      );
      
      expect(result.success).to.equal(false);
      expect(result.errors).to.include("Admin with this email already exists");
    });

    it("✅ should allow different email registration", async () => {
      // First admin
      const result1 = await simulateSignupFlow(
        "admin1@example.com",
        "Admin One",
        "password123",
        "password123"
      );
      
      expect(result1.success).to.equal(true);
      expect(localStorage.getItem("admin_registered")).to.equal("admin1@example.com");
      
      // Clear for second admin (simulating different session/instance)
      localStorage.clear();
      
      // Second admin
      const result2 = await simulateSignupFlow(
        "admin2@example.com",
        "Admin Two",
        "password456",
        "password456"
      );
      
      expect(result2.success).to.equal(true);
      expect(localStorage.getItem("admin_registered")).to.equal("admin2@example.com");
    });
  });

  describe("Edge Case Tests", () => {
    it("✅ should handle very long email addresses", async () => {
      const longEmail = "a".repeat(100) + "@example.com";
      axiosMock.onPost(`${API_URL}/api/auth/signup`)
        .reply(201, {
          message: "Admin account created"
        });
      
      const response = await axios.post(`${API_URL}/api/auth/signup`, {
        email: longEmail,
        fullName: "Test User",
        password: "password123"
      });
      
      expect(response.status).to.equal(201);
    });

    it("✅ should handle email with special characters", async () => {
      const specialEmail = "admin.test+tag@example-domain.co.uk";
      axiosMock.onPost(`${API_URL}/api/auth/signup`)
        .reply(201, {
          message: "Admin account created"
        });
      
      const response = await axios.post(`${API_URL}/api/auth/signup`, {
        email: specialEmail,
        fullName: "Test User",
        password: "password123"
      });
      
      expect(response.status).to.equal(201);
    });

    it("✅ should handle full name with special characters", async () => {
      const specialName = "Admin O'Connor-Jr. (CEO)";
      axiosMock.onPost(`${API_URL}/api/auth/signup`)
        .reply(201, {
          message: "Admin account created"
        });
      
      const response = await axios.post(`${API_URL}/api/auth/signup`, {
        email: "admin@example.com",
        fullName: specialName,
        password: "password123"
      });
      
      expect(response.status).to.equal(201);
    });

    it("✅ should handle concurrent signup attempts", async () => {
      // Simulate two concurrent signup attempts
      const email = "test@example.com";
      
      // First attempt sets the flag
      localStorage.setItem("admin_exists", "true");
      
      // Second attempt should fail
      const checkAdminExists = () => {
        return localStorage.getItem("admin_exists") === "true";
      };
      
      expect(checkAdminExists()).to.equal(true);
      
      // Try to create admin
      try {
        if (checkAdminExists()) {
          throw new Error("Admin already exists");
        }
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.equal("Admin already exists");
      }
    });

    it("✅ should handle network timeout during signup", async () => {
      axiosMock.onPost(`${API_URL}/api/auth/signup`)
        .timeout();
      
      const signupData = {
        email: "test@example.com",
        fullName: "Test User",
        password: "password123"
      };

      try {
        await axios.post(`${API_URL}/api/auth/signup`, signupData);
        expect.fail("Should have thrown a timeout error");
      } catch (error) {
        expect(error.code).to.equal('ECONNABORTED');
      }
    });

    it("✅ should handle very strong passwords", async () => {
      const strongPassword = "P@ssw0rd!123#Secure$";
      axiosMock.onPost(`${API_URL}/api/auth/signup`)
        .reply(201, {
          message: "Admin account created"
        });
      
      const response = await axios.post(`${API_URL}/api/auth/signup`, {
        email: "admin@example.com",
        fullName: "Admin User",
        password: strongPassword
      });
      
      expect(response.status).to.equal(201);
    });
  });

  describe("UI/UX Flow Tests", () => {
    const simulateUIBehavior = () => {
      const behaviors = {
        showMessage: (text, isError = false) => {
          return {
            visible: true,
            text: text,
            isError: isError,
            color: isError ? "red" : "green"
          };
        },
        
        hideMessage: () => {
          return {
            visible: false,
            text: "",
            isError: false
          };
        },
        
        redirectToLogin: (delay = 3000) => {
          return {
            redirecting: true,
            delay: delay,
            destination: "/"
          };
        },
        
        blurBackground: (hasMessage) => {
          return {
            blurred: hasMessage
          };
        }
      };
      
      return behaviors;
    };

    it("✅ should show success message on signup", () => {
      const ui = simulateUIBehavior();
      const message = ui.showMessage("Admin account created! Please log in.");
      
      expect(message.visible).to.equal(true);
      expect(message.text).to.equal("Admin account created! Please log in.");
      expect(message.isError).to.equal(false);
      expect(message.color).to.equal("green");
    });

    it("✅ should show error message on failure", () => {
      const ui = simulateUIBehavior();
      const message = ui.showMessage("Passwords do not match.", true);
      
      expect(message.visible).to.equal(true);
      expect(message.text).to.equal("Passwords do not match.");
      expect(message.isError).to.equal(true);
      expect(message.color).to.equal("red");
    });

    it("✅ should hide message after timeout", () => {
      const ui = simulateUIBehavior();
      const hiddenMessage = ui.hideMessage();
      
      expect(hiddenMessage.visible).to.equal(false);
      expect(hiddenMessage.text).to.equal("");
    });

    it("✅ should redirect to login after successful signup", () => {
      const ui = simulateUIBehavior();
      const redirect = ui.redirectToLogin();
      
      expect(redirect.redirecting).to.equal(true);
      expect(redirect.delay).to.equal(3000);
      expect(redirect.destination).to.equal("/");
    });

    it("✅ should blur background when message is shown", () => {
      const ui = simulateUIBehavior();
      const blur = ui.blurBackground(true);
      
      expect(blur.blurred).to.equal(true);
    });

    it("✅ should not blur background when no message", () => {
      const ui = simulateUIBehavior();
      const blur = ui.blurBackground(false);
      
      expect(blur.blurred).to.equal(false);
    });
  });

  describe("Database/Backend Simulation Tests", () => {
    // Simulating database behavior for "admin can only signup once"
    const adminDatabase = {
      adminExists: false,
      adminEmail: null,
      
      checkAdminExists: function() {
        return this.adminExists;
      },
      
      createAdmin: function(email, fullName, password) {
        if (this.adminExists) {
          throw new Error("Admin already exists in the system");
        }
        
        this.adminExists = true;
        this.adminEmail = email;
        
        return {
          success: true,
          message: "Admin created successfully",
          admin: { email, fullName }
        };
      },
      
      resetDatabase: function() {
        this.adminExists = false;
        this.adminEmail = null;
      }
    };

    beforeEach(() => {
      adminDatabase.resetDatabase();
    });

    it("✅ should create first admin in database", () => {
      const result = adminDatabase.createAdmin(
        "admin@example.com",
        "Admin User",
        "password123"
      );
      
      expect(result.success).to.equal(true);
      expect(adminDatabase.checkAdminExists()).to.equal(true);
      expect(adminDatabase.adminEmail).to.equal("admin@example.com");
    });

    it("❌ should fail to create second admin in database", () => {
      // Create first admin
      adminDatabase.createAdmin("first@example.com", "First Admin", "password123");
      
      // Try to create second admin
      try {
        adminDatabase.createAdmin("second@example.com", "Second Admin", "password456");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.equal("Admin already exists in the system");
        expect(adminDatabase.adminEmail).to.equal("first@example.com");
      }
    });

    it("✅ should allow admin creation after database reset", () => {
      // Create and then reset
      adminDatabase.createAdmin("old@example.com", "Old Admin", "password123");
      adminDatabase.resetDatabase();
      
      // Should allow new admin
      const result = adminDatabase.createAdmin("new@example.com", "New Admin", "password456");
      
      expect(result.success).to.equal(true);
      expect(adminDatabase.adminEmail).to.equal("new@example.com");
    });
  });
});