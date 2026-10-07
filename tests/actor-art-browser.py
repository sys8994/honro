"""Remaining cast: campaign coverage, shared rendering, live actions and art evidence.

This verifies implementation contracts; PNG review is a separate art decision.
"""
import base64, hashlib, json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT=ROOT/'_local/reports/actor-forge';OUT.mkdir(parents=True,exist_ok=True)
BASE=json.loads((ROOT/'tests/fixtures/actor-baseline.json').read_text(encoding='utf-8'))
METRICS=json.loads((OUT/'metrics.json').read_text(encoding='utf-8'))
checks=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)
def png(name,data): (OUT/(name+'.png')).write_bytes(base64.b64decode(data.split(',')[1]))
def listen(page): page.on('pageerror',lambda e:errors.append(str(e)))

AUDIT=r'''()=>{const V=HonroActorVisual,cv=document.createElement('canvas');cv.width=700;cv.height=700;const c=cv.getContext('2d'),rows=[];
 for(const[id,a]of Object.entries(V.assets)){let bounded=true,visible=true,rigid=true;const frames={};
 for(const facing of [-1,1])for(const motion of Object.keys(a.clips))for(const t of [0,.2,.48,.75,1]){
  const state=motion==='idle'?{}:motion==='move'?{move:true}:{[motion==='jump_fall'?'jump':motion]:t};
  const pose=V.pose(a,t*a.clips[motion].duration,state);rigid&&=Object.values(pose).every(p=>Object.values(p).every(Number.isFinite)&&(a.family==='summon'||p.scaleX===1&&p.scaleY===1));
  c.clearRect(0,0,700,700);c.save();c.translate(350,520);c.scale(facing*180/a.baseHeight,180/a.baseHeight);V.draw(c,id,{time:t*a.clips[motion].duration,state,pixels:180});c.restore();
  const pixels=c.getImageData(0,0,700,700).data;let count=0;
  for(let y=0;y<700;y++)for(let x=0;x<700;x++)if(pixels[(y*700+x)*4+3]>32){count++;if(x===0||x===699||y===0||y===699)bounded=false;}
  visible&&=count>150;if(facing===1)(frames[motion]??=new Set()).add(cv.toDataURL());
 }
 const feet=a.family==='human'?['rear-leg','front-leg','rear-foot','front-foot']:[];
 const planted=[0,.3,1,2].every(t=>feet.every(p=>Object.entries(V.pose(a,t,{})[p]).every(([k,v])=>v===(k.startsWith('scale')?1:0))));
 const clips=Object.fromEntries(Object.entries(frames).map(([k,v])=>[k,v.size]));
 rows.push({id,bounded,visible,rigid,planted,clips});}
 return rows;}'''

ARENA=r'''()=>{const p=HonroMaps.normalize(HONRO_PROJECT),s=HonroMaps.emptyStage('actor-art','Remaining cast',8000,1050);
 s.terrains=[{id:'floor',type:'solid',points:[{x:0,y:800},{x:8000,y:800},{x:8000,y:1050},{x:0,y:1050}],baseMaterial:'rock',breakable:false}];
 s.units=[HonroUnits.record('occultist','owner',180,800),HonroUnits.record('human','foe',7700,800),...fixtures.map((d,i)=>({...HONRO_CORE.makeUnit(d.unit.cls,d.unit.side,480+i*300,800,{id:'art-'+d.id,name:d.name,h:110,r:25,hp:1000,maxHp:1000,...d.unit}),id:'art-'+d.id,kind:d.family==='summon'?'occultist':d.id==='colossus'?'boss:bier':d.unit.honroType==='bier'?'object:bier':d.unit.honroType==='gate'?'object:gate':d.unit.honroType==='civilian'?'object:civilian':'ally:'+(d.unit.allyRole||'guard'),team:d.unit.side===0?'player':d.unit.side===1?'enemy':'ally',runtimeTemplate:true}))];
 s.events=[];p.stages=[s];p.activeStageId=s.id;return p;}'''
SPRITES=r'''(scene,e)=>{const cv=document.createElement('canvas');cv.width=1500;cv.height=1600;const c=cv.getContext('2d');scene.time=0;scene.walkTime=0;scene.actorEngine=e;scene.scale=1;
 for(const[id,a]of Object.entries(HonroActorVisual.assets)){const i=Object.keys(HonroActorVisual.assets).indexOf(id),u=e.unit('art-'+id);scene.unitBody(c,{...u,x:150+i%5*300,y:280+Math.floor(i/5)*300,h:a.family==='object'?115:180,facing:1,angle:0});}return cv.toDataURL();}'''
