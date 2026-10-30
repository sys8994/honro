import json,subprocess,xml.etree.ElementTree as E
from pathlib import Path
from svgpathtools import parse_path
D=Path(__file__).parent
for side in ['left','right']:
 d=D/f'play-{side}';r=E.parse(d/f'bank31-play-{side}-source.svg').getroot()
 for p in r.iter():
  for c in list(p):
   if c.tag.endswith('image'):p.remove(c)
 E.ElementTree(r).write(d/'ground-raw.svg');removed=[]
 colors={'path7':'#667984','path6':'#536874','path5':'#435864','path4':'#435864','path3':'#344754','path2':'#344754','path1':'#233443'}
 for e in r.iter():
  if e.get('id') in colors:
   e.set('style','fill:'+colors[e.get('id')])
   if e.get('id')!='path7':
    subs=parse_path(e.get('d')).continuous_subpaths();kept=[]
    for p in subs:
     try:small=p.isclosed() and abs(p.area())<4
     except:small=False
     if small:removed.append(e.get('id'))
     else:kept.append(p)
    e.set('d',' '.join(p.d() for p in kept))
 E.ElementTree(r).write(d/'ground-master.svg');c={'id':f's31-silhouette:play-{side}-source-v5','semanticLayer':'BODY','anchor':{'x':0,'y':0},'foot':{'x':0,'y':0},'bounds':{'x':0,'y':0,'w':2172,'h':724},'transform':[1,0,0,1,0,0],'params':{'source':'concept.png','nativeTrace':'actual Inkscape GUI8colors Smooth Stack Removebackground ON','intentionalInteriorCleanup':{'tinySubpathAreaMaxSourcePx2':4,'removed':len(removed),'protectedOuter':'path7'},'sourceResolutionActor92WorldPx':92/(4800/2172)}};(d/'config.json').write_text(json.dumps(c));subprocess.run(['python3','tools/vector-production/import-svg.py',str(d/'ground-master.svg'),'--config',str(d/'config.json'),'--output',str(d/'source-asset.json')],check=True)
