"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  MessageSquare,
  Phone,
  CheckCircle,
  Wind,
  Zap,
  Thermometer,
  Activity,
} from "lucide-react";

interface Alert {
  id: string;
  timestamp: string;
  type: string;
  severity: string;
  parameter: string;
  value: number;
  message: string;
  status: string;
  resolvedAt: string | null;
}

export default function AlertsLog() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error("Error loading alerts:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      const res = await fetch("/api/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "ACKNOWLEDGED" }),
      });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (e) {
      console.error("Error acknowledging alert:", e);
    }
  };

  // Find if there is an active critical alert for Pond 1 malfunction
  const urgentAlert = alerts.find(
    (a) => a.status === "ACTIVE" && a.parameter === "DISSOLVED_OXYGEN" && a.severity === "CRITICAL"
  );

  if (isLoading && alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[75vh]">
        <Activity className="h-8 w-8 text-[#0f3d4a] animate-spin mb-4" />
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Syncing Alarms...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      
      {/* Page Header */}
      <div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
          Alert Management
        </span>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
          Active Alarms & Logs
        </h2>
      </div>

      {/* Responsive Grid layout */}
      {/* Mobile: stacked; Desktop (lg+): Logs/Urgent left, Site Map right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (lg:col-span-2) - Urgent Alert Box & History Log */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Urgent Malfunction Card */}
          {urgentAlert && (
            <div className="glass-panel p-5 rounded-3xl bg-red-600 text-white border-none shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="bg-white/20 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Urgent
                </span>
                <div className="flex space-x-2">
                  <button className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition">
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  <button className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition">
                    <Phone className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-extrabold tracking-tight leading-tight">
                  {urgentAlert.message}
                </h3>
                <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider mt-1">
                  Immediate Action Required
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-y border-white/15 py-3 text-xs font-bold">
                <div>
                  <span className="text-[9px] font-black text-white/60 uppercase block tracking-wider">Status</span>
                  <span className="text-sm font-black text-white block mt-0.5">CRITICAL</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-white/60 uppercase block tracking-wider">Time</span>
                  <span className="text-sm font-black text-white block mt-0.5">
                    {new Date(urgentAlert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleAcknowledge(urgentAlert.id)}
                className="w-full bg-white hover:bg-slate-100 text-red-600 font-extrabold text-xs uppercase tracking-widest py-3 rounded-2xl transition shadow-md"
              >
                Acknowledge
              </button>
            </div>
          )}

          {/* History Header & List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Alert History
              </h3>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                Last 24 Hours
              </span>
            </div>

            <div className="space-y-3.5">
              {alerts.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
                  <CheckCircle className="h-6 w-6 text-emerald-500 mb-2" />
                  <h4 className="text-xs font-bold text-slate-800">No Alarm Logs</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">System status stable</p>
                </div>
              ) : (
                alerts.map((alert) => {
                  let alertIcon = <Wind className="h-5 w-5" />;
                  let iconBg = "bg-red-50 text-red-500";
                  
                  if (alert.parameter === "TEMPERATURE") {
                    alertIcon = <Thermometer className="h-5 w-5" />;
                    iconBg = "bg-yellow-50 text-yellow-600";
                  } else if (alert.parameter === "PH") {
                    alertIcon = <Droplet className="h-5 w-5" />;
                    iconBg = "bg-teal-50 text-teal-600";
                  }

                  return (
                    <div key={alert.id} className="glass-panel p-4 rounded-3xl bg-white border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`${iconBg} p-2.5 rounded-2xl`}>
                          {alertIcon}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{alert.message}</h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            Value: {alert.value.toFixed(1)} • {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {alert.status === "RESOLVED" && (
                            <span className="text-[8px] text-emerald-600 font-extrabold uppercase mt-1 block">
                              ✓ Resolved by System
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {alert.status === "ACTIVE" && (
                          <button
                            onClick={() => handleAcknowledge(alert.id)}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#0f3d4a] text-[10px] font-black uppercase tracking-wider rounded-xl transition border border-slate-200"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alert.status === "ACKNOWLEDGED" && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-xl transition border border-slate-200"
                          >
                            Resolve
                          </button>
                        )}
                        {alert.status === "RESOLVED" && (
                          <span className="text-slate-400 text-xs italic">
                            Acknowledged
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column (lg:col-span-1) - Pond layout Map */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 space-y-4 lg:sticky lg:top-20">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-ping"></div>
              <div className="h-2 w-2 rounded-full bg-red-500 absolute"></div>
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">
                Active Site: Pond 1
              </span>
            </div>

            {/* Custom SVG Layout Map */}
            <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-center">
              <svg viewBox="0 0 120 400" className="w-2/3 h-auto max-h-[300px]">
                {/* Pond 1 */}
                <rect x="10" y="10" width="100" height="80" rx="8" fill="#fecaca" stroke="#ef4444" strokeWidth="2" />
                <text x="60" y="45" textAnchor="middle" fill="#991b1b" fontSize="10" fontWeight="bold" fontFamily="sans-serif">POND 1</text>
                <text x="60" y="60" textAnchor="middle" fill="#b91c1c" fontSize="7" fontWeight="bold" fontFamily="sans-serif">CRITICAL</text>
                <circle cx="100" cy="20" r="4" fill="#ef4444" className="animate-pulse" />

                {/* Pond 2 */}
                <rect x="10" y="110" width="100" height="80" rx="8" fill="#fef9c3" stroke="#eab308" strokeWidth="1.5" />
                <text x="60" y="145" textAnchor="middle" fill="#854d0e" fontSize="10" fontWeight="bold" fontFamily="sans-serif">POND 2</text>
                <text x="60" y="160" textAnchor="middle" fill="#a16207" fontSize="7" fontWeight="bold" fontFamily="sans-serif">WARNING</text>

                {/* Pond 3 */}
                <rect x="10" y="210" width="100" height="80" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
                <text x="60" y="245" textAnchor="middle" fill="#475569" fontSize="10" fontWeight="bold" fontFamily="sans-serif">POND 3</text>
                <text x="60" y="260" textAnchor="middle" fill="#64748b" fontSize="7" fontWeight="bold" fontFamily="sans-serif">STABLE</text>

                {/* Pond 4 */}
                <rect x="10" y="310" width="100" height="80" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
                <text x="60" y="345" textAnchor="middle" fill="#475569" fontSize="10" fontWeight="bold" fontFamily="sans-serif">POND 4</text>
                <text x="60" y="360" textAnchor="middle" fill="#64748b" fontSize="7" fontWeight="bold" fontFamily="sans-serif">STABLE</text>
              </svg>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
