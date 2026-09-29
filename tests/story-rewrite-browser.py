"""Story acceptance on generated game and Workshop. Terminal states use explicit
fixtures; real DOM input, dialogue persistence and objective/recruit code are exercised.
This is not an unattended ten-stage combat playthrough.
"""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT=ROOT/'_local/reports/story-rewrite';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,detail or '',flush=True)
def load(page):
    page.goto((ROOT/'HONRO.html').as_uri());page.wait_for_function('window.HonroApp');page.evaluate('HonroApp.frame=()=>{}')
def skip(page):
    page.locator('[data-action="dialogue-skip"]').click()
def fixture_win(page,sid):
    return page.evaluate('''sid=>{const a=HonroApp,e=a.engine,b=e.b,hs=b.honroState,st=a.stage;
      for(const ev of b.honroEvents)hs.flags['event:'+ev.id]=true;hs.pendingEvents=[];
      for(const u of b.units){Object.assign(u,{vx:0,vy:0,airborne:false,jumping:false});if(u.side===1&&!(sid===10&&u.id==='boss')){u.hp=0;u.dead=true;}}
      b.phase='transition';b.projectiles=[];b.round=Math.max(b.round,sid+3);hs.objectiveReadyRound=b.round-2;
      if(sid===1){e.heroesAlive()[0].x=b.honroMarkers.find(m=>m.type==='exit').x;delete hs.flags['event:witness'];hs.pendingEvents.push('witness');}
      if(sid===2)e.unit('objective').x=b.honroEscortGoalX;
      if(sid===3)hs.ledger=true;
      if(sid===4)b.round=st.holdRounds+1;
      if([5,8].includes(sid))for(const t of b.terrain)if(t.honroSeal){t.broken=true;t.hp=0;}
      if(sid===6){hs.rescued=true;e.unit('objective').x=b.honroMarkers.find(m=>m.type==='exit').x;}
      if(sid===7)hs.rescuedCount=3;
      if(sid===9)hs.receivers=2;
      if(sid===10){const boss=e.unit('boss');e.hurt(boss,1e9,e.heroesAlive()[0].id);if(boss.dead||boss.hp<=0)throw Error('Sodan died');boss.hp=boss.maxHp*.4;for(const u of b.units)Object.assign(u,{vx:0,vy:0,airborne:false,jumping:false});hs.receivers=2;HonroEncounters.actorEnd(a,b.active);
        if(!hs.sodanCoop||hs.sodanBreach.units.length!==8)throw Error('Missing external breach');
        if(!a.dialogue&&!a.startQueuedStory())throw Error('Missing cooperation scene');
        if(!a.dialogue.lines.some(l=>l[0]==='소단'))throw Error('Filtered Sodan');HonroStory.finish(a);
        for(const u of e.alive(1)){u.hp=0;u.dead=true;}b.teamEnds[1]+=6;HonroEncounters.actorEnd(a,b.active);while(a.dialogue)HonroStory.finish(a);
      }
      if(e.heroesAlive().some(u=>u.x<0||u.x>b.width)||e.unit('objective')?.x>b.width)throw Error('Victory fixture left the actual map');
      a.checkMission(e);const phase=b.phase;if(phase==='won')a.outcome();return {phase,lines:a.dialogue?.lines.length,summary:b.winnerReason};}''',sid)

