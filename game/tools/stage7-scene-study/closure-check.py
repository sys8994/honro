from pathlib import Path
import json,numpy as np
from PIL import Image
P=Path('artifacts/stage7-scene-study');rows=[];failed=False;semantic_rows=[];semantic_failed=False
for view in ['portrait-bl','desktop-br','portrait-tr','desktop-tr','desktop-cut-close']:
 def read(v):return json.loads((P/(v+'-'+view+'.json')).read_text())
 def pic(v,suffix=''):return np.array(Image.open(P/(v+'-'+view+suffix+'.png')).convert('RGBA'))
 baseline,actual,control=map(read,['candidate','closure','expected'])
 contracts=['stageSha256','physicsSha256','sourceSha256','capsSha256','runtimeSha','camera']
 errors=[key for key in contracts if not baseline[key]==actual[key]==control[key]]
 if not baseline['movement']['trajectorySha256']==actual['movement']['trajectorySha256']==control['movement']['trajectorySha256']:errors.append('movement')
 for v in [baseline,actual,control]:
  if not v['ok'] or not v['save']['roundtrip'] or not v['movement']['moved'] or v['errors'] or v['storage'] or v['violations']:errors.append('runtime/save/movement')
 if control['expectedDraws']<=0:errors.append('expected-control-not-used')
 b,a,e=[pic(v,'-screenWorldCache-mask')for v in ['candidate','closure','expected']];source=pic('closure','-sourceEffective-mask')[:,:,3];footprint=pic('closure','-closureEffective-mask')[:,:,3]>0
 changed=np.any(a!=b,axis=2);opaque=changed&(source==255);outside=changed&~footprint;unexpected=np.any(a!=e,axis=2)
 row={'view':view,'contractErrors':errors,'expectedSourceOverMismatchPixels':int(unexpected.sum()),'opaqueSourceChangedPixels':int(opaque.sum()),'outsideNativeClosureFootprintChangedPixels':int(outside.sum()),'sourceAAChangedPixels':int((changed&(source>0)&(source<255)).sum()),'closureTiming':actual['timing'],'expectedTimingControlOnly':control['timing'],'notes':'Source and closure masks replay observed BODY tile transforms through the existing production tile/screen compositor. Static cache comparison excludes dynamic cloud timing. All thresholds remain exact.'}
 for name,mask in [('unexpected',unexpected),('opaque',opaque),('outside',outside)]:
  ys,xs=np.where(mask);row[name+'First']=[{'pixel':[int(x),int(y)],'base':b[y,x].tolist(),'actual':a[y,x].tolist(),'expected':e[y,x].tolist(),'sourceAlpha':int(source[y,x]),'footprint':bool(footprint[y,x])} for y,x in zip(ys[:20],xs[:20])]
 rows.append(row);failed|=bool(errors or unexpected.any() or opaque.any() or outside.any())
 # Endpoint probes diagnose quantized alpha, not an RGB tolerance. Apply to every
 # pixel, not stored failure coordinates. Zero transmission never proves opacity.
 probes={name:pic('closure','-'+name+'Effective-mask').astype(np.int16) for name in ['sourceBlack','sourceWhite','closureOnBlack','closureOnWhite']}
 probe_errors=[]
 for name,z in probes.items():
  for variant in ['candidate','expected']:
   if not np.array_equal(z,pic(variant,'-'+name+'Effective-mask')):probe_errors.append(name+' probe changed in '+variant)
 for name in ['source','caps','sourceCaps','rim','foreground','closure']:
  z=pic('closure','-'+name+'Effective-mask')
  for variant in ['candidate','expected']:
   if not np.array_equal(z,pic(variant,'-'+name+'Effective-mask')):probe_errors.append(name+' independent mask changed in '+variant)
 sd=probes['sourceWhite'][:,:,:3]-probes['sourceBlack'][:,:,:3]
 cd=probes['closureOnWhite'][:,:,:3]-probes['closureOnBlack'][:,:,:3]
 sv=(probes['sourceWhite'][:,:,3]==255)&(probes['sourceBlack'][:,:,3]==255)&np.all((sd>=0)&(sd<=255),axis=2)
 cv=(probes['closureOnWhite'][:,:,3]==255)&(probes['closureOnBlack'][:,:,3]==255)&np.all((cd>=0)&(cd<=255),axis=2)
 source_transmits=sv&np.any(sd>0,axis=2)
 closure_covers=cv&np.any(cd<255,axis=2)
 unresolved_opaque=opaque&~source_transmits
 unresolved_outside=outside&~closure_covers
 points=[]
 ys,xs=np.where(opaque|outside)
 for y,x in zip(ys,xs):
  points.append({'pixel':[int(x),int(y)],'rawOpaque':bool(opaque[y,x]),'rawOutside':bool(outside[y,x]),'sourceTransmission':sd[y,x].tolist(),'closureTransmission':cd[y,x].tolist(),'opaqueProbeBackground':bool(sv[y,x] and cv[y,x]),'sourceTransmissionObserved':bool(source_transmits[y,x]),'closureCoverageObserved':bool(closure_covers[y,x]),'expectedExact':bool(not unexpected[y,x])})
 semantic_rows.append({'view':view,'probeErrors':probe_errors,'contractErrors':errors,'expectedMismatchPixels':int(unexpected.sum()),'rawOpaqueChanges':int(opaque.sum()),'rawOutsideChanges':int(outside.sum()),'provenFalseOpaque':int((opaque&source_transmits).sum()),'provenFalseEmpty':int((outside&closure_covers).sum()),'unresolvedOpaqueChanges':int(unresolved_opaque.sum()),'unresolvedOutsideChanges':int(unresolved_outside.sum()),'evidence':points})
 semantic_failed|=bool(errors or probe_errors or unexpected.any() or unresolved_opaque.any() or unresolved_outside.any())

(P/'closure-source-over.json').write_text(json.dumps({'passed':not failed,'scope':'Independent raw Canvas underpaint plus unchanged native foreground in actual static Scene cache. Original-vs-lower protected gate remains separate and unchanged. This result alone is not art approval.','rows':rows},indent=2));print(json.dumps(rows,indent=2))
(P/'closure-semantic-protection.json').write_text(json.dumps({'passed':not semantic_failed,'rawStrictPassed':not failed,'scope':'Exact independent composition plus unchanged source/caps/rim and same-cache endpoint transmission. Raw strict report retained without edits. No RGB epsilon, pixel whitelist, mask dilation or geometry changes. A raw failure is resolved only by positive per-pixel transmission/coverage evidence; zero evidence remains failure. Not art/performance approval.','rows':semantic_rows},indent=2))
if semantic_failed:raise SystemExit(1)
