"""Compare only signed Stationary Stage38 views. No automatic visual approval."""
import base64, io, math
from PIL import Image, ImageChops, ImageFilter
from source import P,OUT,sha,save
import json

def load(p):return json.loads(p.read_bytes())
a,b=[load(OUT/d/'proof.json') for d in ('A','B')]
REF=P['probe']; cfg=REF['localApproved']
assert a['arm']=='A' and b['arm']=='B' and a['complete'] and b['complete']
assert set(x['view'] for x in a['frames'])==set(x['view'] for x in b['frames'])==set(REF['frames'])
assert not a['replacement'] and len(b['replacement'])==1
results=[];problems=[]
models={}
for label,row in cfg['poses'].items():
 data=base64.b64decode(row['embeddedPNG'],validate=True)
 assert sha(data)==row['sha256']
 models[label]=Image.open(io.BytesIO(data)).convert('RGBA')
def cast(im,size,shift):
 # Translation only. The fixture version/scene cameras fix the actual draw scale.
 x,y=shift
 return im.transform(size,Image.Transform.AFFINE,(1,0,-x,0,1,-y),resample=Image.Resampling.NEAREST)
def RGBdiff(x,y):
 d=ImageChops.difference(x.convert('RGB'),y.convert('RGB'))
 return ImageChops.lighter(ImageChops.lighter(d.getchannel(0),d.getchannel(1)),d.getchannel(2))
def padAlpha(im,n):
 return im.getchannel('A').point(lambda v:255 if v>0 else 0).filter(ImageFilter.MaxFilter(n))
