import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  buildStatusActionHints,
  compilePlan,
  createBlueprint,
  createTaskProposal,
  ensureDir,
  listTaskProposals,
  readStack,
  readTaskCard,
  requestTaskCompletion,
} from "../plugin/state.ts";

test("prioritizes pending completion approval in status hints", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-status-hints-completion-"));

  ensureDir(dir);
  compilePlan(dir, {
    source: "external-agent",
    title: "状态提示",
    tasks: ["完成后先停下", "后续任务"],
  });
  requestTaskCompletion(dir, { review: "yes", via: "manual" });

  const stack = readStack(dir);
  const activeCard = readTaskCard(dir, "T001");
  const hints = buildStatusActionHints({
    stack,
    activeCard,
    pendingProposals: [],
    pendingBacklogCount: 0,
  });

  assert.equal(hints.length, 1);
  assert.equal(hints[0]?.command, "pcp_approve");
});

test("surfaces proposal review before other optional actions", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-status-hints-proposal-"));

  ensureDir(dir);
  compilePlan(dir, {
    source: "external-agent",
    title: "提议优先",
    tasks: ["当前主任务"],
  });
  createTaskProposal(dir, {
    title: "后续提议任务",
    detail: "应该先 review proposal",
  });

  const stack = readStack(dir);
  const activeCard = readTaskCard(dir, "T001");
  const hints = buildStatusActionHints({
    stack,
    activeCard,
    pendingProposals: listTaskProposals(dir).filter((item) => item.status === "proposed"),
    pendingBacklogCount: 0,
  });

  assert.equal(hints[0]?.command, "pcp_list_task_proposals");
});

test("suggests blueprint for complex doing tasks and show once it exists", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-status-hints-blueprint-"));

  ensureDir(dir);
  compilePlan(dir, {
    source: "external-agent",
    title: "复杂任务提示",
    tasks: ["做一个横跨多个状态和文件的复杂任务"],
  });

  const stack = readStack(dir);
  const activeCard = readTaskCard(dir, "T001");
  const beforeHints = buildStatusActionHints({
    stack,
    activeCard,
    pendingProposals: [],
    pendingBacklogCount: 1,
  });

  assert.equal(beforeHints[0]?.command, "pcp_blueprint_create");

  createBlueprint(dir, {
    title: "当前复杂任务蓝图",
    steps: ["先做骨架", "再收口"],
  });

  const updatedCard = readTaskCard(dir, "T001");
  const afterHints = buildStatusActionHints({
    stack: readStack(dir),
    activeCard: updatedCard,
    pendingProposals: [],
    pendingBacklogCount: 1,
  });

  assert.equal(afterHints[0]?.command, "pcp_blueprint_show");
});
