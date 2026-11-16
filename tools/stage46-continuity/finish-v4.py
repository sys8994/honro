"""Build a separate v4 runtime asset candidate, preserving v3 alpha and history.
Does not install the candidate; the coordinator controls capture/installation.
"""
from pathlib import Path
from lxml import etree as E
import json,subprocess,hashlib
R=Path(__file__).resolve().parents[2];O=R/'art/stage46-continuity/v4';P=O/'candidate-v4.json'
subprocess.run(['python',str(R/'tools/vector-production/quantize-svg.py'),str(O/'color-optimized.svg'),'--output',str(O/'color-final.svg'),'--grid','.01'],check=True)
subprocess.run(['python',str(R/'tools/vector-production/import-native-clip.py'),str(O/'color-final.svg'),str(O/'alpha-composed-raw.svg'),'--config',str(O/'config.json'),'--output',str(P)],check=True)
a=json.loads(P.read_text());mapping={'#fdfcfc':'#493353','#c69b62':'#63326c','#976162':'#63326c'};counts={};path_lengths=[]
def walk(n):
 if n.get('fill') in mapping:
  old=n['fill'];counts[old]=counts.get(old,0)+1;n['fill']=mapping[old]
 if 'd' in n:path_lengths.append(len(n['d']))
 if 'dParts' in n:path_lengths.extend(map(len,n['dParts']))
 for c in n.get('children',[]):walk(c)
walk(a['vector']['root']);a['params']['silhouetteUnderpaint']=False;a['params']['stage46Candidate']='v4';P.write_text(json.dumps(a,separators=(',',':'))+'\n')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(O/'alpha-composed-raw.svg')==sha(R/'art/stage46-continuity/v3/alpha-composed-raw.svg')
assert max(path_lengths)<=60000 and all(len(d)<=60000 for ds in a['vector']['clips'].values()for d in ds)
(O/'v4-import-report.json').write_text(json.dumps({'candidateSha256':sha(P),'alphaSha256':sha(O/'alpha-composed-raw.svg'),'v3AlphaIdentical':True,'paletteMapping':mapping,'remappedPaths':counts,'colorPaths':len(path_lengths),'maxColorPathCharacters':max(path_lengths),'collision':a.get('collision'),'sourceUnchangedSha256':sha(R/'_local/stage46/source.json'),'terrainUnchangedSha256':sha(R/'shared/data/act5/terrain.mjs'),'status':'Isolated candidate only; production Scene visual approval pending'},indent=2)+'\n')
print(P)
