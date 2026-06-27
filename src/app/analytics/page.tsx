"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Thermometer,
  Droplet,
  AlertTriangle,
  Info,
  Zap,
  Activity,
  Eye,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface Telemetry {
  id: string;
  timestamp: string;
  temperature: number;
  ph: number;
  turbidity: number;
  isSimulated: boolean;
}

interface Settings {
  tempMin: number;
  tempMax: number;
  phMin: number;
  phMax: number;
  turbidityMax: number;
  aeratorState: boolean;
}

// Custom tooltip for the charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2 shadow-lg text-[10px] font-bold space-y-1">
        <p className="text-slate-400 uppercase tracking-wider">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name}: {entry.value?.toFixed(2)} {entry.unit}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [history, setHistory] = useState<Telemetry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [forcingAerator, setForcingAerator] = useState(false);

  const fetchData = async () => {
    try {
      const telRes = await fetch("/api/telemetry");
      if (telRes.ok) {
        const telData = await telRes.json();
        setHistory(telData.reverse());
      }

      const setRes = await fetch("/api/settings");
      if (setRes.ok) {
        const setData = await setRes.json();
        setSettings(setData);
      }
    } catch (e) {
      console.error("Error loading analytics:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const forceStartAerator = async () => {
    if (!settings || forcingAerator) return;
    setForcingAerator(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, aeratorState: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        alert("Aerator forced to active state. Signal synced with ESP32.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setForcingAerator(false);
    }
  };

  if (isLoading && history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[75vh]">
        <Activity className="h-8 w-8 text-[#0f3d4a] animate-spin mb-4" />
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Loading Analytics...</p>
      </div>
    );
  }

  const latestReading = history.length > 0 ? history[history.length - 1] : null;

  const chartData = history.map((h) => ({
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    Temp:      parseFloat(h.temperature.toFixed(2)),
    pH:        parseFloat(h.ph.toFixed(2)),
    Turbidity: parseFloat(h.turbidity.toFixed(1)),
  }));

  const noDataPlaceholder = (label: string) => (
    <div className="h-full flex flex-col items-center justify-center text-center p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
      <Info className="h-6 w-6 text-slate-400 mb-2" />
      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">No {label} Data</h4>
      <p className="text-[9px] text-slate-500 mt-1 max-w-xs font-semibold">
        Connect your ESP32 to start logging sensor readings.
      </p>
    </div>
  );

  const tempStatus = latestReading
    ? latestReading.temperature < (settings?.tempMin ?? 26) || latestReading.temperature > (settings?.tempMax ?? 30)
      ? { text: "Out of Range", color: "text-red-500" }
      : { text: "Optimal", color: "text-teal-600" }
    : { text: "No Data", color: "text-slate-400" };

  const phStatus = latestReading
    ? latestReading.ph < (settings?.phMin ?? 6.5) || latestReading.ph > (settings?.phMax ?? 8.5)
      ? { text: "Out of Range", color: "text-red-500" }
      : { text: "Neutral", color: "text-teal-600" }
    : { text: "No Data", color: "text-slate-400" };

  const turbidityStatus = latestReading
    ? latestReading.turbidity > (settings?.turbidityMax ?? 100)
      ? { text: "Critical", color: "text-red-500" }
      : latestReading.turbidity > (settings?.turbidityMax ?? 100) * 0.75
      ? { text: "Warning", color: "text-yellow-600" }
      : { text: "Clear", color: "text-teal-600" }
    : { text: "No Data", color: "text-slate-400" };

  return (
    <div className="space-y-5">

      {/* Page Header */}
      <div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
          Pond 04 Analytics
        </span>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
          Water Quality Parameters
        </h2>
      </div>

      {/* Latest Reading Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Temperature */}
        <div className="glass-panel p-4 rounded-3xl bg-white border border-slate-200 flex items-center space-x-3">
          <div className="bg-orange-50 p-2 rounded-2xl shrink-0">
            <Thermometer className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Temp</span>
            <span className="text-sm font-extrabold text-slate-800">
              {latestReading ? `${latestReading.temperature.toFixed(1)}°C` : "--"}
            </span>
            <span className={`text-[8px] font-black uppercase tracking-wider block mt-0.5 ${tempStatus.color}`}>
              {tempStatus.text}
            </span>
          </div>
        </div>

        {/* pH */}
        <div className="glass-panel p-4 rounded-3xl bg-white border border-slate-200 flex items-center space-x-3">
          <div className="bg-blue-50 p-2 rounded-2xl shrink-0">
            <Droplet className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">pH</span>
            <span className="text-sm font-extrabold text-slate-800">
              {latestReading ? latestReading.ph.toFixed(2) : "--"}
            </span>
            <span className={`text-[8px] font-black uppercase tracking-wider block mt-0.5 ${phStatus.color}`}>
              {phStatus.text}
            </span>
          </div>
        </div>

        {/* Turbidity */}
        <div className="glass-panel p-4 rounded-3xl bg-white border border-slate-200 flex items-center space-x-3">
          <div className="bg-teal-50 p-2 rounded-2xl shrink-0">
            <Eye className="h-4 w-4 text-teal-600" />
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Turbidity</span>
            <span className="text-sm font-extrabold text-slate-800">
              {latestReading ? `${latestReading.turbidity.toFixed(1)} NTU` : "--"}
            </span>
            <span className={`text-[8px] font-black uppercase tracking-wider block mt-0.5 ${turbidityStatus.color}`}>
              {turbidityStatus.text}
            </span>
          </div>
        </div>
      </div>

      {/* Charts + Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: 3 Stacked Charts */}
        <div className="lg:col-span-2 space-y-5">

          {/* Temperature Chart */}
          <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <Thermometer className="h-4 w-4 text-orange-500" />
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Temperature (°C)</span>
              <span className="ml-auto text-[9px] font-bold text-slate-400">
                Safe: {settings?.tempMin ?? 26}–{settings?.tempMax ?? 30}°C
              </span>
            </div>
            <div className="h-[160px] w-full">
              {chartData.length === 0 ? noDataPlaceholder("Temperature") : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" stroke="#94a3b8" tickLine={false} style={{ fontSize: 9, fontWeight: 700 }} />
                    <YAxis domain={["auto", "auto"]} stroke="#94a3b8" tickLine={false} style={{ fontSize: 9, fontWeight: 700 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line name="Temp" unit="°C" type="monotone" dataKey="Temp" stroke="#f97316" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* pH Chart */}
          <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <Droplet className="h-4 w-4 text-blue-500" />
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">pH Level</span>
              <span className="ml-auto text-[9px] font-bold text-slate-400">
                Safe: {settings?.phMin ?? 6.5}–{settings?.phMax ?? 8.5}
              </span>
            </div>
            <div className="h-[160px] w-full">
              {chartData.length === 0 ? noDataPlaceholder("pH") : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" stroke="#94a3b8" tickLine={false} style={{ fontSize: 9, fontWeight: 700 }} />
                    <YAxis domain={[4, 10]} stroke="#94a3b8" tickLine={false} style={{ fontSize: 9, fontWeight: 700 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line name="pH" unit="" type="monotone" dataKey="pH" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Turbidity Chart */}
          <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-3">
              <Eye className="h-4 w-4 text-teal-600" />
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Turbidity (NTU)</span>
              <span className="ml-auto text-[9px] font-bold text-slate-400">
                Safe max: {settings?.turbidityMax ?? 100} NTU
              </span>
            </div>
            <div className="h-[160px] w-full">
              {chartData.length === 0 ? noDataPlaceholder("Turbidity") : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" stroke="#94a3b8" tickLine={false} style={{ fontSize: 9, fontWeight: 700 }} />
                    <YAxis domain={[0, "auto"]} stroke="#94a3b8" tickLine={false} style={{ fontSize: 9, fontWeight: 700 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line name="Turbidity" unit=" NTU" type="monotone" dataKey="Turbidity" stroke="#0f3d4a" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* System Note */}
          <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 border-l-4 border-l-teal-600 flex items-start space-x-3">
            <div className="text-teal-600 shrink-0 mt-0.5">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">System Note</h4>
              <p className="text-[10px] text-slate-600 font-semibold leading-relaxed mt-1">
                Charts update every 10 seconds. All three parameters (Temperature, pH, Turbidity) are sourced directly from the ESP32 sensor array via local HTTP telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Stats + Alerts + Action */}
        <div className="lg:col-span-1 space-y-5">

          {/* Legend Card */}
          <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Parameter Legend
            </h4>
            {[
              { color: "#f97316", label: "Temperature", unit: "°C" },
              { color: "#3b82f6", label: "pH Level",    unit: "" },
              { color: "#0f3d4a", label: "Turbidity",   unit: "NTU" },
            ].map((p) => (
              <div key={p.label} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-[10px] font-bold text-slate-600">{p.label}</span>
                </div>
                <span className="text-[9px] font-black text-slate-400">{p.unit}</span>
              </div>
            ))}
          </div>

          {/* Trend Stats */}
          <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Latest Readings
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500">Temperature</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {latestReading ? `${latestReading.temperature.toFixed(1)}°C` : "--"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500">pH</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {latestReading ? latestReading.ph.toFixed(2) : "--"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500">Turbidity</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {latestReading ? `${latestReading.turbidity.toFixed(1)} NTU` : "--"}
                </span>
              </div>
            </div>
          </div>

          {/* Turbidity Warning */}
          {latestReading !== null && latestReading.turbidity > (settings?.turbidityMax ?? 100) && (
            <div className="glass-panel p-5 rounded-3xl bg-red-50 border border-red-200 flex items-start space-x-3">
              <div className="bg-red-100 p-1.5 rounded-xl shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h4 className="text-xs font-black text-red-800 uppercase tracking-tight">High Turbidity</h4>
                <p className="text-[10px] text-red-700/90 font-bold leading-relaxed mt-1">
                  Water clarity at {latestReading.turbidity.toFixed(1)} NTU — exceeds safe max. Check filtration system.
                </p>
              </div>
            </div>
          )}

          {/* Temp Warning */}
          {latestReading !== null &&
            (latestReading.temperature < (settings?.tempMin ?? 26) || latestReading.temperature > (settings?.tempMax ?? 30)) && (
            <div className="glass-panel p-5 rounded-3xl bg-orange-50 border border-orange-200 flex items-start space-x-3">
              <div className="bg-orange-100 p-1.5 rounded-xl shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="text-xs font-black text-orange-800 uppercase tracking-tight">Temperature Alert</h4>
                <p className="text-[10px] text-orange-700/90 font-bold leading-relaxed mt-1">
                  {latestReading.temperature.toFixed(1)}°C is outside safe range ({settings?.tempMin ?? 26}–{settings?.tempMax ?? 30}°C).
                </p>
              </div>
            </div>
          )}

          {/* Force Aerator Button */}
          <button
            onClick={forceStartAerator}
            disabled={forcingAerator}
            className="w-full flex items-center justify-center space-x-2 bg-[#0f3d4a] hover:bg-[#0c2e38] text-white font-bold py-3.5 px-6 rounded-3xl transition shadow-lg shadow-teal-900/10"
          >
            <Zap className="h-4 w-4 fill-white animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-widest">
              {forcingAerator ? "Activating..." : "Force Start Aerator"}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
