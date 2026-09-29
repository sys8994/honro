"""Four companion art: pose geometry, real game events and visual review evidence."""
import base64,hashlib,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/party-forge';OUT.mkdir(parents=True,exist_ok=True)
checks=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,flush=True)
def save_image(name,data): (OUT/(name+'.png')).write_bytes(base64.b64decode(data.split(',')[1]))
def listen(page):page.on('pageerror',lambda e:errors.append(str(e)))

AUDIT=r'''()=>{const R=HonroVectorRig,rows=[];for(const[id,a]of Object.entries(HONRO_PARTY)){let headError=0,reach=0,footDrift=0,jointGap=0,loopError=0;const idle=R.rigMatrices(a,R.sampleAnimation(a,'idle',0,true).poses),by=Object.fromEntries(a.rig.parts.map(p=>[p.id,p]));for(const name of Object.keys(a.animation.animations))for(let i=0;i<=100;i++){const s=R.sampleAnimation(a,name,i/100,true),m=R.rigMatrices(a,s.poses),h=m.head;headError=Math.max(headError,Math.abs(Math.hypot(h[0],h[1])-1),Math.abs(Math.hypot(h[2],h[3])-1),Math.abs(h[0]*h[2]+h[1]*h[3]));reach=Math.max(reach,...Object.values(s.guide.reach));for(const side of ['rear','front']){for(const [upper,lower]of [[side+'_upper_arm',side+'_forearm'],[side+'_forearm',side+'_hand'],[side+'_thigh',side+'_shin'],[side+'_shin',side+'_foot']]){const p=by[lower].pivot,x=R.point(m[upper],p),y=R.point(m[lower],p);jointGap=Math.max(jointGap,Math.hypot(x[0]-y[0],x[1]-y[1]));}if(name==='idle'){const p=by[side+'_foot'].pivot,x=R.point(m[side+'_foot'],p),y=R.point(idle[side+'_foot'],p);footDrift=Math.max(footDrift,Math.hypot(x[0]-y[0],x[1]-y[1]));}}if(Object.values(m).some(v=>v.some(n=>!Number.isFinite(n))))throw Error(id+': nonfinite');}
 for(const name of ['idle','move']){const x=R.rigMatrices(a,R.sampleAnimation(a,name,0,true).poses),y=R.rigMatrices(a,R.sampleAnimation(a,name,1,true).poses);for(const k of Object.keys(x))loopError=Math.max(loopError,...x[k].map((v,i)=>Math.abs(v-y[k][i])));}
 const cv=document.createElement('canvas'),c=cv.getContext('2d'),face=new Path2D(a.paths.find(p=>p.id==='face_plane').d),landmarks=['eye','farEye','nose','mouth'].map(k=>({key:k,inside:c.isPointInPath(face,...a.face.landmarks[k])}));
 rows.push({id,headError,reach,footDrift,jointGap,loopError,landmarks});}return rows;}'''

ARENA=r'''()=>{const p=HonroMaps.normalize(HONRO_PROJECT),s=HonroMaps.emptyStage('party-art','Four companions',1800,1050);s.terrains=[{id:'floor',type:'solid',points:[{x:0,y:800},{x:1800,y:800},{x:1800,y:1050},{x:0,y:1050}],baseMaterial:'rock',breakable:false}];s.units=['archer','mage','knight','occultist'].map((cls,i)=>HonroUnits.record(cls,'art-'+cls,350+i*320,800));s.events=[];p.stages=[s];p.activeStageId=s.id;return p;}'''
SPRITES=r'''(scene,e)=>{const cv=document.createElement('canvas');cv.width=1400;cv.height=400;const c=cv.getContext('2d');scene.time=0;scene.walkTime=0;scene.archerVisual.time=0;scene.partyVisual??=new HonroPartyVisual(HONRO_PARTY,HonroVectorRig,scene.archerVisual);for(const v of Object.values(scene.partyVisual.visuals))v.time=0;['archer','mage','knight','occultist'].forEach((cls,i)=>scene.unitBody(c,{...e.unit('art-'+cls),x:150+i*350,y:380,h:300,portraitOnly:true,facing:1}));return cv.toDataURL();}'''
SETUP=r'''()=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();window.artSetup=(skill)=>{a.trainingClass=HONRO_CORE.SKILLS[skill].cls;a.trainingSkill=skill;a.trainingRanks[skill]=1;a.launch(1,true,skill);a.dialogue=null;a.turnNotice=null;a.charging=false;const e=a.engine,u=e.active;a.selected=skill;Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,scale:2.1,x:u.x+70,y:u.y-80});a.updateHUD(true);a.scene.render(e,.01,a.selected,.6,false,.01);return{a,e,u};};}'''

