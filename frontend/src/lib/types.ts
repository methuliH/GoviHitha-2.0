// TypeScript interfaces matching ADK agent output schemas

export interface DiagnosisResult {
  disease_name: string;
  confidence: number;
  description: string;
  treatment_steps: string[];
  timeline: string;
  prevention: string;
  risk_level?: "low" | "medium" | "high";
  /** True when the model returned a disease not in the known-plausible list for the crop. */
  crop_disease_mismatch_warning?: boolean;
}

export interface WeatherAlert {
  risk_type: "WATERLOGGING" | "FROST" | "DROUGHT" | string;
  likelihood: "high" | "medium" | "low";
  days_ahead: number;
  context: string;
  action: string;
}

export interface WeatherResult {
  current_weather: {
    temperature: number;
    humidity: number;
    rainfall_7d: number;
  };
  alerts: WeatherAlert[];
  forecast_summary: string;
}

export interface ProductRecommendation {
  type: "fungicide" | "insecticide" | "nematicide" | "herbicide" | "biological insecticide" | string;
  product_name: string;
  active_ingredient?: string;
  why: string;
  availability: string;
  estimated_cost: string;
  application_notes?: string;
  hayleys_product_url?: string;
  dealer_url?: string;
  /** @deprecated Hayleys Agriculture replaced Kapruka as the product source */
  kapruka_search_link?: string;
}

export interface ResourceResult {
  recommendations: ProductRecommendation[];
  priority_note: string;
}

export interface OrchestrationResult {
  situation_summary: string;
  diagnosis: DiagnosisResult;
  weather: WeatherResult;
  resources: ResourceResult;
  action_plan: string[];
  timeline: string;
  /** Present and true only when this result came from the local demo mock, not a real diagnosis. */
  is_mock?: boolean;
}

export interface AgentQuery {
  crop_type: string;
  symptoms: string;
  image_base64: string;
  region: string;
}

export interface VarietyRecommendation {
  variety_name: string;
  reason: string;
  days_to_maturity: number;
}

export interface PlantingAdvice {
  crop_type: string;
  region: string;
  recommended_variety: VarietyRecommendation;
  sowing_window_label: string;
  sowing_window_start: string;
  sowing_window_end: string;
  season: "Yala" | "Maha" | string;
  risk_notes: string[];
  confidence: "high" | "medium" | "low" | string;
  advisory_summary: string;
  /** Present and true only when this result came from the local demo mock. */
  is_mock?: boolean;
}

export interface AdvisorQuery {
  crop_type: string;
  region: string;
}

export interface MarketPriceResult {
  crop_type: string;
  unit: string;
  todays_price_lkr: number;
  avg_price_30d_lkr: number;
  price_change_pct: number;
  trend: "up" | "down" | "stable" | string;
  advisory: string;
  last_updated: string;
  /** Present and true only when this result came from the local demo mock. */
  is_mock?: boolean;
}

export interface MarketQuery {
  crop_type: string;
}
