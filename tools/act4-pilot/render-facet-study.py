"""Technical collider/actor-size diagram only. No final artwork."""
import json,pathlib
root=pathlib.Path(__file__).resolve().parents[2];s=json.loads((root/'tools/act4-pilot/layouts/stage31-west-ledge-facet-study.json').read_text());ps=s['top'];cx,cy=s['camera']['center'];z=s['camera']['scale'];tx=640-cx*z;ty=360-cy*z
def at(x):
 for (a,b),(c,d) in zip(ps,ps[1:]):
  if a<=x<=c:return b+(d-b)*(x-a)/(c-a)
bottom=[[2340,3420],[2040,3500],[1720,3470],[1460,3440]]
v='<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#f7f8fa"/><text x="30" y="38" font-size="23">WEST LEDGE — SINGLE SUPPORT FACET STUDY / NOT ART</text><text x="30" y="68" font-size="17">Normal policy zoom 0.7 | actor collision body 44 × 92 world = 30.8 × 64.4 CSS px | physics pending</text>'
v+=f'<g transform="translate({tx},{ty}) scale({z})"><polygon points="'+ ' '.join(f'{x},{y}' for x,y in ps+bottom)+'" fill="#b6bdc4" stroke="#87919b" stroke-width="2"/><polyline points="'+' '.join(f'{x},{y}' for x,y in ps)+'" fill="none" stroke="#26354a" stroke-width="5"/>'
for x,label in [(1570,'landing'),(1800,'bench'),(2115,'crown'),(2245,'departure')]:
 y=at(x);v+=f'<rect x="{x-22}" y="{y-92}" width="44" height="92" fill="#3d826e" fill-opacity=".7" stroke="#245346" stroke-width="2"/><text x="{x-35}" y="{y-112}" font-size="20">{label}</text>'
v+='</g><text x="30" y="680" font-size="16">Gray = technical support depth only, not an approved painted rock silhouette. Endpoint and route identity retained.</text></svg>'
out=root/'_local/reports/act4-pilot/stage31/west-ledge-facet-study';out.mkdir(parents=True,exist_ok=True);(out/'normal.svg').write_text(v);(out/'study.json').write_text(json.dumps(s,indent=2));print(out)
