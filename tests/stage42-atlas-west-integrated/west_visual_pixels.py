"""Native Workshop stock renderer exact RGBA side protection; not a live actor read."""
from PIL import Image
import io,base64
def check_pixels(before,after,points,expect_visible=True):
    assert before['actual']==after['actual'] and before['viewport']==after['viewport'],'different runtime fixed camera'
    imgs=[Image.open(io.BytesIO(base64.b64decode(s['png'].split(',',1)[1]))).convert('RGBA') for s in (before,after)]
    a,b=imgs
    assert a.size==b.size
    splits=next(i for i,p in enumerate(points) if p[0]==4030)
    top=points[:splits+1];bottom=points[splits+1:][::-1]
    def at(chain,x):
        for u,v in zip(chain,chain[1:]):
            if u[0]<=x<=v[0]:return u[1]+(v[1]-u[1])*(x-u[0])/(v[0]-u[0])
        raise ValueError(x)
    w,h=a.size;cx,cy,z=before['actual'];aa=5/z
    inside=0;outside=0;low=0
    width, height=a.size
    ap,bp=a.load(),b.load()
    for i in range(width):
        x=(i+.5-w/2)/z+cx
        v=min(4030,max(0,x));t=at(top,v);q=at(bottom,v)
        for j in range(height):
            if ap[i,j]==bp[i,j]:continue
            y=(j+.5-h/2)/z+cy
            if 0<=x<=4030 and t+aa<y<q-aa:inside+=1
            if x< -aa or x>4030+aa or y<t-aa or y>q+aa:outside+=1
            if 1358.40<=x<=1567.87 and 2075.68-92<=y<2075.68:low+=1
    assert (inside>0 if expect_visible else inside==0) and outside==0 and low==0,{'inside':inside,'outside':outside,'lower_standing_headroom':low}
    return {'inside_changed':inside,'outside_changed':outside,'lower_standing_headroom_changed':low,'aa_guard_px':5}
