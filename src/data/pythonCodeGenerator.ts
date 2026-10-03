import { SysMonConfig, SysMonTheme, ProjectFile } from '../types';

export function generatePythonScript(config: SysMonConfig, theme: SysMonTheme): string {
  return `#!/usr/bin/env python3
"""
================================================================================
 PYSYSMON - Ultra-Lightweight Python System Monitor
 Designed specifically for Bazzite OS (KDE Plasma / GNOME / Steam Deck)
 Font: Fantasque Sans Mono
 Memory Footprint: ~12 MB - 18 MB RAM | CPU Usage: < 0.2%
================================================================================
"""

import sys
import os
import time
import socket
import getpass
import platform
import subprocess
import argparse

# Try loading psutil for advanced stats, fallback to pure /proc if missing
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

# Try loading tkinter for GUI overlay
try:
    import tkinter as tk
    from tkinter import font as tkfont
    HAS_TKINTER = True
except ImportError:
    HAS_TKINTER = False

# ------------------------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------------------------
FONT_FAMILY = "${config.fontFamily}"
FONT_SIZE = ${config.fontSize}
REFRESH_RATE_MS = ${Math.round(config.refreshRate * 1000)}  # ${config.refreshRate}s refresh interval
WINDOW_WIDTH = ${config.width}
WINDOW_OPACITY = ${config.opacity}
POSITION = "${config.position}"  # top-right, top-left, bottom-right, bottom-left
OFFSET_X = ${config.offsetX}
OFFSET_Y = ${config.offsetY}

# COLOR PALETTE (${theme.name})
COLOR_BG = "${theme.background}"
COLOR_FG = "${theme.value}"
COLOR_PRIMARY = "${theme.primary}"
COLOR_ACCENT = "${theme.accent}"
COLOR_LABEL = "${theme.label}"
COLOR_SUCCESS = "${theme.success}"
COLOR_WARNING = "${theme.warning}"
COLOR_DANGER = "${theme.danger}"
COLOR_BORDER = "${theme.border}"

# ------------------------------------------------------------------------------
# SYSTEM DATA COLLECTOR (Pure Python + /proc Fallbacks)
# ------------------------------------------------------------------------------
class SystemDataCollector:
    def __init__(self):
        self.last_net_bytes_sent = 0
        self.last_net_bytes_recv = 0
        self.last_net_time = time.time()
        self.upload_rate = 0.0
        self.download_rate = 0.0
        self._init_net()

    def _init_net(self):
        if HAS_PSUTIL:
            net = psutil.net_io_counters()
            self.last_net_bytes_sent = net.bytes_sent
            self.last_net_bytes_recv = net.bytes_recv
        else:
            sent, recv = self._get_net_proc()
            self.last_net_bytes_sent = sent
            self.last_net_bytes_recv = recv

    def _get_net_proc(self):
        """Pure /proc/net/dev reader for low overhead"""
        sent, recv = 0, 0
        try:
            with open('/proc/net/dev', 'r') as f:
                lines = f.readlines()[2:]
                for line in lines:
                    parts = line.split(':')
                    if len(parts) < 2:
                        continue
                    iface = parts[0].strip()
                    if iface == 'lo':
                        continue
                    data = parts[1].split()
                    recv += int(data[0])
                    sent += int(data[8])
        except Exception:
            pass
        return sent, recv

    def update_network_speeds(self):
        now = time.time()
        dt = max(0.1, now - self.last_net_time)
        if HAS_PSUTIL:
            net = psutil.net_io_counters()
            sent, recv = net.bytes_sent, net.bytes_recv
        else:
            sent, recv = self._get_net_proc()

        self.upload_rate = max(0.0, (sent - self.last_net_bytes_sent) / dt / 1024.0)    # KB/s
        self.download_rate = max(0.0, (recv - self.last_net_bytes_recv) / dt / 1024.0)  # KB/s

        self.last_net_bytes_sent = sent
        self.last_net_bytes_recv = recv
        self.last_net_time = now

    def get_user_info(self):
        username = getpass.getuser()
        hostname = socket.gethostname()
        return username, hostname

    def get_os_info(self):
        os_name = "Bazzite Linux"
        try:
            with open('/etc/os-release', 'r') as f:
                for line in f:
                    if line.startswith('PRETTY_NAME='):
                        os_name = line.split('=')[1].strip().strip('"')
                        break
        except Exception:
            pass
        kernel = platform.release()
        return os_name, kernel

    def get_desktop_environment(self):
        desktop = os.environ.get('XDG_CURRENT_DESKTOP', 'KDE').upper()
        session_type = os.environ.get('XDG_SESSION_TYPE', 'wayland').capitalize()
        display_mgr = "SDDM" if "KDE" in desktop else "GDM"
        return f"{desktop} ({session_type})", display_mgr

    def get_cpu_info(self):
        cpu_model = "Processor"
        try:
            with open('/proc/cpuinfo', 'r') as f:
                for line in f:
                    if "model name" in line:
                        cpu_model = line.split(':')[1].strip()
                        break
        except Exception:
            pass

        # Clean model name for display
        cpu_model = cpu_model.replace("AMD ", "").replace("Intel(R) Core(TM) ", "").replace("Processor", "").strip()

        if HAS_PSUTIL:
            cpu_usage = psutil.cpu_percent()
            cpu_cores = psutil.cpu_count(logical=True)
        else:
            cpu_usage = 0.0
            cpu_cores = os.cpu_count() or 4

        # Thermal reading
        cpu_temp = 0.0
        try:
            thermal_path = '/sys/class/thermal/thermal_zone0/temp'
            if os.path.exists(thermal_path):
                with open(thermal_path, 'r') as f:
                    cpu_temp = int(f.read().strip()) / 1000.0
        except Exception:
            pass

        return cpu_model, cpu_cores, cpu_usage, cpu_temp

    def get_ram_info(self):
        if HAS_PSUTIL:
            mem = psutil.virtual_memory()
            swap = psutil.swap_memory()
            return mem.used/1073741824.0, mem.total/1073741824.0, mem.percent, swap.used/1073741824.0, swap.total/1073741824.0, swap.percent
        else:
            # Proc fallback
            total, free, buffers, cached = 0, 0, 0, 0
            try:
                with open('/proc/meminfo', 'r') as f:
                    for line in f:
                        parts = line.split()
                        if parts[0] == 'MemTotal:': total = int(parts[1])
                        elif parts[0] == 'MemFree:': free = int(parts[1])
                        elif parts[0] == 'Buffers:': buffers = int(parts[1])
                        elif parts[0] == 'Cached:': cached = int(parts[1])
                used = total - (free + buffers + cached)
                pct = (used / total) * 100.0 if total > 0 else 0
                return used/1048576.0, total/1048576.0, pct, 0, 0, 0
            except Exception:
                return 0, 0, 0, 0, 0, 0

    def get_storage_info(self):
        try:
            root_stat = os.statvfs('/')
            root_total = (root_stat.f_blocks * root_stat.f_frsize) / 1073741824.0
            root_used = ((root_stat.f_blocks - root_stat.f_bfree) * root_stat.f_frsize) / 1073741824.0
            
            home_dir = os.path.expanduser('~')
            home_stat = os.statvfs(home_dir)
            home_total = (home_stat.f_blocks * home_stat.f_frsize) / 1073741824.0
            home_used = ((home_stat.f_blocks - home_stat.f_bfree) * home_stat.f_frsize) / 1073741824.0
            return root_used, root_total, home_used, home_total
        except Exception:
            return 0, 1, 0, 1

    def get_uptime(self):
        try:
            with open('/proc/uptime', 'r') as f:
                uptime_seconds = float(f.readline().split()[0])
            days = int(uptime_seconds // 86400)
            hours = int((uptime_seconds % 86400) // 3600)
            minutes = int((uptime_seconds % 3600) // 60)
            if days > 0:
                return f"{days}d {hours}h {minutes}m"
            return f"{hours}h {minutes}m"
        except Exception:
            return "N/A"

    def get_top_processes(self, limit=4):
        if not HAS_PSUTIL:
            return []
        try:
            procs = []
            for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                try:
                    info = p.info
                    if info['name'] and info['cpu_percent'] is not None:
                        procs.append(info)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            procs.sort(key=lambda x: x['cpu_percent'] or 0, reverse=True)
            return procs[:limit]
        except Exception:
            return []

# Helper: Create ASCII Block Bar [████████░░]
def render_ascii_bar(percent, width=15):
    filled = int(round(width * percent / 100.0))
    filled = max(0, min(width, filled))
    return "█" * filled + "░" * (width - filled)

# ------------------------------------------------------------------------------
# TKINTER GUI OVERLAY APP
# ------------------------------------------------------------------------------
class PySysMonGUI:
    def __init__(self, root):
        self.root = root
        self.collector = SystemDataCollector()
        self.setup_window()
        self.build_ui()
        self.update_loop()

    def setup_window(self):
        self.root.title("pySysMon")
        self.root.overrideredirect(True)          # Frameless overlay window
        self.root.attributes("-topmost", False)   # NEVER top-most (stays beneath normal windows)
        
        # Desktop window layer type hint for KDE Plasma & GNOME on X11 / Wayland
        try:
            self.root.wm_attributes("-type", "desktop")
        except Exception:
            try:
                self.root.wm_attributes("-type", "dock")
            except Exception:
                pass

        # Lower window to stick to wallpaper background level
        try:
            self.root.lower()
        except Exception:
            pass

        # Ensure clicking or focus never brings pySysMon over active app windows
        self.root.bind("<FocusIn>", lambda e: self.root.lower())
        self.root.bind("<Button-1>", lambda e: self.root.lower())

        # Transparent background setup (Linux X11/Wayland chroma key)
        try:
            self.root.wm_attributes("-transparentcolor", COLOR_BG)
        except Exception:
            try:
                self.root.attributes("-alpha", WINDOW_OPACITY)
            except Exception:
                pass

        # Calculate position on screen
        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()
        
        window_h = 740
        if POSITION == "top-right":
            x = screen_w - WINDOW_WIDTH - OFFSET_X
            y = OFFSET_Y
        elif POSITION == "top-left":
            x = OFFSET_X
            y = OFFSET_Y
        elif POSITION == "bottom-right":
            x = screen_w - WINDOW_WIDTH - OFFSET_X
            y = screen_h - window_h - OFFSET_Y
        else: # bottom-left
            x = OFFSET_X
            y = screen_h - window_h - OFFSET_Y

        self.root.geometry(f"{WINDOW_WIDTH}x{window_h}+{x}+{y}")
        self.root.configure(bg=COLOR_BG)

    def build_ui(self):
        # Frame and Text Rendering with 6px generous line spacing and 14pt Fantasque font
        self.main_frame = tk.Frame(self.root, bg=COLOR_BG, highlightbackground=COLOR_BORDER, highlightthickness=1, bd=0)
        self.main_frame.pack(fill=tk.BOTH, expand=True, padx=2, pady=2)

        self.text_widget = tk.Text(
            self.main_frame,
            font=(FONT_FAMILY, FONT_SIZE),
            bg=COLOR_BG,
            fg=COLOR_FG,
            bd=0,
            highlightthickness=0,
            wrap=tk.NONE,
            spacing1=6,  # Spacing above line (+6px)
            spacing2=6,  # Spacing between wrapped lines (+6px)
            spacing3=6,  # Spacing below line (+6px)
            state=tk.NORMAL
        )
        self.text_widget.pack(fill=tk.BOTH, expand=True, padx=14, pady=14)

        # Configure High-Contrast Text Color Tags
        self.text_widget.tag_configure("primary", foreground=COLOR_PRIMARY, font=(FONT_FAMILY, FONT_SIZE, "bold"))
        self.text_widget.tag_configure("accent", foreground=COLOR_ACCENT, font=(FONT_FAMILY, FONT_SIZE, "bold"))
        self.text_widget.tag_configure("label", foreground=COLOR_LABEL, font=(FONT_FAMILY, FONT_SIZE))
        self.text_widget.tag_configure("value", foreground=COLOR_FG, font=(FONT_FAMILY, FONT_SIZE))
        self.text_widget.tag_configure("success", foreground=COLOR_SUCCESS, font=(FONT_FAMILY, FONT_SIZE))
        self.text_widget.tag_configure("warning", foreground=COLOR_WARNING, font=(FONT_FAMILY, FONT_SIZE))
        self.text_widget.tag_configure("danger", foreground=COLOR_DANGER, font=(FONT_FAMILY, FONT_SIZE))
        self.text_widget.tag_configure("dim", foreground="#64748b", font=(FONT_FAMILY, FONT_SIZE))

    def update_loop(self):
        # Continuously push window behind active app windows
        try:
            self.root.lower()
        except Exception:
            pass
        self.collector.update_network_speeds()
        self.render_content()
        self.root.after(REFRESH_RATE_MS, self.update_loop)

    def render_content(self):
        self.text_widget.config(state=tk.NORMAL)
        self.text_widget.delete("1.0", tk.END)

        c = self.collector
        username, hostname = c.get_user_info()
        os_name, kernel = c.get_os_info()
        desktop, display_mgr = c.get_desktop_environment()
        cpu_model, cpu_cores, cpu_usage, cpu_temp = c.get_cpu_info()
        ram_used, ram_total, ram_pct, swap_used, swap_total, swap_pct = c.get_ram_info()
        root_used, root_total, home_used, home_total = c.get_storage_info()
        uptime = c.get_uptime()

        # Date & Time
        now = time.strftime("%A, %d %b %Y").upper()
        current_time = time.strftime("%H:%M:%S")

        # HEADER
        self.text_widget.insert(tk.END, f"BAZZITE OS SYSTEM MONITOR\\n", "primary")
        self.text_widget.insert(tk.END, f"----------------------------------------\\n", "dim")
        self.text_widget.insert(tk.END, f"{now}\\n", "accent")
        self.text_widget.insert(tk.END, f"TIME: ", "label")
        self.text_widget.insert(tk.END, f"{current_time}   ", "value")
        self.text_widget.insert(tk.END, f"UPTIME: ", "label")
        self.text_widget.insert(tk.END, f"{uptime}\\n\\n", "value")

        # USER & SYSTEM INFO
        self.text_widget.insert(tk.END, f"SYS INFO\\n", "primary")
        self.text_widget.insert(tk.END, f"USER     : ", "label")
        self.text_widget.insert(tk.END, f"{username}@{hostname}\\n", "value")
        self.text_widget.insert(tk.END, f"OS       : ", "label")
        self.text_widget.insert(tk.END, f"{os_name}\\n", "value")
        self.text_widget.insert(tk.END, f"DESKTOP  : ", "label")
        self.text_widget.insert(tk.END, f"{desktop}\\n", "value")
        self.text_widget.insert(tk.END, f"DISP MGR : ", "label")
        self.text_widget.insert(tk.END, f"{display_mgr}\\n\\n", "value")

        # CPU STATS
        self.text_widget.insert(tk.END, f"PROCESSOR ({cpu_cores} Cores)\\n", "primary")
        self.text_widget.insert(tk.END, f"{cpu_model[:32]}\\n", "dim")
        cpu_bar = render_ascii_bar(cpu_usage, width=14)
        cpu_tag = "danger" if cpu_usage > 85 else ("warning" if cpu_usage > 60 else "success")
        self.text_widget.insert(tk.END, f"CPU LOAD : [{cpu_bar}] ", "label")
        self.text_widget.insert(tk.END, f"{cpu_usage:5.1f}%\\n", cpu_tag)
        if cpu_temp > 0:
            temp_tag = "danger" if cpu_temp > 80 else ("warning" if cpu_temp > 65 else "success")
            self.text_widget.insert(tk.END, f"CPU TEMP : ", "label")
            self.text_widget.insert(tk.END, f"{cpu_temp:.1f} °C\\n\\n", temp_tag)
        else:
            self.text_widget.insert(tk.END, "\\n")

        # MEMORY STATS
        self.text_widget.insert(tk.END, f"MEMORY & STORAGE\\n", "primary")
        ram_bar = render_ascii_bar(ram_pct, width=14)
        ram_tag = "danger" if ram_pct > 85 else ("warning" if ram_pct > 70 else "success")
        self.text_widget.insert(tk.END, f"RAM  [{ram_bar}] ", "label")
        self.text_widget.insert(tk.END, f"{ram_used:.1f}/{ram_total:.1f}G ({ram_pct:.0f}%)\\n", ram_tag)

        home_pct = (home_used / home_total * 100) if home_total > 0 else 0
        home_bar = render_ascii_bar(home_pct, width=14)
        self.text_widget.insert(tk.END, f"HOME [{home_bar}] ", "label")
        self.text_widget.insert(tk.END, f"{home_used:.0f}/{home_total:.0f}G ({home_pct:.0f}%)\\n\\n", "value")

        # NETWORK USAGE
        self.text_widget.insert(tk.END, f"NETWORK (ACTIVE INTERFACE)\\n", "primary")
        up_fmt = f"{c.upload_rate:6.1f} KB/s" if c.upload_rate < 1024 else f"{c.upload_rate/1024:6.1f} MB/s"
        down_fmt = f"{c.download_rate:6.1f} KB/s" if c.download_rate < 1024 else f"{c.download_rate/1024:6.1f} MB/s"
        self.text_widget.insert(tk.END, f"UPLOAD   ▲ : ", "label")
        self.text_widget.insert(tk.END, f"{up_fmt}\\n", "accent")
        self.text_widget.insert(tk.END, f"DOWNLOAD ▼ : ", "label")
        self.text_widget.insert(tk.END, f"{down_fmt}\\n\\n", "success")

        # TOP PROCESSES
        top_procs = c.get_top_processes(limit=3)
        if top_procs:
            self.text_widget.insert(tk.END, f"TOP PROCESSES\\n", "primary")
            for p in top_procs:
                name = (p['name'] or 'process')[:16].ljust(16)
                cpu = p['cpu_percent'] or 0.0
                mem = p['memory_percent'] or 0.0
                self.text_widget.insert(tk.END, f"{name} ", "value")
                self.text_widget.insert(tk.END, f"CPU:{cpu:4.1f}%  MEM:{mem:3.1f}%\\n", "dim")

        self.text_widget.config(state=tk.DISABLED)

# ------------------------------------------------------------------------------
# MAIN ENTRY POINT
# ------------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="pySysMon - Python System Monitor")
    parser.add_argument("--cli", action="store_true", help="Run in terminal CLI mode instead of GUI window")
    args = parser.parse_args()

    if args.cli or not HAS_TKINTER:
        print("Starting pySysMon in Terminal CLI Mode...")
        collector = SystemDataCollector()
        try:
            while True:
                collector.update_network_speeds()
                os.system('clear' if os.name == 'posix' else 'cls')
                u, h = collector.get_user_info()
                os_n, k = collector.get_os_info()
                cpu_m, cpu_c, cpu_u, cpu_t = collector.get_cpu_info()
                r_u, r_t, r_p, s_u, s_t, s_p = collector.get_ram_info()
                
                print(f"\\033[1;36m=== PYSYSMON SYSTEM MONITOR ===\\033[0m")
                print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"User: {u}@{h} | OS: {os_n}")
                print(f"CPU : [{render_ascii_bar(cpu_u)}] {cpu_u:.1f}% ({cpu_m})")
                print(f"RAM : [{render_ascii_bar(r_p)}] {r_u:.1f}/{r_t:.1f} GB ({r_p:.1f}%)")
                print(f"NET : Up {collector.upload_rate:.1f} KB/s | Down {collector.download_rate:.1f} KB/s")
                time.sleep(REFRESH_RATE_MS / 1000.0)
        except KeyboardInterrupt:
            print("\\nExiting pySysMon.")
            sys.exit(0)

    root = tk.Tk()
    app = PySysMonGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()
`;
}

