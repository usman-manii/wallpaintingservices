<!--
Keep this file concise (20-50 lines). It guides AI coding agents (Copilot/GPT)
to become productive in this repository. Update when project structure
or workflows change.
-->
# Copilot / AI agent instructions

Purpose: Help an AI coding agent quickly discover the project's structure,
build/test/debug workflows, and project-specific conventions so suggestions
are accurate and actionable.

1) Quick repo discovery (first actions)
- List top-level files and folders: `ls -la` (or open workspace tree).
- Look for manifests in this order and read them if present: `package.json`,
  `pyproject.toml`, `requirements.txt`, `Pipfile`, `go.mod`, `Cargo.toml`,
  `composer.json`, `pom.xml`.
- Check for CI/workflows: `.github/workflows/**`, `azure-pipelines.yml`,
  `docker-compose.yml`, and `Dockerfile`.

2) Architecture & important boundaries
- Search for these folders to identify major components: `src/`, `app/`,
  `services/`, `cmd/`, `pkg/`, `api/`, `web/`, `backend/`, `frontend/`.
- If multiple services exist (multiple top-level folders with manifests),
  treat them as separate services with their own builds and tests.

3) Build / test / run workflows (how to discover)
- If a `package.json` exists read `scripts` for `start`, `build`, `test`.
- If Python: prefer `python -m pytest` when `tests/` present; inspect
  `tox.ini`, `pytest.ini`, or `setup.cfg` for custom config.
- If Docker files exist, prefer using `docker compose up --build` for local
  multi-service runs and read `docker-compose.yml` for service names.

4) Project-specific conventions (how to detect patterns)
- Look for a `src/` import root or `__init__.py` to determine Python package
  layout — use relative imports if project uses them.
- For JS/TS, check `tsconfig.json` paths or a `baseUrl` to infer import roots.
- Tests: prefer existing test style (pytest, jest, mocha). Mirror their
  fixtures and naming patterns when adding tests.

5) Integration points & external dependencies
- Inspect `*.env`, `.env.example`, `secrets/`, `config/`, and CI workflows for
  external services (databases, queues, cloud resources) and how they're
  mocked in tests.
- If `services/` or `internal/clients` exist, examine client wrapper files to
  understand cross-service communication patterns.

6) Making changes and PRs
- Keep changes small and focused; follow existing file layout and style.
- When adding or modifying behavior, include or update minimal tests that
  follow existing test frameworks and fixtures.

7) If repository is empty or missing workflows
- Perform discovery steps above and present a one-paragraph summary of
  findings before making non-trivial edits. Ask for missing docs or run
  commands only after confirming with a human if environment access is
  required.

If anything here is unclear or you'd like project-specific rules added,
please provide a basic file list or a short README and I will update this
guide to include concrete examples from the codebase.
