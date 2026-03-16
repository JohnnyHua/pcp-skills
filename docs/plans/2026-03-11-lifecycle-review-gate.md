# Lifecycle Review Gate Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make PCP task completion write real `lifecycle_status`, `review_status`, and `git_status` transitions while preserving the current queue auto-advance behavior.

**Architecture:** Keep the current tool surface minimal. Add a small state-layer helper that finalizes the active task with a review decision and a completion source (`manual` vs `git_commit`), then reuse that helper from `pcp_done` and the existing git commit hook.

**Tech Stack:** TypeScript, Node.js filesystem APIs, OpenCode plugin tools, `node:test`, `tsx`

---

### Task 1: Add failing tests for lifecycle/review/git transitions

**Files:**
- Create: `tests/lifecycle-review.test.ts`
- Modify: `plugin/state.ts`

**Step 1: Write the failing test**

Cover:
- manual completion marks the finished task as `done`
- manual completion records review choice and sets `git_status` to `pending`
- git-commit completion marks the finished task as `done` and `git_status` to `committed`
- queue still auto-advances to the next task

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/lifecycle-review.test.ts`
Expected: FAIL because the state-layer completion helper does not exist yet.

**Step 3: Write minimal implementation**

Add a helper in `plugin/state.ts` that:
- reads the active task
- updates the current TaskCard runtime fields
- appends the `done` event
- updates stack auto-advance state
- reconciles TaskCards after the transition

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/lifecycle-review.test.ts`
Expected: PASS

### Task 2: Route `pcp_done` and git-commit auto-complete through the shared helper

**Files:**
- Modify: `plugin/pcp.ts`
- Modify: `plugin/state.ts`
- Test: `tests/lifecycle-review.test.ts`

**Step 1: Extend the failing test if needed**

Verify:
- `pcp_done` defaults to `skip`
- `pcp_done` accepts review choice
- git commit path records committed state without breaking queue advance

**Step 2: Run focused tests**

Run: `npm test -- tests/lifecycle-review.test.ts tests/taskcards.test.ts tests/plan-compilation.test.ts`
Expected: FAIL only if the tool path still bypasses the new helper.

**Step 3: Write minimal implementation**

In `plugin/pcp.ts`:
- add optional `review` arg to `pcp_done`
- use the shared completion helper
- keep existing user-facing messages compact

In `plugin/pcp.ts` git hook:
- use the shared completion helper with `via: "git_commit"`

**Step 4: Run focused tests to verify they pass**

Run: `npm test -- tests/lifecycle-review.test.ts tests/taskcards.test.ts tests/plan-compilation.test.ts`
Expected: PASS

### Task 3: Full verification and governance updates

**Files:**
- Modify: `WORKLOG.md`
- Modify: `CHANGELOG.md`
- Modify: `orchestrator/status.json`

**Step 1: Run full verification**

Run: `npm run check`
Expected: PASS

**Step 2: Run diff validation**

Run: `git diff --check`
Expected: no output

**Step 3: Update governance**

Record:
- lifecycle/review/git state transitions are now real runtime data
- next sprint should focus on richer review gate behavior rather than just field writes

**Step 4: Commit**

```bash
git add plugin/state.ts plugin/pcp.ts tests/lifecycle-review.test.ts docs/plans/2026-03-11-lifecycle-review-gate.md WORKLOG.md CHANGELOG.md orchestrator/status.json
git commit -m "feat(review): persist lifecycle and git transitions"
```
