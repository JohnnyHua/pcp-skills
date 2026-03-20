import * as fs from "node:fs";
import * as path from "node:path";

export interface Stack {
  next_id: number;
  backlog_next_id: number;
  plan_next_id?: number;
  blueprint_next_id?: number;
  active_stack: string[];
  active_task_id: string | null;
  ready_tasks: { id: string; title: string }[];
  completion_mode?: CompletionMode;
  pending_completion?: PendingCompletion | null;
}

export type CompletionMode = "auto" | "gated";

export interface PendingCompletion {
  task_id: string;
  review: TaskReviewDecision;
  via: TaskCompletionVia;
  requested_at: string;
}

export interface PcpEvent {
  e:
    | "created"
    | "sub"
    | "done"
    | "pivoted"
    | "resume_set"
    | "project_context"
    | "backlog_add"
    | "backlog_promote"
    | "backlog_dismiss";
  id?: string;
  type?: "main" | "sub";
  title?: string;
  parent?: string;
  prompt?: string;
  summary?: string;
  detail?: string;
  reason?: string;
  backlog_id?: string;
  task_id?: string;
  ts: number;
}

export interface Task {
  id: string;
  type: "main" | "sub";
  title: string;
  parent?: string;
  done: boolean;
  resume_prompt?: string;
  pivoted?: boolean;
  pivot_reason?: string;
}

export interface BacklogItem {
  id: string;
  title: string;
  detail?: string;
  status: "pending" | "promoted" | "dismissed";
  promoted_to?: string;
}

export interface ProjectData {
  name: string;
  summary: string;
  detail: string | null;
  extra: string | null;
  key_files: string[];
  status: string | null;
  updated_at: string;
}

interface ProjectBaselineSummary {
  name: string | null;
  summary: string | null;
  detail: string | null;
  key_files: string[];
  status: string | null;
}

export interface ConcernInput {
  title: string;
  detail: string;
  tags: string[];
}

export interface ConcernRecord {
  id: string;
  title: string;
  detail: string;
  tags: string[];
  status: "open" | "acknowledged" | "triggered" | "resolved" | "dismissed";
  created_at: string;
  updated_at: string;
}

export interface ConcernIndex {
  ids: string[];
  updated_at: string;
}

export interface ConcernMatch {
  concern: ConcernRecord;
  matched_tags: string[];
}

export interface HandoffOptions {
  audience?: string;
  focus?: string;
  include_backlog?: boolean;
  max_recent_events?: number;
  max_worklog_entries?: number;
}

export interface HandoffSnapshot {
  generated_at: string;
  audience: string | null;
  focus: string | null;
  project: {
    name: string | null;
    summary: string | null;
    context: string | null;
    status: string | null;
    key_files: string[];
  };
  main_task: {
    id: string;
    title: string;
    lifecycle_status: TaskCardLifecycleStatus | null;
    review_status: TaskCardReviewStatus | null;
    git_status: TaskCardGitStatus | null;
    handoff_status: TaskCardHandoffStatus | null;
  } | null;
  active_task: {
    id: string;
    title: string;
    lifecycle_status: TaskCardLifecycleStatus | null;
    review_status: TaskCardReviewStatus | null;
    git_status: TaskCardGitStatus | null;
    handoff_status: TaskCardHandoffStatus | null;
  } | null;
  queue: { id: string; title: string }[];
  backlog: BacklogItem[];
  recent_events: string[];
  recent_worklog: string[];
  resume_prompt: string | null;
  next_steps: string[];
}

export interface IntakeResult {
  source_path: string;
  active_task_id: string | null;
  queue_count: number;
}

export type IntakeSourceKind = "handoff" | "existing_pcp" | "plain_repo";

export interface IntakeSummary {
  source: IntakeSourceKind;
  source_path: string | null;
  project: {
    summary: string;
    kind: string;
    detail: string | null;
    key_files: string[];
    signals: string[];
    has_pcp: boolean;
  };
  flow: {
    active_task_id: string | null;
    active_task_title: string | null;
    queue_count: number;
    pending_review_count: number;
    pending_proposal_count: number;
  };
  records: {
    has_worklog: boolean;
    worklog_summary: string[];
    backlog_count: number;
    concern_count: number;
    changelog_summary: string[];
  };
  next_steps: string[];
}

export type IntakeAdoptionDecision = "continue" | "reference_only" | "restart";

export interface IntakeAdoptionResult {
  decision: IntakeAdoptionDecision;
  source: IntakeSourceKind;
  active_task_id: string | null;
  queue_count: number;
}

export type IntakeFollowupSection =
  | "project"
  | "worklog"
  | "backlog"
  | "concern"
  | "changelog"
  | "options";

function intakeFollowupMenu(): string[] {
  return [
    "接下来你可以继续查看：",
    "1. 查看项目概况",
    "2. 查看 worklog",
    "3. 查看 backlog",
    "4. 查看 concern",
    "5. 查看 changelog",
    "6. 其他 / 继续提问",
  ];
}

export interface PlanInput {
  source: string;
  title: string;
  tasks: string[];
}

interface ParsedInterfaceTask {
  title: string;
  detail: string;
  module: string | null;
  feature: string | null;
  interface_name: string | null;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  acceptance: string[];
}