for i,(fa,fb) in enumerate(zip(a['frames'],b['frames'])):
 view=fa['view']
 exact={k:fa.get(k)==fb.get(k) for k in set(fa)|set(fb) if k not in ('pngSHA256','canvasRawSHA256','diagnostic')}
 assert exact and all(exact.values()),(view,exact)
 da,db=fa['diagnostic'],fb['diagnostic']
 assert da['nativeHeads']==db['nativeHeads'] and da['nativeHeadPivot']==db['nativeHeadPivot']
 q=db['counter']['last']
 assert (q['id'],q['x'],q['y'],q['support'],q['phase'],q['round'])==('a4-38-e-1',4530,1751.4,'approved38-upper','aim',1)
 anchor=fb['actors']['slope-warden']['canvasAnchor']
 t=q['transform']
 assert all(abs(t[j]-expected)<.75 for j,expected in ((4,anchor['x']),(5,anchor['y']))),(view,t,anchor)
 assert abs(abs(t[0])-cfg['nativeScale'])<.002 and abs(t[3]-cfg['nativeScale'])<.002 and abs(t[1])+abs(t[2])<.002,(view,t)
 # Elites render at the observed native draw scale, but headPoint has its own stock behavior.
 tx,ty=t[4],t[5]; hx,hy=db['nativeHeadPivot']
 painted_joint_stock=[tx+t[0]*hx+t[2]*hy,ty+t[1]*hx+t[3]*hy]
 # Hand-authored paper moved the head +8,+19 in the registered .65x drawing.
 tangent_shift=[8,19]
 painted_joint_compact=[painted_joint_stock[0]+tangent_shift[0],painted_joint_stock[1]+tangent_shift[1]]
 native_head=db['nativeHeads']['warden']['screen']
 head_mismatch_css=[painted_joint_compact[j]-native_head[k] for j,k in enumerate(('x','y'))]
 r={'view':view,'nativeHeadPointAndControlExact':True,'worldHeight':q['worldHeight'],'drawHeight':q['drawHeight'],
   'nativeDrawTransform':t,'baseArtHeadJointCSS':painted_joint_stock,'compactArtHeadJointCSS':painted_joint_compact,
   'nativeTargetCSS':native_head,'compactArtMinusNativeTargetCSS':head_mismatch_css,
   'damagePopupOrAttack': 'Not emitted in this parked diagnosis; actual popup event alignment remains unverified.',
   'images':[]}
 for fmt,file,hashkey in [('raw','raw','canvasRawSHA256'),('dom','png','pngSHA256')]:
  imgs=[]
  for arm,f in [('A',fa),('B',fb)]:
   data=(OUT/arm/f[file]).read_bytes()
   assert sha(data)==f[hashkey]
   imgs.append(Image.open(io.BytesIO(data)).convert('RGBA'))
  u,v=imgs;size=u.size;assert v.size==size
  shift=(cfg['nativeViewOrigin'][0]+anchor['x']-cfg['referenceAnchor'][0],
         cfg['nativeViewOrigin'][1]+anchor['y']-cfg['referenceAnchor'][1])
  px_models={k:cast(im,size,shift) for k,im in models.items()}
  allowed=ImageChops.lighter(*(padAlpha(im,7) for im in px_models.values()))
  changed=RGBdiff(u,v);outside=ImageChops.multiply(changed,ImageChops.invert(allowed))
  out_n=sum(outside.histogram()[1:]);changed_n=sum(changed.histogram()[1:])
  alpha_n=sum(ImageChops.difference(u.getchannel('A'),v.getchannel('A')).histogram()[1:])
  # The smaller control is a separate, protected actor in each frame.
  small=fb['actors']['slope-small-control']['canvasAnchor']
  control=(round(small['x'])-62,round(small['y'])-99,round(small['x'])+52,round(small['y'])+11)
  control_n=sum(changed.crop(control).histogram()[1:])
  marker=(round(anchor['x'])-42,round(anchor['y'])-202,round(anchor['x'])+42,round(anchor['y'])-166)
  mark_a=u.crop(marker); mark_b=v.crop(marker)
  color_marks={(0xa3,0x43,0x35),(0xe7,0xb8,0x6a),(0xad,0x77,0x6c)}
  ma=Image.new('L',mark_a.size);ma.putdata([255 if c[:3] in color_marks else 0 for c in mark_a.getdata()])
  box=ma.getbbox()
  marker_rect=[marker[0]+box[0],marker[1]+box[1],marker[0]+box[2],marker[1]+box[3]] if box else None
  def opaque_core(model,actual):
   opaque=model.getchannel('A').point(lambda v:255 if v==255 else 0).filter(ImageFilter.MinFilter(3))
   candidates=sum(opaque.histogram()[1:])
   poor=ImageChops.multiply(RGBdiff(model,actual),opaque)
   return {'opaqueCorePixels':candidates,'exactRGB':candidates-sum(poor.histogram()[1:]),
           'thresholdForLocalScreenRegistrationOnly':.96}
  support=None
  core=opaque_core(px_models['compact'],v)
  if fmt=='raw' and view=='slope-warden':
   support={}
   for limb,points in cfg['feet'].items():
    seen=[]
    for sample in points['nativeLocalPixels']:
     x,y=sample['screen']; rg=u.getpixel((x,round(y-sample['walkTangentDistanceY'])))
     expect=px_models['compact'].getpixel((x,y))
     got=v.getpixel((x,y))
     if list(rg[:3])!=sample['unmodifiedStockPaleRGB'] or expect[3]<128:continue
     if max(abs(c-d) for c,d in zip(expect[:3],got[:3]))<=8:seen.append((x,y))
    support[limb]={'matchingDistinctColumns':len({x for x,y in seen}),'observedPixels':seen,
                   'positionsFromApprovedLocalPose':points['distinctColumns']}
   if not all(q['matchingDistinctColumns']>=3 for q in support.values()):problems.append([view,fmt,'not all feet read on original tread'])
  if not changed_n or out_n or alpha_n or control_n or mark_a.tobytes()!=mark_b.tobytes() or not marker_rect:
   problems.append([view,fmt,'ROI, alpha, marker or unrelated control guard',out_n,alpha_n,control_n,marker_rect])
  if core['exactRGB']<.96*core['opaqueCorePixels'] or not core['opaqueCorePixels']:
   problems.append([view,fmt,'compact body differs from approved local SVG raster',core])
  r['images'].append({'format':fmt,'changed':changed_n,'diffBox':changed.getbbox(),'outsideROI':out_n,
      'alphaChanged':alpha_n,'smallActorChangePx':control_n,'fixedEliteMarkerBounds':marker_rect,
      'fixedEliteMarkerImageExact':mark_a.tobytes()==mark_b.tobytes(),'stockAndCompactOpaqueMaskModel':
        {k:im.getchannel('A').getbbox() for k,im in px_models.items()},'nativeCompactOpaqueCore':core,'soleWitness':support})
 results.append(r)
save('COMPARISON.json',{'status':'HOLD' if problems else 'diagnostic match, no product approval',
  'artifactReference':REF['authority'],'gate':'All live pixels outside signed old/new actor mask union (expanded 3 CSS px) exactly equal.',
  'pilotLimits':['Visual change limited to parked first turn, second small-actor control exact.',
    'Native headPoint and visible elite indicator unchanged; report visual delta rather than alter target logic.',
    'No attacks, damage-popup spawn, movement/target geometry validation or actual product change.'],
  'views':results,'problems':problems})
assert not problems,problems
print('Stage38 exact owner/transient native compact diagnostic passed its static gates; unshipped. Inspect target alignment and art independently.')
