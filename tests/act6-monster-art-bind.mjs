import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {BOSS58} from '../shared/runtime/stage58-owner.mjs';
import {FRONTS59} from '../shared/runtime/stage59-owner.mjs';
const input=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const v=vm.createContext({HonroScene:class {}});
for(const f of ['shared/assets/actors/actors.runtime.js','shared/runtime/monster-vector.js','shared/runtime/actor-vector.js'])vm.runInContext(input(f),v);
const assets=v.HONRO_ACTORS.assets;
const ids=['boss_daedosa','grot_hanging','grot_hands','grot_door','gate_armor','forepaw','wonhon','wonhon_knotted'];
for(const id of ids){
 const a=assets[id];
 assert(a&&a.budget==='act6-retained-art'&&a.visualRevision==='act6-art-20261126',id);
 assert(a.parts.length>=4,id+' has independent motion groups');
 for(const clip of ['idle','attack','hit']){
  const before=v.HonroActorVisual.pose(a,0,{});
  const time=clip==='idle'?a.clips.idle.duration*.28:0, state=clip==='idle'?{}:{[clip]:.62};
  const after=v.HonroActorVisual.pose(a,time,state);
  assert.notDeepEqual(before,after,id+' '+clip+' moves');
 }
 assert.equal(v.HonroActorVisual.kind({id:'fixture',side:1,honroRigAsset:id}),id);
}
// The exterior spirits move using the engine's grounded walking signal, not
// an actor-controlled time loop or an attack key. Lock the idle and moving sample
// to the same time to distinguish movement from their ambient drifting cloth.
for(const id of ['wonhon','wonhon_knotted']){
 const body={id:'front-fixture',side:1,honroRigAsset:id,moving:.12,airborne:false};
 const a=assets[id],visual=v.HonroActorVisual,time=a.clips.move.duration*.43;
 assert.equal(visual.state(body).move,true);
 assert.notDeepEqual(visual.pose(a,time,visual.state(body)),visual.pose(a,time,visual.state({...body,moving:0})));
 assert.equal(visual.state({...body,airborne:true}).move,false);
 assert.notDeepEqual(visual.pose(a,time,visual.state(body)),visual.pose(a,time,visual.state({...body,anim:.74})));
 assert.notDeepEqual(visual.pose(a,time,visual.state(body)),visual.pose(a,time,visual.state({...body,hurt:.58})));
}
assert.notDeepEqual(assets.wonhon.clips.move,assets.wonhon_knotted.clips.move);
assert.notEqual(assets.wonhon.parts[1].paths[0].d,assets.wonhon_knotted.parts[1].paths[0].d);
const daedosa={id:'boss-example',honroRigAsset:'boss_daedosa'},hung={id:'hang-example',honroRigAsset:'grot_hanging'},paw={id:'paw-example',honroRigAsset:'forepaw'};
const state=v.HonroActorVisual.state;
assert.equal(state(daedosa,{b:{honroDaedosa:{boss:daedosa.id,mark:{kind:'band'}}}}).attack,.28);
assert.equal(state(daedosa,{b:{honroDaedosa:{boss:daedosa.id,mark:{kind:'band',neutralized:true}}}}).attack,undefined);
assert.equal(state({...daedosa,anim:.85},{b:{honroDaedosa:{boss:daedosa.id,mark:{kind:'band'}}}}).attack,(1-.85)/.56);
assert.equal(state({...hung,honroDrop:{x:3}},undefined).attack,.28);
assert.equal(state(paw,{b:{honroState:{localFinaleGiantTelegraph:{id:'giant-forepaw-reach'}}}}).attack,.28);
assert(BOSS58.body.h>BOSS58.bodies.grot_door.h&&BOSS58.bodies.grot_door.h>BOSS58.bodies.grot_hanging.h);
assert(FRONTS59.bodies.forepaw.h>FRONTS59.bodies.warden.h&&FRONTS59.bodies.warden.h>FRONTS59.bodies.shade.h);
assert.equal(FRONTS59.totalCap,14);
console.log('PASS eight authored rigs, differentiable animation and native boss/add telegraphs');
