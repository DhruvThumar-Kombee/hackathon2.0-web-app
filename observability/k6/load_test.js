import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10  },  // warm up
    { duration: '1m',  target: 50  },  // ramp to 50 users
    { duration: '1m',  target: 100 },  // spike to 100 users
    { duration: '1m',  target: 50  },  // back to 50
    { duration: '30s', target: 0   },  // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed:   ['rate<0.05'],  // less than 5% errors
  },
};

// Run against local backend directly (not through Docker network)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api';

export default function () {
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  // ── 1. Health check ──────────────────────────────────────────────────
  const health = http.get(`http://localhost:8000/health`, params);
  check(health, { '✅ health ok': (r) => r.status === 200 });

  sleep(0.5);

  // ── 2. List products (pagination) ────────────────────────────────────
  const list1 = http.get(`${BASE_URL}/products?page=1&size=10`, params);
  check(list1, { '✅ list products ok': (r) => r.status === 200 });

  sleep(0.5);

  // ── 3. List products (page 2) ─────────────────────────────────────────
  const list2 = http.get(`${BASE_URL}/products?page=2&size=10`, params);
  check(list2, { '✅ page 2 ok': (r) => r.status === 200 });

  sleep(0.5);

  // ── 4. Search products (filtering) ───────────────────────────────────
  const search = http.get(`${BASE_URL}/products?search=Neural&page=1&size=5`, params);
  check(search, { '✅ search ok': (r) => r.status === 200 });

  sleep(0.5);

  // ── 5. Get single product ─────────────────────────────────────────────
  const product = http.get(`${BASE_URL}/products/3`, params);
  check(product, { '✅ get product ok': (r) => r.status === 200 || r.status === 404 });

  sleep(0.5);

  // ── 6. Failed login (to generate LOGIN_FAILED log entries) ──────────
  const badLogin = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: 'fake@test.com', password: 'wrongpass' }),
    params
  );
  check(badLogin, { '✅ 401 expected': (r) => r.status === 401 });

  sleep(0.5);

  // ── 7. Anomaly status check ───────────────────────────────────────────
  const anomaly = http.get(`${BASE_URL}/anomalies/status`, params);
  check(anomaly, { '✅ anomaly status ok': (r) => r.status === 200 });

  sleep(1);
}
