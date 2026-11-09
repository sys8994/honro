"""Existing-engine source/contact and RAW/final gates, kept separate.
Full source-to-author image equality is deliberately NOT expected below2580.
"""
from pathlib import Path
import json,subprocess,importlib.util,hashlib
base=Path(__file__).resolve().parent;reports=Path('_local/reports/act2-redesign-20261109/ground-body-join/verification');reports.mkdir(parents=True,exist_ok=True);cfg=json.loads((base/'optimization-v2/comparison-config.json').read_text(encoding='utf-8'));contact_cfg={**cfg,'protectionMode':'contact'}
spec=importlib.util.spec_from_file_location('compare','tools/vector-production/optimize-svg.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);rows=[];commands=[]
sources={'source':base.parent/'final-world.asset.json','authoredRaw':base/'optimization-v2/authored-raw.asset.json','final':base/'final.asset.json'}
for scale in cfg['scales']:
 pngs={}
 for label,asset in sources.items():
  png=reports/(label+'-'+str(scale)+'x.png');args=['node','tools/vector-production/render-asset.mjs',str(asset),str(png),str(round(cfg['width']*scale))];p=subprocess.run(args,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=120)
  if p.returncode:raise RuntimeError(p.stderr)
  record=json.loads(p.stdout);assert record['validationErrors']==0;commands.append({'command':args,'result':record});pngs[label]=png
 source=m.compare(pngs['source'],pngs['authoredRaw'],scale,contact_cfg);limits=cfg['limits'];contact_pass=source['protectedRgbMAE255']<=limits['protectedRgbMAE255']and source['protectedSilhouetteMaxOffsetPx']<=limits['protectedPx']and source['protectedChangedPixelFraction']<=limits['protectedChangedPixelFraction'];raw_final=m.compare(pngs['authoredRaw'],pngs['final'],scale,cfg);rows.append({'scale':scale,'sourceToAuthored':source,'sourceWalkContactWithinExistingLimits':contact_pass,'authoredRawToFinal':raw_final})
report={'scope':'Source lower joining is intentional authoring, evaluated separately. Existing RAW-to-final gates unchanged. Source global-equality pass is not claimed.','rows':rows,'finalVectorExactlyAuthoredRaw':json.loads(sources['final'].read_text(encoding='utf-8'))['vector']==json.loads(sources['authoredRaw'].read_text(encoding='utf-8'))['vector'],'commands':commands,'sha256':{k:hashlib.sha256(p.read_bytes()).hexdigest()for k,p in sources.items()},'scene':'Offline commonScene overview/normal/200%/east/portrait observed; not browser, actual input play, performance, saves or deployment.'};(reports/'comparison.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps({'rows':rows,'finalVectorExactlyAuthoredRaw':report['finalVectorExactlyAuthoredRaw']}));assert all(r['sourceWalkContactWithinExistingLimits']and r['authoredRawToFinal']['pass']for r in rows)
