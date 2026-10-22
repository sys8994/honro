"""Native Chromium UI with controlled current campaign poses/scene boundaries.
This is not all-chapter combat completion or a physical-mobile review.
"""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
OUT=ROOT/'game/docs/story/voice-v2-editorial/evidence/ui';OUT.mkdir(parents=True,exist_ok=True)
SETUP=r'''async id=>{
 await HonroCampaignLoader.ensureStage(id);const a=HonroApp;a.close();a.stopBattle();const p=HONRO_TOOLS.fresh();for(let n=1;n<id;n++)p.cleared[n]={visits:1,rounds:5};p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];p.settings.sound=false;p.settings.music=false;for(const c of p.recruited)p.heroes[c].xp=HONRO_CORE.xpAtLevel(20);a.profile=p;a.normalProfile=p;a.audio.configure(p.settings);a.launch(id);while(a.dialogue)HonroStory.finish(a);a.close();a.turnNotice=null;a.lastTurnNotice=`${a.engine.b.round}:player`;for(const u of a.engine.b.units.filter(u=>u.side===1)){u.dead=true;u.hp=0;}a.engine.b.phase='aim';a.engine.b.side=0;
 return {revision:a.engine.b.honroNarrativeCatalogueRevision,roster:a.engine.b.units.filter(u=>u.side===0&&!u.summoned).map(u=>u.cls)};
}'''
SHOW=r'''({section,key,index=0})=>{const a=HonroApp,b=a.engine.b;if(a.dialogue)HonroStory.finish(a);const st=HonroObjectiveRevision.contentFor(b,a.stage),rows=section==='scene'?HonroNarrativeCatalogue.rows(key):section==='beats'?st.beats[key]:st[section];return HonroStory.start(a,rows,{id:'voice-ui-fixture',title:a.stage.name,index});}'''
METRIC=r'''()=>{const line=document.querySelector('#story-line'),panel=document.querySelector('.story-scene,.story-guide');if(!line||!panel)throw Error('missing native story UI');const r=line.getBoundingClientRect(),p=panel.getBoundingClientRect();return {text:line.textContent,kind:panel.dataset.speakerKind,viewport:[innerWidth,innerHeight],line:{left:r.left,right:r.right,top:r.top,bottom:r.bottom,scroll:line.scrollHeight,client:line.clientHeight},panel:{left:p.left,right:p.right,top:p.top,bottom:p.bottom}};}'''
checks=[];errors=[]
def verify(page,label,shot=False):
 page.wait_for_timeout(180);m=page.evaluate(METRIC);w,h=m['viewport'];r=m['line'];p=m['panel']
 assert r['left']>=0 and r['right']<=w+1 and r['top']>=0 and r['bottom']<=h+1,(label,m)
 assert r['bottom']<=p['bottom']+1 and r['scroll']<=r['client']+2,(label,m)
 checks.append({'label':label,**m})
 if shot:page.screenshot(path=str(OUT/(label+'.jpg')),type='jpeg',quality=80)
