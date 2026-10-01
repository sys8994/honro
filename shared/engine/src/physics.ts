import type {Vec,Skill,ForceField} from './types';
import {G,clamp} from './math';

/** World units: position in game units, time in seconds, linear drag in s^-1. */
export interface PhysicsRegion {id:string;x:number;y:number;w:number;h:number;gravity?:Vec;gravityScale?:number;dragScale?:number;flow?:Vec;}
export interface PhysicsPatch {gravity?:Vec;dragScale?:number;flow?:Vec;regions?:PhysicsRegion[];}
export interface PhysicsCue {id:string;round?:number;event?:string;patch:PhysicsPatch;}
export interface PhysicsEnvironment {gravity:Vec;dragScale:number;flow:Vec;regions:PhysicsRegion[];timeline:PhysicsCue[];applied:string[];revision:number;}
export const DEFAULT_PHYSICS={gravity:{x:0,y:G},dragScale:1,flow:{x:0,y:0}};
export function makePhysics(p?:PhysicsPatch & {timeline?:PhysicsCue[]}):PhysicsEnvironment {
 return {gravity:{...(p?.gravity??DEFAULT_PHYSICS.gravity)},dragScale:p?.dragScale??1,flow:{...(p?.flow??DEFAULT_PHYSICS.flow)},regions:JSON.parse(JSON.stringify(p?.regions??[])),timeline:JSON.parse(JSON.stringify(p?.timeline??[])),applied:[],revision:0};
}
/** Explicit spatial composition: a zone may override g or scale it; drag scales multiply. */
export function environmentAt(env:PhysicsEnvironment,x:number,y:number){
 let gravity={...env.gravity},dragScale=env.dragScale,flow={...env.flow};
 for(const r of env.regions){if(x<r.x||x>r.x+r.w||y<r.y||y>r.y+r.h)continue;if(r.gravity)gravity={...r.gravity};if(r.gravityScale!==undefined){gravity.x*=r.gravityScale;gravity.y*=r.gravityScale;}if(r.dragScale!==undefined)dragScale*=r.dragScale;if(r.flow){flow.x+=r.flow.x;flow.y+=r.flow.y;}}
 return {gravity,dragScale:clamp(dragScale,0,10),flow};
}
export function changePhysics(env:PhysicsEnvironment,patch:PhysicsPatch){
 if(patch.gravity)env.gravity={...patch.gravity};if(patch.dragScale!==undefined)env.dragScale=patch.dragScale;if(patch.flow)env.flow={...patch.flow};if(patch.regions)env.regions=JSON.parse(JSON.stringify(patch.regions));env.revision++;
}
export function duePhysics(env:PhysicsEnvironment,round:number,event?:string){return env.timeline.filter(c=>!env.applied.includes(c.id)&&(event?c.event===event:c.event===undefined&&c.round!==undefined&&c.round<=round));}
/** Exact velocity/position integration for constant force + linear drag during one substep. */
export function advanceLinear(x:number,y:number,vx:number,vy:number,ax:number,ay:number,drag:number,dt:number){
 const k=Math.max(0,drag);if(k<1e-7)return{x:x+vx*dt+ax*dt*dt*.5,y:y+vy*dt+ay*dt*dt*.5,vx:vx+ax*dt,vy:vy+ay*dt};
 const dec=Math.exp(-k*dt),u=-Math.expm1(-k*dt)/k,v=(dt-u)/k;
 return{x:x+vx*u+ax*v,y:y+vy*u+ay*v,vx:vx*dec+ax*u,vy:vy*dec+ay*u};
}
export function dragFor(skill:Skill,mode=skill.mode){
 if(mode==='meteor')return .025;
 if(['stormBolt','arcBolt','nightBolt','summonBolt'].includes(mode))return .008;
 if(mode==='iceShard')return .13;
 if(mode==='spiritRain')return .008;
 if(skill.drag!==undefined)return skill.drag;
 if(skill.cls==='occultist')return ['spiritBolt','phaseWraith','reverseGhost','spiritLance','wraithReturn','nightParade'].includes(mode)?.003:.075;
 if(skill.cls==='archer')return mode==='windArrow'?.018:.034;
 if(skill.cls==='knight')return ['crescent','twinCrescent'].includes(mode)?.045:.055;
 if(['emberOrb','frostOrb','stormOrb'].includes(mode))return .15;
 return mode==='cluster'?.12:.085;
}
export function reinforceFields(fields:ForceField[]){for(const f of fields){if(f.kind==='storm')continue;f.radius*=1.35;f.strength*=1.7;}}
/** Normal impulse per unit mass. Small steps/normal jumps sit below these thresholds. */
export function collisionDamage(maxHp:number,normalSpeed:number,kind:'fall'|'wall'){
 if(kind==='fall')return 0; // Landings use measured drop height in Engine.integrateBody.
 return Math.round(maxHp*Math.min(.30,Math.max(0,normalSpeed-340)*.00030));
}
// Keep physical height aligned with HonroEnvironment.WORLD_UNITS_PER_METER.
export const FALL_UNITS_PER_METER=60;
export function fallDamage(maxHp:number,dropUnits:number){return Math.round(maxHp*clamp((dropUnits/FALL_UNITS_PER_METER-10)/90,0,1));}
const num=(x:unknown)=>typeof x==='number'&&Number.isFinite(x);
const vector=(v:any)=>v&&num(v.x)&&num(v.y)&&Math.abs(v.x)<=5000&&Math.abs(v.y)<=5000;
export function validPhysicsPatch(p:any):boolean{
 if(!p||typeof p!=='object'||Array.isArray(p))return false;
 if(p.gravity!==undefined&&!vector(p.gravity)||p.flow!==undefined&&!vector(p.flow)||p.dragScale!==undefined&&(!num(p.dragScale)||p.dragScale<0||p.dragScale>10))return false;
 if(p.regions!==undefined&&(!Array.isArray(p.regions)||p.regions.length>32||p.regions.some((r:any)=>!r||typeof r.id!=='string'||r.id.length>100||!['x','y','w','h'].every(k=>num(r[k]))||r.w<=0||r.h<=0||r.w>30000||r.h>30000||r.gravity!==undefined&&!vector(r.gravity)||r.flow!==undefined&&!vector(r.flow)||r.gravityScale!==undefined&&(!num(r.gravityScale)||Math.abs(r.gravityScale)>10)||r.dragScale!==undefined&&(!num(r.dragScale)||r.dragScale<0||r.dragScale>10))))return false;
 return true;
}
export function validPhysics(p:any):boolean{
 return validPhysicsPatch(p)&&vector(p.gravity)&&vector(p.flow)&&num(p.dragScale)&&Array.isArray(p.regions)&&Array.isArray(p.timeline)&&p.timeline.length<=64&&p.timeline.every((c:any)=>c&&typeof c.id==='string'&&c.id.length<=100&&(Number.isInteger(c.round)&&c.round>=1||typeof c.event==='string'&&c.event.length<=100)&&validPhysicsPatch(c.patch))&&new Set(p.timeline.map((c:any)=>c.id)).size===p.timeline.length&&Array.isArray(p.applied)&&p.applied.length<=64&&p.applied.every((id:any)=>typeof id==='string'&&p.timeline.some((c:any)=>c.id===id))&&Number.isInteger(p.revision)&&p.revision>=0;
}
