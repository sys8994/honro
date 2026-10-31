#!/usr/bin/env python3
"""REJECTED VISUALLY: rectangular detached-looking block; reproduce in QA only.

The original authored stage and assets remain unchanged. Collision vertices are
exactly the separately tested shoulder skeleton; an outer clip removes generated
art protruding above that contact outline and buries only the bottom into ground.
"""
import argparse,hashlib,json,re
from pathlib import Path
from lxml import etree
p=argparse.ArgumentParser();p.add_argument('input');p.add_argument('output');a=p.parse_args()
r=Path(__file__).resolve().parents[1]/'evidence-38-40/stage38-shoulder-art'
raw=Path(a.input).read_bytes();assert hashlib.sha256(raw).hexdigest()=='99c59777254cb4942d5bfc7b7398068fc294dc29ff7208ac5f468953ecf5e581'
w=json.loads(raw);s=next(s for s in w['stages'] if s['metadata']['stageId']==38);assert len(s['terrains'])==15
svg=etree.parse(str(r/'04-final.svg'));ns={'s':'http://www.w3.org/2000/svg'};clip=svg.xpath('//s:clipPath/s:path/@d',namespaces=ns);paths=svg.xpath('/s:svg/s:g/s:g/s:path',namespaces=ns);assert len(clip)==1 and paths
children=[]
for e in paths:
 style=e.get('style','');m=re.search(r'(?:^|;)fill:(#[0-9a-fA-F]{6})',style);assert m
 d=e.get('d');assert d and len(d)<60000
 children.append({'tag':'path','fill':m.group(1),'stroke':'none','d':d})
points=[(4755,2659),(4755,2585),(4770,2555),(4830,2555),(4845,2470),(4860,2470),(4860,2661)]
mask='M '+' L '.join(f'{x} {y}' for x,y in points[:-1]+[(4860,2675),(4755,2675)])+' Z'
scale=105/512
asset={'id':'qa38:shoulder-rock','name':'QA physics-first shoulder rock','category':'terrain','visual':{},'collision':[],'sockets':[],'anchor':{'x':0,'y':0},'bounds':{'x':0,'y':0,'w':6912,'h':4608},'reference':{},'params':{},'vector':{'version':1,'viewBox':[0,0,6912,4608],'clips':{'source-alpha':clip,'contact-mask':[mask]},'root':{'tag':'g','clipPath':'contact-mask','children':[{'tag':'g','transform':[scale,0,0,scale,4755,2470],'clipPath':'source-alpha','children':children}]}}}
s['terrains'].append({'id':'qa38-east-foothold','type':'solid','baseMaterial':'rock','oneWay':False,'breakable':False,'layer':'terrain','points':[{'x':x,'y':y} for x,y in points],'detail':{'roughness':0,'spacing':24,'optimizeEpsilon':0},'properties':{'source':'QA physics-first shoulder','honroWalkEdges':[1,2,3,4],'surfaceKind':'rock'}})
w['library'].append(asset);i=next(i for i,e in enumerate(s['elements']) if e['id']=='approved38-body')
s['elements'].insert(i+1,{'id':'qa38-east-foothold-art','assetId':asset['id'],'x':0,'y':0,'scale':1,'rotation':0,'snap':False,'depthLayer':'L1','layer':'mid','nativeArtLayer':'body','nativeTerrainIds':['qa38-east-foothold']})
out=json.dumps(w,ensure_ascii=False,separators=(',',':')).encode();Path(a.output).write_bytes(out);print(json.dumps({'worldSha256':hashlib.sha256(out).hexdigest(),'stage38SemanticSha256':hashlib.sha256(json.dumps(s,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'svgSha256':hashlib.sha256((r/'04-final.svg').read_bytes()).hexdigest(),'bytes':len(out)}))
