// Minimal k6 load-test starter for the DummyJSON API.
// Postman/Newman is a functional-testing tool - it sends requests sequentially
// and is not built for simulating concurrent virtual users. k6 is a dedicated
// load-testing tool; this script is a starting point covering the highest-
// traffic read endpoints (products, users, posts).
//
// Install:   https://k6.io/docs/get-started/installation/
// Run:       k6 run performance/k6-load-test.js
// Run w/ UI: k6 run --out json=results.json performance/k6-load-test.js

import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 20 },  // ramp up to 20 virtual users
    { duration: "1m", target: 20 },   // hold at 20 virtual users
    { duration: "15s", target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<1500"], // 95% of requests must complete under 1.5s
    http_req_failed: ["rate<0.01"],    // error rate must stay under 1%
  },
};

const BASE_URL = "https://dummyjson.com";

export default function () {
  const endpoints = ["/products", "/users", "/posts", "/carts", "/recipes"];
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

  const res = http.get(`${BASE_URL}${endpoint}?limit=10`);

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 1500ms": (r) => r.timings.duration < 1500,
  });

  sleep(1);
}
