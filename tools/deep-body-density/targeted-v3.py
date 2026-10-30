#!/usr/bin/env python3
import copy,json,os,subprocess,xml.etree.ElementTree as E
from pathlib import Path
from svgpathtools import parse_path
NS='http://www.w3.org/2000/svg';E.register_namespace('',NS);env={**os.environ,'INKSCAPE_PROFILE_DIR':'/tmp/honro-target-v3-profile','XDG_CACHE_HOME':'/tmp/honro-target-v3-cache'}
def ink(src,dst,actions):subprocess.run(['inkscape',str(src),'--export-plain-svg','--export-type=svg',f'--export-filename={dst}',f'--actions={actions}'],env=env,check=True,stdout=subprocess.DEVNULL)
for n in [33,34]:
 out=Path('art/stage33-density-cap-v3'if n==33 else'art/stage34-density-face-v3');out.mkdir(exist_ok=True);old=Path(f'art/stage{n}-density-depthfade');cfg=json.loads((old/'body-config.json').read_text());cfg['id']=f's{n}-density:body-target-v3';root=E.parse(old/('material-palette.svg'if n==33 else'body-palette.svg')).getroot()
 if n==34:
  ink(old/'body-palette.svg',out/'body-master.svg','select-by-id:path7;object-set-property:fill,#4c5e6b');master=E.parse(out/'body-master.svg').getroot();desc='Intentional native palette edit: interiorface526572→4c5e6b, approximatelyhalfcontrast toward455863. Contact60737c unchanged; priorfinefade retained.'
 else:
  dct={}
  for seg in parse_path(cfg['bodyClip'][0]):
   for z in [seg.start,seg.end]:
    if z.imag<10000:dct[z.real]=min(dct.get(z.real,z.imag),z.imag)
  pts=sorted(dct.items());a,_,_,d,tx,ty=cfg['transform']
  def poly(points):return 'M'+' L'.join(f'{(x-tx)/a:.8f} {(y-ty)/d:.8f}'for x,y in points)+' Z'
  cap=poly([(pts[0][0],-40000),(pts[-1][0],-40000)]+[(x,y+70)for x,y in pts[::-1]])
  below=poly([(x,y+65)for x,y in pts]+[(pts[-1][0],40000),(pts[0][0],40000)])
  br=copy.deepcopy(root);soil=['path11','path10','path8','path7','path6','path3'];actions=[]
  for i,pid in enumerate(soil):
   cid=f'cap{i}';E.SubElement(br,'{'+NS+'}path',{'id':cid,'d':cap,'style':'fill:#89846c'});actions.append(f'select-clear;select-by-id:{pid},{cid};path-intersection')
  E.ElementTree(br).write(out/'cap-boolean-input.svg');ink(out/'cap-boolean-input.svg',out/'cap-boolean.svg',';'.join(actions))
  qr=E.Element(root.tag,root.attrib);sil=copy.deepcopy(next(e for e in E.parse(old/'silhouette-union.svg').getroot().iter()if e.tag.endswith('path')));sil.set('id','quietbase');sil.set('style','fill:#2d4350');qr.append(sil);E.SubElement(qr,'{'+NS+'}path',{'id':'quietclip','d':below,'style':'fill:#2d4350'});E.ElementTree(qr).write(out/'base-boolean-input.svg');ink(out/'base-boolean-input.svg',out/'base-boolean.svg','select-by-id:quietbase,quietclip;path-intersection')
  master=E.Element(root.tag,root.attrib)
  for e in E.parse(out/'base-boolean.svg').getroot():
   if e.tag.endswith('path'):master.append(copy.deepcopy(e))
  for e in E.parse(out/'cap-boolean.svg').getroot():
   if e.tag.endswith('path')or e.tag.endswith('g'):master.append(copy.deepcopy(e))
  E.ElementTree(master).write(out/'body-master.svg');desc='Native Boolean cap: existing earthpalette masks retained only within70world ofactualcontact; original quietsilhouette begins65world behindcap. Largeinternalochreribbons removed whilebluegeology source remains. Intentionalartedit.'
 if n==33:
  ink(out/'body-master.svg',out/'body-master-quiet.svg','select-by-id:path9;object-set-property:fill,#354a58;select-clear;select-by-id:path5;object-set-property:fill,#314754');master=E.parse(out/'body-master-quiet.svg').getroot();desc+=' Internalblue paths9/5 blended75%towardbase2d4350, retaining theirsourcegeometry.'
 final=copy.deepcopy(master)
 for e in E.parse(old/'body-final.svg').getroot():
  if e.get('id','').startswith('mask'):final.append(copy.deepcopy(e))
 cfg['params']['artEdit']=desc;(out/'body-config.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2));E.ElementTree(final).write(out/'body-final.svg');subprocess.run(['python3','tools/vector-production/import-svg.py',str(out/'body-final.svg'),'--config',str(out/'body-config.json'),'--output',str(out/'body-asset.json')],check=True)
 report={'stage':n,'asset':str(out/'body-asset.json'),'description':desc,'sourceFreeze':'14df270','physicalMetadataUnchanged':True,'visualApproval':False};(out/'report.json').write_text(json.dumps(report,indent=2));print(report)
