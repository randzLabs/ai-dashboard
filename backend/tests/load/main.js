// tests/load/main.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 100 },
    { duration: "3m", target: 500 },
    { duration: "2m", target: 1000 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% request < 2 detik
    http_req_failed: ["rate<0.01"], // Error rate < 1%
  },
};

export default function (data) {
  const headers = { Authorization: `Bearer ${data.token}` };

  // Dashboard stats (paling sering dipanggil)
  const res = http.get(`${BASE_URL}/dashboard/stats`, { headers });
  check(res, { "status 200": (r) => r.status === 200 });

  sleep(1);
}

// Jalankan:
// k6 run tests/load/main.js
