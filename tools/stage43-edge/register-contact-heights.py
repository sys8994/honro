"""Diagnostic whole-field translation; no reshaping, new paint or original edits."""
from pathlib import Path
from lxml import etree as E
import subprocess,os,json,importlib.util
ROOT=Path(__file__).resolve().parents[2];v3=ROOT.parent/'stage43-source-fields-v3';v4=ROOT.parent/'stage43-source-fields-v4';out=ROOT.parent/'stage43-contact-height-study';out.mkdir(exist_ok=True);ns='{http://www.w3.org/2000/svg}';r=E.Element(ns+'svg',nsmap={None:ns[1:-1]},viewBox='-1600 0 5372 5300',width='5372',height='5300')
for name,p,dy in [('center',v3/'center-alpha-final.svg',0),('left',v4/'left-alpha.svg',-130),('right',v3/'right-alpha-final.svg',-90)]:
 t=E.parse(str(p));d=' '.join(e.get('d') for e in t.findall('.//'+ns+'path'));E.SubElement(r,ns+'path',id=name,d=d,transform=f'translate(0,{dy})',style='fill:#000000;stroke:none')
p=out/'alpha-input.svg';dest=out/'alpha-union.svg';E.ElementTree(r).write(str(p));q=subprocess.run(['inkscape',str(p),'--batch-process','--actions=select-all;path-union;select-clear;export-plain-svg;export-filename:'+str(dest)+';export-do'],capture_output=True,text=True,env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(out/'profile')});q.check_returncode()
a=json.loads((v4/'asset-reunion.json').read_text());groups=a['vector']['root']['children'][0]['children'][0]['children'];assert len(groups)==3;groups[1]['transform']=[1,0,0,1,0,-130];groups[2]['transform']=[1,0,0,1,0,-90]
s=importlib.util.spec_from_file_location('imp',ROOT/'tools/vector-production/import-svg.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);paths=[]
for e in E.parse(str(dest)).findall('.//'+ns+'path'):
 assert e.get('transform') in (None,'translate(0,0)');data=m.preserve_compound(e.get('d'));paths+=data.get('dParts',[data.get('d')])
a['vector']['clips']['native-source-alpha']=paths;a['params']['contactHeightStudy']={'westDy':-130,'eastDy':-90,'scaleUnchanged':True,'originalIllustrationUnchanged':True,'status':'diagnostic only; deep anisotropy still unresolved'};(out/'asset.json').write_text(json.dumps(a,separators=(',',':'))+'\n');print(out)