def live_suite(page,label):
    owner=page if hasattr(page,'mouse') else page.page
    page.evaluate(SETUP)
    for sid,id in [('A01','seol_o'),('M01','damheo'),('S00','hwigyeom'),('O01','sodan')]:
        page.evaluate('sid=>artSetup(sid)',sid)
        # Real fire control and Engine.fire, with a deterministic presentation clock.
        box=page.locator('#fire').bounding_box();owner.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);owner.mouse.down()
        ready=page.evaluate(r'''()=>{const a=HonroApp,e=a.engine,u=e.active;a.power=.7;a.scene.render(e,.4,a.selected,.7,a.charging,.4);a.scene.render(e,.4,a.selected,.7,a.charging,.4);const v=a.scene.partyVisual.visuals[resolveRebuildCharacter(u)],s=v.pose(u,.7);return{charging:a.charging,mode:s.state.mode,head:HonroVectorRig.rigMatrices(v.asset,s.sample.poses).head};}''')
        check(label+' '+id+': charge pose follows the held fire control',ready['charging'] and ready['mode']=='charge',ready)
        owner.screenshot(path=str(OUT/(label+'-'+id+'-charge.png')))
        owner.mouse.up()
        result=page.evaluate(r'''()=>{const a=HonroApp,e=a.engine,u=e.active;a.scene.render(e,.04,a.selected,0,false,.04);const v=a.scene.partyVisual.visuals[resolveRebuildCharacter(u)],release=v.pose(u,0),releaseMode=release.state.mode,before=JSON.stringify(e.b),cv=document.createElement('canvas');cv.width=500;cv.height=500;const c=cv.getContext('2d');a.scene.unitBody(c,{...u,x:200,y:440,h:320});const pure=before===JSON.stringify(e.b);e.hurt(u,5,'qa');a.scene.render(e,.01,a.selected,0,false,.01);const hit=v.pose(u,0);return{phase:e.b.phase,release:releaseMode,arrow:release.sample.controls.arrowOpacity,hit:hit.state.mode,pure,asset:v.asset.asset_id};}''')
        # Snapshot the mode before hit changes the adapter's mutable presentation state.
        check(label+' '+id+': actual fire/hit use the new asset and preserve battle data',result['phase']!='aim' and result['release']=='release' and result['hit']=='hit' and result['pure'] and result['asset']==id+'.v008' and result['arrow']==0,result)
        owner.screenshot(path=str(OUT/(label+'-'+id+'-hit.png')))
        movement=page.evaluate(r'''sid=>{const {a,e,u}=artSetup(sid);const v=a.scene.partyVisual.visuals[resolveRebuildCharacter(u)];u.moving=.2;u.walkPhase=(u.walkPhase||0)+5;a.scene.render(e,.1,sid,0,false,.1);const move=v.pose(u,0).state.mode;const jump=e.jump(u);e.stepUnits(.04);a.scene.render(e,.04,sid,0,false,.04);const s=v.pose(u,0);return{move,jump,mode:s.state.mode,root:s.sample.poses.root.matrix,rootX:s.sample.poses.root.x,rootY:s.sample.poses.root.y};}''',sid)
        check(label+' '+id+': move/jump modes keep physical height in the engine',movement['move']=='move' and movement['jump'] and movement['mode']=='jump' and movement['rootX']==0 and movement['rootY']==0,movement)

