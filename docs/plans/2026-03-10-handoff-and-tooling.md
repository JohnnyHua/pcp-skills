# Handoff And Tooling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a minimal npm/TypeScript validation toolchain and a user-invoked `pcp_handoff` tool that generates `.opencode/pcp/HANDOFF.md` from existing PCP state.

**Architecture:** Extract PCP state and handoff rendering helpers into a reusable module under `plugin/` so tests can exercise real event replay and markdown generation without needing the OpenCode runtime. Keep `plugin/pcp.ts` as the integration layer that wires the new helpers into the existing tool registry and lifecycle hooks.

**Tech Stack:** TypeScript, Node.js built-in test runner, `tsx`, `@opencode-ai/plugin`

---

### Task 1: Add package and TypeScript scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`

**Step 1: Write the failing test**

Create `tests/handoff.test.ts` that imports `plugin/state.ts` APIs that do not exist yet.

**Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/handoff.test.ts`
Expected: FAIL with module resolution error for `plugin/state.ts` or missing exports.

**Step 3: Write minimal implementation**

Add `package.json` and `tsconfig.json` so the repository has standard `npm run typecheck`, `npm test`, and `npm run check` entry points.

**Step 4: Run test to verify it still fails for the right reason**

Run: `npm test -- tests/handoff.test.ts`
Expected: FAIL because state/handoff implementation is still missing, not because tooling is broken.

**Step 5: Commit**

```bash
git add package.json tsconfig.json tests/handoff.test.ts
git commit -m "chore: add local TypeScript validation tooling"
```

### Task 2: Extract PCP state helpers and add handoff rendering

**Files:**
- Create: `plugin/state.ts`
- Modify: `plugin/pcp.ts`
- Test: `tests/handoff.test.ts`

**Step 1: Write the failing test**

Expand `tests/handoff.test.ts` to assert that event replay rebuilds active tasks and backlog status, and that handoff markdown includes project summary, current task, queue, backlog, recent worklog, and next-step guidance.

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/handoff.test.ts`
Expected: FAIL with missing functions or wrong markdown content.

**Step 3: Write minimal implementation**

Move reusable file/state helpers into `plugin/state.ts`, add handoff markdown builder + writer, and wire `pcp_handoff` into `plugin/pcp.ts`.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/handoff.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add plugin/state.ts plugin/pcp.ts tests/handoff.test.ts
git commit -m "feat: add PCP handoff generation"
```

### Task 3: Document and verify the workflow

**Files:**
- Modify: `README.md`
- Modify: `README.zh.md`
- Modify: `WORKLOG.md`
- Modify: `CHANGELOG.md`
- Modify: `orchestrator/status.json`

**Step 1: Write the failing test**

No new automated test; verification here is command-level acceptance.

**Step 2: Run verification before docs**

Run: `npm run check`
Expected: PASS

**Step 3: Write minimal implementation**

Document the new scripts and `pcp_handoff` tool in both READMEs, then update governance tracking files with the completed sprint.

**Step 4: Run final verification**

Run: `npm run check`
Expected: PASS

**Step 5: Commit**

```bash
git add README.md README.zh.md WORKLOG.md CHANGELOG.md orchestrator/status.json
git commit -m "docs: document handoff workflow and local checks"
```
