# GoviHitha: Pull Request & Commit Guidelines

**For solo capstone: Keep it simple but professional. Judges read your GitHub.**

---

## Commit Conventions

### Format
```
<type>(<scope>): <subject>

<body (optional)>
```

### Types
- `feat`: New feature (new agent, new UI component)
- `fix`: Bug fix (agent timeout, image processing error)
- `refactor`: Code restructure (no behavior change)
- `docs`: Documentation only
- `test`: Add/update tests
- `chore`: Dependencies, tooling, setup

### Examples

**Good commits:**
```
feat(agents): implement crop diagnosis agent with Gemini Vision
fix(frontend): resolve image upload base64 encoding issue
refactor(agents): extract weather region mapping to constants
docs(readme): add deployment instructions
test(agents): add unit tests for crop_diagnosis_agent
```

**Bad commits:**
```
update stuff
fixed things
work in progress
asdfghjkl
```

### Rules
- ✅ **Atomic commits** — One logical change per commit
  - `git commit -m "feat(agents): add Gemini Vision tool"` ← Good
  - `git commit -m "feat: add 5 agents, fix frontend, update docs"` ← Bad
- ✅ **Clear subject** — Imperative mood, lowercase, no period
  - `"add crop diagnosis agent"` ✅
  - `"added crop diagnosis agent"` ❌
  - `"Adding crop diagnosis agent"` ❌
- ✅ **Descriptive body** (optional for simple commits)
  - For complex changes, add a blank line + explain *why*

### Example with Body
```
feat(weather): integrate OpenMeteo API for 7-day forecasts

- Fetch current conditions (temp, humidity, precipitation)
- Parse 7-day forecast for risk alerts (frost, waterlogging)
- Map region names to lat/long coordinates
- Handle API timeouts gracefully with fallback alerts

Fixes the issue where farmers got no weather context.
```

---

## Pull Request Workflow (Even for Solo)

**Why?** Your GitHub is part of the portfolio. Clean PR history shows professional practices.

### Step 1: Create a Feature Branch
```bash
git checkout -b feat/crop-diagnosis-agent
# or: feat/query-form-ui, fix/image-upload, etc.
```

### Step 2: Commit Atomically
```bash
# Work, test locally
git add agents/agents/crop_diagnosis.py
git commit -m "feat(agents): implement crop diagnosis with Gemini Vision"

git add agents/schemas/diagnosis_schema.py
git commit -m "feat(agents): add Pydantic schema for diagnosis output"

git add agents/tests/test_crop_diagnosis.py
git commit -m "test(agents): add unit tests for crop diagnosis"
```

### Step 3: Open a Pull Request (Even Though You're Solo)

#### PR Title
```
[AGENTS] Implement crop diagnosis agent with Gemini Vision integration
```

#### PR Description (Use Template Below)

```markdown
## What
Implement the Crop Diagnosis Agent (ADK LLM agent) that analyzes crop images 
and symptoms to identify diseases/pests.

## Why
This is the first of three agents required by the orchestrator. Farmers need 
diagnosis before weather/resource recommendations.

## How
- Uses Gemini 2.0 Flash for vision analysis (crop image)
- Matches symptoms to known Sri Lankan crop diseases
- Returns structured JSON with disease name, confidence, treatment steps
- Validated with Pydantic schema

## Changes
- Added `agents/agents/crop_diagnosis.py` (main agent logic)
- Added `agents/tools/gemini_vision.py` (Gemini Vision wrapper)
- Added `agents/schemas/diagnosis_schema.py` (output validation)
- Added `agents/tests/test_crop_diagnosis.py` (unit tests)

## Testing
- [x] Tested locally with `adk web` UI
- [x] Tested with 5+ sample crop images
- [x] Error handling for bad images
- [x] Unit tests pass (test_crop_diagnosis.py)

## Related
- Blocked by: Google Cloud project setup
- Blocks: Weather Alert Agent (needs diagnosis output)
- Docs: See docs/AGENTS.md for agent architecture
```

### Step 4: Review Your Own PR

Before merging:
- [ ] Code follows `CODE_ORGANIZATION.md` structure
- [ ] Imports are ordered correctly (standard → third-party → local)
- [ ] Functions are <30 lines, single responsibility
- [ ] Error handling included
- [ ] Tests pass locally
- [ ] No hardcoded API keys or secrets
- [ ] Commit messages are clear
- [ ] Related agent outputs match schemas

### Step 5: Merge to Main
```bash
git checkout main
git merge feat/crop-diagnosis-agent
git push origin main

# Clean up feature branch
git branch -d feat/crop-diagnosis-agent
```

---

## PR Template (Save as .github/pull_request_template.md)

Create this file in your repo:

