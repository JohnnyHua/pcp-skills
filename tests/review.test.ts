import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  buildReviewItems,
  compilePlan,
  createTaskProposal,
  ensureDir,
  listTaskProposals,
  readStack,
  readTaskCard,
  requestTaskCompletion,
} from "../plugin/state.ts";

test("builds a completion review item when gated completion is pending", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-review-completion-"));

  ensureDir(dir);
  compilePlan(dir, {
    source: "external-agent",
    title: "统一 review",
    tasks: ["先做当前任务", "后续任务"],
  });
  requestTaskCompletion(dir, { review: "yes", via: "manual" });

  const items = buildReviewItems({
    stack: readStack(dir),
    activeCard: readTaskCard(dir, "T001"),
    pendingProposals: [],
  });

  assert.equal(items.length, 1);
  assert.equal(items[0]?.kind, "completion");
  assert.equal(items[0]?.commands[0], "pcp_approve");
});

test("builds proposal review items and keeps completion first", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-review-proposals-"));

  ensureDir(dir);
  compilePlan(dir, {
    source: "external-agent",
    title: "统一 review",
    tasks: ["当前主任务"],
  });
  requestTaskCompletion(dir, { review: "skip", via: "manual" });
  createTaskProposal(dir, {
    title: "后续主任务提议",
    detail: "进入队列前需要批准",
  });
  createTaskProposal(dir, {
    title: "临时子任务提议",
    detail: "也应该走 review",
    kind: "subtask",
    parent_task_id: "T001",
  });

  const items = buildReviewItems({
    stack: readStack(dir),
    activeCard: readTaskCard(dir, "T001"),
    pendingProposals: listTaskProposals(dir).filter((item) => item.status === "proposed"),
  });

  assert.equal(items.length, 3);
  assert.equal(items[0]?.kind, "completion");
  assert.equal(items[1]?.kind, "task-proposal");
  assert.equal(items[2]?.kind, "subtask-proposal");
  assert.equal(items[1]?.commands[0], 'pcp_approve_task_proposal({ proposal_id: "TP001" })');
  assert.equal(items[2]?.commands[1], 'pcp_reject_task_proposal({ proposal_id: "TP002" })');
});

test("returns no review items when nothing is waiting", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-review-empty-"));

  ensureDir(dir);
  compilePlan(dir, {
    source: "external-agent",
    title: "空 review",
    tasks: ["当前主任务"],
  });

  const items = buildReviewItems({
    stack: readStack(dir),
    activeCard: readTaskCard(dir, "T001"),
    pendingProposals: [],
  });

  assert.deepEqual(items, []);
});
