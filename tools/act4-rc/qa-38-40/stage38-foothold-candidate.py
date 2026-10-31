#!/usr/bin/env python3
"""Create an isolated, unapproved stage-38 foothold candidate from pinned QA world.

Never writes the repository's canonical world or loosens the release guard. The
small rock's painted upper edge and physical support share the same vertices.
"""
import argparse,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('input');p.add_argument('output');a=p.parse_args()
raw=Path(a.input).read_bytes()
assert hashlib.sha256(raw).hexdigest()=='99c59777254cb4942d5bfc7b7398068fc294dc29ff7208ac5f468953ecf5e581','Unexpected input world'
w=json.loads(raw);s=next(s for s in w['stages'] if s['metadata']['stageId']==38)
assert len(s['terrains'])==15 and not any(t['id']=='qa38-east-foothold' for t in s['terrains'])
pillar=next(t for t in s['terrains'] if t['id']=='approved38-east-pillar')
assert {'x':4914,'y':2475} in pillar['points']
# Small lower natural buttress touches the existing pillar and descends to the
# rescue ledge; no change to any existing top contour or higher route.
points=[(4792,2633),(4812,2594),(4840,2576),(4886,2571),(4922,2573),(4941,2491),(4973,2474),(5010,2502),(5010,2668),(4792,2668)]
s['terrains'].append({'id':'qa38-east-foothold','type':'solid','baseMaterial':'rock','oneWay':False,'breakable':False,'layer':'terrain','points':[{'x':x,'y':y} for x,y in points],'detail':{'roughness':0,'spacing':24,'optimizeEpsilon':0},'properties':{'source':'QA local east-pillar buttress','honroWalkEdges':[0,1,2,3,4,5,6],'surfaceKind':'ledge'}})
path='M '+' L '.join(f'{x} {y}' for x,y in points)+' Z'
asset={'id':'qa38:east-foothold','name':'QA east rock foothold','category':'terrain','visual':{},'collision':None,'sockets':[],'anchor':{'x':0,'y':0},'bounds':{'x':0,'y':0,'w':6912,'h':4608},'reference':{},'params':{},'vector':{'version':1,'viewBox':[0,0,6912,4608],'root':{'tag':'g','children':[{'tag':'path','fill':'#315b88','stroke':'none','d':path},{'tag':'path','fill':'#4e7ba6','stroke':'none','d':'M 4812 2594 L 4840 2576 L 4886 2571 L 4922 2573 L 4900 2590 L 4850 2595 L 4821 2615 Z'},{'tag':'path','fill':'#23456f','stroke':'none','d':'M 4818 2641 L 4861 2615 L 4927 2607 L 4972 2521 L 5010 2502 L 5010 2668 L 4792 2668 Z'}]}}}
w['library'].append(asset)
body=next(i for i,e in enumerate(s['elements']) if e['id']=='approved38-body')
s['elements'].insert(body+1,{'id':'qa38-east-foothold-art','assetId':'qa38:east-foothold','x':0,'y':0,'scale':1,'rotation':0,'snap':False,'depthLayer':'L1','layer':'mid','nativeArtLayer':'body','nativeTerrainIds':['qa38-east-foothold']})
out=json.dumps(w,ensure_ascii=False,separators=(',',':')).encode();Path(a.output).write_bytes(out);print(json.dumps({'inputSha256':hashlib.sha256(raw).hexdigest(),'worldSha256':hashlib.sha256(out).hexdigest(),'stage38SemanticSha256':hashlib.sha256(json.dumps(s,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'bytes':len(out)}))
