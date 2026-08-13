/**
 * Tests for the /api/agents Next.js route handler.
 *
 * Key behaviors under test:
 *  1. Returns 503 when neither AGENT_URL nor MOCK_MODE is configured.
 *  2. Returns 200 with is_mock:true when MOCK_MODE=true and no AGENT_URL.
 *  3. Mock result uses the submitted crop_type (not always rice blast).
 *  4. Returns 400 when required fields are missing.
 *  5. Returns 405 for non-POST methods.
 */
import type { NextApiRequest, NextApiResponse } from "next";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MockRes = {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockRes;
  json: (data: unknown) => MockRes;
};

function makeMockRes(): MockRes {
  const res: MockRes = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

function makeReq(body: object, method = "POST"): NextApiRequest {
  return { method, body } as unknown as NextApiRequest;
}

const VALID_BODY = {
  crop_type: "tomato",
  symptoms: "yellowing leaves with concentric brown spots",
  image_base64: "data:image/jpeg;base64,/9j/4AAQ",
  region: "Nuwara Eliya",
};

// Load the handler fresh for each test so env var changes take effect.
async function loadHandler() {
  jest.resetModules();
  const mod = await import("../../pages/api/agents");
  return mod.default;
}

// ---------------------------------------------------------------------------
// Environment isolation
// ---------------------------------------------------------------------------

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  // Start each test with a clean environment (no AGENT_URL, no MOCK_MODE).
  delete process.env.AGENT_URL;
  delete process.env.MOCK_MODE;
});

afterEach(() => {
  // Restore original environment.
  process.env = { ...ORIGINAL_ENV };
});

// ---------------------------------------------------------------------------
// Fix 1 tests: 503 when unconfigured, mock only when MOCK_MODE=true
// ---------------------------------------------------------------------------

describe("when neither AGENT_URL nor MOCK_MODE is set", () => {
  it("returns 503 with a descriptive error — does NOT silently return fake data", async () => {
    const handler = await loadHandler();
    const res = makeMockRes();

    await handler(makeReq(VALID_BODY), res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(503);
    expect((res.body as { error: string }).error).toContain("AGENT_URL");
    expect((res.body as { error: string }).error).toContain("MOCK_MODE");
  });

  it("body is not an OrchestrationResult — no disease_name present", async () => {
    const handler = await loadHandler();
    const res = makeMockRes();

    await handler(makeReq(VALID_BODY), res as unknown as NextApiResponse);

    expect((res.body as Record<string, unknown>).disease_name).toBeUndefined();
    expect((res.body as Record<string, unknown>).diagnosis).toBeUndefined();
  });
});

describe("when MOCK_MODE=true (no AGENT_URL)", () => {
  beforeEach(() => {
    process.env.MOCK_MODE = "true";
  });

  it("returns 200", async () => {
    const handler = await loadHandler();
    const res = makeMockRes();

    await handler(makeReq(VALID_BODY), res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(200);
  });

  it("sets is_mock:true so callers can distinguish demo from real diagnosis", async () => {
    const handler = await loadHandler();
    const res = makeMockRes();

    await handler(makeReq(VALID_BODY), res as unknown as NextApiResponse);

    expect((res.body as Record<string, unknown>).is_mock).toBe(true);
  });

  it("returns tomato-appropriate disease for tomato crop, not rice blast", async () => {
    const handler = await loadHandler();
    const res = makeMockRes();

    await handler(makeReq({ ...VALID_BODY, crop_type: "tomato" }), res as unknown as NextApiResponse);

    const body = res.body as { diagnosis: { disease_name: string } };
    expect(body.diagnosis.disease_name).not.toBe("Rice Leaf Blast");
    expect(body.diagnosis.disease_name.toLowerCase()).toContain("blight");
  });

  it("returns rice-appropriate disease for rice crop", async () => {
    const handler = await loadHandler();
    const res = makeMockRes();

    await handler(makeReq({ ...VALID_BODY, crop_type: "rice" }), res as unknown as NextApiResponse);

    const body = res.body as { diagnosis: { disease_name: string } };
    expect(body.diagnosis.disease_name).toBe("Rice Leaf Blast");
  });

  it("situation_summary includes [DEMO] prefix to mark it as non-real", async () => {
    const handler = await loadHandler();
    const res = makeMockRes();

    await handler(makeReq(VALID_BODY), res as unknown as NextApiResponse);

    const body = res.body as { situation_summary: string };
    expect(body.situation_summary).toContain("[DEMO]");
  });

  it("includes crop_type in the situation_summary", async () => {
    const handler = await loadHandler();
    const res = makeMockRes();

    await handler(makeReq({ ...VALID_BODY, crop_type: "tomato" }), res as unknown as NextApiResponse);

    const body = res.body as { situation_summary: string };
    expect(body.situation_summary).toContain("tomato");
  });
});

// ---------------------------------------------------------------------------
// Input validation tests
// ---------------------------------------------------------------------------

describe("request validation", () => {
  it("returns 400 when crop_type is missing", async () => {
    const handler = await loadHandler();
    const res = makeMockRes();
    const { crop_type: _, ...bodyWithout } = VALID_BODY;

    await handler(makeReq(bodyWithout), res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when symptoms is missing", async () => {
    const handler = await loadHandler();
    const res = makeMockRes();
    const { symptoms: _, ...bodyWithout } = VALID_BODY;

    await handler(makeReq(bodyWithout), res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(400);
  });

  it("returns 405 for GET requests", async () => {
    const handler = await loadHandler();
    const res = makeMockRes();

    await handler(makeReq(VALID_BODY, "GET"), res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(405);
  });
});
