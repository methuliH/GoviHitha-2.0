# Bug Report: Crop/Disease Mismatch — "Rice Leaf Blast" for Tomato

**Date:** 2026-07-03  
**Reported symptom:** Submitted Tomato/Nuwara Eliya query; received "Rice Leaf Blast" + Tricyclazole recommendation + waterlogging action plan.

---

## 1. Root Cause

**The Next.js API route at `frontend/src/pages/api/agents.ts` contains a hardcoded mock result that unconditionally returns `disease_name: "Rice Leaf Blast"` — along with rice-blast-specific treatments and a waterlogging action plan — for every submission, regardless of `crop_type`, whenever the environment variable `AGENT_URL` is not configured.**

When `AGENT_URL` is absent (i.e., the real Python backend is not running), the route's `buildMockResult()` function (lines 9–76) is called instead of proxying to the backend. This function ignores the submitted `crop_type` for the disease outcome — the `situation_summary` string does interpolate `query.crop_type` into the intro sentence, which is why the output said "Your tomato crop … has been diagnosed with Rice Leaf Blast" — a self-contradictory string produced by mixing a dynamic prefix with a static disease name.

Every field in the mock response is hardcoded for Rice Leaf Blast:
- `disease_name: "Rice Leaf Blast"`
- `description`: references *Magnaporthe oryzae*, a rice pathogen
- `treatment_steps`: Tricyclazole 75% WP (a rice-blast fungicide), field drainage
- `resources.recommendations[0].product_name`: Tricyclazole 75% WP
- `weather.alerts[0].risk_type`: WATERLOGGING (paddy field framing)
- `action_plan`: all items reference rice-blast treatment

---

## 2. Evidence by Investigation Step

### Step 1 — Prompt construction

**File:** `agents/agents/crop_diagnosis.py` lines 20–26, 58–63

The *actual* `diagnose()` method signature is:

```python
def diagnose(
    self,
    crop_type: str,
    symptoms: str,
    image_source: str,
    region: str,
) -> DiagnosisResult:
```

This differs from the assumed signature (`image_path`, no `crop_type`). `crop_type` is present and is correctly interpolated into the user prompt at lines 58–63:

```python
user_prompt = (
    f"Crop: {crop_type}\n"
    f"Region: {region} (Sri Lanka)\n"
    f"Farmer-reported symptoms: {symptoms}\n\n"
    "Diagnose the disease shown in the image."
)
```

The `crop_type` field is sent to Gemini. This is **not** the root cause of the bug.

**Secondary issue in the system prompt** (`agents/prompts/crop_diagnosis_prompt.py` line 15):

```
"disease_name": "Common name of disease or pest (e.g. 'Rice Leaf Blast', 'Healthy')",
```

Using "Rice Leaf Blast" as the JSON template example biases the model toward outputting rice-disease names. This is a contributing factor if the real backend is ever reached with an ambiguous image.

### Step 2 — Response parsing

**File:** `agents/agents/crop_diagnosis.py` lines 91–101; `agents/schemas/diagnosis_schema.py` lines 9–29

`DiagnosisResult` schema has no `crop_type` field. After the JSON is parsed, `disease_name` is taken verbatim from Gemini's response with no validation:

```python
clean = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
data = json.loads(clean)
result = DiagnosisResult.model_validate(data)
```

The two `@field_validator` methods on `DiagnosisResult` only clamp `confidence` and normalise `risk_level`. There is no check whether `disease_name` is plausible for the submitted crop.

### Step 3 — Crop/disease validation layer

**Searched:** all files under `agents/` (excluding `.venv`), `frontend/src/`.

No allow-list, lookup table, or plausibility check exists anywhere in the codebase. There is no function, dictionary, or validation step that maps `crop_type → set[valid diseases]` or rejects a returned `disease_name` that cannot affect the named crop.

**Conclusion:** absent. This is a secondary gap that would allow the bug to persist even if the primary cause (the mock) is fixed.

### Step 4 — Reproduction script output

**Script location:** `agents/reproduce_crop_mismatch.py` (throwaway; not in test suite)

**Inputs used:**
- `crop_type`: `tomato`
- `region`: `Nuwara Eliya`
- `symptoms`: *yellowing leaves, brown concentric spots on edges, spreading inward from older leaves, some drying/curling, leaves dropping*
- Image: No local tomato disease fixture exists in this repository. The PlantVillage URL from `test_adk_connection.py` returned HTTP 404. Fallback used: `frontend/public/farmland-bg.jpg` (a farmland aerial background image — not a disease sample). **This tests the code path only, not the model's accuracy on real disease imagery.**

**Raw Gemini response (first direct `call_gemini_vision` call):**

```json
{
  "disease_name": "Tomato Early Blight",
  "confidence": 0.95,
  "description": "The reported symptoms of yellowing leaves, brown concentric spots on edges spreading inward from older leaves, drying/curling, and leaf drop are classic indicators of Early Blight, caused by the fungus Alternaria solani. This disease thrives in warm, humid conditions common in Sri Lanka.",
  "treatment_steps": [
    "Immediately remove and destroy all infected leaves and plant debris to reduce fungal inoculum.",
    "Apply a registered fungicide containing active ingredients like chlorothalonil, mancozeb, or azoxystrobin, following label instructions carefully.",
    "Improve air circulation around plants by proper spacing and pruning lower leaves, especially those touching the soil.",
    "Avoid overhead irrigation; water plants at the base to keep foliage dry, particularly in the evening."
  ],
  "timeline": "With prompt and effective treatment, the spread of the disease can be halted within 7-14 days, allowing new healthy growth to emerge. Severely damaged leaves will not recover.",
  "prevention": "Use disease-free seeds or seedlings. Practice crop rotation with non-solanaceous crops for at least 2-3 years. Ensure adequate plant spacing for good air circulation. Mulch around plants to prevent soil splash onto lower leaves. Implement a preventative fungicide spray program during periods of high humidity or rainfall.",
  "risk_level": "high"
}
```

