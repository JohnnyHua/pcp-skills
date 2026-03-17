import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  applyReviewActions,
  compilePlan,
  createTaskProposal,
  ensureDir,
  listTaskProposals,
  readStack,
  readTaskCard,
  requestTaskCompletion,
} from "../plugin/state.ts";

test("approves pending completion through review apply", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-review-apply-completion-"));

  ensureDir(dir);
  compilePlan(dir, {
    source: "external-agent",
    title: "review apply",
    tasks: ["当前任务", "后续任务"],
  });
  requestTaskCompletion(dir, { review: "yes", via: "manual" });

  const result = applyReviewActions(dir, { approve_completion: true });
  const stack = readStack(dir);

  assert.equal(result.approved_completion, true);
  assert.equal(stack.pending_completion, null);
  assert.equal(stack.active_task_id, "T002");
});

test("approves task proposal through review apply", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-review-apply-approve-proposal-"));

  ensureDir(dir);
  createTaskProposal(dir, {
    title: "后续提议",
    detail: "批准后应该转正式任务",
  });

  const result = applyReviewActions(dir, { approve_proposals: ["TP001"] });
  const proposal = listTaskProposals(dir)[0];

  assert.deepEqual(result.approved_proposals, ["TP001"]);
  assert.equal(proposal?.status, "approved");
  assert.equal(readTaskCard(dir, "T001")?.title, "后续提议");
});

test("rejects task proposal through review apply", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-review-apply-reject-proposal-"));

  ensureDir(dir);
  createTaskProposal(dir, {
    title: "不该进主线的提议",
    detail: "这条应该被拒绝",
  });

  const result = applyReviewActions(dir, { reject_proposals: ["TP001"] });
  const proposal = listTaskProposals(dir)[0];

  assert.deepEqual(result.rejected_proposals, ["TP001"]);
  assert.equal(proposal?.status, "rejected");
});

test("supports mixed review actions in one call", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-review-apply-mixed-"));

  ensureDir(dir);
  compilePlan(dir, {
    source: "external-agent",
    title: "mixed review",
    tasks: ["当前任务", "后续任务"],
  });
  requestTaskCompletion(dir, { review: "skip", via: "manual" });
  createTaskProposal(dir, {
    title: "批准提议",
    detail: "应该进入正式队列",
  });
  createTaskProposal(dir, {
    title: "拒绝提议",
    detail: "不应该进入正式队列",
  });

  const result = applyReviewActions(dir, {
    approve_completion: true,
    approve_proposals: ["TP001"],
    reject_proposals: ["TP002"],
  });

  const proposals = listTaskProposals(dir);
  const stack = readStack(dir);

  assert.equal(result.approved_completion, true);
  assert.deepEqual(result.approved_proposals, ["TP001"]);
  assert.deepEqual(result.rejected_proposals, ["TP002"]);
  assert.equal(stack.active_task_id, "T002");
  assert.equal(proposals.find((item) => item.id === "TP001")?.status, "approved");
  assert.equal(proposals.find((item) => item.id === "TP002")?.status, "rejected");
});
