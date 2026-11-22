"""Exact historically published 72dd A via tracked localhost vs normally built B. Capture every arm before verdict. No page production writes."""
import base64,io,json,math,sys,urllib.request
from pathlib import Path
from guard import P, fact, sha, need, rd
O=json.loads((Path(__file__).resolve().parent/'observer.json').read_bytes())
URL={'A':'http://127.0.0.1:18881/','B':'http://127.0.0.1:18882/'}
def get(url,stamp):
 r=urllib.request.Request(url,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache','User-Agent':'Mozilla/5.0 HONRO normal active route guard'})
 with urllib.request.urlopen(r,timeout=35) as s:
  need(s.status==200 and s.geturl()==url and fact(s.read(stamp['bytes']+1))==stamp,('wrong real served bytes',url))
 return stamp
def png(data):
 from PIL import Image
 with Image.open(io.BytesIO(data))as p:
  p.load();return p.convert('RGBA')
def same_nums(a,b):
 if isinstance(a,dict):return a.keys()==b.keys() and all(same_nums(a[k],b[k])for k in a)
 if isinstance(a,list):return len(a)==len(b) and all(same_nums(x,y)for x,y in zip(a,b))
 if isinstance(a,(int,float)):return math.isclose(a,b,rel_tol=0,abs_tol=1e-9)
 return a==b
OWNERS="""()=>{const b=HonroApp.engine.b;
const ids=['approved32:coastal-foundation','act4-handoff:32:body-joined'];
const rows=HonroTerrainDomain.materialLandmarks(b);
return {valid:b.honroStage===32&&b.honroCanonical===true&&b.honroCustom===false,
owners:rows.filter(l=>ids.includes(l.asset?.id)).map(l=>[l.asset.id,l.x,l.y,l.scale??1,l.rotation||0,l.layer])};}"""
VALID=[
 ['approved32:coastal-foundation',-5500,-1950,1,0,'structural-back'],
 ['act4-handoff:32:body-joined',0,0,1,0,'mid']]
def slice_left(o,d,A,B):
 from PIL import Image,ImageDraw
 z=d['actual']['scale'];v=d['viewport']; f=lambda x,y:((x-v['left'])*z,(y-v['top'])*z)
 x0,y0=f(230,1766);x1,y1=f(1460,2310)
 box=(max(0,int(x0)),max(0,int(y0)),min(A.width,math.ceil(x1)),min(A.height,math.ceil(y1)))
 ca,cb=(i.crop(box)for i in (A,B)); w,h=ca.size; H=19; alpha=2
 c=Image.new('RGB',(w*alpha*2,h*alpha+H),'#16191e');g=ImageDraw.Draw(c)
 for j,(im,n) in enumerate([(ca,'Official A'),(cb,'Normal B')]): 
  off=j*w*alpha;g.text((off+4,4),n+' left joint: 2x display of real same-pose pixel crop',fill='white');c.paste(im.resize((w*alpha,h*alpha),Image.Resampling.NEAREST),(off,H))
 c.save(o/(d['key']+'-actual-left-detail-display2x.png'))
def main(w):
 from playwright.sync_api import sync_playwright
 o=w/'OUT'/'stage32'; r=json.loads((o/'NATIVE-ROUTES.json').read_bytes())
 q={'status':'HOLD','kind':'actual regular scenes at archived Stage32 S/W/E cameras (W/E negative outside their overlapping visible art)','views':{},'peerHTTP':{}}
 def save():(o/'BROWSER.json').write_text(json.dumps(q,indent=2)+'\n')
 save()
 try:
  a=P['manifest'];q['archivedPublishedA']=get(URL['A']+'web/manifest.json',{k:a[k] for k in ('bytes','sha256')});save()
  for id, rows in r['peerRoutes'].items():
   q['peerHTTP'][id]={}
   for f, expected in rows.items():
    q['peerHTTP'][id][f]={k:get(u+f,expected) for k,u in URL.items()}
  save()
  with sync_playwright() as pw:
   br=pw.chromium.launch(headless=True);q['browser']=br.version;need(br.version=='151.0.7922.34','wrong normal fixture browser')
   try:
    for d in P['devs']:
     key=d['key'];q['views'][key]={};W,H=d['dims']
     for side in 'AB':
      u=URL[side];route=r['routes'][side];net={};v=q['views'][key][side]={'status':'HOLD','errors':[],'route':{}}
      c=br.new_context(viewport={'width':W,'height':H},device_scale_factor=1,service_workers='block')
      try:
       p=c.new_page();urls={u+k for k in route}
       lazyURL=u+P['lazy']['directPath']; archiveRequests=[]
       p.on('response',lambda h:net.setdefault(h.url,h) if h.url in urls else None)
       p.on('request',lambda h:archiveRequests.append(h.url) if h.url==lazyURL else None)
       p.on('pageerror',lambda e:v['errors'].append(str(e)))
       p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
       nav=p.goto(u+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
       need(nav and nav.status==200 and nav.url==u+'HONRO.html' and not nav.from_service_worker,'genuine navigation required')
       p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
       p.evaluate("()=>{window.__honroResetDiagnosticSeed();if(HonroApp.audio?.configure)HonroApp.audio.configure({...HonroApp.profile.settings,music:false,sound:false});}")
       p.evaluate(O['LAUNCH'],32);p.locator('#battlecanvas').wait_for(state='visible')
       p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
        return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}""",polling=125,timeout=12000)
       args={'id':32,'mapId':'stage-32','name':d['name'],'dx':d['dx'],'dy':d['dy'],'readback':False,'fixedNow':O['PHASE']}
       first=p.evaluate(O['FROZEN'],args)['meta']
       try: v['decoded']=p.evaluate(O['DECODE'])
       except Exception as e: v['errors'].append(repr(e))
       meta=p.evaluate(O['FROZEN'],{**args,'readback':True})['meta']
       raw=base64.b64decode(p.evaluate(O['CANVAS']),validate=True);f=f'{key}-{side}-actual-raw.png';(o/f).write_bytes(raw)
       v['PNG']={'file':f,'fact':fact(raw),'historicalStockMatch':side=='A' and sha(raw)==d['rawSHA256']};save()
       dom=p.locator('#battlecanvas').screenshot(animations='disabled');df=f'{key}-{side}-actual-dom.png';(o/df).write_bytes(dom);v['DOM']={'file':df,'fact':fact(dom)};save()
       v['pose']={k:meta[k] for k in ('actual','viewport','backing')};v['physics']=sha(meta['signature'].encode())
       need(same_nums(v['pose'],{k:d[k]for k in v['pose']}) and sha(first['signature'].encode())==v['physics'],'camera or persistent terrain/actor/physics drift')
       v['owners']=p.evaluate(OWNERS);need(v['owners']['valid'] and sorted(v['owners']['owners'])==sorted(VALID),'actual drawn owner registrations missing')
       for k,pin in route.items():
        h=nav if k=='HONRO.html' else net.get(u+k);need(h and h.status==200 and not h.from_service_worker,('missing real response',k))
        v['route'][k]=fact(h.body());need(v['route'][k]==pin,('served bytes mismatch',k))
       v['lazyArchiveRequests']=archiveRequests
       need(not archiveRequests and not v['errors'] and sha(raw)==d['archived'+side] and sha(dom)==d['archivedDom'+side],'fresh game fetched lazy archive, runtime error or approved A/B screen drift');v['status']='ACTUAL_CAPTURED'
      except Exception as e:v['errors'].append(repr(e));print(key,side,e,flush=True)
      finally:c.close();save()
   finally:br.close()
  for d in P['devs']:
   k=d['key'];rec=q['views'][k];a,b=rec['A'],rec['B']
   if any(t['status']!='ACTUAL_CAPTURED' for t in (a,b)):continue
   A,B=(png((o/r['PNG']['file']).read_bytes())for r in (a,b))
   need(A.size==B.size==tuple(d['backing']),'backing canvas changed')
   if d['name']=='south':slice_left(o,d,A,B)
   z=d['actual']['scale'];v=d['viewport'];x0,y0,x1,y1=P['scope']
   la,rb=A.tobytes(),B.tobytes()
   stats={'inside':0,'outside':0,'outsideMaxDN':0,'aboveProtectedY':0,'alpha':0}
   for i in range(0,len(la),4):
    if la[i:i+4]==rb[i:i+4]:continue
    x,y=i//4%A.width,i//4//A.width;X=v['left']+(x+.5)/z;Y=v['top']+(y+.5)/z
    allowed=x0<=X<=x1 and y0<=Y<=y1
    stats['alpha']+=la[i+3]!=rb[i+3];stats['inside']+=allowed;stats['outside']+=not allowed;stats['aboveProtectedY']+=Y<=1790
    if not allowed:stats['outsideMaxDN']=max(stats['outsideMaxDN'],max(abs(la[i+j]-rb[i+j])for j in range(3)))
   rec['guard']=stats
   rec['pass']=a['physics']==b['physics'] and a['pose']==b['pose'] and a['owners']==b['owners'] and stats['inside']>100 and all(stats[k]==0 for k in ('alpha','outside','aboveProtectedY'))
   save()
  need(all(q['views'][d['key']].get('pass') for d in P['devs']),'one or more actual Stage32 checks HOLD; raw remained saved')
  q['status']='PASS_ACTUAL_R10_PENDING_ART_REVIEW'
 finally:save()
if __name__=='__main__':main(Path(sys.argv[1]))
