import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  concernsDir,
  createConcern,
  ensureDir,
  listConcerns,
  matchConcerns,
  readConcern,
} from "../plugin/state.ts";

test("persists concerns and indexes them", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-concern-"));
  ensureDir(dir);

  const concern = createConcern(dir, {
    title: "用户意图理解属于 hook 阶段问题",
    detail: "后续做到 hook 时再讨论什么时候该触发 PCP。",
    tags: ["phase:hook", "user-intent", "language:zh"],
  });

  assert.ok(fs.existsSync(concernsDir(dir)));
  assert.equal(concern.id, "C001");

  const saved = readConcern(dir, concern.id);
  assert.equal(saved?.title, "用户意图理解属于 hook 阶段问题");
  assert.deepEqual(saved?.tags, ["phase:hook", "user-intent", "language:zh"]);

  const all = listConcerns(dir);
  assert.equal(all.length, 1);
  assert.equal(all[0]?.id, "C001");
});

test("matches concerns by partial tag overlap and sorts by match count", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-concern-match-"));
  ensureDir(dir);

  createConcern(dir, {
    title: "handoff 语义以后要补 branch/commit",
    detail: "属于后续 handoff 冲突判断的增强项。",
    tags: ["artifact:handoff", "architecture", "git"],
  });
  createConcern(dir, {
    title: "用户意图理解放到 hook 阶段再做",
    detail: "当前先不实现。",
    tags: ["phase:hook", "user-intent", "language:zh"],
  });

  const matches = matchConcerns(dir, ["phase:hook", "user-intent", "artifact:handoff"]);
  assert.equal(matches.length, 2);
  assert.equal(matches[0]?.concern.title, "用户意图理解放到 hook 阶段再做");
  assert.equal(matches[0]?.matched_tags.length, 2);
  assert.equal(matches[1]?.concern.title, "handoff 语义以后要补 branch/commit");
  assert.equal(matches[1]?.matched_tags.length, 1);
});
