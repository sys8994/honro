"""Trace opaque silhouette and subtractively nested paint masks with native Inkscape.
Each emitted path has untransformed absolute M/L/C/Q/Z coordinates and no clip asset."""
from __future__ import annotations
import base64,json,os,re,subprocess,sys
from pathlib import Path
import xml.etree.ElementTree as E
import numpy as np
from PIL import Image,ImageCms
from scipy import ndimage as ndi
from svgpathtools import parse_path, Line, CubicBezier, QuadraticBezier

def compact_path(d,ox,oy):
    if not d.strip(): return "",0
    p=parse_path(d); result=[]; n=0
    def coord(z):
        return f'{z.real-ox:.2f} {z.imag-oy:.2f}'
    for part in p.continuous_subpaths():
        if not len(part): continue
        result.append('M'+coord(part[0].start)); n+=1
        for seg in part:
            end=coord(seg.end)
            if isinstance(seg,Line): result.append('L'+end)
            elif isinstance(seg,CubicBezier): result.append('C'+coord(seg.control1)+' '+coord(seg.control2)+' '+end)
            elif isinstance(seg,QuadraticBezier): result.append('Q'+coord(seg.control)+' '+end)
            else: raise ValueError(type(seg))
            n+=1
        if part.isclosed(): result.append('Z')
    return ''.join(result),n

def mask_path(mask,out,tag,speckles=3,threshold=.001):
    if speckles:
        labels, _ = ndi.label(mask)
        counts=np.bincount(labels.ravel())
        mask=mask & (counts[labels]>speckles)
    if not mask.any(): return ''
    if mask[0,:].any() or mask[-1,:].any() or mask[:,0].any() or mask[:,-1].any():
        raise ValueError('Missing border padding')
    w,h=mask.shape[1],mask.shape[0]
    Path(out).mkdir(parents=True,exist_ok=True)
    img=out/(tag+'.png'); in_svg=out/(tag+'-input.svg'); res=out/(tag+'.svg')
    Image.fromarray(np.where(mask,0,255).astype('uint8')).convert('RGB').save(img)
    oneline=base64.b64encode(img.read_bytes()).decode()
    in_svg.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><image id="source" width="{w}" height="{h}" xlink:href="data:image/png;base64,{oneline}"/></svg>')
    env={**os.environ,'INKSCAPE_PROFILE_DIR':str(out/'profile')}
    actions=f'select-by-id:source;object-trace:2,false,false,true,{speckles},0,0.1;select-clear;select-by-id:source;delete;select-all:all;path-simplify-threshold:{threshold};path-simplify;select-clear;export-plain-svg;export-filename:{res};export-do'
    p=subprocess.run(['/usr/bin/inkscape',str(in_svg),'--batch-process','--actions='+actions],env=env,text=True,capture_output=True,timeout=36)
    if p.returncode or not res.exists() or 'Tracing done.' not in p.stdout+p.stderr:
        raise RuntimeError(p.stdout+'\n'+p.stderr)
    if 'action not found' in (p.stdout+p.stderr).lower():
        raise RuntimeError(p.stdout+'\n'+p.stderr)
    data=[]
    for el in E.parse(res).iter():
        if el.get('transform'): raise ValueError(f'Unexpected transform {el.attrib}')
        if el.get('d'): data.append(el.get('d'))
    joined=' '.join(data)
    # Inkscape returns the page matte when all black speckles vanished; never paint it.
    if joined:
        x0,x1,y0,y1=parse_path(joined).bbox()
        if x0<=.1 and y0<=.1 and x1>=w-.1 and y1>=h-.1:
            raise RuntimeError(f'Unexpected full-page paint layer: {out}/{tag}')
    return joined