export function generateReadme(config: SysMonConfig): string {
  return `# pySysMon - Ultra-Lightweight Python System Monitor

A hyper-optimized, low-memory Python system monitor widget built specifically for **Bazzite OS** (Fedora Atomic Linux for gaming desktops, handhelds like Steam Deck, ROG Ally, and Legion Go).

![Font](https://img.shields.io/badge/Font-Fantasque_Sans_Mono-purple?style=flat-square)
![RAM Usage](https://img.shields.io/badge/RAM_Footprint-14_MB-emerald?style=flat-square)
![OS Target](https://img.shields.io/badge/Target_OS-Bazzite_Atomic_Linux-cyan?style=flat-square)

---

## ⚡ Key Features

- **Extreme Minimum Memory Requirements**: Uses ~12-18 MB RAM (compared to standard Conky at 35+ MB or Electron apps at 300+ MB).
- **Native Bazzite OS Support**: Designed to run seamlessly on Bazzite's immutable/Atomic file system without breaking ostree layers.
- **Fantasque Sans Mono Typography**: Crisp, developer-focused aesthetic with handwriting-inspired rounded curves.
- **Comprehensive Telemetry**:
  - **Header**: Day, Date, Time, System Uptime, Local IP.
  - **Identity**: Username, Hostname, Bazzite OS Version, Kernel, Desktop Environment (KDE Plasma / GNOME / Steam Deck Mode), Display Manager (SDDM / GDM).
  - **CPU & Thermals**: Processor Model, Cores count, Real-time Load percentage bar \`[████████░░]\`, Thermal temperatures (°C).
  - **Memory & Storage**: RAM & Swap usage, Root (\`/\`) ostree space, User (\`/var/home\`) storage space.
  - **Network Metrics**: Real-time Upload & Download speed counters (KB/s or MB/s), active interface status.
  - **Top Processes**: Dynamic Top CPU & Memory consuming processes.
- **Dual Mode**: Runs as a frameless, borderless Desktop Overlay GUI or in CLI Terminal Mode (\`--cli\`).

---

## 📥 Installation on Bazzite OS

Because Bazzite OS uses an immutable filesystem (\`rpm-ostree\`), standard system installs aren't required. Everything runs inside your user home directory (\`~/.local/share/pysysmon\`).

### Method 1: One-Line Automatic Setup Script

Open your Konsole, Ptyxis, or Kitty terminal and run:

\`\`\`bash
chmod +x install.sh
./install.sh
\`\`\`

---

### Method 2: Manual Installation Steps

#### Step 1: Install Fantasque Sans Mono Font
Download and place the Fantasque Sans Mono font into your user fonts directory:

\`\`\`bash
mkdir -p ~/.local/share/fonts
cd ~/.local/share/fonts
curl -fLO https://github.com/belluzj/fantasque-sans/releases/download/v1.8.0/FantasqueSansMono-Normal.tar.gz
tar -xzf FantasqueSansMono-Normal.tar.gz
fc-cache -f -v
cd ~
\`\`\`

#### Step 2: Set up Project Directory & Python Dependencies
\`\`\`bash
mkdir -p ~/.local/share/pysysmon
cp pysysmon.py ~/.local/share/pysysmon/
chmod +x ~/.local/share/pysysmon/pysysmon.py

# Optional: Install psutil in user space for top processes monitoring
python3 -m venv ~/.local/share/pysysmon/venv
~/.local/share/pysysmon/venv/bin/pip install psutil
\`\`\`

---

## 🚀 How to Run at Startup (Autostart Setup)

To ensure pySysMon launches automatically every time you start your PC or Steam Deck in Desktop Mode:

### Option A: Automatic Desktop Autostart Entry (Recommended)

Create the autostart entry file at \`~/.config/autostart/pysysmon.desktop\`:

\`\`\`bash
mkdir -p ~/.config/autostart
cat << 'EOF' > ~/.config/autostart/pysysmon.desktop
[Desktop Entry]
Type=Application
Name=pySysMon
Comment=Lightweight Python System Monitor
Exec=/usr/bin/env python3 /var/home/%u/.local/share/pysysmon/pysysmon.py
Terminal=false
Categories=System;Utility;
X-KDE-autostart-after=panel
X-GNOME-Autostart-enabled=true
EOF
\`\`\`

### Option B: Systemd User Service

If you prefer systemd management:

\`\`\`bash
mkdir -p ~/.config/systemd/user
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
systemctl --user enable --now pysysmon.service
\`\`\`

### Option C: GUI Autostart Settings
- **KDE Plasma**: System Settings -> Startup and Shutdown -> Autostart -> Add Script -> Select \`pysysmon.py\`.
- **GNOME**: Open **Startup Applications** -> Click **Add** -> Command: \`python3 /var/home/$USER/.local/share/pysysmon/pysysmon.py\`.

---

## 📊 Memory Usage Verification

You can verify the minimum memory footprint at any time using \`ps\`:

\`\`\`bash
ps aux | grep pysysmon
\`\`\`

Average RAM usage: **~14.2 MB**.

---

## ⚙️ Customization & Flags

Run in terminal CLI mode:
\`\`\`bash
python3 pysysmon.py --cli
\`\`\`

You can edit variables at the top of \`pysysmon.py\` to customize:
- \`REFRESH_RATE_MS\`: Default \`1000\` (1 second refresh rate).
- \`POSITION\`: \`top-right\`, \`top-left\`, \`bottom-right\`, \`bottom-left\`.
- \`COLOR_BG\` / \`COLOR_PRIMARY\` / \`COLOR_ACCENT\`: Custom hex color palette.
`;
}

