import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  approvePendingCompletion,
  compilePlan,
  completeActiveTask,
  ensureDir,
  readStack,
  readTaskCard,
  requestTaskCompletion,
  setCompletionMode,
  writeStack,
} from "../plugin/state.ts";

test("manual completion records review choice, leaves git pending, and advances queue", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-review-manual-"));

  ensureDir(dir);
  setCompletionMode(dir, "auto");
  compilePlan(dir, {
    source: "external-agent",
    title: "实现 review gate",
    tasks: ["先做当前任务", "自动推进下一个任务"],
  });

  const result = completeActiveTask(dir, { review: "no", via: "manual" });
  assert.equal(result.outcome, "advanced");
  assert.equal(result.doneId, "T001");

  const doneCard = readTaskCard(dir, "T001");
  const nextCard = readTaskCard(dir, "T002");
  const stack = readStack(dir);

  assert.equal(doneCard?.lifecycle_status, "done");
  assert.equal(doneCard?.review_status, "machine_requested");
  assert.equal(doneCard?.git_status, "pending");
  assert.equal(nextCard?.lifecycle_status, "doing");
  assert.equal(stack.active_task_id, "T002");
});

test("git commit completion records committed state and returns from subtask to parent", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-review-git-"));

  ensureDir(dir);
  setCompletionMode(dir, "auto");
  compilePlan(dir, {
    source: "external-agent",
    title: "主线计划",
    tasks: ["主任务"],
  });

  const stack = readStack(dir);
  stack.active_stack.push("T002");
  stack.active_task_id = "T002";
  stack.next_id = 3;
  fs.appendFileSync(
    path.join(dir, ".opencode", "pcp", "events.jsonl"),
    JSON.stringify({ e: "sub", id: "T002", parent: "T001", title: "子任务", ts: Date.now() }) + "\n",
  );
  // reuse existing stack write/reconcile path
  writeStack(dir, stack);

  const result = completeActiveTask(dir, { review: "skip", via: "git_commit" });
  assert.equal(result.outcome, "returned_to_parent");
  assert.equal(result.doneId, "T002");

  const subCard = readTaskCard(dir, "T002");
  const parentCard = readTaskCard(dir, "T001");
  const updated = readStack(dir);

  assert.equal(subCard?.lifecycle_status, "done");
  assert.equal(subCard?.review_status, "skipped");
  assert.equal(subCard?.git_status, "committed");
  assert.equal(parentCard?.lifecycle_status, "doing");
  assert.equal(updated.active_task_id, "T001");
});

test("gated mode keeps active task in place until approval", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-review-gated-"));

  ensureDir(dir);
  setCompletionMode(dir, "gated");
  compilePlan(dir, {
    source: "external-agent",
    title: "门控模式",
    tasks: ["先汇报再继续", "后续任务"],
  });

  requestTaskCompletion(dir, { review: "yes", via: "manual" });

  const pendingStack = readStack(dir);
  const activeCard = readTaskCard(dir, "T001");
  assert.equal(pendingStack.active_task_id, "T001");
  assert.equal(pendingStack.pending_completion?.task_id, "T001");
  assert.equal(activeCard?.lifecycle_status, "doing");

  const result = approvePendingCompletion(dir);
  assert.equal(result.outcome, "advanced");
  assert.equal(readStack(dir).active_task_id, "T002");
});
