/* Current visible actor + displayed marker shot assistance. No local kill roster, spawn schedule, future turn, or saved answer coordinates. Predictions assist current shots; not pixel-only perception. */
onlyFacing=>{
 const e=HonroApp.engine,b=e.b,u=e.active,C=HONRO_CORE,snapshot=JSON.stringify(b);
 const scene=HonroApp.scene,{w,h}=scene.size(),screen=p=>HonroCamera.screen(scene,w,h,p),visible=t=>{const p=screen({x:t.x,y:t.y-t.h/2});return p.x>=20&&p.x<=w-20&&p.y>=80&&p.y<=h-100;};
 const shown=HonroAct23V4.state(b).targets.filter(t=>{const p=screen(t);return p.x>=0&&p.x<=w&&p.y>=60&&p.y<=h-80;});
 const priority=t=>shown.some(m=>m.kind==='enemy'&&(m.unitId===t.id||m.id===t.id))?1:0;
 function touches(s,t,v){return v.hit?.unit===t.id||e.damageDistance(t,v.hit)<Math.max(1,e.effective(s,u).radius)+(e.damageGeometry(t)?0:t.r);}
 function aim(s,t){const right=t.x>=u.x,angles=t.y>u.y+90?[-45,-15,10,30,50,70,85]:[10,25,40,55,70,85];
  for(const q of [...e.shotSeeds(u,s,t),...angles.flatMap(a=>[.2,.4,.6,.8,1].map(power=>({angle:right?a:180-a,power})))]){
   if(onlyFacing&&(q.angle>90?-1:1)!==u.facing||e.manaCost(s,u,q.power)>u.focus||q.angle< -85||q.angle>265)continue;
   const v=C.shotViable(e,u,s,t,q.angle,q.power);if(v.ok&&v.risk<1&&v.enemyDamage>0&&touches(s,t,v)&&[-.12,.12].every(d=>{const w=C.shotViable(e,u,s,t,q.angle+d,q.power);return w.ok&&w.risk<1&&w.enemyDamage>0&&touches(s,t,w);}))return{...q,v};
  }return null;
 }
 let best=null;
 for(const t of b.units.filter(t=>t.side===1&&!t.dead&&t.hp>0&&visible(t)).sort((a,z)=>priority(z)-priority(a)||Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(z.x-u.x,z.y-u.y)).slice(0,6)){
  if(Math.hypot(t.x-u.x,t.y-u.y)>1200)continue;
  for(const [idx,id]of u.loadout.entries()){const s=C.SKILLS[id];if(!s.damage||e.manaCost(s,u,.5)>u.focus||e.cooldownLeft(u,id)>0)continue;const q=aim(s,t);if(q&&(!best||q.v.net>best.net))best={idx,id,target:t.id,angle:q.angle,power:q.power,net:q.v.net};}
  if(best)break;
 }
 if(JSON.stringify(b)!==snapshot)throw Error('Stage21 planner changed live battle');
 return{best};
}
