"""Same released A and one normal B, archive minimum-scale East PC/M only."""
import base64,json,sys,urllib.request,io
from pathlib import Path
from guard import P,fact,sha,need,rd
O=json.loads((Path(__file__).resolve().parent/'observer.json').read_bytes())
URL={'A':'https://sys8994.github.io/honro/','B':'http://127.0.0.1:18843/'}
def png(raw):
 from PIL import Image
 with Image.open(io.BytesIO(raw))as a:
  a.load();return a.convert('RGBA')
def walk_columns(terrain,width,z,v):
 rows=[[]for _ in range(width)]
 for t in terrain:
  points=t.get('points') or []
  if not points or t.get('id','') not in P['walkOwnerIDs']: continue
  inds=t.get('properties',{}).get('honroWalkEdges')
  for j,p in enumerate(points):
   q=points[(j+1)%len(points)]
   if inds is not None and j not in inds:continue
   if q['x']<=p['x'] or p['x']>6907.5:continue
   for x in range(max(0,int((p['x']-v['left'])*z)),min(width,int((q['x']-v['left'])*z)+1)):
    X=v['left']+(x+.5)/z
    if p['x']<=X<=min(q['x'],6907.5):
     Y=p['y']+(q['y']-p['y'])*(X-p['x'])/(q['x']-p['x']);o=(Y-v['top'])*z
     if 0<=o<(v['bottom']-v['top'])*z: rows[x].append(o)
 return rows
OWNER_PROOF="""()=>{const b=HonroApp.engine.b;
const names=['west-continuous-geology','lowland-deep-strata','lowland'];
const rows=HonroTerrainDomain.materialLandmarks(b);
return {authoritative33:b.honroStage===33&&b.honroCanonical===true&&b.honroCustom===false,
owners:rows.filter(l=>names.some(n=>l.asset?.id==='act4-sideview:33:coastal-v2:'+n)).map(l=>[l.asset.id,l.x,l.y,l.scale??1,l.rotation||0,l.layer])};}"""
def main(w):
 from playwright.sync_api import sync_playwright
 o=w/'out';g=json.loads((o/'NATIVE-ROUTES.json').read_bytes())
 q={'status':'HOLD','scope':'Actual Stage33 East existing PC/mobile min-scale poses; no HUD/gameplay mutation.','views':{}}
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
    for d in P['devs']:
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
       p.evaluate(O['LAUNCH'],33);p.locator('#battlecanvas').wait_for(state='visible')
       p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
             return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}""",polling=125,timeout=12000)
       args={'id':33,'mapId':'stage-33','name':'east','dx':1,'dy':0,'readback':False,'fixedNow':O['PHASE']}
       meta=p.evaluate(O['FROZEN'],args)['meta']
       try:p.evaluate(O['DECODE']);p.evaluate(O['FROZEN'],{**args,'readback':True})
       except Exception as e:v['errors'].append(repr(e))
       raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True);f=f'{key}-{side}-actual-east-raw.png'
       (o/f).write_bytes(raw);v['PNG']={'path':f,'fact':fact(raw)};save()
       # Existing full screenshots always precede second capture, comparison, source body or ink gates.
       dom=p.locator('#battlecanvas').screenshot(animations='disabled')
       df=f'{key}-{side}-actual-east-dom.png';(o/df).write_bytes(dom);v['DOM']={'path':df,'fact':fact(dom)};save()
       ks=('actual','viewport','backing');v['pose']={k:meta[k]for k in ks};v['physical']=sha(meta['signature'].encode())
       need(all(v['pose'][k]==d[k]for k in ks),'not archived East minimum clamp')
       for k,pin in route.items():
        r=nav if k=='HONRO.html' else rr.get(u+k);need(r and r.status==200 and not r.from_service_worker,('missing actual source',k))
        v['route'][k]=fact(r.body());need(v['route'][k]==pin,('wrong actual source bytes',k))
       need(not v['errors'],'actual load errors')
       v['ownerRoles']=p.evaluate(OWNER_PROOF)
       need(v['ownerRoles']['authoritative33'] and v['ownerRoles']['owners']==P['drawOwners'],'missing exact active landmarks/placements')
       v['status']='ACTUAL_CAPTURED'
      except Exception as e:v['errors'].append(repr(e));print(f'{key} {side}: {e}',flush=True)
      finally:c.close();save()
   finally:br.close()
  terrain=json.loads(rd(w/'B',P['map']))['terrains']
  for k,rec in q['views'].items():
   a,b=(rec[s]for s in 'AB');need(a['status']==b['status']=='ACTUAL_CAPTURED','both current official viewpoints needed')
   need(a['physical']==b['physical'] and a['pose']==b['pose'] and a['ownerRoles']==b['ownerRoles'],'actual terrain/actor/placement geometry or East pose mismatch')
   l,r=(png((o/s['PNG']['path']).read_bytes())for s in (a,b));la,rb=l.tobytes(),r.tobytes();need(l.size==r.size,'layout mismatch')
   z=a['pose']['actual']['scale'];v=a['pose']['viewport']; xl,yt,xr,yb=P['view']
   contact=walk_columns(terrain,l.width,z,v)
   delta={'inside':0,'outside':0,'maxOutsideDN':0,'significantOutside':0,'alpha':0,'protectedLower':0,
     'walkPixels':0,'revealedDarkRimOrSky':0,'nativeContactSamples':sum(len(s)for s in contact),
     'outsideMaxDNExample':[],'status':'HOLD'}
   for i in range(0,len(la),4):
    if la[i:i+4]==rb[i:i+4]:continue
    x,y=i//4%l.width,i//4//l.width;X=v['left']+(x+.5)/z;Y=v['top']+(y+.5)/z
    region=xl<=X<=xr and yt<=Y<=yb
    d=max(abs(la[i+j]-rb[i+j])for j in range(3))
    delta['alpha']+=la[i+3]!=rb[i+3];delta['inside']+=region;delta['outside']+=not region
    delta['protectedLower']+=Y>=P['protectedLower']
    delta['walkPixels']+=any(abs(y+.5-s)<=1.5 for s in contact[x])
    delta['revealedDarkRimOrSky']+=region and la[i]>=la[i+2]+5 and rb[i+2]>=rb[i]+9
    if not region:
     if d>delta['maxOutsideDN']:delta['maxOutsideDN']=d;delta['outsideMaxDNExample']=[x,y,X,Y]
     delta['significantOutside']+=d>=9
   rec['delta']=delta;save()
   need(delta['nativeContactSamples']>0 and delta['inside']>100 and delta['revealedDarkRimOrSky']>(100 if k=='PC' else 20),
        'new east art not registered and visible in intended world window')
   need(all(delta[k]==0 for k in ('alpha','protectedLower','walkPixels','significantOutside')),
        'protected lower/real walk contact or visually relevant outside change; preserve actual captures')
   delta['status']='PASS_SCOPE_PENDING_HUMAN_VISUAL_REVIEW';save()
  q['status']='PASS_STAGE33_ACTUAL_EAST_TWO_POSE_PENDING_ART_REVIEW'
 finally:save()
if __name__=='__main__':main(Path(sys.argv[1]))
