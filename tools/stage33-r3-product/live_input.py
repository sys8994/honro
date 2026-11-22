"""Read-only Stage33 ordinary UI action proof on the independently verified normal A/B builds."""
from __future__ import annotations
import base64,json,re,sys,time,hashlib
from pathlib import Path
from io import BytesIO
from playwright.sync_api import sync_playwright
from PIL import Image
BASE='2c4e90ff24d1f5aa5d04f01317caa02f89b8194c'
AUTHOR='3ab093ce8cff00efb620d2fed8eae6cc4c732892'
A='act4-sideview:33:coastal-v2:lowland'
B='act4-sideview:33:coastal-v2:lowland-deep-strata'
OBSERVE=r"""() => {
 const a=window.HonroApp,e=a?.engine,b=e?.b;
 if(!b||b.honroStage!==33)return null;
 const t=b.honroAct4PreviewState?.tide??null, cfg=b.honroAct4Design?.tide;
 const u=e.active, surfaces=(b.honroSurfaceZones??[]).filter(z=>String(z.id).startsWith('a4-live-'));
 const n=a.scene?.canvas;const mid=(HonroTerrainDomain?.materialLandmarks?.(b)??[]).filter(j=>j.layer==='mid').map(x=>x.asset?.id).filter(Boolean);
 return {stage:b.honroStage,canonical:b.honroCanonical,custom:b.honroCustom,official:b.honroAct4Official,
  round:b.round, side:b.side,phase:b.phase,done:!!a.done, dialogue:!!a.dialogue, input:!!a.canInput(),
  active:u?.id??null, actor:u?{x:u.x,y:u.y,grounded:e.grounded(u), acted:!!u.acted}:null,
  actionTick:b.honroState?.actionSerial??null,
  tide:t&&{phase:t.phase,surface:t.surface,warningAtRound:t.warningAtRound??null}, config:cfg,
  zones:surfaces.map(z=>({id:z.id, surface:z.surface})), owners:mid,
  shoreHUD:document.getElementById('act4-water-hud')?.textContent??null,
  inputBanner:document.getElementById('turn-banner')?.hidden??null, css:[n?.clientWidth,n?.clientHeight],
  terrain:b.terrain.map(z=>z.id),readyToAct:b.units.filter(f=>!f.dead&&!f.acted&&!f.summoned&&f.side===0).map(f=>f.id)};
}"""
LAUNCH=r"""async()=>{
 const a=HonroApp;
 await HonroCampaignLoader.ensureStage(33);
 for(let n=1;n<33;n++)a.profile.cleared[n]=true; // isolate chapter entry only
 a.profile.settings.music=false; a.profile.settings.sound=false;
 for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(33).entryLevel);
 a.launch(33);
 return a.engine?.b?.honroStage===33;
}"""
def facts(b):
 return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def write(p,x):
 p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def finish_phase(rows):
 return any(v['side']==1 for v in rows) and any(v['round']>=2 and v['side']==0 and v['phase']=='aim' for v in rows)
def valid_tide(first,last):
 return (first.get('tide') or {}).get('phase')=='low' and first['tide']['surface']==4095 and (last.get('tide')or{}).get('phase')=='rising' and last['tide']['surface']==4077 and last['tide']['warningAtRound']==2
