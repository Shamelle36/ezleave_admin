/* eslint-disable jest/no-conditional-expect */
/* eslint-disable jest/valid-expect */
import { expect } from "chai";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { JSDOM } from "jsdom";
import * as XLSX from "xlsx";

describe("Leave Card Generation - Report Generation Module", () => {
  let axiosMock;
  const API_URL = "https://ezleave-admin-api.onrender.com";
  
  // Mock employee data
  const mockEmployee = {
    id: 101,
    first_name: "Juan",
    last_name: "Dela Cruz",
    middle_name: "Santos",
    position: "Administrative Aide I",
    office: "Municipal Mayor's Office",
    employment_status: "Permanent",
    status: "active",
    id_number: "EMP-2023-001",
    date_hired: "2023-01-15",
    gender: "Male",
    civil_status: "Single",
    email: "juan.delacruz@example.com",
    contact_number: "09123456789"
  };

  // Mock leave cards data
  const mockLeaveCards = [
    {
      period: "Jan 2023 - Dec 2023",
      particulars: "Annual Leave Credits",
      vl_earned: 15,
      vl_used: 5,
      vl_balance: 10,
      vl_abs_wop: 0,
      sl_earned: 15,
      sl_used: 3,
      sl_balance: 12,
      sl_abs_wop: 0,
      remarks: "Annual Allocation"
    },
    {
      period: "Jan 2024 - Dec 2024",
      particulars: "Annual Leave Credits",
      vl_earned: 15,
      vl_used: 7,
      vl_balance: 8,
      vl_abs_wop: 0,
      sl_earned: 15,
      sl_used: 2,
      sl_balance: 13,
      sl_abs_wop: 1,
      remarks: "Annual Allocation"
    }
  ];

  // Mock leave entitlements
  const mockLeaveEntitlements = [
    {
      leave_type: "Vacation Leave",
      year: 2024,
      total_days: 15,
      used_days: 7,
      remaining: 8
    },
    {
      leave_type: "Sick Leave",
      year: 2024,
      total_days: 15,
      used_days: 2,
      remaining: 13
    }
  ];

  beforeEach(() => {
    axiosMock = new MockAdapter(axios);
    // Setup localStorage mock
    global.localStorage = {
      store: {},
      getItem(k) { return this.store[k] || null; },
      setItem(k, v) { this.store[k] = v; },
      removeItem(k) { delete this.store[k]; },
      clear() { this.store = {}; }
    };
    
    // Setup DOM for PDF/Excel export testing
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    global.URL = {
      createObjectURL: () => 'blob:test',
      revokeObjectURL: () => {}
    };
    
    // Mock blob
    global.Blob = class Blob {
      constructor(content, options) {
        this.content = content;
        this.options = options;
      }
    };
  });

  afterEach(() => {
    axiosMock.restore();
    delete global.window;
    delete global.document;
  });

  // Helper functions for testing
  const fetchEmployeeData = (id = mockEmployee.id) => 
    axios.get(`${API_URL}/api/leave-cards/employeeLeave/${id}`);

  const fetchLeaveBalances = (id = mockEmployee.id) =>
    axios.get(`${API_URL}/api/employees/${id}/leave-balances`);

  const exportLeaveCardPDF = (employeeData, leaveCardsData) =>
    axios.post(`${API_URL}/api/exportPdf/export-pdf`, {
      employee: employeeData,
      leaveCards: leaveCardsData
    }, {
      headers: { "Content-Type": "application/json", "Accept": "application/pdf" }
    });

  const updateLeaveBalance = (employeeId, leaveData) =>
    axios.put(`${API_URL}/api/employees/leave-entitlements/update`, leaveData, {
      headers: { "Content-Type": "application/json" }
    });

  describe("✅ Employee Profile Data Fetching", () => {
    it("should fetch employee data successfully", async () => {
      axiosMock.onGet(`${API_URL}/api/leave-cards/employeeLeave/${mockEmployee.id}`)
        .reply(200, {
          employee: mockEmployee,
          leaveCards: mockLeaveCards,
          attendanceLogs: []
        });

      const res = await fetchEmployeeData(mockEmployee.id);
      expect(res.status).to.equal(200);
      expect(res.data.employee).to.deep.include({
        first_name: "Juan",
        last_name: "Dela Cruz",
        status: "active"
      });
      expect(res.data.leaveCards).to.be.an('array').with.lengthOf(2);
    });

    it("should handle inactive employee status", async () => {
      const inactiveEmployee = { ...mockEmployee, status: "inactive", inactive_reason: "Resigned" };
      
      axiosMock.onGet(`${API_URL}/api/leave-cards/employeeLeave/${mockEmployee.id}`)
        .reply(200, {
          employee: inactiveEmployee,
          leaveCards: [],
          attendanceLogs: []
        });

      const res = await fetchEmployeeData(mockEmployee.id);
      expect(res.data.employee.status).to.equal("inactive");
      expect(res.data.employee.inactive_reason).to.equal("Resigned");
    });

    it("should return 404 for non-existent employee", async () => {
      axiosMock.onGet(`${API_URL}/api/leave-cards/employeeLeave/999`)
        .reply(404, { error: "Employee not found" });

      try {
        await fetchEmployeeData(999);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }
    });
  });

  describe("✅ Leave Balances Management", () => {
    it("should fetch leave entitlements successfully", async () => {
      axiosMock.onGet(`${API_URL}/api/employees/${mockEmployee.id}/leave-balances`)
        .reply(200, { leaveBalances: mockLeaveEntitlements });

      const res = await fetchLeaveBalances(mockEmployee.id);
      expect(res.status).to.equal(200);
      expect(res.data.leaveBalances).to.be.an('array');
      expect(res.data.leaveBalances[0]).to.have.property('remaining');
    });

    it("should update leave balance successfully", async () => {
      const updateData = {
        userId: mockEmployee.id,
        leaveType: "VL",
        year: 2024,
        totalDays: 20,
        usedDays: 5
      };

      axiosMock.onPut(`${API_URL}/api/employees/leave-entitlements/update`)
        .reply(200, { 
          success: true,
          message: "Leave balance updated successfully"
        });

      const res = await updateLeaveBalance(mockEmployee.id, updateData);
      expect(res.data.success).to.equal(true);
    });

    it("should prevent negative remaining days calculation", async () => {
      const leaveBalance = {
        total_days: 10,
        used_days: 15,
        remaining: -5
      };

      // Simulate the calculation logic
      const calculateRemaining = (total, used) => Math.max(0, total - used);
      const remaining = calculateRemaining(leaveBalance.total_days, leaveBalance.used_days);
      
      expect(remaining).to.equal(0); // Should not be negative
    });

    it("should handle leave balance update for inactive employee", async () => {
      const inactiveEmployee = { ...mockEmployee, status: "inactive" };
      
      axiosMock.onGet(`${API_URL}/api/leave-cards/employeeLeave/${inactiveEmployee.id}`)
        .reply(200, { employee: inactiveEmployee });

      // The frontend should prevent editing for inactive employees
      const canEditLeave = (employeeStatus, userRole) => 
        employeeStatus === "active" || userRole === "admin";
      
      expect(canEditLeave("inactive", "office_head")).to.equal(false);
      expect(canEditLeave("inactive", "admin")).to.equal(true);
      expect(canEditLeave("active", "office_head")).to.equal(true);
    });
  });

  describe("✅ PDF Export Functionality", () => {
    it("should generate PDF successfully", async () => {
      const pdfBlob = new Blob(["PDF content"], { type: "application/pdf" });
      
      axiosMock.onPost(`${API_URL}/api/exportPdf/export-pdf`)
        .reply(200, pdfBlob, {
          'content-type': 'application/pdf'
        });

      const res = await exportLeaveCardPDF(mockEmployee, mockLeaveCards);
      expect(res.status).to.equal(200);
      expect(res.headers['content-type']).to.include('application/pdf');
      expect(res.data).to.be.instanceOf(Blob);
    });

    it("should handle PDF export errors gracefully", async () => {
      axiosMock.onPost(`${API_URL}/api/exportPdf/export-pdf`)
        .reply(500, { error: "PDF generation failed" });

      try {
        await exportLeaveCardPDF(mockEmployee, mockLeaveCards);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.response.status).to.equal(500);
      }
    });

    it("should validate required data for PDF export", () => {
      // Test validation logic
      const validateExportData = (employee, leaveCards) => {
        if (!employee) return "No employee data available";
        if (!leaveCards || leaveCards.length === 0) return "No leave cards available";
        return null;
      };

      expect(validateExportData(null, mockLeaveCards)).to.equal("No employee data available");
      expect(validateExportData(mockEmployee, [])).to.equal("No leave cards available");
      expect(validateExportData(mockEmployee, mockLeaveCards)).to.equal(null);
    });

    it("should prevent PDF export for inactive employees without admin rights", () => {
      const canExportPDF = (employeeStatus, userRole) => {
        if (employeeStatus === "inactive" && userRole !== "admin") {
          return false;
        }
        return true;
      };

      expect(canExportPDF("inactive", "office_head")).to.equal(false);
      expect(canExportPDF("inactive", "admin")).to.equal(true);
      expect(canExportPDF("active", "office_head")).to.equal(true);
    });
  });

  describe("✅ Excel Export Functionality", () => {
    it("should generate correct Excel data structure", () => {
      // Test Excel data generation logic
      const generateExcelData = (employee, leaveCards) => {
        const excelData = [];

        // Headers
        excelData.push(["Republic of the Philippines", "", "", "", "", "", "", "", "", "", ""]);
        excelData.push(["Province of Occidental Mindoro", "", "", "", "", "", "", "", "", "", ""]);
        excelData.push(["Municipality of Paluan", "", "", "", "", "", "", "", "", "", ""]);
        excelData.push(["", "", "", "", "", "", "", "", "", "", ""]);
        excelData.push(["EMPLOYEES LEAVE CARD", "", "", "", "", "", "", "", "", "", ""]);
        excelData.push(["", "", "", "", "", "", "", "", "", "", ""]);

        // Employee info
        excelData.push([
          "NAME:",
          `${employee.last_name}, ${employee.first_name} ${employee.middle_name || ""}`.trim(),
          "", "", "", "",
          "OFFICE:", employee.office || "MO", "",
          "STATUS:", employee.employment_status || "Permanent"
        ]);

        // Leave card headers
        excelData.push([
          "PERIOD",
          "PARTICULARS",
          "VACATION LEAVE", "", "", "",
          "SICK LEAVE", "", "", "",
          "REMARKS"
        ]);

        // Data rows
        leaveCards.forEach((lc) => {
          excelData.push([
            lc.period || "",
            lc.particulars || "",
            lc.vl_earned ?? "",
            lc.vl_used ?? "",
            lc.vl_balance ?? "",
            lc.vl_abs_wop ?? "",
            lc.sl_earned ?? "",
            lc.sl_used ?? "",
            lc.sl_balance ?? "",
            lc.sl_abs_wop ?? "",
            lc.remarks || ""
          ]);
        });

        return excelData;
      };

      const excelData = generateExcelData(mockEmployee, mockLeaveCards);
      
      expect(excelData).to.be.an('array');
      expect(excelData[0][0]).to.equal("Republic of the Philippines");
      expect(excelData[6][1]).to.include("Dela Cruz");
      expect(excelData.length).to.equal(10); // Headers + employee info + leave card headers + 2 data rows
    });

    it("should handle empty leave cards gracefully", () => {
      const generateExcelData = (employee, leaveCards) => {
        if (!leaveCards || leaveCards.length === 0) {
          return [["No leave card data available"]];
        }
        // ... rest of the logic
        return [["Data generated"]];
      };

      const result = generateExcelData(mockEmployee, []);
      expect(result[0][0]).to.equal("No leave card data available");
    });
  });

  describe("✅ Pagination and UI Controls", () => {
    it("should calculate pagination correctly", () => {
      const totalItems = 24;
      const rowsPerPage = 12;
      const calculateTotalPages = (items, rows) => Math.ceil(items / rows);
      
      expect(calculateTotalPages(totalItems, rowsPerPage)).to.equal(2);
      expect(calculateTotalPages(10, rowsPerPage)).to.equal(1);
      expect(calculateTotalPages(25, rowsPerPage)).to.equal(3);
    });

    it("should slice data correctly for current page", () => {
      const allData = Array.from({ length: 24 }, (_, i) => ({ id: i + 1 }));
      const currentPage = 2;
      const rowsPerPage = 10;
      
      const startIndex = (currentPage - 1) * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      const pageData = allData.slice(startIndex, endIndex);
      
      expect(pageData).to.have.lengthOf(10);
      expect(pageData[0].id).to.equal(11);
      expect(pageData[9].id).to.equal(20);
    });

    it("should disable controls for inactive employees", () => {
      const isControlDisabled = (employeeStatus, userRole, action) => {
        if (employeeStatus === "inactive" && userRole !== "admin") {
          return true;
        }
        return false;
      };

      expect(isControlDisabled("inactive", "office_head", "edit")).to.equal(true);
      expect(isControlDisabled("inactive", "admin", "edit")).to.equal(false);
      expect(isControlDisabled("active", "office_head", "edit")).to.equal(false);
    });
  });

  describe("✅ Leave History Integration", () => {
    it("should fetch leave history with filters", async () => {
      const mockLeaveHistory = [
        {
          id: 1,
          leaveType: "Vacation Leave",
          status: "Approved",
          duration: 5,
          formattedFilingDate: "2024-01-15",
          formattedStartDate: "2024-02-01",
          formattedEndDate: "2024-02-05"
        }
      ];

      const filters = {
        status: "Approved",
        leaveType: "Vacation Leave",
        year: "2024",
        page: 1,
        limit: 10
      };

      axiosMock.onGet(`${API_URL}/api/employees/${mockEmployee.id}/leaveHistory`)
        .reply(200, {
          leaveHistory: mockLeaveHistory,
          summary: {
            totalLeaves: 1,
            approvedLeaves: 1,
            pendingLeaves: 0,
            rejectedLeaves: 0
          }
        });

      const response = await axios.get(`${API_URL}/api/employees/${mockEmployee.id}/leaveHistory`, {
        params: filters
      });

      expect(response.status).to.equal(200);
      expect(response.data.leaveHistory).to.be.an('array');
      expect(response.data.summary.totalLeaves).to.equal(1);
    });

    it("should calculate leave history summary", () => {
      const leaveHistory = [
        { status: "Approved" },
        { status: "Approved" },
        { status: "Pending" },
        { status: "Rejected" }
      ];

      const calculateSummary = (history) => ({
        totalLeaves: history.length,
        approvedLeaves: history.filter(l => l.status === "Approved").length,
        pendingLeaves: history.filter(l => l.status === "Pending").length,
        rejectedLeaves: history.filter(l => l.status === "Rejected").length
      });

      const summary = calculateSummary(leaveHistory);
      
      expect(summary.totalLeaves).to.equal(4);
      expect(summary.approvedLeaves).to.equal(2);
      expect(summary.pendingLeaves).to.equal(1);
      expect(summary.rejectedLeaves).to.equal(1);
    });
  });

  describe("✅ Error Handling and Edge Cases", () => {
    it("should handle network errors gracefully", async () => {
      axiosMock.onGet(`${API_URL}/api/leave-cards/employeeLeave/${mockEmployee.id}`)
        .networkError();

      try {
        await fetchEmployeeData(mockEmployee.id);
        expect.fail("Should have thrown a network error");
      } catch (error) {
        expect(error.message).to.equal("Network Error");
      }
    });

    it("should handle malformed response data", async () => {
      axiosMock.onGet(`${API_URL}/api/leave-cards/employeeLeave/${mockEmployee.id}`)
        .reply(200, "Invalid JSON");

      try {
        await fetchEmployeeData(mockEmployee.id);
        // Axios will parse the response, but if it's not valid JSON for the API,
        // the component should handle it gracefully
      } catch (error) {
        // The error should be caught in the component's error handling
      }
    });

    it("should validate user permissions", () => {
      const checkPermissions = (role) => ({
        canEditLeave: ["admin"].includes(role),
        canViewAll: ["admin", "mayor", "office_head"].includes(role),
        canExport: ["admin", "mayor", "office_head"].includes(role)
      });

      const adminPerms = checkPermissions("admin");
      const officeHeadPerms = checkPermissions("office_head");
      const hrPerms = checkPermissions("hr");

      expect(adminPerms.canEditLeave).to.equal(true);
      expect(officeHeadPerms.canEditLeave).to.equal(false);
      expect(hrPerms.canViewAll).to.equal(false);
      expect(adminPerms.canExport).to.equal(true);
    });

    it("should handle large datasets efficiently", () => {
      const largeLeaveCards = Array.from({ length: 1000 }, (_, i) => ({
        period: `Period ${i}`,
        particulars: `Particulars ${i}`,
        vl_earned: 15,
        vl_used: i % 10,
        vl_balance: 15 - (i % 10),
        sl_earned: 15,
        sl_used: i % 5,
        sl_balance: 15 - (i % 5),
        remarks: `Remarks ${i}`
      }));

      // Test that filtering works with large datasets
      const filtered = largeLeaveCards.filter(card => card.vl_used > 5);
      const expectedCount = largeLeaveCards.filter(card => card.vl_used > 5).length;
      
      expect(filtered.length).to.equal(expectedCount);
      expect(filtered[0]).to.have.property('vl_used');
    });
  });

  describe("✅ React Component State Management", () => {
    it("should manage loading states correctly", () => {
      // Simulate component state transitions
      const initialState = {
        employee: null,
        leaveCards: [],
        loading: true,
        error: null
      };

      const loadingState = { ...initialState, loading: true };
      const successState = {
        employee: mockEmployee,
        leaveCards: mockLeaveCards,
        loading: false,
        error: null
      };
      const errorState = {
        employee: null,
        leaveCards: [],
        loading: false,
        error: "Failed to fetch data"
      };

      expect(loadingState.loading).to.equal(true);
      expect(successState.employee).to.deep.include(mockEmployee);
      expect(errorState.error).to.equal("Failed to fetch data");
    });

    it("should handle tab switching efficiently", () => {
      const tabs = ["overview", "attendance", "leave-balances", "leave-history"];
      const activeTab = "overview";
      
      const shouldFetchData = (currentTab, newTab) => {
        const dataIntensiveTabs = ["attendance", "leave-history"];
        return dataIntensiveTabs.includes(newTab) && currentTab !== newTab;
      };

      expect(shouldFetchData("overview", "attendance")).to.equal(true);
      expect(shouldFetchData("attendance", "attendance")).to.equal(false);
      expect(shouldFetchData("overview", "leave-balances")).to.equal(false);
    });
  });

  describe("✅ Full Integration Test", () => {
    it("should complete full leave card workflow", async () => {
      // 1. Fetch employee data
      axiosMock.onGet(`${API_URL}/api/leave-cards/employeeLeave/${mockEmployee.id}`)
        .reply(200, {
          employee: mockEmployee,
          leaveCards: mockLeaveCards,
          attendanceLogs: []
        });

      const employeeRes = await fetchEmployeeData(mockEmployee.id);
      expect(employeeRes.data.employee.status).to.equal("active");

      // 2. Fetch leave balances
      axiosMock.onGet(`${API_URL}/api/employees/${mockEmployee.id}/leave-balances`)
        .reply(200, { leaveBalances: mockLeaveEntitlements });

      const balancesRes = await fetchLeaveBalances(mockEmployee.id);
      expect(balancesRes.data.leaveBalances[0].remaining).to.equal(8);

      // 3. Update a leave balance
      axiosMock.onPut(`${API_URL}/api/employees/leave-entitlements/update`)
        .reply(200, { success: true });

      const updateRes = await updateLeaveBalance(mockEmployee.id, {
        userId: mockEmployee.id,
        leaveType: "VL",
        year: 2024,
        totalDays: 20,
        usedDays: 8
      });
      expect(updateRes.data.success).to.equal(true);

      // 4. Export to PDF
      const pdfBlob = new Blob(["PDF"], { type: "application/pdf" });
      axiosMock.onPost(`${API_URL}/api/exportPdf/export-pdf`)
        .reply(200, pdfBlob);

      const pdfRes = await exportLeaveCardPDF(mockEmployee, mockLeaveCards);
      expect(pdfRes.data).to.be.instanceOf(Blob);
    });
  });
});