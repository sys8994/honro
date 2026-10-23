import random,math,pathlib,io
import cairosvg
from PIL import Image
D=pathlib.Path(__file__).parent
W,H=1000,1050

def poly(points,width,color,alpha=1):
 return f'<polyline points="'+ ' '.join(f'{x:.1f},{y:.1f}' for x,y in points)+f'" fill="none" stroke="{color}" stroke-width="{width}" opacity="{alpha:.3f}" stroke-linecap="round" stroke-linejoin="round"/>'
def bolt(x,top,end,seed,alpha=1,scale=1):
 r=random.Random(seed);length=end-top;count=14;pts=[]
 for i in range(count+1):
  q=i/count;off=(r.random()*2-1)*11*math.sin(q*math.pi)
  pts.append((x+off,top+length*q))
 forks=[]
 for i,q in enumerate(sorted(r.uniform(.12,.91) for _ in range(22))):
  yy=top+length*q;idx=min(count-1,int(q*count));blend=q*count-idx;xx=pts[idx][0]*(1-blend)+pts[idx+1][0]*blend;side=-1 if r.random()<.52 else 1
  reach=r.uniform(21,83);down=r.uniform(18,75)
  p=[(xx,yy),(xx+side*reach*.35,yy+down*.18),(xx+side*reach*.55,yy+down*.55),(xx+side*reach*.84,yy+down*.68),(xx+side*reach,yy+down)]
  forks.append(p)
  if i%3!=0:
   ax,ay=p[2];forks.append([(ax,ay),(ax+side*reach*.08,ay+down*.34),(ax+side*reach*.26,ay+down*.55)])
 s=''
 for width,a,col in [(39,.07,'#548fe9'),(20,.16,'#72adff'),(10,.75,'#9dccff'),(6.8,1,'#e2f3ff'),(2.4,1,'#ffffff')]:s+=poly(pts,width*scale,col,a*alpha)
 for i,p in enumerate(forks):
  s+=poly(p,4*scale,'#72adff',.12*alpha)+poly(p,(1.8 if i%3 else 1.15)*scale,'#d2ebff',(.7 if i%3 else .45)*alpha)
 s+=f'<ellipse cx="{x}" cy="{end+6}" rx="43" ry="24" fill="#79b8ff" opacity="{.13*alpha}"/>'
 for i in range(11):
  a=-math.pi+i*math.pi/10;d=r.uniform(15,40);s+=poly([(x,end),(x+math.cos(a)*d*.5,end+math.sin(a)*d*.7),(x+math.cos(a)*d,end+math.sin(a)*d)],1.4,'#e2f3ff',.78*alpha)
 return s

def scene(frame=None):
 s=f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><rect width="1000" height="1050" fill="#0c171d"/>'
 s+='<path d="M0 220 65 184 129 251 197 200 260 267 329 228 419 290 496 260 598 213 689 268 767 240 855 186 928 227 1000 180V0H0Z" fill="#172932"/>'
 s+='<path d="M0 820 159 789 326 807 512 787 705 821 849 792 1000 811V1050H0Z" fill="#243d43"/><path d="M0 820 159 789 326 807 512 787 705 821 849 792 1000 811" fill="none" stroke="#677b78" stroke-width="3"/>'
 s+='<g font-family="Noto Sans CJK KR, sans-serif" fill="#ecdfbd"><text x="55" y="68" font-size="30" font-weight="bold">천뢰호 · 낙뢰 시안</text><text x="55" y="106" font-size="18" fill="#9eafaf">곧고 굵은 주 줄기 / 옆·아래로 갈라지는 짧은 잔가지</text></g>'
 for x,yy in [(200,802),(500,790),(800,805)]:
  s+=f'<g transform="translate({x},{yy})"><path d="M-20 -56 -31 -28 -21 -4 -28 18 -8 18 0 -4 9 18 29 18 19 -5 28 -34 15 -57Z" fill="#56666a"/><path d="M-17 -54 0 -68 17 -53 16 -34 -1 -30 -17 -39Z" fill="#81908a"/><path d="M-22 -45 -51 -19 -44 -10 -17 -24M20 -44 45 -20 39 -11 14 -25" fill="#536a70"/></g>'
 for k,(x,t,e,seed) in enumerate([(200,202,742,33),(500,151,730,71),(800,235,745,192)]):
  if frame is None:a=1
  else:
   v=frame-k; a=0 if v<0 or v>10 else ([.13,.95,1,.66,.94,.56,.38,.25,.17,.1,.03][v])
  if a:s+=bolt(x,t,e,seed,a,1.08 if k==1 else .94)
 s+='<g font-family="Noto Sans CJK KR, sans-serif"><text x="55" y="919" fill="#e0d4b2" font-size="22">중심 낙뢰는 선명하게, 잔가지는 가늘고 풍부하게</text><text x="55" y="958" fill="#93a7aa" font-size="18">대상마다 다른 분기 · 짧은 잔광 · 범위 내 적별 낙뢰 유지</text><text x="55" y="1009" fill="#748b90" font-size="15">벡터 콘셉트 시안 · 실제 플레이 스크린샷 아님 · 미적용</text></g></svg>'
 return s
svg=scene();(D/'concept.svg').write_text(svg);cairosvg.svg2png(bytestring=svg.encode(),write_to=str(D/'concept.png'))
frames=[]
for f in [-1,0,1,2,3,4,5,6,7,8,9,10,11,12,-1,-1]:
 data=cairosvg.svg2png(bytestring=scene(f).encode(),output_width=600,output_height=630);frames.append(Image.open(io.BytesIO(data)).convert('RGB'))
frames[0].save(D/'concept-motion.gif',save_all=True,append_images=frames[1:],duration=[450]+[65]*13+[350,500],loop=0,optimize=True)
print('created')
