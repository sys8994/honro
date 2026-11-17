"""Strict build-time adapter for the reviewed Stage7 SVG subset. No runtime/parser extension."""
import copy,json,re,hashlib,xml.etree.ElementTree as E
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
P=Path(__file__).parent
# CI reads authoritative repository inputs, never rewrites them.
def tag(e):return e.tag.rsplit('}',1)[-1]
def numbers(s):return [float(x) for x in re.split(r'[ ,]+',s.strip()) if x]
def transform(s):
 m=re.fullmatch(r'(matrix|translate|scale)\(([^)]+)\)',s);assert m,s
 v=numbers(m[2]);k=m[1]
 if k=='matrix':assert len(v)==6;return v
 if k=='translate':assert len(v) in (1,2);return [1,0,0,1,v[0],v[1] if len(v)==2 else 0]
 assert len(v) in (1,2);return [v[0],0,0,v[-1],0,0]
def source_node(n):
 r=copy.deepcopy(n)
 if 'sourcePath' in r:
  d=r.pop('sourcePath');assert len(d)<=60000,'Use existing preserveCompound if original source changes';r['d']=d
 if 'children' in r:r['children']=[source_node(c) for c in r['children']]
 return r

def transparent_groups(n):
 r=copy.deepcopy(n)
 if r.get('tag')=='g':
  kids=[]
  for c in r['children']:
   c=transparent_groups(c)
   if set(c)=={'tag','children'} and c['tag']=='g':kids.extend(c['children'])
   else:kids.append(c)
  r['children']=kids
  if set(r)=={'tag','children'} and len(kids)==1:return kids[0]
 return r

def compile_svg(text,original_source):
 doc=E.fromstring(text);ids={e.get('id'):e for e in doc.iter() if e.get('id')};clips={};symbols={};resolving=set();dead=[]
 def path_rect(e):
  if tag(e)=='path':return e.attrib['d']
  assert tag(e)=='rect' and not e.get('rx') and not e.get('ry')
  x,y,w,h=[float(e.get(k,'0')) for k in ['x','y','width','height']];return f'M{x:g} {y:g}H{x+w:g}V{y+h:g}H{x:g}Z'
 def getclip(value):
  m=re.fullmatch(r'url\(#([^)]+)\)',value);assert m,value
  key=m[1]
  if key not in clips:
   e=ids[key];assert tag(e)=='clipPath' and e.get('clipPathUnits','userSpaceOnUse')=='userSpaceOnUse'
   assert set(e.attrib)<={'id','clipPathUnits','clip-rule'},'Unsupported clipPath attribute'
   assert len(e)==1,'Multiple clip children have SVG union semantics; never join winding paths blindly'
   assert e.get('clip-rule','nonzero')=='nonzero','Evenodd clip rule is not the renderer clip rule'
   clips[key]=[]
   for c in e:
    assert not c.get('transform') and c.get('clip-rule','nonzero')=='nonzero'
    allowed={'id','d','fill','style','clip-rule'} if tag(c)=='path' else {'id','x','y','width','height','clip-rule'}
    assert set(c.attrib)<=allowed,'Unsupported clip child attribute'
    assert not c.get('style') or re.fullmatch(r'fill:#[0-9a-fA-F]{6};?',c.get('style')),'Unsupported clip child style'
    clips[key].append(path_rect(c))
  return key
 def walk(e,top=False):
  t=tag(e)
  if t=='defs':return None
  assert t in ('svg','g','path','use','rect'),f'Unsupported reachable element {t}'
  allowed={'id','fill','stroke','opacity','style','stroke-width','stroke-linejoin','stroke-linecap','fill-rule','clip-path','transform'}
  allowed |= {'svg':{'width','height','viewBox','version','x','y','preserveAspectRatio'},'g':set(),'path':{'d'},'rect':{'x','y','width','height'},'use':{'href','{http://www.w3.org/1999/xlink}href'}}[t]
  assert set(e.attrib)<=allowed,f'Unsupported reachable attributes: {set(e.attrib)-allowed}'
  if t=='svg' and top:
   assert float(e.get('x','0'))==0 and float(e.get('y','0'))==0
   assert e.get('preserveAspectRatio','xMidYMid meet')=='xMidYMid meet'

  for attr in ['mask','filter','mix-blend-mode','vector-effect','stroke-dasharray']:
   assert attr not in e.attrib,f'Unsupported reachable {attr}'
  st={}
  for item in e.get('style','').split(';'):
   if item.strip():k,v=item.split(':',1);st[k.strip()]=v.strip()
  known={'fill':'fill','stroke':'stroke','opacity':'opacity','stroke-width':'lineWidth','stroke-linejoin':'lineJoin','stroke-linecap':'lineCap','fill-rule':'fillRule'}
  assert not(set(st)-set(known)),st
  for key in known:
   if e.get(key) is not None:st[key]=e.get(key)
  n={known[k]:float(v) if k in ('opacity','stroke-width') else v for k,v in st.items()}
  if e.get('transform'):n['transform']=transform(e.get('transform'))
  if e.get('clip-path'):n['clipPath']=getclip(e.get('clip-path'))
  if t in ('path','rect'):n.update(tag='path',d=path_rect(e));return n
  if t=='use':
   key=(e.get('href') or e.get('{http://www.w3.org/1999/xlink}href') or '')
   assert key.startswith('#');key=key[1:]
   assert key not in resolving,'cyclic use'
   if key not in symbols:
    resolving.add(key);symbols[key]=walk(ids[key]);resolving.remove(key)
    if key=='original-body-source':
     # Original foreground must be identical to the existing native vector, not reauthored.
     assert transparent_groups(symbols[key])==transparent_groups(original_source),'Original SVG source differs beyond identity group wrappers'
     symbols[key]=copy.deepcopy(original_source)
   n.update(tag='use',symbol=key);return n
  n.update(tag='g',children=[q for c in e if (q:=walk(c)) is not None])
  if t=='svg' and not top:
   assert e.get('preserveAspectRatio')=='none' and not e.get('transform')
   vx,vy,vw,vh=numbers(e.get('viewBox'));w,h=float(e.get('width')),float(e.get('height'));x,y=float(e.get('x','0')),float(e.get('y','0'));sx,sy=w/vw,h/vh
   cid='native-nested-viewport';assert cid not in clips;clips[cid]=[f'M{vx:g} {vy:g}H{vx+vw:g}V{vy+vh:g}H{vx:g}Z']
   n={'tag':'g','transform':[sx,0,0,sy,x-vx*sx,y-vy*sy],'clipPath':cid,'children':[n]}
  return n
 root=walk(doc,True)
 # Include exact original clip definitions. All referenced originals must match the SVG export.
 out={'version':1,'viewBox':numbers(doc.get('viewBox')),'root':root,'clips':clips,'symbols':symbols}
 return out

