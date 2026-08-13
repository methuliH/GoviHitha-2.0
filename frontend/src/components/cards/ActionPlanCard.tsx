interface ActionPlanCardProps {
  steps: string[];
  situationSummary: string;
  timeline: string;
}

export default function ActionPlanCard({ steps, situationSummary, timeline }: ActionPlanCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-green-900 px-6 py-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-green-300 text-xs font-medium uppercase tracking-wide mb-1">
            Your action plan
          </p>
          <h2 className="text-white text-xl font-bold leading-tight">
            {steps.length} Steps to recovery
          </h2>
        </div>
        <span className="text-3xl mt-0.5">📋</span>
      </div>

      <div className="p-6 space-y-5">
        {/* Situation summary */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
            Situation
          </p>
          <p className="text-sm text-gray-800 leading-relaxed font-medium">{situationSummary}</p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, i) => {
            const isUrgent = i === 0;
            return (
              <div
                key={i}
                className={`flex gap-4 rounded-xl p-4 border transition-colors ${
                  isUrgent
                    ? "bg-red-50 border-red-200"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                <div
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isUrgent
                      ? "bg-red-500 text-white"
                      : "bg-green-600 text-white"
                  }`}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {isUrgent && (
                    <span className="inline-block text-xs font-bold text-red-600 uppercase tracking-wide mb-1">
                      Do first
                    </span>
                  )}
                  <p className="text-sm text-gray-800 leading-relaxed">{step}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-3 bg-green-50 rounded-xl p-4 border border-green-100">
          <span className="text-2xl">⏱️</span>
          <div>
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
              Expected recovery
            </p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{timeline}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