def arm(browser,tag,g,out):
 start=g['origin']; allowed={**g['active'],'HONRO.html':g['shell'],'web/manifest.json':g['manifest']}
 assert start==('http://127.0.0.1:18961/' if tag=='A' else 'http://127.0.0.1:18962/')
 state={'arm':tag,'input':[],'observed':[],'files':{},'errors':[],'status':'INIT'};response={}; errors=state['errors']; hits=[]
 ctx=browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1,service_workers='block')
 page=ctx.new_page();page.set_default_timeout(14000)
 def track(r):
  if r.url.startswith(start) and r.url[len(start):] in allowed:
   path=r.url[len(start):];hits.append((path,r))
  elif r.url.startswith('blob:'+start) or r.url.startswith('data:'):
   pass
  elif r.url.startswith(start+'assets/bgm/') and r.request.resource_type=='media' and r.status in (200,206):
   pass
  else:errors.append(['unexpected HTTP',r.status,r.url])
 page.on('response',track);page.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
 def record(label):
  old=page.evaluate(OBSERVE)
  # Capture the normal animation/phase with no clock or camera rewriting.
  raw=base64.b64decode(page.evaluate("()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"),validate=True)
  dom=page.locator('#battlecanvas').screenshot(animations='allow',scale='css',timeout=14000)
  now=page.evaluate(OBSERVE)
  state.setdefault('frames',{})[label]={'before':old,'after':now,'matchedGameplayPhase':all(old[x]==now[x] for x in ('side','phase','round','active','tide'))}
  for typ,data in [('raw',raw),('dom',dom)]:
   name=f'{tag}-{label}-{typ}.png';im=Image.open(BytesIO(data));im.verify();(out/name).write_bytes(data);state['files'][name]=facts(data)
 def status(x):
  state['status']=x;write(out/f'{tag}-LIVE.json',state)
 def sample():
  x=page.evaluate(OBSERVE);assert x is not None
  q=state['observed']; key=lambda v:(v['round'],v['side'],v['phase'],v['active'],v['dialogue'],v['tide'])
  if not q or key(x)!=key(q[-1]):
   assert len(q)<512;q.append(x)
  return x
 def expected_owners(x):
  assert x['owners'].count(A)==1 and x['owners'].count(B)==(tag=='B')
 def dismiss_dialogue():
  for key in ('dialogue-next','dialogue-skip'):
   nodes=page.locator(f'[data-action="{key}"]:visible:not([disabled])')
   if nodes.count():
    assert nodes.count()==1
    nodes.click();state['input'].append({'kind':'trusted dialog click','target':key});return True
  return False
 try:
  r=page.goto(start+'HONRO.html',wait_until='domcontentloaded',timeout=45000)
  assert r and facts(r.body())==allowed['HONRO.html'] and r.status==200
  page.wait_for_function("()=>Boolean(document.documentElement.dataset.honroReady==='true'&&HonroCampaignLoader?.ensureStage&&window.HonroApp?.launch)",timeout=90000)
  assert page.evaluate(LAUNCH)
  page.locator('#battlecanvas').wait_for(state='visible',timeout=25000)
  first=None; end=time.monotonic()+75
  while time.monotonic()<end:
   v=sample();assert not v['done']
   if v['stage']==33 and v['round']==1 and v['side']==0 and v['phase']=='aim' and v['input'] and (v['tide']or{}).get('phase')=='low':
    first=v;break
   if v['dialogue']:dismiss_dialogue()
   page.wait_for_timeout(150)
  assert first is not None,'did not observe actual tide initialization in round 1'
  assert first['canonical'] and first['custom'] is False and first['official']==1
  assert first['config']['warningRound']==2 and first['config']['low']==4095 and first['config']['high']==3532.5
  expected_owners(first);record('round1-low');status('PLAYING')
  deadline=time.monotonic()+155; used=set(); last=None
  while time.monotonic()<deadline:
   f=sample()
   if f['done']:raise RuntimeError('stage ended before natural round transition')
   if finish_phase(state['observed']) and f['round']==2 and f['side']==0 and f['phase']=='aim' and f['input'] and valid_tide(first,f):
    last=f;break
   if f['dialogue']:
    if dismiss_dialogue():page.wait_for_timeout(200)
   elif f['round']==1 and f['side']==0 and f['phase']=='aim' and f['input']:
    marker=f['active'];assert marker and len(used)<=10
    if marker not in used:
     q=page.locator('[data-action="defend"]:visible:not([disabled])')
     if q.count()==1:q.click();control='visible [data-action=defend]'
     else:page.keyboard.press('f');control='real KeyF (main.js)'
     used.add(marker);state['input'].append({'kind':'trusted defend input','actor':marker,'before':f,'control':control});status('PLAYING')
   page.wait_for_timeout(110)
  assert last is not None,'round2/side0/aim/rising not naturally observed'
  expected_owners(last);record('round2-rising')
  for path,r in hits:
   assert r.status==200 and facts(r.body())==allowed[path],path
   response[path]=allowed[path]
  assert set(g['needs'])|{'HONRO.html'}<=set(response),sorted((set(g['needs'])|{'HONRO.html'})-set(response))
  assert not errors,errors
  assert len(used)>0 and any(v['side']==1 for v in state['observed'])
  assert all(j['matchedGameplayPhase'] for j in state['frames'].values())
  state.update(first=first,last=last,checkedBodies=sorted(response))
  status('OBSERVED_REAL_INPUT')
 except Exception as e:
  errors.append([type(e).__name__,str(e)]);status('HOLD')
 finally:ctx.close()
 return state
def main(work):
 out=work/'out';g=json.loads((out/'GRAPH.json').read_text());gate=json.loads((out/'GATE.json').read_text())
 cand=json.loads((out/'CANDIDATE-SOURCE.json').read_text())
 assert gate['base']==BASE and cand['targetGit']==AUTHOR
 assert g['A']['packet']=='web/data/chapter-33-assets.4b5df185aa59eb42.json'
 assert g['B']['packet']=='web/data/chapter-33-assets.07b129345eb95856.json'
 assert g['A']['expectDeep'] is False and g['B']['expectDeep'] is True
 io=out/'live-input';io.mkdir(exist_ok=False)
 with sync_playwright()as p:
  br=p.chromium.launch(); assert br.version=='151.0.7922.34',br.version
  try:result={k:arm(br,k,g[k],io) for k in 'AB'}
  finally:br.close()
 completed=all(a['status']=='OBSERVED_REAL_INPUT' for a in result.values())
 mismatches=[]
 if completed:
  a,b=result.values()
  for mark in ('first','last'):
   for k in ('stage','canonical','custom','official','round','side','phase','tide','terrain','zones'):
    if a[mark][k]!=b[mark][k]:mismatches.append([mark,k])
   if a[mark]['owners']!=[x for x in b[mark]['owners'] if x!=B]:mismatches.append([mark,'owners'])
 completed=completed and not mismatches
 # Live tide/victory stability and camera pixel identity are intentionally distinct; this is not a full stage clear.
 write(io/'LIVE-INPUT-SUMMARY.json',{'status':'NATURAL_ROUND_AND_TIDE_OBSERVED_BOTH' if completed else 'HOLD',
  'buildBase':BASE,'author':AUTHOR,'scope':'normal PC input/first hostile phase/round2 rising only; no forced round, no full play',
  'arms':{k:v['status'] for k,v in result.items()},'pairedMismatches':mismatches,'releaseApproval':False})
 assert completed
if __name__=='__main__':main(Path(sys.argv[1]))
