"""Asset-scoped mapping of existing SVG clips/linear gradients into HONRO.
The generic importer still rejects those SVG features. It handles every paint
path with unchanged budgets, then this explicit mapper restores supported
existing vector.clips/gradients and the two existing pixelSnapClip semantics.
No runtime or shared importer changes, filters, masks or group opacity.
"""
from pathlib import Path
from xml.etree import ElementTree as E
from copy import deepcopy
import re,json,sys,importlib.util,hashlib
NS='http://www.w3.org/2000/svg';base=Path(__file__).resolve().parent
def local(n):return n.tag.split('}')[-1]
def style(n):
 d={k:v for k,v in n.attrib.items()if ':'not in k}
 for pair in n.get('style','').split(';'):
  if pair.strip():k,v=pair.split(':',1);d[k.strip()]=v.strip()
 return d
def compile_join(source):
 source=Path(source);original=E.parse(source).getroot();clean=deepcopy(original);defs=next(n for n in original if local(n)=='defs');gradients={};clips={};gradient_aliases={};clip_aliases={};deferred=[]
 for n in defs:
  if local(n)=='clipPath':
   if n.get('clipPathUnits')!='userSpaceOnUse':raise ValueError('Only explicit source/world-coordinate clips supported')
   ps=list(n)
   if not ps or any(local(p)!='path'or p.get('transform')for p in ps):raise ValueError('Clip must contain untransformed native paths')
   clips[n.get('id')]=[p.get('d')for p in ps]
  elif local(n)=='linearGradient':
   if n.get('gradientUnits')!='userSpaceOnUse' or n.get('gradientTransform'):raise ValueError('Only explicit untransformed linear source-coordinate gradient supported')
   if any('href'in k for k in n.attrib):deferred.append(n);continue
   grad={'type':'linear',**{k:float(n.get(k))for k in ['x1','y1','x2','y2']},'stops':[]}
   for stop in n:
    if local(stop)!='stop':raise ValueError('Unsupported gradient child')
    a=style(stop);offset=a['offset'];offset=float(offset[:-1])/100 if offset.endswith('%')else float(offset);grad['stops'].append({'offset':offset,'color':a['stop-color'],'opacity':float(a.get('stop-opacity','1'))})
   gradients[n.get('id')]=grad
  elif local(n)not in ['metadata']:raise ValueError('Unsupported definition '+local(n))

 # Native Inkscape may introduce equivalent reference aliases while editing
 # paint paths. Resolve ONLY exact existing coordinate/stop definitions. This
 # does not extend the runtime with SVG href/gradientTransform support.
 for n in deferred:
  href=next(v for k,v in n.attrib.items()if 'href'in k)
  if not href.startswith('#')or href[1:]not in gradients or len(n):raise ValueError('Unresolved gradient alias')
  target=href[1:];g=gradients[target]
  if any(float(n.get(k,str(g[k])))!=g[k]for k in ['x1','y1','x2','y2']):raise ValueError('Gradient alias changes coordinates')
  gradient_aliases[n.get('id')]=target
 baseline=E.parse(base/'candidate-B-v3-authored.svg').getroot();baseline_defs=next(n for n in baseline if local(n)=='defs');baseline_clips={n.get('id'):[p.get('d')for p in n]for n in baseline_defs if local(n)=='clipPath'}
 canonical_clips={}
 for name,data in clips.items():
  names=[k for k,v in baseline_clips.items()if v==data]
  if len(names)!=1:raise ValueError('Clip geometry changed from authored baseline')
  clip_aliases[name]=names[0];canonical_clips[names[0]]=data
 clips=canonical_clips
 def canonical_fill(fill):
  match=re.fullmatch(r'url\(#([\w-]+)\)',fill)
  if not match:return fill
  name=gradient_aliases.get(match[1],match[1]);return 'url(#'+name+')'
 def strip(n):
  for child in list(n):
   if local(child)in ['defs','metadata','namedview','title','desc']:n.remove(child)
   else:strip(child)
  n.attrib.pop('clip-path',None);a=style(n);fill=canonical_fill(a.get('fill',''))
  if fill.startswith('url('):
   match=re.fullmatch(r'url\(#([\w-]+)\)',fill)
   if not match or match[1]not in gradients:raise ValueError('Unknown gradient')
   n.set('fill',gradients[match[1]]['stops'][0]['color']);n.set('style',';'.join(k+':'+v for k,v in a.items()if k in ['fill-rule','stroke','stroke-width','opacity'])+';fill:'+gradients[match[1]]['stops'][0]['color'])
 strip(clean)
 spec=importlib.util.spec_from_file_location('svg_import','tools/vector-production/import-svg.py');imp=importlib.util.module_from_spec(spec);spec.loader.exec_module(imp);cfg=json.loads((base.parent/'asset-config.json').read_text(encoding='utf-8'));cfg.pop('transform');cfg.pop('bodyClip');cfg['preserveCompounds']=True;asset=imp.compile_svg(E.tostring(clean,encoding='unicode'),cfg)
 def restore(xml,node):
  a=style(xml)
  if xml.get('clip-path'):
   match=re.fullmatch(r'url\(#([\w-]+)\)',xml.get('clip-path'))
   if not match or match[1]not in clip_aliases:raise ValueError('Unknown clip')
   node['clipPath']=clip_aliases[match[1]]
   if node['clipPath']in ['joinUpperPreserve','joinLowerBlend']:node['pixelSnapClip']=True
  if a.get('fill','').startswith('url('):node['fill']=canonical_fill(a['fill'])
  children=[n for n in xml if local(n)not in ['defs','metadata','namedview','title','desc']]
  if children:
   if len(children)!=len(node['children']):raise ValueError('Importer structure mismatch; refuse unsupported tree')
   for x,c in zip(children,node['children']):restore(x,c)
 restore(original,asset['vector']['root']['children'][0]);asset['vector']['clips']=clips;asset['vector']['gradients']=gradients;asset['params'].update(joinCandidate='B-v3-preserved-source-contact',joinSvgSha256=hashlib.sha256(source.read_bytes()).hexdigest(),joinAdapter='Asset-scoped existing clip/explicit linear-gradient mapping; exact native href/clip-name aliases canonicalized to authored definitions. Generic SVG importer unchanged.',joinDefinitionAliases={'gradient':gradient_aliases,'clip':clip_aliases},sourceEdit='Original upper stack preserved. Native Boolean visible areas and per-color alpha only in lower worldy>=2580 join.',artStatus='authored/optimization candidate; scene acceptance pending')
 return asset
if __name__=='__main__':
 source,out=map(Path,sys.argv[1:3]);asset=compile_join(source);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(asset,ensure_ascii=False,separators=(',',':')),encoding='utf-8');print(json.dumps({'asset':str(out),'bytes':out.stat().st_size,'clips':len(asset['vector']['clips']),'gradients':len(asset['vector']['gradients'])}))
