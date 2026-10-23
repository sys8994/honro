import assert from 'node:assert/strict';import vm from 'node:vm';import{readFile,mkdir,writeFile}from'node:fs/promises';import{buildCore}from'../game/engine/build.mjs';
const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);vm.runInContext(await readFile('shared/runtime/clear-report.js','utf8'),g);const C=g.HONRO_CORE,R=g.HonroClearReport,plain=x=>JSON.parse(JSON.stringify(x)),near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`),checks=[];
function fixture(){const b=C.createBattle(1,C.defaults(),'practice',{party:['archer','knight','occultist'],wind:0});b.units=b.units.filter(u=>u.side===0);b.units.push(C.makeUnit('knight',0,700,970,{id:'ally-knight'}));for(const u of b.units)Object.assign(u,{hp:9000,maxHp:10000,armor:.25,shield:0,critChance:0,attack:1});const e=new C.Engine(b);e.checkEnd=()=>false;e.random=()=>.99;R.begin(b,{fresh:true});return{b,e,src:b.units[0],target:b.units[1]};}
function pFor(f,extra={}){const p={id:100,skill:'A01',mode:'arrow',owner:f.src.id,side:f.src.side,attackSide:f.e.allegiance(f.src),damageRoll:1.04,shot:1,skillRank:1,damage:100,body:false,hit:[],vx:1000,vy:0,launchX:f.src.x,launchY:f.src.y,...extra};R.projectile(f.b,p,f.src);return p;}
function strike(f,p,amount=100,kind='normal'){const hp=f.target.hp,shield=f.target.shield;f.e.hurt(f.target,amount,p.owner,true,p,{x:f.target.x,y:f.target.y},kind);return{hp:hp-f.target.hp,shield:shield-f.target.shield};}
// Compare to exactly the existing computed result after crit, existence, armor and integer minimum.
for(const target of [{side:0},{side:2,honroAlly:true},{side:2,honroCivilian:true},{side:1,honroAlly:true},{side:2,id:'objective'},{side:0,summoned:true,summonOwner:'hero'}])for(const shield of [0,10,1000])for(const amount of [.01,1,100,300]){
 const f=fixture();Object.assign(f.target,target,{shield,existenceDefense:{form:.8,qi:1.1,soul:.9}});if(f.target.summoned)f.target.summonOwner=f.src.id;
 const p=pFor(f),control=new C.Engine(plain(f.b)),ct=control.unit(f.target.id);control.random=()=>.99;control.friendlyFireMultiplier=()=>1;
 const hp=ct.hp,sh=ct.shield;control.hurt(ct,amount,f.src.id,true,p,{x:ct.x,y:ct.y});const baseline=hp-ct.hp+sh-ct.shield,loss=strike(f,p,amount);near(loss.hp+loss.shield,baseline*.3);assert(loss.hp+loss.shield>0);
 const received=f.b.honroReport.heroes.knight?.received||0;if(!f.target.summoned&&f.target.side===0)near(received,loss.hp);
 const report=f.b.honroReport.other.friendly;if(!f.target.summoned&&f.target.id!=='objective'&&f.target.side!==1){near(report.damage,loss.hp);near(report.shield,loss.shield);}
}
checks.push('72 coalition/shield/amount fixtures: exact existing-rounded result × .3; 1 -> .3');
// Critical and resistance layers happen before the single reduction.
{const f=fixture();f.src.critChance=1;f.e.random=()=>0;const p=pFor(f),control=new C.Engine(plain(f.b));control.random=()=>0;control.friendlyFireMultiplier=()=>1;const t=control.unit(f.target.id),hp=t.hp;control.hurt(t,100,f.src.id,true,p);near(strike(f,p).hp,(hp-t.hp)*.3);}
// No reduction for enemies, neutral bystanders, environmental or actual-HP transfer costs.
for(const [side,attackSide,kind]of [[1,0,'normal'],[0,1,'normal'],[1,1,'normal'],[2,0,'normal'],[0,0,'environment'],[0,0,'salheun'],[0,0,'eaterTransfer']]){
 const f=fixture();f.target.side=side;const p=pFor(f,{attackSide});const control=new C.Engine(plain(f.b));control.random=()=>.99;control.friendlyFireMultiplier=()=>1;const t=control.unit(f.target.id),hp=t.hp;control.hurt(t,100,p.owner,true,p,undefined,kind);near(strike(f,p,100,kind).hp,hp-t.hp);
}
checks.push('crit/resistance before reduction; enemy/neutral/environment/salheun/eaterTransfer unchanged');
// Existing automatic safety remains stronger than 30%: zero friendly HP/status/terrain loss.
for(const family of ['followup','secondary','child','echoSource','summon']){const f=fixture(),p=pFor(f);if(family==='summon'){f.src.summoned=true;f.src.summonOwner=f.target.id;}else p[family]=family==='echoSource'?'echo':true;near(strike(f,p).hp,0);}
checks.push('volley/fragments/children/echo/summon preserve existing zero-friendly-damage safety');
// Fired coalition survives release, capture and removed launchers in reflected/delayed paths.
for(const mode of ['release','capture','removed']){
 const f=fixture(),p=pFor(f);if(mode==='release')f.src.side=1;if(mode==='capture'){p.attackSide=1;f.src.side=0;f.src.enthrall={owner:f.target.id};}if(mode==='removed')f.b.units=f.b.units.filter(u=>u!==f.src);
 const control=new C.Engine(plain(f.b));control.random=()=>.99;control.friendlyFireMultiplier=()=>1;const t=control.unit(f.target.id),hp=t.hp;control.hurt(t,100,p.owner,true,p,{x:t.x,y:t.y});near(strike(f,p).hp,(hp-t.hp)*(mode==='capture'?1:.3));
}
for(const kind of ['fire','delay']){const f=fixture(),p=pFor(f);p.x=f.target.x;p.y=f.target.y-f.target.h*.5;p.blast=100;f.e.createZone(p,kind);const z=f.b.zones[0];assert.equal(z.attackSide,0);const loaded=new C.Engine(plain(f.b));assert.equal(loaded.b.zones[0].attackSide,0);f.b.units=f.b.units.filter(u=>u!==f.src);const before=f.target.hp;if(kind==='fire')f.e.applyZones(f.target);else {f.b.teamEnds[1]=1;f.e.triggerDelays(1);}assert(f.target.hp<before);}
checks.push('release/capture/removed launcher; zone fire/delay save inheritance');
// Environmental barrel secondary explosion retains coalition but adds no attack variance.
{const f=fixture();f.target.armor=0;f.target.x=500;f.target.y=1000;f.b.terrain=[];const t={id:'barrel',x:490,y:960,w:20,h:40,mat:'barrel',hp:1,maxHp:1};f.b.terrain.push(t);const p=pFor(f),hp=f.target.hp;f.e.damageTerrain(t,100,0,p.owner,p);assert(t.broken);assert(f.target.hp<hp);assert(f.target.hp>hp-48*.31);}
// Actual-HP shove damage is already reduced; never apply .3 a second time.
{const f=fixture(),p=pFor(f,{skill:'A05',mode:'push',damage:100});f.target.x=500;f.target.y=1000;f.e.impact(p,{x:500,y:964,t:0,n:{x:-1,y:0},unit:f.target});const shove=f.target.shove;assert(shove.friendlyFireApplied);const next=C.makeUnit('knight',0,500,1000,{id:'next-ally',hp:9000,maxHp:9000,armor:0,shield:0});f.b.units.push(next);const hp=next.hp;f.target.vx=100;C.tickRedesign(f.e,0);near(hp-next.hp,Math.max(1,Math.round(shove.damage/.3))*.3);}
{const f=fixture(),p=pFor(f,{friendlyFireApplied:true,damageRoll:1});near(strike(f,p,.054).hp,.3);}
g.HONRO_CONTENT={hero:{archer:{name:'설오'},knight:{name:'휘겸'},mage:{name:'담허'},occultist:{name:'소단'}}};vm.runInContext(await readFile('shared/runtime/clear-report-ui.js','utf8'),g);
{const f=fixture(),p=pFor(f,{damageRoll:1});strike(f,p,.01);const html=g.HonroClearReportUI.detail(R.freeze(f.b));assert(html.includes('0.3'),'report displays fractional actual HP rather than zero');}
checks.push('barrel provenance and already-scaled shove prevent lost source/double scaling');
await mkdir('_local/reports/combat-damage',{recursive:true});await writeFile('_local/reports/combat-damage/friendly.json',JSON.stringify({checks},null,2));console.log('PASS coalition damage reduction',checks);
