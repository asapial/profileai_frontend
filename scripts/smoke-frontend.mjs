import assert from "node:assert/strict";
const base = process.env.FRONTEND_TEST_URL || "http://localhost:3000";
const publicPaths = ["/", "/templates", "/pricing", "/help", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
let passed = 0;
for (const path of publicPaths) {
  const response = await fetch(new URL(path, base), { redirect: "manual", signal: AbortSignal.timeout(60000) });
  assert.equal(response.status, 200, `${path} should be public`);
  const html = await response.text();
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${path} needs exactly one primary heading`);
  assert.ok(html.includes('<main'), `${path} needs a main landmark`);
  assert.ok(!html.includes('data-next-error-message'), `${path} should not render a framework error`);
  console.log(`PASS public page ${path}`); passed++;
}
for (const path of ["/dashboard", "/admin", "/dashboard/templates?customize=preview-test"]) {
  const response = await fetch(new URL(path, base), { redirect: "manual", signal: AbortSignal.timeout(60000) });
  assert.ok([302,303,307,308].includes(response.status), `${path} must require a session`);
  const target = new URL(response.headers.get("location"), base);
  assert.equal(target.pathname, "/login");
  assert.equal(target.searchParams.get("redirect"), path, "Login must preserve the selected template");
  console.log(`PASS protected page and return destination ${path}`); passed++;
}
console.log(`${passed} frontend smoke checks passed.`);