def main():
 import argparse
 a=argparse.ArgumentParser();a.add_argument('--repository',type=Path,default=ROOT);a.add_argument('--input-dir',type=Path);a.add_argument('--output',type=Path,default=P/'generated');args=a.parse_args()
 repo=args.repository;inputs=args.input_dir or repo/'game/tools/stage7-svg-study';src=repo/'shared/assets/environment/act1-sites/stage07.json';data=json.loads(src.read_text());original=source_node(data['art']['body']['vector']['root']);args.output.mkdir(parents=True,exist_ok=True)
 report={'scope':'Direct actual HonroVectorArt renderer study, NOT HonroScene/campaign/deployment','authoritativeSourceSHA256':hashlib.sha256(src.read_bytes()).hexdigest(),'originalBodySHA256':data['art']['body']['sha256'],'sourceSymbolUnchanged':True,'physicsDataWritten':False,'assets':{}}
 assets={}
 for kind,file in [('original','original.svg'),('candidate','candidate.svg')]:
  text=(inputs/file).read_text();v=compile_svg(text,original)
  for key,value in data['art']['body']['vector'].get('clips',{}).items():assert v['clips'][key]==value
  assets[kind]={'id':'stage7-vector-study-'+kind,'anchor':{'x':0,'y':0},'bounds':{'x':-1200,'y':0,'w':3848,'h':3600},'params':{'semanticLayer':'BODY','silhouetteUnderpaint':False},'collision':[],'vector':v}
  output=args.output/(kind+'.json');output.write_text(json.dumps(assets[kind],separators=(',',':')));report['assets'][kind]={'bytes':output.stat().st_size,'inputSvgSHA256':hashlib.sha256(text.encode()).hexdigest(),'jsonSHA256':hashlib.sha256(output.read_bytes()).hexdigest()}
 # All 13 authored cap trees and their clips must match baseline exactly.
 def caps(v):
  out={}
  def visit(n):
   if n.get('clipPath','').startswith('cap-'):out[n['clipPath']]=n
   for c in n.get('children',[]):visit(c)
  visit(v['root']);return out
 oc,cc=caps(assets['original']['vector']),caps(assets['candidate']['vector']);assert len(oc)==13 and oc==cc
 for k in oc:assert assets['original']['vector']['clips'][k]==assets['candidate']['vector']['clips'][k]
 report['authoredFootholdsUnchanged']=13
 (args.output/'conversion-contract.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
if __name__=='__main__':main()
