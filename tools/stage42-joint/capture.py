"""Real anonymous same camera: exact deployed A + exact normal compilation B, without substitution."""
import base64,io,json,sys,urllib.request
from pathlib import Path
from guard import P,A,M,rd,fact,blob,save
O=json.loads((Path(__file__).resolve().parent/'observer.json').read_bytes())
URL={'A':'https://sys8994.github.io/honro/','B':'http://127.0.0.1:18982/'}
def camera(w):
 from playwright.sync_api import sync_playwright
 from PIL import Image
 q={'status':'HOLD','scope':'Stage42 true PC/M stock vs normal built interior-grain B; no deployment/gameplay','views':{}}
 g=json.loads(rd(w/'out','GRAPH.json'));s=P['nearScale'];xl,yt,xr,yb=P['allowedLocal']
 def receipt():save(w,'BROWSER.json',q)
 receipt()
 def check(ok,n):
  if not ok:raise RuntimeError(n)
 u=URL['A']+M
 with urllib.request.urlopen(urllib.request.Request(u,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache'}),timeout=45) as r:
  b=r.read(A['manifest']['bytes']+1)
  check(r.status==200 and r.geturl()==u and len(b)==A['manifest']['bytes'] and blob(b)==A['manifest']['git'],'exact pinned current public manifest required')
 q['publicManifest']=fact(b)
 with sync_playwright()as pw:
  br=pw.chromium.launch(headless=True);q['browser']=br.version
  check(br.version=='151.0.7922.34','unexpected capture Chromium')
  try:
   for d in P['views']:
    label=d['key'];vw,vh=d['dims'];q['views'][label]={}
    for arm in ('A','B'):
     prev=q['views'][label][arm]={'status':'HOLD','records':{},'errors':[],'routes':{}}
     u=URL[arm];route=g['routes'][arm];responses={};c=br.new_context(viewport={'width':vw,'height':vh},device_scale_factor=1,service_workers='block')
     try:
      p=c.new_page();p.on('response',lambda s:responses.setdefault(s.url,s) if s.url in {u+k for k in route} else None)
      p.on('pageerror',lambda e:prev['errors'].append(str(e)))
      p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
      nav=p.goto(u+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
      check(nav and nav.status==200 and nav.url==u+'HONRO.html' and not nav.from_service_worker,'ordinary native navigation')
      p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
      p.evaluate("()=>{window.__honroResetDiagnosticSeed();if(HonroApp.audio?.configure)HonroApp.audio.configure({...HonroApp.profile.settings,music:false,sound:false});}")
      p.evaluate(O['LAUNCH'],42);p.locator('#battlecanvas').wait_for(state='visible')
      p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}""",polling=125,timeout=12000)
      check(p.evaluate("""()=>{const b=HonroApp.engine.b, owners=HonroTerrainDomain.materialLandmarks(b).filter(x=>x.asset?.id==='act5:near:42');return b.honroStage===42&&b.honroCanonical===true&&b.honroCustom===false&&owners.length===1&&!owners[0].rotation&&!!owners[0].asset.edgeWall&&!!owners[0].asset.edgeSurface;}"""),'exact active stage42 owner missing')
      for pose in d['views']:
       n=pose['name'];dx,dy=pose.get('direction',[0,0])
       args={'id':42,'mapId':'stage-42','name':n if n!='close' else 'ordinary','dx':dx,'dy':dy,'readback':False,'fixedNow':O['PHASE']}
       if n=='close':args['ordinary']=pose['pos']
       m=p.evaluate(O['FROZEN'],args)['meta'];p.evaluate(O['DECODE']);p.evaluate(O['FROZEN'],{**args,'readback':True})
       raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True); k=f'{label}-{arm}-{n}-raw.png'
       (w/'out'/k).write_bytes(raw)
       rec=prev['records'][n]={'path':k,'PNG':fact(raw),'pose':{x:m[x]for x in ('actual','viewport','backing')},'physical':fact(m['signature'].encode())['sha256']}
       receipt()
       if n!='close':check(rec['pose']=={x:pose[x]for x in ('actual','viewport','backing')},'wrong official archived camera '+n)
      for k,v in route.items():
       a=nav if k=='HONRO.html' else responses.get(u+k)
       check(a and a.status==200 and not a.from_service_worker and fact(a.body())==v,('exact real payload not loaded',k))
       prev['routes'][k]=v
      check(not prev['errors'],'browser errors')
      prev['status']='ACTUAL_CAPTURES'
     except Exception as e:prev['errors'].append(repr(e));print(label,arm,repr(e),flush=True)
     finally:c.close();receipt()
  finally:br.close()
 def image(n):
  with Image.open(io.BytesIO(rd(w/'out',n)))as p:return p.convert('RGBA')
 comparisons=[]
 for label,x in q['views'].items():
  aa,bb=(x[n]for n in ('A','B'));check(aa['status']==bb['status']=='ACTUAL_CAPTURES','both real arms must capture')
  check(set(aa['records'])==set(bb['records'])=={'south','west','east','close'},'missing native pose')
  for n,a in aa['records'].items():
   b=bb['records'][n];check(a['pose']==b['pose'] and a['physical']==b['physical'],'actual physical data or pose differs')
   ap=a['pose'];z=ap['actual']['scale']; v=ap['viewport']; x0,y0=v['left'],v['top']; contrast=0;t=0;alpha=0;outside=0
   i,j=(image(vv['path'])for vv in (a,b));W,H=i.size;check(i.size==j.size,'backing size differs')
   r,d=i.tobytes(),j.tobytes()
   for k in range(0,len(r),4):
    dr=max(abs(r[k+c]-d[k+c])for c in range(4))
    if not dr:continue
    t+=1;alpha+=r[k+3]!=d[k+3];contrast=max(contrast,dr)
    x=(x0+(k//4%W+.5)/z)/s;y=(y0+(k//4//W+.5)/z)/s
    outside+=not(xl<=x<=xr and yt<=y<=yb)
   comparisons.append({'device':label,'view':n,'changed':t,'alpha':alpha,'outside':outside,'maxDN':contrast})
 q['comparisons']=comparisons;receipt()
 check(len(comparisons)==8 and all(k['alpha']==k['outside']==0 and k['maxDN']<=1 for k in comparisons),'protected native pixels differ, HOLD')
 q['status']='PASS_STAGE42_ACTUAL_SCOPED_OPTIMIZATION_NO_DEPLOY';receipt()
if __name__=='__main__':camera(Path(sys.argv[1]))
