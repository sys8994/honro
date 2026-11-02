/** Separate Stage2 convoy-blocker-first/lower-cover diagnostic. */
export function calibrateConvoyV4(source,stage,policy){
 if(!policy.includes('convoy-v4'))return source;
 if(stage!==2)throw Error('Convoy policy only supports Stage2');
 source=source.replace('function aim(arg){const u=arg||e.active;let best=null;',"function aim(arg){const live=a.engine,before=JSON.stringify(live.b),e=new C.Engine(JSON.parse(before)),u=e.unit((arg||live.active).id);let best=null;");
 source=source.replace('return best;}','if(JSON.stringify(live.b)!==before)throw Error(\'Detached aim changed live battle\');return best;}');
 source=source.replace('let best=null;const targets=',"let best=null;const car=e.unit('objective'),priority=v=>car&&Math.abs(v.x-car.x)<1150&&Math.abs(v.y-car.y)<650?1200:0;const targets=")
 .replace('Math.hypot(v.x-u.x,v.y-u.y)-Math.hypot(w.x-u.x,w.y-u.y)','Math.hypot(v.x-u.x,v.y-u.y)-priority(v)*4-Math.hypot(w.x-u.x,w.y-u.y)+priority(w)*4')
 .replaceAll('skill.damage>best.net','skill.damage+priority(v)>best.net').replaceAll('net:skill.damage','net:skill.damage+priority(v)')
 .replaceAll('z.net>best.net','z.net+priority(v)>best.net').replaceAll('net:z.net','net:z.net+priority(v)');
 // Descent is not conditional on the already-stopped carriage overtaking the
 // archer. Use actual canDrop on each reached support, never relocate an actor.
 source=source.replace("if(phase===0&&u.x>990", "const car=e.unit('objective');if(phase>=2&&car&&u.y<car.y-600&&e.canDrop(u)){e.drop(u);log.push({op:'convoy-lower-drop',round:b.round,x:u.x,y:u.y,carX:car.x});step();continue;}if(phase===0&&u.x>990");
 source=source.replace("(e.unit('objective')?.x||u.x)+500","(e.unit('objective')?.x||u.x)+700");
 // Diagnostic reads expose whether waits are threat-lock, blocker, or no shot.
 source=source.replace('waits++;',"waits++;log.push({op:'convoy-wait-diagnostic',round:b.round,carX:car?.x,heroX:u.x,heroY:u.y,moveLeft:u.moveLeft,threats:e.alive(1).filter(v=>car&&Math.abs(v.x-car.x)<1150&&Math.abs(v.y-car.y)<650).map(v=>v.id)});");
 return source;
}
