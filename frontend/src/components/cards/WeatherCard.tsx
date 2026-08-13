import type { WeatherResult } from "@/lib/types";
import Badge from "@/components/common/Badge";

interface WeatherCardProps {
  weather: WeatherResult;
}

const riskIcons: Record<string, string> = {
  WATERLOGGING: "💧",
  FROST: "🧊",
  DROUGHT: "☀️",
  HIGH_HUMIDITY: "🌫️",
  HEAT_STRESS: "🔥",
};

export default function WeatherCard({ weather }: WeatherCardProps) {
  const { current_weather, alerts, forecast_summary } = weather;

  return (
    <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 px-6 py-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-blue-200 text-xs font-medium uppercase tracking-wide mb-1">
            Weather
          </p>
          <h2 className="text-white text-xl font-bold leading-tight">
            {alerts.length > 0 ? `${alerts.length} Risk Alert${alerts.length > 1 ? "s" : ""}` : "No Immediate Risks"}
          </h2>
        </div>
        <span className="text-3xl mt-0.5">🌦️</span>
      </div>

      <div className="p-6 space-y-5">
        {/* Current conditions */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Current conditions
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-sky-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-sky-700">
                {current_weather.temperature.toFixed(1)}°
              </p>
              <p className="text-xs text-sky-600 mt-0.5">Temp (°C)</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-indigo-700">
                {Math.round(current_weather.humidity)}%
              </p>
              <p className="text-xs text-indigo-600 mt-0.5">Humidity</p>
            </div>
            <div className="bg-cyan-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-cyan-700">
                {current_weather.rainfall_7d.toFixed(0)}
              </p>
              <p className="text-xs text-cyan-600 mt-0.5">Rain 7d (mm)</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Risk alerts
            </p>
            {alerts.map((alert, i) => (
              <div
                key={i}
                className="border border-red-100 bg-red-50 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg">
                    {riskIcons[alert.risk_type] ?? "⚠️"}
                  </span>
                  <span className="font-semibold text-red-800 text-sm">
                    {alert.risk_type.replace(/_/g, " ")}
                  </span>
                  <Badge label={alert.likelihood} variant="likelihood" value={alert.likelihood} />
                  <span className="text-xs text-red-500 ml-auto">
                    {alert.days_ahead === 0 ? "Today" : `In ${alert.days_ahead} day${alert.days_ahead > 1 ? "s" : ""}`}
                  </span>
                </div>
                <p className="text-sm text-red-700 leading-relaxed">{alert.context}</p>
                <div className="flex gap-2 items-start bg-white rounded-lg p-3 border border-red-100">
                  <span className="text-green-600 font-bold text-sm shrink-0">Action:</span>
                  <p className="text-sm text-gray-700">{alert.action}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Forecast summary */}
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
            Forecast summary
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{forecast_summary}</p>
        </div>
      </div>
    </div>
  );
}
