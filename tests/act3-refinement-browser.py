"""Real bundles and DOM/Canvas evidence. Explicit progress/damage fixtures, not a campaign clear."""
import json, base64, sys
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
OUT=ROOT/'_local/reports/act3-refinement-browser';OUT.mkdir(parents=True,exist_ok=True)
BASE=next((arg.split('=',1)[1].rstrip('/')+'/' for arg in sys.argv[1:] if arg.startswith('--base=')),None)
if BASE:OUT=ROOT/'_local/reports/act3-refinement-public';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,condition,detail=None):
    assert condition,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)
SETUP='''id=>{const a=HonroApp;a.frame=()=>{};a.profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(HONRO_PROJECT.stages[id-1])};for(let i=1;i<id;i++)a.profile.cleared[i]={};a.profile.settings.sound=false;a.profile.settings.music=false;if(globalThis.HONRO_EMBEDDED)a.launchMap(HONRO_PROJECT,'stage-'+id,{story:false});else a.launch(id);for(let i=0;a.dialogue&&i<40;i++)HonroStory.finish(a);a.close();a.turnNotice=null;const notice=document.getElementById('event');if(notice)notice.textContent='';a.scene.storyTween=null;a.scene.goalFocus=null;a.scene.cinematic=null;a.scene.manual=true;const banner=document.getElementById('turn-banner');if(banner)banner.hidden=true;a.updateHUD(true);return a.engine.b.honroStage;}'''
with sync_playwright() as p:
    browser=launch(p)
    for shell,file in [('Game','HONRO.html'),('Playtest','HONRO_WORKSHOP.html')]:
        owner=browser.new_page(viewport={'width':1440,'height':900});owner.on('pageerror',lambda e:errors.append(str(e)));owner.goto(BASE+file if BASE else (ROOT/file).as_uri())
        if shell=='Playtest':
            owner.wait_for_function('HonroWorkshopAPI?.getRuntime()?.scene');owner.click('[data-tab="play"]');owner.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');page=owner.frames[1]
        else:page=owner;page.wait_for_function('window.HonroApp')
        check(shell+' canonical entry',page.evaluate(SETUP,28)==28)
        page.wait_for_function('HonroAct1Background.ready(28)')
        presentation=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,s=HonroObjectives.state(b,a.stage);return{goal:document.getElementById('objective-text').textContent,current:s.currentInstruction,rows:s.visibleChecklist.map(q=>q.id),future:HonroAct3.steps(b).slice(1).map(q=>q.label),xp:getComputedStyle(document.querySelector('.hud-xp')).display,bar:document.querySelector('.hud-xp').getBoundingClientRect().height,sky:HonroAct1Background.imageFor(28).naturalWidth};}''')
        check(shell+' one current objective and subtle XP bar',presentation['goal']==presentation['current'] and len(presentation['rows'])==1 and presentation['bar']==3 and presentation['xp']!='none' and presentation['sky']==1600,presentation)
        page.locator('#objective-text').click()
        rows=page.locator('.mission-checklist li').all_text_contents()
        check(shell+' panel opens current checklist without future goals',len(rows)==1 and not any(f in page.locator('.mission-checklist').inner_text() for f in presentation['future']),rows)
        page.evaluate('HonroApp.close()')
        result=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,first=HonroAct3.steps(b)[0];HonroAct3.memory(b).done[first.id]=true;HonroObjectives.refresh(a);const s=HonroObjectives.help(a);return{goal:document.getElementById('objective-text').textContent,rows:s.checklist.map(q=>({id:q.id,done:q.done,current:q.current}))};}''')
        check(shell+' next goal follows completion with past checkmark',len(result['rows'])==2 and result['rows'][0]['done'] and result['rows'][1]['current'] and result['goal']!=presentation['goal'],result)
        entry=page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,ev=b.honroEvents.find(v=>v.id==='act3-response-28-0');const count=e.alive(1).length;a.actorBoundary=null;a.missionTick(0);a.updateHUD(true);const warned=document.getElementById('event').textContent,queued=b.honroState.pendingEvents.includes(ev.id),early=e.alive(1).length-count;e.active.acted=false;b.phase='aim';e.finishAction();for(let i=0;i<600&&!b.honroState.flags['event:'+ev.id];i++)e.tick(1/120);const born=b.units.filter(u=>u.honroSpawnSource===ev.id),committed=!!b.honroState.flags['event:'+ev.id];HonroEncounters.flush(a);return{queued,warned,early,committed,initial:count,total:e.alive(1).length,cap:HonroEncounters.populationCap(b),born:born.length,expected:ev.action.n,supported:born.every(u=>HONRO_CORE.validTerrainContactPose(b.terrain,u)),single:b.units.filter(u=>u.honroSpawnSource===ev.id).length===born.length};}''')
        check(shell+' warning precedes one supported entry at a real action end',entry['queued'] and entry['warned'] and entry['early']==0 and entry['initial']==24 and entry['total']==entry['initial']+entry['expected'] and entry['total']<=entry['cap'] and entry['committed'] and entry['born']==entry['expected'] and entry['supported'] and entry['single'],entry)
        damage=page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=b.units.find(u=>u.side===1);u.armor=0;u.shield=0;u.hp=u.maxHp=10000;u.existenceDefense=undefined;e.checkEnd=()=>false;const totals=[];b.shot=900;
         for(let i=0;i<3;i++){e.hurt(u,30,e.active.id,false,undefined,undefined,'environment');totals.push([...a.scene.damageNumbers.values()].at(-1).total);}b.shot=901;e.hurt(u,10,e.active.id,false,undefined,undefined,'environment');return{totals,last:[...a.scene.damageNumbers.values()].at(-1).total,count:a.scene.damageNumbers.size};}''')
        check(shell+' real damage events accumulate per attack then reset',damage['totals']==[30,60,90] and damage['last']==10 and damage['count']==2,damage)
        recovery=page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,h=b.heroes[u.cls];h.xp=HONRO_CORE.xpAtLevel(Math.floor(HonroProgression.plan(b.honroStage).entryLevel))-1;HONRO_CORE.applyHero(u,h,false);u.hp=1;u.focus=1;u.moveLeft=1;u.acted=true;const before=u.level;HonroProgression.awardCombat(e,u,2);a.updateHUD(true);return{before,level:u.level,hp:u.hp,maxHp:u.maxHp,mp:u.focus,maxMp:u.maxFocus,move:u.moveLeft,maxMove:u.maxMove,acted:u.acted,xp:document.querySelector('.hud-xp i').style.width};}''')
        check(shell+' combat level restores vitals without another action',recovery['level']==recovery['before']+1 and recovery['hp']==recovery['maxHp'] and recovery['mp']==recovery['maxMp'] and recovery['move']==recovery['maxMove'] and recovery['acted'],recovery)
        if shell=='Game':
            for id in range(21,31):
                page.evaluate(SETUP,id);page.wait_for_timeout(80)
                page.evaluate('''()=>{const a=HonroApp,s=HONRO_PROJECT.stages[a.stage.id-1];Object.assign(a.scene,{x:s.width/2,y:2400,scale:Math.min(1370/s.width,.32),manual:true,time:2});a.scene.render(a.engine,0,'',.6,false,0);}''')
                page.locator('#battlecanvas').screenshot(path=str(OUT/f'stage-{id}-wide.png'))
            page.evaluate(SETUP,28)
            for w,h in [(1440,900),(390,844),(844,390)]:
                owner.set_viewport_size({'width':w,'height':h});page.evaluate('''()=>{const a=HonroApp,u=a.engine.active;Object.assign(a.scene,{x:u.x+190,y:u.y-180,scale:innerWidth<600?.65:.8,manual:true});a.updateHUD(true);a.scene.render(a.engine,0,'',.6,false,0);}''');page.locator('#battlecanvas').screenshot(path=str(OUT/f'game-{w}x{h}.png'))
                xp=page.evaluate('''()=>{const r=document.querySelector('.hud-xp').getBoundingClientRect();return{w:r.width,h:r.height,left:r.left,right:r.right,bottom:r.bottom};}''');check(f'XP layout {w}x{h}',xp['w']>25 and xp['h']==3 and xp['left']>=0 and xp['right']<=w and xp['bottom']<=h,xp)
            owner.set_viewport_size({'width':1440,'height':900})
            # A fresh debug clone at the locked split section must still open the camp.
            page.evaluate('HonroApp.setDebugMode(true)');page.evaluate(SETUP,25)
            rest=page.evaluate('''()=>{const a=HonroApp;const locked=HonroSplitCampaign.locked(a.profile);a.showRest();for(let i=0;a.dialogue&&i<40;i++)HonroStory.finish(a);return{locked,screen:a.screen,fire:!!document.querySelector('[data-action="camp"]')};}''')
            check('Debug locked expedition can visit rest and fire',rest['locked'] and rest['screen']=='rest' and rest['fire'],rest)
            page.locator('[data-action="camp"]').click();check('Debug fire opens real skill/stat setup',page.evaluate('HonroApp.screen')=='camp' and page.locator('#armory').count()==1)
            # Real vector art, small sizes, all clips, both facings and contact purity.
            art=page.evaluate('''()=>{const V=HonroMonsterVisual,ids=Object.keys(V.assets).filter(id=>V.assets[id].budget==='act3-authored'),cv=document.createElement('canvas');cv.width=1500;cv.height=700;const c=cv.getContext('2d');c.fillStyle='#253a3b';c.fillRect(0,0,1500,700);const rows=[];
             ids.forEach((id,i)=>{const a=V.assets[id],x=(i%3)*500,y=Math.floor(i/3)*350;c.fillStyle='#d7d7b4';c.font='18px sans-serif';c.fillText(a.name,x+20,y+32);for(const [j,size]of [128,96,64].entries()){c.save();c.translate(x+80+j*160,y+275);c.scale(size/a.baseHeight,size/a.baseHeight);V.draw(c,id,{time:0,pixels:size});c.restore();}const frames={};for(const clip of ['idle','move','attack','hit','jump_fall']){const snaps=[];for(const facing of [-1,1])for(const t of [0,.2,.45,.8]){const v=document.createElement('canvas');v.width=256;v.height=256;const ctx=v.getContext('2d');ctx.translate(128,220);ctx.scale(facing*1.4,1.4);V.draw(ctx,id,{time:t,state:clip==='idle'?{}:clip==='move'?{move:true}:{[clip==='jump_fall'?'jump':clip]:t},pixels:144});snaps.push(v.toDataURL());}frames[clip]=new Set(snaps).size;}rows.push({id,frames});});return{rows,image:cv.toDataURL()};}''')
            check('Six Korean fiend designs have five animation clips',len(art['rows'])==6 and all(all(n>2 for n in r['frames'].values()) for r in art['rows']),art['rows'])
            (OUT/'fiend-sizes.png').write_bytes(base64.b64decode(art['image'].split(',')[1]))
            for row in art['rows']:
                id=row['id'];svg=(ROOT/f'shared/assets/monsters/{id}.svg').read_text(encoding='utf-8')
                result=page.evaluate(r'''async([id,svg])=>{const V=HonroMonsterVisual,a=V.assets[id],[x,y,w,h]=a.viewBox,make=()=>{const c=document.createElement('canvas');c.width=w*3;c.height=h*3;return c;},left=make(),right=make(),l=left.getContext('2d'),r=right.getContext('2d'),im=new Image();im.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));await im.decode();l.drawImage(im,0,0,w*3,h*3);r.scale(3,3);r.translate(-x,-y);V.draw(r,id,{time:0,pixels:256,detail:2});const aa=l.getImageData(0,0,w*3,h*3).data,bb=r.getImageData(0,0,w*3,h*3).data;let changed=0;for(let i=0;i<aa.length;i+=4)if(Math.max(...[0,1,2,3].map(j=>Math.abs(aa[i+j]-bb[i+j])))>20)changed++;const planted=[0,.3,1,2].every(t=>['left-leg','right-leg'].every(p=>{const q=V.pose(a,t,{})[p];return q.x===0&&q.y===0&&q.rotate===0;}));return{diff:changed/(w*h*9),planted};}''',[id,svg])
                check(id+' editable SVG matches runtime and idle feet stay planted',result['diff']<.015 and result['planted'],result)
        owner.close()
    check('No runtime errors',not errors,errors);browser.close()
(OUT/'summary.json').write_text(json.dumps({'passed':True,'checks':checks,'limits':['Objective, damage and XP conditions use explicit QA fixtures. No normal-play balance/completion claim.']},ensure_ascii=False,indent=2),encoding='utf-8')
