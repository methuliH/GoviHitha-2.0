interface BadgeProps {
  label: string;
  variant?: "risk" | "likelihood" | "type" | "neutral";
  value?: string;
}

const riskColors: Record<string, string> = {
  high:   "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low:    "bg-green-100 text-green-700 border-green-200",
};

const likelihoodColors: Record<string, string> = {
  high:   "bg-red-100 text-red-700 border-red-200",
  medium: "bg-orange-100 text-orange-700 border-orange-200",
  low:    "bg-blue-100 text-blue-700 border-blue-200",
};

const typeColors: Record<string, string> = {
  fungicide:  "bg-purple-100 text-purple-700 border-purple-200",
  fertilizer: "bg-blue-100 text-blue-700 border-blue-200",
  pesticide:  "bg-orange-100 text-orange-700 border-orange-200",
  tool:       "bg-gray-100 text-gray-700 border-gray-200",
  seed:       "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function Badge({ label, variant = "neutral", value }: BadgeProps) {
  let colorClass = "bg-gray-100 text-gray-600 border-gray-200";
  const key = (value ?? label).toLowerCase();

  if (variant === "risk") colorClass = riskColors[key] ?? colorClass;
  else if (variant === "likelihood") colorClass = likelihoodColors[key] ?? colorClass;
  else if (variant === "type") colorClass = typeColors[key] ?? colorClass;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
    >
      {label}
    </span>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 w-10 text-right">
        {pct}%
      </span>
    </div>
  );
}
