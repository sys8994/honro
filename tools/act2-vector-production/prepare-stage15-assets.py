"""Register native Inkscape geometry; omit edge-touching local components, never invent rocks."""
import json,re,hashlib,gzip,subprocess,sys,xml.etree.ElementTree as E
from pathlib import Path
from PIL import Image
from svgpathtools import parse_path
base=Path(sys.argv[1] if len(sys.argv)>1 else '/workspace/scratch/fff510b4df37/honro-act2-vector-rollout/stage15');stage=json.loads((base/'source/raw-stage.json').read_text())
for name in ['outer-v1','west-flat-v2','east-flat-v2','arches-flat-v2']:
 p=base/name;place=json.loads((p/'placement.json').read_text());w,h=Image.open(p/'source.png').size;r=E.parse(p/('trace4/raw.svg' if name=='outer-v1' else 'trace3/raw.svg' if name=='arches-flat-v2' else 'trace/raw.svg')).getroot();removed=[]
 if name=='outer-v1':
  bright=list(r)[-1];r.remove(bright);removed.append({'layer':'brightest','reason':'Avoid false non-play walk-line; preserve subdued outer strata'})
 if name in ['west-flat-v2','east-flat-v2']:
  for group in list(r):
   i=int(group.get('id').split('-')[-1])
   if i<1:r.remove(group);removed.append({'layer':i,'reason':'Omit dark base to expose continuous outer substrate'});continue
   for path in list(group):
    full=path.get('d');paths=parse_path(full).continuous_subpaths();texts=re.findall(r'[Mm][^Mm]*',full);assert len(paths)==len(texts);keep=[]
    for sub,original in zip(paths,texts):
     x0,x1,y0,y1=sub.bbox()
     if x0<2 or x1>w-2 or y0<2 or y1>h-2:removed.append({'layer':i,'bbox':[x0,y0,x1,y1],'reason':'Edge-touching source component omitted to prevent rectangular material boundary'})
     else:
      # Reset only the initial moveto to its actual absolute point; keep all remaining Inkscape relative geometry unchanged.
      nums=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
      prefix=re.match(r'[Mm]\s*('+nums+r')[ ,]+('+nums+r')',original);assert prefix
      tail=original[prefix.end():];tail=(' l '+tail if original[0]=='m' and re.match(r'\s*[-+0-9.]',tail) else tail)
      keep.append('M'+format(sub[0].start.real,'.15g')+','+format(sub[0].start.imag,'.15g')+tail)
    if keep:path.set('d',' '.join(keep))
    else:group.remove(path)
 E.register_namespace('','http://www.w3.org/2000/svg');E.ElementTree(r).write(p/'authored-raw.svg',encoding='utf-8',xml_declaration=True)
 raw=(p/'authored-raw.svg').read_bytes();(p/'authored-raw.svg.gz').write_bytes(gzip.compress(raw,mtime=0));(p/'extraction.json').write_text(json.dumps({'sourceSha256':hashlib.sha256((p/'source.png').read_bytes()).hexdigest(),'inkscapeRawSha256':hashlib.sha256((p/('trace4/raw.svg' if name=='outer-v1' else 'trace3/raw.svg' if name=='arches-flat-v2' else 'trace/raw.svg')).read_bytes()).hexdigest(),'authoredRawSha256':hashlib.sha256(raw).hexdigest(),'removed':removed,'noNewArtworkGeometry':True},indent=2))
 cfg={'id':'act2-traced:stage15-'+name,'name':'Stage15 '+name,'bounds':{'x':place['x'],'y':place['y'],'w':place['width'],'h':place['height']},'anchor':{'x':0,'y':0},'foot':{'x':place['x'],'y':place['y']+place['height']},'semanticLayer':'BODY','preserveCompounds':True,'transform':[place['width']/w,0,0,place['height']/h,place['x'],place['y']],'params':{'bodyTerrainIds':place['bodyTerrainIds'],'bodyBaseColor':'#283b46'}}
 (p/'config.json').write_text(json.dumps(cfg,indent=2));subprocess.run([sys.executable,'tools/vector-production/import-svg.py',str(p/'authored-raw.svg'),'--config',str(p/'config.json'),'--output',str(p/'native.json')],check=True)
 lines=[]
 for t in stage['terrains']:
  if t['id'] not in place['bodyTerrainIds']:continue
  pts=t['points'];indices=t.get('properties',{}).get('honroWalkEdges')
  if indices is None:indices=range(len(pts))
  for i in indices:
   q,z=pts[i],pts[(i+1)%len(pts)]
   if max(q['x'],z['x'])<place['x'] or min(q['x'],z['x'])>place['x']+place['width']:continue
   lines.append({'points':[[(v['x']-place['x'])*w/place['width'],(v['y']-place['y'])*h/place['height']] for v in [q,z]],'width':12})
 (p/'pixel-config.json').write_text(json.dumps({'width':w,'scales':[1,2],'limits':{'rgbMAE255':.8,'silhouettePx':1.5,'protectedRgbMAE255':1,'protectedPx':.5,'protectedChangedPixelFraction':.05},'protectedPolylines':lines,'protectedRgbQuantizationTolerance255':1},indent=2))
 print(name,len(raw),len(removed))
