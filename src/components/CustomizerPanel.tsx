import React from 'react';
import { SysMonConfig, SysMonTheme, SysMonPosition } from '../types';
import { THEMES } from '../data/defaultConfig';
import { Sliders, Palette, Layout, Eye, Cpu, HardDrive, Wifi, Shield, Sparkles } from 'lucide-react';

interface CustomizerPanelProps {
  config: SysMonConfig;
  setConfig: React.Dispatch<React.SetStateAction<SysMonConfig>>;
  theme: SysMonTheme;
  setTheme: React.Dispatch<React.SetStateAction<SysMonTheme>>;
}

export const CustomizerPanel: React.FC<CustomizerPanelProps> = ({
  config,
  setConfig,
  theme,
  setTheme,
}) => {

  const handleModuleToggle = (key: keyof SysMonConfig['modules']) => {
    setConfig((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [key]: !prev.modules[key],
      },
    }));
  };

  const handlePositionChange = (pos: SysMonPosition) => {
    setConfig((prev) => ({ ...prev, position: pos }));
  };

  const handleThemeSelect = (selectedTheme: SysMonTheme) => {
    setTheme(selectedTheme);
    setConfig((prev) => ({
      ...prev,
      themeId: selectedTheme.id,
      customTheme: selectedTheme,
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Theme Presets Selection */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Palette className="w-5 h-5 text-cyan-400" />
          <h2 className="font-sans-ui font-bold text-slate-100 text-sm uppercase tracking-wider">
            Color Palette Presets
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleThemeSelect(t)}
              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                theme.id === t.id
                  ? 'bg-slate-800/90 border-cyan-500/60 ring-1 ring-cyan-500/30 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div>
                <div className="font-sans-ui font-semibold text-xs text-slate-200">
                  {t.name}
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.primary }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.accent }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.success }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.background }} />
                </div>
              </div>
              {theme.id === t.id && (
                <span className="text-xs text-cyan-400 font-mono font-bold bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/30">
                  Active
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Position & Geometry Settings */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Layout className="w-5 h-5 text-indigo-400" />
          <h2 className="font-sans-ui font-bold text-slate-100 text-sm uppercase tracking-wider">
            Position & Typography
          </h2>
        </div>

        {/* Screen Alignment */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 font-sans-ui mb-2">
            Screen Position Alignment
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as SysMonPosition[]).map((pos) => (
              <button
                key={pos}
                onClick={() => handlePositionChange(pos)}
                className={`py-2 px-3 rounded-xl text-xs font-mono capitalize transition-all border ${
                  config.position === pos
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {pos.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Width Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Widget Width:</span>
            <span className="font-mono text-cyan-400">{config.width} px</span>
          </div>
          <input
            type="range"
            min={300}
            max={500}
            step={10}
            value={config.width}
            onChange={(e) => setConfig({ ...config, width: Number(e.target.value) })}
            className="w-full accent-cyan-400"
          />
        </div>

        {/* Font Size Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Font Size (Fantasque Mono):</span>
            <span className="font-mono text-cyan-400">{config.fontSize} pt</span>
          </div>
          <input
            type="range"
            min={10}
            max={18}
            step={1}
            value={config.fontSize}
            onChange={(e) => setConfig({ ...config, fontSize: Number(e.target.value) })}
            className="w-full accent-cyan-400"
          />
        </div>

        {/* Refresh Rate & RAM Impact */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Telemetry Refresh Rate:</span>
            <span className="font-mono text-cyan-400">{config.refreshRate} sec</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={3.0}
            step={0.5}
            value={config.refreshRate}
            onChange={(e) => setConfig({ ...config, refreshRate: Number(e.target.value) })}
            className="w-full accent-cyan-400"
          />
          <p className="text-[11px] text-slate-400 font-mono">
            * Estimated Python memory usage: ~{(13 + (1.0 / config.refreshRate)).toFixed(1)} MB RAM.
          </p>
        </div>

        {/* Window Opacity */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Window Transparency Opacity:</span>
            <span className="font-mono text-cyan-400">{Math.round(config.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.4}
            max={1.0}
            step={0.05}
            value={config.opacity}
            onChange={(e) => setConfig({ ...config, opacity: Number(e.target.value) })}
            className="w-full accent-cyan-400"
          />
        </div>

      </div>

      {/* Module Toggles */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sliders className="w-5 h-5 text-emerald-400" />
          <h2 className="font-sans-ui font-bold text-slate-100 text-sm uppercase tracking-wider">
            Enable / Disable Modules
          </h2>
        </div>

        <div className="space-y-2">
          {[
            { key: 'dateTime', label: 'Day, Date & Time Clock' },
            { key: 'sysInfo', label: 'User, OS, Desktop & Display Manager' },
            { key: 'cpu', label: 'Processor Info, Temperature & Load' },
            { key: 'cpuSparkline', label: 'Per-Core CPU Load Sparkline' },
            { key: 'gpu', label: 'GPU Usage & VRAM Metrics' },
            { key: 'memory', label: 'RAM & Swap Usage Meters' },
            { key: 'storage', label: 'Root (/) & Home Storage Usage' },
            { key: 'network', label: 'Upload & Download Network Speeds' },
            { key: 'netChart', label: 'Live Traffic Sparkline Chart' },
            { key: 'bazziteFeatures', label: 'Bazzite Gaming & Battery Status' },
            { key: 'topProcesses', label: 'Top Consuming CPU Processes' },
          ].map((mod) => {
            const isEnabled = config.modules[mod.key as keyof SysMonConfig['modules']];
            return (
              <button
                key={mod.key}
                onClick={() => handleModuleToggle(mod.key as keyof SysMonConfig['modules'])}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isEnabled
                    ? 'bg-slate-800/80 border-emerald-500/40 text-slate-200'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                }`}
              >
                <span className="text-xs font-medium font-sans-ui">{mod.label}</span>
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  {isEnabled ? '✓' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
