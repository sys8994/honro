#!/usr/bin/env python3
"""Bake terrain faces, never collision. Each row ties a material treatment to one placed asset and genuine terrain host."""
import json, glob, random, math, sys
from pathlib import Path
from focal import JOIN

# host, art asset, ranges: (from,to, rock family, spacing in WU)
P={
51:[('mountain-main','mountain-main',[(-950,1560,'granite',190),(1760,3210,'granite',165),(3780,5110,'granite',225),(5320,7430,'granite',180)]),('terrace-continuous','lower-walk-supports',[(480,1550,'mica',160),(1730,2970,'mica',155),(3220,5220,'granite',225)])],
52:[('west-watch-and-descent','west-watch-and-descent',[(-180,1260,'slate',160),(1560,2360,'slate',142)]),('east-return-buttress','east-return-buttress',[(4470,5530,'slate',178),(5790,6610,'slate',160)]),('broken-arch-west','broken-arch-west',[(2320,3250,'cut',130)]),('broken-arch-east','broken-arch-east',[(3850,4820,'cut',127)]),('return-lower-crossing','return-lower-crossing',[(1610,5200,'slate',168)])],
53:[('south','g10-south-strata',[(-150,1150,'ash',162),(1480,2880,'ash',176)]),('west','g12-west-strata',[(-100,1070,'ash',145)]),('east','g13-east-strata',[(2120,3230,'ash',148)]),('upper-threshold-footing','approved-upper-door-sill-extension',[(2416,2870,'cut',95)])],
54:[('foothill','g10-foothill-facets',[(-160,930,'ash',150),(1340,2910,'ash',145)]),('mid-contact','g12-mid-facets',[(-80,1090,'cut',128),(1240,2270,'ash',145)]),('east-spine','g11-east-facets',[(2050,3450,'redstone',147)]),('post-contact','g13-inner-facets',[(2030,2930,'cut',120)])],
55:[('west-ring-descent','ch05-v2-local-native-art',[(145,1320,'slate',150)]),('arrival-core-terrace','ch05-v2-local-native-art',[(1440,2820,'cut',145)]),('right-return-rise','ch05-v2-local-native-art',[(4200,5370,'slate',155)]),('east-upper-end','ch05-v2-local-native-art',[(5450,6430,'slate',147)]),('west-lower-branch','ch05-v2-local-native-art',[(737,963,'slate',95)]),('east-lower-branch','ch05-v2-local-native-art',[(5690,6265,'cut',124)])],
56:[('A-upper-veranda','ch06-v5-local-native-art',[(820,1520,'oldcut',133),(1990,3060,'oldcut',152)]),('B-left-broken-balcony','ch06-v5-local-native-art',[(1010,2020,'oldcut',133)]),('B-central-lower-floor','ch06-v5-local-native-art',[(2150,3470,'redstone',152)]),('E-joined-ordinary-floor','ch06-v5-local-native-art',[(3560,5060,'oldcut',150),(5350,6460,'redstone',157)]),('B-01-center-stone-ascent','ch06-v5-local-native-art',[(2550,3490,'redstone',156)]),('A-01-upper-entry','ch06-v5-local-native-art',[(177,696,'redstone',149)]),('C-02-west-shaft-descent','ch06-v5-local-native-art',[(711,1340,'ash',149)])],
57:[('local-lower-07-west','lower-facets',[(-370,1140,'mica',170),(1230,2410,'mica',182),(2520,3470,'wetcut',152),(3690,4550,'mica',166),(4650,5800,'wetcut',151)]),('local-lower-07-east','lower-facets',[(6580,7800,'mica',176)]),('local-lower-07-aperture-roof','middle-facets',[(5910,6490,'wetcut',118)]),('local-lower-07-aperture-footing','lower-facets',[(5900,6529,'mica',145)])],
58:[('local-lower-08-body','floor-facets',[(-500,950,'jade',174),(1020,2040,'jade',187),(2140,3000,'oldcut',180),(3020,3670,'oldcut',122),(3675,4490,'jade',126),(4570,5420,'oldcut',167),(5470,6480,'jade',152),(6580,7710,'jade',181)]),('local-lower-08-east-buttress','east-facets',[(5540,6180,'jade',162),(6320,7160,'jade',163)])],
59:[('finale-cutout-near-body','painted-coupled-bedrock',[(-800,510,'ember',170),(590,1650,'ember',142),(1670,2460,'ember',167),(2545,3400,'wetcut',138),(3460,4400,'wetcut',125),(4520,5350,'ember',165),(5450,6620,'ember',141),(6810,8380,'ember',166)]),('finale-cutout-west-terrace','authored-contact-rim',[(145,960,'ember',130),(970,1680,'ember',129),(1710,2490,'ember',142)])],
60:[('return-cutout-near-body','painted-coupled-bedrock',[(-590,660,'dawn',190),(710,2060,'dawn',170),(2200,3250,'dawn',173),(3430,4620,'wetcut',168),(4740,5570,'dawn',162),(5690,6670,'dawn',163),(6800,7750,'dawn',174)]),('return-cutout-upper-ledges','authored-contact-rim',[(190,1240,'dawn',164),(1380,2640,'dawn',176),(3200,4480,'dawn',170),(4630,5610,'dawn',157)])],
}
# lower fracture, middle mineral, highlight, dark joint. Warm/cool material switches keyed independently to each ART zone.
C={
 'granite':('#34485b','#4e6274','#74838a','#273c4e'),
 'mica':('#485553','#67736a','#85867a','#364748'),
 'slate':('#494254','#665b6a','#8b777d','#3a3447'),
 'cut':('#615869','#7d7078','#a0908b','#4d4354'),
 'ash':('#4b423b','#685a50','#877667','#3b3734'),
 'redstone':('#534549','#745b56','#937464','#463842'),
 'oldcut':('#5d5143','#7b6d59','#9f8d6f','#46433a'),
 'wetcut':('#464e53','#626964','#828173','#373d45'),
 'jade':('#424c48','#58685d','#828876','#343d3c'),
 'ember':('#4f3944','#684c54','#90706a','#3b2f40'),
 'dawn':('#384f60','#546c78','#7d8d90','#2d3f4d')
}

