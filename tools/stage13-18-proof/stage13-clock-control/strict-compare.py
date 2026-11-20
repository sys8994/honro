import sys,json,math
from pathlib import Path
from PIL import Image,ImageChops
D=Path(sys.argv[1]); prior=json.loads(Path(sys.argv[2]).read_text())
j=lambda p:json.loads(p.read_text())
source=[('stock',i) for i in range(4)]+[('metadata',0),('target',0)]
names=['13-initial','13-mason','13-threshold']; p={}
skins=[('mason',1740,1560,.22),('threshold',2940,2038,.24)]
result={'previousUnaffectedOfficialStage22AppRun':44664764243,'unchangedStrictPixelsRequired':True,'isolatedNativeClockOnly':True,'frames':[]}
for view in names:
 obs=[]
 for mode,n in source:
  path=D/mode/str(n)
  if (mode,n) not in p:p[mode,n]=j(path/'proof.json')
  a=dict(p[mode,n][view]);var=a.pop('targetChange');clock=a.pop('raster');sha=a.pop('pngSHA256');rep=a.pop('pngRepeatSHA256')
  assert a['rawRepeatExact'] and sha==rep,('within-profile strict repeat',mode,n,view)
  want=[.35,4] if mode=='stock' else [.22,4]
  assert var=={'range':want,'embeddedRanges':[want,want]}
  assert len({r['rawSHA256'] for r in clock})==1 and all(q['sky']['paintedNativeLayer'] and q['sky']['clockRemainsNative'] and q['sky']['calls']==q['sky']['restores'] and q['sky']['x']==q['sky']['v']==0 and q['sky']['at']==41000 and q['sky']['round']==1 and q['sky']['targetMinutes']==810 for q in clock)
  assert a['stateSHA256']==prior[view]['gameStateSHA256'] and a['camera']==prior[view]['camera']
  image=Image.open(path/(view+'.png')).convert('RGB')
  obs.append((a,clock[0]['rawSHA256'],image,sha))
 for a,raw,image,sha in obs[1:]:
  assert a==obs[0][0] and raw==obs[0][1],('cross-profile actual source/field/support/render state or raw pixels differ',view)
  assert not ImageChops.difference(obs[0][2],image).getbbox(),('whole actual RGB differs even with strict native clock',view)
 xc,yc,sc,w,h=obs[0][0]['camera']; im=obs[0][2]
 bounds=[]
 for id,x,y,z in skins:
  l,t,r,b=[math.floor((x-xc-352*z)*sc+w/2)-4,math.floor((y-yc-269*z)*sc+h/2)-4,math.ceil((x-xc+360*z)*sc+w/2)+4,math.ceil((y-yc+23*z)*sc+h/2)+4]
  l,t,r,b=max(0,l),max(0,t),min(im.width,r),min(im.height,b)
  assert l<r and t<b
  bounds.append({'localProp':id,'box':[l,t,r,b],'protectedRGBExact':True})
 result['frames'].append({'name':view,'proofs':len(obs),'rawSHA256':obs[0][1],'screenSHA256':[x[3] for x in obs],'stateSHA256':obs[0][0]['stateSHA256'],'camera':obs[0][0]['camera'],'footprintMasks':bounds,'allRGBExact':True})
 (D/'strict-stage13-clock-proof.json').write_text(json.dumps(result,indent=2)+'\n')
print('Exactly three actual Stage13 view geometries; four stock fresh A controls, B and C; same whole canvas.')
