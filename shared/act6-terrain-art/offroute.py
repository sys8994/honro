"""Selected near/far-side silhouette support, highlight only existing material.
This never creates a new mass or raises the silhouette. The plate is split at
locally plausible exposed edges; selections intentionally omit the open voids.
"""
from __future__ import annotations
import math,random
SKINS={
 51:('mountain-main','terrace-continuous','rear-west-scar','rear-east-crest','act6-01--r4-wrap-strata'),
 52:('west-watch-and-descent','east-return-buttress','broken-arch-west','r4-west-root','r4-east-root'),
 53:('g00-footing-north','g00-footing-east','g00-footing-west','g20-retained-hall-rear-noncollision','g31-linked-threshold-upper-right'),
 54:('g00-east-spine','g00-west-continuation','g00-mid-contact','g25-deep-halls-noncollision','g33-pillar-underpass-rear-noncollision'),
 55:('ch05-v2-local-native-art',),
 56:('ch06-v5-local-native-art',),
 57:('west-spine-body','edge-spine-body','edge-upper-cap-body','edge-basin-body','slanted-upper-body','middle-body','lower-body'),
 58:('hall-body','west-body','east-body','floor-body','vault-crown-extension-body','east-face-extension-body','hall-facets','west-facets','east-facets','floor-facets'),
 59:('rear-only-nonsolid','painted-coupled-bedrock'),
 60:('rear-only-nonsolid','painted-coupled-bedrock'),
}
def face_area(p):
 return sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(p,p[1:]+p[:1]))/2
def offroute(n,lib,groups,contains,mix):
 for j,name in enumerate(SKINS[n]):
  shapes=lib[name]['visual']; assert not lib[name]['collision']
  q=groups.setdefault(name,[])
  if name in ('ch06-v5-local-native-art','ch05-v2-local-native-art','rear-only-nonsolid','painted-coupled-bedrock'):
   count=13 if n in (59,60) else 18
  else: count=6 if len(shapes)>=6 else 2
  ranked=[]
  for i,s in enumerate(shapes):
   f=s.get('fill')
   if not isinstance(f,str) or len(f)!=7 or not f.startswith('#') or not s.get('points'): continue
   p=[(x['x'],x['y']) for x in s['points']]
   area=face_area(p)
   if abs(area)<(22000 if n in (53,54,56) else 48000):continue
   ranked.append((abs(area),i,f,p,area>0))
  for _,idx,c,p,cw in sorted(ranked,reverse=True)[:count]:
   rng=random.Random(n*8353+idx*19+j*41)
   edges=[]
   minlen=123 if n in (53,54,56) else 160
   for i,(a,b) in enumerate(zip(p,p[1:]+p[:1])):
    dx,dy=b[0]-a[0],b[1]-a[1];length=math.hypot(dx,dy)
    if length>minlen:edges.append((length*(.85+(min(abs(dy)/max(abs(dx),1),2)*.10))*rng.uniform(.35,1.08),i,a,b,length))
   for _,ei,a,b,l in sorted(edges,reverse=True)[:rng.choice((2,2,3))]:
    if not (min(a[0],b[0])<9000 and max(a[0],b[0])>-1600 and min(a[1],b[1])<7800 and max(a[1],b[1])>-1600):continue
    dx,dy=b[0]-a[0],b[1]-a[1]
    nx,ny=(-dy/l,dx/l) if cw else (dy/l,-dx/l)
    k0=rng.uniform(.05,.29); k1=min(.92,k0+rng.uniform(.44,.76)); w=min(rng.uniform(38,120),l*rng.uniform(.12,.31))
    if name.startswith('g25') or n==56:w*=.65
    specs=[
     (0,5),(.18,w*.14),(.48,w*.29),(.75,w*.42),(1,w*.74),
     (.90,w*.80),(.66,w*1.35),(.46,w*1.13),(.29,w*.78),(.12,w*.44)
    ]
    z=[]
    for t,d in specs:
     fraction=k0+(k1-k0)*t
     z.append((round(a[0]+dx*fraction+nx*d,1),round(a[1]+dy*fraction+ny*d,1)))
    probes=[(a[0]+(b[0]-a[0])*k/10,a[1]+(b[1]-a[1])*k/10) for a,b in zip(z,z[1:]+z[:1]) for k in range(11)]
    if abs(face_area(z))<180 or not contains(p,probes):continue
    other=rng.choice(('#c0c0ae','#aaa0a0','#171a26','#bcc9c6','#29343e'))
    color=mix(c,other,rng.uniform(.07,.18))
    q.insert(0,{'id':f'v{n}-outer-{j}-{idx}-{ei}','fill':color,'points':[{'x':x,'y':y} for x,y in z]})
  if not q:del groups[name]
