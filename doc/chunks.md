# GoviHitha: Building in Chunks (16-Day Solo Breakdown)

**Goal:** Build in small, deliverable chunks. Each chunk = 1–2 days, testable, mergeable.

**Why chunks?**
- ✅ See progress every day (motivation)
- ✅ Catch bugs early (test after each chunk)
- ✅ Easy to debug (small changes)
- ✅ Can adjust timeline if one chunk takes longer
- ✅ Judges see clean commit history (professional)

---

## Overview Timeline

```
Week 1:   Setup + ADK Agents (Chunks 1–6)
Week 2:   Frontend + Integration (Chunks 7–12)
Week 3:   Deployment + Polish (Chunks 13–16)
```

---

## Chunk 1: Project Setup & Environment (Day 1, 3–4 hours)

**Goal:** Repo structure ready, dependencies installed, can run `adk web`.

### What to Build
- [ ] Folder structure (copy from CODE_ORGANIZATION.md)
- [ ] Python venv + requirements.txt
- [ ] Node.js + Next.js scaffolding
- [ ] .env.example template
- [ ] .gitignore
- [ ] README.md skeleton

### Files to Create
```
govihitha/
├── README.md (skeleton)
├── .gitignore
├── .env.example
├── agents/
│   ├── requirements.txt
│   ├── __init__.py
│   ├── main.py (stub)
│   ├── agents/
│   │   └── __init__.py
│   ├── tools/
│   │   └── __init__.py
│   ├── prompts/
│   │   └── __init__.py
│   ├── schemas/
│   │   └── __init__.py
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py (load .env)
│   └── utils/
│       └── __init__.py
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    ├── tailwind.config.js
    └── public/
```

### "Done" Criteria
- [ ] Can activate Python venv
- [ ] `pip install -r agents/requirements.txt` works
- [ ] Can run `npm install` in frontend/
- [ ] `adk --version` shows installed ADK
- [ ] `git log --oneline` shows initial commit

### Reference Docs
- CODE_ORGANIZATION.md

### Commit Message
```
chore: initialize project structure and dependencies
- Set up Python ADK environment with requirements.txt
- Initialize Next.js frontend with TypeScript + Tailwind
- Create folder structure per CODE_ORGANIZATION.md
- Add .gitignore, .env.example, README skeleton
```

### Time Estimate
**3–4 hours** (setup can be finicky; buffer is good)

---

## Chunk 2: ADK Agents Boilerplate (Day 1–2, 2–3 hours)

**Goal:** Three agent files exist, import without errors, can instantiate them.

### What to Build
- [ ] agents/agents/crop_diagnosis.py (stub class)
- [ ] agents/agents/weather_alert.py (stub class)
- [ ] agents/agents/resource_recommendation.py (stub class)
- [ ] agents/config/settings.py (load GOOGLE_API_KEY from .env)
- [ ] agents/__init__.py (exports agents)

### Files to Create
```
agents/agents/crop_diagnosis.py
agents/agents/weather_alert.py
agents/agents/resource_recommendation.py
agents/config/settings.py
agents/__init__.py
```

### Code Template (crop_diagnosis.py example)
```python
from google_adk import agent, llm
import logging

logger = logging.getLogger(__name__)

@agent.llm_agent
class CropDiagnosisAgent:
    """Diagnoses crop diseases from images and symptoms."""
    
    model = "gemini-2.0-flash"
    description = "Analyzes crop image + symptoms → disease diagnosis"
    
    def process_query(self, crop_type: str, symptoms: str, image_base64: str, region: str) -> dict:
        """Stub: will implement in next chunk."""
        return {
            "disease_name": "To be implemented",
            "confidence": 0.0,
            "description": "Agent logic will be added in next chunk",
            "treatment_steps": [],
            "timeline": "",
            "prevention": ""
        }
```

### "Done" Criteria
- [ ] All 3 agent files exist with class definitions
- [ ] `from agents.agents.crop_diagnosis import CropDiagnosisAgent` works
- [ ] No import errors
- [ ] `python -c "from agents import CropDiagnosisAgent; print('OK')"` prints OK
- [ ] GOOGLE_API_KEY loads from .env without error

### Reference Docs
- AGENTS.md (agent structure section)

### Commit Message
```
feat(agents): create agent boilerplate for diagnosis, weather, resources
- Add CropDiagnosisAgent stub
- Add WeatherAlertAgent stub  
- Add ResourceRecommendationAgent stub
- Add settings.py to load env vars
- All agents importable and instantiable
```