ART_PALETTES={
 'boss_daedosa':'211f22 302e29 46463e 586351 797561 9a8d73 b9afa0 d6cbbb 4c262b 733637 975442 97723f c39550 d7b071',
 'daedosa_head':'252226 372d29 4f3f30 65492b 8d6234 ab864b c89a52 dab56a 5f5547 797068 a0998d bcb1a2 dfceb8 6a3c34',
 'grot_hands':'211e21 34332c 49483d 5a5d4e 737765 938876 b1a28c c1ae8e d6c8ab 7d6952 9b824d',
 'grot_door':'271c1e 3d2c23 564236 785638 9c7351 b7905f d4b485 e2cda6 294c42 4f6550 63785a 69332c a75039 d19c62',
 'grot_hanging':'252426 3f392f 5c4b32 806541 a18256 5b5852 7a7369 9a9083 b5a895 cbbda5 e3d6bd',
 'gate_armor':'191a1d 292624 3a342f 504a40 626350 767c63 9d8564 bda180 c6b59c 4c2d2a 7e3933 a05843',
 'forepaw':'1d1b20 332b2c 484043 594940 725b4e 8d7263 a89079 c3aa94 4d2c32 703c36 9b654a b09b70',
 'wonhon':'1d1e25 292830 353842 4d5055 5f686c 768788 8d9b94 acb5a5 c4c7b1 7d726a a09882',
 'wonhon_knotted':'201c23 2a2832 383843 4d4a53 5d5a5c 7f766f 9a8678 b2a08e 442629 642e2e 80392e 96543e b17758 cf9d77'
}

def fixed_palette(occupied, name):
    table=np.array([tuple(bytes.fromhex(code)) for code in ART_PALETTES[name].split()],dtype=np.uint8)
    convert=ImageCms.buildTransform(ImageCms.createProfile('sRGB'), ImageCms.createProfile('LAB'),'RGB','LAB')
    def lab(rgb):
        return np.asarray(ImageCms.applyTransform(Image.fromarray(rgb.reshape(1,-1,3),'RGB'),convert)).reshape(-1,3).astype(np.float32)
    pixels, palette=lab(occupied),lab(table)
    distance=((pixels[:,None,:]-palette[None,:,:])**2 * np.array([1.,1.4,1.4])).sum(axis=2)
    return table, distance.argmin(axis=1)

def main(src,out,palette_size):
    rgba=Image.open(src).convert('RGBA')
    w,h=rgba.size; a=np.asarray(rgba); matte=a[:,:,3]>127
    # Build palette solely from occupied pixels; no white background color can enter it.
    occupied=a[matte,:3]
    if palette_size in ART_PALETTES:
        table, indices=fixed_palette(occupied,palette_size)
    else:
        sample=Image.fromarray(occupied.reshape(1,-1,3),'RGB').quantize(colors=int(palette_size),method=Image.Quantize.MEDIANCUT)
        table=np.asarray(sample.getpalette(),dtype=np.int16).reshape(-1,3)
        indices=np.asarray(sample).ravel()
    colors,counts=np.unique(indices,return_counts=True)
    colors=[k for k,_ in sorted(zip(colors,counts),key=lambda kv:-kv[1])]
    # The largest occupied color backs all other paint through their thin antialiased edges.
    # Trace all other paint as disjoint masks. Keep subpixel ligatures and portrait details.
    masks=np.zeros((h,w),dtype=np.int16)-1; masks[matte]=indices
    result=[]
    for i,k in enumerate(colors):
        mo=matte if i==0 else (masks==k)
        p=mask_path(mo,out,f'paint-{i:02d}',0 if i==0 else int(os.environ.get('HONRO_PAINT_SPECKLES','4')),
                    0.0002 if i==0 else float(os.environ.get('HONRO_PAINT_THRESHOLD','0.0015')))
        d,n=compact_path(p,w/2,h-2)
        if d: result.append(dict(color='#'+''.join(f'{v:02x}' for v in table[k]),d=d,anchors=n))
    (out/'candidate.json').write_text(json.dumps({'viewBox':[-w/2,2-h,w,h],'height':h-4,'paths':result},separators=(',',':'))+'\n')
    sv=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-w/2} {2-h} {w} {h}">']
    sv += [f'<path d="{p["d"]}" fill="{p["color"]}"/>' for p in result]
    (out/'candidate.svg').write_text(''.join(sv)+'</svg>')
    print(src,sum(p['anchors'] for p in result),sum(len(p['d']) for p in result),len(result))
if __name__=='__main__': main(Path(sys.argv[1]),Path(sys.argv[2]),sys.argv[3])
