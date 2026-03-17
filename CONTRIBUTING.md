# Contributing to FleeMa

Thank you for considering contributing to FleeMa!

## Development Workflow

1. **Fork & Clone** the repository.
2. **Create a branch** from `develop`:
   ```bash
   git checkout -b feature/your-feature develop
   ```
3. **Install dependencies**: `make install`
4. **Write a failing test** (RED step).
5. **Implement** the minimum code to pass (GREEN step).
6. **Refactor** and ensure tests still pass.
7. **Commit** with a conventional commit message.
8. **Open a PR** against `develop`.

## Coding Standards

### Backend (Python)
- Follow PEP 8 (enforced by Ruff)
- Type hints encouraged
- Run `make lint-backend` before committing
- 100% test coverage for new features

### Frontend (TypeScript)
- Strict TypeScript — no `any`
- Functional components with hooks
- Run `make lint-frontend` before committing

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(auth): add password reset endpoint
fix(tenants): correct subdomain validation
chore(ci): update Node version in pipeline
docs: update API endpoint table in README
```

## Branch Strategy

| Branch    | Purpose                        |
|-----------|--------------------------------|
| `main`    | Production-ready releases      |
| `develop` | Integration branch for PRs     |
| `feature/*` | New features                 |
| `fix/*`   | Bug fixes                      |

## Issue Labels

| Label        | Meaning                              |
|--------------|--------------------------------------|
| `EPIC`       | Large feature grouping               |
| `STORY`      | User-facing feature                  |
| `TASK`       | Technical task                       |
| `DEVOPS`     | Infrastructure / CI/CD               |
| `CHORE`      | Maintenance / cleanup                |
| `bug`        | Something isn't working              |

## Running Tests

```bash
make test            # All tests
make test-backend    # Backend only
make test-frontend   # Frontend only
```

## Code Review Checklist

- [ ] Tests added/updated for the change
- [ ] No lint errors (`make lint`)
- [ ] Conventional commit message
- [ ] Documentation updated if needed
- [ ] No debug/console.log statements left
