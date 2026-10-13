import type {Engine} from './engine';
import type {Unit} from './types';
import {clamp,terrainSurfaces,terrainRectIntersects} from './math';
import {controlled} from './contribution';

export function eaterTuning(rank:number){const r=clamp(Math.floor(rank),1,8);return {radius:200+r*15,turns:[2,2,2,3,3,3,4,4][r-1]};}
/** Narrative identity, never elite rank or display name, makes a boss immune. */
export function eaterEligible(u:Unit){const v=u as any;return u.side===1&&!u.dead&&u.hp>0&&!u.summoned&&!u.enthrall&&!u.eaterCapturedBy&&!['ballista','gate','bier','objective','device','support'].includes(u.role)&&!u.boss&&!u.honroMidboss&&u.role!=='boss'&&u.id!=='boss'&&!v.honroFinalBoss&&!v.honroAct2Boss&&!v.honroAct3Boss&&!v.honroStoryBoss&&!v.honroNonlethal&&!v.honroAlly&&!v.honroCivilian&&!v.honroSubdued;}
export function captureEater(e:Engine,u:Unit){
 if(u.eaterRevision===1)return;
 u.eaterRevision=1;u.eaterTransferred=0;u.eaterCaptureCount=0;u.eaterTransferred=0;u.eaterCaptureRadius=eaterTuning(u.summonRank||1).radius;u.existenceDefense={form:1,qi:1,soul:1};u.armor=0;u.shield=0;
 const cx=u.x,cy=u.y-u.h*.5,targets=e.b.units.filter(v=>eaterEligible(v)&&Math.hypot(v.x-cx,v.y-v.h*.5-cy)<=u.eaterCaptureRadius!+v.r);
 for(const v of targets){v.eaterCapturedBy=u.id;v.eaterOrigin={x:v.x,y:v.y};v.vx=v.vy=0;v.airborne=false;v.jumping=false;v.acted=true;delete v.moveTarget;delete v.aiMove;delete v.platformDrop;delete v.shove;delete v.carriedBy;controlled(e.b,v,u.summonOwner||'',`eater:${u.id}`);}
 u.eaterCaptureCount=targets.length;u.summonGrowthHits=Math.min(5,targets.length);const scale=1+.14*u.summonGrowthHits;u.h*=scale;u.r*=scale;u.eaterSwallow=.9;
 e.fx('eaterSwallow',cx,cy,'#aaa79d',u.eaterCaptureRadius,String(targets.length));
}
/** Nearest real, exposed support. No fall damage or wall teleport on release. */
function safeRelease(e:Engine,v:Unit,x:number,y:number){
 let best:{x:number;y:number;d:number}|undefined;
 for(const t of e.b.terrain){if(t.broken||t.w<v.r*2+4||['barrel','device','support'].includes(t.mat))continue;
  const nx=clamp(x,Math.max(v.r+5,t.x+v.r+5),Math.min(e.b.width-v.r-5,t.x+t.w-v.r-5));
  for(const face of terrainSurfaces(t,nx)){if(Math.abs(face.slope)>1.35)continue;const ny=face.y;if(ny<0||ny>e.b.height||e.b.terrain.some(o=>o!==t&&!o.broken&&!o.oneWay&&terrainRectIntersects(o,nx-v.r*.6,ny-v.h+5,v.r*1.2,Math.max(4,v.h-10),.15)))continue;const d=Math.abs(nx-x)+Math.abs(ny-y)*.35;if(!best||d<best.d)best={x:nx,y:ny,d};}
 }
 const origin=v.eaterOrigin||{x:v.spawnX,y:v.spawnY};v.x=best?.x??clamp(origin.x,v.r+5,e.b.width-v.r-5);v.y=best?.y??origin.y;v.vx=v.vy=0;v.airborne=false;v.jumping=false;
}
export function releaseEater(e:Engine,u:Unit){
 const targets=e.b.units.filter(v=>v.eaterCapturedBy===u.id);u.dead=true;u.hp=0;u.vx=u.vy=0;
 for(let i=0;i<targets.length;i++){const v=targets[i];delete v.eaterCapturedBy;if(v.dead){delete v.eaterOrigin;continue;}const a=2*Math.PI*i/Math.max(1,targets.length),dx=Math.cos(a);safeRelease(e,v,u.x+dx*(u.r+v.r+12),u.y);delete v.eaterOrigin;v.eaterReleasedShot=e.b.shot;v.acted=true;v.awake=true;v.aggroUntil=Math.max(v.aggroUntil,e.b.round+1);e.impulse(v,dx*45,-22-Math.abs(Math.sin(a))*25);}
 e.fx('eaterRelease',u.x,u.y-u.h*.5,'#c8c3ae',Math.max(70,u.r*2));
}
/** Old floating eaters migrate inertly; loading never performs a new capture. */
export function migrateEaters(e:Engine){for(const u of e.b.units){if(u.summonKind!=='eater'||u.eaterRevision===1)continue;u.eaterRevision=1;u.side=1;u.fixed=false;u.summonFloating=false;u.armor=0;u.shield=0;u.existenceDefense={form:1,qi:1,soul:1};u.eaterCaptureCount=0;u.eaterTransferred=0;u.eaterCaptureRadius=eaterTuning(u.summonRank||1).radius;u.summonExpires=Math.min(u.summonExpires??e.b.round,e.b.round+eaterTuning(u.summonRank||1).turns-1);u.loadout=[];u.attack=0;u.moveLeft=u.maxMove=u.walkSpeed=0;delete u.summonAbsorbed;u.vx=u.vy=0;}
 for(const v of e.b.units){if(!v.eaterCapturedBy)continue;const u=e.unit(v.eaterCapturedBy);if(!u||u.dead||u.summonKind!=='eater'){delete v.eaterCapturedBy;safeRelease(e,v,v.eaterOrigin?.x??v.spawnX,v.eaterOrigin?.y??v.spawnY);delete v.eaterOrigin;}}
}
