import React, { useState, useEffect } from 'react';
import { SysMonConfig, SysMonTheme, SystemMetrics } from '../types';
import { SysMonWidget } from './SysMonWidget';
import { Play, Flame, Wifi, RefreshCw, Move, Layers, Cpu } from 'lucide-react';

interface DesktopSimulatorProps {
  config: SysMonConfig;
  theme: SysMonTheme;
  metrics: SystemMetrics;
  setMetrics: React.Dispatch<React.SetStateAction<SystemMetrics>>;
  netHistoryUp: number[];
  netHistoryDown: number[];
}

export const DesktopSimulator: React.FC<DesktopSimulatorProps> = ({
  config,
  theme,
  metrics,
  setMetrics,
  netHistoryUp,
  netHistoryDown,
}) => {
  const [wallpaper, setWallpaper] = useState<'bazzite-cyber' | 'deck-oled' | 'kde-breeze' | 'gnome-dark'>('bazzite-cyber');
  const [showTestWindow, setShowTestWindow] = useState<boolean>(true);

  // Background Wallpaper Styles
  const wallpaperStyles = {
    'bazzite-cyber': 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80',
    'deck-oled': 'bg-black',
    'kde-breeze': 'bg-gradient-to-tr from-cyan-950 via-slate-900 to-blue-900',
    'gnome-dark': 'bg-gradient-to-b from-purple-950 via-slate-950 to-slate-900',
  };

  // Trigger simulated CPU stress spike
  const triggerCpuSpike = () => {
    setMetrics((prev) => ({
      ...prev,
      cpuUsage: 94.2,
      cpuTemp: 78.5,
      perCoreUsage: [88, 96, 92, 98, 85, 90, 95, 89],
      ramPercent: 68.4,
      ramUsedGb: 10.5,
      topCpuProcesses: [
        { pid: 32014, name: 'cyberpunk2077.exe', cpu: 78.4, mem: 12.5 },
        { pid: 18421, name: 'steam', cpu: 12.1, mem: 3.2 },
        ...prev.topCpuProcesses.slice(2),
      ],
    }));
  };

  // Trigger network download burst
  const triggerNetBurst = () => {
    setMetrics((prev) => ({
      ...prev,
      downloadRateKb: 84500.0, // ~84.5 MB/s
      uploadRateKb: 4200.0,
    }));
  };

  return (
    <div className="space-y-4">
      {/* Simulation Controls Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 font-sans-ui uppercase tracking-wider">
            Desktop Wallpaper:
          </span>
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setWallpaper('bazzite-cyber')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                wallpaper === 'bazzite-cyber'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bazzite Cyber
            </button>
            <button
              onClick={() => setWallpaper('deck-oled')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                wallpaper === 'deck-oled'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Steam Deck OLED
            </button>
            <button
              onClick={() => setWallpaper('kde-breeze')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                wallpaper === 'kde-breeze'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              KDE Breeze
            </button>
            <button
              onClick={() => setWallpaper('gnome-dark')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                wallpaper === 'gnome-dark'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              GNOME Dark
            </button>
          </div>
        </div>

        {/* Live Event Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTestWindow(!showTestWindow)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              showTestWindow
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showTestWindow ? 'Hide Window Overlay' : 'Show Window Overlay'}</span>
          </button>

          <button
            onClick={triggerCpuSpike}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Simulate CPU Stress</span>
          </button>

          <button
            onClick={triggerNetBurst}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Simulate 80MB/s Download</span>
          </button>
        </div>
      </div>

      {/* Main Desktop Screen Area */}
      <div
        className={`relative w-full h-[680px] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl transition-all duration-500 ${wallpaperStyles[wallpaper]}`}
      >
        {/* Background Decorative Tech Lines for Bazzite Aesthetic */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />

        {/* Bazzite Desktop Branding Center Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-20 select-none">
          <div className="text-8xl font-black font-fantasque text-cyan-400/30 tracking-widest">
            BAZZITE
          </div>
          <div className="text-sm font-mono text-slate-300 tracking-widest mt-2 uppercase">
            Gaming OS • Fedora Atomic Linux
          </div>
        </div>

        {/* Simulated Desktop Shortcuts */}
        <div className="absolute top-8 left-8 flex flex-col gap-6 select-none z-10">
          <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:border-cyan-400 transition-all shadow-lg">
              <Play className="w-6 h-6 fill-cyan-400/20" />
            </div>
            <span className="text-xs font-medium text-slate-200 drop-shadow">Steam</span>
          </div>

          <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:border-emerald-400 transition-all shadow-lg">
              <Cpu className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-slate-200 drop-shadow">Hardware</span>
          </div>
        </div>

        {/* Positioned pySysMon Widget (Desktop Wallpaper Level z-10) */}
        <div
          className={`absolute transition-all duration-300 z-10 ${
            config.position === 'top-right'
              ? 'top-6 right-6'
              : config.position === 'top-left'
              ? 'top-6 left-28'
              : config.position === 'bottom-right'
              ? 'bottom-16 right-6'
              : 'bottom-16 left-28'
          }`}
        >
          <SysMonWidget
            config={config}
            theme={theme}
            metrics={metrics}
            netHistoryUp={netHistoryUp}
            netHistoryDown={netHistoryDown}
          />
        </div>

        {/* Floating Active Application Window (Overlays ON TOP of pySysMon widget) */}
        {showTestWindow && (
          <div className="absolute top-16 left-36 w-[520px] h-[360px] bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl z-25 flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            {/* Window Titlebar */}
            <div className="h-9 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between px-3 select-none">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 cursor-pointer" onClick={() => setShowTestWindow(false)} />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-medium text-slate-300 font-sans-ui flex items-center gap-1.5">
                  <span>💻</span>
                  <span>bazzite-user@bazzite-deck:~ (Konsole Terminal)</span>
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Active Window (On Top)
              </span>
            </div>

            {/* Window Content */}
            <div className="p-4 font-fantasque text-xs text-slate-300 space-y-2 font-mono leading-relaxed overflow-y-auto">
              <div className="text-cyan-400">bazzite-user@bazzite-deck:~$ ps aux | grep pysysmon</div>
              <div className="text-slate-400 text-[11px] leading-tight">
                bazzite+  14208  0.1  0.2  14320 14820 ?  Ss   10:52   0:01 python3 ~/.local/share/pysysmon/pysysmon.py
              </div>
              <div className="text-emerald-400 font-bold pt-1">✓ pySysMon running in Desktop Layer (_NET_WM_WINDOW_TYPE_DESKTOP)</div>
              <div className="text-slate-400 text-[11px]">
                - Fixed to desktop background wallpaper level<br/>
                - Stays behind active windows (will NOT overlap or obscure application windows)<br/>
                - Background rendered transparent with Fantasque Sans Mono +2px font size
              </div>
              <div className="text-purple-300 pt-2 flex items-center gap-2">
                <span className="animate-pulse">▶</span>
                <span>systemctl --user status pysysmon.service</span>
              </div>
              <div className="text-emerald-300 text-[11px]">● pysysmon.service - pySysMon System Monitor Widget</div>
              <div className="text-slate-400 text-[11px]">   Loaded: loaded (~/.config/systemd/user/pysysmon.service; enabled)</div>
              <div className="text-slate-400 text-[11px]">   Active: active (running) since Fri 2026-07-24 10:51:10 PDT</div>
            </div>
          </div>
        )}

        {/* Simulated Linux Taskbar Panel at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-between px-4 z-30 select-none">
          {/* Start Launcher & Task Icons */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold font-sans-ui hover:bg-cyan-500/30 cursor-pointer">
              <span className="font-fantasque text-sm font-black">B</span>
              <span>Application Launcher</span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-slate-800/80 flex items-center justify-center text-cyan-400 text-xs">
                🎮
              </div>
              <div className="w-6 h-6 rounded bg-slate-800/80 flex items-center justify-center text-emerald-400 text-xs">
                💻
              </div>
              <div className="w-6 h-6 rounded bg-slate-800/80 flex items-center justify-center text-purple-400 text-xs">
                📁
              </div>
            </div>
          </div>

          {/* Tray Clock & Status */}
          <div className="flex items-center gap-4 text-xs text-slate-300 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Wayland</span>
            </span>
            <span className="text-slate-400">|</span>
            <span>{metrics.currentTime}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
