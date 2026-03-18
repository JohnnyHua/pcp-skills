# PCP Intake v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade `pcp_intake` into a unified project onboarding flow that summarizes handoff, existing PCP state, or a plain repository without auto-starting execution.

**Architecture:** Reuse existing PCP state helpers where possible and add one new summary layer in `plugin/state.ts`. Keep runtime behavior intentionally light: only summarize project state, PCP state, and auxiliary records, then stop and wait for the user's next decision.

**Tech Stack:** TypeScript, Node.js test runner, OpenCode plugin tools

---

### Task 1: Add failing intake summary tests

**Files:**
- Modify: `tests/intake.test.ts`
- Read: `plugin/state.ts`

**Step 1: Add tests for existing PCP and plain repo intake**

Cover:
- existing PCP without handoff
- plain repo without PCP

**Step 2: Run tests to verify failure**

Run: `npm test -- tests/intake.test.ts`
Expected: FAIL because `pcp_intake` only restores handoff and has no unified summary path yet.

### Task 2: Add intake summary helpers

**Files:**
- Modify: `plugin/state.ts`
- Read: `plugin/pcp.ts`

**Step 1: Add source detection and lightweight summary helpers**

Add:
- intake source detection
- project summary builder
- lightweight changelog summary
- unified `buildIntakeSummary(...)`

**Step 2: Keep plain repos read-only**

Ensure summary building does not create `.opencode/pcp/` for repos that have not adopted PCP yet.

### Task 3: Upgrade `pcp_intake`

**Files:**
- Modify: `plugin/pcp.ts`

**Step 1: Keep handoff restore for handoff source**

If a handoff exists:
- restore minimal runtime state
- mark resumed task as before

**Step 2: Switch output to unified intake summary**

Show:
- intake source
- project summary
- current flow state
- lightweight record summaries
- next-step suggestions

**Step 3: Stop before plan/execution**

`pcp_intake` must not auto-enter plan or execution.

### Task 4: Verify and document

**Files:**
- Modify: `WORKLOG.md`
- Modify: `CHANGELOG.md`
- Modify: `orchestrator/status.json`
- Modify: `README.md`
- Modify: `README.zh.md`

**Step 1: Run full verification**

Run: `npm run check`
Expected: PASS

Run: `git diff --check`
Expected: no output

**Step 2: Record sprint output**

Update governance files and keep the intake v2 design/implementation trail in `docs/plans/`.
