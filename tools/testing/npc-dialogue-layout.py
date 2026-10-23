"""NPC story identity and touch-control geometry, production Chromium build.
The Stage11 rescue starts at fixture prerequisites, not a normal 18-turn playthrough.
No production quest, text, actor, or image file is edited by this probe.
"""
import hashlib,json,subprocess,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/npc-dialogue';OUT.mkdir(parents=True,exist_ok=True)
profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text());checks=[]
def check(name,ok,detail=None):
 checks.append({'name':name,'passed':bool(ok),'detail':detail});(OUT/'progress.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2));assert ok,(name,detail);print('PASS',name,flush=True)
def boxes(p):
 return p.evaluate('''()=>{const s=document.querySelector('#dialogue-root section'),a=s.querySelector('.story-actions'),r=s.getBoundingClientRect();return {panel:r.toJSON(),grid:getComputedStyle(s).gridTemplateColumns,scroll:[s.scrollWidth,s.clientWidth,s.scrollHeight,s.clientHeight,s.scrollTop],actionsWidth:a.getBoundingClientRect().width,portrait:!!document.querySelector('#dialogue-root .story-portrait canvas'),buttons:[...a.querySelectorAll('button')].map(e=>{const r=e.getBoundingClientRect();return {action:e.dataset.action,disabled:e.disabled,rect:r.toJSON(),inside:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&r.left>=s.getBoundingClientRect().left&&r.right<=s.getBoundingClientRect().right&&r.top>=s.getBoundingClientRect().top&&r.bottom<=s.getBoundingClientRect().bottom,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===e};})};}''')
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw);ctx=browser.new_context(viewport={'width':390,'height':844},has_touch=True);p=ctx.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.add_init_script('if(!localStorage.getItem("honro-first-act-profile-1"))localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');p.goto(base+'/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady');p.evaluate('HonroApp.launch(11)');p.wait_for_function('HonroApp.engine?.b.honroStage===11');p.evaluate('()=>{while(HonroApp.dialogue)HonroStory.finish(HonroApp);}')
 # Use the production rescue entry, queue, stored scene metadata, and untouched beat.
 # Fixture: prior objectives complete, actor adjacent, possessing spirit weakened,
 # nearby threats subdued. This isolates the reported dialogue without replaying combat.
 rescue=p.evaluate('''()=>{const a=HonroApp,b=a.engine.b,e=a.engine,m=b.honroMarkers.find(m=>m.id==='resident'),mem=HonroAct2.memory(b);for(const s of HonroAct2.steps(b)){if(s.id==='resident')break;mem.done[s.id]=true;}b.round=18;e.select(e.heroesAlive().find(u=>u.cls==='occultist').id);const u=e.active;u.x=m.x;u.y=m.y;for(const t of HonroAct2.interactionThreats(b,m))t.honroSubdued=true;const spirit=e.unit(m.spiritId);spirit.hp=Math.floor(spirit.maxHp*.3);a.actorBoundary=u.id;const eligible=HonroAct2.eligibility(a,m),used=HonroAct2.use(a,m),actor=HonroStoryDirection.speaker(a,'주민');window.npcLines=JSON.parse(JSON.stringify(a.dialogue.lines));return {eligible,used,round:b.round,lines:a.dialogue.lines,index:a.dialogue.index,target:m.target,actor:actor?{id:actor.id,name:actor.name,cls:actor.cls}:null,resolved:e.unit(m.target).honroResolved,next:HonroAct2.current(b)?.id,kind:HonroActorVisual.kind(actor),approved:HonroPortraits.approved(actor,actor.cls)};}''')
 # The current trace can wait for queued speech; this probe checks the UI, not quest advancement.
 check('production Stage11 rescue queues the exact reported two-line speech',rescue['used'] and rescue['resolved'] and rescue['index']==0 and rescue['round']==18 and rescue['lines'][0][0]=='주민' and '아내가 부르는 줄 알았소.' in rescue['lines'][0][1] and len(rescue['lines'])==2,rescue)
 check('generic caption binds exact marker civilian and never a protagonist',rescue['actor']['id']==rescue['target'] and rescue['actor']['name']=='동굴 주민' and rescue['kind']=='civilian' and rescue['approved'] is None,rescue['actor'])
 p.wait_for_function('HonroAuthoredFarArt.ready(11)');p.wait_for_timeout(250)
 live=p.evaluate('''()=>{const a=HonroApp,u=HonroStoryDirection.speaker(a,'주민'),c=document.getElementById('story-portrait-canvas'),expected=document.createElement('canvas');expected.width=c.width;expected.height=c.height;const info=HonroPortraits.draw(expected,u,u.cls),actual=c.getContext('2d').getImageData(0,0,c.width,c.height).data,want=expected.getContext('2d').getImageData(0,0,c.width,c.height).data;return {source:info.source||'vector',same:actual.every((v,i)=>v===want[i])};}''')
 check('resident dialogue uses identical production actor vector pixels',live['same'],live)
 for w,h,label in [(390,844,'390x844'),(720,1560,'720x1560'),(360,780,'360x780'),(844,390,'landscape')]:
  p.set_viewport_size({'width':w,'height':h});p.wait_for_timeout(240);geometry=boxes(p);check(label+' actual rescue controls inside and touchable',geometry['portrait'] and all(x['inside'] and (x['disabled'] or x['hit']) for x in geometry['buttons']),geometry);p.screenshot(path=str(OUT/('resident-'+label+'.jpg')),type='jpeg',quality=91)
 # Save/reload the actual open speech through the normal story snapshot.
 snapshot=p.evaluate('''()=>{HonroStory.save(HonroApp);return {lines:HonroApp.profile.honroBattle.honroStory.lines,index:HonroApp.profile.honroBattle.honroStory.index};}''');p.reload();p.wait_for_function('document.documentElement.dataset.honroReady');p.evaluate('HonroApp.continue()');p.wait_for_function('HonroApp.dialogue?.lines?.[0]?.[0]==="주민"');p.wait_for_timeout(240)
 check('stored open rescue speech restores same lines and actor',p.evaluate('expected=>JSON.stringify(HonroApp.dialogue.lines)===JSON.stringify(expected.lines)&&HonroApp.dialogue.index===expected.index&&HonroStoryDirection.speaker(HonroApp,"주민")?.honroCivilian',snapshot),snapshot)
 if '--rescue-only' in sys.argv:
  check('no browser exceptions',not errors,errors);browser.close()
  (OUT/'rescue-only.json').write_text(json.dumps({'sourceHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'checks':checks,'errors':errors},ensure_ascii=False,indent=2));print('DONE rescue-only',len(checks),'checks');sys.exit(0)
 p.evaluate('window.npcLines=JSON.parse(JSON.stringify(HonroApp.dialogue.lines));');base_lines=p.evaluate('npcLines')
 rows=[]
 for w,h,label in [(390,844,'390x844'),(720,1560,'720x1560'),(360,780,'360x780'),(844,390,'landscape')]:
  p.set_viewport_size({'width':w,'height':h})
  # Registered NPC without a current actor, truly absent character, narration,
  # record and guide remain distinct from the actual rescue actor and BASE4.
  for who,portrait in [('주민',True),('문탁',True),('새 주민',False),('서술',False),('기록',False),('안내',False)]:
   for length in [1,35]:
    p.evaluate('([who,n,lines])=>{HonroStory.start(HonroApp,[[who,lines[0][1].repeat(n)],lines[1]],{title:HonroApp.stage.name});}',[who,length,base_lines]);p.wait_for_timeout(220)
    geometry=boxes(p);ok=geometry['portrait']==portrait and geometry['actionsWidth']>100 and all(x['inside'] and (x['disabled'] or x['hit']) for x in geometry['buttons']);check(label+' '+who+' '+str(length)+' controls',ok,geometry);rows.append({'view':label,'who':who,'length':length,**geometry})
    # Long copy can be scrolled to the last glyph without losing the controls.
    if length>1:
     scrolled=p.evaluate('''()=>{const s=document.querySelector('#dialogue-root section');s.scrollTop=s.scrollHeight;const text=s.querySelector('#story-line').getBoundingClientRect(),a=s.querySelector('.story-actions').getBoundingClientRect();return {scrolled:s.scrollTop,tail:text.bottom,actions:a.top,beside:text.right<=a.left||text.left>=a.right,tailVisible:text.bottom<=s.getBoundingClientRect().bottom};}''');after=boxes(p);check(label+' '+who+' scroll tail and controls',scrolled['tailVisible'] and (scrolled['beside'] or scrolled['tail']<=scrolled['actions']+1) and all(x['inside'] and (x['disabled'] or x['hit']) for x in after['buttons']),scrolled)
    if label=='390x844' and who=='새 주민' and length==35:p.screenshot(path=str(OUT/'text-only-long.jpg'),type='jpeg',quality=91)
    p.locator('[data-action="dialogue-next"]').tap();p.wait_for_function('HonroApp.dialogue?.index===1');p.locator('[data-action="dialogue-prev"]').tap();p.wait_for_function('HonroApp.dialogue?.index===0');
    if not p.locator('[data-action="dialogue-skip"]').count():
     # Guides intentionally expose confirmation, then the following speech.
     p.locator('[data-action="dialogue-next"]').tap();p.wait_for_function('HonroApp.dialogue?.index===1')
    p.locator('[data-action="dialogue-skip"]').tap();p.wait_for_function('!HonroApp.dialogue');
 check('touch next/back/skip across all representative layouts',len(rows)==48,{'cases':len(rows)})
 check('no browser exceptions',not errors,errors);browser.close()
report={'sourceHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'checks':checks,'rows':rows,'errors':errors};(OUT/'checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('DONE',len(checks),'checks')
