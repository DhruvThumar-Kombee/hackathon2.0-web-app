import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp up
    { duration: '1m',  target: 50 }, // steady state
    { duration: '30s', target: 0  }, // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8000';

export default function () {
  // 1. List products
  const res1 = http.get(`${BASE_URL}/api/products/`);
  check(res1, { 'status is 200': (r) => r.status === 200 });

  // 2. View random product (approximate)
  const res2 = http.get(`${BASE_URL}/api/products/1`);
  check(res2, { 'product view is 200 or 404': (r) => r.status === 200 || r.status === 404 });

  sleep(Math.random() * 3 + 1);
}
