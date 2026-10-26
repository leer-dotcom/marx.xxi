import sys, json, subprocess, pathlib, os
src, outdir = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]); outdir.mkdir(parents=True, exist_ok=True)
rows = []
for f in sorted(src.glob('*.svg')):
    r = subprocess.run([sys.executable, str(pathlib.Path(__file__).parent / 'render.py'), str(f), str(outdir / (f.stem + '.png')), '--json'], capture_output=True, text=True)
    try: rows.append(json.loads(r.stdout.strip().splitlines()[-1]))
    except Exception: rows.append({'file': f.name, 'error': r.stderr[-300:]})
json.dump(rows, open(outdir / '_informe.json', 'w'), ensure_ascii=False, indent=1)
for r in rows:
    print(r['file'], r.get('viewBox'), len(r.get('issues', [])), 'problemas' if 'issues' in r else r.get('error'))
