#!/usr/bin/env python3
"""Bake terrain faces, never collision. Each row ties a material treatment to one placed asset and genuine terrain host."""
import json, glob, random, math, sys
from pathlib import Path
import hashlib

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
def face_host(terrain,start,end,step,family,rng,out,zone):
 colors=C[family]; iscut=family in ('cut','oldcut','wetcut')
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
  if not all(a[0]<b[0]+1000 for a,b in zip(xy,xy[1:])):return
  probes=[]
  for a,b in zip(xy,xy[1:]+xy[:1]):
   probes.extend((a[0]+(b[0]-a[0])*i/12,a[1]+(b[1]-a[1])*i/12) for i in range(13))
  if not polygon(terrain,probes):return
  if abs(sum(x*v-u*y for (x,y),(u,v) in zip(xy,xy[1:]+xy[:1])))<160:return
  out.append({'id':f'{zone}-{label}-{len(out):03d}','fill':color,'points':[{'x':x,'y':y} for x,y in xy]})
 x=start
 while x+step*.6<end:
  w=min(end-x,round(step*rng.uniform(.75,1.55))); x0=x; x+=w*rng.uniform(.87,1.23)
  y=rng.uniform(18,52); d=rng.uniform(85,160)
  if not iscut:
   if rng.random()<.86:
    append('bed',colors[0],x0,w,[(0,y+34),(.18,y+14),(.44,y+32),(.63,y+17),(1,y+53),(.78,d+103),(.44,d+rng.uniform(110,210)),(.27,d+52),(.08,d+20)])
   append('split',colors[3],x0+w*.28,w*.62,[(0,y+56),(.30,y+43),(.59,y+64),(1,y+42),(.83,y+86),(.59,y+103),(.32,y+86),(.2,y+125)])
   append('shelf',colors[1],x0,w,[(0,y+40),(.17,y+6),(.41,y+22),(.62,y),(.88,y+12),(1,y+27),(.79,y+58),(.54,y+48),(.48,y+73),(.24,y+59)])
   if rng.random()<.58:
    append('shelf-edge',colors[2],x0+w*.1,w*.35,[(0,y+14),(.27,y+2),(.66,y+10),(1,y+8),(.8,y+23),(.28,y+17)])
  else:
   append('foundation-joint',colors[3],x0,w,[(0,y+21),(.40,y+24),(1,y+19),(.92,y+81),(.70,y+98),(.38,y+71),(.03,y+84)])
   append('cut-block',colors[1],x0+w*.015,w*.88,[(0,y+6),(.24,y+2),(.65,y+9),(.83,y+3),(1,y+16),(.92,y+46),(.64,y+37),(.32,y+48),(.06,y+37)])
   append('broken-arriss',colors[2],x0+w*rng.uniform(.06,.46),w*.28,[(0,y+10),(.66,y+4),(1,y+9),(.83,y+18),(.35,y+17)])
   if rng.random()<.67: append('offset-course',colors[0],x0+w*.20,w*.78,[(0,y+62),(.54,y+50),(.83,y+62),(1,y+52),(.92,y+104),(.32,y+117),(.08,y+104)])
  for _ in range(rng.choice([1,1,2,2,3])):
   q=x0+w*rng.uniform(.10,.78); l=w*rng.uniform(.08,.29); b=rng.uniform(7,24)
   append('spall',colors[rng.choice([0,1,2,3])],q,l,[(0,b+8),(.3,b),(.58,b+3),(1,b+7),(.56,b+17),(.2,b+15)])

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
    face_host(terr[id],lo,hi,step,family,random.Random(n*9503+i*113+j*41),arr,f'v{n}-{i}-{j}')
  assert all(groups.values()),(n,[(k,len(v)) for k,v in groups.items()])
  output[n]={'map':packet['map']['id'],'authored':{a:[len(lib[a]['visual']),polys] for a,polys in groups.items()}}
  print(n, [(a,len(v)) for a,v in groups.items()], sum(len(p['points']) for v in groups.values() for p in v))
 out.write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n')
