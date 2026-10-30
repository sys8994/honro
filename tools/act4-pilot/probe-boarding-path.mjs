/** Actual Engine + real boat event adapter. Explicit post-combat dock-fixture setup; not an App clear. */
import vm from 'node:vm';import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {runtime,battlefield} from '../../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const dir=process.argv[2]||'_local/reports/act4-pilot/stage31/skeleton-v4',stage=JSON.parse(await readFile(dir+'/stage.json','utf8')),stageSHA256=createHash('sha256').update(JSON.stringify(stage)).digest('hex');
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,profile=C.defaults();g.HonroEquipment.fresh(profile);profile.recruited=g.HonroStageRules.stageParty(31);for(const cls of profile.recruited)profile.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(31).entryLevel);
const {b,e}=battlefield(g,31,{profile}),heroes=structuredClone(e.heroesAlive()),cfg=stage.design.act4.boarding;
b.terrain=g.HonroMaps.compile(stage,{...g.HONRO_PROJECT,stages:[stage]}).terrain;b.width=stage.width;b.height=stage.height;b.units=heroes;b.projectiles=[];b.phase='aim';b.side=0;b.honroAct4Official=1;b.honroAct4Preview=31;b.honroAct4Design=structuredClone(stage.design.act4);b.honroAct4PreviewState=undefined;e.checkEnd=()=>false;
for(const [i,u]of heroes.entries())Object.assign(u,{x:cfg.deckX-220+i*50,y:cfg.deckY,vx:0,vy:0,jumping:false,airborne:false,acted:false});
// DOM/dialogue rendering deliberately omitted; real event logic gets a fixture app.
g.HonroAct4TerrainPreview={launch(){},quietReady:()=>true};g.HonroScene=function(){};for(const k of ['landmark','render','background'])g.HonroScene.prototype[k]=()=>{};g.document={hidden:false,addEventListener(){},getElementById(){return null;}};g.HONRO_APP_READY={then(){}};g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
vm.runInContext(await readFile('shared/runtime/act4-events.js','utf8'),g);const P=g.HonroAct4TerrainPreview;
const app={engine:e,stage:structuredClone(stage),canSpeak:()=>false,scene:{x:6500,y:3900,scale:.7,canvas:{clientWidth:1280,clientHeight:720}},modal:{classList:{contains:()=>false}}};b.active=heroes[0].id;
const starts=heroes.map(u=>({id:u.id,x:u.x,y:u.y,h:u.h,r:u.r,hp:u.hp,validPose:C.validTerrainContactPose(b.terrain,u)}));if(!starts.every(s=>s.validPose))throw Error('Invalid dock-fixture initial pose; stop before simulation: '+JSON.stringify(starts));let observeFrames=0;
for(;observeFrames<3000&&b.honroAct4PreviewState?.boat?.phase!=='docked';observeFrames++)P.observe(app,C.STEP);
const deck=b.terrain.find(t=>t.id==='a4-boat-deck'),beforeAllBoarded=P.interact(app,true),walks=[];
for(const [i,u]of heroes.entries()){
 b.active=u.id;const target=6320+i*90,trail=[];let frames=0;
 for(;frames<1000;frames++){e.move(Math.sign(target-u.x)*Math.min(1,Math.abs(target-u.x)/(u.walkSpeed*C.STEP)),C.STEP);for(const v of heroes)e.integrateBody(v,C.STEP);if(frames%6===0)trail.push({x:u.x,y:u.y,grounded:e.grounded(u)});if(Math.abs(target-u.x)<2&&e.grounded(u))break;}
 walks.push({id:u.id,cls:u.cls,target,frames,end:{x:u.x,y:u.y,hp:u.hp},grounded:e.grounded(u),supportId:e.contactSurface(u.x,u.y-.2,u.y+.2)?.t?.id,probeEligible:P.interact(app,true),trail});
}
const afterAllBoarded=P.interact(app,true),completedWithoutInteraction=!!b.honroAct4PreviewState.complete,explicitInteraction=P.interact(app,false),complete=!!b.honroAct4PreviewState.complete;
const result={stageSHA256,scope:'Post-combat dock fixture: four production body poses initialized once on the bank, enemies absent, dialogue/DOM receipts omitted. Real event observe creates boat deck; real Engine move/body integration carries each hero aboard; real interact predicate checks completion. Not a normal combat clear or App/render acceptance.',starts,observeFrames,boatDeck:deck,beforeAllBoarded,walks,afterAllBoarded,completedWithoutInteraction,explicitInteraction,complete,passed:starts.every(s=>s.validPose)&&!!deck&&!beforeAllBoarded&&walks.every((w,i)=>w.grounded&&w.supportId==='a4-boat-deck'&&w.end.hp===starts[i].hp)&&walks.slice(0,-1).every(w=>!w.probeEligible)&&afterAllBoarded&&!completedWithoutInteraction&&explicitInteraction&&complete};
await writeFile(dir+'/boarding-path.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,walks:walks.map(({trail,...r})=>r)}));if(!result.passed)process.exitCode=1;
