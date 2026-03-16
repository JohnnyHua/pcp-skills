# Plan Compilation Runtime Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add persisted Plan storage and upgrade PCP's plan flow so external plan outputs can be normalized into stored Plan metadata plus TaskCards and queue state.

**Architecture:** Keep the current `pcp_plan(tasks: string[])` entrypoint for compatibility, but add a persisted `PlanRecord` layer in `plugin/state.ts`. The runtime will write a normalized plan file under `.opencode/pcp/plans/`, materialize TaskCards from the plan items, and then load queue state through the existing stack model.

**Tech Stack:** TypeScript, Node.js filesystem APIs, OpenCode plugin tools, `node:test`, `tsx`

---

### Task 1: Persist normalized Plan records in the state layer

**Files:**
- Modify: `plugin/state.ts`
- Test: `tests/plan-compilation.test.ts`

**Step 1: Write the failing test**

Add a test that writes a plan with ordered items and verifies:
- `.opencode/pcp/plans/index.json` exists
- the new plan JSON stores raw items plus normalized task ids
- generated TaskCards exist for each plan item

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/plan-compilation.test.ts`
Expected: FAIL because `writePlan`/`readPlan`/`compilePlan` do not exist yet.

**Step 3: Write minimal implementation**

In `plugin/state.ts`:
- add `PlanRecord` and `PlanItem` types
- add `plansDir`, `writePlan`, `readPlan`, `listPlans`
- add `compilePlan` that:
  - assigns stable task ids from `stack.next_id`
  - writes `created` events
  - persists a `PlanRecord`
  - returns created tasks

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/plan-compilation.test.ts`
Expected: PASS

### Task 2: Load compiled Plan output through `pcp_plan`

**Files:**
- Modify: `plugin/pcp.ts`
- Modify: `plugin/state.ts`
- Test: `tests/plan-compilation.test.ts`

**Step 1: Write the failing test**

Add a test that exercises the compile flow and verifies:
- when no active task exists, first compiled task becomes `doing`
- remaining compiled tasks become `ready`
- when an active task exists, compiled tasks append to `ready_tasks`
- the persisted plan links to created task ids

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/plan-compilation.test.ts`
Expected: FAIL because the queue load path still manually creates tasks instead of using compiled plan output.

**Step 3: Write minimal implementation**

In `plugin/pcp.ts`:
- route `pcp_plan` through `compilePlan`
- keep the public tool signature unchanged for now
- append worklog entries using plan id + task ids

In `plugin/state.ts`:
- expose helpers needed by the tool path without duplicating id assignment logic

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/plan-compilation.test.ts`
Expected: PASS

### Task 3: Preserve compatibility with existing handoff and TaskCard flows

**Files:**
- Modify: `tests/handoff.test.ts`
- Modify: `tests/taskcards.test.ts`
- Test: `tests/handoff.test.ts`
- Test: `tests/taskcards.test.ts`

**Step 1: Write or update the failing test**

Extend assertions only if needed so they prove:
- compiled plan output still produces reconciled TaskCards
- handoff rendering still works with the new plan persistence layer present

**Step 2: Run tests to verify failures are real**

Run: `npm test -- tests/taskcards.test.ts tests/handoff.test.ts`
Expected: FAIL only if the new plan layer breaks existing behavior.

**Step 3: Write minimal implementation**

Adjust state helpers so plan persistence does not change:
- handoff generation
- event replay
- TaskCard reconciliation

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/taskcards.test.ts tests/handoff.test.ts`
Expected: PASS

### Task 4: Full verification and governance updates

**Files:**
- Modify: `WORKLOG.md`
- Modify: `CHANGELOG.md`
- Modify: `orchestrator/status.json`

**Step 1: Run full verification**

Run: `npm run check`
Expected: PASS with all tests green.

**Step 2: Run diff validation**

Run: `git diff --check`
Expected: no output

**Step 3: Update governance files**

Record:
- what Plan persistence now does
- what remains for lifecycle/review/intake
- the next pending sprint

**Step 4: Commit**

```bash
git add plugin/state.ts plugin/pcp.ts tests/plan-compilation.test.ts tests/taskcards.test.ts tests/handoff.test.ts docs/plans/2026-03-10-plan-compilation-runtime.md WORKLOG.md CHANGELOG.md orchestrator/status.json
git commit -m "feat(plan): add persisted plan compilation runtime"
```
