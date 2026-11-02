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
// Cache only the deterministic hash, never asset validation: every save still
// serializes the current provider and battle art and compares their full serialized text.
// A provider mutation therefore invalidates this entry before it can be reused.
// Keep at most 9 million UTF-16 code units and prefer the largest source texts.
const PROVIDER_HASH_CACHE_LIMIT=9000000,providerHashCache=new Map();let providerHashChars=0;
function providerSignature(key,text){
 const previous=typeof key==='string'?providerHashCache.get(key):null;
 if(previous&&previous.text===text)return previous.signature;
 if(previous){providerHashCache.delete(key);providerHashChars-=previous.size;}
 return assetSignature(text);
}
// Only publish after a live placement has matched this provider exactly.
function rememberProviderSignature(key,text,signature){
 if(typeof key!=='string'||providerHashCache.has(key)||typeof text!=='string')return;
 const size=key.length+text.length;if(size>PROVIDER_HASH_CACHE_LIMIT)return;
 while(providerHashChars+size>PROVIDER_HASH_CACHE_LIMIT){
  let smallest=null;for(const entry of providerHashCache)if(!smallest||entry[1].size<smallest[1].size)smallest=entry;
  if(!smallest||smallest[1].size>=size)return;
  providerHashCache.delete(smallest[0]);providerHashChars-=smallest[1].size;
 }
 providerHashCache.set(key,{text,signature,size});providerHashChars+=size;
}
// Exact archived 33 QA art; never apply to custom or arbitrary signatures.
const ACT4_33_LEGACY=Object.freeze({'approved33:near-west':'446435:980e0bba','approved33:body':'2183752:7b7b6e'});
function legacy33Art(b,id,signature,library){
 if(!b||b.honroCustom||b.mode!=='campaign'||b.honroAct4Official!==1||b.honroStage!==33||typeof signature!=='string'||ACT4_33_LEGACY[id]!==signature)return null;
 const archived=library.get('act4compat33:v1:'+id);if(!archived?.vector||archived.collision?.length||archived.interactionType)return null;
 const asset={...archived,id},text=JSON.stringify(asset);if(assetSignature(text)!==signature)return null;return{asset,text,signature};
}
function needsLegacy33Art(b){
 if(!b||b.honroCustom||b.mode!=='campaign'||b.honroAct4Official!==1||b.honroStage!==33)return false;
 for(const items of [b.honroLandmarks,b.honroElements,b.honroEnvironment?.placements])for(const item of items||[]){
  const a=item?.asset,sig=ACT4_33_LEGACY[a?.id];if(!sig)continue;
  if(a.honroStaticAssetRef===1&&a.signature===sig)return true;
  if(a.vector&&assetSignature(JSON.stringify(a))===sig)return true;
 }
 return false;
}
function verifyLegacy33Assets(items){
 if(!Array.isArray(items)||items.length!==2)return false;const library=new Map(items.map(a=>[a?.id,a]));
 if(library.size!==2)return false;const b={mode:'campaign',honroAct4Official:1,honroStage:33};
 return Object.entries(ACT4_33_LEGACY).every(([id,sig])=>!!legacy33Art(b,id,sig,library));
}
// Only the exact previous official stage-34 BODY can use this lazy archive.
const ACT4_34_LEGACY=Object.freeze({'approved34:body':'3417265:bff32c0d'});
function legacy34Art(b,id,signature,library){
 if(!b||b.honroCustom||b.mode!=='campaign'||b.honroAct4Official!==1||b.honroStage!==34||typeof signature!=='string'||ACT4_34_LEGACY[id]!==signature)return null;
 const archived=library.get('act4compat34:v1:'+id);if(!archived?.vector||archived.collision?.length||archived.interactionType)return null;
 const asset={...archived,id},text=JSON.stringify(asset);if(assetSignature(text)!==signature)return null;return{asset,text,signature};
}
function needsLegacy34Art(b){
 if(!b||b.honroCustom||b.mode!=='campaign'||b.honroAct4Official!==1||b.honroStage!==34)return false;
 for(const items of [b.honroLandmarks,b.honroElements,b.honroEnvironment?.placements])for(const item of items||[]){
  const a=item?.asset,sig=ACT4_34_LEGACY[a?.id];if(!sig)continue;
  if(a.honroStaticAssetRef===1&&a.signature===sig)return true;
  if(a.vector&&assetSignature(JSON.stringify(a))===sig)return true;
 }
 return false;
}
function verifyLegacy34Assets(items){
 if(!Array.isArray(items)||items.length!==1)return false;const library=new Map(items.map(a=>[a?.id,a]));
 if(library.size!==1)return false;const b={mode:'campaign',honroAct4Official:1,honroStage:34};
 return Object.entries(ACT4_34_LEGACY).every(([id,sig])=>!!legacy34Art(b,id,sig,library));
}
// Acts 1–2 use a self-contained table inside each snapshot. It never looks up
// current provider artwork: old saves and portable exports retain exact art.
const localCampaignArt=b=>!!b&&!b.honroCustom&&b.honroMapOrigin!=='workshop'&&b.mode==='campaign'&&Number.isInteger(b.honroStage)&&b.honroStage>=1&&b.honroStage<=20;
const localArtAsset=a=>!!a&&typeof a.id==='string'&&(a.id.startsWith('act1-traced:')||a.id.startsWith('act2-traced:'))&&a.vector&&Array.isArray(a.collision)&&a.collision.length===0&&!a.interactionType&&a.honroStaticAssetRef===undefined&&a.honroLocalArtRef===undefined;
const LOCAL_ART_HASH_CACHE_LIMIT=3000000,localArtHashCache=new Map();let localArtHashChars=0;
function localArtSignature(text){
 if(localArtHashCache.has(text))return localArtHashCache.get(text);
 const signature=assetSignature(text);if(text.length>LOCAL_ART_HASH_CACHE_LIMIT)return signature;
 while(localArtHashChars+text.length>LOCAL_ART_HASH_CACHE_LIMIT){const oldest=localArtHashCache.keys().next().value;localArtHashChars-=oldest.length;localArtHashCache.delete(oldest);}
 localArtHashCache.set(text,signature);localArtHashChars+=text.length;return signature;
}
function localArtItems(b){return[b?.honroLandmarks,b?.honroElements,b?.honroEnvironment?.placements].filter(Array.isArray).flat();}
function resolveLocalArt(b){
 const items=localArtItems(b),table=b?.honroLocalArtTable,hasTable=!!b&&Object.prototype.hasOwnProperty.call(b,'honroLocalArtTable');
 const refs=items.filter(item=>item?.asset?.honroLocalArtRef!==undefined);
 if(!hasTable&&!refs.length)return{table:false,replacements:[]};
 if(!localCampaignArt(b)||!hasTable||!table||table.version!==1||!Array.isArray(table.assets)||!table.assets.length||table.assets.length>32||Object.keys(table).some(k=>!['version','assets'].includes(k)))return null;
 if(!table.assets.every(localArtAsset))return null;
 // Provider references never belong in this self-contained local-table format.
 if(items.some(item=>item?.asset?.honroStaticAssetRef!==undefined))return null;
 const signatures=new Map(),used=new Set(),replacements=[];
 for(const item of refs){
  const ref=item.asset,index=ref.index;
  if(ref.honroLocalArtRef!==1||!Number.isInteger(index)||index<0||index>=table.assets.length||typeof ref.id!=='string'||typeof ref.signature!=='string'||Object.keys(ref).some(k=>!['honroLocalArtRef','index','id','signature'].includes(k)))return null;
  const source=table.assets[index];if(source.id!==ref.id)return null;
  if(!signatures.has(index))signatures.set(index,assetSignature(JSON.stringify(source)));
  if(signatures.get(index)!==ref.signature)return null;
  used.add(index);replacements.push([item,source]);
 }
 if(used.size!==table.assets.length)return null;
 return{table:true,replacements};
}
function restoreLocalArt(b){
 const local=resolveLocalArt(b);if(!local)return false;
 for(const[item,source]of local.replacements)item.asset=structuredClone(source);
 if(local.table)delete b.honroLocalArtTable;
 return true;
}
function compactLocalArt(b){
 const existing=resolveLocalArt(b);if(!existing)throw Error('Invalid local art table');if(existing.table)return b;
 const rows=new Map(),placements=new Map();
 for(const item of localArtItems(b))if(localArtAsset(item?.asset)){
  const text=JSON.stringify(item.asset);if(text.length<128)continue;
  let row=rows.get(text);if(row)row.count++;else{row={text,count:1};rows.set(text,row);}placements.set(item,row);
 }
 const shared=[...rows.values()].filter(row=>row.count>1);if(!shared.length||shared.length>32)return b;
 const table={version:1,assets:shared.map(row=>JSON.parse(row.text))};
 shared.forEach((row,index)=>{row.ref={honroLocalArtRef:1,index,id:table.assets[index].id,signature:localArtSignature(row.text)};});
 const compactItems=items=>items.map(item=>{const row=placements.get(item);return row?.ref?{...item,asset:{...row.ref}}:item;});
 const out={...b,honroLocalArtTable:table};
 for(const key of ['honroLandmarks','honroElements'])if(Array.isArray(b[key]))out[key]=compactItems(b[key]);
 if(Array.isArray(b.honroEnvironment?.placements))out.honroEnvironment={...b.honroEnvironment,placements:compactItems(b.honroEnvironment.placements)};
 return out;
}
function compactBattleArt(b){
 if(localCampaignArt(b))return compactLocalArt(b);
 if(!b||b.honroCustom||b.mode!=='campaign'||b.honroAct4Official!==1||b.honroStage<31||b.honroStage>40)return b;
 const library=new Map((G.HONRO_PROJECT?.library||[]).map(a=>[a.id,a])),texts=new Map();let changed=false;const out={...b};
 const compactItems=items=>items.map(item=>{
  const asset=item.asset,source=asset?.vector&&library.get(asset.id);if(!source)return item;
  const key=asset.id;let row=texts.get(key);if(!row){const text=JSON.stringify(source);row={text,signature:providerSignature(key,text)};texts.set(asset.id,row);}
  const assetText=JSON.stringify(asset);if(assetText!==row.text){const legacy=legacy33Art(b,asset.id,ACT4_33_LEGACY[asset.id],library)||legacy34Art(b,asset.id,ACT4_34_LEGACY[asset.id],library);if(!legacy||assetText!==legacy.text)return item;row=legacy;}else rememberProviderSignature(key,row.text,row.signature);
  changed=true;return{...item,asset:{honroStaticAssetRef:1,id:asset.id,signature:row.signature}};
 });
 for(const key of ['honroLandmarks','honroElements'])if(Array.isArray(b[key]))out[key]=compactItems(b[key]);
 if(Array.isArray(b.honroEnvironment?.placements))out.honroEnvironment={...b.honroEnvironment,placements:compactItems(b.honroEnvironment.placements)};
 return changed?out:b;
}
function restoreBattleArt(b){
 const local=resolveLocalArt(b);if(!local)return false;
 const library=new Map((G.HONRO_PROJECT?.library||[]).map(a=>[a.id,a])),signatures=new Map(),replacements=[...local.replacements];
 for(const items of [b?.honroLandmarks,b?.honroElements,b?.honroEnvironment?.placements])for(const item of items||[]){
  const ref=item.asset;if(!ref||ref.honroStaticAssetRef===undefined)continue;
  if(ref.honroStaticAssetRef!==1||typeof ref.id!=='string'||typeof ref.signature!=='string')return false;
  let source=library.get(ref.id);if(!source)return false;
  if(!signatures.has(ref.id))signatures.set(ref.id,assetSignature(JSON.stringify(source)));
  if(signatures.get(ref.id)!==ref.signature){const legacy=legacy33Art(b,ref.id,ref.signature,library)||legacy34Art(b,ref.id,ref.signature,library);if(!legacy)return false;source=legacy.asset;}
  replacements.push([item,source]);
 }
 // Resolve only after campaign lazy loading and revision checks, atomically.
 for(const[item,source]of replacements)item.asset=structuredClone(source);
 if(local.table)delete b.honroLocalArtTable;
 return true;
}
function failure(reason){return Object.assign(new Error('Profile '+reason),{profileReason:reason});}
function migrate(text){
 let x;try{x=JSON.parse(text);}catch{throw failure('parse');}
 if(!x||typeof x!=='object'||Array.isArray(x)||x.game!=='honro'||!x.heroes||typeof x.heroes!=='object'||Array.isArray(x.heroes)||!Array.isArray(x.recruited)||!x.recruited.includes('archer'))throw failure('format');
 if(x.schema===5&&!x.equipment)throw failure('format');
 if(![1,2,3,4,5].includes(x.schema))throw failure('version');
 try{
  // Expand before returning memory state. Exports stay in the original inline
  // format and require no lazy/current art provider for local snapshots.
  if(!restoreLocalArt(x.honroBattle))throw Error('Invalid local art table');
  const p=fresh();Object.assign(p,x);p.schema=5;p.settings={...fresh().settings,...x.settings};
  C.migrateSkills(p);migrateGrowth(p,x.revision||12);G.HonroAct23V4?.migratePresentation(p);G.HonroCampaignMapRevision.discard(p);
  G.HonroProgression.repairRecruits(p);G.HonroProgression.reconcileCampAllocations(p);if(x.equipment===undefined)delete p.equipment;G.HonroEquipment.migrate(p);return p;
 }catch{throw failure('migration');}
}
// Immutable local raw archives for Act4 map revision transitions. No index,
// deletion or overwrite. Exact bytes, not a hash alone, determine deduplication.
const ARCHIVE_PREFIX=KEY+'-act4-before-map-revision-3-';
function archiveMetadata(text){
 try{const p=JSON.parse(text),b=p?.honroBattle;
  if(!b||b.honroCustom||b.honroMapOrigin==='workshop'||b.mode!=='campaign'||b.honroStage<31||b.honroStage>40)return null;
  return {stage:b.honroStage,fromRevision:b.honroCampaignMapRevision??null,toRevision:G.HonroCampaignMapRevision.current(b.honroStage)};
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
G.HonroProfileStore={create,fresh,migrate,compactBattleArt,restoreBattleArt,needsLegacy33Art,verifyLegacy33Assets,needsLegacy34Art,verifyLegacy34Assets};
})(globalThis);
