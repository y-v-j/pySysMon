#!/usr/bin/env python3
"""
================================================================================
 pySysMon - Lightweight Python System Monitor desktop widget
 Target OS: Bazzite OS (KDE Plasma / GNOME / Steam Deck Handhelds)
 Font: Fantasque Sans Mono Nerd Font
 License: MIT (c) 2026 Yogesh
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
from collections import deque

# Try loading psutil for advanced telemetry, fallback gracefully to pure /proc
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

# Try loading Tkinter for frameless GUI desktop overlay
try:
    import tkinter as tk
    from tkinter import font as tkfont
    HAS_TKINTER = True
except ImportError:
    HAS_TKINTER = False

# ------------------------------------------------------------------------------
# CONFIGURATION & COLOR PALETTE
# ------------------------------------------------------------------------------
# First installed family wins. Nerd Font variants also enable section icons.
FONT_CANDIDATES = ("FantasqueSansM Nerd Font", "FantasqueSansM Nerd Font Mono",
                   "Fantasque Sans Mono", "JetBrainsMono Nerd Font",
                   "DejaVu Sans Mono", "monospace")
FONT_PX = 15                 # Base text size in pixels (other sizes derive from it)
REFRESH_RATE_MS = 1000       # 1.0 second update cycle
HISTORY_LEN = 60             # Samples kept for the CPU / network sparklines
WINDOW_WIDTH = 410
WINDOW_OPACITY = 0.96
POSITION = "top-right"       # top-right, top-left, bottom-right, bottom-left
OFFSET_X = 24
OFFSET_Y = 24

# "Midnight Ink" theme
COLOR_BG = "#191926"          # Window background
COLOR_CARD = "#20202f"        # Section card fill
COLOR_CARD_EDGE = "#2b2b40"   # Section card outline
COLOR_TRACK = "#2c2c42"       # Empty part of progress bars
COLOR_FG = "#e8e8f2"          # Primary text
COLOR_LABEL = "#9a9ab8"       # Labels
COLOR_DIM = "#62627e"         # Subtext
COLOR_PRIMARY = "#7dd3fc"     # Sky blue
COLOR_ACCENT = "#c4b5fd"      # Lavender
COLOR_PINK = "#f9a8d4"        # Rose
COLOR_SUCCESS = "#86efac"     # Mint
COLOR_WARNING = "#fde68a"     # Butter
COLOR_DANGER = "#fca5a5"      # Coral

# ------------------------------------------------------------------------------
# LOW-MEMORY SYSTEM DATA COLLECTOR (Pure Python + /proc Reading)
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
        """Pure /proc/net/dev parser for minimum memory overhead"""
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
        os_name = "Bazzite OS (Fedora Atomic)"
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

        cpu_model = cpu_model.replace("AMD ", "").replace("Intel(R) Core(TM) ", "").replace("Processor", "").strip()

        if HAS_PSUTIL:
            cpu_usage = psutil.cpu_percent()
            cpu_cores = psutil.cpu_count(logical=True) or 4
        else:
            cpu_usage = 0.0
            cpu_cores = os.cpu_count() or 4

        # Thermals
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
            return (mem.used / 1073741824.0, mem.total / 1073741824.0, mem.percent,
                    swap.used / 1073741824.0, swap.total / 1073741824.0, swap.percent)
        else:
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
                return used / 1048576.0, total / 1048576.0, pct, 0, 0, 0
            except Exception:
                return 0, 0, 0, 0, 0, 0

    def get_storage_info(self):
        try:
            # On ostree systems (Bazzite) '/' is a tiny composefs overlay;
            # the real OS disk is mounted at /sysroot
            root_stat = os.statvfs('/sysroot' if os.path.ismount('/sysroot') else '/')
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

# Helper: Render ASCII block meters [████████░░]
def render_ascii_bar(percent, width=14):
    filled = int(round(width * percent / 100.0))
    filled = max(0, min(width, filled))
    return "█" * filled + "░" * (width - filled)

# ------------------------------------------------------------------------------
# EWMH WINDOW HINTS (pure ctypes + libX11, no extra Python packages)
# Keeps the widget below all windows, undecorated, on every virtual desktop,
# and out of the taskbar / pager / Alt+Tab switcher.
# ------------------------------------------------------------------------------
class X11DesktopHints:
    STATES = ("_NET_WM_STATE_BELOW", "_NET_WM_STATE_STICKY",
              "_NET_WM_STATE_SKIP_TASKBAR", "_NET_WM_STATE_SKIP_PAGER",
              "_KDE_NET_WM_STATE_SKIP_SWITCHER")

    def __init__(self, inner_window_id):
        self.inner_window = inner_window_id
        self.window = None
        self.xlib = None
        self.display = None
        try:
            import ctypes
            import ctypes.util
            xlib = ctypes.cdll.LoadLibrary(ctypes.util.find_library("X11") or "libX11.so.6")
            xlib.XOpenDisplay.restype = ctypes.c_void_p
            xlib.XOpenDisplay.argtypes = [ctypes.c_char_p]
            xlib.XInternAtom.restype = ctypes.c_ulong
            xlib.XInternAtom.argtypes = [ctypes.c_void_p, ctypes.c_char_p, ctypes.c_int]
            xlib.XDefaultRootWindow.restype = ctypes.c_ulong
            xlib.XDefaultRootWindow.argtypes = [ctypes.c_void_p]
            xlib.XChangeProperty.argtypes = [ctypes.c_void_p, ctypes.c_ulong, ctypes.c_ulong,
                                             ctypes.c_ulong, ctypes.c_int, ctypes.c_int,
                                             ctypes.c_void_p, ctypes.c_int]
            xlib.XSendEvent.argtypes = [ctypes.c_void_p, ctypes.c_ulong, ctypes.c_int,
                                        ctypes.c_long, ctypes.c_void_p]
            xlib.XFlush.argtypes = [ctypes.c_void_p]
            xlib.XFree.argtypes = [ctypes.c_void_p]
            xlib.XQueryTree.argtypes = [ctypes.c_void_p, ctypes.c_ulong,
                                        ctypes.POINTER(ctypes.c_ulong), ctypes.POINTER(ctypes.c_ulong),
                                        ctypes.POINTER(ctypes.c_void_p), ctypes.POINTER(ctypes.c_uint)]
            display = xlib.XOpenDisplay(None)
            if display:
                self.ctypes, self.xlib, self.display = ctypes, xlib, display
        except Exception:
            pass

    def _atom(self, name):
        return self.xlib.XInternAtom(self.display, name.encode(), 0)

    def _set_long_property(self, prop, prop_type, values):
        arr = (self.ctypes.c_long * len(values))(*values)
        # 32-bit format properties are passed as C longs; 0 = PropModeReplace
        self.xlib.XChangeProperty(self.display, self.window, self._atom(prop),
                                  prop_type, 32, 0, arr, len(values))

    def _find_wrapper(self):
        """Tk's managed toplevel is the parent of the widget's inner window
        (only exists once the window has been mapped)."""
        ct = self.ctypes
        root, parent = ct.c_ulong(), ct.c_ulong()
        children, n = ct.c_void_p(), ct.c_uint()
        if not self.xlib.XQueryTree(self.display, self.inner_window, ct.byref(root),
                                    ct.byref(parent), ct.byref(children), ct.byref(n)):
            return None
        if children:
            self.xlib.XFree(children)
        return parent.value if parent.value and parent.value != root.value else self.inner_window

    def apply(self):
        if not self.display:
            return
        self.window = self._find_wrapper()
        if not self.window:
            return
        ct = self.ctypes
        # Borderless: _MOTIF_WM_HINTS flags=decorations, decorations=0
        self._set_long_property("_MOTIF_WM_HINTS", self._atom("_MOTIF_WM_HINTS"), [2, 0, 0, 0, 0])

        class XClientMessageEvent(ct.Structure):
            _fields_ = [("type", ct.c_int), ("serial", ct.c_ulong), ("send_event", ct.c_int),
                        ("display", ct.c_void_p), ("window", ct.c_ulong),
                        ("message_type", ct.c_ulong), ("format", ct.c_int),
                        ("data", ct.c_long * 5)]

        class XEvent(ct.Union):
            _fields_ = [("xclient", XClientMessageEvent), ("pad", ct.c_long * 24)]

        root = self.xlib.XDefaultRootWindow(self.display)
        net_wm_state = self._atom("_NET_WM_STATE")
        mask = (1 << 20) | (1 << 19)  # SubstructureRedirect | SubstructureNotify
        for state in self.STATES:
            ev = XEvent()
            ev.xclient.type = 33  # ClientMessage
            ev.xclient.window = self.window
            ev.xclient.message_type = net_wm_state
            ev.xclient.format = 32
            ev.xclient.data[0] = 1  # _NET_WM_STATE_ADD
            ev.xclient.data[1] = self._atom(state)
            ev.xclient.data[3] = 1  # source indication: normal application
            self.xlib.XSendEvent(self.display, root, 0, mask, ct.byref(ev))
        self.xlib.XFlush(self.display)

# ------------------------------------------------------------------------------
# TKINTER CANVAS DESKTOP WIDGET
# ------------------------------------------------------------------------------
def mix_color(c1, c2, t):
    """Blend two #rrggbb colors; t=0 -> c1, t=1 -> c2."""
    a = [int(c1[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(c2[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(x + (y - x) * t):02x}" for x, y in zip(a, b))


def level_color(percent, base, warn=70, danger=88):
    if percent >= danger:
        return COLOR_DANGER
    if percent >= warn:
        return COLOR_WARNING
    return base


def format_rate(kbps):
    return f"{kbps:.1f} KB/s" if kbps < 1024 else f"{kbps / 1024:.2f} MB/s"


class PySysMonGUI:
    PAD = 16          # Window edge to card edge
    INSET = 14        # Card edge to content
    GAP = 10          # Space between cards

    def __init__(self, root):
        self.root = root
        self.collector = SystemDataCollector()
        self.cpu_hist = deque([0.0] * HISTORY_LEN, maxlen=HISTORY_LEN)
        self.up_hist = deque([0.0] * HISTORY_LEN, maxlen=HISTORY_LEN)
        self.down_hist = deque([0.0] * HISTORY_LEN, maxlen=HISTORY_LEN)
        self.height = 0

        # Slow-changing info is read once instead of every refresh
        c = self.collector
        self.username, self.hostname = c.get_user_info()
        self.os_name, self.kernel = c.get_os_info()
        self.desktop, self.display_mgr = c.get_desktop_environment()

        self.setup_fonts()
        self.setup_window()
        self.update_loop()

    # -- setup -----------------------------------------------------------------
    def setup_fonts(self):
        installed = set(tkfont.families(self.root))
        family = next((f for f in FONT_CANDIDATES if f in installed), "monospace")
        nerd = "Nerd" in family
        # Negative sizes are pixels, so the layout is independent of Tk scaling
        self.f_clock = tkfont.Font(family=family, size=-int(FONT_PX * 3.2), weight="bold")
        self.f_secs = tkfont.Font(family=family, size=-int(FONT_PX * 1.6))
        self.f_title = tkfont.Font(family=family, size=-FONT_PX, weight="bold")
        self.f_body = tkfont.Font(family=family, size=-FONT_PX)
        self.f_small = tkfont.Font(family=family, size=-(FONT_PX - 2))
        self.f_big = tkfont.Font(family=family, size=-int(FONT_PX * 1.7), weight="bold")
        self.icons = {
            "clock": "", "system": "", "cpu": "", "temp": "",
            "memory": "", "net": "", "up": "", "down": "",
            "procs": "", "user": "",
        } if nerd else {}

    def setup_window(self):
        self.root.title("pySysMon")
        # Keep the window managed by the WM (no overrideredirect): unmanaged
        # windows are stacked above everything by KWin / XWayland. Instead,
        # ask the WM via EWMH hints to keep it below all other windows.
        self.root.withdraw()
        self.root.configure(bg=COLOR_BG)
        try:
            self.root.attributes("-alpha", WINDOW_OPACITY)
        except Exception:
            pass

        self.cv = tk.Canvas(self.root, width=WINDOW_WIDTH, bg=COLOR_BG, bd=0,
                            highlightthickness=1, highlightbackground=COLOR_CARD_EDGE)
        self.cv.pack(fill=tk.BOTH, expand=True)
        self.place_window(600)

        self.root.deiconify()
        self.root.update_idletasks()
        self.wm_hints = X11DesktopHints(self.root.winfo_id())
        self.wm_hints.apply()
        # Re-assert once the WM has finished managing the window
        self.root.after(500, self.wm_hints.apply)

    def place_window(self, height):
        self.height = height
        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()
        x = OFFSET_X if POSITION.endswith("left") else screen_w - WINDOW_WIDTH - OFFSET_X
        y = OFFSET_Y if POSITION.startswith("top") else screen_h - height - OFFSET_Y
        self.root.geometry(f"{WINDOW_WIDTH}x{height}+{x}+{y}")

    # -- drawing primitives ----------------------------------------------------
    def text(self, x, y, s, font, color, anchor="nw"):
        return self.cv.create_text(x, y, text=s, font=font, fill=color, anchor=anchor)

    def fit(self, s, font, max_w):
        """Truncate text with an ellipsis so it fits max_w pixels."""
        if font.measure(s) <= max_w:
            return s
        while s and font.measure(s + "…") > max_w:
            s = s[:-1]
        return s + "…"

    def rrect(self, x1, y1, x2, y2, r, **kw):
        r = max(0, min(r, (x2 - x1) / 2, (y2 - y1) / 2))
        pts = [x1 + r, y1, x2 - r, y1, x2, y1, x2, y1 + r, x2, y2 - r, x2, y2,
               x2 - r, y2, x1 + r, y2, x1, y2, x1, y2 - r, x1, y1 + r, x1, y1]
        return self.cv.create_polygon(pts, smooth=True, splinesteps=10, **kw)

    def bar(self, x1, y, x2, percent, color, h=8):
        self.rrect(x1, y, x2, y + h, h / 2, fill=COLOR_TRACK, outline="")
        w = (x2 - x1) * max(0.0, min(100.0, percent)) / 100.0
        if w >= 2:
            self.rrect(x1, y, x1 + max(w, h), y + h, h / 2, fill=color, outline="")
            # Soft highlight along the top edge for a little depth
            self.cv.create_line(x1 + h / 2, y + 1.5, x1 + max(w, h) - h / 2, y + 1.5,
                                fill=mix_color(color, "#ffffff", 0.35))
        return y + h

    def sparkline(self, x1, y1, x2, y2, values, color, vmax, fill=True):
        n = len(values)
        vmax = max(vmax, 1e-6)
        step = (x2 - x1) / (n - 1)
        pts = []
        for i, v in enumerate(values):
            pts += [x1 + i * step, y2 - (y2 - y1) * min(v, vmax) / vmax]
        if fill:
            self.cv.create_polygon([x1, y2] + pts + [x2, y2], fill=mix_color(COLOR_CARD, color, 0.18),
                                   outline="")
        self.cv.create_line(pts, fill=color, width=1.6, smooth=True)

    def gradient_line(self, x1, x2, y, colors, segments=48):
        seg_w = (x2 - x1) / segments
        for i in range(segments):
            t = i / (segments - 1) * (len(colors) - 1)
            k = min(int(t), len(colors) - 2)
            c = mix_color(colors[k], colors[k + 1], t - k)
            self.cv.create_line(x1 + i * seg_w, y, x1 + (i + 1) * seg_w + 1, y, fill=c, width=2)

    def card(self, y, title, icon, color, body, right=None, right_color=None):
        """Draw a rounded section card; body(y, left, right) draws content and returns new y."""
        x1, x2 = self.PAD, WINDOW_WIDTH - self.PAD
        left, right_x = x1 + self.INSET, x2 - self.INSET
        top = y
        y += 11
        tx = left
        if icon in self.icons:
            self.text(tx, y, self.icons[icon], self.f_title, color)
            tx += 22
        self.text(tx, y, title, self.f_title, color)
        if right:
            self.text(right_x, y + 1, right, self.f_small, right_color or COLOR_LABEL, anchor="ne")
        y = body(y + self.f_title.metrics("linespace") + 8, left, right_x)
        y += 12
        bg = self.rrect(x1, top, x2, y, 12, fill=COLOR_CARD, outline=COLOR_CARD_EDGE)
        # Coloured accent notch on the card's left edge
        notch = self.rrect(x1, top + 12, x1 + 3, top + 12 + self.f_title.metrics("linespace"),
                           1.5, fill=color, outline="")
        self.cv.tag_lower(notch)
        self.cv.tag_lower(bg)
        return y + self.GAP

    # -- main loop ---------------------------------------------------------------
    def update_loop(self):
        c = self.collector
        c.update_network_speeds()
        self.up_hist.append(c.upload_rate)
        self.down_hist.append(c.download_rate)
        self.render()
        self.root.after(REFRESH_RATE_MS, self.update_loop)

    def render(self):
        c = self.collector
        cpu_model, cpu_cores, cpu_usage, cpu_temp = c.get_cpu_info()
        self.cpu_hist.append(cpu_usage)
        ram_used, ram_total, ram_pct, swap_used, swap_total, swap_pct = c.get_ram_info()
        root_used, root_total, home_used, home_total = c.get_storage_info()
        uptime = c.get_uptime()
        top_procs = c.get_top_processes(limit=4)

        self.cv.delete("all")
        W = WINDOW_WIDTH
        y = self.PAD

        # ── HEADER: big clock, date, uptime ───────────────────────────────────
        clock = self.text(self.PAD + 2, y - 4, time.strftime("%H:%M"), self.f_clock, COLOR_FG)
        cx2 = self.cv.bbox(clock)[2]
        clock_bottom = self.cv.bbox(clock)[3]
        self.text(cx2 + 4, clock_bottom - self.f_secs.metrics("linespace") - 6,
                  time.strftime(":%S"), self.f_secs, COLOR_DIM)
        self.text(W - self.PAD, y + 2, time.strftime("%A").upper(), self.f_title, COLOR_ACCENT, "ne")
        self.text(W - self.PAD, y + 24, time.strftime("%d %B %Y"), self.f_small, COLOR_LABEL, "ne")
        up = (self.icons.get("clock", "") + "  up " + uptime).strip()
        self.text(W - self.PAD, y + 44, up, self.f_small, COLOR_PRIMARY, "ne")
        y = clock_bottom + 4

        user = f"{self.icons['user']}  " if "user" in self.icons else ""
        self.text(self.PAD + 2, y, f"{user}{self.username}@{self.hostname}", self.f_small, COLOR_PINK)
        y += self.f_small.metrics("linespace") + 10
        self.gradient_line(self.PAD, W - self.PAD, y, [COLOR_PRIMARY, COLOR_ACCENT, COLOR_PINK])
        y += 14

        # ── SYSTEM ───────────────────────────────────────────────────────────
        def system_body(y, l, r):
            rows = (("OS", self.os_name), ("KERNEL", self.kernel),
                    ("SESSION", f"{self.desktop} · {self.display_mgr}"))
            for label, value in rows:
                self.text(l, y, label, self.f_small, COLOR_DIM)
                self.text(l + 78, y - 1, self.fit(value, self.f_body, r - l - 78), self.f_body, COLOR_FG)
                y += self.f_body.metrics("linespace") + 4
            return y - 4
        y = self.card(y, "SYSTEM", "system", COLOR_PRIMARY, system_body)

        # ── CPU ──────────────────────────────────────────────────────────────
        cpu_color = level_color(cpu_usage, COLOR_ACCENT, 60, 85)
        temp_txt, temp_color = None, None
        if cpu_temp > 0:
            temp_color = COLOR_DANGER if cpu_temp > 80 else (COLOR_WARNING if cpu_temp > 65 else COLOR_SUCCESS)
            temp_txt = (self.icons.get("temp", "") + f" {cpu_temp:.0f}°C").strip()

        def cpu_body(y, l, r):
            self.text(l, y, self.fit(f"{cpu_model} · {cpu_cores} threads", self.f_small, r - l),
                      self.f_small, COLOR_LABEL)
            y += self.f_small.metrics("linespace") + 6
            pct = self.text(l, y, f"{cpu_usage:4.1f}%", self.f_big, cpu_color)
            bx = self.cv.bbox(pct)[2] + 14
            mid = (self.cv.bbox(pct)[1] + self.cv.bbox(pct)[3]) / 2
            self.bar(bx, mid - 4, r, cpu_usage, cpu_color)
            y = self.cv.bbox(pct)[3] + 8
            self.sparkline(l, y, r, y + 38, list(self.cpu_hist), cpu_color, 100)
            return y + 38
        y = self.card(y, "PROCESSOR", "cpu", COLOR_ACCENT, cpu_body, temp_txt, temp_color)

        # ── MEMORY & STORAGE ─────────────────────────────────────────────────
        def mem_body(y, l, r):
            rows = [("RAM", ram_used, ram_total, ram_pct, COLOR_SUCCESS)]
            if swap_total > 0:
                rows.append(("SWAP", swap_used, swap_total, swap_pct, COLOR_PRIMARY))
            root_pct = root_used / root_total * 100 if root_total else 0
            home_pct = home_used / home_total * 100 if home_total else 0
            if abs(root_total - home_total) < 0.01 and abs(root_used - home_used) < 0.01:
                rows.append(("DISK", home_used, home_total, home_pct, COLOR_ACCENT))
            else:
                rows.append(("ROOT  /", root_used, root_total, root_pct, COLOR_ACCENT))
                rows.append(("HOME  ~", home_used, home_total, home_pct, COLOR_PINK))
            for label, used, total, pct, base in rows:
                color = level_color(pct, base)
                self.text(l, y, label, self.f_small, COLOR_LABEL)
                usage = f"{used:.1f} / {total:.1f} GiB"
                self.text(r, y, usage, self.f_small, COLOR_DIM, "ne")
                self.text(r - self.f_small.measure(usage) - 12, y, f"{pct:.0f}%", self.f_small, color, "ne")
                y += self.f_small.metrics("linespace") + 4
                y = self.bar(l, y, r, pct, color, h=7) + 10
            return y - 10
        y = self.card(y, "MEMORY & STORAGE", "memory", COLOR_SUCCESS, mem_body)

        # ── NETWORK ──────────────────────────────────────────────────────────
        def net_body(y, l, r):
            mid = (l + r) / 2
            up_i = self.icons.get("up", "▲")
            down_i = self.icons.get("down", "▼")
            self.text(l, y, f"{up_i}  UP", self.f_small, COLOR_DIM)
            self.text(mid + 6, y, f"{down_i}  DOWN", self.f_small, COLOR_DIM)
            y += self.f_small.metrics("linespace") + 2
            self.text(l, y, format_rate(c.upload_rate), self.f_title, COLOR_PINK)
            self.text(mid + 6, y, format_rate(c.download_rate), self.f_title, COLOR_PRIMARY)
            y += self.f_title.metrics("linespace") + 8
            peak = max(max(self.up_hist), max(self.down_hist), 8.0)
            self.sparkline(l, y, r, y + 34, list(self.down_hist), COLOR_PRIMARY, peak)
            self.sparkline(l, y, r, y + 34, list(self.up_hist), COLOR_PINK, peak, fill=False)
            return y + 34
        y = self.card(y, "NETWORK", "net", COLOR_PRIMARY, net_body,
                      f"peak {format_rate(max(max(self.up_hist), max(self.down_hist)))}", COLOR_DIM)

        # ── TOP PROCESSES ────────────────────────────────────────────────────
        if top_procs:
            def proc_body(y, l, r):
                self.text(r - 64, y, "CPU", self.f_small, COLOR_DIM, "ne")
                self.text(r, y, "MEM", self.f_small, COLOR_DIM, "ne")
                y += self.f_small.metrics("linespace") + 2
                for i, p in enumerate(top_procs):
                    cpu = p['cpu_percent'] or 0.0
                    mem = p['memory_percent'] or 0.0
                    dot = [COLOR_WARNING, COLOR_ACCENT, COLOR_PRIMARY, COLOR_DIM][min(i, 3)]
                    lh = self.f_body.metrics("linespace")
                    self.cv.create_oval(l, y + lh / 2 - 3, l + 6, y + lh / 2 + 3, fill=dot, outline="")
                    self.text(l + 14, y, self.fit(p['name'] or "process", self.f_body, r - l - 150),
                              self.f_body, COLOR_FG)
                    self.text(r - 64, y, f"{cpu:.1f}%", self.f_body, level_color(cpu, COLOR_LABEL, 50, 85), "ne")
                    self.text(r, y, f"{mem:.1f}%", self.f_body, COLOR_LABEL, "ne")
                    y += lh + 3
                return y - 3
            y = self.card(y, "TOP PROCESSES", "procs", COLOR_WARNING, proc_body)

        height = int(y - self.GAP + self.PAD)
        if height != self.height:
            self.place_window(height)

# ------------------------------------------------------------------------------
# MAIN ENTRY POINT
# ------------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="pySysMon - Low-Memory Python System Monitor")
    parser.add_argument("--cli", action="store_true", help="Run in terminal CLI mode instead of Tkinter GUI overlay")
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

                print("\033[1;36m=== PYSYSMON SYSTEM MONITOR ===\033[0m")
                print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"User: {u}@{h} | OS: {os_n}")
                print(f"CPU : [{render_ascii_bar(cpu_u)}] {cpu_u:.1f}% ({cpu_m})")
                print(f"RAM : [{render_ascii_bar(r_p)}] {r_u:.1f}/{r_t:.1f} GB ({r_p:.1f}%)")
                print(f"NET : Up {collector.upload_rate:.1f} KB/s | Down {collector.download_rate:.1f} KB/s")
                time.sleep(REFRESH_RATE_MS / 1000.0)
        except KeyboardInterrupt:
            print("\nExiting pySysMon.")
            sys.exit(0)

    root = tk.Tk()
    app = PySysMonGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()
