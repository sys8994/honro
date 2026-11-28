import{yieldIfNeeded}from"../../web/runtime/load-data.36ebfa6c4287ef7a.js";(function(G){'use strict';
// Campaign storage has one writer and one failure owner. Failed bytes stay private
// until explicitly downloaded or replaced; temporary title defaults are never saved.
const C=G.HONRO_CORE,ROSTER=['archer','mage','knight','occultist'],KEY=G.HonroTopview?.profileKey || 'honro-first-act-profile-1';
    function fresh() { const p = C.defaults(); for (const c of ROSTER)
        C.sanitizeLoadout(p, c); p.saved = null; p.cleared = {}; p.party = ['archer']; p.recruited = ['archer']; p.lastStage = 1; p.mapNode = 1; p.schema = 5; p.game = 'honro'; p.seen = {}; p.record = []; p.honroFlags = {}; p.settings = { ...p.settings, orientation: 'auto', music: true, musicVolume: .65, speed: 1.5, playerSpeed: 1.5, sound: true, volume: .55, minimapVisible: true, debugTerrainOutline: false, haptics: true }; return G.HonroEquipment.fresh(p); }
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

// Official late-act snapshots reference immutable, shipped artwork.
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
// Stage 32 only. Neither unidentified old art nor workshop art can use this archive route.
const ACT4_32_LEGACY=Object.freeze({"approved32:body":"1952606:e60eb3e5","approved32:wood-door-extract":"423282:b2c53b27","act4-handoff:32:body":"843583:aede1464"});
const legacy32Scope=b=>!!b&&b.mode==='campaign'&&b.honroStage===32&&b.honroAct4Official===1&&b.honroMapOrigin==='campaign'&&!b.honroCustom;
function legacy32Art(b,id,signature,library){
 if(!legacy32Scope(b)||!Object.hasOwn(ACT4_32_LEGACY,id)||signature!==ACT4_32_LEGACY[id])return null;
 const archived=library.get('act4compat32:v1:'+id);if(!archived?.vector||archived.collision?.length||archived.interactionType)return null;
 const asset={...archived,id},text=JSON.stringify(asset);if(assetSignature(text)!==signature)return null;return{asset,text,signature};
}
function needsLegacy32Art(b){
 if(!legacy32Scope(b))return false;
 for(const items of [b.honroLandmarks,b.honroElements,b.honroEnvironment?.placements])if(Array.isArray(items))for(const item of items){
  const a=item?.asset;if(a?.honroStaticAssetRef===1&&Object.hasOwn(ACT4_32_LEGACY,a.id)&&a.signature===ACT4_32_LEGACY[a.id])return true;
 }
 return false;
}
function verifyLegacy32Assets(items){
 if(!Array.isArray(items)||items.length!==3)return false;
 const library=new Map(items.map(a=>[a?.id,a]));
 return library.size===3&&Object.entries(ACT4_32_LEGACY).every(([id,signature])=>{
  const a=library.get(id);return !!a?.vector&&!a.collision?.length&&!a.interactionType&&assetSignature(JSON.stringify(a))===signature;
 });
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
// Only the four reviewed Stage6 visual assets use its self-contained local table.
const STAGE6_LOCAL_ART_IDS=new Set(['stage06-prototype:continuous-body-v1','stage06-prototype:pier-west','stage06-prototype:pier-mid','stage06-prototype:pier-east']);
const localArtAsset=(a,b)=>!!a&&typeof a.id==='string'&&(a.id.startsWith('act1-traced:')||a.id.startsWith('act2-traced:')||a.id.startsWith('act2-compact:')||(b?.honroStage===11&&(a.id.startsWith('compact11:')||a.id.startsWith('act2-ch1:')))||(b?.honroStage===6&&STAGE6_LOCAL_ART_IDS.has(a.id)&&a.vector?.version===1))&&a.vector&&Array.isArray(a.collision)&&a.collision.length===0&&!a.interactionType&&a.honroStaticAssetRef===undefined&&a.honroLocalArtRef===undefined;
const localArtPlacement=item=>!STAGE6_LOCAL_ART_IDS.has(item?.asset?.id)||item.kind==='canonical-element';
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
 if(!table.assets.every(a=>localArtAsset(a,b)))return null;
 // Provider references never belong in this self-contained local-table format.
 if(items.some(item=>item?.asset?.honroStaticAssetRef!==undefined))return null;
 const signatures=new Map(),used=new Set(),replacements=[];
 for(const item of refs){
  const ref=item.asset,index=ref.index;if(!localArtPlacement(item))return null;
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
 for(const item of localArtItems(b))if(localArtAsset(item?.asset,b)&&localArtPlacement(item)){
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
 if(!b||b.honroCustom||b.mode!=='campaign')return b;
 const act4=b.honroAct4Official===1&&b.honroStage>=31&&b.honroStage<=40;
 const act5=b.honroAct5===1&&b.honroMapOrigin==='campaign'&&b.honroStage>=41&&b.honroStage<=50;
 if(!act4&&!act5)return b;
 const library=new Map((G.HONRO_PROJECT?.library||[]).map(a=>[a.id,a])),texts=new Map();let changed=false;const out={...b};
 const compactItems=items=>items.map(item=>{
  const asset=item.asset,source=asset?.vector&&library.get(asset.id);
   if(!source){const old=asset?.vector&&legacy32Art(b,asset.id,ACT4_32_LEGACY[asset.id],library);if(!old||JSON.stringify(asset)!==old.text)return item;
    changed=true;return{...item,asset:{honroStaticAssetRef:1,id:asset.id,signature:old.signature}};}
  const key=asset.id;let row=texts.get(key);if(!row){const text=JSON.stringify(source);row={text,signature:providerSignature(key,text)};texts.set(asset.id,row);}
  const assetText=JSON.stringify(asset);if(assetText!==row.text){const legacy=legacy33Art(b,asset.id,ACT4_33_LEGACY[asset.id],library)||legacy34Art(b,asset.id,ACT4_34_LEGACY[asset.id],library);if(!legacy||assetText!==legacy.text)return item;row=legacy;}else rememberProviderSignature(key,row.text,row.signature);
  changed=true;return{...item,asset:{honroStaticAssetRef:1,id:asset.id,signature:row.signature}};
 });
 for(const key of ['honroLandmarks','honroElements'])if(Array.isArray(b[key]))out[key]=compactItems(b[key]);
 if(Array.isArray(b.honroEnvironment?.placements))out.honroEnvironment={...b.honroEnvironment,placements:compactItems(b.honroEnvironment.placements)};
 return changed?out:b;
}
// Autosave fast path. compactBattleArt verifies each embedded art asset by full JSON text every save,
// and the caller first deep-clones the whole battle including that art (Act 5: 3-9M chars). Here each
// live asset object is verified once (same rule, via compactBattleArt on a one-item battle) and its
// provider reference is reused while the object and the battle's sceneVersion are unchanged. The
// result is a shallow battle whose matching art is already a reference: exactly what persist would
// write. Anything unverifiable keeps its inline asset and takes the ordinary path.
const lightRefs=new WeakMap();
function lightRef(b,item){
 const asset=item?.asset;if(!asset||typeof asset!=='object'||!asset.vector)return null;
 const key=b.honroStage+':'+(b.sceneVersion||0)+':'+b.honroMapOrigin,hit=lightRefs.get(asset);if(hit&&hit.key===key)return hit.ref;
 const probe=compactBattleArt({...b,honroLandmarks:[{asset}],honroElements:undefined,honroEnvironment:undefined,honroLocalArtTable:undefined});
 const ref=probe!==undefined&&probe.honroLandmarks?.[0]?.asset?.honroStaticAssetRef===1?probe.honroLandmarks[0].asset:null;
 lightRefs.set(asset,{key,ref});return ref;
}
function lightBattle(b){
 if(!b||b.honroCustom||b.mode!=='campaign'||!(b.honroAct5===1&&b.honroMapOrigin==='campaign'&&b.honroStage>=41&&b.honroStage<=50))return null;
 let changed=false;const out={...b};
 const map=items=>items.map(item=>{const ref=lightRef(b,item);if(!ref)return item;changed=true;return{...item,asset:{...ref}};});
 for(const key of ['honroLandmarks','honroElements'])if(Array.isArray(b[key]))out[key]=map(b[key]);
 if(Array.isArray(b.honroEnvironment?.placements))out.honroEnvironment={...b.honroEnvironment,placements:map(b.honroEnvironment.placements)};
 return changed?out:null;
}
 // Stage46 token-only lexical re-encoding, same compiled Path2D geometry.
 // Only the last released official visual provider may migrate to this exact
 // candidate. Inlined art, invalid providers and placement/flag changes fail closed.
 // 2026-11-23: region re-trace of the six exterior BODY parts to Act 5 node density
 // (tools/act5/retrace-vector.py); silhouette clips, placement and collision unchanged.
 // Both earlier released providers resolve to this current provider.
 // 2026-11-24: the near source itself simplified (stage46-near-simplified.json); the 11-23 provider joins the list.
 const STAGE46_LOSSLESS_REF=Object.freeze({id:'act5:near:46',stage:46,previous:Object.freeze(['17756761:bc1a6549','16328502:43d17801','4204233:7f4d5ae9']),current:'4378197:67a29ab2'});
// 2026-11-23 Act 5 node-density pass: earlier released near-art providers of
 // these chapters resolve to the current provider of the same placement.
 const ACT5_DENSITY_REFS=Object.freeze({
  43:Object.freeze({id:'act5:near:43',stage:43,previous:Object.freeze(['2588136:21983dfc']),current:'2302716:85bc9092'}),
  44:Object.freeze({id:'act5:near:44',stage:44,previous:Object.freeze(['3323278:8ab035ae']),current:'1395161:280b8c2e'}),
  50:Object.freeze({id:'act5:near:50',stage:50,previous:Object.freeze(['1704267:dfc88629']),current:'1421755:db246daa'}),
 });
 function stage46LosslessRef(b,item,ref,source,current){
  const rule=b?.honroStage===46?STAGE46_LOSSLESS_REF:ACT5_DENSITY_REFS[b?.honroStage];if(!rule)return false;
  return b?.mode==='campaign'&&b.honroCustom===false&&b.honroCanonical===true&&
   b.honroAct5===1&&b.honroMapOrigin==='campaign'&&b.honroStage===rule.stage&&
   ref.id===rule.id&&rule.previous.includes(ref.signature)&&current===rule.current&&
   item?.id==='a5-near'&&item.assetId===rule.id&&item.kind==='canonical-element'&&
   item.x===0&&item.y===0&&(rule.stage===46?item.scale===4:Number.isFinite(item.scale)&&item.scale>0)&&item.rotation===0&&
   Array.isArray(item.collisionIds)&&item.collisionIds.length===0&&
   source.id===rule.id&&!!source.vector&&Array.isArray(source.collision)&&source.collision.length===0;
 }
// Exactly one byte-attested visual-only Act 5 Stage 2 provider transition.
// Do not reuse the Act 4 registry for Act 5 or accept other placements/signatures.
function mayRestoreStage42CompactedArt(b,item,ref,current){
 return b?.mode==='campaign'&&b.honroMapOrigin==='campaign'&&b.honroAct5===1&&
  b.honroCanonical===true&&b.honroCustom===false&&b.stage===42&&b.honroStage===42&&
  b.honroAuthoredId==='stage-42'&&b.honroRevision===20&&b.honroMapRevision===20&&b.honroCampaignMapRevision===1&&b.width===6500&&b.height===2861&&b.honroTerrainDomainVersion===1&&
  item.kind==='canonical-element'&&item.id==='a5-near'&&item.assetId==='act5:near:42'&&
  item.layer==='structural-back'&&item.depthLayer==='L1'&&item.visualRole==='scenery'&&
  item.x===0&&item.y===0&&item.scale===6500/2022&&item.rotation===0&&
  Array.isArray(item.collisionIds)&&item.collisionIds.length===0&&
  Object.keys(ref).length===3&&ref.id==='act5:near:42'&&['1864834:f80cec75','1858841:5ce4a412','1382117:dec691ec'].includes(ref.signature)&&
  // 2026-11-23 node simplification (tools/act5/simplify-vector.py) is the current provider.
  current==='1583179:6d65aa38';
}
 function restoreBattleArt(b){
 const local=resolveLocalArt(b);if(!local)return false;
 const library=new Map((G.HONRO_PROJECT?.library||[]).map(a=>[a.id,a])),signatures=new Map(),replacements=[...local.replacements];
 const s33=G.HonroStage33Restore?.(b,library);if(s33===false)return false;
 for(const items of [b?.honroLandmarks,b?.honroElements,b?.honroEnvironment?.placements])for(const item of items||[]){
  const ref=item.asset;if(!ref||ref.honroStaticAssetRef===undefined)continue;
  if(ref.honroStaticAssetRef!==1||typeof ref.id!=='string'||typeof ref.signature!=='string')return false;
  let source=library.get(ref.id);
  if(!source){const old=legacy32Art(b,ref.id,ref.signature,library);if(!old)return false;source=old.asset;}
  if(!signatures.has(ref.id))signatures.set(ref.id,assetSignature(JSON.stringify(source)));
  if(signatures.get(ref.id)!==ref.signature){
   const legacy=legacy33Art(b,ref.id,ref.signature,library)||legacy34Art(b,ref.id,ref.signature,library);
   const optimized=G.HONRO_PREVIOUS_TERRAIN_ART?.[ref.id];
   // Exact signatures for the original art and its prior optimized release
   // can resolve to the verified current provider for that same chapter.
   const knownSignature=optimized?.previous===ref.signature||[].concat(optimized?.previousOptimized??[]).includes(ref.signature);
   const sameTerrain=b?.mode==='campaign'&&!b.honroCustom&&b.honroMapOrigin!=='workshop'&&b.honroAct4Official===1&&
    optimized?.stage===b.honroStage&&knownSignature&&optimized.current===signatures.get(ref.id);
   if(legacy)source=legacy.asset;
    else if(!sameTerrain&&!s33?.refs.has(item)&&!stage46LosslessRef(b,item,ref,source,signatures.get(ref.id))&&!mayRestoreStage42CompactedArt(b,item,ref,signatures.get(ref.id)))return false;
  }
  replacements.push([item,source]);
 }
 // Resolve only after campaign lazy loading and revision checks, atomically.
 for(const[item,source]of replacements)item.asset=structuredClone(source);
 s33?.apply();
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
 let raw=null,locked=false,reason=null,kind=G.HONRO_EMBEDDED?'embedded':'absent',retryCandidate=null,lastWriteError=null;
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
  let text,step='read';try{const previous=G.localStorage.getItem(KEY);step='archive';preserveOriginal(previous);step='serialize';text=JSON.stringify({...profile,honroBattle:compactBattleArt(profile.honroBattle)});step='write';G.localStorage.setItem(KEY,text);}catch(e){
   const code=e.profileReason?.startsWith('archive-')?e.profileReason:step==='serialize'?'serialization':e.name==='QuotaExceededError'||e.name==='NS_ERROR_DOM_QUOTA_REACHED'?'quota':e.name==='SecurityError'||e.name==='NotAllowedError'?'permission':'storage';
   lastWriteError={code,step,name:typeof e.name==='string'?e.name:'Error',chars:typeof text==='string'?text.length:null};
   if(e.profileReason?.startsWith('archive-')){fail(e.profileReason);throw e;}throw failure('write');
  }
  raw=text;locked=false;reason=null;kind='ready';retryCandidate=null;lastWriteError=null;return profile;
 }
 function replace(make){
  if(G.HONRO_EMBEDDED)return{ok:false,reason:'embedded'};
  try{const candidate=make();candidate.party=[...candidate.recruited];const profile=write(candidate);return{ok:true,profile};}catch(e){return{ok:false,reason:e.profileReason||'migration'};}
 }
 return{
  initial,
  get locked(){return locked;},
  get state(){return{kind,reason,hasOriginal:typeof raw==='string',lastWriteError:lastWriteError?{...lastWriteError}:null};},
  saveFailureMessage(){const code=lastWriteError?.code;return code==='quota'?'브라우저의 혼로 저장 공간이 부족해 기록하지 못했습니다. 디스크 여유 공간과는 별개입니다. 설정에서 현재 기록을 내보낸 뒤 다시 저장해 주세요.':code==='permission'?'브라우저가 기록 저장을 허용하지 않았습니다. 사이트 저장 권한을 확인하고 설정에서 현재 기록을 내보내 주세요.':code==='serialization'?'현재 기록을 저장 형식으로 변환하지 못했습니다. 기존 저장은 보존되어 있습니다.': '기록을 저장하지 못했습니다. 기존 저장은 보존되어 있습니다. 설정에서 현재 기록을 내보낸 뒤 다시 시도해 주세요.';},
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
G.HonroProfileStore={create,fresh,migrate,compactBattleArt,lightBattle,restoreBattleArt,needsLegacy32Art,verifyLegacy32Assets,needsLegacy33Art,verifyLegacy33Assets,needsLegacy34Art,verifyLegacy34Assets};
})(globalThis);
;await yieldIfNeeded();(()=>{"use strict";(function(G){"use strict";const combat=a=>!!a&&(a.type==="spawn"||a.type==="sniperAmbush"||a.type==="multi"&&(a.actions||[]).some(combat));const spawnCount=a=>!a?0:a.type==="multi"?(a.actions||[]).reduce((n,a)=>n+spawnCount(a),0):combat(a)?a.n||1:0;function balance(b){if(b.honroCustom||b.honroEncounterRevision||b.honroStage>10)return;const site=b.honroAct1SiteRevision===1;const originals=b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget&&!u.boss&&!u.honroMidboss&&!u.honroFinalBoss),added=[];for(const u of originals){u.combatBaseHp=(u.combatBaseHp??u.maxHp/(G.HONRO_CORE.DIFFICULTIES[b.difficulty]?.hp||1))*.6;u.hp=u.maxHp=Math.max(1,Math.round(u.maxHp*.6));if(u.honroOpeningWatch||site||b.honroStage===5&&b.honroStage5PositioningRevision===1)continue;const v=structuredClone(u);v.id=u.id+"-cluster";v.x+=u.r*2+24;const authored=([1,2,3,4,6,7,10].includes(b.honroStage)||b.honroStage===9&&b.honroP1PlacementRevision===1)&&b.honroMap?.positioning?.clusterPositions?.[v.id];if(authored)Object.assign(v,authored);v.spawnX=v.x;v.damageBy={};v.xpGranted=0;const kind=v.honroVariant||v.honroType,flying=!!G.HonroWorld.archetypes[kind]?.flying;const spot=G.HonroTerrain.place({...b,units:[...b.units,...added]},v,{flying:flying,maxDistance:700});if(!spot)throw Error("No safe cluster placement: "+v.id);Object.assign(v,spot,{spawnX:spot.x,spawnY:spot.y});added.push(v)}b.units.push(...added);const double=a=>{if(!a)return;if(a.type==="multi")a.actions.forEach(double);else if(combat(a))a.n=(a.n||1)*2};if(!site)for(const ev of b.honroEvents||[])double(ev.action);b.honroEncounterRevision=1}function configure(b){if(!b.honroEvents)return;if(b.honroStage===4&&b.honroEncounterRevision&&!b.honroEvents.some(ev=>ev.id==="siege-mid")){const wave={id:"siege-mid",when:{round:5},action:{type:"spawn",n:4,x:2320,kind:"hound"},text:"산개들이 중간 길목을 넘어 피란문으로 내려온다.",lines:[],once:true};const first=b.honroEvents.findIndex(ev=>ev.id==="siege-0");b.honroEvents.splice(first+1,0,wave)}if(b.honroCanonical)return;if(b.honroStage===2){const chain=["road-pressure","sniper-seen","right-cliff","last-flight"];for(const ev of b.honroEvents){const index=chain.indexOf(ev.id);if(index>=0){const a=b.honroMapAnchors||{},progress={"road-pressure":(a.leftBasin?.x||2650)-180,"sniper-seen":(a.leftBasin?.x||2650)+120,"right-cliff":(a.rightBasin?.x||3700)-220,"last-flight":(a.exit?.x||4320)-180}[ev.id];ev.when={any:[{progress:progress},{enemiesAtMost:0}],after:index?chain[index-1]:null};ev.required=true}if(ev.id==="road-pressure"&&ev.action?.type==="spawn")ev.action.n=1;if(ev.id==="sniper-seen"&&ev.action?.type==="sniperAmbush")ev.action.n=1;if(ev.id==="damheo-ward"){ev.actor="npc-damheo";ev.action.actor="npc-damheo"}}}if(b.honroStage===3){for(let i=0;i<3;i++){const ev=b.honroEvents.find(e=>e.id==="siege-"+i);if(ev){ev.when={any:[{round:2+i*2},{enemiesAtMost:0}],after:i?"siege-"+(i-1):null};ev.action.n=[3,3,4][i];ev.required=true}}}if(b.honroStage>=4)for(const ev of b.honroEvents){const trim=a=>{if(!a)return;if(a.type==="spawn")a.n=Math.min(a.n,4);if(a.type==="multi")a.actions.forEach(trim)};trim(ev.action)}}function matches(w,s){if(w.ledger&&!s.ledger||w.rescues&&(s.rescuedCount||0)<w.rescues)return false;if(w.objectiveDone&&!s.objectives?.[w.objectiveDone])return false;if(w.region&&!(s.heroes||[]).some(u=>G.HonroAuthored.inside(u,w.region)))return false;if(w.after&&!s.flags["event:"+w.after])return false;if(w.any&&!w.any.some(c=>matches(c,s)))return false;return(w.progress===undefined||s.progress>=w.progress)&&(w.height===undefined||s.height<=w.height)&&(w.round===undefined||s.round>=w.round)&&(w.enemiesAtMost===undefined||s.enemies<=w.enemiesAtMost)&&(w.broken===undefined||s.broken>=w.broken)&&(w.collected===undefined||s.collected>=w.collected)&&(w.hold===undefined||s.hold>=w.hold)&&(!w.rescued||s.rescued)&&(!w.destroyed||s.terrain.find(t=>t.id===w.destroyed)?.broken)}function pending(b){return(b.honroEvents||[]).some(ev=>ev.required&&!b.honroState.flags["event:"+ev.id])}function populationCap(b){const historical=b.honroSplit?.version===1?G.HONRO_SPLIT_V1?.stages.find(s=>s.metadata.stageId===b.honroStage):null;const historicalSteps=historical&&G.HONRO_SPLIT_V1.content.find(s=>s.id===b.honroStage)?.steps;const capacity=historical&&historicalSteps?historical.units.filter(u=>u.team==="enemy").length+historicalSteps.reduce((n,s)=>n+(s.wave?.count||0),0):G.HonroProgression.plan(b.honroStage).maxAlive;const base=capacity*(b.honroEncounterRevision?2:1);const response=!b.honroCustom&&b.honroAct3ResponseRevision===1?(b.honroEvents||[]).filter(ev=>ev.once&&ev.action?.act3Authored&&ev.action.source===ev.id).reduce((n,ev)=>n+spawnCount(ev.action),0):0;return Math.min((b.honroStage===4?Math.max(base,26):base)+response,b.honroState?.sodanCoop?G.HonroMission.FINALE_CAP:Infinity)}function update(app,dt,state){const e=app.engine,b=e.b,hs=b.honroState;if(["won","lost"].includes(b.phase)||app.done)return;hs.pendingEvents??=[];hs.encounterCooldown=Math.max(0,(hs.encounterCooldown||0)-dt);for(const ev of b.honroEvents||[]){if(ev.honroCampaignReinforcement)continue;const key="event:"+ev.id;if(hs.flags[key])continue;if(ev.actor&&!b.units.some(u=>u.id===ev.actor&&!u.dead&&u.hp>0)){hs.flags[key]="cancelled:actor-unavailable";continue}const enemies=e.alive(1).length;if(!matches(ev.when,{...state,objectives:hs.act3?.done,heroes:e.heroesAlive(),enemies:enemies,round:b.round,flags:hs.flags,terrain:G.HonroQuestTargets.records(b),hold:hs.hold,rescued:hs.rescued,ledger:hs.ledger,rescuedCount:hs.rescuedCount}))continue;if(!hs.pendingEvents.includes(ev.id)){hs.pendingEvents.push(ev.id);hs.eventActors??={};hs.eventActors[ev.id]={id:app.actorBoundary||b.active,round:b.round};if(ev.warning)app.event(ev.warning);app.dirty=true}}flush(app)}function flush(app){const e=app.engine,b=e.b,hs=b.honroState;if(!app.actorBoundary||app.dialogue||["won","lost"].includes(b.phase))return;const boundary=[hs.actorTurnSerial||0,b.round,...b.teamEnds,app.actorBoundary].join(":");let spawned=false;for(const id of[...hs.pendingEvents||[]]){const ev=b.honroEvents.find(v=>v.id===id),key="event:"+id;if(!ev||hs.flags[key]){hs.pendingEvents=hs.pendingEvents.filter(v=>v!==id);continue}const wait=hs.eventActors?.[id],actor=wait&&e.unit(wait.id);if(wait&&b.round<=wait.round&&actor&&!actor.acted&&!actor.dead&&app.actorBoundary!==actor.id)continue;if(ev.actor&&!b.units.some(u=>u.id===ev.actor&&!u.dead&&u.hp>0)){hs.flags[key]="cancelled:actor-unavailable";continue}const enemies=e.alive(1).length;if(combat(ev.action)){const cap=G.HonroEncounters.populationCap(b);if(spawned||hs.lastCombatEventBoundary===boundary||enemies+spawnCount(ev.action)>cap)continue}const beforeIds=combat(ev.action)?new Set(b.units.map(u=>u.id)):null;if(G.HonroAllies.execute(app,ev.action?{...ev.action,source:ev.action.source||ev.id}:ev.action)===false)continue;const reinforcementIds=beforeIds?b.units.filter(u=>!beforeIds.has(u.id)&&u.side===1&&!u.honroObjectiveTarget).map(u=>u.id):null;if(reinforcementIds){hs.reinforcementEvents??={};hs.reinforcementEvents[id]=reinforcementIds}const entry=ev.honroCampaignReinforcement?e.unit(reinforcementIds?.[0]):ev.entry;if(entry){e.fx("ring",entry.x,entry.y-12,"#c8b286",95);e.fx("text",entry.x,entry.y-125,"#d4b790",16,"증원")}hs.flags[key]=true;if(combat(ev.action)){spawned=true;hs.lastCombatEventBoundary=boundary}hs.eventLog??=[];hs.eventLog.push({id:id,phase:b.phase,round:b.round,side:b.side,teamEnds:[...b.teamEnds]});hs.eventLog=hs.eventLog.slice(-80);hs.pendingEvents=hs.pendingEvents.filter(v=>v!==id);const lines=G.HonroStoryContent.eventLines(app,ev);if(lines?.length)app.sayLines(reinforcementIds?lines.map(([who,text,meta={}],index)=>[who,text,index===0?{...meta,reinforcementIds:reinforcementIds}:meta]):lines);else app.event(ev.text,{kind:"narration",source:"encounter:"+ev.id});b.events.push("honro:"+ev.id);app.dirty=true;if(app.dialogue)break}}function finishNarrative(app){const b=app.engine?.b,hs=b?.honroState;if(!hs||b.honroCustom||b.phase!=="won")return;for(const id of[...hs.pendingEvents||[]]){const ev=b.honroEvents.find(v=>v.id===id);if(!ev||ev.action||hs.flags["event:"+id])continue;const lines=G.HonroStoryContent.eventLines(app,ev);if(!lines?.length)continue;if(ev.actor&&!b.units.some(u=>u.id===ev.actor&&!u.dead&&u.hp>0))continue;app.sayLines(lines);hs.flags["event:"+id]=true;hs.pendingEvents=hs.pendingEvents.filter(v=>v!==id)}}function actorEnd(app,id){const hs=app.engine?.b.honroState;if(!hs||app.training||app.actorBoundary)return;hs.actorTurnSerial=(hs.actorTurnSerial||0)+1;app.actorBoundary=id||"boundary";try{G.HonroAllies.missionTick(app,0);flush(app);app.startQueuedStory?.()}finally{app.actorBoundary=null}}function attach(app,e){const finish=e.finishAction.bind(e);e.finishAction=function(...args){const b=e.b,u=e.active,acted=u?.acted,round=b.round;const out=finish(...args);if(u&&(!acted&&u.acted||b.round!==round))actorEnd(app,u.id);return out};const tick=e.tick.bind(e);e.tick=function(dt){const b=e.b,phase=b.phase,id=b.active,index=phase==="ally"?b.honroState?.allyQueue?.index:b.summonTurn?.index;tick(dt);if(phase==="ally"&&index!==b.honroState?.allyQueue?.index||phase==="summon"&&index!==b.summonTurn?.index)actorEnd(app,id)};const next=e.switchTeam.bind(e);e.switchTeam=function(){const b=e.b,hs=b.honroState;if(b.phase!=="transition")return;const boundary=b.teamEnds.join(":");if(hs.lastEventBoundary!==boundary){hs.lastEventBoundary=boundary;actorEnd(app,b.active)}if(app.dialogue||b.phase!=="transition")return;next()}}G.HonroEncounters={configure:configure,matches:matches,pending:pending,update:update,flush:flush,finishNarrative:finishNarrative,attach:attach,actorEnd:actorEnd,combat:combat,spawnCount:spawnCount,balance:balance,populationCap:populationCap}})(globalThis)})();await yieldIfNeeded();(()=>{"use strict";(function(G){"use strict";const C=G.HONRO_CORE,H=G.HONRO_CONTENT,clone=x=>JSON.parse(JSON.stringify(x)),clamp=C.clamp;const MONSTER_SKILLS={HBM01:{id:"HBM01",enemyOnly:true,cls:"knight",name:"깨물기",tag:"산개 · 근접",desc:"턱을 벌리고 가까운 상대를 한 번 깨문다.",cost:0,damage:32,radius:24,mode:"beastBite",icon:"break",color:"#8b8b6d",speed:1,wind:0,terrain:0},HBM02:{id:"HBM02",enemyOnly:true,cls:"knight",name:"멧돼지 돌진",tag:"멧돼지 · 근접",desc:"몸을 낮춘 뒤 짧게 달려 접촉한 상대를 들이받는다.",cost:0,damage:32,radius:28,mode:"beastRam",icon:"break",color:"#8b8b6d",speed:1,wind:0,terrain:0},HBM03:{id:"HBM03",enemyOnly:true,cls:"knight",name:"뿔 받기",tag:"숫사슴 · 근접",desc:"뿔을 숙여 가까운 상대를 한 번 들이받는다.",cost:0,damage:32,radius:34,mode:"beastGore",icon:"break",color:"#8b8b6d",speed:1,wind:0,terrain:0},HBT01:{id:"HBT01",cls:"mage",name:"울림비명",tag:"박쥐 · 초음파",desc:"앞쪽 공기를 떨게 하는 짧고 빠른 초음파. 직접 피해는 낮고 폭발 반경이 넓다.",cost:0,damage:18,radius:92,mode:"honroSonic",icon:"resonance",color:"#a9beb0",speed:.994,wind:.1,terrain:.15,gravity:.08},HBT02:{id:"HBT02",cls:"mage",name:"메아리침",tag:"박쥐 · 반향",desc:"가느다란 반향 덩어리를 직선에 가깝게 쏜다.",cost:0,damage:23,radius:26,mode:"honroEchoNeedle",icon:"resonance",color:"#869f9d",speed:.896,wind:.12,terrain:.1,gravity:.12},HGS01:{id:"HGS01",cls:"occultist",name:"망자의 한숨",tag:"행렬귀 · 저중력",desc:"느리게 떠가는 한숨이 닿은 곳의 기운을 흐린다.",cost:0,damage:25,radius:56,mode:"honroDeadBreath",icon:"rune",color:"#a99ab4",speed:.82,wind:.15,terrain:.2,gravity:.22},HGS02:{id:"HGS02",cls:"occultist",name:"상여그늘",tag:"행렬귀 · 음영",desc:"낮게 깔리는 혼기 덩어리.",cost:0,damage:21,radius:76,mode:"honroFuneralShade",icon:"vortex",color:"#8e8298",speed:.76,wind:.22,terrain:.18,gravity:.3},HBR01:{id:"HBR01",cls:"knight",name:"뿌리쐐기",tag:"뿌리짐승 · 파편",desc:"굳은 뿌리 파편을 무겁게 던진다.",cost:0,damage:35,radius:48,mode:"honroRootShard",icon:"break",color:"#8b8b6d",speed:.76,wind:.55,terrain:1.3,gravity:1.18},HBR02:{id:"HBR02",cls:"knight",name:"흙울음",tag:"뿌리짐승 · 충격",desc:"흙과 돌을 뭉쳐 낮게 날린다.",cost:0,damage:29,radius:82,mode:"honroEarthRoar",icon:"quake",color:"#727b5f",speed:.72,wind:.62,terrain:1.65,gravity:1.25},HLN01:{id:"HLN01",cls:"occultist",name:"혼불방울",tag:"등불귀 · 혼불",desc:"느린 혼불이 목표 부근에서 크게 번진다.",cost:0,damage:24,radius:84,mode:"honroSoulFlame",icon:"flame",color:"#c4c697",speed:.68,wind:.18,terrain:.1,gravity:.16},HLN02:{id:"HLN02",cls:"occultist",name:"혼무씨",tag:"등불귀 · 혼무",desc:"짙은 혼무 덩어리를 떨어뜨린다.",cost:0,damage:20,radius:112,mode:"honroMistSeed",icon:"rune",color:"#9fae92",speed:.62,wind:.26,terrain:.1,gravity:.35},HSH01:{id:"HSH01",cls:"occultist",name:"수의가시",tag:"수의귀 · 투과",desc:"얇은 수의 조각이 지형을 스치듯 지나간다.",cost:0,damage:32,radius:24,mode:"honroShroudNeedle",icon:"pierce",color:"#aea0ad",speed:.756,wind:.18,terrain:.12,gravity:.2,phase:"terrain"},HSH02:{id:"HSH02",cls:"occultist",name:"매듭실",enemyEffectDesc:"고정 범위를 예고한다. 범위 밖으로 이동하거나 준비 중 수의귀를 직접 공격해 차단. 명중하면 다음 유효 행동의 이동 예산이 55%가 된다. 사격·도약은 가능하며 행동 후 또는 시전자 처치·정화약으로 해제.",tag:"수의귀 · 결박",desc:"긴 천조각처럼 날아가 넓게 터진다.",cost:0,damage:22,radius:74,mode:"honroShroudKnot",icon:"bind",color:"#8d7b89",speed:.86,wind:.3,terrain:.1,gravity:.4},HCW01:{id:"HCW01",cls:"archer",name:"썩은깃",tag:"산송장 까마귀 · 깃",desc:"썩은 깃을 뭉쳐 날리는 독자 공격.",cost:0,damage:23,radius:38,mode:"honroRotFeather",icon:"arrow",color:"#879184",speed:.826,wind:.38,terrain:.18,gravity:.6},HCW02:{id:"HCW02",cls:"archer",name:"검은깃비",tag:"산송장 까마귀 · 산개",desc:"검은 깃 덩어리를 크게 흩뿌린다.",cost:0,damage:18,radius:82,mode:"honroFeatherBurst",icon:"rain",color:"#66766f",speed:.92,wind:.55,terrain:.15,gravity:.75},HWD01:{id:"HWD01",cls:"knight",name:"장승못",tag:"장승 · 목편",desc:"묵직한 나무못을 날린다.",cost:0,damage:34,radius:34,mode:"honroWoodSpike",icon:"break",color:"#a08e67",speed:.82,wind:.42,terrain:.85,gravity:1.05},HWD02:{id:"HWD02",cls:"knight",name:"터줏바람",enemyEffectDesc:"고정 범위와 밀림 방향을 예고한다. 범위 밖으로 이동하거나 준비 중 장승을 직접 공격해 차단. 명중 시 지형에 막히는 안전한 거리만 밀리며 이미 바뀐 위치는 정화약으로 되돌리지 않는다.",tag:"장승 · 밀침",desc:"나무틈에서 터지는 압력파.",cost:0,damage:24,radius:100,mode:"honroWardGust",icon:"push",color:"#8f997d",speed:.76,wind:.28,terrain:.25,gravity:.3},HMO01:{id:"HMO01",cls:"knight",name:"곡소리",tag:"상두꾼 · 충격파",desc:"목 없는 몸에서 검은 울림이 퍼진다.",cost:0,damage:30,radius:92,mode:"honroMournerWail",icon:"resonance",color:"#9f7978",speed:.8,wind:.2,terrain:.25,gravity:.24},HMO02:{id:"HMO02",cls:"knight",name:"상여추",tag:"상두꾼 · 중량",desc:"상여 장식의 무거운 파편을 던진다.",cost:0,damage:42,radius:52,mode:"honroBierWeight",icon:"slam",color:"#8e7762",speed:.7,wind:.48,terrain:1.15,gravity:1.3}};for(const skill of Object.values(MONSTER_SKILLS))skill.existenceAttack=C.attackForSkill(skill);Object.assign(C.SKILLS,MONSTER_SKILLS);const ARCHETYPES={ghost:{name:"떠도는 혼",role:"fire",look:"ghost",cls:"occultist",skills:["HGS01","HGS02"],hp:102,attack:.5,h:105,r:21,intent:"망자의 한숨"},shade:{name:"매듭진 수의귀",role:"ice",look:"shade",cls:"occultist",skills:["HSH01","HSH02"],hp:126,attack:.51,h:115,r:22,intent:"수의가시와 매듭실"},hound:{name:"들린 산개",role:"leaper",look:"beast",variant:"hound",cls:"knight",skills:["HBM01"],hp:108,attack:.54,h:88,r:32,intent:"접근 후 깨물기"},boar:{name:"들린 멧돼지",role:"leaper",look:"beast",variant:"boar",cls:"knight",skills:["HBM02"],hp:154,attack:.64,h:108,r:41,intent:"몸을 낮춘 뒤 짧은 돌진"},stag:{name:"들린 숫사슴",role:"leaper",look:"beast",variant:"stag",cls:"knight",skills:["HBM03"],hp:132,attack:.58,h:116,r:38,intent:"뿔을 낮춘 뒤 들이받기"},bat:{name:"들린 산박쥐",role:"storm",look:"bat",cls:"mage",skills:["HBT01","HBT02"],hp:56,attack:.38,h:66,r:28,flying:true,intent:"초음파와 반향"},crow:{name:"들린 까마귀",role:"bow",look:"crow",cls:"archer",skills:["HCW01","HCW02"],hp:70,attack:.47,h:80,r:33,flying:true,intent:"썩은깃과 검은깃비"},human:{name:"들린 사람",role:"bow",look:"human",cls:"archer",skills:["A01","A02"],hp:116,attack:.5,h:91,r:21,intent:"불규칙한 사격"},lantern:{name:"혼을 삼킨 등불",role:"fire",look:"lantern",cls:"occultist",skills:["HLN01","HLN02"],hp:94,attack:.53,h:92,r:25,flying:true,intent:"혼불과 혼무"},warden:{name:"들린 장승",role:"guard",look:"warden",cls:"knight",skills:["HWD01","HWD02"],hp:194,attack:.65,h:146,r:32,intent:"장승못과 터줏바람"},mourner:{name:"들린 상두꾼",role:"leaper",look:"mourner",cls:"knight",skills:["HMO01","HMO02"],hp:164,attack:.6,h:120,r:26,intent:"곡소리와 상여추"}};const THEMED=[["hound","bat","crow","stag"],["bat","crow","hound","stag"],["hound","boar","crow","bat"],["hound","human","boar","crow"],["crow","stag","bat","lantern"],["boar","crow","hound","bat"],["human","hound","crow","stag"],["hound","crow","mourner","warden"],["hound","boar","crow","lantern"],["stag","crow","hound","shade"]];function selectInitialSpawns(spawns,cap){const groups=[];for(const sp of spawns){let g=groups.find(x=>x.id===sp.cluster);if(!g){g={id:sp.cluster,items:[]};groups.push(g)}g.items.push(sp)}const out=[];let depth=0;while(out.length<cap){let added=false;for(const g of groups){if(out.length>=cap)break;if(g.items[depth]){out.push(g.items[depth]);added=true}}if(!added)break;depth++}return out}function top(b,x,reference,support){return G.HonroMapEngine.surfaceY(b.terrain,x,reference,support)?.y??b.height-150}function createEnemy(b,st,x,kind,index,y,absolute=false,boss=false){const def=ARCHETYPES[kind]||ARCHETYPES.ghost,u=C.makeEnemy({role:def.role,x:x,y:y??top(b,x)},b.terrain,C.STAGES[st.id-1]||st,index);const mult=C.DIFFICULTIES[b.difficulty]||C.DIFFICULTIES.normal;Object.assign(u,{id:"foe-"+index,name:def.name,honroType:def.look,h:def.h,r:def.r,x:x,y:y??top(b,x),awake:false,aggroUntil:0,group:Math.floor(x/(st.w/4)),fixed:!!def.flying,elite:st.id===1?false:index%11===10,cls:def.cls||u.cls,loadout:[...def.skills||u.loadout],intent:def.intent||u.intent,honroVariant:def.variant||kind,...boss?{honroMidboss:true}:{}});u.ranks={...u.ranks};for(const sid of u.loadout)u.ranks[sid]=Math.max(1,Math.min(4,1+Math.floor((st.level-1)/3)));if(def.flying&&!absolute)u.y-=170+index%3*85;C.migrateEnemySkills(u);u.armor=u.elite?.12:.04;u.spawnX=u.x;u.spawnY=u.y;u.honroDifficulty=b.difficulty;u.level=Math.floor(G.HonroProgression.plan(st.id).entryLevel);G.HonroProgression.tuneEnemy(st,u,kind);G.HonroProgression.enemyXP(b,u);C.migrateEnemySkills(u);if(def.act2)G.HonroAct2.configureEnemy(u,def);if(def.act3Fiend){u.honroAct3Fiend=true;u.existenceDefense={...C.MONSTER_EXISTENCE.human}}G.HonroAct1Roster?.applyDefense(b,u);if(b.mode==="campaign"&&!b.honroCustom&&b.honroMapOrigin!=="workshop")C.migrateCampaignEnemyDamage(u);if(b.honroAct5!==1)G.HonroMonsterRoster?.prepareSpawn(b,u);return u}function ally(b,st,id,role,x,y){const cls=role==="ritualist"||role==="healer"||role==="daoist"?"mage":role==="medium"?"occultist":"knight";const names={porter:"만석",guard:"노위",archer:"철언",healer:"단비",ritualist:"보각",daoist:"담허",medium:"소단",scout:"나루지기"};const loadout=cls==="knight"?["S01","S09"]:cls==="occultist"?["O01","O06"]:role==="daoist"?["M01","M06"]:["M01"];const level=st.recruit===cls?G.HonroProgression.joinLevel(st):Math.max(1,Math.floor(G.HonroProgression.plan(st.id)?.entryLevel||st.level||1));const u=C.makeUnit(cls,2,x,y??top(b,x),{id:id,name:names[role]||"동맹",level:level,loadout:[...loadout]});const ref=G.HonroProgression.referenceStats(st),profile={guard:[1.34,.7,.18],porter:[.98,.48,.08],healer:[.82,.3,.06],ritualist:[.9,.44,.08],daoist:[1.06,.62,.09],medium:[1,.6,.08],scout:[.9,.48,.08]}[role]||[.9,.48,.08];let hp=Math.round(ref.hp*profile[0]),attack=ref.attack*profile[1],armor=profile[2];if(id==="npc-damheo"){hp=Math.round(hp*1.18);attack*=1.15;armor=.12}if(id==="npc-hwigyeom"){hp=Math.round(hp*1.32);attack*=1.2;armor=.24}Object.assign(u,{honroAlly:true,allyRole:role,honroType:"ally",role:"ally-"+role,fixed:false,hp:hp,maxHp:hp,focus:160,maxFocus:160,attack:attack,armor:armor,r:20,h:90,acted:true,allyState:"follow",awake:true,group:-1,damageBy:{},spawnX:x,spawnY:y??top(b,x)});for(const sid of loadout)u.ranks[sid]=Math.max(1,Math.min(4,1+Math.floor((level-1)/2)));C.migrateEnemySkills(u);return u}function midboss(b,st,id,name,kind,x,y){const u=createEnemy(b,st,x,kind,900+st.id,y,true,true);Object.assign(u,{id:id,name:name,awake:true,aggroUntil:999,group:-3,honroMidboss:true,elite:true});u.armor=Math.max(u.armor||0,.14);G.HonroProgression.tuneMidboss(b,st,u);u.spawnX=u.x;u.spawnY=u.y;return u}function trainingWorld(st,profile,cls,skill,legacy){const b=legacy(st,profile,true,cls,skill);Object.assign(b,{width:6e3,height:2300,practiceCombat:true,practiceWind:7,enemyLimit:2,honroRevision:20,terrain:[],waters:[],drafts:[],decor:[],honroLandmarks:[],honroSurfaceZones:[]});const crest=[[0,1510],[480,1510],[900,1490],[1210,1510],[1420,1450],[1650,1400],[1880,1400],[2140,1480],[2450,1500],[2900,1500],[3240,1490],[3430,1100],[3570,1090],[3780,1330],[3970,1470],[4100,1530],[4520,1530],[4660,1460],[4920,1430],[5250,1460],[5500,1420],[5770,1430],[6e3,1390]];b.terrain=[{id:"training-ground",x:-1600,y:1090,w:9200,h:2210,vertices:[{x:-1600,y:1540},...crest.map(([x,y])=>({x:x,y:y})),{x:7600,y:1470},{x:7600,y:3300},{x:-1600,y:3300}],mat:"rock",hp:99999,maxHp:99999,indestructible:true,route:true}];const solid=(id,vertices)=>{const xs=vertices.map(p=>p[0]),ys=vertices.map(p=>p[1]);b.terrain.push({id:id,x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys),vertices:vertices.map(([x,y])=>({x:x,y:y})),mat:"rock",hp:99999,maxHp:99999,indestructible:true,route:true})};solid("training-shelter",[[2630,1150],[2750,1090],[3020,1060],[3250,1080],[3470,1100],[3440,1370],[3330,1450],[3280,1240],[3010,1220],[2780,1240],[2630,1220]]);solid("training-cover",[[2840,1500],[2830,1420],[2890,1400],[2940,1435],[2950,1500]]);const ledge=(id,x,y,w)=>b.terrain.push({id:id,x:x,y:y,w:w,h:22,mat:"wood",hp:99999,maxHp:99999,indestructible:true,oneWay:true,route:true});ledge("training-low-ledge",1550,1230,260);ledge("training-high-ledge",1810,1060,250);ledge("training-return-ledge",2110,1280,230);ledge("training-shelter-step",2390,1310,210);ledge("training-shelter-perch",2530,1130,180);b.terrain.push({id:"training-barrel",x:3160,y:1430,w:45,h:70,mat:"barrel",hp:48,maxHp:48});for(let i=0;i<crest.length-1;i++){const a=crest[i],z=crest[i+1];b.honroSurfaceZones.push({id:"training-surface-"+i,kind:i>=14&&i<=16?"mud-mass":i>=9&&i<=13?"exposed-rock-mass":i%3===0?"stone-road":"moss-mass",points:[a,z,[z[0],z[1]+48],[a[0],a[1]+48]],surface:[a,z],attached:true})}b.waters.push({x:4035,y:1500,w:545,depth:30,frozen:0,kind:"water",conductive:true,bottom:[{x:4035,y:1500},{x:4100,y:1530},{x:4520,y:1530},{x:4580,y:1500}]});b.honroSurfaceZones.push({id:"training-shallows",kind:"water-pool",points:[[4035,1500],[4580,1500],[4520,1530],[4100,1530]],surface:[[4035,1500],[4580,1500]],bottom:[[4035,1500],[4100,1530],[4520,1530],[4580,1500]],attached:true});b.honroMap={act1Scene:{version:1,scenery:[],replaced:[],lights:[],rocks:[{id:"yard-shoulder",supportId:"training-ground",x:650,width:720,height:230,kind:"shoulder"},{id:"ledge-back",supportId:"training-ground",x:1760,width:760,height:300,kind:"shoulder"},{id:"shelter-root",supportId:"training-ground",x:3490,width:700,height:520,kind:"buttress"},{id:"bank-shoulder",supportId:"training-ground",x:4880,width:600,height:240,kind:"shoulder"}]}};b.honroMap.act1Scene.rocks.forEach(r=>{r.y=top(b,r.x,2200)});const trainingStage={id:"training",width:b.width,height:b.height,backdrop:"forest",metadata:{stageId:1},elements:[]},environmentProject={library:G.HONRO_PROJECT.library.map(a=>({...a})),stages:[trainingStage]};G.HonroEnvironment.upgradeComposition(environmentProject);b.honroEnvironment={...trainingStage.environment,placements:[]};for(const[id,assetId,x,scale]of[["west-pine","rooted-pine",160,.72],["yard-remains","ruined-court",1220,.55],["ridge-pine","rooted-pine",2310,.62],["roof-pine","rooted-pine",3530,.65],["bank-court","ruined-court",4810,.65],["east-pine","rooted-pine",5900,.8]]){const asset=G.HONRO_PROJECT.library.find(a=>a.id==="act1-scene:"+assetId);if(!asset)continue;const y=top(b,x,2200)+5*scale;b.honroLandmarks.push({id:"training-"+id,kind:"canonical-element",asset:asset,assetId:asset.id,x:x,y:y,scale:scale,rotation:0,layer:"back",depthLayer:"L1"});b.honroMap.act1Scene.scenery.push({id:"training-"+id,supportId:"training-ground",x:x,y:y,scale:scale,visualOnly:true})}for(const[kind,x,size]of[["fernPatch",4020,.8],["fernPatch",4590,.65],["fernPatch",490,.75],["fernPatch",3850,.8]])b.honroLandmarks.push({kind:kind,x:x,y:top(b,x,2200),size:size,layer:"prop"});const hero=b.units.find(u=>u.side===0);b.units=[hero];C.applyHero(hero,b.heroes[cls],true);Object.assign(hero,{x:340,y:1510,spawnX:340,spawnY:1510,acted:false,cooldowns:{},vx:0,vy:0});const stations=[{id:"precision",targets:[["human",840],["hound",1090]]},{id:"elevation",targets:[["human",1720,1230],["shade",1980,1060],["boar",2180]]},{id:"shelter",targets:[["ghost",3040],["human",3220]]},{id:"water",targets:[["ghost",4230],["hound",4430],["stag",4690]]},{id:"mixed",targets:[["hound",5320],["mourner",5415],["shade",5510],["human",5680]]},{id:"air",targets:[["bat",5160,1140],["crow",5620,990],["lantern",5820,1200]]},{id:"elite",targets:[["warden",5550]]}];let index=0;for(const[group,station]of stations.entries())for(const[kind,x,airY]of station.targets){const i=index++,u=createEnemy(b,{...st,w:b.width},x,kind,i,airY??top(b,x,2200),airY!==undefined),elite=station.id==="elite",hp=elite?3400:130+i%4*45;u.name=elite?"정예 산지기 · 수련":u.name+" · 수련";Object.assign(u,{hp:hp,maxHp:hp,attack:elite?1.05:.72,armor:elite?.28:.04,elite:elite,awake:true,aggroUntil:0,group:group,honroTrainingStation:station.id,cooldowns:{},focus:180,maxFocus:180});if(["bat","crow"].includes(kind))u.combatBaseHp=hp/(C.DIFFICULTIES[b.difficulty]||C.DIFFICULTIES.normal).hp;delete u.honroAirborneBalanceRevision;C.migrateAirborneBalance(u);b.units.push(u)}b.active=hero.id;b.sceneVersion++;return b}function build(st,profile,training,cls,skill,legacy){if(training)return trainingWorld(st,profile,cls,skill,legacy);const old=G.HonroSplitCampaign.legacy(profile,st.id),project=old?{...G.HONRO_PROJECT,library:[...G.HONRO_SPLIT_V1.library||[],...G.HONRO_PROJECT.library]}:G.HONRO_PROJECT,map=(old?G.HONRO_SPLIT_V1.stages:project.stages).find(s=>s.metadata.stageId===st.id);if(!map)throw Error("Missing canonical stage "+st.id);const b=G.HonroMaps.createBattle(map,project,profile,{origin:"campaign"});const pilot=st.id===5?["s5-cave-shade","HSH02"]:st.id===8?["s8-15","HWD02"]:null;if(pilot){const owner=b.units.find(u=>u.id===pilot[0]&&u.side===1&&!u.dead&&u.loadout?.includes(pilot[1]));if(owner){b.honroMonsterEffectsRevision=1;owner.honroMonsterEffectSkill=pilot[1]}}if(b.honroStoryCanonRevision===1){if(profile.honroStoryEvents?.["act3-void-v1"])b.honroVoidWitness=true;if(profile.honroStoryEvents?.["act2-bell-anomaly-v1"])b.honroBellWitness=true}return b}G.HonroWorld={build:build,top:top,createEnemy:createEnemy,ally:ally,archetypes:ARCHETYPES}})(globalThis)})();await yieldIfNeeded();(()=>{"use strict";(function(G){"use strict";const replacements={3:{"foe-5":"human"},5:{"foe-3":"human","foe-7":"stag"},7:{"foe-7":"bat","foe-10":"human"},9:{"foe-0":"human","foe-8":"human"}};function attackBudget(u){const C=G.HONRO_CORE;return u.loadout.reduce((n,id)=>{const s=C.SKILLS[id];return n+s.damage*C.skillBalanceFactor(s)*C.existenceMultiplier(s.existenceAttack||C.attackForSkill(s),{side:0})},0)/Math.max(1,u.loadout.length)}function author(project){for(const st of project.stages||[]){const changes=replacements[st.metadata?.stageId];if(!changes)continue;for(const u of st.units||[]){const kind=changes[u.id];if(!kind||u.kind===kind||u.side!==1||u.boss||u.honroMidboss||u.honroFinalBoss)continue;if(!["ghost","shade","lantern"].includes(u.kind))continue;const previousBudget=attackBudget(u),def=G.HonroWorld.archetypes[kind],rank=Math.max(1,...Object.values(u.ranks||{}));Object.assign(u,{kind:kind,name:def.name,role:def.role,cls:def.cls,honroType:def.look,honroVariant:def.variant||kind,h:def.h,r:def.r,fixed:!!def.flying,intent:def.intent,loadout:[...def.skills],ranks:Object.fromEntries(def.skills.map(id=>[id,rank]))});G.HONRO_CORE.migrateEnemySkills(u);const scale=previousBudget/Math.max(.001,attackBudget(u));u.attack*=scale;if(u.combatBaseAttack!==undefined)u.combatBaseAttack*=scale;delete u.existenceDefense;delete u.existenceShift}}return project}const defenseProfiles={ghost:{form:.65,qi:1.05,soul:1.32},shade:{form:.72,qi:1.05,soul:1.28},lantern:{form:.7,qi:1.1,soul:1.34}};function applyDefense(b,u){if(b?.mode!=="campaign"||b.honroCustom||!Number.isInteger(b.honroStage)||b.honroStage<1||b.honroStage>10)return u;if(u.side!==1||u.summonKind||u.boss||u.honroMidboss||u.honroFinalBoss||u.existenceDefense)return u;const profile=defenseProfiles[u.honroVariant||u.honroType];if(profile){u.existenceDefense={...profile};u.honroAct1DefenseRevision=1}return u}function applyBattleDefense(b){for(const u of b?.units||[])applyDefense(b,u);return b}G.HonroAct1Roster={author:author,replacements:replacements,attackBudget:attackBudget,defenseProfiles:defenseProfiles,applyDefense:applyDefense,applyBattleDefense:applyBattleDefense}})(globalThis)})();await yieldIfNeeded();(()=>{"use strict";(function(G){"use strict";const C=G.HONRO_CORE,H=G.HONRO_CONTENT,P=G.HonroProgression;const median=a=>{const s=[...a].sort((a,b)=>a-b);return s.length?s[Math.floor(s.length/2)]:0};function audit(stage,b){const p=P.plan(stage.id),r=P.referenceStats(stage);const enemies=b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget&&!u.dead),ordinary=enemies.filter(u=>!u.boss&&!u.elite);const hits=u=>u.maxHp/(r.shot/.96*(1-(u.armor||0)));const incoming=u=>{const s=u.loadout.map(id=>C.SKILLS[id]);return s.reduce((n,s)=>n+s.damage*C.skillBalanceFactor(s)*u.attack*(1-r.armor),0)/Math.max(1,s.length)/r.hp};const eventWaves=(b.honroEvents||[]).reduce((n,e)=>n+G.HonroEncounters.spawnCount(e.action),0);const act2Waves=b.honroAct2Revision>=2&&stage.id>=11&&stage.id<=20?G.HonroAct2Plan.forStage(stage.id).waveCount:0;const act3Waves=stage.act===3?(stage.steps||[]).reduce((n,s)=>n+(s.wave?.count||0),0):0;const reinforcements=eventWaves+act2Waves+act3Waves;const medianHits=median(ordinary.map(hits)),medianIncoming=median(ordinary.map(incoming));const issues=[];if(medianHits<(b.honroEncounterRevision?.35:.65)||medianHits>4)issues.push("ordinary enemy hit budget");if(medianIncoming<.035||medianIncoming>.15)issues.push("incoming damage budget");if(stage.active>4)issues.push("simultaneous enemy actions");const growth=P.budget(stage.id);return{stage:stage.id,name:stage.name,entryLevel:p.entryLevel,exitLevel:p.exitLevel,initialEnemies:enemies.length,reinforcements:reinforcements,activeLimit:stage.active,heroes:b.units.filter(u=>u.side===0).length,medianHitsToKill:+medianHits.toFixed(2),medianEnemyHitHpPercent:+(medianIncoming*100).toFixed(2),focusRoundHpPercentAt55PercentAccuracy:+(stage.active*medianIncoming*.55*100).toFixed(2),combatXpBudget:growth.combat,totalXpBudget:growth.total,completionTargetXp:growth.end,issues:issues,status:issues.length?"검토 필요":"예산 내"}}function auditAll(profile,makeWorld){return H.stages.map(st=>{const p=JSON.parse(JSON.stringify(profile));p.recruited=G.HonroStageRules.stageParty(st.id);for(const cls of p.recruited)p.heroes[cls].xp=P.xpAt(P.plan(st.id).entryLevel);return audit(st,makeWorld(st,p))})}G.HonroDifficulty={version:2,audit:audit,auditAll:auditAll,recommendation:r=>r.issues.join(", ")||"예산 유지"}})(globalThis)})();await yieldIfNeeded();(function(G){'use strict';
const C=G.HONRO_CORE,W=G.HonroWorld,clamp=C.clamp;
const aiming=new WeakMap();
/** A non-player coalition, not a fifth selectable hero and not an immortal prop.
 * Turn schedule: heroes -> summons -> allied NPCs -> enemies. All queue state is serialized. */
function attach(app,e){const b=e.b,baseTransition=e.completeTeamTransition.bind(e),baseTick=e.tick.bind(e);
 recoverFixedRescueTargets(e);
 e.completeTeamTransition=function(){if(e.checkEnd())return;const hs=b.honroState;const list=b.units.filter(u=>u.honroAlly&&!u.dead&&u.hp>0&&u.allyRole!=='channeler');if(b.honroStage===2&&list.length&&!list.some(u=>u.allyRole==='porter')){const bearer=list.find(u=>u.allyRole==='guard')||list[0];bearer.allyOriginalRole??=bearer.allyRole;bearer.allyRole='porter';app.event('남은 호위가 상여채를 이어받았다.',{kind:'narration',source:'escort-handoff'});}if(b.side===0&&list.length&&hs.allyDoneRound!==b.round){hs.allyDoneRound=b.round;hs.allyQueue={ids:list.map(u=>u.id),index:0,returnActive:b.active,phase:'begin',elapsed:0,started:false};b.phase='ally';b.turnAge=0;e.emit('save');return;}if(b.side===0&&b.honroStage===2&&!list.length){const car=e.unit('objective'),nearHero=e.heroesAlive().find(u=>car&&Math.hypot(u.x-car.x,u.y-car.y)<820),clear=!e.alive(1).length;if(car&&(nearHero||clear)&&b.honroTopview){G.HonroTopview.escortAdvance(e,car,clear?420:240);}
else if(car&&(nearHero||clear)){const block=b.terrain.find(t=>t.honroBlocker&&!t.broken&&t.x>car.x-35&&t.x<car.x+720);const lead=nearHero?.x??car.x+900;car.x=Math.max(car.x,Math.min(car.x+(clear?420:240),lead+180,block?block.x-105:(b.honroEscortGoalX??b.width-180)));car.y=W.top(b,car.x,car.y);}}baseTransition();};
 e.tick=function(dt=C.STEP){if(b.phase==='ally'){tick(app,e,dt,baseTransition);C.tickRedesign(e,dt);return;}baseTick(dt);};
}
// Older builds let fixed rescue residents walk off ledges without gravity.
// Recover only those stationary rescue targets, using the actual body sweep
// on a probe. Keep supported saves exactly as-is and never reset them to a
// marker/spawn, rewrite terrain, or charge the player for this invalid state.
function recoverFixedRescueTargets(e){const b=e.b;
 const ids=new Set((b.honroMarkers||[]).filter(m=>m.action==='rescue').map(m=>m.target));
 for(const u of b.units){
  if(!ids.has(u.id)||!u.fixed||!u.honroAlly||!u.honroCivilian||u.dead||u.hp<=0||!Number.isFinite(u.x)||!Number.isFinite(u.y)||u.airborne||u.carriedBy!==undefined||e.contactSurface(u.x,u.y-4,u.y+5))continue;
  const probe={...u,vx:0,vy:0,jumping:false,fallApexY:undefined};
  for(let n=0;n<2400;n++){
   if(!e.integrateBody(probe,C.STEP,true))break;
   if(e.grounded(probe)&&C.validTerrainContactPose(b.terrain,probe)){
    b.honroContactRecoveries??=[];b.honroContactRecoveries.push({id:u.id,reason:'fixed-rescue-airwalk',from:{x:u.x,y:u.y},to:{x:probe.x,y:probe.y}});
    Object.assign(u,{x:probe.x,y:probe.y,vx:0,vy:0,jumping:false,fallApexY:undefined});break;
   }
  }
 }
}
function coalition(e){return e.b.units.filter(u=>!u.dead&&u.hp>0&&(u.side===0||u.honroAlly||u.honroCivilian));}
function safeAllyAim(e,u,skill,target){return C.finishPlanning(safeAllyAimSteps(e,u,skill,target));}
function* safeAllyAimSteps(e,u,skill,target){
 const maxRange=u.allyRole==='daoist'?1550:u.allyRole==='medium'?1320:1100;
 if(Math.hypot(target.x-u.x,(target.y-u.y)*.75)>maxRange)return null;
 const base=yield* e.searchShot(u,skill,target,false,.82);
 const a={...base,angle:clamp(base.angle,-85,265),power:clamp(base.power,.08,.82)};
 const result=C.shotViable(e,u,skill,target,a.angle,a.power);yield;if(result.ok)return a;
 return null;
}
function* allyShot(e,u,skill,targets){for(const target of targets){const aim=yield* safeAllyAimSteps(e,u,skill,target);if(aim)return{aim,targetId:target.id};}return null;}
function log(e,u,action,target){const b=e.b;b.honroCounters.allyActions++;b.honroState.combatLog.push({round:b.round,actor:u.id,action,target});b.honroState.combatLog=b.honroState.combatLog.slice(-120);}
function finish(e,q){q.index++;q.phase='begin';q.elapsed=0;q.started=false;e.b.projectiles=[];e.b.volley=undefined;}
function tick(app,e,dt,transition){const b=e.b,hs=b.honroState,q=hs.allyQueue;if(!q){transition();return;}if(e.checkEnd())return;
 q.elapsed+=dt;b.turnAge+=dt;const id=q.ids[q.index],u=e.unit(id);
 if(q.index>=q.ids.length){b.active=q.returnActive;hs.allyQueue=null;transition();e.emit('save');return;}
 if(!u||u.dead||u.allyRole==='channeler'){finish(e,q);return;}b.active=u.id;
 if(q.phase==='begin'){
  b.reviewDamage={};b.reviewFocus=undefined;
  q.phase='move';q.elapsed=0;q.started=false;const support=u.allyRole==='daoist'||u.allyRole==='medium';u.moveLeft=u.maxMove=u.allyRole==='guard'?1400:support?1250:1180;u.walkSpeed=u.allyRole==='guard'?700:support?630:560;u.focus=u.maxFocus=180;
  const own=coalition(e),hero=e.heroesAlive().sort((a,c)=>c.x-a.x)[0],car=e.unit('objective'),foes=e.actors(1);
  const nearest=foes.slice().sort((a,c)=>Math.hypot(a.x-u.x,(a.y-u.y)*.8)-Math.hypot(c.x-u.x,(c.y-u.y)*.8))[0];q.targetId=nearest?.id;
  q.anchor=hero?.x||u.x;
  if(u.allyRole==='porter'){const threat=foes.filter(v=>car&&Math.abs(v.x-car.x)<1150&&Math.abs(v.y-car.y)<650).length;const block=b.terrain.find(t=>t.honroBlocker&&!t.broken&&car&&t.x>car.x-35&&t.x<car.x+900);q.blockerId=block?.id;const paused=(hs.carriagePauseUntilRound||-1)>=b.round;const escortFront=Math.max(car?.x||0,...own.filter(v=>v.honroAlly&&!v.honroCivilian&&v.allyRole!=='porter').map(v=>v.x));const pace=b.honroStage===2?escortFront+80:(hero?.x||escortFront)+120;q.carTarget=car?(paused||threat?car.x:Math.max(car.x,Math.min(car.x+560,pace+60,block?block.x-105:(b.honroEscortGoalX??b.width-180)))):u.x;q.dest=car?Math.max(45,Math.min(q.carTarget-95,car.x+420)):u.x;}
  else if(u.allyRole==='healer'||u.allyRole==='ritualist'){const hurt=own.filter(v=>!v.honroCivilian||v.hp<v.maxHp*.7).sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];q.targetId=hurt?.id;q.dest=(hurt?.x||hero?.x||u.x)-100;}else if(u.allyRole==='daoist'||u.allyRole==='medium'){q.targetId=nearest?.id;q.dest=nearest?nearest.x-Math.sign(nearest.x-u.x||1)*980:(car?.x||hero?.x||u.x)-180;}
  else if(nearest&&Math.abs(nearest.x-u.x)<1800){q.dest=nearest.x-Math.sign(nearest.x-u.x||1)*(u.allyRole==='guard'?150:730);}
  else q.dest=(car?.x||hero?.x||u.x)+(u.allyRole==='guard'?310:-230);
  q.dest=clamp(q.dest,45,b.width-100);e.emit('change');
 }
 // A stationary actor may still heal/guard, but must not walk out of its
 // support while Engine.stepUnits intentionally excludes fixed bodies. Also
 // handle a save made midway through the old invalid movement phase.
 if(q.phase==='move'&&u.fixed){q.phase='act';q.elapsed=0;u.vx=u.vy=0;delete u.moveTarget;delete u.aiMove;}
 if(q.phase==='move'&&b.honroTopview){
  const finished=u.allyRole==='porter'?G.HonroTopview.carriageTurn(e,u,q,dt):G.HonroTopview.allyWalk(e,u,q,dt);
  if(finished||q.elapsed>1.7){q.phase='act';q.elapsed=0;u.vx=u.vy=0;}
 }
 if(q.phase==='move'&&!b.honroTopview){
  const target=e.unit(q.targetId),distance=q.dest-u.x,old=u.x;e.walk(u,Math.sign(distance),dt);e.stepUnits(dt);
  if(Math.abs(u.x-old)<.01&&Math.abs(distance)>30&&e.grounded(u)&&u.moveLeft>80)e.jump(u);
  const car=e.unit('objective');if(u.allyRole==='porter'&&car&&!car.dead&&q.carTarget>car.x){car.x=Math.min(q.carTarget,car.x+dt*480);car.y=W.top(b,car.x,car.y);}
  // Porter and carriage are one convoy action: reaching the porter waypoint must not end the action
  // while the carriage is still catching up. This prevents the escort from creeping a few pixels per round.
  const carriageDone=u.allyRole!=='porter'||!car||q.carTarget<=car.x+2;
  const moveDone=Math.abs(distance)<28&&carriageDone;
  if(moveDone||(u.allyRole!=='porter'&&u.moveLeft<5)||q.elapsed>1.7){q.phase='act';q.elapsed=0;u.vx=0;}
 }
 if(q.phase==='act'&&!q.started){q.started=true;let target=e.unit(q.targetId);if(!target||target.dead||target.eaterCapturedBy)target=e.actors(1).sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y))[0];
  if(u.allyRole==='porter'){const car=e.unit('objective'),block=q.blockerId&&b.terrain.find(t=>t.id===q.blockerId&&!t.broken);if(block&&car&&block.x-car.x<260){e.damageTerrain(block,145+u.attack*35,0,u.id);log(e,u,'clear-road',block.id);e.fx('slash',block.x+block.w*.5,block.y+block.h*.4,'#c1b18c',70);if(block.broken)app.event('호위대가 길을 막은 뿌리를 잘라냈다.',{kind:'narration',source:'escort-road-cleared'});}else if(car){car.shield=Math.max(car.shield,38);log(e,u,'escort',car.id);e.fx('ring',car.x,car.y-45,'#b6c1a2',40);}q.phase='after';q.elapsed=0;}
  else if(u.allyRole==='healer'||u.allyRole==='ritualist'){const near=coalition(e).filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<1350).sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];if(near){if(u.allyRole==='healer'){const heal=Math.min(near.maxHp-near.hp,Math.round(near.maxHp*.11));near.hp+=heal;G.HonroClearReport?.heal(b,near,u.id,heal,'action:npc-heal');G.HonroProgression.recordHeal(b,near,u.id,heal);e.fx('text',near.x,near.y-near.h-10,'#b9c6a8',16,'+'+heal);log(e,u,'heal',near.id);}else{const shieldBefore=near.shield;near.shield=Math.max(near.shield,75);G.HonroProgression.shieldAdded(b,near,u.id,shieldBefore);log(e,u,'ward',near.id);}e.fx('line',u.x,u.y-55,'#91b9ad',2,undefined);e.fx('ring',near.x,near.y-45,'#9cb7a4',45);}q.phase='after';q.elapsed=0;}
  else if((u.allyRole==='daoist'||u.allyRole==='medium')&&target&&!target.dead){const nearby=e.actors(1).filter(v=>Math.hypot(v.x-target.x,(v.y-target.y)*.8)<260).length,skill=u.allyRole==='daoist'?(nearby>=2?'M06':'M01'):(nearby>=2?'LO10':'LO09');u.loadout=[skill];u.ranks[skill]=Math.max(1,u.ranks[skill]||1);u.focus=999;let aim=null;
   const targets=[target,...e.actors(1).filter(v=>v!==target).sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y)).slice(0,2)];
   const tag=q.index+'|'+skill+'|'+targets.map(t=>t.id).join(',');let work=aiming.get(e);
   if(!work||work.tag!==tag||e.planningStale(work.key)){work={tag,key:e.planningKey(),steps:allyShot(e,u,C.SKILLS[skill],targets)};aiming.set(e,work);}
   const ready=e.continuePlanning(work.steps);if(!ready){q.started=false;return;}aiming.delete(e);
   if(ready.value){aim=ready.value.aim;target=e.unit(ready.value.targetId);q.targetId=target.id;}
   if(aim&&e.fire(skill,aim.angle,aim.power,true)){b.phase='ally';log(e,u,u.allyRole==='daoist'?'daoist-shot':'curse-shot',target.id);q.phase='flight';q.elapsed=0;}else{u.shield=Math.max(u.shield,28);log(e,u,'hold-fire',target.id);q.phase='after';q.elapsed=0;}}
  else if(target&&!target.dead){const d=Math.hypot(target.x-u.x,(target.y-u.y)*.8);if((u.allyRole==='guard'||u.allyRole==='scout')&&d<320){e.onAttackStart?.(u.id);e.hurt(target,54+u.attack*38,u.id,true,undefined,undefined,'normal',undefined,{attackSide:e.allegiance(u),damageRoll:C.rollDamage(b,{id:'npc-weapon',enemyOnly:true})});e.impulse(target,Math.sign(target.x-u.x)*120,-45);e.fx('slash',target.x,target.y-target.h*.5,'#c1b18c',62);e.emit('sound',{name:'sword'});log(e,u,'sword',target.id);q.phase='after';q.elapsed=0;}
   else if((u.allyRole==='guard'||u.allyRole==='scout')&&d<720){e.onAttackStart?.(u.id);e.hurt(target,31+u.attack*25,u.id,true,undefined,undefined,'normal',undefined,{attackSide:e.allegiance(u),damageRoll:C.rollDamage(b,{id:'npc-weapon',enemyOnly:true})});e.fx('line',u.x,u.y-u.h*.48,'#c9b98f',3,target.x,target.y-target.h*.5);e.fx('slash',target.x,target.y-target.h*.5,'#b5a781',48);log(e,u,'sword-wave',target.id);q.phase='after';q.elapsed=0;}
   else {u.shield=Math.max(u.shield,34);log(e,u,'guard',u.id);q.phase='after';q.elapsed=0;}}
  else {log(e,u,'advance',u.id);q.phase='after';q.elapsed=0;}
 }
 if(q.phase==='flight'){for(const shot of [...b.projectiles])if(b.projectiles.includes(shot))e.stepProjectile(shot,dt);e.stepUnits(dt);if(!b.projectiles.length&&!e.settleBusy()){q.phase='after';q.elapsed=0;}}
 if(q.phase==='after'){e.stepUnits(dt);if(q.elapsed>=e.actionReviewSeconds())finish(e,q);}
}
function missionTick(app,dt){G.HonroMission.tick(app,dt);}
function restore(e,f){for(const u of coalition(e)){const hpBefore=u.hp;u.hp=Math.min(u.maxHp,u.hp+Math.round(u.maxHp*f));G.HonroClearReport?.heal(e.b,u,'',u.hp-hpBefore,'environment:restore');G.HonroProgression.recordHeal(e.b,u,'',u.hp-hpBefore);if(!u.honroCivilian)u.focus=Math.min(u.maxFocus,u.focus+Math.round(u.maxFocus*(f+.10)));e.fx('ring',u.x,u.y-u.h*.5,'#a9b892',40);}}
function execute(app,a){const e=app.engine,b=e.b,st=app.stage,hero=e.heroesAlive()[0];if(!a)return true;
 if(a.type==='multi'){
   // Reserve all spawn positions before mutating the world: a blocked second group
   // must not duplicate the first group every retry.
   const pending=[];const shadow={...b,units:[...b.units],nextId:b.nextId};
   for(const [qi,q] of (a.actions||[]).entries())if(q.type==='spawn'||q.type==='sniperAmbush'){const list=prepareSpawn(shadow,st,{...q,diversitySource:a.source,diversityOffset:pending.length,source:q.source||(a.source?a.source+':'+qi:undefined),contributionSource:q.contributionSource||((a.contributionSource||a.source)?(a.contributionSource||a.source)+':'+qi:undefined)},hero);if(!list)return false;pending.push(...list);shadow.units.push(...list);}
   b.nextId=shadow.nextId;b.units.push(...pending);b.honroCounters.spawned+=pending.length;
   for(const q of a.actions||[])if(q.type!=='spawn'&&q.type!=='sniperAmbush')execute(app,q);
   return true;
 }
 if(a.type==='carriagePause'){b.honroState.carriagePauseUntilRound=Math.max(b.honroState.carriagePauseUntilRound??-1,b.round+Math.max(0,(a.rounds||1)-1));return true;}
 if(a.type==='sniperAmbush'||a.type==='spawn'){
   const shadow={...b,units:[...b.units],nextId:b.nextId},list=prepareSpawn(shadow,st,a,hero);if(!list)return false;
   b.nextId=shadow.nextId;b.units.push(...list);b.honroCounters.spawned+=list.length;return true;
 }
 if(a.type==='ally'){const x=clamp(a.x,50,b.width-60),y=st.id===7&&!b.honroLayoutRevision?(hero?.y||3500):undefined;const u=W.ally(b,st,'ally-'+b.nextId,a.role,x,y),p=G.HonroTerrain.place(b,u,{flying:false,maxDistance:1600});if(!p)return false;Object.assign(u,p,{spawnX:p.x,spawnY:p.y});b.nextId++;b.units.push(u);}
 if(a.type==='convoyWard'){if(a.actor&&!e.b.units.some(u=>u.id===a.actor&&!u.dead&&u.hp>0))return false;const car=e.unit('objective');for(const u of coalition(e).filter(v=>!car||Math.abs(v.x-car.x)<1200)){const before=u.shield;u.shield=Math.max(u.shield,90);G.HonroProgression.shieldAdded(b,u,a.actor||'',before);e.fx('ring',u.x,u.y-u.h*.5,'#9ebaa8',48);}return;}
 if(a.type==='wind')b.wind=a.value;if(a.type==='fog')e.setEnvironment({dragScale:a.drag});if(a.type==='rest')restore(e,a.fraction);if(a.type==='break'){const t=G.HonroQuestTargets.records(b).find(t=>t.id===a.terrain);if(t){t.broken=true;t.hp=0;G.HonroQuestTargets.sync(b,t);b.sceneVersion++;}}
}
function prepareSpawn(b,st,a,hero){
 const archer=b.units.find(u=>u.side===0&&u.cls==='archer'&&!u.dead)||hero;
 if(a.type==='sniperAmbush'&&!archer)return null;
 const list=[];
 for(let i=0;i<(a.n||1);i++){
   const ambush=a.type==='sniperAmbush',id=b.nextId++,x=clamp(ambush?archer.x+420+(i%3)*160:a.x+(i-(a.n-1)/2)*(a.spacing??115),90,b.width-100);
   const y=ambush?Math.max(120,archer.y-100-(i%2)*120):Number.isFinite(a.airY)?a.airY:a.y!==undefined?W.top(b,x,a.y,a.support):st.id===7&&!b.honroLayoutRevision?hero?.y:undefined;
     const kind=ambush?'crow':a.kind,u=W.createEnemy(b,st,x,kind,id,y,Number.isFinite(a.airY));
     if(a.act3Authored){u.honroAct3Encounter=1;u.honroAct3Elite=!!a.elite&&i===0;u.honroCohort='reinforcement';G.HonroAct3Encounters.tune(b,u,st);G.HonroProgression.enemyXP(b,u);}
   if(b.honroEncounterRevision){u.combatBaseHp*=.6;u.hp=u.maxHp=Math.max(1,Math.round(u.maxHp*.6));}
   if(ambush)u.y=y;
   const space={...b,units:[...b.units,...list]},flying=!!W.archetypes[kind]?.flying;
   // Authored opt-in: reserve the same full-body air clearance used by flying
   // movement, including one-way branches. Other spawn policies stay unchanged.
   const accept=flying&&a.requireFlightClearance?(x,y)=>C.flightClear({b:space},u,{x,y}):null;
   const position=G.HonroTerrain.place(space,u,{flying,maxDistance:a.maxDistance??1600,clearance:a.clearance??18,accept});
   if(!position)return null;
   Object.assign(u,position,{honroContributionId:'wave:'+(a.contributionSource||a.source||[a.type,a.kind,a.x,a.y].join(':'))+':'+i,id:(ambush?'sniper-crow-':'event-')+id,awake:true,aggroUntil:b.round+(ambush?6:3),spawnX:position.x,spawnY:position.y});
   if(a.source)u.honroSpawnSource=a.source;
   if(ambush){u.group=-2;u.honroTargetId=archer.id;u.honroTargetUntil=b.round+5;}
   if(!ambush)G.HonroMonsterDiversity?.spawn(space,u,a.diversitySource||a.source,(a.diversityOffset||0)+i);
   list.push(u);
 }
 return list;
}
G.HonroAllies={attach,tick,missionTick,execute,coalition,safeAllyAim};
})(globalThis);
;await yieldIfNeeded();(function(G){'use strict';
const alive=u=>u&&!u.dead&&u.hp>0;
function active(b){return b?.honroStage===10&&!b.honroCustom;}
function ready(b){return active(b)&&!!b.honroState?.sodanCoop&&(b.honroState.coopHold||0)>=6;}
const partyIds=['p-archer','p-mage','p-knight','boss'];
function exit(b){const p=b.honroMapAnchors?.exit||(b.honroMarkers||[]).find(m=>m.type==='exit')||{x:b.width-140};return {id:'sodan-safe-exit',kind:'exit',x:p.x,y:G.HonroWorld.top(b,p.x,p.y,p.support),support:p.support,label:'동쪽 외문'};}
function gate(b,goal=exit(b)){const x=goal.x-125;return{x,y:G.HonroWorld.top(b,x,goal.y,goal.support)};}
function present(u,b,goal,door){if(b.honroTopview)return alive(u)&&!u.airborne&&!u.jumping&&G.HonroTopview.atExit(b,u,goal);return alive(u)&&u.x>=door.x+Math.max(12,u.r*.5)&&u.x<=b.width-20&&!u.airborne&&!u.jumping&&Math.abs(u.vy)<3&&Math.abs(u.y-G.HonroWorld.top(b,u.x,goal.y,goal.support))<10;}
function progress(b,goal=exit(b)){const door=gate(b,goal);return partyIds.filter(id=>present(b.units.find(u=>u.id===id),b,goal,door)).length;}
function failure(b){return ready(b)&&!['withdrawing','safe'].includes(memory(b)?.phase)&&partyIds.some(id=>!alive(b.units.find(u=>u.id===id)))?'동쪽 외문으로 피하기 전에 동행을 잃었다.':null;}
const escapeLines=[
 ['소단','됐어요! 매듭은 다 풀었어요. 이제 저도 움직일 수 있어요.'],
 ['휘겸','동쪽 외문으로 갑시다. 소단, 우리 뒤에 붙으시오. 네 사람 다 건너오면 내가 문을 닫겠소.']
].map(([who,text],i)=>[who,text,{kind:'character',storyId:'stage10-east-gate-retreat',rowId:'stage10-east-gate-retreat:'+i,storyTitle:'동쪽 외문으로'}]);
function memory(b){return b.honroState?.sodanWithdrawal;}
function save(app){if(!app.persist)return;app.profile.honroBattle=JSON.parse(JSON.stringify(app.engine.b));app.persist();}
function tick(app,dt=0){const e=app.engine,b=e.b;if(!ready(b)||['won','lost'].includes(b.phase))return;
 const sodan=e.unit('boss');if(!alive(sodan)||failure(b))return;
 const s=b.honroState.sodanWithdrawal??={phase:'escape',elapsed:0};
 if(s.phase==='escape')s.version=2;
 if(s.phase!=='escape'||b.side!==0||b.phase!=='aim'||app.dialogue||b.projectiles.length||e.settleBusy())return;
 const goal=exit(b);
 if(!s.announced){
  s.announced=true;s.version=2;
  app.event('의식 완료 · 동쪽 외문으로 동행 4명 대피');
  if(G.HonroStory?.start(app,escapeLines,{id:'stage10-east-gate-retreat',title:'동쪽 외문으로'}))return;
  save(app);
 }
 // The three heroes use their normal turns. Sodan follows on the continuous
 // lower road with the ordinary body sweep; she never takes a player slot.
 sodan.fixed=false;delete sodan.aiMove;delete sodan.moveTarget;
 const end=Math.min(goal.x+68,b.width-35);
 if(b.honroTopview&&dt>0){G.HonroTopview.sodanWalk(e,sodan,goal,dt);}
 else if(sodan.x<end-2&&dt>0){
  sodan.walkSpeed=310;
  sodan.moveLeft=Math.max(4,sodan.moveLeft||0);
  e.walk(sodan,Math.min(1,(end-sodan.x)/(sodan.walkSpeed*dt)),dt,true);
 }
 const arrived=progress(b,goal);
 if(s.arrived!==arrived){s.arrived=arrived;app.dirty=true;}
 if(arrived<4)return;
 s.phase='withdrawing';s.party=partyIds.map(id=>e.unit(id).name);s.elapsed=0;app.cancelInput();save(app);
}
function complete(b){return !!memory(b)&&memory(b).phase==='safe';}
// Presentation only: the completed chapter's ordinary world-map conversation.
// Derive this from the live dialogue so finish/skip/reload never leave a flag behind.
function worldOutroDialogue(app){const b=app?.engine?.b,d=app?.dialogue;return !!(active(b)&&b.phase==='won'&&memory(b)?.worldOutro===2&&app.screen==='battle'&&d?.after==='outcome'&&d.lines?.[d.index]?.[2]?.camera?.id==='10:safe-exit');}
function outro(b,lines){if(!active(b)||b.phase!=='won')return lines;
 if(memory(b)?.version===2){
  const atGate=[
   ['소단',/이제.*(?:놔도|놓아도).*돼요/, '문은…… 닫혔어요?'],
   ['담허',/^(?:그래, 묶여 있던 혼은|천천히 펴보게)/, '닫혔네. 혼은 양옆 진이 받아 갔고. 아까 그 나무가 살아 있는 진목 노릇을 한 게야. 이제 손가락에 힘 빼고 천천히 펴 보게.'],
   ['휘겸',/^뒤(?:쫓아 오는|따르는) 기척은/, '빗장을 걸었소. 내가 문 곁에 있을 테니 앉아서 숨부터 돌리시오.'],
   ['휘겸',/^(?:동쪽 외문이오\.|새 무리는 동쪽 외문을 넘어왔소)/, '이 문으로 넘어왔소. 짐승들 발목에 북쪽 산길의 붉은 진흙이 묻어 있었소.']
  ];
  lines=lines.map(row=>{const entry=atGate.find(([who,pattern])=>who===row[0]&&pattern.test(row[1]));return entry?[row[0],entry[2],{...row[2],sodanGateLine:true}]:row;});
 }
 if(b.honroNarrativeRevision!==1)return lines;
 // In-flight campaigns own a frozen narrative snapshot. Project only the five
 // approved old phrases into the safe outro; keep its cursor, metadata and all
 // other saved lines. Canonical/new phrases pass through unchanged.
 if(G.HonroNarrativeCatalogue.active(b))return lines;
 const projection=G.HONRO_NARRATIVE_COMPAT.safeOutroProjection;
 return lines.map(row=>{const match=projection.find(p=>p.from===row[1]&&p.who===row[0]);return match?[row[0],match.to,...row.slice(2)]:row;});
}
// Extraction ends on the existing east exit surface. Only the survivors move;
// enemies, HP, resources and the six-turn mission remain the terminal battle.
// The stamp makes old saved outros and repeated outcome calls idempotent.
function prepareWorldOutro(app){const b=app.engine?.b;if(!active(b)||!complete(b)&&b.phase!=='won')return;
 const s=b.honroState.sodanWithdrawal??={phase:'safe'};if(s.worldOutro===2)return;
 if(s.version===2){const goal=exit(b),door=gate(b,goal);
  for(const u of b.units.filter(u=>partyIds.includes(u.id)&&present(u,b,goal,door)))Object.assign(u,{vx:0,vy:0,airborne:false,jumping:false,facing:u.id==='boss'?-1:1});
  s.worldOutro=2;return;
 }
 // Old snapshots may have committed the one-person extraction already.
 const goal=exit(b),support=goal.support,units=b.units.filter(u=>alive(u)&&(u.side===0&&!u.summoned||u.id==='boss'));
 const ground=x=>G.HonroMapEngine.surfaceY(b.honroWorldTerrain?.length?b.honroWorldTerrain:b.terrain,x,goal.y,support)?.y;
 const layout=start=>units.map((u,i)=>{const x=start+i*110;return{x,y:ground(x)};});
 let points=layout(goal.x-390).map(p=>({...p,y:p.y??G.HonroWorld.top(b,p.x,goal.y,support)}));const foes=b.units.filter(u=>alive(u)&&u.side===1);
 if(points.some(p=>foes.some(u=>Math.hypot(u.x-p.x,u.y-p.y)<650))){
  // The v6 map already continues beyond Play Bounds. When pursued to the gate,
  // use that real east surface, outside enemy movement bounds, not a new set.
  const east=layout(Math.max(b.width,goal.x)+900);if(east.every(p=>Number.isFinite(p.y)))points=east;
 }
 units.forEach((u,i)=>Object.assign(u,points[i],{vx:0,vy:0,airborne:false,jumping:false,facing:i<2?1:-1}));
 s.worldOutro=2;
}
function drawGate(c,b){
 if(!active(b))return;
 const s=memory(b),{x,y}=gate(b),closed=s?.version===2?(s.phase==='safe'?1:s.phase==='withdrawing'?Math.min(1,(s.elapsed||0)/.72):0):0;
 c.save();c.translate(x,y);c.lineJoin='round';
 const panel=(fill,stroke,points)=>{c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=2;c.stroke();};
 panel('#454940','#282e2b',[[-60,-3],[-39,-12],[40,-12],[62,-2],[58,5],[-54,4]]);
 for(const i of [-1,1]){
  const a=46*i,w=i*9;
  panel('#514537','#252c29',[[a-w,0],[a+w,0],[a+w,-104],[a-w,-104]]);
  panel('#6d6651','#353a30',[[a-w-3,-8],[a+w+3,-8],[a+w+3,1],[a-w-3,1]]);
  const span=7+39*closed;
  panel('#3e3d34','#212a29',[[a,-7],[a-i*span,-7],[a-i*span,-94],[a,-94]]);
  for(let j=8;j<span-2;j+=7){c.fillStyle='#6e5d48';c.fillRect(a-i*j,-92,1,83);}
 }
 panel('#2e3735','#222a27',[[-70,-100],[-52,-114],[-32,-126],[31,-126],[51,-115],[70,-100],[54,-103],[-55,-103]]);
 c.strokeStyle='#747d67';c.lineWidth=2;c.beginPath();c.moveTo(-56,-109);c.quadraticCurveTo(-32,-117,-25,-126);c.lineTo(27,-126);c.quadraticCurveTo(34,-117,56,-109);c.stroke();
 if(closed>.97){c.fillStyle='#75604b';c.fillRect(-35,-61,70,6);c.fillStyle='#a29470';c.fillRect(-4,-62,8,8);}
 c.restore();
}
function frame(app,dt){const b=app.engine?.b,s=b&&active(b)&&memory(b);if(!s||s.phase!=='withdrawing')return false;
 let node=document.getElementById('sodan-withdrawal');if(!node){node=document.createElement('section');node.id='sodan-withdrawal';node.className='sodan-withdrawal';node.setAttribute('role','status');node.textContent=s.version===2?'네 사람 대피 완료 · 동쪽 외문을 닫는다':'퇴로 확보 · 일행 철수';app.root.appendChild(node);}
 app.acc=0;app.scene?.render?.(app.engine,0,app.selected,app.power,false,0,true);
 if(document.hidden)return true;s.elapsed=Math.min(1.1,(s.elapsed||0)+dt);if(s.elapsed<1.1)return true;
 // Only presentation time advances after extraction. The live battle, survivors,
 // remaining enemies and their HP are preserved in the terminal snapshot.
 s.phase='safe';node.remove();app.checkMission(app.engine);prepareWorldOutro(app);save(app);app.outcome();return true;
}
G.HonroSodanWithdrawal={active,ready,exit,gate,progress,failure,drawGate,tick,frame,complete,outro,prepareWorldOutro,worldOutroDialogue};
})(globalThis);
;await yieldIfNeeded();(function(G){'use strict';
const FINALE_TURNS=6,FINALE_CAP=28;
function finaleSites(b){const a=b.honroMapAnchors||{},site=(id,key,fraction,label)=>{const p=a[key]||{x:b.width*fraction};return{id,label,x:p.x,y:G.HonroWorld.top(b,p.x,p.y,p.support),support:p.support};};return[site('west','westHall',.33,'서쪽 전각'),site('east','eastHall',.71,'동쪽 전각')];}
function ritualPosition(b,sodan){const a=b.honroMapAnchors?.ritual||{x:b.width*.5,y:sodan.spawnY||sodan.y};return G.HonroTerrain.place(b,sodan,{x:a.x,y:G.HonroWorld.top(b,a.x,a.y,a.support),flying:false,maxDistance:160,clearance:12});}
function channeler(b,sodan,position,fraction){const C=G.HONRO_CORE,h=structuredClone(b.heroes.occultist),level=Math.floor(G.HonroProgression.plan(10).entryLevel);h.xp=Math.max(h.xp,C.xpAtLevel(level));C.autoTrain(h,'occultist');sodan.loadout=C.knownSkills(h,'occultist').filter(id=>!C.SKILLS[id].passive).slice(0,4);C.applyHero(sodan,h,true);
 Object.assign(sodan,position,{name:'소단',side:2,spiritSight:true,honroAlly:true,honroCivilian:false,allyRole:'channeler',fixed:true,acted:true,vx:0,vy:0,shield:0,hp:Math.max(1,Math.round(sodan.maxHp*fraction))});delete sodan.moveTarget;delete sodan.aiMove;sodan.airborne=sodan.jumping=false;
 Object.assign(b.honroState,{finaleAnchor:position,finaleRevision:2,finaleSites:finaleSites(b)});
}
function rush(app,index){const e=app.engine,b=e.b,hs=b.honroState,boss=e.unit('boss'),space=Math.max(0,FINALE_CAP-e.alive(1).length),n=Math.min(index===0?8:6,space);if(!n)return index>0;
 const before=new Set(b.units.map(u=>u.id)),sites=hs.finaleSites||finaleSites(b),front=sites[index%2===0?1:0],rear=sites[index%2===0?0:1];
 const actions=[{type:'spawn',n:Math.ceil(n*.5),kind:index%3===2?'boar':'hound',site:front},{type:'spawn',n:Math.floor(n*.5),kind:'crow',site:rear}].filter(a=>a.n).map(a=>({...a,x:a.site.x,y:a.site.y,support:a.site.support,spacing:140,maxDistance:288,requireFlightClearance:a.kind==='crow'&&!b.honroCustom&&b.honroMap?.stage10LocationPaint?.revision===1,source:a.site.id,contributionSource:`finale:${index}:${a.site.id}`}));
 if(G.HonroAllies.execute(app,{type:'multi',actions})===false)return false;
 const units=b.units.filter(u=>!before.has(u.id));for(let i=0;i<units.length;i++){const u=units[i];u.aggroUntil=b.round+10;if(i%2===0){u.honroTargetId=boss.id;u.honroTargetUntil=b.round+10;}}
 hs.finaleSites=sites;hs.finaleWaves??=[];hs.finaleWaves.push({index,round:b.round,units:units.map(u=>u.id),sources:actions.map(a=>a.source)});for(const site of sites)e.fx('ring',site.x,site.y-45,'#b85e5b',90);app.event(`${front.label}에서 짐승, ${rear.label}에서 까마귀가 몰려온다 · ${index+1}차 습격`);return true;}
function finale(app){const e=app.engine,b=e.b,hs=b.honroState,sodan=e.unit('boss');if(!sodan||sodan.dead)return;
 if(!hs.sodanCoop){if(!app.actorBoundary||(hs.receivers||0)<2)return;
  if(G.HonroNarrativeRevision?.active(b)){if(!G.HonroNarrativeRevision.beforeCooperation(app))return;}else if(sodan.hp>sodan.maxHp*.42)return;
  const position=ritualPosition(b,sodan);if(!position)return;
  if(!rush(app,0))return;
  hs.sodanBreach={units:hs.finaleWaves[0].units,round:b.round,source:'east'};hs.sodanCoop=true;hs.coopHold=0;hs.finaleLastEnemyEnd=b.teamEnds[1]+(b.side===1?1:0);hs.finaleWave=0;
  channeler(b,sodan,position,.8);e.fx('ring',sodan.x,sodan.y-12,'#deb56e',80);
  b.queue=(b.queue||[]).filter(id=>id!==sodan.id);
  const beforeCoop=l=>l[2]?.storyId?.includes('entry-follow-10-');hs.deferredStory=(hs.deferredStory||[]).filter(q=>!q.lines.some(beforeCoop));hs.storyQueue=(hs.storyQueue||[]).filter(l=>!beforeCoop(l));
  if(G.HonroNarrativeRevision?.active(b)){hs.sodanBinding.phase='protecting';app.sayLines(G.HonroStoryContent.cooperationDefense?.(b)||[]);}else app.sayLines(G.HONRO_NARRATIVE_V0?.cooperation||G.HonroStoryContent.cooperation(b));
 }
 // Old saves retain earned progress, but need six full enemy turns in total.
 if(hs.finaleRevision!==2){const position=ritualPosition(b,sodan);if(position)channeler(b,sodan,position,Math.min(1,sodan.hp/sodan.maxHp));}
 hs.finaleLastEnemyEnd??=b.teamEnds[1];hs.finaleWave??=hs.coopHold||0;hs.finaleDefenseTurns??=hs.coopHold||0;hs.finaleAnchor??={x:sodan.x,y:sodan.y};
 if(!G.HonroSodanWithdrawal.ready(b)){Object.assign(sodan,{...hs.finaleAnchor,side:2,honroAlly:true,allyRole:'channeler',fixed:true,vx:0,vy:0});delete sodan.moveTarget;delete sodan.aiMove;}
 b.enemyLimit=b.honroActiveLimit=6;
 if(!app.actorBoundary)return;
 if(b.teamEnds[1]>hs.finaleLastEnemyEnd){const delta=b.teamEnds[1]-hs.finaleLastEnemyEnd,previous=hs.coopHold||0;hs.finaleLastEnemyEnd=b.teamEnds[1];hs.finaleDefenseTurns+=delta;hs.coopHold=Math.min(FINALE_TURNS,hs.finaleDefenseTurns);if(previous<3&&hs.coopHold>=3)app.sayLines(G.HonroNarrativeRevision?.active(b)?G.HonroStoryContent.finaleMidpoint(b):G.HONRO_NARRATIVE_V0?.finaleMidpoint||G.HonroStoryContent.finaleMidpoint(b));}
 // An unusually early conversion must not leave empty rounds until the campaign pacing floor.
 if(hs.finaleDefenseTurns<FINALE_TURNS&&hs.finaleWave<hs.finaleDefenseTurns&&rush(app,hs.finaleDefenseTurns))hs.finaleWave=hs.finaleDefenseTurns;
}
function reinforceHold(app,boundary){
 const e=app.engine,b=e.b,hs=b.honroState,st=app.stage;
 if(!app.actorBoundary||b.side!==0||st.id===10||b.honroAct1SiteRevision===1||hs.lastHabitatRound===b.round)return;
 const objective=G.HonroObjectives.state(b,st);
 const holding=st.objective==='defend'||objective.objectiveReady&&!objective.complete&&objective.settleRounds>0;
 if(!holding||objective.complete)return;
 const response=hs.habitatHold??={version:1,remaining:Math.max(0,(st.objective==='defend'?12:6)-(hs.habitatContributionWave||0)*3)};
 if(!response.remaining)return;
 const foes=e.combatEnemies().length,minimum=st.objective==='defend'?7:5;
 if(foes>=minimum||b.units.filter(u=>!u.honroObjectiveTarget).length>=68)return;
 const sites=(b.honroMarkers||[]).filter(m=>m.type==='hauntHabitat');if(!sites.length)return;
 // Alternate habitats and keep emergence away from the party's feet.
 const heroes=e.heroesAlive(),ranked=sites.map(site=>({site,distance:Math.min(...heroes.map(u=>Math.hypot(u.x-site.x,(u.y-site.y)*.6)))})).sort((a,c)=>c.distance-a.distance);
 const choices=ranked.filter(item=>item.distance>=400&&item.distance<=1600).sort((a,c)=>a.distance-c.distance);
 if(!choices.length)return;
 const serial=hs.actorTurnSerial||0;
 if(!response.warning){response.warning={serial,site:choices[0].site.id};app.event(`${choices[0].site.label}에서 기척이 다가온다. 다음 동행 행동 뒤 빈 진입로로 들어온다.`);return;}
 if(serial<=response.warning.serial)return;
 const ordered=[...choices.filter(q=>q.site.id===response.warning.site),...choices.filter(q=>q.site.id!==response.warning.site)];
 const n=Math.min(3,response.remaining,minimum-foes,68-b.units.filter(u=>!u.honroObjectiveTarget).length);
 for(const item of ordered){const site=item.site;
  for(let count=n;count>=1;count--){
   const spawned=G.HonroAllies.execute(app,{type:'spawn',n:count,kind:site.kind,x:site.x,y:site.y,support:site.support,spacing:110,maxDistance:260,clearance:100,source:site.id,contributionSource:`habitat:${st.objective}:${hs.habitatContributionWave||0}`});
   if(spawned===false)continue;
   hs.habitatContributionWave=(hs.habitatContributionWave||0)+1;response.remaining-=count;delete response.warning;hs.lastHabitatRound=b.round;
   e.fx('ring',site.x,site.y-28,'#a46f73',56);app.event(`${site.label}에서 들린 짐승이 나타났다.`);return;
  }
 }
}
function tick(app,dt){
 const e=app.engine;if(!e||app.training)return;
 if(G.HonroAct5?.active(e.b)){G.HonroAct5.tick(app,dt);return;}
 if(e.b.honroCustom){G.HonroAuthored.tick(app,dt);return;}
 if(G.HonroAct2?.active(e.b)){G.HonroAct2.tick(app,dt);return;}
 if(G.HonroAct3?.active(e.b)){G.HonroAct3.tick(app,dt);return;}
 const b=e.b,st=app.stage,hs=b.honroState,heroes=e.heroesAlive();if(b.phase==='won')G.HonroObjectiveContributions?.beforeComplete(b,st);if(!hs||!heroes.length||['won','lost'].includes(b.phase))return;
 if(st.id===7&&(hs.rescuedCount||0)>=3){const instruction=l=>l[2]?.storyId?.includes('entry-follow-7-');hs.deferredStory=(hs.deferredStory||[]).filter(q=>!q.lines.some(instruction));hs.storyQueue=(hs.storyQueue||[]).filter(l=>!instruction(l));}
 const lead=heroes.reduce((a,c)=>a.x>c.x?a:c),height=Math.min(...heroes.map(h=>h.y)),boundary=b.phase==='transition'&&!b.projectiles.length&&!e.settleBusy();
 for(const m of b.honroMarkers||[]){
   if(m.action==='rescue'&&!m.collected){const target=e.unit(m.target);G.HonroObjectiveContributions?.approach(b,m.id,heroes,target,220,!!target&&!e.alive(1).some(v=>Math.abs(v.y-target.y)<=150&&Math.hypot(v.x-target.x,(v.y-target.y)*.75)<=220));}
   const distance=m.type==='sector'?430:m.type==='relic'?155:180;
   if(heroes.some(u=>Math.hypot(u.x-m.x,(u.y-m.y)*(m.type==='sector'?.6:1))<distance))m.honroPending=true;
   if(!m.honroPending)continue;
   if(m.type==='sector'&&!hs.flags['sector-'+m.sector]){hs.flags['sector-'+m.sector]=true;app.event(m.label);}
   // Approaching the finite supply point is sufficient, even during combat.
   if(m.type==='rest'&&!m.collected){
     m.collected=true;for(const u of G.HonroAllies.coalition(e)){const hpBefore=u.hp,focusBefore=u.focus;u.hp=Math.min(u.maxHp,u.hp+Math.round(u.maxHp*.30));G.HonroClearReport?.heal(b,u,'',u.hp-hpBefore,'environment:supply');G.HonroProgression.recordHeal(b,u,'',u.hp-hpBefore);if(!u.honroCivilian)u.focus=Math.min(u.maxFocus,u.focus+Math.round(u.maxFocus*.40));if(u.hp>hpBefore||u.focus>focusBefore)e.fx('ring',u.x,u.y-u.h*.5,'#a9b892',40);}e.emit('sound',{name:'heal'});
   }
   if(m.type==='relic'&&!m.collected){m.collected=true;app.event('길에 남은 기록을 주웠다.',{kind:'narration',source:'relic-found'});}
 }
 // Once started, only leaving the array (or losing the holder) releases it.
 // grounded() includes velocity: a small hit used to cancel it before any movement.
 if(st.id===5){const ritual=hs.ritual,veil=G.HonroQuestTargets.records(b).find(t=>t.id==='waterfall-veil'),cleat=G.HonroQuestTargets.records(b).find(t=>t.id==='cliff-cleat'),marker=b.honroMarkers.find(m=>m.id==='receiver-5'),holder=ritual?.holderId?e.unit(ritual.holderId):null;const valid=!!ritual?.active&&!!holder&&!holder.dead&&holder.hp>0&&holder.cls==='mage'&&!!marker&&Math.abs(holder.x-marker.x)<=125&&Math.abs(holder.y-marker.y)<=80;if(cleat?.broken){if(ritual)ritual.active=false;hs.waterfallSight=true;if(veil&&!G.HonroStage5Waterfall?.active(b)&&!veil.broken){veil.broken=true;b.sceneVersion++;}if(marker)marker.collected=true;}else if(valid){hs.waterfallSight=true;if(veil&&!G.HonroStage5Waterfall?.active(b)&&!veil.broken){veil.broken=true;b.sceneVersion++;}}else{if(ritual?.active){ritual.active=false;app.event(G.HonroStage5Waterfall?.active(b)?'담허가 물길진에서 벗어나 낙수가 다시 화살을 쓸어 내린다.':'담허가 받이진에서 벗어나 물틈이 다시 닫혔다.',{kind:'narration',source:'ritual-released'});}hs.waterfallSight=false;if(veil?.broken&&!G.HonroStage5Waterfall?.active(b)){veil.broken=false;b.sceneVersion++;}}G.HonroStage5WaterGeometry?.setOpen(b,!!hs.waterfallSight);}
 const obj=e.unit('objective');
 if(st.objective==='rescue'&&obj&&!obj.dead){
   if(!hs.rescued&&heroes.some(u=>Math.hypot(u.x-obj.x,u.y-obj.y)<205))hs.rescuePending=true;
   if(hs.rescuePending&&!hs.rescued){const rescuer=heroes.find(u=>Math.hypot(u.x-obj.x,u.y-obj.y)<205);if(rescuer)G.HonroObjectiveContributions?.interact(b,'rescue-carrier',rescuer);hs.rescued=true;app.event('뒤처진 피란민이 일행을 따라오기 시작한다.',{kind:'narration',source:'refugee-following'});}
   if(hs.rescued&&b.honroTopview&&b.phase!=='ally'){G.HonroTopview.guideCarrier(e,obj,heroes,dt);}
   else if(!b.honroTopview&&hs.rescued&&lead.x>obj.x+65&&b.phase!=='ally'){const before={x:obj.x,y:obj.y},exit=b.honroMarkers.find(m=>m.type==='exit')||b.honroMapAnchors?.exit||{x:b.width-130,y:obj.y};obj.x+=Math.min(dt*360,lead.x-obj.x-60);obj.y=G.HonroWorld.top(b,obj.x,obj.y);G.HonroObjectiveContributions?.escort(b,'rescue-carrier',obj,{x:exit.x-140,y:exit.y},[lead],before,0);}
 }
 if(boundary&&b.side===0&&hs.lastRitualRound!==b.round){
   hs.lastRitualRound=b.round;hs.lastRound=b.round;
   if(st.objective==='ritual'){const k=heroes.find(u=>u.cls==='knight'),altar=b.honroMarkers.find(m=>m.type==='shrine');if(k&&altar&&!G.HonroQuestTargets.records(b).some(t=>t.honroSeal&&!t.broken)&&Math.hypot(k.x-altar.x,k.y-altar.y)<330){hs.hold++;app.event(hs.hold>=st.holdRounds?'왕문이 열렸다.':'왕문 의식 · '+hs.hold+'/'+st.holdRounds,hs.hold>=st.holdRounds?{kind:'narration',source:'royal-gate-open'}:{});}}
 }
 const progress=st.objective==='overwatch'?(obj?.x||0):st.objective==='escort'?Math.max(lead.x,obj?.x||0):lead.x;
 G.HonroEncounters.update(app,dt,{progress,height,broken:G.HonroQuestTargets.records(b).filter(t=>t.honroSeal&&t.broken).length,collected:b.honroMarkers.filter(m=>m.type==='relic'&&m.collected).length});
 reinforceHold(app,boundary);
 if(st.objective==='overwatch'&&obj&&!obj.dead&&!e.alive(1).length&&!G.HonroEncounters.pending(b)&&!b.projectiles.length){if(b.honroTopview)G.HonroTopview.escortAdvance(e,obj,dt*180);else{obj.x=Math.min(b.honroEscortGoalX,obj.x+dt*180);obj.y=G.HonroWorld.top(b,obj.x,obj.y);}}
 if(st.id===10){finale(app);G.HonroSodanWithdrawal.tick(app,dt);}
 if(st.objective==='arrival'){const exit=b.honroMarkers.find(m=>m.type==='exit')||b.honroMapAnchors?.exit||{x:b.width-180},atExit=u=>b.honroTopview?G.HonroTopview.atExit(b,u,exit):u.x>=exit.x-120,arrived=heroes.filter(atExit);if(arrived.length)G.HonroObjectiveContributions?.arrive(b,'arrival',[arrived.find(u=>u.id===b.active)||arrived[0]],atExit);}
 G.HonroObjectiveContributions?.observe(b,heroes);
 app.checkMission(e);
}
G.HonroMission={tick,finale,finaleSites,FINALE_TURNS,FINALE_CAP,reinforceHold};
})(globalThis);
;await yieldIfNeeded();(function(G){'use strict';
const durability=t=>Number.isFinite(t?.hp)?Math.max(0,Math.ceil(t.hp))+(Number.isFinite(t.maxHp)&&t.maxHp>0?'/'+Math.ceil(t.maxHp):''):'';
const oldSettlement=(b,st)=>({ledger:1,seals:1,rescue3:2,bierboss:b.honroNarrativeRevision===1?0:1,prepare:b.honroNarrativeRevision===1?0:2})[st.objective]||0;
function settlement(b,st){
 const hs=b.honroState||{},old=oldSettlement(b,st),rounds=old===1?2:old,h=hs.objectiveSettlement;
 if(h?.version===1)return{rounds,progress:Math.min(rounds,h.progress+Math.max(0,(b.teamEnds?.[1]||0)-h.enemyEnd)),preserved:!!h.preserved};
 const elapsed=hs.objectiveReadyRound===undefined?0:Math.max(0,b.round-hs.objectiveReadyRound);
 return{rounds,progress:Math.min(old,elapsed),preserved:old>0&&elapsed>=old};
}
function updateSettlement(b,st,ready){
 const hs=b.honroState;if(!hs)return;
 if(!ready){delete hs.objectiveReadyRound;delete hs.objectiveSettlement;return;}
 const s=settlement(b,st);hs.objectiveReadyRound??=b.round;
 if(!s.rounds)return;
 const h=hs.objectiveSettlement;
 // A phase already in progress at completion is not a complete defence interval.
 const enemyEnd=(b.teamEnds?.[1]||0)+(b.side===1&&b.phase!=='transition'?1:0);
 if(h?.version!==1)hs.objectiveSettlement={version:1,progress:s.progress,preserved:s.preserved,enemyEnd};
 else {h.progress=s.progress;h.enemyEnd=Math.max(h.enemyEnd,b.teamEnds?.[1]||0);}
}
// Rescue follows its referenced person in this battle, never its old authoring
// point. Keep the original marker for collection/progress writes and saved maps.
function interactionTarget(b,m){
 if(G.HonroAct3?.active(b)&&m?.action==='act3')return G.HonroAct3.interactionTarget(b,m);
 if(m?.action!=='rescue')return m;
 if(m.collected||!b?.honroMarkers?.includes(m))return null;
 const u=b.units?.find(u=>u.id===m.target);
 return u&&!u.dead&&u.hp>0&&!u.honroResolved&&Number.isFinite(u.x)&&Number.isFinite(u.y)?u:null;
}
function rescueGuards(b,m){
 if(b?.honroAct1SiteRevision!==1||b.honroStage!==7||!m?.rescueGuards?.length)return [];
 const target=interactionTarget(b,m);
 if(!target)return [];
 return b.units.filter(u=>m.rescueGuards.includes(u.id)&&u.side===1&&!u.dead&&u.hp>0&&!u.eaterCapturedBy&&
  !u.honroSubdued&&!u.stun&&u.stunnedRound!==b.round&&(u.stunUntil||0)<=b.round&&
  Math.abs(u.y-target.y)<=190&&Math.abs(u.x-target.x)<=680);
}
function rawState(b,st){
 if(b.honroCustom)return G.HonroAuthored.objectiveState(b);
 if(G.HonroAct5?.active(b))return G.HonroAct5.state(b);
 if(G.HonroAct2?.active(b))return G.HonroAct2.state(b);
 if(G.HonroAct3?.active(b))return G.HonroAct3.state(b);
 const hs=b.honroState||{},markers=b.honroMarkers||[],heroes=b.units.filter(u=>u.side===0&&!u.summoned&&!u.dead&&u.hp>0),obj=b.units.find(u=>u.id==='objective'),boss=b.units.find(u=>u.id==='boss'),seals=G.HonroQuestTargets.records(b).filter(t=>t.honroSeal),left=seals.filter(t=>!t.broken),foes=b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget&&u.summonKind!=='eater'&&!u.dead&&u.hp>0),pending=G.HonroEncounters.pending(b);const all=[];const add=(kind,id,x,y,label,extra={})=>{const t={kind,id,x,y,label,...extra};all.push(t);return t;};
 seals.forEach((t,i)=>add('seal',t.id,t.x+t.w/2,t.y,st.id===5?'절벽 고리쇠 · '+durability(t):st.id===8?`상여 결박 ${i+1} · 공격`:`매듭 ${i+1} · 공격`,{done:!!t.broken,box:t}));
 if(obj&&!obj.dead)add('objective',obj.id,obj.x,obj.y-obj.h,st.objective==='rescue'&&!hs.rescued?'부상자 운반대 · 가까이 이동':`${obj.name} · 보호`,{unitId:obj.id});
 const binding=b.honroNarrativeRevision===1&&st.id===10&&G.HonroQuestTargets.records(b).find(t=>t.id==='sodan-binding');if(binding&&!hs.sodanCoop)add('binding',binding.id,binding.x+binding.w/2,binding.y,'바깥 주박 · '+durability(binding),{done:!!binding.broken,box:binding});
 if(boss&&!boss.dead&&(!binding||hs.sodanCoop))add('boss',boss.id,boss.x,boss.y-boss.h,st.id===10?(hs.sodanCoop?'소단 · 혼매듭 의식 보호':'소단의 주박 · 비살상 제압'):'빈 상여 · 제압',{unitId:boss.id});for(const u of b.units.filter(u=>u.honroMidboss&&!u.dead&&u.id!=='boss'))add('midboss',u.id,u.x,u.y-u.h,`${u.name} · 중간 우두머리`,{unitId:u.id});
 for(const m of markers){if(m.collected)continue;if(m.type==='ledger')add('interact',m.id,m.x,m.y,'홍만의 장부 · 상호작용');if(m.type==='receiver')add('interact',m.id,m.x,m.y,`${m.label} · ${m.action==='ritual'?(hs.ritual?.active?'의식 유지 중 · 이탈 시 해제':'담허로 의식 시작'):'받이진 설치'}`);if(m.type==='resident'){
  const target=interactionTarget(b,m),guards=rescueGuards(b,m);
  if(target)add('interact',m.id,target.x,target.y-(target===m?0:target.h||0),`${m.label} · ${guards.length?'곁의 차단병 '+guards.length+'기 제압':'구조'}`,target===m?{}:{unitId:target.id});
 }}
 // The saved/live map owns the exit. Content dimensions can belong to an older map.
 const exit=markers.find(m=>m.type==='exit'),exitX=(st.objective==='overwatch'?b.honroEscortGoalX:undefined)??exit?.x??b.honroMapAnchors?.exit?.x??b.width-(st.objective==='overwatch'?290:st.objective==='rescue'?130:180);
 if(['arrival','rescue','overwatch'].includes(st.objective))add('exit',exit?.id||'mission-exit',exitX,exit?.y??G.HonroWorld.top(b,exitX,obj?.y),st.objective==='overwatch'?'상여 도착 지점':'도착 지점');
 let complete=false,summary=st.goal,kinds=[];
 switch(st.objective){
  case'arrival':complete=heroes.some(u=>b.honroTopview?G.HonroTopview.atExit(b,u,exit):u.x>=exitX-120);summary='연목 나루 방향 · 고개 끝까지 이동';kinds=['exit'];break;
  case'overwatch':complete=!!obj&&(b.honroTopview?G.HonroTopview.atExit(b,obj,b.honroMapAnchors.exit):obj.x>=exitX);summary=`상여 엄호 · 적 ${foes.length}명${pending?' / 뒤따르는 기척 있음':''}`;kinds=['objective','exit'];break;
  case'ledger':complete=!!hs.ledger;summary=hs.ledger?'홍만의 장부 확보 · 철수 준비':b.units.some(u=>u.honroMidboss&&!u.dead)?'나루장승을 경계하며 움막의 장부 찾기':'나루 움막의 장부를 찾기';kinds=hs.ledger?[]:b.honroAct1SiteRevision===1?['interact']:['interact','midboss'];break;
  case'defend':{const rounds=Math.max(1,(st.holdRounds||6)-1);complete=b.round>=rounds+1;summary=`피란민 통로 보호 · ${Math.min(rounds,b.round-1)}/${rounds}턴`;kinds=['objective'];break;}
  case'seals':complete=!left.length;summary=left.length?(st.id===5?(hs.ritual?.active?'물틈이 열렸다 · 고리쇠 내구도 '+durability(left[0])+' · 설오로 사격':'담허로 받이진에 접근 · 의식 한 번 시작'):'받이진을 지키며 절벽 틈 고리쇠 파괴'):'고리쇠 파괴 완료 · 물길 안정화';kinds=left.length?(st.id===5&&!hs.ritual?.active?['interact']:['seal']):[];break;
  case'rescue':{const mid=b.units.find(u=>u.honroMidboss&&!u.dead);complete=!!hs.rescued&&!!obj&&(b.honroTopview?G.HonroTopview.atExit(b,obj,exit||b.honroMapAnchors.exit):obj.x>exitX-140)&&!mid;summary=mid?'부러진 교각귀를 제압해 호송로 확보':hs.rescued?'부상자 운반대를 쉼터까지 호송':'부상자 운반대에 접근';kinds=mid?['midboss']:hs.rescued?['objective','exit']:['objective'];break;}
  case'rescue3':complete=(hs.rescuedCount||0)>=3;summary=`들린 주민 구조 · ${hs.rescuedCount||0}/3${foes.length?' · 주변 위협 '+foes.length+'명':''}`;kinds=(hs.rescuedCount||0)<3?['interact']:[];break;
  case'bierboss':complete=!left.length&&!!boss?.dead;summary=left.length?`빈 상여의 결박부터 파괴 · ${seals.length-left.length}/${seals.length}`:boss&&!boss.dead?'빈 상여 본체 제압':'빈 상여 제압 완료 · 원혼 수습';kinds=left.length?['seal']:boss&&!boss.dead?['boss']:[];break;
  case'prepare':complete=(hs.receivers||0)>=2;summary=`주민 대피 후 받이진 준비 · ${hs.receivers||0}/2${foes.length?' · 위협 '+foes.length+'명':''}`;kinds=(hs.receivers||0)<2?['interact']:[];break;
  case'sodan':complete=G.HonroSodanWithdrawal.complete(b);summary=!hs.sodanCoop?(binding?'바깥 주박을 약화하기':'소단의 주박을 비살상으로 낮추고 두 받이진 활성화'):`소단 보호 · 혼매듭 ${hs.coopHold||0}/6턴 · 적 ${foes.length}명`;kinds=!hs.sodanCoop?(binding?['binding']:['boss','interact']):['boss'];if(G.HonroSodanWithdrawal.ready(b)){const W=G.HonroSodanWithdrawal,exit=W.exit(b),count=W.progress(b,exit);add('exit',exit.id,exit.x,exit.y,`동쪽 외문 · 대피 ${count}/4`);summary=complete?'네 사람 모두 동쪽 외문으로 대피 완료':`동쪽 외문 대피 ${count}/4 · 동행 셋 이동, 소단은 스스로 따라옵니다`;kinds=['exit','boss'];}break;
  default:complete=!foes.length;
 }
 const objectiveReady=complete,minimumRound=1,s=settlement(b,st),settleRounds=s.rounds,stable=settleRounds===0||s.preserved||s.progress>=settleRounds;
 complete=complete&&b.round>=minimumRound&&stable;
 if(objectiveReady&&settleRounds&&!stable)summary+=` · ${st.objective==='ledger'?'장부를 챙겨 철수':st.objective==='rescue3'?'구조한 주민 보호':'진과 주변 안정화'} ${s.progress}/${settleRounds}회 적 행동 종료`;
 const authored=G.HonroAuthored?.objectiveState(b);
 if(authored?.allTargets.length){complete=complete&&authored.complete;summary+=' · '+authored.summary;}
 const targets=all.filter(t=>kinds.includes(t.kind)&&!t.done);if(st.id===10&&G.HonroSodanWithdrawal.ready(b))targets.sort((a,c)=>Number(c.id==='sodan-safe-exit')-Number(a.id==='sodan-safe-exit'));
 return{complete,objectiveReady,minimumRound,settleRounds,summary,targets:[...targets,...(authored?.targets||[])],allTargets:[...all,...(authored?.allTargets||[])]};
}
function failure(b,st){
 if(G.HonroAct5?.active(b))return G.HonroAct5.failure(b);
 if(!b||b.honroCustom||st?.id!==5)return null;
 const needsRitual=G.HonroQuestTargets.records(b).some(t=>t.id==='cliff-cleat'&&!t.broken)&&b.honroMarkers?.some(m=>m.action==='ritual');
 if(needsRitual&&!b.units.some(u=>u.side===0&&u.cls==='mage'&&!u.summoned&&!u.enthrall&&!u.dead&&u.hp>0))return G.HonroStage5Waterfall?.active(b)?'담허가 쓰러져 낙수를 비틀 수 없다. 이 장을 다시 시작하자.':'담허가 쓰러져 받이진을 이어갈 수 없다. 이 장을 다시 시작하자.';
 return null;
}
function state(b,st){
 const result=rawState(b,st);
 if(G.HonroAct5?.active(b))return result;
 const guided=G.HonroObjectiveGuide?.enhance(b,st,result)||result;
 const crossing=G.HonroStakeCrossing?.current(b);
 const jointInvestigation=G.HonroAct23V4Chapter25Reviewed?.active(b)||G.HonroAct23V4Chapter27Reviewed?.active(b);
 if(crossing&&guided.currentObjectiveId===crossing.markerId&&!jointInvestigation){
  guided.currentInstruction=G.HonroStakeCrossing.instruction(b)||guided.currentInstruction;
 }
 return guided;
}
const briefings={
 1:[],
 2:[['설오','행렬이 저 아래 길을 통과할 때까지 높은 놈부터 끊겠습니다.',{focus:'objective'}]],
 3:[['담허','장부는 움막 안에 있겠지. 먼저 길에 붙은 것부터 떼어내세.']],
 4:[['휘겸','피란민이 나올 때마다 내가 문 앞에서 맞겠소. 그 길로 몰리는 놈들을 막아주시오.',{focus:'objective'}]],
 5:[],
 6:[['휘겸','운반대는 내가 붙들겠소. 앞길을 열어주시오.',{focus:'objective'}]],
 7:[['안내','주민 곁으로 이동한 뒤 구조하세요.',{kind:'guide'}]],
 8:[],
 9:[],
 10:[]
};
function lines(app){const fallback=app.engine.heroesAlive()[0]?.name||'설오';return(briefings[app.stage.id]||[]).map(([who,text,meta])=>[app.canSpeak(who)?who:fallback,text,meta]);}
const guides={1:'고개 끝의 도착 지점으로 이동하세요. 적을 모두 처치할 필요는 없습니다.',2:'상여가 도착 지점에 닿도록 앞길을 엄호하세요. 길에서 떨어진 적은 남아도 됩니다.',3:'장부 곁에서 장부를 확인하세요. 확보 후 한 턴 동안 일행을 지키며 철수합니다.',4:'피란민이 빠져나가는 여덟 턴 동안 문을 지키세요. 남은 적 수와 관계없이 대피가 끝나면 완료됩니다.',5:'담허로 받이진 안에서 의식을 한 번 시작하세요. 다음 턴부터는 그 자리에서 공격할 수 있습니다. 이동·도약으로 진을 벗어나면 물틈이 닫힙니다. 설오는 받이진 오른쪽의 돌선반으로 도약해 올라가 고리쇠를 겨누세요. 조준선의 첫 충돌점이 적이면 먼저 제압하고, 바위면 선반 위 위치나 각도를 조정하세요. 고리쇠는 여러 번 맞혀 내구도를 모두 깎아야 합니다. 부순 뒤 한 턴 동안 진을 안정시킵니다.',6:'운반대에 접근하고 교각귀를 제압한 뒤 도착 지점까지 호송하세요.',7:'주민 곁에서 구조하세요. 바닥으로 떨어졌다면 맨 왼쪽의 낮고 넓은 뿌리로 도약해 올라간 뒤 아랫가지로 한 번 더 도약하세요. 속빈 줄기에서는 왼쪽 끝을 벗어나지 말고 조금 안쪽에서 방향키를 놓고 제자리 도약하세요. 머리 위 비스듬한 뿌리에 내려앉은 뒤 오른쪽 위로 걸으면 윗사당에 닿습니다. 세 사람을 구출한 뒤 두 턴 동안 주민들을 지키며 대피를 돕습니다.',8:'결박을 끊고 빈 상여 본체를 제압하세요. 한 턴 동안 원혼을 수습하면 주변 적이 남아도 완료됩니다.',9:'두 받이진을 설치한 뒤 두 턴 동안 유지하세요. 진을 준비하고 생존하는 것이 목표입니다.',10:'두 받이진을 활성화하고 ‘소단의 주박’으로 표시된 대상을 공격하세요. 협력 전의 공격은 소단을 쓰러뜨리지 않고 주박을 약화시킵니다. 협력이 시작되면 소단을 향한 공격을 멈추세요. 소단은 혼매듭을 붙들어 이동·공격할 수 없습니다. 밀려드는 적을 막으며 최소 여섯 차례의 적 턴이 끝날 때까지 소단을 보호하세요. 여섯 턴 뒤 동행 셋을 동쪽 외문 너머로 이동시키세요. 소단은 스스로 따라옵니다. 네 사람이 모두 문을 통과해야 완료됩니다.'};
// Saved historical/custom maps may intentionally lack the new recovery root.
function guideFor(app){const b=app.engine?.b;if(G.HonroStage5Waterfall?.active(b))return G.HonroStage5Waterfall.guide;let text=guides[app.stage.id];
 if(b?.honroAct1SiteRevision===1&&app.stage.id===3)return '두 잔교를 건너 오른쪽 홍만의 움막에서 장부를 확인하세요. 확보한 뒤 적 행동이 두 번 끝날 때까지 일행을 지키세요.';
 if(b?.honroAct1SiteRevision===1&&app.stage.id===7)return '아랫골목, 중간 마당과 위쪽 당집에서 주민을 한 명씩 구조하세요. 가까운 적을 제압한 뒤 주민에게 다가가세요. 표시된 돌계단을 이용할 수 있습니다. 모두 구한 뒤 적 행동이 두 번 끝날 때까지 지키세요.';
if(b?.honroNarrativeRevision===1&&app.stage.id===8)return '상여채를 붙든 결박을 끊고 빈 상여를 제압하세요. 주변 적은 남아도 됩니다.';if(b?.honroNarrativeRevision===1&&app.stage.id===9)return '두 받이진을 설치해 소단이 붙든 힘을 나눠 받으세요.';if(b?.honroNarrativeRevision===1&&app.stage.id===10)return '사람과 떨어진 바깥 주박을 공격하세요. 소단이 맡긴 뒤에는 양쪽 전각에서 오는 적을 막아 여섯 턴 동안 의식을 지키세요. 그 뒤 동행 셋을 동쪽 외문 너머로 이동시키세요. 소단은 스스로 따라옵니다. 네 사람이 모두 문을 통과해야 완료됩니다.';if(app.stage.id===7&&b&&!G.HonroQuestTargets.records(b).some(t=>t.id==='root-reentry'&&!t.broken))text=text.replace('바닥으로 떨어졌다면 맨 왼쪽의 낮고 넓은 뿌리로 도약해 올라간 뒤 아랫가지로 한 번 더 도약하세요. ','');return text;}
const guideFocus=['exit','objective','interact','objective','interact','objective','interact','seal','interact','interact'];
function entryStory(app){
 const b=app.engine.b,rows=app.stage.story||[];
 if(app.stage.id!==6||b.honroStage!==6||b.honroCustom||b.honroCanonical!==true||b.honroMonsterScaleRevision!==2)return rows;
 const boss=b.units.find(u=>u.id==='midboss-stage6'&&u.side===1&&!u.dead&&u.hp>0);
 if(boss?.honroMonsterWeakPoint?.v!==2||boss.honroMonsterWeakPoint.key!=='warden-face')return rows;
 // Hwigyeom has already scouted below the bridge. Tell the player before the first possible shot.
 return rows.map(r=>r[0]==='휘겸'&&r[2]?.rowId==='6.story:3a4e795093'?
  [r[0],r[1]+' 얼굴에 금이 간 장승도 있었소. 저게 움직이면 그 금을 노리시오.',...r.slice(2)]:r);
}
function entry(app,options={}){if(G.HonroAct5?.active(app.engine.b))return G.HonroAct5.entry(app);G.HonroStoryFraming?.authorEntry(app.stage);const short=state(app.engine.b,app.stage).currentInstruction;
 if(app.stage.act>=2){const rows=(app.stage.act===2?G.HonroAct2:G.HonroAct3).entry(app,options),preparation=G.HonroStakeCrossing?.preparationLines(app.engine.b)||[];rows.splice(Math.max(0,rows.length-1),0,...preparation);return rows.map(row=>row[2]?.kind==='guide'?[row[0],short||row[1],row[2]]:row);}
 const n=(options.interlude===false?[]:(app.stage.narration||[])).slice(0,3).map((text,i)=>['서술',text,{kind:'narration',art:app.stage.narrationArt,paragraph:i+1,paragraphs:app.stage.narration.length}]);const all=[...n,...entryStory(app),...lines(app)],guide=['안내',short||guideFor(app),{kind:'guide',focus:guideFocus[app.stage.id-1],storyId:'guide-'+app.stage.id,storyTitle:app.stage.name+' · 길잡이'}],hs=app.engine?.b.honroState;
 if(hs&&!hs.entryScheduled){hs.entryScheduled=true;hs.deferredStory??=[];const beats=(app.stage.storyFollowups||[]).map(x=>x.slice());beats.forEach((lines,i)=>hs.deferredStory.push({round:2+i*2,lines:G.HonroStoryContent.scene('entry-follow-'+app.stage.id+'-'+i*5,app.stage.name+' · 길 위에서',lines)}));}
 return [...all,guide];}
const displayGuide=text=>G.HonroActionPrompts?.text(text)??text;
function help(app){const s=app.training?{}:state(app.engine.b,app.stage);return{...s,summary:app.training?'적은 반격합니다 · 아군은 쓰러지지 않습니다':s.currentInstruction||s.summary,checklist:s.visibleChecklist||s.checklist,guide:displayGuide((!app.training&&G.HonroStage5Waterfall?.active(app.engine?.b)?G.HonroStage5Waterfall.guide:s.currentInstruction)|| (app.training?'기예를 선택하고 조준·이동·방어를 연습하세요.':app.engine.b.honroCustom?app.stage.goal:app.stage.act>=2?((G.HonroObjectiveRevision?.contentFor(app.engine.b,app.stage)||app.stage).guide||app.stage.goal):(guideFor(app)||app.stage.goal)))};}
function focus(app,kind){const s=state(app.engine.b,app.stage);return s.targets.find(t=>t.id===kind)||s.allTargets.find(t=>t.id===kind)||s.targets.find(t=>t.kind===kind)||s.allTargets.find(t=>t.kind===kind&&!t.done)||s.allTargets.find(t=>t.kind===kind);}
function refresh(app){if(!app.engine||app.training)return;const s=state(app.engine.b,app.stage);app.scene.missionTargets=s.targets;const el=document.getElementById('objective-text');if(el){const text=s.currentInstruction||s.summary,label=text+' · 눌러서 지나온 목표 보기';if(el.textContent!==text)el.textContent=text;if(el.getAttribute('aria-label')!==label)el.setAttribute('aria-label',label);}const end=document.getElementById('objective-end-text');if(end){if(end.textContent)end.textContent='';if(!end.hidden)end.hidden=true;}}
function markerLift(b,t){return b?.honroNarrativeRevision===1&&!b.honroCustom&&b.honroStage===5&&t.id==='cliff-cleat'&&t.box&&!t.box.broken?12:t.box&&!t.box.broken?88:26;}
function objectiveEnemy(e,t){
 const u=e.unit(t.unitId||t.id);
 return u&&!u.dead&&u.hp>0&&!u.eaterCapturedBy?u:null;
}
function hostileBadge(c,x,y){
 c.beginPath();c.moveTo(x,y-4);c.lineTo(x+4,y);c.lineTo(x,y+4);c.lineTo(x-4,y);c.closePath();
 c.fillStyle='#142329';c.fill();c.strokeStyle='#f0cf85';c.lineWidth=1.5;c.stroke();
}
function draw(scene,e){
 let targets=scene.goalFocus?[scene.goalFocus]:scene.missionTargets;
 scene.missionDrawn=[];
 if(!targets?.length)return;
 const farewell=G.HonroStage19Farewell?.active(e.b),app=scene.storyFrame?.app||G.HonroApp;
 // The reader owns chapter19's speaker framing. Next-objective tags must not cover it.
 if((farewell||G.HonroAct23V4Reviewed?.active(e.b)||G.HonroAct23V4ReviewedChapters?.active(e.b))&&app?.engine?.b===e.b&&app.dialogue)return;
 const c=scene.ctx,{w,h,d}=scene.size(),z=scene.scale,cv=scene.canvas.getBoundingClientRect(),hud=document.querySelector('.honro-compact-hud')?.getBoundingClientRect();
 const top=110,bottom=Math.max(top+30,Math.min(h-24,(hud?.top??h)-cv.top-26)),mini=document.getElementById('minimap')?.getBoundingClientRect();
 // Parallel family steps need no remote hint while the current interaction is in view.
 if(farewell&&!scene.goalFocus){const t=targets[0],x=w/2+(t.x-scene.x)*z,y=h/2+(t.y-scene.y)*z;if(x>=0&&x<=w&&y>=0&&y<=h)return;}
 c.save();c.setTransform(d,0,0,d,0,0);c.font='600 12px sans-serif';c.textAlign='center';c.textBaseline='middle';
 if(!scene.goalFocus&&targets.some(t=>t.kind==='hostile')){
  let inView=false,remote=null;
  for(const t of targets){
   if(t.kind!=='hostile')continue;
   const u=objectiveEnemy(e,t);
   if(!u)continue;
   const height=G.HonroPartyPresentationHeight?.(u)??u.h;
   const tactical=z<=.42,bw=tactical?19:(u.honroFinalBoss?120:u.honroMidboss?96:u.boss?116:u.honroType==='bier'?85:u.honroAlly?49:52)*z;
   const x=w/2+(u.x-scene.x)*z;
   const y=h/2+(u.y-height*(!tactical&&u.elite&&u.side===1?1.12:1)-12-scene.y)*z+1;
   const badgeX=x-bw/2-7;
   const inMinimap=mini&&badgeX>=mini.left-cv.left-5&&badgeX<=mini.right-cv.left+5&&y>=mini.top-cv.top-5&&y<=mini.bottom-cv.top+5;
   const header=scene._cameraHeader;
   const underHeader=header&&badgeX>=header.left-5&&badgeX<=header.right+5&&y>=header.top-5&&y<=header.bottom+5;
   if(badgeX>5&&badgeX<w-5&&y>8&&y<bottom&&!inMinimap&&!underHeader){
    hostileBadge(c,badgeX,y);inView=true;
   }else if(!remote)remote={...t,x:u.x,y:u.y-height,label:'목표 적'};
  }
  targets=targets.filter(t=>t.kind!=='hostile');
  if(!inView&&remote)targets.push(remote);
 }
 let outside=0;const labels=[];
 for(const t of targets){
  const x=w/2+(t.x-scene.x)*z,y=h/2+(t.y-scene.y)*z,visible=farewell?x>=0&&x<=w&&y>=0&&y<=h:x>30&&x<w-30&&y>top&&y<bottom;
  const crowWarning=e.b.honroStage===8&&t.id==='stage8-settled-crows-warning';
  if(!visible&&!crowWarning&&outside++>0)continue;
  // Keep existing panel clearance elsewhere. The fresh iron ring has no HP
  // panel, so the arrow tip sits nine screen pixels above its real top edge.
  const lift=t.kind==='hostile'?12:markerLift(e.b,t);
  let px=Math.max(70,Math.min(w-70,x)),py=Math.max(top,Math.min(bottom,y-lift));
  const hold=G.HonroAct2.active(e.b)&&G.HonroAct2Art?.holdGuide(e.b,G.HonroAct2.current(e.b)),label=(visible?'':x<30?'왼쪽 · ':x>w-30?'오른쪽 · ':y<top?'위쪽 · ':'아래쪽 · ')+(hold?.id===t.id?hold.who+' · 수비 범위':t.label.split(' · ')[0]),width=Math.min(w-24,c.measureText(label).width+16);
  if(mini&&px+width/2>mini.left-cv.left&&py-33<mini.bottom-cv.top&&py+5>mini.top-cv.top){
   if(mini.bottom-cv.top+40<bottom)py=mini.bottom-cv.top+40;
   else px=Math.max(width/2+8,mini.left-cv.left-width/2-10);
  }
  if(G.HonroStage6DescentView){const q=G.HonroStage6DescentView.avoidObjective(scene,e,px,py,width);px=q.px;py=q.py;}
  // Only chapter23's secondary world tag: the pending equipment button is
  // independent of the minimap and can cover the label in short viewports.
  let hideLabel=false;
  if(e.b.honroStage===23&&!e.b.honroCustom){
   const button=document.getElementById('equipment-pending-battle'),style=button&&G.getComputedStyle?.(button),r=button&&!button.hidden&&style?.visibility!=='hidden'&&style?.display!=='none'?button.getBoundingClientRect():null;
   if(r?.width>0&&r.height>0){
    const box={left:r.left-cv.left,right:r.right-cv.left,top:r.top-cv.top,bottom:r.bottom-cv.top},clampX=x=>Math.max(width/2+6,Math.min(w-width/2-6,x)),hits=(x,y,q)=>x+width/2>q.left-4&&x-width/2<q.right+4&&y-13>q.top-4&&y-33<q.bottom+4;
    if(hits(clampX(px),py,box)){
     const m=mini&&{left:mini.left-cv.left,right:mini.right-cv.left,top:mini.top-cv.top,bottom:mini.bottom-cv.top};
     const q=[{x:px,y:box.bottom+41},{x:box.left-width/2-8,y:py},{x:box.right+width/2+8,y:py},{x:px,y:box.top+5}].map(q=>({x:clampX(q.x),y:q.y})).find(q=>q.y>=top&&q.y<=bottom&&!hits(q.x,q.y,box)&&(!m||!hits(q.x,q.y,m)));
     if(q){px=q.x;py=q.y;}else hideLabel=true; // Keep the arrow and the primary HUD objective when no label fits.
    }
   }
  }
  // Only Stage8's pending crow hint gets an additional edge slot. Existing
  // boss/objective labels keep their position; fit the added label around them.
  // The pending-equipment button is a separate HUD element; keep the hint clear of it too.
  if(crowWarning){const miniBox=mini?{x:mini.left-cv.left,y:mini.top-cv.top,w:mini.width,h:mini.height}:null,gear=document.getElementById?.('equipment-pending-battle'),gs=gear&&!gear.hidden&&G.getComputedStyle?.(gear),gr=gs&&gs.visibility!=='hidden'&&gs.display!=='none'?gear.getBoundingClientRect():null,gearBox=gr?.width>0&&gr.height>0?{x:gr.left-cv.left,y:gr.top-cv.top,w:gr.width,h:gr.height}:null,blocked=box=>[...labels,...(miniBox?[miniBox]:[]),...(gearBox?[gearBox]:[])].some(r=>box.x<r.x+r.w+6&&box.x+box.w+6>r.x&&box.y<r.y+r.h+6&&box.y+box.h+6>r.y);
   const original=py;for(const dy of [0,-42,42,-84,84,126,168]){const y=Math.max(top,Math.min(bottom,original+dy)),x=Math.max(width/2+6,Math.min(w-width/2-6,px));if(!blocked({x:x-width/2,y:y-33,w:width,h:20})){py=y;break;}}
  }
  if(scene.goalFocus&&visible){
   const pulse=22+3*Math.sin(performance.now()*.008);
   c.strokeStyle='#f2d58e';c.globalAlpha=.85;c.lineWidth=2;c.beginPath();c.arc(x,y,pulse,0,Math.PI*2);c.stroke();c.globalAlpha=1;
  }
  // In chapter19 an on-screen interaction already has its person/physical marker.
  // HUD clearance is a label-placement limit, not evidence that the person is off screen.
  if(farewell&&visible)continue;
  // Painted Stage8 bindings already carry their live name/HP in the unit
  // layer. Keep focus rings and offscreen guidance; omit the duplicate tag.
  if(visible&&e.b.honroStage===8&&!e.b.honroCustom&&e.b.honroMap?.stage8LocationPaint?.revision===1&&['bier-knot-0','bier-knot-1'].includes(t.id)&&e.unit(t.id)?.honroObjectiveTarget)continue;
  // The painted guardian's outer binding has the same live target panel.
  if(visible&&e.b.honroStage===10&&!e.b.honroCustom&&e.b.honroMap?.stage10LocationPaint?.revision===1&&t.id==='sodan-binding'&&e.unit(t.id)?.honroObjectiveTarget)continue;
  // The arrow is a canvas vector; its tip tracks the true target when the label is clamped to the HUD edge.
  const direction=Math.atan2(y-py,x-px)-Math.PI/2;
  c.save();c.translate(px,py);c.rotate(direction);c.fillStyle='#e5c57e';
  c.beginPath();c.moveTo(-7,-8);c.lineTo(7,-8);c.lineTo(0,3);c.closePath();c.fill();c.restore();
  const lx=Math.max(width/2+6,Math.min(w-width/2-6,px));
  labels.push({x:lx-width/2,y:py-33,w:width,h:20});
  if(!hideLabel){c.fillStyle='#10242aee';c.fillRect(lx-width/2,py-33,width,20);
   c.fillStyle='#ecd398';c.fillText(label,lx,py-23,width-8);if(e.b.honroStage===23&&!e.b.honroCustom)scene.missionDrawn.push({id:t.id,label,left:lx-width/2,right:lx+width/2,top:py-33,bottom:py-13});}
 }
 c.restore();
}
function minimap(app,c,sx,sy){if(app.training)return;const b=app.engine.b,guide=G.HonroAct4Content?.active(b)&&b.honroAct4Design?G.HonroAct4TerrainPreview?.questGuidance(app):null,s=guide||state(b,app.stage),crow=G.HonroStage8Bier?.pendingCrowWarning(app.engine.b);if(crow&&!s.targets.some(t=>t.id===crow.id))s.targets.push(crow);c.save();c.strokeStyle='#ffe0a0';const marked=new Set();
 for(const t of s.targets){
  if(t.kind!=='hostile'){c.strokeRect(t.x*sx-3,t.y*sy-3,6,6);continue;}
  const u=objectiveEnemy(app.engine,t);if(!u)continue;
  const x=u.x*sx,y=(u.y-u.h*.45)*sy,key=Math.round(x/4)+':'+Math.round(y/4);
  if(marked.has(key))continue;
  marked.add(key);c.beginPath();c.arc(x,y,u.elite||u.boss?4:3,0,Math.PI*2);c.stroke();
 }if(app.scene?.storyFrame?.camera.intent==='objective'){c.lineWidth=2;for(const box of app.scene.storyFrameReport?.boxes||[]){c.beginPath();c.arc((box.x+box.w/2)*sx,(box.y+box.h)*sy,7,0,Math.PI*2);c.stroke();}}c.restore();}
G.HonroObjectives={interactionTarget,rescueGuards,state,failure,lines,entry,help,focus,refresh,draw,minimap,briefings,markerLift,settlement,updateSettlement};
})(globalThis);
;await yieldIfNeeded();(()=>{"use strict";(function(G){"use strict";const hero=u=>!!u&&u.side===0&&!u.summoned&&!u.enthrall&&!!u.cls;const alive=u=>hero(u)&&!u.dead&&u.hp>0;const state=b=>b?.honroCustom?null:b?.honroGrowth?.ledger?.stages?.[b.honroStage]?.contribution;function evidence(b){const s=state(b);if(!s||s.version!==4)return null;const mem=s.objectiveEvidence??={};mem.terrain??={};mem.escorts??={};mem.arrivals??={};return mem}function owner(b,id){const source=typeof id==="object"?id?.id:id;let u=typeof id==="object"?id:b.units.find(u=>u.id===id),seen=new Set;while(u&&(u.summoned||u.enthrall)&&!seen.has(u.id)){seen.add(u.id);u=b.units.find(v=>v.id===(u.summonOwner||u.enthrall?.owner))}if(hero(u))return u;const saved=state(b),cls=saved?.owners?.[source]||(saved?.actors?.includes(source)?source:null);return cls?b.units.find(v=>hero(v)&&v.cls===cls)||{id:cls,cls:cls,side:0}:null}function contributors(b,actors){const out={};for(const item of actors||[]){if(!item)continue;if(item.id==="_system"){const weight=item.weight??1;if(Number.isFinite(weight)&&weight>0)out._system=(out._system||0)+weight;continue}const u=owner(b,item.id??item),weight=item.weight??1;if(u&&Number.isFinite(weight)&&weight>0)out[u.id]=(out[u.id]||0)+weight}return Object.entries(out).map(([id,weight])=>({id:id,weight:weight}))}function award(b,key,actors,points=20){if(!evidence(b)||!(points>0))return false;const list=contributors(b,actors);return list.length?G.HonroProgression.objective(b,"goal:"+key,list,points):false}function observe(b,actors){if(!evidence(b))return;const travel=b.honroState.objectiveTravel??={};for(const u of actors.filter(alive))travel[u.id]={x:u.x,y:u.y}}function movement(b,actor,provider,from,to){if(!evidence(b)||!alive(actor)||!owner(b,provider)||!from||!to||Math.hypot(to.x-from.x,to.y-from.y)<1)return;(b.honroState.objectiveGateTravel??={})[actor.id]={provider:owner(b,provider).id,from:{x:from.x,y:from.y},to:{x:to.x,y:to.y},round:b.round,end:b.teamEnds?.[0]||0}}function arrivalContributors(b,actors,inside){const out=[];for(const u of actors.filter(alive)){const receipt=b.honroState.objectiveGateTravel?.[u.id],provider=receipt&&owner(b,receipt.provider),gate=provider&&provider.id!==u.id&&receipt.round===b.round&&receipt.end===(b.teamEnds?.[0]||0)&&!inside(receipt.from)&&inside(receipt.to)&&Math.hypot(u.x-receipt.to.x,u.y-receipt.to.y)<=200;out.push({id:u.id,weight:gate?.75:1});if(gate){out.push({id:provider.id,weight:.25});delete b.honroState.objectiveGateTravel[u.id]}}return out}function arrive(b,key,actors,inside,points=20){return award(b,"reach:"+key,arrivalContributors(b,actors,inside),points)}function approach(b,key,actors,point,radius=220,safe=true){const mem=evidence(b);if(!mem||!safe||!point||mem.arrivals[key])return false;const inside=p=>Math.abs(p.y-point.y)<=150&&Math.hypot(p.x-point.x,(p.y-point.y)*.75)<=radius;const arrivals=actors.filter(alive).filter(u=>{const old=b.honroState.objectiveTravel?.[u.id]||b.honroState.objectiveGateTravel?.[u.id]?.from;return old&&!inside(old)&&inside(u)&&Math.hypot(u.x-old.x,u.y-old.y)>1});if(!arrivals.length)return false;const actor=arrivals.find(u=>u.id===b.active)||arrivals[0];award(b,"approach:"+key,arrivalContributors(b,[actor],inside),18);mem.arrivals[key]=true;return true}function interact(b,key,actor,{rescue:rescue=false,progress:progress=false}={}){return award(b,"interact:"+key,[actor],rescue&&evidence(b)?.arrivals[key]||progress?2:5)}function maintain(b,key,h,guards,progressed,rounds,continuous,intervalEnded=false){if(!evidence(b))return;const ids=guards.filter(alive).map(u=>u.id),prior=h.contributionGuards;if(progressed){const sustained=(prior||[]).filter(id=>ids.includes(id));if(h.progress<=rounds)award(b,"hold:"+key+":"+h.progress,sustained.length?sustained.map(id=>({id:id})):[{id:"_system",weight:1}],20/Math.max(1,rounds));h.contributionGuards=ids}else if(intervalEnded&&continuous)h.contributionGuards=ids;else if(!continuous)h.contributionGuards=[];else h.contributionGuards=prior===undefined?ids:prior.filter(id=>ids.includes(id))}function terrain(e,t,beforeHp,source){const b=e.b,mem=evidence(b);if(!mem||!t?.id||!Number.isFinite(beforeHp)||!Number.isFinite(t.hp)||t.hp>=beforeHp)return;const authored=(G.HonroAct2?.active(b)?G.HonroAct2.steps(b):G.HonroAct3?.active(b)?G.HonroAct3.steps(b):[]).some(s=>s.kind==="destroy"&&s.id===t.id);if(!authored&&!t.honroSeal&&!t.honroBlocker&&t.id!=="sodan-binding")return;const r=mem.terrain[t.id]??={maxDamage:0,maxHp:Math.max(1,t.maxHp||beforeHp),weights:{}},lost=Math.max(0,Math.min(beforeHp,beforeHp-t.hp));t.honroContributionDamage=Math.min(r.maxHp,(t.honroContributionDamage||0)+lost);const delta=Math.max(0,t.honroContributionDamage-r.maxDamage);r.maxDamage=Math.max(r.maxDamage,t.honroContributionDamage);const u=owner(b,source);if(delta&&u){let support=null;if(b.honroStage===5&&t.id==="cliff-cleat"){const ritual=b.honroState.ritual,holder=ritual?.active&&owner(b,ritual.holderId),m=b.honroMarkers.find(m=>m.id==="receiver-5");if(alive(holder)&&holder.cls==="mage"&&m&&Math.abs(holder.x-m.x)<=125&&Math.abs(holder.y-m.y)<=80)support=holder}r.weights[u.id]=(r.weights[u.id]||0)+delta*(support&&support.id!==u.id?.6:1);if(support&&support.id!==u.id)r.weights[support.id]=(r.weights[support.id]||0)+delta*.4}if(t.hp<=0||t.broken){const rows=Object.entries(r.weights).map(([id,weight])=>({id:id,weight:weight})),known=rows.reduce((sum,r)=>sum+r.weight,0);rows.push({id:"_system",weight:Math.max(0,r.maxHp-known)});award(b,"terrain:"+t.id,rows,20)}}function finishEscort(b,key){const r=evidence(b)?.escorts[key];if(!r||!r.maxProgress)return false;const rows=Object.entries(r.weights).map(([id,weight])=>({id:id,weight:weight})),known=rows.reduce((n,r)=>n+r.weight,0);rows.push({id:"_system",weight:Math.max(0,1-known)});return award(b,"escort:"+key,rows,20)}function escort(b,key,npc,goal,actors,before,radius=170){const mem=evidence(b);if(!mem||!npc||!goal||!before)return;const r=mem.escorts[key]??={distance:Math.max(1,Math.hypot(before.x-goal.x,before.y-goal.y)-radius),maxProgress:0,weights:{}};const fraction=p=>Math.min(1,Math.max(0,1-Math.max(0,Math.hypot(p.x-goal.x,p.y-goal.y)-radius)/r.distance)),progress=fraction(npc),prior=fraction(before),delta=Math.max(0,progress-Math.max(r.maxProgress,prior));r.maxProgress=Math.max(r.maxProgress,prior,progress);const rows=contributors(b,actors),weight=rows.reduce((n,r)=>n+r.weight,0),moved=Math.hypot(npc.x-before.x,npc.y-before.y)>.001;if(delta&&moved&&weight)for(const row of rows)r.weights[row.id]=(r.weights[row.id]||0)+delta*row.weight/weight;if(progress>=1)finishEscort(b,key)}function beforeComplete(b,st){if(!evidence(b))return;if(st?.objective==="arrival"){const exit=b.honroMarkers.find(m=>m.type==="exit")||b.honroMapAnchors?.exit||{x:b.width-180},arrived=b.units.filter(u=>alive(u)&&u.x>=exit.x-120);if(arrived.length)arrive(b,"arrival",[arrived.find(u=>u.id===b.active)||arrived[0]],p=>p.x>=exit.x-120)}if(st?.objective==="rescue")finishEscort(b,"rescue-carrier");const n=b.honroStage,q=b.honroAct4PreviewState,exit=q?.completionProof?.exit;if(st?.objective==="act4"&&[33,34,37,38].includes(n)&&b.honroAct4Official===1&&b.honroAct4Preview===n&&b.phase==="won"&&q?.complete&&!q.failure&&q.completionProof.exitContributionVersion===1&&Number.isFinite(exit?.x)&&Number.isFinite(exit?.y)){const inside=p=>p.x>exit.x-300&&Math.abs(p.y-exit.y)<=240;arrive(b,"act4-exit:"+n,b.units.filter(u=>alive(u)&&inside(u)),inside)}}G.HonroObjectiveContributions={evidence:evidence,owner:owner,award:award,observe:observe,movement:movement,arrive:arrive,approach:approach,interact:interact,maintain:maintain,terrain:terrain,escort:escort,finishEscort:finishEscort,beforeComplete:beforeComplete}})(globalThis)})();await yieldIfNeeded();(()=>{"use strict";(function(G){"use strict";const symbols={stun:"M8 1 9.5 5 14 5.5 10.5 8.5 11.5 13 8 10.5 4.5 13 5.5 8.5 2 5.5 6.5 5Z",push:"M1 8H14M9 3L14 8 9 13M1 3H5M1 13H5",bind:"M6 5 9 2Q12 0 14 3Q15 5 13 7L10 10M6 6 3 9Q1 12 4 14Q6 15 8 13L11 10M5 11 11 5",slow:"M8 1V15M2 4 14 12M2 12 14 4M5 2 8 5 11 2M5 14 8 11 11 14",curse:"M8 1 14 7 8 15 2 7ZM5 6 11 10M11 6 5 10",betrayal:"M1 8Q8 0 15 8Q8 16 1 8ZM8 5V11",shield:"M8 1 14 4 13 10 8 15 3 10 2 4Z",guard:"M2 2 13 13M10 12 13 9M6 7 3 12 1 10M9 6 14 1",power:"M9 1 3 9 8 9 6 15 14 6 9 6Z",follow:"M2 4H13L9 1M14 12H3L7 15",retreat:"M1 8H14M5 4 1 8 5 12",prepared:"M8 1V5M8 11V15M1 8H5M11 8H15M8 4A4 4 0 1 0 8 12A4 4 0 1 0 8 4",manifest:"M2 3H14V13H2ZM5 8H11M8 5V11",enthrall:"M3 5Q8 1 13 5M3 11Q8 15 13 11M5 6L11 10M11 6L5 10",earthbind:"M8 1V10M8 10L2 15M8 10L14 15M8 10L5 13M8 10L11 13",remnant:"M3 11Q1 5 5 4Q8 4 6 10M9 12Q7 6 11 3Q15 4 13 11",dead:"M3 3 13 13M3 13 13 3"};const colors={push:"#c4d1aa",stun:"#f5d27f",bind:"#e2ba87",slow:"#9dddeb",curse:"#d7a2e4",betrayal:"#ee9cbc",shield:"#a8dbd3",guard:"#cadbd5",power:"#eed69a",follow:"#eed69a",retreat:"#b4d3c5",prepared:"#eed69a",manifest:"#d7d0ac",enthrall:"#c2b596",earthbind:"#b8ab8a",remnant:"#d1c6ab",dead:"#bfaaa2"};function casts(b){return b.honroMonsterEffectsRevision===1?(b.units||[]).filter(u=>!u.dead&&u.hp>0&&u.side===1&&!u.eaterCapturedBy&&u.enemyEffectCast?.version===1):[]}function softBind(b,u){return b.honroMonsterEffectsRevision===1&&u.enemySoftBind?.remainingActions>0?u.enemySoftBind:null}function warningDetail(owner){const q=owner.enemyEffectCast;return`${q.skill==="HSH02"?"매듭실":"터줏바람"} 예고 · 고정 범위 밖으로 이동하거나 준비 중 ${owner.name} 직접 공격으로 끊기 · 대상의 행동 후 다음 적 행동에 발동`}const patternSources=b=>b.honroMonsterReworkRevision===1?b.units.filter(u=>!u.dead&&u.hp>0&&u.side===1&&u.honroMonsterWindup):[];const patternColor=w=>w.shape==="lane"?colors.push:w.shape==="knot"||w.shape==="seal"?colors.curse:colors.power;const patternHint=w=>w.shape==="seal"?(G.HONRO_CORE.SKILLS[w.skill]?.name||"기예")+" 봉인 예고 · 이동 또는 시전자 차단":w.shape==="repair"?"수리 시종을 공격하면 끊깁니다":w.shape==="merge"?"준비 중 직접 맞혀 불씨가 합쳐지기 전에 끊기":w.shape==="omen"?"지목된 동행을 옮기거나 연결된 적을 공격하세요":w.kind==="sodanOmen"?"고정 범위 밖으로 이동하세요":"고정 범위 밖으로 이동하거나 시전자를 직접 공격하세요";const variantNames={giant:"거대한",burning:"불붙은",cursed:"저주받은",hungry:"굶주린",captain:"대장"};function drawNewPatterns(c,e,w,h,scene,z,left,right,top,bottom,observe){for(const owner of patternSources(e.b)){const q=owner.honroMonsterWindup,p=q.impact,o=q.origin,r=q.radius,color=patternColor(q);const visible=p.x+r>left&&p.x-r<right&&p.y+r>top+80*z&&p.y-r<bottom-100*z;const x=visible?p.x:Math.max(left+75*z,Math.min(right-75*z,p.x));const y=visible?p.y:Math.max(top+h*z*.35,Math.min(top+h*z*.6,p.y));c.save();c.strokeStyle=color;c.lineWidth=2*z;if(visible){c.setLineDash([8*z,5*z]);c.beginPath();if(q.shape==="lane"){const a=Math.atan2(p.y-o.y,p.x-o.x),nx=-Math.sin(a)*r,ny=Math.cos(a)*r;c.moveTo(o.x+nx,o.y+ny);c.lineTo(p.x+nx,p.y+ny);c.arc(p.x,p.y,r,a+Math.PI/2,a-Math.PI/2,true);c.lineTo(o.x-nx,o.y-ny);c.closePath()}else c.arc(p.x,p.y,r,0,2*Math.PI);c.stroke();c.setLineDash([]);const link=e.unit(q.linked);if(link){c.beginPath();c.moveTo(o.x,o.y);c.lineTo(link.x,link.y-link.h*.6);c.stroke()}}else{c.save();c.translate(x,y);c.rotate(Math.atan2(p.y-y,p.x-x));c.beginPath();c.moveTo(-14*z,0);c.lineTo(14*z,0);c.lineTo(7*z,-5*z);c.moveTo(14*z,0);c.lineTo(7*z,5*z);c.stroke();c.restore()}const label=q.label+(visible?" · 예고":" · 화면 밖");c.font="bold "+11*z+"px sans-serif";c.textAlign="center";c.textBaseline="middle";const width=c.measureText(label).width+12*z,cx=Math.max(left+width/2+8*z,Math.min(right-width/2-8*z,x));const cy=Math.max(top+90*z,Math.min(bottom-120*z,y+(visible?r+9*z:16*z)));c.fillStyle="#0c2028ed";c.fillRect(cx-width/2,cy-8*z,width,16*z);c.fillStyle=color;c.fillText(label,cx,cy);c.restore();if(observe)e.observeMonsterPattern(owner.id,q.serial)}for(const u of e.b.units){const theft=u.honroMonsterState?.lifted;if(!theft)continue;const{x:x,y:y}=theft.sieve;if(x<left||x>right||y<top||y>bottom)continue;c.save();c.strokeStyle=colors.power;c.fillStyle="#10242c";c.lineWidth=1.8*z;c.beginPath();c.ellipse(x,y-9*z,13*z,8*z,0,0,Math.PI*2);c.fill();c.stroke();for(const dy of[-12,-7])for(const dx of[-6,0,6]){c.beginPath();c.arc(x+dx*z,y+dy*z,1*z,0,Math.PI*2);c.stroke()}c.font="bold "+10*z+"px sans-serif";c.fillStyle=colors.power;c.textAlign="center";c.fillText("체 · 가까이 가서 유인",x,y-21*z);c.restore()}}function entries(b,u){const list=[];if(!u)return list;const add=(key,name,detail,count)=>list.push({key:key,name:name,detail:detail,count:count,color:colors[key]});if(u.dead||u.hp<=0){add("dead","전투 불능","전투 불능");return list}if(u.stunnedRound===b.round&&u.acted)add("stun","기절","기절 · 이번 턴 행동 불가");else if(u.stun>0)add("stun","기절",`기절 · 다음 행동 ${u.stun}회 불가`,u.stun);const bind=softBind(b,u);if(bind){const source=(b.units||[]).find(v=>v.id===bind.sourceId);add("bind","매듭실",`매듭실 · 이동 예산 ${Math.round(bind.factor*100)}% · 사격·도약 가능 · 다음 유효 행동 후 해제 · ${source?.name||"수의귀"} 처치 또는 정화약으로 해제`,bind.remainingActions)}for(const owner of casts(b)){const q=owner.enemyEffectCast;if(q.target===u.id||owner.id===u.id)add(q.skill==="HSH02"?"bind":"push",q.skill==="HSH02"?"매듭 예고":"바람 예고",warningDetail(owner))}for(const owner of patternSources(b)){const w=owner.honroMonsterWindup;if(w.target===u.id||owner===u||w.linked===u.id)add(w.shape==="lane"?"push":"prepared",w.label,patternHint(w))}const condition=u.honroMonsterCondition;if(condition?.kind==="weak")add("curse","약화","이 행동의 기본 피해 12% 저하 · 행동 후 또는 정화약으로 해제");if(condition?.kind==="seal")add("curse","기예 봉인",(G.HONRO_CORE.SKILLS[condition.skill]?.name||"기예")+" · 이번 행동 뒤 또는 정화약으로 해제");if(condition?.kind==="attachment")add("bind","객귀 부착","이동 예산 68% · 객귀를 직접 공격하거나 이번 행동 뒤 해제");if(condition?.kind==="knot")add("curse","옮는 매듭","다음 적 턴이 끝날 때 근처 같은 층 동행 한 명에게 전이 · 거리를 벌리거나 원인을 끊기");if(u.honroMonsterGrowth>1)add("power","그림자 성장","그림자 "+u.honroMonsterGrowth+"단계 · 무피격 한 라운드 뒤 축소",u.honroMonsterGrowth);if(u.honroMonsterState?.guardFace)add("shield","정면 방호","정면에서 들어오는 피해 감소 · 높은 곡사와 측면으로 공략");if(u.honroMonsterState?.exposedUntil>(b.teamEnds?.[0]??0))add("guard","빈틈","자세 회복 중 · 피해 14% 더 받음");if(u.honroMonsterVariant)add("power",variantNames[u.honroMonsterVariant],variantNames[u.honroMonsterVariant]+" 정예");if(u.bound>0)add("bind","결박",`결박 ${u.bound}회 · 이동력 감소·이동 소모 증가`,u.bound);if(u.slowed)add("slow","감속","감속 "+Math.round(u.slowed.factor*100)+"%");if(u.curseTurns>0){const parts=[`저주 ${u.curseTurns}턴`];if(u.curseDamage>0)parts.push(`매 턴 기본 피해 ${+(u.curseDamage*(u.curseDamageOrigin?.damageRoll??1)).toFixed(1)}`);if(u.curseAttack>0)parts.push(`공격력 ${Math.round(u.curseAttack*100)}% 감소`);if(u.curseArmor>0)parts.push(`방어력 ${Math.round(u.curseArmor*100)}%p 감소`);add("curse","저주",parts.join(" · "),u.curseTurns)}if(u.betrayalUntil>0&&u.betrayalUntil>=b.round)add("betrayal","이간","이간 · 같은 편의 공격 대상이 됨",u.betrayalUntil-b.round+1);if(u.manifested)add("manifest","현형",`현형 · 동료에게도 보임 · ${Math.max(1,(u.manifestedUntil||b.round)-b.round+1)}턴`);if(u.enthrall)add("enthrall","섭혼",`섭혼 · 소단 편으로 ${u.enthrall.actions}회 더 행동`,u.enthrall.actions);if(u.earthbind)add("earthbind","지박",`지박 · 매 턴 피해와 이동 방해 · ${Math.max(1,u.earthbind.until-b.round+1)}턴`);if(u.soulRemnants>0)add("remnant","잔혼",`잔혼 ${u.soulRemnants}/3 · 셋이 모이면 다음 기예 강화`,u.soulRemnants);if(u.mark>0)add("prepared","표식","표식 · 표식을 남긴 편의 다음 직격 피해 50% 증가");if(u.breaks>0)add("guard","방어 붕괴",`방어 붕괴 · 다음 피격 ${u.breaks}회 방어력 약화`,u.breaks);if(u.shield>0)add("shield","보호막",`보호막 ${Math.round(u.shield)}`);if(u.arrivalGuard!==undefined)add("shield","착지 보호","착지 보호 · 다음 내 턴까지 받는 피해 10% 감소");if(u.martialGuard)add("guard",u.martialGuard.counter?"응수세":"수세",u.martialGuard.counter?"응수세 · 반격 대기":"수세");if(u.bladeScreen)add("guard","호신검막","호신검막 · 날아오는 공격을 받아 검기에 힘을 저장");if(u.bladeStored>0)add("power","축기",`축기 · 다음 검기 피해 ${Math.round(u.bladeStored*100)}% 증가`);if(u.meleeFollow==="ready")add("follow","파진연격","파진연격 · 검술 한 번");if(u.harmony)add("power","합세","합세 · 다음 기예 강화");if(u.jucheonReady)add("power","주천완성","주천완성");if(u.prepared)add("prepared","정심","정심 · 다음 절명 사격의 피해·치명타·방어 관통 강화");if(u.retreat)add("retreat","이탈보","이탈보 · 후퇴 단계");return list}function effects(b,u){return entries(b,u).map(s=>s.detail)}function drawTelegraphs(c,e,scene,w,h,observe=true){const b=e.b,z=1/Math.max(.12,scene.scale||1),left=scene.x-w*z/2,right=scene.x+w*z/2,top=scene.y-h*z/2,bottom=scene.y+h*z/2;for(const owner of casts(b)){const q=owner.enemyEffectCast,p=q.impact,r=q.radius;if(!p||![p.x,p.y,r].every(Number.isFinite)||r<=0)continue;const visible=p.x+r>left&&p.x-r<right&&p.y+r>top+80*z&&p.y-r<bottom-100*z;const x=visible?p.x:Math.max(left+70*z,Math.min(right-70*z,p.x)),y=visible?p.y:Math.max(top+h*z*.32,Math.min(top+h*z*.6,p.y));const knot=q.skill==="HSH02",color=knot?colors.bind:colors.push;c.save();c.strokeStyle=color;c.fillStyle=color;c.lineWidth=2*z;c.globalAlpha=.9;if(visible){c.setLineDash([7*z,5*z]);c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();c.setLineDash([]);if(knot){for(const dx of[-9,9]){c.beginPath();c.ellipse(x+dx*z,y,12*z,6*z,dx<0?-.5:.5,0,Math.PI*2);c.stroke()}}else{const d=q.direction<0?-1:1;for(const offset of[-16,4,24]){const ax=x+offset*z*d;c.beginPath();c.moveTo(ax-8*z*d,y-8*z);c.lineTo(ax,y);c.lineTo(ax-8*z*d,y+8*z);c.stroke()}}}else{const dx=p.x-x,dy=p.y-y,angle=Math.atan2(dy,dx);c.save();c.translate(x,y);c.rotate(angle);c.beginPath();c.moveTo(-15*z,0);c.lineTo(15*z,0);c.lineTo(7*z,-6*z);c.moveTo(15*z,0);c.lineTo(7*z,6*z);c.stroke();c.restore()}const label=(knot?"매듭실":"터줏바람")+(visible?" 예고":" · 화면 밖"),note=knot?"범위 회피 / 준비 중 직접 공격":"범위 회피 / 준비 중 직접 공격";c.font=`bold ${11*z}px sans-serif`;c.textAlign="center";c.textBaseline="middle";const width=Math.max(c.measureText(label).width,c.measureText(note).width)+12*z,labelX=Math.max(left+width/2+8*z,Math.min(right-width/2-8*z,x)),labelY=Math.max(top+90*z,Math.min(bottom-120*z,y+(visible?r+12*z:21*z)));c.fillStyle="#0c2028ed";c.fillRect(labelX-width/2,labelY-8*z,width,31*z);c.fillStyle=color;c.fillText(label,labelX,labelY);c.font=`${10*z}px sans-serif`;c.fillText(note,labelX,labelY+14*z);c.restore();if(observe)e.observeEnemyEffectWarning?.(owner.id,q.serial)}if(b.honroMonsterReworkRevision===1)drawNewPatterns(c,e,w,h,scene,z,left,right,top,bottom,observe)}const paths={};function glyph(key){return`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${symbols[key]}"/></svg>`}function draw(c,b,u,time,scale,active){const states=entries(b,u);if(!states.length||u.dead)return;const has=key=>states.some(s=>s.key===key),z=1/Math.max(.16,scale||1),visualHeight=G.HonroPartyPresentationHeight?.(u)??u.h;c.save();c.lineWidth=2*z;if(has("bind")&&(u.bound>0||softBind(b,u))){c.strokeStyle=colors.bind;c.beginPath();for(let i=0;i<2;i++)c.ellipse(u.x,u.y-7-i*13,u.r+8,7,0,0,Math.PI*2);c.moveTo(u.x-u.r,u.y-23);c.lineTo(u.x+u.r,u.y-2);c.stroke()}if(has("slow")){c.strokeStyle=colors.slow;c.beginPath();for(let i=0;i<5;i++){const x=u.x+(i-2)*12;c.moveTo(x-6,u.y+1);c.lineTo(x,u.y-10-i%2*7);c.lineTo(x+6,u.y+1)}c.stroke()}if(has("curse")){c.strokeStyle=colors.curse;c.globalAlpha=.65+.15*Math.sin(time*3);c.beginPath();c.ellipse(u.x,u.y-visualHeight*.45,u.r+11,visualHeight*.35,0,0,Math.PI*2);c.stroke();c.globalAlpha=1}if(has("manifest")){c.strokeStyle=colors.manifest;c.globalAlpha=.68;c.beginPath();c.ellipse(u.x,u.y-visualHeight*.5,u.r+14,visualHeight*.55,0,0,Math.PI*2);c.stroke();c.globalAlpha=1}if(has("enthrall")){c.strokeStyle=colors.enthrall;c.beginPath();c.moveTo(u.x-u.r-8,u.y-visualHeight*.45);c.quadraticCurveTo(u.x,u.y-visualHeight*.72,u.x+u.r+8,u.y-visualHeight*.45);c.stroke()}if(has("earthbind")){c.strokeStyle=colors.earthbind;c.beginPath();for(let i=-2;i<=2;i++){const x=u.x+i*10;c.moveTo(x,u.y);c.lineTo(x+i*4,u.y-18-Math.abs(i)*4)}c.stroke()}if(has("remnant")){c.fillStyle=colors.remnant;for(let i=0;i<Math.min(3,u.soulRemnants||0);i++){c.beginPath();c.arc(u.x+(i-1)*12,u.y-visualHeight-13,2.5,0,Math.PI*2);c.fill()}}if(has("shield")||has("guard")){c.strokeStyle=has("shield")?colors.shield:colors.guard;c.globalAlpha=.7;c.beginPath();c.ellipse(u.x,u.y-visualHeight*.5,u.r+19,visualHeight*.57,0,-Math.PI*.8,Math.PI*.8);c.stroke();c.globalAlpha=1}if(has("stun")){c.strokeStyle=colors.stun;for(let i=0;i<3;i++){const a=time*2+i*Math.PI*2/3,x=u.x+Math.cos(a)*(u.r+10),y=u.y-visualHeight-8+Math.sin(a)*5;c.beginPath();c.moveTo(x-3*z,y);c.lineTo(x+3*z,y);c.moveTo(x,y-3*z);c.lineTo(x,y+3*z);c.stroke()}}const shown=states.slice(0,3),extra=states.length-shown.length;c.translate(u.x+(active?28*z:0),u.y-visualHeight-33*z);c.scale(z,z);const width=shown.length*20+(extra?21:0);c.translate(active?0:-width/2,0);for(let i=0;i<shown.length;i++){const s=shown[i];c.save();c.translate(i*20,0);c.fillStyle="#0c2028ed";c.fillRect(-1,-1,19,20);c.strokeStyle=s.color;c.lineWidth=1.5;paths[s.key]??=new Path2D(symbols[s.key]);c.stroke(paths[s.key]);if(s.count){c.fillStyle="#07151d";c.fillRect(10,10,9,10);c.fillStyle=s.color;c.font="bold 9px sans-serif";c.textAlign="right";c.fillText(String(s.count),18,18)}c.restore()}if(extra){c.fillStyle="#e4d9c0";c.font="bold 10px sans-serif";c.textAlign="left";c.fillText("+"+extra,shown.length*20,12)}c.restore()}function embedded(b,u){return b.terrain.some(t=>!t.broken&&!t.oneWay&&u.x>=t.x&&u.x<=t.x+t.w&&u.y>G.HonroTerrain.topAt(t,u.x)+3&&u.y<t.y+t.h-.1&&G.HONRO_CORE.terrainContains(t,u.x,u.y-3))}function reason(e,u,skill){const b=e.b;if(!u)return"행동할 동행이 없습니다";if(u.dead||u.hp<=0)return"전투 불능 · 다른 동행을 선택하세요";if(b.phase==="ally"||b.phase==="summon")return"동맹군 턴 · 행동을 기다리는 중";if(b.side===1)return"적군 턴 · 행동을 기다리는 중";if(b.phase==="transition")return"턴 전환 중 · 착지와 이벤트 처리 대기";if(b.phase==="review")return"공격 결과 확인 중";if(e.canTurnArrow())return"전로시 · 전장을 눌러 1회 선회";if(b.phase==="flight"&&b.projectiles.some(p=>p.mode==="warriorDive"&&!p.dived))return"파산격 · 발사 버튼을 눌러 급강하";if(u.meleeFollow==="ready")return"파진연격 · 이동 없이 평참 또는 검술 한 번";if(u.retreat)return"후퇴 · 이동/점프만 가능 · 대기로 종료";if(b.phase==="flight")return b.projectiles.length||b.volley?"공격 처리 중":e.settleBusy()?"착지 대기 중":"공격 마무리 중";if(u.stunnedRound===b.round&&u.acted)return"기절로 이번 턴 행동 불가 · 다른 동행을 선택하세요";if(u.acted)return"행동 완료 · 다른 동행을 선택하세요";if(e.honroBBodyEmbedded?.(u)??embedded(b,u))return"지형에 걸림 · 전투를 이어 불러오면 위치를 복구합니다";if(!e.grounded(u))return"공중 이동 중 · 착지 후 발사·도약 가능";if(skill){const cd=e.cooldownLeft(u,skill.id),cost=e.manaCost(skill,u);if(cd>0)return`재사용 대기 ${cd}턴 · 다른 기예를 선택하세요`;if(u.focus<cost)return`기력 부족 (${Math.floor(u.focus)}/${cost}) · 기예 변경 또는 방어로 회복`}if(u.moveLeft<=0)return"이동력 소진 · 공격이나 방어는 가능합니다";return"이동·발사 가능"}function refresh(app,u){const b=app.engine.b,states=entries(b,u),turn=app.plannedTurn(),why=turn?turn.order?"전로시 · 발사해 지정한 경로로 사격":turn.anchor?"전로시 · 화살을 보낼 방향 선택":"전로시 · 첫 궤적 위에서 선회점 선택":reason(app.engine,u,G.HONRO_CORE.SKILLS[app.selected]),el=document.getElementById("combat-status"),esc=G.HONRO_CORE.escapeHTML;if(el){const sig=JSON.stringify([u.id,states,why]);if(el.dataset.sig!==sig){const focused=el.contains(document.activeElement);el.dataset.sig=sig;el.dataset.unit=u.id;const short=why==="이동·발사 가능"?"상태":why.startsWith("기력 부족")?"기력 부족":why.startsWith("재사용")?"재사용 대기":why.startsWith("기절")?"기절":why.split(" · ")[0];const label=states.length?`${states[0].name}${states.length>1?" +"+(states.length-1):""}`:short;el.innerHTML=`<div class="status-details"><button class="status-trigger" type="button" data-action="inspect-hero" data-id="${esc(u.id)}" aria-label="${esc(u.name)} 상태와 캐릭터 정보"><span class="status-glyph" style="--status-color:${states[0]?.color||"#b7cbbf"}">${glyph(states[0]?.key||"shield")}${esc(label)}</span><span id="combat-passives" class="combat-passives" hidden></span></button></div><span class="status-announcement" role="status" aria-live="polite">${esc(states.map(s=>s.detail).join(" / "))}</span><span class="status-announcement" id="combat-action-reason">${esc(why)}</span>`;const trigger=el.querySelector(".status-trigger");trigger.onkeydown=trigger.onkeyup=e=>{if(["Space","Enter"].includes(e.code))e.stopPropagation()};if(focused)trigger.focus({preventScroll:true})}el.dataset.monsterSignal=softBind(b,u)||u.honroMonsterCondition||casts(b).some(v=>v.enemyEffectCast.target===u.id)||patternSources(b).some(v=>v.honroMonsterWindup.target===u.id)?"true":"false";el.dataset.limited=why!=="이동·발사 가능"||u.bound>0||u.stun>0||softBind(b,u)?"true":"false"}for(const chip of document.querySelectorAll("#hero-switches [data-id]")){const v=app.engine.unit(chip.dataset.id);if(!v)continue;const state=effects(b,v),tag=v.dead?"전투불능":v.stunnedRound===b.round&&v.acted||v.stun>0?"기절":softBind(b,v)?"매듭실":v.honroMonsterCondition?.kind==="seal"?"봉인":v.honroMonsterCondition?.kind==="attachment"?"객귀":v.honroMonsterCondition?.kind==="knot"?"매듭":casts(b).some(o=>o.enemyEffectCast.target===v.id)||patternSources(b).some(o=>o.honroMonsterWindup.target===v.id)?"예고":v.bound>0?"결박":v.curseTurns>0?"저주":v.acted?"완료":"";const title=`${v.name} · ${state.join(" / ")||(v.acted?"행동 완료":"행동 가능")}`;if(chip.dataset.tooltip!==title)chip.dataset.tooltip=title;chip.classList.toggle("status-impaired",["기절","결박","저주","매듭실","예고"].includes(tag));const small=chip.querySelector("small");const text=tag||`${Math.round(Math.max(0,v.hp)/v.maxHp*100)}%`;if(small&&small.textContent!==text)small.textContent=text}const fire=document.getElementById("fire");if(fire){const previous=b.lastShots?.[u.id]?.power||0,title=fire.disabled?why:previous?"이전 발사 "+Math.round(previous*100)+"%":"누른 채 충전, 손을 떼어 발사";if(fire.dataset.tooltip!==title)fire.dataset.tooltip=title;if(!(fire.getAttribute("aria-describedby")||"").split(/\s+/).includes("combat-action-reason"))fire.setAttribute("aria-describedby",[fire.getAttribute("aria-describedby")||"","combat-action-reason"].filter(Boolean).join(" "))}}function passivePresentation(u){const C=G.HONRO_CORE,r=u.ranks?.MP05||0,chain=u.swordChain||[];if(u.cls==="mage"&&r){const percent=u.jucheonReady?100:Math.max(0,Math.min(100,Math.round(100*(u.jucheon||0)/C.JUCHEON_THRESHOLD[r-1]))),description=u.jucheonReady?"주천완성":`주천 ${percent}%`;return{kind:"jucheon",label:"주천",description:description,html:`<span class="jucheon-state ${u.jucheonReady?"ready":""}" role="meter" aria-label="주천" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100" aria-valuetext="${description}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" class="track"/><circle cx="12" cy="12" r="9" pathLength="100" stroke-dasharray="${percent} 100"/></svg><span class="passive-full">${description}</span><span class="passive-short" aria-hidden="true">${u.jucheonReady?"완":`${percent}%`}</span></span>`}}if(u.cls==="knight"&&u.ranks?.SP04){const schools=[["sword","검술","검"],["rush","돌격","돌"],["blade","검기","기"]],description=u.harmony?"합세 준비":`연세 · ${schools.filter(([id])=>chain.includes(id)).map(([,name])=>name).join(" · ")||"아직 연결 없음"}`;return{kind:"chain",label:u.harmony?"합세":"연세",description:description,html:`<span class="sword-chain" aria-label="${description}">${schools.map(([id,name,short])=>`<i class="${chain.includes(id)?"linked":""}" data-short="${short}">${name}</i>`).join("")}${u.harmony?'<b class="passive-full">합세</b>':""}</span>`}}return null}function passives(app,u){const host=document.getElementById("combat-passives");if(!host)return;const trigger=document.getElementById("combat-status")?.querySelector(".status-trigger"),view=passivePresentation(u),sig=JSON.stringify([u.id,view]);if(host.dataset.sig===sig)return;host.dataset.sig=sig;host.hidden=!view;host.innerHTML=view?.html||"";if(trigger){if(view){trigger.dataset.passive=view.kind;trigger.dataset.passiveLabel=view.label;trigger.dataset.tooltip=view.description+" · 상태와 캐릭터 정보"}else{delete trigger.dataset.passive;delete trigger.dataset.passiveLabel;delete trigger.dataset.tooltip}}}G.HonroCombatStatus={casts:casts,softBind:softBind,warningDetail:warningDetail,drawTelegraphs:drawTelegraphs,entries:entries,effects:effects,draw:draw,reason:reason,embedded:embedded,refresh:refresh,passives:passives,passivePresentation:passivePresentation}})(globalThis)})();await yieldIfNeeded();(()=>{"use strict";(function(G){"use strict";function inside(u,r){return r.width!==undefined?Math.abs(u.x-r.x)<=r.width/2&&Math.abs(u.y-r.y)<=(r.height||r.width)/2:Math.hypot(u.x-r.x,u.y-r.y)<=(r.radius||160)}function objectiveState(b){const heroes=b.units.filter(u=>u.side===0&&!u.dead&&u.hp>0),foes=b.units.filter(u=>u.side===1&&u.summonKind!=="eater"&&!u.dead&&u.hp>0),hs=b.honroState;const targets=(b.honroObjectives||[]).filter(o=>o.type!=="campaign").map(o=>{let done=false;if(o.type==="reach")done=heroes.some(u=>inside(u,o));else if(o.type==="clear")done=!foes.length&&!G.HonroEncounters.pending(b);else if(o.type==="destroy"){const element=b.honroElements?.find(e=>e.id===o.targetId);done=!!G.HonroQuestTargets.records(b).find(t=>t.id===o.targetId)?.broken||!!b.units.find(u=>u.id===o.targetId)?.dead||!!(element?.collisionIds.length&&element.collisionIds.every(id=>G.HonroQuestTargets.records(b).find(t=>t.id===id)?.broken))}else if(o.type==="interact"||o.type==="flag")done=!!hs.flags[o.flag||"interact:"+o.targetId];return{...o,kind:"objective",x:o.x??heroes[0]?.x??0,y:o.y??heroes[0]?.y??0,done:done}});return{complete:targets.some(o=>o.required!==false)&&targets.filter(o=>o.required!==false).every(o=>o.done),summary:targets.filter(o=>!o.done).map(o=>o.label||o.type).join(" · ")||"맵 탐색",targets:targets.filter(o=>!o.done),allTargets:targets}}function tick(app,dt){const e=app.engine,b=e.b,heroes=e.heroesAlive();if(!heroes.length)return;G.HonroEncounters.update(app,dt,{progress:Math.max(...heroes.map(u=>u.x)),height:Math.min(...heroes.map(u=>u.y)),broken:G.HonroQuestTargets.records(b).filter(t=>t.broken).length,collected:b.honroMarkers.filter(m=>m.collected).length});app.checkMission(e)}G.HonroAuthored={inside:inside,objectiveState:objectiveState,tick:tick}})(globalThis)})();await yieldIfNeeded();(()=>{"use strict";(function(G){"use strict";const H=G.HONRO_CONTENT,C=G.HONRO_CORE;const scene=(id,title,lines)=>G.HonroStoryContent.scene(id,title,lines).map(([who,text,meta])=>[who,text,{...meta,storyId:meta.storyId.replace("act1-v6:","act2-v1:")}]);const guide=text=>["안내",text,{kind:"guide",focus:"interact"}];const step=(id,label,kind="interact",extra={})=>({id:id,label:label,kind:kind,...extra});const roster=["archer","mage","knight","occultist"];const chapters=G.HONRO_STAGE_CONTRACTS.slice(10,20).map(st=>G.HonroNarrativeCatalogue.stage(st));for(const st of chapters)H.stages.push(st);H.acts=[{id:1,name:"연목의 매듭",first:1,last:10},{id:2,name:"울리지 않는 종",first:11,last:20}];H.nextAct={id:3,name:"지워진 기록",place:"읍성 문서고",requires:[20],available:false};G.HonroAct2Content={chapters:chapters,roster:roster,guide:guide,scene:scene,legacySteps:G.HONRO_NARRATIVE_COMPAT.act2.legacySteps};const plans=chapters.map(st=>st.act2Plan);G.HonroAct2Plan={revision:2,stages:plans,forStage:id=>plans[id-11]}})(globalThis)})();await yieldIfNeeded();
