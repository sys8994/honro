#!/usr/bin/env python3
"""Non-destructive, bounded geometric simplification of decorative SVG paths.
Requires svgpathtools, Pillow, numpy, Inkscape CLI. Units: root viewBox units.
"""
import argparse, copy, hashlib, json, math, re, subprocess, tempfile
from pathlib import Path
import xml.etree.ElementTree as ET
from svgpathtools import parse_path, Line, CubicBezier, QuadraticBezier
import numpy as np
from PIL import Image

NUMBER = r'[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?'
PROTECT = r'(?i)(collision|contact|surface|walk|socket|support|interact|protected)'

def dist(p,a,b):
    v=b-a
    if abs(v)==0:return abs(p-a)
    t=max(0,min(1,((p-a).real*v.real+(p-a).imag*v.imag)/(abs(v)**2)))
    return abs(p-(a+t*v))

def flatten(seg,tol,depth=0):
    if isinstance(seg,Line):return [seg.start,seg.end]
    if not isinstance(seg,(CubicBezier,QuadraticBezier)):raise ValueError('arc/unsupported segment preserved')
    controls=[seg.control] if isinstance(seg,QuadraticBezier) else [seg.control1,seg.control2]
    if max(dist(p,seg.start,seg.end) for p in controls)<=tol:return [seg.start,seg.end]
    if depth>=24:raise ValueError('flatten recursion guard')
    a,b=seg.split(.5)
    return flatten(a,tol,depth+1)[:-1]+flatten(b,tol,depth+1)

def rdp(points,tol):
    keep={0,len(points)-1}; stack=[(0,len(points)-1)]
    while stack:
        a,b=stack.pop()
        if b-a<2:continue
        d,i=max((dist(points[i],points[a],points[b]),i) for i in range(a+1,b))
        if d>tol:keep.add(i);stack.extend(((a,i),(i,b)))
    return [points[i] for i in sorted(keep)]

def area(p):return sum(a.real*b.imag-b.real*a.imag for a,b in zip(p,p[1:]+p[:1]))/2

def count(d):return sum(1 for s in parse_path(d))

def _simplify(d,epsilon,precision=6,max_area_error=.02):
    path=parse_path(d); out=[]; before=len(path);after=0
    # Parsing full paths merges coincident M boundaries; preserve lexical M/Z explicitly.
    if re.search(r"[m]",d):raise ValueError("relative moveto preserved")
    parts=re.findall(r"M[^M]*",d)
    for raw in parts:
        if re.search(r"[zZ].*\S",raw.rstrip()[:-1]):raise ValueError("nonterminal close preserved")
        sub=parse_path(raw)
        pts=[]
        for s in sub:
            q=flatten(s,epsilon*.2)
            pts.extend(q if not pts else q[1:])
        if len(pts)<2:raise ValueError('empty subpath')
        closed=bool(re.search(r"[zZ]\s*$",raw))
        reduced=rdp(pts,epsilon*.79)
        if closed:
            if len(reduced)<4:raise ValueError('would collapse ring')
            a,b=area(pts[:-1]),area(reduced[:-1])
            if a*b<=0 or abs(a-b)>max(abs(a)*max_area_error,epsilon**2):raise ValueError('area/winding guard')
        fmt=lambda z:f'{z.real:.{precision}f}'.rstrip('0').rstrip('.')+','+f'{z.imag:.{precision}f}'.rstrip('0').rstrip('.')
        out.append('M'+fmt(reduced[0])+'L'+' '.join(fmt(z) for z in reduced[1:]))
        if closed:out[-1]+='Z'
        after+=len(reduced)-1
    result=' '.join(out)
    if after>=before or len(result)>=len(d):raise ValueError('not smaller')
    return result,before,after

def canonical_subpaths(d):
    """Absolute lexical subpaths, retaining explicit M and Z semantics.

    parse_path alone merges coincident moves. Split lexically first, but pass
    each original endpoint as current_pos so relative m remains correct.
    Nonterminal Z remains fail-closed (stroke semantics are not normalized).
    """
    if not re.match(r"^\s*[Mm]",d):raise ValueError('path must begin with moveto')
    chunks=re.findall(r'[Mm][^Mm]*',d); out=[];cursor=0j
    for raw in chunks:
        if re.search(r"[zZ].*\S",raw.rstrip()[:-1]):raise ValueError('nonterminal close preserved')
        nums=re.findall(NUMBER,raw[1:])
        if len(nums)<2:raise ValueError('invalid moveto')
        start=complex(float(nums[0]),float(nums[1]))+(cursor if raw[0]=='m' else 0j)
        sub=parse_path(raw,current_pos=cursor)
        closed=bool(re.search(r'[zZ]\s*$',raw))
        if len(sub):
            canonical=sub.d(use_closed_attrib=False)+(' Z' if closed else '')
            cursor=start if closed else sub[-1].end
        else:
            canonical=f'M{start.real},{start.imag}'+('Z' if closed else '')
            cursor=start
        out.append(canonical)
    return out

