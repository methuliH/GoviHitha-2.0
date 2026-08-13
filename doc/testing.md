# GoviHitha: Testing Guidelines

**For 16-day solo capstone: Test what matters. Don't over-engineer.**

---

## Testing Philosophy

**Prioritize by impact:**
1. **Critical path** (farmers' main flow) → test thoroughly
2. **Edge cases** (bad images, API timeouts) → test important cases
3. **UI polish** (animations, styling) → manual testing fine
4. **Utils** (small helper functions) → unit test only if complex

**Time budget:** 10–15% of development (1.5–2 days out of 16)

---

## Python Testing (ADK Agents)

### Setup
```bash
cd agents/
pip install pytest pytest-asyncio python-dotenv
```

### Test Structure
```
agents/
├── agents/
│   ├── crop_diagnosis.py
│   ├── weather_alert.py
│   └── resource_recommendation.py
└── tests/
    ├── __init__.py
    ├── conftest.py                 # Shared fixtures
    ├── test_crop_diagnosis.py
    ├── test_weather_alert.py
    ├── test_resource_recommendation.py
    ├── test_orchestrator.py
    ├── test_tools/
    │   ├── test_gemini_vision.py
    │   ├── test_openmeteo_weather.py
    │   └── test_kapruka_search.py
    └── fixtures/
        ├── sample_crop_image.jpg
        ├── expected_diagnosis.json
        └── expected_weather.json
```

### Test Template

**File: agents/tests/test_crop_diagnosis.py**

```python
import pytest
import json
from agents.agents.crop_diagnosis import CropDiagnosisAgent
from agents.schemas.diagnosis_schema import DiagnosisOutput


@pytest.fixture
def diagnosis_agent():
    """Initialize agent for testing."""
    return CropDiagnosisAgent()


@pytest.fixture
def sample_image_base64():
    """Load a real sample crop image as base64."""
    # In practice, upload a real image to fixtures/
    with open("tests/fixtures/sample_crop_image.jpg", "rb") as f:
        import base64
        return base64.b64encode(f.read()).decode()


class TestCropDiagnosisAgent:
    """Test crop diagnosis agent."""
    
    def test_agent_initializes(self, diagnosis_agent):
        """Agent should initialize without errors."""
        assert diagnosis_agent is not None
        assert diagnosis_agent.model == "gemini-2.0-flash"
    
    def test_process_query_returns_valid_schema(self, diagnosis_agent, sample_image_base64):
        """Agent output should match DiagnosisOutput schema."""
        result = diagnosis_agent.process_query(
            crop_type="rice",
            symptoms="yellowing leaves, brown spots",
            image_base64=sample_image_base64,
            region="Colombo"
        )
        
        # Should not raise validation error
        output = DiagnosisOutput(**result)
        assert output.disease_name is not None
        assert 0 <= output.confidence <= 1
        assert len(output.treatment_steps) > 0
    
    def test_handles_bad_image_gracefully(self, diagnosis_agent):
        """Should return error dict, not crash, for bad image."""
        result = diagnosis_agent.process_query(
            crop_type="rice",
            symptoms="test",
            image_base64="not_a_real_image",
            region="Colombo"
        )
        
        # Should have error key or graceful fallback
        assert "error" in result or result.get("confidence", 0) < 0.5
    
    def test_different_crop_types(self, diagnosis_agent, sample_image_base64):
        """Should handle different crop types."""
        for crop in ["rice", "corn", "tea", "coconut"]:
            result = diagnosis_agent.process_query(
                crop_type=crop,
                symptoms="leaf yellowing",
                image_base64=sample_image_base64,
                region="Colombo"
            )
            assert result.get("disease_name") is not None
    
    def test_confidence_score_reasonable(self, diagnosis_agent, sample_image_base64):
        """Confidence should be between 0-1."""
        result = diagnosis_agent.process_query(
            crop_type="rice",
            symptoms="yellowing leaves",
            image_base64=sample_image_base64,
            region="Colombo"
        )
        confidence = result.get("confidence", 0.5)
        assert 0 <= confidence <= 1


class TestCropDiagnosisEdgeCases:
    """Test edge cases and error handling."""
    
    def test_empty_symptoms(self, diagnosis_agent, sample_image_base64):
        """Should handle empty symptom description."""
        result = diagnosis_agent.process_query(
            crop_type="rice",
            symptoms="",  # Empty
            image_base64=sample_image_base64,
            region="Colombo"
        )
        # Should still work or return error gracefully
        assert isinstance(result, dict)
    
    def test_unknown_crop_type(self, diagnosis_agent, sample_image_base64):
        """Should handle unknown crop type."""
        result = diagnosis_agent.process_query(
            crop_type="unknown_crop_xyz",
            symptoms="yellowing",
            image_base64=sample_image_base64,
            region="Colombo"
        )
        # Should fallback or explain it's unknown
        assert isinstance(result, dict)
    
    def test_missing_region(self, diagnosis_agent, sample_image_base64):
        """Should handle unknown region."""
        result = diagnosis_agent.process_query(
            crop_type="rice",
            symptoms="yellowing",
            image_base64=sample_image_base64,
            region="UnknownRegion"
        )
        # Should use default or handle gracefully
        assert isinstance(result, dict)


class TestDiagnosisSchema:
    """Test output validation."""
    
    def test_valid_diagnosis_passes_schema(self):
        """Valid diagnosis should validate."""
        valid_diagnosis = {
            "disease_name": "Leaf Blast",
            "confidence": 0.92,
            "description": "Fungal infection",
            "treatment_steps": ["Apply fungicide"],
            "timeline": "7-10 days",
            "prevention": "Use resistant varieties"
        }
        output = DiagnosisOutput(**valid_diagnosis)
        assert output.disease_name == "Leaf Blast"
    
    def test_invalid_confidence_fails(self):
        """Confidence > 1 should fail validation."""
        invalid = {
            "disease_name": "Test",
            "confidence": 1.5,  # Invalid
            "description": "test",
            "treatment_steps": ["test"],
            "timeline": "test",
            "prevention": "test"
        }
        with pytest.raises(ValueError):
            DiagnosisOutput(**invalid)
```

### Run Tests
```bash
# All tests
pytest agents/tests/

# Specific test file
pytest agents/tests/test_crop_diagnosis.py

# Specific test
pytest agents/tests/test_crop_diagnosis.py::TestCropDiagnosisAgent::test_agent_initializes

# Verbose output
pytest agents/tests/ -v

# Show print statements
pytest agents/tests/ -s
```

---

## Frontend Testing (Next.js / React)

### Setup
```bash
cd frontend/
npm install --save-dev jest @testing-library/react @testing-library/jest-dom vitest
```

### Test Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── forms/
│   │   │   ├── QueryForm.tsx
│   │   │   └── QueryForm.test.tsx         # Co-locate tests
│   │   ├── cards/
│   │   │   ├── DiagnosisCard.tsx
│   │   │   └── DiagnosisCard.test.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts
│   │   └── api.test.ts
│   └── pages/
│       ├── index.tsx
│       └── index.test.tsx (optional)
└── jest.config.js
```

### Test Template

**File: frontend/src/components/forms/QueryForm.test.tsx**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryForm } from './QueryForm'


describe('QueryForm Component', () => {
  
  it('renders form with all required fields', () => {
    render(<QueryForm />)
    
    expect(screen.getByLabelText(/crop type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/symptoms/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/region/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get diagnosis/i })).toBeInTheDocument()
  })
  
  it('disables submit button if no image uploaded', () => {
    render(<QueryForm />)
    
    const submitButton = screen.getByRole('button', { name: /get diagnosis/i })
    expect(submitButton).toBeDisabled()
  })
  
  it('enables submit button after image upload', async () => {
    const user = userEvent.setup()
    render(<QueryForm />)
    
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText(/upload.*image/i)
    
    await user.upload(input, file)
    
    const submitButton = screen.getByRole('button', { name: /get diagnosis/i })
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })
  
  it('calls onSubmit with form data', async () => {
    const handleSubmit = jest.fn()
    const { rerender } = render(<QueryForm onSubmit={handleSubmit} />)
    
    const user = userEvent.setup()
    
    // Upload image
    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' })
    const imageInput = screen.getByLabelText(/upload.*image/i)
    await user.upload(imageInput, file)
    
    // Fill form
    await user.selectOptions(screen.getByLabelText(/crop type/i), 'rice')
    await user.type(screen.getByLabelText(/symptoms/i), 'yellowing leaves')
    await user.selectOptions(screen.getByLabelText(/region/i), 'Colombo')
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /get diagnosis/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          crop_type: 'rice',
          symptoms: 'yellowing leaves',
          region: 'Colombo'
        })
      )
    })
  })
  
  it('shows error if required fields are empty', async () => {
    const user = userEvent.setup()
    render(<QueryForm />)
    
    // Try to submit without filling anything
    const submitButton = screen.getByRole('button', { name: /get diagnosis/i })
    // Button should be disabled, but add error display test if you add validation
    expect(submitButton).toBeDisabled()
  })
})


describe('QueryForm - Image Upload', () => {
  
  it('shows image preview after upload', async () => {
    const user = userEvent.setup()
    render(<QueryForm />)
    
    const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText(/upload.*image/i)
    
    await user.upload(input, file)
    
    const preview = screen.getByAltText(/preview/i)
    expect(preview).toBeInTheDocument()
  })
  
  it('rejects non-image files', async () => {
    const user = userEvent.setup()
    render(<QueryForm />)
    
    const file = new File(['dummy'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/upload.*image/i)
    
    await user.upload(input, file)
    
    // Should show error or reject the file
    expect(screen.queryByAltText(/preview/i)).not.toBeInTheDocument()
  })
  
  it('limits file size to 5MB', async () => {
    const user = userEvent.setup()
    render(<QueryForm />)
    
    // Create a mock file > 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText(/upload.*image/i)
    
    await user.upload(input, largeFile)
    
    // Should show error
    expect(screen.getByText(/file.*too large/i)).toBeInTheDocument()
  })
})
```

### API Mocking

**File: frontend/src/lib/api.test.ts**

```typescript
import { callAgents } from './api'


// Mock fetch
global.fetch = jest.fn()


describe('API Client', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('calls /api/agents endpoint', async () => {
    const mockResponse = {
      diagnosis: { disease_name: 'Leaf Blast', confidence: 0.92 },
      weather: { alerts: [] },
      resources: { recommendations: [] }
    }
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })
    
    const result = await callAgents({
      crop_type: 'rice',
      symptoms: 'yellowing',
      image_base64: 'test',
      region: 'Colombo'
    })
    
    expect(result).toEqual(mockResponse)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/agents',
      expect.objectContaining({
        method: 'POST'
      })
    )
  })
  
  it('handles API errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' })
    })
    
    await expect(
      callAgents({
        crop_type: 'rice',
        symptoms: 'test',
        image_base64: 'test',
        region: 'Colombo'
      })
    ).rejects.toThrow()
  })
})
```

### Run Tests
```bash
# All tests
npm test

# Watch mode (re-run on file change)
npm test -- --watch

# Single file
npm test -- QueryForm.test.tsx

# Coverage report
npm test -- --coverage
```

---

## Integration Testing (E2E)

### Manual Testing Checklist

**Before deployment, test this flow manually:**

```
[ ] Local setup
  [ ] Python venv activated
  [ ] Node modules installed
  [ ] .env files loaded
  
[ ] ADK agents work locally
  [ ] Run `adk web agents/` 
  [ ] Test Diagnosis Agent with sample image
  [ ] Test Weather Agent with Colombo region
  [ ] Test Resources Agent
  [ ] Test Orchestrator (all three together)
  
[ ] Frontend works locally
  [ ] Run `npm run dev`
  [ ] Form loads on localhost:3000
  [ ] Can upload an image
  [ ] Can select crop type, enter symptoms, pick region
  [ ] Submit button works
  
[ ] Full E2E flow
  [ ] Frontend calls local agents
  [ ] Get back diagnosis + weather + resources
  [ ] Results display correctly
  [ ] No console errors
  
[ ] Mobile responsiveness
  [ ] Test on phone-sized screen (simulate in DevTools)
  [ ] Form is usable on mobile
  [ ] Results are readable on mobile
  
[ ] Error handling
  [ ] Bad image → graceful error message
  [ ] No image selected → button disabled
  [ ] Slow API → loading spinner shows
  [ ] API down → error message
  
[ ] Live deployment
  [ ] Agents deployed to Cloud Run
  [ ] Frontend deployed to Vercel
  [ ] Update API endpoint in frontend
  [ ] Test full flow with live agents
```

### Example Manual Test Scenario

**Scenario: User with moldy tea leaves in Kandy**

1. Open app at `localhost:3000`
2. Select "tea" from crop dropdown
3. Upload photo of moldy tea leaf
4. Type in symptoms: "White powder on leaves, wilting"
5. Select region "Kandy"
6. Click "Get Diagnosis & Recommendations"
7. **Expect:**
   - [ ] Loading spinner shows for 5-10 seconds
   - [ ] Diagnosis appears (e.g., "Powdery Mildew")
   - [ ] Confidence score displayed
   - [ ] Treatment steps listed
   - [ ] Weather alerts shown (frost risk in Kandy)
   - [ ] Products recommended (fungicide, sulfur)
   - [ ] Kapruka links clickable
   - [ ] Action plan summarizes everything

**If anything is missing or wrong:**
- [ ] Check browser console for errors
- [ ] Check backend logs (agents)
- [ ] Check frontend logs
- [ ] Debug API call with Network tab

---

## Test Coverage Targets

| Component | Target | Priority |
|-----------|--------|----------|
| Agents (crop_diagnosis, weather_alert, resources) | 80% | HIGH |
| Schemas & Validation | 90% | HIGH |
| API client (lib/api.ts) | 70% | MEDIUM |
| UI Components (forms, cards) | 50% | LOW |
| Pages | 20% | LOW |

**Rationale:**
- Agents are the core logic → test thoroughly
- Schemas catch bad data early → high coverage
- UI can be manual tested → lower coverage acceptable

---

## Before Submission

### Final Checks
```bash
# Run all agent tests
cd agents/
pytest tests/ -v

# Run all frontend tests
cd ../frontend/
npm test -- --coverage

# Manual E2E test flow once more
# Locally, then with live deployed agents
```

### What Judges Will See

If tests fail in CI/CD, it's bad optics. Before deployment:
- [ ] All tests pass locally
- [ ] No console errors/warnings
- [ ] No hardcoded test data in production code
- [ ] Test fixtures (sample images) committed but not bloated

---

## TL;DR Quick Reference

### Python (Agents)
```bash
pip install pytest pytest-asyncio
pytest agents/tests/ -v
```

### Frontend (React)
```bash
npm test -- --watch
```

### Manual E2E
```bash
# Terminal 1: Run agents
cd agents && adk web agents/

# Terminal 2: Run frontend
cd frontend && npm run dev

# Browser: Test full flow at localhost:3000
```

You don't need 100% test coverage for a capstone. **Test what matters: agent logic, edge cases, and full flow.** Polish UI with manual testing.