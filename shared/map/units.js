(function(G){'use strict';
const C=G.HONRO_CORE,H=G.HONRO_CONTENT,clone=x=>JSON.parse(JSON.stringify(x));
const teams={player:0,enemy:1,ally:2,npc:2};
function catalog(){return[
 ...Object.keys(H.hero).map(kind=>({kind,name:H.hero[kind].name,team:'player'})),
 ...Object.entries(G.HonroWorld.archetypes).map(([kind,d])=>({kind,name:d.name,team:'enemy'})),
 ...['porter','guard','archer','healer','ritualist','daoist','medium','scout'].map(role=>({kind:'ally:'+role,name:'동맹 · '+role,team:'ally'})),
 ...['bier','civilian','gate'].map(kind=>({kind:'object:'+kind,name:kind,team:'npc'})),
 {kind:'boss:bier',name:'빈 상여',team:'enemy'},{kind:'boss:sodan',name:'소단',team:'enemy'}];}
function has(kind){return catalog().some(x=>x.kind===kind);}
function kindOf(u){if(u.side===0)return u.cls;if(u.id==='boss')return u.honroFinalBoss?'boss:sodan':'boss:bier';if(u.honroAlly||u.allyRole)return'ally:'+(u.allyRole||'guard');if(u.side===2)return'object:'+(u.honroType||'civilian');return G.HonroWorld.archetypes[u.honroVariant]?u.honroVariant:G.HonroWorld.archetypes[u.honroType]?u.honroType:'human';}
function create(record,b,profile,st){
 if(!has(record.kind))throw Error('Unknown unit definition '+record.kind);
 const side=teams[record.team]??record.side??1;
 let u;
 if(record.runtimeTemplate){
  const {runtimeTemplate,kind,team,stageOverrides,...data}=record;u=clone(data);
 }else if(H.hero[record.kind]){
  u=C.makeUnit(record.kind,side,record.x,record.y,{id:record.id,name:H.hero[record.kind].name,h:92,r:22,loadout:[...profile.loadouts[record.kind]],tune:profile.tuning[record.kind]??.5});
 }else if(G.HonroWorld.archetypes[record.kind])u=G.HonroWorld.createEnemy(b,st,record.x,record.kind,record.spawnIndex??0,record.y,true);
 else if(record.kind.startsWith('ally:'))u=G.HonroWorld.ally(b,st,record.id,record.kind.slice(5),record.x,record.y);
 else if(record.kind.startsWith('boss:')){
  const source=G.HONRO_PROJECT?.stages.flatMap(s=>s.units).find(u=>u.kind===record.kind);if(!source)throw Error('Missing boss definition');u=clone(source);delete u.runtimeTemplate;
 }else u=C.makeUnit('knight',side,record.x,record.y,{id:record.id,name:record.kind.slice(7),honroType:record.kind.slice(7),fixed:true,loadout:[],hp:1450,maxHp:1450,r:50,h:110,honroCivilian:true});
 Object.assign(u,{id:record.id,x:record.x,y:record.y,side,spawnX:record.x,spawnY:record.y});
 if(!record.runtimeTemplate||side!==record.side){
  u.honroAlly=record.team==='ally';u.honroCivilian=record.team==='npc';
  if(u.honroAlly){u.allyRole??='guard';u.allyState??='follow';u.awake=true;}
 }
 if(side===0&&H.hero[u.cls]){
  u.loadout=[...profile.loadouts[u.cls]];u.tune=profile.tuning[u.cls]??.5;C.applyHero(u,b.heroes[u.cls],true);u.h=92;u.acted=false;u.cooldowns={};
 }else if(side===1&&u.combatBaseHp!==undefined){const d=C.DIFFICULTIES[b.difficulty]||C.DIFFICULTIES.normal;u.honroDifficulty=b.difficulty;u.hp=u.maxHp=Math.round(u.combatBaseHp*d.hp);u.attack=u.combatBaseAttack*d.damage;u.xpGranted=0;}
 if(record.facing!==undefined)u.facing=record.facing;
 if(record.label)u.name=record.label;
 if(record.encounterGroup!==undefined)u.honroCluster=record.encounterGroup;
 if(record.behavior){u.honroBehavior=record.behavior;if(record.behavior==='aggressive'){u.awake=true;u.aggroUntil=999;}if(record.behavior==='stationary')u.fixed=true;}
 if(record.boss!==undefined)u.boss=record.boss;
 if(record.miniboss!==undefined)u.honroMidboss=record.miniboss;
 if(record.levelOverride!==undefined){u.level=record.levelOverride;if(side===0){const h=clone(b.heroes[u.cls]);h.xp=C.xpAtLevel(u.level);C.applyHero(u,h,true);}}
 if(record.rank!==undefined)for(const id of u.loadout)u.ranks[id]=record.rank;
 Object.assign(u,clone(record.stageOverrides||{}));return u;
}
function record(kind,id,x,y,team){const d=catalog().find(d=>d.kind===kind);if(!d)throw Error('Unknown unit '+kind);return{id,kind,team:team||d.team,x,y,facing:1};}
G.HonroUnits={catalog,has,kindOf,create,record,teams};
})(globalThis);
