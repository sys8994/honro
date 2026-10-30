"""Technical geometry/attachment diagrams, never production art."""
import json, pathlib, html
s=json.load(open('tools/act4-pilot/layouts/stage31-estuary-v1.json'))
out=pathlib.Path('_local/reports/act4-pilot/stage31/estuary-graybox')
def floor(f,x):
 for a,b in zip(f['top'],f['top'][1:]):
  if a[0]<=x<=b[0]: return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])
def diagram(name,box):
 x,y,w,h=box;scale=.7 if name!='full' else 2000/w
 a=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w*scale}" height="{h*scale}" viewBox="{x} {y} {w} {h}"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#f8f9fa"/>']
 for z in s['encounterZones']:
  x1,y1,x2,y2=z['bounds'];a +=[f'<rect x="{x1}" y="{y1-150}" width="{x2-x1}" height="{y2-y1+150}" fill="#f1eded" stroke="#ad7474" stroke-dasharray="16 12"/><text x="{x1}" y="{y1-180}" font-size="44">{z["id"]}: 17 foes / spatial gate required</text>']
 for f in s['surfaces']:
  top=f['top'];bottom=f.get('bottom',[[xx,yy+f.get('thickness',14)] for xx,yy in reversed(top)]);pts=' '.join(f'{xx},{yy}' for xx,yy in top+bottom);a +=[f'<polygon points="{pts}" fill="{ "#adb3b8" if f["kind"]=="ground" else "#a7c6cf"}" stroke="#4b555d" stroke-width="3"/>']
  xx,yy=top[len(top)//2];a +=[f'<text x="{xx-120}" y="{yy+90}" font-size="32">{html.escape(f["id"])}</text>']
 for j in s['structuralAttachments']:
  xx,yy=j['x'],j['y'];fy=j['foundationY'];a +=[f'<path d="M {xx} {yy} V {fy}" stroke="#4e6d73" stroke-width="16"/><circle cx="{xx}" cy="{yy}" r="13" fill="#f2c95b" stroke="#6b591e" stroke-width="3"/><path d="M {xx-25} {fy+10} h50" stroke="#4e6d73" stroke-width="6"/>']
 for f,xx in [(s['surfaces'][0],260),(s['surfaces'][1],1450),(s['surfaces'][1],2170),(s['surfaces'][2],3190),(s['surfaces'][4],5050),(s['surfaces'][6],6220)]:
  yy=floor(f,xx);a +=[f'<rect x="{xx-22}" y="{yy-92}" width="44" height="92" rx="15" fill="#4c5c72"/><text x="{xx-65}" y="{yy-112}" font-size="27">92h × 44w</text>']
 a +=['<path d="M 6920 1220 H 6460" stroke="#70939d" stroke-width="12"/><path d="M 6485 1200 L6460 1220 L6485 1240" fill="none" stroke="#70939d" stroke-width="10"/><text x="6460" y="1320" font-size="35">OPEN BOAT APPROACH</text>','<path d="M6410 1115 H6860" stroke="#8c6a3c" stroke-dasharray="25 15" stroke-width="12"/><text x="6410" y="1060" font-size="30">arrival deck (event, not initial platform)</text>',f'<text x="{x+30}" y="{y+60}" font-size="44">31 ESTUARY GRAYBOX — technical; geography / support review only</text>','<text x="90" y="1690" font-size="38">Gray: continuous deposited soil. Blue: only 2 local timber structures. Yellow: fixed joints. Actors: real body scale.</text>','</svg>']
 (out/(name+'.svg')).write_text(''.join(a))
diagram('full',(0,0,7000,1800))
for c in s['cameraViews']:diagram('camera-'+c['id'],(c['x']-c['w']/2,c['y']-c['h']/2,c['w'],c['h']))
