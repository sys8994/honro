"""Production monster vectors: geometry, shared rendering, state isolation and art evidence.

Pixel and structural checks cannot approve illustration quality. Review the generated atlas too.
"""
import base64
import hashlib
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT=ROOT/'_local/reports/monster-forge';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
BASELINE=json.loads((ROOT/'tests/fixtures/monster-baseline.json').read_text(encoding='utf-8'))
IDS=list(BASELINE['assets'])
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)
def listen(page):page.on('pageerror',lambda e:errors.append(str(e)))

CONTRACT=r'''()=>{
 const V=HonroMonsterVisual,scene=Object.create(HonroScene.prototype);scene.time=0;scene.scale=1;scene.walkTime=0;
 const cv=document.createElement('canvas');cv.width=640;cv.height=640;const c=cv.getContext('2d'),rows=[];
 for(const [id,a] of Object.entries(V.assets)){
  const d=HonroWorld.archetypes[id],u={id:'qa-'+id,x:320,y:540,h:256,r:d.r,honroType:d.look,honroVariant:d.variant,cls:d.cls,side:1,facing:1,hp:100,maxHp:100,angle:0},before=JSON.stringify(u);
  let anchors=0,curves=0;const proxy=new Proxy(c,{get(target,key){const v=target[key];if(typeof v!=='function')return v;return(...args)=>{if(['moveTo','lineTo','quadraticCurveTo','bezierCurveTo'].includes(key))anchors++;if(['arc','ellipse','rect'].includes(key))curves++;return v.apply(target,args);};},set(target,k,v){target[k]=v;return true;}});
  V.legacyBody.call(scene,proxy,u);const legacy={anchors,curvedPrimitives:curves};
  const snapshots=[];let bounded=true,visible=true;
  for(const facing of [-1,1])for(const motion of ['idle','move','attack','hit'])for(const t of [0,.2,.45,.8]){
   c.clearRect(0,0,640,640);c.save();c.translate(320,530);c.scale(2*facing,2);V.draw(c,id,{time:t,state:motion==='idle'?{}:motion==='move'?{move:true}:{[motion]:t},pixels:256});c.restore();
   const data=c.getImageData(0,0,640,640).data;let count=0,minX=640,maxX=0,minY=640,maxY=0;for(let y=0;y<640;y++)for(let x=0;x<640;x++)if(data[(y*640+x)*4+3]>32){count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
   bounded&&=minX>0&&minY>0&&maxX<639&&maxY<639;visible&&=count>400;snapshots.push({motion,t,facing,image:cv.toDataURL()});
  }
  // Idle feet remain fixed in bind-space; body breathing may not lift supporting parts.
  const feet=['hound','boar','stag'].includes(id)?['hind-near','fore-near','hind-far','fore-far']:id==='warden'?['roots']:['human','mourner'].includes(id)?['left-leg','right-leg']:[];
  const planted=[0,.3,1,2].every(t=>feet.every(p=>{const v=V.pose(a,t,{})[p];return v.x===0&&v.y===0&&v.rotate===0;}));
  const attack=snapshots.filter(r=>r.motion==='attack'&&r.facing===1),hit=snapshots.filter(r=>r.motion==='hit'&&r.facing===1);
  const animated=['idle','move','attack','hit'].every(m=>new Set(snapshots.filter(r=>r.motion===m&&r.facing===1).map(r=>r.image)).size>1);
  c.clearRect(0,0,640,640);scene.unitBody(c,u);const first=cv.toDataURL();c.clearRect(0,0,640,640);scene.unitBody(c,u);
  rows.push({id,legacy,planted,bounded,visible,animated,deterministic:first===cv.toDataURL(),pure:before===JSON.stringify(u),attackFrames:new Set(attack.map(r=>r.image)).size,hitFrames:new Set(hit.map(r=>r.image)).size});
 }
 // The monster layer delegates specials, summons and allies to the outer actor/party adapters.
 const fallback=[{side:1,honroType:'human',honroFinalBoss:true},{side:1,honroType:'human',id:'boss'},{side:1,honroType:'human',boss:2},{side:1,honroType:'ghost',summoned:true},{side:0,honroType:'lantern',summoned:true},{side:2,honroType:'warden'},{side:1,honroType:'unknown'}].every(u=>V.kind(u)===null);
 const coverage=Object.entries(HonroWorld.archetypes).filter(([,d])=>!d.act2).map(([id,d])=>({id,kind:V.kind({side:1,honroType:d.look,honroVariant:d.variant}),midboss:V.kind({side:1,honroType:d.look,honroVariant:d.variant,honroMidboss:true})}));
 const aim=[30,60,150].map(angle=>V.pose(V.assets.human,0,V.state({angle}))['front-arm'].rotate);
 return{rows,fallback,coverage,aim,defaultBeast:V.kind({side:1,honroType:'beast'}),cache:V.cacheSize()};
}'''

