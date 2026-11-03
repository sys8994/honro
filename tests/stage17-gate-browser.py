"""Actual normal Continue/cross/autosave/reload of the exact old R34 gate save.
A continued native-App checkpoint, not fresh playthrough or browser clear evidence.
Only the initial entire-profile import writes storage; all later actions use UI.
"""
import argparse,ast,copy,gzip,hashlib,json,os,re,subprocess,time,traceback,unittest,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
GZIP_SHA='0ae6a6c22718b821f65cadc2882bde026f43774d3c86263a9120e9cd263cdf5e'
RAW_SHA='8eceb8323fbfb4965d6b7d3a751dfd9fcefd6de473bc2c801b83defc042434d2'
PUBLIC_URL='https://sys8994.github.io/honro/HONRO.html'
PUBLIC_BASE='https://sys8994.github.io/honro/'
KEY='honro-first-act-profile-1'
FIELDS=['id','cls','side','hp','maxHp','focus','maxFocus','moveLeft','dead','loadout','equipmentIds']
GEOMETRY=['id','x','y','w','h','vertices','mat','oneWay']
POSITION_TOLERANCE=.05

def battle_receipt(b,profile):
 state=b['honroState']['act23v4'];proof=state['earlyAct2']['proof']
 return {'stage':b['honroStage'],'round':b['round'],'side':b['side'],'phase':b['phase'],'active':b['active'],
  'shots':b['shots'],'shotId':b['shot'],'done':state['done'],
  'proof':{k:proof.get(k) for k in ['17.mesh','17.lock']},
  'markers':{m['id']:bool(m.get('collected')) for m in b['honroMarkers']},
  'party':profile['party'],'recruited':profile['recruited'],
  'actors':[{**{k:u.get(k) for k in FIELDS},'x':u['x'],'y':u['y'],'r':u['r']} for u in b['units'] if u['side']==0 and not u.get('summoned')],
  'gates':[{**{k:t.get(k) for k in GEOMETRY},'broken':bool(t.get('broken'))} for terrain in [b['terrain'],b['honroWorldTerrain']] for t in terrain if t['id']=='gate-repair']}

SNAPSHOT='''()=>{const a=HonroApp,e=a.engine,b=e?.b,p=a.profile;
 const project=(b,p)=>{if(!b)return null;const m=b.honroState?.act23v4,proof=m?.earlyAct2?.proof||{};
 const fields=['id','cls','side','hp','maxHp','focus','maxFocus','moveLeft','dead','loadout','equipmentIds','x','y','r'];
 return {stage:b.honroStage,round:b.round,side:b.side,phase:b.phase,active:b.active,shots:b.shots,shotId:b.shot,
 done:m?.done,proof:Object.fromEntries(['17.mesh','17.lock'].map(k=>[k,proof[k]??null])),
 markers:Object.fromEntries((b.honroMarkers||[]).map(m=>[m.id,!!m.collected])),party:p.party,recruited:p.recruited,
 actors:b.units.filter(u=>u.side===0&&!u.summoned).map(u=>Object.fromEntries(fields.map(k=>[k,u[k]??null]))),
 gates:[b.terrain,b.honroWorldTerrain].flatMap(ts=>(ts||[]).filter(t=>t.id==='gate-repair').map(t=>({...Object.fromEntries(['id','x','y','w','h','vertices','mat','oneWay'].map(k=>[k,t[k]??null])),broken:!!t.broken})))};};
 const stored=JSON.parse(localStorage.getItem('honro-first-act-profile-1')||'null');
 return {time:performance.now(),screen:a.screen,dialogue:!!a.dialogue,dialogueRow:a.dialogue?.lines?.[a.dialogue.index]?.[2]?.rowId??null,dialogueText:a.dialogue?.lines?.[a.dialogue.index]?.[1]??null,can:!!a.canInput(),grounded:!!(e?.active&&e.grounded(e.active)),
 locked:!!a.profileStore.locked,warning:!!document.getElementById('outcome-save-warning'),live:project(b,p),stored:stored&&project(stored.honroBattle,stored)};}'''

