"""Current-baseline A/B, not a replay of old desktop pixel hashes."""
import json,math,sys,hashlib
from pathlib import Path
from PIL import Image,ImageChops
OUT=Path(sys.argv[1])
views=('overview','south','southwest','southeast')
expected={(s,w,h,v)for s in (36,37)for w,h in [(1440,900),(390,844)] for v in views}
owner={
 'stock':('2333545a1c7351644f6b6e6644b5977bf752afeda5eb662a22fb2f0eb0d2c24f','5114ae34297c77fab749fe506c840e241356b57587c3b5cc5e5426bcfd65b53f'),
 'target':('8f11aa6896577b768f3845315a170d2804b3570383147b04ed3affc4e7484f83','322b7f65860fa731699ef930f00a74d949be75a892b20fa8e7ac3d7aa3e99d71')}
def j(f):return json.loads(f.read_bytes())
def load(side):
 p=OUT/side; doc=j(p/'proof.json');assert not doc['problems']
 d={};frames=doc['frames'];g=j(OUT/f'{side}-graph.json')
 for f in frames:
  k=f['stage'],f['width'],f['height'],f['view']
  assert k not in d and k in expected
  assert f['within'] and f['clamped']
  assert f['http']=={rel:g['files'][rel]for rel in g['needed'][str(f['stage'])]}
  if f['stage']==36: assert (f['ownerSha'],f['ownerMaskSha'])==owner[side]
  if f['stage']==37: assert f['ownerSha'] is f['ownerMaskSha'] is None
  d[k]=f
 assert len(d)==len(frames)==len(expected)
 return d
a,b=[load(s)for s in ('stock','target')]
result=[];failures=[]
for k in sorted(expected):
 x,y=a[k],b[k]
 for fld in ('stage','view','actual','adjusted','focus','viewport','tide','physicsSha256','actorCount','css','backing','name','projectStage'):
  assert x[fld]==y[fld],(k,fld)
 form=f'act45-s{k[0]:02d}-{k[1]}x{k[2]}-{k[3]}.png'
 assert x['name']==form
 ims=[]
 for s,m in [('stock',x),('target',y)]:
  p=OUT/s/form; assert hashlib.sha256(p.read_bytes()).hexdigest()==m['rasterSha256']
  im=Image.open(p).convert('RGBA');assert list(im.size)==m['backing'];ims.append(im)
 i,k2=ims
 dr=ImageChops.difference(i,k2)
 intensity=ImageChops.lighter(ImageChops.lighter(dr.getchannel(0),dr.getchannel(1)),dr.getchannel(2))
 alphaChanged=sum(dr.getchannel(3).histogram()[1:])
 left,top=x['viewport']['left'],x['viewport']['top']; z=x['actual']['scale']; w,h=i.size
 rect=(math.floor((2255-left)*z)-2,math.floor((1720-top)*z)-2,math.ceil((2407-left)*z)+2,math.ceil((1809-top)*z)+2)
 hist=intensity.histogram(); outside=intensity.copy();outside.paste(0,rect)
 outHist=outside.histogram()
 after=sum(k2.getchannel(2).crop(rect).histogram()[131:]); before=sum(i.getchannel(2).crop(rect).histogram()[131:])
 roiFullyVisible=0<=rect[0]<rect[2]<=w and 0<=rect[1]<rect[3]<=h
 if k[0]==36:
  reasons=[n for n,ok in [('roi-offscreen',roiFullyVisible),('no-change',sum(hist[1:])>0),
      ('strong-change-outside-roi',sum(outHist[5:])==0),('no-bright-sky-reduction',before>after)] if not ok]
 else: reasons=[] if intensity.getbbox() is None else ['unrelated-stage37-pixels-changed']
 if alphaChanged:reasons.append('alpha-changed')
 entry={'stage':k[0],'width':k[1],'height':k[2],'view':k[3],'changed':sum(hist[1:]),
  'bbox':intensity.getbbox(),'roi':rect,'roiFullyVisible':roiFullyVisible,
  'outsideMinor':sum(outHist[1:5]),'outsideStrong':sum(outHist[5:]),
  'brightBlueBefore':before,'brightBlueAfter':after,'alphaChangedPixels':alphaChanged,
  'pass':not reasons,'failures':reasons}
 result.append(entry)
 if reasons:failures.append(entry)
assert len(result)==16
report={'pairs':16,'stage36TargetPairs':sum(q['stage']==36 and q['pass']for q in result),
   'stage37ExactControls':sum(q['stage']==37 and q['pass']for q in result),'success':not failures,
   'scopedToEnclosedRockPocket':True,'fullPlaythrough':False,'rows':result}
(OUT/'CURRENT-POCKET-RESULT.json').write_text(json.dumps(report,indent=2)+'\n')
assert not failures,failures
(OUT/'CURRENT-POCKET-VERIFIED.json').write_text(json.dumps(report,indent=2)+'\n')
