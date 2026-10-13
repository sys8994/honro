// One deterministic fixture used by native core, shared runtime and both HTML hosts.
export function swordAreaSuite(C){
 const results=[];const check=(condition,label)=>{if(!condition)throw Error(label);};
 function arena(id,rank=1){
  const p=C.defaults();p.heroes.knight.xp=C.xpAtLevel(25);p.heroes.knight.ranks={S00:1,[id]:rank};p.loadouts.knight=[id];
  const b=C.createBattle(1,p,'practice',{party:['knight'],wind:0}),u=b.units.find(v=>v.cls==='knight');
  Object.assign(b,{units:[u],width:4000,height:2200,active:u.id,phase:'aim',side:0,practiceCombat:true,projectiles:[],fields:[],waters:[],drafts:[],wind:0,terrain:[{id:'floor',x:0,y:1900,w:4000,h:300,mat:'rock',hp:99999,maxHp:99999}]});
  Object.assign(u,{x:1000,y:1900,h:100,r:18,attack:1,armor:0,hp:1000,maxHp:1000,focus:1000,maxFocus:1000,acted:false,airborne:false,jumping:false,vx:0,vy:0,loadout:[id],ranks:{S00:1,[id]:rank},cooldowns:{},facing:1});
  const e=new C.Engine(b);e.random=()=>.99;const hits={};const hurt=e.hurt.bind(e);e.hurt=(t,...args)=>{const before=t.hp;hurt(t,...args);if(t.hp<before)hits[t.id]=(hits[t.id]||0)+1;};
  function foe(x,y=1850,extra={}){const t=C.makeUnit('archer',1,x,y+10,{id:'target'+b.units.length,role:'dummy',fixed:true,h:20,r:8,hp:10000,maxHp:10000,armor:0,shield:0,awake:true,loadout:['LA01'],...extra});b.units.push(t);return t;}
  function fire(angle=0,power=.6){check(e.fire(id,angle,power),'cast '+id);}
  function tick(seconds=.7){for(let t=0;t<seconds;t+=C.STEP)C.tickWarrior(e,C.STEP);}
  return{b,u,e,hits,foe,fire,tick};
 }
 for(const id of ['S00','S03','S02','S05','S08'])for(const rank of [1,8])for(const direction of [1,-1]){
  const a=arena(id,rank),front=[45,75,105].map(d=>a.foe(1000+direction*d,1850,{r:20})),rear=a.foe(1000-direction*100),far=a.foe(1000+direction*400),above=a.foe(1000+direction*110,1600),ally=a.foe(1000+direction*70,1850,{side:0}),neutral=a.foe(1000+direction*80,1850,{side:2}),captured=a.foe(1000+direction*90,1850,{eaterCapturedBy:'eater'});
  a.fire(direction>0?0:180);if(id==='S08')a.b.side=1;a.tick();
  for(const t of front)check(a.hits[t.id]===1,id+' rank '+rank+' direction '+direction+' all front once');
  check((a.hits[rear.id]||0)===(id==='S05'?1:0),id+' rear sector');
  for(const t of [far,above,ally,neutral,captured])check(!a.hits[t.id],id+' excludes '+t.id);
  const snapshot=JSON.stringify(a.hits);a.tick();check(JSON.stringify(a.hits)===snapshot,id+' no repeated hit');
  results.push(id+' rank '+rank+' direction '+direction+' three targets, exclusions, once per swing');
 }
 for(const id of ['S03','S08']){
  const a=arena(id),front=a.foe(1040),behind=[1090,1120,1140].map(x=>a.foe(x));
  a.b.terrain.push({id:'wall',x:1065,y:1500,w:12,h:400,mat:'rock',hp:99999,maxHp:99999});a.fire();if(id==='S08')a.b.side=1;a.tick();
  check(a.hits[front.id]===1,id+' before wall');for(const t of behind)check(!a.hits[t.id],id+' wall blocks');check(a.b.terrain[1].hp===99999,'ordinary terrain not damaged');results.push(id+' wall blocks all hidden targets');
 }
 // Head intersects the visible sector while all three legacy centre samples miss.
 for(const angle of [0,180]){
  const a=arena('S03'),d=angle===0?1:-1,t=a.foe(1000+d*100,2145,{h:300,r:10});
  a.fire(angle,0);a.tick();check(a.hits[t.id]===1,'head hurtbox intersects sector '+angle);results.push('head contact '+angle);
  const blocked=arena('S03'),target=blocked.foe(1000+d*100,2145,{h:300,r:10});blocked.b.terrain.push({id:'wall',x:d>0?1040:950,y:1500,w:10,h:700,mat:'rock',hp:99999,maxHp:99999});blocked.fire(angle,0);blocked.tick();check(!blocked.hits[target.id],'head contact cannot cross wall');
 }
 for(const rank of [1,8]){
  const a=arena('S07',rank),ts=[1040,1060,1080].map(x=>a.foe(x));a.fire();a.tick(1.3);check(a.hits[ts[0].id]===C.COMBO_HITS[rank-1],'combo repeat count');check(!a.hits[ts[1].id]&&!a.hits[ts[2].id],'combo remains single target');results.push('combo rank '+rank+' remains single target');
 }
 // Act 1 crow's authored hurtbox (h80/r33): its lower corner clips the
 // upward-aimed sector even though all legacy vertical samples miss it.
 {const a=arena('S03'),t=a.foe(1076,1724,{h:80,r:33});a.fire(.4*180/Math.PI,0);a.tick();check(a.hits[t.id]===1,'Act 1 crow sector corner');results.push('Act 1 crow hurtbox corner');}
 // Save midway between the authored front/rear swings, then continue exactly once.
 const a=arena('S05');const front=a.foe(1080),rear=a.foe(920);a.fire();a.tick(.1);check(a.hits[front.id]===1&&!a.hits[rear.id],'front first');const b=JSON.parse(JSON.stringify(a.b)),e=new C.Engine(b);e.random=()=>.99;for(let i=0;i<90;i++)C.tickWarrior(e,C.STEP);check(e.unit(front.id).hp===front.hp&&e.unit(rear.id).hp<rear.hp,'saved second swing only');results.push('mid-action snapshot resumes second swing only');
 return results;
}
