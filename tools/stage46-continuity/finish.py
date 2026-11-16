from pathlib import Path
import json,shutil
R=Path(__file__).resolve().parents[2];p=R/'shared/assets/environment/act5/stage46-exterior-body.json';a=json.loads(p.read_text())
def walk(n):
 # Remove generated warm support markings and the hidden white trace matte.
 # Actual walking surfaces/props are exclusively from the canonical source.
 if n.get('fill')=='#fbfafa':n['fill']='#493353'
 if n.get('fill')in['#94605b','#bd9358']:n['fill']='#63326c'
 for c in n.get('children',[]):walk(c)
walk(a['vector']['root']);a['params']['silhouetteUnderpaint']=False;p.write_text(json.dumps(a,separators=(',',':'))+'\n')
shutil.copy(R/'art/stage46-continuity/protection/protected-compact.json',R/'shared/assets/environment/act5/stage46-protected-clips.json')