ARENA=r'''()=>{const p=HonroMaps.normalize(HONRO_PROJECT),s=HonroMaps.emptyStage('monster-review','Monster art review',3600,1050);
 s.terrains=[{id:'floor',type:'solid',points:[{x:0,y:800},{x:3600,y:800},{x:3600,y:1050},{x:0,y:1050}],baseMaterial:'rock',breakable:false}];
 s.units=[HonroUnits.record('archer','p-archer',220,800),...Object.keys(HonroMonsterVisual.assets).map((id,i)=>HonroUnits.record(id,'art-'+id,500+i*280,800))];
 s.events=[];p.stages=[s];p.activeStageId=s.id;return p;}'''

SPRITES=r'''(scene,e)=>{const cv=document.createElement('canvas');cv.width=1400;cv.height=900;const c=cv.getContext('2d');scene.time=0;scene.walkTime=0;scene.scale=.85;Object.keys(HonroMonsterVisual.assets).forEach((id,i)=>scene.unitBody(c,{...e.unit('art-'+id),x:175+i%4*350,y:278+Math.floor(i/4)*300,h:160,angle:0}));return cv.toDataURL();}'''
RUNTIME=r'''()=>{const a=HonroApp;a.frame=()=>{};a.dialogue=null;a.turnNotice=null;a.done=false;const banner=document.getElementById('turn-banner');if(banner)banner.hidden=true;
 const e=a.engine,b=e.b,V=HonroMonsterVisual;Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,scale:.85,x:850,y:580,time:0});
 const before=JSON.stringify(b),image=(SPRITES)(a.scene,e),signatures=Object.keys(V.assets).map(id=>{const u=e.unit('art-'+id);return[id,V.kind(u),u.h,u.r];});
 const pure=before===JSON.stringify(b);a.scene.render(e,0,'',0,false,0);a.updateHUD(true);
 return{source:HONRO_MONSTERS.sourceSha256,signatures,pure,image,error:a.lastError||null};}'''.replace('SPRITES',SPRITES)

