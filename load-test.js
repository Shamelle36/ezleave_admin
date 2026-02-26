import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,        // 1 admin uploading CSV
  iterations: 1, // 1 upload session
};

export default function () {

  for (let i = 0; i < 1000; i++) {

    const payload = JSON.stringify({
      first_name: "Load",
      last_name: "Test",
      email: `loadtest${i}@test.com`,
      position: "Staff",
      department: "HR",
      employment_status: "Regular",
      gender: "Female",
      status: "active",
      date_hired: "2025-01-01",
      id_number: `ID${i}`,
      contact_number: "09123456789",
      civil_status: "Single",
      contract_start_date: "",
      contract_end_date: ""
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: '60s',
    };

    const res = http.post(
      'https://ezleave-admin-api.onrender.com/api/employees',
      payload,
      params
    );

    check(res, {
      'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    });

    // Small delay to avoid overwhelming Render
    sleep(0.05);
  }
}
