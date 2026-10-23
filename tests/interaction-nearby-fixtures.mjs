// Prepared R4 gate save, not the user's unseen JSON or a combat playthrough.
// Only fixture creation places the selected hero at the reported location.
// Threats approach using the real Engine walk/collision implementation.
export function gateFixture(h){
 const app=h.load(h.profileThrough(12));app.launch(13);h.finish(app);app.close();app.turnNotice=null;
 const {g}=h,b=app.engine.b,A=g.HonroAct2,m=b.honroMarkers.find(m=>m.id==='gate');
 const resident=b.units.find(u=>u.id==='resident-1'),spirit=b.units.find(u=>u.id==='resident-spirit-1');
 A.memory(b).done.resident=true;resident.honroResolved=true;if(spirit){spirit.hp=0;spirit.dead=true;spirit.honroReleased=true;}
 b.honroMarkers.find(m=>m.id==='resident').collected=true;A.memory(b).rescued=[resident.id];
 app.selectHero('p-knight');const hero=app.engine.active;hero.x=m.x-70;hero.y=g.HonroMapEngine.surfaceY(b.terrain,hero.x,m.y)?.y??m.y;hero.vx=hero.vy=0;
 for(const [i,id]of ['a2-enemy-9','a2-enemy-10','a2-enemy-12'].entries()){
  const enemy=app.engine.unit(id);for(let n=0;n<[32,42,51][i];n++)app.engine.walk(enemy,-1,1/60);
 }
 b.round=4;app.profile.honroBattle=JSON.parse(JSON.stringify(b));app.persist();return{app,b,m,hero,profile:JSON.parse(h.storage.get('honro-first-act-profile-1'))};
}
export function controlFixture(h,id,markerId,prior=[]){
 const app=h.load(h.profileThrough(id-1));app.launch(id);h.finish(app);app.close();app.turnNotice=null;const b=app.engine.b,g=h.g,m=b.honroMarkers.find(m=>m.id===markerId||m.action===markerId),A=id<21?g.HonroAct2:g.HonroAct3;
 if(id>=11)for(const key of prior)A.memory(b).done[key]=true;
 const step=id>=11?A.steps(b).find(s=>s.id===m.id):null,cls=step?.requiredClass||m.requiredClass||'archer';app.selectHero('p-'+cls);const hero=app.engine.active;hero.x=m.x-20;hero.y=g.HonroMapEngine.surfaceY(b.terrain,hero.x,m.y)?.y??m.y;hero.vx=hero.vy=0;
 const enemy=b.units.find(u=>u.side===1&&!u.honroObjectiveTarget&&!u.honroSpirit&&!u.dead);Object.assign(enemy,{x:m.x+60,y:hero.y,vx:0,vy:0});
 app.profile.honroBattle=JSON.parse(JSON.stringify(b));app.profile.settings.music=false;app.profile.settings.sound=false;app.persist();return{app,b,m,hero,profile:JSON.parse(h.storage.get('honro-first-act-profile-1'))};
}
