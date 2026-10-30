#!/usr/bin/env python3
import copy,json,math,os,subprocess,xml.etree.ElementTree as E
from pathlib import Path
from svgpathtools import parse_path
NS='http://www.w3.org/2000/svg';E.register_namespace('',NS)
env={**os.environ,'INKSCAPE_PROFILE_DIR':'/tmp/honro-cliffdepth-profile','XDG_CACHE_HOME':'/tmp/honro-cliffdepth-cache'}
def ink(src,dst,actions):subprocess.run(['inkscape',str(src),'--export-plain-svg','--export-type=svg',f'--export-filename={dst}',f'--actions={actions}'],env=env,check=True,stdout=subprocess.DEVNULL)
records=[]
for n,role,base,oldcolor in [(34,'body','#455863','#847d62'),(34,'overhang','#455863','#847d62'),(38,'floor','#435661','#7c8078'),(38,'roof','#435661','#7c8078')]:
 old=Path(f'art/stage{n}-density-v2');out=Path(f'art/stage{n}-density-depthfade');out.mkdir(exist_ok=True);cfg=json.loads((old/f'{role}-config.json').read_text());cfg['id']=f's{n}-density:{role}-depthfade';cfg['params']['artEdit']='Native source-derived fine cumulative depth attenuation; cliff contact palette retained; both accessible floor and ceiling faces protected.';root=E.parse(old/f'{role}-unioned.svg').getroot();ps=[e for e in root.iter()if e.tag.endswith('path')]
 # Same authorized contact-strip palette operation, retained in native source.
 ids=[e.get('id')for e in ps if oldcolor in e.get('style','')];ink(old/f'{role}-unioned.svg',out/f'{role}-palette.svg','select-by-id:'+','.join(ids)+';object-set-property:fill,#60737c');root=E.parse(out/f'{role}-palette.svg').getroot();ps=[e for e in root.iter()if e.tag.endswith('path')]
 union=copy.deepcopy(root)
 for e in union.iter():
  if e.tag.endswith('path'):e.set('style',f'fill:{base}')
 E.ElementTree(union).write(out/f'{role}-silhouette-input.svg');ink(out/f'{role}-silhouette-input.svg',out/f'{role}-silhouette.svg','select-by-id:'+','.join(e.get('id')for e in ps)+';path-union');silhouette=[e for e in E.parse(out/f'{role}-silhouette.svg').getroot().iter()if e.tag.endswith('path')][0]
 ceiling=role in ['overhang','roof'];transform=[1.02,0,0,1.15,24,-495]if n==34 and ceiling else[1,0,0,1,0,0]
 if ceiling:
  pts=[(s.start.real,s.start.imag)for s in parse_path(cfg['bodyClip'][0])];imax=max(range(len(pts)),key=lambda i:pts[i][0]);imin=min(range(len(pts)),key=lambda i:pts[i][0]);upper=sorted(pts[:imax+1]+pts[imin+1:]);lower=sorted(pts[imax:imin+1])
 else:
  dct={}
  for clip in cfg['bodyClip']:
   for s in parse_path(clip):
    for z in [s.start,s.end]:
     if z.imag<10000:dct[z.real]=min(dct.get(z.real,z.imag),z.imag)
  upper=sorted(dct.items());lower=None
 a,_,_,d,tx,ty=cfg['transform'];ex,_,_,ey,etx,ety=transform
 def polygon(points):return 'M'+' L'.join(f'{((x-etx)/ex-tx)/a:.8f} {((y-ety)/ey-ty)/d:.8f}'for x,y in points)+' Z'
 br=E.Element(root.tag,root.attrib);actions=[];prev=0;weights=[]
 for k in range(1,25):
  depth=100+600*k/24;total=(1-math.cos(math.pi*k/24))/2;opacity=(total-prev)/(1-prev);prev=total;weights.append(opacity);pid=f'mask{k}';x=copy.deepcopy(silhouette);x.set('id',pid);x.set('style',f'fill:{base}');br.append(x)
  top=[(x,y+depth)for x,y in upper]+[(upper[-1][0],40000),(upper[0][0],40000)];tid=f'top{k}';E.SubElement(br,'{'+NS+'}path',{'id':tid,'d':polygon(top),'style':f'fill:{base}'});actions.append(f'select-clear;select-by-id:{pid},{tid};path-intersection')
  if ceiling:
   bottom=[(x,y-depth)for x,y in lower]+[(lower[-1][0],-40000),(lower[0][0],-40000)];bid=f'bottom{k}';E.SubElement(br,'{'+NS+'}path',{'id':bid,'d':polygon(bottom),'style':f'fill:{base}'});actions.append(f'select-clear;select-by-id:{pid},{bid};path-intersection')
 E.ElementTree(br).write(out/f'{role}-masks-input.svg');ink(out/f'{role}-masks-input.svg',out/f'{role}-masks.svg',';'.join(actions));final=copy.deepcopy(root)
 for e in E.parse(out/f'{role}-masks.svg').getroot():
  if e.tag.endswith('path') and e.get('id','').startswith('mask'):
   e.set('opacity',str(weights[int(e.get('id')[4:])-1]));final.append(copy.deepcopy(e))
 E.ElementTree(final).write(out/f'{role}-final.svg');(out/f'{role}-config.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2));subprocess.run(['python3','tools/vector-production/import-svg.py',str(out/f'{role}-final.svg'),'--config',str(out/f'{role}-config.json'),'--output',str(out/f'{role}-asset.json')],check=True)
 asset=json.loads((out/f'{role}-asset.json').read_text());r={'stage':n,'role':role,'file':str(out/f'{role}-asset.json'),'baseColor':base,'ceiling':ceiling,'protectedBoundary':'both upper and underside'if ceiling else'floor top','requiredOuterTextureTransform':transform,'runtimeBytes':(out/f'{role}-asset.json').stat().st_size,'nodes':asset['params']['nodeCount'],'visualApproval':False,'source':str(old/f'{role}-unioned.svg'),'scope':'Intentional source-native palette and depth-composition change. No physics change. Cumulative24 solid masks, not gradients.'};(out/f'{role}-report.json').write_text(json.dumps(r,indent=2));records.append(r);print(n,role,r['nodes'],flush=True)
Path('tools/deep-body-density/cliff-manifest.json').write_text(json.dumps(records,indent=2))
