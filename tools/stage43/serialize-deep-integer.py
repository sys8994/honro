from pathlib import Path
import json,re,hashlib,copy,sys
from svgpathtools import parse_path,Line,CubicBezier,QuadraticBezier
# Usage: python tools/stage43/serialize-deep-integer.py PRESERVED_INPUT.json OUTPUT_DIRECTORY
# Requires svgpathtools. Does not modify the input.
P=Path(sys.argv[2]).resolve();P.mkdir(parents=True,exist_ok=True);src=Path(sys.argv[1]).resolve(); a=json.loads(src.read_text()); rows=[]
def pt(z):return (round(z.real*10),round(z.imag*10))
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def fmt(v):
 return str(v)
def nums(v):
 out=''; prev=''
 for n in v:
  s=fmt(n)
  if out and not s.startswith('-') and not(s.startswith('.') and '.' in prev):out+=' '
  out+=s;prev=s
 return out

def ser(d):
 result=''; current=(0,0); oldcmd=''; prevcontrol=None
 for part in re.findall('[Mm][^Mm]*',d):
  q=parse_path(part); start=pt(q[0].start); close=bool(re.search('[zZ]\\s*$',part)); seq=list(q)
  if close and isinstance(seq[-1],Line) and pt(seq[-1].end)==start:seq=seq[:-1]
  # Absolute start keeps original subpath registration independent.
  mov=min(['M'+nums(start),'m'+nums(sub(start,current))],key=len)
  result+=mov; current=start;oldcmd=mov[0];prevcontrol=None
  for seg in seq:
   end=pt(seg.end); delta=sub(end,current); opts=[]
   if isinstance(seg,Line):
    opts=[('l',delta),('L',end)]
    if delta[0]==0:opts += [('v',(delta[1],)),('V',(end[1],))]
    if delta[1]==0:opts += [('h',(delta[0],)),('H',(end[0],))]
   elif isinstance(seg,CubicBezier):
    c1,c2=pt(seg.control1),pt(seg.control2)
    opts=[('c',sub(c1,current)+sub(c2,current)+delta),('C',c1+c2+end)]
    if prevcontrol is not None and c1==tuple(2*x-y for x,y in zip(current,prevcontrol)):opts += [('s',sub(c2,current)+delta),('S',c2+end)]
   elif isinstance(seg,QuadraticBezier):opts=[('q',sub(pt(seg.control),current)+delta),('Q',pt(seg.control)+end)]
   else:raise ValueError(type(seg))
   def encoded(o):
    cmd,v=o; ns=nums(v)
    if cmd!=oldcmd:return cmd+ns
    # separator from preceding number (the endpoint's final number)
    last=re.search(r'[-+]?(?:\d*\.\d+|\d+)$',result[-40:]).group()
    return ('' if ns.startswith('-') or ns.startswith('.') and '.' in last else ' ')+ns
   best=min(opts,key=lambda o:len(encoded(o)));result+=encoded(best);oldcmd=best[0];current=end;prevcontrol=pt(seg.control2) if isinstance(seg,CubicBezier) else None
  if close:result+='z';oldcmd='z';current=start
 return result

def visit(n):
 if n.get('tag')=='path':
  key='dParts' if 'dParts'in n else 'd'; ds=n[key] if key=='dParts' else [n[key]]; out=[]
  for d in ds:
   nd=ser(d); before=parse_path(d);after=parse_path(nd).scaled(.1)
   assert len(before)==len(after),(len(before),len(after))
   err=0
   for s,t in zip(before,after):
    assert type(s)==type(t)
    for k in ['start','end','control1','control2','control']:
     if hasattr(s,k):err=max(err,abs(getattr(s,k)-getattr(t,k)))
   assert err<1e-8,err
   assert len(re.findall('[Mm]',d))==len(re.findall('[Mm]',nd))
   out.append(nd);rows.append({'before':len(d),'after':len(nd),'segments':len(before),'maxFloatControlError':err})
  n[key]=out if key=='dParts' else out[0]
  assert 'transform' not in n
  n['transform']=[.1,0,0,.1,0,0]
 for c in n.get('children',[]):visit(c)
visit(a['vector']['root']); dst=P/'asset-integer.json';dst.write_text(json.dumps(a,separators=(',',':'))+'\n');report={'input':str(src),'inputSHA256':hashlib.sha256(src.read_bytes()).hexdigest(),'outputSHA256':hashlib.sha256(dst.read_bytes()).hexdigest(),'inputBytes':src.stat().st_size,'outputBytes':dst.stat().st_size,'parts':rows};(P/'report-integer.json').write_text(json.dumps(report,indent=2));print(report['inputBytes'],report['outputBytes'])