with sync_playwright() as p:
    b=launch(p);lab=b.new_page(viewport={'width':1480,'height':1100});listen(lab);lab.goto((OUT/'index.html').as_uri());lab.wait_for_function('window.PartyLab');lab.evaluate('PartyRefsReady')
    metrics=json.loads((OUT/'metrics.json').read_text(encoding='utf-8'));baseline=json.loads((ROOT/'tools/party-forge/references.json').read_text(encoding='utf-8'))
    source='\n'.join(name+'\n'+(ROOT/name).read_text(encoding='utf-8') for name in metrics['sourceFiles'])
    check('Authoring sources match the generated provenance',hashlib.sha256(source.encode()).hexdigest()==metrics['sourceSha256'])
    for ref in baseline['assets'].values():
        data=(ROOT/'tools/party-forge/references'/ref['file']).read_bytes()
        check(ref['file']+': supplied PNG and declared portrait crop preserved',hashlib.sha256(data).hexdigest()==ref['sha256'] and ref['faceCrop'][0]+ref['faceCrop'][2]<=ref['size'][0] and ref['faceCrop'][1]+ref['faceCrop'][3]<=ref['size'][1])
    preserved=lab.evaluate("Object.entries(HONRO_PARTY).every(([id,a])=>['rig','animation','canvas','constraints'].every(k=>JSON.stringify(a[k])===JSON.stringify(PartyBaseline.assets[id][k])))")
    check('Face revision preserves all v007 rig, motion, canvas and weapon constraints',preserved)
    audit=lab.evaluate(AUDIT)
    for row in audit:
        meta=next(x for x in metrics['assets'] if x['id']==row['id'])
        check(row['id']+': within 5% of immutable v007 anchors',.95<=meta['anchors']/baseline['assets'][row['id']]['anchors']<=1.05,{'anchors':meta['anchors'],'previous':meta['previousAnchors']})
        check(row['id']+': rigid head, connected joints, planted idle feet and seamless loops',all(row[k]<1e-6 for k in ['headError','jointGap','footDrift','loopError']) and row['reach']<.1,row)
        check(row['id']+': eyes and mouth sit within the face',all(v['inside'] for v in row['landmarks'] if v['key']!='nose'),row['landmarks'])
        id=row['id'];svg=(ROOT/f'shared/assets/party/{id}.svg').read_text(encoding='utf-8')
        diff=lab.evaluate(r'''async([id,svg])=>{const a=HONRO_PARTY[id],[x,y,w,h]=a.canvas.viewBox,left=document.createElement('canvas'),right=document.createElement('canvas');left.width=right.width=w;left.height=right.height=h;const l=left.getContext('2d'),r=right.getContext('2d'),im=new Image();im.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));await im.decode();l.drawImage(im,0,0,w,h);r.translate(-x,-y);HonroVectorRig.createCanvasRenderer(a).draw(r,{x:a.canvas.anchor[0],y:a.canvas.anchor[1],height:a.canvas.visualHeight,time:0,normalized:true,detail:2});const aa=l.getImageData(0,0,w,h).data,bb=r.getImageData(0,0,w,h).data;let changed=0;for(let i=0;i<aa.length;i+=4)if(Math.max(...[0,1,2,3].map(j=>Math.abs(aa[i+j]-bb[i+j])))>20)changed++;return changed/(w*h);}''',[id,svg])
        check(id+': SVG equals the production idle pose',diff<.002,diff)
    for id in ['comparison','faces','references']:lab.locator('#'+id).screenshot(path=str(OUT/(id+'.png')))
    for id in baseline['assets']:
        lab.select_option('#character',id);lab.locator('#sizes').screenshot(path=str(OUT/(id+'-sizes.png')))
    lab.select_option('#background','#b8baa9');lab.locator('#comparison').screenshot(path=str(OUT/'light-background.png'))
    lab.check('#silhouette');lab.locator('#comparison').screenshot(path=str(OUT/'silhouettes.png'))
    for motion in ['idle','move','attack','jump_fall','hit']:
        sheet=lab.evaluate(r'''motion=>{const cv=document.createElement('canvas');cv.width=1600;cv.height=1160;const c=cv.getContext('2d');c.fillStyle='#1a292b';c.fillRect(0,0,1600,1160);Object.entries(HONRO_PARTY).forEach(([id,a],i)=>{c.fillStyle='#ddd8c8';c.font='16px sans-serif';c.fillText(a.name_ko,20,i*290+25);const r=HonroVectorRig.createCanvasRenderer(a);[0,.2,.4,.6,.8,1].forEach((t,j)=>r.draw(c,{x:115+j*266,y:i*290+278,height:215,animation:motion,time:t,normalized:true}));});return cv.toDataURL();}''',motion)
        save_image(motion,sheet)
    bow=lab.evaluate(r'''()=>{const a=HONRO_PARTY.seol_o,R=HonroVectorRig,v=new HonroArcherVisual(a,R),rows=[];for(const facing of [-1,1])for(const elevation of [-30,0,45,80])for(const charge of [.3,.6,1]){const u={side:0,cls:'archer',facing,angle:facing===1?elevation:180-elevation},s=v.state(u);v.time=1;s.chargeAt=0;const pose=v.pose(u,charge).sample,m=R.rigMatrices(a,pose.poses),q=R.constrainedPaths(a,m,pose.controls);rows.push({facing,elevation,charge,reach:Math.max(...Object.values(pose.guide.reach)),nock:Math.hypot(q.nock[0]-q.hand[0],q.nock[1]-q.hand[1])});}return rows;}''')
    check('Bow aim/charge in both directions keeps reachable arms and hand-string contact',all(r['reach']<.2 and r['nock']<1e-6 for r in bow),bow)
    perf=lab.evaluate(r'''()=>{const cv=document.createElement('canvas');cv.width=1200;cv.height=600;const c=cv.getContext('2d'),ids=Object.keys(HONRO_PARTY),r=Object.fromEntries(ids.map(id=>[id,HonroVectorRig.createCanvasRenderer(HONRO_PARTY[id])])),times=[];for(let k=0;k<60;k++){const t=performance.now();c.clearRect(0,0,1200,600);for(let i=0;i<12;i++)r[ids[i%4]].draw(c,{x:80+i%6*200,y:260+Math.floor(i/6)*300,height:220,animation:'move',time:k/60,normalized:true});c.getImageData(0,0,1,1);if(k>=10)times.push(performance.now()-t);}times.sort((a,b)=>a-b);return{instances:12,p50:times[25],p95:times[47],max:times.at(-1)};}''')
    check('12 detailed companions render within 16.7ms at p95 on this PC',perf['p95']<16.7,perf);lab.close()
    game=b.new_page(viewport={'width':1440,'height':900});listen(game);game.goto((ROOT/'HONRO.html').as_uri());game.wait_for_function('window.HonroApp');arena=game.evaluate(ARENA)
    game.evaluate('p=>{const a=HonroApp;a.frame=()=>{};a.launchMap(p,p.activeStageId,{story:false});a.dialogue=null;a.turnNotice=null;Object.assign(a.scene,{manual:true,scale:1,x:840,y:570});a.scene.render(a.engine,0);}',arena)
    game_sprites=game.evaluate('()=>('+SPRITES+')(HonroApp.scene,HonroApp.engine)');save_image('game-sprites',game_sprites);game.screenshot(path=str(OUT/'game.png'))
    live_suite(game,'Game')
    boss=game.evaluate(r'''()=>{const a=HonroApp;for(let i=1;i<10;i++)a.profile.cleared[i]={visits:1};a.launch(10);a.dialogue=null;a.turnNotice=null;const u=a.engine.b.units.find(u=>u.id==='boss');a.scene.render(a.engine,0);return{version:a.scene.partyVisual.visuals.sodan.asset.version,id:resolveRebuildCharacter(u),name:u.name};}''')
    check('Campaign Sodan boss resolves to the same revised character',boss['id']=='sodan' and boss['version']==8,boss);game.close()
    editor=b.new_page(viewport={'width':1440,'height':900});listen(editor);editor.goto((ROOT/'HONRO_WORKSHOP.html').as_uri());editor.wait_for_function('window.HonroWorkshopAPI');editor.evaluate('p=>HonroWorkshopAPI.importProject(p)',arena);editor.evaluate('HonroWorkshopAPI.setCamera({x:830,y:650,zoom:.65})');editor.wait_for_timeout(100);saved=editor.evaluate('HonroWorkshopAPI.exportProject()');editor.screenshot(path=str(OUT/'workshop-stage.png'))
    stage=editor.evaluate('()=>{const {scene,engine}=HonroWorkshopAPI.getRuntime();return('+SPRITES+')(scene,engine);}')
    check('Stage View and Game draw identical revised characters',stage==game_sprites)
    editor.click('[data-tab=play]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');play=editor.frames[1];play.evaluate('p=>{HonroApp.frame=()=>{};HonroApp.launchMap(p,p.activeStageId,{story:false});}',arena)
    play_sprites=play.evaluate('()=>('+SPRITES+')(HonroApp.scene,HonroApp.engine)');check('Playtest and Game draw identical revised characters',play_sprites==game_sprites)
    live_suite(play,'Playtest');editor.click('#stopPlay');check('Character preview preserves the authored project',editor.evaluate('HonroWorkshopAPI.exportProject()')==saved);editor.close();b.close()
check('No browser exceptions',not errors,errors)
(OUT/'browser.json').write_text(json.dumps({'sourceSha256':metrics['sourceSha256'],'checks':checks,'motionAudit':audit,'stress':perf,'errors':errors},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('PARTY ART PASS',len(checks))
