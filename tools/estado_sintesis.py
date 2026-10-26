#!/usr/bin/env python3
"""Regenera docs/ESTADO-DE-LA-SINTESIS.md a partir de los JSON de la app.
Uso: python3 tools/estado_sintesis.py [RAIZ_DE_LA_APP]   (por defecto, la carpeta padre de tools/)"""
import json,re,sys,pathlib,datetime
root=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else pathlib.Path(__file__).resolve().parents[1]
mx=json.load(open(root/'data/content.json',encoding='utf-8')); nc=json.load(open(root/'data/nuevo-ciclo/content.json',encoding='utf-8'))
ls=json.load(open(root/'data/library-synthesis.json',encoding='utf-8'))
def vol(s): return re.sub(r'\bTomo\b','Volumen',s)
L=[]; P=L.append
P(f'# Estado de la síntesis (foto fija a {datetime.date.today().strftime("%d-%m-%Y")})\n')
P('Este anexo recoge, en texto llano, el contenido vigente que un análisis de una publicación nueva tiene que tomar como punto de partida: las tesis de cada revista, las tesis comunes de la biblioteca, las conclusiones de cada volumen y número, los conceptos puente y la estructura de los esquemas de colección. Es la «capa superior» que se enmienda (nunca se regenera) cuando sale un número o un volumen nuevo; el método está en `GUIA-ANALISIS-NUEVAS-PUBLICACIONES.md`. Generado por `tools/estado_sintesis.py` a partir de `data/content.json`, `data/nuevo-ciclo/content.json` y `data/library-synthesis.json`; si este anexo y los JSON discrepan, mandan los JSON: vuelve a ejecutar el script tras cada enmienda.\n')
P('## 1. Las dos publicaciones y su arco\n')
nmx=sum(len(v['articles']) for v in mx['volumes']); nnc=sum(len(v['articles']) for v in nc['volumes'])
P(f"### Marx XXI · {len(mx['volumes'])} volúmenes · {nmx} artículos\n")
for p in mx['cross_volume']['intro']: P(vol(p)+'\n')
P('**Arco de la colección.** '+vol(mx['cross_volume']['arc']['caption'])+'\n')
P('| Volumen | Título | Pregunta estratégica / subtítulo | Artículos |\n|---|---|---|---|')
for v in mx['volumes']: P(f"| {v['number']} | {v['title']} | {v['subtitle']} | {len(v['articles'])} |")
P('\n**Mapa transversal.** '+vol(mx['cross_volume']['map']['caption']).replace('Mapa transversal. ','')+'\n')
P(f"### Nuevo Ciclo · {len(nc['volumes'])} números · {nnc} textos\n")
for p in nc['cross_volume']['intro']: P(vol(p)+'\n')
P('**Arco de la colección.** '+nc['cross_volume']['arc']['caption']+'\n')
P('| Número | Mes | Ángulo (subtítulo) | Textos |\n|---|---|---|---|')
for v in nc['volumes']: P(f"| Nuevo Ciclo {v['label']} | {v.get('month','')} | {v['subtitle']} | {len(v['articles'])} |")
P('\n**Mapa transversal.** '+nc['cross_volume']['map']['caption'].replace('Mapa transversal. ','')+'\n')
P('### La biblioteca\n'); P(vol(ls['intro'])+'\n')
P('**Mapa de la biblioteca.** '+ls['map']['caption']+' Fila superior (MARCO): un principio por volumen de Marx XXI; fila inferior (COYUNTURA): la coyuntura en que los números de Nuevo Ciclo lo ponen a prueba; ambas desembocan en la tarea común: partido comunista de masas, continental e internacional, con instituciones propias.\n')
def theses(title,ths):
    P(f'## {title} ({len(ths)})\n')
    for i,t in enumerate(ths,1):
        extra=''.join(f" · *{k}:* {t[k]}" for k in ('added','revised') if t.get(k))
        P(f"**{i}. {t['title']}**  \n{vol(t['text'])}  \n*Dónde:* {vol(t.get('where',''))}{extra}\n")