export interface PlanRecord {
  id: string;
  source: string;
  title: string;
  raw_tasks: string[];
  task_ids: string[];
  activated_task_id: string | null;
  queued_task_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface PlanIndex {
  ids: string[];
  updated_at: string;
}

export interface TaskProposalInput {
  title: string;
  detail: string;
  kind?: "task" | "subtask";
  parent_task_id?: string | null;
  source_blueprint_id?: string | null;
  source_step_index?: number | null;
  module?: string | null;
  feature?: string | null;
  interface_name?: string | null;
  inputs?: string[];
  outputs?: string[];
  dependencies?: string[];
  acceptance?: string[];
}

export interface TaskProposalRecord {
  id: string;
  title: string;
  detail: string;
  kind: "task" | "subtask";
  parent_task_id: string | null;
  source_blueprint_id: string | null;
  source_step_index: number | null;
  module: string | null;
  feature: string | null;
  interface_name: string | null;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  acceptance: string[];
  status: "proposed" | "approved" | "rejected";
  approved_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskProposalIndex {
  ids: string[];
  updated_at: string;
}

export interface BlueprintInput {
  title: string;
  steps: string[];
}

export interface BlueprintRecord {
  id: string;
  task_id: string;
  title: string;
  steps: string[];
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface BlueprintIndex {
  ids: string[];
  updated_at: string;
}

export type TaskReviewDecision = "yes" | "no" | "skip";
export type TaskCompletionVia = "manual" | "git_commit";

export interface TaskCompletionResult {
  doneId: string;
  parentId: string | null;
  nextTaskId: string | null;
  outcome: "returned_to_parent" | "advanced" | "all_done";
}

export interface PendingCompletionResult {
  taskId: string;
  review: TaskReviewDecision;
  via: TaskCompletionVia;
}

export type TaskCardLifecycleStatus =
  | "draft"
  | "ready"
  | "doing"
  | "blocked"
  | "done"
  | "pivoted"
  | "dropped";

export type TaskCardReviewStatus =
  | "pending"
  | "human_requested"
  | "machine_requested"
  | "skipped"
  | "approved"
  | "rejected";

export type TaskCardGitStatus =
  | "none"
  | "pending"
  | "committed"
  | "pushed";

export type TaskCardHandoffStatus =
  | "none"
  | "prepared"
  | "handed_off"
  | "resumed";

export interface TaskCard {
  id: string;
  type: "main" | "sub";
  title: string;
  detail: string;
  module: string | null;
  feature: string | null;
  interface_name: string | null;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  acceptance: string[];
  created_from_goal: string | null;
  created_from_plan: string | null;
  created_by: string;
  parent_id: string | null;
  children: string[];
  hard_dependencies: string[];
  soft_dependencies: string[];
  blocked_by: string[];
  current_blueprint_id: string | null;
  lifecycle_status: TaskCardLifecycleStatus;
  review_status: TaskCardReviewStatus;
  git_status: TaskCardGitStatus;
  handoff_status: TaskCardHandoffStatus;
  queue_slot: number | null;
  started_at: string | null;
  completed_at: string | null;
  last_actor: string | null;
  user_additions: string[];
  notes: string[];
  agent_suggestions: string[];
  tool_hints: string[];
  artifacts: string[];
  created_at: string;
  updated_at: string;
}

export interface TaskCardIndex {
  ids: string[];
  updated_at: string;
}

export interface StatusActionHint {
  title: string;
  command: string;
  reason: string;
}

export interface ReviewItem {
  id: string;
  kind: "completion" | "task-proposal" | "subtask-proposal";
  title: string;
  status: string;
  reason: string;
  commands: string[];
}

export interface ReviewApplyInput {
  approve_completion?: boolean;
  approve_proposals?: string[];
  reject_proposals?: string[];
}

export interface ReviewApplyResult {
  approved_completion: boolean;
  approved_proposals: string[];
  rejected_proposals: string[];
}

export interface ParsedReviewDecision {
  approve_completion: boolean;
  approve_proposals: string[];
  reject_proposals: string[];
}

export function pcpDir(dir: string): string {
  return path.join(dir, ".opencode", "pcp");
}

export function plansDir(dir: string): string {
  return path.join(pcpDir(dir), "plans");
}

export function proposalsDir(dir: string): string {
  return path.join(pcpDir(dir), "proposals");
}

export function blueprintsDir(dir: string): string {
  return path.join(pcpDir(dir), "blueprints");
}

export function concernsDir(dir: string): string {
  return path.join(pcpDir(dir), "concerns");
}

export function taskcardsDir(dir: string): string {
  return path.join(pcpDir(dir), "taskcards");
}

function planPath(dir: string, id: string): string {
  return path.join(plansDir(dir), `${id}.json`);
}

function planIndexPath(dir: string): string {
  return path.join(plansDir(dir), "index.json");
}

function proposalPath(dir: string, id: string): string {
  return path.join(proposalsDir(dir), `${id}.json`);
}

function proposalIndexPath(dir: string): string {
  return path.join(proposalsDir(dir), "index.json");
}

function blueprintPath(dir: string, id: string): string {
  return path.join(blueprintsDir(dir), `${id}.json`);
}

function blueprintIndexPath(dir: string): string {
  return path.join(blueprintsDir(dir), "index.json");
}

function concernPath(dir: string, id: string): string {
  return path.join(concernsDir(dir), `${id}.json`);
}

function concernIndexPath(dir: string): string {
  return path.join(concernsDir(dir), "index.json");
}

function handoffJsonPath(dir: string): string {
  return path.join(pcpDir(dir), "HANDOFF.json");
}

function taskcardPath(dir: string, id: string): string {
  return path.join(taskcardsDir(dir), `${id}.json`);
}

function taskcardIndexPath(dir: string): string {
  return path.join(taskcardsDir(dir), "index.json");
}

export function ensureDir(dir: string): void {
  const d = pcpDir(dir);
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
}

export function readStack(dir: string): Stack {
  const p = path.join(pcpDir(dir), "stack.json");
  if (!fs.existsSync(p)) {
    return {
      next_id: 1,
      backlog_next_id: 1,
      plan_next_id: 1,
      blueprint_next_id: 1,
      active_stack: [],
      active_task_id: null,
      ready_tasks: [],
      completion_mode: "gated",
      pending_completion: null,
    };
  }
  try {
    const s = JSON.parse(fs.readFileSync(p, "utf8")) as Stack;
    if (s.backlog_next_id === undefined) s.backlog_next_id = 1;
    if (s.plan_next_id === undefined) s.plan_next_id = 1;
    if (s.blueprint_next_id === undefined) s.blueprint_next_id = 1;
    if (s.ready_tasks === undefined) s.ready_tasks = [];
    if (s.completion_mode === undefined) s.completion_mode = "gated";
    if (s.pending_completion === undefined) s.pending_completion = null;
    return s;
  } catch {
    return {
      next_id: 1,
      backlog_next_id: 1,
      plan_next_id: 1,
      blueprint_next_id: 1,
      active_stack: [],
      active_task_id: null,
      ready_tasks: [],
      completion_mode: "gated",
      pending_completion: null,
    };
  }
}

export function writeStack(dir: string, s: Stack): void {
  if (s.plan_next_id === undefined) {
    s.plan_next_id = 1;
  }
  if (s.blueprint_next_id === undefined) {
    s.blueprint_next_id = 1;
  }
  if (s.completion_mode === undefined) {
    s.completion_mode = "gated";
  }
  if (s.pending_completion === undefined) {
    s.pending_completion = null;
  }
  fs.writeFileSync(
    path.join(pcpDir(dir), "stack.json"),
    JSON.stringify(s, null, 2),
  );
  reconcileTaskCards(dir);
}

export function appendEvent(dir: string, event: PcpEvent): void {
  fs.appendFileSync(
    path.join(pcpDir(dir), "events.jsonl"),
    JSON.stringify(event) + "\n",
  );
}

export function mdToHtml(md: string, title: string): string {
  const body = md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/\n{2,}/g, "<br><br>")
    .replace(/---/g, "<hr>");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.6}
h1{border-bottom:2px solid #e1e4e8;padding-bottom:8px}h2{color:#24292f;margin-top:24px}
code{background:#f0f0f0;padding:2px 6px;border-radius:3px;font-size:0.9em}
li{margin:4px 0}blockquote{border-left:4px solid #dfe2e5;margin:0;padding:0 16px;color:#57606a}
hr{border:none;border-top:1px solid #d0d7de;margin:24px 0}
ul{padding-left:20px}</style></head><body>${body}</body></html>`;
}

export function writeHtml(dir: string, name: string, md: string, title: string): void {
  fs.writeFileSync(path.join(pcpDir(dir), name), mdToHtml(md, title));
}

export function appendWorklog(dir: string, line: string): void {
  const p = path.join(pcpDir(dir), "WORKLOG.md");
  const ts = new Date().toISOString().replace("T", " ").slice(0, 16);
  const header = "# PCP Worklog\n\n";
  if (!fs.existsSync(p)) fs.writeFileSync(p, header);
  fs.appendFileSync(p, `- ${ts} ${line}\n`);
  writeHtml(dir, "WORKLOG.html", fs.readFileSync(p, "utf8"), "PCP Worklog");
}

export function writeProjectFiles(dir: string, data: ProjectData): void {
  const lines = ["# 项目基线", ""];
  lines.push("## 项目基线");
  lines.push(`- 名称：${data.name}`);
  lines.push(`- 摘要：${data.summary}`);
  lines.push("");

  lines.push("## 架构概况");
  if (data.key_files.length > 0) {
    lines.push("- 关键文件：");
    lines.push(...data.key_files.map((file) => `  - ${file}`));
  } else {
    lines.push("- 关键文件：待补充");
  }
  if (data.detail) {
    lines.push("- 扫描摘要：");
    lines.push(...data.detail.split("\n").map((line) => `  ${line}`));
  } else {
    lines.push("- 扫描摘要：待补充");
  }
  if (data.extra) {
    lines.push("- 补充说明：");
    lines.push(...data.extra.split("\n").map((line) => `  ${line}`));
  }
  lines.push("");

  lines.push("## 版本路线图");
  lines.push("- v0：让 PCP 在单人、单目录、OpenCode 场景中可用。");
  lines.push("- v0.1：收口使用体验，让接手、review、follow-up 更顺。");
  lines.push("- v0.2：增强跨工具 handoff / intake 的连续性。");
  lines.push("- v0.3：加入更智能的语义和 hook 流程层。");
  lines.push("");

  lines.push("## 当前状态");
  if (data.status?.trim()) {
    lines.push(data.status.trim());
  } else {
    lines.push("> 建议手动补充：当前在哪个版本、主线在做什么、这一版还差什么。");
  }
  lines.push("");

  lines.push("## 项目约束");
  lines.push("- 正式任务必须审批后才能入队。");
  lines.push("- Blueprint 只用于复杂任务，不是每个任务必填。");
  lines.push("- intake 先对齐认知，不自动进入 plan 或执行。");
  lines.push("");

  lines.push("## 刷新规则");
  lines.push("- `PROJECT.md` 是项目基线，不是流水账。");
  lines.push("- 普通执行流不应随手改它。");
  lines.push("- 如需更新，应先提议，再由用户同意。");
  lines.push("");
  lines.push("---");
  lines.push(`*更新于 ${data.updated_at}，再次调用 pcp_init 可刷新基础扫描结果。*`);

  const md = lines.join("\n");
  fs.writeFileSync(path.join(pcpDir(dir), "PROJECT.md"), md);
  writeHtml(dir, "PROJECT.html", md, `PCP: ${data.name}`);
}

export function readProjectJson(dir: string): ProjectData | null {
  const p = path.join(pcpDir(dir), "PROJECT.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as ProjectData;
  } catch {
    return null;
  }
}

export function readProjectMd(dir: string): string | null {
  const p = path.join(pcpDir(dir), "PROJECT.md");
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}

function readMarkdownSection(md: string | null, heading: string): string | null {
  if (!md) return null;
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = md.match(new RegExp(`## ${escaped}\\n([\\s\\S]*?)(?=\\n## |\\n---|\\n*$)`));
  if (!match?.[1]) return null;
  const value = match[1].trim();
  return value || null;
}

function stripBulletPrefix(line: string): string {
  return line.replace(/^\s*[-*]\s*/, "").replace(/^\s*\d+\.\s*/, "").trim();
}

function readProjectBaselineSummary(dir: string): ProjectBaselineSummary | null {
  const projectJson = readProjectJson(dir);
  if (projectJson) {
    return {
      name: projectJson.name,
      summary: projectJson.summary,
      detail: projectJson.detail,
      key_files: projectJson.key_files,
      status: projectJson.status,
    };
  }

  const md = readProjectMd(dir);
  if (!md) return null;

  const baselineSection = readMarkdownSection(md, "项目基线");
  const architectureSection = readMarkdownSection(md, "架构概况");
  const statusSection = readMarkdownSection(md, "当前状态");

  const summaryMatch = baselineSection?.match(/摘要：(.+)/);
  const nameMatch = baselineSection?.match(/名称：(.+)/);

  const keyFiles = architectureSection
    ? architectureSection
        .split("\n")
        .filter((line) => line.trim().startsWith("-") || line.trim().startsWith("  -"))
        .map(stripBulletPrefix)
        .filter((line) => line && line !== "关键文件：" && !line.startsWith("扫描摘要"))
    : [];

  const detail = architectureSection
    ? architectureSection
        .split("\n")
        .filter((line) => !line.includes("关键文件："))
        .map((line) => line.replace(/^\s{2}/, ""))
        .join("\n")
        .trim() || null
    : null;

  const status = statusSection
    ? statusSection.replace(/^>\s?/gm, "").trim()
    : null;

  return {
    name: nameMatch?.[1]?.trim() ?? null,
    summary: summaryMatch?.[1]?.trim() ?? null,
    detail,
    key_files: keyFiles,
    status: status && !status.includes("建议手动补充") ? status : null,
  };
}

export function readEventLog(dir: string): PcpEvent[] {
  const p = path.join(pcpDir(dir), "events.jsonl");
  if (!fs.existsSync(p)) return [];

  return fs
    .readFileSync(p, "utf8")
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as PcpEvent];
      } catch {
        return [];
      }
    });
}

export function replayEvents(dir: string): Task[] {
  const tasks = new Map<string, Task>();

  for (const event of readEventLog(dir)) {
    if (event.e === "created" && event.id) {
      tasks.set(event.id, {
        id: event.id,
        type: event.type ?? "main",
        title: event.title ?? "",
        done: false,
      });
    } else if (event.e === "sub" && event.id) {
      tasks.set(event.id, {
        id: event.id,
        type: "sub",
        title: event.title ?? "",
        parent: event.parent,
        done: false,
      });
    } else if ((event.e === "done" || event.e === "pivoted") && event.id) {
      const task = tasks.get(event.id);
      if (task) {
        task.done = true;
        if (event.e === "pivoted") task.pivoted = true;
        if (event.reason) task.pivot_reason = event.reason;
      }
    } else if (event.e === "resume_set" && event.id) {
      const task = tasks.get(event.id);
      if (task) task.resume_prompt = event.prompt;
    }
  }

  return Array.from(tasks.values());
}

export function replayBacklog(dir: string): BacklogItem[] {
  const items = new Map<string, BacklogItem>();

  for (const event of readEventLog(dir)) {
    if (event.e === "backlog_add" && event.id) {
      items.set(event.id, {
        id: event.id,
        title: event.title ?? "",
        detail: event.detail,
        status: "pending",
      });
    } else if (event.e === "backlog_promote" && event.backlog_id) {
      const item = items.get(event.backlog_id);
      if (item) {
        item.status = "promoted";
        item.promoted_to = event.task_id;
      }
    } else if (event.e === "backlog_dismiss" && event.backlog_id) {
      const item = items.get(event.backlog_id);
      if (item) item.status = "dismissed";
    }
  }

  return Array.from(items.values());
}

export function getPendingBacklog(dir: string): BacklogItem[] {
  return replayBacklog(dir).filter((item) => item.status === "pending");
}

export function getTask(tasks: Task[], id: string): Task | undefined {
  return tasks.find((task) => task.id === id);
}

export function readProjectContext(dir: string): string | null {
  let latest: string | null = null;
  for (const event of readEventLog(dir)) {
    if (event.e === "project_context" && event.summary) {
      latest = event.summary;
    }
  }
  return latest;
}

export function readTaskCard(dir: string, id: string): TaskCard | null {
  const cardPath = taskcardPath(dir, id);
  if (!fs.existsSync(cardPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(cardPath, "utf8")) as TaskCard;
  } catch {
    return null;
  }
}

export function readPlan(dir: string, id: string): PlanRecord | null {
  const recordPath = planPath(dir, id);
  if (!fs.existsSync(recordPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(recordPath, "utf8")) as PlanRecord;
  } catch {
    return null;
  }
}

export function readTaskProposal(dir: string, id: string): TaskProposalRecord | null {
  const recordPath = proposalPath(dir, id);
  if (!fs.existsSync(recordPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(recordPath, "utf8")) as TaskProposalRecord;
  } catch {
    return null;
  }
}

export function readBlueprint(dir: string, id: string): BlueprintRecord | null {
  const recordPath = blueprintPath(dir, id);
  if (!fs.existsSync(recordPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(recordPath, "utf8")) as BlueprintRecord;
  } catch {
    return null;
  }
}

export function readConcern(dir: string, id: string): ConcernRecord | null {
  const recordPath = concernPath(dir, id);
  if (!fs.existsSync(recordPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(recordPath, "utf8")) as ConcernRecord;
  } catch {
    return null;
  }
}

export function listTaskProposals(dir: string): TaskProposalRecord[] {
  const recordsPath = proposalsDir(dir);
  if (!fs.existsSync(recordsPath)) return [];

  return fs.readdirSync(recordsPath)
    .filter((file) => file.endsWith(".json") && file !== "index.json")
    .flatMap((file) => {
      try {
        return [
          JSON.parse(fs.readFileSync(path.join(recordsPath, file), "utf8")) as TaskProposalRecord,
        ];
      } catch {
        return [];
      }
    })
    .sort((a, b) => {
      const rank = (proposal: TaskProposalRecord): number => {
        if (proposal.status === "proposed") return 0;
        if (proposal.status === "approved") return 1;
        return 2;
      };
      const byStatus = rank(a) - rank(b);
      if (byStatus !== 0) return byStatus;
      return a.id.localeCompare(b.id);
    });
}

export function listBlueprints(dir: string): BlueprintRecord[] {
  const recordsPath = blueprintsDir(dir);
  if (!fs.existsSync(recordsPath)) return [];

  return fs.readdirSync(recordsPath)
    .filter((file) => file.endsWith(".json") && file !== "index.json")
    .flatMap((file) => {
      try {
        return [
          JSON.parse(fs.readFileSync(path.join(recordsPath, file), "utf8")) as BlueprintRecord,
        ];
      } catch {
        return [];
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function listPlans(dir: string): PlanRecord[] {
  const recordsPath = plansDir(dir);
  if (!fs.existsSync(recordsPath)) return [];

  return fs.readdirSync(recordsPath)
    .filter((file) => file.endsWith(".json") && file !== "index.json")
    .flatMap((file) => {
      try {
        return [
          JSON.parse(fs.readFileSync(path.join(recordsPath, file), "utf8")) as PlanRecord,
        ];
      } catch {
        return [];
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function listTaskCards(dir: string): TaskCard[] {
  const cardsPath = taskcardsDir(dir);
  if (!fs.existsSync(cardsPath)) return [];

  return fs.readdirSync(cardsPath)
    .filter((file) => file.endsWith(".json") && file !== "index.json")
    .flatMap((file) => {
      try {
        return [
          JSON.parse(fs.readFileSync(path.join(cardsPath, file), "utf8")) as TaskCard,
        ];
      } catch {
        return [];
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function listConcerns(dir: string): ConcernRecord[] {
  const recordsPath = concernsDir(dir);
  if (!fs.existsSync(recordsPath)) return [];

  return fs.readdirSync(recordsPath)
    .filter((file) => file.endsWith(".json") && file !== "index.json")
    .flatMap((file) => {
      try {
        return [
          JSON.parse(fs.readFileSync(path.join(recordsPath, file), "utf8")) as ConcernRecord,
        ];
      } catch {
        return [];
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

function writeTaskProposalIndex(dir: string, ids: string[]): void {
  ensureDir(dir);
  const recordsPath = proposalsDir(dir);
  if (!fs.existsSync(recordsPath)) {
    fs.mkdirSync(recordsPath, { recursive: true });
  }
  const index: TaskProposalIndex = {
    ids,
    updated_at: new Date().toISOString(),
  };
  fs.writeFileSync(proposalIndexPath(dir), JSON.stringify(index, null, 2));
}

function writeBlueprintIndex(dir: string, ids: string[]): void {
  ensureDir(dir);
  const recordsPath = blueprintsDir(dir);
  if (!fs.existsSync(recordsPath)) {
    fs.mkdirSync(recordsPath, { recursive: true });
  }
  const index: BlueprintIndex = {
    ids,
    updated_at: new Date().toISOString(),
  };
  fs.writeFileSync(blueprintIndexPath(dir), JSON.stringify(index, null, 2));
}

function writePlanIndex(dir: string, ids: string[]): void {
  ensureDir(dir);
  const recordsPath = plansDir(dir);
  if (!fs.existsSync(recordsPath)) {
    fs.mkdirSync(recordsPath, { recursive: true });
  }
  const index: PlanIndex = {
    ids,
    updated_at: new Date().toISOString(),
  };
  fs.writeFileSync(planIndexPath(dir), JSON.stringify(index, null, 2));
}

function writeConcernIndex(dir: string, ids: string[]): void {
  ensureDir(dir);
  const recordsPath = concernsDir(dir);
  if (!fs.existsSync(recordsPath)) {
    fs.mkdirSync(recordsPath, { recursive: true });
  }
  const index: ConcernIndex = {
    ids,
    updated_at: new Date().toISOString(),
  };
  fs.writeFileSync(concernIndexPath(dir), JSON.stringify(index, null, 2));
}

function writeTaskProposalFile(dir: string, proposal: TaskProposalRecord): void {
  ensureDir(dir);
  const recordsPath = proposalsDir(dir);
  if (!fs.existsSync(recordsPath)) {
    fs.mkdirSync(recordsPath, { recursive: true });
  }
  fs.writeFileSync(proposalPath(dir, proposal.id), JSON.stringify(proposal, null, 2));
}

function writeBlueprintFile(dir: string, blueprint: BlueprintRecord): void {
  ensureDir(dir);
  const recordsPath = blueprintsDir(dir);
  if (!fs.existsSync(recordsPath)) {
    fs.mkdirSync(recordsPath, { recursive: true });
  }
  fs.writeFileSync(blueprintPath(dir, blueprint.id), JSON.stringify(blueprint, null, 2));
}

function writePlanFile(dir: string, plan: PlanRecord): void {
  ensureDir(dir);
  const recordsPath = plansDir(dir);
  if (!fs.existsSync(recordsPath)) {
    fs.mkdirSync(recordsPath, { recursive: true });
  }
  fs.writeFileSync(planPath(dir, plan.id), JSON.stringify(plan, null, 2));
}

function writeConcernFile(dir: string, concern: ConcernRecord): void {
  ensureDir(dir);
  const recordsPath = concernsDir(dir);
  if (!fs.existsSync(recordsPath)) {
    fs.mkdirSync(recordsPath, { recursive: true });
  }
  fs.writeFileSync(concernPath(dir, concern.id), JSON.stringify(concern, null, 2));
}

function writeTaskCardIndex(dir: string, ids: string[]): void {
  ensureDir(dir);
  const cardsPath = taskcardsDir(dir);
  if (!fs.existsSync(cardsPath)) {
    fs.mkdirSync(cardsPath, { recursive: true });
  }
  const index: TaskCardIndex = {
    ids,
    updated_at: new Date().toISOString(),
  };
  fs.writeFileSync(taskcardIndexPath(dir), JSON.stringify(index, null, 2));
}

function writeTaskCardFile(dir: string, card: TaskCard): void {
  ensureDir(dir);
  const cardsPath = taskcardsDir(dir);
  if (!fs.existsSync(cardsPath)) {
    fs.mkdirSync(cardsPath, { recursive: true });
  }
  fs.writeFileSync(taskcardPath(dir, card.id), JSON.stringify(card, null, 2));
}

export function createConcern(dir: string, input: ConcernInput): ConcernRecord {
  ensureDir(dir);
  const concerns = listConcerns(dir);
  const id = `C${String(concerns.length + 1).padStart(3, "0")}`;
  const now = new Date().toISOString();
  const concern: ConcernRecord = {
    id,
    title: input.title,
    detail: input.detail,
    tags: [...input.tags],
    status: "open",
    created_at: now,
    updated_at: now,
  };
  writeConcernFile(dir, concern);
  writeConcernIndex(dir, listConcerns(dir).map((item) => item.id));
  return concern;
}

export function matchConcerns(dir: string, tags: string[]): ConcernMatch[] {
  const queryTags = new Set(tags);
  return listConcerns(dir)
    .map((concern) => {
      const matchedTags = concern.tags.filter((tag) => queryTags.has(tag));
      return { concern, matched_tags: matchedTags };
    })
    .filter((item) => item.matched_tags.length > 0)
    .sort((a, b) => {
      const byMatches = b.matched_tags.length - a.matched_tags.length;
      if (byMatches !== 0) return byMatches;
      return a.concern.id.localeCompare(b.concern.id);
    });
}

export function writeTaskCard(dir: string, card: TaskCard): void {
  writeTaskCardFile(dir, {
    ...card,
    updated_at: new Date().toISOString(),
  });
  writeTaskCardIndex(dir, listTaskCards(dir).map((item) => item.id));
}

export function createBlueprint(dir: string, input: BlueprintInput): BlueprintRecord {
  ensureDir(dir);
  const stack = readStack(dir);
  if (!stack.active_task_id) {
    throw new Error("No active task");
  }

  const activeCard = readTaskCard(dir, stack.active_task_id);
  if (!activeCard || activeCard.lifecycle_status !== "doing") {
    throw new Error("Blueprint requires an active doing task");
  }

  const now = new Date().toISOString();
  const blueprintId = `BP${String(stack.blueprint_next_id ?? 1).padStart(3, "0")}`;

  if (activeCard.current_blueprint_id) {
    const previous = readBlueprint(dir, activeCard.current_blueprint_id);
    if (previous) {
      writeBlueprintFile(dir, {
        ...previous,
        status: "archived",
        updated_at: now,
      });
    }
  }

  const blueprint: BlueprintRecord = {
    id: blueprintId,
    task_id: stack.active_task_id,
    title: input.title,
    steps: [...input.steps],
    status: "active",
    created_at: now,
    updated_at: now,
  };
  writeBlueprintFile(dir, blueprint);
  writeBlueprintIndex(dir, listBlueprints(dir).map((item) => item.id));
  stack.blueprint_next_id = (stack.blueprint_next_id ?? 1) + 1;
  writeStack(dir, stack);
  writeTaskCard(dir, {
    ...activeCard,
    current_blueprint_id: blueprint.id,
    updated_at: now,
  });
  return blueprint;
}

export function createTaskProposal(dir: string, input: TaskProposalInput): TaskProposalRecord {
  ensureDir(dir);
  const proposals = listTaskProposals(dir);
  const id = `TP${String(proposals.length + 1).padStart(3, "0")}`;
  const now = new Date().toISOString();
  const proposal: TaskProposalRecord = {
    id,
    title: input.title,
    detail: input.detail,
    kind: input.kind ?? "task",
    parent_task_id: input.parent_task_id ?? null,
    source_blueprint_id: input.source_blueprint_id ?? null,
    source_step_index: input.source_step_index ?? null,
    module: input.module ?? null,
    feature: input.feature ?? null,
    interface_name: input.interface_name ?? null,
    inputs: input.inputs ?? [],
    outputs: input.outputs ?? [],
    dependencies: input.dependencies ?? [],
    acceptance: input.acceptance ?? [],
    status: "proposed",
    approved_task_id: null,
    created_at: now,
    updated_at: now,
  };
  writeTaskProposalFile(dir, proposal);
  writeTaskProposalIndex(dir, listTaskProposals(dir).map((item) => item.id));
  return proposal;
}

export function createBlueprintSubtaskProposal(
  dir: string,
  input: { step_index: number; detail?: string },
): TaskProposalRecord {
  ensureDir(dir);
  const stack = readStack(dir);
  if (!stack.active_task_id) {
    throw new Error("No active task");
  }

  const activeCard = readTaskCard(dir, stack.active_task_id);
  if (!activeCard || activeCard.lifecycle_status !== "doing") {
    throw new Error("Blueprint subtask proposal requires an active doing task");
  }
  if (!activeCard.current_blueprint_id) {
    throw new Error("Current task has no blueprint");
  }

  const blueprint = readBlueprint(dir, activeCard.current_blueprint_id);
  if (!blueprint || blueprint.status !== "active") {
    throw new Error("Active blueprint not found");
  }

  const index = input.step_index - 1;
  if (index < 0 || index >= blueprint.steps.length) {
    throw new Error("Blueprint step index out of range");
  }

  const stepTitle = blueprint.steps[index];
  const detail =
    input.detail ??
    `来自蓝图 ${blueprint.id} 第 ${input.step_index} 步：${stepTitle}`;

  return createTaskProposal(dir, {
    title: stepTitle,
    detail,
    kind: "subtask",
    parent_task_id: activeCard.id,
    source_blueprint_id: blueprint.id,
    source_step_index: input.step_index,
  });
}

export function shouldSuggestBlueprint(
  activeCard: TaskCard | null,
  pendingProposals: TaskProposalRecord[],
): boolean {
  if (!activeCard) return false;
  if (activeCard.lifecycle_status !== "doing") return false;
  if (activeCard.current_blueprint_id) return false;

  if (activeCard.title.trim().length >= 12) return true;
  if (activeCard.detail.trim().length >= 40) return true;
  if (activeCard.acceptance.length >= 2) return true;
  if (pendingProposals.some((item) => item.parent_task_id === activeCard.id)) return true;

  return false;
}

export function buildStatusActionHints(input: {
  stack: Stack;
  activeCard: TaskCard | null;
  pendingProposals: TaskProposalRecord[];
  pendingBacklogCount: number;
}): StatusActionHint[] {
  const hints: StatusActionHint[] = [];
  const { stack, activeCard, pendingProposals, pendingBacklogCount } = input;

  if (stack.pending_completion) {
    hints.push({
      title: "先处理当前任务完成审批",
      command: "pcp_approve",
      reason: `任务 ${stack.pending_completion.task_id} 已提交完成汇报，当前应先决定是否继续推进。`,
    });
    return hints;
  }

  if (pendingProposals.length > 0) {
    hints.push({
      title: "先 review 待批准提议",
      command: "pcp_list_task_proposals",
      reason: `当前有 ${pendingProposals.length} 个待批准 proposal，先看清楚再决定是否入队。`,
    });
  }

  if (!stack.active_task_id) {
    if (stack.ready_tasks.length > 0) {
      hints.push({
        title: "继续当前队列",
        command: "pcp_status",
        reason: `当前没有 active task，但队列里还有 ${stack.ready_tasks.length} 个正式任务待执行。`,
      });
    } else {
      hints.push({
        title: "先规划下一轮任务",
        command: "pcp_plan",
        reason: "当前没有 active task，也没有已装载队列，下一步应该先做 plan。",
      });
    }

    if (pendingBacklogCount > 0) {
      hints.push({
        title: "顺手回顾 backlog",
        command: "pcp_backlog",
        reason: `Backlog 里还有 ${pendingBacklogCount} 项待回顾。`,
      });
    }

    return hints;
  }

  if (shouldSuggestBlueprint(activeCard, pendingProposals)) {
    hints.push({
      title: "当前任务较复杂，考虑先建 Blueprint",
      command: "pcp_blueprint_create",
      reason: `任务 ${activeCard?.id ?? stack.active_task_id} 还没有 Blueprint，先补执行大纲会更稳。`,
    });
  }

  if (activeCard?.current_blueprint_id) {
    hints.push({
      title: "查看当前 Blueprint",
      command: "pcp_blueprint_show",
      reason: `当前任务已绑定 Blueprint ${activeCard.current_blueprint_id}，可以先确认这次执行展开图。`,
    });
  }

  if (pendingBacklogCount > 0) {
    hints.push({
      title: "需要时回顾 backlog",
      command: "pcp_backlog",
      reason: `当前主线之外还有 ${pendingBacklogCount} 项 backlog。`,
    });
  }

  return hints;
}

export function buildReviewItems(input: {
  stack: Stack;
  activeCard: TaskCard | null;
  pendingProposals: TaskProposalRecord[];
}): ReviewItem[] {
  const items: ReviewItem[] = [];
  const { stack, activeCard, pendingProposals } = input;

  if (stack.pending_completion) {
    items.push({
      id: stack.pending_completion.task_id,
      kind: "completion",
      title: activeCard?.title ?? stack.pending_completion.task_id,
      status: "pending_completion",
      reason: `任务 ${stack.pending_completion.task_id} 已提交完成汇报，等待用户决定是否继续推进。`,
      commands: ["pcp_approve"],
    });
  }

  for (const proposal of pendingProposals) {
    items.push({
      id: proposal.id,
      kind: proposal.kind === "subtask" ? "subtask-proposal" : "task-proposal",
      title: proposal.title,
      status: proposal.status,
      reason:
        proposal.kind === "subtask"
          ? `子任务提议仍待批准，父任务是 ${proposal.parent_task_id ?? "unknown"}。`
          : "正式任务提议仍待批准，尚未进入队列。",
      commands: [
        `pcp_approve_task_proposal({ proposal_id: "${proposal.id}" })`,
        `pcp_reject_task_proposal({ proposal_id: "${proposal.id}" })`,
      ],
    });
  }

  return items;
}

export function applyReviewActions(
  dir: string,
  input: ReviewApplyInput,
): ReviewApplyResult {
  ensureDir(dir);
  const result: ReviewApplyResult = {
    approved_completion: false,
    approved_proposals: [],
    rejected_proposals: [],
  };

  if (input.approve_completion) {
    const stack = readStack(dir);
    if (!stack.pending_completion) {
      throw new Error("No pending completion to approve");
    }
    approvePendingCompletion(dir);
    result.approved_completion = true;
  }

  for (const proposalId of input.approve_proposals ?? []) {
    approveTaskProposal(dir, proposalId);
    result.approved_proposals.push(proposalId);
  }

  for (const proposalId of input.reject_proposals ?? []) {
    rejectTaskProposal(dir, proposalId);
    result.rejected_proposals.push(proposalId);
  }

  return result;
}

export function parseReviewDecisionText(
  text: string,
  context: { stack: Stack; pendingProposals: TaskProposalRecord[] },
): ParsedReviewDecision {
  const parsed: ParsedReviewDecision = {
    approve_completion: false,
    approve_proposals: [],
    reject_proposals: [],
  };
  const pendingProposals = context.pendingProposals.filter((item) => item.status === "proposed");
  const byOrder = pendingProposals;
  const seenApprove = new Set<string>();
  const seenReject = new Set<string>();

  const segments = text
    .split(/(?:，|,|；|;|。|\band\b|然后|并且|同时)/i)
    .map((item) => item.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const lower = segment.toLowerCase();
    const isApprove = /批准|通过|approve|accept|confirm/.test(lower);
    const isReject = /拒绝|不要|reject|decline/.test(lower);
    if (!isApprove && !isReject) continue;

    if (/(完成|completion|done)/.test(lower)) {
      if (isReject) {
        throw new Error("Rejecting completion is not supported yet");
      }
      if (!context.stack.pending_completion) {
        throw new Error("No pending completion to approve");
      }
      parsed.approve_completion = true;
      continue;
    }

    if (/(proposal|提议)/.test(lower) || /TP\d+/i.test(segment)) {
      const targetIds = resolveProposalTargets(segment, byOrder);
      if (targetIds.length === 0) {
        throw new Error(`Could not resolve proposal target from: ${segment}`);
      }
      if (isApprove) {
        for (const id of targetIds) {
          if (!seenApprove.has(id)) {
            parsed.approve_proposals.push(id);
            seenApprove.add(id);
          }
        }
      }
      if (isReject) {
        for (const id of targetIds) {
          if (!seenReject.has(id)) {
            parsed.reject_proposals.push(id);
            seenReject.add(id);
          }
        }
      }
    }
  }

  return parsed;
}

function resolveProposalTargets(segment: string, proposals: TaskProposalRecord[]): string[] {
  if (proposals.length === 0) return [];

  if (/(全部|所有|all)/i.test(segment)) {
    return proposals.map((item) => item.id);
  }

  const ids = Array.from(new Set((segment.match(/TP\d+/gi) ?? []).map((id) => id.toUpperCase())));
  if (ids.length > 0) return ids;

  const ordinal = resolveOrdinalIndex(segment);
  if (ordinal !== null) {
    const proposal = proposals[ordinal];
    return proposal ? [proposal.id] : [];
  }

  if (/(proposal|提议)/i.test(segment) && proposals.length === 1) {
    return [proposals[0].id];
  }

  return [];
}

function resolveOrdinalIndex(segment: string): number | null {
  const lower = segment.toLowerCase();
  if (/第?一(个)?|first/.test(lower)) return 0;
  if (/第?二(个)?|second/.test(lower)) return 1;
  if (/第?三(个)?|third/.test(lower)) return 2;
  const digitMatch = lower.match(/第?\s*(\d+)\s*个?/);
  if (digitMatch) {
    return Math.max(0, Number.parseInt(digitMatch[1] ?? "1", 10) - 1);
  }
  return null;
}

export function approveTaskProposal(
  dir: string,
  proposalId: string,
): { proposal_id: string; task_id: string } {
  ensureDir(dir);
  const proposal = readTaskProposal(dir, proposalId);
  if (!proposal) {
    throw new Error("Proposal not found");
  }
  if (proposal.status !== "proposed") {
    throw new Error("Proposal is not pending");
  }

  const stack = readStack(dir);
  const taskId = `T${String(stack.next_id).padStart(3, "0")}`;
  if (proposal.kind === "subtask") {
    if (!proposal.parent_task_id) {
      throw new Error("Subtask proposal requires parent_task_id");
    }
    const tasks = replayEvents(dir);
    const parentTitle = getTask(tasks, proposal.parent_task_id)?.title ?? proposal.parent_task_id;
    appendEvent(dir, {
      e: "resume_set",
      id: proposal.parent_task_id,
      prompt: `准备进入子任务【${proposal.title}】，完成后继续主任务：${parentTitle}。`,
      ts: Date.now(),
    });
    appendEvent(dir, {
      e: "sub",
      id: taskId,
      parent: proposal.parent_task_id,
      title: proposal.title,
      ts: Date.now(),
    });
  } else {
    appendEvent(dir, { e: "created", id: taskId, type: "main", title: proposal.title, ts: Date.now() });
  }
  stack.next_id++;

  if (proposal.kind === "subtask") {
    if (!proposal.parent_task_id) {
      throw new Error("Subtask proposal requires parent_task_id");
    }
    const parentIndex = stack.active_stack.indexOf(proposal.parent_task_id);
    if (parentIndex === -1) {
      throw new Error("Parent task is not active");
    }
    stack.active_stack = [...stack.active_stack.slice(0, parentIndex + 1), taskId];
    stack.active_task_id = taskId;
  } else if (stack.active_task_id) {
    stack.ready_tasks = [...stack.ready_tasks, { id: taskId, title: proposal.title }];
  } else {
    stack.active_stack = [taskId];
    stack.active_task_id = taskId;
  }

  writeTaskProposalFile(dir, {
    ...proposal,
    status: "approved",
    approved_task_id: taskId,
    updated_at: new Date().toISOString(),
  });
  writeTaskProposalIndex(dir, listTaskProposals(dir).map((item) => item.id));
  writeStack(dir, stack);
  const taskCard = readTaskCard(dir, taskId);
  if (taskCard) {
    writeTaskCard(dir, {
      ...taskCard,
      module: proposal.module,
      feature: proposal.feature,
      interface_name: proposal.interface_name,
      inputs: [...proposal.inputs],
      outputs: [...proposal.outputs],
      dependencies: [...proposal.dependencies],
      acceptance: proposal.acceptance.length > 0 ? [...proposal.acceptance] : taskCard.acceptance,
    });
  }

  return { proposal_id: proposalId, task_id: taskId };
}

export function rejectTaskProposal(dir: string, proposalId: string): TaskProposalRecord {
  ensureDir(dir);
  const proposal = readTaskProposal(dir, proposalId);
  if (!proposal) {
    throw new Error("Proposal not found");
  }
  const updated: TaskProposalRecord = {
    ...proposal,
    status: "rejected",
    updated_at: new Date().toISOString(),
  };
  writeTaskProposalFile(dir, updated);
  writeTaskProposalIndex(dir, listTaskProposals(dir).map((item) => item.id));
  return updated;
}

function deriveLifecycleStatus(task: Task, stack: Stack): TaskCardLifecycleStatus {
  if (task.pivoted) return "pivoted";
  if (task.done) return "done";
  if (task.id === stack.active_task_id) return "doing";
  if (stack.active_stack.includes(task.id)) return "doing";
  if (stack.ready_tasks.some((queued) => queued.id === task.id)) return "ready";
  return "draft";
}

function parseInterfaceTask(rawTask: string): ParsedInterfaceTask {
  const trimmed = rawTask.trim();
  const parsed: ParsedInterfaceTask = {
    title: trimmed,
    detail: "",
    module: null,
    feature: null,
    interface_name: null,
    inputs: [],
    outputs: [],
    dependencies: [],
    acceptance: [],
  };

  if (!trimmed.includes("模块:") && !trimmed.includes("功能:") && !trimmed.includes("接口:")) {
    return parsed;
  }

  const segments = trimmed
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const [rawKey, ...rest] = segment.split(":");
    const key = rawKey?.trim();
    const value = rest.join(":").trim();
    if (!key || !value) continue;
    const values = value.split(",").map((item) => item.trim()).filter(Boolean);

    if (key === "模块") parsed.module = value;
    else if (key === "功能") parsed.feature = value;
    else if (key === "接口") parsed.interface_name = value;
    else if (key === "输入") parsed.inputs = values;
    else if (key === "输出") parsed.outputs = values;
    else if (key === "依赖") parsed.dependencies = values;
    else if (key === "验收") parsed.acceptance = values;
  }

  const titleParts = [parsed.module, parsed.feature, parsed.interface_name].filter(Boolean);
  if (titleParts.length > 0) {
    parsed.title = titleParts.join(" / ");
  }

  const detailParts: string[] = [];
  if (parsed.inputs.length > 0) detailParts.push(`输入：${parsed.inputs.join(", ")}`);
  if (parsed.outputs.length > 0) detailParts.push(`输出：${parsed.outputs.join(", ")}`);
  if (parsed.dependencies.length > 0) detailParts.push(`依赖：${parsed.dependencies.join(", ")}`);
  parsed.detail = detailParts.join("；");

  return parsed;
}

function deriveReviewStatus(decision: TaskReviewDecision): TaskCardReviewStatus {
  if (decision === "yes") return "approved";
  if (decision === "no") return "machine_requested";
  return "skipped";
}

function applyPendingCompletionState(
  dir: string,
  taskId: string,
  options: { review: TaskReviewDecision; via: TaskCompletionVia },
): void {
  const existingCard = readTaskCard(dir, taskId);
  if (!existingCard) return;

  writeTaskCard(dir, {
    ...existingCard,
    lifecycle_status: "doing",
    review_status: deriveReviewStatus(options.review),
    git_status: options.via === "git_commit" ? "committed" : "pending",
    last_actor: options.via === "git_commit" ? "git-hook" : "pcp_done",
  });
}

function completeActiveTaskInternal(
  dir: string,
  options: { review: TaskReviewDecision; via: TaskCompletionVia },
): TaskCompletionResult {
  ensureDir(dir);
  const stack = readStack(dir);
  if (!stack.active_task_id) {
    throw new Error("No active task");
  }

  const doneId = stack.active_task_id;
  const parentIdBeforePop =
    stack.active_stack.length > 1 ? stack.active_stack[stack.active_stack.length - 2] : null;
  const existingCard = readTaskCard(dir, doneId);
  const now = new Date().toISOString();

  if (existingCard) {
    writeTaskCard(dir, {
      ...existingCard,
      lifecycle_status: "done",
      review_status: deriveReviewStatus(options.review),
      git_status: options.via === "git_commit" ? "committed" : "pending",
      completed_at: now,
      last_actor: options.via === "git_commit" ? "git-hook" : "pcp_done",
    });
  }

  appendEvent(dir, { e: "done", id: doneId, ts: Date.now() });
  stack.active_stack.pop();
  stack.pending_completion = null;

  if (stack.active_stack.length > 0) {
    const parentId = stack.active_stack[stack.active_stack.length - 1];
    stack.active_task_id = parentId;
    writeStack(dir, stack);
    return {
      doneId,
      parentId,
      nextTaskId: null,
      outcome: "returned_to_parent",
    };
  }

  if (stack.ready_tasks.length > 0) {
    const next = stack.ready_tasks.shift()!;
    stack.active_stack = [next.id];
    stack.active_task_id = next.id;
    writeStack(dir, stack);
    return {
      doneId,
      parentId: parentIdBeforePop,
      nextTaskId: next.id,
      outcome: "advanced",
    };
  }

  stack.active_task_id = null;
  writeStack(dir, stack);
  return {
    doneId,
    parentId: parentIdBeforePop,
    nextTaskId: null,
    outcome: "all_done",
  };
}

export function setCompletionMode(dir: string, mode: CompletionMode): Stack {
  ensureDir(dir);
  const stack = readStack(dir);
  stack.completion_mode = mode;
  writeStack(dir, stack);
  return stack;
}

export function requestTaskCompletion(
  dir: string,
  options: { review: TaskReviewDecision; via: TaskCompletionVia },
): PendingCompletionResult {
  ensureDir(dir);
  const stack = readStack(dir);
  if (!stack.active_task_id) {
    throw new Error("No active task");
  }

  stack.pending_completion = {
    task_id: stack.active_task_id,
    review: options.review,
    via: options.via,
    requested_at: new Date().toISOString(),
  };
  writeStack(dir, stack);
  applyPendingCompletionState(dir, stack.active_task_id, options);

  return {
    taskId: stack.active_task_id,
    review: options.review,
    via: options.via,
  };
}

export function approvePendingCompletion(dir: string): TaskCompletionResult {
  ensureDir(dir);
  const stack = readStack(dir);
  const pending = stack.pending_completion;
  if (!pending || !stack.active_task_id || pending.task_id !== stack.active_task_id) {
    throw new Error("No pending completion");
  }
  return completeActiveTaskInternal(dir, {
    review: pending.review,
    via: pending.via,
  });
}

export function compilePlan(
  dir: string,
  input: PlanInput,
): { plan: PlanRecord; created: { id: string; title: string }[] } {
  ensureDir(dir);
  const stack = readStack(dir);
  const now = new Date().toISOString();
  const planId = `P${String(stack.plan_next_id ?? 1).padStart(3, "0")}`;
  const created: { id: string; title: string }[] = [];

  for (const rawTask of input.tasks) {
    const parsedTask = parseInterfaceTask(rawTask);
    const id = `T${String(stack.next_id).padStart(3, "0")}`;
    appendEvent(dir, { e: "created", id, type: "main", title: parsedTask.title, ts: Date.now() });
    created.push({ id, title: parsedTask.title });
    stack.next_id++;
  }

  let activatedTaskId: string | null = null;
  let queuedTaskIds: string[] = [];
  if (created.length > 0) {
    if (stack.active_task_id) {
      stack.ready_tasks = [...stack.ready_tasks, ...created];
      queuedTaskIds = created.map((task) => task.id);
    } else {
      const [first, ...rest] = created;
      stack.active_stack = [first.id];
      stack.active_task_id = first.id;
      stack.ready_tasks = [...stack.ready_tasks, ...rest];
      activatedTaskId = first.id;
      queuedTaskIds = rest.map((task) => task.id);
    }
  }

  const plan: PlanRecord = {
    id: planId,
    source: input.source,
    title: input.title,
    raw_tasks: [...input.tasks],
    task_ids: created.map((task) => task.id),
    activated_task_id: activatedTaskId,
    queued_task_ids: queuedTaskIds,
    created_at: now,
    updated_at: now,
  };

  writePlanFile(dir, plan);
  writePlanIndex(dir, listPlans(dir).map((item) => item.id));
  stack.plan_next_id = (stack.plan_next_id ?? 1) + 1;
  writeStack(dir, stack);
  for (let index = 0; index < created.length; index++) {
    const parsedTask = parseInterfaceTask(input.tasks[index] ?? created[index]!.title);
    const taskCard = readTaskCard(dir, created[index]!.id);
    if (!taskCard) continue;
    writeTaskCard(dir, {
      ...taskCard,
      title: parsedTask.title,
      detail: parsedTask.detail || taskCard.detail,
      module: parsedTask.module,
      feature: parsedTask.feature,
      interface_name: parsedTask.interface_name,
      inputs: parsedTask.inputs,
      outputs: parsedTask.outputs,
      dependencies: parsedTask.dependencies,
      acceptance: parsedTask.acceptance.length > 0 ? parsedTask.acceptance : taskCard.acceptance,
    });
  }

  return { plan, created };
}

export function completeActiveTask(
  dir: string,
  options: { review: TaskReviewDecision; via: TaskCompletionVia },
): TaskCompletionResult {
  const stack = readStack(dir);
  if ((stack.completion_mode ?? "gated") === "gated") {
    throw new Error("Completion requires approval in gated mode");
  }
  return completeActiveTaskInternal(dir, options);
}

export function reconcileTaskCards(dir: string): TaskCard[] {
  ensureDir(dir);
  const stack = readStack(dir);
  const tasks = replayEvents(dir);
  const existing = new Map(listTaskCards(dir).map((card) => [card.id, card]));
  const taskPlanMap = new Map<string, string>();
  const childMap = new Map<string, string[]>();
  const now = new Date().toISOString();

  for (const plan of listPlans(dir)) {
    for (const taskId of plan.task_ids) {
      taskPlanMap.set(taskId, plan.id);
    }
  }

  for (const task of tasks) {
    if (!task.parent) continue;
    const children = childMap.get(task.parent) ?? [];
    children.push(task.id);
    childMap.set(task.parent, children);
  }

  const cards = tasks.map((task) => {
    const existingCard = existing.get(task.id);
    const lifecycleStatus = deriveLifecycleStatus(task, stack);
    const queueSlot = stack.ready_tasks.findIndex((queued) => queued.id === task.id);
    const startedAt =
      lifecycleStatus === "doing"
        ? existingCard?.started_at ?? now
        : existingCard?.started_at ?? null;
    const completedAt =
      lifecycleStatus === "done" || lifecycleStatus === "pivoted"
        ? existingCard?.completed_at ?? now
        : existingCard?.completed_at ?? null;

    const card: TaskCard = {
      id: task.id,
      type: task.type,
      title: existingCard?.title ?? task.title,
      detail: existingCard?.detail ?? "",
      module: existingCard?.module ?? null,
      feature: existingCard?.feature ?? null,
      interface_name: existingCard?.interface_name ?? null,
      inputs: existingCard?.inputs ?? [],
      outputs: existingCard?.outputs ?? [],
      dependencies: existingCard?.dependencies ?? [],
      acceptance: existingCard?.acceptance ?? [],
      created_from_goal: existingCard?.created_from_goal ?? null,
      created_from_plan: existingCard?.created_from_plan ?? taskPlanMap.get(task.id) ?? null,
      created_by: existingCard?.created_by ?? "pcp-runtime",
      parent_id: task.parent ?? existingCard?.parent_id ?? null,
      children: childMap.get(task.id) ?? existingCard?.children ?? [],
      hard_dependencies: existingCard?.hard_dependencies ?? [],
      soft_dependencies: existingCard?.soft_dependencies ?? [],
      blocked_by: existingCard?.blocked_by ?? [],
      current_blueprint_id: existingCard?.current_blueprint_id ?? null,
      lifecycle_status: lifecycleStatus,
      review_status: existingCard?.review_status ?? "pending",
      git_status: existingCard?.git_status ?? "none",
      handoff_status: existingCard?.handoff_status ?? "none",
      queue_slot: queueSlot >= 0 ? queueSlot : null,
      started_at: startedAt,
      completed_at: completedAt,
      last_actor: existingCard?.last_actor ?? "pcp-runtime",
      user_additions: existingCard?.user_additions ?? [],
      notes: existingCard?.notes ?? [],
      agent_suggestions: existingCard?.agent_suggestions ?? [],
      tool_hints: existingCard?.tool_hints ?? [],
      artifacts: existingCard?.artifacts ?? [],
      created_at: existingCard?.created_at ?? now,
      updated_at: now,
    };

    writeTaskCardFile(dir, card);
    return card;
  });

  writeTaskCardIndex(dir, cards.map((card) => card.id));
  return cards;
}

function tryRead(p: string, maxChars = 400): string | null {
  try {
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, "utf8").trim().slice(0, maxChars);
  } catch {
    return null;
  }
}

export function scanProject(dir: string): { summary: string; kind: string; detail: string; key_files: string[]; signals: string[] } {
  const facts: string[] = [];
  const detail: string[] = [];
  const signals: string[] = [];
  let kind = "普通代码仓库";

  const pkg = tryRead(path.join(dir, "package.json"));
  if (pkg) {
    try {
      const parsed = JSON.parse(pkg) as {
        name?: string;
        description?: string;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      if (parsed.name) facts.push(parsed.name);
      if (parsed.description) facts.push(parsed.description);
      const deps = { ...parsed.dependencies, ...parsed.devDependencies };
      const frameworks = ["next", "react", "vue", "svelte", "express", "fastify", "hono"]
        .filter((framework) => deps?.[framework] || deps?.[`@${framework}/core`]);
      if (frameworks.length > 0) facts.push(`(${frameworks.join(", ")})`);
      if (frameworks.length > 0) {
        signals.push(`package.json: ${frameworks.join(", ")}`);
      } else {
        signals.push("package.json");
      }
      kind = frameworks.length > 0 ? `Node/TS 项目（${frameworks.join(", ")}）` : "Node/TS 项目";
    } catch {
      // ignore malformed package manifest
    }
  }

  for (const manifest of [
    ["pyproject.toml", /^name\s*=\s*"(.+)"/m, /^description\s*=\s*"(.+)"/m],
    ["go.mod", /^module\s+(\S+)/m, null],
    ["Cargo.toml", /^name\s*=\s*"(.+)"/m, /^description\s*=\s*"(.+)"/m],
  ] as [string, RegExp, RegExp | null][]) {
    const content = tryRead(path.join(dir, manifest[0]));
    if (!content) continue;
    const name = manifest[1]?.exec(content)?.[1];
    const desc = manifest[2]?.exec(content)?.[1];
    if (name) facts.push(name);
    if (desc) facts.push(desc);
    if (manifest[0] === "pyproject.toml") kind = "Python 项目";
    if (manifest[0] === "go.mod") kind = "Go 项目";
    if (manifest[0] === "Cargo.toml") kind = "Rust 项目";
    signals.push(manifest[0]);
  }

  for (const name of ["README.md", "README.rst", "README.txt", "README"]) {
    const content = tryRead(path.join(dir, name), 800);
    if (!content) continue;
    const paragraphs = content
      .replace(/^#+.*/gm, "")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .split(/\n\n+/)
      .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
      .filter((paragraph) => paragraph.length > 20 && !paragraph.startsWith("```"));
    if (paragraphs[0]) {
      detail.push(`README: ${paragraphs[0].slice(0, 200)}`);
      signals.push(name);
    }
    break;
  }

  const claudeMd = tryRead(path.join(dir, "CLAUDE.md"), 500);
  if (claudeMd) {
    const firstPara = claudeMd
      .split(/\n\n+/)
      .find((paragraph) => paragraph.trim().length > 20 && !paragraph.startsWith("#"));
    if (firstPara) detail.push(`CLAUDE.md: ${firstPara.trim().slice(0, 150)}`);
    signals.push("CLAUDE.md");
  }

  const entries = [
    "src/index.ts", "src/main.ts", "src/app.ts",
    "src/index.tsx", "app/page.tsx", "pages/index.tsx",
    "src/main.py", "main.py", "app.py",
    "main.go", "cmd/main.go",
    "src/main.rs", "src/lib.rs",
  ].filter((entry) => fs.existsSync(path.join(dir, entry)));
  if (entries.length > 0) {
    detail.push(`入口: ${entries.slice(0, 3).join(", ")}`);
    signals.push(`入口: ${entries.slice(0, 2).join(", ")}`);
  }

  const summary = facts.filter(Boolean).join(" ").slice(0, 100) || path.basename(dir);
  return { summary, kind, detail: detail.join("\n"), key_files: entries.slice(0, 5), signals: Array.from(new Set(signals)).slice(0, 4) };
}

function extractProjectStatus(projectJson: ProjectData | null, projectMd: string | null): string | null {
  if (projectJson?.status?.trim()) return projectJson.status.trim();
  const cleaned = readMarkdownSection(projectMd, "当前状态")
    ?.replace(/^>\s?/gm, "")
    .trim();
  if (!cleaned || cleaned.includes("建议手动补充")) return null;
  return cleaned;
}

function readWorklogEntries(dir: string, limit: number): string[] {
  const worklogPath = path.join(pcpDir(dir), "WORKLOG.md");
  if (!fs.existsSync(worklogPath)) return [];

  return fs.readFileSync(worklogPath, "utf8")
    .split("\n")
    .filter((line) => line.startsWith("- "))
    .slice(-limit);
}

export function readWorklogSummary(dir: string, limit: number): string[] {
  return readWorklogEntries(dir, limit);
}

function formatEventSummary(event: PcpEvent): string {
  switch (event.e) {
    case "created":
      return `创建主任务 [${event.id}] ${event.title ?? ""}`.trim();
    case "sub":
      return `创建子任务 [${event.id}] ${event.title ?? ""}`.trim();
    case "done":
      return `完成任务 [${event.id}]`;
    case "pivoted":
      return `任务 [${event.id}] pivot：${event.reason ?? "未提供原因"}`;
    case "resume_set":
      return `更新恢复提示 [${event.id}] ${event.prompt ?? ""}`.trim();
    case "project_context":
      return `更新项目基线：${event.summary ?? ""}`.trim();
    case "backlog_add":
      return `记录 backlog [${event.id}] ${event.title ?? ""}`.trim();
    case "backlog_promote":
      return `将 backlog [${event.backlog_id}] 加入任务 [${event.task_id}]`;
    case "backlog_dismiss":
      return `忽略 backlog [${event.backlog_id}]`;
    default:
      return event.e;
  }
}

function hasPcpState(dir: string): boolean {
  const root = pcpDir(dir);
  if (!fs.existsSync(root)) return false;
  return [
    path.join(root, "stack.json"),
    path.join(root, "events.jsonl"),
    path.join(root, "PROJECT.md"),
    path.join(root, "HANDOFF.json"),
  ].some((file) => fs.existsSync(file));
}

function detectIntakeSource(dir: string): IntakeSourceKind {
  if (fs.existsSync(handoffJsonPath(dir))) return "handoff";
  if (hasPcpState(dir)) return "existing_pcp";
  return "plain_repo";
}

function readRecentChangelogEntries(dir: string, limit: number): string[] {
  const changelogPath = path.join(dir, "CHANGELOG.md");
  if (!fs.existsSync(changelogPath)) return [];
  const content = fs.readFileSync(changelogPath, "utf8");
  const unreleasedMatch = content.match(/## Unreleased\n([\s\S]*?)(?=\n## |\n*$)/);
  if (!unreleasedMatch?.[1]) return [];
  return unreleasedMatch[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .slice(0, limit);
}

export function readChangelogSummary(dir: string, limit: number): string[] {
  return readRecentChangelogEntries(dir, limit);
}

function buildProjectSummary(dir: string): {
  summary: string;
  kind: string;
  detail: string | null;
  key_files: string[];
  signals: string[];
  has_pcp: boolean;
} {
  const pcpPresent = hasPcpState(dir);
  const projectBaseline = readProjectBaselineSummary(dir);
  const projectContext = readProjectContext(dir);
  if (projectBaseline || projectContext) {
    return {
      summary: projectBaseline?.summary ?? projectContext ?? path.basename(dir),
      kind: "已接入 PCP 的项目",
      detail: projectBaseline?.detail ?? null,
      key_files: projectBaseline?.key_files ?? [],
      signals: projectBaseline?.key_files?.slice(0, 3) ?? [],
      has_pcp: pcpPresent,
    };
  }

  const scanned = scanProject(dir);
  return {
    summary: scanned.summary,
    kind: pcpPresent ? "已接入 PCP 的项目" : scanned.kind,
    detail: scanned.detail || null,
    key_files: scanned.key_files,
    signals: scanned.signals,
    has_pcp: pcpPresent,
  };
}

export function buildHandoffMarkdown(dir: string, options: HandoffOptions = {}): string {
  const {
    audience,
    focus,
    include_backlog = true,
    max_recent_events = 8,
    max_worklog_entries = 6,
  } = options;
  const stack = readStack(dir);
  const tasks = replayEvents(dir);
  const backlog = replayBacklog(dir);
  const projectBaseline = readProjectBaselineSummary(dir);
  const projectMd = readProjectMd(dir);
  const projectContext = readProjectContext(dir);
  const activeTask = stack.active_task_id ? getTask(tasks, stack.active_task_id) : null;
  const mainTask = stack.active_stack[0] ? getTask(tasks, stack.active_stack[0]) : null;
  const parentTask =
    stack.active_stack.length > 1
      ? getTask(tasks, stack.active_stack[stack.active_stack.length - 2]!)
      : null;
  const pendingBacklog = include_backlog
    ? backlog.filter((item) => item.status === "pending")
    : [];
  const recentEvents = readEventLog(dir)
    .slice(-max_recent_events)
    .map((event) => `- ${formatEventSummary(event)}`);
  const recentWorklog = readWorklogEntries(dir, max_worklog_entries);
  const projectStatus = extractProjectStatus(projectBaseline as ProjectData | null, projectMd);
  const keyFiles = projectBaseline?.key_files ?? [];
  const lines: string[] = [
    "# PCP Handoff",
    "",
    `- 生成时间: ${new Date().toISOString()}`,
  ];

  if (audience) lines.push(`- 接手对象: ${audience}`);
  if (focus) lines.push(`- 交接重点: ${focus}`);
  lines.push("");

  lines.push("## 项目概况");
  if (projectBaseline?.name) lines.push(`- 项目: ${projectBaseline.name}`);
  if (projectBaseline?.summary ?? projectContext) {
    lines.push(`- 摘要: ${projectBaseline?.summary ?? projectContext ?? ""}`);
  }
  if (projectStatus) lines.push(`- 现状: ${projectStatus}`);
  if (keyFiles.length > 0) {
    lines.push(`- 关键文件: ${keyFiles.join(", ")}`);
  }
  lines.push("");

  lines.push("## 当前任务");
  if (mainTask) {
    lines.push(`- 当前主线任务: [${mainTask.id}] ${mainTask.title}`);
  } else {
    lines.push("- 当前主线任务: 无");
  }
  if (activeTask) {
    lines.push(`- 当前执行任务: [${activeTask.id}] ${activeTask.title}`);
  } else {
    lines.push("- 当前执行任务: 无");
  }
  if (parentTask?.resume_prompt) {
    lines.push(`- 返回主线提示: ${parentTask.resume_prompt}`);
  }
  if (stack.ready_tasks.length > 0) {
    lines.push("- 队列中的未完成任务:");
    for (const task of stack.ready_tasks) {
      lines.push(`  - [${task.id}] ${task.title}`);
    }
  } else {
    lines.push("- 队列中的未完成任务: 无");
  }
  lines.push("");

  lines.push("## 当前进展");
  const completedTasks = tasks.filter((task) => task.done).slice(-5);
  if (completedTasks.length > 0) {
    lines.push("- 最近完成:");
    for (const task of completedTasks) {
      lines.push(`  - [${task.id}] ${task.title}`);
    }
  } else {
    lines.push("- 最近完成: 暂无");
  }
  if (recentWorklog.length > 0) {
    lines.push("- 最近 worklog:");
    lines.push(...recentWorklog.map((entry) => `  ${entry}`));
  }
  lines.push("");

  lines.push("## 未完成事项");
  if (activeTask) {
    lines.push(`- 继续当前任务 [${activeTask.id}] ${activeTask.title}`);
  }
  if (stack.ready_tasks[0]) {
    lines.push(`- 完成当前任务后推进 [${stack.ready_tasks[0].id}] ${stack.ready_tasks[0].title}`);
  }
  if (!activeTask && stack.ready_tasks.length === 0) {
    lines.push("- 当前没有活动任务，建议重新规划并调用 pcp_plan。");
  }
  lines.push("");

  if (include_backlog) {
    lines.push("## Backlog 待决项");
    if (pendingBacklog.length > 0) {
      for (const item of pendingBacklog) {
        const detailSuffix = item.detail ? ` — ${item.detail}` : "";
        lines.push(`- [${item.id}] ${item.title}${detailSuffix}`);
      }
    } else {
      lines.push("- 无");
    }
    lines.push("");
  }

  lines.push("## 最近关键事件");
  if (recentEvents.length > 0) {
    lines.push(...recentEvents);
  } else {
    lines.push("- 暂无");
  }
  lines.push("");

  lines.push("## 建议下一步");
  if (activeTask) {
    lines.push(`1. 先继续完成 [${activeTask.id}] ${activeTask.title}。`);
  } else if (stack.ready_tasks[0]) {
    lines.push(`1. 从队列首项 [${stack.ready_tasks[0].id}] ${stack.ready_tasks[0].title} 开始。`);
  } else {
    lines.push("1. 让 planner 生成下一轮计划，再调用 pcp_plan。");
  }
  if (stack.ready_tasks[0] && activeTask) {
    lines.push(`2. 当前任务完成后，推进到 [${stack.ready_tasks[0].id}] ${stack.ready_tasks[0].title}。`);
  } else if (pendingBacklog[0]) {
    lines.push(`2. 评估 backlog 首项 [${pendingBacklog[0].id}] ${pendingBacklog[0].title} 是否进入下一轮。`);
  } else {
    lines.push("2. 如需中途切换工具，先把本文件交给下一个 AI。");
  }

  return lines.join("\n");
}

export function buildHandoffSnapshot(dir: string, options: HandoffOptions = {}): HandoffSnapshot {
  const {
    audience,
    focus,
    include_backlog = true,
    max_recent_events = 8,
  } = options;
  const stack = readStack(dir);
  const tasks = replayEvents(dir);
  const backlog = replayBacklog(dir);
  const projectBaseline = readProjectBaselineSummary(dir);
  const projectMd = readProjectMd(dir);
  const projectContext = readProjectContext(dir);
  const mainTask = stack.active_stack[0] ? getTask(tasks, stack.active_stack[0]) : null;
  const activeTask = stack.active_task_id ? getTask(tasks, stack.active_task_id) : null;
  const parentTask =
    stack.active_stack.length > 1
      ? getTask(tasks, stack.active_stack[stack.active_stack.length - 2]!)
      : null;
  const pendingBacklog = include_backlog
    ? backlog.filter((item) => item.status === "pending")
    : [];
  const projectStatus = extractProjectStatus(projectBaseline as ProjectData | null, projectMd);
  const recentEvents = readEventLog(dir)
    .slice(-max_recent_events)
    .map((event) => formatEventSummary(event));
  const recentWorklog = readWorklogEntries(dir, 6);
  if ((mainTask && !readTaskCard(dir, mainTask.id)) || (activeTask && !readTaskCard(dir, activeTask.id))) {
    reconcileTaskCards(dir);
  }
  const mainCard = mainTask ? readTaskCard(dir, mainTask.id) : null;
  const activeCard = activeTask ? readTaskCard(dir, activeTask.id) : null;

  const nextSteps: string[] = [];
  if (activeTask) {
    nextSteps.push(`继续当前任务 [${activeTask.id}] ${activeTask.title}`);
  } else if (stack.ready_tasks[0]) {
    nextSteps.push(`从队列首项 [${stack.ready_tasks[0].id}] ${stack.ready_tasks[0].title} 开始`);
  } else {
    nextSteps.push("重新规划下一轮任务并调用 pcp_plan");
  }
  if (stack.ready_tasks[0] && activeTask) {
    nextSteps.push(`完成当前任务后推进 [${stack.ready_tasks[0].id}] ${stack.ready_tasks[0].title}`);
  } else if (pendingBacklog[0]) {
    nextSteps.push(`评估 backlog 首项 [${pendingBacklog[0].id}] ${pendingBacklog[0].title}`);
  }

  return {
    generated_at: new Date().toISOString(),
    audience: audience ?? null,
    focus: focus ?? null,
    project: {
      name: projectBaseline?.name ?? null,
      summary: projectBaseline?.summary ?? projectContext ?? null,
      context: projectContext,
      status: projectStatus,
      key_files: projectBaseline?.key_files ?? [],
    },
    main_task: mainTask ? {
      id: mainTask.id,
      title: mainTask.title,
      lifecycle_status: mainCard?.lifecycle_status ?? null,
      review_status: mainCard?.review_status ?? null,
      git_status: mainCard?.git_status ?? null,
      handoff_status: mainCard?.handoff_status ?? null,
    } : null,
    active_task: activeTask ? {
      id: activeTask.id,
      title: activeTask.title,
      lifecycle_status: activeCard?.lifecycle_status ?? null,
      review_status: activeCard?.review_status ?? null,
      git_status: activeCard?.git_status ?? null,
      handoff_status: activeCard?.handoff_status ?? null,
    } : null,
    queue: stack.ready_tasks.map((task) => ({ id: task.id, title: task.title })),
    backlog: pendingBacklog,
    recent_events: recentEvents,
    recent_worklog: recentWorklog,
    resume_prompt: parentTask?.resume_prompt ?? activeTask?.resume_prompt ?? null,
    next_steps: nextSteps,
  };
}

export function readHandoffSnapshot(dir: string): HandoffSnapshot | null {
  const snapshotPath = handoffJsonPath(dir);
  if (!fs.existsSync(snapshotPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as HandoffSnapshot;
  } catch {
    return null;
  }
}

export function buildIntakeSummary(dir: string): IntakeSummary {
  const source = detectIntakeSource(dir);
  const project = buildProjectSummary(dir);
  const stack = hasPcpState(dir) ? readStack(dir) : {
    next_id: 1,
    backlog_next_id: 1,
    plan_next_id: 1,
    blueprint_next_id: 1,
    active_stack: [],
    active_task_id: null,
    ready_tasks: [],
    completion_mode: "gated" as CompletionMode,
    pending_completion: null,
  };
  const tasks = hasPcpState(dir) ? replayEvents(dir) : [];
  const activeTask = stack.active_task_id ? getTask(tasks, stack.active_task_id) : null;
  const pendingProposals = hasPcpState(dir)
    ? listTaskProposals(dir).filter((item) => item.status === "proposed")
    : [];
  const backlogCount = hasPcpState(dir) ? getPendingBacklog(dir).length : 0;
  const concernCount = hasPcpState(dir)
    ? listConcerns(dir).filter((item) => item.status === "open" || item.status === "triggered").length
    : 0;
  const worklogSummary = hasPcpState(dir) ? readWorklogEntries(dir, 3) : [];
  const changelogSummary = readRecentChangelogEntries(dir, 3);

  const nextSteps: string[] = [];
  if (source === "handoff") {
    nextSteps.push("我已经基于 handoff 接手了当前上下文，接下来你可以先确认我的理解是否正确。");
    if (activeTask) {
      nextSteps.push(`如果你要继续现有流程，我下一步可以先查看 [${activeTask.id}] ${activeTask.title}。`);
    }
  } else if (source === "existing_pcp") {
    nextSteps.push("我已经识别到这个项目里有现成的 PCP 流程。");
    nextSteps.push("你可以先决定：沿用当前流程、部分参考，还是忽略它并重新开始。");
  } else {
    nextSteps.push("这个项目还没有接入 PCP。");
    nextSteps.push("如果你愿意，我下一步可以在你确认目标后帮你进入 PCP 流程。");
  }

  if (worklogSummary.length > 0) {
    nextSteps.push("如果你想，我可以展开最近的 Worklog，先看前面做到了哪里。");
  }
  if (backlogCount > 0) {
    nextSteps.push("如果你想，我也可以展开 backlog，看当前有哪些暂缓项。");
  }
  if (concernCount > 0) {
    nextSteps.push("Concern Log 里也有未关闭的问题；需要的话我可以再展开。");
  }

  return {
    source,
    source_path: source === "handoff" ? handoffJsonPath(dir) : null,
    project,
    flow: {
      active_task_id: activeTask?.id ?? stack.active_task_id ?? null,
      active_task_title: activeTask?.title ?? null,
      queue_count: stack.ready_tasks.length,
      pending_review_count: stack.pending_completion ? 1 : 0,
      pending_proposal_count: pendingProposals.length,
    },
    records: {
      has_worklog: worklogSummary.length > 0,
      worklog_summary: worklogSummary,
      backlog_count: backlogCount,
      concern_count: concernCount,
      changelog_summary: changelogSummary,
    },
    next_steps: nextSteps,
  };
}

export function applyIntakeAdoptionDecision(
  dir: string,
  decision: IntakeAdoptionDecision,
): IntakeAdoptionResult {
  const source = detectIntakeSource(dir);

  if (decision === "restart" && hasPcpState(dir)) {
    const stack = readStack(dir);
    stack.active_stack = [];
    stack.active_task_id = null;
    stack.ready_tasks = [];
    stack.pending_completion = null;
    writeStack(dir, stack);
    appendWorklog(dir, "🧭 intake 选择 restart：忽略当前 PCP 主线，等待重新规划");
    return {
      decision,
      source,
      active_task_id: null,
      queue_count: 0,
    };
  }

  if (decision === "reference_only") {
    appendWorklog(dir, "🧭 intake 选择 reference_only：仅参考当前流程，不直接沿用主线");
  } else {
    appendWorklog(dir, `🧭 intake 选择 continue：沿用当前${source === "plain_repo" ? "项目理解" : " PCP"}流程`);
  }

  const stack = hasPcpState(dir) ? readStack(dir) : {
    next_id: 1,
    backlog_next_id: 1,
    plan_next_id: 1,
    blueprint_next_id: 1,
    active_stack: [],
    active_task_id: null,
    ready_tasks: [],
    completion_mode: "gated" as CompletionMode,
    pending_completion: null,
  };

  return {
    decision,
    source,
    active_task_id: stack.active_task_id,
    queue_count: stack.ready_tasks.length,
  };
}

export function buildIntakeFollowup(
  dir: string,
  section: IntakeFollowupSection,
): string {
  const summary = buildIntakeSummary(dir);

  if (section === "options") {
    return [
      "🤝 Intake Follow-up",
      ...intakeFollowupMenu(),
    ].join("\n");
  }

  if (section === "project") {
    const lines = [
      "## 项目概况（展开）",
      `- 摘要：${summary.project.summary}`,
      `- 类型：${summary.project.kind}`,
    ];
    if (summary.project.signals.length > 0) {
      lines.push(`- 识别线索：${summary.project.signals.join("；")}`);
    }
    if (summary.project.key_files.length > 0) {
      lines.push(`- 关键文件：${summary.project.key_files.join(", ")}`);
    }
    if (summary.project.detail) {
      lines.push("- 扫描详情：");
      lines.push(...summary.project.detail.split("\n").map((line) => `  ${line}`));
    }
    lines.push("", ...intakeFollowupMenu());
    return lines.join("\n");
  }

  if (section === "worklog") {
    const entries = hasPcpState(dir) ? readWorklogSummary(dir, 8) : [];
    if (entries.length === 0) {
      return ["📝 当前没有可展开的 Worklog。", "", ...intakeFollowupMenu()].join("\n");
    }
    return ["📝 最近 Worklog：", ...entries.map((entry) => `  ${entry}`), "", ...intakeFollowupMenu()].join("\n");
  }

  if (section === "backlog") {
    const items = hasPcpState(dir) ? getPendingBacklog(dir) : [];
    if (items.length === 0) return ["📋 当前 backlog 为空。", "", ...intakeFollowupMenu()].join("\n");
    return [
      `📋 Backlog（${items.length} 项）：`,
      ...items.map((item) => `  ${item.id}: ${item.title}${item.detail ? ` — ${item.detail}` : ""}`),
      "",
      ...intakeFollowupMenu(),
    ].join("\n");
  }

  if (section === "concern") {
    const items = hasPcpState(dir)
      ? listConcerns(dir).filter((item) => item.status === "open" || item.status === "triggered")
      : [];
    if (items.length === 0) return ["🧭 当前没有需要展开的 Concern。", "", ...intakeFollowupMenu()].join("\n");
    return [
      `🧭 Concern（${items.length} 条）：`,
      ...items.map((item) => `  ${item.id}: ${item.title} [${item.tags.join(", ")}]`),
      "",
      ...intakeFollowupMenu(),
    ].join("\n");
  }

  const changelog = readChangelogSummary(dir, 8);
  if (changelog.length === 0) {
    return ["📦 当前没有可展开的 Changelog 摘要。", "", ...intakeFollowupMenu()].join("\n");
  }
  return ["📦 最近 Changelog：", ...changelog.map((line) => `  ${line}`), "", ...intakeFollowupMenu()].join("\n");
}

function markTaskHandoffStatus(dir: string, taskId: string | null, status: TaskCardHandoffStatus, actor: string): void {
  if (!taskId) return;
  let card = readTaskCard(dir, taskId);
  if (!card) {
    reconcileTaskCards(dir);
    card = readTaskCard(dir, taskId);
  }
  if (!card) return;
  writeTaskCard(dir, {
    ...card,
    handoff_status: status,
    last_actor: actor,
  });
}

export function intakeHandoff(dir: string): IntakeResult {
  ensureDir(dir);
  const snapshot = readHandoffSnapshot(dir);
  if (!snapshot) {
    throw new Error("No handoff snapshot found");
  }
  const stack = readStack(dir);
  const activeTaskId = stack.active_task_id ?? snapshot.active_task?.id ?? null;
  markTaskHandoffStatus(dir, activeTaskId, "resumed", "pcp_intake");
  appendWorklog(
    dir,
    `🤝 读取 HANDOFF${snapshot.focus ? `（重点：${snapshot.focus}）` : ""}${activeTaskId ? `，恢复到 ${activeTaskId}` : ""}`,
  );
  return {
    source_path: handoffJsonPath(dir),
    active_task_id: activeTaskId,
    queue_count: stack.ready_tasks.length,
  };
}

export function writeHandoff(dir: string, options: HandoffOptions = {}): { path: string; snapshot_path: string; markdown: string } {
  ensureDir(dir);
  const markdown = buildHandoffMarkdown(dir, options);
  const handoffPath = path.join(pcpDir(dir), "HANDOFF.md");
  const snapshotPath = handoffJsonPath(dir);
  const snapshot = buildHandoffSnapshot(dir, options);
  fs.writeFileSync(handoffPath, markdown);
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  markTaskHandoffStatus(dir, snapshot.active_task?.id ?? null, "prepared", "pcp_handoff");
  return { path: handoffPath, snapshot_path: snapshotPath, markdown };
}
