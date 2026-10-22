/** Production mount/Continue and real M10 tick; terminal state fixtures, no fullplay claim. */
import assert from 'node:assert/strict';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C}=h,R=g.HonroClearReport;
function stale(){
 let a=h.load(h.profileThrough(4));a.launch(5);h.finish(a);a.stopBattle();
 const p=plain(a.profile),b=p.honroBattle;b.heroes.archer.xp=100;R.begin(b,{fresh:true});
 p.heroes.archer.xp=150;p.honroGrowth=plain(b.honroGrowth.ledger);
 p.honroGrowth.stages[5].contribution.sequence=(b.honroGrowth.ledger.stages[5].contribution.sequence||0)+1;
 return p;
}
for(const mode of ['mount','Continue']){
 const p=stale();let a=h.load(p);
 if(mode==='Continue'){h.click('continue');h.finish(a);}else{a.stage=g.HONRO_CONTENT.stages[4];a.stageId=5;a.mount(plain(p.honroBattle));}
 const b=a.engine.b,x=b.honroReport.xp.archer;
 assert.equal(b.heroes.archer.xp,150);assert.equal(x.before,100);assert.equal(x.last,150);
 assert.equal(x.recovered,50);assert.equal(x.combat+x.settlement+x.reunion,0);assert(b.honroReport.partial);
 g.HonroProgression.initialize(b,p);assert.equal(x.recovered,50,'repeat mount cannot double count recovery');
 b.phase='won';const r=R.finish(a),xp=r.xp.archer;
 assert.equal(xp.last,b.heroes.archer.xp);assert.equal(xp.last-xp.before,xp.combat+xp.settlement+xp.reunion+xp.recovered);
 assert.match(g.HonroClearReportUI.summary(r),/과거 성장 복구 \+50 XP \(이번 보상 제외\)/);
 const frozen=JSON.stringify(r);R.finish(a);assert.equal(JSON.stringify(r),frozen);
 console.log('PASS',mode,'100 → recovered150; recovery separate from actual rewards and frozen XP consistent');
}
{
 const p=stale();p.heroes.archer.xp=100;p.honroBattle.heroes.archer.xp=150;delete p.honroGrowth.stages[5];
 const a=h.load(p);a.launch(5);h.finish(a);const b=a.engine.b,x=b.honroReport.xp.archer;
 assert.equal(b.heroes.archer.xp,150);assert.equal(x.before,150);assert.equal(x.last,150);
 assert.equal(x.recovered||0,0);assert.equal(x.combat+x.settlement+x.reunion,0);assert.equal(b.honroReport.partial,false);
 console.log('PASS new launch starts fresh report after initialization recovery at150, zero new rewards');
}
{
 const a=h.load(h.profileThrough(15));a.launch(16);h.finish(a);const b=a.engine.b,m=b.units.find(u=>R.hero(u)&&u.cls==='mage'),target=b.units.find(u=>R.hero(u)&&u.cls==='archer'),o=b.units.find(u=>R.hero(u)&&u.cls==='occultist');
 const s=a.engine.spawnSummon(o,'stalker',target.x,target.y,1,1,false,undefined,'O11');
 for(const u of b.units.filter(R.hero)){u.hp=u.maxHp;}
 target.hp=target.maxHp-10;s.hp=s.maxHp-5;s.x=target.x;s.y=target.y;
 R.begin(b,{fresh:true});const prior=[target.hp,s.hp];
 b.stakes=[{id:123,owner:m.id,side:0,skill:'M10',x:target.x,y:target.y,rank:1,expires:b.round+3,usedRounds:{}}];
 C.tickRedesign(a.engine,.01);const report=b.honroReport;
 assert.equal(target.hp-prior[0],10);assert.equal(s.hp-prior[1],5);
 assert.equal(report.heroes.mage.healing,10);assert.equal(report.heroes.mage.skills.M10.healing,10);
 assert.equal(report.other.summons.healing,5);assert.equal(R.freeze(b).totals.healing,10);
 assert.match(g.HonroClearReportUI.detail(b.honroReport.final),/소환체<\/strong> · 피해 0 · 받은 피해 0 · 처치 0 · 회복 5/);
 console.log('PASS actual simultaneous M10: hero10 + summon5, overheal excluded, totals and separate UI consistent');
}

{
 const a=h.load(h.profileThrough(4));a.launch(5);h.finish(a);
 const originalFinish=R.finish,originalComplete=g.HonroProgression.complete,calls={finish:0,complete:0};
 R.finish=(...args)=>{calls.finish++;return originalFinish(...args);};g.HonroProgression.complete=(...args)=>{calls.complete++;return originalComplete(...args);};
 try{a.engine.b.phase='won';a.outcome();h.finish(a);a.outcome(true);assert.deepEqual(calls,{finish:1,complete:1});}
 finally{R.finish=originalFinish;g.HonroProgression.complete=originalComplete;}
 console.log('PASS victory → outro → result calls report finish and XP settlement exactly once');
}
