"""Compose editable bedrock variants from the three r25 native rock studies.
No random noise, raster tracing, reflected sheets, or runtime tessellation.
The recipes omit soil caps, grass, identifying pebbles and the shelf pillar.
Shared non-affine control profiles move whole connected faces and their cracks.
"""
from pathlib import Path
import re,copy,xml.etree.ElementTree as E
ROOT=Path(__file__).resolve().parents[2]
ns='{http://www.w3.org/2000/svg}'
sources={name:list(E.parse(ROOT/f'game/art-studies/rock-outcrop-quality/rock-{name}.svg').getroot())[-1] for name in ['shelf','shoulder','fan']}
# Whole stone face groups + their middle-scale fracture faces, no signature flora.
sets={
 'shelf':list(range(1,30))+list(range(44,72)),
 'shoulder':list(range(1,25))+list(range(50,87)),
 'fan':list(range(1,22))+list(range(60,82))+list(range(99,103)),
}
# Per-composition x displacement, bedding height and joint lean profiles.
profiles=[
 ([0,32,-24,18,0],[-18,16,-32,11,-8],[0,16,-21,9]),
 ([0,-24,31,-18,0],[24,-21,13,-28,12],[12,-18,7,24]),
 ([0,19,37,-26,0],[-27,-8,29,-16,18],[-16,9,23,-8]),
 ([0,-35,12,30,0],[17,34,-11,-25,9],[8,25,-17,-4]),
 ([0,26,-34,-14,0],[8,-32,18,33,-16],[-21,13,-4,18]),
 ([0,-17,-29,35,0],[-24,19,31,-9,-30],[19,-11,27,-15]),
 ([0,38,-11,-27,0],[31,-14,-29,22,4],[-9,22,5,-24]),
 ([0,-28,24,13,0],[-13,28,-7,-31,24],[24,-7,-23,12]),
 ([0,12,-38,26,0],[19,-27,35,8,-22],[-12,28,-9,15]),
 ([0,-32,16,39,0],[-31,9,23,-19,16],[17,-24,11,-3]),
 ([0,29,8,-33,0],[12,31,-24,19,-9],[-25,6,19,-13]),
 ([0,-13,36,-22,0],[27,-17,9,-34,21],[6,19,-28,17]),
]
# Mixed lower toes give each source a different structural ending.
toes=[('fan',range(13,22),180,165),('shelf',range(21,30),0,105),('shoulder',range(2,9),420,105),('fan',range(4,13),-80,240),('shelf',range(11,18),150,205),('fan',range(29,35),-90,90),('shoulder',range(15,22),-230,125),('shelf',range(1,8),250,260),('fan',range(13,22),230,115),('shelf',range(18,30),-250,130),('shoulder',range(5,12),360,200),('fan',range(4,13),100,190)]
def lerp(vals,t):
 t=max(0,min(len(vals)-1,t));i=min(len(vals)-2,int(t));return vals[i]+(vals[i+1]-vals[i])*(t-i)
def warp(x,y,k):
 a,b,c=profiles[k];return x+lerp(a,x/180)+lerp(c,(y-160)/165),y+lerp(b,x/180)+(y-320)*lerp(a,x/180)/850
# Normalize commands first so H/V become real two-dimensional vertices.
def mapped(d,k,dx=0,dy=0):
 tokens=re.findall(r'[A-Za-z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?',d);i=0;cmd=None;x=y=0;start=(0,0);out=[]
 while i<len(tokens):
  if tokens[i].isalpha():cmd=tokens[i];i+=1
  upper=cmd.upper();relative=cmd.islower()
  if upper=='Z':out.append('Z');x,y=start;cmd=None;continue
  n={'M':2,'L':2,'H':1,'V':1,'Q':4}[upper];v=list(map(float,tokens[i:i+n]));i+=n
  if upper=='H':v=[v[0]+(x if relative else 0),y];upper='L';relative=False
  if upper=='V':v=[x,v[0]+(y if relative else 0)];upper='L';relative=False
  pairs=[(v[j]+(x if relative else 0),v[j+1]+(y if relative else 0)) for j in range(0,len(v),2)]
  x,y=pairs[-1]
  if upper=='M':start=(x,y);cmd='l' if relative else 'L'
  coords=[warp(px+dx,py+dy,k) for px,py in pairs]
  out.append(upper+' '.join(f'{a:.1f} {b:.1f}' for a,b in coords))
 return ''.join(out)
p=ROOT/'game/art-studies/ferry-clean-scene/native-body.svg';text=p.read_text().split('<!-- native-extension-variants -->')[0].replace('</svg>','')
text+='<!-- native-extension-variants -->\n<defs>\n'
base=E.parse(ROOT/'game/art-studies/rock-outcrop-quality/rock-fan.svg').getroot()
for d in base.find(ns+'defs'):
 e=copy.deepcopy(d);e.set('id','extension-'+e.get('id'));text+=E.tostring(e,encoding='unicode').replace('ns0:','').replace(':ns0','')+'\n'
text+='</defs>\n'
for k in range(12):
 name=['shelf','fan','shoulder','fan','shelf','fan','shoulder','shelf','fan','shoulder','fan','shelf'][k]
 text+=f'<g id="extension-{k}" data-part="ferry-extension-{k}">\n'
 clip_count=0
 def add(src,indices,dx=0,dy=0):
  global text,clip_count
  clip_count+=1;cid=f'extension-edge-{k}-{clip_count}'
  # The r25 studies end at a rectangular sheet boundary. Fractured side/toe
  # masks remove those cuts before pieces are assembled into a larger mass.
  contour='M-15 70H735V215L718 237 725 264 704 290 716 315 697 343 708 366 689 391 701 418 672 431 643 421 615 445 584 433 552 451 520 438 489 455 456 438 422 449 390 431 356 453 323 439 290 457 257 437 224 452 190 433 160 448 126 428 94 442 64 419 34 433 11 410 24 383 3 360 20 334 2 310 18 281 0 259 17 233-9 214Z'
  text+=f'<defs><clipPath id="{cid}"><path d="{mapped(contour,k,dx,dy)}"/></clipPath></defs>\n<g clip-path="url(#{cid})">\n'
  for j in indices:
   e=copy.deepcopy(sources[src][j]);
   if e.tag!=ns+'path' or e.get('fill')=='url(#soil)' or e.get('fill')=='none':continue
   e.set('d',mapped(e.get('d'),k,dx,dy));e.set('fill',e.get('fill').replace('url(#','url(#extension-'))
   text+=E.tostring(e,encoding='unicode').replace('ns0:','').replace(':ns0','')+'\n'
  text+='</g>\n'
 add(name,sets[name])
 # Replace the fan's sparse right-hand rubble with connected shoulder faces.
 if name=='fan':add('shoulder',range(15,22),60,35)
 # Lower toe is a different subset/orientation, not another copy of the source.
 src,ids,dx,dy=toes[k];add(src,ids,dx,dy)
 text+='</g>\n'
text+='</svg>\n';p.write_text(text)
