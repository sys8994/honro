"""Actor boundaries, continuation guides and the finale through both real HTML shells."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/finale-performance';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)
def suite(page,shell):
    owner=page if hasattr(page,'mouse') else page.page
    page.evaluate('''()=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=true;a.updateAudio();for(let i=1;i<=10;i++)a.profile.cleared[i]=true;
      window.dismiss=()=>{let n=100;while(a.dialogue&&n--)HonroStory.finish(a);a.turnNotice=null;};
      window.endActor=()=>{const e=a.engine,u=e.active;for(let i=0;i<3000&&!a.dialogue&&!u.acted;i++)e.tick(1/120);};
      window.guideArena=id=>{const C=HONRO_CORE;a.trainingClass=C.SKILLS[id].cls;a.trainingSkill=id;a.launch(1,true,id);dismiss();const e=a.engine,b=e.b,u=e.active;Object.assign(b,{width:4000,height:2000,wind:0,terrain:[{id:'floor',x:0,y:1500,w:4000,h:500,mat:'rock',hp:99999,maxHp:99999}],waters:[],drafts:[],fields:[],zones:[],honroMarkers:[],honroLandmarks:[],honroSurfaceZones:[]});b.units=[u];Object.assign(u,{x:600,y:1500,angle:0,ranks:{[C.baseSkill(u.cls)]:1,[id]:1,AP01:3},loadout:[id],acted:false,vx:0,vy:0,airborne:false,jumping:false});const t=C.makeUnit('knight',1,850,1500,{id:'guide-target',fixed:true,hp:100000,maxHp:100000,h:130,r:25,honroType:'beast',honroVariant:'hound'});b.units.push(t);b.sceneVersion++;Object.assign(a.scene,{manual:true,x:1000,y:1400,scale:.9,storyTween:null,goalFocus:null});a.selected=id;a.updateHUD(true);return{a,e,b,u,t};};}''')
    for sid in ['A01','A04','M01','O01']:
        data=page.evaluate('''id=>{const {a,e,b,u}=guideArena(id),s=HONRO_CORE.SKILLS[id],before=JSON.stringify(b),lines=[],c=a.scene.ctx,stroke=c.stroke;let count=0;const predict=e.predict.bind(e);e.predict=(...x)=>{count++;return predict(...x);};c.stroke=function(...x){if(this.lineWidth<1.1&&this.globalAlpha<.25&&this.getLineDash().length===0)lines.push({alpha:this.globalAlpha,width:this.lineWidth});return stroke.apply(this,x);};
          a.scene.arcFx.scale=.9;a.scene.arcFx.predictionGuide(c,e,u,id,.5,false);const first=count;a.scene.arcFx.predictionGuide(c,e,u,id,.5,false);const second=count-first;c.stroke=stroke;const pr=e.predict(u,s,0,.5),ext=e.predict(u,s,0,.5,undefined,true,true);a.scene.render(e,0,id,.5,false,0);return{first,second,lines,unit:pr.unit,end:pr.x,extended:ext.x,unchanged:before===JSON.stringify(b)};}''',sid)
        check(shell+f': {sid} draws a thin translucent solid continuation and caches unchanged predictions',any(abs(x['alpha']-.22)<.001 for x in data['lines']) and data['extended']>data['end']+10 and data['second']==0 and data['unchanged'],data)
        if sid=='A01':owner.screenshot(path=str(OUT/(shell+'-continuation.png')))
    # A real multi-volley action must finish before a queued story interrupts it.
    data=page.evaluate('''()=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-3');dismiss();const e=a.engine,b=e.b,u=e.active;b.honroEvents=[];b.honroState.deferredStory=[];u.ranks.AP01=3;u.loadout=['A01'];u.focus=999;a.selected='A01';window.actorBefore=u.id;HonroStory.queue(a,[['설오','화살이 멎으면 살펴보겠습니다.',{storyId:'volley-boundary'}]]);a.updateHUD(true);return{dialogue:!!a.dialogue};}''')
    check(shell+': queued dialogue leaves current character controls available',not data['dialogue'])
    page.locator('#battlecanvas').focus();page.locator('#battlecanvas').press('Space')
    state=page.evaluate('''()=>{const a=HonroApp,e=a.engine;let seenFlight=false,ticks=0;while(!a.dialogue&&ticks++<6000){seenFlight||=e.b.phase==='flight';e.tick(1/120);}return{seenFlight,dialogue:!!a.dialogue,oldActed:e.unit(actorBefore).acted,active:e.b.active,round:e.b.round,ticks,text:a.dialogue?.lines[0][1]};}''')
    check(shell+': actual repeated shot finishes before dialogue pauses the next hero',state['seenFlight'] and state['dialogue'] and state['oldActed'] and state['active']!=page.evaluate('actorBefore'),state)
    data=page.evaluate('''()=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-3');dismiss();const e=a.engine,b=e.b;b.honroEvents=[];b.honroState.deferredStory=[];const [first,second]=e.heroesAlive();b.active=first.id;HonroStory.queue(a,[['설오','First actor']]);b.active=second.id;HonroStory.queue(a,[['설오','Second actor']]);a.defend();endActor();const ready=a.dialogue?.lines.map(l=>l[1]),pending=b.honroState.storyQueue.map(l=>l[1]);dismiss();b.active=first.id;a.defend();endActor();return{ready,pending,next:a.dialogue?.lines.map(l=>l[1])};}''')
    check(shell+': a ready character event passes another character still acting without merging their dialogue',data['ready']==['Second actor'] and data['pending']==['First actor'] and data['next']==['First actor'],data)
    # Launch the actual canonical finale, then use explicit objective fixtures.
    page.evaluate('''()=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-10');dismiss();const b=a.engine.b;b.honroEvents=[];b.honroState.deferredStory=[];b.honroState.receivers=2;for(const m of b.honroMarkers)if(m.action==='receiver')m.collected=true;a.engine.unit('boss').hp=a.engine.unit('boss').maxHp*.4;a.missionTick(0);a.updateHUD(true);}''')
    check(shell+': weakened Sodan does not interrupt the acting character',page.evaluate('!HonroApp.engine.b.honroState.sodanCoop&&!HonroApp.dialogue'))
    page.locator('[data-action=defend]').click();page.evaluate('endActor()')
    state=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,s=a.engine.unit('boss');return{dialogue:!!a.dialogue,coop:b.honroState.sodanCoop,fixed:s.fixed,role:s.allyRole,sp:Object.keys(s.ranks).length,wave:b.honroState.sodanBreach.units.length,paused:!a.canInput()};}''')
    check(shell+': defend ends the actor, plays the turning point and starts an eight-monster rush',state['dialogue'] and state['coop'] and state['fixed'] and state['wave']==8 and state['paused'],state)
    owner.wait_for_timeout(550)
    page.evaluate("HonroApp.scene.render(HonroApp.engine,0,'',.5,false,0);HonroApp.updateHUD(true)")
    owner.screenshot(path=str(OUT/(shell+'-cooperation.png')))
    data=page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b;dismiss();b.round=20;const rows=[];for(let i=1;i<=3;i++){for(const u of e.alive(1)){u.hp=0;u.dead=true;}b.teamEnds[1]++;HonroEncounters.actorEnd(a,b.active);rows.push({hold:b.honroState.coopHold,alive:e.alive(1).length,phase:b.phase});dismiss();}const saved=structuredClone(b);window.defenseSave=structuredClone(saved);a.mount(saved);dismiss();const s=a.engine.unit('boss');Object.assign(a.scene,{manual:true,x:s.x,y:s.y-130,scale:.8,storyTween:null,goalFocus:null});a.scene.render(a.engine,0,'',.5,false,0);a.updateHUD(true);return{rows,hold:a.engine.b.honroState.coopHold,fixed:s.fixed,summary:document.getElementById('objective-text').textContent};}''')
    check(shell+': three full defenses spawn fresh waves and resume at 3/6',data['hold']==3 and data['fixed'] and all(x['alive']==6 and x['phase']!='won' for x in data['rows']) and '3/6' in data['summary'],data)
    owner.screenshot(path=str(OUT/(shell+'-defense.png')))
    data=page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,rows=[];for(let i=4;i<=6;i++){for(const u of e.alive(1)){u.hp=0;u.dead=true;}b.teamEnds[1]++;HonroEncounters.actorEnd(a,b.active);rows.push({hold:b.honroState.coopHold,phase:b.phase});dismiss();}return rows;}''')
    check(shell+': finale wins only after the sixth completed enemy turn',data[-1]['phase']=='won' and all(x['phase']!='won' for x in data[:-1]),data)
    data=page.evaluate('''()=>{const a=HonroApp;a.mount(structuredClone(defenseSave));dismiss();const e=a.engine,s=e.unit('boss');s.shield=0;s.hp=1;e.hurt(s,99999,e.alive(1)[0].id);a.checkMission(e);return{hp:s.hp,dead:s.dead,phase:e.b.phase};}''')
    check(shell+': real enemy damage can kill the channeler and fail the defense',data['dead'] and data['phase']=='lost',data)
    # Trusted input above unlocked audio; report real request-to-source-start scheduling.
    owner.wait_for_timeout(900)
    sound=page.evaluate('''async()=>{const a=HonroApp.audio;await a.wake();a.play('arrowhit');const first=a.buffers.get('arrowhit');for(let i=0;i<12;i++)a.play('arrowhit');return{running:a.context.state,delay:a.startedAt.arrowhit-a.requestedAt.arrowhit,cached:first===a.buffers.get('arrowhit'),buffers:a.buffers.size,voices:a.voices.size};}''')
    check(shell+': warmed sound effects reuse buffers and start without a main-thread synthesis delay',sound['running']=='running' and sound['delay']<10 and sound['cached'] and sound['buffers']>=8 and sound['voices']<=20,sound)
with sync_playwright() as p:
    browser=launch(p)
    for shell in ['Game','Workshop']:
        owner=browser.new_page(viewport={'width':1440,'height':900});owner.on('pageerror',lambda e:errors.append(str(e)))
        owner.goto((ROOT/('HONRO.html' if shell=='Game' else 'HONRO_WORKSHOP.html')).as_uri())
        if shell=='Workshop':owner.click('[data-tab=play]');owner.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');page=owner.frames[1]
        else:page=owner
        suite(page,shell);owner.close()
    browser.close()
check('No uncaught browser errors',not errors,errors)
(OUT/'browser.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
