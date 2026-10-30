"""Reproduce chosen bounded vectors; invoke real Inkscape, never rewrite raw."""
from pathlib import Path
import os,subprocess,xml.etree.ElementTree as E
D=Path('art/stage39-vector-production');Q=Path('_local/reports/stage39-production/selected-profile');Q.mkdir(parents=True,exist_ok=True)
def run(*args,**kw):subprocess.run(list(args),check=True,**kw)
run('python','tools/stage39-production/clean-body.py')
(Q/'preferences.xml').write_text('<inkscape><group id="options"><group id="simplifythreshold" value=".0003"/></group></inkscape>')
src=D/'body-selective-3.svg';src.write_bytes((D/'body-clean.svg').read_bytes());run('inkscape',str(src),'--batch-process',f'--actions=select-by-id:path4,path3;path-simplify;export-filename:{src.resolve()};export-plain-svg;export-do',env={**os.environ,'INKSCAPE_PROFILE_DIR':str(Q.resolve())})
run('python','tools/vector-production/quantize-svg.py',str(src),'--output',str(D/'body-selected-3.svg'),'--grid','.001')
def preserve(candidate,raw,ids,out):
 r=E.parse(D/candidate);lookup={p.get('id'):p for p in E.parse(D/raw).iter()if p.tag.endswith('path')}
 for parent in r.iter():
  for i,p in enumerate(list(parent)):
   if p.get('id')in ids:parent.remove(p);parent.insert(i,lookup[p.get('id')])
 r.write(D/out,encoding='utf-8',xml_declaration=True)
# Original four cap/contact paths retain exact source numbers; quantizing them
# produced a one-pixel protected alpha change, so even that was rejected.
preserve('body-selected-3.svg','body-clean.svg',{'path11','path10','path9','path8'},'body-contact-preserved.svg')
run('python','tools/vector-production/quantize-svg.py',str(D/'wreck-raw.svg'),'--output',str(D/'wreck-quantized.svg'),'--grid','.001')
run(os.environ.get('HONRO_GEOS_PYTHON','/tmp/honro-vector-geometry-venv/bin/python'),'tools/vector-production/partition-svg.py',str(D/'wreck-quantized.svg'),'--output',str(D/'wreck-bounded.svg'),'--backend','geos','--flatten-tolerance','.01','--polygon-tolerance','.02','--coordinate-grid','.01')
preserve('wreck-bounded.svg','wreck-raw.svg',{'path13','path12'},'wreck-selected.svg')
for name,src in [('body','body-contact-preserved.svg'),('wreck','wreck-selected.svg')]:run('python','tools/vector-production/import-svg.py',str(D/src),'--config',str(D/(name+'-config.json')),'--output',str(D/(name+'-asset.json')))
