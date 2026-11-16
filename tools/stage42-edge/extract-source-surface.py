"""Native Inkscape differences isolate visible authored stone stair colors."""
from pathlib import Path
import json,subprocess,os,copy
from lxml import etree as E
root=Path(__file__).resolve().parents[2];out=root/'_local/reports/stage42-surface';out.mkdir(exist_ok=True)
s=json.load(open(root/'art/stage42-edge/source.json'));nodes=s['vector']['root']['children'][0]['children'];ns='http://www.w3.org/2000/svg';final=E.Element('{'+ns+'}svg',nsmap={None:ns},width='2022',height='778',viewBox='0 0 2022 778')
for index in [1,2,3,4,5,6]:
 t=E.Element('{'+ns+'}svg',nsmap={None:ns},width='2022',height='778',viewBox='0 0 2022 778');ids=[]
 for j,n in enumerate(nodes[index:]):
  id='p'+str(j);E.SubElement(t,'{'+ns+'}path',id=id,d=n.get('d','')+''.join(n.get('dParts',[])),fill=n['fill']);ids.append(id)
 src=out/f'color-{index}-input.svg';dest=out/f'color-{index}.svg';E.ElementTree(t).write(str(src),encoding='utf-8',xml_declaration=True)
 acts=['select-by-id:'+','.join(ids[1:]),'path-union','select-all','path-difference','select-clear','export-plain-svg','export-filename:'+str(dest),'export-do']
 p=subprocess.run(['/usr/bin/inkscape',str(src),'--batch-process','--actions='+';'.join(acts)],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'},capture_output=True,text=True);(out/f'color-{index}.log').write_text(p.stdout+'\n'+p.stderr);p.check_returncode()
 for e in E.parse(str(dest)).findall('.//{*}path'):
  e.attrib.pop('style',None);e.set('fill',nodes[index]['fill']);e.set('id',f'surface-{index}');final.append(copy.deepcopy(e))
E.ElementTree(final).write(str(out/'surface-raw.svg'),encoding='utf-8',xml_declaration=True)
a=E.Element('{'+ns+'}svg',nsmap={None:ns},width='2022',height='778',viewBox='0 0 2022 778');E.SubElement(a,'{'+ns+'}path',d=' '.join(s['vector']['clips']['a']),fill='#000000');E.ElementTree(a).write(str(out/'alpha.svg'),encoding='utf-8',xml_declaration=True)
c={'id':'act5:stage42:original-surface','semanticLayer':'SURFACE','bounds':{'x':0,'y':0,'w':2022,'h':778},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':778},'preserveCompounds':True};json.dump(c,open(root/'art/stage42-edge/surface-config.json','w'))
