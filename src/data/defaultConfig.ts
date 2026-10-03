import { SysMonConfig, SysMonTheme, SystemMetrics } from '../types';

export const THEMES: SysMonTheme[] = [
  {
    id: 'bazzite-cyber',
    name: 'Bazzite Cyber Blue (Default)',
    primary: '#38bdf8',      // Light Cyan
    accent: '#c084fc',       // Neon Purple
    label: '#94a3b8',        // Slate Gray
    value: '#f8fafc',        // Bright White
    success: '#4ade80',      // Mint Green
    warning: '#facc15',      // Bright Yellow
    danger: '#f87171',       // Red
    background: '#0b0f19',   // Deep Cyber Dark
    border: '#1e293b',       // Dark Border
    chartBar: '#38bdf8',
  },
  {
    id: 'deck-amber',
    name: 'Steam Deck Amber',
    primary: '#f59e0b',      // Amber
    accent: '#fbbf24',       // Gold
    label: '#a1a1aa',        // Zinc
    value: '#fafafa',        // White
    success: '#22c55e',      // Green
    warning: '#fb7185',      // Rose
    danger: '#ef4444',       // Crimson
    background: '#09090b',   // Pure Dark
    border: '#27272a',
    chartBar: '#f59e0b',
  },
  {
    id: 'dracula',
    name: 'Dracula Night',
    primary: '#bd93f9',      // Dracula Purple
    accent: '#ff79c6',       // Dracula Pink
    label: '#6272a4',        // Comment Gray
    value: '#f8f8f2',        // White
    success: '#50fa7b',      // Dracula Green
    warning: '#f1fa8c',      // Dracula Yellow
    danger: '#ff5555',       // Dracula Red
    background: '#1e1f29',   // Dark Navy
    border: '#44475a',
    chartBar: '#bd93f9',
  },
  {
    id: 'nord',
    name: 'Nordic Frost',
    primary: '#88c0d0',      // Nord Blue
    accent: '#81a1c1',       // Nord Light Blue
    label: '#d8dee9',        // Nord Snow
    value: '#eceff4',        // Nord Bright
    success: '#a3be8c',      // Nord Green
    warning: '#ebcb8b',      // Nord Yellow
    danger: '#bf616a',       // Nord Red
    background: '#2e3440',   // Nord Dark
    border: '#4c566a',
    chartBar: '#88c0d0',
  },
  {
    id: 'emerald-hacker',
    name: 'Emerald Matrix',
    primary: '#22c55e',      // Bright Green
    accent: '#34d399',       // Emerald
    label: '#6ee7b7',        // Light Mint
    value: '#f0fdf4',        // Pale Green White
    success: '#10b981',      // Emerald
    warning: '#eab308',      // Amber
    danger: '#f43f5e',       // Rose
    background: '#05130b',   // Matrix Dark
    border: '#14532d',
    chartBar: '#22c55e',
  }
];

export const DEFAULT_CONFIG: SysMonConfig = {
  title: 'pySysMon',
  position: 'top-right',
  offsetX: 24,
  offsetY: 24,
  width: 400,
  opacity: 0.88,
  fontSize: 15,
  refreshRate: 1.0,
  fontFamily: 'Fantasque Sans Mono',
  showBorder: true,
  transparentWindow: true,
  maxTopProcesses: 4,
  themeId: 'bazzite-cyber',
  customTheme: THEMES[0],
  modules: {
    dateTime: true,
    sysInfo: true,
    cpu: true,
    cpuSparkline: true,
    memory: true,
    storage: true,
    network: true,
    netChart: true,
    gpu: true,
    bazziteFeatures: true,
    topProcesses: true,
    uptimeAndNetwork: true,
  },
};

export function generateInitialMetrics(): SystemMetrics {
  return {
    currentDay: 'FRIDAY',
    currentDate: '24 JUL 2026',
    currentTime: '10:30:15',
    username: 'bazzite-user',
    hostname: 'bazzite-deck-pc',
    osName: 'Bazzite (Fedora Linux 40 Atomic)',
    kernel: 'Linux 6.10.12-200.bazzite.fc40.x86_64',
    desktopEnv: 'KDE Plasma 6.1.5',
    displayManager: 'SDDM (Wayland)',
    
    cpuModel: 'AMD Ryzen 7 7840U w/ Radeon 780M Graphics',
    cpuCores: 8,
    cpuUsage: 18.5,
    cpuTemp: 44.2,
    perCoreUsage: [12, 24, 8, 35, 18, 9, 22, 16],
    
    ramUsedGb: 6.4,
    ramTotalGb: 15.4,
    ramPercent: 41.5,
    swapUsedGb: 0.8,
    swapTotalGb: 8.0,
    swapPercent: 10.0,
    
    uploadRateKb: 142.8,
    downloadRateKb: 1280.4,
    totalSentMb: 345.2,
    totalRecvMb: 2890.6,
    networkInterface: 'wlan0',
    localIp: '192.168.1.105',
    
    gpuName: 'AMD Radeon 780M (RADV GFX1103)',
    gpuUsage: 22.0,
    gpuTemp: 46.0,
    vramUsedGb: 2.1,
    vramTotalGb: 6.0,
    
    rootUsedGb: 18.2,
    rootTotalGb: 64.0,
    varHomeUsedGb: 245.8,
    varHomeTotalGb: 915.0,
    
    uptime: '3d 14h 22m',
    batteryPercent: 92,
    isPluggedIn: true,
    gamescopeActive: true,
    gameMode: 'Desktop Mode (Steam Active)',
    
    topCpuProcesses: [
      { pid: 18421, name: 'steam', cpu: 8.4, mem: 2.8 },
      { pid: 19102, name: 'kwin_wayland', cpu: 4.2, mem: 1.5 },
      { pid: 21045, name: 'python3 (pysysmon)', cpu: 0.2, mem: 0.1 },
      { pid: 20114, name: 'firefox', cpu: 2.1, mem: 6.4 },
    ],
    topMemProcesses: [
      { pid: 20114, name: 'firefox', cpu: 2.1, mem: 6.4 },
      { pid: 18421, name: 'steam', cpu: 8.4, mem: 2.8 },
      { pid: 19102, name: 'kwin_wayland', cpu: 4.2, mem: 1.5 },
      { pid: 1102, name: 'plasmashell', cpu: 1.1, mem: 1.2 },
    ]
  };
}