with sync_playwright() as p:
    browser=launch(p)
    game=browser.new_page(viewport={'width':1440,'height':900});game.on('pageerror',lambda e:errors.append(str(e)));load(game)
    game.evaluate('HonroApp.profile=HONRO_TOOLS.fresh();HonroApp.showMap()')
    check('Tavern introduction establishes missing people and Hongman',game.evaluate('HonroApp.dialogue.lines.some(l=>l[1].includes("고향"))&&HonroApp.dialogue.lines.some(l=>l[1].includes("홍만"))'))
    skip(game)
    for sid in range(1,11):
        data=game.evaluate('''id=>{const a=HonroApp;const open=a.isOpen(HONRO_CONTENT.stages[id-1]);a.launch(id);return{open,id:a.engine.b.honroStage,party:a.engine.heroesAlive().map(u=>u.cls),lines:a.dialogue.lines.length,sodan:a.dialogue.lines.some(l=>l[0]==='소단')};}''',sid)
        expected=['archer']+(['mage'] if sid>=3 else [])+(['knight'] if sid>=6 else [])
        check(f'Stage {sid} opens from preceding clear with correct party',data['open'] and data['id']==sid and data['party']==expected,data)
        if sid==10:check('Hostile Sodan speaks before the battle',data['sodan'])
        skip(game);game.evaluate('HonroApp.turnNotice=null')
        won=fixture_win(game,sid);check(f'Stage {sid} real objective resolves to a paused victory scene',won['phase']=='won' and won['lines']>0,won)
        skip(game)
        state=game.evaluate('({cleared:HonroApp.profile.cleared[HonroApp.stage.id],party:HonroApp.profile.recruited,done:HonroApp.done})')
        expected_after=['archer']+(['mage'] if sid>=2 else [])+(['knight'] if sid>=5 else [])
        check(f'Stage {sid} skip still awards clear and intended recruits',state['done'] and bool(state['cleared']) and state['party']==expected_after,state)
        game.click('[data-action="retry"]');skip(game)
        lost=game.evaluate('''()=>{const a=HonroApp;for(const u of a.engine.heroesAlive()){u.hp=0;u.dead=true;}a.checkMission(a.engine);a.outcome();return{phase:a.engine.b.phase,done:a.done};}''')
        check(f'Stage {sid} loss and retry remain reachable',lost['phase']=='lost' and lost['done'],lost)

    # Actual ledger interaction, immediately followed by victory, must display discovery first.
    game.evaluate('''()=>{const a=HonroApp;a.launch(3);HonroStory.finish(a);a.turnNotice=null;const e=a.engine,b=e.b,m=b.honroMarkers.find(m=>m.action==='ledger');
      for(const u of e.alive(1)){u.dead=true;u.hp=0;}for(const u of b.units)Object.assign(u,{vx:0,vy:0,airborne:false,jumping:false});
      Object.assign(e.active,{x:m.x,y:m.y});if(!HonroInteractions.use(a,m))throw Error('Cannot use ledger');e.finishAction(true);b.round=8;b.honroState.objectiveReadyRound=6;a.checkMission(e);}''')
    check('Victory begins with queued ledger discovery',game.evaluate('HonroApp.dialogue.lines[0][2].storyId.endsWith(":ledger")'))
    game.click('[data-action="dialogue-next"]')
    check('Ledger is a real document panel',game.locator('.story-document').count()==1 and '아이 둘' in game.locator('#story-line').inner_text())
    game.screenshot(path=str(OUT/'ledger-desktop.png'))
    saved=game.evaluate('({index:HonroApp.dialogue.index,ledger:HonroApp.engine.b.honroState.ledger,heroes:HonroApp.profile.heroes})')
    game.reload();game.wait_for_function('window.HonroApp');game.evaluate('HonroApp.frame=()=>{}');game.click('[data-action="continue"]')
    check('Reload/continue restores exact document page and semantic discovery',game.evaluate('({index:HonroApp.dialogue.index,ledger:HonroApp.engine.b.honroState.ledger,heroes:HonroApp.profile.heroes})')==saved and game.locator('.story-document').count()==1)
    game.click('[data-story-tool="history"]');game.locator('.story-record summary').filter(has_text='홍만이 남긴 두 기록').click()
    check('History contains both ledger pages',game.locator('.story-history .record-document').count()==2)
    game.keyboard.press('Escape');check('Closing history preserves document position',game.evaluate('!HonroApp.storyHistoryOpen&&HonroApp.dialogue.index===1'))
    skip(game);game.evaluate('HonroApp.journal()')
    check('Skipped discoveries remain readable from journal',game.locator('#modal .record-document').count()==2)
    game.evaluate('HonroApp.close()')

    custom=game.evaluate('''()=>{const a=HonroApp,prior=JSON.stringify(a.profile.honroNarrative),p=HonroMaps.normalize(HONRO_PROJECT),s=HonroMaps.emptyStage('story-test','작성한 마당',1600,1000);
      s.terrains=[{id:'floor',type:'solid',points:[{x:0,y:800},{x:1600,y:800},{x:1600,y:1100},{x:0,y:1100}],baseMaterial:'rock',breakable:false}];s.units=[HonroUnits.record('archer','p-archer',220,800)];s.objectives=[{id:'clear',type:'clear',label:'마당 정리',required:true}];p.stages=[s];p.activeStageId=s.id;
      a.launchMap(p,s.id,{story:false});HonroStory.start(a,[['작성자','이 맵에서 나눈 대화']],{title:'작성한 이야기'});HonroStory.finish(a);const local=a.engine.b.honroState.narrative.length;
      a.checkMission(a.engine);const summary=a.engine.b.winnerReason;a.showTitle();return{local,summary,preserved:JSON.stringify(a.profile.honroNarrative)===prior};}''')
    check('Custom map story and result remain separate from campaign history',custom['local']==1 and custom['preserved'] and custom['summary']=='작성한 목표를 달성했다.',custom)

    # Legacy v5 tuple-only dialogue remains resumable, without resetting existing growth.
    game.evaluate('''()=>{const a=HonroApp;a.launch(4);a.dialogue={lines:[['서술','이전 저장의 첫 문장'],['설오','이전 저장의 이어 읽을 문장']],index:1,after:'entry',title:'이전 저장'};HonroStory.draw(a);}''')
    before=game.evaluate('JSON.stringify(HonroApp.profile.heroes)')
    game.reload();game.wait_for_function('window.HonroApp');game.evaluate('HonroApp.frame=()=>{}');game.click('[data-action="continue"]')
    check('Legacy dialogue and growth survive migration-free resume',game.locator('#story-line').inner_text()=='이전 저장의 이어 읽을 문장' and game.evaluate('JSON.stringify(HonroApp.profile.heroes)')==before)
    skip(game)

    # A rescue is committed by interaction, not by finishing its dialogue callback.
    rescue=game.evaluate('''()=>{const a=HonroApp;a.launch(7);HonroStory.finish(a);a.turnNotice=null;const e=a.engine,b=e.b,m=b.honroMarkers.find(m=>m.action==='rescue');Object.assign(e.active,{x:m.x,y:m.y});
      const used=HonroInteractions.use(a,m),count=b.honroState.rescuedCount;if(a.dialogue)throw Error('Rescue interrupted review');e.finishAction(true);const blocked=!!a.dialogue&&!a.canInput();
      for(const u of e.alive(1)){u.dead=true;u.hp=0;}const shown=!!a.dialogue;if(a.dialogue)HonroStory.finish(a);return{used,count,blocked,shown,resolved:e.unit(m.target).honroResolved,collected:m.collected,after:b.honroState.rescuedCount};}''')
    check('Rescue is committed once; testimony pauses at actor end and skip keeps it',all(rescue.get(k) for k in ['used','blocked','shown','resolved','collected']) and rescue['count']==rescue['after']==1,rescue)

    # Review every line's width; scrollable long panels stay within all three viewports.
    for width,height in [(1440,900),(390,844),(844,390)]:
        game.set_viewport_size({'width':width,'height':height})
        layout=game.evaluate('''()=>{const a=HonroApp;a.launch(9);HonroStory.finish(a);const all=[...HONRO_CONTENT.stages.flatMap(st=>[...st.story,...st.outro]),...HonroStoryContent.interaction(a,{action:'ledger'})];
          HonroStory.start(a,all,{title:'여정의 기록'});const bad=[];for(let i=0;i<a.dialogue.lines.length;i++){a.dialogue.index=i;HonroStory.draw(a);const panel=document.querySelector('.story-scene,.story-document,.narration-card'),r=panel.getBoundingClientRect(),text=document.getElementById('story-line');if(r.left<-.5||r.right>innerWidth+.5||r.top<-.5||r.bottom>innerHeight+.5||panel.scrollWidth>panel.clientWidth+1||text.scrollWidth>text.clientWidth+1)bad.push({i,width:panel.scrollWidth,client:panel.clientWidth});}return bad;}''')
        check(f'All rewritten speech fits {width}x{height}',not layout,layout)
        game.evaluate('HonroStory.start(HonroApp,HonroStoryContent.interaction(HonroApp,{action:"ledger"}),{index:1,title:"홍만의 장부"})')
        game.screenshot(path=str(OUT/f'ledger-{width}x{height}.png'))
        skip(game)

    # Native frame loop proves movement continues until actor end, then dialogue pauses.
    live=browser.new_page(viewport={'width':1365,'height':768});live.on('pageerror',lambda e:errors.append(str(e)))
    live.goto((ROOT/'HONRO.html').as_uri());live.wait_for_function('window.HonroApp');live.evaluate('HonroApp.profile.cleared[1]=true;HonroApp.profile.cleared[2]=true;HonroApp.launch(3)');skip(live);live.wait_for_timeout(350)
    live.evaluate('HonroStory.queue(HonroApp,HonroStoryContent.eventLines(HonroApp,{id:"transfer"}));HonroStory.drain(HonroApp)')
    live.wait_for_timeout(80);x=live.evaluate('HonroApp.engine.active.x');live.keyboard.down('d');live.wait_for_timeout(250);live.keyboard.up('d')
    check('Queued field event permits actual movement until actor end',live.evaluate('HonroApp.engine.active.x')>x+10 and not live.evaluate('!!HonroApp.dialogue'))
    live.click('[data-action=defend]');live.wait_for_function('!!HonroApp.dialogue');x=live.evaluate('HonroApp.engine.active.x')
    live.keyboard.down('d');live.wait_for_timeout(200);live.keyboard.up('d')
    check('Actor-end dialogue stops actual movement',live.evaluate('HonroApp.engine.active.x')==x)
    live.evaluate('HonroStory.start(HonroApp,HonroStoryContent.mapScenes[0],{title:"길 위의 대화"})');x=live.evaluate('HonroApp.engine.active.x')
    live.keyboard.down('d');live.wait_for_timeout(200);live.keyboard.up('d')
    check('Important dialogue stops movement and battle input',live.evaluate('HonroApp.engine.active.x')==x and not live.evaluate('!!HonroApp.canInput()'))
    live.click('[data-story-tool="history"]');live.keyboard.press('Escape');skip(live);live.wait_for_timeout(100);x=live.evaluate('HonroApp.engine.active.x')
    live.keyboard.down('d');live.wait_for_timeout(250);live.keyboard.up('d')
    check('Closing and skipping dialogue restores actual movement',live.evaluate('HonroApp.engine.active.x')>x+10)
    live.close()

    editor=browser.new_page(viewport={'width':1365,'height':900});editor.on('pageerror',lambda e:errors.append(str(e)))
    editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI')
    editor.evaluate('HonroWorkshopAPI.selectStage("stage-3")');baseline=editor.evaluate('HonroWorkshopAPI.exportProject()')
    editor.click('[data-tab="play"]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');play=editor.frames[1]
    play.evaluate('HonroApp.frame=()=>{}');check('Workshop runs the same Act 1 story version',play.evaluate('HonroStoryContent.version')==6)
    if play.locator('[data-action="dialogue-skip"]').count():skip(play)
    play.evaluate('HonroStory.start(HonroApp,HonroStoryContent.interaction(HonroApp,{action:"ledger"}),{index:1,title:"홍만의 장부"})')
    check('Workshop Playtest renders the same document',play.locator('.story-document').count()==1)
    editor.screenshot(path=str(OUT/'workshop-ledger.png'));editor.click('#stopPlay')
    check('Story Playtest preserves the authored map',editor.evaluate('HonroWorkshopAPI.exportProject()')==baseline)
    browser.close()
check('No browser errors',not errors,errors)
(OUT/'browser.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