def check_gate(receipt):
 assert receipt and receipt['stage']==17,'Missing actual Stage17 battle'
 assert len(receipt['gates'])==2 and all(g['broken'] for g in receipt['gates']),'Repair gate must open in collision AND world terrain'
 mesh=receipt['proof']['17.mesh'];lock=receipt['proof']['17.lock']
 assert receipt['done'].get('17.mesh') and receipt['done'].get('17.lock'),'Missing completed assembly/lock'
 assert mesh and mesh.get('worker')=='17.mason' and mesh.get('parts',{}).get('workerCarrier')=='17.gilchan','Missing genuine assembly proof'
 assert lock and lock.get('pinSeated') is True,'Missing genuine seated-pin proof'

def active(receipt):return next(u for u in receipt['actors'] if u['id']==receipt['active'])

def preserved(before,after,movement=False):
 for k in ['stage','round','side','phase','active','shots','shotId','done','proof','markers','party','recruited']:
  assert after[k]==before[k],f'Unexpected progression/combat change: {k}'
 assert len(after['actors'])==len(before['actors']),'Party actor count changed'
 old={u['id']:u for u in before['actors']}
 for u in after['actors']:
  assert u['id'] in old,'Party identity changed'
  for k in FIELDS:
   if movement and u['id']==after['active'] and k=='moveLeft':
    assert 0<=u[k]<old[u['id']][k],'Walking must spend ordinary movement, not refill it'
   else:assert u[k]==old[u['id']][k],f'Party resource/identity changed: {u["id"]}.{k}'
  if not movement or u['id']!=after['active']:
   for k in ['x','y']:assert abs(u[k]-old[u['id']][k])<=POSITION_TOLERANCE,f'Uncommanded party displacement: {u["id"]}.{k}'
 assert len(before['gates'])==len(after['gates'])==2
 for a,b in zip(before['gates'],after['gates']):
  assert all(a[k]==b[k] for k in GEOMETRY),'Existing gate geometry changed'

def crossed(receipt):
 u=active(receipt);gate=receipt['gates'][0]
 return u['x']-u['r']>gate['x']+gate['w']+2 and gate['y']<u['y']-u['r']<gate['y']+gate['h']

def resume_walk_after_dialogue(page,interrupted,records):
 # The observed one-shot clear-sightline narration is not a choice or objective.
 # Release movement before Next; require exact battle preservation while paused.
 page.keyboard.up('ArrowRight')
 deadline=time.monotonic()+15
 while time.monotonic()<deadline:
  s=page.evaluate(SNAPSHOT)
  assert not s['locked'] and not s['warning'],'Save blocked during walking dialogue'
  check_gate(s['live']);preserved(interrupted['live'],s['live'])
  if not s['dialogue']:
   if s['can'] and s['grounded']:
    page.keyboard.down('ArrowRight');return s
  else:
   assert s['dialogueRow']=='A2.S17.MID.11','Unexpected walking dialogue requires review, not automatic choices'
   nxt=page.locator('[data-action="dialogue-next"]:visible')
   assert nxt.count()==1,'Expected one normal dialogue Next button'
   if nxt.first.is_enabled():
    records.append({'row':s['dialogueRow'],'text':s['dialogueText'],'input':'dialogue-next click','time':s['time']})
    nxt.first.click()
  page.wait_for_timeout(50)
 raise AssertionError('Authored walking dialogue did not restore ordinary input within15s')

