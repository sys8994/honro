import json,os,math
from pathlib import Path
from PIL import Image,ImageChops,ImageDraw,ImageFilter
P=Path(os.environ['OUT']); Q=Path(__file__).resolve().parent
def read_json(x):return json.loads(x.read_text())
M=['stock','metadata','target']
pairs={}
for m in M:
 d=read_json(P/m/'domain'/'proof.json')
 assert not [q for q in d['problems'] if q.get('exception') or q.get('scriptErrors') or q.get('requestFailures')]
 pairs[m]={(f['stage'],f['width'],f['height'],f['view']):f for f in d['frames']}
 assert len(pairs[m])==16
 keys=set(pairs['stock']);assert set(pairs[m])==keys
 ctrl=read_json(P/m/'control'/'proof.json')
 assert set(ctrl)=={'13-initial','13-mason','13-threshold','18-initial','18-refresh-initial-activation'}
def im(m,key,view):
 file=pairs[m][key]['name'] if view=='domain' else key+'.png'
 return Image.open(P/m/view/file).convert('RGB')
def exact(im1,im2):
 return ImageChops.difference(im1,im2).getbbox() is None
mask=read_json(P.parent/'setup'/'mask-geometry.private.json')
prior=read_json(Q/'prior-stage22-views.json')
rects=[(0,5660,1590,6600),(1610,4940,4810,6620)]
output={'metadataControls':[],'twoPlaneTarget':[],'additionalControls':[]}
for key in sorted(keys):
 s,w,h,view=key
 a,b,c=[pairs[m][key] for m in M]
 for attr in ('physicsSha256','actual','viewport','actorCount'):
  assert a[attr]==b[attr]==c[attr],(key,attr)
 assert all(o['clamped'] and o['within'] for o in (a,b,c))
 i,jj,k=[im(m,key,'domain') for m in M]
 assert exact(i,jj),('metadata-not-gfx-exact',key)
 output['metadataControls'].append({'key':key,'zeroRGB':True,'actual':a['actual'],'physicsSha256':a['physicsSha256']})
 if s==21:
  assert exact(jj,k),('stage21-control-not-exact',key)
  continue
 assert s==22 and [x['loadedPanelCount'] for x in (a,b,c)]==[2,2,0]
 delta=ImageChops.difference(jj,k)
 clip=Image.new('L',jj.size); draw=ImageDraw.Draw(clip)
 t=b['viewport']; z=b['actual']['scale']
 for l,i,r,j in rects:
  draw.rectangle((math.floor((l-t['left'])*z)-2,math.floor((i-t['top'])*z)-2,math.ceil((r-t['left'])*z)+2,math.ceil((j-t['top'])*z)+2),fill=255)
 body=Image.new('L',jj.size)
 ImageDraw.Draw(body).polygon([((p['x']-t['left'])*z,(p['y']-t['top'])*z) for p in mask],fill=255)
 clip=ImageChops.darker(clip,body.filter(ImageFilter.MaxFilter(5)))
 outside=Image.composite(Image.new('RGB',jj.size),delta,clip)
 m=max(v[1] for v in outside.getextrema())
 assert m==0,('target-outside-mask',key,m)
 if view in ('south','court-close'):assert delta.getbbox(),('required-target-not-visible',key)
 p=prior[f'{w}x{h}-{view}']
 assert p['stock']['actual']==b['actual'] and p['candidate']['actual']==c['actual']
 bbox=delta.getbbox()
 output['twoPlaneTarget'].append({'key':key,'priorBbox':p['delta'],'currentBbox':bbox,'outsideMaxRGB':m,'sourcePriorExactViaPacketHash':True,'priorPhysicsShaExact':p['stock']['physicsSha256']==b['physicsSha256'] and p['candidate']['physicsSha256']==c['physicsSha256'],'priorRasterStockExact':p['stock']['rasterSha256']==b['rasterSha256'],'priorRasterCandidateExact':p['candidate']['rasterSha256']==c['rasterSha256'],'liveCounts':[a['loadedPanelCount'],b['loadedPanelCount'],c['loadedPanelCount']]})
for k in ['13-initial','13-mason','13-threshold','18-initial','18-refresh-initial-activation']:
 x,y,z=[read_json(P/m/'control'/'proof.json')[k] for m in M]
 dm=[a.pop('targetChange') for a in (x,y,z)]
 if k.startswith('13'):
  assert dm==[{'range':[.35,4],'embeddedRanges':[[.35,4]]*2}]+[{'range':[.22,4],'embeddedRanges':[[.22,4]]*2}]*2
 else:
  assert dm==[{'missing':45,'empty':0}]+[{'missing':0,'empty':12}]*2
 for f in (x,y,z):f.pop('pngSHA256')
 assert x==y==z,(k,[[q for q in x if x[q]!=f.get(q)] for f in (y,z)])
 ims=[im(m,k,'control') for m in M];assert exact(ims[0],ims[1]) and exact(ims[1],ims[2]),k
 output['additionalControls'].append({'key':k,'zeroRGB':True,'observedApprovedOnly':dm,'runtimeStateSHA256':x['stateSHA256'],'actual':x['camera'],'actorSills':x['actors']})
assert len(output['twoPlaneTarget'])==10
(P/'actual-compare.json').write_text(json.dumps(output,ensure_ascii=False,indent=2))
print('A/B exact metadata-vs-stock and B/C 10 masked Stage22 comparisons plus Stage21/13/18 controls passed.')
