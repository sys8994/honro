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
 if 'd' in out:out['d']=out['d'].replace('20-6 811Q','20-6 8 11Q').replace('0-6 -1211Q','0-6 -12 11Q').replace('10-6 -211Q','10-6 -2 11Q')
 if tag(e)=='use':
  linked=node(byid[e.get('href').removeprefix('#')])
  for k,v in e.attrib.items():
   if k=='href':continue
   linked[k]=(v+' '+linked.get(k,'')) if k=='transform' else v
  return linked
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
for name in ['continuous-mountain','earthen-folds','root-gully-exposure','left-basal-exposure','mid-toe-bedrock','shoulder-gap-exposure','shoulder-lower-overlap','lower-left','lower-middle','lower-right','granite-shoulder','entrance-granite','root-bank-rock','ridge-buried-slab','ridge-foreground','half-buried-left','old-pine','entrance-pine','ridge-pine','surface-root-network','shoulder-root-clutch','entry-stone-brush','root-low-shadow-brush','hollow-under-root','shoulder-rock-foot','ridge-granite-occlusion']:
 if name not in byid:continue
 parts[name]=node(byid[name]);parts[name].pop('transform',None)
crowns=[
 'M-28 24L-18 17Q-14 1 4 2L11-7Q26-14 38-5L49-13Q65-25 77-15L87-20Q104-28 120-13L130-17Q145-17 151-3L166-7Q185-8 194 9L207 13 213 24Q196 36 173 29L161 33 146 26Q127 34 111 26L101 30 85 22Q62 31 43 23L30 28 18 22 6 27-8 22-18 28Z',
 'M-23 27L-12 18Q-9 3 8 6L18-5Q35-15 48-5L61-15Q78-21 89-10L104-15Q121-11 126 1L141-2Q157-1 163 12L179 9Q196 15 202 28L213 33 197 41 181 36 167 40 152 31Q132 39 114 30L101 35 88 27Q70 34 53 25L39 30 26 24Q9 31-5 25L-17 31Z',
 'M-26 25L-15 15Q-7 0 6 4L20-8Q38-19 54-7L70-17Q86-28 101-14L114-22Q132-18 137-5L151-9Q169-8 176 5L190 6Q203 13 210 27L194 33 182 28 165 34 150 28 137 32 124 24Q104 33 87 24L73 30 59 23Q39 31 22 23L8 29-4 24-16 31Z'
]
def crown(n):
 if n.get('tag')=='path' and n.get('fill')=='url(#needle-top)':n['d']=crowns[len(n['d'])%3]
 for c in n.get('children',[]):crown(c)
for p in parts.values():crown(p)
# Three separately reviewed rock sources; their original SVG bytes stay intact.
# Prefix definition IDs so their gradients/clips cannot collide with the forest.
import hashlib
imports=[]
for name in ['shelf','shoulder','fan']:
 file=root/'game/art-studies/rock-outcrop-quality'/('rock-'+name+'.svg')
 if not file.exists():continue
 raw=file.read_bytes();svg=E.fromstring(raw);prefix='ferry-'+name+'-'
 def rewrite(n):
  for k,v in list(n.attrib.items()):
   if k=='id':n.set(k,prefix+v)
   elif 'url(#' in v:n.set(k,v.replace('url(#','url(#'+prefix))
  for c in n:rewrite(c)
 rewrite(svg)
 for e in svg.iter():
  if tag(e) in ['linearGradient','radialGradient']:gradients[e.get('id')]={**e.attrib,'type':tag(e),'stops':[c.attrib for c in e]}
  if tag(e)=='clipPath':clips[e.get('id')]=[node(c) for c in e]
 parts['ferry-'+name]={'tag':'g','children':[node(c) for c in svg if tag(c) in ['g','path']]}
 imports.append({'path':str(file.relative_to(root)),'sha256':hashlib.sha256(raw).hexdigest(),'sourceCommit':'2d432127c7c3f16dd8cb748048853601c99fdc37','status':'parent permits preview integration; not final art pass'})
out={'provenance':{'commit':'1935a106fe99620e2a09de93a6cb89d16d3abda8','status':'regression reference; not approved final'},'imports':imports,'gradients':gradients,'clips':clips,'parts':parts}
(root/'shared/assets/environment/vector-campaign-parts.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n')
# Exact Bezier bounds are computed once for SVG objectBoundingBox gradients.
subprocess.run(['node','--input-type=module','-e',"""
import fs from 'node:fs';import {Path2D} from '@napi-rs/canvas';
const file=process.argv[1],data=JSON.parse(fs.readFileSync(file));
function walk(n){if(n.tag==='path')n.bounds=new Path2D(n.d).computeTightBounds();else for(const c of n.children||[])walk(c);}
Object.values(data.parts).forEach(walk);Object.values(data.clips).flat().forEach(walk);
fs.writeFileSync(file,JSON.stringify(data)+'\\n');
""",str(root/'shared/assets/environment/vector-campaign-parts.json')],cwd=root,check=True)
