import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  approveTaskProposal,
  createTaskProposal,
  ensureDir,
  listTaskProposals,
  proposalsDir,
  readStack,
  readTaskCard,
  rejectTaskProposal,
} from "../plugin/state.ts";

test("proposal persists without creating a formal task", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-proposal-"));

  ensureDir(dir);
  const proposal = createTaskProposal(dir, {
    title: "补充 OAuth 支持",
    detail: "作为后续明确提议，不应直接变成主线任务。",
  });

  assert.ok(fs.existsSync(proposalsDir(dir)));
  assert.equal(proposal.id, "TP001");
  assert.equal(proposal.status, "proposed");
  assert.equal(readStack(dir).active_task_id, null);
  assert.equal(readTaskCard(dir, "T001"), null);
  assert.equal(listTaskProposals(dir).length, 1);
});

test("approved proposal becomes a formal queued task", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-proposal-approve-"));

  ensureDir(dir);
  createTaskProposal(dir, {
    title: "补充 OAuth 支持",
    detail: "批准后才应进入正式队列。",
  });

  const result = approveTaskProposal(dir, "TP001");
  const stack = readStack(dir);
  const taskCard = readTaskCard(dir, "T001");
  const proposal = listTaskProposals(dir)[0];

  assert.equal(result.task_id, "T001");
  assert.equal(stack.active_task_id, "T001");
  assert.equal(taskCard?.title, "补充 OAuth 支持");
  assert.equal(proposal?.status, "approved");
  assert.equal(proposal?.approved_task_id, "T001");
});

test("rejecting proposal leaves queue untouched", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-proposal-reject-"));

  ensureDir(dir);
  createTaskProposal(dir, {
    title: "自动加一个系统任务",
    detail: "这个提议不应被转成正式任务。",
  });

  rejectTaskProposal(dir, "TP001");

  const stack = readStack(dir);
  const proposal = listTaskProposals(dir)[0];

  assert.equal(stack.active_task_id, null);
  assert.equal(readTaskCard(dir, "T001"), null);
  assert.equal(proposal?.status, "rejected");
});

test("approved subtask proposal becomes a real stacked subtask", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-subtask-proposal-"));

  ensureDir(dir);
  createTaskProposal(dir, {
    title: "主任务",
    detail: "先有一个主任务，后面再提议子任务。",
  });
  approveTaskProposal(dir, "TP001");

  createTaskProposal(dir, {
    title: "拆一个临时子任务",
    detail: "这是子任务提议，批准后应压栈回主线。",
    kind: "subtask",
    parent_task_id: "T001",
  });

  const result = approveTaskProposal(dir, "TP002");
  const stack = readStack(dir);
  const proposal = listTaskProposals(dir).find((item) => item.id === "TP002");
  const subtaskCard = readTaskCard(dir, "T002");

  assert.equal(result.task_id, "T002");
  assert.equal(stack.active_task_id, "T002");
  assert.deepEqual(stack.active_stack, ["T001", "T002"]);
  assert.equal(proposal?.status, "approved");
  assert.equal(subtaskCard?.parent_id, "T001");
  assert.equal(subtaskCard?.type, "sub");
});

test("listTaskProposals exposes pending proposals first for review", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-proposal-review-"));

  ensureDir(dir);
  createTaskProposal(dir, {
    title: "主任务提议",
    detail: "主任务待批准",
  });
  createTaskProposal(dir, {
    title: "子任务提议",
    detail: "子任务待批准",
    kind: "subtask",
    parent_task_id: "T001",
  });
  rejectTaskProposal(dir, "TP001");

  const proposals = listTaskProposals(dir);
  assert.equal(proposals[0]?.id, "TP002");
  assert.equal(proposals[0]?.status, "proposed");
});
