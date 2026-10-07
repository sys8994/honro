"""Real Story clock, rigs, DOM and input on Game/Workshop; explicit scene fixtures.
Optional URL tests the deployed HTML. Profiles live in isolated browser contexts.
"""
import json, sys
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
BASE=sys.argv[1].rstrip('/')+'/' if len(sys.argv)>1 else None
OUT=ROOT/'_local/reports/story-direction'/('pages' if BASE else 'browser');OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def url(name):return BASE+name if BASE else (ROOT/name).as_uri()
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)
def setup(page,id):
    page.evaluate('''id=>{const a=HonroApp;a.profile=HONRO_TOOLS.fresh();for(let i=1;i<id;i++)a.profile.cleared[i]={visits:1};
      a.profile.recruited=id>=11?['archer','mage','knight','occultist']:id>=6?['archer','mage','knight']:id>=3?['archer','mage']:['archer'];
      a.profile.party=[...a.profile.recruited];a.profile.settings.music=false;a.profile.settings.sound=false;if(globalThis.HONRO_EMBEDDED)a.launchMap(HONRO_PROJECT,'stage-'+id,{profile:a.profile});else a.launch(id);}''',id)
def to(page,who,text):
    page.evaluate('''([who,text])=>{const a=HonroApp;for(let i=0;i<40&&a.dialogue;i++){const l=a.dialogue.lines[a.dialogue.index];if(l?.[0]===who&&l[1].includes(text))return;HonroStory.next(a);}throw Error('missing line');}''',[who,text])
def skip(page):page.locator('[data-action=dialogue-skip]').click()
def pose_proof(page):
    proof=page.evaluate('''()=>{const a=HonroApp,combat=JSON.stringify(a.engine.b),assets=JSON.stringify(HONRO_PARTY),rows=[];
      const point=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]],distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
      const cv=document.createElement('canvas');cv.id='scene-pose-proof';cv.width=1200;cv.height=720;cv.style.cssText='position:fixed;left:0;top:0;z-index:99999';document.body.append(cv);
      const ctx=cv.getContext('2d');ctx.fillStyle='#1d292d';ctx.fillRect(0,0,1200,720);ctx.font='18px sans-serif';
      for(const [i,name]of ['seol_o','damheo','hwigyeom','sodan'].entries()){const v=a.scene.partyVisual.visuals[name],idle=v.api.sampleAnimation(v.asset,'idle',0,true);
        for(const [j,kind]of ['inspect','bow','kneel'].entries()){
          for(const time of [.12,.45,1]){const sample=v.scenePose({kind,time}),m=v.api.rigMatrices(v.asset,sample.poses);
            const seams=['front','rear'].flatMap(side=>[distance(point(m.thorax,v.by[side+'_upper_arm'].pivot),sample.guide.joints[side+'_upper_arm']),distance(point(m.pelvis,v.by[side+'_thigh'].pivot),sample.guide.joints[side+'_thigh'])]);
            rows.push({name,kind,time,seam:Math.max(...seams),feet:Math.max(...['front','rear'].map(side=>distance(sample.guide.joints[side+'_foot'],idle.targets[side+'Foot']))),reach:Math.max(...Object.values(sample.guide.reach)),lowered:sample.targets.thorax[1]>idle.targets.thorax[1]});
          }
          ctx.fillStyle='#fff';ctx.fillText(name+': '+kind,20+i*300,28+j*240);ctx.save();ctx.translate(150+i*300,222+j*240);v.renderer.draw(ctx,{height:185,facing:1,sample:v.scenePose({kind,time:1})});ctx.restore();
        }
      }
      return {rows,pure:combat===JSON.stringify(a.engine.b)&&assets===JSON.stringify(HONRO_PARTY)};}''')
    check('Live rigs: lowered bodies keep connected limbs and planted feet through interpolation',all(r['seam']<3 and r['feet']<.001 and r['reach']<.001 and r['lowered'] for r in proof['rows']),proof['rows'])
    check('Live rigs: scene poses preserve combat and authored vector assets',proof['pure'])
    page.screenshot(path=str(OUT/'scene-pose-proof.png'));page.evaluate("document.querySelector('#scene-pose-proof').remove()")
