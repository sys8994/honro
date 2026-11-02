#!/usr/bin/env python3
"""Reproduce selected Stage13 bounded candidates from immutable authored world.svg."""
from pathlib import Path
import json,re,math,xml.etree.ElementTree as E
from svgpathtools import parse_path,Line,CubicBezier,QuadraticBezier
import sys
r=Path(sys.argv[1]);N=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
def num(x):return re.sub(r'^(-?)0\.',r'\1.',format(0 if x==0 else x,'.15g'))
def xy(z):return num(round(z.real,6))+','+num(round(z.imag,6))
def ds(z,x,y):
 if x==y:return abs(z-x)
 t=max(0,min(1,((z-x)*(y-x).conjugate()).real/abs(y-x)**2));return abs(z-(x+t*(y-x)))
def mini(d):
 ts=re.findall(r'[MmZzLlHhVvCcSsQqTtAa]|'+N,d);o=[];cmd=None;last=False
 for t in ts:
  if t.isalpha():
   if t not in 'MmZz' and t==cmd:continue
   o.append(t);cmd=t;last=False
  else:
   t=re.sub(r'^(-?)0\.',r'\1.',t)
   if last and not t.startswith(('-','+')):o.append(' ')
   o.append(t);last=True
 return re.sub(r'(\d*\.\d+) (?=\.\d)',r'\1',''.join(o))
from PIL import Image
countsizes={'M':2,'L':2,'H':1,'V':1,'C':6,'Q':4,'S':4,'T':2,'A':7}
def rawSegments(chunk):
 tokens=re.findall(r'[MmZzLlHhVvCcSsQqTtAa]|'+N,chunk);idx=0;cmd=None;segs=[];mov=None;closed=False
 while idx<len(tokens):
  if tokens[idx].isalpha():cmd=tokens[idx];idx+=1
  if cmd in 'zZ':closed=True;cmd=None;continue
  n=countsizes[cmd.upper()];vs=tokens[idx:idx+n];assert len(vs)==n;idx+=n;text=cmd+' '.join(vs)
  if cmd in 'mM':mov=text;cmd='l'if cmd=='m'else'L'
  else:segs.append(text)
 return mov,segs,closed
for name in ['extension-v2','west-v1','middle-v1','east-v1','roof-v2','west-shelves-v1','inner-shelves-v1']:
 epsilon=.5 if name=='extension-v2' else .2
 padpx=64 if 'shelves' in name else 24
 freezeFirst=name in ['extension-v2','west-v1','middle-v1','east-v1']
 p=r/name;tree=E.parse(p/'world.svg');root=tree.getroot();W=float(root.get('width'));cfg=json.loads((p/'pixel-config.json').read_text());scale=cfg['width']/W;lines=[(*a,*b)for q in cfg['protectedPolylines']for a,b in zip(q['points'],q['points'][1:])];lines=[tuple(v/scale for v in q)for q in lines];pad=padpx/scale;counts={'protectedSegments':0,'optimizedSegments':0}
 def protected(s):
  x0,x1,y0,y1=s.bbox();xmin,xmax,ymin,ymax=x0-pad,x1+pad,y0-pad,y1+pad
  for ax,ay,bx,by in lines:
   dx,dy=bx-ax,by-ay;lo,hi=0.,1.;hit=True
   for pp,qq in [(-dx,ax-xmin),(dx,xmax-ax),(-dy,ay-ymin),(dy,ymax-ay)]:
    if pp==0:
     if qq<0:hit=False;break
    elif pp<0:lo=max(lo,qq/pp)
    else:hi=min(hi,qq/pp)
    if lo>hi:hit=False;break
   if hit:return True
  return False
 def rnd(z):return complex(round(z.real,2),round(z.imag,2))
 for ix,e in enumerate([e for e in root.iter()if e.tag.endswith('path')]):
  if ix==0 and freezeFirst:e.set('d',mini(e.get('d')));continue
  output=[];subs=parse_path(e.get('d')).continuous_subpaths();chunks=re.findall(r'[Mm][^Mm]*',e.get('d'));assert len(chunks)==len(subs)
  for subi,(sub,chunk) in enumerate(zip(subs,chunks)):
   # Right-domain canonical-edge coverage: keep whole original contours, not rounded prefixes.
   if name=='extension-v2' and (ix,subi) in [(1,97),(2,0),(2,3),(3,1),(4,0)]:output.append(chunk);continue
   mov,raws,closed=rawSegments(chunk)
   if len(raws)<len(sub):assert len(raws)+1==len(sub)and closed;raws.append('z')
   assert len(raws)==len(sub),(name,len(raws),len(sub))
   mask=[protected(s)for s in sub]
   if name in ['roof-v2','extension-v2']:
    last=max([i for i,k in enumerate(mask)if k],default=-1);mask=[i<=last for i in range(len(sub))]
   start=sub[0].start;current=start;output.append(mov)
   for i,s in enumerate(sub):
    keep=mask[i];counts['protectedSegments'if keep else'optimizedSegments']+=1
    if keep:output.append(raws[i]);current=s.end;continue
    if raws[i]=='z':output.append('z');current=start;continue
    nextkeep=mask[(i+1)%len(sub)];end=s.end if nextkeep else rnd(s.end)
    if i==len(sub)-1 and closed:end=start
    if isinstance(s,CubicBezier):
     kind='c';cs=[s.control1,s.control2];lb=max(ds(s.control1,s.start,s.end),ds(s.control2,s.start,s.end));Q=((3*s.control1-s.start)/2+(3*s.control2-s.end)/2)/2;qb=max(abs(s.control1-(s.start/3+2*Q/3)),abs(s.control2-(s.end/3+2*Q/3)))
     if lb<=epsilon:kind='l';cs=[]
     elif qb<=epsilon:kind='q';cs=[Q]
    elif isinstance(s,QuadraticBezier):kind='q';cs=[s.control]
    elif isinstance(s,Line):kind='l';cs=[]
    else:raise ValueError(type(s))
    cs=[rnd(z)for z in cs]
    if nextkeep:output.append(kind.upper()+' '.join(num(z.real)+','+num(z.imag)for z in cs+[end]))
    else:output.append(kind+' '.join(xy(z-current)for z in cs+[end]))
    current=end
   if closed and output[-1].lower()!='z':output.append('z')
  e.set('d',mini(''.join(output)))
 E.register_namespace('','http://www.w3.org/2000/svg');out=p/'candidate-final.svg';tree.write(out,encoding='utf-8',xml_declaration=True);rep={'sourceBytes':(p/'world.svg').stat().st_size,'outputBytes':out.stat().st_size,'method':'Original command tokens near contacts; floor/roof preserve entire prefix through last protected segment to preserve renderer accumulation. Other cubics replaced only within stated control-hull bound; .01 coordinate grid away from contacts. Strict pixel checks remain mandatory.','epsilonLocalUnits':epsilon,'protectionPadPixels':padpx,'preservedFirstPath':freezeFirst,'counts':counts};(p/'candidate-final.report.json').write_text(json.dumps(rep,indent=2));print(name,rep)
