import json,copy,subprocess
from pathlib import Path
import xml.etree.ElementTree as E
D=Path(__file__).parent
for n in [31,37,40]:
 d=D/f'bank{n}';src=d/('ground-source.svg' if n==31 else f'ground{n}-source.svg');r=E.parse(src).getroot()
 for p in r.iter():
  for c in list(p):
   if c.tag.endswith('image'):p.remove(c)
 E.ElementTree(r).write(d/'ground-raw.svg')
 remove=['path1','path2'] if n==31 else ['path1'];colors={'path5':'#667984','path4':'#435864' if n==31 else '#536874','path3':'#233443' if n==31 else '#344754','path2':'#233443'}
 for p in r.iter():
  for c in list(p):
   if c.get('id') in remove:p.remove(c)
  if p.get('id') in colors:p.set('style','fill:'+colors[p.get('id')])
 E.ElementTree(r).write(d/'ground-master.svg');config={'id':f's{n}-silhouette:full-bank-source-v4','semanticLayer':'BODY','anchor':{'x':0,'y':0},'foot':{'x':0,'y':0},'bounds':{'x':0,'y':0,'w':2172,'h':724},'transform':[1,0,0,1,0,0],'params':{'source':'ground-concept.png','nativeTrace':'Inkscape GUI Colors6 Smooth/Stack/Remove background ON; speckles2, corners1, optimize.2','discardedNoisePaths':remove}};(d/'config.json').write_text(json.dumps(config));subprocess.run(['python3','tools/vector-production/import-svg.py',str(d/'ground-master.svg'),'--config',str(d/'config.json'),'--output',str(d/'source-asset.json')],check=True)
 p=json.load(open(d/'provenance.json'));p['nativeTrace']=config['params']['nativeTrace'];p['cleanup']='Remove dark gradient-noise traces, preserve outerpath5 and meaningful strata. Raw/native retained; intentional interior redesign, not lossless.';(d/'provenance.json').write_text(json.dumps(p,indent=2))
