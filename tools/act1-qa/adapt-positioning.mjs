/** Test-controller repairs only: use actual skills/melee and movement budget.
 * All routes stay existing authored routes. No game data or expected gates change. */
export function adaptPositioning(source,stage,policy){
 const style=policy.split('-')[0];
 if(stage===2)source=source.replace("e.fire('A01',shot.p.angle,shot.p.power)","e.fire(shot.id,shot.p.angle,shot.p.power)");
 let aim=`function aim(arg){const u=arg||e.active;let best=null;const targets=e.alive(1).filter(t=>Math.hypot(t.x-u.x,t.y-u.y)<2100).sort((v,w)=>Math.hypot(v.x-u.x,v.y-u.y)-Math.hypot(w.x-u.x,w.y-u.y)).slice(0,4);for(const id of u.loadout){const skill=C.SKILLS[id];if(!skill||skill.passive||e.cooldownLeft(u,id)>0||!e.canAfford(skill,u,1))continue;for(const v of targets){if(skill.martial&&skill.branch==='sword'){let angle=Math.atan2(u.y-u.h*.58-(v.y-v.h*.5),v.x-u.x)*180/Math.PI;if(angle< -90)angle+=360;for(const power of [1,.7])if(C.meleeContains(e,u,v,C.meleeRange(u,skill,power),-angle*Math.PI/180,C.meleeSpan(u,skill,power))&&(!best||skill.damage>best.net))best={id,p:{angle,power},v,net:skill.damage};continue;}for(const p of e.shotSeeds(u,skill,v)){const z=C.shotViable(e,u,skill,v,p.angle,p.power);if(z.ok&&z.risk<.5&&z.enemyDamage>0&&(!best||z.net>best.net))best={id,p,v,net:z.net};}}}return best;}`;
 if(stage===6&&policy.includes('escort')){
  aim=aim.replace('let best=null;',"let best=null;const priority=v=>v.id==='midboss-stage6'?500:0;").replace('Math.hypot(v.x-u.x,v.y-u.y)-Math.hypot(w.x-u.x,w.y-u.y)',"Math.hypot(v.x-u.x,v.y-u.y)-priority(v)*4-Math.hypot(w.x-u.x,w.y-u.y)+priority(w)*4").replaceAll('skill.damage>best.net','skill.damage+priority(v)>best.net').replaceAll('net:skill.damage','net:skill.damage+priority(v)').replaceAll('z.net>best.net','z.net+priority(v)>best.net').replaceAll('net:z.net','net:z.net+priority(v)');
  source=source.replace('if(st.jumping){',"const boss=e.unit('midboss-stage6'),car=e.unit('objective');plan[plan.length-1].x=boss&&!boss.dead?boss.x+200:Math.min(6380,(car?.x||6380)+1000);if(st.jumping){");
 }
 source=source.replace(/ function aim\([^\n]+\n/,` ${aim}\n`);
 source=source.replace("if(e.canAct()&&u?.side===0&&!a.dialogue){", "if(e.canAct()&&u?.side===0&&!a.dialogue){if(u.hp<u.maxHp*.45&&b.items.heal>0&&e.item('heal')){log.push({op:'ordinary-heal',actor:u.id,round:b.round});step();continue;}");
 source=source.replace("if(e.canAct()&&e.active?.id===u.id&&!a.dialogue){", "if(e.canAct()&&e.active?.id===u.id&&!a.dialogue){if(u.hp<u.maxHp*.45&&b.items.heal>0&&e.item('heal')){log.push({op:'ordinary-heal',actor:u.id,round:b.round});step();continue;}");
 if(style==='objective')source=source.replaceAll(')<750',policy.includes('flow')?')<0':')<180');
 if(policy.includes('flow'))source=source.replaceAll('u.moveLeft<400','u.moveLeft<e.jumpCost(u)+Math.abs(p.jumpTo-u.x)+40');
 if(style==='route')source=source.replaceAll(')<750',')<350');
 if(stage===2&&style!=='cover')source=source.replace("if(phase<2&&u.moveLeft>10)e.move(1,C.STEP);", "if((phase<2||u.x<Math.min(3900,(e.unit('objective')?.x||u.x)+500))&&u.moveLeft>10){if(phase>=2&&u.y<(e.unit('objective')?.y||0)-600&&e.canDrop(u))e.drop(u);e.move(1,C.STEP);}");
 // Knight sword policy cannot attack distant elevated enemies with a ballistic
 // predictor. The repaired aim above measures its real melee sector instead.
 if(policy.includes('noitems'))source=source.replaceAll('if(u.hp<u.maxHp*.45&&b.items.heal>0', 'if(false&&u.hp<u.maxHp*.45&&b.items.heal>0');
 return source;
}