```markdown
## What
<!-- What feature/fix does this PR add? -->

## Why
<!-- Why is this needed? What problem does it solve? -->

## How
<!-- How did you implement it? Any design decisions? -->

## Changes
<!-- List of files changed, grouped by domain -->
- **agents/**
  - New: `agents/agents/crop_diagnosis.py`
  - Modified: `agents/config/settings.py`
- **frontend/**
  - New: `src/components/forms/QueryForm.tsx`

## Testing
<!-- What testing was done? -->
- [ ] Local manual testing (adk web / npm run dev)
- [ ] Unit tests pass
- [ ] No console errors
- [ ] Tested on mobile & desktop (if UI)

## Blockers / Dependencies
<!-- Does this depend on other work? Does it block other work? -->

## Screenshots (if UI change)
<!-- Attach before/after if applicable -->
```

---

## Branch Naming Convention

| Type | Example |
|------|---------|
| Feature | `feat/crop-diagnosis-agent` |
| Bug fix | `fix/image-upload-base64` |
| Refactor | `refactor/extract-weather-constants` |
| Documentation | `docs/add-deployment-guide` |
| Experiment | `exp/try-different-ui-layout` (delete after) |

**Pattern:** `<type>/<short-description>` (lowercase, hyphens)

---

## 16-Day Commit Timeline (Example)

**Days 1–2: Setup**
```
chore: initialize project structure
chore: set up ADK environment + dependencies
chore: set up Next.js project + Tailwind
```

**Days 3–5: ADK Agents**
```
feat(agents): implement crop diagnosis agent
feat(agents): add Gemini Vision tool for image analysis
feat(agents): add diagnosis output schema + validation
feat(agents): implement weather alert agent
feat(agents): add OpenMeteo weather API integration
feat(agents): implement resource recommendation agent
test(agents): add unit tests for all three agents
```

**Days 6–8: Frontend**
```
feat(frontend): add QueryForm component (crop, symptoms, image, region)
feat(frontend): add ImageUpload subcomponent with preview
feat(frontend): add result cards (DiagnosisCard, WeatherCard, etc.)
feat(frontend): implement useAgent hook for agent calls
feat(frontend): create pages/api/agents.ts backend-for-frontend
```

**Days 9–11: Integration**
```
feat(integration): wire up frontend → ADK agents locally
fix(frontend): resolve CORS issues with local agent calls
test(integration): end-to-end testing with sample data
refactor(agents): extract shared error handling logic
```

**Days 12–13: Deployment**
```
chore(deployment): deploy agents to Google Cloud Run
chore(deployment): deploy frontend to Vercel
fix(deployment): update API endpoint for live backend
```

**Days 14–16: Polish**
```
docs: write main README with setup/deployment instructions
docs: add ARCHITECTURE.md with diagrams
docs: add API.md with agent input/output specs
chore: final cleanup, remove debug logs
chore: version bump to 1.0.0
```

---

## Best Practices

### ✅ DO
- Commit frequently (once per hour while coding)
- Write clear, descriptive commit messages
- Group related changes in one PR
- Reference docs in PR body (`See docs/AGENTS.md`)
- Test before committing
- Push to main only when ready for "production"

### ❌ DON'T
- Commit broken code (even to feature branches that judges might see)
- Mix unrelated changes in one commit
- Use vague messages like "fix stuff" or "update"
- Commit API keys, `.env` files, or secrets
- Make massive PRs (split into smaller, reviewable chunks)
- Force push to main branch (only to feature branches if needed)

---

## GitHub Best Practices for Solo Capstone

### .gitignore
Make sure this is in your `.gitignore`:
```
# Python
.venv/
__pycache__/
*.pyc
.env
*.egg-info/

# Node
node_modules/
.next/
dist/
.env.local

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Data
data/*.csv
logs/
```

### README.md Structure
```
# GoviHitha

Brief description + demo link

## Quick Start
- Python setup
- Node.js setup
- Local testing

## Project Structure
Brief overview, link to docs/CODE_ORGANIZATION.md

## Deployment
Link to docs/DEPLOYMENT.md

## Contributing
Link to this file (CONTRIBUTING.md)
```

### Releases (Optional, Nice for Portfolio)
Tag major milestones:
```bash
git tag -a v1.0.0-agents-complete -m "All three ADK agents implemented and tested"
git push origin v1.0.0-agents-complete
```

---

## For Judges (What They'll See)

Your commit history tells a story:
- **Clear commits** → Shows you know professional practices
- **Atomic changes** → Easy to review, understand intent
- **Good messages** → Judges can read what you did without asking
- **Regular pushes** → Shows consistent progress (not one giant push at deadline)

**Example judge view:**
```
✅ Good progression: feat → test → refactor → docs
✅ Clear messages: Can scan commit list and understand project
✅ No WIP/broken commits in main
✅ All deps/secrets in .env.example, not .env
```

This is portfolio material. Treat git like a story you're telling judges about your work.

---

## TL;DR Quick Reference

```bash
# Create feature branch
git checkout -b feat/agent-name

# Commit regularly (atomic)
git add <files>
git commit -m "type(scope): message"

# Push to main when ready
git push origin main

# Tag milestones (optional)
git tag -a v1.0.0-agents -m "Agents complete"
git push origin --tags
```

Done. Your GitHub history will look professional. ✨