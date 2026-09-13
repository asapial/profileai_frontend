import test from "node:test";
import assert from "node:assert/strict";
import { studioSection } from "../src/lib/studio-homepage.ts";
const hero = { id: "hero", enabled: true, eyebrow: "Intro", title: "Build a job-winning resume with AI.", description: "Create, tailor, score, and export a professional resume in minutes. ProFile AI helps you beat applicant tracking systems and land more interviews.", primaryCta: { label: "Get Started Free", href: "/register" } };
test("shipped marketing defaults adopt the new studio copy without mutating CMS data", () => {
  const result = studioSection(hero);
  assert.equal(result.title, ""); assert.equal(result.description, ""); assert.equal(result.primaryCta, undefined);
  assert.equal(hero.title, "Build a job-winning resume with AI."); assert.ok(hero.primaryCta);
});
test("an authored description, destination and visibility survive a default heading", () => {
  const current = { ...hero, enabled: false, description: "A career studio for our alumni.", primaryCta: { label: "Join our studio", href: "/register?source=alumni" }, items: [{ title: "Our community", description: "Written by an administrator" }] };
  const result = studioSection(current);
  assert.equal(result.description, current.description); assert.deepEqual(result.primaryCta, current.primaryCta);
  assert.deepEqual(result.items, current.items); assert.equal(result.enabled, false);
});
test("unrelated CMS sections remain intact", () => {
  const current = { ...hero, id: "pricing", title: "Custom membership plans" };
  assert.deepEqual(studioSection(current), current);
});
