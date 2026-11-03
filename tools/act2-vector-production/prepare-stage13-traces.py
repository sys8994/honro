#!/usr/bin/env python3
"""Semantic palette/base-layer selection from actual immutable Inkscape output."""
from pathlib import Path
import json,subprocess,xml.etree.ElementTree as E
from PIL import Image
import sys,gzip
r=Path(sys.argv[1]);repo=Path(__file__).resolve().parents[2]
for name in ['extension-v2','west-v1','middle-v1','east-v1','roof-v2','west-shelves-v1','inner-shelves-v1']:
 p=r/name;local=name in ['west-v1','middle-v1','east-v1'];raw=p/('trace4b' if local or 'shelves' in name else 'trace7')/'raw.svg'
 if raw.exists():tree=E.parse(raw)
 elif (p/'immutable-inkscape-raw.svg.gz').exists():tree=E.ElementTree(E.fromstring(gzip.decompress((p/'immutable-inkscape-raw.svg.gz').read_bytes())))
 else:raise FileNotFoundError(raw)
 # Remove both semantic backing layers for local accents; keep trace contours intact.
 tree=tree;rt=tree.getroot()
 if local:
  rt.remove(list(rt)[0]);rt.remove(list(rt)[0])
 if name=='extension-v2':
  for i,g in enumerate(list(rt)):
   for e in g.iter():
    if e.tag.endswith('path'):e.set('style','fill:'+(['#283e49','#2c424d','#304651','#304651','#304651'][i]))
 E.register_namespace('','http://www.w3.org/2000/svg');tree.write(p/'authored-raw.svg',encoding='utf-8',xml_declaration=True)
 (p/'world.svg').write_bytes((p/'authored-raw.svg').read_bytes())
 c=json.loads((p/'contract.json').read_text());x,y,w,h=c['worldRect'];W,H=Image.open(p/'source.png').size
 if c['bodyTerrainIds']==['act2-floor']:y-=50 if not local else 12
 cfg={'id':'act2-traced:stage13-'+name,'name':'Stage13 '+name,'bounds':{'x':x,'y':y,'w':w,'h':h},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':0},'semanticLayer':'BODY','preserveCompounds':True,'transform':[w/W,0,0,h/H,x,y],'params':{'bodyTerrainIds':c['bodyTerrainIds'],'bodyBaseColor':'#283e49','localMaterial':local}}
 (p/'config.json').write_text(json.dumps(cfg,indent=2));subprocess.run(['python',str(repo/'tools/vector-production/import-svg.py'),str(p/'authored-raw.svg'),'--config',str(p/'config.json'),'--output',str(p/'native-raw.json')],check=True)
