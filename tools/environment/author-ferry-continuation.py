"""Author one continuous dipping bedrock mass, then incise medium-scale faces.
The shared bedding contours are the geometry. r25 face fragments supply only
local erosion vocabulary inside those beds, never independent outcrop silhouettes.
"""
from pathlib import Path
import xml.etree.ElementTree as E,re,math
ROOT=Path(__file__).resolve().parents[2]
X=[-2000,-1250,-530,170,850,1470,2040,2530,2950,3320,3690,4110,4650,5250,5870,6500]
# A single geological strike bends from the western bank into the high eastern
# shoulder. Consecutive contours bound the same material, without gaps or sheets.
BEDS=[
[1020,1030,1050,1070,1090,1080,1010,900,760,650,620,660,700,740,780,820],
[1550,1540,1580,1600,1610,1570,1450,1290,1100,980,940,990,1010,1060,1100,1150],
[1900,1940,1930,1960,1940,1860,1740,1560,1390,1270,1240,1290,1350,1390,1430,1490],
[2280,2250,2300,2310,2260,2160,2010,1820,1670,1570,1540,1600,1660,1730,1800,1860],
[2670,2700,2680,2700,2600,2470,2330,2160,2010,1900,1870,1940,2000,2070,2130,2200],
[3060,3030,3080,3060,2940,2810,2670,2490,2330,2240,2220,2290,2370,2430,2510,2590],
[3440,3480,3450,3440,3320,3170,3010,2830,2680,2580,2580,2630,2710,2800,2880,2960],
[3880,3830,3890,3840,3710,3540,3370,3180,3040,2970,2940,3020,3110,3190,3300,3380],
[4270,4320,4290,4260,4110,3930,3750,3570,3420,3340,3320,3420,3520,3620,3710,3800],
[4800,4800,4770,4750,4600,4400,4240,4040,3920,3840,3830,3940,4050,4160,4280,4400],
]
# Bedding lips: uneven intermediate ledges attached to the same dipping surface.
N=[-12,18,-24,9,-17,26,-8,15,-22,11,-19,23,-10,16,-14]
DEPTH=[43,61,35,55,72,41,64,48,81,56,39,68,46,73,52,63]
def boundary(vals,row):
 out=[]
 for i in range(len(X)-1):
  x,z=X[i:i+2];a,b=vals[i:i+2];d=N[(i+row)%len(N)]
  out.extend([(x,a),(x+(z-x)*.36,a+(b-a)*.36+d),(x+(z-x)*.58,a+(b-a)*.58+d-13),(x+(z-x)*.74,a+(b-a)*.74+8)])
 out.append((X[-1],vals[-1]));return out
lines=[boundary(v,r) for r,v in enumerate(BEDS)]
def dpath(pts):return 'M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in pts)+'Z'
def path(pts,fill):return f'<path fill="{fill}" d="{dpath(pts)}"/>\n'
def at(points,x):
 for i in range(len(points)-1):
  a,b=points[i:i+2]
  if x<=b[0]:return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])
 return points[-1][1]
