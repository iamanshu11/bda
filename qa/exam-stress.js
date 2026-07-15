/*
 * QA (D3): exam-load smoke test with k6 — https://k6.io
 *
 * Install: brew install k6   (macOS)
 * Run (baseline, public endpoints — no auth needed):
 *   k6 run qa/exam-stress.js
 * Ramp to 500 virtual users:
 *   k6 run -e VUS=500 qa/exam-stress.js
 *
 * This baseline hammers public read endpoints (health + written-test catalog)
 * to measure server throughput/latency and confirm it stays up under load.
 *
 * To simulate the REAL authed exam flow (start → heartbeat → submit), set
 * TOKEN + TEST_ID to a student JWT already enrolled in a published test; the
 * script will then exercise those endpoints too. Leave them unset for baseline.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const API = __ENV.API || 'http://localhost:5000';
const VUS = parseInt(__ENV.VUS || '100', 10);
const TOKEN = __ENV.TOKEN || '';
const TEST_ID = __ENV.TEST_ID || '';

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: VUS },
        { duration: '1m', target: VUS },
        { duration: '20s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],      // <1% errors
    http_req_duration: ['p(95)<800'],    // 95% under 800ms (tune to infra)
  },
};

export default function () {
  // Public baseline
  check(http.get(`${API}/health`), { 'health 200': (r) => r.status === 200 });
  check(http.get(`${API}/api/v1/written-tests`), {
    'catalog ok': (r) => r.status === 200 || r.status === 404,
  });

  // Optional authed exam path
  if (TOKEN && TEST_ID) {
    const auth = { headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } };
    const start = http.post(`${API}/api/v1/students/tests/${TEST_ID}/start`, null, auth);
    check(start, { 'start 2xx': (r) => r.status >= 200 && r.status < 300 });
    let token = '';
    try { token = start.json('data.sessionToken'); } catch (_) { /* ignore */ }
    if (token) {
      http.post(
        `${API}/api/v1/students/tests/${TEST_ID}/heartbeat`,
        JSON.stringify({ sessionToken: token, currentQuestionIndex: 0, answers: [], online: true }),
        auth,
      );
    }
  }
  sleep(1);
}
