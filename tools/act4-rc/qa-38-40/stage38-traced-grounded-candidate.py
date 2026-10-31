#!/usr/bin/env python3
"""Unapproved QA-only candidate: move traced rock down and left for grounding.

Consumes only the pinned assembled world. Output must be a disposable QA copy.
The contact is sampled from the final vector's visible alpha edge; no original
terrain, events, actors, or completion rules are removed or replaced.
"""
import argparse,hashlib,json,re
from pathlib import Path
from lxml import etree
from PIL import Image
p=argparse.ArgumentParser();p.add_argument('input');p.add_argument('output');a=p.parse_args()
r=Path(__file__).resolve().parents[1]/'evidence-38-40/stage38-foothold-art'
raw=Path(a.input).read_bytes();assert hashlib.sha256(raw).hexdigest()=='99c59777254cb4942d5bfc7b7398068fc294dc29ff7208ac5f468953ecf5e581'
w=json.loads(raw);s=next(s for s in w['stages'] if s['metadata']['stageId']==38);assert len(s['terrains'])==15
svg=etree.parse(str(r/'04-final.svg'));ns={'s':'http://www.w3.org/2000/svg'}
clip=svg.xpath('//s:clipPath/s:path/@d',namespaces=ns);paths=svg.xpath('/s:svg/s:g/s:g/s:path',namespaces=ns);assert len(clip)==1 and len(paths)==16
children=[]
for e in paths:
 style=e.get('style','');m=re.search(r'(?:^|;)fill:(#[0-9a-fA-F]{6})',style);assert m
 d=e.get('d');assert d and len(d)<60000
 children.append({'tag':'path','fill':m.group(1),'stroke':'none','d':d})
scale=.45;ox=4755;oy=2597
asset={'id':'qa38:traced-foothold','name':'QA traced cave rock','category':'terrain','visual':{},'collision':[],'sockets':[],'anchor':{'x':0,'y':0},'bounds':{'x':0,'y':0,'w':6912,'h':4608},'reference':{},'params':{},'vector':{'version':1,'viewBox':[0,0,6912,4608],'clips':{'qa38-alpha':clip},'root':{'tag':'g','transform':[scale,0,0,scale,ox,oy],'clipPath':'qa38-alpha','children':children}}}
alpha=Image.open(r/'04-final.png').convert('RGBA').getchannel('A');xs=[5,15,35,65,95,125,155,185,215,245,275,305,335,365,395,425,455,485,505];points=[]
for x in xs:
 y=next(y for y in range(alpha.height) if alpha.getpixel((x,y))>=128)
 points.append((round(ox+x*scale,3),round(oy+y*scale,3)))
points.extend([(round(ox+505*scale,3),2675),(round(ox+5*scale,3),2675)])
s['terrains'].append({'id':'qa38-east-foothold','type':'solid','baseMaterial':'rock','oneWay':False,'breakable':False,'layer':'terrain','points':[{'x':x,'y':y} for x,y in points],'detail':{'roughness':0,'spacing':24,'optimizeEpsilon':0},'properties':{'source':'QA traced visible rock contour','honroWalkEdges':list(range(len(xs)-1)),'surfaceKind':'ledge'}})
w['library'].append(asset);i=next(i for i,e in enumerate(s['elements']) if e['id']=='approved38-body')
s['elements'].insert(i+1,{'id':'qa38-east-foothold-art','assetId':asset['id'],'x':0,'y':0,'scale':1,'rotation':0,'snap':False,'depthLayer':'L1','layer':'mid','nativeArtLayer':'body','nativeTerrainIds':['qa38-east-foothold']})
out=json.dumps(w,ensure_ascii=False,separators=(',',':')).encode();Path(a.output).write_bytes(out);print(json.dumps({'worldSha256':hashlib.sha256(out).hexdigest(),'stage38SemanticSha256':hashlib.sha256(json.dumps(s,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'sourceSvgSha256':hashlib.sha256((r/'04-final.svg').read_bytes()).hexdigest(),'bytes':len(out)}))