text='<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2000 600 8500 4400">\n'
text+='<!-- One dipping geological body; shared contours precede erosion detail. -->\n'
text+=path([(-2200,500),(6800,500),(6800,5100),(-2200,5100)],'#626557')
fronts=[]
for r in range(len(lines)-1):
 top,bottom=lines[r:r+2]
 lip=[(x,y+DEPTH[(i//4+r)%len(DEPTH)]) for i,(x,y) in enumerate(top)]
 front=lip+bottom[::-1];fronts.append(front)
 text+=f'<g id="continuous-bed-{r}">\n'
 text+=path(top+bottom[::-1],['#66695c','#626658','#696c5e'][r%3])
 text+=path(top+lip[::-1],['#7b7e6d','#767a68','#808270'][r%3])
 # The contact shadow is attached beneath the lip, not a cast shadow from a rock.
 seam=[(x,y+12+(i%3)*4) for i,(x,y) in enumerate(lip)]
 text+=path(lip+seam[::-1],'#4e5548')
 text+='</g>\n'
# Erosion cuts use only three-face fragments from C, with all flora/soil omitted.
ns='{http://www.w3.org/2000/svg}';fan=list(E.parse(ROOT/'game/art-studies/rock-outcrop-quality/rock-fan.svg').getroot())[-1]
fragments=[(1,2,3),(4,5,6),(7,8,9),(10,11,12),(13,14,15),(16,17,18),(19,20,21)]
# Sparse, unequal fracture stations along each shared bed. These marks do not
# define the body or its outline; clipped secondary cuts inherit its direction.
stations=[
[-1880,-1510,-1080,-660,-230,210,680,1090,1570,1970,2380,2780,3210,3650,4060,4500,4960,5450,5900,6280],
[-1760,-1330,-920,-480,-20,430,890,1320,1740,2190,2630,3080,3490,3900,4320,4760,5210,5660,6100],
[-1900,-1450,-1040,-610,-180,280,720,1160,1590,2050,2470,2910,3350,3770,4180,4620,5090,5520,5980,6400],
[-1800,-1380,-940,-490,-70,370,820,1270,1690,2140,2570,3020,3450,3880,4310,4770,5200,5660,6090],
[-1930,-1480,-1030,-570,-140,300,750,1200,1640,2080,2530,2970,3410,3850,4300,4740,5180,5640,6080,6430],
[-1760,-1330,-870,-440,10,460,900,1340,1780,2220,2670,3100,3540,3980,4430,4880,5320,5770,6200],
[-1900,-1470,-1020,-580,-130,310,750,1190,1650,2100,2540,2990,3440,3890,4330,4800,5250,5690,6140],
[-1780,-1350,-910,-460,-30,410,850,1300,1750,2190,2640,3080,3520,3980,4430,4870,5340,5780,6220],
[-1900,-1460,-1010,-560,-120,330,780,1230,1670,2120,2560,3010,3460,3910,4360,4820,5260,5710,6160],
]
# All source fragments use absolute M/L/H/V only. Convert to points for mapping
# into the direction and depth of the actual shared bedding surface.
def points(d):
 ts=re.findall(r'[A-Za-z]|[-+]?(?:\d*\.\d+|\d+)',d);i=0;cmd='';x=y=0;out=[]
 while i<len(ts):
  if ts[i].isalpha():cmd=ts[i];i+=1
  if cmd=='Z':break
  if cmd in ['M','L']:x,y=float(ts[i]),float(ts[i+1]);i+=2;cmd='L'
  elif cmd=='H':x=float(ts[i]);i+=1
  elif cmd=='V':y=float(ts[i]);i+=1
  else:raise ValueError(cmd)
  out.append((x,y))
 return out
for r,xs in enumerate(stations):
 text+=f'<defs><clipPath id="bed-incision-{r}"><path d="{dpath(fronts[r])}"/></clipPath></defs>\n<g id="erosion-bed-{r}" clip-path="url(#bed-incision-{r})">\n'
 for j,x in enumerate(xs):
  ids=fragments[(j+2*r)%7];body=points(fan[ids[0]].get('d'));minx=min(a for a,b in body);maxx=max(a for a,b in body);miny=min(b for a,b in body);maxy=max(b for a,b in body)
  # Different exposure widths and buried feet, always attached to this bed.
  width=[230,310,270,350,245,290,325][(j+r)%7]
  upper=at(lines[r],x)+55;lower=at(lines[r+1],x)-18;depth=lower-upper
  for q,idx in enumerate(ids):
   poly=[]
   for px,py in points(fan[idx].get('d')):
    u=(px-minx)/(maxx-minx);v=(py-miny)/(maxy-miny)
    xx=x+u*width+(1-v)*55
    yy=upper+v*depth+at(lines[r],xx)-at(lines[r],x)
    poly.append((xx,yy))
   text+=path(poly,['#5e6355','#7b7f6b','#4c5447'][q])
 text+='</g>\n'
text+='</svg>\n';(ROOT/'game/art-studies/ferry-clean-scene/native-body.svg').write_text(text)
