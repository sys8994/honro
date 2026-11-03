/** Synthetic close approach, production enemy action. Not campaign success. */
import assert from 'node:assert/strict';
import {createFinale} from './bootstrap.mjs';
const {C,g,b}=await createFinale(),results=[];
for(const [id,x]of [['final40-dock-left-1',1380],['final40-dock-left-2',1110]]){
 const z=JSON.parse(JSON.stringify(b));z.units=z.units.filter(v=>v.side!==0||v.id==='knight');const u=z.units.find(v=>v.id===id),hero=z.units.find(v=>v.id==='knight');const e=new C.Engine(z,()=>{},true),floor=e.contactSurface(x,2600,2900);Object.assign(hero,{x,y:floor.y,vx:0,vy:0,jumping:false,airborne:false});assert(g.HonroTerrain.separated(z,hero,x,hero.y,12),'declared hero pose overlaps');
 Object.assign(z,{active:id,side:1,phase:'enemy',queue:[id],turnAge:0});Object.assign(u,{awake:true,acted:false,moveLeft:u.maxMove});const before={x:u.x,y:u.y,hp:hero.hp,shot:z.shot};e.enemyAction();let frames=0;for(;frames<2400&&!u.acted&&z.shot===before.shot;frames++)e.tick(C.STEP);
 assert(u.acted||z.shot>before.shot,'enemy cannot complete meaningful native action');assert(u.x>=140&&u.x<=2240&&u.hp>0,'unsafe rear retreat');results.push({id,before,after:{x:u.x,y:u.y,hp:hero.hp,shot:z.shot,acted:u.acted,phase:z.phase},frames,loadout:u.loadout});
}
console.log(JSON.stringify({scope:'Synthetic approach, unchanged production AI/action; not encounter outcome',results},null,2));
