#!/usr/bin/env python3
"""Create an isolated, unapproved stage-38 foothold candidate from pinned QA world.

UNREVIEWED: experimental crop of the existing approved rock, not for release.
Never writes the repository's canonical world or loosens the release guard. The
small rock's painted upper edge and physical support share the same vertices.
"""
import argparse,hashlib,json,copy
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
points=[(4840,2648),(4851,2614),(4874,2600),(4900,2595),(4922,2597),(4941,2491),(4973,2474),(5010,2502),(5010,2668),(4864,2670)]
s['terrains'].append({'id':'qa38-east-foothold','type':'solid','baseMaterial':'rock','oneWay':False,'breakable':False,'layer':'terrain','points':[{'x':x,'y':y} for x,y in points],'detail':{'roughness':0,'spacing':24,'optimizeEpsilon':0},'properties':{'source':'QA local east-pillar buttress','honroWalkEdges':[0,1,2,3,4,5,6],'surfaceKind':'ledge'}})
path='M '+' L '.join(f'{x} {y}' for x,y in points)+' Z'
# Reuse the existing traced BODY vector: crop an already painted portion of
# the east rock face and translate it into the bounded support silhouette.
asset=copy.deepcopy(next(v for v in w['library'] if v['id']=='approved38:body'))
asset['id']='qa38:east-foothold';asset['name']='QA cropped east rock foothold'
vector=asset['vector'];original=vector['root'];vector['clips']['qa38-footmask']=[path]
vector['root']={'tag':'g','clipPath':'qa38-footmask','children':[{'tag':'g','transform':[1,0,0,1,-900,0],'children':[original]}]}

w['library'].append(asset)
body=next(i for i,e in enumerate(s['elements']) if e['id']=='approved38-body')
s['elements'].insert(body+1,{'id':'qa38-east-foothold-art','assetId':'qa38:east-foothold','x':0,'y':0,'scale':1,'rotation':0,'snap':False,'depthLayer':'L1','layer':'mid','nativeArtLayer':'body','nativeTerrainIds':['qa38-east-foothold']})
out=json.dumps(w,ensure_ascii=False,separators=(',',':')).encode();Path(a.output).write_bytes(out);print(json.dumps({'inputSha256':hashlib.sha256(raw).hexdigest(),'worldSha256':hashlib.sha256(out).hexdigest(),'stage38SemanticSha256':hashlib.sha256(json.dumps(s,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'bytes':len(out)}))
