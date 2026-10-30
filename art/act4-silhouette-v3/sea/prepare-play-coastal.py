import json,subprocess,xml.etree.ElementTree as E
from pathlib import Path
from svgpathtools import parse_path,Line,CubicBezier,QuadraticBezier,Path as SP
import sys
n=int(sys.argv[1]);D=Path(__file__).parent/f'bank{n}'
for side in (sys.argv[2:] or ['left','right']):
 d=D/f'play-{side}';r=E.parse(d/f'bank{n}-play-{side}-source.svg').getroot()
 for p in r.iter():
  for c in list(p):
   if c.tag.endswith('image'):p.remove(c)
 E.ElementTree(r).write(d/'ground-raw.svg');removed=[]
 colors={'path7':'#667984','path6':'#536874','path5':'#435864','path4':'#435864','path3':'#344754','path2':'#344754','path1':'#233443'}
 if n==37:colors['path3']='#435864' #Merge noisy gradient-quantized interior with adjacent soil layer; outer contour protected.
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
 #Extend only artificial bottom closure of darkest deep layer, covering fractional trace export fringes.
 for e in r.iter():
  if e.get('id')=='path1':
   f=lambda q:complex(q.real,q.imag+40 if q.imag>720 else q.imag);segs=[]
   for q in parse_path(e.get('d')):
    if isinstance(q,CubicBezier):segs.append(CubicBezier(f(q.start),f(q.control1),f(q.control2),f(q.end)))
    elif isinstance(q,QuadraticBezier):segs.append(QuadraticBezier(f(q.start),f(q.control),f(q.end)))
    elif isinstance(q,Line):segs.append(Line(f(q.start),f(q.end)))
    else:raise Exception(type(q))
   e.set('d',SP(*segs).d())
 #Bound serialization without splitting compound holes: coordinate quantization <=0.00071sourcepx.
 for e in r.iter():
  if e.tag.endswith('path') and len(e.get('d',''))>55000:
   f=lambda q:complex(round(q.real,3),round(q.imag,3));segs=[]
   for q in parse_path(e.get('d')):
    if isinstance(q,CubicBezier):segs.append(CubicBezier(f(q.start),f(q.control1),f(q.control2),f(q.end)))
    elif isinstance(q,QuadraticBezier):segs.append(QuadraticBezier(f(q.start),f(q.control),f(q.end)))
    elif isinstance(q,Line):segs.append(Line(f(q.start),f(q.end)))
    else:raise Exception(type(q))
   e.set('d',SP(*segs).d())
 E.ElementTree(r).write(d/'ground-master.svg');c={'id':f's{n}-silhouette:play-{side}-source-v5','semanticLayer':'BODY','anchor':{'x':0,'y':0},'foot':{'x':0,'y':0},'bounds':{'x':0,'y':0,'w':2172,'h':724},'transform':[1,0,0,1,0,0],'params':{'source':'concept.png','nativeTrace':'actual Inkscape GUI8colors Smooth Stack Removebackground ON','coordinateQuantization':{'onlyPathsOverChars':55000,'decimals':3,'maxSourceErrorEuclidean':0.000708},'intentionalInteriorCleanup':{'tinySubpathAreaMaxSourcePx2':4,'removed':len(removed),'protectedOuter':'path7'},'sourceResolutionActor92WorldPx':json.load(open(d/'mapping.json'))['actorSourcePixels']}};(d/'config.json').write_text(json.dumps(c));subprocess.run(['python3','tools/vector-production/import-svg.py',str(d/'ground-master.svg'),'--config',str(d/'config.json'),'--output',str(d/'source-asset.json')],check=True)