def public_identity(root,fetch):
 expected={f['path']:f['sha256'] for f in json.loads((root/'web/manifest.json').read_text())['files']}
 for name in ['HONRO.html','web/manifest.json']:
  expected[name]=hashlib.sha256((root/name).read_bytes()).hexdigest()
  assert hashlib.sha256(fetch(PUBLIC_BASE+name)).hexdigest()==expected[name],'Public deployment does not match exact candidate: '+name
 # Legacy BGM lives outside web/manifest.json, but is still exact Git-tracked
 # candidate content. Do not trust arbitrary local files or expand to unknown URLs.
 for name in subprocess.check_output(['git','ls-files','assets/bgm'],cwd=root,text=True).splitlines():
  expected[name]=hashlib.sha256((root/name).read_bytes()).hexdigest()
 return expected

def verify_public_response(url,body,expected,content_range=None,root=None):
 assert url.startswith(PUBLIC_BASE),'Unexpected external browser resource: '+url
 name=url[len(PUBLIC_BASE):].split('?',1)[0]
 assert name in expected,'Public resource absent from verified candidate manifest: '+name
 digest=hashlib.sha256(body).hexdigest()
 if content_range:
  match=re.fullmatch(r'bytes (\d+)-(\d+)/(\d+)',content_range)
  assert match and root,'Invalid public range response'
  start,end,total=map(int,match.groups());local=(root/name).read_bytes()
  assert hashlib.sha256(local).hexdigest()==expected[name] and total==len(local),'Range candidate identity mismatch'
  assert 0<=start<=end<total and body==local[start:end+1],'Actual public range bytes differ from candidate'
  return {'path':name,'sha256':digest,'bytes':len(body),'contentRange':content_range,'fullCandidateSha256':expected[name]}
 assert digest==expected[name],'Actual public browser bytes differ from candidate: '+name
 return {'path':name,'sha256':digest,'bytes':len(body)}

class PublicObserver:
 """Browser-body proof for executable/data resources; separately labeled asset GETs."""
 def __init__(self,root,expected,fetch,receipt,errors):
  self.root=root;self.expected=expected;self.fetch=fetch;self.receipt=receipt;self.errors=errors
  self.pending={};self.assets={}
  receipt.update(unavailableBodies=[],assetFetches=[])
 def asset(self,request):return request.resource_type in {'media','image','font'}
 def started(self,request):self.pending[request]=None
 def drain(self,page):
  deadline=time.monotonic()+10
  while any(not self.asset(request) for request in self.pending) and time.monotonic()<deadline:page.wait_for_timeout(50)
  assert not any(not self.asset(request) for request in self.pending),'Executable/data requests did not complete before navigation/close'
 def response(self,response):
  request=response.request;self.pending[request]=response
  if response.status not in [200,206]:self.errors.append(f'Public HTTP {response.status}: {response.url}')
  if self.asset(request):self.assets[response.url]=request.resource_type
 def finished(self,request):
  response=self.pending.pop(request,None)
  if not response:return
  # Read only completed responses, including available HTTP206 media slices.
  # Cancelled/unavailable assets retain separately labeled full public GET proof.
  try:
   body=response.body()
  except Exception as error:
   item={'url':response.url,'type':request.resource_type,'reason':str(error)}
   self.receipt['unavailableBodies'].append(item)
   if not self.asset(request):self.errors.append('Missing actual executable/data browser body: '+json.dumps(item))
   return
  try:self.receipt['browserResponses'].append(verify_public_response(response.url,body,self.expected,response.header_value('content-range') if response.status==206 else None,self.root))
  except Exception as error:self.errors.append('Public response identity '+response.url+': '+str(error))
 def failed(self,request):
  response=self.pending.pop(request,None)
  item={'url':request.url,'type':request.resource_type,'reason':request.failure}
  self.receipt['unavailableBodies'].append(item)
  if self.asset(request):self.assets[request.url]=request.resource_type
  else:self.errors.append('Failed executable/data browser request: '+json.dumps(item))
 def finish(self):
  for request,response in self.pending.items():
   if self.asset(request):self.assets[request.url]=request.resource_type
   else:self.errors.append('Unfinished executable/data browser response: '+request.url)
  for url,kind in self.assets.items():
   try:
    item=verify_public_response(url,self.fetch(url),self.expected)
    self.receipt['assetFetches'].append({**item,'url':url,'type':kind,'evidence':'independent public GET, not browser response body'})
   except Exception as error:self.errors.append('Public asset identity '+url+': '+str(error))

