Govi Hitha: Diagnose Crop/Disease Mismatch Bug

Project Context

You are working on Govi Hitha ("Farmer's Friend"), an AI-powered crop advisory
system for Sri Lankan farmers. Backend: Python + Google ADK + Gemini 2.0 Flash
(vision). Core agent: CropDiagnosisAgent in backend/agents/crop_diagnosis.py,
called as agent.diagnose(image_path=..., symptoms=..., region=...), returning a
DiagnosisResult dataclass (backend/schemas/diagnosis.py).

The Bug

A test run submitted:


Crop type: Tomato
District: Nuwara Eliya
Symptoms: yellowing leaves, brown concentric spots on edges, spreading
inward from older leaves, some drying/curling, leaves dropping


The system returned a diagnosis of "Rice Leaf Blast" — a disease that only
affects rice (Magnaporthe oryzae), never tomato. The output also referenced
a "waterlogging risk" action plan seemingly generated from weather data, and a
recommendation to buy Tricyclazole (a rice blast fungicide) — nonsensical for
a tomato crop.

This is a diagnostic-only task. Do not fix anything yet. Your job is to find
and report the root cause with evidence, so a fix can be scoped correctly.

Investigation Steps (do all of these, in order)


Inspect the prompt construction.
Open backend/prompts/crop_diagnosis_prompt.txt and the code in
crop_diagnosis.py that builds the actual message sent to Gemini. Answer:

Is the crop parameter/field actually interpolated into the prompt text
sent to Gemini, or is only symptoms and region used?
If crop isn't part of the diagnose() signature at all (recall the
assumed signature is diagnose(image_path=..., symptoms=..., region=...)),
confirm that explicitly — this alone could be the root cause, since the
model would have no idea it's looking at a tomato plant except from the
image itself.



Check the response parsing.
Look at how Gemini's raw response is parsed into DiagnosisResult. Confirm
whether disease_name is taken verbatim from the model with no validation
against the crop type.
Check for a crop/disease validation layer.
Search the codebase for any allow-list, lookup table, or validation step
that checks whether a diagnosed disease is even plausible for the given
crop. Report whether one exists (it likely doesn't — confirm).
Reproduce it.
Write a small throwaway reproduction script (do NOT add it to the test
suite, do NOT modify test_adk_connection.py) that calls
agent.diagnose() with:

image_path pointing to a real tomato early-blight image if one exists
in the repo's test fixtures/PlantVillage samples (search for it; if none
exists, use whatever tomato-disease image is available and log which one
you used)
symptoms = the exact text above
region = "Nuwara Eliya"
Print the full raw Gemini response (not just the parsed dataclass) so we
can see exactly what the model returned and why.


IMPORTANT: Do not mock the Gemini call. Do not weaken this into a fake
pass. If the API call fails (auth, quota, timeout), report that failure
verbatim as part of your findings — do not work around it or simulate a
response.
Check the frontend → backend data flow (if accessible in this repo).
Confirm whether the "Crop Type" dropdown value from the form actually gets
sent to the backend API route and forwarded into the diagnose() call at
all, versus being silently dropped somewhere in the API route or request
payload.
Check for image/data mismatch possibility.
Note whether it's plausible the uploaded image itself was actually a rice
leaf (not tomato) — i.e., a frontend/test-data mix-up rather than a backend
logic bug. State this as a possibility only if you find evidence (e.g. the
test fixture used was mislabeled), not as a guess.


Deliverable

Produce a single markdown report at backend/BUG_REPORT_crop_mismatch.md
containing:


Root cause (state it plainly, e.g. "the crop field is never passed to
diagnose() or interpolated into the Gemini prompt")
Evidence for each investigation step above (file names, line numbers or
short code excerpts, and the raw reproduction output from step 4)
Severity/scope: does this affect every diagnosis, or only when crop and
image content could plausibly diverge?
Recommended fix (described, not implemented) — e.g. add crop to the
method signature and prompt, add a crop/disease plausibility check, or fix
the frontend payload — whichever the evidence actually points to
Explicitly note anything you could NOT verify (e.g. because a file doesn't
exist yet, or the API call failed) rather than guessing


Guard Rails


This is investigation only — do not modify crop_diagnosis.py,
crop_diagnosis_prompt.txt, test_adk_connection.py, or any schema files.
Do not weaken, skip, or mock any real check to force a clean-looking result.
Do not fabricate or assume file contents you haven't actually opened — if a
referenced file/path doesn't exist in the repo, say so explicitly in the
report instead of guessing at its likely contents.
If the assumed diagnose() signature turns out to be wrong in the real
code, report the actual signature you found — don't force it to match the
assumption.


Deliverables Checklist


✅ backend/BUG_REPORT_crop_mismatch.md with root cause + evidence
✅ Reproduction script output included in the report (or the exact error if
the API call failed)
✅ No changes to any production code, prompts, or tests
✅ Clear recommended fix (description only, not implemented)