with sync_playwright() as p:
 browser=launch(p)
 for mobile in [True,False]:
  tag='390x844' if mobile else '1280x900';ctx=browser.new_context(viewport={'width':390,'height':844} if mobile else {'width':1280,'height':900},is_mobile=mobile,has_touch=mobile);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(story_base_url()+'/HONRO.html');page.wait_for_function('window.HonroApp');page.locator('.title-actions button').first.click()
  assert page.evaluate(SETUP,2)['revision']==1
  page.evaluate(SHOW,{'section':'outro','index':6});assert page.evaluate('HonroApp.engine.b.units.find(u=>u.id==="objective").name')=='장례 상여'
  page.evaluate('HonroApp.dialogue.index=7;HonroStory.draw(HonroApp)');assert page.evaluate('HonroApp.engine.b.units.find(u=>u.id==="objective").name')=='홍만의 상여'
  verify(page,'name-reveal-'+tag,mobile)
  page.evaluate(SETUP,9)
  page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;HonroStoryStaging.request(a,HonroStoryStaging.ID);const queued=b.honroState.storyQueue.splice(0);HonroStory.start(a,queued,{});while(a.dialogue)HonroStory.finish(a);}''')
  page.evaluate(SHOW,{'section':'outro','index':3});verify(page,'sodan-refusal-'+tag,mobile)
  page.evaluate(SETUP,10)
  page.evaluate('HonroApp.engine.b.honroState.sodanBinding.phase="offering"')
  page.evaluate(SHOW,{'section':'scene','key':'10.cooperation'})
  page.evaluate('HonroStory.finish(HonroApp)');assert page.evaluate('HonroApp.engine.b.honroState.sodanBinding.phase')=='accepted'
  page.evaluate(SHOW,{'section':'scene','key':'10.cooperationDefense','index':5});verify(page,'six-turn-defense-'+tag,False)
  page.evaluate(SHOW,{'section':'outro','index':7});verify(page,'sodan-aftermath-'+tag,not mobile)
  page.evaluate(SETUP,12)
  result=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,m=b.honroMarkers.find(q=>q.id==='sign'),u=b.units.find(q=>q.side===0&&q.cls==='archer'),mage=b.units.find(q=>q.side===0&&q.cls==='mage');Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0});mage.x=m.x-700;b.active=u.id;return {ok:HonroAct2.use(a,m),lines:b.honroState.quarry.signLines,mageNear:b.honroState.quarry.signMageNear};}''')
  assert result['ok'] and result['mageNear'] is False,result
  assert any('담허의 설명을 따라' in r[1] for r in result['lines']),result
  page.evaluate(SHOW,{'section':'beats','key':'sign','index':3});verify(page,'quarry-snapshot-'+tag,mobile)
  page.evaluate(SETUP,14);page.evaluate(SHOW,{'section':'beats','key':'family-mid','index':4});verify(page,'village-snapshot-'+tag,mobile)
  page.evaluate(SETUP,28)
  assert page.evaluate('HonroApp.engine.b.units.filter(u=>u.side===0&&!u.summoned).length')==4
  page.evaluate(SHOW,{'section':'beats','key':'party-reunion','index':2});verify(page,'split-reunion-'+tag,False)
  page.evaluate(SETUP,29);page.evaluate('HonroApp.engine.b.honroVoidWitness=true');page.evaluate(SHOW,{'section':'beats','key':'hyeonmuk-letter','index':4});verify(page,'witness-letter-'+tag,not mobile)
  page.evaluate(SETUP,27)
  result=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,z=b.honroMap.act3.crossings.at(-1).landing,x=(z.left+z.right)/2;for(const [i,u]of b.units.filter(u=>u.side===0&&!u.summoned).entries())Object.assign(u,{x:x-60+i*120,y:z.y,vx:0,vy:0,airborne:false,jumping:false,acted:false});b.active=b.units.find(u=>u.side===0&&u.cls==='mage').id;b.projectiles=[];b.volley=undefined;b.honroAct3Void.recovered=true;return HonroAct3Void.begin(a);}''');assert result
  page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="VOID"')
  for _ in range(3):page.keyboard.press('Space');page.wait_for_timeout(150)
  assert page.evaluate('HonroApp.honroVoidSession.line')==3
  m=page.evaluate('''()=>{const s=HonroApp.honroVoidSession,t=s.text.getBoundingClientRect(),a=s.actorBounds;return {text:s.text.textContent,align:s.text.dataset.align,textBox:{left:t.left,right:t.right,top:t.top,bottom:t.bottom},actor:a,overlap:Math.max(0,Math.min(t.right,a.right)-Math.max(t.left,a.left))*Math.max(0,Math.min(t.bottom,a.bottom)-Math.max(t.top,a.top))}}''')
  assert m['align']=='far' and m['overlap']==0,m;checks.append({'label':'void-long-line-'+tag,**m})
  if mobile:page.screenshot(path=str(OUT/('void-long-line-'+tag+'.jpg')),type='jpeg',quality=80)
  page.locator('.honro-void-skip').click();page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="RESOLVED" && !!HonroApp.dialogue');assert page.evaluate('HonroApp.dialogue.lines.length')==3
  ctx.close()
 browser.close()
assert not errors,errors
(OUT/'checks.json').write_text(json.dumps({'status':'passed','checks':checks,'errors':errors,'limits':['Native Chromium with controlled stage/scene fixtures.','No complete campaign combat, physical mobile or performance review.']},ensure_ascii=False,indent=2)+'\n')
print('PASS',len(checks),'native story/void layout and metadata checks; seven JPG captures')
