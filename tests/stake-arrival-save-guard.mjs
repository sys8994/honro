import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {appHarness,plain,KEY} from './app-regression-helpers.mjs';
import {battlefield} from '../game/tests/helpers.mjs';
const h=await appHarness(),{g}=h,A=g.HonroAct3,V=g.HonroAct3Void,Q=g.HonroEvidenceQuests;
// Existing stored text/cursor owns presentation even when future completions are quiet.
let a=h.load(h.profileThrough(26));a.launch(25);h.finish(a);a.turnNotice=null;
let stored=plain(a.stage.beats['stake-arrival-2']);g.HonroStory.start(a,stored,{title:a.stage.name,index:0});stored=plain(a.dialogue.lines);g.HonroStory.save(a);a.persist();const saved=JSON.parse(h.storage.get(KEY));
a=h.reload();a.continue();assert(a.dialogue);assert.deepEqual(plain(a.dialogue.lines),stored);assert.equal(a.dialogue.index,0);g.HonroStory.save(a);assert.deepEqual(plain(a.dialogue.lines),stored);h.finish(a);
// A grounded late-arrival fixture keeps the real beforeManifest/use wrapper.
a=h.load(h.profileThrough(26));a.launch(27);h.finish(a);a.turnNotice=null;a.close();const e=a.engine,b=e.b,team=e.heroesAlive(),archer=team.find(u=>u.cls==='archer'),mage=team.find(u=>u.cls==='mage'),m=A.marker(b,'family-manifest'),first=g.HonroStakeCrossing.crossings(b)[0];
for(const s of A.steps(b)){if(s.id==='family-manifest')break;A.memory(b).done[s.id]=true;const q=A.marker(b,s.id);if(q)q.collected=true;}
const place=(u,x,y)=>Object.assign(u,{x,y,vx:0,vy:0,airborne:false,jumping:false,acted:false});place(mage,m.x-30,m.y);place(archer,first.from.x,first.from.y);b.active=mage.id;b.side=0;b.phase='aim';a.actorBoundary=mage.id;
assert(A.eligibility(a,m).ok);assert.equal(A.use(a,m),false,'Mage alone cannot bypass encounter');assert.equal(b.honroAct3Void.state,'READY');assert(!A.memory(b).done[m.id]);assert(!Q.field(b).cargo['27:family-manifest']);
place(archer,m.x-90,m.y);assert.equal(A.use(a,m),false);assert.equal(b.honroAct3Void.state,'FALLING');assert(!m.collected);assert(!Q.field(b).cargo['27:family-manifest']);
assert(V.skip(a));for(let i=0;i<10;i++)V.frame(a,.05);assert.equal(b.honroAct3Void.state,'RESOLVED');h.finish(a);a.turnNotice=null;
assert(!A.memory(b).done[m.id],'Resolving the event still requires manual manifest interaction');assert(A.use(a,m));assert(A.memory(b).done[m.id]);const cargo=plain(Q.field(b).cargo['27:family-manifest']);assert(cargo.proof&&cargo.ownerClass==='mage');h.finish(a);
const received=plain(a.profile),r=battlefield(g,28,{profile:received}),point=A.marker(r.b,'party-reunion');for(const [i,u]of r.e.heroesAlive().entries())place(u,point.x-60+i*40,point.y);Q.onComplete(r.app,A.steps(r.b).find(s=>s.id==='party-reunion'));const carried=Q.field(r.b).cargo['27:family-manifest'];assert(carried);assert.deepEqual(plain(carried.proof),cargo.proof);assert.deepEqual(plain(carried.origin),cargo.origin);assert.equal(carried.ownerClass,cargo.ownerClass);
await mkdir('_local/reports/stake-arrival-dialogues',{recursive:true});await writeFile('_local/reports/stake-arrival-dialogues/save-guard.json',JSON.stringify({savedQuietArrivalResumedExact:true,cursor:0,mageAloneBlocked:true,unresolvedBlocked:true,resolvedStillNeedsManualUse:true,cargo28ProofExact:true,scope:'Production App/Engine with late-arrival fixture; original resources/enemies retained; not full combat traversal.'},null,2));console.log('PASS stored quiet-arrival text/cursor Continue, manual27 manifest before/after actual void skip-return,28 cargo ownership/proof');