def run(args):
 from playwright.sync_api import sync_playwright
 out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
 result={'passed':False,'scope':__doc__,'errors':[],'samples':[],'positionTolerancePx':POSITION_TOLERANCE}
 def save():(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
 try:
  compressed=Path(args.fixture).read_bytes();raw=gzip.decompress(compressed)
  assert hashlib.sha256(compressed).hexdigest()==GZIP_SHA and hashlib.sha256(raw).hexdigest()==RAW_SHA,'Exact genuine fixture hash mismatch'
  original=json.loads(raw);profile=original['profile'];assert profile['honroBattle']==original['b'],'Wrapper/profile battle mismatch'
  baseline=battle_receipt(profile['honroBattle'],profile)
  assert baseline['round']==34 and baseline['side']==0 and baseline['phase']=='aim' and baseline['active']=='p-archer'
  assert len(baseline['gates'])==2 and not any(g['broken'] for g in baseline['gates']),'Fixture must retain old closed gate'
  assert not baseline['done'].get('17.defense'),'Fixture already skipped defense'
  u=active(baseline);assert u['x']+u['r']<baseline['gates'][0]['x'],'Fixture actor must start left of gate'
  serialized=json.dumps(profile,ensure_ascii=False,separators=(',',':'))
  result.update(source=os.environ.get('GITHUB_SHA') or subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
   fixture=str(args.fixture),fixtureGzipSha256=GZIP_SHA,fixtureRawSha256=RAW_SHA,profileSha256=hashlib.sha256(serialized.encode()).hexdigest(),
   provenance=original['provenance'],baseline=baseline,servedSha256={f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['HONRO.html','web/manifest.json']})
  result['url']=args.url
  expected_public=None
  if args.url==PUBLIC_URL:
   def fetch_public(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={'Cache-Control':'no-cache'}),timeout=45) as response:
     assert response.geturl()==url,'Unexpected public redirect'
     return response.read()
   expected_public=public_identity(ROOT,fetch_public)
   result['publicIdentity']={'htmlAndManifestMatched':True,'browserResponses':[]}
  save()
  with sync_playwright() as w:
   browser=w.chromium.launch(headless=True);page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:result['errors'].append(str(e)))
   observer=None
   if expected_public:
    observer=PublicObserver(ROOT,expected_public,fetch_public,result['publicIdentity'],result['errors'])
    page.on('request',observer.started);page.on('response',observer.response);page.on('requestfinished',observer.finished);page.on('requestfailed',observer.failed)
   def snapshot(label):
    s=page.evaluate(SNAPSHOT);result[label]=s;save();return s
   def ready():
    deadline=time.monotonic()+60
    while time.monotonic()<deadline:
     s=page.evaluate(SNAPSHOT)
     assert not s['locked'] and not s['warning'],'Profile save/load blocked'
     if s['dialogue']:
      nxt=page.locator('[data-action="dialogue-next"]:visible')
      if nxt.count() and nxt.first.is_enabled():nxt.first.click()
      else:page.keyboard.press('Enter')
     elif s['live'] and s['live']['stage']==17 and s['can'] and s['grounded']:return s
     page.wait_for_timeout(50)
    raise AssertionError('Normal Continue did not reach grounded Stage17 input')
   try:
    page.goto(args.url,wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000)
    page.evaluate('(text)=>localStorage.setItem("honro-first-act-profile-1",text)',serialized)
    if observer:observer.drain(page)
    page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000)
    started=time.monotonic();page.locator('.title-actions [data-action="continue"]:visible').first.click();ready()
    loaded=snapshot('initialLoad');result['initialNormalFrameWindowMs']=round((time.monotonic()-started)*1000)
    check_gate(loaded['live']);preserved(baseline,loaded['live'])
    page.screenshot(path=str(out/'repaired-before-crossing.png'))
    # A single held direction, never stop/start pulses or hidden state/frame writes.
    deadline=time.monotonic()+20;before=page.evaluate(SNAPSHOT)
    assert before['can'] and before['grounded'];preserved(loaded['live'],before['live'])
    page.keyboard.down('ArrowRight')
    try:
     while time.monotonic()<deadline:
      s=page.evaluate(SNAPSHOT)
      if s['dialogue']:
       page.screenshot(path=str(out/'crossing-dialogue.png'))
       preserved(loaded['live'],s['live'],movement=True)
       s=resume_walk_after_dialogue(page,s,result.setdefault('walkingDialogue',[]))
      r=s['live'];assert s['can'] and r['active']==baseline['active'] and r['round']==34,'Input context changed during bounded crossing'
      a=active(r);result['samples'].append({'time':s['time'],'x':a['x'],'y':a['y'],'moveLeft':a['moveLeft'],'grounded':s['grounded']})
      assert a['moveLeft']>3,'Crossing exhausted ordinary movement'
      if crossed(r):break
      assert a['x']<baseline['gates'][0]['x']+baseline['gates'][0]['w']+200,'Overshot bounded gate corridor'
      page.wait_for_timeout(16)
     else:raise AssertionError('Ordinary input did not cross repaired passage within20s')
    finally:page.keyboard.up('ArrowRight')
    ready();page.wait_for_timeout(150);moved=snapshot('crossed');check_gate(moved['live']);preserved(loaded['live'],moved['live'],movement=True);assert crossed(moved['live'])
    page.screenshot(path=str(out/'crossed-repaired-gate.png'))
    # Normal dirty movement autosave (production throttle is1200ms), no persist call.
    deadline=time.monotonic()+10
    while time.monotonic()<deadline:
     s=page.evaluate(SNAPSHOT)
     if s['stored']:
      try:
       check_gate(s['stored']);preserved(s['live'],s['stored']);assert crossed(s['stored']);break
      except AssertionError:pass
     page.wait_for_timeout(100)
    else:raise AssertionError('Normal autosave did not retain gate, resources and crossed position')
    saved=snapshot('autosaved');preserved(loaded['live'],saved['live'],movement=True)
    if observer:observer.drain(page)
    page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000)
    page.locator('.title-actions [data-action="continue"]:visible').first.click();ready()
    restored=snapshot('reloaded');check_gate(restored['live']);preserved(saved['stored'],restored['live']);assert crossed(restored['live'])
    page.screenshot(path=str(out/'reloaded-crossed-gate.png'))
    if expected_public:
     # Drain completed finite code/data loads before collecting evidence; no
     # frame freezing or input writes, and no media response-body blocking.
     observer.drain(page)
     observer.finish()
     names={item['path'] for item in result['publicIdentity']['browserResponses']}
     assert 'HONRO.html' in names and any(name.endswith('.js') for name in names) and any(name.endswith('.json') for name in names),'Missing actual public game/data response evidence'
    result['passed']=not result['errors'];save()
   except Exception:
    try:snapshot('failureState')
    except Exception as observer_error:result['failureObserverError']=str(observer_error)
    try:page.screenshot(path=str(out/'failure.png'))
    except Exception as screenshot_error:result['failureScreenshotError']=str(screenshot_error)
    raise
   finally:
    if observer:
     page.remove_listener('request',observer.started);page.remove_listener('response',observer.response);page.remove_listener('requestfinished',observer.finished);page.remove_listener('requestfailed',observer.failed)
    browser.close()
 except Exception:result['exception']=traceback.format_exc();result['passed']=False
 finally:save()
 return 0 if result['passed'] else 1

