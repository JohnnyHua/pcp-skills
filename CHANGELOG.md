# Changelog

## Unreleased

- Added `AGENTS.md` with repository-specific contributor guidance for the PCP plugin, bundled skills, manual validation flow, and PR expectations.
- Added minimal local tooling with `package.json`, `tsconfig.json`, `npm run typecheck`, `npm test`, and `npm run check`.
- Added `pcp_handoff`, which generates `.opencode/pcp/HANDOFF.md` from current PCP tasks, queue, backlog, project context, and worklog.
- Documented the new handoff workflow and local development commands in both `README.md` and `README.zh.md`.
- Added `docs/pcp-positioning.md` to explain PCP's role as an agent-facing development control plane and its relationship to OpenCode, Claude Code, ChatGPT, and CrewAI.
- Added `docs/pcp-core-model.md` to define PCP's core objects, lifecycle flows, and the boundary between the current OpenCode implementation and future architecture work.
- Added `docs/pcp-taskcard-plan-compilation.md` to specify TaskCard persistence, edit boundaries, queue loading, and how Plan outputs are compiled into executable runtime state.
- Added `docs/pcp-concern-intake-compatibility.md` to define Concern Log, Handoff/Intake recovery flow, host-agent compatibility boundaries, and the decision that PCP standardizes and compiles plans rather than replacing external planners.
- Added `docs/pcp-runtime-implementation-roadmap.md` to sequence the implementation phases and record new Concern Log items for self-loop planning and a future standalone test/review layer.
- Added a naming rationale in `docs/pcp-positioning.md` explaining why PCP stands for `Progress Control Plane`.
