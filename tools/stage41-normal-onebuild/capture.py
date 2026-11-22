"""Normal compiled B, no intercepted responses or deployed changes; two actual West views."""
import json,base64,sys
from pathlib import Path
from shared import P,need,fact,OBS,sha
from playwright.sync_api import sync_playwright
O=json.loads((Path(__file__).resolve().parent/'observer.json').read_bytes())
LIVE='http://127.0.0.1:18842/'
def main(w):
 out=w/'out';g=json.loads((out/'GRAPH.json').read_bytes()); needed={p:g['B'][p]for p in g['mustObserveB']}
 rec={'status':'HOLD','scope':'Two actual West views on the normally compiled candidate, no routing override; exact comparison to already reviewed B','views':{}}
 def save():(out/'BROWSER.json').write_text(json.dumps(rec,indent=2)+'\n')
 try:
  with sync_playwright() as pw:
   b=pw.chromium.launch(headless=True);rec['chromium']=b.version
   need(b.version=='151.0.7922.34','not trusted rendering browser')
   try:
    for d in P['imageViews']:
     k=d['key'];v=rec['views'][k]={'status':'HOLD','observed':{},'errors':[]}; W,H=d['dims']
     c=b.new_context(viewport={'width':W,'height':H},device_scale_factor=1,service_workers='block')
     try:
      p=c.new_page();responses={};p.on('response',lambda r:responses.setdefault(r.url,r)if r.url in {LIVE+x for x in needed} else None)
      p.on('pageerror',lambda e:v['errors'].append(str(e)))
      p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
      nav=p.goto(LIVE+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
      need(nav and nav.url==LIVE+'HONRO.html' and nav.status==200 and not nav.from_service_worker,'not direct normal shell')
      p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
      p.evaluate("()=>{window.__honroResetDiagnosticSeed();if(HonroApp.audio?.configure)HonroApp.audio.configure({...HonroApp.profile.settings,music:false,sound:false});}")
      p.evaluate(O['LAUNCH'],41);p.locator('#battlecanvas').wait_for(state='visible')
      p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
           return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}""",polling=125,timeout=12000)
      args={'id':41,'mapId':'stage-41','name':'west','dx':-1,'dy':0,'ordinary':None,'readback':False,'fixedNow':O['PHASE']}
      s=p.evaluate(O['FROZEN'],args);dd=None
      try:
       dd=p.evaluate(O['DECODE']);p.evaluate(O['FROZEN'],{**args,'readback':True})
      except Exception as e:v['errors'].append(repr(e))
      img=base64.b64decode(p.evaluate(O['CANVAS']),validate=True);name=k+'-normal-B-West-raw.png'
      (out/name).write_bytes(img);v['PNG']={'path':name,**fact(img)};save()
      v['native']=p.evaluate(OBS);v['decoded']=dd; x=s['meta']
      select=('actual','viewport','backing','css','actorCount','phase','round','sceneTime');v['pose']={i:x[i]for i in select}
      need(all(x[i]==d[i]for i in select) and sha(x['signature'].encode())==d['samePhysical'] and v['native']==d['native'],
           'actual camera, collision/walk/units, or exact native path changed')
      for xid,expect in needed.items():
       rr=responses.get(LIVE+xid);need(rr and rr.status==200 and not rr.from_service_worker,('native URL not loaded',xid))
       v['observed'][xid]=got=fact(rr.body());need(got==expect,('native served bytes differ',xid))
      need(not v['errors'] and dd and dd['registered']>0 and not dd['failed'],'native images/decode not stable')
      v['exactEarlierReviewedPNG']=fact(img)==d['expectedBPNG'];v['status']='CAPTURED_WITH_PINNED_SOURCE';save()
     finally:c.close();save()
   finally:b.close()
  need(len(rec['views'])==2 and all(v['exactEarlierReviewedPNG'] for v in rec['views'].values()),'normal art differs; retain screenshots for review, no automatic seal')
  rec['status']='PASS_NORMAL_B_TWO_ACTUAL_EXACT_REVIEWED_FRAMES_NOT_DEPLOYED'
 finally:save()
if __name__=='__main__':main(Path(sys.argv[1]))
