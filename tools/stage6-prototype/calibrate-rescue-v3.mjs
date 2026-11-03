/** A separate split-role Stage7 policy; preserves frozen and v2 calibration. */
export function calibrateRescueV3(source,stage,policy){
 if(!policy.includes('splitrescue-v3'))return source;
 if(stage!==7)throw Error('Split-rescue policy only supports Stage7');
 source=source.replace('function aim(arg){const u=arg||e.active;let best=null;',"function aim(arg){const live=a.engine,before=JSON.stringify(live.b),e=new C.Engine(JSON.parse(before)),u=e.unit((arg||live.active).id);let best=null;");
 source=source.replace('return best;}','if(JSON.stringify(live.b)!==before)throw Error(\'Detached aim changed live battle\');return best;}');
 source=source.replace('let best=null;const targets=',"let best=null;const residents=e.b.units.filter(v=>v.id.startsWith('resident-')&&!v.dead),priority=v=>Math.max(0,...residents.map(r=>Math.max(0,1000-Math.hypot(v.x-r.x,v.y-r.y))*(2-r.hp/r.maxHp)));const targets=")
 .replace('Math.hypot(v.x-u.x,v.y-u.y)-Math.hypot(w.x-u.x,w.y-u.y)','Math.hypot(v.x-u.x,v.y-u.y)-priority(v)*3-Math.hypot(w.x-u.x,w.y-u.y)+priority(w)*3')
 .replaceAll('skill.damage>best.net','skill.damage+priority(v)>best.net').replaceAll('net:skill.damage','net:skill.damage+priority(v)')
 .replaceAll('z.net>best.net','z.net+priority(v)>best.net').replaceAll('net:z.net','net:z.net+priority(v)');
 // Mage remains the rescue-first runner. Archer/knight spend movement toward the
 // threatened floor before shooting, rather than fighting every entry enemy.
 source=source.replace(/if\(e.grounded\(u\)&&\(u.moveLeft<150\|\|e.alive\(1\).some\(v=>Math.hypot\(v.x-u.x,v.y-u.y\)<\d+\)\)\)/,"if(e.grounded(u)&&(u.moveLeft<150||(u.cls!=='mage'&&u.moveLeft<500&&e.alive(1).some(v=>Math.hypot(v.x-u.x,v.y-u.y)<1100&&b.units.some(r=>r.id.startsWith('resident-')&&!r.dead&&Math.hypot(v.x-r.x,v.y-r.y)<800)))))");
 return source;
}
