import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,              // 5 virtual users
  duration: '2m',     // run for 30 seconds
};

export default function () {
  const url = 'https://ezleave-admin-api.onrender.com/api/authAdmin/login';

  const payload = JSON.stringify({
    email: 'shammyyy2@gmail.com',
    password: '$2b$10$QX5NUO8uRj6QckHxJrTcyu1UvV47qAJ6F/DlEu8cqEWnx3mo8mpYO',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.token !== undefined || body.accessToken !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1);
}
