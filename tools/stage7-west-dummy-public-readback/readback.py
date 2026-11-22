"""Two canonical anonymous live screenshots. No builds or request substitutions."""
import base64,hashlib,json,os,re,subprocess,sys,urllib.request
from pathlib import Path
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes())
O=json.loads((D/'observer.json').read_bytes())
SITE='https://sys8994.github.io/honro/'
MAN='web/manifest.json'
WF='.github/workflows/stage7-west-dummy-public-readback.yml'
def fact(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def need(ok,msg):
 if not ok:raise RuntimeError(msg)
def bind():
 a=P.get('release');need(P['enabled'] is True and isinstance(a,dict),'DISABLED: bind verified master and successful official Pages deployment')
 dep=a['pages'];head=a['head'];tree=a['tree'];g=lambda *args:subprocess.check_output(['git',*args],text=True,timeout=30).strip()
 need(dep['head']==head and dep['branch']=='master' and dep['conclusion']=='success' and
      all(type(dep[k]) is int and dep[k]>0 for k in ('run','job')) and
      re.fullmatch(r'2026-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z',dep['publishedAt']),'source is not verified deployed master')
 need(not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN')) and
      (os.getenv('GITHUB_REPOSITORY'),os.getenv('GITHUB_EVENT_NAME'),os.getenv('GITHUB_REF'))==
      ('sys8994/honro','push',P['qaRef']),'only designated anonymous verification ref')
 route=P['route']; need(isinstance(route,dict),'bind signed normal B active routes')
 keys={'HONRO.html',P['campaign'],P['map'],P['packet'],P['gameEntry'],P['reviewedRuntime']}
 need(None not in keys and len(keys)==6 and set(route)==keys and
      re.fullmatch(r'web/runtime/ordered-common-[0-9]+\.[a-f0-9]{16}\.js',P['reviewedRuntime']) and
      re.fullmatch(r'web/entries/game\.[a-f0-9]{16}\.js',P['gameEntry']) and
      re.fullmatch(r'web/data/campaign\.[a-f0-9]{16}\.json',P['campaign']), 'unexpected normal B route scope')
 official=P['normal']; need(type(official['artifact'])is int and official['artifact']>0 and
     [d['key']for d in P['cameras']]==['PC','M'] and
     all(isinstance(d['expectedBPNG'],dict) and d['expectedBPNG']['bytes']>0 and
         re.fullmatch('[a-f0-9]{64}',d['expectedBPNG']['sha256'])for d in P['cameras']),
     'missing approved exact PC/M normal B pins')
 repo=Path(os.environ['GITHUB_WORKSPACE']);qa=os.environ['GITHUB_SHA']
 files={WF,*(str(D.relative_to(repo)/x)for x in ('PINS.json','observer.json','readback.py'))}
 need(g('rev-list','--parents','-1','HEAD').split()==[qa,head] and g('rev-parse',head+'^{tree}')==tree and
      set(g('diff','--no-renames','--name-status',head,qa).splitlines())=={'A\t'+k for k in files} and not g('status','--porcelain'),
      'not clean exact deployed parent and four QA additions')
 need(fact((repo/MAN).read_bytes())==a['manifest'] and all(fact((repo/k).read_bytes())==v for k,v in P['route'].items()),
      'retained manifest or proven runtime routes differ from exact deployed parent')
 return a
def stage(out):
 a=bind();out.mkdir(parents=True,exist_ok=True)
 from playwright.sync_api import sync_playwright
 q={'status':'HOLD','scope':'Actual anonymous deployed Stage7 West on two devices, exactly one raw per device','release':a,'normal':P['normal'],'visits':{}}
 def save():(out/'BROWSER.json').write_text(json.dumps(q,indent=2)+'\n')
 try:
  r=urllib.request.Request(SITE+MAN,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache','User-Agent':'Mozilla/5.0 HONRO public readback'})
  with urllib.request.urlopen(r,timeout=45) as u:
   raw=u.read(a['manifest']['bytes']+1);need(u.status==200 and u.geturl()==SITE+MAN and fact(raw)==a['manifest'],'exact live retained manifest missing')
  m=json.loads(raw);idx={i['path']:{k:i[k] for k in ('bytes','sha256')}for i in m['files']}
  route=P['route'];need(all(idx.get(k)==v for k,v in route.items() if k!='HONRO.html') and
    m['gameEntry'].split('?')[0]==P['gameEntry'] and P['reviewedRuntime'] in m['common'] and m['project']==P['campaign'],'actual active route differs')
  q['anonymousManifest']=fact(raw);save()
  with sync_playwright() as pw:
   b=pw.chromium.launch(headless=True);q['browser']=b.version;need(b.version=='151.0.7922.34','unexpected actual proof browser')
   try:
    for x in P['cameras']:
     key=x['key'];w,h=x['dims'];f=q['visits'][key]={'status':'HOLD','errors':[],'loaded':{}}
     c=b.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
     try:
      p=c.new_page();responses={};p.on('response',lambda r:responses.setdefault(r.url,r)if r.url in {SITE+k for k in route} else None)
      p.on('pageerror',lambda e:f['errors'].append(str(e)))
      p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
      nav=p.goto(SITE+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
      need(nav and nav.status==200 and nav.url==SITE+'HONRO.html' and not nav.from_service_worker,'not anonymous direct normal shell')
      p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
      p.evaluate("()=>{window.__honroResetDiagnosticSeed();if(HonroApp.audio?.configure)HonroApp.audio.configure({...HonroApp.profile.settings,music:false,sound:false});}")
      p.evaluate(O['LAUNCH'],7);p.locator('#battlecanvas').wait_for(state='visible')
      p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
           return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}""",polling=125,timeout=12000)
      args={'id':7,'mapId':'stage-7','name':'west','dx':-1,'dy':0,'ordinary':None,'readback':False,'fixedNow':O['PHASE']}
      v=p.evaluate(O['FROZEN'],args)['meta']
      try:p.evaluate(O['DECODE']);p.evaluate(O['FROZEN'],{**args,'readback':True})
      except Exception as e:f['errors'].append(repr(e))
      img=base64.b64decode(p.evaluate(O['CANVAS']),validate=True);name=key+'-public-West-raw.png'
      (out/name).write_bytes(img);f['PNG']={'path':name,**fact(img)};save()
      ks=('actual','viewport','backing');f['pose']={k:v[k] for k in ks}
      need(all(v[k]==x[k]for k in ks),'live camera changed')
      for k,pin in route.items():
       s=responses.get(SITE+k);need(s and s.status==200 and not s.from_service_worker,('missing live response',k))
       f['loaded'][k]=fact(s.body());need(f['loaded'][k]==pin,('wrong live response bytes',k))
      f['exactNormalBPNG']=fact(img)==x['expectedBPNG'];need(f['exactNormalBPNG'] and not f['errors'],'live render different, retain observed actual image')
      f['status']='PASS_ANONYMOUS_EXACT_NORMAL_B'
     except Exception as e:f['errors'].append(repr(e));print(f'{key}: {e}',flush=True)
     finally:c.close();save()
   finally:b.close()
  need(len(q['visits'])==2 and all(v['status']=='PASS_ANONYMOUS_EXACT_NORMAL_B'for v in q['visits'].values()),'both live PC/M needed')
  q['status']='PASS_PUBLIC_STAGE7WEST_TWO_ACTUAL_EXACT_NORMAL_B'
 finally:save()
if __name__=='__main__':
 if sys.argv[1:]==['--verify-binding']:bind()
 else:stage(Path(sys.argv[1]))
