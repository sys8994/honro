"""Actual1.1 world zoom crop fidelity: bounded memory, unchanged shared limits."""
import gzip,json,copy,subprocess,xml.etree.ElementTree as E
from pathlib import Path
E.register_namespace('','http://www.w3.org/2000/svg');S='{http://www.w3.org/2000/svg}';D=Path('art/stage39-vector-production');out=Path('_local/reports/stage39-production/max-source-crops');out.mkdir(parents=True,exist_ok=True);stage=json.load(gzip.open(D/'official-project.json.gz','rt'))['stages'][0];reports=[]
for name,source,configName,crops,tid in [('body','body-raw.svg','body-config.json',[(400,1550),(2600,2200),(6000,1450)],'a4-39-land'),('wreck','wreck-raw.svg','wreck-config.json',[(-700,-450)],None)]:
 cfg=json.loads((D/configName).read_text());transform=cfg['transform'];terrain=next((t for t in stage['terrains'] if t['id']==tid),None)
 for i,(x,y) in enumerate(crops):
  folder=out/f'{name}-{i}';folder.mkdir(exist_ok=True)
  for label,file in [('raw',source),('candidate','body-contact-preserved.svg'if name=='body'else'wreck-selected.svg')]:
   root=E.Element(S+'svg',{'viewBox':f'{x} {y} 1400 900','width':'1400','height':'900','version':'1.1'});container=root
   if name=='overhang':container=E.SubElement(root,S+'g',{'transform':'matrix(1.02 0 0 1.15 24 -495)'})
   g=E.SubElement(container,S+'g',{'transform':'matrix('+ ' '.join(map(str,transform))+')'})
   for child in E.parse(D/file).getroot():
    if child.tag.split('}')[-1] in ['g','path','defs']:g.append(copy.deepcopy(child))
   E.ElementTree(root).write(folder/f'{label}.svg',encoding='utf-8',xml_declaration=True)
  pts=[[(q['x']-x)*1.1,(q['y']-y)*1.1] for q in terrain['points']]if terrain else [];protection={'width':1540,'scales':[1],'protectionMode':'contact','protectedPolylines':[{'points':pts,'width':10}],'limits':{'protectedChangedPixelFraction':.05}}
  
  if name=='wreck':protection['protectedRects']=[[0,0,1540,990]]
  (folder/'config.json').write_text(json.dumps(protection));subprocess.run(['python','tools/vector-production/compare-svg.py',str(folder/'raw.svg'),str(folder/'candidate.svg'),'--config',str(folder/'config.json'),'--output-dir',str(folder/'compare')],check=True)
  r=json.loads((folder/'compare/comparison.json').read_text());reports.append({'asset':name,'worldCrop':[x,y,1400,900],'worldZoom':1.1,'qualityPass':r['qualityPass'],'errors':r['errors']})
(D/'max-source-crop-checks.json').write_text(json.dumps({'scope':'Source raw versus selected runtime geometry at actual max inspection scale1.1 using real Native SVG pixels, bounded crops. Not art approval.','checks':reports},indent=2))
