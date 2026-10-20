"""Selective visual ingredients from the historical, unapproved manual study.
The surrounding map/art authoring is deliberately not imported. Native paths only.
"""
import xml.etree.ElementTree as E,json,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[2]
source=subprocess.check_output(['git','show','1935a106fe99620e2a09de93a6cb89d16d3abda8:game/art-studies/stage1-hybrid-vector-v1/foreground.svg'],cwd=root)
r=E.fromstring(source);tag=lambda x:x.tag.rsplit('}',1)[-1]
byid={e.get('id'):e for e in r.iter() if e.get('id')}
def node(e):
 out={'tag':tag(e),**e.attrib}
 if tag(e)=='use': return node(byid[e.get('href').removeprefix('#')])
 if tag(e)=='g':out['children']=[node(c) for c in e if tag(c) in ['g','path','use']]
 return out
gradients={}
for e in r.iter():
 if tag(e) in ['linearGradient','radialGradient']:
  gradients[e.get('id')]={**e.attrib,'type':tag(e),'stops':[c.attrib for c in e]}
clips={}
for e in r.iter():
 if tag(e)=='clipPath':clips[e.get('id')]=[node(c) for c in e]
parts={}
for name in ['granite-shoulder','entrance-granite','root-bank-rock','ridge-buried-slab','ridge-foreground','half-buried-left','old-pine','entrance-pine','ridge-pine','surface-root-network','shoulder-root-clutch','entry-stone-brush','root-low-shadow-brush','hollow-under-root','shoulder-rock-foot','ridge-granite-occlusion']:
 if name not in byid:continue
 parts[name]=node(byid[name]);parts[name].pop('transform',None)
out={'provenance':{'commit':'1935a106fe99620e2a09de93a6cb89d16d3abda8','status':'regression reference; not approved final'},'gradients':gradients,'clips':clips,'parts':parts}
(root/'shared/assets/environment/vector-campaign-parts.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n')
# Exact Bezier bounds are computed once for SVG objectBoundingBox gradients.
subprocess.run(['node','--input-type=module','-e',"""
import fs from 'node:fs';import {Path2D} from '@napi-rs/canvas';
const file=process.argv[1],data=JSON.parse(fs.readFileSync(file));
function walk(n){if(n.tag==='path')n.bounds=new Path2D(n.d).computeTightBounds();else for(const c of n.children||[])walk(c);}
Object.values(data.parts).forEach(walk);Object.values(data.clips).flat().forEach(walk);
fs.writeFileSync(file,JSON.stringify(data)+'\\n');
""",str(root/'shared/assets/environment/vector-campaign-parts.json')],cwd=root,check=True)
