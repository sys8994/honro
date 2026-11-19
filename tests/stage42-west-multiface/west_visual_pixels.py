"""Exact RGBA changes within pointer-derived polygons only; AA allowance is local."""
from PIL import Image
import base64,io,math
def check_pixels(before,after,points,expect_visible=True):
    assert before['actual']==after['actual'] and before['viewport']==after['viewport'],'different runtime fixed camera'
    a,b=[Image.open(io.BytesIO(base64.b64decode(f['png'].split(',',1)[1]))).convert('RGBA') for f in (before,after)]
    assert a.size==b.size
    w,h=a.size;cx,cy,z=before['actual']
    polys=[
      [( (x-cx)*z+w/2,(y-cy)*z+h/2) for x,y in poly] for poly in points]
    paths=[(min(x for x,y in p),min(y for x,y in p),max(x for x,y in p),max(y for x,y in p),list(zip(p,p[1:]+p[:1]))) for p in polys]
    inside=outside=pinch=aa=0
    ap,bp=a.load(),b.load()
    for i in range(w):
      for j in range(h):
        if ap[i,j]==bp[i,j]: continue
        u,v=i+.5,j+.5
        x,y=(u-w/2)/z+cx,(v-h/2)/z+cy
        if 1358.4<=x<=1567.87 and 2075.68-92<=y<2075.68:pinch+=1
        found=guard=False
        for l,t,r,d,edges in paths:
          if not (l-5<=u<=r+5 and t-5<=v<=d+5):continue
          if sum((y1>v)!=(y2>v) and u<x1+(x2-x1)*(v-y1)/(y2-y1) for (x1,y1),(x2,y2) in edges)%2:
            found=True;break
          for (x1,y1),(x2,y2) in edges:
            f=max(0,min(1,((u-x1)*(x2-x1)+(v-y1)*(y2-y1))/((x2-x1)**2+(y2-y1)**2)))
            guard|=math.hypot(u-x1-f*(x2-x1),v-y1-f*(y2-y1))<=5
        inside+=found; aa+=not found and guard; outside+=not found and not guard
    result={'inside_changed':inside,'edge_aa_changed':aa,'outside_changed':outside,'lower_standing_headroom_changed':pinch,'aa_guard_px':5}
    assert (inside>0 if expect_visible else inside==aa==0) and outside==pinch==0,result
    return result
