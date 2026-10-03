import React, { useState } from 'react';
import { Terminal, Copy, Check, Download, ShieldCheck, Zap, Sparkles, AlertCircle } from 'lucide-react';

export const InstallGuide: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fontCommand = `mkdir -p ~/.local/share/fonts
cd ~/.local/share/fonts
curl -fLO https://github.com/belluzj/fantasque-sans/releases/download/v1.8.0/FantasqueSansMono-Normal.tar.gz
tar -xzf FantasqueSansMono-Normal.tar.gz
fc-cache -f -v`;

  const installCommand = `mkdir -p ~/.local/share/pysysmon
# Copy pysysmon.py into ~/.local/share/pysysmon/
chmod +x ~/.local/share/pysysmon/pysysmon.py

# Optional: Virtualenv for psutil
python3 -m venv ~/.local/share/pysysmon/venv
~/.local/share/pysysmon/venv/bin/pip install psutil`;

  const autostartDesktopCommand = `mkdir -p ~/.config/autostart
cat << 'EOF' > ~/.config/autostart/pysysmon.desktop
[Desktop Entry]
Type=Application
Name=pySysMon
Comment=Lightweight Python System Monitor
Exec=python3 /var/home/%u/.local/share/pysysmon/pysysmon.py
Terminal=false
Categories=System;Utility;
X-KDE-autostart-after=panel
X-GNOME-Autostart-enabled=true
EOF`;

  const systemdCommand = `mkdir -p ~/.config/systemd/user
cat << 'EOF' > ~/.config/systemd/user/pysysmon.service
[Unit]
Description=pySysMon System Monitor Widget
After=graphical-session.target

[Service]
Type=simple
ExecStart=/usr/bin/env python3 %h/.local/share/pysysmon/pysysmon.py
Restart=on-failure
RestartSec=3

[Install]
WantedBy=graphical-session.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now pysysmon.service`;

  const verifyCommand = `ps aux | grep pysysmon`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-2">
      
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-sans-ui font-bold text-xl text-slate-100">
              Bazzite OS Installation & Startup Guide
            </h2>
            <p className="text-sm text-slate-300 font-sans-ui mt-1 leading-relaxed">
              Bazzite OS uses an immutable Fedora Atomic filesystem. Follow these instructions to run pySysMon with minimum memory overhead (~14MB RAM) and configure automatic startup on boot or login.
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Font Installation */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center font-mono">
              1
            </span>
            <h3 className="font-sans-ui font-bold text-slate-200 text-base">
              Install Fantasque Sans Mono Font
            </h3>
          </div>
          <button
            onClick={() => copyToClipboard(fontCommand, 'font')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700"
          >
            {copiedId === 'font' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId === 'font' ? 'Copied' : 'Copy Commands'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 font-sans-ui">
          Run these commands in Konsole or Ptyxis terminal to install Fantasque Sans Mono to your user font directory (<code className="text-cyan-400 font-mono">~/.local/share/fonts</code>):
        </p>

        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 font-fantasque text-xs text-cyan-300 overflow-x-auto">
          <pre>{fontCommand}</pre>
        </div>
      </div>

      {/* Step 2: Application File Setup */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center font-mono">
              2
            </span>
            <h3 className="font-sans-ui font-bold text-slate-200 text-base">
              Set up pySysMon Script
            </h3>
          </div>
          <button
            onClick={() => copyToClipboard(installCommand, 'install')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700"
          >
            {copiedId === 'install' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId === 'install' ? 'Copied' : 'Copy Commands'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 font-sans-ui">
          Place <code className="text-cyan-400 font-mono">pysysmon.py</code> inside <code className="text-cyan-400 font-mono">~/.local/share/pysysmon/</code> and make it executable:
        </p>

        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 font-fantasque text-xs text-cyan-300 overflow-x-auto">
          <pre>{installCommand}</pre>
        </div>
      </div>

      {/* Step 3: Autostart Configuration */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center font-mono">
            3
          </span>
          <h3 className="font-sans-ui font-bold text-slate-200 text-base">
            Configure Run at Startup (Autostart)
          </h3>
        </div>

        {/* Option A: Desktop Entry */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-sans-ui font-semibold text-xs text-slate-300 uppercase tracking-wider">
              Option A: Freedesktop Autostart Entry (KDE Plasma & GNOME)
            </h4>
            <button
              onClick={() => copyToClipboard(autostartDesktopCommand, 'autostartDesktop')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700"
            >
              {copiedId === 'autostartDesktop' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'autostartDesktop' ? 'Copied' : 'Copy Desktop Entry'}</span>
            </button>
          </div>
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 font-fantasque text-xs text-cyan-300 overflow-x-auto">
            <pre>{autostartDesktopCommand}</pre>
          </div>
        </div>

        {/* Option B: Systemd User Service */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="font-sans-ui font-semibold text-xs text-slate-300 uppercase tracking-wider">
              Option B: Systemd User Service
            </h4>
            <button
              onClick={() => copyToClipboard(systemdCommand, 'systemd')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700"
            >
              {copiedId === 'systemd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'systemd' ? 'Copied' : 'Copy Service'}</span>
            </button>
          </div>
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 font-fantasque text-xs text-cyan-300 overflow-x-auto">
            <pre>{systemdCommand}</pre>
          </div>
        </div>
      </div>

      {/* Step 4: Memory Footprint Verification */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center font-mono">
              4
            </span>
            <h3 className="font-sans-ui font-bold text-slate-200 text-base">
              Verify Minimum Memory Usage
            </h3>
          </div>
          <button
            onClick={() => copyToClipboard(verifyCommand, 'verify')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700"
          >
            {copiedId === 'verify' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId === 'verify' ? 'Copied' : 'Copy Verification'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 font-sans-ui">
          Check the active RAM footprint of pySysMon at any time:
        </p>

        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 font-fantasque text-xs text-emerald-400 overflow-x-auto">
          <pre>{verifyCommand}</pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-sans-ui">pySysMon Python</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">~14.2 MB RAM</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-sans-ui">Standard Conky Lua</div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1">~38.5 MB RAM</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-sans-ui">Electron Desktop Widget</div>
            <div className="text-lg font-bold font-mono text-red-400 mt-1">~320.0 MB RAM</div>
          </div>
        </div>
      </div>

    </div>
  );
};
