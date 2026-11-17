"""Intersect existing source alpha and existing ownership in native Inkscape.
No new geometry, contact, drawing, or palette is invented; each color stack gets
exactly one final coverage. Original a/b paths and placement remain immutable.
"""
from pathlib import Path
import json,os,subprocess,hashlib,sys
from xml.etree import ElementTree as E
from svgpathtools import parse_path
R=Path.cwd();A=R/'art/stage41-join';N='http://www.w3.org/2000/svg';E.register_namespace('',N)
s=next(a['vector'] for a in json.load(open(R/'shared/assets/environment/act5/near-import.json')) if a['id']==41)
base=E.parse(A/'source-main-original-native.svg').find('.//{'+N+'}path').get('d')
overlay='M300 428H1838V438H300ZM300 514H1902V529H300ZM0 545Q35 546 70 548L130 555L220 562L280 566L300 557V565L280 574L220 570L130 563L70 556Q35 550 0 545Z'
env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'}
results={};proof=[]
for name,outer in [('main',base),('overlay',overlay)]:
 results[name]=[]
 for i,key in enumerate(['a','b']):
  t=s['root']['children'][i]['transform'];assert t[1:3]==[0,0] and t[4:]==[0,0]
  native=parse_path(' '.join(s['clips'][key])).scaled(t[0],t[3]).d()
  root=E.Element('{'+N+'}svg',viewBox='0 0 1902 827',width='1902',height='827')
  for j,d in enumerate([native,outer]):E.SubElement(root,'{'+N+'}path',id='p'+str(j),d=d,fill='#000')
  inp=A/f'coverage-{name}-{key}-input.svg';out=A/f'coverage-{name}-{key}-native.svg';opt=A/f'coverage-{name}-{key}-optimized.svg';E.ElementTree(root).write(inp,encoding='utf-8')
  subprocess.run(['inkscape',str(inp),'--batch-process','--actions=select-all;path-intersection;select-clear;export-plain-svg;export-filename:'+str(out)+';export-do'],env=env,capture_output=True,check=True)
  subprocess.run([sys.executable,'tools/terrain-node-optimizer/optimize_svg.py',str(out),str(opt),'--epsilon','.01','--render-widths','951,1902','--max-mean-error','.0001','--max-changed-fraction','.0001'],env=env,capture_output=True,check=True)
  report=json.load(open(str(opt)+'.report.json'));assert report['accepted']
  paths=[p.get('d')for p in E.parse(opt).findall('.//{'+N+'}path')if p.get('d')];results[name].append(paths)
  proof.append({'mask':name+'-'+key,'originalClip':key,'transform':t,'segmentsBefore':report['segments_before'],'segmentsAfter':report['segments_after'],'accepted':report['accepted'],'nativeSHA256':hashlib.sha256(out.read_bytes()).hexdigest()})
(A/'source-coverage.json').write_text(json.dumps(results,separators=(',',':'))+'\n')
(A/'source-coverage-proof.json').write_text(json.dumps({'method':'exact native Boolean intersection of authored alpha with unchanged pre-existing external ownership; no silhouette changes','inputNearSHA256':hashlib.sha256((R/'shared/assets/environment/act5/near-import.json').read_bytes()).hexdigest(),'masks':proof},indent=2)+'\n')
print(proof)
