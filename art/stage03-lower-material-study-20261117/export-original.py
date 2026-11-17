import json,xml.etree.ElementTree as E
from pathlib import Path
j=json.loads(Path('/tmp/stage3-original.json').read_text());v=j['art']['body']['vector'];root=E.Element('svg',xmlns='http://www.w3.org/2000/svg',width='1774',height='887',viewBox='0 0 1774 887');defs=E.SubElement(root,'defs')
for k,ds in v.get('clips',{}).items():
 c=E.SubElement(defs,'clipPath',id=k,clipPathUnits='userSpaceOnUse')
 for d in ds:E.SubElement(c,'path',d=d)
def out(n,parent):
 e=E.SubElement(parent,n['tag'])
 for k in ['fill','stroke','opacity','fillRule','strokeWidth']:
  if k in n:e.set({'fillRule':'fill-rule','strokeWidth':'stroke-width'}.get(k,k),str(n[k]))
 if 'transform'in n:e.set('transform','matrix('+','.join(map(str,n['transform']))+')')
 if 'clipPath'in n:e.set('clip-path','url(#'+n['clipPath']+')')
 if n['tag']=='path':e.set('d',n.get('d',n.get('sourcePath','')))
 for a in n.get('children',[]):out(a,e)
out(v['root'],root);E.ElementTree(root).write('stage3-exterior-study/body-original.svg')
Path('stage3-exterior-study/source.json').write_text(json.dumps({'source':'shared/assets/environment/act1-sites/stage07.json','bodySha256':j['art']['body']['sha256'],'viewBox':v['viewBox'],'scope':'Exact sourcePath/clip/transform export; no geometry or image edits'}))
