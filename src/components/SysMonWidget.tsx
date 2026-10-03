import React from 'react';
import { SysMonConfig, SysMonTheme, SystemMetrics } from '../types';

interface SysMonWidgetProps {
  config: SysMonConfig;
  theme: SysMonTheme;
  metrics: SystemMetrics;
  netHistoryUp: number[];
  netHistoryDown: number[];
}

export const SysMonWidget: React.FC<SysMonWidgetProps> = ({
  config,
  theme,
  metrics,
  netHistoryUp,
  netHistoryDown,
}) => {
  const { modules } = config;

  // Helper to render ASCII Block Meter
  const renderAsciiBar = (percent: number, width = 14) => {
    const filled = Math.max(0, Math.min(width, Math.round((width * percent) / 100)));
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  // Helper to convert sparkline array to ASCII sparkline bars ( ▂▃▄▅▆▇█)
  const renderSparkline = (data: number[], width = 16) => {
    const sparkChars = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    const sliced = data.slice(-width);
    const maxVal = Math.max(...sliced, 10);
    return sliced
      .map((v) => {
        const idx = Math.min(sparkChars.length - 1, Math.floor((v / maxVal) * sparkChars.length));
        return sparkChars[idx];
      })
      .join('');
  };

  const getTagColor = (percent: number) => {
    if (percent > 85) return theme.danger;
    if (percent > 65) return theme.warning;
    return theme.success;
  };

  return (
    <div
      style={{
        width: `${config.width}px`,
        backgroundColor: config.transparentWindow ? 'rgba(11, 15, 25, 0.35)' : theme.background,
        color: theme.value,
        opacity: config.opacity,
        borderColor: config.showBorder ? theme.border : 'transparent',
        fontSize: `${config.fontSize}px`,
        fontFamily: "'Fantasque Sans Mono', 'FantasqueSansMono', 'JetBrains Mono', monospace",
      }}
      className="rounded-xl border shadow-2xl p-4 select-none backdrop-blur-md transition-all duration-300 leading-relaxed space-y-3"
    >
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor: theme.border }}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primary }} />
          <span className="font-bold tracking-wider uppercase" style={{ color: theme.primary }}>
            {config.title}
          </span>
        </div>
        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}>
          Fantasque Mono
        </span>
      </div>

      {/* Date & Time */}
      {modules.dateTime && (
        <div className="space-y-1">
          <div className="font-bold text-sm" style={{ color: theme.accent }}>
            {metrics.currentDay}, {metrics.currentDate}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span style={{ color: theme.label }}>TIME: </span>
              <span className="font-bold" style={{ color: theme.value }}>
                {metrics.currentTime}
              </span>
            </div>
            <div>
              <span style={{ color: theme.label }}>UPTIME: </span>
              <span style={{ color: theme.value }}>{metrics.uptime}</span>
            </div>
          </div>
        </div>
      )}

      {/* System & OS Info */}
      {modules.sysInfo && (
        <div className="space-y-1 text-xs">
          <div className="font-bold uppercase tracking-wide text-[11px] border-b pb-1 mb-1.5" style={{ color: theme.primary, borderColor: `${theme.border}80` }}>
            SYSTEM IDENTITY
          </div>
          <div>
            <span style={{ color: theme.label }}>USER     : </span>
            <span style={{ color: theme.value }}>{metrics.username}@{metrics.hostname}</span>
          </div>
          <div>
            <span style={{ color: theme.label }}>OS       : </span>
            <span style={{ color: theme.value }}>{metrics.osName}</span>
          </div>
          <div>
            <span style={{ color: theme.label }}>KERNEL   : </span>
            <span style={{ color: theme.label }} className="text-[11px]">{metrics.kernel}</span>
          </div>
          <div>
            <span style={{ color: theme.label }}>DESKTOP  : </span>
            <span style={{ color: theme.value }}>{metrics.desktopEnv}</span>
          </div>
          <div>
            <span style={{ color: theme.label }}>DISP MGR : </span>
            <span style={{ color: theme.value }}>{metrics.displayManager}</span>
          </div>
        </div>
      )}

      {/* CPU & Thermals */}
      {modules.cpu && (
        <div className="space-y-1 text-xs">
          <div className="font-bold uppercase tracking-wide text-[11px] border-b pb-1 mb-1.5 flex justify-between" style={{ color: theme.primary, borderColor: `${theme.border}80` }}>
            <span>PROCESSOR ({metrics.cpuCores} CORES)</span>
            <span style={{ color: theme.label }}>{metrics.cpuTemp}°C</span>
          </div>
          <div className="text-[11px] truncate mb-1" style={{ color: theme.label }}>
            {metrics.cpuModel}
          </div>
          <div className="flex items-center justify-between font-mono">
            <span style={{ color: theme.label }}>CPU LOAD: </span>
            <span style={{ color: theme.chartBar }}>[{renderAsciiBar(metrics.cpuUsage, 12)}]</span>
            <span style={{ color: getTagColor(metrics.cpuUsage) }} className="font-bold">
              {metrics.cpuUsage.toFixed(1)}%
            </span>
          </div>

          {modules.cpuSparkline && (
            <div className="pt-0.5 flex items-center justify-between text-[11px]">
              <span style={{ color: theme.label }}>CORES HIST :</span>
              <span style={{ color: theme.accent }} className="font-mono tracking-widest">
                {metrics.perCoreUsage.map((p) => (p > 50 ? '█' : p > 25 ? '▅' : '▃')).join('')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* GPU (If active) */}
      {modules.gpu && (
        <div className="space-y-1 text-xs">
          <div className="font-bold uppercase tracking-wide text-[11px] border-b pb-1 mb-1.5 flex justify-between" style={{ color: theme.primary, borderColor: `${theme.border}80` }}>
            <span>GPU STATS</span>
            <span style={{ color: theme.label }}>{metrics.gpuTemp}°C</span>
          </div>
          <div className="text-[11px] truncate" style={{ color: theme.label }}>
            {metrics.gpuName}
          </div>
          <div className="flex items-center justify-between font-mono">
            <span style={{ color: theme.label }}>GPU LOAD: </span>
            <span style={{ color: theme.chartBar }}>[{renderAsciiBar(metrics.gpuUsage, 12)}]</span>
            <span style={{ color: getTagColor(metrics.gpuUsage) }} className="font-bold">
              {metrics.gpuUsage.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span style={{ color: theme.label }}>VRAM    : </span>
            <span style={{ color: theme.value }}>
              {metrics.vramUsedGb.toFixed(1)} / {metrics.vramTotalGb.toFixed(1)} GB
            </span>
          </div>
        </div>
      )}

      {/* RAM & Storage */}
      {modules.memory && (
        <div className="space-y-1.5 text-xs">
          <div className="font-bold uppercase tracking-wide text-[11px] border-b pb-1 mb-1.5" style={{ color: theme.primary, borderColor: `${theme.border}80` }}>
            MEMORY & STORAGE
          </div>
          <div className="flex items-center justify-between font-mono">
            <span style={{ color: theme.label }}>RAM : </span>
            <span style={{ color: theme.chartBar }}>[{renderAsciiBar(metrics.ramPercent, 12)}]</span>
            <span style={{ color: getTagColor(metrics.ramPercent) }} className="font-bold">
              {metrics.ramPercent.toFixed(0)}%
            </span>
          </div>
          <div className="text-[11px] text-right" style={{ color: theme.label }}>
            {metrics.ramUsedGb.toFixed(1)} / {metrics.ramTotalGb.toFixed(1)} GB
          </div>

          {modules.storage && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between font-mono">
                <span style={{ color: theme.label }}>ROOT: </span>
                <span style={{ color: theme.chartBar }}>
                  [{renderAsciiBar((metrics.rootUsedGb / metrics.rootTotalGb) * 100, 12)}]
                </span>
                <span style={{ color: theme.value }}>
                  {metrics.rootUsedGb.toFixed(0)}/{metrics.rootTotalGb.toFixed(0)}G
                </span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span style={{ color: theme.label }}>HOME: </span>
                <span style={{ color: theme.chartBar }}>
                  [{renderAsciiBar((metrics.varHomeUsedGb / metrics.varHomeTotalGb) * 100, 12)}]
                </span>
                <span style={{ color: theme.value }}>
                  {metrics.varHomeUsedGb.toFixed(0)}/{metrics.varHomeTotalGb.toFixed(0)}G
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Network Speeds */}
      {modules.network && (
        <div className="space-y-1.5 text-xs">
          <div className="font-bold uppercase tracking-wide text-[11px] border-b pb-1 mb-1.5 flex justify-between" style={{ color: theme.primary, borderColor: `${theme.border}80` }}>
            <span>NET ({metrics.networkInterface})</span>
            <span style={{ color: theme.label }}>{metrics.localIp}</span>
          </div>

          <div className="flex items-center justify-between">
            <span style={{ color: theme.label }}>UPLOAD   ▲ : </span>
            <span className="font-bold font-mono" style={{ color: theme.accent }}>
              {metrics.uploadRateKb < 1024
                ? `${metrics.uploadRateKb.toFixed(1)} KB/s`
                : `${(metrics.uploadRateKb / 1024).toFixed(1)} MB/s`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span style={{ color: theme.label }}>DOWNLOAD ▼ : </span>
            <span className="font-bold font-mono" style={{ color: theme.success }}>
              {metrics.downloadRateKb < 1024
                ? `${metrics.downloadRateKb.toFixed(1)} KB/s`
                : `${(metrics.downloadRateKb / 1024).toFixed(1)} MB/s`}
            </span>
          </div>

          {modules.netChart && (
            <div className="pt-1 flex items-center justify-between font-mono text-[11px]">
              <span style={{ color: theme.label }}>LIVE TRAFFIC:</span>
              <span className="tracking-widest" style={{ color: theme.success }}>
                {renderSparkline(netHistoryDown, 14)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bazzite Features (Steam Deck / Handheld / Gamescope) */}
      {modules.bazziteFeatures && (
        <div className="space-y-1 text-xs">
          <div className="font-bold uppercase tracking-wide text-[11px] border-b pb-1 mb-1.5" style={{ color: theme.primary, borderColor: `${theme.border}80` }}>
            BAZZITE GAMING STATS
          </div>
          <div className="flex justify-between">
            <span style={{ color: theme.label }}>GAME MODE  : </span>
            <span style={{ color: theme.success }}>{metrics.gameMode}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: theme.label }}>BATTERY    : </span>
            <span style={{ color: theme.value }}>
              {metrics.batteryPercent}% {metrics.isPluggedIn ? '⚡ [AC Power]' : '🔋 [Discharging]'}
            </span>
          </div>
        </div>
      )}

      {/* Top Processes */}
      {modules.topProcesses && (
        <div className="space-y-1.5 text-xs">
          <div className="font-bold uppercase tracking-wide text-[11px] border-b pb-1 mb-1.5" style={{ color: theme.primary, borderColor: `${theme.border}80` }}>
            TOP CPU PROCESSES
          </div>
          {metrics.topCpuProcesses.slice(0, config.maxTopProcesses).map((proc, idx) => (
            <div key={idx} className="flex items-center justify-between font-mono text-[11px]">
              <span className="truncate max-w-[130px]" style={{ color: theme.value }}>
                {proc.name}
              </span>
              <div className="space-x-2">
                <span style={{ color: theme.accent }}>CPU:{proc.cpu.toFixed(1)}%</span>
                <span style={{ color: theme.label }}>MEM:{proc.mem.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer minimal signature */}
      <div className="pt-2 border-t text-[10px] text-center flex justify-between items-center" style={{ borderColor: theme.border, color: theme.label }}>
        <span>Python 3.12 (Tkinter)</span>
        <span className="font-mono text-emerald-400">RAM: ~14MB</span>
      </div>
    </div>
  );
};
