import json,subprocess,xml.etree.ElementTree as E
from pathlib import Path
D=Path(__file__).parent
for n in [31,37,40]:
 d=D/f'wood{n}';r=E.parse(d/f'wood{n}-source.svg').getroot()
 for p in r.iter():
  for c in list(p):
   if c.tag.endswith('image'):p.remove(c)
 E.ElementTree(r).write(d/'wood-raw.svg');E.ElementTree(r).write(d/'wood-master.svg');config={'id':f's{n}-silhouette:wood-source-v4','semanticLayer':'SURFACE','anchor':{'x':0,'y':0},'foot':{'x':0,'y':0},'bounds':{'x':0,'y':0,'w':2172,'h':724},'transform':[1,0,0,1,0,0],'params':{'source':'concept.png','nativeTrace':'actual Inkscape GUI8color Smooth Stack Remove background ON, cave worker trace; no collision edits'}};(d/'config.json').write_text(json.dumps(config));subprocess.run(['python3','tools/vector-production/import-svg.py',str(d/'wood-master.svg'),'--config',str(d/'config.json'),'--output',str(d/'source-asset.json')],check=True)
