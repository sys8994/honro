
const aliases=Object.freeze({
 'finale-edge-own-r1-knot':{kind:'shade',front:'east-fault',wave:'finale-edge-own-r1'},
 'finale-edge-own-r1-rear':{kind:'warden',front:'east-fault',wave:'finale-edge-own-r1'},
 'finale-edge-own-r2-lower':{kind:'shade',front:'west-return',wave:'finale-edge-own-r2'}
});
const validKits={shade:['HSH01','HSH02'],warden:['HWD01','HWD02']};
const looks={
 // Wet ink-dark mulberry cloth, ash and restrained violet light keep folded fabric legible.
 shade:{
  ink:'#22283a',deep:'#333648',shadow:'#3c475a',bone:'#8a91ac',boneShade:'#505973',
  cloth:'#414b69',clothLight:'#7884a7',clothDark:'#282c44',clothMid:'#546189',clothEdge:'#969abd',
  hair:'#252638',pressure:'#474567',paper:'#9090af',red:'#6a678e',redDark:'#464362',soul:'#969ccc',hot:'#b2b7dc',
  wood:'#53506b',woodLight:'#756c8f',woodDark:'#393749',metal:'#627080'
 },
 // Mortise-like split old timber, warm marks on its darker weight-bearing pieces.
 warden:{
  ink:'#24252b',deep:'#34383e',shadow:'#44454b',bone:'#9a837a',boneShade:'#69564f',
  wood:'#555059',woodLight:'#967676',woodDark:'#313137',paper:'#9c908b',red:'#a56464',redDark:'#633e46',
  soul:'#b78479',hot:'#dba999',metal:'#6b6971',cloth:'#5c5462',clothLight:'#8a7d84',clothDark:'#35323c'
 }
};
const lit={
 shade:{clothEdge:'#b9bfed',clothLight:'#9da6d6',soul:'#c3cff8',pressure:'#69628e',hot:'#dadffc'},
 warden:{woodLight:'#ba8c82',red:'#d18b7a',redDark:'#805057',soul:'#e7a491',hot:'#f6bda1',paper:'#b4a39d'}
};
const clamp=(a,l,h)=>Math.max(l,Math.min(h,a));
const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
function readRoleAppearance({ledger:active,front},u){
 if(!u||u.side!==1||u.dead||u.hp<=0||u.honroVisualOnly||u.honroCivilian||u.summoned||u.enthrall||active?.epoch==null||active.closed||!Array.isArray(active.rounds))return null;
 const role=aliases[u.id];
 const kit=validKits[u.honroType];
 if(!kit||JSON.stringify(u.loadout)!==JSON.stringify(kit))return null;
 if(!role){
  if(u.id==='qa-bell-shade'&&u.honroType==='shade'&&front==='east-fault'&&active.rounds.some(x=>x.action==='spawn'&&x.front==='east-fault'))
   return {kind:'shade',front:'east-fault',phase:'lingering-bell-soul',amount:.23,realSteps:null,round:active.currentRound};
  return null;
 }
 if(role.kind!==u.honroType)return null;
 const wave=active.rounds.find(w=>w.id===role.wave&&w.front===role.front&&w.action==='spawn'&&Number.isInteger(w.round)&&w.round<=active.currentRound);
 const steps=wave?.emergence?.[u.id]?.steps, seat=wave?.squad?.find(a=>a.id===u.id&&a.kind===role.kind);
 if(!seat||JSON.stringify(seat.loadout)!==JSON.stringify(kit)||!Number.isInteger(steps)||steps<=0||!(wave.emergence[u.id].actualMovement>0))return null;
 const fresh=steps<=16&&wave.round===active.currentRound;
 const pressure=clamp((fresh?.94-steps*.026:.28)+(wave.front==='west-return'?.13:0),.18,.99);
 return {kind:role.kind,front:role.front,phase:fresh?'new-fracture-pressure':'settled-formation',amount:pressure,realSteps:steps,round:wave.round};
}
export function toneForAppearance(spec){
 return Object.fromEntries(Object.entries(looks[spec.kind]).map(([k,v])=>[k,lit[spec.kind][k]?mix(v,lit[spec.kind][k],spec.amount):v]));
}
export function paintStockRole(ctx,scene,u,spec,V,{tone=true}={}){
 const id=V.kind(u),asset=V.assets[id];
 if(id!==spec.kind||!asset||asset.budget!=='catalog-redesign')throw Error('exact stock rig required');
 const gain=u.h/asset.baseHeight,paint={tone:tone?toneForAppearance(spec):null};
 const motion=V.state(u);
 ctx.save();try{
  ctx.translate(u.x,u.y);ctx.scale(gain*(u.facing||1),gain);
  const m=ctx.getTransform(),ratio=ctx.canvas.clientWidth?ctx.canvas.width/ctx.canvas.clientWidth:1;
  const pixels=asset.baseHeight*Math.hypot(m.c,m.d)/ratio;
  const status=V.draw(ctx,id,{time:scene.time||0,state:motion,pixels,mode:'paint',actorPaint:paint});
  return {kind:id,motion,pixels,baseHeight:asset.baseHeight,parts:status.parts,lod:status.lod,paletteBindings:Object.keys(paint.tone??{}).length,colliderScale:1};
 }finally{ctx.restore();}
}

export function createStage59RolePaint(V){
 return (ctx,scene,u,context)=>{
  if(context?.stage!==59||!V)return false;
  const appearance=readRoleAppearance(context,u);
  if(!appearance||V.kind(u)!==appearance.kind||V.assets[appearance.kind]?.budget!=='catalog-redesign')return false;
  return paintStockRole(ctx,scene,u,appearance,V);
 };
}
