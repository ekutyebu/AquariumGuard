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
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
} from "recharts";

interface Telemetry {
  id: string;
  timestamp: string;
  temperature: number;
  ph: number;
  dissolvedOxygen: number;
  isSimulated: boolean;
}

interface Settings {
  tempMin: number;
  tempMax: number;
  phMin: number;
  phMax: number;
  doMin: number;
  aeratorState: boolean;
}

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

  const displayData = history.map((h) => ({
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    DO: h.dissolvedOxygen,
  }));

  return (
    <div className="space-y-5">
      
      {/* 1. Page Header */}
      <div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
          Pond 04 Analytics
        </span>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
          Dissolved Oxygen / Oxygène Dissous
        </h2>
      </div>

      {/* Responsive Grid Wrapper */}
      {/* Mobile: stacked; Desktop (lg+): Chart left, stats/warnings right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (lg:col-span-2) - Chart & System Note */}
        <div className="lg:col-span-2 space-y-5">
          {/* Recharts Chart Card */}
          <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="h-[230px] w-full mt-2">
              {displayData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Info className="h-6 w-6 text-slate-400 mb-2" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">No Analytics Data</h4>
                  <p className="text-[9px] text-slate-500 mt-1 max-w-xs font-semibold">
                    Connect your ESP32 device to start logging and visualizing dissolved oxygen levels over time.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" stroke="#94a3b8" tickLine={false} style={{ fontSize: 9, fontWeight: 700 }} />
                    <YAxis domain={[0.0, 8.0]} stroke="#94a3b8" tickLine={false} style={{ fontSize: 9, fontWeight: 700 }} />
                    <Tooltip />
                    
                    <ReferenceArea
                      y1={0.0}
                      y2={4.0}
                      fill="#fef2f2"
                      stroke="#fee2e2"
                      label={{
                        value: "WARNING ZONE / ZONE D'ALERTE",
                        fill: "#ef4444",
                        fontSize: 8,
                        fontWeight: 800,
                        position: "insideTopLeft",
                        offset: 10
                      }}
                    />
                    
                    <Line
                      name="DO"
                      type="monotone"
                      dataKey="DO"
                      stroke="#0f3d4a"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-100 flex justify-between items-center">
              <div className="flex items-center space-x-1.5 text-slate-500">
                <span className="h-2 w-2 rounded-full bg-[#0f3d4a]"></span>
                <span className="text-[10px] font-black uppercase tracking-wider">Current Levels</span>
              </div>
              <span className="text-base font-extrabold text-slate-800">
                {latestReading !== null ? `${latestReading.dissolvedOxygen.toFixed(1)} mg/L` : "--"}
              </span>
            </div>
          </div>

          {/* System Note Container */}
          <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 border-l-4 border-l-teal-600 flex items-start space-x-3">
            <div className="text-teal-600 shrink-0 mt-0.5">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                System Note / Note de Système
              </h4>
              <p className="text-[10px] text-slate-600 font-semibold leading-relaxed mt-1">
                Sensor S-049 calibrated 48h ago. Next reading in 12 mins. All pumps reporting normal voltage.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (lg:col-span-1) - Stats cards, Override Alerts & Force Button */}
        <div className="lg:col-span-1 space-y-5">
          {/* Parameter Grid (Side-by-side or stacked cleanly based on space) */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            {/* Temp Card */}
            <div className="glass-panel p-4.5 rounded-3xl bg-slate-100/50 border border-slate-200/80 flex items-center space-x-3.5">
              <Thermometer className="h-5.5 w-5.5 text-slate-500 shrink-0" />
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Temp</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {latestReading !== null ? `${latestReading.temperature.toFixed(1)}°C` : "--"}
                </span>
              </div>
            </div>

            {/* pH Card */}
            <div className="glass-panel p-4.5 rounded-3xl bg-slate-100/50 border border-slate-200/80 flex items-center space-x-3.5">
              <Droplet className="h-5.5 w-5.5 text-slate-500 shrink-0" />
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">pH Level</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {latestReading !== null ? latestReading.ph.toFixed(1) : "--"}
                </span>
              </div>
            </div>
          </div>

          {/* Critical Warning Alert Block */}
          {latestReading !== null && latestReading.dissolvedOxygen < (settings?.doMin ?? 5.0) && (
            <div className="glass-panel p-5 rounded-3xl bg-red-100 border border-red-200 flex items-start space-x-3">
              <div className="bg-red-50 p-1.5 rounded-xl text-white shrink-0 mt-0.5">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-red-800 uppercase tracking-tight">Critical Drop Warning</h4>
                <p className="text-[10px] text-red-700/90 font-bold uppercase tracking-wider leading-relaxed mt-1">
                  Oxygen reached {latestReading.dissolvedOxygen.toFixed(1)} mg/L. Recommended action: Manual aeration bypass.
                </p>
              </div>
            </div>
          )}

          {/* Force Start Aerator Primary Button */}
          <button
            onClick={forceStartAerator}
            disabled={forcingAerator}
            className="w-full flex items-center justify-center space-x-2 bg-[#0f3d4a] hover:bg-[#0c2e38] text-white font-bold py-3.5 px-6 rounded-3xl transition shadow-lg shadow-teal-900/10"
          >
            <Zap className="h-4.5 w-4.5 fill-white animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-widest">Force Start Aerator</span>
          </button>
        </div>

      </div>
    </div>
  );
}
