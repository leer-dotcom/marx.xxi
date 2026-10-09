"""Servidor local para depurar: sin caché (cada recarga trae los archivos nuevos) y abre el navegador.

Uso (desde MarxXXI-web):
    python tools/dev_server.py [puerto] [--no-abrir] [--matar]   # por defecto 8765 y abre el navegador

--matar cierra antes los servidores de Marx XXI de lanzamientos anteriores. Nunca cierra otros programas:
si el puerto está ocupado por otra cosa, se usa el siguiente libre.

En http://localhost el service worker no se registra (solo en https), así que no hay caché offline que estorbe.
Para probar desde el móvil en la misma wifi: http://<IP-de-este-PC>:<puerto>
"""
import functools
import http.server
import os
import socket
import subprocess
import sys
import threading
import time
import webbrowser

WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_PORT = 8765  # poco habitual: no choca con otros proyectos locales (8000, 8080, 3000…)


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json",
        ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".txt": "text/plain; charset=utf-8",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        # solo errores, para no inundar la consola
        if len(args) > 1 and str(args[1])[:1] in "45":
            sys.stderr.write("  %s  %s\n" % (args[1], args[0]))


OURS = r"($_.CommandLine -match 'dev_server\.py') -or ($_.CommandLine -match 'http\.server' -and $_.CommandLine -match 'MarxXXI')"


def powershell(cmd):
    try:
        return subprocess.run(["powershell", "-NoProfile", "-Command", cmd],
                              capture_output=True, text=True, timeout=20).stdout
    except (OSError, subprocess.TimeoutExpired):
        return ""


def kill_previous():
    """Cierra SOLO servidores de este proyecto (dev_server.py o http.server sobre MarxXXI) de lanzamientos
    anteriores. Nunca toca otros programas, aunque ocupen el puerto."""
    if os.name != "nt":
        return
    out = powershell(
        "Get-CimInstance Win32_Process -Filter \"Name LIKE 'python%'\" | "
        f"Where-Object {{ {OURS} }} | ForEach-Object {{ $_.ProcessId }}")
    skip = {os.getpid(), os.getppid()}
    killed = 0
    for pid in out.split():
        if not pid.isdigit() or int(pid) in skip:
            continue
        if subprocess.run(["taskkill", "/F", "/T", "/PID", pid], capture_output=True).returncode == 0:
            print(f"  cerrado servidor anterior de Marx XXI (PID {pid})")
            killed += 1
    if killed:
        time.sleep(0.7)  # dar tiempo a que Windows libere el puerto


def port_busy(port):
    """True si algo responde en el puerto, por IPv4 o por IPv6 (localhost puede ir a ::1)."""
    for family, host in ((socket.AF_INET, "127.0.0.1"), (socket.AF_INET6, "::1")):
        try:
            with socket.socket(family, socket.SOCK_STREAM) as c:
                c.settimeout(0.3)
                if c.connect_ex((host, port)) == 0:
                    return True
        except OSError:
            pass
    return False


def who_uses(port):
    if os.name != "nt":
        return ""
    return powershell(
        f"Get-NetTCPConnection -LocalPort {port} -State Listen -ErrorAction SilentlyContinue | "
        "Select-Object -First 1 | ForEach-Object { (Get-Process -Id $_.OwningProcess).ProcessName }").strip()


def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return None


def main():
    sys.stdout.reconfigure(encoding="utf-8", line_buffering=True)
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    port = int(args[0]) if args else DEFAULT_PORT
    open_browser = "--no-abrir" not in sys.argv
    if "--matar" in sys.argv:
        kill_previous()
    # Si otro programa usa el puerto, no se toca: se busca el siguiente libre.
    wanted = port
    while port_busy(port) and port < wanted + 20:
        name = who_uses(port)
        print(f"  el puerto {port} lo usa otro programa{f' ({name})' if name else ''}: pruebo el {port + 1}")
        port += 1
    handler = functools.partial(NoCacheHandler, directory=WEB)
    try:
        httpd = http.server.ThreadingHTTPServer(("0.0.0.0", port), handler)
    except OSError:
        sys.exit(f"No puedo usar el puerto {port}. Prueba: lanzar.bat {port + 1}")
    # 127.0.0.1 y no "localhost": origen propio, sin compartir caché ni almacenamiento con otras apps locales
    url = f"http://127.0.0.1:{port}/"
    print(f"\nMarx XXI · servidor local\n  En este PC:   {url}")
    ip = lan_ip()
    if ip:
        print(f"  En el móvil:  http://{ip}:{port}/  (misma wifi)")
    print("  Ctrl+C para parar\n")
    if open_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nParado.")


if __name__ == "__main__":
    main()
