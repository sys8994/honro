import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import{runtime,battlefield}from'../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,p=JSON.parse(await readFile('shared/data/campaign.json'));
for(const[id,count]of[[25,5],[27,4]]){const s=p.stages[id-1];assert.equal(s.initialState.honroWaterworksRevision,3);assert.equal(s.design.act3.crossings.length,count);assert(s.design.act3.optionalRoutes.length);assert.equal(s.units.filter(u=>u.team==='player').length,2);assert(s.elements.filter(e=>e.id.includes('roof')).length>=2);assert(s.elements.some(e=>e.id.includes('stairs')));assert(s.elements.every(e=>e.assetId.startsWith('a3-waterworks-v3:')||!e.assetId.startsWith('a3-waterworks:')));const ys=s.design.act3.crossings.flatMap(c=>[c.from.y,c.to.y]);assert(Math.max(...ys)-Math.min(...ys)>=1800);assert(s.design.act3.crossings.some(c=>c.to.x<c.from.x));for(const c of s.design.act3.crossings)assert(s.markers.some(m=>m.id===c.markerId));}
// Keep the original observation positions and angle/power. Only the selected
// roof's solid control reproduces the old block; actual fire now passes it.
for(const[id,x,y,roofId]of[[25,2780,4950,'inspection-room-roof:collision:0'],[27,2780,4250,'loading-office-roof:collision:0']]){
 const{b,e}=battlefield(g,id),u=b.units.find(u=>u.cls==='mage'&&u.side===0),roof=b.terrain.find(t=>t.id===roofId);assert(roof?.oneWay);
 b.units=[u];b.active=u.id;b.phase='aim';b.side=0;e.checkEnd=()=>false;
 Object.assign(u,{x,y,ranks:{M09:1},loadout:['M09'],vx:0,vy:0,jumping:false,airborne:false,acted:false,focus:10000,maxFocus:10000,cooldowns:{}});
 roof.oneWay=false;b.sceneVersion++;const old=e.predict(u,C.SKILLS.M09,70,.95);assert.equal(old.terrain,roofId,'Exact old overhead contour reproduces blocked shot');
 roof.oneWay=true;b.sceneVersion++;const snapshot=JSON.stringify(b),guide=e.predict(u,C.SKILLS.M09,70,.95);assert.equal(JSON.stringify(b),snapshot,'Prediction does not mutate battle');assert(guide.apex?.y<roof.y,'Guide rises through the overhead roof');
 const hits=[],impact=e.impact.bind(e);e.impact=(p,h)=>{hits.push(h);return impact(p,h);};assert(e.fire('M09',70,.95));const projectile=b.projectiles[0];let crossed=false;
 for(let frame=0;frame<2400&&b.projectiles.length;frame++)for(const shot of [...b.projectiles]){e.stepProjectile(shot,C.STEP);crossed||=shot.y<roof.y&&shot.x>=roof.x&&shot.x<=roof.x+roof.w;}
 assert(crossed,'Actual projectile crosses the original roof without repositioning');assert.equal(b.projectiles.length,0);assert.equal(hits.length,1);assert(hits[0].n.y<0,'Actual installation hits a top');assert.equal(hits[0].terrain.id,guide.terrain);assert(Math.hypot(projectile.x-guide.x,projectile.y-guide.y)<.1,'Guide/live endpoint agrees');assert.equal(b.stakes.length,2);const landing=b.stakes[1];assert(Math.abs(landing.y-C.topAt(hits[0].terrain,landing.x))<.01,'Arriving gate remains on its actual contact surface');
}
console.log('PASS vertical structure: 5/4 crossings and unchanged observation shots pass open roofs, match guides and install on top surfaces');
