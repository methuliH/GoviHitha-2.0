# GoviHitha — Demo Video Script

Target length: **7:30–9:00** (guide allows 7–10 min). Team: SustainX — Methuli Heenkenda
(on camera / narrating), Hiruka Devendra, Mohamed Jaufer Mohamed Hisshan, Sehara Chamindi
Kodikara.

Record against the hosted demo (fast, reliable, no live-API risk during recording):
`https://<your-vercel-demo-url>` — see Section 6 for the one honesty beat this requires.

Suggested crop/district picks for a clean recording — see the "what to type" notes inline;
full coverage list is in the chat history / `doc/PlantingAdvisorPlan.md` and
`doc/MarketPriceCheckerPlan.md`.

---

## 0. Cold open — the problem (0:00–0:45)

**[ON SCREEN: face to camera, or a slide with the stat overlaid]**

> "In Sri Lanka, one government agricultural officer serves up to seven thousand farmers.
> That means when a pest outbreak hits, or a flood warning comes, most farmers have no one
> to call. Existing farming apps haven't fixed this — they've made it worse. The best one
> only gets used by 3% of rice farmers, because it asks farmers to download something new,
> make an account, and go looking for help. We built GoviHitha to flip that: meet farmers
> where they already are, with zero friction."

**[Cut to title card: GoviHitha — ගොවිහිත — "Farmer's Friend"]**

---

## 1. Solution overview (0:45–1:30)