class HelperTests(unittest.TestCase):
 def sample(self):
  actor={k:None for k in FIELDS};actor.update(id='p-archer',cls='archer',side=0,hp=100,maxHp=100,focus=50,maxFocus=50,moveLeft=500,dead=False,x=80,y=50,r=2)
  gate={k:None for k in GEOMETRY};gate.update(id='gate-repair',x=100,y=0,w=10,h=100,broken=True)
  return {'stage':17,'round':34,'side':0,'phase':'aim','active':'p-archer','shots':77,'shotId':150,'done':{'17.mesh':True,'17.lock':True},'proof':{'17.mesh':{'worker':'17.mason','parts':{'workerCarrier':'17.gilchan'}},'17.lock':{'pinSeated':True}},'markers':{},'party':['archer'],'recruited':['archer'],'actors':[actor],'gates':[copy.deepcopy(gate),copy.deepcopy(gate)]}
 def test_all_browser_injected_javascript_parses(self):
  expressions=[]
  for call in ast.walk(ast.parse(Path(__file__).read_text())):
   if not isinstance(call,ast.Call) or not isinstance(call.func,ast.Attribute):continue
   if call.func.attr not in {'evaluate','wait_for_function','add_init_script'}:continue
   value=call.args[0]
   if isinstance(value,ast.Name):
    self.assertEqual(value.id,'SNAPSHOT','New dynamic browser expression needs explicit parse coverage')
    expressions.append(SNAPSHOT)
   else:
    self.assertIsInstance(value,ast.Constant)
    expressions.append(value.value)
  self.assertGreaterEqual(len(expressions),5)
  subprocess.run(['node','-e',"const xs=JSON.parse(require('fs').readFileSync(0,'utf8'));for(const x of xs)new Function('return ('+x+');');"],input=json.dumps(expressions),text=True,check=True)
 def test_browser_snapshot_executes_and_matches_reference(self):
  expected=self.sample()
  b={'honroStage':17,'round':34,'side':0,'phase':'aim','active':'p-archer','shots':77,'shot':150,
   'honroState':{'act23v4':{'done':expected['done'],'earlyAct2':{'proof':expected['proof']}}},
   'honroMarkers':[],'units':expected['actors'],'terrain':[expected['gates'][0]],'honroWorldTerrain':[expected['gates'][1]]}
  profile={'party':expected['party'],'recruited':expected['recruited'],'honroBattle':b}
  # Execute the exact browser expression, not a parallel Python-only implementation.
  # The observer must also tolerate the normal no-battle interval after Continue.
  harness="""const fs=require('fs'),v=JSON.parse(fs.readFileSync(0,'utf8'));
   global.HonroApp={engine:{b:v.b,active:v.b?.units[0],grounded:()=>true},profile:v.profile,
    screen:'battle',dialogue:null,canInput:()=>!!v.b,profileStore:{locked:false}};
   global.localStorage={getItem:()=>JSON.stringify(v.profile)};
   global.document={getElementById:()=>null};
   process.stdout.write(JSON.stringify(eval('('+v.expression+')')()));"""
  for live_b in [b,None]:
   raw=subprocess.check_output(['node','-e',harness],input=json.dumps({'expression':SNAPSHOT,'b':live_b,'profile':profile}),text=True)
   observed=json.loads(raw)
   self.assertEqual(observed['live'],expected if live_b else None)
   self.assertEqual(observed['stored'],expected)
   self.assertFalse(observed['locked']);self.assertFalse(observed['warning'])
   self.assertEqual(observed['can'],bool(live_b))
 def test_walking_dialogue_releases_next_then_resumes_without_mutation(self):
  from types import SimpleNamespace
  before={'live':self.sample(),'dialogue':True,'dialogueRow':'A2.S17.MID.11','dialogueText':'authored line','time':1,'locked':False,'warning':False,'can':False,'grounded':True}
  after={**before,'dialogue':False,'can':True}
  events=[];states=iter([before,after]);button=SimpleNamespace(is_enabled=lambda:True,click=lambda:events.append('Next'))
  page=SimpleNamespace(keyboard=SimpleNamespace(up=lambda k:events.append('up'),down=lambda k:events.append('down')),
   evaluate=lambda expression:next(states),locator=lambda selector:SimpleNamespace(count=lambda:1,first=button),wait_for_timeout=lambda ms:None)
  records=[];self.assertEqual(resume_walk_after_dialogue(page,before,records),after)
  self.assertEqual(events,['up','Next','down']);self.assertEqual(records[0]['row'],'A2.S17.MID.11')
  for change in ['unknown-row','resource-change']:
   bad=copy.deepcopy(before)
   if change=='unknown-row':bad['dialogueRow']='choice'
   else:bad['live']['actors'][0]['hp']-=1
   states=iter([bad]);events.clear()
   with self.assertRaises(AssertionError):resume_walk_after_dialogue(page,before,[])
   self.assertEqual(events,['up'])
 def test_public_bytes_must_match_candidate_and_known_origin(self):
  good=b'candidate game';expected={'web/game.js':hashlib.sha256(good).hexdigest()}
  self.assertEqual(verify_public_response(PUBLIC_BASE+'web/game.js',good,expected)['path'],'web/game.js')
  import tempfile
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);(root/'web').mkdir();(root/'web/game.js').write_bytes(good)
   self.assertEqual(verify_public_response(PUBLIC_BASE+'web/game.js',good[2:5],expected,'bytes 2-4/14',root)['bytes'],3)
   with self.assertRaises(AssertionError):verify_public_response(PUBLIC_BASE+'web/game.js',b'bad',expected,'bytes 2-4/14',root)
  for url,body in [(PUBLIC_BASE+'web/game.js',b'stale'),('https://other.example/web/game.js',good),(PUBLIC_BASE+'unknown.js',good)]:
   with self.assertRaises(AssertionError):verify_public_response(url,body,expected)
 def test_public_observer_completed_code_and_separate_streamed_assets(self):
  from types import SimpleNamespace
  class Request:
   def __init__(self,path,kind):self.url=PUBLIC_BASE+path;self.resource_type=kind;self.failure='net::ERR_ABORTED'
  code=b'code';audio=b'audio';expected={'web/game.js':hashlib.sha256(code).hexdigest(),'assets/bgm/battle-4.mp3':hashlib.sha256(audio).hexdigest()}
  receipt={'browserResponses':[]};errors=[];observer=PublicObserver(ROOT,expected,lambda url:audio,receipt,errors)
  request=Request('web/game.js','script');response=SimpleNamespace(request=request,url=request.url,status=200,body=lambda:code)
  observer.response(response);self.assertEqual(receipt['browserResponses'],[])
  observer.finished(request);self.assertEqual(len(receipt['browserResponses']),1)
  request=Request('assets/bgm/battle-4.mp3','media');response=SimpleNamespace(request=request,url=request.url,status=206,body=lambda:self.fail('Streaming body must not be read'))
  observer.response(response);observer.failed(request);observer.finish()
  self.assertEqual(errors,[]);self.assertEqual(len(receipt['assetFetches']),1)
  self.assertIn('not browser response body',receipt['assetFetches'][0]['evidence'])
  request=Request('web/game.js','script');observer.failed(request)
  self.assertTrue(any('Failed executable/data' in e for e in errors))
 def test_public_observer_drains_before_reload_and_rejects_unknown_asset(self):
  from types import SimpleNamespace
  request=type('Request',(),{'url':PUBLIC_BASE+'web/game.js','resource_type':'script'})()
  receipt={'browserResponses':[]};errors=[];body=b'code';observer=PublicObserver(ROOT,{'web/game.js':hashlib.sha256(body).hexdigest()},lambda url:b'unknown',receipt,errors)
  response=SimpleNamespace(request=request,url=request.url,status=200,body=lambda:body)
  observer.started(request);observer.response(response);calls=[]
  def tick(ms):calls.append(ms);observer.finished(request)
  observer.drain(SimpleNamespace(wait_for_timeout=tick))
  self.assertEqual(calls,[50]);self.assertEqual(len(receipt['browserResponses']),1)
  bad=type('Request',(),{'url':PUBLIC_BASE+'assets/unknown.mp3','resource_type':'media','failure':'net::ERR_ABORTED'})()
  observer.failed(bad);observer.finish();self.assertTrue(any('absent from verified candidate' in e for e in errors))
 def test_public_observer_does_not_mask_mismatched_or_unavailable_code(self):
  from types import SimpleNamespace
  request=type('Request',(),{'url':PUBLIC_BASE+'web/game.js','resource_type':'script'})()
  for body in [lambda:b'wrong',lambda:(_ for _ in ()).throw(RuntimeError('unavailable'))]:
   receipt={'browserResponses':[]};errors=[];observer=PublicObserver(ROOT,{'web/game.js':hashlib.sha256(b'correct').hexdigest()},lambda url:b'correct',receipt,errors)
   response=SimpleNamespace(request=request,url=request.url,status=200,body=body)
   observer.response(response);observer.finished(request);observer.finish()
   self.assertTrue(errors);self.assertEqual(receipt['assetFetches'],[])
 def test_open_requires_both_real_proofs_and_both_terrains(self):
  a=self.sample();check_gate(a)
  for mutate in [lambda s:s['gates'][1].update(broken=False),lambda s:s['proof']['17.lock'].update(pinSeated=False),lambda s:s['proof']['17.mesh']['parts'].clear()]:
   b=copy.deepcopy(a);mutate(b)
   with self.assertRaises(AssertionError):check_gate(b)
 def test_initial_resource_or_objective_changes_fail(self):
  a=self.sample()
  for mutate in [lambda s:s['actors'][0].update(hp=99),lambda s:s['actors'][0].update(focus=49),lambda s:s['actors'][0].update(moveLeft=499),lambda s:s['done'].update({'17.defense':True})]:
   b=copy.deepcopy(a);mutate(b)
   with self.assertRaises(AssertionError):preserved(a,b)
 def test_real_crossing_must_spend_movement_and_clear_body(self):
  a=self.sample();b=copy.deepcopy(a);b['actors'][0].update(x=120,moveLeft=460);preserved(a,b,movement=True);self.assertTrue(crossed(b))
  b['actors'][0]['x']=111;self.assertFalse(crossed(b))
  b['actors'][0].update(x=120,moveLeft=500)
  with self.assertRaises(AssertionError):preserved(a,b,movement=True)
 def test_reload_position_or_resource_change_fails(self):
  a=self.sample();b=copy.deepcopy(a);b['actors'][0]['x']+=1
  with self.assertRaises(AssertionError):preserved(a,b)
 def test_geometry_change_is_not_gate_repair(self):
  a=self.sample();b=copy.deepcopy(a);b['gates'][0]['w']=1
  with self.assertRaises(AssertionError):preserved(a,b)

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--fixture',default=str(ROOT/'tests/fixtures/stage17-gate/old-natural-continue34.json.gz'))
 parser.add_argument('--url',default=os.environ.get('HONRO_QA_URL','http://127.0.0.1:8870/HONRO.html'))
 parser.add_argument('--out',default=os.environ.get('HONRO_QA_OUT',str(ROOT/'_local/reports/stage17-gate-browser')))
 parser.add_argument('--self-test',action='store_true');args=parser.parse_args()
 if args.self_test:
  suite=unittest.defaultTestLoader.loadTestsFromTestCase(HelperTests);raise SystemExit(not unittest.TextTestRunner(verbosity=2).run(suite).wasSuccessful())
 raise SystemExit(run(args))
