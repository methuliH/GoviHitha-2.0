# GoviHitha Codebase Organization

**Goal:** Clean, maintainable structure for ADK agents (Python) + Next.js frontend (TypeScript), ready for solo 16-day capstone build.

---

## Repository Structure (Monorepo)

```
govihitha/
│
├── README.md                          # Project overview, setup, deployment
├── .gitignore                         # Ignore .venv, node_modules, .env, etc.
├── .env.example                       # Template for env vars
│
├── agents/                            # ADK agents (Python)
│   ├── __init__.py
│   ├── main.py                        # Entry point, orchestrator setup
│   ├── requirements.txt               # Python deps (google-adk, requests, etc.)
│   ├── .adk-config.yaml               # ADK configuration (optional)
│   │
│   ├── agents/                        # Individual agent definitions
│   │   ├── __init__.py
│   │   ├── crop_diagnosis.py          # LLM Agent 1: Diagnosis
│   │   ├── weather_alert.py           # LLM Agent 2: Weather
│   │   ├── resource_recommendation.py # LLM Agent 3: Resources
│   │   └── orchestrator.py            # Workflow Agent: Coordinates all
│   │
│   ├── tools/                         # Reusable tools/functions for agents
│   │   ├── __init__.py
│   │   ├── gemini_vision.py           # Crop image analysis
│   │   ├── openmeteo_weather.py       # Weather API integration
│   │   ├── kapruka_search.py          # Product search / links
│   │   └── region_mapper.py           # Region → coordinates mapping
│   │
│   ├── prompts/                       # System prompts for each agent
│   │   ├── __init__.py
│   │   ├── crop_diagnosis_prompt.py   # System instructions for diagnosis
│   │   ├── weather_alert_prompt.py    # System instructions for weather
│   │   ├── resource_prompt.py         # System instructions for resources
│   │   └── orchestrator_prompt.py     # System instructions for orchestrator
│   │
│   ├── schemas/                       # Output schemas (JSON validation)
│   │   ├── __init__.py
│   │   ├── diagnosis_schema.py        # Pydantic schema for diagnosis output
│   │   ├── weather_schema.py          # Pydantic schema for weather output
│   │   ├── resource_schema.py         # Pydantic schema for resources
│   │   └── orchestrator_schema.py     # Pydantic schema for final output
│   │
│   ├── config/                        # Configuration
│   │   ├── __init__.py
│   │   ├── settings.py                # API keys, model names, constants
│   │   └── constants.py               # Regions, crop types, timeout values
│   │
│   ├── utils/                         # Shared utilities
│   │   ├── __init__.py
│   │   ├── image_processor.py         # Image resize, base64 encoding
│   │   ├── error_handler.py           # Custom exceptions, retry logic
│   │   └── logger.py                  # Logging configuration
│   │
│   └── tests/                         # Python tests (optional for capstone)
│       ├── __init__.py
│       ├── test_agents.py
│       └── test_tools.py
│
├── frontend/                          # Next.js frontend (TypeScript)
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── .env.example                   # Frontend env vars (API endpoint)
│   ├── .env.local                     # Local overrides (not committed)
│   │
│   ├── public/                        # Static assets
│   │   ├── logo.svg                   # GoviHitha logo
│   │   ├── favicon.ico
│   │   └── examples/                  # Sample crop images
│   │
│   ├── src/
│   │   ├── pages/                     # Next.js pages/routes
│   │   │   ├── _app.tsx               # App wrapper, providers
│   │   │   ├── _document.tsx          # HTML head configuration
│   │   │   ├── index.tsx              # Home / Query input page
│   │   │   ├── results.tsx            # Results display page
│   │   │   ├── about.tsx              # About / FAQ page
│   │   │   └── api/                   # Backend-for-frontend API routes
│   │   │       ├── agents.ts          # POST /api/agents → call ADK
│   │   │       ├── status.ts          # GET /api/status → health check
│   │   │       └── test.ts            # GET /api/test → sample data
│   │   │
│   │   ├── components/                # Reusable UI components
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx         # App header/navbar
│   │   │   │   ├── Footer.tsx         # Footer
│   │   │   │   └── MainLayout.tsx     # Wraps pages with header/footer
│   │   │   │
│   │   │   ├── forms/
│   │   │   │   ├── QueryForm.tsx      # Main input form (crop, symptoms, image, region)
│   │   │   │   ├── ImageUpload.tsx    # Image upload component
│   │   │   │   └── RegionSelect.tsx   # Region dropdown
│   │   │   │
│   │   │   ├── cards/
│   │   │   │   ├── DiagnosisCard.tsx  # Display diagnosis result
│   │   │   │   ├── WeatherCard.tsx    # Display weather alerts
│   │   │   │   ├── ResourceCard.tsx   # Display product recommendations
│   │   │   │   └── ActionPlanCard.tsx # Display final action plan
│   │   │   │
│   │   │   ├── loading/
│   │   │   │   ├── LoadingSpinner.tsx # Spinner UI
│   │   │   │   └── AgentProgress.tsx  # Show agent execution status
│   │   │   │
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx         # Primary CTA button
│   │   │   │   ├── Badge.tsx          # Confidence/urgency badges
│   │   │   │   └── Alert.tsx          # Error/warning alerts
│   │   │   │
│   │   │   └── examples/
│   │   │       └── ExampleDiagnosis.tsx  # Sample result for reference
│   │   │
│   │   ├── lib/                       # Shared utilities & helpers
│   │   │   ├── api.ts                 # API client (fetch wrapper, error handling)
│   │   │   ├── image.ts               # Image processing (base64 encoding, compression)
│   │   │   ├── constants.ts           # App constants (crop types, regions, etc.)
│   │   │   └── types.ts               # Shared types/interfaces
│   │   │
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useAgent.ts            # Hook for calling agents, managing loading state
│   │   │   └── useImageUpload.ts      # Hook for handling image uploads
│   │   │
│   │   ├── styles/                    # Global styles
│   │   │   └── globals.css            # Tailwind imports, global styles
│   │   │
│   │   └── config/
│   │       └── api.ts                 # API base URL, endpoints config
│   │
│   └── tests/                         # Frontend tests (optional)
│       ├── __setup__.ts
│       └── components/
│           └── QueryForm.test.tsx
│
└── docs/                              # Documentation (optional)
    ├── ARCHITECTURE.md                # System design, data flow diagrams
    ├── DEPLOYMENT.md                  # How to deploy agents + frontend
    ├── API.md                         # ADK API spec, response formats
    └── CONTRIBUTING.md                # Development guidelines


```

