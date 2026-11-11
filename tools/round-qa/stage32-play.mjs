/** Stage32 fresh-entry round measurement. Production App/Engine/Story/Act4 events
 * with DOM/audio/clock doubles. The Scene is never rendered (native raster memory
 * grows without bound); after combat a camera double follows the active companion; ordinary move, jump,
 * drop, fire, defend and interact calls only. No actor/resource writes.
 * Prepared planned-entry-level profile with earned SP spent; NOT a continuous
 * campaign, a browser run or a human-fun verdict. One fixed policy per run. */
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {runtimeEntries} from '../../shared/build.mjs';
import {createCanvas,Image as NativeImage,Path2D,DOMMatrix} from '@napi-rs/canvas';
import {appHarness,plain} from '../../tests/app-regression-helpers.mjs';
const out=process.argv[2]||'_local/reports/round-qa/stage32',policy=process.env.S32_POLICY||'nearest',difficulty=process.env.S32_DIFFICULTY||'story',build=process.env.S32_BUILD||'spent',through=process.env.S32_THROUGH||'combat';if(!['unspent','balanced','spent'].includes(build))throw Error('build');await mkdir(out,{recursive:true});
process.env.HONRO_ACT4_RELEASE='1';const h=await appHarness({productionStory:true}),g=h.g,C=g.HONRO_CORE;
let now=0;g.performance={now:()=>now};
const nativeCanvas=()=>{const c=createCanvas(1440,900);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});c.checkVisibility=()=>true;c.closest=()=>null;return c;};
class Image extends NativeImage{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
Object.assign(g,{Image,Path2D,DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'round-qa-native-app'}});
const create=g.document.createElement,get=g.document.getElementById;
g.document.createElement=tag=>tag==='canvas'?nativeCanvas():create(tag);g.document.createTextNode=text=>({textContent:text});
g.document.getElementById=id=>{if(id==='battlecanvas'){if(!h.nodes.has(id))h.nodes.set(id,nativeCanvas());return h.nodes.get(id);}return get(id);};
const baseNames=new Set((await runtimeEntries({vector:false,render:false,productionStory:true})).map(v=>v.name));
for(const part of await runtimeEntries({vector:true,render:true,productionStory:true}))if(!baseNames.has(part.name))vm.runInContext(part.code,g);
g.HONRO_APP_READY=Promise.resolve();g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
// Entry: planned entry level for Stage32, every earned point legally spent.
const p=h.profileThrough(31);p.lastStage=32;p.settings.difficulty=difficulty;const training=[],wanted={archer:['A01','A14','A02','A05'],mage:['M01','M06','M02','M03'],knight:['S00','S01','S06','S04'],occultist:['O01','O02','O03','O06']};
for(const cls of p.recruited){const hero=p.heroes[cls];hero.xp=g.HonroProgression.xpAt(g.HonroProgression.plan(32).entryLevel);if(build!=='unspent'){for(let i=0;i<(build==='spent'?18:6);i++)C.investStat(hero,cls);for(const id of wanted[cls])for(let i=0;i<(build==='spent'?5:3);i++)C.train(hero,id);if(build==='spent')while(C.pointsLeft(hero,cls)>0&&C.investStat(hero,cls));}p.loadouts[cls]=wanted[cls].filter(id=>hero.ranks[id]>0);training.push({cls,level:C.levelOf(hero),earned:C.pointsEarned(hero),spent:C.pointsSpent(hero,cls),ranks:plain(hero.ranks),loadout:p.loadouts[cls]});}
const app=h.load(p);g.HonroApp=app;const query=app.root.querySelector.bind(app.root);app.root.querySelector=s=>{const n=query(s);if(n&&!n.getBoundingClientRect)n.getBoundingClientRect=()=>({left:0,top:0,right:0,bottom:0,width:0,height:0});return n;};
for(const name of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-campaign'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);
app.launch(32);app.close();const e=app.engine,b=e.b;if(b.honroStage!==32||b.difficulty!==difficulty)throw Error('launch mismatch');
const P=g.HonroAct4TerrainPreview,alive=u=>u&&!u.dead&&u.hp>0,foes=()=>b.units.filter(u=>u.side===1&&alive(u)),heroes=()=>b.units.filter(u=>u.side===0&&!u.summoned);
let frames=0,renderTick=0,lastRound=0,reason='budget';const rounds=[],shots=[],hurts=[],kills=[],moves=[],enemyActs=[];
const hurt=e.hurt.bind(e);e.hurt=(u,...a)=>{const before=u.hp,was=alive(u),r=hurt(u,...a);if(u.hp<before)hurts.push({round:b.round,target:u.id,side:u.side,owner:a[1],loss:Math.round(before-u.hp)});if(was&&!alive(u)&&u.side===1)kills.push({round:b.round,id:u.id,x:Math.round(u.x),y:Math.round(u.y),by:a[1],left:foes().length});return r;};
const finish=e.finishAction.bind(e);e.finishAction=function(...a){const u=e.active,acted=u?.acted,r=finish(...a);if(u?.side===1&&!acted&&u.acted)enemyActs.push({round:b.round,id:u.id,x:Math.round(u.x),y:Math.round(u.y)});return r;};
function tick(n=1){for(let i=0;i<n;i++){now+=C.STEP*1000;g.HonroStory.tick(app,now);if(!app.dialogue&&!app.modal.classList.contains('open')&&!g.HonroStory.turnPaused(app,now)){e.tick(C.STEP);app.checkMission(e);}P.observe(app,C.STEP);frames++;if(!foes().length){const a=e.active||e.unit('archer');if(a){app.scene.x=a.x;app.scene.y=a.y-200;app.scene.scale=app.scene.scale||.6;}}}}
function move(dir,n=24){for(let i=0;i<n;i++){if(app.canInput())e.move(dir,C.STEP);tick();}}
function plan(u,list){let best=null;for(const target of list){for(const id of u.loadout){const sk=C.SKILLS[id];if(!sk||sk.passive||!e.skillAllowed(sk,u)||e.cooldownLeft(u,id)>0)continue;const aims=[...e.shotSeeds(u,sk,target),...[15,35,55,75].flatMap(angle=>[.35,.65,1].map(power=>({angle:target.x>=u.x?angle:180-angle,power})))];for(const aim of aims){if(e.manaCost(sk,u,aim.power)>u.focus)continue;const hit=e.predict(u,sk,aim.angle,aim.power,undefined,false);if(u.cls!=='knight'&&hit.unit!==target.id&&Math.hypot(hit.x-target.x,hit.y-(target.y-target.h*.5))>240)continue;const safe=C.shotViable(e,u,sk,target,aim.angle,aim.power);if(safe.ok&&safe.risk<.5){const damage=safe.enemyDamage||1,score=damage+(damage>=target.hp?500:0);if(!best||score>best.score)best={id,target:target.id,...aim,score,predicted:Math.round(damage)};break;}}}}return best;}
// The lower lane's east end is a pocket; its way up is the central stair whose
// foot overlaps the lane near x1606-1650. Step onto it with an ordinary jump.
const onLane=u=>e.contactSurface(u.x,u.y-.5,u.y+.5)?.t.id==='approved32-lower-lane';
function leaveLane(u){if(u.x<1642){move(1,u.x<1590?12:2);return;}if(u.x>1660){move(-1,u.x>1710?12:2);return;}e.jump();move(1,24);tick(60);}
const reach=(u,t)=>Math.abs(t.x-u.x)+2.2*Math.abs(t.y-u.y);
// 'nearest' chases the closest foe; 'focus' keeps the whole party on the party-wide weakest reachable foe.
function targets(u){const list=foes();if(policy==='focus'){const lead=heroes().filter(alive).sort((a,z)=>z.x-a.x)[0]||u;return list.sort((a,z)=>(reach(lead,a)+a.hp*.25)-(reach(lead,z)+z.hp*.25));}return list.sort((a,z)=>reach(u,a)-reach(u,z));}
const state=()=>({round:b.round,frames,enemies:foes().map(u=>({id:u.id,x:Math.round(u.x),y:Math.round(u.y),hp:Math.round(u.hp)})),heroes:heroes().map(u=>({id:u.id,x:Math.round(u.x),y:Math.round(u.y),hp:Math.round(u.hp),dead:!!u.dead}))});
let actions=0,stuck=new Map(),postStuck=0,roundStart=0;const saveRounds=(process.env.S32_SAVE_ROUNDS||'').split(',').filter(Boolean).map(Number);
while(frames<400000&&actions<900){
 const q=b.honroAct4PreviewState;if(b.phase==='won'&&q?.complete){reason='won';break;}if(b.phase==='lost'||!heroes().some(alive)){reason='lost';break;}
 if(app.modal.classList.contains('open')){app.close();tick(1);continue;}
 if(app.dialogue||q?.arrivalTour?.active){tick(20);if(app.dialogue)g.HonroStory.next(app);else for(const fn of h.listeners.get('keydown')||[])fn({code:'Escape',repeat:false,preventDefault(){},target:{tagName:'BODY'}});tick(10);continue;}
 if(b.round!==lastRound){lastRound=b.round;const row=state();rounds.push(row);console.log('ROUND',b.round,'foes',row.enemies.length,row.enemies.map(u=>u.id.slice(6)+'@'+u.x+','+u.y+':'+u.hp).join(' '),'|',row.heroes.map(u=>u.id[0]+'@'+u.x+','+u.y+':'+u.hp).join(' '));if(saveRounds.includes(b.round)){app.export();await writeFile(out+'/round-'+b.round+'-profile.json',JSON.stringify(await h.exported()));}roundStart=frames;if(b.round>45){reason='round-limit';break;}}
 if(frames-roundStart>45000){reason='round-stall';const u=e.active;console.log('STALL',JSON.stringify({round:b.round,active:u?.id,x:u?.x,y:u?.y,grounded:u&&e.grounded(u),air:u?.airborne,moveLeft:u?.moveLeft,surf:u&&e.contactSurface(u.x,u.y-.5,u.y+.5)?.t.id,phase:b.phase,side:b.side,can:app.canInput(),foes:foes().map(f=>[f.id,Math.round(f.x),Math.round(f.y)])}));break;}
 if(!app.canInput()){tick(30);continue;}
 const list=foes();
 if(!list.length){
  if(through==='combat'){reason='combat-clear';app.export();await writeFile(out+'/combat-clear-profile.json',JSON.stringify(await h.exported()));break;}
  if(process.env.S32_DEBUG&&frames%600<40)console.log('POST',b.round,frames,Math.round(process.memoryUsage().rss/1048576)+'MB',JSON.stringify({safe:!!q.safeSeven,travel:!!q.shelterTravel,phase:b.phase,active:b.active,h:heroes().map(u=>[u.id[0],Math.round(u.x),Math.round(u.moveLeft)])}));
  if(P.interact(app)){tick(20);continue;}
  const done=!!q.safeSeven,exitX=b.honroAct4Design?.exit?.x??3234,npc=e.unit('a4-shelter-speaker'),left=done?heroes().find(u=>alive(u)&&u.x<=exitX-290):e.unit('archer');
  if(!left){tick(30);continue;}if(b.active!==left.id)app.selectHero(left.id);const u=e.active;if(!u||u.id!==left.id){app.defend();actions++;tick(30);continue;}
  if(!done&&Math.abs(u.x-npc.x)<300){tick(60);continue;}
  if(u.moveLeft<60){app.defend();actions++;tick(30);continue;}
  const goal=done?exitX-200:npc.x-200,prior=u.x;if(onLane(u)&&goal>1700){leaveLane(u);continue;}move(u.x<goal?1:-1,18);if(Math.abs(u.x-prior)<2&&e.grounded(u)){postStuck++;if(process.env.S32_DEBUG&&postStuck<4)console.log('STUCK',JSON.stringify({x:u.x,y:u.y,vy:u.vy,air:u.airborne,grounded:e.grounded(u),surf:e.contactSurface(u.x,u.y-.5,u.y+.5)?.t.id,can:app.canInput(),phase:b.phase,side:b.side,acted:u.acted,moveLeft:u.moveLeft,drop:u.platformDrop,fixed:u.fixed,bound:u.bound,dialogue:!!app.dialogue,paused:g.HonroStory.turnPaused(app,now)}));if(postStuck>60){reason='post-combat-stuck';break;}e.jump();move(u.x<goal?1:-1,30);}else postStuck=0;continue;
 }
 const u=e.active;if(!u||u.side!==0){tick(30);continue;}
 const order=targets(u),target=order[0];
 if(!e.grounded(u)){move(target.x>=u.x?1:-1,20);continue;}
 const shot=plan(u,order.slice(0,3));
 if(shot){const t=e.unit(shot.target),hp=t.hp,from={x:Math.round(u.x),y:Math.round(u.y)},fired=e.fire(shot.id,shot.angle,shot.power);if(fired){actions++;tick(45);for(let i=0;i<400&&!app.canInput()&&b.side===0&&(b.projectiles?.length||b.phase==='flight'||b.phase==='review');i++)tick(5);shots.push({round:b.round,actor:u.id,skill:shot.id,target:shot.target,from,dist:Math.round(Math.hypot(t.x-from.x,t.y-from.y)),dy:Math.round(t.y-from.y),predicted:shot.predicted,dealt:Math.round(hp-t.hp)});continue;}}
 if(u.moveLeft<100){app.defend();actions++;moves.push({round:b.round,actor:u.id,op:'defend-no-shot',x:Math.round(u.x),y:Math.round(u.y),target:target.id});tick(30);continue;}
 const dir=target.x>=u.x?1:-1,prior={x:u.x,y:u.y};
 if(onLane(u)&&(target.y<u.y-90&&target.x>1500||target.x>1880)){leaveLane(u);moves.push({round:b.round,actor:u.id,op:'lane-stair'});continue;}
 if(target.y-u.y>150&&Math.abs(target.x-u.x)<650&&u.x>890&&e.canDrop()){app.drop();tick(40);moves.push({round:b.round,actor:u.id,op:'drop'});continue;}
 if(u.y-target.y>60&&Math.abs(target.x-u.x)<260&&e.jump()){move(dir,28);moves.push({round:b.round,actor:u.id,op:'jump-up'});continue;}
 move(dir,28);const key=u.id+':'+b.round,n=(stuck.get(key)||0)+(Math.hypot(u.x-prior.x,u.y-prior.y)<3?1:0);stuck.set(key,n);
 if(Math.hypot(u.x-prior.x,u.y-prior.y)<3&&e.grounded(u)){if(n>3||!e.jump()){app.defend();actions++;moves.push({round:b.round,actor:u.id,op:'defend-stuck',x:Math.round(u.x),y:Math.round(u.y),target:target.id});tick(30);}else move(dir,28);}
}
const q=b.honroAct4PreviewState,lastKill=kills.at(-1),byTarget={};for(const s of shots){const r=byTarget[s.target]??={shots:0,hits:0,dealt:0};r.shots++;if(s.dealt>0)r.hits++;r.dealt+=s.dealt;}
const result={stage:32,policy,difficulty,build,through,reason,endRound:b.round,combatEndRound:lastKill?.round??null,lastKill,frames,actions,shots:shots.length,hits:shots.filter(s=>s.dealt>0).length,defendNoShot:moves.filter(m=>m.op==='defend-no-shot').length,defendStuck:moves.filter(m=>m.op==='defend-stuck').length,heroDamage:hurts.filter(x=>x.side===0).reduce((n,x)=>n+x.loss,0),heroesAlive:heroes().filter(alive).length,safeSeven:!!q?.safeSeven,complete:!!q?.complete,training,kills,byTarget,enemyActsByGroup:enemyActs.reduce((o,a)=>{const k=a.id.slice(0,7);o[k]=(o[k]||0)+1;return o;},{}),scope:'Prepared planned-entry-level profile, production App/Engine with DOM/clock doubles; not browser or human play.'};
await writeFile(out+'/result.json',JSON.stringify(result,null,1));await writeFile(out+'/trace.json',JSON.stringify({rounds,shots,hurts,kills,moves,enemyActs}));console.log('RESULT',JSON.stringify({...result,training:undefined,kills:undefined}));
