# PCP Review Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 增加一个统一的 `pcp_review` 入口，把待批准完成和待批准 proposal 汇总成一个半操作台视图。

**Architecture:** 保持现有审批语义不变，不在 `pcp_review` 中直接批准或拒绝。状态层新增一个最小 helper 负责构建 review 项，插件层只负责把这些 review 项格式化输出并给出推荐命令。

**Tech Stack:** TypeScript, OpenCode plugin tools, Node test runner

---

### Task 1: 定义 review 项数据结构与状态层 helper

**Files:**
- Modify: `plugin/state.ts`
- Test: `tests/review.test.ts`

**Step 1: Write the failing test**

覆盖：
- 只有 pending completion 时返回完成审批项
- 只有 pending proposal 时返回 proposal review 项
- 两者同时存在时完成审批排在前面

**Step 2: Run test to verify it fails**

Run: `npm test -- --test tests/review.test.ts`
Expected: FAIL，因为 helper 还不存在

**Step 3: Write minimal implementation**

在 `plugin/state.ts` 增加：
- `ReviewItem`
- `buildReviewItems(...)`

**Step 4: Run test to verify it passes**

Run: `npm test -- --test tests/review.test.ts`
Expected: PASS

### Task 2: 暴露 `pcp_review` 工具

**Files:**
- Modify: `plugin/pcp.ts`
- Test: `tests/review.test.ts`

**Step 1: Extend tests**

增加对 review 输出格式的断言：
- 空状态时提示没有待 review 项
- 有 item 时展示类型、标题、推荐命令

**Step 2: Run test to verify it fails**

Run: `npm test -- --test tests/review.test.ts`
Expected: FAIL，因为 `pcp_review` 还不存在

**Step 3: Write minimal implementation**

在 `plugin/pcp.ts` 增加 `pcp_review`，调用 `buildReviewItems(...)` 并格式化输出。

**Step 4: Run test to verify it passes**

Run: `npm test -- --test tests/review.test.ts`
Expected: PASS

### Task 3: 收口文档与治理更新

**Files:**
- Create: `docs/plans/2026-03-17-pcp-review.md`
- Modify: `WORKLOG.md`
- Modify: `CHANGELOG.md`
- Modify: `orchestrator/status.json`

**Step 1: Update governance files**

记录这轮完成情况和下一步建议。

**Step 2: Run full verification**

Run: `npm run check`
Expected: PASS

Run: `git diff --check`
Expected: no output

**Step 3: Commit**

```bash
git add plugin/state.ts plugin/pcp.ts tests/review.test.ts docs/plans/2026-03-17-pcp-review.md WORKLOG.md CHANGELOG.md orchestrator/status.json
git commit -m "feat(pcp): add unified review entrypoint"
```
