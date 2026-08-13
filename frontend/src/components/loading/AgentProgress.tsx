const steps = [
  { icon: "🔬", label: "Analysing crop image" },
  { icon: "🌦️", label: "Checking weather risks" },
  { icon: "🛒", label: "Finding local products" },
];

export default function AgentProgress() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-green-100 border-t-green-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">🌿</div>
      </div>

      <div className="text-center">
        <p className="text-lg font-semibold text-green-900">Consulting the AI agents…</p>
        <p className="text-sm text-gray-500 mt-1">This usually takes 10–20 seconds</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {steps.map(({ icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 bg-white border border-green-100 rounded-xl px-4 py-3 shadow-sm animate-pulse"
          >
            <span className="text-xl">{icon}</span>
            <span className="text-sm text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