def suite(page,owner,label):
    setup(page,3)
    check(label+': first meeting hides Hwigyeom until his supported entrance',page.evaluate("!!HonroApp.engine.b.honroStaging.hidden['npc-hwigyeom']"))
    page.wait_for_function("HonroApp.dialogue?.staging?.complete&&HonroApp.engine.unit('npc-hwigyeom')?.x===1376",timeout=10000)
    check(label+': entrance moves and dialogue becomes a compact world scene',page.evaluate("HonroApp.engine.unit('npc-hwigyeom').x===1376&&!!HonroApp.dialogue.staging.complete") and page.locator('.cinematic-story').count()==1)
    to(page,'휘겸','멈추시오');owner.wait_for_timeout(700)
    check(label+': visible vector and camera show the guarding actor',page.evaluate("HonroApp.engine.unit('npc-hwigyeom').honroScenePose?.kind==='guard'&&Math.abs(HonroApp.scene.x-HonroApp.engine.unit('npc-hwigyeom').x)<15"))
    owner.screenshot(path=str(OUT/(label+'-first-meeting.png')))
    skip(page)
    setup(page,4)
    check(label+': Chunrye waits inside the gate during earlier dialogue',page.evaluate("!!HonroApp.engine.b.honroStaging.hidden['npc-chunrye']"))
    to(page,'춘례','붕대');owner.wait_for_timeout(350)
    partial=page.evaluate("HonroApp.engine.unit('npc-chunrye').x")
    check(label+': a resident walks while her line remains readable',770<partial<812 and '붕대' in page.locator('#story-line').inner_text(),partial)
    owner.wait_for_timeout(950)
    check(label+': resident stops on the authored ground',page.evaluate("HonroApp.engine.unit('npc-chunrye').x===812"));skip(page)
    setup(page,11);to(page,'휘겸','길을 비우겠소')
    before=page.evaluate('''()=>{const b=HonroApp.engine.b;return {round:b.round,phase:b.phase,active:b.active,hp:b.units.map(u=>[u.id,u.hp,u.focus,u.acted]),projectiles:b.projectiles.length};}''')
    x=page.evaluate("HonroApp.engine.heroesAlive().find(u=>u.cls==='knight').x")
    owner.wait_for_timeout(300)
    walking=page.evaluate("HonroApp.engine.heroesAlive().find(u=>u.cls==='knight').x")
    check(label+': speaking actor walks on the live Story frame',x<walking<x+22,walking)
    page.locator('[data-story-tool=history]').click()
    held=page.evaluate('JSON.stringify(HonroApp.dialogue.staging.cue)');owner.wait_for_timeout(350)
    check(label+': history pauses choreography',page.evaluate('JSON.stringify(HonroApp.dialogue.staging.cue)')==held)
    page.locator('[data-story-tool=back]').click();owner.wait_for_timeout(850)
    after=page.evaluate('''()=>{const b=HonroApp.engine.b;return {round:b.round,phase:b.phase,active:b.active,hp:b.units.map(u=>[u.id,u.hp,u.focus,u.acted]),projectiles:b.projectiles.length};}''')
    check(label+': full live App frame preserves combat while story runs',before==after)
    owner.screenshot(path=str(OUT/(label+'-protect-the-path.png')))
    page.keyboard.press('Enter') if hasattr(page,'keyboard') else owner.keyboard.press('Enter')
    check(label+': next key ends the cue and reaches the guide',page.locator('.story-guide').count()==1);skip(page)
    # Actual queue and captured enemy ID, with an explicit proximity/actor-boundary fixture.
    page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;const u=b.units.find(u=>u.side===1&&u.honroSpirit&&!u.dead);a.profile.seen['act2:first-spirit-encounter']=false;
      const h=a.engine.heroesAlive()[0];h.x=u.x-160;h.y=u.y;a.actorBoundary=b.active;HonroAct2.tick(a,0);a.actorBoundary=null;}''')
    check(label+': first spirit points at the captured real enemy',page.evaluate("HonroApp.dialogue?.staging?.context.spirit===HonroApp.dialogue?.lines[0][2].sceneTarget"))
    to(page,'소단','제 눈');owner.wait_for_timeout(750)
    check(label+': Sodan points during her explanation',page.evaluate("HonroApp.engine.heroesAlive().find(u=>u.cls==='occultist').honroScenePose?.kind==='point'"));skip(page)
    check(label+': skip restores battle input',page.evaluate('!HonroApp.dialogue&&!HonroApp.scene.storyFrozen'))
with sync_playwright() as p:
    browser=launch(p)
    context=browser.new_context(viewport={'width':1440,'height':900})
    page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(url('HONRO.html'));page.wait_for_function('window.HonroApp');suite(page,page,'Game');pose_proof(page)
    # Mid-move storage/reload uses actual Continue and actual running frames.
    setup(page,11);to(page,'휘겸','길을 비우겠소');page.wait_for_timeout(240);page.evaluate('HonroStory.save(HonroApp)')
    saved=page.evaluate('({index:HonroApp.dialogue.index,x:HonroApp.engine.heroesAlive().find(u=>u.cls==="knight").x,origin:HonroApp.dialogue.staging.context.origins.knight.x})')
    page.reload();page.wait_for_function('window.HonroApp');page.click('[data-action=continue]')
    check('Game: actual reload resumes the same page and captured origin',page.evaluate('HonroApp.dialogue.index')==saved['index'] and page.evaluate('HonroApp.dialogue.staging.context.origins.knight.x')==saved['origin'])
    page.wait_for_timeout(1000);check('Game: resumed movement ends without accumulating extra steps',page.evaluate('HonroApp.engine.heroesAlive().find(u=>u.cls==="knight").x')==saved['origin']+22);skip(page);context.close()
    context=browser.new_context(viewport={'width':1440,'height':900});editor=context.new_page();editor.on('pageerror',lambda e:errors.append(str(e)));editor.goto(url('HONRO_WORKSHOP.html'));editor.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
    editor.evaluate('HonroWorkshopAPI.selectStage("stage-3")')
    check('Stage View: fresh hidden cast uses the shared compiler',editor.evaluate("!!HonroWorkshopAPI.getRuntime().engine.b.honroStaging.hidden['npc-hwigyeom']"))
    editor.click('[data-tab=play]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');frame=editor.frames[1];suite(frame,editor,'Playtest');context.close()
    for size,name in [({'width':390,'height':844},'portrait'),({'width':844,'height':390},'landscape')]:
        context=browser.new_context(viewport=size,is_mobile=True,has_touch=True);page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(url('HONRO.html'));page.wait_for_function('window.HonroApp');setup(page,11);to(page,'휘겸','길을 비우겠소');page.wait_for_timeout(700)
        bounds=page.locator('.story-scene').bounding_box();check('Touch '+name+': compact scene and controls stay in viewport',bounds['x']>=0 and bounds['y']>=0 and bounds['x']+bounds['width']<=size['width']+1 and bounds['y']+bounds['height']<=size['height']+1,bounds)
        page.screenshot(path=str(OUT/('touch-'+name+'.png')));page.locator('[data-action=dialogue-next]').tap();check('Touch '+name+': next reaches guide',page.locator('.story-guide').count()==1);context.close()
    browser.close()
check('No browser exceptions',not errors,errors)
(OUT/'summary.json').write_text(json.dumps({'checks':checks,'errors':errors,'source':BASE or 'local generated HTML','limits':['Scene/proximity/roster fixtures, not a normal full campaign playthrough.']},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
