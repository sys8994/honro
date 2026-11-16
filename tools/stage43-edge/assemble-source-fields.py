#!/usr/bin/env python3
"""Assemble existing traced rock fields; native Boolean, no runtime changes.

Inputs remain immutable. Run from any cwd; outputs default beside the checkout.
Subpaths/closure survive mapping. Seam protrusions are whole native filled rings,
never invented polygons. Structural success is not art/gameplay approval.
"""
from pathlib import Path
import argparse, copy, hashlib, json, math, os, re, subprocess
from lxml import etree as E
from svgpathtools import parse_path, Line
NS='{http://www.w3.org/2000/svg}'
ROOT=Path(__file__).resolve().parents[2]
PALETTE=['#939ba7','#778394','#687588','#657184','#4f5d71','#37475c','#25364a','#162332','#8c9242','#545c30']
VB='-1600 0 5372 5300'
def rgb(c):return tuple(int(c[i:i+2],16) for i in (1,3,5))
def palette(c):
 a=rgb(c)
 if min(a)>220 and max(a)-min(a)<24:return '#25364a',True
 return min(PALETTE,key=lambda p:sum((a[i]-rgb(p)[i])**2 for i in range(3))),False

def root():return E.Element(NS+'svg',nsmap={None:NS[1:-1]},viewBox=VB,width='5372',height='5300')
def path(r,d,ident,fill='#000000'):return E.SubElement(r,NS+'path',id=ident,d=d,style='fill:'+fill+';fill-rule:nonzero;stroke:none')
def chunks(d):
 cursor=0j
 for raw in re.findall(r'[Mm][^Mm]*',d):
  p=parse_path(raw,current_pos=cursor)
  if not p:continue
  closed=bool(re.search(r'[zZ]\s*$',raw))
  cursor=p[0].start if closed else p[-1].end
  yield p,closed

def mapper(name):
 s=2172/1254 if name=='center' else 1740/1254
 k=(5300-(710+s*(1254-420)))/(554**2) if name=='center' else (5300-s*1254)/(554**2)
 def f(z):
  x=z.real*s+(0 if name=='center' else -1600 if name=='left' else 2032)
  y=(710+s*(z.imag-420) if name=='center' else s*z.imag)+k*max(z.imag-700,0)**2
  return complex(x,y)
 return f

def map_ring(p,closed,f):
 points=[f(p[0].start)]
 def add(seg,a,b,depth=0):
  za=seg.start if a==0 else seg.point(a);zb=seg.end if b==1 else seg.point(b)
  u,v=f(za),f(zb);m=(a+b)/2; q=f(seg.point(m))
  # Quarter tests also catch cubic inflections; bound non-linear mapping error.
  err=max(abs(q-(u+v)/2),abs(f(seg.point((3*a+b)/4))-(3*u+v)/4),abs(f(seg.point((a+3*b)/4))-(u+3*v)/4))
  if err>.12 and depth<18:add(seg,a,m,depth+1);add(seg,m,b,depth+1)
  else:points.append(v)
 for seg in p:add(seg,0,1)
 if closed:points[-1]=points[0]
 fmt=lambda z:f'{z.real:.3f},{z.imag:.3f}'
 d='M'+fmt(points[0])+'L'+' '.join(fmt(z) for z in points[1:])+('Z' if closed else '')
 area=sum(a.real*b.imag-b.real*a.imag for a,b in zip(points,points[1:]))/2
 box=(min(z.real for z in points),max(z.real for z in points),min(z.imag for z in points),max(z.imag for z in points))
 return {'d':d,'area':area,'box':box,'closed':closed,'points':points}

def contains(r,z):
 pts=r['points'];inside=False
 for a,b in zip(pts,pts[1:]):
  if (a.imag>z.imag)!=(b.imag>z.imag) and z.real<(b.real-a.real)*(z.imag-a.imag)/(b.imag-a.imag)+a.real:inside=not inside
 return inside

def fill(e):
 m=re.search(r'(?:^|;)\s*fill\s*:\s*(#[0-9a-fA-F]{6})',e.get('style',''))
 c=m.group(1) if m else e.get('fill')
 if not c or not re.fullmatch('#[0-9a-fA-F]{6}',c):raise ValueError('Expected explicit six-digit fill')
 return c.lower()

