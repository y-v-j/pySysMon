import React from 'react';
import { Monitor, Sliders, Code2, Terminal, Download, Cpu, Sparkles } from 'lucide-react';
import JSZip from 'jszip';
import { SysMonConfig, SysMonTheme } from '../types';
import { getAllProjectFiles } from '../data/pythonCodeGenerator';

interface NavbarProps {
  activeTab: 'simulator' | 'customizer' | 'code' | 'install';
  setActiveTab: (tab: 'simulator' | 'customizer' | 'code' | 'install') => void;
  config: SysMonConfig;
  theme: SysMonTheme;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  config,
  theme,
}) => {

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const files = getAllProjectFiles(config, theme);

    files.forEach((file) => {
      zip.file(file.filename, file.content);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pysysmon-python.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand logo & OS badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400 font-fantasque font-bold text-xl">
              B
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans-ui font-bold text-lg text-slate-100 tracking-tight">
                pySysMon
              </h1>
              <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Python 3.12
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 font-sans-ui">
              <span>Low-RAM System Monitor for Bazzite OS</span>
              <span className="inline-block w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-mono text-[11px]">~14 MB RAM</span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'simulator'
                ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('customizer')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'customizer'
                ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Theme & Modules</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'code'
                ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Python Source</span>
          </button>

          <button
            onClick={() => setActiveTab('install')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'install'
                ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Autostart Guide</span>
          </button>
        </nav>

        {/* Download Zip Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadZip}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-sans-ui shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>Download Zip</span>
          </button>
        </div>

      </div>
    </header>
  );
};