**[ON SCREEN: homepage, http://localhost:3000 or the deployed URL, hero section visible]**

> "GoviHitha is an AI crop advisory web app for Sri Lankan smallholder farmers, built on
> Gemini and live weather data. It does three things: diagnoses crop disease from a photo,
> tells farmers what and when to plant based on the actual forecast, and shows today's
> market price before they negotiate with a middleman. Let's walk through all three."

**[Scroll homepage briefly — show the feature cards]**

---

## 2. Feature 1 — Crop Disease Diagnosis (1:30–3:15)

**[Click "Start Diagnosis" → /diagnose]**

> "A farmer takes a photo of a sick plant, picks their crop and district, and describes
> what they see. No login, no account."

**[Fill the form]**
- Crop type: **Rice (Oryza sativa)**
- District: **Kandy**
- Symptoms: type something like *"Yellowing leaves with dark brown spots spreading from
  the tips inward"*
- Upload: any leaf/plant photo (see `frontend/public/examples/` if present, or a real
  rice-leaf photo)

**[Click "Diagnose my crop" → results page]**

> "In seconds, Gemini Vision identifies the disease, gives a confidence score, and — this
> is the part that matters — it doesn't stop at a diagnosis."

**[Point out on screen, in order:]**
1. **Action plan** at the top — "the single prioritised thing to do right now"
2. **Diagnosis card** — disease name, confidence bar, treatment steps, recovery timeline
3. **Weather card** — "this is live OpenMeteo data, cross-referenced against the specific
   disease — if heavy rain is coming, it tells the farmer to treat *before* the rain, not
   after"
4. **Product recommendations** — real Hayleys Agriculture products with a dealer locator
   link, not a generic web search

> "Every one of these fields is grounded — the product recommendation only shows up if
> that exact product's label actually covers this disease. If there's no match, it says
> so honestly instead of making something up."

---

## 3. Feature 2 — Smart Planting Advisor (3:15–5:15)

**[Nav to "Plan Planting" → /advisor]**

> "This one's for the start of a season, before anything's even in the ground. A farmer
> just picks their crop and district — no photo needed."

**[Fill the form]**
- Crop type: **Tea**
- District: **Nuwara Eliya**

**[Submit → advisor-results]**

> "GoviHitha cross-references the crop against a 16-day weather forecast and recommends a
> real, named variety — not a generic suggestion. TRI 2025, in this case — that's an actual
> Tea Research Institute cultivar, picked because it suits Nuwara Eliya's up-country
> conditions."

**[Point out on screen:]**
1. **Recommended variety** card — variety name, why it was picked, days to maturity
2. **Sowing window** — a specific date range, chosen to avoid the heaviest forecast rain
3. **Season badge** (Yala/Maha) and **confidence** badge
4. **Risk notes** — e.g. irrigation advice if a dry stretch falls inside the window

> "This directly answers the second big problem in the proposal — farmers currently plant
> on inherited calendars that climate change has broken. Now it's a forecast-driven
> decision."

---

## 4. Feature 3 — Live Market Price Checker (5:15–6:45)

**[Nav to "Market Prices" → /market]**

> "Before a farmer sells to a middleman, they're negotiating blind. This is a single tap
> to fix that."

**[Fill the form]**
- Crop type: **Pepper**

**[Submit → market-results]**

> "Today's price, compared against the recent average, with a plain-language tip —
> 'prices are up, this is a good time to sell' or 'prices are down, consider holding.'
> No typing, no lookup, one tap."

**[Point out: today's price, 30-day average, trend badge, the negotiating tip]**

> "Notice this one's instant — no AI call at all for this feature. It's deliberately kept
> simple and fast, because farmers need this in the field, in seconds, possibly on a weak
> connection."

---

## 5. Architecture, in 30 seconds (6:45–7:15)

**[Optional: show a simple architecture slide/diagram, or just narrate over the browser]**

> "Under the hood: a Next.js frontend talks to a FastAPI backend. Three independent agents
> — diagnosis, weather, and planting advisor — call Gemini and OpenMeteo directly. The
> market price checker is a fourth, lightweight agent that needs no AI call at all. Every
> agent is built to degrade gracefully — if a call fails, the farmer still gets a usable
> result, never a crash."

---

## 6. Honesty beat — scope & what's simulated (7:15–7:45)

**Required if recording against the hosted demo, which runs on mock data for reliability.**
Keep this short and confident, not apologetic — per the submission guide, explaining
what's simulated vs. live is expected, not penalised.

> "Two honesty notes, matching what's written up in our README's Scope Delivered section.
> First: this hosted demo you're watching runs on curated representative data for
> reliability during judging — the same UI, driven by the same real Gemini and OpenMeteo
> calls, is fully working end-to-end locally; we can show that live if you'd like. Second:
> our original proposal described a WhatsApp-first bot. We pivoted to this web app because
> a production WhatsApp Cloud API integration needs business verification we couldn't
> complete before the deadline — the interaction model, though, is designed the same way:
> zero-friction, tap-based, no account."

*(If you DO have time to also record a short live clip against the real backend —
`agents/server.py` + a real `GOOGLE_API_KEY` — insert a 15–20s cutaway here showing the
same `/advisor` flow completing against the live API, to back up the claim above.)*

---

## 7. Impact & close (7:45–8:30)

**[Back to face-to-camera or a closing slide]**

> "GoviHitha directly targets the two converging crises in the problem statement: climate
> volatility breaking traditional planting calendars, and an extension system that can't
> reach farmers at scale. It does that with zero download friction, grounded — not
> hallucinated — recommendations, and a design that scales to any WhatsApp-literate
> market in South Asia. Thank you — we're SustainX, and this is GoviHitha."

**[End card: team names, GitHub link, GoviHitha wordmark]**

---

## Shot list / recording checklist

- [ ] Screen recording software ready at 1080p+, cursor highlighting enabled if available
- [ ] Browser zoom at 100%, window sized consistently for the whole recording
- [ ] Have 2–3 real crop-disease photos ready (not the same one every take)
- [ ] Rehearse the diagnose → advisor → market sequence once before recording, so page
      transitions are quick and confident (no dead air waiting for the mock response —
      it's instant, but don't rush the click either)
- [ ] Decide before recording: hosted demo only, or hosted + a live-backend cutaway
      (Section 6)
- [ ] Trim dead air at the very start/end; keep total runtime inside 7–10 minutes
- [ ] Upload to YouTube as **Unlisted** (or **Public** if also entering the Most Popular
      Idea award — see the submission guide's tagging requirements: #IEEEWIEUOM and
      #HACKELITE3.0, tag the official IEEE WIE UOM YouTube account)
- [ ] Paste the final video link into the README's video-link line and into the
      submission form
