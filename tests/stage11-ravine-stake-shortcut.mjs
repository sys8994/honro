/** Optional M09 shortcut across the already walk/jump-reachable high route.
 * Supported initial poses/no enemies isolate the real projectile and four E
 * interactions. No correction/refill/teleport is injected after setup. */
import assert from'node:assert/strict';import{mkdir,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';import{runtime,battlefield}from'../game/tests/helpers.mjs';import{isolateRouteHero,commandRoute}from'./stage11-ravine-command-helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[],walkRows=[],jumpRows=[],st=g.HONRO_PROJECT.stages[10];assert.equal(st.initialState.honroRavineVersion,2);
const entry=()=>{const p=C.defaults();p.recruited=g.HonroStageRules.stageParty(11);for(const c of p.recruited)p.heroes[c].xp=g.HonroProgression.legacyCampaignAnchor(10);return p;};
for(const cls of ['archer','mage','knight','occultist']){
 const q=battlefield(g,11,{profile:entry()}),at=(id,x)=>({x,y:C.topAt(q.b.terrain.find(t=>t.id===id),x)}),start=at('rv-east-tower',11800),u=isolateRouteHero(q,cls,start);
 const route=[at('rv-east-tower',11100),{...at('rv-east-tower',10500),jumpTo:{x:10530,support:'rv-east-canopy-access'}},at('rv-east-windswept-bough',11000),at('rv-east-windswept-bough',11200),at('rv-east-windswept-bough',11800),at('rv-east-windswept-bough',12220)];
 const walk=commandRoute(g,q,u,route);assert(walk.passed,JSON.stringify({cls,failed:walk.failed}));assert(walk.walked>2800&&walk.bounds.minX<10520,'Indirect path really returns to the west access before climbing');console.log('PASS indirect walking',cls,Math.round(walk.walked),'horizontal units',walk.waits,'waits');walkRows.push({cls,...walk});
 const j=battlefield(g,11,{profile:entry()}),v=isolateRouteHero(j,cls,start);assert(j.e.jump(v));let minY=v.y,reached=false;for(let n=0;n<400;n++){if(j.e.canAct())j.e.move(1,C.STEP);j.e.tick(C.STEP);minY=Math.min(minY,v.y);if(j.e.grounded(v)&&j.e.surface(v.x,v.y-5,v.y+5)?.t.id==='rv-east-windswept-bough')reached=true;if(n>40&&j.e.grounded(v))break;}assert(!reached&&start.y-minY<220,'The direct 450-world-unit rise is beyond untrained jump');jumpRows.push({cls,maxRise:start.y-minY,reached});
}
for(const wind of[-8,0,12]){
 const profile=C.defaults();profile.recruited=g.HonroStageRules.stageParty(11);for(const cls of profile.recruited)profile.heroes[cls].xp=g.HonroProgression.legacyCampaignAnchor(10);
 for(const id of['M07','M10','M08','M09'])assert(C.train(profile.heroes.mage,id),'Legally train '+id+' at actual level10');profile.loadouts.mage=['M01','M09'];C.sanitizeLoadout(profile,'mage');
 const{b,e}=battlefield(g,11,{profile}),heroes=e.heroesAlive(),mage=heroes.find(u=>u.cls==='mage'),support=b.terrain.find(t=>t.id==='rv-east-tower');
 b.units=heroes;b.active=mage.id;b.side=0;b.phase='aim';b.wind=wind;e.checkEnd=()=>false;
 const positions={mage:11800,archer:11720,knight:11640,occultist:11560};
 for(const u of heroes){Object.assign(u,{x:positions[u.cls],y:C.topAt(support,positions[u.cls]),vx:0,vy:0,airborne:false,jumping:false});assert(C.validTerrainContactPose(b.terrain,u));assert.equal(u.level,10);}
 const initial=JSON.parse(JSON.stringify(heroes.map(u=>({cls:u.cls,x:u.x,y:u.y,hp:u.hp,focus:u.focus,ranks:u.ranks,loadout:u.loadout})))),items=JSON.stringify(b.items);
 let aim=null;for(const power of[1,.95,.9,.85,.8,.75]){for(let angle=45;angle<=85;angle++){const hit=e.predict(mage,C.SKILLS.M09,angle,power);if(hit.terrain==='rv-east-windswept-bough'&&hit.x>=12100&&hit.x<=12270){aim={angle,power,x:hit.x,y:hit.y};break;}}if(aim)break;}
 assert(aim,'A legal M09 arc must reach the overlapping upper bough at wind '+wind);assert(e.fire('M09',aim.angle,aim.power));
 let frames=0;const tick=()=>{e.tick(C.STEP);frames++;};const settle=()=>{for(let n=0;n<5000&&!e.canAct();n++)tick();assert(e.canAct(),'Actual turn resumes');};settle();
 assert.equal(b.stakes.length,2);const home=b.stakes.find(s=>s.x<11900),landing=b.stakes.find(s=>s.x>12100);assert(home&&landing);assert(Math.abs(landing.x-aim.x)<20&&Math.abs(landing.y-aim.y)<20,'Preview and live impact agree');
 const crossed=[];for(const [index,cls] of ['archer','knight','occultist','mage'].entries()){
  const u=heroes.find(u=>u.cls===cls);assert(e.select(u.id),'Select an unacted companion '+cls);
  for(let n=0;n<400&&Math.abs(u.x-home.x)>15;n++){assert(e.canAct());e.move(Math.sign(home.x-u.x),C.STEP);tick();}
  const before={x:u.x,y:u.y,hp:u.hp,focus:u.focus};assert(e.useGate(),'Real E crosses '+cls);assert(u.x>12100&&u.y<4900&&C.validTerrainContactPose(b.terrain,u));crossed.push({cls,before,after:{x:u.x,y:u.y,hp:u.hp,focus:u.focus},round:b.round});const vacate=landing.x-150-index*80;for(let n=0;n<300&&Math.abs(u.x-vacate)>12;n++){e.move(Math.sign(vacate-u.x),C.STEP);tick();}e.wait();settle();
 }
 assert(heroes.every(u=>u.hp===initial.find(v=>v.cls===u.cls).hp),'Shortcut does not require recovery/damage editing');assert.equal(JSON.stringify(b.items),items);
 rows.push({wind,aim,home,landing,initial,crossed,frames,worldDistance:Math.hypot(landing.x-home.x,landing.y-home.y),verticalRise:home.y-landing.y,rounds:b.round,scope:'one legal rank1 M09 and four actual E uses; no enemies/controlled supported starting poses; walking shortcut is separately proved without M09'});console.log('PASS optional M09',wind,Math.round(home.y-landing.y),'rise; four ordinary E crossings instead of a 3k walking detour');
}
await mkdir('_local/reports/stage11-ravine',{recursive:true});await writeFile('_local/reports/stage11-ravine/stake-shortcut.json',JSON.stringify({sourceProjectSha256:createHash('sha256').update(JSON.stringify(g.HONRO_PROJECT)).digest('hex'),walkRows,jumpRows,rows},null,2)+'\n');
