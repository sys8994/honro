(function(G){'use strict';
// Campaign storage has one writer and one failure owner. Failed bytes stay private
// until explicitly downloaded or replaced; temporary title defaults are never saved.
const C=G.HONRO_CORE,ROSTER=['archer','mage','knight','occultist'],KEY='honro-first-act-profile-1';
    function fresh() { const p = C.defaults(); for (const c of ROSTER)
        C.sanitizeLoadout(p, c); p.saved = null; p.cleared = {}; p.party = ['archer']; p.recruited = ['archer']; p.lastStage = 1; p.mapNode = 1; p.schema = 4; p.game = 'honro'; p.seen = {}; p.record = []; p.honroFlags = {}; p.settings = { ...p.settings, orientation: 'auto', music: true, musicVolume: .65, speed: 1.5, playerSpeed: 1.5, sound: true, volume: .55, minimapVisible: true, debugTerrainOutline: false }; return p; }
    function migrateGrowth(p,revision){
        for(const roster of [p.heroes,p.saved?.heroes,p.honroBattle?.heroes])if(roster)for(const cls of ROSTER){const hero=roster[cls];if(!hero)continue;if(!Number.isInteger(hero.statTraining))hero.statTraining=Object.values(hero.statRanks||{}).reduce((sum,n)=>sum+(Number.isInteger(n)&&n>0?n:0),0);delete hero.statRanks;}
        if(revision>=13)return;
        const convert=revision<=10?C.migrateLegacyXp9:C.migrateXp12;
        const oldBattleXp=new Map([p.saved,p.honroBattle].filter(Boolean).map(b=>[b,Math.max(...ROSTER.map(cls=>Number.isFinite(b.heroes?.[cls]?.xp)?b.heroes[cls].xp:0))]));
        for(const roster of [p.heroes,p.saved?.heroes,p.honroBattle?.heroes])if(roster)for(const cls of ROSTER){const hero=roster[cls];if(hero&&Number.isFinite(hero.xp))hero.xp=convert(hero.xp);}
        for(const battle of [p.saved,p.honroBattle])if(battle){
            if(battle.startXP)for(const cls of ROSTER)if(Number.isFinite(battle.startXP[cls]))battle.startXP[cls]=convert(battle.startXP[cls]);
            if(battle.honroGrowth?.limit){
                const newHero=Math.max(...ROSTER.map(cls=>Number.isFinite(battle.heroes?.[cls]?.xp)?battle.heroes[cls].xp:0));
                const shift=Math.max(0,newHero-(oldBattleXp.get(battle)||0));battle.honroGrowth.limit.start+=shift;battle.honroGrowth.limit.end+=shift;
            }
        }
        p.revision=13;
    }

function failure(reason){return Object.assign(new Error('Profile '+reason),{profileReason:reason});}
function migrate(text){
 let x;try{x=JSON.parse(text);}catch{throw failure('parse');}
 if(!x||typeof x!=='object'||Array.isArray(x)||x.game!=='honro'||!x.heroes||typeof x.heroes!=='object'||Array.isArray(x.heroes)||!Array.isArray(x.recruited)||!x.recruited.includes('archer'))throw failure('format');
 if(![1,2,3,4].includes(x.schema))throw failure('version');
 try{
  const p=fresh();Object.assign(p,x);p.schema=4;p.settings={...fresh().settings,...x.settings};
  C.migrateSkills(p);migrateGrowth(p,x.revision||12);G.HonroCampaignMapRevision.discard(p);
  G.HonroProgression.repairRecruits(p);G.HonroProgression.reconcileCampAllocations(p);return p;
 }catch{throw failure('migration');}
}
function create(){
 let raw=null,locked=false,reason=null,kind=G.HONRO_EMBEDDED?'embedded':'absent',retryCandidate=null;
 const fail=code=>{locked=true;reason=code;kind='failed';};
 function read(){
  let text;try{text=G.localStorage.getItem(KEY);}catch{throw failure('read');}
  // Capture the first readable bytes before parsing, including an invalid empty string.
  if(raw===null&&text!==null)raw=text;
  return text===null?null:migrate(text);
 }
 let initial;
 if(!G.HONRO_EMBEDDED){try{initial=read();if(initial)kind='ready';}catch(e){fail(e.profileReason);}}
 initial??=fresh();
 function write(profile){
  let text;try{text=JSON.stringify(profile);G.localStorage.setItem(KEY,text);}catch{throw failure('write');}
  raw=text;locked=false;reason=null;kind='ready';retryCandidate=null;return profile;
 }
 function replace(make){
  if(G.HONRO_EMBEDDED)return{ok:false,reason:'embedded'};
  try{const candidate=make();candidate.party=[...candidate.recruited];const profile=write(candidate);return{ok:true,profile};}catch(e){return{ok:false,reason:e.profileReason||'migration'};}
 }
 return{
  initial,
  get locked(){return locked;},
  get state(){return{kind,reason,hasOriginal:typeof raw==='string'};},
  save(profile){if(G.HONRO_EMBEDDED||locked)return false;try{write(profile);return true;}catch{fail('write');return false;}},
  importText(text){return replace(()=>migrate(text));},
  newJourney(){return replace(fresh);},
  original(){return typeof raw==='string'?{ok:true,text:raw}:{ok:false};},
  retry(){
   retryCandidate=null;
   try{const profile=read();if(!profile)return{ok:false,reason:'absent'};retryCandidate=profile;return{ok:true};}
   catch(e){reason=e.profileReason;return{ok:false,reason};}
  },
  confirmRetry(){return retryCandidate?replace(()=>retryCandidate):{ok:false,reason:'read'};},
  cancelRetry(){retryCandidate=null;}
 };
}
G.HonroProfileStore={create,fresh,migrate};
})(globalThis);