RUNTIME=r'''()=>{const a=HonroApp;a.frame=()=>{};a.dialogue=null;a.turnNotice=null;a.done=false;const e=a.engine,b=e.b;Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,scale:1,x:700,y:600,time:0});const before=JSON.stringify(b),image=(SPRITES)(a.scene,e),pure=before===JSON.stringify(b);a.scene.render(e,0,'',0,false,0);a.updateHUD(true);return{image,pure,hash:HONRO_ACTORS.sourceSha256,kinds:b.units.filter(u=>u.id.startsWith('art-')).map(u=>[u.id,HonroActorVisual.kind(u)]),error:a.lastError||null};}'''.replace('SPRITES',SPRITES)

with sync_playwright() as p:
    browser=launch(p)
    lab=browser.new_page(viewport={'width':1500,'height':1100});listen(lab);lab.goto((OUT/'index.html').as_uri());lab.wait_for_function('window.ActorLab')
    actor_fixtures=lab.evaluate('catalog')
    rows=lab.evaluate(AUDIT)
    idle=lab.evaluate(r'''() => Object.values(HonroActorVisual.assets).filter(a=>a.family==='summon').map(a=>({id:a.id,rotates:a.clips.idle.tracks.some(t=>t.channel==='rotate'),deforms:a.clips.idle.tracks.some(t=>t.channel==='scaleX'||t.channel==='scaleY'),amplitude:Math.max(...a.clips.idle.tracks.filter(t=>t.channel==='scaleX'||t.channel==='scaleY').flatMap(t=>t.keys.map(k=>Math.abs(k[1]-1))))}))''')
    check('Summon idle uses contour deformation without repeated tilting',all(v['deforms'] and not v['rotates'] for v in idle),idle)
    check('Eater has a visible grotesque compression cycle',next(v for v in idle if v['id']=='summon_eater')['amplitude']>=.04,idle)
    for row in rows:
        m=next(m for m in METRICS['assets'] if m['id']==row['id'])
        check(row['id']+': bounded five-motion geometry, valid joints and planted idle feet',all(row[k] for k in ['bounded','visible','rigid','planted']),row)
        budget=BASE['assets'][row['id']]['anchors']*3.15 if row['id'] in BASE['assets'] else 240
        check(row['id']+': anchor ceiling and visible attack/hit response',m['anchors']<=budget and row['clips']['attack']>1 and row['clips']['hit']>1,{'anchors':m['anchors'],'ratio':m['ratio']})
    check('Actor source provenance matches runtime',lab.evaluate('HONRO_ACTORS.sourceSha256')==METRICS['sourceSha256']==hashlib.sha256('\n'.join(n+'\n'+(ROOT/n).read_text(encoding='utf-8') for n in METRICS['sourceFiles']).encode()).hexdigest())
    for n,h in BASE['sources'].items(): check('Immutable before source '+n,hashlib.sha256((ROOT/n).read_bytes()).hexdigest()==h)
    # Exported vector geometry and the shipped renderer must agree at bind pose.
    for id in [row['id'] for row in METRICS['assets']]:
        svg=(ROOT/f'shared/assets/actors/{id}.svg').read_text(encoding='utf-8')
        diff=lab.evaluate(r'''async([id,svg])=>{const a=HonroActorVisual.assets[id],[x,y,w,h]=a.viewBox,make=()=>{const c=document.createElement('canvas');c.width=w*3;c.height=h*3;return c;},left=make(),right=make(),l=left.getContext('2d'),r=right.getContext('2d'),im=new Image();im.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));await im.decode();l.drawImage(im,0,0,w*3,h*3);r.scale(3,3);r.translate(-x,-y);HonroActorVisual.draw(r,id,{time:0,pixels:256,detail:2});const aa=l.getImageData(0,0,w*3,h*3).data,bb=r.getImageData(0,0,w*3,h*3).data;let changed=0;for(let i=0;i<aa.length;i+=4)if(Math.max(...[0,1,2,3].map(j=>Math.abs(aa[i+j]-bb[i+j])))>20)changed++;return changed/(w*h*9);}''',[id,svg])
        check(id+': SVG matches runtime',diff<.015,diff)
    for selector,name in [('#roster','roster'),('#style','style-comparison'),('#comparison','comparison')]:lab.locator(selector).screenshot(path=str(OUT/(name+'.png')))
    for id in [row['id'] for row in METRICS['assets']]:
        lab.select_option('#actor',id);lab.locator('#focus').screenshot(path=str(OUT/(id+'-detail.png')));lab.locator('#sizes').screenshot(path=str(OUT/(id+'-sizes.png')))
        atlas=lab.evaluate(r'''id=>{const cv=document.createElement('canvas');cv.width=1300;cv.height=1250;const c=cv.getContext('2d'),V=HonroActorVisual,a=V.assets[id];c.fillStyle='#192a2c';c.fillRect(0,0,1300,1250);Object.keys(a.clips).forEach((motion,i)=>[0,.2,.48,.75,1].forEach((t,j)=>{c.fillStyle='#c9cbb8';c.font='14px sans-serif';c.fillText(`${a.name} / ${motion} ${t}`,j*260+15,i*250+22);const state=motion==='idle'?{}:motion==='move'?{move:true}:{[motion==='jump_fall'?'jump':motion]:t};c.save();c.translate(j*260+130,i*250+225);c.scale(140/a.baseHeight,140/a.baseHeight);V.draw(c,id,{time:t*a.clips[motion].duration,state,pixels:140});c.restore();}));return cv.toDataURL();}''',id)
        png(id+'-motions',atlas)
    for mode,name in [('silhouette','silhouettes'),('wire','wireframes')]:lab.select_option('#mode',mode);lab.locator('#roster').screenshot(path=str(OUT/(name+'.png')))
    lab.select_option('#mode','paint');lab.select_option('#background','#babdab');lab.locator('#roster').screenshot(path=str(OUT/'light-background.png'))
    for bg,name in [('#192a2c','dark'),('#babdab','light')]:
        png('readability-'+name,lab.evaluate(r'''bg=>{const cv=document.createElement('canvas');cv.width=1500;cv.height=1050;const c=cv.getContext('2d'),V=HonroActorVisual;c.fillStyle=bg;c.fillRect(0,0,1500,1050);Object.entries(V.assets).forEach(([id,a],i)=>{const x=i%5*300,y=Math.floor(i/5)*262;c.fillStyle=bg==='#192a2c'?'#dedac8':'#273831';c.font='14px sans-serif';c.fillText(a.name,x+15,y+25);[96,64].forEach((s,j)=>{c.save();c.translate(x+[85,235][j],y+215);c.scale(s/a.baseHeight,s/a.baseHeight);V.draw(c,id,{pixels:s});c.restore();c.fillText(s+'px',x+[65,215][j],y+245);});});return cv.toDataURL();}''',bg))
    lab.select_option('#actor','ally_guard');lab.select_option('#motion','attack');lab.click('#play');lab.wait_for_timeout(200);lab.click('#play');phase=lab.locator('#phase').text_content()
    lab.locator('#scrub').evaluate("el=>{el.value='0.48';el.dispatchEvent(new Event('input'));}");front=lab.locator('#focus').evaluate('c=>c.toDataURL()');lab.check('#flip');back=lab.locator('#focus').evaluate('c=>c.toDataURL()')
    check('Review controls play, scrub and mirror actual geometry',phase!='0%' and front!=back and lab.locator('#phase').text_content()=='48%')
    lab.locator('#notes').fill('actor review');
    with lab.expect_download() as downloaded:lab.click('#save')
    downloaded.value.save_as(str(OUT/'review-ui-download.json'));note=json.loads((OUT/'review-ui-download.json').read_text(encoding='utf-8'))
    check('Review notes preserve source hash, actor and phase',note['sourceSha256']==METRICS['sourceSha256'] and note['actor']=='ally_guard' and note['phase']==.48)
    # Keep this workload sequential with other browser/performance tests.
    perf=lab.evaluate(r'''()=>{const cv=document.createElement('canvas');cv.width=1500;cv.height=900;const c=cv.getContext('2d'),V=HonroActorVisual,ids=Object.keys(V.assets),times=[];for(let k=0;k<80;k++){const start=performance.now();c.clearRect(0,0,1500,900);for(let i=0;i<36;i++){const id=ids[i%ids.length],a=V.assets[id];c.save();c.translate(100+i%9*165,185+Math.floor(i/9)*220);c.scale(96/a.baseHeight,96/a.baseHeight);V.draw(c,id,{time:k*.02,pixels:96,state:{move:true}});c.restore();}c.getImageData(0,0,1,1);if(k>=10)times.push(performance.now()-start);}times.sort((a,b)=>a-b);return{units:36,samples:times.length,p50:times[35],p95:times[66],max:times.at(-1)};}''')
    check('36 actors within 16.7ms p95',perf['p95']<16.7,perf);lab.close()
    game=browser.new_page(viewport={'width':1440,'height':900});listen(game);game.goto((ROOT/'HONRO.html').as_uri());game.wait_for_function('window.HonroApp');game.evaluate('()=>{HonroApp.frame=()=>{};HonroApp.profile.settings.sound=false;HonroApp.profile.settings.music=false;HonroApp.updateAudio();}')
    inventory=game.evaluate(r'''()=>{const a=HonroApp,rows=[];for(let i=1;i<=10;i++){a.profile.cleared[i]={visits:1};a.launch(i);a.dialogue=null;a.turnNotice=null;for(const u of a.engine.b.units)rows.push({stage:i,id:u.id,name:u.name,type:u.honroType,actor:HonroActorVisual.kind(u),party:resolveRebuildCharacter(u),monster:HonroMonsterVisual.kind(u),act2:!!(u.honroAct2&&globalThis.HonroAct2Art)});}return rows;}''')
    check('All campaign units have an improved production design',all(r['actor'] or r['party'] or r['monster'] for r in inventory),inventory)
    check('Named allies and final Sodan keep approved party designs',all(not r['actor'] for r in inventory if r['party']),[r for r in inventory if r['party'] and not r['id'].startswith('p-')])
    catalog=game.evaluate(r'''()=>{const a=HonroApp,e=a.engine;return HonroUnits.catalog().map(d=>{const u=HonroUnits.create(HonroUnits.record(d.kind,'catalog-'+d.kind,500,800),e.b,a.profile,a.stage);return{kind:d.kind,actor:HonroActorVisual.kind(u),party:resolveRebuildCharacter(u),monster:HonroMonsterVisual.kind(u),act2:!!(u.honroAct2&&globalThis.HonroAct2Art)};});}''')
    check('Every default editor catalog entry uses improved art',all(r['actor'] or r['party'] or r['monster'] or r['act2'] for r in catalog),catalog)
    friendly=game.evaluate(r'''()=>{const a=HonroApp,e=a.engine,V=HonroActorVisual,M=HonroMonsterVisual,scene=Object.create(HonroScene.prototype);scene.time=0;const cv=document.createElement('canvas');cv.width=cv.height=500;const c=cv.getContext('2d'),rows=[];for(const id of Object.keys(M.assets))for(const team of ['ally','npc']){const u=HonroUnits.create(HonroUnits.record(id,'friendly-'+id,250,420,team),e.b,a.profile,a.stage);u.h=140;u.facing=1;c.clearRect(0,0,500,500);scene.unitBody(c,u);const actual=cv.toDataURL();c.clearRect(0,0,500,500);c.save();c.translate(u.x,u.y);c.scale(u.h/M.assets[id].baseHeight,u.h/M.assets[id].baseHeight);M.draw(c,id,{time:0,pixels:140,state:M.state(u)});c.restore();rows.push({id,team,kind:V.monsterKind(u),human:V.kind(u),same:cv.toDataURL()===actual});}return rows;}''')
    check('All 17 species retain their improved shape with allied/neutral team overrides',len(friendly)==34 and all(r['kind']==r['id'] and r['human'] is None and r['same'] for r in friendly),friendly)
    enthralled=game.evaluate(r'''()=>{const a=HonroApp,e=a.engine,M=HonroMonsterVisual,scene=Object.create(HonroScene.prototype);scene.time=0;const cv=document.createElement('canvas');cv.width=cv.height=500;const c=cv.getContext('2d'),rows=[];for(const id of Object.keys(M.assets).filter(id=>M.assets[id].budget==='act3-authored')){const u=HonroUnits.create(HonroUnits.record(id,'enthralled-'+id,250,420),e.b,a.profile,a.stage);Object.assign(u,{h:140,facing:1,side:0,enthrall:2});c.clearRect(0,0,500,500);scene.unitBody(c,u);const actual=cv.toDataURL();c.clearRect(0,0,500,500);c.save();c.translate(u.x,u.y);c.scale(u.h/M.assets[id].baseHeight,u.h/M.assets[id].baseHeight);M.draw(c,id,{time:0,pixels:140,state:M.state(u)});c.restore();rows.push({id,kind:M.kind(u),same:cv.toDataURL()===actual});}return rows;}''')
    check('All six enthralled fiends retain their Korean species geometry',len(enthralled)==6 and all(r['kind']==r['id'] and r['same'] for r in enthralled),enthralled)
    game.evaluate('rows=>globalThis.fixtures=rows',actor_fixtures);arena=game.evaluate(ARENA)
    game.evaluate('p=>HonroApp.launchMap(p,p.activeStageId,{story:false})',arena);result=game.evaluate(RUNTIME)
    check('Game routes all 23 designs without writing gameplay state',result['hash']==METRICS['sourceSha256'] and result['pure'] and not result['error'] and all(a=='art-'+(b or '') for a,b in result['kinds']),result['kinds']);png('game-sprites',result['image']);game.screenshot(path=str(OUT/'game.png'))
    # Actual summon creation and attack turn, not hand-written animation flags.
    summons=game.evaluate(r'''()=>{const e=HonroApp.engine,b=e.b,V=HonroActorVisual,owner=e.unit('owner'),foe=e.unit('foe');b.units=[owner,foe];owner.hp=owner.maxHp;foe.hp=foe.maxHp=999999;foe.x=800;const rows=[];for(const kind of ['stalker','lantern','charger','warden','host']){b.units=[owner,foe];b.projectiles=[];b.phase='aim';b.active=owner.id;b.side=0;owner.dead=foe.dead=false;owner.x=500;owner.y=800;const u=e.spawnSummon(owner,kind,600,800),count=e.runSummonTurn();let attack;for(let i=0;i<400&&!attack;i++){e.stepSummonTurn(.016);if(b.summonTurn?.stage==='wait')attack=V.state(u,e);}e.hurt(u,(u.shield||0)*2+20,foe.id);rows.push({kind,route:V.kind(u),count,attack:attack?.attack,hit:V.state(u,e).hit,h:u.h,r:u.r});}return rows;}''')
    check('All five real summons drive attack and damage poses',all(r['count']==1 and r['route']=='summon_'+r['kind'] and 0<=r.get('attack',-1)<=1 and r['hit']==0 for r in summons),summons)
    game.evaluate('p=>HonroApp.launchMap(p,p.activeStageId,{story:false})',arena)
    allies=game.evaluate(r'''()=>{const e=HonroApp.engine,b=e.b,V=HonroActorVisual,rows=[],units=[...b.units];for(const role of ['guard','scout','archer','healer','ritualist','porter']){const u=units.find(u=>u.id==='art-ally_'+role),owner=e.unit('owner'),foe=e.unit('foe');b.units=[owner,u,foe];owner.hp=owner.maxHp*.4;owner.dead=false;u.dead=false;u.honroAlly=true;u.x=600;owner.x=640;foe.x=690;foe.hp=foe.maxHp=999999;foe.dead=false;b.projectiles=[];b.phase='ally';b.active=u.id;b.side=0;b.honroState??={};b.honroState.allyQueue={ids:[u.id],index:0,returnActive:owner.id,phase:'act',elapsed:0,started:false};e.tick(.016);const state=V.state(u,e);rows.push({role,attack:state.attack,phase:b.honroState.allyQueue?.phase});}return rows;}''')
    check('Actual allied turn exposes non-projectile attack poses',all(r.get('attack') is not None for r in allies),allies)
    game.close()
    editor=browser.new_page(viewport={'width':1440,'height':900});listen(editor);editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI');editor.evaluate('p=>HonroWorkshopAPI.importProject(p)',arena)
    saved=editor.evaluate('HonroWorkshopAPI.exportProject()');editor.evaluate('HonroWorkshopAPI.setCamera({x:700,y:600,zoom:1})');editor.wait_for_timeout(150);editor.screenshot(path=str(OUT/'workshop-stage.png'))
    stage=editor.evaluate('()=>{const {scene,engine}=HonroWorkshopAPI.getRuntime();return ('+SPRITES+')(scene,engine);}')
    check('Stage View matches Game vectors pixel for pixel',stage==result['image'])
    editor.click('[data-tab=play]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');play=editor.frames[1];play.evaluate('p=>HonroApp.launchMap(p,p.activeStageId,{story:false})',arena);played=play.evaluate(RUNTIME);editor.screenshot(path=str(OUT/'workshop-playtest.png'))
    check('Playtest uses identical assets and geometry',played['hash']==result['hash'] and played['image']==result['image'] and played['pure'])
    editor.click('#stopPlay');check('Preview preserves authored project',editor.evaluate('HonroWorkshopAPI.exportProject()')==saved);editor.close();browser.close()
check('No browser exceptions',not errors,errors)
(OUT/'browser.json').write_text(json.dumps({'sourceSha256':METRICS['sourceSha256'],'checks':checks,'inventory':inventory,'catalog':catalog,'stress':perf,'errors':errors,'visualApproval':'See VISUAL_REVIEW.md; automated tests do not approve the illustration.'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('ACTOR ART PASS',len(checks))
