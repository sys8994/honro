import {assets as humanAndSeal} from './human-and-seal.mjs';
import {assets as ledger} from './ledger.mjs';
const art={...humanAndSeal,...ledger};
const authored=Object.freeze([
 ['a6-c08-boss','a6-daedosa-human-study',1,146,35,1350,4480],
 ['a6-c08-expansion-node','a6-expansion-seal-study',1,110,48,260,4896],
 ['a6-c08-unsettled-ledger','a6-unsettled-ledger',2,105,21,1200,5144],
 ['a6-c08-margin-echo','a6-margin-echo',2,105,21,850,5708]
]);
const closed=b=>['won','lost','transition'].includes(b.phase);
const stage58=b=>b?.honroAuthoredId==='stage-58'&&b.honroStage===58&&b.stageId===58&&
 b.honroCanonical===true&&b.honroCustom===false&&(b.mode==='campaign'&&b.honroMapOrigin==='campaign'||b.mode==='act6-isolated'&&b.honroMapOrigin==='act6-qa');
export function createStage58Visual({vectorParts,authorize}={}){
 if(!vectorParts?.create||typeof authorize!=='function')throw TypeError('Stage58 visual owner must be App-scoped');
 const states=new WeakMap(), renderer=vectorParts.create(art);
 function attach({scene,engine,permit,roles,battle=engine?.b}={}){
  if(!stage58(battle)||engine?.b!==battle||typeof scene?.unitBody!=='function'||typeof scene.unit!=='function'||typeof scene.render!=='function'||states.has(scene)||
    !authorize({scene,engine,battle,permit})||!Array.isArray(roles)||roles.length!==authored.length)return false;
  const specs=new Map();
  for(const [i,[id,rig,side,h,r,maxHp,x]] of authored.entries()){
   const u=roles[i];
   if(!art[rig]||u?.id!==id||u.side!==side||u.h!==h||u.r!==r||u.maxHp!==maxHp||u.x!==x)return false;
   specs.set(u,{id,rig,side,h,r,maxHp,x});
  }
  const stock=scene.unitBody, stockUnit=scene.unit, stockRender=scene.render;
  let activePaint=false,fieldDrawn=false;
  function paint(ctx,u,...args){
   const f=battle.honroState?.flags,s=specs.get(u), side=s?.side;
   const ap=side===1?battle.units:side===2?battle.honroConvoyActors:undefined;
   if(this!==scene||scene.battle!==battle||engine.b!==battle||!stage58(battle)||
     !authorize({scene,engine,battle,permit})||!f?.localBossManifested||!s||
     u.id!==s.id||u.side!==side||u.h!==s.h||u.r!==s.r||u.x!==s.x||u.maxHp!==s.maxHp||u.dead||
     !Number.isFinite(u.hp)||u.hp<=0||u.hp>u.maxHp||!ap?.includes(u)||
     (side===2&&(!u.honroVisualOnly||u.honroRigAsset!==s.rig)))return stock.call(this,ctx,u,...args);
   // Death is never covered up: the native corpse/removal path remains stock.
   // HP, name, target affordance, shadow and independent aiming remain on Scene.unit.
   const scale=u.h/art[s.rig].baseHeight,facing=u.facing===-1?-1:1;
   const warning=!closed(battle)&&battle.honroMarkers?.some(m=>m.id==='local-08-expansion-line-show');
   const state=side===1&&engine.active===u&&battle.projectiles.some(p=>p.owner===u.id)?{attack:.55}:
     warning&&(u.id==='a6-c08-boss'||side===2)?{attack:.34}:u.moving?{move:Math.max(0,Math.min(1,u.moving))}:{};
   ctx.save();
   try{
    ctx.translate(u.x,u.y);ctx.scale(scale*facing,scale);
    return renderer.draw(ctx,s.rig,{time:this.time??0,state,pixels:u.h*this.scale,mode:'paint'});
   }finally{ctx.restore();}
  }
  function paintUnit(ctx,u,...args){
   // The legacy narrative art hook draws convoy members only with revision 1.
   // Stage58 may not enable that historical hook. Draw just the exact owner
   // convoy bodies once per native paint, in its existing world transform.
   if(activePaint&&!fieldDrawn&&this===scene&&scene.battle===battle&&u.side===0&&battle.units.includes(u)){
    fieldDrawn=true;
    if(battle.honroNarrativeRevision!==1&&battle.honroState?.flags?.localBossManifested&&!closed(battle)){
     for(const role of roles.slice(2))if(battle.honroConvoyActors?.includes(role))paint.call(this,ctx,role);
    }
   }
   return stockUnit.call(this,ctx,u,...args);
  }
  function frame(e,...args){
   activePaint=this===scene&&e===engine&&e.b===battle&&authorize({scene,engine,battle,permit});fieldDrawn=false;
   try{return stockRender.call(this,e,...args);}finally{activePaint=false;}
  }
  scene.unitBody=paint;scene.unit=paintUnit;scene.render=frame;
  states.set(scene,{stock,stockUnit,stockRender,paint,paintUnit,frame});
  return true;
 }
 function detach(scene){
  const state=states.get(scene);if(!state)return false;
  if(scene.unitBody!==state.paint||scene.unit!==state.paintUnit||scene.render!==state.frame)return false; // a later owner may wrap it; unwind in reverse order
  scene.unitBody=state.stock;scene.unit=state.stockUnit;scene.render=state.stockRender;states.delete(scene);return true;
 }
 return Object.freeze({attach,detach});
}
