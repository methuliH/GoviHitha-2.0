import { useState } from "react";
import { submitAdvisorQuery } from "@/lib/api";
import type { AdvisorQuery, PlantingAdvice } from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";

export function useAdvisor() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<PlantingAdvice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (query: AdvisorQuery): Promise<PlantingAdvice | null> => {
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const data = await submitAdvisorQuery(query);
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
