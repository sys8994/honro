"""Actual normal Continue/cross/autosave/reload of the exact old R34 gate save.
A continued native-App checkpoint, not fresh playthrough or browser clear evidence.
Only the initial entire-profile import writes storage; all later actions use UI.
"""
import argparse,copy,gzip,hashlib,json,os,subprocess,time,traceback,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
GZIP_SHA='0ae6a6c22718b821f65cadc2882bde026f43774d3c86263a9120e9cd263cdf5e'
RAW_SHA='8eceb8323fbfb4965d6b7d3a751dfd9fcefd6de473bc2c801b83defc042434d2'
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
 gates:[b.terrain,b.honroWorldTerrain].flatMap(ts=>(ts||[]).filter(t=>t.id==='gate-repair').map(t=>({...Object.fromEntries(['id','x','y','w','h','vertices','mat','oneWay'].map(k=>[k,t[k]??null])),broken:!!t.broken}))};};
 const stored=JSON.parse(localStorage.getItem('honro-first-act-profile-1')||'null');
 return {time:performance.now(),screen:a.screen,dialogue:!!a.dialogue,can:!!a.canInput(),grounded:!!(e?.active&&e.grounded(e.active)),
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
  save()
  with sync_playwright() as w:
   browser=w.chromium.launch(headless=True);page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:result['errors'].append(str(e)))
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
      s=page.evaluate(SNAPSHOT);r=s['live'];assert s['can'] and r['active']==baseline['active'] and r['round']==34,'Input context changed during bounded crossing'
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
    page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000)
    page.locator('.title-actions [data-action="continue"]:visible').first.click();ready()
    restored=snapshot('reloaded');check_gate(restored['live']);preserved(saved['stored'],restored['live']);assert crossed(restored['live'])
    page.screenshot(path=str(out/'reloaded-crossed-gate.png'))
    result['passed']=not result['errors'];save()
   except Exception:
    try:snapshot('failureState');page.screenshot(path=str(out/'failure.png'))
    except Exception:pass
    raise
   finally:browser.close()
 except Exception:result['exception']=traceback.format_exc();result['passed']=False
 finally:save()
 return 0 if result['passed'] else 1

class HelperTests(unittest.TestCase):
 def sample(self):
  actor={k:None for k in FIELDS};actor.update(id='p-archer',cls='archer',side=0,hp=100,maxHp=100,focus=50,maxFocus=50,moveLeft=500,dead=False,x=80,y=50,r=2)
  gate={k:None for k in GEOMETRY};gate.update(id='gate-repair',x=100,y=0,w=10,h=100,broken=True)
  return {'stage':17,'round':34,'side':0,'phase':'aim','active':'p-archer','shots':77,'shotId':150,'done':{'17.mesh':True,'17.lock':True},'proof':{'17.mesh':{'worker':'17.mason','parts':{'workerCarrier':'17.gilchan'}},'17.lock':{'pinSeated':True}},'markers':{},'party':['archer'],'recruited':['archer'],'actors':[actor],'gates':[copy.deepcopy(gate),copy.deepcopy(gate)]}
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
