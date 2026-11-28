"""Register isolated generated Act I subjects in their production image cells."""
from pathlib import Path
import argparse
import numpy as np
from scipy import ndimage
from PIL import Image,ImageFilter
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/source/act1'
ACTORS=ROOT/'assets/actors'
PROPS=ROOT/'assets/props'
def cells(filename,cols=4,rows=3):
    src=Image.open(SOURCE/filename).convert('RGBA');a=np.asarray(src)[:,:,3]
    if (a<16).mean()<.22:raise ValueError('Opaque background: '+filename)
    mask=a>34
    labels,n=ndimage.label(ndimage.binary_closing(mask,iterations=1))
    regions=ndimage.find_objects(labels);result=[[[] for _ in range(cols)] for _ in range(rows)]
    for k,sl in enumerate(regions,1):
        if sl is None:continue
        y,x=sl;pix=labels[sl]==k
        if pix.sum()<12:continue
        cy,cx=ndimage.center_of_mass(pix);r=min(rows-1,int((cy+y.start)*rows/a.shape[0]));c=min(cols-1,int((cx+x.start)*cols/a.shape[1]))
        result[r][c].append((k,sl))
    for row in result:
        out=[]
        for parts in row:
            main=max(parts,key=lambda p:(p[1][0].stop-p[1][0].start)*(p[1][1].stop-p[1][1].start))
            sl=main[1];by,bx=sl
            # Nearby loose ribbons and horns belong with their body. Ignore compression specks.
            near=[k for k,(y,x) in parts if x.stop>=bx.start-18 and x.start<=bx.stop+18 and y.stop>=by.start-13 and y.start<=by.stop+13]
            select=ndimage.binary_dilation(np.isin(labels,near),iterations=2)
            alpha=Image.fromarray(np.where(select,a,0).astype('uint8'));tmp=src.copy();tmp.putalpha(alpha);out.append(tmp.crop(alpha.getbbox()))
        yield out
def padded(pic,w,h):
    out=Image.new('RGBA',(w,h));pic=pic.copy();pic.thumbnail((w-6,h-4),Image.Resampling.LANCZOS);out.alpha_composite(pic,((w-pic.width)//2,h-2-pic.height));return out
def roadsides():
    for name,img in zip(['palisade','terrace_wall','funeral_flags','bell_rack'],(p for row in cells('roadsides.webp',2,2) for p in row)):
        img.thumbnail((460,400),Image.Resampling.LANCZOS);img.save(PROPS/(name+'.png'),optimize=True)
        if name=='bell_rack':
            a=np.asarray(img).copy();low=a.copy();yy,xx=np.mgrid[0:img.height,0:img.width]
            edge=img.height*(.27+.35*xx/img.width)
            low[:,:,3]=np.where(yy<=edge,0,a[:,:,3]);a[:,:,3]=np.where(yy<=edge,a[:,:,3],0)
            Image.fromarray(low).save(PROPS/(name+'-base.png'),optimize=True)
            Image.fromarray(a).save(PROPS/(name+'-roof.png'),optimize=True)

if __name__=='__main__':
    roadsides()
    people=['porter','medium','villager','villager_woman','possessed','mourner','shade','lantern','warden','ferry_warden','pier_warden','empty_bier']
    for i,p in enumerate(p for row in cells('village-cast.webp') for p in row):
        p.thumbnail((340,320),Image.Resampling.LANCZOS);p.save(ACTORS/(people[i]+'.webp'),quality=92,method=5)
    for name in ['damheo','hwigyeom','sodan']:
        atlas=Image.new('RGBA',(4*176,3*192));who=['damheo','hwigyeom','sodan'].index(name)
        for j,src in enumerate(['companions.webp','stride.webp','cast.webp']):
            for i,pic in enumerate(list(cells(src))[who]):atlas.alpha_composite(padded(pic,176,192),(i*176,j*192))
        atlas.save(ACTORS/(name+'.webp'),quality=93,method=5)
    structures=['hut','shed','broken_pier','lookout','well','altar','binding','steps','cargo','litter','funeral_bier','guardtree']
    for n,p in zip(structures,(p for row in cells('sites.webp') for p in row)):
        p.save(PROPS/(n+'.png'),optimize=True)
        if n in ('hut','shed','lookout','guardtree'):
            h=p.height;start={'hut':.57,'shed':.52,'lookout':.48,'guardtree':.64}[n]
            yy,xx=np.mgrid[0:h,0:p.width];seam=h*(start+.12*(1-abs(2*xx/p.width-1)))
            high=np.asarray(p).copy();low=high.copy();high[:,:,3]=np.where(yy<=seam,high[:,:,3],0);low[:,:,3]=np.where(yy>seam,low[:,:,3],0)
            Image.fromarray(high).save(PROPS/(n+'-roof.png'),optimize=True);Image.fromarray(low).save(PROPS/(n+'-base.png'),optimize=True)
