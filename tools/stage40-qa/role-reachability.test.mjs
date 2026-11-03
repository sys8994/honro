/** Empty-lane terrain fixtures from an explicitly placed stair-top hero.
 * No natural entry, combat, safe-return or visual acceptance claim. */
import assert from 'node:assert/strict';
import {createFinale} from './bootstrap.mjs';
const {C,b}=await createFinale(),results=[];
for(const [cls,waypoints]of [['knight',[1800,1200]],['occultist',[1800,1500]],['archer',[2120]],['mage',[2370]]]){
 const z=JSON.parse(JSON.stringify(b));z.units=z.units.filter(u=>u.id===cls);const u=z.units[0];Object.assign(u,{x:2660,y:2297.142857,vx:0,vy:0,jumping:false,airborne:false,acted:false,moveLeft:u.maxMove});z.active=u.id;z.side=0;z.phase='aim';const e=new C.Engine(z,()=>{},true),start=u.moveLeft;
 for(const x of waypoints){for(let i=0;i<1200&&Math.abs(u.x-x)>20&&u.moveLeft>0;i++){e.walk(u,Math.sign(x-u.x),C.STEP);e.integrateBody(u,C.STEP);}assert(Math.abs(u.x-x)<=20,cls+' cannot reach '+x+' actual:'+u.x+','+u.y);}
 const support=e.contactSurface(u.x,u.y-8,u.y+10)?.t.id;assert(support,cls+' endpoint unsupported');results.push({cls,x:u.x,y:u.y,support,spent:start-u.moveLeft,budget:u.maxMove});
}
console.log(JSON.stringify({scope:'Empty-lane physical fixture, combat blockers not removed in real runs',results},null,2));
