/** Residents walk to a target x on the built geometry (real Engine, no jumps):
 * every resident must arrive grounded with no HP loss. */
import {readFile} from 'node:fs/promises';
import {runtime,battlefield} from '../../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const [n,dir,tx]=[Number(process.argv[2]),process.argv[3],Number(process.argv[4])],stage=JSON.parse(await readFile(dir+'/stage.json'));
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,profile=C.defaults();g.HonroEquipment.fresh(profile);profile.recruited=g.HonroStageRules.stageParty(n);
const {b,e}=battlefield(g,n,{profile});const npcs=structuredClone(b.units.filter(u=>u.honroAct4Resident));
b.terrain=g.HonroMaps.compile(stage,{...g.HONRO_PROJECT,stages:[stage]}).terrain;b.units=npcs;b.phase='aim';b.side=0;
for(const u of npcs){u.fixed=false;u.moveLeft=99999;}const start=npcs.map(u=>({x:u.x,hp:u.hp}));
for(let f=0;f<3000;f++){let done=true;for(const [i,u]of npcs.entries()){const t=tx-i*130;if(u.x<t-2){done=false;e.walk(u,1,Math.min(.05,(t-u.x)/u.walkSpeed),true);e.integrateBody(u,.05);}}if(done)break;}
console.log(JSON.stringify({stage:n,target:tx,rows:npcs.map((u,i)=>({id:u.id,from:start[i].x,to:Math.round(u.x),y:Math.round(u.y),hpLoss:start[i].hp-u.hp,arrived:u.x>=tx-i*130-3}))}));
