// Isolated synthetic movement diagnostic; this is not a UI run or a campaign clear.
import {readFile} from 'node:fs/promises';
import {runtime} from '../../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,p=JSON.parse(await readFile(process.argv[2]||'candidate-35.json','utf8')),s=p.stages[0],profile=C.defaults();
g.HonroEquipment.fresh(profile);profile.recruited=['archer','mage','knight','occultist'];
for(const jumpAt of [null,3700,3550]){
 const b=g.HonroMaps.createBattle(s,p,structuredClone(profile));const e=new C.Engine(b,()=>{});e.checkEnd=()=>false;const u=b.units.find(x=>x.cls==='knight'&&x.side===0);b.active=u.id;b.side=0;b.phase='aim';Object.assign(u,{x:4230,y:1779,vx:0,vy:0,dead:false,acted:false});u.moveLeft=u.maxMove;let jumped=false,points=[];
 for(let i=0;i<600;i++){
  if(jumpAt!==null&&!jumped&&u.x<=jumpAt&&e.grounded(u)){jumped=e.jump(u)}
  e.move(-1,C.STEP);e.tick(C.STEP);
  if(i%30===0||u.x<3350||u.y>3000)points.push({tick:i,x:Math.round(u.x),y:Math.round(u.y),support:e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id??null,grounded:e.grounded(u),hp:u.hp,move:Math.round(u.moveLeft)});
  if(u.x<3350||u.y>3000||u.moveLeft<=0||u.dead)break;
 }
 console.log(JSON.stringify({jumpAt,jumped,points}));
}
