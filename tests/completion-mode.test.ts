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
} from "../plugin/state.ts";

test("gated mode holds completion for approval before advancing queue", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-gated-complete-"));

  ensureDir(dir);
  setCompletionMode(dir, "gated");
  compilePlan(dir, {
    source: "external-agent",
    title: "需要人工门控",
    tasks: ["先做当前任务", "再做下一个任务"],
  });

  const pending = requestTaskCompletion(dir, { review: "yes", via: "manual" });
  assert.equal(pending.taskId, "T001");

  const stackBeforeApprove = readStack(dir);
  const currentCard = readTaskCard(dir, "T001");
  const queuedCard = readTaskCard(dir, "T002");

  assert.equal(stackBeforeApprove.active_task_id, "T001");
  assert.equal(stackBeforeApprove.pending_completion?.task_id, "T001");
  assert.equal(currentCard?.lifecycle_status, "doing");
  assert.equal(currentCard?.review_status, "approved");
  assert.equal(currentCard?.git_status, "pending");
  assert.equal(queuedCard?.lifecycle_status, "ready");

  const result = approvePendingCompletion(dir);
  assert.equal(result.outcome, "advanced");
  assert.equal(result.doneId, "T001");

  const stackAfterApprove = readStack(dir);
  const doneCard = readTaskCard(dir, "T001");
  const nextCard = readTaskCard(dir, "T002");

  assert.equal(stackAfterApprove.pending_completion, null);
  assert.equal(stackAfterApprove.active_task_id, "T002");
  assert.equal(doneCard?.lifecycle_status, "done");
  assert.equal(nextCard?.lifecycle_status, "doing");
});

test("auto mode preserves direct completion behavior", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-auto-complete-"));

  ensureDir(dir);
  setCompletionMode(dir, "auto");
  compilePlan(dir, {
    source: "external-agent",
    title: "自动推进",
    tasks: ["先做当前任务", "自动推进下一个任务"],
  });

  const result = completeActiveTask(dir, { review: "no", via: "manual" });
  assert.equal(result.outcome, "advanced");
  assert.equal(result.doneId, "T001");

  const stack = readStack(dir);
  const doneCard = readTaskCard(dir, "T001");

  assert.equal(stack.pending_completion, null);
  assert.equal(stack.active_task_id, "T002");
  assert.equal(doneCard?.lifecycle_status, "done");
  assert.equal(doneCard?.review_status, "machine_requested");
});
