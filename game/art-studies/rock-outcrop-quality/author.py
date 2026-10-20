"""Authored bedrock contours; no raster, noise filter or runtime dependency."""
from pathlib import Path
import sys, math
ROOT=Path(__file__).parent
REV=int(sys.argv[1]) if len(sys.argv)>1 else 7
# Separate compositions: low shelf, raised split shoulder, descending fan.
CONTOURS=[
[(0,202),(50,187),(89,154),(137,144),(174,112),(231,100),(277,118),(321,152),(381,158),(428,140),(484,159),(536,180),(595,174),(655,202),(720,214)],
[(0,222),(60,214),(111,179),(164,162),(213,113),(252,78),(302,72),(349,94),(366,133),(427,149),(481,175),(526,168),(578,192),(650,209),(720,219)],
[(0,188),(65,177),(109,139),(170,131),(220,145),(275,163),(321,189),(378,174),(430,189),(491,221),(546,218),(598,238),(658,226),(720,242)]]
# x,y,width,height,lean: independent overlapping fracture beds, not isolated boulders.
BEDS=[
[(6,201,106,174,45),(74,166,100,155,53),(144,128,98,176,57),(220,115,92,147,31),(295,157,83,160,41),(369,170,108,151,57),(444,160,91,181,26),(522,190,98,145,42),(612,214,118,178,48),(37,318,148,133,55),(170,290,127,173,54),(294,308,110,154,29),(411,319,138,143,50),(550,330,150,132,59)],
[(8,229,136,173,62),(100,184,111,169,59),(179,137,100,173,35),(237,87,106,177,42),(316,108,81,191,18),(383,158,117,185,64),(484,185,101,168,51),(575,211,141,197,49),(49,353,145,110,47),(182,311,120,148,30),(299,290,127,176,44),(425,339,133,128,60),(552,369,147,91,41)],
[(0,202,109,172,39),(80,157,117,188,58),(180,160,125,170,68),(285,193,91,161,29),(355,188,119,173,67),(462,225,104,149,35),(550,238,100,146,46),(633,249,99,181,33),(18,355,140,111,41),(139,331,130,126,62),(267,347,136,112,47),(396,358,131,102,38),(514,382,131,91,48)]]
def path(points): return 'M'+' L'.join(f'{x:.1f},{y:.1f}' for x,y in points)+' Z'
def el(d,fill,extra=''): return f'<path d="{d}" fill="{fill}" {extra}/>'
def poly(p,c,extra=''):return el(path(p),c,extra)
def make(v):
 top=CONTOURS[v]; contour=top+[(720,460),(0,460)]
 out=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 460"><title>HONRO bedrock '+['shelf','split shoulder','descending fan'][v]+'</title>', '<defs><linearGradient id="body" x2=".4" y2="1"><stop stop-color="#575e5d"/><stop offset="1" stop-color="#292f30"/></linearGradient><linearGradient id="face" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#626b6b"/><stop offset=".55" stop-color="#434d50"/><stop offset="1" stop-color="#303a3e"/></linearGradient><linearGradient id="soil" x2=".2" y2="1"><stop stop-color="#746550"/><stop offset="1" stop-color="#3a3931"/></linearGradient><clipPath id="mass">'+poly(contour,'white')+'</clipPath></defs>', '<g id="continuous-foundation">',poly(contour,'url(#body)'),'</g><g clip-path="url(#mass)" id="fractured-beds">']
 if REV>=3:
  # Continuous broad dipping beds behind exposed plates, filling interstices.
  for q,c in [([(0,270),(139,188),(278,206),(337,262),(261,354),(97,421),(0,390)],'#444e4e'), ([(180,460),(271,326),(380,249),(506,257),(469,350),(375,460)],'#515a56'), ([(440,460),(506,314),(628,244),(720,265),(720,460)],'#3a4648')]:
   out.append(poly(q,c))
  for j in range(14):
   x=(j*97+v*29)%710; y=235+(j*43%180); w=25+(j*13%42); h=25+(j*19%52)
   out.append(poly([(x,y+h),(x+14,y+17),(x+w,y),(x+w+8,y+18),(x+w*.55,y+h*.82),(x+8,y+h+9)],'#273336'))
   out.append(poly([(x,y+h),(x+14,y+17),(x+w,y),(x+w-7,y+23),(x+w*.40,y+h*.76)],'#5c6663'))
 for i,(x,y,w,h,lean) in enumerate(BEDS[v]):
  # Non-convex shoulders, offset wedges and breakouts. Vary termination and crown.
  a=(i*7+v*3)%11; b=(i*3+v)%7
  if REV>=2:
   w*= [1.31,.74,1.13,.69,1.24,.91][(i+v)%6]
   h*= [1.18,1.08,.78,1.28,.87][(i+v)%5]
   lean*= [.83,1.2,.65,1.08][i%4]
   y+= [0,17,-7,22,-3][i%5]
  pts=[(x+lean,y+8),(x+lean+w*.22,y-4-b),(x+w*.85,y+6),(x+w,y+30+a),(x+w*.86,y+h*.39),(x+w*.90,y+h*.53),(x+w*.55,y+h*.79),(x+w*.39,y+h),(x+5,y+h-9),(x-7,y+h*.70),(x+15,y+h*.42),(x+12,y+h*.28)]
  out.append(poly([(px+2,py+3) for px,py in pts],'#263235'))
  if REV>=2:
   broken=[]
   for z,(px,py) in enumerate(pts):
    nx,ny=pts[(z+1)%len(pts)]; dx=nx-px; dy=ny-py
    broken.extend([(px,py),(px+dx*.36+((z+i)%3-1)*3,py+dy*.36),(px+dx*.55-2,py+dy*.55+3)])
   out.append(poly(broken,'url(#face)'))
  else: out.append(poly(pts,'url(#face)'))
  out.append(poly([pts[0],pts[1],pts[2],pts[3],(x+w*.70,y+31),(x+lean-11,y+33)],['#68716d','#616d6b','#75796e'][i%3], 'opacity=".48"' if REV>=7 and i%3 else ''))
  out.append(poly([pts[3],pts[4],pts[5],pts[6],pts[7],(x+w*.42,y+h-18),(x+w*.65,y+h*.50)],['#303a3d','#384345','#293438'][i%3]))
  out.append(poly([pts[0],(x+lean-11,y+33),(x+22,y+h*.55),pts[9],pts[10],pts[11]],'#525d5e'))
  # Broad weathered exfoliation planes with broken contours, never zigzag ink cracks.
  if REV>=2:
   for j,(u,t,sw,sh) in enumerate([(.29,.30,.36,.28),(.17,.69,.34,.22),(.51,.49,.20,.27)]):
    xx=x+w*u; yy=y+h*t; ww=w*sw; hh=h*sh
    q=[(xx+ww*.57,yy),(xx+ww,yy+3),(xx+ww*.81,yy+hh*.35),(xx+ww*.92,yy+hh*.48),(xx+ww*.28,yy+hh),(xx,yy+hh*.72),(xx+ww*.13,yy+hh*.39)]
    out.append(poly(q,['#626e70','#77807a','#2d393e'][(i+j)%3],f'opacity="{.35 if j==0 else .24}"'))
  if REV>=5:
   for j in range(7):
    xx=x+w*(.17+(j*13%53)/100); yy=y+h*(.2+(j*19%61)/100)
    sw=8+(i*3+j*7)%19; sh=12+(i*7+j*3)%26
    out.append(el(f'M{xx},{yy} l{sw*.5},{-sh*.3} {sw*.2},3 {sw*.3},-2 -2,{sh*.35} -4,2 1,{sh*.24} {-sw*.5},{sh*.4} -3,-3 {-sw*.3},2 2,{-sh*.3} -2,-2Z', ['#878b7d','#1c2b31','#687575','#a09579'][(i+j)%4], 'opacity=".21"'))
  if REV>=3 and (REV<4 or i%3!=0) and (REV<6 or i%4==1):
   # Contact cleft and stepped detached lamina, different length/orientation per bed.
   xx=x+w*.48; yy=y+h*.47
   out.append(poly([(xx+21,yy-19),(xx+14,yy+3),(xx-9,yy+31),(xx-16,yy+54),(xx-12,yy+24),(xx+8,yy+1)],'#233034'))
   out.append(poly([(xx+22,yy-19),(xx+19,yy+4),(xx-4,yy+32),(xx-13,yy+53),(xx-8,yy+28),(xx+12,yy+1)],'#707a78','opacity=".55"'))
   out.append(poly([(x+lean-3,y+11),(x+w*.72,y+8),(x+w*.82,y+14),(x+w*.62,y+16),(x+lean-11,y+23)],'#a1a18b','opacity=".18"'))
 out.append('</g>')
 # Thin soil drape follows crown; interrupted rock windows underneath.
 drape=top+[(x,y+ (14 if k%3 else 25)) for k,(x,y) in reversed(list(enumerate(top)))]
 if REV>=4:
  lower=[]
  for k in range(len(top)-1,0,-1):
   x,y=top[k]; nx,ny=top[k-1]
   lower.extend([(x,y+9),(x+(nx-x)*.23,y+(ny-y)*.23+18),(x+(nx-x)*.39,y+(ny-y)*.39+14),(x+(nx-x)*.56,y+(ny-y)*.56+28),(x+(nx-x)*.71,y+(ny-y)*.71+12)])
  drape=top+lower+[(0,top[0][1]+11)]
 out+=['<g id="soil-and-scree">']
 if REV>=5:
  d='M'+' L'.join(f'{x},{y}' for x,y in top)
  for k in range(len(top)-1,0,-1):
   x,y=top[k]; nx,ny=top[k-1]; dx=nx-x
   d+=f' L{x},{y+8} Q{x+dx*.1},{y+17} {x+dx*.28},{y+12} L{x+dx*.4},{y+17} Q{x+dx*.7},{ny+24} {nx},{ny+11}'
  out.append(el(d+' Z','url(#soil)'))
 else: out.append(poly(drape,'url(#soil)'))
 if REV>=4:
  # Depositional pockets on ledges; only a few local clusters.
  for k,(x,y,w) in enumerate([(31,255,75),(267,258,89),(502,300,102)]):
   y+=v*13
   out.append(poly([(x,y+18),(x+w*.35,y),(x+w*.62,y+8),(x+w,y+3),(x+w-12,y+24),(x+20,y+39)],'url(#soil)'))
   for j in range(4 if REV>=5 else 6):
    xx=x+7+(j*j+2)*w/24; yy=y+15+(j*11%19); s=3+(j*3%8)
    out.append(poly([(xx,yy),(xx+s,yy-5),(xx+s*1.7,yy-1),(xx+s*1.3,yy+5),(xx+2,yy+7)],'#282f2e'))
    out.append(poly([(xx,yy),(xx+s,yy-5),(xx+s*1.7,yy-1),(xx+s*.7,yy+2)],'#838171'))
 # Directed earth chips along limited portions of ridge, not uniform noise.
 for k in [1,3,6,9,12]:
  x,y=top[k]
  out.append(poly([(x-13,y+5),(x+4,y),(x+19,y+4),(x+8,y+8),(x-8,y+10)],'#a09274','opacity=".6"'))
 out.append('</g>')
 if REV>=5:
  out.append('<g id="restricted-lichen-and-grass">')
  for k in [[2,5],[3,10],[1,8,12]][v]:
   x,y=top[k]
   out.append(el(f'M{x-17},{y+11} l14,-8 9,5 13,-3 7,8 -12,4 -5,11 -8,-4 -4,-8 -12,5Z','#656a43'))
   out.append(el(f'M{x-10},{y+9} l9,-3 5,3 -3,4 -10,1Z','#93906a','opacity=".7"'))
   out.append(el(f'M{x+7},{y+7} Q{x+5},{y-20} {x-6},{y-23} Q{x+8},{y-21} {x+10},{y+6} M{x+10},{y+6} Q{x+14},{y-23} {x+29},{y-27} M{x+12},{y+7} Q{x+25},{y-10} {x+34},{y-8}','none','stroke="#8e9270" stroke-width="1.4"'))
  out.append('</g>')
 if REV>=6:
  out.append('<g id="cross-bedding-and-overlap" clip-path="url(#mass)">')
  shapes=[([(38,306),(82,278),(110,280),(135,268),(187,274),(163,292),(159,305),(116,321),(97,339),(60,354),(29,352)],[(54,307),(88,285),(116,288),(137,276),(176,278),(149,292),(115,298)],'#59635f'), ([(328,224),(368,202),(389,208),(414,199),(451,210),(438,226),(403,233),(376,256),(351,259),(313,281)],[(335,224),(370,209),(389,215),(414,205),(443,213),(399,225),(370,243)],'#66706a'), ([(480,357),(530,314),(552,317),(578,297),(615,299),(631,314),(596,344),(588,364),(544,380),(504,401),(467,401)],[(489,356),(534,323),(554,327),(581,304),(609,305),(584,330),(542,352),(513,378)],'#5d6868')]
  for j,(q,cap,col) in enumerate(shapes):
   dx=[0,31,-22][v]; dy=[0,28,42][v]
   q=[(x+dx,y+dy) for x,y in q]; cap=[(x+dx,y+dy) for x,y in cap]
   out.append(poly([(x+2,y+3) for x,y in q],'#28373a'))
   out.append(poly(q,col)); out.append(poly(cap,'#8a8c7a','opacity=".28"'))
   if REV>=7:
    # Fragmented laminar margins; leave large quiet faces between weathered zones.
    for k in [0,2,4,6]:
     xx,yy=q[k]; nx,ny=q[(k+1)%len(q)]
     out.append(el(f'M{xx},{yy} l6,4 11,-1 -4,6 8,2 -17,4 -7,-5 -7,1Z','#a2a38b','opacity=".28"'))
   x,y=q[1]
   out.append(el(f'M{x},{y+13} l28,-7 17,4 -29,14 -15,18 -26,14 12,-16Z','#36484b','opacity=".7"'))
  out.append('</g>')
  out.append('<g id="foreground-overlap">')
  for x,y,w,h in [(0,407,117,72),(334,415,151,68),(621,401,109,90)]:
   out.append(poly([(x,y+25),(x+40,y-9),(x+w*.73,y-17),(x+w,y+8),(x+w-21,y+h),(x,y+h)],'#293438'))
   out.append(poly([(x,y+25),(x+40,y-9),(x+w*.73,y-17),(x+w*.55,y+2),(x+24,y+37)],'#65706b'))
   out.append(poly([(x+24,y+37),(x+w*.55,y+2),(x+w*.73,y-17),(x+w,y+8),(x+w*.61,y+47),(x+51,y+h)],'#444f50'))
   out.append(poly([(x+40,y-9),(x+w*.73,y-17),(x+w*.55,y+2),(x+45,y+5)],'#838776','opacity=".6"'))
  out.append('</g>')
 out.append('</svg>')
 return '\n'.join(out)
