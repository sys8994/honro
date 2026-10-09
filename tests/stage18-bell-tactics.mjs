/** Live rank-one, legally equipped attacks on the unchanged authored41 roster.
 * Initial supported firing poses are fixtures. Movement/fullplay are separate. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {g,C,stage,fixture,fire,aimAt,readiness} from './stage18-bell-tactics-helper.mjs';
const rows=[],plain=x=>JSON.parse(JSON.stringify(x)),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),initial=JSON.stringify(stage),physics=JSON.stringify({skills:C.SKILLS,balance:g.HONRO_BALANCE}),root='_local/reports/stage18-bell/tactics';await mkdir(root,{recursive:true});
const shoot=(cls,support,x,skill,aim)=>fire(fixture(cls,support,x),skill,aim);
const clean=s=>assert(!s.damageEvents.some(d=>d.target.startsWith('p-')),'Representative shot does not rely on friendly/self damage');
// The distant C support reaches the same authored device as the close S00 gate.
{
 const p=stage.design.bell.standing.farRelease,q=fixture('archer',p.surfaceId,p.x,{silenced:true});q.allowTargetDamage=true;const t=q.b.terrain.find(t=>t.id==='upper-chain'),hp=t.hp,shot=fire(q,'A01',{angle:5,power:.5});assert(Math.abs(t.x-q.hero.x)>1000);assert(t.hp<hp);assert.equal(shot.focusSpent,0);clean(shot);rows.push({role:'Seolo: distant C free-arrow release',hpBefore:hp,hpAfter:t.hp,...shot});console.log('PASS actual C free arrow reaches the shared tension fixture');
}
// Lower front and raised support are separate attack choices, not a count claim.
{
 const area=shoot('mage','sb-suppression-court',3150,'M04',{angle:178.22341845531292,power:.5868074329134592}),q=fixture('archer','sb-suppression-court',3150),single=fire(q,'A01',aimAt(q,'A01','sb-b-center'));for(const id of ['sb-b-left','sb-b-center'])assert(area.damage[id]>0);assert.equal(['sb-b-left','sb-b-center'].filter(id=>single.damage[id]>0).length,1);clean(area);clean(single);assert.equal(single.focusSpent,0);rows.push({role:'Damheo: court frontline role cluster',area,single});console.log('PASS M04 reaches both real frontline bodies; basic arrow reaches one');
}
// The untouched raised B cluster has three bodies in the rank-one radius.
// This supported-pose comparison does not replace the live hold-entry test.
{
 const area=shoot('mage','sb-suppression-court',3200,'M04',{angle:55,power:.65}),targets=['sb-b-high','sb-b-spirit-right','sb-b-spirit-high'];for(const id of targets)assert(area.damage[id]>0,id+' lies in the authored rank-one area');clean(area);rows.push({role:'Damheo: three distinct authored B support bodies',targets,area});console.log('PASS rank-one M04 pressures all three unchanged B support bodies');
}
// East D actually reverses on its solid wall and returns into the upper support.
{
 const aim={angle:119,power:.35},target='sb-d-bat-front',bounced=shoot('mage','sb-east-resonance-ledge',8605,'M11',aim),blocked=shoot('mage','sb-east-resonance-ledge',8605,'M01',aim);assert(bounced.contacts.some(c=>c.id==='sb-east-reflection-wall'));assert(bounced.hits.some(h=>h.id===target&&h.reflectCount>=1));assert(bounced.damage[target]>0);assert.equal(blocked.damage[target]||0,0);assert(blocked.contacts.some(c=>c.id==='sb-east-reflection-wall'));clean(bounced);clean(blocked);
 const q=fixture('archer','sb-east-resonance-ledge',8605),basic=fire(q,'A01',aimAt(q,'A01',target));assert(basic.damage[target]>0);assert.equal(basic.focusSpent,0);clean(basic);rows.push({role:'Damheo: east resonance wall return',target,bounced,sameAimBasicCast:blocked,freePartyAlternative:basic});console.log('PASS M11 actual east wall bounce; same M01 stops; free direct arrow remains');
}
// A solid court pier creates an actual terrain-phase choice. A high free arrow
// over the same unmodified pier is the ordinary movement/aim alternative.
{
 const aim={angle:-5.492915009678983,power:.6541459238952495},target='sb-b-screen',piercing=shoot('occultist','sb-suppression-court',3150,'O04',aim),blocked=shoot('occultist','sb-suppression-court',3150,'O01',aim),alternative=shoot('archer','sb-suppression-court',3150,'A01',{angle:67,power:.35});assert(piercing.damage[target]>0);assert(piercing.crossings.some(c=>c.id==='sb-court-reflector'));assert.equal(piercing.contacts.length,0);assert.equal(blocked.damage[target]||0,0);assert(blocked.contacts.some(c=>c.id==='sb-court-reflector'));assert(alternative.damage[target]>0);assert.equal(alternative.focusSpent,0);for(const s of [piercing,blocked,alternative])clean(s);rows.push({role:'Sodan: screened court support',target,piercing,sameAimFreeBlocked:blocked,freeHighArcAlternative:alternative});console.log('PASS O04 crosses real stone; O01 stops; free high-arrow alternative hits');
}
// The bronze shell itself, not a substitute stone wall, is the O04 obstacle.
// A second supported lower approach keeps this same occultist's free O01 valid.
{
 const aim={angle:-75.6403238045415,power:.703544423389673},target='sb-f-spirit-front',piercing=shoot('occultist','sb-maintenance-shelf',5788,'O04',aim),blocked=shoot('occultist','sb-maintenance-shelf',5788,'O01',aim),alternative=shoot('occultist','act2-floor',5970,'O01',{angle:45.29742488900882,power:.7542179690378951});assert(piercing.damage[target]>0);assert(piercing.crossings.some(c=>c.id==='sb-bell-west-wall'));assert.equal(blocked.damage[target]||0,0);assert(blocked.contacts.some(c=>c.id==='sb-bell-west-wall'));assert(alternative.damage[target]>0);assert.equal(alternative.focusSpent,0);for(const s of [piercing,blocked,alternative])clean(s);rows.push({role:'Sodan: actual bronze wall phase and free lower approach',target,piercing,sameAimFreeBlocked:blocked,freeSameHeroAlternative:alternative});console.log('PASS O04 crosses the intact bronze shell; O01 stops; free lower O01 hits');
}
// O08 itself reveals/weakens the unchanged hidden enemy. The comparison arrow
// is identical, and the support action's own damage is recorded separately.
{
 const targetId='sb-b-spirit-left',setup=()=>fixture('occultist','sb-suppression-court',4030,{poses:[{cls:'archer',support:'sb-suppression-court',x:3150}]}),control=setup();assert(control.e.select('p-archer'));control.hero=control.e.unit('p-archer');const arrow=aimAt(control,'A01',targetId),beforeBattle=plain(control.b),beforeVisibility={visible:g.HonroAct2.visible(control.b,control.e.unit(targetId)),guidance:control.e.guidanceTarget(control.hero,control.e.unit(targetId))};assert(!beforeVisibility.visible&&!beforeVisibility.guidance);const blind=fire(control,'A01',arrow);
 const q=setup(),target=q.e.unit(targetId),contract=u=>plain({x:u.x,y:u.y,r:u.r,h:u.h,maxHp:u.maxHp,armor:u.armor,existenceDefense:u.existenceDefense,side:u.side}),beforeContract=contract(target),support=fire(q,'O08',aimAt(q,'O08',targetId));assert(target.manifested&&target.revealSpiritToParty);assert.equal(target.formDamageTakenBonus,.92);assert.equal(target.manifestedUntil,q.b.round+2);assert.deepEqual(contract(target),beforeContract);q.e.finishAction();for(let i=0;i<600&&q.b.phase==='review';i++)q.e.tick(C.STEP);assert(q.e.select('p-archer'));q.hero=q.e.unit('p-archer');const afterVisibility={visible:g.HonroAct2.visible(q.b,target),guidance:q.e.guidanceTarget(q.hero,target)},afterBattle=plain(q.b);assert(afterVisibility.visible&&afterVisibility.guidance);const enabled=fire(q,'A01',arrow);assert.deepEqual(blind.from,enabled.from);assert.deepEqual(blind.aim,enabled.aim);assert(enabled.damage[targetId]>blind.damage[targetId]*5);for(const s of [blind,support,enabled])clean(s);const projectSha256=hash(g.HONRO_PROJECT);for(const [name,battle]of[['manifest-before',beforeBattle],['manifest-after',afterBattle]])await writeFile(root+'/'+name+'.json',JSON.stringify({projectSha256,battle}));rows.push({role:'Sodan: actual O08 enables party targeting and damage',targetId,beforeVisibility,blind,support,afterVisibility,enabled});console.log('PASS actual O08: party visibility and identical arrow',blind.damage[targetId],'→',enabled.damage[targetId]);
}
await writeFile(root+'/project.json',JSON.stringify(g.HONRO_PROJECT));
assert.equal(JSON.stringify(stage),initial);assert.equal(JSON.stringify({skills:C.SKILLS,balance:g.HONRO_BALANCE}),physics);await writeFile(root+'/shots.json',JSON.stringify({projectSha256:hash(g.HONRO_PROJECT),runtimeSkillsSha256:hash(C.SKILLS),readiness,rows,scope:'Supported-pose rank-one actual Engine.fire/tick, unchanged complete authored roster. No post-entry HP, geometry, hitbox, skill coefficient or mana writes. Optional tactics proof, not normal fullplay or browser input.'},null,2)+'\n');
