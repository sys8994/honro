(function(G){'use strict';
// Campaign storage has one writer and one failure owner. Failed bytes stay private
// until explicitly downloaded or replaced; temporary title defaults are never saved.
const C=G.HONRO_CORE,ROSTER=['archer','mage','knight','occultist'],KEY='honro-first-act-profile-1';
    function fresh() { const p = C.defaults(); for (const c of ROSTER)
        C.sanitizeLoadout(p, c); p.saved = null; p.cleared = {}; p.party = ['archer']; p.recruited = ['archer']; p.lastStage = 1; p.mapNode = 1; p.schema = 5; p.game = 'honro'; p.seen = {}; p.record = []; p.honroFlags = {}; p.settings = { ...p.settings, orientation: 'auto', music: true, musicVolume: .65, speed: 1.5, playerSpeed: 1.5, sound: true, volume: .55, minimapVisible: true, debugTerrainOutline: false }; return G.HonroEquipment.fresh(p); }
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

// Only official Act4 snapshots reference immutable, already-shipped artwork.
// Physics, mutable actor/event state and modified/custom assets remain inline.
function assetSignature(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return text.length+':'+(h>>>0).toString(16);}
function compactBattleArt(b){
 if(!b||b.honroCustom||b.mode!=='campaign'||b.honroAct4Official!==1||b.honroStage<31||b.honroStage>40)return b;
 const library=new Map((G.HONRO_PROJECT?.library||[]).map(a=>[a.id,a])),texts=new Map();let changed=false;const out={...b};
 const compactItems=items=>items.map(item=>{
  const asset=item.asset,source=asset?.vector&&library.get(asset.id);if(!source)return item;
  let row=texts.get(asset.id);if(!row){const text=JSON.stringify(source);row={text,signature:assetSignature(text)};texts.set(asset.id,row);}
  if(JSON.stringify(asset)!==row.text)return item;
  changed=true;return{...item,asset:{honroStaticAssetRef:1,id:asset.id,signature:row.signature}};
 });
 for(const key of ['honroLandmarks','honroElements'])if(Array.isArray(b[key]))out[key]=compactItems(b[key]);
 if(Array.isArray(b.honroEnvironment?.placements))out.honroEnvironment={...b.honroEnvironment,placements:compactItems(b.honroEnvironment.placements)};
 return changed?out:b;
}
function restoreBattleArt(b){
 const library=new Map((G.HONRO_PROJECT?.library||[]).map(a=>[a.id,a])),signatures=new Map(),replacements=[];
 for(const items of [b?.honroLandmarks,b?.honroElements,b?.honroEnvironment?.placements])for(const item of items||[]){
  const ref=item.asset;if(!ref||ref.honroStaticAssetRef===undefined)continue;
  if(ref.honroStaticAssetRef!==1||typeof ref.id!=='string'||typeof ref.signature!=='string')return false;
  const source=library.get(ref.id);if(!source)return false;
  if(!signatures.has(ref.id))signatures.set(ref.id,assetSignature(JSON.stringify(source)));
  if(signatures.get(ref.id)!==ref.signature)return false;
  replacements.push([item,source]);
 }
 // Resolve only after campaign lazy loading and revision checks, atomically.
 for(const[item,source]of replacements)item.asset=structuredClone(source);
 return true;
}
function failure(reason){return Object.assign(new Error('Profile '+reason),{profileReason:reason});}
function migrate(text){
 let x;try{x=JSON.parse(text);}catch{throw failure('parse');}
 if(!x||typeof x!=='object'||Array.isArray(x)||x.game!=='honro'||!x.heroes||typeof x.heroes!=='object'||Array.isArray(x.heroes)||!Array.isArray(x.recruited)||!x.recruited.includes('archer'))throw failure('format');
 if(x.schema===5&&!x.equipment)throw failure('format');
 if(![1,2,3,4,5].includes(x.schema))throw failure('version');
 try{
  const p=fresh();Object.assign(p,x);p.schema=5;p.settings={...fresh().settings,...x.settings};
  C.migrateSkills(p);migrateGrowth(p,x.revision||12);G.HonroAct23V4?.migratePresentation(p);G.HonroCampaignMapRevision.discard(p);
  G.HonroProgression.repairRecruits(p);G.HonroProgression.reconcileCampAllocations(p);if(x.equipment===undefined)delete p.equipment;G.HonroEquipment.migrate(p);return p;
 }catch{throw failure('migration');}
}
// Immutable local raw archives for the Act4 revision3 transition. No index,
// deletion or overwrite. Exact bytes, not a hash alone, determine deduplication.
const ARCHIVE_PREFIX=KEY+'-act4-before-map-revision-3-';
function archiveMetadata(text){
 try{const p=JSON.parse(text),b=p?.honroBattle;
  if(!b||b.honroCustom||b.honroMapOrigin==='workshop'||b.mode!=='campaign'||b.honroStage<31||b.honroStage>40)return null;
  return {stage:b.honroStage,fromRevision:b.honroCampaignMapRevision??null,toRevision:3};
 }catch{return null;}
}
function archiveRows(){
 const storage=G.localStorage;if(!Number.isInteger(storage.length)||typeof storage.key!=='function')throw failure('archive-storage');
 const rows=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(typeof key!=='string'||!key.startsWith(ARCHIVE_PREFIX))continue;const text=storage.getItem(key);if(typeof text!=='string')throw failure('archive-storage');rows.push({key,text,metadata:archiveMetadata(text)});}
 return rows.sort((a,b)=>a.key.localeCompare(b.key));
}
function needsArchive(text){const m=archiveMetadata(text);if(!m)return false;try{return G.HonroCampaignMapRevision.current(m.stage)>=3&&G.HonroCampaignMapRevision.obsolete(JSON.parse(text).honroBattle);}catch{return false;}}
function preserveOriginal(text){
 if(typeof text!=='string'||!needsArchive(text))return;
 try{const duplicate=archiveRows().find(row=>row.text===text);if(duplicate){if(G.localStorage.getItem(duplicate.key)!==text)throw failure('archive-verify');return;}
  const stem=ARCHIVE_PREFIX+assetSignature(text).replace(':','-');let key=stem,suffix=0;
  while(G.localStorage.getItem(key)!==null)key=stem+'-'+(++suffix);
  G.localStorage.setItem(key,text);
  if(G.localStorage.getItem(key)!==text)throw failure('archive-verify');
 }catch(e){throw failure(e.profileReason||'archive-storage');}
}
function create(){
 let raw=null,locked=false,reason=null,kind=G.HONRO_EMBEDDED?'embedded':'absent',retryCandidate=null;
 const fail=code=>{locked=true;reason=code;kind='failed';};
 function read(){
  let text;try{text=G.localStorage.getItem(KEY);}catch{throw failure('read');}
  // Capture the first readable bytes before parsing, including an invalid empty string.
  if(raw===null&&text!==null)raw=text;
  if(text===null)return null;const profile=migrate(text);preserveOriginal(text);return profile;
 }
 let initial;
 if(!G.HONRO_EMBEDDED){try{initial=read();if(initial)kind='ready';}catch(e){fail(e.profileReason);}}
 initial??=fresh();
 function write(profile){
  let text;try{preserveOriginal(G.localStorage.getItem(KEY));text=JSON.stringify({...profile,honroBattle:compactBattleArt(profile.honroBattle)});G.localStorage.setItem(KEY,text);}catch(e){if(e.profileReason?.startsWith('archive-')){fail(e.profileReason);throw e;}throw failure('write');}
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
  save(profile){if(G.HONRO_EMBEDDED||locked)return false;try{write(profile);return true;}catch{return false;}},
  importText(text){return replace(()=>{const p=migrate(text);preserveOriginal(text);return p;});},
  newJourney(){return replace(fresh);},
  archives(){try{return{ok:true,items:archiveRows().map(({key,metadata})=>({key,metadata}))};}catch{return{ok:false,reason:'archive-storage'};}},
  archive(key){try{if(typeof key!=='string'||!key.startsWith(ARCHIVE_PREFIX))return{ok:false};const text=G.localStorage.getItem(key);return typeof text==='string'?{ok:true,text,metadata:archiveMetadata(text)}:{ok:false};}catch{return{ok:false,reason:'archive-storage'};}},
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
G.HonroProfileStore={create,fresh,migrate,compactBattleArt,restoreBattleArt};
})(globalThis);
