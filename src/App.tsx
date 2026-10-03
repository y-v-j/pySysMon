import React, { useState, useEffect } from 'react';
import { SysMonConfig, SysMonTheme, SystemMetrics } from './types';
import { DEFAULT_CONFIG, THEMES, generateInitialMetrics } from './data/defaultConfig';
import { Navbar } from './components/Navbar';
import { DesktopSimulator } from './components/DesktopSimulator';
import { CustomizerPanel } from './components/CustomizerPanel';
import { CodeViewer } from './components/CodeViewer';
import { InstallGuide } from './components/InstallGuide';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'customizer' | 'code' | 'install'>('simulator');
  const [config, setConfig] = useState<SysMonConfig>(DEFAULT_CONFIG);
  const [theme, setTheme] = useState<SysMonTheme>(THEMES[0]);
  const [metrics, setMetrics] = useState<SystemMetrics>(generateInitialMetrics());

  // Live network traffic sparkline buffers
  const [netHistoryUp, setNetHistoryUp] = useState<number[]>([120, 140, 180, 210, 150, 190, 240, 160, 180, 220, 190, 140]);
  const [netHistoryDown, setNetHistoryDown] = useState<number[]>([1100, 1250, 980, 1420, 1800, 1200, 1650, 1300, 1100, 1450, 1280, 1350]);

  // Live simulation tick interval
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      const timeStr = `${hours}:${mins}:${secs}`;

      // Gentle random fluctuations
      const cpuNoise = (Math.random() - 0.5) * 4.0;
      const newCpu = Math.max(5.0, Math.min(95.0, metrics.cpuUsage + cpuNoise));

      const upNoise = (Math.random() - 0.5) * 50.0;
      const newUp = Math.max(20.0, metrics.uploadRateKb + upNoise);

      const downNoise = (Math.random() - 0.5) * 300.0;
      const newDown = Math.max(200.0, metrics.downloadRateKb + downNoise);

      setMetrics((prev) => ({
        ...prev,
        currentTime: timeStr,
        cpuUsage: newCpu,
        uploadRateKb: newUp,
        downloadRateKb: newDown,
        perCoreUsage: prev.perCoreUsage.map((val) =>
          Math.max(4, Math.min(98, val + (Math.random() - 0.5) * 8))
        ),
      }));

      setNetHistoryUp((prev) => [...prev.slice(1), newUp]);
      setNetHistoryDown((prev) => [...prev.slice(1), newDown]);
    }, config.refreshRate * 1000);

    return () => clearInterval(interval);
  }, [config.refreshRate, metrics.cpuUsage, metrics.uploadRateKb, metrics.downloadRateKb]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans-ui flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        theme={theme}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {activeTab === 'simulator' && (
          <DesktopSimulator
            config={config}
            theme={theme}
            metrics={metrics}
            setMetrics={setMetrics}
            netHistoryUp={netHistoryUp}
            netHistoryDown={netHistoryDown}
          />
        )}

        {activeTab === 'customizer' && (
          <CustomizerPanel
            config={config}
            setConfig={setConfig}
            theme={theme}
            setTheme={setTheme}
          />
        )}

        {activeTab === 'code' && (
          <CodeViewer config={config} theme={theme} />
        )}

        {activeTab === 'install' && (
          <InstallGuide />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500 font-sans-ui">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            <span className="font-bold text-slate-400">pySysMon</span> — Python System Monitor Generator
          </div>
          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
            <span>Font: Fantasque Sans Mono</span>
            <span>•</span>
            <span>RAM: ~14 MB</span>
            <span>•</span>
            <span>Target: Bazzite OS</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
