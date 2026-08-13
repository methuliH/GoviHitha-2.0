import { useState } from "react";
import { submitQuery } from "@/lib/api";
import type { AgentQuery, OrchestrationResult } from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";

export function useAgent() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<OrchestrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (query: AgentQuery): Promise<OrchestrationResult | null> => {
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const data = await submitQuery(query);
      setResult(data);
      setStatus("success");
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setStatus("error");
      return null;
    }
  };

  const reset = () => {
    setStatus("idle");
    setResult(null);
    setError(null);
  };

  return { status, result, error, submit, reset };
}
