import {assets,giant} from './normal-giant-forepaw.mjs';
const key='terrain-following-forepaw-01';
const terminal=b=>['won','lost','transition'].includes(b.phase);
const finite=Number.isFinite;
const noDebug=s=>!s.editorView&&!s.viewOptions?.debugTerrainOutline;
export function attachStage59Forepaw({G,app,e,scene,owner,owns}={}){
 const b=e?.b,C=G?.HONRO_CORE;
 const valid=()=>owns?.()&&app.engine===e&&app.scene===scene&&app.stageId===59&&e.b===b&&b?.honroStage===59&&b.honroAuthoredId==='stage-59'&&
 b.honroCanonical===true&&b.honroCustom===false&&b.mode==='campaign'&&b.honroMapOrigin==='campaign';
 if(!valid()||!owner?.inspect||!G?.HonroVectorParts?.create||!C?.topAt)return null;
 const native=scene.objectDamage, renderer=G.HonroVectorParts.create(assets);
 const stats={warning:0,release:0,clears:0,last:null};let seen=null, release=null, disposed=false;
 function verify(q){
  const t=b.terrain.find(g=>g.id==='finale-cutout-near-body');
  const strip=q?.strip, path=strip?.footprint;
  if(q?.kind!=='real local sweep strip'||q.id!==key||q.status!=='armed'||!t||t.broken||
   strip.owner!=='qa-immediate-bridge-threat'||strip.radius!==13||!Array.isArray(path)||path.length!==22)return null;
  if(!path.every((p,i)=>p.x===3295-i*12&&p.support===t.id&&finite(p.ground)&&finite(p.y)&&Math.abs(p.ground-p.y-22)<1e-6&&Math.abs(C.topAt(t,p.x)-p.ground)<1e-5))return null;
  return path;
 }
 function read(){
  if(disposed||!valid()||terminal(b)||!noDebug(scene)){seen=null;release=null;stats.last=null;return null;}
  const now=scene.time;
  if(!finite(now)){seen=null;release=null;return null;}
  const active=b.honroState?.localFinaleGiantTelegraph;
  if(active){
   if(seen?.source!==active){const path=verify(active);seen=path?{source:active,path,round:b.round}:null;release=null;}
   return seen?{path:seen.path,type:'warning',progress:0}:null;
  }
  if(seen){
   const observed=owner.inspect();
   if(observed?.warning?.status==='resolved'&&Number.isInteger(observed?.clash?.round)&&
    observed.clash.round>=seen.round&&observed.clash.round<=b.round&&b.round-observed.clash.round<=1&&
    observed.warning.turn===seen.source.turn&&JSON.stringify(observed.warning.strip)===JSON.stringify(seen.source.strip)){
    release={path:seen.path,time:now};
   }else{release=null;stats.clears++;}
   seen=null;
  }
  if(release&&(now<release.time||now-release.time>.42)){release=null;stats.clears++;}
  return release?{path:release.path,type:'release',progress:(now-release.time)/.42}:null;
 }
 function wrap(ctx,b0,...args){
  const out=native?.call(this,ctx,b0,...args);
  if(this!==scene||b0!==b||scene.battle!==b)return out;
  const cue=read();if(!cue){stats.last=null;return out;}
  const {path,type,progress}=cue, armed=type==='warning',z=Math.max(.05,scene.scale),raw=G.HonroVisualStyle?.raw?.(ctx)??ctx;
  const p=armed?0:progress, n=(path.length-1)*p,i=Math.min(path.length-2,Math.floor(n)),f=n-i;
  const x=path[i].x+(path[i+1].x-path[i].x)*f,y=path[i].y+(path[i+1].y-path[i].y)*f;
  const faint=armed?.84:.95*(1-p);
  raw.save();try{
   // Precise path is ground-relative, not the oversized apparition. Players are rendered later.
   raw.globalAlpha*=armed?.36:.49*(1-p);
   raw.lineCap='round';raw.lineJoin='round';raw.strokeStyle='#bf824b';raw.lineWidth=26;
   raw.beginPath();for(let j=0;j<path.length;j++)raw[j?'lineTo':'moveTo'](path[j].x,path[j].y);raw.stroke();
   raw.globalAlpha=Math.min(1,faint);raw.strokeStyle=armed?'#ddaf78':'#f1cdaa';raw.lineWidth=Math.max(2,2.25/z);
   raw.stroke();
   // The exact existing right-facing arm is reflected so the claw follows 3295→3043.
   raw.translate(x+104,y-(armed?39:4));raw.scale(-.87,.87);
   raw.globalAlpha=armed?.87:.91*(1-p);
   renderer.draw(raw,giant.id,{time:scene.time,state:{attack:armed?.36:.64+Math.min(.24,p*.24)},pixels:giant.baseHeight*z*.87,mode:'paint'});
  }finally{raw.restore();}
  stats[type]++;stats.last={phase:type,anchor:[x,y],range:[path[0].x,path.at(-1).x],owner:'finale-cutout-near-body',sizePx:giant.baseHeight*z*.87};
  return out;
 }
 scene.objectDamage=wrap;
 return Object.freeze({read:()=>({...stats}),detach(){
  disposed=true;seen=null;release=null;
  if(scene.objectDamage!==wrap)return false;
  if(native===undefined)delete scene.objectDamage;else scene.objectDamage=native;
  return true;
 }});
}
