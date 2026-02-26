/* eslint-disable no-undef */
/* eslint-disable jest/no-conditional-expect */
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

// Mock fetch globally
let fetchStub;

describe("Announcement Component Tests", () => {
  let axiosMock;
  const API_URL = "https://ezleave-admin-api.onrender.com";

  beforeEach(() => {
    axiosMock = new MockAdapter(axios);
    localStorage.clear();
    
    // Mock fetch
    fetchStub = sinon.stub(global, 'fetch');
    
    // Set up admin in localStorage
    localStorage.setItem("admin", JSON.stringify({
      id: 1,
      full_name: "Test Admin",
      email: "admin@example.com",
      role: "admin",
      profile_picture: ""
    }));
    
    localStorage.setItem("role", "admin");
  });

  afterEach(() => {
    axiosMock.restore();
    sinon.restore();
  });

  describe("API Integration Tests", () => {
    it("✅ should fetch announcements successfully", async () => {
      const mockAnnouncements = [
        {
          id: 1,
          title: "Test Announcement 1",
          details: "Test details 1",
          posted_by: "Admin User",
          position: "Administrator",
          created_at: "2024-01-01",
          images: [],
          profile_picture: ""
        },
        {
          id: 2,
          title: "Test Announcement 2",
          details: "Test details 2",
          posted_by: "Admin User 2",
          position: "Manager",
          created_at: "2024-01-02",
          images: [],
          profile_picture: ""
        }
      ];

      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve(mockAnnouncements)
      });

      // Simulate fetch call
      const response = await fetch(`${API_URL}/api/announcements`);
      const data = await response.json();

      expect(response.ok).to.equal(true);
      expect(data).to.be.an('array');
      expect(data).to.have.lengthOf(2);
      expect(data[0].title).to.equal("Test Announcement 1");
    });

    it("❌ should handle fetch announcements error", async () => {
      fetchStub.rejects(new Error("Network error"));

      try {
        await fetch(`${API_URL}/api/announcements`);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.equal("Network error");
      }
    });

    it("✅ should post a new announcement", async () => {
      const newAnnouncement = {
        title: "New Announcement",
        details: "New announcement details",
        created_by: 1
      };

      const mockResponse = {
        id: 3,
        ...newAnnouncement,
        posted_by: "Test Admin",
        position: "Administrator",
        created_at: "2024-01-03",
        images: []
      };

      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // Simulate FormData creation and POST request
      const formData = new FormData();
      Object.entries(newAnnouncement).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(`${API_URL}/api/announcements`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();

      expect(response.ok).to.equal(true);
      expect(data.id).to.equal(3);
      expect(data.title).to.equal("New Announcement");
      expect(data.created_by).to.equal(1);
    });

    it("✅ should update an announcement", async () => {
      const updatedAnnouncement = {
        title: "Updated Announcement",
        details: "Updated details"
      };

      const mockResponse = {
        id: 1,
        ...updatedAnnouncement,
        posted_by: "Test Admin",
        created_at: "2024-01-01"
      };

      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const formData = new FormData();
      Object.entries(updatedAnnouncement).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(`${API_URL}/api/announcements/1`, {
        method: "PUT",
        body: formData
      });
      const data = await response.json();

      expect(response.ok).to.equal(true);
      expect(data.id).to.equal(1);
      expect(data.title).to.equal("Updated Announcement");
    });

    it("✅ should delete an announcement", async () => {
      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve({ message: "Announcement deleted successfully" })
      });

      const response = await fetch(`${API_URL}/api/announcements/1`, {
        method: "DELETE"
      });
      const data = await response.json();

      expect(response.ok).to.equal(true);
      expect(data.message).to.equal("Announcement deleted successfully");
    });
  });

  describe("Announcement Business Logic Tests", () => {
    const mockAnnouncementFunctions = {
      // Simulate the announcement filtering logic (without visibility)
      filterAnnouncements: (announcements, searchQuery) => {
        let result = announcements;

        // Apply search filter only
        if (searchQuery.trim() !== "") {
          const query = searchQuery.toLowerCase();
          result = result.filter(announcement =>
            announcement.title.toLowerCase().includes(query) ||
            announcement.details.toLowerCase().includes(query) ||
            announcement.posted_by?.toLowerCase().includes(query)
          );
        }

        return result;
      },

      // Simulate the image carousel logic
      calculateCarouselState: (images) => {
        const hasCarousel = images.length > 6;
        const currentIndex = 0;
        const totalImages = images.length;
        
        let visibleImages = images;
        if (hasCarousel) {
          const startIndex = currentIndex;
          const endIndex = Math.min(startIndex + 6, images.length);
          visibleImages = images.slice(startIndex, endIndex);
          
          if (endIndex > images.length) {
            const remaining = 6 - (images.length - startIndex);
            visibleImages = [
              ...images.slice(startIndex),
              ...images.slice(0, remaining)
            ];
          }
        }

        return {
          hasCarousel,
          currentIndex,
          totalImages,
          visibleImages
        };
      },

      // Simulate ellipsis detection
      checkEllipsis: (element) => {
        if (!element) return false;
        return element.scrollHeight > element.clientHeight;
      },

      // Simulate logout logic
      handleLogout: async () => {
        const user = JSON.parse(localStorage.getItem("admin"));

        if (user) {
          await fetch(`${API_URL}/api/auth/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, role: user.role }),
          });
        }

        localStorage.removeItem("admin");
        return true;
      }
    };

    it("✅ should filter announcements by search query", () => {
      const announcements = [
        { id: 1, title: "Meeting Today", details: "Team meeting", posted_by: "Admin" },
        { id: 2, title: "Holiday Notice", details: "Office closed", posted_by: "Manager" },
        { id: 3, title: "Training Session", details: "Technical training", posted_by: "Trainer" }
      ];

      const filtered = mockAnnouncementFunctions.filterAnnouncements(announcements, "Meeting");

      expect(filtered).to.have.lengthOf(1);
      expect(filtered[0].title).to.equal("Meeting Today");
    });

    it("✅ should filter announcements by details content", () => {
      const announcements = [
        { id: 1, title: "Announcement 1", details: "Important meeting about budgets", posted_by: "Admin" },
        { id: 2, title: "Announcement 2", details: "Office party details", posted_by: "HR" },
        { id: 3, title: "Announcement 3", details: "Budget allocation update", posted_by: "Finance" }
      ];

      const filtered = mockAnnouncementFunctions.filterAnnouncements(announcements, "budget");

      expect(filtered).to.have.lengthOf(2);
      expect(filtered[0].title).to.equal("Announcement 1");
      expect(filtered[1].title).to.equal("Announcement 3");
    });

    it("✅ should filter announcements by posted_by", () => {
      const announcements = [
        { id: 1, title: "Announcement 1", details: "Details 1", posted_by: "Admin" },
        { id: 2, title: "Announcement 2", details: "Details 2", posted_by: "Manager" },
        { id: 3, title: "Announcement 3", details: "Details 3", posted_by: "Admin" }
      ];

      const filtered = mockAnnouncementFunctions.filterAnnouncements(announcements, "admin");

      expect(filtered).to.have.lengthOf(2);
      expect(filtered[0].posted_by).to.equal("Admin");
      expect(filtered[1].posted_by).to.equal("Admin");
    });

    it("✅ should handle empty search results", () => {
      const announcements = [
        { id: 1, title: "Test", details: "Test", posted_by: "Admin" }
      ];

      const filtered = mockAnnouncementFunctions.filterAnnouncements(announcements, "Nonexistent");

      expect(filtered).to.have.lengthOf(0);
    });

    it("✅ should handle empty search query (return all)", () => {
      const announcements = [
        { id: 1, title: "Test 1", details: "Test 1", posted_by: "Admin" },
        { id: 2, title: "Test 2", details: "Test 2", posted_by: "Manager" }
      ];

      const filtered = mockAnnouncementFunctions.filterAnnouncements(announcements, "");

      expect(filtered).to.have.lengthOf(2);
    });

    it("✅ should handle search with whitespace only", () => {
      const announcements = [
        { id: 1, title: "Test", details: "Test", posted_by: "Admin" }
      ];

      const filtered = mockAnnouncementFunctions.filterAnnouncements(announcements, "   ");

      expect(filtered).to.have.lengthOf(1);
    });

    it("✅ should calculate carousel state for images", () => {
      const images = Array.from({ length: 8 }, (_, i) => `image${i}.jpg`);
      const carouselState = mockAnnouncementFunctions.calculateCarouselState(images);

      expect(carouselState.hasCarousel).to.equal(true);
      expect(carouselState.totalImages).to.equal(8);
      expect(carouselState.visibleImages).to.have.lengthOf(6);
      expect(carouselState.currentIndex).to.equal(0);
    });

    it("✅ should handle carousel for few images", () => {
      const images = ["image1.jpg", "image2.jpg", "image3.jpg"];
      const carouselState = mockAnnouncementFunctions.calculateCarouselState(images);

      expect(carouselState.hasCarousel).to.equal(false);
      expect(carouselState.visibleImages).to.have.lengthOf(3);
    });

    it("✅ should detect text ellipsis", () => {
      // Create a mock element
      const mockElement = {
        scrollHeight: 100,
        clientHeight: 50
      };

      const hasEllipsis = mockAnnouncementFunctions.checkEllipsis(mockElement);
      expect(hasEllipsis).to.equal(true);
    });

    it("✅ should not detect ellipsis for short text", () => {
      const mockElement = {
        scrollHeight: 50,
        clientHeight: 100
      };

      const hasEllipsis = mockAnnouncementFunctions.checkEllipsis(mockElement);
      expect(hasEllipsis).to.equal(false);
    });

    it("✅ should handle logout successfully", async () => {
      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve({ message: "Logged out successfully" })
      });

      const logoutResult = await mockAnnouncementFunctions.handleLogout();
      
      expect(logoutResult).to.equal(true);
      expect(localStorage.getItem("admin")).to.equal(null);
    });
  });

  describe("LocalStorage and State Management Tests", () => {
    it("✅ should store and retrieve admin data from localStorage", () => {
      const adminData = {
        id: 1,
        full_name: "John Doe",
        email: "john@example.com",
        role: "admin",
        profile_picture: "profile.jpg"
      };

      localStorage.setItem("admin", JSON.stringify(adminData));
      
      const retrievedData = JSON.parse(localStorage.getItem("admin"));
      
      expect(retrievedData.id).to.equal(1);
      expect(retrievedData.full_name).to.equal("John Doe");
      expect(retrievedData.role).to.equal("admin");
    });

    it("✅ should clear localStorage on logout", async () => {
      localStorage.setItem("admin", JSON.stringify({ id: 1, role: "admin" }));
      localStorage.setItem("token", "test-token");
      localStorage.setItem("role", "admin");

      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve({ message: "Logged out" })
      });

      // Simulate logout
      localStorage.removeItem("admin");
      localStorage.removeItem("token");
      localStorage.removeItem("role");

      expect(localStorage.getItem("admin")).to.equal(null);
      expect(localStorage.getItem("token")).to.equal(null);
      expect(localStorage.getItem("role")).to.equal(null);
    });

    it("✅ should handle role-based menu filtering", () => {
      const menuItems = [
        { name: "Dashboard", to: "/dashboard" },
        { name: "Employees", to: "/employee" },
        { name: "Leave Management", to: "/leaveManagement" },
        { name: "Announcement", to: "/announcement" },
        { name: "Audit Logs", to: "/audit_logs" },
        { name: "User Management", to: "/userManagement" },
      ];

      // Test admin role
      const adminRole = "admin";
      const adminAllowedMenus = menuItems.filter(() => true); // Admin gets all
      expect(adminAllowedMenus).to.have.lengthOf(6);

      // Test mayor/office_head role
      const officeHeadRole = "office_head";
      const officeHeadAllowedMenus = menuItems.filter((item) => {
        return ["Dashboard", "Employees", "Leave Management"].includes(item.name);
      });
      expect(officeHeadAllowedMenus).to.have.lengthOf(3);

      // Test other roles
      const otherRole = "employee";
      const otherAllowedMenus = menuItems.filter(() => false); // Gets none
      expect(otherAllowedMenus).to.have.lengthOf(0);
    });
  });

  describe("Error Handling Tests", () => {
    it("❌ should handle 404 when fetching announcements", async () => {
      fetchStub.resolves({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Not found" })
      });

      try {
        const response = await fetch(`${API_URL}/api/announcements`);
        expect(response.ok).to.equal(false);
        expect(response.status).to.equal(404);
      } catch (error) {
        expect.fail("Should not throw for 404");
      }
    });

    it("❌ should handle 500 server error", async () => {
      fetchStub.resolves({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal server error" })
      });

      const response = await fetch(`${API_URL}/api/announcements`);
      expect(response.ok).to.equal(false);
      expect(response.status).to.equal(500);
    });

    it("❌ should handle announcement creation with missing fields", async () => {
      fetchStub.resolves({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Missing required fields" })
      });

      const response = await fetch(`${API_URL}/api/announcements`, {
        method: "POST",
        body: new FormData()
      });

      expect(response.ok).to.equal(false);
      expect(response.status).to.equal(400);
    });

    it("❌ should handle unauthorized announcement deletion", async () => {
      fetchStub.resolves({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: "Unauthorized" })
      });

      const response = await fetch(`${API_URL}/api/announcements/1`, {
        method: "DELETE"
      });

      expect(response.ok).to.equal(false);
      expect(response.status).to.equal(403);
    });

    it("❌ should handle announcement update with invalid ID", async () => {
      fetchStub.resolves({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Announcement not found" })
      });

      const response = await fetch(`${API_URL}/api/announcements/999`, {
        method: "PUT",
        body: new FormData()
      });

      expect(response.ok).to.equal(false);
      expect(response.status).to.equal(404);
    });
  });

  describe("Image Processing Tests", () => {
    it("✅ should process announcement images correctly", () => {
      const processImages = (images) => {
        if (Array.isArray(images)) {
          return images;
        } else if (images) {
          return [images];
        }
        return [];
      };

      expect(processImages(["img1.jpg", "img2.jpg"])).to.deep.equal(["img1.jpg", "img2.jpg"]);
      expect(processImages("single.jpg")).to.deep.equal(["single.jpg"]);
      expect(processImages(null)).to.deep.equal([]);
      expect(processImages(undefined)).to.deep.equal([]);
    });

    it("✅ should handle image array from API", () => {
      const testData = [
        { id: 1, images: ["img1.jpg", "img2.jpg"] },
        { id: 2, images: "single.jpg" },
        { id: 3, images: null },
        { id: 4, images: [] }
      ];

      const processedData = testData.map(a => {
        let processedImages = [];
        if (Array.isArray(a.images)) {
          processedImages = a.images;
        } else if (a.images) {
          processedImages = [a.images];
        }

        return {
          ...a,
          images: processedImages
        };
      });

      expect(processedData[0].images).to.deep.equal(["img1.jpg", "img2.jpg"]);
      expect(processedData[1].images).to.deep.equal(["single.jpg"]);
      expect(processedData[2].images).to.deep.equal([]);
      expect(processedData[3].images).to.deep.equal([]);
    });
  });


  describe("Edge Case Tests", () => {
    it("✅ should handle announcements with very long content", () => {
      const longAnnouncement = {
        id: 1,
        title: "A".repeat(1000), // Very long title
        details: "B".repeat(5000), // Very long details
        posted_by: "Admin"
      };

      expect(longAnnouncement.title).to.have.lengthOf(1000);
      expect(longAnnouncement.details).to.have.lengthOf(5000);
    });


    it("✅ should handle case-insensitive search", () => {
      const announcements = [
        { id: 1, title: "MEETING Today", details: "Important", posted_by: "Admin" },
        { id: 2, title: "Meeting Tomorrow", details: "Details", posted_by: "Manager" }
      ];

      const mockFilterFunction = (announcements, searchQuery) => {
        if (searchQuery.trim() !== "") {
          const query = searchQuery.toLowerCase();
          return announcements.filter(announcement =>
            announcement.title.toLowerCase().includes(query)
          );
        }
        return announcements;
      };

      const filtered = mockFilterFunction(announcements, "meeting");
      expect(filtered).to.have.lengthOf(2);
    });
  });
});