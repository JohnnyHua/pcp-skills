import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

import {
  appendWorklog,
  buildIntakeSummary,
  buildIntakeFollowup,
  applyIntakeAdoptionDecision,
  ensureDir,
  writeStack,
  appendEvent,
  readTaskCard,
  readStack,
  writeHandoff,
  readHandoffSnapshot,
  intakeHandoff,
  writeProjectFiles,
  createConcern,
  compilePlan,
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

test("builds an intake summary from existing PCP state without requiring handoff", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-intake-existing-"));

  ensureDir(dir);
  compilePlan(dir, {
    source: "external-agent",
    title: "existing pcp",
    tasks: ["继续主任务", "下一步任务"],
  });
  appendWorklog(dir, "✅ [T001] 已经完成部分接手整理");
  appendEvent(dir, { e: "backlog_add", id: "B001", title: "后续补 OAuth", ts: 1 });
  createConcern(dir, {
    title: "hook 阶段的用户意图理解",
    detail: "以后做到 hook 时再讨论。",
    tags: ["phase:hook", "user-intent"],
  });

  const summary = buildIntakeSummary(dir);

  assert.equal(summary.source, "existing_pcp");
  assert.equal(summary.project.has_pcp, true);
  assert.equal(summary.project.kind, "已接入 PCP 的项目");
  assert.equal(summary.flow.active_task_id, "T001");
  assert.equal(summary.flow.queue_count, 1);
  assert.equal(summary.records.backlog_count, 1);
  assert.equal(summary.records.concern_count, 1);
  assert.equal(summary.records.has_worklog, true);
  assert.match(summary.next_steps.join("\n"), /沿用当前流程|重新开始/);
});

test("builds an intake summary for a plain repo without creating PCP state", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-intake-plain-"));

  fs.writeFileSync(path.join(dir, "README.md"), "# Demo\n\n这是一个还没接入 PCP 的普通项目。\n");
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ name: "plain-demo", description: "plain repo", scripts: { test: "echo test" } }, null, 2),
  );

  const summary = buildIntakeSummary(dir);

  assert.equal(summary.source, "plain_repo");
  assert.equal(summary.project.has_pcp, false);
  assert.equal(summary.project.kind, "Node/TS 项目");
  assert.match(summary.project.signals.join("\n"), /package\.json/);
  assert.equal(summary.flow.active_task_id, null);
  assert.equal(summary.records.backlog_count, 0);
  assert.match(summary.project.summary, /plain-demo|plain repo/);
  assert.match(summary.next_steps.join("\n"), /还没有接入 PCP/);
  assert.equal(fs.existsSync(path.join(dir, ".opencode", "pcp")), false);
});

test("restart adoption clears current PCP flow without deleting history", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-intake-restart-"));

  ensureDir(dir);
  compilePlan(dir, {
    source: "external-agent",
    title: "restart pcp",
    tasks: ["当前主线", "后续任务"],
  });

  const result = applyIntakeAdoptionDecision(dir, "restart");

  assert.equal(result.decision, "restart");
  assert.equal(result.active_task_id, null);
  assert.equal(result.queue_count, 0);

  const stack = readStack(dir);
  assert.equal(stack.active_task_id, null);
  assert.equal(stack.ready_tasks.length, 0);

  const tasks = fs.readFileSync(path.join(dir, ".opencode", "pcp", "events.jsonl"), "utf8");
  assert.match(tasks, /T001/);
});

test("reference_only adoption preserves current flow", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-intake-reference-"));

  ensureDir(dir);
  compilePlan(dir, {
    source: "external-agent",
    title: "reference pcp",
    tasks: ["当前主线", "后续任务"],
  });

  const result = applyIntakeAdoptionDecision(dir, "reference_only");

  assert.equal(result.decision, "reference_only");
  assert.equal(result.active_task_id, "T001");
  assert.equal(result.queue_count, 1);
});

test("intake followup expands specific sections on demand", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-intake-followup-"));

  ensureDir(dir);
  compilePlan(dir, {
    source: "external-agent",
    title: "followup pcp",
    tasks: ["当前主线", "后续任务"],
  });
  appendWorklog(dir, "✅ [T001] 刚刚补了 intake 说明");
  appendEvent(dir, { e: "backlog_add", id: "B001", title: "后续补 OAuth", detail: "先别打断主线", ts: 1 });
  createConcern(dir, {
    title: "后续要处理自动起任务刷屏",
    detail: "no approved task to auto-start 日志太吵。",
    tags: ["hook:auto-start", "logging"],
  });

  const options = buildIntakeFollowup(dir, "options");
  const backlog = buildIntakeFollowup(dir, "backlog");
  const concern = buildIntakeFollowup(dir, "concern");
  const worklog = buildIntakeFollowup(dir, "worklog");

  assert.match(options, /1\. 查看项目概况/);
  assert.match(backlog, /B001/);
  assert.match(backlog, /3\. 查看 backlog/);
  assert.match(concern, /自动起任务刷屏/);
  assert.match(worklog, /intake 说明/);
});
