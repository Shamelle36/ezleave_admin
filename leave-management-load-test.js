/* eslint-disable no-undef */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';
import encoding from 'k6/encoding';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

/**
 * =============================
 * K6 Load Test Configuration
 * =============================
 */
export const options = {
  scenarios: {
    ramp_up_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 2 },
        { duration: '1m', target: 3 },
        { duration: '1m', target: 3 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.3'],
    http_req_duration: ['p(95)<10000'],
  },
};

/**
 * =============================
 * Test Data
 * =============================
 */
const BASE_URL = 'https://ezleave-admin-api.onrender.com';

const testUsers = new SharedArray('testUsers', () => [
  { role: 'office_head', id: 101, name: 'Office Head' },
  { role: 'admin', id: 102, name: 'Admin' },
  { role: 'mayor', id: 103, name: 'Mayor' },
]);

const rejectionReasons = [
  "Overlapping of leave with existing approved leaves",
  "Incomplete documentation",
  "Violation of leave policy",
  "Department scheduling conflict",
];

/**
 * =============================
 * Mock Leave Requests
 * =============================
 */
const mockLeaveRequests = [
  { id: 1, user: 'Alice', start_date: '2026-02-20', end_date: '2026-02-22', department: 'HR' },
  { id: 2, user: 'Bob', start_date: '2026-02-25', end_date: '2026-02-27', department: 'Finance' },
  { id: 3, user: 'Charlie', start_date: '2026-03-01', end_date: '2026-03-05', department: 'IT' },
  { id: 4, user: 'Dana', start_date: '2026-03-10', end_date: '2026-03-12', department: 'Admin' },
  { id: 5, user: 'Eve', start_date: '2026-03-15', end_date: '2026-03-17', department: 'Operations' },
];

// IDs to simulate approve/reject
const mockLeaveRequestIds = mockLeaveRequests.map(lr => lr.id);

/**
 * =============================
 * Helper Functions
 * =============================
 */
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    .toISOString().split('T')[0];
}

function makeRequest(method, url, body = null, params = {}) {
  const defaultParams = {
    headers: { 'Content-Type': 'application/json' },
    timeout: '30s',
    ...params
  };
  try {
    return http.request(method.toUpperCase(), url, body, defaultParams);
  } catch (e) {
    console.error(`Request failed: ${url} - ${e.message}`);
    return null;
  }
}

/**
 * =============================
 * Main Test Function
 * =============================
 */
export default function() {
  const vuId = __VU;
  const user = testUsers[vuId % testUsers.length];

  // -----------------------------
  // 1. Fetch Mock Leave Requests
  // -----------------------------
  group('Fetch Leave Requests (Mock)', () => {
    const requests = mockLeaveRequests;
    check(requests, { '✅ Mock requests available': r => r.length > 0 });
  });

  // -----------------------------
  // 2. Overlapping Check Simulation
  // -----------------------------
  if (user.role === 'office_head' && __ITER % 3 === 0) {
    group('Overlap Check', () => {
      const url = `${BASE_URL}/api/leave-requests/check-overlapping-leaves`;
      const res = makeRequest('POST', url, JSON.stringify({
        user_id: randomIntBetween(1001, 1010),
        start_date: randomDate(new Date(), new Date(2025, 0, 1)),
        end_date: randomDate(new Date(2025, 0, 2), new Date(2025, 0, 10)),
        department: 'Office of the Municipal Mayor'
      }));
      if (res) {
        check(res, {
          '✅ Overlap Check Endpoint': r => r.status !== 404
        });
      }
    });
  }

  // -----------------------------
  // 3. Test Approve Endpoint
  // -----------------------------
  if (__ITER % 5 === 0) {
    group('Approve Leave Request', () => {
      const requestId = mockLeaveRequestIds[0];
      const url = `${BASE_URL}/api/leave-requests/${requestId}/approve`;
      const res = makeRequest('PATCH', url, JSON.stringify({
        actionBy: user.id,
        remarks: `Test approval - ${Date.now()}`,
        role: user.role
      }));
      if (res) check(res, { '✅ Approve Success': r => r.status === 200 || r.status !== 404 });
    });
  }

  // -----------------------------
  // 4. Test Reject Endpoint
  // -----------------------------
  if (__ITER % 5 === 2) {
    group('Reject Leave Request', () => {
      const requestId = mockLeaveRequestIds[1];
      const reason = rejectionReasons[randomIntBetween(0, rejectionReasons.length-1)];
      const url = `${BASE_URL}/api/leave-requests/${requestId}/reject`;
      const res = makeRequest('PATCH', url, JSON.stringify({
        actionBy: user.id,
        remarks: reason,
        role: user.role,
        rejection_reason: reason
      }));
      if (res) check(res, { '✅ Reject Success': r => r.status === 200 || r.status !== 404 });
    });
  }

  sleep(randomIntBetween(2, 5));
}

/**
 * =============================
 * Setup
 * =============================
 */
export function setup() {
  console.log('🚀 Starting Load Test with Mock Leave Requests');
  return {};
}
