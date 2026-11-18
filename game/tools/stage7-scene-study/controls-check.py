from pathlib import Path
import json,numpy as np
from PIL import Image
P=Path('artifacts/stage7-scene-study');cfg=json.loads((Path(__file__).resolve().parents[1]/'stage7-svg-study/config.json').read_text());f=np.array(cfg['rootFloor']);gx0,gy0,gx1,gy1=cfg['gap'];rows=[];errors=[]
for view in ['portrait-bl','desktop-br','portrait-tr']:
 try:
  variants=['original','original-repeat','bounds-only','candidate','right-backing-off'];r={v:json.loads((P/f'{v}-{view}.json').read_text())for v in variants};a={v:np.array(Image.open(P/f'{v}-{view}.png').convert('RGBA')).astype(np.int16)for v in variants}
  H,W=a['original'].shape[:2];c=r['original']['camera'];sc=c['scale']*3.13;xx=(np.arange(W)-W/2)/sc+c['x']/3.13;yy=(np.arange(H)-H/2)/sc+c['y']/3.13
  protected=(xx[None,:]>=9)&(xx[None,:]<1434)&(yy[:,None]>=0)&(yy[:,None]<=np.interp(xx,f[:,0],f[:,1])[None,:]+24)
  gap=(xx[None,:]<=gx1)&(xx[None,:]+1/sc>=gx0)&(yy[:,None]<=gy1)&(yy[:,None]+1/sc>=gy0);gate=protected&~gap
  def diff(x,y):
   d=np.abs(a[x]-a[y]).max(axis=2);return {'whole':int(np.count_nonzero(d)),'protected':int(np.count_nonzero((d>0)&gate)),'protectedRGB1':int(np.count_nonzero((d==1)&gate)),'protectedAbove1':int(np.count_nonzero((d>1)&gate)),'protectedMax':int(d[gate].max(initial=0))},d
  pairs={};ds={}
  for v in variants[1:]:pairs[v],ds[v]=diff('original',v)
  for v in ['original-repeat','bounds-only']:
   if pairs[v]['whole']:errors.append(f'{view}: {v} is not exact; no nondeterminism or bounds exemption assumed')
  def meta(v):
   z=r[v]['controls'];return {'rs':z['rasterScale'],'tiles':[{k:t[k]for k in ['id','left','top','width','height','lastContextMatrix']}for t in z['tiles']],'bodyDrawMetadata':z['bodyDrawMetadata']}
  controls={v:{'sameGridAndDrawMetadata':meta(v)==meta('original'),'sameTileRGBA':[(t['id'],t['rgbaSha256'])for t in r[v]['controls']['tiles']]==[(t['id'],t['rgbaSha256'])for t in r['original']['controls']['tiles']],'screens':r[v]['controls']['screens']}for v in variants}
  sourceMasks={v:np.array(Image.open(P/f'{v}-{view}-sourceEffective-mask.png').convert('RGBA')).astype(np.int16)for v in variants}
  capMasks={v:np.array(Image.open(P/f'{v}-{view}-sourceCapsEffective-mask.png').convert('RGBA')).astype(np.int16)for v in variants}
  worlds={v:np.array(Image.open(P/f'{v}-{view}-screenWorldCache-mask.png').convert('RGBA')).astype(np.int16)for v in variants}
  for v in variants[1:]:
   if not np.array_equal(sourceMasks['original'],sourceMasks[v]):errors.append(f'{view}: effective source replay differs in {v}')
   if not np.array_equal(capMasks['original'],capMasks[v]):errors.append(f'{view}: effective source+caps replay differs in {v}')
  sourceAlpha=sourceMasks['original'][:,:,3];capAlpha=capMasks['original'][:,:,3];staticClassification={}
  for v in variants[1:]:
   sd=np.max(np.abs(worlds[v]-worlds['original']),axis=2);badStatic=(sd>0)&gate;opaque=badStatic&(capAlpha==255);partial=badStatic&(capAlpha>0)&(capAlpha<255);transparent=badStatic&(capAlpha==0)
   staticClassification[v]={'protectedChanged':int(badStatic.sum()),'opaqueSourceCapsChanged':int(opaque.sum()),'partialSourceCapsChanged':int(partial.sum()),'transparentSourceCapsChanged':int(transparent.sum()),'opaqueMax':int(sd[opaque].max(initial=0))}
   if v in ['original-repeat','bounds-only'] and np.any(sd):errors.append(f'{view}: static world control differs in {v}')
   if opaque.any():errors.append(f'{view}: {v} changes opaque protected effective source+caps; no tolerance')
  bad=(ds['candidate']>0)&gate;recovered=bad&(ds['right-backing-off']==0);remaining=bad&~recovered
  y,x=np.where(bad&(ds['candidate']>1));points=[{'screen':[int(i),int(j)],'source':[float(xx[i]),float(yy[j])],'original':a['original'][j,i].tolist(),'candidate':a['candidate'][j,i].tolist(),'rightBackingOff':a['right-backing-off'][j,i].tolist(),'boundsOnly':a['bounds-only'][j,i].tolist(),'originalRepeat':a['original-repeat'][j,i].tolist(),'effectiveSourceAlpha':int(sourceAlpha[j,i]),'effectiveSourceCapsAlpha':int(capAlpha[j,i]),'staticWorldOriginal':worlds['original'][j,i].tolist(),'staticWorldCandidate':worlds['candidate'][j,i].tolist()}for j,i in zip(y,x)]
  rows.append({'view':view,'pairs':pairs,'controls':controls,'candidateProtectedRecoveredByRightBackingOff':int(recovered.sum()),'candidateProtectedRemaining':int(remaining.sum()),'largeDifferencePoints':points,'staticWorldClassification':staticClassification,'alphaClassification':'Actual observed BODY tile transforms, production tile+screen compositor. Partial/transparent differences are reported, NOT automatically accepted; strict final pixel gate unchanged','strictProtectionPassed':not bool(bad.any())})
 except Exception as e:errors.append(f'{view}: {type(e).__name__}: {e}')
report={'scope':'Cause-isolation controls only. No tolerance, no source-alpha assumption, no replacement for strict pixels.py gate. Full numeric contracts remain in compare.mjs.','rows':rows,'errors':errors,'controlValidityPassed':not errors,'artAccepted':False}
(P/'scene-controls.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
if errors:raise SystemExit(1)
