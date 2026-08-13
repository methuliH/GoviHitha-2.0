import type { AdvisorQuery, AgentQuery, MarketPriceResult, MarketQuery, OrchestrationResult, PlantingAdvice } from "@/lib/types";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function submitQuery(query: AgentQuery): Promise<OrchestrationResult> {
  const res = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  }

  return res.json() as Promise<OrchestrationResult>;
}

export async function submitAdvisorQuery(query: AdvisorQuery): Promise<PlantingAdvice> {
  const res = await fetch("/api/advisor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  }

  return res.json() as Promise<PlantingAdvice>;
}

export async function submitMarketQuery(query: MarketQuery): Promise<MarketPriceResult> {
  const res = await fetch("/api/market", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  }

  return res.json() as Promise<MarketPriceResult>;
}
