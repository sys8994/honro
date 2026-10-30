from pathlib import Path
import xml.etree.ElementTree as E,json,hashlib,subprocess
D=Path(__file__).parent;r=E.parse(D/'wall37-source.svg').getroot()
for p in r.iter():
 for c in list(p):
  if c.tag.endswith('image'):p.remove(c)
E.ElementTree(r).write(D/'wall-raw.svg');E.ElementTree(r).write(D/'wall-master.svg');c={'id':'s37-silhouette:broken-wall-source-v5','semanticLayer':'SURFACE','anchor':{'x':0,'y':0},'foot':{'x':0,'y':0},'bounds':{'x':0,'y':0,'w':2172,'h':724},'transform':[1,0,0,1,0,0],'params':{'source':'concept.png','nativeTrace':'Actual Inkscape Colors8 Smooth/Stack/removeBG,speckles2,corners1,optimize.2; rejected autotrace attempt undone, saved7paths','collisionSource':'a4-37-broken-wall','preservedCollision':True}};(D/'config.json').write_text(json.dumps(c));subprocess.run(['python3','tools/vector-production/import-svg.py',str(D/'wall-master.svg'),'--config',str(D/'config.json'),'--output',str(D/'source-asset.json')],check=True);(D/'provenance.json').write_text(json.dumps({'generatedSource':'exec-50572b94-5137-4af4-8a5d-97fbc8fb4172.png','nativeSVG':'wall37-source.svg','sha256':hashlib.sha256((D/'wall37-source.svg').read_bytes()).hexdigest(),'trace':c['params']['nativeTrace']},indent=2))