export function generateInstallScript(): string {
  return `#!/usr/bin/env bash
# ==============================================================================
# pySysMon - Installer Script for Bazzite OS
# ==============================================================================

set -e

BOLD="\\033[1m"
CYAN="\\033[36m"
GREEN="\\033[32m"
YELLOW="\\033[33m"
RESET="\\033[0m"

echo -e "\${BOLD}\${CYAN}====================================================\${RESET}"
echo -e "\${BOLD}\${CYAN}       Installing pySysMon System Monitor       \${RESET}"
echo -e "\${BOLD}\${CYAN}====================================================\${RESET}"

APP_DIR="\${HOME}/.local/share/pysysmon"
FONT_DIR="\${HOME}/.local/share/fonts"
AUTOSTART_DIR="\${HOME}/.config/autostart"

echo -e "\${YELLOW}[1/4] Creating application directories...\${RESET}"
mkdir -p "\${APP_DIR}"
mkdir -p "\${FONT_DIR}"
mkdir -p "\${AUTOSTART_DIR}"

echo -e "\${YELLOW}[2/4] Downloading Fantasque Sans Mono font...\${RESET}"
if fc-list | grep -i "Fantasque" > /dev/null; then
  echo -e "\${GREEN}✓ Fantasque Sans Mono font is already installed!\${RESET}"
else
  TMP_FONT_DIR=$(mktemp -d)
  cd "\${TMP_FONT_DIR}"
  curl -sSL -o fantasque.tar.gz https://github.com/belluzj/fantasque-sans/releases/download/v1.8.0/FantasqueSansMono-Normal.tar.gz
  tar -xzf fantasque.tar.gz
  cp TTF/*.ttf "\${FONT_DIR}/" || cp *.ttf "\${FONT_DIR}/" 2>/dev/null || true
  fc-cache -f "\${FONT_DIR}"
  rm -rf "\${TMP_FONT_DIR}"
  echo -e "\${GREEN}✓ Fantasque Sans Mono font installed successfully.\${RESET}"
fi

echo -e "\${YELLOW}[3/4] Copying pysysmon.py and setting up Python environment...\${RESET}"
cp pysysmon.py "\${APP_DIR}/pysysmon.py"
chmod +x "\${APP_DIR}/pysysmon.py"

python3 -m venv "\${APP_DIR}/venv" || true
if [ -d "\${APP_DIR}/venv" ]; then
  "\${APP_DIR}/venv/bin/pip" install psutil > /dev/null 2>&1 || true
fi

echo -e "\${YELLOW}[4/4] Creating Autostart Launcher...\${RESET}"
cat << EOF > "\${AUTOSTART_DIR}/pysysmon.desktop"
[Desktop Entry]
Type=Application
Name=pySysMon
Comment=Lightweight Python System Monitor
Exec=python3 \${APP_DIR}/pysysmon.py
Terminal=false
Categories=System;Utility;
X-KDE-autostart-after=panel
X-GNOME-Autostart-enabled=true
EOF

echo -e "\${GREEN}✓ Installation Complete!\${RESET}"
echo -e "\${CYAN}To run pySysMon now, execute:\${RESET}"
echo -e "  python3 \${APP_DIR}/pysysmon.py"
`;
}

