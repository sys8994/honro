"""Prepare a non-released Stage38 rock candidate from actual Inkscape paths.
Physics tested before artwork; source registration/clipping is not optimization.
"""
import argparse,json,hashlib,re
from pathlib import Path
from xml.etree import ElementTree as ET
p=argparse.ArgumentParser();p.add_argument('input');p.add_argument('output');a=p.parse_args()
here=Path(__file__).resolve().parent;raw=Path(a.input).read_bytes()
assert hashlib.sha256(raw).hexdigest()=='48c4c4deb9aec62518bde72e9c8668f36817da8f2626e7f8a736b0bd8af65b43'
w=json.loads(raw);s=next(v for v in w['stages'] if v['metadata']['stageId']==38)
svg=ET.parse(here/'final.svg');ns={'s':'http://www.w3.org/2000/svg'}
clips=[v.attrib['d'] for v in svg.findall('.//s:clipPath/s:path',ns)];paths=svg.findall('./s:g/s:g/s:path',ns)
assert len(clips)==1 and len(paths)==16
children=[]
for node in paths:
 color=re.search(r'(?:^|;)fill:(#[0-9a-fA-F]{6})',node.get('style',''));d=node.get('d');assert color and d and len(d)<60000
 children.append({'tag':'path','fill':color.group(1),'stroke':'none','d':d})
points=[(4755,2659),(4755,2585),(4770,2555),(4830,2555),(4845,2470),(4860,2470),(4875,2570),(4890,2570),(4990,2660),(4990,2675)]
local=[(x-4755,y-2470) for x,y in points]
# Extend only the painted buried bottom, not walking/contact geometry.
paint=[(0,205)]+local[1:]+[(0,205)]
mask='M '+' L '.join(f'{x} {y}' for x,y in paint)+' Z'
sx=300/475;sy=85/(220-83);tx=90-193*sx;ty=-83*sy
asset={'id':'a4:rescue-rock-step','name':'해식굴 구조턱 바위','category':'terrain','visual':{},'collision':[],'sockets':[],'anchor':{'x':0,'y':0},'bounds':{'x':0,'y':0,'w':235,'h':205},'reference':{},'params':{},'vector':{'version':1,'viewBox':[0,0,235,205],'clips':{'source-alpha':clips,'contact-mask':[mask]},'root':{'tag':'g','clipPath':'contact-mask','children':[{'tag':'path','d':mask,'fill':'#24466d','stroke':'none'},{'tag':'g','transform':[sx,0,0,sy,tx,ty],'clipPath':'source-alpha','children':children}]}}}
id='a4-rescue-rock-step';assert not any(t['id']==id for t in s['terrains'])
s['terrains'].append({'id':id,'type':'solid','baseMaterial':'rock','oneWay':False,'breakable':False,'layer':'terrain','points':[{'x':x,'y':y} for x,y in points],'detail':{'roughness':0,'spacing':24,'optimizeEpsilon':0},'properties':{'source':'physics-first walkable rescue toe','honroWalkEdges':list(range(1,8)),'surfaceKind':'rock'}})
s['design']['nativeArt']['coveredTerrainIds'].append(id);w['library'].append(asset)
i=next(i for i,e in enumerate(s['elements']) if e['id']=='approved38-body')
s['elements'].insert(i+1,{'id':'a4-rescue-rock-step-art','assetId':asset['id'],'x':4755,'y':2470,'scale':1,'rotation':0,'snap':False,'depthLayer':'L1','layer':'mid','nativeArtLayer':'body','nativeTerrainIds':[id]})
encoded=json.dumps(w,ensure_ascii=False,separators=(',',':')).encode();Path(a.output).write_bytes(encoded)
print(json.dumps({'candidateSha256':hashlib.sha256(encoded).hexdigest(),'assetBytes':len(json.dumps(asset,separators=(',',':')).encode()),'localBounds':[0,0,235,205],'registration':[sx,sy,tx,ty],'releaseApproved':False}))
# Tool-native contact-fit preview; no raster asset embedded in the game vector.
S='http://www.w3.org/2000/svg';ET.register_namespace('',S);root=ET.Element('{'+S+'}svg',{'viewBox':'0 0 235 205','width':'705','height':'615'});defs=ET.SubElement(root,'{'+S+'}defs')
for name,ds in [('contact-mask',[mask]),('source-alpha',clips)]:
 c=ET.SubElement(defs,'{'+S+'}clipPath',{'id':name,'clipPathUnits':'userSpaceOnUse'})
 for d in ds:ET.SubElement(c,'{'+S+'}path',{'d':d})
g=ET.SubElement(root,'{'+S+'}g',{'clip-path':'url(#contact-mask)'});ET.SubElement(g,'{'+S+'}path',{'d':mask,'fill':'#24466d'})
h=ET.SubElement(g,'{'+S+'}g',{'transform':f'matrix({sx},0,0,{sy},{tx},{ty})','clip-path':'url(#source-alpha)'})
for v in children:ET.SubElement(h,'{'+S+'}path',{'d':v['d'],'fill':v['fill'],'stroke':'none'})
ET.ElementTree(root).write(Path(a.output).with_suffix('.registered.svg'),encoding='utf-8',xml_declaration=True)
