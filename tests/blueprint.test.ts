import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  blueprintsDir,
  compilePlan,
  createBlueprint,
  createBlueprintSubtaskProposal,
  ensureDir,
  listBlueprints,
  readBlueprint,
  readStack,
  readTaskCard,
  listTaskProposals,
  replayBacklog,
  shouldSuggestBlueprint,
} from "../plugin/state.ts";

test("creates and binds a blueprint to the active doing task", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-blueprint-"));

  ensureDir(dir);
  compilePlan(dir, {
    source: "external-agent",
    title: "蓝图主线",
    tasks: ["实现 Blueprint skeleton", "后续任务"],
  });

  const blueprint = createBlueprint(dir, {
    title: "Blueprint skeleton 当前蓝图",
    steps: ["先做骨架", "再补基础字段", "最后补状态展示"],
  });

  assert.ok(fs.existsSync(blueprintsDir(dir)));
  assert.equal(blueprint.id, "BP001");
  assert.equal(blueprint.task_id, "T001");
  assert.deepEqual(blueprint.steps, ["先做骨架", "再补基础字段", "最后补状态展示"]);

  const saved = readBlueprint(dir, "BP001");
  const activeCard = readTaskCard(dir, "T001");
  const queuedCard = readTaskCard(dir, "T002");

  assert.equal(saved?.status, "active");
  assert.equal(activeCard?.current_blueprint_id, "BP001");
  assert.equal(queuedCard?.current_blueprint_id, null);
  assert.equal(readStack(dir).active_task_id, "T001");
  assert.equal(replayBacklog(dir).length, 0);
});

test("rebinds the active task to the latest blueprint and archives the previous one", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-blueprint-rebind-"));

  ensureDir(dir);
  compilePlan(dir, {
    source: "external-agent",
    title: "蓝图迭代",
    tasks: ["做复杂任务"],
  });

  const first = createBlueprint(dir, {
    title: "第一版蓝图",
    steps: ["先做骨架"],
  });
  const second = createBlueprint(dir, {
    title: "第二版蓝图",
    steps: ["先做骨架", "再做肌肉"],
  });

  const activeCard = readTaskCard(dir, "T001");
  const all = listBlueprints(dir);

  assert.equal(first.id, "BP001");
  assert.equal(second.id, "BP002");
  assert.equal(readBlueprint(dir, "BP001")?.status, "archived");
  assert.equal(readBlueprint(dir, "BP002")?.status, "active");
  assert.equal(activeCard?.current_blueprint_id, "BP002");
  assert.equal(all.length, 2);
});

test("creates a subtask proposal from a blueprint step without creating a real subtask", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-blueprint-step-proposal-"));

  ensureDir(dir);
  compilePlan(dir, {
    source: "external-agent",
    title: "蓝图桥接",
    tasks: ["实现复杂任务"],
  });

  createBlueprint(dir, {
    title: "复杂任务蓝图",
    steps: ["先做骨架", "拆成可单独验证的部分", "最后收口"],
  });

  const proposal = createBlueprintSubtaskProposal(dir, { step_index: 2 });
  const proposals = listTaskProposals(dir);
  const stack = readStack(dir);

  assert.equal(proposal.id, "TP001");
  assert.equal(proposal.kind, "subtask");
  assert.equal(proposal.parent_task_id, "T001");
  assert.equal(proposal.source_blueprint_id, "BP001");
  assert.equal(proposal.source_step_index, 2);
  assert.equal(proposal.title, "拆成可单独验证的部分");
  assert.equal(proposals.length, 1);
  assert.equal(proposals[0]?.status, "proposed");
  assert.equal(stack.active_task_id, "T001");
  assert.equal(readTaskCard(dir, "T002"), null);
});

test("suggests blueprint only for complex doing tasks without current blueprint", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-blueprint-suggest-"));

  ensureDir(dir);
  compilePlan(dir, {
    source: "external-agent",
    title: "复杂任务建议",
    tasks: ["做一个横跨多个状态和文件的复杂任务"],
  });

  const activeCard = readTaskCard(dir, "T001");
  const pendingProposals = listTaskProposals(dir).filter((item) => item.status === "proposed");

  assert.equal(shouldSuggestBlueprint(activeCard ?? null, pendingProposals), true);

  createBlueprint(dir, {
    title: "复杂任务蓝图",
    steps: ["先做骨架", "再收口"],
  });

  const updated = readTaskCard(dir, "T001");
  assert.equal(shouldSuggestBlueprint(updated ?? null, pendingProposals), false);
});
