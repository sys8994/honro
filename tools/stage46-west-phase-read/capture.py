"""One existing PC West pose, one exact runtime response with scoped native reads."""
import base64,json,os,subprocess,sys,urllib.request
from pathlib import Path
from overlay import patch,need,fact
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes())
O=json.loads((D/'observer.json').read_bytes())
L='https://sys8994.github.io/honro/'
M='web/manifest.json'
def bind():
 need(P['enabled'] is True,'Disabled until Stage41 publication is verified and coordinator binds exact new release.')
 need(not (os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN')),'anonymous only')
 a=P['release'];g=lambda *args:subprocess.check_output(['git',*args],timeout=30,text=True).strip()
 need((os.getenv('GITHUB_REPOSITORY'),os.getenv('GITHUB_EVENT_NAME'),os.getenv('GITHUB_REF'))==('sys8994/honro','push',P['qaRef']),'wrong QA ref')
 h=os.environ['GITHUB_SHA'];c=a['head'];repo=Path(os.environ['GITHUB_WORKSPACE'])
 need(g('rev-list','--parents','-1','HEAD').split()==[h,c] and g('rev-parse',c+'^{tree}')==a['tree'] and
      a['pages']['conclusion']=='success' and a['pages']['head']==c and a['pages']['branch']=='master','wrong pinned live parent')
 allowed={'.github/workflows/stage46-west-phase-read.yml',*(str(D.relative_to(repo)/x)for x in ('capture.py','overlay.py','read-strip.js','observer.json','PINS.json'))}
 need(set(g('diff','--no-renames','--name-status',c,h).splitlines())=={'A\t'+x for x in allowed} and not g('status','--porcelain'),'not exactly an add-only QA child')
 need(g('rev-parse',c+':shared/runtime/act5-edge-art.js')==P['activeSourceGit'] and fact((repo/M).read_bytes())==a['manifest'],'source or manifest does not match the verified deployment')
 need(P['runtime'] in P['route'] and P['phaseRuntimeFact'] and P['activeSourceGit'],'unbound exact compiled phase overlay')
 return a
def fetch(p,pin):
 q=urllib.request.Request(L+p,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache','User-Agent':'Mozilla/5.0 HONRO anonymous render proof'})
 with urllib.request.urlopen(q,timeout=45) as r:
  need(r.geturl()==L+p and r.status==200,'public route not exact: '+p)
  b=r.read(pin['bytes']+1)
 need(fact(b)==pin,'public bytes differ: '+p)
 return b
def rgba(s,w,h):
 b=base64.b64decode(s,validate=True);need(len(b)==w*h*4,'partial native strip');return b
def analyze(s,w,h,center):
 def px(x,y,i):return s[4*(y*w+x)+i]
 peaks=[]
 for y in range(h):
  peak=0
  for i in range(3):
   a,b,c=(px(x,y,i) for x in (center-1,center,center+1))
   peak=max(peak,b-max(a,c),min(a,c)-b)
  peaks.append(peak)
 alpha=s[3::4]
 return {'outlierRowsGE4':sum(k>=4 for k in peaks),'peakDN':max(peaks),'rowPeaks':peaks,
         'alphaMinMax':[min(alpha),max(alpha)],'centerAlphaByRow':[px(center,y,3)for y in range(h)]}
def main(out):
 a=bind();out.mkdir(parents=True,exist_ok=True)
 q={'release':a,'status':'HOLD','scope':'Actual already-known PC West pose, one ephemeral common18 response with read-only pointwise probes. No shots, release, candidate or selected repair.','verifiedHTTP':{}}
 def save():(out/'PHASE.json').write_text(json.dumps(q,indent=2)+'\n')
 save()
 try:
  r=a['shellAndEntry'];needed={**P['route'],r['entryPath']:r['entry'],'HONRO.html':r['shell']}
  public=json.loads(fetch(M,a['manifest']))
  idx={e['path']:{k:e[k]for k in ('bytes','sha256')} for e in public['files']}
  need(all(idx[k]==v for k,v in needed.items()if k!='HONRO.html'),'pinned files not in active public manifest')
  needle=P['runtime'];before=fetch(needle,needed[needle]);after,q['compiled']=patch(before,needed[needle])
  need(fact(after)==P['phaseRuntimeFact'],'exact instrumented response was not sealed')
  from playwright.sync_api import sync_playwright
  with sync_playwright() as pw:
   br=pw.chromium.launch(headless=True);q['browser']=br.version; need(br.version=='151.0.7922.34','unexpected proof browser')
   try:
    c=br.new_context(viewport={'width':1440,'height':900},device_scale_factor=1,service_workers='block')
    p=c.new_page();seen={};notes=[];calls=[]
    p.on('pageerror',lambda e:notes.append(str(e)))
    p.on('response',lambda v:seen.setdefault(v.url,v)if v.url in {L+k for k in needed}else None)
    p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
    def route(h):
     r0=h.fetch(max_redirects=0);b0=r0.body()
     need(r0.status==200 and r0.url==L+needle and b0==before,'exact stock runtime missing or drifted')
     calls.append(fact(b0));h.fulfill(status=200,body=after,headers={'content-type':'application/javascript; charset=utf-8','cache-control':'no-store'})
    p.route(L+needle,route,times=1)
    nav=p.goto(L+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
    need(nav and nav.status==200 and nav.url==L+'HONRO.html' and not nav.from_service_worker,'bad actual shell navigation')
    p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
    p.evaluate("()=>{window.__honroResetDiagnosticSeed();if(HonroApp.audio?.configure)HonroApp.audio.configure({...HonroApp.profile.settings,music:false,sound:false});}")
    p.evaluate(O['LAUNCH'],46);p.locator('#battlecanvas').wait_for(state='visible')
    p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
     return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}""",polling=125,timeout=12000)
    dd=p.evaluate(O['DECODE']);q['decode']=dd;need(dd['registered']>0 and not dd['failed'],'native images unavailable')
    args={'id':46,'mapId':'stage-46','name':'west','dx':-1,'dy':0,'ordinary':None,'readback':False,'fixedNow':O['PHASE']}
    # Start phase reads inside the one existing observer-driven West reposition/draw. 
    data=p.evaluate('(x)=>('+ (D/'read-strip.js').read_text()+')({law:()=>('+O['FROZEN']+')(x.args),pose:x.pose})',{'args':args,'pose':P['pose']})
    q['reading']=data;q['notes']=notes;save()
    s=data['meta'];target=P['pose'];need(len(calls)==1 and not notes,'unexpected browser or response override')
    need(all(s[k]==target[k]for k in ('actual','backing','round','phase','sceneTime','actorCount')),'wrong exact West pose or aim state')
    need(all(abs(s['viewport'][k]-target['viewport'][k])<1e-6 for k in target['viewport']),'West transform drift')
    q['signatures']={'observed':fact(s.pop('signature').encode()),'archivedPhysics':target['archivedPhysics'],
    'note':'The reused observer requires no authored/collision/actor mutation during drawing; archived physics hash is context, not called a byte match.'}
    for k,pin in needed.items():
     response=nav if k=='HONRO.html' else seen.get(L+k)
     need(response and response.status==200 and not response.from_service_worker,'genuine HTTP route did not load '+k)
     actual=fact(response.body());need(actual==(fact(after)if k==needle else pin),'unexpected served bytes '+k)
     q['verifiedHTTP'][k]=actual
    X,Y,w,h=target['strip'];ref=rgba(target['referenceRGBA'],w,h);fin=rgba(data['finalRGBA'],w,h)
    q['stripComparison']={'original':analyze(ref,w,h,278-X),'final':analyze(fin,w,h,278-X),'finalExactArchivedRGBA':fin==ref,
      'finalDiffPixels':sum(fin[i:i+4]!=ref[i:i+4]for i in range(0,len(fin),4)),
      'byPhase':{u['name']:analyze(rgba(u['rgbaBase64'],w,h),w,h,278-X)for u in data['reads']}}
    q['status']='CAPTURED_PHASES_ADMISSIBLE_FOR_REVIEW' if fin==ref else 'HOLD_FINAL_STRIP_NOT_EXACT_ARCHIVED_REFERENCE'
    need(fin==ref,'final strip did not match the archived same-pose source, retain native measurements only')
   finally:br.close()
 except Exception as e:q['error']=repr(e);raise
 finally:save()
if __name__=='__main__':
 if sys.argv[1:]==['--verify-binding']:bind()
 else:main(Path(sys.argv[1]))
