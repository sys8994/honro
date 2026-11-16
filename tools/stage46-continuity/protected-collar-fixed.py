"""Native Inkscape protection collar from original stage46 silhouette.
Exclude frame closure edges, preserve authored inner boundaries and visible
warm contact/ornament planes. Outputs diagnostic masks only, never runtime.
"""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Path as SP,Line
import json,os,subprocess,hashlib,re

R=Path(__file__).resolve().parents[2];O=R/'_local/stage46/collar-fixed';O.mkdir(exist_ok=True)
source=R/'_local/stage46/source.json';raw=source.read_bytes();v=json.loads(raw)['vector'];NS='http://www.w3.org/2000/svg';env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'}
def absolute_start(d):
 number=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
 m=re.match(r'^\s*m\s*('+number+r')[\s,]*('+number+r')(.*)$',d,re.S)
 if not m:return d
 rest=m[3];tail=rest.lstrip(' ,\t\r\n')
 # Extra coordinate pairs following lowercase m are implicit relative l.
 return 'M'+m[1]+','+m[2]+(' l' if tail and tail[0] not in 'AaCcHhLlMmQqSsTtVvZz' else ' ')+rest


def join(paths):return ' '.join(absolute_start(d) for d in paths)
lines=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {terrain} from './shared/data/act5/terrain.mjs';console.log(JSON.stringify(terrain[5].lines))"],cwd=R,text=True))
contact=[(min(a[0],b[0])-12,max(a[0],b[0])+12,min(a[1],b[1])-12,max(a[1],b[1])+12) for _,ps in lines for a,b in zip(ps,ps[1:])]
def touches(bounds,regions):
 return any(bounds[0]<=r[1] and bounds[1]>=r[0] and bounds[2]<=r[3] and bounds[3]>=r[2] for r in regions)
def root():return E.Element('svg',xmlns=NS,viewBox='0 0 1024 1536')
def path(r,id,d,**kw):return E.SubElement(r,'path',id=id,d=d,**kw)
def action(name,r,actions):
 inp=O/(name+'-input.svg');out=O/(name+'.svg');E.ElementTree(r).write(str(inp));p=subprocess.run(['/usr/bin/inkscape',str(inp),'--batch-process','--actions='+actions+f';select-clear;export-plain-svg;export-filename:{out};export-do'],env=env,capture_output=True,text=True);(O/(name+'.log')).write_text(p.stdout+p.stderr);p.check_returncode();return[e.get('d')for e in E.parse(str(out)).findall('.//{*}path')]
def native_union(name,ds):
 if len(ds)<2:return ds
 rr=root()
 for i,d in enumerate(ds):path(rr,'u'+str(i),d)
 return action(name,rr,'select-all;path-union')
def boolean(name,a,b,op):
 a=native_union(name+'-union-a',a);b=native_union(name+'-union-b',b)
 r=root();path(r,'a',join(a));path(r,'b',join(b));return action(name,r,'select-by-id:a,b;path-'+op)
