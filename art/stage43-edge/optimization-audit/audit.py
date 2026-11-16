from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path
import re,json,hashlib,collections
p=Path(__file__).resolve().parent;b=p.parent
metrics=[]
def base(f):
 z=f.read_bytes();return {'file':str(f.relative_to(b)),'bytes':len(z),'sha256':hashlib.sha256(z).hexdigest()}
def svg(f,label):
 r=base(f);r['label']=label;t=E.parse(str(f));paths=t.findall('.//{http://www.w3.org/2000/svg}path');r.update(pathElements=len(paths),basicShapeElements=0,basicShapesByType={},subpaths=0,parsedSegments=0,segmentTypes={},pathChars=0);types=collections.Counter();basic=collections.Counter()
 for q in t.iter():
  tag=E.QName(q).localname
  if tag in ['rect','circle','ellipse','line','polyline','polygon']:basic[tag]+=1
 for q in paths:
  d=q.get('d','');r['subpaths']+=len(re.findall('[Mm]',d));r['pathChars']+=len(d);parsed=parse_path(d);r['parsedSegments']+=len(parsed);types.update(type(s).__name__ for s in parsed)
 r['segmentTypes']=dict(types);r['basicShapesByType']=dict(basic);r['basicShapeElements']=sum(basic.values());r['countSucceeded']=True;metrics.append(r);return r
pairs=[]
for side,folder in [('center','stage43-trace-deep-corrected'),('left','stage43-trace-side-left-corrected'),('right','stage43-trace-side-right-corrected')]:
 a=svg(b/folder/'color-raw.svg',side+' raw');z=svg(b/folder/'color-field-preopt.svg',side+' optimized final')
 ks=['bytes','parsedSegments','subpaths','pathElements','basicShapeElements'];delta={k:z[k]-a[k] for k in ks};pairs.append({'family':side,'stage':'optimizer only, same generated original','input':a['file'],'output':z['file'],'delta':delta,'nonIncreaseAllMetrics':all(v<=0 for v in delta.values())})
 for name,loc in [('filtered',('stage43-whole-registration-study/detail-reduced-120/color-field-filtered.svg' if side=='center' else f'stage43-whole-geology-context-study/{side}-filtered.svg'))]:
  q=svg(b/loc,side+' artistic120filter');pairs.append({'family':side,'stage':'separate artistic detail filter, NOT optimizer','input':z['file'],'output':q['file'],'delta':{k:q[k]-z[k] for k in ks}})
c=b/'stage43-whole-registration-study/detail-reduced-120/compiled-dx0dy0';a=svg(c/'color-raw.svg','center registered prepartition');z=svg(c/'color-partitioned.svg','center standard partition final');pairs.append({'family':'center','stage':'separate standard partition, NOT optimizer','delta':{k:z[k]-a[k] for k in ks},'nonIncreaseAllMetrics':all(z[k]<=a[k] for k in ks)})
asset=json.load(open(c/'asset.json'));r=base(c/'asset.json');r.update(label='center imported JSON final, source absent',runtimeTreeNodes=0,runtimePathNodes=0,pathStrings=0,subpaths=0,parsedSegments=0,pathChars=0,maxPathChars=0)
def walk(q):
 r['runtimeTreeNodes']+=1
 if q.get('tag')=='path':
  r['runtimePathNodes']+=1
  for d in q.get('dParts',[q.get('d','')]):
   r['pathStrings']+=1;r['subpaths']+=len(re.findall('[Mm]',d));r['parsedSegments']+=len(parse_path(d));r['pathChars']+=len(d);r['maxPathChars']=max(r['maxPathChars'],len(d))
 for v in q.get('children',[]):walk(v)
walk(asset['vector']['root']);clipds=[d for arr in asset['vector'].get('clips',{}).values() for d in arr];r['clipSeparate']={'pathStrings':len(clipds),'parsedSegments':sum(len(parse_path(d)) for d in clipds),'subpaths':sum(len(re.findall('[Mm]',d)) for d in clipds)};metrics.append(r)
raw=next(x for x in metrics if x['label']=='center raw');pairs.append({'family':'center','stage':'original raw to final imported JSON, all intermediate stages; not optimizer-only','delta':{k:r[k]-raw[k] for k in ['bytes','parsedSegments','subpaths']},'rawSVGPathElements':raw['pathElements'],'finalRuntimePathNodes':r['runtimePathNodes'],'note':'SVG path elements and runtime path nodes separate schema metrics, not Inkscape editor nodes/mesh faces; final color geometry excludes separately reported alpha clip.'})
report={'counts':metrics,'comparisons':pairs,'unmeasured':['actual Inkscape editor nodes','mesh or tessellation faces','visual quality or gameplay acceptance in this count-only audit'],'definitions':{'parsedSegments':'svgpathtools parsed geometry segments; includes Z closing line where parser emits one, excludes M as a segment','subpaths':'lexical M/m count, not filled faces','pathElements':'all SVG path elements including defs if present, not runtime/editor nodes','basicShapeElements':'rect circle ellipse line polyline polygon XML elements','fileBytes':'actual final file length, no transfer compression'},'sourceInputsUnchanged':all((b/x['file']).stat().st_size==x['bytes'] and hashlib.sha256((b/x['file']).read_bytes()).hexdigest()==x['sha256'] for x in metrics)}
(p/'audit.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
