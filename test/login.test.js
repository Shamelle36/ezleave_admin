/* eslint-disable jest/no-conditional-expect */
/* eslint-disable jest/valid-expect */

import { expect } from "chai";
import sinon from "sinon";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { JSDOM } from "jsdom";

// Fake DOM for localStorage & window
const dom = new JSDOM("", { url: "http://localhost" });
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = window.localStorage;

// Mock Firebase Auth functions
let signInWithEmailAndPasswordStub;
let getIdTokenStub;

// Mock navigation
let navigateSpy;

// Mock login function that simulates your login logic
const mockLoginFunction = async (email, password) => {
  try {
    // First attempt: Regular API login
    const response = await axios.post("https://ezleave-admin-api.onrender.com/api/auth/login", {
      email,
      password
    });
    
    // Successful regular login
    localStorage.setItem("role", response.data.user.role);
    localStorage.setItem("token", response.data.token);
    return { success: true, role: response.data.user.role, token: response.data.token };
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Fallback to Firebase for department heads
      try {
        // Check if user exists in admin system via email
        const userCheck = await axios.get(`https://ezleave-admin-api.onrender.com/api/authAdmin/user-email/${email}`);
        
        if (userCheck.data.status === "inactive") {
          throw new Error("Account is inactive");
        }
        
        // Attempt Firebase login
        const firebaseResult = await signInWithEmailAndPasswordStub(email, password);
        const firebaseToken = await firebaseResult.user.getIdToken();
        
        localStorage.setItem("role", userCheck.data.role);
        localStorage.setItem("token", firebaseToken);
        return { success: true, role: userCheck.data.role, token: firebaseToken };
        
      } catch (firebaseError) {
        if (firebaseError.code === "auth/wrong-password") {
          throw new Error("Invalid credentials");
        }
        throw firebaseError;
      }
    }
    throw error;
  }
};

describe("Admin Login (Admin / Head / Mayor)", () => {
  let axiosMock;

  beforeEach(() => {
    axiosMock = new MockAdapter(axios);
    localStorage.clear();
    
    // Setup Firebase mock
    signInWithEmailAndPasswordStub = sinon.stub().resolves({
      user: { 
        getIdToken: () => Promise.resolve("firebase-token") 
      }
    });
    
    // Setup navigation spy
    navigateSpy = sinon.spy();
  });

  afterEach(() => {
    axiosMock.restore();
    sinon.restore();
  });

  it("✅ logs in MAIN ADMIN successfully", async () => {
    axiosMock.onPost("https://ezleave-admin-api.onrender.com/api/auth/login")
      .reply(200, {
        user: { id: 1, role: "admin" },
        token: "admin-token",
      });

    const result = await mockLoginFunction("admin@example.com", "password123");

    expect(result.success).to.equal(true);
    expect(result.role).to.equal("admin");
    expect(result.token).to.equal("admin-token");
    expect(localStorage.getItem("role")).to.equal("admin");
    expect(localStorage.getItem("token")).to.equal("admin-token");
  });

  it("✅ logs in DEPARTMENT HEAD via Firebase fallback", async () => {
    axiosMock.onPost("https://ezleave-admin-api.onrender.com/api/auth/login")
      .reply(401); // Regular login fails

    axiosMock.onGet(/\/api\/authAdmin\/user-email\//)
      .reply(200, {
        id: 2,
        role: "head",
        status: "active",
      });

    const result = await mockLoginFunction("head@department.com", "password123");

    expect(result.success).to.equal(true);
    expect(result.role).to.equal("head");
    expect(result.token).to.equal("firebase-token");
    expect(localStorage.getItem("role")).to.equal("head");
    expect(localStorage.getItem("token")).to.equal("firebase-token");
  });

  it("✅ logs in MAYOR account", async () => {
    axiosMock.onPost("https://ezleave-admin-api.onrender.com/api/auth/login")
      .reply(200, {
        user: { id: 3, role: "mayor" },
        token: "mayor-token",
      });

    const result = await mockLoginFunction("mayor@city.gov", "password123");

    expect(result.success).to.equal(true);
    expect(result.role).to.equal("mayor");
    expect(result.token).to.equal("mayor-token");
    expect(localStorage.getItem("role")).to.equal("mayor");
    expect(localStorage.getItem("token")).to.equal("mayor-token");
  });

  it("❌ blocks inactive account", async () => {
    axiosMock.onPost("https://ezleave-admin-api.onrender.com/api/auth/login")
      .reply(401);

    axiosMock.onGet(/\/api\/authAdmin\/user-email\//)
      .reply(200, {
        role: "head",
        status: "inactive",
      });

    try {
      await mockLoginFunction("inactive@example.com", "password123");
      // Should not reach here
      expect.fail("Should have thrown an error for inactive account");
    } catch (error) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(error.message).to.equal("Account is inactive");
      expect(localStorage.getItem("role")).to.equal(null);
      expect(localStorage.getItem("token")).to.equal(null);
    }
  });

  it("❌ shows invalid credentials message", async () => {
    axiosMock.onPost("https://ezleave-admin-api.onrender.com/api/auth/login")
      .reply(401);

    axiosMock.onGet(/\/api\/authAdmin\/user-email\//)
      .reply(200, {
        role: "head",
        status: "active",
      });

    // Mock Firebase to reject with wrong password
    signInWithEmailAndPasswordStub = sinon.stub().rejects({ 
      code: "auth/wrong-password" 
    });

    try {
      await mockLoginFunction("user@example.com", "wrongpassword");
      // Should not reach here
      expect.fail("Should have thrown an error for invalid credentials");
    } catch (error) {
      expect(error.message).to.equal("Invalid credentials");
      expect(localStorage.getItem("role")).to.equal(null);
      expect(localStorage.getItem("token")).to.equal(null);
    }
  });

  it("❌ handles other Firebase errors", async () => {
    axiosMock.onPost("https://ezleave-admin-api.onrender.com/api/auth/login")
      .reply(401);

    axiosMock.onGet(/\/api\/authAdmin\/user-email\//)
      .reply(200, {
        role: "head",
        status: "active",
      });

    // Mock Firebase to reject with different error
    signInWithEmailAndPasswordStub = sinon.stub().rejects({ 
      code: "auth/user-not-found" 
    });

    try {
      await mockLoginFunction("nonexistent@example.com", "password123");
      // Should not reach here
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.code).to.equal("auth/user-not-found");
      expect(localStorage.getItem("role")).to.equal(null);
      expect(localStorage.getItem("token")).to.equal(null);
    }
  });

  it("❌ handles network errors in regular login", async () => {
    axiosMock.onPost("https://ezleave-admin-api.onrender.com/api/auth/login")
      .reply(500); // Server error

    try {
      await mockLoginFunction("admin@example.com", "password123");
      // Should not reach here
      expect.fail("Should have thrown an error for server error");
    } catch (error) {
      expect(error.response.status).to.equal(500);
      expect(localStorage.getItem("role")).to.equal(null);
      expect(localStorage.getItem("token")).to.equal(null);
    }
  });
});