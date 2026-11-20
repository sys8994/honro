"""One probe only. Expects already-built exact release root, locally served."""
import argparse,hashlib,json,re,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--root',required=True,type=Path)
p.add_argument('--port',required=True,type=int);p.add_argument('--mode',choices=['stock','target'],required=True)
p.add_argument('--out',required=True,type=Path);p.add_argument('--chromium',default=None)
a=p.parse_args()
assert 1024<=a.port<=65535
expected={'stock':'bd647743213807e5c9e2fbb22a385a1c05f578de1ce1b092c3346a6382debd70',
          'target':'3b3ba95261b2b7588447e1b9ee5db8fee4bdb72692e5153a356054fd26b660b0'}[a.mode]
html=(a.root/'HONRO.html').read_bytes()
entry=list(set(re.findall(r'web/entries/game\.[0-9a-f]{16}\.js',html.decode())))
assert len(entry)==1 and hashlib.sha256((a.root/entry[0]).read_bytes()).hexdigest()==expected
origin=f'http://127.0.0.1:{a.port}'
out={'mode':a.mode,'entry':entry[0],'entrySHA256':expected,'timeline':[],'errors':[],'failed':[],'status':[]}
def write():a.out.write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n')
def path(url):
 q=urlparse(url);return q.path if q.hostname=='127.0.0.1' else '(external)'
before=time.monotonic()
def sample(page,note):
 q=page.evaluate("""()=>{const h=document.documentElement,w=window;
  const first=m=>({text:m?.textContent?.trim().slice(0,160),hidden:m?.hidden});
  return {readyState:document.readyState,datasetHonroReady:h?.dataset?.honroReady??null,
   loader:typeof w.HonroCampaignLoader,ensureStage:typeof w.HonroCampaignLoader?.ensureStage,
   skyModule:typeof w.HonroTimeOfDay,skyFunction:typeof w.HonroTimeOfDay?.sky,
   startup:typeof w.HonroStartup,titleScene:typeof w.HonroApp,
   startupStatus:[...document.querySelectorAll('[id*="startup"],[id*="boot"],[id*="retry"],[role="status"]')]
     .slice(0,16).map(e=>({id:e.id,...first(e)})),
   promise:window.__honroExactInitQA?.promise??null,
   rejections:window.__honroExactInitQA?.rejections??[],
   startupText:first(document.querySelector('#honro-startup,#loading,#app [role="status"]')),
   stockPredicate:h?.dataset?.honroReady==='true'&&!!w.HonroCampaignLoader,
   oldCombinedPredicate:h?.dataset?.honroReady==='true'&&!!w.HonroCampaignLoader&&!!w.HonroTimeOfDay?.sky};}""")
 q.update(label=note,seconds=round(time.monotonic()-before,2));out['timeline'].append(q);write()
 return q
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,**({'executable_path':a.chromium} if a.chromium else {}))
  page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
  page.add_init_script('''(()=>{const o={rejections:[],promise:{state:'not registered'}};
   window.__honroExactInitQA=o;
   addEventListener('unhandledrejection',e=>{o.rejections.push(String(e.reason?.message??e.reason).slice(0,350));});
   const timer=setInterval(()=>{const p=window.HONRO_APP_READY;
    if(!p||typeof p.then!=='function')return;
    clearInterval(timer);o.promise={state:'pending'};
    p.then(()=>{o.promise={state:'fulfilled'};},e=>{o.promise={state:'rejected',message:String(e?.message??e).slice(0,350)};});
   },50);
  })();''')
  page.on('pageerror',lambda e:out['errors'].append(str(e)[:350]))
  page.on('requestfailed',lambda r:out['failed'].append([path(r.url),r.resource_type,r.failure]))
  entry_resp=[]
  def observed_response(r):
   if path(r.url)=='/'+entry[0]:entry_resp.append(r)
   if r.status>=400 or path(r.url)=='/'+entry[0]:out['status'].append([path(r.url),r.status])
  page.on('response',observed_response)
  response=page.goto(origin+'/HONRO.html',wait_until='domcontentloaded',timeout=20000)
  assert response and response.ok and hashlib.sha256(response.body()).hexdigest()==hashlib.sha256(html).hexdigest(),'wrong actual hosted HTML'
  html_status=response.status
  out['htmlHTTP']={'status':html_status,'sha256':hashlib.sha256(html).hexdigest()}
  q=sample(page,'domcontentloaded')
  for _ in range(30):
   if q['stockPredicate'] or out['errors'] or q['rejections'] or q.get('promise',{}).get('state')=='rejected' or any(s>=400 for _,s in out['status']):break
   page.wait_for_timeout(1000)
   q=sample(page,'during-stock-readiness')
  if entry_resp and entry_resp[0].status==200:
   body=entry_resp[0].body()
   out['entryHTTP']={'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body),'status':entry_resp[0].status}
   write()
  if q['stockPredicate']:
   assert q['ensureStage']=='function'
   # Exact same boot-to-stage order as the verified original stock runner.
   result=page.evaluate("""()=>Promise.race([(async()=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
     await HonroCampaignLoader.ensureStage(1);
     for(const hero of Object.values(a.profile.heroes))hero.xp=HonroProgression.xpAt(HonroProgression.plan(1).entryLevel);
     a.launch(1);return {stage:a.engine?.b?.honroStage,sky:typeof window.HonroTimeOfDay?.sky};})(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Stage 1 attempted launch exceeded 15s')),15000))])""")
   out['stage1']=result;sample(page,'after-stage1-official-launch')
  browser.close()
except Exception as e:
 out['probeError']=str(e).splitlines()[0][:350]
finally:write()