---

## File Responsibilities (What Goes Where)

### **agents/** (Python - ADK Agents)

| Folder | Purpose | Example Files |
|--------|---------|----------------|
| `agents/` | Individual agent implementations | `crop_diagnosis.py`, `weather_alert.py` |
| `tools/` | Reusable functions agents call | `gemini_vision.py`, `openmeteo_weather.py` |
| `prompts/` | System prompts for agents | `crop_diagnosis_prompt.py` |
| `schemas/` | Output validation (Pydantic) | `diagnosis_schema.py` (defines JSON structure) |
| `config/` | Settings, API keys, constants | `settings.py` (loads from .env) |
| `utils/` | Pure utility functions | `image_processor.py`, `logger.py` |
| `tests/` | Python unit tests | `test_agents.py` |

**Key Files:**
- **agents/main.py** — Sets up ADK, runs `adk web` or serves API
- **config/settings.py** — Loads Gemini key, OpenMeteo config, etc. from `.env`
- **schemas/**.py — Pydantic models for strict output validation

---

### **frontend/** (TypeScript/React - Next.js)

| Folder | Purpose | Example Files |
|--------|---------|----------------|
| `pages/` | Route handlers & page components | `index.tsx` (home), `results.tsx` (results page) |
| `pages/api/` | Backend-for-frontend routes | `agents.ts` (POST to ADK agents), `status.ts` (health check) |
| `components/` | Reusable UI pieces | `QueryForm.tsx`, `DiagnosisCard.tsx` |
| `lib/` | Utilities, API client, helpers | `api.ts` (fetch wrapper), `image.ts` (base64), `constants.ts` |
| `hooks/` | Custom React hooks | `useAgent.ts` (manage agent calls + loading) |
| `styles/` | Global CSS (Tailwind) | `globals.css` |
| `config/` | API configuration | `api.ts` (base URL, endpoints) |
| `public/` | Static assets | Logo, sample images |

**Key Files:**
- **pages/index.tsx** — Home: input form (crop, symptoms, image, region)
- **pages/results.tsx** — Results: displays diagnosis, weather, resources, action plan
- **pages/api/agents.ts** — Backend-for-frontend: receives form data, calls ADK agents
- **lib/api.ts** — Fetch wrapper that calls `pages/api/agents.ts`
- **lib/types.ts** — TypeScript interfaces matching ADK output schemas

---

## Import Conventions

### Python (agents/)

```python
# Standard library
import os
import json
from pathlib import Path

# Third-party
from google_adk import agent, llm
import google.generativeai as genai
import requests

# Local
from agents.tools.gemini_vision import analyze_crop_image
from agents.schemas.diagnosis_schema import DiagnosisOutput
from agents.config.settings import GEMINI_API_KEY
```

### TypeScript (frontend/)

```typescript
// External packages
import { useState, useCallback } from 'react'
import axios from 'axios'

// Internal absolute imports
import { QueryForm } from '@/components/forms/QueryForm'
import { useAgent } from '@/hooks/useAgent'
import { REGIONS } from '@/lib/constants'
import type { DiagnosisResult } from '@/lib/types'

// Types
import type { NextApiRequest, NextApiResponse } from 'next'
```

---

## Key Design Decisions

### 1. **Monorepo vs. Separate Repos?**
**Decision: Monorepo** (single repo, two folders)
- ✅ Easier to manage for solo capstone (16 days, one person)
- ✅ Clear separation: `agents/` for ADK, `frontend/` for Next.js
- ✅ Single GitHub repo for judges to review
- ❌ Deploy separately (agents to Cloud Run, frontend to Vercel)

### 2. **Next.js API Routes as Backend-for-Frontend**
```
Browser → Next.js API route (/api/agents.ts)
              ↓
         Call ADK agent (deployed to Cloud Run)
              ↓
         Format response, send back to browser
```
- ✅ Decouples frontend from agents (can change ADK endpoint)
- ✅ Single origin (no CORS issues)
- ✅ Can add auth/logging at API layer later

### 3. **Schemas for Type Safety**
- ADK agents return JSON → validated with Pydantic (Python)
- Next.js TypeScript types match those schemas
- Prevents runtime surprises

### 4. **Environment Variables**
```
agents/.env              # GOOGLE_API_KEY, OPENMETEO_API_KEY, etc.
frontend/.env.local     # NEXT_PUBLIC_API_ENDPOINT (if different)
.env.example            # Template, committed
```

---

## Build Order (16-Day Timeline)

**Days 1–2: Setup**
- [ ] Clone repo, create folder structure (copy this)
- [ ] Set up Python venv, install ADK + deps
- [ ] Set up Next.js, install Tailwind

**Days 3–5: ADK Agents**
- [ ] Implement agents (crop_diagnosis, weather_alert, resources)
- [ ] Add tools (gemini_vision, openmeteo, kapruka_search)
- [ ] Test with `adk web agents/`

**Days 6–8: Frontend**
- [ ] Build QueryForm component
- [ ] Build result cards (Diagnosis, Weather, Resources, ActionPlan)
- [ ] Create pages/index.tsx (home), pages/results.tsx

**Days 9–11: Integration**
- [ ] Implement pages/api/agents.ts (calls ADK agents)
- [ ] Wire up useAgent hook
- [ ] Test end-to-end locally (run agents + frontend together)

**Days 12–13: Polish**
- [ ] Deploy agents to Cloud Run
- [ ] Update API endpoint in frontend
- [ ] Test live endpoint

**Days 14–16: Documentation**
- [ ] Write README, ARCHITECTURE.md
- [ ] GitHub commit + push
- [ ] Kaggle submission

---

## Safety Checklist (Before Moving/Renaming Files)

- [ ] If moving `agents/tools/gemini_vision.py`:
  - Update imports in `agents/agents/crop_diagnosis.py`
  - Update `__init__.py` exports
- [ ] If renaming `frontend/lib/types.ts`:
  - Update all `import type { ... } from '@/lib/types'`
  - Check pages/api routes
- [ ] If changing API endpoint structure:
  - Update `frontend/lib/api.ts` (fetch URL)
  - Update `frontend/config/api.ts` (constants)
  - Document in README

---

## Next Steps

1. **Create this folder structure** (copy the tree above)
2. **Initialize git**
   ```bash
   git init
   git add .
   git commit -m "Initial project structure"
   ```
3. **Start with agents/requirements.txt + frontend/package.json**
4. **Write a quick README** describing the structure
5. **Begin building** (start with agents in Days 1–5)

---

**Ready to scaffold the actual files, or are there questions about the structure?**