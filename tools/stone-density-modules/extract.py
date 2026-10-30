#!/usr/bin/env python3
"""Extract authored stone blocks by native Inkscape Boolean intersections."""
import copy,json,os,subprocess,xml.etree.ElementTree as E
from pathlib import Path
N='http://www.w3.org/2000/svg';E.register_namespace('',N)
root=Path('art/vector-stone-modules');src=Path('art/vector-gameplay-density-v2/stone-steps-cleaned-master.svg')
config=json.loads(Path('art/vector-gameplay-density-v2/stone-steps-config.json').read_text());sx,_,_,sy,ox,oy=config['transform']
original=E.parse(src).getroot();paths=[p for p in original.iter() if p.tag==f'{{{N}}}path']
for name,box in [('tread-block',[660,1872,100,52]),('tread-cap',[660,1872,100,26]),('tread-block-b',[760,1836,100,52])]:
 x,y,w,h=box;r=E.Element(f'{{{N}}}svg',{'width':'1733','height':'907','viewBox':'0 0 1733 907','version':'1.1'});actions=[]
 for i,p in enumerate(paths):
  p=copy.deepcopy(p);p.set('id',f'part{i}');r.append(p);E.SubElement(r,f'{{{N}}}rect',{'id':f'crop{i}','x':str((x-ox)/sx),'y':str((y-oy)/sy),'width':str(w/sx),'height':str(h/sy)})
  actions.append(f'select-clear;select-by-id:part{i},crop{i};path-intersection')
 edit=root/(name+'-edit.svg');out=root/(name+'.svg');E.ElementTree(r).write(edit,encoding='utf-8',xml_declaration=True)
 env={**os.environ,'INKSCAPE_PROFILE_DIR':'/tmp/honro-stone-module-profile','XDG_CACHE_HOME':'/tmp/honro-stone-module-cache'}
 subprocess.run(['inkscape',str(edit),'--export-type=svg',f'--export-filename={out}','--actions='+';'.join(actions)+';export-do'],env=env,check=True,capture_output=True)
 c={**config,'id':'density-play:stone-'+name,'name':'돌계단 재사용 '+name,'bounds':dict(zip(['x','y','w','h'],box))};(root/(name+'-config.json')).write_text(json.dumps(c,indent=2))
 subprocess.run(['python3','tools/vector-production/import-svg.py',str(out),'--config',str(root/(name+'-config.json')),'--output',str(root/(name+'-asset.json'))],check=True)
