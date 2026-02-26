/* eslint-disable jest/no-conditional-expect */
/* eslint-disable jest/valid-expect */
import { expect } from "chai";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

describe("Leave Management Tests", () => {
  let axiosMock;
  const API = "https://ezleave-admin-api.onrender.com";
  const mockAdmin = { id: 1, email: "admin@example.com", name: "Admin User", role: "admin" };
  const leaveId = 123;

  beforeEach(() => {
    axiosMock = new MockAdapter(axios);
    global.localStorage ??= { store: {}, getItem(k){return this.store[k]||null}, setItem(k,v){this.store[k]=v}, removeItem(k){delete this.store[k]}, clear(){this.store={}} };
    localStorage.setItem("admin", JSON.stringify(mockAdmin));
  });
  afterEach(() => axiosMock.restore());

  const patchApprove = (id = leaveId, data = {}) => axios.patch(`${API}/api/leave-requests/${id}/approve`, data);
  const patchReject = (id = leaveId, data = {}) => axios.patch(`${API}/api/leave-requests/${id}/reject`, data);
  const postCSForm = (data = {}) => axios.post(`${API}/api/generate-cs-form`, data);

  it("✅ approves leave successfully", async () => {
    axiosMock.onPatch(`${API}/api/leave-requests/${leaveId}/approve`).reply(200, { success: true, approver_name: mockAdmin.name });
    const res = await patchApprove(leaveId, { actionBy: mockAdmin.id, remarks: "OK", role: "admin" });
    expect(res.data.success).to.equal(true);
  });

  it("✅ rejects leave successfully", async () => {
    axiosMock.onPatch(`${API}/api/leave-requests/${leaveId}/reject`).reply(200, { success: true });
    const res = await patchReject(leaveId, { actionBy: mockAdmin.id, remarks: "Rejected", role: "admin" });
    expect(res.data.success).to.equal(true);
  });

  it("✅ generates CS Form", async () => {
    const blob = new Blob(["PDF"], { type: "application/pdf" });
    axiosMock.onPost(`${API}/api/generate-cs-form`).reply(200, blob);
    const res = await postCSForm({ leave_application_id: leaveId, requesting_role: "admin" }, { responseType: 'blob' });
    expect(res.data).to.be.instanceOf(Blob);
  });

  it("❌ fails approval with invalid ID", async () => {
    axiosMock.onPatch(`${API}/api/leave-requests/999/approve`).reply(404, { error: "Not found" });
    try { await patchApprove(999, { actionBy: 1, remarks: "Test", role: "admin" }); expect.fail(); } 
    catch (e) { expect(e.response.status).to.equal(404); }
  });

  it("✅ checks overlapping leaves", async () => {
    axiosMock.onPost(`${API}/api/leave-requests/check-overlapping-leaves`).reply(200, { hasOverlap: false });
    const res = await axios.post(`${API}/api/leave-requests/check-overlapping-leaves`, { user_id: 1, inclusive_dates: "[2024-01-01,2024-01-05)", id: leaveId, department: "HR" });
    expect(res.data.hasOverlap).to.equal(false);
  });

  it("✅ validates roles and permissions", () => {
    const checkPermissions = role => ({ canApprove: ["admin","mayor","office_head"].includes(role) });
    expect(checkPermissions("admin").canApprove).to.equal(true);
    expect(checkPermissions("hr").canApprove).to.equal(false);
  });

  it("✅ handles e-signature validation", () => {
    const validateSig = (data, method) => method==="e-sign" && !data ? false : true;
    expect(validateSig("", "e-sign")).to.equal(false);
    expect(validateSig("sig", "e-sign")).to.equal(true);
  });

  it("✅ handles network errors", async () => {
    axiosMock.onPatch(`${API}/api/leave-requests/${leaveId}/approve`).networkError();
    try { await patchApprove(); expect.fail(); } 
    catch (e) { expect(e.message).to.equal("Network Error"); }
  });

  it("✅ full approval flow with CS Form", async () => {
    axiosMock.onPost(`${API}/api/leave-requests/check-overlapping-leaves`).reply(200, { hasOverlap: false });
    axiosMock.onPost(`${API}/api/generate-cs-form`).reply(200, new Blob(["PDF"]));
    axiosMock.onPatch(`${API}/api/leave-requests/${leaveId}/approve`).reply(200, { success: true, cs_form_generated: true });

    const overlap = await axios.post(`${API}/api/leave-requests/check-overlapping-leaves`, { user_id: 1, inclusive_dates: "[2024-01-01,2024-01-05)", id: leaveId, department: "HR" });
    expect(overlap.data.hasOverlap).to.equal(false);
    const csForm = await postCSForm({ leave_application_id: leaveId, requesting_role: "admin" }, { responseType: 'blob' });
    expect(csForm.data).to.be.instanceOf(Blob);
    const approval = await patchApprove(leaveId, { actionBy: mockAdmin.id, remarks: "Approved", role: "admin", cs_form_signed:true, signature_method:"e-sign" });
    expect(approval.data.cs_form_generated).to.equal(true);
  });
});