def lines(poly,x):
 vals=[]
 for a,c in zip(poly,poly[1:]+poly[:1]):
  ax,ay=a; bx,by=c
  if min(ax,bx)<=x<max(ax,bx):vals.append(ay+(by-ay)*(x-ax)/(bx-ax))
 return sorted(vals)
def polygon(poly,points):
 return all(any(lo+2<=y<=hi-2 for lo,hi in zip(q[::2],q[1::2])) for x,y in points for q in [lines(poly,x)])
def mix_hex(a,b,k):
 a,b=[tuple(int(v[i:i+2],16) for i in (1,3,5)) for v in (a,b)]
 return '#'+''.join(format(round(x*(1-k)+y*k),'02x') for x,y in zip(a,b))
def face_host(terrain,start,end,step,family,rng,out,zone,stage):
 hues=C[family]; iscut=family in ('cut','oldcut','wetcut')
 # Substrate palette carries across each chapter, including the adjoining mineral and masonry motifs.
 ground={51:'#40546a',52:'#64596e',53:'#594c43',54:'#584d43',55:'#64575d',56:'#634f46',57:'#535b57',58:'#585d51',59:'#624652',60:'#415a6b'}[stage]
 colors=[mix_hex(ground,v,k) for v,k in zip(hues,(.71,.66,.56,.63))]
 def append(label,color,start,w,contour,limit=None):
  xy=[]
  for f,d in contour:
   x=start+f*w
   l=lines(terrain,x)
   if len(l)<2 or l[1]-l[0]<13:return
   if d<0:return
   dep=min(d,(l[1]-l[0]-3)*(limit or .93))
   xy.append((round(x,1),round(l[0]+max(3.5,dep),1)))
  # Reject thin/crossing shapes at bends instead of drawing into the playable sky.
  probes=[]
  for a,b in zip(xy,xy[1:]+xy[:1]):
   probes.extend((a[0]+(b[0]-a[0])*i/12,a[1]+(b[1]-a[1])*i/12) for i in range(13))
  if not polygon(terrain,probes):return
  if abs(sum(x*v-u*y for (x,y),(u,v) in zip(xy,xy[1:]+xy[:1])))<160:return
  out.append({'id':f'{zone}-{label}-{len(out):03d}','fill':color,'points':[{'x':x,'y':y} for x,y in xy]})
 # A few broad beds group smaller grades, tapering to the old bevel and leaving quiet spans.
 # The broad and cross fault faces share an offset so fractures visibly flow through the medium grain.
 x=start+step*rng.uniform(-.12,.65)
 while x+step*.8<end:
  w=min(end-x,step*rng.uniform(2.6,4.5)); x0=x
  x+=w*rng.uniform(.83,1.36)
  phase=rng.uniform(9,55); depth=rng.uniform(84,182); fall=rng.uniform(.00,.28)
  glide=[(0,phase+29),(.12,phase+5),(.27,phase+20),(.47,phase),(.66,phase+15),(.83,phase+32),(1,phase+59),
        (.90,depth+42),(.70-fall,depth+96),(.55-fall,depth+131),(.36-fall/2,depth+103),(.21,depth+34),(.10,depth*.77)]
  append('lithic-bed',mix_hex(colors[0],ground,rng.uniform(.20,.65)),x0,w,glide)
  if w>260:
   append('oblique-fault',colors[3],x0+w*.13,w*.54,[(0,phase+31),(.22,phase+42),(.41,phase+61),(.59,phase+52),(1,phase+83),(.77,phase+110),(.58,phase+96),(.46,phase+112),(.20,phase+78)])
   append('broken-bedding',mix_hex(colors[1],ground,.34),x0+w*.48,w*.48,[(0,phase+40),(.39,phase+23),(.60,phase+32),(1,phase+59),(.80,phase+83),(.62,phase+73),(.34,phase+102)])
  # Some outcrops have no visible small mineral. Where present, relief varies both in width and depth.
  for _ in range(rng.choice((1,2,2,3,4))):
   q=x0+w*rng.uniform(.1,.78); l=min(end-q,w*rng.uniform(.09,.31)); b=rng.uniform(12,97)
   if l<=26:continue
   bias=rng.uniform(-6,22)
   append('exposed-stratum',rng.choice([colors[0],colors[1],colors[1],colors[3]]),q,l,[(0,b+17),(.14,b+7),(.40,b+10),(.61,b+bias),(1,b+16),(.80,b+34),(.57,b+25),(.27,b+39),(.1,b+27)])
   if rng.random()<.53:
    append('arriss-flake',mix_hex(colors[2],ground,rng.uniform(.03,.38)),q+l*.17,l*.70,[(0,b+12),(.24,b+8),(.58,b+13),(1,b+12),(.87,b+21),(.42,b+21),(.15,b+16)])
  if iscut and rng.random()<.72:
   # Isolated collapsed mortar courses, unequal, biased to the bridge and doorway approaches.
   zz=x0+w*rng.uniform(.0,.28)
   for k in range(rng.choice((2,3,3,4))):
    l=min(x0+w-zz,step*rng.uniform(.37,.74))
    if l<24:break
    b=rng.uniform(5,34)+phase*.28
    append('mortar-buried',colors[3],zz,l,[(0,b+15),(.42,b+3),(.79,b+8),(1,b+17),(.91,b+58),(.59,b+62),(.21,b+51),(.12,b+43)])
    append('masonry-split',mix_hex(colors[1],ground,.28),zz+l*.04,l*.86,[(0,b+16),(.23,b+10),(.72,b+9),(1,b+16),(.92,b+48),(.49,b+43),(.24,b+46),(.08,b+36)])
    if rng.random()<.60:append('masonry-edge',colors[2],zz+l*.22,l*.66,[(0,b+16),(.51,b+14),(1,b+13),(.91,b+22),(.40,b+22)])
    zz+=l*rng.uniform(1.08,1.49)
  # Chips lie against, not on top of the exact collision silhouette.
  for _ in range(rng.choice([0,1,2,3])):
   q=x0+w*rng.uniform(.02,.87); l=w*rng.uniform(.027,.10); b=rng.uniform(5.5,34)
   append('rind-spall',colors[rng.choice([0,1,2,3])],q,l,[(0,b+8),(.3,b),(.58,b+3),(1,b+7),(.56,b+17),(.2,b+15)])

