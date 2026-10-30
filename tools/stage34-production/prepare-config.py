"""Map actual Inkscape source pixels to unchanged world geometry; not art authoring."""
import gzip,json,sys,xml.etree.ElementTree as ET
from pathlib import Path
D=Path('art/stage34-vector-production');s=json.load(gzip.open(D/'official-project.json.gz','rt'))['stages'][0]
for name,tid in [('body','a4-34-land'),('overhang','a4-34-natural-overhang')]:
 sourceName='body-v2' if name=='body' and '--body-v2' in sys.argv else name
 root=ET.parse(D/f'{sourceName}-raw.svg').getroot();vb=list(map(float,root.attrib['viewBox'].split()));m=json.loads((D/f'{name}-mapping.json').read_text());t=next(t for t in s['terrains'] if t['id']==tid);d=' '.join(('M' if i==0 else 'L')+str(q['x'])+' '+str(q['y']) for i,q in enumerate(t['points']))+'Z'
 if name=='body': x,y,w,h=m['x'],m['y'],m['w'],m['h']
 else:
  # Generated output padded the silhouette vertically. Fit content bbox from
  # concept (37,117)..(2012,524) to original terrain bounds. Final exact source
  # clip/backing protects all outer contacts independently of this affine.
  sx=9400/1975;sy=(4206.4248921179615-2440)/(524-117)
  x=-6000-37*sx;y=2440-117*sy;w=2048*sx;h=683*sy
 config={'id':f's34v:{name}','name':'절벽 지반 BODY' if name=='body' else '해식 절벽 돌출부 BODY','semanticLayer':'BODY','category':'rock','bounds':{'x':x,'y':y,'w':w,'h':h},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':5100 if name=='body' else 4000},'transform':[w/vb[2],0,0,h/vb[3],x-vb[0]*w/vb[2],y-vb[1]*h/vb[3]],'bodyClip':[d],'params':{'artRevision':1,'collisionSource':'official:'+tid,'sourceConcept':sourceName+'-concept.png','sourceRaw':sourceName+'-raw.svg','sourceFit':'full source affine, exact original polygon clip; no collision inferred'}}
 (D/f'{sourceName}-config.json').write_text(json.dumps(config,ensure_ascii=False,indent=2))
 # Protect the full silhouette outline in native SVG raster coordinates.
 pts=[[((q['x']-x)/w)*1400,((q['y']-y)/h)*(1400*vb[3]/vb[2])] for q in t['points'] if x<=q['x']<=x+w and y<=q['y']<=y+h]
 opt={'width':1400,'scales':[1,2.1],'protectedPolylines':[{'points':pts,'width':12}], 'protectionMode':'contact','limits':{'protectedChangedPixelFraction':.05}}
 (D/f'{sourceName}-optimize.json').write_text(json.dumps(opt,indent=2))
