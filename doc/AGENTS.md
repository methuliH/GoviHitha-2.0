# GoviHitha Agents Setup Guide (ADK)

**Goal:** Build three LLM agents + one Orchestrator agent locally, test with `adk web`, then deploy to Cloud Run.

---

## Part 1: Local Setup

### Step 1: Install ADK

```bash
# Create virtual environment
python -m venv .venv

# Activate it
# macOS/Linux:
source .venv/bin/activate
# Windows PowerShell:
.venv\Scripts\Activate.ps1

# Install ADK
pip install google-adk
```

### Step 2: Get API Keys

**Gemini API Key** (for Crop Diagnosis agent's vision):
1. Go to https://aistudio.google.com/apikey
2. Create API key
3. Copy it

**Google Cloud Project** (for deployment later):
1. Use your existing `researchbrain-497600` project
2. Or create new one at https://console.cloud.google.com

### Step 3: Project Structure

Create this folder structure in your repo:

```
govihitha/
├── agents/
│   ├── crop_diagnosis_agent.py      # Agent 1: Image + symptoms → diagnosis
│   ├── weather_alert_agent.py       # Agent 2: Location + diagnosis → alerts
│   ├── resource_recommendation_agent.py  # Agent 3: Diagnosis + weather → products
│   ├── orchestrator_agent.py        # Orchestrator: Runs all three in parallel
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── crop_diagnosis_tool.py   # Gemini Vision calls
│   │   ├── weather_tool.py          # OpenMeteo API calls
│   │   └── kapruka_search_tool.py   # Product search
│   └── prompts/
│       ├── __init__.py
│       ├── diagnosis_prompt.py      # System prompt for diagnosis agent
│       ├── weather_prompt.py        # System prompt for weather agent
│       ├── resources_prompt.py      # System prompt for resources agent
│       └── orchestrator_prompt.py   # System prompt for orchestrator
├── .env                              # Store API keys here
├── requirements.txt
└── README.md
```

---

## Part 2: Agent Structure (What Each Agent Does)

### **Agent 1: Crop Diagnosis Agent**

**Input:**
```json
{
  "crop_type": "rice",
  "symptoms": "yellowing leaves, brown spots on edges",
  "image": "<base64 or image URL>",
  "region": "Colombo"
}
```

**Output:**
```json
{
  "disease_name": "Leaf Blast",
  "confidence": 0.92,
  "description": "Fungal infection common in humid rice-growing regions.",
  "treatment_steps": [
    "Apply Azoxystrobin fungicide weekly",
    "Improve field drainage",
    "Remove infected leaves"
  ],
  "timeline": "7-10 days for improvement",
  "prevention": "Use resistant varieties, rotate crops"
}
```

**Tools Used:**
- Gemini Vision (analyze crop image)
- Text reasoning (match symptoms to disease)

**System Prompt:** See `prompts/diagnosis_prompt.py`

---

### **Agent 2: Weather Alert Agent**

**Input:**
```json
{
  "region": "Colombo",
  "crop_type": "rice",
  "diagnosis": {
    "disease_name": "Leaf Blast",
    "severity": "high"
  }
}
```

**Output:**
```json
{
  "current_weather": {
    "temperature": 28.5,
    "humidity": 78,
    "rainfall_7d": 45.2
  },
  "alerts": [
    {
      "risk_type": "WATERLOGGING",
      "likelihood": "high",
      "days_ahead": 2,
      "context": "Heavy rain in 48h will worsen fungal spread. Urgent action needed.",
      "action": "Improve drainage, apply fungicide today"
    }
  ],
  "forecast_summary": "Heavy rain expected in 48h. Frost unlikely."
}
```

**Tools Used:**
- OpenMeteo API (fetch real-time weather + 7-day forecast)
- Gemini reasoning (contextualize weather for disease)

**System Prompt:** See `prompts/weather_prompt.py`

---

### **Agent 3: Resource Recommendation Agent**

**Input:**
```json
{
  "crop_type": "rice",
  "diagnosis": {
    "disease_name": "Leaf Blast",
    "treatment_steps": ["Apply fungicide", "Improve drainage"]
  },
  "weather_alert": {
    "risk": "WATERLOGGING",
    "days_ahead": 2
  },
  "region": "Colombo"
}
```

**Output:**
```json
{
  "recommendations": [
    {
      "type": "fungicide",
      "product_name": "Azoxystrobin 50% WP",
      "why": "Effective against Leaf Blast; available locally",
      "availability": "Colombo, Kandy, Matara",
      "estimated_cost": "2500-3500 LKR",
      "application_rate": "2g per litre water",
      "kapruka_search_link": "https://www.kapruka.com/search?q=Azoxystrobin"
    },
    {
      "type": "tool",
      "product_name": "Drainage pipe/shovel",
      "why": "Address waterlogging risk before rain",
      "estimated_cost": "1500-2500 LKR",
      "kapruka_search_link": "https://www.kapruka.com/search?q=drainage+pipe"
    }
  ]
}
```

**Tools Used:**
- Kapruka search (product links)
- Gemini reasoning (match diagnosis + weather to products)

**System Prompt:** See `prompts/resources_prompt.py`

---

### **Agent 4: Orchestrator Agent**

**Role:** Coordinates the three agents above. Runs them in parallel, then synthesizes outputs.

**Input:**
```json
{
  "crop_type": "rice",
  "symptoms": "yellowing leaves, brown spots",
  "image": "<base64>",
  "region": "Colombo"
}
```

**Flow:**
1. Call Crop Diagnosis Agent → get diagnosis
2. Call Weather Alert Agent (with diagnosis context) → get weather risks
3. Call Resource Recommendation Agent (with both outputs) → get products
4. Synthesize all three into single action plan

**Output:**
```json
{
  "situation_summary": "Your rice has Leaf Blast. Heavy rain in 48h will worsen it. Act today.",
  "diagnosis": { ... },
  "weather": { ... },
  "resources": { ... },
  "action_plan": [
    "1. Buy Azoxystrobin fungicide TODAY (link)",
    "2. Apply by tomorrow morning",
    "3. Improve field drainage before rain hits",
    "4. Check field again in 7 days for improvement"
  ]
}
```

---

## Part 3: Setting Up Each Agent (Code Templates)

### **File: agents/crop_diagnosis_agent.py**

```python
from google_adk import llm, agent
import google.generativeai as genai
import base64
import json

@agent.llm_agent
class CropDiagnosisAgent:
    """Analyzes crop images and symptoms to diagnose diseases/pests."""
    
    model = "gemini-2.0-flash"
    description = "Diagnoses crop diseases from images and symptom descriptions"
    
    system_prompt = """You are an expert agricultural diagnostician.
Your task: Analyze a crop image + symptoms to identify disease/pest.

Instructions:
1. Look at the crop image carefully
2. Match symptoms to known rice/corn/tea/coconut diseases
3. Consider regional context (Sri Lanka climate)
4. Return structured JSON response with disease name, confidence, treatment

Return ONLY JSON (no markdown, no explanation):
{
  "disease_name": "...",
  "confidence": 0.95,
  "description": "...",
  "treatment_steps": [...],
  "timeline": "...",
  "prevention": "..."
}
"""
    
    def process_query(self, crop_type: str, symptoms: str, image_base64: str, region: str) -> dict:
        """Process farmer query and return diagnosis."""
        
        # Prepare image for Gemini
        image_content = {
            "type": "image_uri",
            "image_uri": f"data:image/jpeg;base64,{image_base64}"
        }
        
        # Build prompt with context
        user_prompt = f"""
Crop: {crop_type}
Symptoms: {symptoms}
Region: {region}

Analyze the image and provide a diagnosis.
"""
        
        # Call Gemini with vision
        response = llm.invoke(
            model=self.model,
            system_prompt=self.system_prompt,
            messages=[
                {"role": "user", "content": [image_content, {"type": "text", "text": user_prompt}]}
            ]
        )
        
        # Parse JSON response
        try:
            diagnosis = json.loads(response.text)
        except json.JSONDecodeError:
            diagnosis = {"error": "Failed to parse diagnosis", "raw_response": response.text}
        
        return diagnosis
```

### **File: agents/weather_alert_agent.py**

```python
from google_adk import llm, agent
import requests
import json
from datetime import datetime, timedelta

@agent.llm_agent
class WeatherAlertAgent:
    """Provides weather alerts contextualized to crop diagnosis."""
    
    model = "gemini-2.0-flash"
    description = "Generates weather alerts relevant to diagnosed crop issues"
    
    system_prompt = """You are an agricultural meteorologist.
Given a crop diagnosis and real weather data, identify risks to that specific disease.

Return ONLY JSON:
{
  "current_weather": {...},
  "alerts": [
    {
      "risk_type": "WATERLOGGING|FROST|DROUGHT",
      "likelihood": "high|medium|low",
      "days_ahead": 2,
      "context": "How this weather affects the diagnosed disease",
      "action": "What farmer should do"
    }
  ],
  "forecast_summary": "..."
}
"""
    
    def get_weather(self, latitude: float, longitude: float) -> dict:
        """Fetch real-time weather from OpenMeteo."""
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,precipitation",
            "forecast_days": 7,
            "timezone": "auto"
        }
        response = requests.get(url, params=params)
        return response.json()
    
    def process_query(self, region: str, crop_type: str, diagnosis: dict) -> dict:
        """Get weather data and generate alerts."""
        
        # Map region to lat/long (simplified)
        region_coords = {
            "Colombo": (6.9271, 80.7789),
            "Kandy": (7.2906, 80.6337),
            "Matara": (5.7789, 80.7863),
            "Galle": (6.0535, 80.2158),
        }
        lat, lon = region_coords.get(region, (7.0, 80.5))
        
        # Fetch weather
        weather_data = self.get_weather(lat, lon)
        
        # Build prompt
        user_prompt = f"""
Crop: {crop_type}
Diagnosed Disease: {diagnosis.get('disease_name', 'Unknown')}
Weather Data: {json.dumps(weather_data)}

Identify risks to this disease based on incoming weather.
"""
        
        response = llm.invoke(
            model=self.model,
            system_prompt=self.system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )
        
        try:
            alerts = json.loads(response.text)
        except json.JSONDecodeError:
            alerts = {"error": "Failed to parse alerts", "raw_response": response.text}
        
        return alerts
```

### **File: agents/resource_recommendation_agent.py**

```python
from google_adk import llm, agent
import json

@agent.llm_agent
class ResourceRecommendationAgent:
    """Recommends locally-available farm inputs based on diagnosis + weather."""
    
    model = "gemini-2.0-flash"
    description = "Suggests products to buy based on crop issue and weather forecast"
    
    system_prompt = """You are an agricultural supply expert for Sri Lanka.
Given a crop diagnosis and weather forecast, recommend locally-available inputs.

Return ONLY JSON:
{
  "recommendations": [
    {
      "type": "fungicide|fertilizer|tool|seed",
      "product_name": "...",
      "why": "How this solves the diagnosed problem",
      "availability": "Which regions have it",
      "estimated_cost": "LKR range",
      "application_notes": "How to use",
      "kapruka_search_link": "https://www.kapruka.com/search?q=..."
    }
  ],
  "priority_note": "What to buy first and why"
}
"""
    
    def process_query(self, crop_type: str, diagnosis: dict, weather_alert: dict, region: str) -> dict:
        """Generate product recommendations."""
        
        user_prompt = f"""
Crop: {crop_type}
Region: {region}
Disease: {diagnosis.get('disease_name', 'Unknown')}
Treatment Needed: {', '.join(diagnosis.get('treatment_steps', []))}
Weather Risk: {weather_alert.get('alerts', [{}])[0].get('risk_type', 'Unknown')}

Recommend available farm inputs. Include Kapruka search links for easy shopping.
"""
        
        response = llm.invoke(
            model=self.model,
            system_prompt=self.system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )
        
        try:
            recommendations = json.loads(response.text)
        except json.JSONDecodeError:
            recommendations = {"error": "Failed to parse recommendations", "raw_response": response.text}
        
        return recommendations
```

### **File: agents/orchestrator_agent.py**

```python
from google_adk import agent
import asyncio
import json
from agents.crop_diagnosis_agent import CropDiagnosisAgent
from agents.weather_alert_agent import WeatherAlertAgent
from agents.resource_recommendation_agent import ResourceRecommendationAgent

@agent.workflow_agent
class OrchestratorAgent:
    """Orchestrates three agents to provide comprehensive farmer guidance."""
    
    description = "Runs diagnosis, weather, and resource agents in parallel"
    
    async def invoke(self, crop_type: str, symptoms: str, image_base64: str, region: str) -> dict:
        """Run all three agents in parallel, then synthesize results."""
        
        # Initialize agents
        diagnosis_agent = CropDiagnosisAgent()
        weather_agent = WeatherAlertAgent()
        resource_agent = ResourceRecommendationAgent()
        
        # Step 1: Run diagnosis first (required by other agents)
        diagnosis_result = await asyncio.to_thread(
            diagnosis_agent.process_query,
            crop_type, symptoms, image_base64, region
        )
        
        # Step 2: Run weather + resources in parallel (both depend on diagnosis)
        weather_result, resource_result = await asyncio.gather(
            asyncio.to_thread(
                weather_agent.process_query,
                region, crop_type, diagnosis_result
            ),
            asyncio.to_thread(
                resource_agent.process_query,
                crop_type, diagnosis_result, {}, region
            )
        )
        
        # Step 3: Synthesize into action plan
        action_plan = self._synthesize(
            diagnosis_result,
            weather_result,
            resource_result
        )
        
        return {
            "situation_summary": action_plan["summary"],
            "diagnosis": diagnosis_result,
            "weather": weather_result,
            "resources": resource_result,
            "action_plan": action_plan["steps"],
            "timeline": action_plan["timeline"]
        }
    
    def _synthesize(self, diagnosis: dict, weather: dict, resources: dict) -> dict:
        """Combine three agent outputs into coherent action plan."""
        
        disease = diagnosis.get("disease_name", "Unknown disease")
        weather_risk = weather.get("alerts", [{}])[0].get("risk_type", "No immediate risk")
        
        summary = f"Your crop has {disease}. {weather_risk} expected. Act today."
        
        steps = [
            f"1. URGENT: Buy recommended products TODAY (see resource links)",
            f"2. Apply treatment as directed: {', '.join(diagnosis.get('treatment_steps', [])[:2])}",
            f"3. Prepare for weather: {weather.get('alerts', [{}])[0].get('action', 'Monitor forecast')}",
            f"4. Expect improvement in {diagnosis.get('timeline', '7-10 days')}"
        ]
        
        return {
            "summary": summary,
            "steps": steps,
            "timeline": diagnosis.get("timeline", "7-10 days")
        }
```

---

## Part 4: Environment Variables

### **File: .env**

```
GOOGLE_API_KEY=your_gemini_api_key_here
GOOGLE_CLOUD_PROJECT=researchbrain-497600
```

### **File: requirements.txt**

```
google-adk>=2.0
google-generativeai>=0.3.0
requests>=2.31.0
python-dotenv>=1.0.0
```

---

## Part 5: Testing Locally

### Step 1: Install dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Run `adk web` (local testing UI)
```bash
adk web agents/
```

This opens a web UI at `http://localhost:8000` where you can:
- Select which agent to test
- Input farmer queries (crop, symptoms, region, upload image)
- See agent reasoning in real-time
- Check execution traces (how long each step took)

### Step 3: Test Each Agent Independently

In the web UI:
1. Select `CropDiagnosisAgent`
2. Upload a crop image (or use example)
3. Enter symptoms
4. See diagnosis output

Repeat for each agent.

### Step 4: Test Orchestrator

1. Select `OrchestratorAgent`
2. Submit full farmer query (crop, symptoms, image, region)
3. Watch all three agents execute in parallel
4. See synthesized action plan

---

## Part 6: Deployment Checklist

**Before deploying to Cloud Run:**

- [ ] All agents tested locally with `adk web`
- [ ] API keys stored in `.env` (not hardcoded)
- [ ] Agents return structured JSON outputs
- [ ] Error handling in place (bad images, API timeouts)
- [ ] Orchestrator successfully runs all three agents
- [ ] Output matches Next.js frontend expectations

**Deployment command (when ready):**
```bash
adk deploy cloud_run \
  --project researchbrain-497600 \
  --region us-central1 \
  --service_name govihitha-agents
```

This generates:
- Docker container image
- Deployment to Cloud Run
- HTTP API endpoint: `https://govihitha-agents-xxxxx.run.app`

---

## Part 7: Next.js Integration (Preview)

Once deployed, your Next.js frontend calls:

```javascript
const response = await fetch(
  'https://govihitha-agents-xxxxx.run.app/invoke',
  {
    method: 'POST',
    body: JSON.stringify({
      agent_name: 'OrchestratorAgent',
      input: {
        crop_type: 'rice',
        symptoms: 'yellowing leaves',
        image_base64: '...',
        region: 'Colombo'
      }
    })
  }
);
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `ModuleNotFoundError: google_adk` | Run `pip install google-adk` |
| Image upload fails | Ensure image is base64 encoded |
| Gemini API errors | Check API key in `.env` |
| Weather API 404 | Check region coordinates mapping |
| Agents timeout locally | Reduce image size, check API quotas |

---

**Next Steps:**

1. Run `pip install -r requirements.txt`
2. Copy the four agent files above into `agents/` folder
3. Run `adk web agents/` and test locally
4. Once working, deploy to Cloud Run
5. Get API endpoint back
6. Build Next.js frontend to call it

Ready?