### Time Estimate
**2–3 hours**

---

## Chunk 3: Crop Diagnosis Agent Logic (Day 2–3, 4–5 hours)

**Goal:** Agent 1 works end-to-end with sample image.

### What to Build
- [ ] agents/agents/crop_diagnosis.py (full implementation with Gemini Vision)
- [ ] agents/tools/gemini_vision.py (Gemini Vision wrapper)
- [ ] agents/schemas/diagnosis_schema.py (Pydantic schema)
- [ ] agents/tests/test_crop_diagnosis.py (unit tests)
- [ ] Sample crop image (in agents/tests/fixtures/)

### "Done" Criteria
- [ ] `adk web agents/` launches without error
- [ ] Can submit test query in web UI to Diagnosis Agent
- [ ] Agent returns JSON matching DiagnosisOutput schema
- [ ] Output has: disease_name, confidence, treatment_steps, timeline
- [ ] Unit tests pass: `pytest agents/tests/test_crop_diagnosis.py -v`
- [ ] Handles bad image gracefully (no crash)

### Reference Docs
- AGENTS.md (Agent 1 details)
- TESTING.md (pytest setup)

### Commit Message
```
feat(agents): implement crop diagnosis agent with Gemini Vision
- Add gemini_vision.py tool for image analysis
- Implement CropDiagnosisAgent with full logic
- Add DiagnosisOutput Pydantic schema
- Add unit tests for diagnosis agent
- Tested with sample crop images locally
```

### Time Estimate
**4–5 hours** (Gemini integration + testing)

---

## Chunk 4: Weather Alert Agent (Day 3–4, 4–5 hours)

**Goal:** Agent 2 works, integrates with OpenMeteo API.

### What to Build
- [ ] agents/agents/weather_alert.py (full implementation)
- [ ] agents/tools/openmeteo_weather.py (OpenMeteo API wrapper)
- [ ] agents/config/constants.py (region → lat/long mapping)
- [ ] agents/schemas/weather_schema.py (Pydantic schema)
- [ ] agents/tests/test_weather_alert.py (unit tests)

### "Done" Criteria
- [ ] `adk web agents/` shows both Diagnosis + Weather agents
- [ ] Test Weather Agent in web UI (pass crop type + region)
- [ ] Returns JSON with current_weather + alerts
- [ ] OpenMeteo API calls work (no auth needed, public API)
- [ ] Unit tests pass: `pytest agents/tests/test_weather_alert.py -v`
- [ ] Handles bad region gracefully (fallback coords)

### Reference Docs
- AGENTS.md (Agent 2 details)
- OpenMeteo API: https://open-meteo.com/

### Commit Message
```
feat(agents): implement weather alert agent with OpenMeteo integration
- Add openmeteo_weather.py tool for real-time weather data
- Implement WeatherAlertAgent with risk detection
- Add region → coordinates mapping in constants.py
- Add WeatherAlert Pydantic schema
- Add unit tests for weather agent
- Tested with live OpenMeteo API
```

### Time Estimate
**4–5 hours**

---

## Chunk 5: Resource Recommendation Agent (Day 4–5, 4–5 hours)

**Goal:** Agent 3 works, generates Kapruka search links.

### What to Build
- [ ] agents/agents/resource_recommendation.py (full implementation)
- [ ] agents/tools/kapruka_search.py (product search + link generation)
- [ ] agents/schemas/resource_schema.py (Pydantic schema)
- [ ] agents/tests/test_resource_recommendation.py (unit tests)

### "Done" Criteria
- [ ] All 3 agents visible in `adk web` UI
- [ ] Test Resources Agent with diagnosis + weather context
- [ ] Returns JSON with product recommendations + Kapruka links
- [ ] Links are properly formatted URLs
- [ ] Unit tests pass: `pytest agents/tests/test_resource_recommendation.py -v`
- [ ] Can test in web UI: submit diagnosis → see resources

### Reference Docs
- AGENTS.md (Agent 3 details)

### Commit Message
```
feat(agents): implement resource recommendation agent with Kapruka links
- Add kapruka_search.py tool for product search
- Implement ResourceRecommendationAgent logic
- Add ProductRecommendation Pydantic schema
- Generate clickable Kapruka search links for products
- Add unit tests for resource agent
- All three agents now functional
```

### Time Estimate
**4–5 hours**

---

## Chunk 6: Orchestrator Agent (Day 5–6, 3–4 hours)

**Goal:** All three agents work together in parallel.

