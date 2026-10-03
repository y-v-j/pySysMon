export interface SysMonTheme {
  id: string;
  name: string;
  primary: string;       // main headers / titles (e.g. #38bdf8)
  accent: string;        // stats & numbers (e.g. #a855f7)
  label: string;         // field labels (e.g. #94a3b8)
  value: string;         // main text values (e.g. #f8fafc)
  success: string;       // healthy meters / status (e.g. #22c55e)
  warning: string;       // warning thresholds (e.g. #eab308)
  danger: string;        // high usage alert (e.g. #ef4444)
  background: string;    // bg hex (e.g. #090d16)
  border: string;        // border hex (e.g. #1e293b)
  chartBar: string;      // block meter active character color
}

export type SysMonPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center-right';

export interface ModuleToggles {
  dateTime: boolean;
  sysInfo: boolean;
  cpu: boolean;
  cpuSparkline: boolean;
  memory: boolean;
  storage: boolean;
  network: boolean;
  netChart: boolean;
  gpu: boolean;
  bazziteFeatures: boolean;
  topProcesses: boolean;
  uptimeAndNetwork: boolean;
}

export interface SysMonConfig {
  title: string;
  position: SysMonPosition;
  offsetX: number;
  offsetY: number;
  width: number;
  opacity: number;
  fontSize: number;
  refreshRate: number; // in seconds, e.g. 1.0
  fontFamily: string;
  modules: ModuleToggles;
  themeId: string;
  customTheme: SysMonTheme;
  showBorder: boolean;
  transparentWindow: boolean;
  maxTopProcesses: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  mem: number;
}

export interface SystemMetrics {
  currentDay: string;
  currentDate: string;
  currentTime: string;
  username: string;
  hostname: string;
  osName: string;
  kernel: string;
  desktopEnv: string;
  displayManager: string;
  
  // Hardware
  cpuModel: string;
  cpuCores: number;
  cpuUsage: number;
  cpuTemp: number;
  perCoreUsage: number[];
  
  ramUsedGb: number;
  ramTotalGb: number;
  ramPercent: number;
  swapUsedGb: number;
  swapTotalGb: number;
  swapPercent: number;
  
  uploadRateKb: number;
  downloadRateKb: number;
  totalSentMb: number;
  totalRecvMb: number;
  networkInterface: string;
  localIp: string;
  
  gpuName: string;
  gpuUsage: number;
  gpuTemp: number;
  vramUsedGb: number;
  vramTotalGb: number;
  
  rootUsedGb: number;
  rootTotalGb: number;
  varHomeUsedGb: number;
  varHomeTotalGb: number;
  
  uptime: string;
  batteryPercent: number;
  isPluggedIn: boolean;
  gamescopeActive: boolean;
  gameMode: string;
  
  topCpuProcesses: ProcessInfo[];
  topMemProcesses: ProcessInfo[];
}

export interface ProjectFile {
  filename: string;
  language: string;
  description: string;
  content: string;
}