report={'strokeWidth':32,'insideNominalWidth':16,'excluded':{},'sourceSha256':hashlib.sha256(raw).hexdigest(),'scope':'Diagnostic protection only; original source and runtime unchanged'}
results={};clean_results={}
for gi,key in enumerate(['a','b']):
 src=parse_path(join(v['clips'][key]));chains=[];chain=[];excluded=[]
 for i,s in enumerate(src):
  frame=isinstance(s,Line) and ((abs(s.start.real)<1e-7 and abs(s.end.real)<1e-7) or(abs(s.start.real-1024)<1e-7 and abs(s.end.real-1024)<1e-7)or(min(s.start.imag,s.end.imag)>=1535.49))
  if frame:
   excluded.append(i)
   if chain:chains.append(SP(*chain).d());chain=[]
  else:
   if chain and abs(chain[-1].end-s.start)>1e-7:chains.append(SP(*chain).d());chain=[]
   chain.append(s)
 if chain:chains.append(SP(*chain).d())
 report['excluded'][key]=excluded
 r=root()
 for i,d in enumerate(chains):path(r,'s'+str(i),d,fill='none',stroke='#ffffff',**{'stroke-width':'32','stroke-linejoin':'round','stroke-linecap':'round'})
 stroke=action(key+'-stroke',r,'select-all;object-stroke-to-path;select-all;object-ungroup;select-all;path-union')
 collar=boolean(key+'-collar',stroke,v['clips'][key],'intersection')
 nodes=v['root']['children'][gi]['children'];warm=[1,2,7,11]if gi==0 else[1,2,3,5,13];visible=[];gold=[]
 for i in warm:
  # Behind/overpaint is removed first. Raw warm paths are nested color masses,
  # not props-only shapes; using them directly would protect the whole rock.
  d=boolean(key+'-visible-'+str(i),[nodes[i]['d']],[n['d']for n in nodes[i+1:]],'difference')
  visible.extend(d)
  if i in ([1,2] if gi==0 else [1,2,3]):gold.extend(d)
 warmclip=boolean(key+'-visible-warm',visible,v['clips'][key],'intersection')
 # Brown geology also exists: protect brown only in actual ornament ROIs;
 # gold is already close to authored silhouette and must keep its support.
 r=root();path(r,'collar',join(collar));path(r,'warm',join(warmclip));full=action(key+'-warm-protected',r,'select-all;path-union')
 results[key]=full
 # Clean alternative keeps complete source silhouettes around real props;
 # all ledge/contact faces retain the same 16px inner support collar.
 roi=('M0 225H165V400H0Z M180 330H270V400H180Z' if gi==0 else 'M860 425H945V500H860Z M958 360H1024V387H958Z')
 feature=boolean(key+'-feature-protection',v['clips'][key],[roi],'intersection')
 goldclip=boolean(key+'-visible-gold',gold,v['clips'][key],'intersection')
 allowed=contact+([(0,165,225,400)] if gi==0 else [(860,945,425,500)])
 goldclip=[q.d() for dd in goldclip for q in parse_path(dd).continuous_subpaths() if touches(q.bbox(),allowed)]
 support_curves=[q.d() for dd in goldclip for q in parse_path(dd).continuous_subpaths() if (q.bbox()[1]-q.bbox()[0])*(q.bbox()[3]-q.bbox()[2])>=20]
 gr=root();path(gr,'gold',join(support_curves),fill='white',stroke='white',**{'stroke-width':'16','stroke-linejoin':'round','stroke-linecap':'round'})
 gs=action(key+'-gold-support-stroke',gr,'select-all;object-stroke-to-path;select-all;object-ungroup;select-all;path-union')
 support=boolean(key+'-gold-support',gs,v['clips'][key],'intersection')
 roadroot=root()
 for ri,(_,points) in enumerate(lines):path(roadroot,'road'+str(ri),'M'+'L'.join(str(x)+','+str(y) for x,y in points),fill='none',stroke='white',**{'stroke-width':'32','stroke-linejoin':'round','stroke-linecap':'round'})
 roads=action(key+'-road-support-stroke',roadroot,'select-all;object-stroke-to-path;select-all;path-union')
 roadclip=boolean(key+'-road-support',roads,v['clips'][key],'intersection')
 rr=root();path(rr,'road',join(roadclip));path(rr,'collar',join(collar));path(rr,'feature',join(feature));path(rr,'gold',join(support+goldclip));clean_results[key]=action(key+'-protected',rr,'select-all;path-union')
r=root()
for k,d in results.items():path(r,k,join(d),fill='white')
allmask=action('protected-union',r,'select-all;path-union')
rr=root()
for k,dd in clean_results.items():path(rr,k,join(dd))
action('clean-protected-union',rr,'select-all;path-union')
for name in ['a-protected','b-protected','protected-union','clean-protected-union']:
 subprocess.run(['/usr/bin/inkscape',str(O/(name+'.svg')),'--export-width=1024','--export-background-opacity=0','--export-filename='+str(O/(name+'.png'))],env=env,capture_output=True,check=True)
assert source.read_bytes()==raw
report['pathCounts']={k:len(d) for k,d in clean_results.items()};report['maxPathCharacters']={k:max(map(len,d),default=0)for k,d in clean_results.items()};report['warning']='Raw native diagnostic masks; verify budgets before runtime. stroke32 protects16px inward; goldstroke16 protects8px inward. Gold components under20sqpx bounding box keep exact fill without expanded support.'
report['goldSupportStrokeWidth']=16
report['fix']='Independent path relative initial m normalized to absolute M before concatenation. Native stroke groups ungrouped and unioned before intersection. Gold components retained only within12px of source collision lines or protected source feature ROI.'
report['cleanOutputs']=['a-protected.svg','b-protected.svg','protected.json']
(O/'clean-protected.json').write_text(json.dumps(clean_results,separators=(',',':'))+'\n')
(O/'protected.json').write_text(json.dumps(clean_results,separators=(',',':'))+'\n');(O/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