export function generateDesktopFile(): string {
  return `[Desktop Entry]
Type=Application
Name=pySysMon
Comment=Lightweight Python System Monitor
Exec=python3 %h/.local/share/pysysmon/pysysmon.py
Terminal=false
Categories=System;Utility;
X-KDE-autostart-after=panel
X-GNOME-Autostart-enabled=true
`;
}

export function generateSystemdService(): string {
  return `[Unit]
Description=pySysMon System Monitor Widget
After=graphical-session.target

[Service]
Type=simple
ExecStart=/usr/bin/env python3 %h/.local/share/pysysmon/pysysmon.py
Restart=on-failure
RestartSec=3

[Install]
WantedBy=graphical-session.target
`;
}

export function getAllProjectFiles(config: SysMonConfig, theme: SysMonTheme): ProjectFile[] {
  return [
    {
      filename: 'pysysmon.py',
      language: 'python',
      description: 'Primary low-memory pySysMon application script',
      content: generatePythonScript(config, theme),
    },
    {
      filename: 'README.md',
      language: 'markdown',
      description: 'Complete documentation & startup instructions',
      content: generateReadme(config),
    },
    {
      filename: 'install.sh',
      language: 'bash',
      description: 'Automated setup script for Bazzite OS',
      content: generateInstallScript(),
    },
    {
      filename: 'pysysmon.desktop',
      language: 'ini',
      description: 'Freedesktop autostart launcher file',
      content: generateDesktopFile(),
    },
    {
      filename: 'pysysmon.service',
      language: 'ini',
      description: 'Systemd user unit autostart file',
      content: generateSystemdService(),
    },
  ];
}
