import test from "node:test";
import assert from "node:assert/strict";
import { SCENE_META, sceneNodes, sceneConnections } from "../src/lib/career-scene.ts";
import { CAREER_MOTION } from "../src/lib/career-story.ts";

test("every chapter retains six finite objects inside the shared scene", () => {
  let previous = "hero";
  for (const phase of Object.keys(SCENE_META)) {
    for (const local of [0, .15, .5, 1]) {
      const nodes = sceneNodes({ phase, previous, local });
      assert.equal(nodes.length, 6);
      for (const node of nodes) {
        for (const key of ["x", "y", "z", "w", "h", "opacity"]) assert.ok(Number.isFinite(node[key]), `${phase}: ${key}`);
        assert.ok(node.x >= 0 && node.y >= 0 && node.x + node.w <= 520 && node.y + node.h <= 440, phase);
      }
    }
    previous = phase;
  }
});
test("chapter entry starts from the previous pose and scrubbing is reversible", () => {
  const end = sceneNodes({ phase: "workspace", previous: "workflow", local: 1 });
  const start = sceneNodes({ phase: "evidence", previous: "workspace", local: 0 });
  for (let i = 0; i < 6; i++) for (const key of ["x", "y", "z", "w", "h", "opacity"]) assert.equal(start[i][key], end[i][key]);
  const frame = { phase: "interview", previous: "email", local: .5 };
  const forward = sceneNodes(frame);
  sceneNodes({ ...frame, local: 1 });
  assert.deepEqual(sceneNodes(frame), forward);
});
test("alignment only connects supported evidence, never missing requirements", () => {
  assert.deepEqual(sceneConnections("match"), [[0, 1], [2, 3]]);
  const nodes = sceneNodes({ phase: "match", previous: "match", local: 1 });
  assert.equal(nodes[4].label, "NEEDS CONTEXT");
  assert.equal(nodes[5].label, "NOT YET EVIDENCED");
});
test("final resolution brings the six components back into one document", () => {
  const nodes = sceneNodes({ phase: "finalCta", previous: "features", local: 1 });
  assert.equal(new Set(nodes.map(n => n.x)).size, 1);
  assert.equal(nodes[0].title, "Your Career Core");
});
test("a 720px-tall desktop is not excluded from WebGL", () => {
  assert.ok(!CAREER_MOTION.desktopQuery.includes("min-height"));
  assert.ok(CAREER_MOTION.desktopQuery.includes("prefers-reduced-motion"));
});
