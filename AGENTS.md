# Repository Guidelines

## Project Structure & Module Organization
`plugin/pcp.ts` is the core OpenCode plugin source. Keep tool definitions, lifecycle hooks, and `.opencode/pcp/` state handling aligned there. `skills/pcp-intake/`, `skills/pcp-setup/`, and `skills/pcp-sprint-review/` each ship one `SKILL.md`; update the matching skill whenever plugin behavior or user prompts change. `docs/architecture.svg` and `docs/architecture.png` hold the system diagram, while `README.md` and `README.zh.md` cover installation and usage.

## Build, Test, and Development Commands
There is no checked-in package manifest or scripted build yet, so validation is manual:

- `npx skills add JohnnyHua/pcp-skills` installs the published bundle for smoke testing.
- `cp plugin/pcp.ts ~/.config/opencode/plugins/pcp.ts` loads the local plugin into OpenCode.
- `cp -R skills/pcp-* ~/.config/opencode/skills/` refreshes the bundled skills locally.
- Reload OpenCode and confirm the console prints `PCP initialized`.
- In a scratch repo, run `pcp_init`, `pcp_plan`, and `pcp_status` to verify queue setup and context injection.
- `git diff --check` catches whitespace and conflict-marker issues before review.

## Coding Style & Naming Conventions
Use TypeScript with 2-space indentation, semicolons, and small helpers instead of deeply nested blocks. Keep tool names, event keys, and persisted fields stable and explicit, following the current `pcp_*` and `backlog_*` patterns. Skill folders use kebab-case and expose a single `SKILL.md`. When user-facing behavior changes, update both English and Chinese READMEs in the same PR.

## Testing Guidelines
No automated test suite is committed today. Validate changes by installing the local plugin and skills, then exercise task queue, backlog, and pivot flows manually. Check generated `.opencode/pcp/stack.json`, `events.jsonl`, and `WORKLOG.md` for correct state transitions. Include manual test steps and observed output in the PR description.

## Commit & Pull Request Guidelines
Follow the repo's Conventional Commit style: `feat:`, `fix:`, `docs:`. Keep subjects short; bilingual summaries are already used in history and are acceptable. PRs should stay narrow, list touched areas (`plugin`, `skills`, `docs`), describe manual verification, and include screenshots only when diagrams or rendered docs change. Do not commit generated business-project artifacts into this repository.
