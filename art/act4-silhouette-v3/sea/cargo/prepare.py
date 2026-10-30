from pathlib import Path
import xml.etree.ElementTree as E,json,subprocess,copy,hashlib,re
from svgpathtools import parse_path
D=Path(__file__).parent;r=E.parse(D/'cargo-source.svg');root=r.getroot()
for p in root.iter():
 for c in list(p):
  if c.tag.endswith('image'):p.remove(c)
r.write(D/'raw.svg')
# Adjacent nearly identical shading plane merged into underlying stacked plane;
# preserve the native silhouette, structural seams, ties and battens unchanged.
removed=[]
for p in root.iter():
 for c in list(p):
  if c.tag.endswith('path') and c.get('id')=='path5': removed.append({'id':c.get('id'),'chars':len(c.get('d')),'reason':'#585e60 near-duplicate of underlying #5b6062; noisy gradient quantization plane, not silhouette or structural seams'});p.remove(c)
for e in root.iter():
 if e.tag.endswith('path'):
  e.set('d',re.sub(r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?',lambda m:format(round(float(m.group()),3),'.12g'),e.get('d')))
r.write(D/'master.svg')
config={'id':'a4-silhouette:quay-cargo-v1','semanticLayer':'PROP','scaleRange':[.6,1],'backgroundRange':[.6,1],'anchor':{'x':0,'y':0},'foot':{'x':0,'y':0},'bounds':{'x':-195,'y':-160,'w':399,'h':174},'transform':[.20066,0,0,.2302,-188.6,-167.48],'params':{'source':'concept.png','nativeTrace':'Actual Inkscape Colors8 Smooth/Stack/removeBG,speckles2,corners1,optimize.2;7 paths','visualOnly':True}}
# Native bounds42.886..1856.907 x110.708..727.519 -> left-180/right184 top-142/foot0.
sx=364/(1856.907-42.886);sy=142/(727.519-110.708);config['transform']=[sx,0,0,sy,-180-sx*42.886,-sy*727.519]
(D/'config.json').write_text(json.dumps(config));subprocess.run(['python3','tools/vector-production/import-svg.py',str(D/'master.svg'),'--config',str(D/'config.json'),'--output',str(D/'asset.json')],check=True)
a=json.load(open(D/'asset.json'));a['name']='새벽 나루의 낮은 화물상자와 짐자루';a['category']='architecture';a['environmentRole']='architecture';a['collision']=[];a['tags']=['act4-only','visual-only','native-inkscape'];a['params'].update(replaces='stage30:ferry-quay-cargo onlyAct4instances',preserved='instance x/y/scale/layer/support and collision[] unchanged; Stage30 original untouched');(D/'asset.json').write_text(json.dumps(a,separators=(',',':'),ensure_ascii=False));(D/'optimization.json').write_text(json.dumps({'removedShadingPlanes':removed,'protected':'native outer silhouette and remaining full structural paths; numeric3decimal quantization max0.000708sourcepx, below0.000164localworld; no contour deletion','nativeSHA256':hashlib.sha256((D/'cargo-source.svg').read_bytes()).hexdigest(),'generatedSource':'exec-baeaf1ef-49ec-4c54-b8f3-3cd8a73874ac.png','transform':config['transform']},indent=2))