def load_mapped(src,name,iscolor):
 t=E.parse(str(src));assert t.getroot().get('viewBox')=='0 0 1254 1254',(src,'unexpected input coordinates')
 assert not t.findall('.//'+NS+'image')
 for e in t.iter():assert not e.get('transform'),(src,'unresolved transform')
 f=mapper(name);r=root();rings=[];maps={}
 for i,e in enumerate(t.findall('.//'+NS+'path')):
  mapped=[map_ring(p,c,f) for p,c in chunks(e.get('d'))];assert all(q['closed'] for q in mapped),'Open fill subpath'
  c,white=palette(fill(e)) if iscolor else ('#000000',False)
  if iscolor:maps[fill(e)]=c
  node=path(r,' '.join(q['d'] for q in mapped),f'{name}-{i}',c)
  node.set('data-matte','true' if white else 'false')
  if iscolor and not white and mapped:
   sign=1 if max(mapped,key=lambda q:abs(q['area']))['area']>0 else -1
   for q in mapped:
    q['outer']=q['area']*sign>0
    q['siblings']=mapped
    rings.append(q)
 return r,rings,maps

def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--output',type=Path,default=ROOT.parent/'stage43-source-fields-v3');args=ap.parse_args();out=args.output.resolve()
 dirs={'center':ROOT.parent/'stage43-trace-deep-corrected','left':ROOT.parent/'stage43-trace-side-left-corrected','right':ROOT.parent/'stage43-trace-side-right-corrected'}
 inputs=[p/f'{kind}-field-preopt.svg' for p in dirs.values() for kind in ('color','alpha')]
 missing=[str(p) for p in inputs if not p.exists()]
 if missing:raise SystemExit('Inputs not ready: '+', '.join(missing))
 out.mkdir(parents=True,exist_ok=True)
 if (out/'report.json').exists():raise SystemExit('Output already completed; use a new output directory')
 env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(out/'inkscape-profile')}
 hashes={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in inputs};report={'inputs':hashes,'palette':PALETTE,'fields':{},'status':'native structure only; pending Scene/art review'}
 def boolean(r,acts,stem,allow_empty=False):
  src=out/f'{stem}-input.svg';dest=out/f'{stem}.svg';E.ElementTree(r).write(str(src),xml_declaration=True,encoding='utf-8')
  acts+=['select-clear','export-plain-svg',f'export-filename:{dest}','export-do']
  p=subprocess.run(['inkscape',str(src),'--batch-process','--actions='+';'.join(acts)],env=env,capture_output=True,text=True,timeout=600)
  (out/f'{stem}.log').write_text(p.stdout+'\n'+p.stderr);p.check_returncode();t=E.parse(str(dest))
  assert (allow_empty or t.findall('.//'+NS+'path')) and not t.findall('.//'+NS+'image'),stem
  assert not t.findall('.//'+NS+'clipPath'),stem
  return t
 colors=[];alphas=[]
 for name,folder in dirs.items():
  cr,rings,pm=load_mapped(folder/'color-field-preopt.svg',name,True);ar,_,_=load_mapped(folder/'alpha-field-preopt.svg',name,False)
  full_alpha=' '.join(p.get('d') for p in ar.findall('.//'+NS+'path'))
  # Original-alpha constrained base. Only the domain split is rectilinear;
  # actual native rock rings supply the visible lower seam protrusions.
  mask={'center':'M0 710H2172V5300H0Z','left':'M-1600 0H140V710H0V5300H-1600Z','right':'M2032 0H3772V5300H2172V710H2032Z'}[name]
  acts=[]
  for i,p in enumerate(ar.findall('.//'+NS+'path')):
   mid=f'base-mask-{i}';path(ar,mask,mid);acts+=['select-clear',f'select-by-id:{p.get("id")},{mid}','path-intersection']
  alpha=boolean(ar,acts,f'{name}-alpha-base');selected=[]
  if name!='center':
   edge=0 if name=='left' else 2172
   candidates=[]
   for q in rings:
    x0,x1,y0,y1=q['box'];a=abs(q['area'])
    # Permit native rings crossing y710: the upper base already contains them.
    # Opposite-winding holes are only candidates, never assumed solid.
    normal=40<=a<=50000 and x1-x0<=280 and y1-y0<=900
    # Targeted real ring spanning the observed west y750..802 cut: most of
    # its width is OUTSIDE the overlap. This is not a larger runtime budget.
    repair=(name=='left' and 50000<a<60000 and -480<x0<-460 and 45<x1<60 and 665<y0<680 and 930<y1<945)
    if not(x0<edge<x1 and y1>710 and y0>=0 and y1<=5300.001 and (normal or repair)):continue
    q['gapRepair']=repair
    if (name=='left' and x1>140.001) or (name=='right' and x0<2031.999):continue
    candidates.append(q)
   # Prove opacity geometrically, not by ring winding or raster sampling:
   # union every NON-matte native color fill, preserving all its holes, then
   # intersect with source alpha. A hole backed by another actual color is solid;
   # a hole backed only by white/matte/sky is not. No invented bridge geometry.
   opaque=root()
   for i,p in enumerate(cr.findall('.//'+NS+'path')):
    if p.get('data-matte')!='true':path(opaque,p.get('d'),f'opaque-{i}')
   ot=boolean(opaque,['select-all','path-union'],f'{name}-opaque-union')
   od=' '.join(p.get('d') for p in ot.findall('.//'+NS+'path'))
   opaque=root();path(opaque,od,'opaque');path(opaque,full_alpha,'source-alpha')
   ot=boolean(opaque,['select-all','path-intersection'],f'{name}-opaque-source')
   od=' '.join(p.get('d') for p in ot.findall('.//'+NS+'path'))
   rejected=set()
   for start in range(0,len(candidates),16):
    check=root();acts=[]
    for i in range(start,min(start+16,len(candidates))):
     q=candidates[i];path(check,q['d'],f'candidate-{i}');path(check,od,f'coverage-{i}')
     acts+=['select-clear',f'select-by-id:candidate-{i},coverage-{i}','path-difference']
    tested=boolean(check,acts,f'{name}-candidate-uncovered-{start:04d}',allow_empty=True)
    rejected.update(p.get('id') for p in tested.findall('.//'+NS+'path') if p.get('d','').strip())
   selected=[q for i,q in enumerate(candidates) if f'candidate-{i}' not in rejected]
   assert selected,f'{name}: no safe native boundary components; do not silently retain straight seam'
  rr=root()
  for i,p in enumerate(alpha.findall('.//'+NS+'path')):path(rr,p.get('d'),f'a-{i}')
  for i,q in enumerate(selected):path(rr,q['d'],f'rock-{i}')
  alpha=boolean(rr,['select-all','path-union'],f'{name}-alpha-final');ad=' '.join(p.get('d') for p in alpha.findall('.//'+NS+'path'))
  straight=[]
  if name!='center':
   for apath in alpha.findall('.//'+NS+'path'):
    for seg in parse_path(apath.get('d')):
     if isinstance(seg,Line) and abs(seg.start.real-edge)<.02 and abs(seg.end.real-edge)<.02 and max(seg.start.imag,seg.end.imag)>710:
      straight.append([min(seg.start.imag,seg.end.imag),max(seg.start.imag,seg.end.imag)])
  acts=[]
  for i,p in enumerate(cr.findall('.//'+NS+'path')):
   mid=f'final-alpha-{i}';path(cr,ad,mid);acts+=['select-clear',f'select-by-id:{p.get("id")},{mid}','path-intersection']
  col=boolean(cr,acts,f'{name}-color-final');colors.append((name,col));alphas.append(ad)
  report['fields'][name]={'remainingStraightSeamIntervals':straight,'paletteMap':pm,'nativeSeamRings':len(selected),'targetedGapRepairRings':sum(q.get('gapRepair',False) for q in selected),'seamRingBounds':[q['box'] for q in selected],'opaqueHoleRings':sum(not q['outer'] for q in selected),'ringsCrossing710':sum(q['box'][2]<=710<q['box'][3] for q in selected),'opacityProof':'native ring DIFFERENCE (union(non-matte native color) INTERSECTION source alpha) is empty','protectedSourceGeometry':'Inputs immutable; center begins y710; original architecture/walkable source asset and runtime untouched'}
 combined=root()
 for name,t in colors:
  g=E.SubElement(combined,NS+'g',id='field-'+name)
  for i,p in enumerate(t.findall('.//'+NS+'path')):
   p=copy.deepcopy(p);p.set('id',f'{name}-final-{i}');g.append(p)
 E.ElementTree(combined).write(str(out/'color-combined.svg'),xml_declaration=True,encoding='utf-8')
 ar=root()
 for i,d in enumerate(alphas):path(ar,d,f'field-alpha-{i}')
 boolean(ar,['select-all','path-union'],'alpha-combined')
 config={'id':'act5:stage43:foundation','semanticLayer':'BODY','bounds':{'x':-1600,'y':0,'w':5372,'h':5300},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':5300},'preserveCompounds':True}
 (out/'config.json').write_text(json.dumps(config,indent=2))
 for kind in ('color','alpha'):
  file=out/f'{kind}-combined.svg';t=E.parse(str(file));ps=t.findall('.//'+NS+'path');assert not t.findall('.//'+NS+'clipPath') and not t.findall('.//'+NS+'image')
  assert all(not e.get('transform') for e in t.iter())
  b=[parse_path(p.get('d')).bbox() for p in ps];bounds=[min(x[0] for x in b),max(x[1] for x in b),min(x[2] for x in b),max(x[3] for x in b)]
  assert bounds[0]>=-1600.01 and bounds[1]<=3772.01 and bounds[2]>=-.01 and bounds[3]<=5300.01,bounds
  report[kind]={'bytes':file.stat().st_size,'paths':len(ps),'segments':sum(len(parse_path(p.get('d'))) for p in ps),'bounds':bounds,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
 assert all(hashlib.sha256(Path(p).read_bytes()).hexdigest()==h for p,h in hashes.items())
 report['inputsUnchanged']=True;(out/'report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
if __name__=='__main__':main()