### What to Build
- [ ] agents/agents/orchestrator.py (Workflow Agent that runs all 3 in parallel)
- [ ] agents/schemas/orchestrator_schema.py (final output schema)
- [ ] agents/tests/test_orchestrator.py (integration tests)

### "Done" Criteria
- [ ] Select OrchestratorAgent in `adk web`
- [ ] Submit full farmer query (crop, symptoms, image, region)
- [ ] All 3 agents execute in parallel (visible in web UI traces)
- [ ] Returns synthesized output: situation_summary + all 3 agent outputs + action_plan
- [ ] Integration tests pass: `pytest agents/tests/test_orchestrator.py -v`
- [ ] Full E2E works in web UI with sample data

### Reference Docs
- AGENTS.md (Orchestrator details)

### Commit Message
```
feat(agents): implement orchestrator workflow agent
- Create OrchestratorAgent to coordinate 3 agents in parallel
- Add orchestration logic: diagnosis → weather → resources
- Synthesize outputs into coherent action plan
- Add OrchestrationOutput Pydantic schema
- Add integration tests
- All agents fully functional and tested
```

### Time Estimate
**3–4 hours**

**End of Week 1 Checkpoint:**
✅ All ADK agents working, tested locally with `adk web`.
Commit: `v1.0.0-agents-complete`

---

## Chunk 7: Frontend Project Setup (Day 6, 2–3 hours)

**Goal:** Next.js runs, Tailwind configured, can see blank pages.

### What to Build
- [ ] Next.js basic pages (index.tsx, results.tsx, about.tsx)
- [ ] Layout component (header, footer, main layout)
- [ ] Tailwind CSS working
- [ ] src/lib/types.ts (TypeScript interfaces matching agent schemas)
- [ ] src/lib/constants.ts (crop types, regions)

### "Done" Criteria
- [ ] `npm run dev` starts server at localhost:3000
- [ ] Can visit http://localhost:3000 → see blank home page
- [ ] Tailwind classes work (add test: `<div class="text-green-600">Test</div>`)
- [ ] No console errors
- [ ] TypeScript compiles without warnings

### Reference Docs
- CODE_ORGANIZATION.md (frontend structure)

### Commit Message
```
chore(frontend): set up Next.js scaffold with Tailwind
- Create basic page structure (index, results, about)
- Set up main layout with header/footer
- Configure Tailwind CSS
- Add TypeScript types matching agent schemas
- Add constants (crops, regions)
```

### Time Estimate
**2–3 hours**

---

## Chunk 8: Query Input Form Component (Day 6–7, 4–5 hours)

**Goal:** Beautiful form that collects crop, symptoms, image, region.

### What to Build
- [ ] src/components/forms/QueryForm.tsx (main form)
- [ ] src/components/forms/ImageUpload.tsx (image upload subcomponent)
- [ ] src/components/forms/RegionSelect.tsx (region dropdown)
- [ ] src/components/common/Button.tsx (styled button)
- [ ] src/components/forms/QueryForm.test.tsx (unit tests)

### "Done" Criteria
- [ ] Form renders on http://localhost:3000
- [ ] All fields visible: crop dropdown, symptoms textarea, region dropdown, image upload
- [ ] Image upload shows preview
- [ ] Submit button disabled until image uploaded
- [ ] Responsive on mobile (test with DevTools)
- [ ] Unit tests pass: `npm test -- QueryForm.test.tsx`
- [ ] Form looks intentional (not default HTML)

### Reference Docs
- DESIGN_PROMPT.md (UI spec)
- TESTING.md (React testing)

### Commit Message
```
feat(frontend): build query input form with image upload
- Create QueryForm component (crop, symptoms, image, region)
- Add ImageUpload with preview and validation
- Add RegionSelect dropdown
- Add Button component (styled, accessible)
- Implement responsive design (mobile-first)
- Add unit tests for form interactions
- Form fully functional and beautiful
```

### Time Estimate
**4–5 hours** (styling takes time for "lovable" look)

---

## Chunk 9: Result Cards Components (Day 7–8, 4–5 hours)

**Goal:** Beautiful cards that display diagnosis, weather, resources, action plan.

