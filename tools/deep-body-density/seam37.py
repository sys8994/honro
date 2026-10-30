import copy,json,os,subprocess,xml.etree.ElementTree as E
from pathlib import Path
from svgpathtools import parse_path
NS='http://www.w3.org/2000/svg';E.register_namespace('',NS);p=Path('art/stage37-density-seam-v3');c=json.loads((p/'body-config.json').read_text());root=E.parse('art/stage37-density-v2/body-final.svg').getroot();dct={}
for s in parse_path(c['bodyClip'][0]):
 for z in [s.start,s.end]:
  if z.imag<10000:dct[z.real]=min(dct.get(z.real,z.imag),z.imag)
pts=sorted(dct.items());a,_,_,d,tx,ty=c['transform'];world=[(x,y+100)for x,y in pts]+[(pts[-1][0],40000),(pts[0][0],40000)];poly='M'+' L'.join(f'{(x-tx)/a:.8f} {(y-ty)/d:.8f}'for x,y in world)+' Z';original=next(e for e in root.iter()if e.get('id')=='path8');parent=next(e for e in root.iter()if any(x.get('id')=='path6'for x in e));idx=next(i for i,e in enumerate(parent)if e.get('id')=='path6')+1;overlay=copy.deepcopy(original);overlay.set('id','rock-overlap-repair');parent.insert(idx,overlay);parent.insert(idx+1,E.Element('{'+NS+'}path',{'id':'deep-only','d':poly,'style':'fill:#3b4653'}));E.ElementTree(root).write(p/'body-repair-input.svg');subprocess.run(['inkscape',str(p/'body-repair-input.svg'),'--export-plain-svg','--export-type=svg',f'--export-filename={p}/body-repair-master.svg','--actions=select-by-id:rock-overlap-repair,deep-only;path-intersection'],env={**os.environ,'INKSCAPE_PROFILE_DIR':'/tmp/honro-seam37-profile','XDG_CACHE_HOME':'/tmp/honro-seam37-cache'},check=True,stdout=subprocess.DEVNULL);root=E.parse(p/'body-repair-master.svg').getroot()
for e in E.parse('art/stage37-density-depthfade/body-final.svg').getroot():
 if e.get('id','').startswith('mask'):root.append(copy.deepcopy(e))
c['params']['artEdit']='Native Boolean sourceblue path8 reinforcement only below100world andaftersoilbacking paths7/6, beforeoriginalface5/shadow4/base2. Removesoldsoilarc insideblueface whileoriginaltopsoilstack staysunchanged.';(p/'body-config.json').write_text(json.dumps(c,indent=2));E.ElementTree(root).write(p/'body-final.svg');subprocess.run(['python3','tools/vector-production/import-svg.py',str(p/'body-final.svg'),'--config',str(p/'body-config.json'),'--output',str(p/'body-asset.json')],check=True)
