import vm from 'node:vm';import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';
// Narrow event-adapter contract: real event source, no Engine/Canvas; not gameplay evidence.
const P={launch(){},quietReady:()=>true},g={HonroAct4TerrainPreview:P,HONRO_CORE:{},HonroScene:function(){},document:{addEventListener(){}},HONRO_APP_READY:{then(){}},performance};g.globalThis=g;for(const k of ['landmark','render','background'])g.HonroScene.prototype[k]=()=>{};
vm.runInNewContext(await readFile('shared/runtime/act4-events.js','utf8'),g);
for(const cfg of [undefined,{deckY:3900,boardX1:6285,boardX2:6685}]){
 const y=cfg?.deckY??1860,units=[0,1,2,3].map(i=>({id:'p'+i,side:0,x:6320+i*90,y,hp:100,acted:false})),b={honroCustom:true,honroAct4Preview:31,honroAct4Design:{boarding:cfg},units,projectiles:[],phase:'aim',side:0,honroAct4PreviewState:{boat:{phase:'docked'}}},e={b,active:units[0],grounded:u=>!u.airborne},app={engine:e};
 assert(P.interact(app,true));assert(!b.honroAct4PreviewState.complete);units[3].y=y-10;assert(!P.interact(app,true));units[3].y=y;units[2].airborne=true;assert(!P.interact(app,true));delete units[2].airborne;units.push({side:1,hp:1});assert(!P.interact(app,true));units.pop();assert(P.interact(app,false));assert(b.honroAct4PreviewState.complete);
}
console.log('PASS legacy and authored deck coordinates; all-party ground contact, quiet combat and explicit interaction remain mandatory (adapter contract only)');
