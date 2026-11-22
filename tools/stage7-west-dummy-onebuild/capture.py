"""Same official deployed render A and one normally built B, only PC/M West."""
import base64,json,sys,urllib.request,io
from pathlib import Path
from guard import P,fact,sha,need
O=json.loads((Path(__file__).resolve().parent/'observer.json').read_bytes())
URL={'A':'https://sys8994.github.io/honro/','B':'http://127.0.0.1:18842/'}
def png(raw):
 from PIL import Image
 with Image.open(io.BytesIO(raw))as a:
  a.load();return a.convert('RGBA')
def main(w):
 from playwright.sync_api import sync_playwright
 o=w/'out';g=json.loads((o/'NATIVE-ROUTES.json').read_bytes())
 q={'status':'HOLD','scope':'Actual Stage7 PC/M West: current anonymous Pages A and one normal localhost B; west dummy guide ink only, x<0','views':{}}
 def save():(o/'BROWSER.json').write_text(json.dumps(q,indent=2)+'\n')
 save()
 try:
  m=P['release']['manifest'];url=URL['A']+'web/manifest.json'
  req=urllib.request.Request(url,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache','User-Agent':'Mozilla/5.0 HONRO current stock proof'})
  with urllib.request.urlopen(req,timeout=45)as resp:
   old=resp.read(m['bytes']+1);need(resp.status==200 and resp.geturl()==url and fact(old)==m,'A is not pinned deployed manifest')
  q['publicA']=fact(old)
  with sync_playwright()as pw:
   br=pw.chromium.launch(headless=True);q['browser']=br.version;need(br.version=='151.0.7922.34','unexpected capture browser')
   try:
    for d in P['views']:
     key=d['key'];q['views'][key]={};W,H=d['dims']
     for side in 'AB':
      u=URL[side];route=g['routes'][side];rr={}
      v=q['views'][key][side]={'status':'HOLD','errors':[],'route':{}}
      c=br.new_context(viewport={'width':W,'height':H},device_scale_factor=1,service_workers='block')
      try:
       p=c.new_page()
       p.on('response',lambda r:rr.setdefault(r.url,r) if r.url in {u+k for k in route} else None)
       p.on('pageerror',lambda e:v['errors'].append(str(e)))
       p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
       nav=p.goto(u+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
       need(nav and nav.status==200 and nav.url==u+'HONRO.html' and not nav.from_service_worker,'expected real A/public or B/normal navigation')
       p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
       p.evaluate("()=>{window.__honroResetDiagnosticSeed();if(HonroApp.audio?.configure)HonroApp.audio.configure({...HonroApp.profile.settings,music:false,sound:false});}")
       p.evaluate(O['LAUNCH'],7);p.locator('#battlecanvas').wait_for(state='visible')
       p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
             return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}""",polling=125,timeout=12000)
       args={'id':7,'mapId':'stage-7','name':'west','dx':-1,'dy':0,'ordinary':None,'readback':False,'fixedNow':O['PHASE']}
       meta=p.evaluate(O['FROZEN'],args)['meta']
       try:p.evaluate(O['DECODE']);p.evaluate(O['FROZEN'],{**args,'readback':True})
       except Exception as e:v['errors'].append(repr(e))
       raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True);f=f'{key}-{side}-actual-West-raw.png'
       (o/f).write_bytes(raw);v['PNG']={'path':f,'fact':fact(raw)};save()
       ks=('actual','viewport','backing');v['pose']={k:meta[k]for k in ks};v['physical']=sha(meta['signature'].encode())
       need(all(v['pose'][k]==d[k]for k in ks),'not archived precise West')
       for k,pin in route.items():
        r=rr.get(u+k);need(r and r.status==200 and not r.from_service_worker,('missing actual source',k))
        v['route'][k]=fact(r.body());need(v['route'][k]==pin,('wrong actual source bytes',k))
       need(not v['errors'],'actual load errors')
       v['status']='ACTUAL_CAPTURED'
      except Exception as e:v['errors'].append(repr(e));print(f'{key} {side}: {e}',flush=True)
      finally:c.close();save()
   finally:br.close()
  for k,rec in q['views'].items():
   a,b=(rec[s]for s in 'AB');need(a['status']==b['status']=='ACTUAL_CAPTURED','both current screenshots needed')
   need(a['physical']==b['physical'] and a['pose']==b['pose'],'actual terrain/collision/units or West pose mismatch')
   l,r=(png((o/s['PNG']['path']).read_bytes())for s in (a,b));la,rb=l.tobytes(),r.tobytes();need(l.size==r.size,'layout mismatch')
   p0=a['pose'];t=P['stroke'];z=p0['actual']['scale'];v=p0['viewport']
   X=[(t[k]-v['left'])*z for k in ('left','right')];Y=(t['y']-v['top'])*z
   delta={'target':0,'outside':0,'maxOutsideRGB':0,'alpha':0,'onPlayableOutsideAA':0};cols=set()
   for i in range(0,len(la),4):
    if la[i:i+4]==rb[i:i+4]:continue
    x,y=i//4%l.width+.5,i//4//l.width+.5;s=[rb[i+j]-la[i+j]for j in range(3)]
    delta['alpha']+=la[i+3]!=rb[i+3]
    if X[0]-4<=x<=X[1]+3 and abs(y-Y)<=4:
     delta['target']+=1
     if sum(s)<0:cols.add(i//4%l.width)
    else:
     delta['outside']+=1;delta['maxOutsideRGB']=max(delta['maxOutsideRGB'],*(abs(t)for t in s))
     delta['onPlayableOutsideAA']+=x>=X[1]+3
   delta.update(projected=[*X,Y],darkenedTargetColumns=len(cols))
   rec['delta']=delta;save()
   need(delta['alpha']==0 and delta['maxOutsideRGB']<=2 and len(cols)>=.55*(X[1]-X[0]),
        'old white line removal or preserved rim/art failed; keep actual pictures')
  q['status']='PASS_STAGE7_ACTUAL_TWO_DEVICE_WEST_DUMMY_SCOPE_PENDING_VISUAL_REVIEW'
 finally:save()
if __name__=='__main__':main(Path(sys.argv[1]))