**Parsed `DiagnosisResult` (second call, via `agent.diagnose()` — different model invocation):**

```json
{
  "disease_name": "Unable to Diagnose",
  "confidence": 0.1,
  "description": "The provided aerial image does not show close-up details of individual plants or leaves, making it impossible to visually confirm the reported symptoms of yellowing leaves and concentric spots on the tomato crop.",
  "treatment_steps": [],
  "timeline": "",
  "prevention": "",
  "risk_level": "medium",
  "error": null
}
```

**Key finding from reproduction:** When the real backend is called with `crop_type="tomato"`, Gemini correctly returns a tomato-appropriate disease ("Tomato Early Blight"). "Rice Leaf Blast" was **not** returned in either live call. This confirms the bug is not in the Gemini code path — it only manifests via the hardcoded mock fallback.

The inconsistency between the two live calls (one returned "Tomato Early Blight", the other "Unable to Diagnose") is caused by the non-deterministic model and the non-representative test image (an aerial farmland photo rather than a close-up disease shot).

### Step 5 — Frontend → Backend data flow

**Files:** `frontend/src/components/forms/QueryForm.tsx`, `frontend/src/lib/api.ts`, `frontend/src/pages/api/agents.ts`

`QueryForm.tsx` (lines 48–53) correctly includes `crop_type` in the submitted `AgentQuery`:

```typescript
onSubmit({
  crop_type: form.crop_type as CropType,
  symptoms: form.symptoms.trim(),
  region: form.region as Region,
  image_base64: form.image_base64,
});
```

`api.ts` (lines 10–16) forwards the full `AgentQuery` JSON body to `/api/agents`.

`agents.ts` (lines 90–93) validates all four fields, then either:
- **If `AGENT_URL` is set:** proxies the full `query` object (including `crop_type`) to the Python backend via `JSON.stringify(query)` (line 104). The `crop_type` is not dropped.
- **If `AGENT_URL` is unset:** calls `buildMockResult(query)` which ignores `crop_type` for the diagnosis outcome (lines 9–76).

**Conclusion:** `crop_type` is not silently dropped anywhere in the live backend path. The drop only occurs in the mock fallback.

### Step 6 — Image/data mismatch possibility

There is no evidence of a mislabeled test fixture. No tomato-disease images exist as local fixtures in this repository at all. The only JPEG in the repo is `frontend/public/farmland-bg.jpg`, an aerial farmland background image unrelated to crop disease diagnosis. The reported bug output ("Rice Leaf Blast", Tricyclazole, waterlogging risk) exactly matches the hardcoded values in `buildMockResult()`, leaving no ambiguity about the source. A mislabeled image is not a plausible alternative explanation here.

---

## 3. Severity and Scope

**Scope: affects every single diagnosis when the Python backend is not configured.**

This is not an edge case. `AGENT_URL` defaults to absent (it is not in `.env.example`), which means any developer running only the Next.js frontend — or any production deployment where `AGENT_URL` was not set — gets the mock response for 100% of queries. The mock cannot be correct for any crop other than rice, and it cannot reflect the actual uploaded image or symptoms.

The real backend code path (Python + Gemini) appears to handle `crop_type` correctly and does not reproduce the bug when `AGENT_URL` is configured.

---

## 4. Recommended Fix

**Primary fix — make the mock crop-aware or remove it:**

Option A (preferred): Remove `buildMockResult()` and return a 503 when `AGENT_URL` is not set, so the error is visible rather than silently wrong.

Option B: If the mock must remain for local UI development, make it branch on `query.crop_type` and return a plausible mock for each crop (or at minimum, parametrise `disease_name`, `treatment_steps`, and `resources` from `query.crop_type` instead of hardcoding rice-blast content).

**Secondary fix — remove the biasing example from the system prompt:**

In `agents/prompts/crop_diagnosis_prompt.py` line 15, change:

```
"disease_name": "Common name of disease or pest (e.g. 'Rice Leaf Blast', 'Healthy')",
```

to a crop-neutral example:

```
"disease_name": "Common name of disease or pest (e.g. 'Early Blight', 'Healthy')",
```

**Tertiary fix — add a crop/disease plausibility check:**

Add a post-parse validation step in `CropDiagnosisAgent.diagnose()` that checks whether the returned `disease_name` is plausible for the submitted `crop_type`, using a crop → known-disease allow-list. If the check fails, set `disease_name = "Unable to Diagnose"` and `error = "Diagnosed disease is not known to affect {crop_type}"`. This is a safety net for cases where Gemini hallucinates a cross-crop result on the real backend path.

---

## 5. What Could Not Be Verified

- **No real tomato disease image was available:** The PlantVillage URL in `test_adk_connection.py` returned HTTP 404. The Wikimedia URL in `test_diagnosis.py` returned HTTP 403. No local disease-image fixtures exist in the repository. The reproduction run used `frontend/public/farmland-bg.jpg` as a fallback. The live Gemini call therefore cannot be considered a faithful accuracy test for a real diseased-tomato image.

- **`AGENT_URL` environment variable status in the reported test run:** It is not known from the bug report whether `AGENT_URL` was unset (which would explain the mock being returned) or set to a backend that itself had a bug. Based on the evidence, the mock path is the most likely explanation.

- **`backend/` directory referenced in the task brief:** This repo uses `agents/` as the backend root, not `backend/`. There is no `backend/` directory, no `backend/agents/crop_diagnosis.py`, and no `backend/prompts/crop_diagnosis_prompt.txt`. All findings above reference actual file paths.