### What to Build
- [ ] src/components/cards/DiagnosisCard.tsx
- [ ] src/components/cards/WeatherCard.tsx
- [ ] src/components/cards/ResourceCard.tsx
- [ ] src/components/cards/ActionPlanCard.tsx
- [ ] src/components/common/Badge.tsx (confidence/urgency badges)
- [ ] src/components/loading/AgentProgress.tsx (loading state)
- [ ] src/components/cards/*.test.tsx (component tests)

### "Done" Criteria
- [ ] All 4 cards render correctly with sample data
- [ ] Diagnosis card shows: disease name, confidence, treatment steps, timeline
- [ ] Weather card shows: current conditions, 7-day alerts, risk flags
- [ ] Resource card shows: products, costs, Kapruka links
- [ ] Action plan card shows: numbered steps, urgency indicators
- [ ] Loading component shows agent progress animation
- [ ] All responsive on mobile
- [ ] Component tests pass

### Reference Docs
- DESIGN_PROMPT.md (card specs)

### Commit Message
```
feat(frontend): build result display cards
- Create DiagnosisCard (disease, treatment, timeline)
- Create WeatherCard (conditions, alerts, forecast)
- Create ResourceCard (products, links, costs)
- Create ActionPlanCard (prioritized steps)
- Add Badge component for confidence/urgency
- Add AgentProgress loading component
- Add component tests
- Results page ready for data integration
```

### Time Estimate
**4–5 hours**

---

## Chunk 10: API Client & Backend-for-Frontend Route (Day 8–9, 4–5 hours)

**Goal:** Frontend can call agents via Next.js API route.

### What to Build
- [ ] src/lib/api.ts (fetch wrapper, error handling)
- [ ] src/pages/api/agents.ts (POST endpoint that calls ADK agents)
- [ ] src/hooks/useAgent.ts (custom hook for managing agent calls + loading)
- [ ] src/lib/image.ts (base64 encoding, compression)

### "Done" Criteria
- [ ] `npm test -- api.test.ts` passes (mock tests)
- [ ] POST /api/agents endpoint works (test with curl or Postman)
- [ ] Input: { crop_type, symptoms, image_base64, region }
- [ ] Output: { diagnosis, weather, resources, action_plan }
- [ ] useAgent hook manages loading state, error handling
- [ ] Image compression works (resize large images before base64)
- [ ] No hardcoded API keys in frontend code

### Reference Docs
- CODE_ORGANIZATION.md (backend-for-frontend pattern)
- TESTING.md (API mocking)

### Commit Message
```
feat(frontend): add API client and backend-for-frontend route
- Create api.ts fetch wrapper with error handling
- Implement POST /api/agents endpoint
- Wire up agent orchestration call from frontend
- Add useAgent hook for state management
- Add image compression (lib/image.ts)
- Add API tests with mocking
- Frontend can now call agents
```

### Time Estimate
**4–5 hours**

---

## Chunk 11: Pages & Integration (Day 9–10, 4–5 hours)

**Goal:** Full UI flow works end-to-end locally (frontend → agents).

### What to Build
- [ ] src/pages/index.tsx (home page with QueryForm)
- [ ] src/pages/results.tsx (results page with all cards)
- [ ] src/pages/about.tsx (about/FAQ page)
- [ ] Navigation between pages
- [ ] Error boundaries, loading states

### "Done" Criteria
- [ ] Home page: Form visible, can submit
- [ ] Results page: Shows all cards with agent data
- [ ] Full E2E flow works:
  - [ ] Fill form on home
  - [ ] Click submit
  - [ ] Loading spinner shows
  - [ ] Redirects to results page
  - [ ] Diagnosis, weather, resources, action plan display
- [ ] Navigation works (home ↔ results ↔ about)
- [ ] No console errors
- [ ] Mobile responsive throughout

### Reference Docs
- CODE_ORGANIZATION.md

### Commit Message
```
feat(frontend): integrate pages and complete UI flow
- Create home page with QueryForm
- Create results page with all cards
- Create about/FAQ page
- Implement navigation between pages
- Wire up form submission → agent call → results display
- Add error boundaries and loading states
- Full E2E flow functional locally
```

### Time Estimate
**4–5 hours**

**End of Week 2 Checkpoint:**
✅ Full UI + frontend agents working locally. Can test end-to-end with local `adk web`.
Commit: `v1.0.0-frontend-complete`

---

## Chunk 12: Local Testing & Bug Fixes (Day 10–11, 4–5 hours)

**Goal:** End-to-end flow rock solid. All bugs found + fixed before deployment.

### What to Build
- [ ] End-to-end testing (manual, comprehensive)
- [ ] Bug fixes based on testing
- [ ] Edge case handling (bad images, missing fields, etc.)
- [ ] Performance optimization (image compression, caching)

### Test Scenarios
- [ ] Submit form with real crop image → get diagnosis
- [ ] Check weather alerts for different regions
- [ ] Click Kapruka links (should open)
- [ ] Mobile responsiveness (test on phone or DevTools)
- [ ] Bad inputs (bad image, empty symptoms, unknown region)
- [ ] Slow API (test with Network throttling)

### "Done" Criteria
- [ ] Zero console errors on happy path
- [ ] All bugs logged + fixed
- [ ] Edge cases handled gracefully
- [ ] Manual E2E test passes 10+ times
- [ ] Performance acceptable (API calls < 10 seconds)

### Reference Docs
- TESTING.md (manual testing checklist)

### Commit Message
```
test(e2e): comprehensive local testing and bug fixes
- Tested full E2E flow with real images
- Fixed image upload edge cases
- Improved error messages and loading states
- Optimized performance (image compression)
- Tested on mobile and desktop
- All major bugs resolved
- Ready for deployment
```

### Time Estimate
**4–5 hours**

---

## Chunk 13: Deploy Agents to Cloud Run (Day 11–12, 3–4 hours)

**Goal:** ADK agents live on Google Cloud, accessible via HTTP.

### What to Build
- [ ] Finalize agent code (no debug logs)
- [ ] Create deployment_metadata.json
- [ ] Deploy using `adk deploy cloud_run`

### "Done" Criteria
- [ ] `adk deploy cloud_run --project researchbrain-497600 --region us-central1` succeeds
- [ ] Get back HTTP endpoint (e.g., `https://govihitha-agents-xxxxx.run.app`)
- [ ] Can call endpoint via curl:
  ```bash
  curl -X POST https://govihitha-agents-xxxxx.run.app/invoke \
    -H "Content-Type: application/json" \
    -d '{"agent_name":"OrchestratorAgent", "input":{...}}'
  ```
- [ ] Returns correct response

### Reference Docs
- AGENTS.md (deployment section)
- Google Cloud docs

### Commit Message
```
chore(deployment): deploy agents to Google Cloud Run
- Create ADK runtime configuration
- Deploy agents to Cloud Run in researchbrain-497600 project
- Test HTTP endpoint with sample requests
- Document agent runtime ID and endpoint
```

### Time Estimate
**3–4 hours** (can be finicky; quota/permission issues possible)

---

## Chunk 14: Deploy Frontend & Update API Endpoint (Day 12–13, 3–4 hours)

**Goal:** Frontend live on Vercel, connected to live agents.

### What to Build
- [ ] Push frontend code to GitHub
- [ ] Connect Vercel to repo
- [ ] Set environment variables (API_ENDPOINT)
- [ ] Deploy to Vercel
- [ ] Test live flow

### "Done" Criteria
- [ ] Frontend lives at public Vercel URL
- [ ] Updated API endpoint to live agent endpoint
- [ ] Full E2E flow works with live agents
- [ ] No console errors in production
- [ ] Performance acceptable

### Reference Docs
- Vercel docs: https://vercel.com/docs

### Commit Message
```
chore(deployment): deploy frontend to Vercel
- Push code to GitHub (public repo)
- Connect Vercel to repo
- Set environment variables (NEXT_PUBLIC_API_ENDPOINT)
- Deploy to Vercel
- Tested full flow with live agents
- Live at: https://govihitha.vercel.app (or your URL)
```

### Time Estimate
**3–4 hours**

**End of Week 3 Checkpoint:**
✅ Full product live. Judges can visit URL, test end-to-end.
Commit: `v1.0.0-live`

---

## Chunk 15: Documentation & README (Day 13–14, 3–4 hours)

**Goal:** Professional docs so judges understand what they're looking at.

### What to Write
- [ ] **README.md** (overview, setup, live link)
- [ ] **ARCHITECTURE.md** (system design, data flow diagram)
- [ ] **API.md** (agent input/output spec)
- [ ] **DEPLOYMENT.md** (how to deploy agents + frontend)
- [ ] Code comments (docstrings, inline explanations)

### "Done" Criteria
- [ ] README explains: what is this, how to run, live link
- [ ] ARCHITECTURE has diagrams (ASCII or Figma)
- [ ] API.md shows exact JSON schemas
- [ ] Someone could deploy this following your docs
- [ ] All code has docstrings
- [ ] GitHub repo looks professional

### Reference Docs
- CONTRIBUTING.md (commit history = portfolio)

### Commit Message
```
docs: write comprehensive documentation
- Add README with project overview and live link
- Add ARCHITECTURE.md with system design + diagrams
- Add API.md with agent input/output specs
- Add DEPLOYMENT.md with deployment instructions
- Add docstrings to all agent classes and functions
- Documentation complete and professional
```

### Time Estimate
**3–4 hours**

---

## Chunk 16: Final Polish & Submission (Day 14–16, 4–5 hours)

**Goal:** Everything perfect. Ready for Kaggle submission.

### What to Do
- [ ] Final code review (no debug logs, no secrets)
- [ ] Test live flow one more time (comprehensive)
- [ ] Record demo video (2–3 min walkthrough)
- [ ] Verify live links work
- [ ] Create GitHub release (v1.0.0)
- [ ] Prepare Kaggle submission

### Submission Checklist
- [ ] GitHub repo public + clean
- [ ] Live URL works (frontend + agents)
- [ ] README has setup instructions
- [ ] ARCHITECTURE explains the system
- [ ] API documentation complete
- [ ] Demo video uploaded (YouTube or Kaggle)
- [ ] Commit history clean (no WIP, no secrets)
- [ ] Tags created (v1.0.0-agents, v1.0.0-frontend, v1.0.0-live)

### "Done" Criteria
- [ ] All 3 agents working on live endpoint
- [ ] Frontend beautifully displays results
- [ ] Judges can test end-to-end at your live URL
- [ ] GitHub makes you proud
- [ ] Submission passes all Kaggle checks

### Commit Message
```
chore: final polish and release v1.0.0
- Remove all debug logs and console.log
- Final code cleanup and optimization
- Verify all live links + API endpoints
- Record demo video
- Create release tag v1.0.0
- Ready for Kaggle submission
```

### Time Estimate
**4–5 hours**

---

## Quick Reference: Chunk Checklist

```
Week 1: ADK Agents
[ ] Chunk 1: Project Setup (3–4h)
[ ] Chunk 2: Agent Boilerplate (2–3h)
[ ] Chunk 3: Crop Diagnosis (4–5h)
[ ] Chunk 4: Weather Alert (4–5h)
[ ] Chunk 5: Resources (4–5h)
[ ] Chunk 6: Orchestrator (3–4h)
✅ CHECKPOINT: All agents working (v1.0.0-agents-complete)

Week 2: Frontend + Integration
[ ] Chunk 7: Frontend Setup (2–3h)
[ ] Chunk 8: Query Form (4–5h)
[ ] Chunk 9: Result Cards (4–5h)
[ ] Chunk 10: API Client (4–5h)
[ ] Chunk 11: Pages & Integration (4–5h)
[ ] Chunk 12: Local Testing (4–5h)
✅ CHECKPOINT: Full UI working locally (v1.0.0-frontend-complete)

Week 3: Deployment + Polish
[ ] Chunk 13: Deploy Agents (3–4h)
[ ] Chunk 14: Deploy Frontend (3–4h)
[ ] Chunk 15: Documentation (3–4h)
[ ] Chunk 16: Final Polish (4–5h)
✅ FINAL: Live on Kaggle (v1.0.0)

Total: ~60–70 hours ÷ 16 days = 4–5 hours/day (very doable)
```

---

## How to Use This

### Each Day
1. **Pick next chunk** from list above
2. **Read "What to Build" section**
3. **Open Claude Code** (or code yourself)
4. **Build & test** (reference the docs in your `/docs` folder)
5. **Test against "Done" criteria**
6. **Commit when done** (use commit message template)

### If a Chunk Takes Too Long
- ⏸️ **Pause.** Debug, but don't get stuck.
- 📝 **Document blockers.** (API quota? Build issue?)
- ⏭️ **Move on.** Come back after next chunk.
- 🆘 **Ask for help.** (Claude Code, or me)

### If a Chunk is Too Easy
- ✅ **Great.** Finish early.
- ⏩ **Move to next chunk.** You're ahead of schedule.
- 🎨 **Polish that chunk.** (Better design, tests, docs)

---

## Tips for Solo 16-Day Build

1. **Commit every chunk.** Don't wait until the end.
2. **Test after every chunk.** Catch bugs early.
3. **Read your docs before each chunk.** (You wrote them for this.)
4. **Take breaks.** Solo builds are marathon, not sprint.
5. **Celebrate milestones.** (v1.0.0-agents-complete = real progress!)
6. **GitHub is portfolio.** Clean commits + good messages = judges impressed.

---

**Ready to start Chunk 1?** I can walk you through setup, or you can do it solo and ping me if stuck.

What's your next move?