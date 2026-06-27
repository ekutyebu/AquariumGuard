"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Lock,
  Thermometer,
  Activity,
  AlertTriangle,
  FileCode,
  Copy,
  CheckCircle,
  Save,
  Sliders,
} from "lucide-react";

interface Settings {
  tempMin: number;
  tempMax: number;
  phMin: number;
  phMax: number;
  turbidityMax: number;
  aeratorState: boolean;
  boreholePumpState: boolean;
  predictiveEnabled: boolean;
  intervalMinutes: number;
  wifiSsid: string;
  wifiPass: string;
  serverIp: string;
  serverPort: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    tempMin: 26.0,
    tempMax: 30.0,
    phMin: 6.5,
    phMax: 8.5,
    turbidityMax: 100.0,
    aeratorState: true,
    boreholePumpState: false,
    predictiveEnabled: true,
    intervalMinutes: 3,
    wifiSsid: "AquariumGuard_Net",
    wifiPass: "aquarium123",
    serverIp: "192.168.1.100",
    serverPort: 3000,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [showFirmwareConfig, setShowFirmwareConfig] = useState(true); // Default show on desktop

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (e) {
        console.error("Error loading settings:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" || name.includes("Min") || name.includes("Max") || name === "turbidityMax" ? Number(value) : value,
    }));
  };

  const handleTurbiditySlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings((prev) => ({
      ...prev,
      turbidityMax: Math.max(20.0, Number(e.target.value)),
    }));
  };

  const handleTempSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSettings((prev) => ({
      ...prev,
      tempMin: parseFloat((val - 2).toFixed(1)),
      tempMax: parseFloat((val + 2).toFixed(1)),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSuccessMsg("Settings updated successfully.");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const generateConfigSnippet = () => {
    return `// AquariumGuard ESP32 Configuration Header
#ifndef CONFIG_H
#define CONFIG_H

// Multi Wi-Fi networks (add more entries as needed)
struct WifiNetwork { const char* ssid; const char* pass; };
const WifiNetwork WIFI_NETWORKS[] = {
  { "${settings.wifiSsid}", "${settings.wifiPass}" },
};
const int WIFI_NETWORK_COUNT = sizeof(WIFI_NETWORKS) / sizeof(WIFI_NETWORKS[0]);

#define SERVER_IP   "${settings.serverIp}"
#define SERVER_PORT ${settings.serverPort}

#define SIMULATE_SENSORS      0
#define DEFAULT_INTERVAL_MINS ${settings.intervalMinutes}

#define PIN_GREEN_LED  18
#define PIN_YELLOW_LED 19
#define PIN_RED_LED    21
#define PIN_BUZZER     22

#define PIN_TEMP_BUS         4
#define PIN_PH_ANALOG        34
#define PIN_TURBIDITY_ANALOG 35

#define TEMP_MIN      ${settings.tempMin.toFixed(1)}
#define TEMP_MAX      ${settings.tempMax.toFixed(1)}
#define PH_MIN        ${settings.phMin.toFixed(2)}
#define PH_MAX        ${settings.phMax.toFixed(2)}
#define TURBIDITY_MAX ${settings.turbidityMax.toFixed(1)}

#endif // CONFIG_H`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateConfigSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[75vh]">
        <Activity className="h-8 w-8 text-[#0f3d4a] animate-spin mb-4" />
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Syncing Settings...</p>
      </div>
    );
  }

  const tempMidpoint = Math.round((settings.tempMin + settings.tempMax) / 2);

  return (
    <div className="space-y-5">
      
      {/* Header Title */}
      <div className="flex items-center space-x-3">
        <Settings className="h-6 w-6 text-slate-500" />
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            System Configuration
          </span>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
            Catfish Safety Settings
          </h2>
        </div>
      </div>

      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed border-b border-slate-200 pb-3.5">
        Precision environmental thresholds for Clarias gariepinus health management at IUC Research Pond 04.
      </p>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
          <CheckCircle className="h-4 w-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Responsive Grid layout */}
      {/* Mobile: stacked; Desktop (lg+): Settings left, Exporter/Network right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column - Core Thresholds Form */}
        <form onSubmit={handleSave} className="space-y-5">
          
          {/* Turbidity Config */}
          <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Turbidity
              </span>
              <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1 border border-slate-200">
                <Lock className="h-2.5 w-2.5" />
                <span>Safety Locked</span>
              </span>
            </div>

            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tighter">
                {settings.turbidityMax.toFixed(0)}
              </span>
              <span className="text-xs font-bold text-slate-400">NTU max</span>
            </div>

            <div className="space-y-1.5 pt-2">
              <input
                type="range"
                min="20"
                max="200"
                step="5"
                value={settings.turbidityMax}
                onChange={handleTurbiditySlider}
                className="w-full accent-[#0f3d4a] cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-wider">
                <span>20 NTU Clean</span>
                <span className="text-[#0f3d4a]">100 NTU Threshold</span>
                <span>200 NTU Critical</span>
              </div>
            </div>

            <p className="text-[9px] text-slate-400 italic font-bold leading-relaxed border-t border-slate-100 pt-3">
              Note: High turbidity reduces light penetration and oxygen transfer. African Catfish tolerate up to ~100 NTU before stress responses begin.
            </p>
          </div>

          {/* Temp Config */}
          <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Water Temperature
              </span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                Target Range: <span className="text-slate-800 font-extrabold">{settings.tempMin}°C - {settings.tempMax}°C</span>
              </span>
            </div>

            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tighter">
                {tempMidpoint.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-400">°C</span>
            </div>

            <div className="space-y-1.5 pt-2">
              <input
                type="range"
                min="22"
                max="33"
                step="0.5"
                value={tempMidpoint}
                onChange={handleTempSlider}
                className="w-full accent-[#0f3d4a] cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-wider">
                <span>20°C Dormant</span>
                <span>35°C Stress</span>
              </div>
            </div>
          </div>

          {/* Predictive Toggle */}
          <div className="glass-panel p-4 rounded-3xl bg-white border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3.5 pr-2">
              <div className="bg-slate-100 p-2.5 rounded-2xl text-slate-600 shrink-0">
                <Activity className="h-5 w-5 text-[#0f3d4a]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Predictive Alert</h4>
                <p className="text-[9px] text-slate-400 font-semibold leading-relaxed mt-1">
                  Notify me if Turbidity is estimated to exceed the safe maximum in 30 minutes based on sensor telemetry.
                </p>
              </div>
            </div>
            <label className="switch shrink-0">
              <input
                type="checkbox"
                name="predictiveEnabled"
                checked={settings.predictiveEnabled}
                onChange={handleChange}
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* Override Warnings */}
          <div className="glass-panel rounded-3xl bg-slate-100 border border-slate-200 flex items-stretch overflow-hidden">
            <div className="bg-red-800/80 px-4 flex items-center justify-center text-white shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="p-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">System Override Protocol</h4>
              <p className="text-[9px] text-slate-500 font-semibold leading-relaxed mt-1">
                Setting thresholds outside biology-matched parameters will trigger an automated emergency aeration cycle.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center space-x-2 bg-[#0f3d4a] hover:bg-[#0c2e38] text-white font-bold py-3.5 px-6 rounded-3xl transition shadow-lg shadow-teal-900/10"
          >
            <Save className="h-4.5 w-4.5" />
            <span className="text-xs font-extrabold uppercase tracking-widest">
              {isSaving ? "Saving Settings..." : "Save Settings"}
            </span>
          </button>
        </form>

        {/* Right Column - Network Parameters & PlatformIO Exporter */}
        <div className="space-y-6">
          {/* Network Parameter Card */}
          <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Device & Network Parameters (Offline Configuration)
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Local SSID</label>
                <input
                  type="text"
                  name="wifiSsid"
                  value={settings.wifiSsid}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#0f3d4a]"
                />
              </div>
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">SSID Pass</label>
                <input
                  type="password"
                  name="wifiPass"
                  value={settings.wifiPass}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#0f3d4a]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">PC Server IP</label>
                <input
                  type="text"
                  name="serverIp"
                  value={settings.serverIp}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#0f3d4a]"
                />
              </div>
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Port</label>
                <input
                  type="number"
                  name="serverPort"
                  value={settings.serverPort}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#0f3d4a]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Upload Rate (Minutes)</label>
              <input
                type="number"
                min="1"
                max="60"
                name="intervalMinutes"
                value={settings.intervalMinutes}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold outline-none focus:border-[#0f3d4a]"
              />
            </div>
          </div>

          {/* Exporter Block */}
          <div className="glass-panel p-5 rounded-3xl bg-white border border-slate-200 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <FileCode className="h-4 w-4 text-[#0f3d4a]" />
                <span>PlatformIO `config.h` Exporter</span>
              </span>
              <button
                onClick={copyToClipboard}
                className="text-[#0f3d4a] hover:underline text-[9px] font-black uppercase tracking-wider flex items-center space-x-1"
              >
                {copied ? <CheckCircle className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <p className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
              Pasting this into `firmware/src/config.h` synchronizes local Wi-Fi and safe biological thresholds with the ESP32 firmware.
            </p>
            <pre className="bg-slate-950 p-4 border border-slate-800 rounded-xl text-[9px] font-mono text-slate-300 overflow-x-auto max-h-[220px] leading-relaxed select-all">
              {generateConfigSnippet()}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
