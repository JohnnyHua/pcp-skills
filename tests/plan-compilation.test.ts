import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  compilePlan,
  ensureDir,
  plansDir,
  readPlan,
  readStack,
  readTaskCard,
} from "../plugin/state.ts";

test("compiles a plan into persisted plan metadata, task cards, and queue state", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-plan-compile-"));

  ensureDir(dir);

  const result = compilePlan(dir, {
    source: "external-agent",
    title: "实现 Plan runtime",
    tasks: ["实现 Plan 持久化", "补计划编译入口"],
  });

  assert.ok(fs.existsSync(plansDir(dir)));
  assert.equal(result.plan.id, "P001");
  assert.deepEqual(result.plan.task_ids, ["T001", "T002"]);

  const savedPlan = readPlan(dir, "P001");
  assert.equal(savedPlan?.title, "实现 Plan runtime");
  assert.equal(savedPlan?.source, "external-agent");
  assert.deepEqual(savedPlan?.raw_tasks, ["实现 Plan 持久化", "补计划编译入口"]);

  const stack = readStack(dir);
  assert.equal(stack.active_task_id, "T001");
  assert.deepEqual(stack.ready_tasks.map((task) => task.id), ["T002"]);

  const activeCard = readTaskCard(dir, "T001");
  const queuedCard = readTaskCard(dir, "T002");
  assert.equal(activeCard?.created_from_plan, "P001");
  assert.equal(activeCard?.lifecycle_status, "doing");
  assert.equal(queuedCard?.created_from_plan, "P001");
  assert.equal(queuedCard?.lifecycle_status, "ready");
});

test("appends compiled plan tasks to the ready queue when a task is already active", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-plan-append-"));

  ensureDir(dir);

  compilePlan(dir, {
    source: "external-agent",
    title: "首轮计划",
    tasks: ["先做主线", "再做收尾"],
  });

  const second = compilePlan(dir, {
    source: "external-agent",
    title: "补充计划",
    tasks: ["补文档", "补验证"],
  });

  assert.equal(second.plan.id, "P002");
  assert.deepEqual(second.plan.task_ids, ["T003", "T004"]);

  const stack = readStack(dir);
  assert.equal(stack.active_task_id, "T001");
  assert.deepEqual(
    stack.ready_tasks.map((task) => task.id),
    ["T002", "T003", "T004"],
  );

  const appendedCard = readTaskCard(dir, "T003");
  assert.equal(appendedCard?.created_from_plan, "P002");
  assert.equal(appendedCard?.lifecycle_status, "ready");
});
