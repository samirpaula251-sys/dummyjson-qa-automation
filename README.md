# DummyJSON API — QA Automation Package

This package extends the Postman collection with everything needed to run it
as a real, professional regression suite: CI/CD, HTML reporting, schema
validation, security testing, performance testing, and version control.

## What's in this delivery

```
.
├── collection/
│   ├── DummyJSON_API_QA_Collection.postman_collection.json   # 104 requests, 11 folders
│   └── DummyJSON_QA.postman_environment.json                  # baseUrl, tokens, ids
├── .github/workflows/
│   └── api-tests.yml            # CI/CD: runs the collection on every push/PR
├── performance/
│   └── k6-load-test.js          # starter load test (separate from Postman)
├── .gitignore
└── README.md   (this file)
```

Two of the six items below are now **inside the collection itself**
(folder `11 - Schema Validation & Security Testing`). The other four are
process/tooling pieces that live *around* the collection, provided here.

---

## 1. CI/CD Integration

**File:** `.github/workflows/api-tests.yml`

Runs the collection automatically:
- on every push to `main`
- on every pull request
- once a day on a schedule (catches drift on the third-party API itself)
- manually from the GitHub Actions tab

**Setup:** commit this repo to GitHub as-is — no extra configuration needed,
since Newman is installed fresh in the workflow each run. If a step in the
suite ever needs a secret (e.g. a real login password instead of the demo
one), add it under repo **Settings → Secrets → Actions** and reference it as
`${{ secrets.YOUR_SECRET }}` in the workflow.

A failing test fails the whole GitHub Actions run (Newman exits non-zero),
so a broken build blocks merges if you enable it as a required check.

---

## 2. Test Reports

**Tool:** `newman-reporter-htmlextra`

Run locally:
```bash
npm install -g newman newman-reporter-htmlextra

newman run collection/DummyJSON_API_QA_Collection.postman_collection.json \
  -e collection/DummyJSON_QA.postman_environment.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export reports/report.html
```

Open `reports/report.html` in a browser — pass/fail per request, response
times, and full request/response bodies for debugging failures.

In CI, the workflow above uploads this file automatically as a downloadable
build artifact on every run (30-day retention), so you don't need to be at
your machine to see the results.

---

## 3. Schema Validation

**Where:** collection folder `11 - Schema Validation & Security Testing`

Four requests (Product, User, Cart, Post) assert the response body against a
JSON Schema — checking that `price` is really a `number`, `tags` is really an
`array`, required fields exist, etc. — not just "the field is present."

Example assertion used in each request:
```javascript
pm.test('Response matches documented JSON schema', function () {
    pm.response.to.have.jsonSchema(schema);
});
```

Extending it: copy one of these four requests, point it at another resource,
and adjust the `schema` object at the top of the Test script to match that
resource's documented fields.

---

## 4. Security Testing

**Where:** same folder — `11 - Schema Validation & Security Testing`

Included checks:
- SQL-injection auth-bypass attempt on `/auth/login`
- SQL/NoSQL injection payload through `/products/search`
- XSS payload (`<script>`) in a new post body
- XSS payload (`<img onerror=...>`) in a new comment body
- Tampered/forged JWT rejected on `/auth/{resource}`
- Spot-check that list responses don't casually over-expose sensitive fields

This is a solid baseline, not a full penetration test. For deeper coverage
(fuzzing, auth/authorization matrices, header injection, rate-limit abuse),
a dedicated tool like OWASP ZAP is the next step beyond what Postman is
built for.

---

## 5. Performance / Load Testing

**File:** `performance/k6-load-test.js`

Postman/Newman sends requests **sequentially** — it's a functional-testing
tool, not a load-testing tool. It can tell you "this one request took
800ms," but not "what happens when 50 users hit this endpoint at once."

k6 is a dedicated load-testing tool built for that. The included script:
- ramps up to 20 virtual users over 30s, holds for 1 minute, ramps down
- hits the highest-traffic read endpoints (products, users, posts, carts, recipes)
- fails the run if p95 response time exceeds 1.5s or the error rate exceeds 1%

Run it:
```bash
# install: https://k6.io/docs/get-started/installation/
k6 run performance/k6-load-test.js
```

Treat this as a starting point — extend the `endpoints` array or add
authenticated flows as your real performance requirements grow.

---

## 6. Version Control

Recommended setup, so you can track every change to the collection over time:

```bash
git init
git add .
git commit -m "Initial QA automation package: collection, CI/CD, security, performance"
git remote add origin <your-repo-url>
git push -u origin main
```

Why this matters day-to-day:
- every edit to the collection shows up in `git diff` (Postman collections
  are just JSON, so version control works on them like any code file)
- you can see *when* a test was added or changed, and by whom
- if a change breaks the suite, `git revert` gets you back to a known-good
  collection immediately
- the `.gitignore` here keeps generated reports and `node_modules/` out of
  the repo, so only the source-of-truth files are tracked

If you edit the collection inside the Postman app instead of by hand, export
it (`... → Export`) and overwrite the file in `collection/` before each
commit, so the repo and the app never drift apart.