for v,name in enumerate(['shelf','shoulder','fan']): (ROOT/f'rock-{name}.svg').write_text(make(v))
# Contact sheet renders every module at 1 CSS pixel per SVG unit plus exact 30%.
html='''<!doctype html><meta charset="utf-8"><title>HONRO rock study</title><style>*{box-sizing:border-box}body{margin:0;background:#c3c7bf;color:#263438;font:16px sans-serif}h1{margin:22px 28px 4px;font-size:22px}p{margin:8px 28px}.row{display:flex;gap:20px;margin:20px 28px}.panel{position:relative;width:820px;height:495px;background:linear-gradient(#aab4af,#8d9b95);overflow:hidden}.rock{position:absolute;left:100px;bottom:0;width:720px;height:460px}.actor{position:absolute;left:32px;bottom:95px;width:38px;height:80px}.small{width:246px;height:148.5px}.small .inner{transform:scale(.3);transform-origin:0 0;width:820px;height:495px}label{position:absolute;left:14px;top:12px} .inner{position:relative;width:820px;height:495px}</style><h1>HONRO / fractured bedrock — revision REV</h1><p>1:1 · H = 80 px | right: 30% · H = 24 px. Transparent asset, neutral review background.</p>'''.replace('REV',str(REV))
actor='<svg class="actor" viewBox="0 0 38 80"><path fill="#e3c18b" d="M16 0h8l3 9-5 5 8 8 6 25-7 2-5-18 2 27 7 22h-8L18 60 12 80H4l9-29-2-20-5 17-6-3 7-24 8-7-3-5Z"/><path d="M37 0v80M33 0h5M33 80h5" stroke="#fff0c9"/></svg>'
for name in ['shelf','shoulder','fan']:
 inner=f'<div class="inner"><label>{name} / H=80</label><img class="rock" src="rock-{name}.svg">{actor}</div>'
 html+=f'<div class="row"><div class="panel">{inner}</div><div class="panel small">{inner}</div></div>'
(ROOT/'review.html').write_text(html)
