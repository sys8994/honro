"""Exact supplied long rows in real current UI; controlled scene/quest fixtures.
No full campaign combat or physical-device claim.
"""
import json,subprocess,sys
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/user-script-20261023';OUT.mkdir(parents=True,exist_ok=True)
patch=json.loads((ROOT/'game/docs/story/user-script-20261023/approved-patch.json').read_text());ops={o['path']:o for o in patch['operations']};rows=[];errors=[]
SETUP=r'''async id=>{await HonroCampaignLoader.ensureStage(id);const a=HonroApp;a.close();a.stopBattle();const p=HONRO_TOOLS.fresh();for(let n=1;n<id;n++)p.cleared[n]={visits:1,rounds:5};p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];p.settings.sound=false;p.settings.music=false;for(const c of p.recruited)p.heroes[c].xp=HONRO_CORE.xpAtLevel(20);a.profile=p;a.normalProfile=p;a.audio.configure(p.settings);a.launch(id);while(a.dialogue)HonroStory.finish(a);a.close();a.turnNotice=null;a.lastTurnNotice=`${a.engine.b.round}:player`;a.engine.b.honroBellWitness=a.engine.b.honroVoidWitness=true;}'''
SHOW=r'''({stage,field,key,index})=>{const a=HonroApp,st=HonroObjectiveRevision.contentFor(a.engine.b,a.stage),lines=field==='beats'?st.beats[key]:st[field];HonroStory.start(a,lines,{title:a.stage.name,index});return {lines:a.dialogue.lines.map(r=>r.slice(0,2)),index:a.dialogue.index};}'''
METRIC=r'''()=>{const panel=document.querySelector('#dialogue-root section'),line=document.querySelector('#story-line');panel.scrollTop=panel.scrollHeight;const doc=panel.querySelector('.document-scroll');if(doc)doc.scrollTop=doc.scrollHeight;const p=panel.getBoundingClientRect(),r=line.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(line);if(line.firstChild?.nodeType===3)range.setStart(line.firstChild,Math.max(0,line.firstChild.length-1));const tail=range.getBoundingClientRect();return {text:line.textContent,panel:p.toJSON(),textBox:r.toJSON(),lineScroll:{top:line.scrollTop,height:line.scrollHeight,client:line.clientHeight,tail:tail.toJSON()},scroll:{top:panel.scrollTop,height:panel.scrollHeight,client:panel.clientHeight,document:doc?{top:doc.scrollTop,height:doc.scrollHeight,client:doc.clientHeight}:null},buttons:[...panel.querySelectorAll('button[data-action]')].map(e=>{const q=e.getBoundingClientRect();return {action:e.dataset.action,disabled:e.disabled,box:q.toJSON(),hit:e.disabled||document.elementFromPoint(q.x+q.width/2,q.y+q.height/2)?.closest('button')===e};})};}'''
with serve_game() as base,sync_playwright() as p:
 browser=launch(p)
 for w,h in ([(1280,900)] if '--desktop-only' in sys.argv else [(320,480)] if '--compact-only' in sys.argv else [(1280,900),(390,844),(844,390),(320,480)]):
  ctx=browser.new_context(viewport={'width':w,'height':h},has_touch=True);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/HONRO.html');page.wait_for_function('document.documentElement.dataset.honroReady');page.get_by_role('button',name='설정',exact=True).click()
  for id,field,key,index in [(14,'beats','family-mid',4),(18,'story',None,5),(28,'beats','suppression-order',2)]:
   page.evaluate(SETUP,id);page.evaluate(SHOW,{'stage':id,'field':field,'key':key,'index':index});page.wait_for_timeout(950)
   pointer=f'/stages/{id}/'+(f'beats/{key}/' if field=='beats' else field+'/')+str(index)+'/1';wanted=ops[pointer]['after'];assert page.locator('#story-line').inner_text()==wanted
   page.locator('#story-line').hover();page.mouse.wheel(0,1200);page.wait_for_timeout(160)
   metric=page.evaluate(METRIC);assert metric['text']==wanted
   if metric['lineScroll']['height']>metric['lineScroll']['client']+1:assert metric['lineScroll']['top']>0 and metric['lineScroll']['tail']['bottom']<=metric['textBox']['bottom']+2,metric
   for b in metric['buttons']:
    q=b['box'];assert q['width']>0 and q['height']>0 and q['left']>=-1 and q['right']<=w+1 and q['top']>=-1 and q['bottom']<=h+1 and b['hit'],(id,w,h,b)
   assert metric['panel']['right']<=w+1 and metric['panel']['bottom']<=h+1,(id,w,h,metric)
   rows.append({'viewport':[w,h],'pointer':pointer,'metric':metric})
   if ((w,h)==(390,844) and id in [14,28]) or ((w,h)==(1280,900) and id==14):page.screenshot(path=str(OUT/f'long-{id}-{w}x{h}.jpg'),type='jpeg',quality=85)
   if metric['lineScroll']['top'] or metric['scroll']['top'] or metric['scroll']['document'] and metric['scroll']['document']['top']:
    if (w,h) in [(844,390),(320,480)] and id==14:page.screenshot(path=str(OUT/f'scroll-{id}-{w}x{h}.jpg'),type='jpeg',quality=85)
   # Existing Next/Previous consume one row and return to the exact supplied row.
   start=page.evaluate('HonroApp.dialogue.index');page.locator('[data-action="dialogue-prev"]').tap();page.wait_for_function('(i)=>HonroApp.dialogue?.index===i',arg=start-1);page.locator('[data-action="dialogue-next"]').tap();page.wait_for_function('(i)=>HonroApp.dialogue?.index===i',arg=start);assert page.locator('#story-line').inner_text()==wanted
   if page.locator('[data-action="dialogue-skip"]').count():page.locator('[data-action="dialogue-skip"]').tap();page.wait_for_function('!HonroApp.dialogue')
   else:page.evaluate('HonroStory.finish(HonroApp)')
  if w==390:
   page.evaluate(SETUP,12);result=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,m=b.honroMarkers.find(m=>m.id==='sign'),u=b.units.find(u=>u.side===0&&u.cls==='archer'),mage=b.units.find(u=>u.side===0&&u.cls==='mage');Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0});mage.x=m.x-700;b.active=u.id;const ok=HonroAct2.use(a,m);return {ok,near:b.honroState.quarry.signMageNear,lines:b.honroState.quarry.signLines};}''');wanted=ops['/stages/12/beats/sign/3/2/mageAbsentText']['after'];assert result['ok'] and result['near'] is False and result['lines'][3][1]==wanted,result
   page.evaluate('''()=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);const st=HonroObjectiveRevision.contentFor(a.engine.b,a.stage);HonroStory.start(a,st.beats.sign,{title:a.stage.name,index:3});}''');page.wait_for_timeout(500);assert page.locator('#story-line').inner_text()==wanted;page.screenshot(path=str(OUT/'mage-absent-390x844.jpg'),type='jpeg',quality=85);rows.append({'case':'actual quarry sign request, mage absent','text':wanted,'near':False})
   page.evaluate(SETUP,27)
   assert page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,z=b.honroMap.act3.crossings.at(-1).landing,x=(z.left+z.right)/2;for(const [i,u]of b.units.filter(u=>u.side===0&&!u.summoned).entries())Object.assign(u,{x:x-60+i*120,y:z.y,vx:0,vy:0,airborne:false,jumping:false,acted:false});b.phase='aim';b.side=0;b.projectiles=[];delete b.volley;b.honroAct3Void.recovered=true;return HonroAct3Void.begin(a);}""")
   page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="VOID"');void=[]
   for i in range(5):
    v=page.evaluate("""()=>{const s=HonroApp.honroVoidSession,r=s.text.getBoundingClientRect(),a=s.actorBounds;return{index:s.line,text:s.text.textContent,overlap:Math.max(0,Math.min(r.right,a.right)-Math.max(r.left,a.left))*Math.max(0,Math.min(r.bottom,a.bottom)-Math.max(r.top,a.top)),textBox:r.toJSON(),actor:a};}""");assert v['index']==i and v['overlap']==0,v;void.append(v)
    pointer=f'/scenes/27.void.sceneLines/{i}/1'
    if pointer in ops:assert v['text']==ops[pointer]['after']
    if i==0:page.screenshot(path=str(OUT/'void-updated-near-390x844.jpg'),type='jpeg',quality=85)
    if i<4:page.keyboard.press('Enter');page.wait_for_timeout(160)
   page.locator('.honro-void-skip').click();page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="RESOLVED"&&!!HonroApp.dialogue');assert len(page.evaluate('HonroApp.dialogue.lines'))==3
   for i,r in enumerate(page.evaluate('HonroApp.dialogue.lines')):assert r[1]==ops[f'/scenes/27.void.returnLines/{i}/1']['after']
   rows.append({'case':'actual anonymous void, changed near lines, all5 overlap0, skip and exact3 return rows','cuts':void})
  ctx.close()
 browser.close()
assert not errors,errors
(OUT/('ui-desktop.json' if '--desktop-only' in sys.argv else 'ui-compact.json' if '--compact-only' in sys.argv else 'ui.json')).write_text(json.dumps({'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'cases':rows,'errors':errors,'limits':__doc__},ensure_ascii=False,indent=2)+'\n')
print('PASS longest supplied rows at PC/mobile/landscape; next/previous/skip, scroll tail/buttons; actual mageAbsentText selection')
