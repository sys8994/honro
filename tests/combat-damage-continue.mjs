import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{C,g}=h,rows=[];
for(const id of ['A04','M11','M13','O10','O12','S07']){
 const profile=h.profileThrough(11),cls=C.SKILLS[id].cls;profile.heroes[cls].ranks={[C.baseSkill(cls)]:1,[id]:1};profile.loadouts[cls]=[id];
 const b=g.HonroWorld.build(g.HONRO_CONTENT.stages[10],profile,false,cls,id),u=b.units.find(v=>v.side===0&&v.cls===cls);Object.assign(b,{active:u.id,side:0,phase:'aim'});Object.assign(u,{focus:u.maxFocus,acted:false,loadout:[id],ranks:{...profile.heroes[cls].ranks,AP01:cls==='archer'?1:0}});
 const e=new C.Engine(b);e.grounded=()=>true;g.HonroClearReport.begin(b,{fresh:true});assert(e.fire(id,20,.7));
 if(id==='M11')e.impact(b.projectiles[0],{x:u.x+50,y:u.y-50,t:0,n:{x:-1,y:0},terrain:b.terrain[0]});
 if(id==='O12')e.impact(b.projectiles[0],{x:u.x+100,y:u.y,t:0,n:{x:0,y:-1},terrain:b.terrain[0]});
 const snapshot=plain(b),before={projects:plain(b.projectiles),volley:plain(b.volley||null),actions:plain(b.units.map(u=>[u.meleeAction,u.summonDamageOrigin,u.earthbind])),sequence:plain(b.damageSequence)};
 profile.honroBattle=plain(b);profile.honroStage=11;let app=h.load(profile);app.continue();assert(app.engine,id+' Continue');
 function check(){const b=app.engine.b;assert.deepEqual(plain(b.projectiles),before.projects,id+' pending projectiles');assert.deepEqual(plain(b.volley||null),before.volley);assert.deepEqual(plain(b.units.map(u=>[u.meleeAction,u.summonDamageOrigin,u.earthbind])),before.actions);assert.deepEqual(plain(b.damageSequence),before.sequence);}
 check();for(let i=0;i<2;i++){app.export();await h.import(await h.exported());app.continue();check();}
 const control=new C.Engine(snapshot),resumed=new C.Engine(plain(app.engine.b));control.checkEnd=resumed.checkEnd=()=>false;
 for(let n=0;n<180;n++)for(const e of [control,resumed])e.tick(C.STEP);
 assert.deepEqual(plain(resumed.b.damageSequence),plain(control.b.damageSequence));assert.deepEqual(plain(resumed.b.units.map(u=>({id:u.id,hp:u.hp,shield:u.shield,focus:u.focus}))),plain(control.b.units.map(u=>({id:u.id,hp:u.hp,shield:u.shield,focus:u.focus}))));assert.deepEqual(plain(resumed.b.projectiles),plain(control.b.projectiles));
 rows.push({id,rollIndex:before.sequence.index,live:before.projects.length,Continue:true,imports:2,engineTicks:180});
}
await report('combat-damage-continue',rows);console.log('PASS six actual App Continue/import flows and 180 resumed Engine ticks each');