def simplify(d,epsilon,precision=6,max_area_error=.02):
    # A compound color path can contain thousands of independent islands. Keep
    # any unsafe island unchanged rather than discarding every safe reduction.
    precision=max(1,math.ceil(math.log10(math.sqrt(.5)/(.01*epsilon))))
    chunks=canonical_subpaths(d);result=[]
    for chunk in chunks:
        best=chunk; best_count=count(chunk)
        # Don't retain a detailed small ring just because global epsilon collapses it.
        # Search smaller per-ring budgets while keeping the same outer error cap.
        for divisor in (1,2,4,8,16,32):
            try:
                candidate,_,nc=_simplify(chunk,epsilon/divisor,precision,max_area_error)
                if nc<best_count and len(candidate)<len(best):best=candidate;best_count=nc
            except (ValueError,AssertionError):pass
        result.append(best)
    joined=' '.join(result);a=count(d);b=count(joined)
    if b>=a or len(joined)>=len(d):raise ValueError('not smaller/guarded')
    return joined,a,b

def render(svg,png,width):
    subprocess.run(['inkscape',str(svg),'--export-type=png','--export-background-opacity=0',f'--export-width={width}',f'--export-filename={png}'],capture_output=True,check=True)

def image_diff(a,b):
    x=np.asarray(Image.open(a).convert('RGBA'),dtype=np.float32)/255
    y=np.asarray(Image.open(b).convert('RGBA'),dtype=np.float32)/255
    if x.shape!=y.shape:raise ValueError('render dimension changed')
    # Premultiplied RGB + alpha avoids counting hidden RGB in transparent pixels.
    x[:,:,:3]*=x[:,:,3:4];y[:,:,:3]*=y[:,:,3:4]
    delta=np.abs(x-y)
    return {'mean_channel_error':float(delta.mean()),'changed_pixel_fraction':float((delta.max(2)>16/255).mean()),'max_channel_error':float(delta.max())}

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('input',type=Path);ap.add_argument('output',type=Path)
    ap.add_argument('--epsilon',type=float,default=.5,help='Maximum geometric error in root viewBox units (NOT screen px)')
    ap.add_argument('--protect-id-regex',default=PROTECT)
    ap.add_argument('--render-widths',default='1280,2560')
    ap.add_argument('--max-mean-error',type=float,default=.002)
    ap.add_argument('--max-changed-fraction',type=float,default=.01)
    args=ap.parse_args()
    if args.input.resolve()==args.output.resolve():ap.error('input/output must differ')
    if args.output.exists():ap.error('output exists; refusing overwrite')
    if not math.isfinite(args.epsilon) or args.epsilon<.0001:ap.error('epsilon must be finite and >=0.0001')
    original=args.input.read_bytes()
    if b'<!DOCTYPE' in original or b'<!ENTITY' in original:ap.error('external XML entities/DOCTYPE not accepted')
    root=ET.fromstring(original); protected=re.compile(args.protect_id_regex)
    report={'input':str(args.input),'input_sha256':hashlib.sha256(original).hexdigest(),'epsilon_viewbox_units':args.epsilon,'changed_paths':0,'segments_before':0,'segments_after':0,'skips':{},'render_checks':[]}
    def skip(reason):report['skips'][reason]=report['skips'].get(reason,0)+1
    unsafe={'clipPath','mask','defs','symbol','marker','pattern'}
    has_css=any(e.tag.split('}')[-1]=='style' for e in root.iter())
    def walk(e,blocked=False):
        tag=e.tag.split('}')[-1]
        block=blocked or tag in unsafe or bool(e.get('transform')) or bool(protected.search(e.get('id',''))) or e.get('data-preserve')=='true'
        style=';'.join([e.get('style','')]+[k+':'+v for k,v in e.attrib.items()])
        block=block or bool(re.search(r'(clip-path|mask:|filter:|marker-|stroke-dash|pathLength|vector-effect)',style))
        if tag=='path' and e.get('d'):
            d=e.get('d')
            try:n=count(d)
            except Exception:skip('parse');n=0
            report['segments_before']+=n;report['segments_after']+=n
            if block or has_css:skip('protected/transform/effect/css')
            else:
                try:
                    replacement,before,after=simplify(d,args.epsilon)
                    e.set('d',replacement);report['changed_paths']+=1;report['segments_after']+=after-before
                except (ValueError,AssertionError) as exc:skip(str(exc))
        for c in e:walk(c,block)
    walk(root)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        td=Path(td);candidate=td/'candidate.svg';candidate.write_bytes(ET.tostring(root,encoding='utf-8',xml_declaration=True))
        accepted=True
        for width in map(int,args.render_widths.split(',')):
            a,b=td/f'a{width}.png',td/f'b{width}.png'
            render(args.input,a,width);render(candidate,b,width)
            diff=image_diff(a,b);diff['width']=width
            diff['accepted']=diff['mean_channel_error']<=args.max_mean_error and diff['changed_pixel_fraction']<=args.max_changed_fraction
            accepted &= diff['accepted'];report['render_checks'].append(diff)
        report['accepted']=bool(accepted)
        report['candidate_bytes']=candidate.stat().st_size;report['original_bytes']=len(original)
        if accepted and report['candidate_bytes']<len(original):args.output.write_bytes(candidate.read_bytes())
        else:
            report['accepted']=False;report['reason']='raster gate or byte size failed; output is unchanged original'
            args.output.write_bytes(original)
    report['output_sha256']=hashlib.sha256(args.output.read_bytes()).hexdigest()
    report['input_unchanged']=hashlib.sha256(args.input.read_bytes()).hexdigest()==report['input_sha256']
    args.output.with_suffix(args.output.suffix+'.report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
if __name__=='__main__':main()
