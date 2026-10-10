/** Declared objective/hero-pose fixtures with every initial enemy retained.
 * Warnings, actual defend inputs, safe event entry, four-slot AI, projectiles
 * and damage are production behavior. No normal arrival or clear is claimed.
 * The paired upper/lower cases diagnose vertical relevance, not route arrival.
 */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {runtimeParts} from '../shared/build.mjs';
import {RAVINE_RESPONSES,RAVINE_ENCOUNTERS} from '../tools/map-forge/stage11-ravine-encounters.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,A=g.HonroAct2,D=g.HonroEncounterDensity;
const plain=x=>JSON.parse(JSON.stringify(x)),hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const out=process.env.HONRO_STAGE11_PRESSURE_OUT||'_local/reports/encounter-density/stage11-response-pressure';
await mkdir(out,{recursive:true});
const provenance={sourceHash:hash(g.HONRO_PROJECT),runtimeSha256:hash((await runtimeParts({vector:false,render:false})).join('\n')),controllerSha256:hash(await readFile(new URL(import.meta.url),'utf8')),observedAt:new Date().toISOString()};
const scenes=[
 {id:'west-return-approach',source:'ravine-response-west-return',support:'rv-west-shoulder',xs:[3060,3145,4100,4190]},
 {id:'saddle-upper-bough',source:'ravine-response-saddle-wings',support:'rv-saddle-swept-bough',xs:[6260,6340,6420,6500]},
 {id:'saddle-diagonal-trunk',source:'ravine-response-saddle-wings',support:'rv-saddle-fallen-trunk',xs:[7250,7340,7430,7520]},
 {id:'saddle-lower-court',source:'ravine-response-saddle-wings',support:'rv-ritual-buttress',xs:[6040,6150,6260,6370]},
 {id:'crosswind-lower-root',source:'ravine-response-ravine-crosswind',support:'rv-root-arch',xs:[8080,8160,8240,8320]},
 {id:'crosswind-upper-court',source:'ravine-response-ravine-crosswind',support:'rv-ritual-buttress',xs:[7470,7570,7660,7950]},
 {id:'ritual-west-front',source:'ravine-response-ritual-west-pursuit',support:'rv-ritual-buttress',xs:[5570,5650,5730,5810]},
 {id:'ritual-east-court',source:'ravine-response-ritual-east-turn',support:'rv-ritual-buttress',xs:[7470,7570,7660,7950]},
 {id:'ritual-echo-flank-guard',source:'hold-knots',support:'rv-ritual-buttress',xs:[6590,6710,7480,8460],expectedBirths:{'hold-knots-0':0,'hold-knots-3':0},intent:'These legal old support positions occupy the new west mouth; no wave may overlap them.'},
 {id:'ritual-two-echo-waves',source:'hold-knots',support:'rv-ritual-buttress',xs:[7470,7570,7660,7950],expectedBirths:{'hold-knots-0':3,'hold-knots-3':0},intent:'The east defender deliberately holds the new east mouth. West may enter; east must wait.'}
];
const selectedScenes=scenes.filter(s=>!process.argv[2]||s.id===process.argv[2]);
assert(selectedScenes.length,'Unknown response-pressure scene: '+process.argv[2]);
const rows=[],failures=[];
for(const scene of selectedScenes){
 const profile=C.defaults();profile.recruited=g.HonroStageRules.stageParty(11);for(const cls of profile.recruited)profile.heroes[cls].xp=g.HonroProgression.legacyCampaignAnchor(10);
 const {b,e,app}=battlefield(g,11,{profile});g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);A.attach(app,e);
 assert.equal(e.alive(1).length,53);assert.equal(b.enemyLimit,4);assert(e.heroesAlive().every(u=>u.level===10));
 for(const[i,u]of e.heroesAlive().entries()){u.x=scene.xs[i];u.y=C.topAt(b.terrain.find(t=>t.id===scene.support),u.x);assert(C.validTerrainContactPose(b.terrain,u),scene.id+' supported hero '+u.id);assert(!b.units.some(v=>v!==u&&Math.abs(v.x-u.x)<v.r+u.r+12&&u.y>v.y-v.h-12&&u.y-u.h<v.y+12),scene.id+' unoccupied hero '+u.id);}
 const a=A.memory(b),expected=scene.source==='hold-knots'?['hold-knots-0','hold-knots-3']:[scene.source];
 for(const ev of b.honroEvents)if(ev.id!==scene.source)b.honroState.flags['event:'+ev.id]=true;
 a.done['knot-west']=true;if(!scene.source.endsWith('west-return'))a.done['clear-west']=true;
 if(scene.source.includes('ritual-')||scene.source.includes('crosswind')||scene.source==='hold-knots')a.done['knot-east']=true;
 if(scene.source!=='hold-knots')a.done['hold-knots']=true;
 const snapshot=()=>b.units.map(u=>({id:u.id,side:u.side,kind:u.honroVariant||u.cls,role:u.honroEncounterRole,place:u.honroRavinePlace,cell:u.honroRavineCell,x:u.x,y:u.y,hp:u.hp,shield:u.shield,awake:u.awake,support:e.contactSurface(u.x,u.y-8,u.y+10)?.t.id,source:u.honroSpawnSource}));
 const initial=snapshot(),notices=[],responses=[],actions=[],shots=[],damage=[],queues=[],births=[],known=new Set(b.units.map(u=>u.id));let frames=0;
 const event=app.event.bind(app);app.event=t=>{notices.push({round:b.round,serial:b.honroState.actorTurnSerial||0,frame:frames,text:t});event(t);};
 const finish=e.finishAction.bind(e);e.finishAction=(...args)=>{const u=e.active,was=u?.acted,before=u&&{x:u.x,y:u.y,round:b.round,intent:u.intent,targetId:u.aiMove?.targetId||u.meleeAction?.targetId||null,preferredTargetId:C.targetFor(e,u)?.id||null};const r=finish(...args);if(u?.side===1&&!was&&u.acted)actions.push({actorId:u.id,source:u.honroSpawnSource||u.honroRavinePlace||'resident-spirit',kind:before.intent||'enemy-action',round:before.round,x:before.x,y:before.y,targetId:before.targetId,preferredTargetId:before.preferredTargetId,role:u.honroEncounterRole});return r;};
 const fire=e.fire.bind(e);e.fire=(skill,angle,power,...args)=>{const u=e.active,pose=u&&{x:u.x,y:u.y,round:b.round},r=fire(skill,angle,power,...args);if(r&&u?.side===1)shots.push({actorId:u.id,source:u.honroSpawnSource||u.honroRavinePlace||'resident-spirit',skill,angle,power,...pose,role:u.honroEncounterRole});return r;};
 const hurt=e.hurt.bind(e);e.hurt=(u,n,owner,...args)=>{const hp=u.hp,shield=u.shield||0,r=hurt(u,n,owner,...args);if(hp>u.hp||shield>(u.shield||0))damage.push({actorId:owner,source:e.unit(owner)?.honroSpawnSource||e.unit(owner)?.honroRavinePlace||null,targetId:u.id,targetSide:u.side,round:b.round,frame:frames,hp:Math.max(0,hp-u.hp),shield:Math.max(0,shield-(u.shield||0)),x:u.x,y:u.y});return r;};
 const switcher=e.switchTeam.bind(e);e.switchTeam=(...args)=>{const from=b.side,r=switcher(...args);if(from===0&&b.side===1){assert(b.queue.length<=4,'Existing four-action cap');queues.push({round:b.round,ids:[...b.queue],members:b.queue.map(id=>{const u=e.unit(id);return {id,source:u.honroSpawnSource||u.honroRavinePlace||'resident-spirit',x:u.x,y:u.y};})});}return r;};
 const tick=()=>{e.tick(C.STEP);g.HonroMission.tick(app,C.STEP);for(const u of b.units)if(!known.has(u.id)){known.add(u.id);births.push({actorId:u.id,source:u.honroSpawnSource,round:b.round,serial:b.honroState.actorTurnSerial||0,frame:frames,x:u.x,y:u.y,hp:u.hp,role:u.honroEncounterRole,warning:plain(D.memory(b).existingWarnings?.[u.honroSpawnSource]||null),entry:plain(b.honroState.ravineComposition?.entries?.[u.honroSpawnSource]||null)});}frames++;};
 g.HonroMission.tick(app,0);assert(notices.length,'Real warning emitted before input');assert.equal(e.alive(1).length,53,'No same-boundary spawn');
 const firstRound=b.round,turns=scene.source==='hold-knots'?10:6;
 // Six enemy turns expose ordinary responses. Echoes get ten because their
 // first turns can precede the native two-round tool possession, followed by
 // another full local queue rotation. First effects retain their actual round;
 // this longer diagnostic window does not certify the four-round hold balance.
 for(;frames<60000&&b.round<firstRound+turns&&!['won','lost'].includes(b.phase);){if(e.canAct()){const u=e.active;responses.push({actorId:u.id,round:b.round,frame:frames,kind:'defend',x:u.x,y:u.y,detail:'Actual defensive input after the warning; the supported initial pose is an explicit fixture.'});e.wait();}tick();}
 const waves=expected.map(source=>{const ids=new Set(births.filter(v=>v.source===source).map(v=>v.actorId)),waveActions=actions.filter(v=>ids.has(v.actorId)),waveShots=shots.filter(v=>ids.has(v.actorId)),effect=damage.filter(v=>ids.has(v.actorId)&&v.targetSide===0);return {source,births:births.filter(v=>v.source===source),actions:waveActions,shots:waveShots,damage:effect,firstAction:waveActions[0]||null,firstFire:waveShots[0]||null,firstEffect:effect[0]||null,hp:effect.reduce((n,v)=>n+v.hp,0),shield:effect.reduce((n,v)=>n+v.shield,0),status:effect.length?'actual-party-pressure':'no-party-pressure-observed'};});
 const row={...scene,method:'Declared completion flags and supported party poses; production warnings/defend/entry/AI with all 53 initial enemies retained',initial,notices,responses,actions,shots,damage,queues,births,waves,turns,frames,round:b.round,phase:b.phase,final:snapshot(),warnings:plain(D.memory(b).existingWarnings||{}),hold:plain(a.holds?.['hold-knots']||null)};rows.push(row);
 await writeFile(out+'/'+scene.id+'.json',JSON.stringify({provenance,row},null,2)+'\n');
 for(const wave of waves){const expectedCount=scene.expectedBirths?.[wave.source]??(wave.source.startsWith('hold-knots-')?3:RAVINE_RESPONSES.find(r=>'ravine-response-'+r.id===wave.source).members.length);try{assert.equal(wave.births.length,expectedCount,'Exact finite wave '+wave.source);assert(wave.births.every(v=>v.warning?.opportunity),'Each actual birth follows recorded real player action');assert.equal(b.round,firstRound+turns,'Actual enemy turn window');}catch(err){failures.push({scene:scene.id,source:wave.source,detail:err.message});}console.log(JSON.stringify({scene:scene.id,source:wave.source,births:wave.births.length,actions:wave.actions.length,shots:wave.shots.length,hp:wave.hp,shield:wave.shield,firstEffect:wave.firstEffect,round:b.round}));}
}
const sources=[...new Set(rows.flatMap(r=>r.waves.map(w=>w.source)))];
// Echo pressure is now replayed from a real unmodified ritual-start save in
// stage11-density-real-save-continuation.mjs; these old poses explicitly test
// occupied entry waiting, not an order to spawn through the companions.
for(const source of sources.filter(s=>!s.startsWith('hold-knots-')))if(!rows.some(r=>r.waves.some(w=>w.source===source&&w.firstEffect)))failures.push({source,detail:'No actual pressure in any tested legal support fixture. Idle actions alone are not accepted as tactical effect.'});
const report={provenance,scope:'Enemy pressure and vertical-line diagnostics with explicit objective/pose setup. Initial 53 retained; four-action cap unchanged; no damage, enemy removal, infinite resources, movement or AI injection. Not normal arrival, route execution, chapter clear, browser or visual approval.',initialInventory:[...RAVINE_ENCOUNTERS.map(q=>({id:q.id,purpose:q.purpose,memberIds:q.members.map((_,i)=>`rv11-${q.id}-${i}`),roles:q.members.map(m=>m.role)})),{id:'resident-spirit',memberIds:['resident-spirit-4'],purpose:'Existing attached-spirit rescue gate'}],rows,failures};
await writeFile(out+'/summary.json',JSON.stringify(report,null,2)+'\n');
if(failures.length){console.error('BLOCKED',JSON.stringify(failures));process.exitCode=1;}else console.log('PASS five generic response groups have actual pressure; occupied exact echo mouths correctly wait. Echo gameplay uses the independent normal ritual-prefix trace; the actual-save replay covers Continue. No normal-clear claim');