theses('2. Tesis transversales de Marx XXI',mx['cross_volume']['theses'])
theses('3. Tesis transversales de Nuevo Ciclo',nc['cross_volume']['theses'])
P(f"## 4. Tesis comunes de la biblioteca ({len(ls['theses'])})\n")
P('Cada tesis común se formula en dos tiempos: el **principio** tal como lo enuncian los volúmenes y la **aplicación** tal como la desarrollan los números. El estado distingue las tesis sostenidas por las dos revistas («común») de las que por ahora sólo una desarrolla.\n')
for t in ls['theses']:
    extra=f" · *revisada:* {t['revised']}" if t.get('revised') else ''
    P(f"**{t['number']}. {t['title']}**  \n*Principio (Marx XXI):* {vol(t['principle'])}  \n*Aplicación (Nuevo Ciclo):* {t['application']}  \n*Estado:* {t['status']} · *Alineación:* tesis Marx XXI {t.get('marx_xxi_theses')} · tesis Nuevo Ciclo {t.get('nuevo_ciclo_theses')}{extra}  \n*Dónde (Marx XXI):* {vol(t.get('where_marx_xxi',''))}  \n*Dónde (Nuevo Ciclo):* {t.get('where_nuevo_ciclo','')}\n")
P('## 5. Conclusiones de cada volumen de Marx XXI\n')
for v in mx['volumes']:
    P(f"### Volumen {v['number']} · {v['title']}\n")
    for i,c in enumerate(v['conclusions'],1): P(f"{i}. **{c['title']}** {vol(c['text'])}")
    P('')
P('## 6. Conclusiones de cada número de Nuevo Ciclo\n')
for v in nc['volumes']:
    P(f"### Nuevo Ciclo {v['label']}\n")
    for i,c in enumerate(v['conclusions'],1): P(f"{i}. **{c['title']}** {c['text']}")
    P('')
P(f"## 7. Conceptos puente ({len(ls['bridge_concepts'])})\n")
P('Conceptos presentes en las dos publicaciones; son las junturas reales entre marco y coyuntura. Para cada uno, los artículos que lo definen (ids de `content.json`; índice en §8).\n')
P('| Concepto | Qué une | Marx XXI | Nuevo Ciclo |\n|---|---|---|---|')
for b in ls['bridge_concepts']:
    P(f"| {b['term']}{' (nuevo: '+b['added']+')' if b.get('added') else ''} | {b['note']} | {', '.join(a['article'] for a in b['marx_xxi'])} | {', '.join(a['article'] for a in b['nuevo_ciclo'])} |")
P('\n### Aportes exclusivos de Nuevo Ciclo (candidatos a puente si un volumen futuro los recoge)\n')
P('| Concepto | Artículo | Nota |\n|---|---|---|')
for b in ls['only_nuevo_ciclo']: P(f"| {b['term']} | {b['article']} | {b['note']} |")
P('\n### Aportes exclusivos de Marx XXI (candidatos a puente si un número futuro los recoge)\n')
P('| Concepto | Dónde |\n|---|---|')
for b in ls['only_marx_xxi']: P(f"| {b['term']} | {vol(b['where'])} |")
P('\n## 8. Índice de textos (para citar apoyos)\n')
for pub,c in [('Marx XXI',mx),('Nuevo Ciclo',nc)]:
    P(f'### {pub}\n'); P('| id | Volumen/número | Título | Autor |\n|---|---|---|---|')
    for v in c['volumes']:
        lab=f"Volumen {v['number']}" if pub=='Marx XXI' else f"Nuevo Ciclo {v['label']}"
        for a in v['articles']:
            P(f"| {a['id']} | {lab} | {a['title']} | {a['author']}{' (entrevista a '+a['interviewee']+')' if a.get('interviewee') else ''} |")
    P('')
out=root/'docs/ESTADO-DE-LA-SINTESIS.md'; out.parent.mkdir(exist_ok=True); out.write_text('\n'.join(L),encoding='utf-8'); print(out, len(L),'líneas')
