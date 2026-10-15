import type {Engine} from './engine';
import type {Unit,Projectile} from './types';
import {clamp,terrainSurfaces,terrainRectIntersects} from './math';
import {controlled} from './contribution';

export function eaterTuning(rank:number){const r=clamp(Math.floor(rank),1,8);return {radius:200+r*15,turns:[2,2,2,3,3,3,4,4][r-1]};}
/** Narrative identity, never elite rank or display name, makes a boss immune. */
export function eaterEligible(u:Unit){const v=u as any;return !u.honroObjectiveTarget&&u.side===1&&!u.dead&&u.hp>0&&!u.summoned&&!u.enthrall&&!u.eaterCapturedBy&&!['ballista','gate','bier','objective','device','support'].includes(u.role)&&!u.boss&&!u.honroMidboss&&u.role!=='boss'&&u.id!=='boss'&&!v.honroFinalBoss&&!v.honroAct2Boss&&!v.honroAct3Boss&&!v.honroStoryBoss&&!v.honroNonlethal&&!v.honroAlly&&!v.honroCivilian&&!v.honroProtected&&!v.honroSubdued;}
export function captureEater(e:Engine,u:Unit){
 if(u.eaterRevision===1)return;
 u.eaterRevision=1;u.eaterTransferred=0;u.eaterCaptureCount=0;u.eaterCaptureRadius=eaterTuning(u.summonRank||1).radius;u.existenceDefense={form:1,qi:1,soul:1};u.armor=0;u.shield=0;
 const cx=u.x,cy=u.y-u.h*.5,targets=e.b.units.filter(v=>eaterEligible(v)&&Math.hypot(v.x-cx,v.y-v.h*.5-cy)<=u.eaterCaptureRadius!+v.r);
 for(const v of targets){v.eaterCapturedBy=u.id;v.eaterOrigin={x:v.x,y:v.y};v.vx=v.vy=0;v.airborne=false;v.jumping=false;v.acted=true;delete v.moveTarget;delete v.aiMove;delete v.platformDrop;delete v.shove;delete v.carriedBy;controlled(e.b,v,u.summonOwner||'',`eater:${u.id}`);}
 u.eaterCaptureCount=targets.length;u.summonGrowthHits=Math.min(5,targets.length);const scale=1+.14*u.summonGrowthHits;u.h*=scale;u.r*=scale;u.eaterSwallow=.9;
 e.fx('eaterSwallow',cx,cy,'#aaa79d',u.eaterCaptureRadius,String(targets.length));
}
/** Local exposed support only. A continuous body sweep prevents wall/ceiling snaps.
 * Without nearby support, release into local clear air and let normal gravity work. */
function safeRelease(e:Engine,v:Unit,x:number,y:number,cx=x,cy=y){
 const clear=(nx:number,ny:number)=>nx>=v.r+5&&nx<=e.b.width-v.r-5&&ny>=v.h&&ny<e.b.height+100&&!e.b.terrain.some(t=>!t.broken&&!t.oneWay&&terrainRectIntersects(t,nx-v.r-1,ny-v.h+3,v.r*2+2,Math.max(4,v.h-6),.15));
 const route=(nx:number,ny:number)=>{const n=Math.max(1,Math.ceil(Math.hypot(nx-cx,ny-cy)/8));for(let i=0;i<=n;i++)if(!clear(cx+(nx-cx)*i/n,cy+(ny-cy)*i/n))return false;return true;};
 let best:{x:number;y:number;d:number}|undefined;
 // Try both the desired radial position and the container's own support before
 // considering nearby edge positions. Never search the far side of the map.
 for(const t of e.b.terrain){if(t.broken||t.w<v.r*2+4||['barrel','device','support'].includes(t.mat))continue;
  for(const preferred of [x,cx,cx-v.r-8,cx+v.r+8]){const nx=clamp(preferred,Math.max(v.r+5,t.x+v.r+5),Math.min(e.b.width-v.r-5,t.x+t.w-v.r-5));if(Math.abs(nx-cx)>240)continue;
   for(const face of terrainSurfaces(t,nx)){const ny=face.y;if(Math.abs(face.slope)>1.35||Math.abs(ny-cy)>160||!clear(nx,ny)||!route(nx,ny))continue;const d=Math.abs(nx-x)+Math.abs(ny-y)*.35;if(!best||d<best.d)best={x:nx,y:ny,d};}
  }
 }
 if(!best)for(const dx of [0,-v.r-8,v.r+8,-2*v.r-16,2*v.r+16]){if(best)break;for(const dy of [0,-20,-v.h*.5]){if(clear(cx+dx,cy+dy)&&route(cx+dx,cy+dy)){best={x:cx+dx,y:cy+dy,d:0};break;}}}
 // A pathological embedded container is resolved locally by the same physics as
 // any knocked-back actor, rather than teleporting its captives to old spawns.
 v.x=best?.x??clamp(cx,v.r+5,e.b.width-v.r-5);v.y=best?.y??cy;v.vx=v.vy=0;v.airborne=false;v.jumping=false;
}
export function releaseEater(e:Engine,u:Unit,p?:Partial<Projectile>,rupture=false){
 if(u.eaterReleased)return;u.eaterReleased=true;
 const targets=e.b.units.filter(v=>v.eaterCapturedBy===u.id);u.dead=true;u.hp=0;u.vx=u.vy=0;
 for(let i=0;i<targets.length;i++){const v=targets[i];delete v.eaterCapturedBy;if(v.dead||v.hp<=0){v.dead=true;delete v.eaterOrigin;continue;}const a=2*Math.PI*i/Math.max(1,targets.length),dx=Math.cos(a);safeRelease(e,v,u.x+dx*(u.r+v.r+12),u.y,u.x,u.y);delete v.eaterOrigin;delete v.eaterReleasedShot;if(p?.id!==undefined)v.eaterReleasedProjectile=p.id;else delete v.eaterReleasedProjectile;v.hurt=0;delete (v as any).honroScenePose;v.acted=true;v.awake=true;v.aggroUntil=Math.max(v.aggroUntil,e.b.round+1);e.impulse(v,dx*45,-22-Math.abs(Math.sin(a))*25);}
 e.fx('eaterRelease',u.x,u.y-u.h*.5,'#c8c3ae',Math.max(70,u.r*2),rupture?'rupture':'expiry');
}
/** Old floating eaters migrate inertly; loading never performs a new capture. */
export function migrateEaters(e:Engine){for(const v of e.b.units)delete v.eaterReleasedShot;for(const u of e.b.units){if(u.summonKind!=='eater'||u.eaterRevision===1)continue;u.eaterRevision=1;u.side=1;u.fixed=false;u.summonFloating=false;u.armor=0;u.shield=0;u.existenceDefense={form:1,qi:1,soul:1};u.eaterCaptureCount=0;u.eaterTransferred=0;u.eaterCaptureRadius=eaterTuning(u.summonRank||1).radius;u.summonExpires=Math.min(u.summonExpires??e.b.round,e.b.round+eaterTuning(u.summonRank||1).turns-1);u.loadout=[];u.attack=0;u.moveLeft=u.maxMove=u.walkSpeed=0;delete u.summonAbsorbed;u.vx=u.vy=0;}
 for(const v of e.b.units){if(!v.eaterCapturedBy)continue;const u=e.unit(v.eaterCapturedBy);if(!u||u.dead||u.summonKind!=='eater'){delete v.eaterCapturedBy;safeRelease(e,v,v.eaterOrigin?.x??v.spawnX,v.eaterOrigin?.y??v.spawnY);delete v.eaterOrigin;}}
}
