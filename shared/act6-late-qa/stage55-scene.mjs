import {emptyBell,assets} from './empty-bell.mjs';
const SLOT='draft-pressure-0', CAST='HLN01';
const owners=new WeakMap();
const poseFor=(b,u,visual)=> {
 if(visual.dampened)return {attack:.92};
 const p=b.projectiles?.find(v=>v.owner===u.id&&v.skill===CAST);
 if(p)return {attack:Number.isFinite(p.age)?Math.min(.92,.12+p.age*.72):.25};
 if(b.cast?.owner===u.id&&b.cast.skill===CAST&&b.phase==='flight')return {attack:.72};
 return u.moving>.035?{move:true}:{};
};
function thread(ctx,u,a){
 const nx=u.x,ny=u.y-u.h*.48,{x,y}=a;
 ctx.save();ctx.strokeStyle='#c88c65d9';ctx.lineWidth=1.75;ctx.setLineDash([6,17]);
 try{
  ctx.beginPath();ctx.moveTo(nx,ny);ctx.bezierCurveTo(nx*.74+x*.26,Math.min(ny,y)-36,nx*.24+x*.76,y-65,x,y-13);ctx.stroke();
  ctx.setLineDash([]);ctx.beginPath();ctx.ellipse(x,y-8,24,6,.04,0,Math.PI*2);ctx.stroke();
 }finally{ctx.restore();}
}
/** Only call after owned mount; no globals, profile data, or source tokens from disk. */
export function attachStage55Visual({G,app,scene,engine,owner,onDraw=()=>{}}={}){
 if(app?.scene!==scene||app?.engine!==engine||app?.stageId!==55||!scene||typeof scene.unitBody!=='function'||!G?.HonroVectorParts||owners.has(scene)||typeof owner?.visual!=='function')return null;
 const b=engine?.b, initial=owner.visual(app,engine),u=engine?.unit(SLOT);
 if(!initial||initial.gateId!==SLOT||initial.asset!==emptyBell.id||u?.honroRigAsset!==emptyBell.id||u.h!==92||u.r!==25)return null;
 const rig=G.HonroVectorParts.create(assets), old=scene.unitBody;
 const wrap=function(ctx,a,...args){
  const get=()=>old.call(this,ctx,a,...args);
  if(this!==scene||app.scene!==scene||app.engine!==engine||engine.b!==b||a!==u||a!==engine.unit(SLOT)||a.dead||a.hp<=0||a.honroRigAsset!==emptyBell.id)return get();
  const v=owner.visual(app,engine);if(!v?.ringIsLive||v.gateId!==SLOT||v.asset!==emptyBell.id)return get();
  const h=a.h,r=a.r, facing=(a.face??a.facing??1)<0?-1:1, p=poseFor(b,a,v), c=ctx;
  if(v.thread&&Number.isFinite(v.anchor?.x)&&Number.isFinite(v.anchor?.y))thread(c,a,v.anchor);
  c.save();let receipt;try{
   c.translate(a.x,a.y);
   // Editorially fit the existing silhouette into the exact stock hit body.
   // Idle/attack outer fragments cannot promise a hit beyond that rectangle.
   c.beginPath();c.rect(-r,-h,r*2,h);c.clip();
   c.scale(facing*(2*r/(emptyBell.viewBox[2]+5)),h/(emptyBell.baseHeight+3));
   receipt=rig.draw(c,emptyBell.id,{time:scene.time??0,state:p,pixels:h*scene.scale,mode:'paint'});
  }finally{c.restore();}
  onDraw({id:a.id,thread:!!v.thread,dampened:!!v.dampened,pose:p,parts:receipt?.parts,body:[h,r],isOverlayNotForecast:true});
 };
 scene.unitBody=wrap;
 const token=Object.freeze({detach(){if(owners.get(scene)!==token)return;if(scene.unitBody===wrap)scene.unitBody=old;owners.delete(scene);}});
 owners.set(scene,token);return token;
}
