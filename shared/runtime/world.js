(function(G){'use strict';
const C=G.HONRO_CORE,H=G.HONRO_CONTENT,clone=x=>JSON.parse(JSON.stringify(x)),clamp=C.clamp;
// Monster attacks are authored as monster skills.  Human seal troops may reuse martial techniques,
// but beasts/spirits do not masquerade as player classes just to borrow their buttons.
const MONSTER_SKILLS={
 HBT01:{id:'HBT01',cls:'mage',name:'울림비명',tag:'박쥐 · 초음파',desc:'앞쪽 공기를 떨게 하는 짧고 빠른 초음파. 직접 피해는 낮고 폭발 반경이 넓다.',cost:0,damage:18,radius:92,mode:'honroSonic',icon:'resonance',color:'#a9beb0',speed:.994,wind:.10,terrain:.15,gravity:.08},
 HBT02:{id:'HBT02',cls:'mage',name:'메아리침',tag:'박쥐 · 반향',desc:'가느다란 반향 덩어리를 직선에 가깝게 쏜다.',cost:0,damage:23,radius:26,mode:'honroEchoNeedle',icon:'resonance',color:'#869f9d',speed:.896,wind:.12,terrain:.10,gravity:.12},
 HGS01:{id:'HGS01',cls:'occultist',name:'망자의 한숨',tag:'행렬귀 · 저중력',desc:'느리게 떠가는 한숨이 닿은 곳의 기운을 흐린다.',cost:0,damage:25,radius:56,mode:'honroDeadBreath',icon:'rune',color:'#a99ab4',speed:.82,wind:.15,terrain:.20,gravity:.22},
 HGS02:{id:'HGS02',cls:'occultist',name:'상여그늘',tag:'행렬귀 · 음영',desc:'낮게 깔리는 혼기 덩어리.',cost:0,damage:21,radius:76,mode:'honroFuneralShade',icon:'vortex',color:'#8e8298',speed:.76,wind:.22,terrain:.18,gravity:.30},
 HBR01:{id:'HBR01',cls:'knight',name:'뿌리쐐기',tag:'뿌리짐승 · 파편',desc:'굳은 뿌리 파편을 무겁게 던진다.',cost:0,damage:35,radius:48,mode:'honroRootShard',icon:'break',color:'#8b8b6d',speed:.76,wind:.55,terrain:1.30,gravity:1.18},
 HBR02:{id:'HBR02',cls:'knight',name:'흙울음',tag:'뿌리짐승 · 충격',desc:'흙과 돌을 뭉쳐 낮게 날린다.',cost:0,damage:29,radius:82,mode:'honroEarthRoar',icon:'quake',color:'#727b5f',speed:.72,wind:.62,terrain:1.65,gravity:1.25},
 HLN01:{id:'HLN01',cls:'occultist',name:'혼불방울',tag:'등불귀 · 혼불',desc:'느린 혼불이 목표 부근에서 크게 번진다.',cost:0,damage:24,radius:84,mode:'honroSoulFlame',icon:'flame',color:'#c4c697',speed:.68,wind:.18,terrain:.10,gravity:.16},
 HLN02:{id:'HLN02',cls:'occultist',name:'혼무씨',tag:'등불귀 · 혼무',desc:'짙은 혼무 덩어리를 떨어뜨린다.',cost:0,damage:20,radius:112,mode:'honroMistSeed',icon:'rune',color:'#9fae92',speed:.62,wind:.26,terrain:.10,gravity:.35},
 HSH01:{id:'HSH01',cls:'occultist',name:'수의가시',tag:'수의귀 · 투과',desc:'얇은 수의 조각이 지형을 스치듯 지나간다.',cost:0,damage:32,radius:24,mode:'honroShroudNeedle',icon:'pierce',color:'#aea0ad',speed:.756,wind:.18,terrain:.12,gravity:.20,phase:'terrain'},
 HSH02:{id:'HSH02',cls:'occultist',name:'매듭실',tag:'수의귀 · 결박',desc:'긴 천조각처럼 날아가 넓게 터진다.',cost:0,damage:22,radius:74,mode:'honroShroudKnot',icon:'bind',color:'#8d7b89',speed:.86,wind:.30,terrain:.10,gravity:.40},
 HCW01:{id:'HCW01',cls:'archer',name:'썩은깃',tag:'산송장 까마귀 · 깃',desc:'썩은 깃을 뭉쳐 날리는 독자 공격.',cost:0,damage:23,radius:38,mode:'honroRotFeather',icon:'arrow',color:'#879184',speed:.826,wind:.38,terrain:.18,gravity:.60},
 HCW02:{id:'HCW02',cls:'archer',name:'검은깃비',tag:'산송장 까마귀 · 산개',desc:'검은 깃 덩어리를 크게 흩뿌린다.',cost:0,damage:18,radius:82,mode:'honroFeatherBurst',icon:'rain',color:'#66766f',speed:.92,wind:.55,terrain:.15,gravity:.75},
 HWD01:{id:'HWD01',cls:'knight',name:'장승못',tag:'장승 · 목편',desc:'묵직한 나무못을 날린다.',cost:0,damage:34,radius:34,mode:'honroWoodSpike',icon:'break',color:'#a08e67',speed:.82,wind:.42,terrain:.85,gravity:1.05},
 HWD02:{id:'HWD02',cls:'knight',name:'터줏바람',tag:'장승 · 밀침',desc:'나무틈에서 터지는 압력파.',cost:0,damage:24,radius:100,mode:'honroWardGust',icon:'push',color:'#8f997d',speed:.76,wind:.28,terrain:.25,gravity:.30},
 HMO01:{id:'HMO01',cls:'knight',name:'곡소리',tag:'상두꾼 · 충격파',desc:'목 없는 몸에서 검은 울림이 퍼진다.',cost:0,damage:30,radius:92,mode:'honroMournerWail',icon:'resonance',color:'#9f7978',speed:.80,wind:.20,terrain:.25,gravity:.24},
 HMO02:{id:'HMO02',cls:'knight',name:'상여추',tag:'상두꾼 · 중량',desc:'상여 장식의 무거운 파편을 던진다.',cost:0,damage:42,radius:52,mode:'honroBierWeight',icon:'slam',color:'#8e7762',speed:.70,wind:.48,terrain:1.15,gravity:1.30}
};
Object.assign(C.SKILLS,MONSTER_SKILLS);
const ARCHETYPES={
 ghost:{name:'떠도는 혼',role:'fire',look:'ghost',cls:'occultist',skills:['HGS01','HGS02'],hp:102,attack:.50,h:105,r:21,intent:'망자의 한숨'},
 shade:{name:'매듭진 수의귀',role:'ice',look:'shade',cls:'occultist',skills:['HSH01','HSH02'],hp:126,attack:.51,h:115,r:22,intent:'수의가시와 매듭실'},
 hound:{name:'들린 산개',role:'leaper',look:'beast',variant:'hound',cls:'knight',skills:['HBR01','HBR02'],hp:108,attack:.54,h:88,r:32,intent:'빠른 돌진과 흙파편'},
 boar:{name:'들린 멧돼지',role:'leaper',look:'beast',variant:'boar',cls:'knight',skills:['HBR01','HBR02'],hp:154,attack:.64,h:108,r:41,intent:'무거운 돌진과 흙울음'},
 stag:{name:'들린 숫사슴',role:'leaper',look:'beast',variant:'stag',cls:'knight',skills:['HBR01','HBR02'],hp:132,attack:.58,h:116,r:38,intent:'뿔 돌진과 뿌리쐐기'},
 bat:{name:'들린 산박쥐',role:'storm',look:'bat',cls:'mage',skills:['HBT01','HBT02'],hp:70,attack:.38,h:66,r:28,flying:true,intent:'초음파와 반향'},
 crow:{name:'들린 까마귀',role:'bow',look:'crow',cls:'archer',skills:['HCW01','HCW02'],hp:88,attack:.47,h:80,r:33,flying:true,intent:'썩은깃과 검은깃비'},
 human:{name:'들린 사람',role:'bow',look:'human',cls:'archer',skills:['A01','A02'],hp:116,attack:.50,h:91,r:21,intent:'불규칙한 사격'},
 lantern:{name:'혼을 삼킨 등불',role:'fire',look:'lantern',cls:'occultist',skills:['HLN01','HLN02'],hp:94,attack:.53,h:92,r:25,flying:true,intent:'혼불과 혼무'},
 warden:{name:'들린 장승',role:'guard',look:'warden',cls:'knight',skills:['HWD01','HWD02'],hp:194,attack:.65,h:146,r:32,intent:'장승못과 터줏바람'},
 mourner:{name:'들린 상두꾼',role:'leaper',look:'mourner',cls:'knight',skills:['HMO01','HMO02'],hp:164,attack:.60,h:120,r:26,intent:'곡소리와 상여추'}
};
const THEMED=[
 ['hound','bat','crow','stag'],
 ['bat','crow','hound','stag'],
 ['hound','boar','crow','bat'],
 ['hound','human','boar','crow'],
 ['crow','stag','bat','lantern'],
 ['boar','crow','hound','bat'],
 ['human','hound','crow','stag'],
 ['hound','crow','mourner','warden'],
 ['hound','boar','crow','lantern'],
 ['stag','crow','hound','shade']
];
function selectInitialSpawns(spawns,cap){
 const groups=[];for(const sp of spawns){let g=groups.find(x=>x.id===sp.cluster);if(!g){g={id:sp.cluster,items:[]};groups.push(g);}g.items.push(sp);}const out=[];let depth=0;
 while(out.length<cap){let added=false;for(const g of groups){if(out.length>=cap)break;if(g.items[depth]){out.push(g.items[depth]);added=true;}}if(!added)break;depth++;}
 return out;
}
function top(b,x,reference,support){return G.HonroMapEngine.surfaceY(b.terrain,x,reference,support)?.y??b.height-150;}
function createEnemy(b,st,x,kind,index,y,absolute=false){const def=ARCHETYPES[kind]||ARCHETYPES.ghost,u=C.makeEnemy({role:def.role,x,y:y??top(b,x)},b.terrain,C.STAGES[st.id-1],index);const mult=C.DIFFICULTIES[b.difficulty]||C.DIFFICULTIES.normal;
 Object.assign(u,{id:'foe-'+index,name:def.name,honroType:def.look,h:def.h,r:def.r,x,y:y??top(b,x),awake:false,aggroUntil:0,group:Math.floor(x/(st.w/4)),fixed:!!def.flying,elite:st.id===1?false:index%11===10,cls:def.cls||u.cls,loadout:[...(def.skills||u.loadout)],intent:def.intent||u.intent,honroVariant:def.variant||kind});u.ranks={...u.ranks};for(const sid of u.loadout)u.ranks[sid]=Math.max(1,Math.min(4,1+Math.floor((st.level-1)/3)));
 if(def.flying&&!absolute)u.y-=170+(index%3)*85;
 C.migrateEnemySkills(u);u.armor=u.elite?.12:.04;u.spawnX=u.x;u.spawnY=u.y;u.honroDifficulty=b.difficulty;u.level=Math.floor(G.HonroProgression.plan(st.id).entryLevel);G.HonroProgression.tuneEnemy(st,u,kind);G.HonroProgression.enemyXP(b,u);C.migrateEnemySkills(u);return u;
}
function ally(b,st,id,role,x,y){
 const cls=role==='ritualist'||role==='healer'||role==='daoist'?'mage':role==='medium'?'occultist':'knight';
 const names={porter:'만석',guard:'노위',archer:'철언',healer:'단비',ritualist:'보각',daoist:'담허',medium:'소단',scout:'나루지기'};
 const loadout=cls==='knight'?['S01','S09']:cls==='occultist'?['O01','O06']:role==='daoist'?['M01','M06']:['M01'];
 const level=st.recruit===cls?G.HonroProgression.joinLevel(st):Math.max(1,Math.floor(G.HonroProgression.plan(st.id)?.entryLevel||st.level||1));
 const u=C.makeUnit(cls,2,x,y??top(b,x),{id,name:names[role]||'동맹',level,loadout:[...loadout]});
 const ref=G.HonroProgression.referenceStats(st),profile={guard:[1.34,.70,.18],porter:[.98,.48,.08],healer:[.82,.30,.06],ritualist:[.90,.44,.08],daoist:[1.06,.62,.09],medium:[1.00,.60,.08],scout:[.90,.48,.08]}[role]||[.90,.48,.08];
 let hp=Math.round(ref.hp*profile[0]),attack=ref.attack*profile[1],armor=profile[2];
 if(id==='npc-damheo'){hp=Math.round(hp*1.18);attack*=1.15;armor=.12;}
 if(id==='npc-hwigyeom'){hp=Math.round(hp*1.32);attack*=1.20;armor=.24;}
 Object.assign(u,{honroAlly:true,allyRole:role,honroType:'ally',role:'ally-'+role,fixed:false,hp,maxHp:hp,focus:160,maxFocus:160,attack,armor,r:20,h:90,acted:true,allyState:'follow',awake:true,group:-1,damageBy:{},spawnX:x,spawnY:y??top(b,x)});
 for(const sid of loadout)u.ranks[sid]=Math.max(1,Math.min(4,1+Math.floor((level-1)/2)));
 C.migrateEnemySkills(u);return u;
}
function midboss(b,st,id,name,kind,x,y){const u=createEnemy(b,st,x,kind,900+st.id,y,true);Object.assign(u,{id,name,awake:true,aggroUntil:999,group:-3,honroMidboss:true,elite:true});u.armor=Math.max(u.armor||0,.14);G.HonroProgression.tuneMidboss(b,st,u);u.spawnX=u.x;u.spawnY=u.y;return u;}

function trainingWorld(st,profile,cls,skill,legacy){
 const b=legacy(st,profile,true,cls,skill);Object.assign(b,{width:5600,height:2300,practiceCombat:true,practiceWind:7,enemyLimit:2,honroRevision:20,terrain:[],waters:[],drafts:[],decor:[],honroLandmarks:[],honroSurfaceZones:[]});
 const floor=(id,x,w,y,slope=0)=>b.terrain.push({id,x,y,w,h:2300-y,mat:'rock',slope,hp:99999,maxHp:99999,indestructible:true,route:true});
 floor('training-west',0,620,1400);floor('training-descent',620,530,1400,240);floor('training-stream-bed',1150,550,1640);
 floor('training-ridge-ascent',1700,700,1640,-520);floor('training-ridge',2400,560,1120);floor('training-ridge-descent',2960,680,1120,470);
 floor('training-lake-bed',3640,810,1590);floor('training-east-ascent',4450,750,1590,-350);floor('training-east',5200,400,1240);
 // One continuous polygon keeps the hill, valley and ground shading connected.
 const ground=b.terrain,crest=ground.map(t=>({x:t.x,y:t.y}));crest.push({x:5600,y:1240});
 b.terrain=[{id:'training-ground',x:0,y:1120,w:5600,h:1580,vertices:[...crest,{x:5600,y:2700},{x:0,y:2700}],mat:'rock',hp:99999,maxHp:99999,indestructible:true,route:true}];
 ground.forEach((t,i)=>{const a=[t.x,t.y],z=[t.x+t.w,t.y+(t.slope||0)];b.honroSurfaceZones.push({id:'training-surface-'+i,kind:['grass-mass','moss-mass','mud-mass','exposed-rock-mass','stone-road','dry-grass-mass','mud-mass','grass-mass','moss-mass'][i],points:[a,z,[z[0],z[1]+65],[a[0],a[1]+65]],surface:[a,z],attached:true});});
 const ledge=(id,x,y,w)=>b.terrain.push({id,x,y,w,h:22,mat:'wood',hp:210,maxHp:210,oneWay:true,route:true});
 ledge('training-bridge',1180,1450,450);ledge('training-perch',2540,890,210);ledge('training-lake-ledge',3860,1380,230);
 b.terrain.push({id:'training-barrel',x:2820,y:1060,w:45,h:60,mat:'barrel',hp:48,maxHp:48});
 for(const [x,y,w,depth] of [[1150,1530,550,110],[3640,1480,810,110]]){
  b.waters.push({x,y,w,depth,frozen:0,kind:'water',conductive:true,bottom:[{x,y:y+depth},{x:x+w,y:y+depth}]});
  b.honroSurfaceZones.push({id:'training-water-'+x,kind:'water-pool',points:[[x,y],[x+w,y],[x+w,y+depth],[x,y+depth]],surface:[[x,y],[x+w,y]],bottom:[[x,y+depth],[x+w,y+depth]],attached:true});
 }
 b.drafts.push({x:1840,y:950,w:160,h:570,force:260});
 for(const [kind,x,size] of [['giantPine',130,1.1],['forestPath',550,1.4],['waterShrine',1370,.8],['rockPile',1840,1.1],['gate',2490,.8],['deadPines',2920,1.3],['watchtower',3320,.9],['reeds',3900,1.2],['waterShrine',4270,1],['Pines',4970,1.4],['ruin',5410,1],['giantPine',2770,.65]])b.honroLandmarks.push({kind,x,y:top(b,x,2200),size,layer:'back'});
 for(const x of [450,860,1770,2230,3050,4540,5080,5480])b.honroLandmarks.push({kind:'fernPatch',x,y:top(b,x,2200),size:1.3,layer:'prop'});
 const hero=b.units.find(u=>u.side===0);b.units=[hero];C.applyHero(hero,b.heroes[cls],true);Object.assign(hero,{x:340,y:1400,spawnX:340,spawnY:1400,acted:false,cooldowns:{},vx:0,vy:0});
 const kinds=['human','hound','crow','ghost','warden','bat','boar','lantern','shade','human','stag','mourner'];
 [760,1180,1560,2110,2590,2870,3320,3820,4170,4610,5010,5380].forEach((x,i)=>{
  const u=createEnemy(b,{...st,w:b.width},x,kinds[i],i,top(b,x)),elite=i===4,hp=elite?3400:130+(i%4)*45;
  u.name=elite?'정예 산지기 · 수련':u.name+' · 수련';
  Object.assign(u,{hp,maxHp:hp,attack:elite?1.05:.72,armor:elite?.12:.04,elite,awake:true,aggroUntil:0,group:Math.floor(x/1200),cooldowns:{},focus:180,maxFocus:180});b.units.push(u);
 });
 b.active=hero.id;b.sceneVersion++;return b;
}
function build(st,profile,training,cls,skill,legacy){
 if(training)return trainingWorld(st,profile,cls,skill,legacy);
 const project=G.HONRO_PROJECT,map=project.stages.find(s=>s.metadata.stageId===st.id);
 if(!map)throw Error('Missing canonical stage '+st.id);
 return G.HonroMaps.createBattle(map,project,profile);
}

G.HonroWorld={build,top,createEnemy,ally,archetypes:ARCHETYPES};
})(globalThis);
