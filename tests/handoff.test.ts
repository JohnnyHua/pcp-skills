import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

import {
  ensureDir,
  writeStack,
  appendEvent,
  writeProjectFiles,
  appendWorklog,
  replayEvents,
  replayBacklog,
  buildHandoffMarkdown,
} from "../plugin/state.ts";

test("replays PCP state and renders a handoff markdown snapshot", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pcp-handoff-"));

  ensureDir(dir);
  writeStack(dir, {
    next_id: 4,
    backlog_next_id: 3,
    active_stack: ["T001", "T003"],
    active_task_id: "T003",
    ready_tasks: [{ id: "T002", title: "补 README 的 handoff 文档" }],
  });

  appendEvent(dir, { e: "created", id: "T001", type: "main", title: "实现 handoff 工具", ts: 1 });
  appendEvent(dir, { e: "created", id: "T002", type: "main", title: "补 README 的 handoff 文档", ts: 2 });
  appendEvent(dir, { e: "sub", id: "T003", parent: "T001", title: "提取状态与渲染逻辑", ts: 3 });
  appendEvent(dir, { e: "resume_set", id: "T001", prompt: "完成子任务后继续主线 handoff 工具。", ts: 4 });
  appendEvent(dir, { e: "backlog_add", id: "B001", title: "支持 handoff 聚焦某个问题", detail: "允许用户传 focus", ts: 5 });
  appendEvent(dir, { e: "backlog_add", id: "B002", title: "评估自动 handoff", ts: 6 });
  appendEvent(dir, { e: "backlog_dismiss", backlog_id: "B002", ts: 7 });

  writeProjectFiles(dir, {
    name: "pcp-skills",
    summary: "PCP plugin and skills for AI coding agents",
    detail: "README: PCP 用于任务队列、backlog 和 pivot。",
    extra: null,
    key_files: ["plugin/pcp.ts", "skills/pcp-setup/SKILL.md"],
    status: "正在补 handoff 能力",
    updated_at: "2026-03-10",
  });
  appendWorklog(dir, "✅ [T003] 提取状态与渲染逻辑");

  const tasks = replayEvents(dir);
  const backlog = replayBacklog(dir);
  const handoff = buildHandoffMarkdown(dir, {
    audience: "Claude Code",
    focus: "继续完善 handoff",
    include_backlog: true,
  });

  const activeTask = tasks.find((task) => task.id === "T003");
  assert.equal(activeTask?.title, "提取状态与渲染逻辑");
  assert.equal(backlog.find((item) => item.id === "B001")?.status, "pending");
  assert.equal(backlog.find((item) => item.id === "B002")?.status, "dismissed");
  assert.match(handoff, /# PCP Handoff/);
  assert.match(handoff, /继续完善 handoff/);
  assert.match(handoff, /当前主线任务/);
  assert.match(handoff, /T001/);
  assert.match(handoff, /T003/);
  assert.match(handoff, /补 README 的 handoff 文档/);
  assert.match(handoff, /B001/);
  assert.match(handoff, /PCP plugin and skills for AI coding agents/);
  assert.match(handoff, /继续主线 handoff 工具/);
});
