import sys
# Masked colour-template registration of part-sheet cells onto the full-body figure.
# usage: python3 sheet_register.py sheet-2x.png out.json overlay.png (sheet rasterised at 2x)
import cv2, numpy as np, json
S=2;D=0.25   # sheet->2x raster, search downsample
img=cv2.imread('sys.argv[1]')
def mask(a,ref): return (np.abs(a.astype(int)-ref.astype(int)).sum(2)>30).astype(np.uint8)
paper=img[20,500]
CELLS={'head':(436,0,689,393),'thorax':(689,0,962,393),'front_upper_arm':(962,0,1199,393),'front_forearm':(1199,0,1448,393),
 'rear_upper_arm':(436,393,689,700),'rear_forearm':(689,393,944,700),'front_thigh':(944,393,1199,700),'front_shin':(1199,393,1448,700),
 'rear_thigh':(436,700,689,1086),'rear_shin':(689,700,944,1086),'weapon':(944,700,1199,1086)}
full=img[0:1086*S,0:436*S].copy();fullD=cv2.resize(full,None,fx=D,fy=D,interpolation=cv2.INTER_AREA).astype(np.float32)
def search(c,m,scales,angles,fd,d):
    best=(-1e18,)
    h,w=m.shape
    for s in scales:
        for a in angles:
            R=cv2.getRotationMatrix2D((w/2,h/2),a,s*d)
            # output canvas sized to bounding box
            cs=np.abs(R[0,0]);sn=np.abs(R[0,1]);W=int(h*sn+w*cs)+2;H=int(h*cs+w*sn)+2
            R[0,2]+=W/2-w/2;R[1,2]+=H/2-h/2
            ci=cv2.warpAffine(c,R,(W,H),flags=cv2.INTER_AREA).astype(np.float32)
            mi=cv2.warpAffine(m*255,R,(W,H),flags=cv2.INTER_LINEAR)
            mi=(mi>128).astype(np.float32)
            if H>=fd.shape[0] or W>=fd.shape[1] or mi.sum()<20:continue
            mi3=cv2.merge([mi,mi,mi])
            r=cv2.matchTemplate(fd,ci,cv2.TM_SQDIFF,mask=mi3)/ (mi.sum()*3)
            r[~np.isfinite(r)]=1e12;mn,_,loc,_=cv2.minMaxLoc(r)
            score=-mn
            if score>best[0]:best=(score,s,a,loc,R,(W,H))
    return best
out={}
for k,(x0,y0,x1,y1) in CELLS.items():
    c=img[y0*S+6:y1*S-6,x0*S+6:x1*S-6].copy();m=mask(c,paper);m[:110,:110]=0
    ys,xs=np.nonzero(m);bx0,by0,bx1,by1=xs.min(),ys.min(),xs.max()+1,ys.max()+1
    c=c[by0:by1,bx0:bx1];m=m[by0:by1,bx0:bx1]
    b=search(c,m,np.arange(.45,1.7,.05),np.arange(-90,91,4),fullD,D)
    s0,a0=b[1],b[2]
    b=search(c,m,np.arange(s0-.05,s0+.051,.01),np.arange(a0-4,a0+4.1,1),fullD,D)
    score,s,a,loc,R,(W,H)=b
    # compose: crop px -> rotated canvas (down) -> full down coords -> full 2x coords
    R2=R.copy();R2[0,2]+=loc[0];R2[1,2]+=loc[1];R2/=D
    # crop offset: crop px = sheet2x px - (x0*S+6+bx0)
    off=np.array([x0*S+6+bx0,y0*S+6+by0])
    out[k]={'M':R2.tolist(),'off':off.tolist(),'scale':float(s),'rot':float(a),'err':float(-score)}
    print(f'{k:16s} scale {s:.2f} rot {a:5.0f} err {-score:8.1f} at {loc}')
json.dump(out,open('sys.argv[2]','w'))
# overlay check
canvas=np.full_like(full,255)
for k,(x0,y0,x1,y1) in CELLS.items():
    o=out[k];c=img[y0*S+6:y1*S-6,x0*S+6:x1*S-6];m=mask(c,paper);m[:110,:110]=0
    ox,oy=np.array(o['off'])-np.array([x0*S+6,y0*S+6])
    M=np.array(o['M']);M=M.copy();M[:,2]=M[:,2]-M[:,:2]@np.array([ox,oy])  # cell-crop px -> full 2x
    w=cv2.warpAffine(c,M,(full.shape[1],full.shape[0]));wm=cv2.warpAffine(m,M,(full.shape[1],full.shape[0]))
    canvas[wm>0]=w[wm>0]
cv2.imwrite('sys.argv[3]',np.hstack([full,canvas,cv2.addWeighted(full,.5,canvas,.5,0)]))
