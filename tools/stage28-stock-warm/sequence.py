"""Optional instrumentation for exact R2 stock-A, Stage28 390x844 north ONLY.

This helper isn't a product or release gate and is not wired into Actions.
Call with the existing unchanged R2 stock observer, PARK and VERIFY functions
after the exact normal launcher has reached aim. Never run it on the B arm.
"""
import base64, hashlib, io, json, re
from pathlib import Path
from PIL import Image,ImageChops
# Canvas state and phases are observed; no hook, no request routing, no freezes.
VIEW=r"""() => {
 const a=HonroApp,s=a.scene,b=a.engine.b;
 if(!b||b.honroCustom!==false||b.honroStage!==28||b.honroMapOrigin!=='campaign'||b.phase!=='aim'||b.round!==1||s.canvas.width!==390||s.canvas.height!==648||devicePixelRatio!==1)throw Error('wrong immutable diagnostic fixture');
 const small=(x)=>x?{key:x.key??null,size:x.canvas?[x.canvas.width,x.canvas.height]:null,bytes:x.bytes??null}:null;
 const ws=s.renderCacheStats(); const history={};
 for(const [k,x]of Object.entries(ws??{}))if(Number.isFinite(x)&&!k.toLowerCase().endsWith('ms'))history[k]=x;
 const imgs=[...new Set([...document.images,...__honroObserver.images])].filter(x=>x.currentSrc||x.src);
 return {native:{elapsed:performance.now(),time:s.time,walkTime:s.walkTime??null,view:[s.x,s.y,s.scale],
  css:s.canvas.getBoundingClientRect().toJSON(),canvas:[s.canvas.width,s.canvas.height],
  cachedWorld:small(s._screenWorldCache),cachedForeground:small(s._screenForegroundCache),cachedBackground:small(s._screenBackgroundCache),
  nativeTiles:[...s._domainTiles?.tiles?.keys()??[]],counts:history,far:globalThis.HonroAuthoredFarArt?.stats?.()??null,
  grade:typeof s._honroTime,cloud:typeof s._honroClouds,timeline:globalThis.HonroTimeOfDay?.entry?.(b)!=null,
  transport:performance.getEntriesByType('resource').length,images:[imgs.length,imgs.filter(i=>i.complete&&i.naturalWidth>0).length],
  actors:b.units.length,physicalPhase:b.phase,weather:s._weather?.length??null,ripples:s._waterRipples?.length??null},
 png:s.canvas.toDataURL('image/png').split(',')[1]};
}"""
RAF=r"""async n=>{
 for(let k=0;k<n;k++)await new Promise(requestAnimationFrame);
 return performance.now();
}"""
def recollect(png):
 im=Image.open(io.BytesIO(png)).convert('RGBA');im.load();return im
def delta(a,b):
 A,B=map(recollect,[a,b]);assert A.size==B.size==(390,648)
 R=ImageChops.difference(A,B);w,h=A.size
 masks=R.split();any_diff=ImageChops.lighter(ImageChops.lighter(masks[0],masks[1]),ImageChops.lighter(masks[2],masks[3]))
 pixels=any_diff.load()
 arr=[(i,j,int(pixels[i,j]))for j in range(h)for i in range(w)if pixels[i,j]]
 return {'pixelCount':len(arr),'bounds':any_diff.getbbox(),'alphaCount':sum(n!=0 for n in masks[3].getdata()),'maxDN':max((e for x,y,e in arr),default=0),'witnesses':[{'xy':[x,y],'before':A.getpixel((x,y)),'after':B.getpixel((x,y))}for x,y,e in arr[:36]]}
def sha(b):return hashlib.sha256(b).hexdigest()
def probe(page,out,*,park,decode,verify,reference):
 out=Path(out);out.mkdir(exist_ok=False)
 law={'stage':28,'depth':9000}; query={'stage':28,'id':'stage-28','name':'north','dx':0,'dy':-1,'readback':False}
 notes={'status':'DIAGNOSTIC_NOT_STARTED','bReachable':False,'scope':'stock exact A mobile north only; no R2 judgement or candidate'}
 data=[]; stored=[]
 def emit():(out/'TIMELINE.json').write_text(json.dumps(notes,indent=2)+'\n')
 def snap(label):
  tr=page.evaluate(VIEW);bb=base64.b64decode(tr['png'],validate=True);im=recollect(bb)
  assert im.size==(390,648)
  i=len(data);path=f'{i:02d}-{label}.png';(out/path).write_bytes(bb)
  r=dict(label=label,raw=path,pngSHA256=sha(bb),rgbaSHA256=sha(im.tobytes()),native=tr['native'])
  if stored:r['rgbaDiffFromPrevious']=delta(stored[-1],bb)
  data.append(r);stored.append(bb);notes['timeline']=data;emit();return r
 try:
  first=page.evaluate(park,query);notes['nativeSignedPose']=first;snap('first-PARK')
  notes['decode']=page.evaluate(decode);snap('after-DECODE-no-explicit-render')
  second=page.evaluate(park,{**query,'readback':True});notes['parkReadbackMatches']=[second==first];snap('R2-first-readback-PARK')
  v=page.evaluate(verify,law);notes['firstVERIFY']=v;initial=snap('R2-first-VERIFY-original-snapshot')
  notes['r2InitialRawMatchesExactPublic']=initial['pngSHA256']==reference['sha256']
  # A second no-paint observation before the explicit render also catches
  # a pending asynchronously driven draw during the run-loop wait.
  page.evaluate(RAF,2);snap('two-raf-without-explicit-PARK')
  for i in range(4):
   rebound=page.evaluate(park,{**query,'readback':True});notes['parkReadbackMatches'].append(rebound==first)
   snap(f'repeat{i}-PARK'); seen=page.evaluate(verify,law);snap(f'repeat{i}-VERIFY')
   notes.setdefault('repeatVERIFY',[]).append(seen)
  notes['status']='DIAGNOSTIC_SAVED_NOT_A_NORMAL_PASS'
 finally:emit()
 return notes

def exact_r2_sequence(page,out,*,park,decode,verify,png,reference):
 """Original R2 operation order in a fresh stock page; save both preassert PNGs."""
 out=Path(out);out.mkdir(exist_ok=False)
 law={'stage':28,'depth':9000};q={'stage':28,'id':'stage-28','name':'north','dx':0,'dy':-1,'readback':False}
 f=page.evaluate(park,q);d=page.evaluate(decode);p=page.evaluate(park,{**q,'readback':True})
 a=page.evaluate(verify,law);aa=base64.b64decode(page.evaluate(png),validate=True)
 (out/'exact-r2-first.png').write_bytes(aa)
 w=page.evaluate(park,{**q,'readback':True});b=page.evaluate(verify,law);bb=base64.b64decode(page.evaluate(png),validate=True)
 (out/'exact-r2-warm.png').write_bytes(bb)
 notes={'status':'DIAGNOSTIC_NO_CANDIDATE_GATE','rawA':sha(aa),'rawWarm':sha(bb),'rawAExactlyReference':sha(aa)==reference['sha256'],
        'pixelDifference':delta(aa,bb),'sameReadback':f==p==w,'nativeSignedPose':f,'parkReadbackMatches':[p==f,w==f],
        'firstVerifyWarmStateMatches':{k:v for k,v in a.items() if k!='cache'}=={k:v for k,v in b.items() if k!='cache'},'decodeCount':d,'actual':a,'warm':b}
 (out/'EXACT-R2-ORDER.json').write_text(json.dumps(notes,indent=2)+'\n')
 return notes
