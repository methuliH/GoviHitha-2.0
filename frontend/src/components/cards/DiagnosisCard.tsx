import type { DiagnosisResult } from "@/lib/types";
import Badge, { ConfidenceBar } from "@/components/common/Badge";

interface DiagnosisCardProps {
  diagnosis: DiagnosisResult;
}

export default function DiagnosisCard({ diagnosis }: DiagnosisCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-green-700 px-6 py-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-green-200 text-xs font-medium uppercase tracking-wide mb-1">
            Diagnosis
          </p>
          <h2 className="text-white text-xl font-bold leading-tight">
            {diagnosis.disease_name}
          </h2>
        </div>
        <span className="text-3xl mt-0.5">🔬</span>
      </div>

      <div className="p-6 space-y-5">
        {/* Confidence */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Confidence
            </span>
            <Badge
              label={`Risk: ${diagnosis.risk_level ?? "medium"}`}
              variant="risk"
              value={diagnosis.risk_level ?? "medium"}
            />
          </div>
          <ConfidenceBar value={diagnosis.confidence} />
        </div>

        {/* Description */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            What it is
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{diagnosis.description}</p>
        </div>

        {/* Treatment steps */}
        {diagnosis.treatment_steps.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Treatment steps
            </p>
            <ol className="space-y-2">
              {diagnosis.treatment_steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Timeline + Prevention */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
              Recovery timeline
            </p>
            <p className="text-sm text-gray-700">{diagnosis.timeline}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
              Prevention
            </p>
            <p className="text-sm text-gray-700">{diagnosis.prevention}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
