import test from "node:test";
import assert from "node:assert/strict";
import { sampleStory } from "../src/lib/career-story.ts";

test("hero unfolding follows measured height and reverses without state", () => {
  const anchors = [{ id: "hero", top: 100, height: 1400 }, { id: "match", top: 1500, height: 600 }];
  assert.equal(sampleStory(anchors, 100, 800).hero, 0);
  assert.equal(sampleStory(anchors, 400, 800).hero, .5);
  assert.equal(sampleStory(anchors, 700, 800).hero, 1);
  assert.equal(sampleStory(anchors, 400, 800).hero, .5);
  assert.equal(sampleStory(anchors, 0, 800).progress, 0);
  assert.equal(sampleStory(anchors, 10000, 800).progress, 1);
  assert.equal(sampleStory(anchors, 1300, 800).progress, 1, "the end is reachable even when the last section is shorter than the viewport");
});

test("disabled and reordered sections do not require fixed story ranges", () => {
  assert.deepEqual(sampleStory([], 200, 800), { progress: 0, hero: 0 });
  const anchors = [{ id: "match", top: 100, height: 600 }, { id: "hero", top: 700, height: 1500 }];
  assert.equal(sampleStory(anchors, 1050, 800).hero, .5);
  assert.equal(sampleStory([{ id: "match", top: 0, height: 500 }], 20, 800).hero, 0);
});

test("remeasuring streamed content changes the mapping without stale offsets", () => {
  const before = [{ id: "hero", top: 0, height: 1200 }];
  const after = [{ id: "hero", top: 0, height: 1600 }];
  assert.equal(sampleStory(before, 400, 800).hero, 1);
  assert.equal(sampleStory(after, 400, 800).hero, .5);
});
