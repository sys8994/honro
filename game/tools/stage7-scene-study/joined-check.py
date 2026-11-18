from pathlib import Path
import json,numpy as np
from PIL import Image
P=Path('artifacts/stage7-scene-study');rows=[];errors=[]
for view in ['portrait-bl','desktop-br','portrait-tr','desktop-tr','desktop-cut-close']:
 try:
  variants=['candidate','closure','expected','joined','joined-expected'];r={v:json.loads((P/f'{v}-{view}.json').read_text())for v in variants}
  def image(v,kind):return np.array(Image.open(P/f'{v}-{view}-{kind}-mask.png').convert('RGBA'))
  world={v:image(v,'screenWorldCache')for v in variants}
  c,j=world['closure'],world['joined'];delta=np.any(c!=j,axis=2)
  stroke=image('joined','joinEffective')[:,:,3]>0;painted=image('joined','paintedUnionEffective')[:,:,3]>0
  source=image('joined','sourceEffective')[:,:,3];caps=image('joined','capsEffective')[:,:,3]
  def count(mask):return int(np.count_nonzero(mask))
  row={'view':view,'closureExpectedStaticMismatch':count(np.any(world['closure']!=world['expected'],axis=2)),'joinedExpectedStaticMismatch':count(np.any(world['joined']!=world['joined-expected'],axis=2)),'joinedVsClosureChanged':count(delta),'changedOutsideDeclaredStroke':count(delta&~stroke),'changedOpaqueSourceInsideDeclaredStroke':count(delta&stroke&(source==255)),'changedOpaqueSourceOutsideDeclaredStroke':count(delta&~stroke&(source==255)),'changedCapPixels':count(delta&(caps>0)),'strokeOutsidePaintedUnion':count(stroke&~painted)}
  if view=='desktop-cut-close' and not delta.any():errors.append(f'{view}: zero actual join effect; a no-op cannot pass')
  row['declaredFootprintPixels']=count(stroke)
  if view=='desktop-cut-close' and not stroke.any():errors.append(f'{view}: missing join footprint')
  for key in ['stageSha256','physicsSha256','sourceSha256','capsSha256','runtimeSha','camera']:
   if any(r[v][key]!=r['candidate'][key]for v in variants):errors.append(f'{view}: {key}')
  for v in variants:
   if not r[v]['ok'] or not r[v]['save']['roundtrip'] or not r[v]['movement']['moved'] or r[v]['movement']['trajectorySha256']!=r['candidate']['movement']['trajectorySha256'] or r[v]['errors'] or r[v]['storage'] or r[v]['violations']:errors.append(f'{view}: {v} runtime/save/movement')
  for key in ['closureExpectedStaticMismatch','joinedExpectedStaticMismatch','changedOutsideDeclaredStroke','changedOpaqueSourceOutsideDeclaredStroke','changedCapPixels','strokeOutsidePaintedUnion']:
   if row[key]:errors.append(f'{view}: {key}={row[key]}')
  # Grass regions are disjoint from the source-alpha cliff segment; check actual output too.
  H,W=delta.shape;cam=r['joined']['camera'];scale=cam['scale']*3.13;y=(np.arange(H)-H/2)/scale+cam['y']/3.13
  grass=(y[:,None]<450)|(y[:,None]>=878);row['changedInProtectedGrassBands']=count(delta&grass)
  if row['changedInProtectedGrassBands']:errors.append(f'{view}: protected grass band changed')
  rows.append(row)
 except Exception as e:errors.append(f'{view}: {type(e).__name__}: {e}')
report={'scope':'New explicitly bounded nonwalk outline recolor. Existing closure whole-source opaque gate is retained separately, not silently weakened. Comparisons use actual static screen-world cache and same-cache native masks.','rows':rows,'errors':errors,'passed':not errors,'artAccepted':False};(P/'joined-scope.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
# Preserve the strict raw report above. Evidence-based semantic scope is separate.
semanticRows=[];semanticErrors=[e for e in errors if ': changedOutsideDeclaredStroke=' not in e and ': changedOpaqueSourceOutsideDeclaredStroke=' not in e]
for view in ['portrait-bl','desktop-br','portrait-tr','desktop-tr','desktop-cut-close']:
 try:
  def pic(v,n):return np.array(Image.open(P/f'{v}-{view}-{n}-mask.png').convert('RGBA')).astype(np.int16)
  a=pic('joined','screenWorldCache');base=pic('closure','screenWorldCache');expected=pic('joined-expected','screenWorldCache');delta=np.any(a!=base,axis=2);stroke=pic('joined','joinEffective')[:,:,3]>0
  black=pic('joined','joinOnBlackEffective');white=pic('joined','joinOnWhiteEffective');trans=white[:,:,:3]-black[:,:,:3]
  valid=(black[:,:,3]==255)&(white[:,:,3]==255)&np.all((trans>=0)&(trans<=255),axis=2)
  observedCoverage=valid&np.any(trans<255,axis=2);exactExpected=np.all(a==expected,axis=2)
  sameProbes=True
  for variant in ['closure','joined-expected']:
   sameProbes&=np.array_equal(black,pic(variant,'joinOnBlackEffective')) and np.array_equal(white,pic(variant,'joinOnWhiteEffective'))
  outside=delta&~stroke;resolved=outside&observedCoverage&exactExpected if sameProbes else np.zeros_like(outside);unresolved=outside&~resolved
  row={'view':view,'rawOutsideDeclaredMask':int(outside.sum()),'resolvedByOpaqueBackgroundCoverageAndExactExpected':int(resolved.sum()),'unresolvedOutside':int(unresolved.sum()),'sameProbeVariants':bool(sameProbes),'rawReportPreserved':True};semanticRows.append(row)
  if not sameProbes:semanticErrors.append(f'{view}: join probe disagreement')
  if unresolved.any():semanticErrors.append(f'{view}: unresolved actual change outside declared geometric coverage')
 except Exception as e:semanticErrors.append(f'{view}: {type(e).__name__}: {e}')
semantic={'scope':'Separate evidence-based scope result; raw joined-scope.json counts and pass status remain unchanged. Opaque black/white backing transmission demonstrates sub-8-bit path coverage; only with identical probes and exact independent composition. No tolerance or geometric expansion.','rows':semanticRows,'errors':semanticErrors,'passed':not semanticErrors,'artAccepted':False}
(P/'joined-semantic-scope.json').write_text(json.dumps(semantic,indent=2));print(json.dumps(semantic,indent=2))
if semanticErrors:raise SystemExit(1)
