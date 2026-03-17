# PCP Review Apply Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 让用户在看完 `pcp_review` 后，只需要表达“批准/拒绝哪些项”，由 PCP 代为执行底层命令。

**Architecture:** 保持 `pcp_review` 负责展示，新增一个最小的 `pcp_review_apply` 动作来应用用户选择。该动作不做复杂自然语言理解，只接受结构化选择并映射到现有的 `pcp_approve`、`pcp_approve_task_proposal`、`pcp_reject_task_proposal`。

**Tech Stack:** TypeScript, OpenCode plugin tools, Node test runner

---

### Task 1: 增加 review apply 状态层 helper

**Files:**
- Modify: `plugin/state.ts`
- Test: `tests/review-apply.test.ts`

**Step 1: Write the failing test**

覆盖：
- 批准 pending completion
- 批准单个 proposal
- 拒绝单个 proposal
- 批量批准 proposal

**Step 2: Run test to verify it fails**

Run: `npm test -- --test tests/review-apply.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

在 `plugin/state.ts` 增加 review apply helper，内部复用已有 approval/rejection 函数。

**Step 4: Run test to verify it passes**

Run: `npm test -- --test tests/review-apply.test.ts`
Expected: PASS

### Task 2: 暴露 `pcp_review_apply`

**Files:**
- Modify: `plugin/pcp.ts`
- Test: `tests/review-apply.test.ts`

**Step 1: Extend tests**

断言：
- 没有待 review 项时给出明确提示
- 应用结果输出包含已执行的动作摘要

**Step 2: Run test to verify it fails**

Run: `npm test -- --test tests/review-apply.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

增加 `pcp_review_apply`，支持最小结构化选择：
- `approve_completion`
- `approve_proposals`
- `reject_proposals`

**Step 4: Run test to verify it passes**

Run: `npm test -- --test tests/review-apply.test.ts`
Expected: PASS

### Task 3: 收口文档与治理

**Files:**
- Create: `docs/plans/2026-03-17-pcp-review-apply.md`
- Modify: `WORKLOG.md`
- Modify: `CHANGELOG.md`
- Modify: `orchestrator/status.json`

**Step 1: Update governance files**

记录本轮完成情况与下一步。

**Step 2: Run full verification**

Run: `npm run check`
Expected: PASS

Run: `git diff --check`
Expected: no output
