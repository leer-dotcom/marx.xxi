"""Copia los contenidos ya preparados de la app Android a MarxXXI-web/data/.

Uso (desde MarxXXI-web):
    python ../MarxXXI-android/tools/prepare_assets.py   # si cambió algo en app-handoff o txt
    python tools/sync_data.py
"""
import json
import os
import shutil

WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(os.path.dirname(WEB), "MarxXXI-android", "app", "src", "main", "assets")
DST = os.path.join(WEB, "data")

# Copiar encima y borrar solo lo sobrante (sin eliminar carpetas: en Windows/OneDrive
# pueden estar bloqueadas por la sincronización o por el servidor local).
wanted = set()
SKIP = {"fonts"}  # las fuentes del WebView de Android; la web las carga de Google Fonts
for root, dirs, names in os.walk(SRC):
    dirs[:] = [d for d in dirs if d not in SKIP]
    rel = os.path.relpath(root, SRC)
    os.makedirs(os.path.join(DST, rel), exist_ok=True)
    for n in names:
        r = os.path.normpath(os.path.join(rel, n))
        wanted.add(r)
        shutil.copyfile(os.path.join(SRC, r), os.path.join(DST, r))
for root, _, names in os.walk(DST):
    for n in names:
        r = os.path.normpath(os.path.relpath(os.path.join(root, n), DST))
        if r not in wanted and r != "files.json":
            try:
                os.remove(os.path.join(DST, r))
            except OSError:
                print("  aviso: no se pudo borrar data/" + r.replace(os.sep, "/"))

# Sello de compilación: la web lo añade a las rutas de datos (?v=…) para que el navegador
# nunca reutilice un esquema o texto antiguo de su caché.
import datetime
cj = os.path.join(DST, "content.json")
with open(cj, encoding="utf-8") as f:
    lib = json.load(f)
lib["build"] = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
with open(cj, "w", encoding="utf-8", newline="\n") as f:
    json.dump(lib, f, ensure_ascii=False, separators=(",", ":"))

# Lista de archivos para que el service worker pueda precargar (modo sin conexión).
files = []
for root, _, names in os.walk(DST):
    for n in names:
        files.append(os.path.relpath(os.path.join(root, n), WEB).replace(os.sep, "/"))
with open(os.path.join(WEB, "data", "files.json"), "w", encoding="utf-8") as f:
    json.dump(sorted(files), f)
print(len(files), "archivos ->", DST)
