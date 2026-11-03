"""Shipping comparison: immutable RAW vs candidate through identical actual native composition."""
import json,re,importlib.util,sys,copy,hashlib,os
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[2];base=Path(sys.argv[1] if len(sys.argv)>1 else '/workspace/scratch/fff510b4df37/honro-act2-vector-rollout/stage17')
spec=importlib.util.spec_from_file_location('opt',root/'tools/vector-production/optimize-svg.py');o=importlib.util.module_from_spec(spec);spec.loader.exec_module(o)
parts=['outer-v1','west-v2','east-v2'];palette=set()
for part in parts:
 for c in re.findall(r'#[0-9a-fA-F]{6}',(base/part/'authored-raw.svg').read_text()):palette.add(tuple(int(c[i:i+2],16) for i in (1,3,5)))
rows=[]
for part in parts:
 p=base/part;cfg=json.loads((p/'pixel-config.json').read_text());place=json.loads((p/'placement.json').read_text());w,h=Image.open(p/'source.png').size;scale=w/place['width'];hh=__import__('math').ceil(place['height']*scale)
 cfg['originalProtectedPolylines']=copy.deepcopy(cfg['protectedPolylines']);cfg['protectedRoiExpansionSourcePixels']=0
 for line in cfg['protectedPolylines']:
  line['points']=[[x,(y*place['height']/h-place['height']/2)*scale+hh/2] for x,y in line['points']]
 cfg['sourcePalette']=sorted(palette);cfg['shippingComposition']='Actual production Scene, same original world geometry/base, canonicalSolid+contactInset, same original actors/water/far-image layers and source density. Standalone alpha failures remain failed supplementary diagnostics.'
 errors={}
 for factor in [1,2]:
  a=root/os.environ.get('HONRO_STAGE17_RAW_OUT','_local/reports/stage17-raw-composite-opaque')/f'{part}-{factor}x-after.png';b=root/os.environ.get('HONRO_STAGE17_FINAL_OUT','_local/reports/stage17-final-composite-contact')/f'{part}-{factor}x-after.png';assert Image.open(a).size==(w*factor,hh*factor);assert Image.open(b).size==Image.open(a).size
  errors[str(factor)]=o.compare(a,b,factor,cfg);errors[str(factor)]['pass'] &= errors[str(factor)]['changedPixelFraction']<=.01
 row={'part':part,'candidateSvgSha256':hashlib.sha256((p/'candidate-contact.svg').read_bytes()).hexdigest(),'rawSvgSha256':hashlib.sha256((p/'authored-raw.svg').read_bytes()).hexdigest(),'nativeCandidateSha256':hashlib.sha256((p/'native-candidate-contact.json').read_bytes()).hexdigest(),'qualityPass':all(x['pass'] for x in errors.values()),'errors':errors,'width1x':w,'height1x':hh,'config':cfg,'standaloneDiagnostics':'No standalone acceptance claim; measured actual composed production render'};(p/'native-comparison.json').write_text(json.dumps(row,indent=2));rows.append(row);print(part,json.dumps(errors),flush=True)
report={'stage':17,'qualityPass':all(x['qualityPass'] for x in rows),'scope':'Shipping actual canonical native composition only; raw/final physical geometry and layer order identical, no alpha threshold relaxation, no source density reduction','parts':rows};(base/'native-comparison-report.json').write_text(json.dumps(report,indent=2));sys.exit(0 if report['qualityPass'] else 2)