with sync_playwright() as p:
    browser=launch(p)
    lab=browser.new_page(viewport={'width':1480,'height':1100});listen(lab);lab.goto((OUT/'index.html').as_uri());lab.wait_for_function('window.MonsterLab')
    result=lab.evaluate(CONTRACT)
    metrics=json.loads((OUT/'metrics.json').read_text(encoding='utf-8'))
    for row in result['rows']:
        meta=next(m for m in metrics['assets'] if m['id']==row['id']);row['newAnchors']=meta['anchors'];row['anchorRatio']=round(meta['anchors']/row['legacy']['anchors'],2)
        check(row['id']+': within 2.85-3.15x the original contour anchors',2.85<=meta['anchors']/row['legacy']['anchors']<=3.15 and row['legacy']['anchors']==BASELINE['assets'][row['id']]['anchors'],row)
        check(row['id']+': deterministic, visible, bounded and animated without state writes',all(row[k] for k in ['planted','bounded','visible','animated','deterministic','pure']),row)
    check('All 11 species covered; special bosses, allies and summons preserved',result['fallback'] and result['cache']==11 and set(r['id'] for r in result['rows'])==set(IDS) and set(r['id'] for r in result['coverage'])==set(IDS) and all(r['kind']==r['id']==r['midboss'] for r in result['coverage']) and result['defaultBeast']=='stag',result['coverage'])
    check('Source modules and baseline match generated metadata',metrics['sourceSha256']==hashlib.sha256('\n'.join(name+'\n'+(ROOT/name).read_text(encoding='utf-8') for name in metrics['sourceFiles']).encode()).hexdigest() and BASELINE['sha256']==hashlib.sha256((ROOT/BASELINE['source']).read_bytes()).hexdigest())
    check('Enemy archer keeps its existing aim response on the hand/bow joint',all(abs(actual-expected)<1e-8 for actual,expected in zip(result['aim'],[-21.6,-43.2,-21.6])),result['aim'])
    # Exact SVG bind-pose and retained Canvas path output must agree, within antialiasing tolerance.
    for id in IDS:
        svg=(ROOT/f'shared/assets/monsters/{id}.svg').read_text(encoding='utf-8')
        diff=lab.evaluate(r'''async([id,svg])=>{const a=HonroMonsterVisual.assets[id],[x,y,w,h]=a.viewBox,make=()=>{const c=document.createElement('canvas');c.width=w*3;c.height=h*3;return c;},left=make(),right=make(),l=left.getContext('2d'),r=right.getContext('2d'),im=new Image();im.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));await im.decode();l.drawImage(im,0,0,w*3,h*3);r.scale(3,3);r.translate(-x,-y);HonroMonsterVisual.draw(r,id,{time:0,pixels:256,detail:2});const aa=l.getImageData(0,0,w*3,h*3).data,bb=r.getImageData(0,0,w*3,h*3).data;let changed=0;for(let i=0;i<aa.length;i+=4)if(Math.max(...[0,1,2,3].map(j=>Math.abs(aa[i+j]-bb[i+j])))>20)changed++;return changed/(w*h*9);}''',[id,svg])
        check(id+': exported SVG matches production bind pose',diff<.015,diff)
    for selector,name in [('#roster','roster'),('#comparison','comparison')]:lab.locator(selector).screenshot(path=str(OUT/(name+'.png')))
    for id in IDS:
        lab.select_option('#species',id);lab.locator('#focus').screenshot(path=str(OUT/(id+'-detail.png')));lab.locator('#sizes').screenshot(path=str(OUT/(id+'-sizes.png')))
    lab.select_option('#mode','silhouette');lab.locator('#roster').screenshot(path=str(OUT/'silhouettes.png'))
    lab.select_option('#mode','wire');lab.locator('#roster').screenshot(path=str(OUT/'wireframes.png'))
    lab.select_option('#mode','paint');lab.select_option('#background','#b7baa6');lab.locator('#roster').screenshot(path=str(OUT/'light-background.png'))
    # 1:1 pixel evidence; render directly at both sizes rather than resizing larger captures.
    for name,mode,bg in [('dark','paint','#182b2c'),('light','paint','#b7baa6'),('silhouette','silhouette','#182b2c')]:
        sheet=lab.evaluate(r'''([mode,bg])=>{const cv=document.createElement('canvas');cv.width=1400;cv.height=720;const c=cv.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,1400,720);Object.keys(HonroMonsterVisual.assets).forEach((id,i)=>{const a=HonroMonsterVisual.assets[id],x=i%4*350,y=Math.floor(i/4)*240;c.fillStyle=bg==='#182b2c'?'#d7dbc7':'#273832';c.font='16px sans-serif';c.fillText(a.name,x+18,y+28);[96,64].forEach((size,j)=>{const xx=x+[105,275][j];c.fillText(size+'px',xx-20,y+230);c.save();c.translate(xx,y+206);c.scale(size/a.baseHeight,size/a.baseHeight);HonroMonsterVisual.draw(c,id,{time:0,pixels:size,mode});c.restore();});});return cv.toDataURL();}''',[mode,bg])
        (OUT/('readability-'+name+'.png')).write_bytes(base64.b64decode(sheet.split(',')[1]))
    # Each species gets a readable, fixed-phase attack sheet from the shipped renderer.
    for id in IDS:
        atlas=lab.evaluate(r'''id=>{const cv=document.createElement('canvas');cv.width=1500;cv.height=300;const c=cv.getContext('2d');c.fillStyle='#182b2c';c.fillRect(0,0,1500,300);const a=HonroMonsterVisual.assets[id];[0,.2,.45,.7,1].forEach((t,j)=>{c.fillStyle='#ccd4ba';c.font='16px sans-serif';c.fillText(`${a.name} / ${Math.round(t*100)}%`,j*300+24,28);c.save();c.translate(j*300+145,278);c.scale(145/a.baseHeight,145/a.baseHeight);HonroMonsterVisual.draw(c,id,{time:0,state:{attack:t},pixels:145});c.restore();});return cv.toDataURL();}''',id)
        (OUT/(id+'-attack.png')).write_bytes(base64.b64decode(atlas.split(',')[1]))
    # The galleries above create hundreds of full-canvas data URLs. Close that
    # page before timing the production renderer so their garbage collection is
    # not charged to an otherwise identical 36-monster combat workload.
    lab.close()
    bench=browser.new_page(viewport={'width':1480,'height':1100});listen(bench)
    bench.goto((OUT/'index.html').as_uri());bench.wait_for_function('window.MonsterLab')
    perf=bench.evaluate(r'''()=>{const cv=document.createElement('canvas');cv.width=1500;cv.height=900;const c=cv.getContext('2d'),times=[],assets=HonroMonsterVisual.assets,ids=Object.keys(assets);for(let k=0;k<80;k++){const start=performance.now();c.clearRect(0,0,1500,900);for(let i=0;i<36;i++){const id=ids[i%ids.length],a=assets[id];c.save();c.translate(100+i%9*165,185+Math.floor(i/9)*220);c.scale(120/a.baseHeight,120/a.baseHeight);HonroMonsterVisual.draw(c,id,{time:k*.02,pixels:120,state:{move:true}});c.restore();}c.getImageData(0,0,1,1);if(k>=10)times.push(performance.now()-start);}times.sort((a,b)=>a-b);return{units:36,samples:times.length,p50:times[35],p95:times[66],max:times.at(-1)};}''')
    print('MONSTER PERF',json.dumps(perf),flush=True)
    check('36 detailed monsters draw within 16.7ms at p95 on this machine',perf['p95']<16.7,perf)
    bench.close()
    game=browser.new_page(viewport={'width':1440,'height':900});listen(game);game.goto((ROOT/'HONRO.html').as_uri());game.wait_for_function('window.HonroApp');arena=game.evaluate(ARENA)
    game.evaluate('p=>{HonroApp.profile.settings.sound=false;HonroApp.launchMap(p,p.activeStageId,{story:false});}',arena)
    game_result=game.evaluate(RUNTIME);check('Game uses pure production vectors',game_result['pure'] and not game_result['error'],game_result['signatures']);game.screenshot(path=str(OUT/'game.png'))
    for i,x in enumerate([1800,2850],2):
        game.evaluate('x=>{HonroApp.scene.x=x;HonroApp.scene.render(HonroApp.engine,0,\'\',0,false,0);}',x);game.screenshot(path=str(OUT/f'game-{i}.png'))
    (OUT/'game-sprites.png').write_bytes(base64.b64decode(game_result['image'].split(',')[1]))
    combat=game.evaluate(r'''()=>{const a=HonroApp,e=a.engine,b=e.b,rows=[];for(const id of Object.keys(HonroMonsterVisual.assets)){b.projectiles=[];b.phase='enemy';b.active='art-'+id;const u=e.active;u.acted=false;u.focus=999;u.cooldowns={};const ok=e.fire(u.loadout[0],150,.45,true),atFire=HonroMonsterVisual.state(u);e.stepUnits(.18);const later=HonroMonsterVisual.state(u);e.hurt(u,5,'p-archer');const hit=HonroMonsterVisual.state(u);rows.push({id,ok,atFire:atFire.attack,later:later.attack,hit:hit.hit,damage:u.hp<u.maxHp});}return rows;}''')
    check('Actual enemy fire and damage drive attack/hit poses',all(r['ok'] and r['atFire']==0 and 0<r['later']<1 and r['hit']==0 and r['damage'] for r in combat),combat)
    game.close()
    editor=browser.new_page(viewport={'width':1440,'height':900});listen(editor);editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI');editor.evaluate('p=>HonroWorkshopAPI.importProject(p)',arena)
    saved=editor.evaluate('HonroWorkshopAPI.exportProject()');editor.evaluate('HonroWorkshopAPI.setCamera({x:850,y:580,zoom:.85})');editor.wait_for_timeout(150);editor.screenshot(path=str(OUT/'workshop-stage.png'))
    stage=editor.evaluate('()=>{const {scene,engine}=HonroWorkshopAPI.getRuntime();return ('+SPRITES+')(scene,engine);}')
    for i,x in enumerate([1800,2850],2):
        editor.evaluate('x=>HonroWorkshopAPI.setCamera({x,y:580,zoom:.85})',x);editor.wait_for_timeout(150);editor.screenshot(path=str(OUT/f'workshop-stage-{i}.png'))
    check('Stage View matches Game vectors pixel for pixel',stage==game_result['image'])
    editor.click('[data-tab=play]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');play=editor.frames[1]
    play.evaluate('p=>HonroApp.launchMap(p,p.activeStageId,{story:false})',arena);play_result=play.evaluate(RUNTIME);editor.screenshot(path=str(OUT/'workshop-playtest.png'))
    check('Playtest matches Game vectors and asset hash',play_result['image']==game_result['image'] and play_result['source']==game_result['source'] and play_result['pure'])
    editor.click('#stopPlay');check('Art preview preserves authored project',editor.evaluate('HonroWorkshopAPI.exportProject()')==saved);editor.close();browser.close()
check('No browser exceptions',not errors,errors)
report={'sourceSha256':metrics['sourceSha256'],'checks':checks,'legacy':result['rows'],'stress':perf,'errors':errors,'visualApproval':'Automated checks do not approve art; see VISUAL_REVIEW.md after inspecting PNGs.'}
(OUT/'browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('MONSTER ART PASS',len(checks))
