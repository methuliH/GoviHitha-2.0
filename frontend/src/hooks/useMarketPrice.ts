import { useState } from "react";
import { submitMarketQuery } from "@/lib/api";
import type { MarketPriceResult, MarketQuery } from "@/lib/types";

type Status = "idle" | "loading" | "success" | "error";

export function useMarketPrice() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<MarketPriceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (query: MarketQuery): Promise<MarketPriceResult | null> => {
    setStatus("loading");
    setError(null);
    setResult(null);

    try {
      const data = await submitMarketQuery(query);
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
