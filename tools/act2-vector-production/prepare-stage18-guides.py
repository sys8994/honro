import json,subprocess
from pathlib import Path
B=Path('/workspace/scratch/fff510b4df37/honro-act2-vector-rollout/stage18');s=json.loads((B/'source/raw-stage.json').read_text());static=[t for t in s['terrains'] if t.get('properties',{}).get('surfaceKind')=='cave' and not any(t.get('properties',{}).get(k) for k in ['honroBellMoving','honroBellBody','honroBellRelease','honroMeleeTarget'])]
parts=[('domain-v1',-6000,-2000,25600,16000,['act2-floor','cave-roof']),('west-v1',800,2900,5400,4500,[t['id']for t in static if t['id'].startswith('sb-') and max(q['x']for q in t['points'])<6500]),('east-v1',7200,3000,5600,4600,[t['id']for t in static if t['id'].startswith('sb-') and min(q['x']for q in t['points'])>7000]),('floor-v1',-500,5200,14600,4400,['act2-floor'])]
for name,x,y,w,h,ids in parts:
 p=B/name;p.mkdir(parents=True,exist_ok=True);(p/'placement.json').write_text(json.dumps(dict(x=x,y=y,width=w,height=h,bodyTerrainIds=ids),indent=2));width=1536;height=round(width*h/w);svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="{x} {y} {w} {h}">'
 for t in static:
  if t['id']in ids:svg+='<polygon fill="#344953" points="'+' '.join(f'{q["x"]},{q["y"]}'for q in t['points'])+'"/>'
 svg+='</svg>';(p/'guide.svg').write_text(svg);subprocess.run(['inkscape',str(p/'guide.svg'),'--export-type=png','--export-filename='+str(p/'guide.png')],check=True)
print([(a[0],len(a[-1]))for a in parts])
