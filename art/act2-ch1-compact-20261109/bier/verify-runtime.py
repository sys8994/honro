"""Existing engine renderer validation/parity for bier only."""
from pathlib import Path
import subprocess,sys,json,importlib.util,hashlib
base=Path(__file__).resolve().parent;runtime=base/(sys.argv[1] if len(sys.argv)>1 else 'runtime-v5');optimized=base/(sys.argv[2] if len(sys.argv)>2 else 'optimized-v5');cfg=json.loads((base/'optimization-config.json').read_text(encoding='utf-8'))
reports=Path('_local/reports/act2-redesign-20261109/bier')/runtime.name;reports.mkdir(parents=True,exist_ok=True)
spec=importlib.util.spec_from_file_location('opt','tools/vector-production/optimize-svg.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
rows=[];native_comparisons=[];logs=[]
def run(args):
 p=subprocess.run(args,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=120);logs.append({'command':args,'exitCode':p.returncode,'stdout':p.stdout,'stderr':p.stderr})
 if p.returncode:raise RuntimeError(p.stderr)
 return json.loads(p.stdout)
for scale in cfg['scales']:
 width=round(cfg['width']*scale);pngs={}
 for label in ['raw','final']:
  png=reports/f'{label}-{scale}x.png';timing=run(['node','tools/vector-production/render-asset.mjs',str(runtime/(label+'.json')),str(png),str(width)]);pngs[label]=png
  if timing['validationErrors']:raise RuntimeError('Existing vector/environment validator rejected asset')
  logs[-1]['timing']=timing
 rows.append({'scale':scale,'width':width,**m.compare(pngs['raw'],pngs['final'],scale,cfg)})
 svg=reports/f'svg-reference-{scale}x.png';run(['node','tools/vector-production/render-svg-target.mjs',str(optimized/'raw-authored.svg'),str(svg),str(width)])
 native_comparisons.append({'scale':scale,'width':width,**m.compare(svg,pngs['raw'],scale,cfg)})
a,b=[json.loads((runtime/(label+'.json')).read_text(encoding='utf-8'))for label in ['raw','final']]
report={'scope':'Existing HonroVectorArt and HonroEnvironment validators and Native Canvas renderer at actual320px, max528px and200%640px asset widths. Not game scene, browser, mobile GPU, normal combat or artwork approval.','engineRawToFinal':rows,'svgReferenceToEngineRaw':native_comparisons,'vectorDataExactlyEqual':a['vector']==b['vector'],'validationErrors':0,'sha256':{label:hashlib.sha256((runtime/(label+'.json')).read_bytes()).hexdigest()for label in ['raw','final']},'commands':logs,'visualReview':'Parent composition review pending; no user approval implied.'}
(reports/'comparison.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:report[k]for k in ['engineRawToFinal','svgReferenceToEngineRaw','vectorDataExactlyEqual','validationErrors']}));sys.exit(0 if all(r['pass']for r in rows) else 2)
