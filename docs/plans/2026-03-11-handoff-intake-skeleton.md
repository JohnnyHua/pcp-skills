# Handoff Intake Skeleton Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the minimum PCP handoff/intake skeleton so a generated handoff includes machine-readable semantics and intake can restore enough context to mark the resumed task.

**Architecture:** Keep `HANDOFF.md` as the human-readable artifact, add a sidecar `HANDOFF.json` for PCP semantics, and implement a minimal intake path that reads the sidecar, verifies current runtime state, updates task handoff status, and records the handoff intake in worklog.

**Tech Stack:** TypeScript, Node.js filesystem APIs, OpenCode plugin tools, `node:test`, `tsx`

---

### Task 1: Add failing tests for handoff sidecar and intake restoration

**Files:**
- Create: `tests/intake.test.ts`
- Modify: `plugin/state.ts`

**Step 1: Write the failing test**

Cover:
- `writeHandoff` writes both `HANDOFF.md` and `HANDOFF.json`
- the JSON includes current task, queue, backlog, and next-step summary
- intake marks the current task `handoff_status` as `resumed`
- intake appends a worklog line

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/intake.test.ts`
Expected: FAIL because semantic handoff output and intake helpers do not exist yet.

**Step 3: Write minimal implementation**

Add to `plugin/state.ts`:
- `HandoffSnapshot` type
- `buildHandoffSnapshot`
- `readHandoffSnapshot`
- `writeHandoff` sidecar output
- `intakeHandoff`

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/intake.test.ts`
Expected: PASS

### Task 2: Expose the intake path through the plugin tool surface

**Files:**
- Modify: `plugin/pcp.ts`
- Test: `tests/intake.test.ts`

**Step 1: Extend the failing test if needed**

Verify:
- a minimal intake result reports what source it used
- current task remains stable after intake

**Step 2: Run focused tests**

Run: `npm test -- tests/intake.test.ts tests/handoff.test.ts`
Expected: FAIL only if plugin-facing integration still bypasses the new helper.

**Step 3: Write minimal implementation**

Add `pcp_intake`:
- default to `.opencode/pcp/HANDOFF.json`
- read the snapshot
- record a concise worklog line
- return a short resume summary

**Step 4: Run focused tests**

Run: `npm test -- tests/intake.test.ts tests/handoff.test.ts`
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
- handoff now has a semantic sidecar
- intake skeleton exists
- richer validation and conflict resolution remain future work

**Step 4: Commit**

```bash
git add plugin/state.ts plugin/pcp.ts tests/intake.test.ts docs/plans/2026-03-11-handoff-intake-skeleton.md WORKLOG.md CHANGELOG.md orchestrator/status.json
git commit -m "feat(handoff): add intake skeleton"
```
