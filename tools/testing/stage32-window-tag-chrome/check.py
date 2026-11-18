import json,sys
from pathlib import Path
import numpy as np
from PIL import Image
here=Path(__file__).parent;e=Path(sys.argv[1]);j=json.load(open(e/'tags-sequence.json'));prior=json.load(open(here/'prior-diff.json'));names=[r['name'] for r in prior['rows']]
assert j['ok'] and j['width']==1331 and j['height']==763
assert [(r['kind'],r['name']) for r in j['rows']]==[(k,n) for k in ['grass','pale','road'] for n in names]
results=[]
for r in j['rows']:
 k,n=r['kind'],r['name'];a=np.array(Image.open(e/f'tags-sequence-baseline-{k}-{n}-mask.png').convert('RGBA'));b=np.array(Image.open(e/f'tags-sequence-candidate-{k}-{n}-mask.png').convert('RGBA'))
 assert a.shape==b.shape==(763,1331,4)
 assert np.array_equal(a,b),(k,n,'Actual Chrome role contribution changed')
 if k=='grass' or n=='edge':assert r['positive']>0 and r['full']>0,(k,n,'Vacuous role')
 assert r['changed']==r['fullChanged']==r['partialChanged']==r['alpha']==0
 q=next(x for x in prior['rows'] if x['name']==n);ix=np.array(q['changedPixelIndices']);tag=a[:,:,0].ravel()[ix];delta=np.array(q['delta']);full=tag==255;partial=(tag>0)&(tag<255)
 results.append({'kind':k,'name':n,'actualColorChangedOnFullTag':int(full.sum()),'actualColorChangedOnPartialTag':int(partial.sum()),'partialMaxDelta':int(delta[partial].max()) if partial.any() else 0,'tagPixels':r['positive']})
 assert not full.any(),(k,n,'Full contribution actual RGB changed')
json.dump({'passed':True,'qualityAccepted':False,'scope':'One Chrome page, both tagged helpers, original sequential 9 frames. Role contribution exact plus actual prior color-diff intersections. Not actual-color expected-composite proof; partial intersections and gray-boundary resampling need visual judgment. Prior actual Scene/terrain exterior gates remain separate run evidence.','priorRun':prior['run'],'priorArtifact':prior['artifact'],'rows':results},open(e/'tag-result.json','w'),indent=2)
print('PASS 27 Chrome role comparisons; partial-color classification remains explicit')
