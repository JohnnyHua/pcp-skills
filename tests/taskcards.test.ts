import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  appendEvent,
  ensureDir,
  readTaskCard,
  reconcileTaskCards,
  taskcardsDir,
  writeStack,
} from "../plugin/state.ts";

test("reconciles legacy PCP events and queue state into persisted task cards", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-taskcards-"));

  ensureDir(dir);

  appendEvent(dir, { e: "created", id: "T001", type: "main", title: "实现 TaskCard 持久化", ts: 1 });
  appendEvent(dir, { e: "created", id: "T002", type: "main", title: "补计划编译校验", ts: 2 });
  appendEvent(dir, { e: "sub", id: "T003", parent: "T001", title: "设计 taskcards 目录结构", ts: 3 });

  writeStack(dir, {
    next_id: 4,
    backlog_next_id: 1,
    active_stack: ["T001", "T003"],
    active_task_id: "T003",
    ready_tasks: [{ id: "T002", title: "补计划编译校验" }],
  });

  reconcileTaskCards(dir);

  assert.ok(fs.existsSync(taskcardsDir(dir)));

  const mainCard = readTaskCard(dir, "T001");
  const queuedCard = readTaskCard(dir, "T002");
  const subCard = readTaskCard(dir, "T003");

  assert.equal(mainCard?.id, "T001");
  assert.equal(mainCard?.lifecycle_status, "doing");
  assert.deepEqual(mainCard?.children, ["T003"]);

  assert.equal(queuedCard?.lifecycle_status, "ready");
  assert.equal(queuedCard?.queue_slot, 0);

  assert.equal(subCard?.parent_id, "T001");
  assert.equal(subCard?.lifecycle_status, "doing");
  assert.equal(subCard?.title, "设计 taskcards 目录结构");
});

test("marks persisted task cards done when event history closes the task", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-taskcards-done-"));

  ensureDir(dir);

  appendEvent(dir, { e: "created", id: "T010", type: "main", title: "完成并归档任务卡", ts: 1 });
  appendEvent(dir, { e: "done", id: "T010", ts: 2 });

  writeStack(dir, {
    next_id: 11,
    backlog_next_id: 1,
    active_stack: [],
    active_task_id: null,
    ready_tasks: [],
  });

  reconcileTaskCards(dir);

  const doneCard = readTaskCard(dir, "T010");
  assert.equal(doneCard?.lifecycle_status, "done");
  assert.ok(doneCard?.completed_at);
});