if __name__=='__main__':
 src=Path(sys.argv[1]); out=Path(sys.argv[2]);out.parent.mkdir(exist_ok=True,parents=True)
 output={}
 for n,rows in P.items():
  file=next(src.glob(f'act6-qa-chapter-{n}.*'))
  packet=json.loads(file.read_text()); terr={t['id']:[(p['x'],p['y']) for p in t['points']] for t in packet['map']['terrains']}
  lib={a['id']:a for a in packet['library']}; groups={}
  for i,(id,asset,segments) in enumerate(rows):
   assert not lib[asset].get('collision')
   arr=groups.setdefault(asset,[])
   for j,(lo,hi,family,step) in enumerate(segments):
    face_host(terr[id],lo,hi,step,family,random.Random(n*9503+i*113+j*41),arr,f'v{n}-{i}-{j}',n)
  for i,(id,asset,color,dpts) in enumerate(JOIN[n]):
   t=terr[id]; pts=[(x,round(lines(t,x)[0]+dy,1)) for x,dy in dpts]
   probes=[(a[0]+(b[0]-a[0])*k/12,a[1]+(b[1]-a[1])*k/12) for a,b in zip(pts,pts[1:]+pts[:1]) for k in range(13)]
   if polygon(t,probes):
    groups[asset].insert(0,{'id':f'v{n}-authored-strata-{i}','fill':color,'points':[{'x':x,'y':y} for x,y in pts]})
   else: print('SKIP:',n,id,i)
  assert all(groups.values()),(n,[(k,len(v)) for k,v in groups.items()])
  output[n]={'map':packet['map']['id'],'authored':{a:[len(lib[a]['visual']),polys] for a,polys in groups.items()}}
  print(n, [(a,len(v)) for a,v in groups.items()], sum(len(p['points']) for v in groups.values() for p in v))
 out.write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n')
