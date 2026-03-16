import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

import {
  appendWorklog,
  ensureDir,
  writeStack,
  appendEvent,
  readTaskCard,
  writeHandoff,
  readHandoffSnapshot,
  intakeHandoff,
  writeProjectFiles,
} from "../plugin/state.ts";

test("writes a machine-readable handoff snapshot and resumes it through intake", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-intake-"));

  ensureDir(dir);
  writeStack(dir, {
    next_id: 3,
    backlog_next_id: 2,
    plan_next_id: 1,
    active_stack: ["T001"],
    active_task_id: "T001",
    ready_tasks: [{ id: "T002", title: "补 intake 骨架" }],
  });

  appendEvent(dir, { e: "created", id: "T001", type: "main", title: "实现 handoff sidecar", ts: 1 });
  appendEvent(dir, { e: "created", id: "T002", type: "main", title: "补 intake 骨架", ts: 2 });
  appendEvent(dir, { e: "backlog_add", id: "B001", title: "补冲突校验", ts: 3 });
  appendEvent(dir, { e: "resume_set", id: "T001", prompt: "完成 handoff 后继续主线 intake。", ts: 4 });
  writeProjectFiles(dir, {
    name: "pcp-skills",
    summary: "PCP plugin and skills for AI coding agents",
    detail: "README: PCP 用于任务队列、backlog 和 pivot。",
    extra: null,
    key_files: ["plugin/pcp.ts", "plugin/state.ts"],
    status: "正在补 Intake skeleton",
    updated_at: "2026-03-11",
  });
  appendWorklog(dir, "✅ [T001] 生成 handoff sidecar");

  const handoff = writeHandoff(dir, {
    audience: "Claude Code",
    focus: "继续接手 intake",
    include_backlog: true,
  });

  assert.ok(fs.existsSync(handoff.path));
  assert.ok(fs.existsSync(handoff.snapshot_path));

  const snapshot = readHandoffSnapshot(dir);
  assert.equal(snapshot?.audience, "Claude Code");
  assert.equal(snapshot?.focus, "继续接手 intake");
  assert.equal(snapshot?.active_task?.id, "T001");
  assert.equal(snapshot?.active_task?.lifecycle_status, "doing");
  assert.equal(snapshot?.project.name, "pcp-skills");
  assert.equal(snapshot?.project.status, "正在补 Intake skeleton");
  assert.deepEqual(snapshot?.project.key_files, ["plugin/pcp.ts", "plugin/state.ts"]);
  assert.deepEqual(snapshot?.queue.map((task) => task.id), ["T002"]);
  assert.deepEqual(snapshot?.backlog.map((item) => item.id), ["B001"]);
  assert.match(snapshot?.resume_prompt ?? "", /继续主线 intake/);
  assert.match(snapshot?.recent_worklog.join("\n") ?? "", /生成 handoff sidecar/);
  assert.match(snapshot?.next_steps.join("\n") ?? "", /继续当前任务/);

  const intake = intakeHandoff(dir);
  assert.equal(intake.active_task_id, "T001");
  assert.equal(intake.source_path, handoff.snapshot_path);

  const resumedCard = readTaskCard(dir, "T001");
  assert.equal(resumedCard?.handoff_status, "resumed");

  const worklog = fs.readFileSync(path.join(dir, ".opencode", "pcp", "WORKLOG.md"), "utf8");
  assert.match(worklog, /读取 HANDOFF/);
});
