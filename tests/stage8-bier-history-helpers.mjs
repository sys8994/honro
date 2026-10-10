/** Exact Stage8 -> Stage23 -> Stage12 -> Stage30 -> Stage18 boundary.
 * Stored historical JavaScript is byte evidence, never evaluated. Every current
 * replacement is checked before projection; current production Engine runs. */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as E from './stage23-escort-history-helpers.mjs';
import {beforeEncounterDensity,beforeEncounterDensityRuntimeSources,beforeEncounterDensityAuthoringSources,beforeEncounterDensityFingerprintParts} from './encounter-density-history-helpers.mjs';
export * from './stage23-escort-history-helpers.mjs';
export const bierHistoryHash=E.escortHistoryHash,bierHistoryPlain=E.escortHistoryPlain;
const hash=bierHistoryHash,plain=bierHistoryPlain,norm=s=>s.replace(/\r\n/g,'\n'),repoRoot=new URL('../',import.meta.url);
export const stage8BierBefore=JSON.parse(readFileSync(new URL('./fixtures/stage8-bier/history-before.json',import.meta.url),'utf8'));
export const stage8BierOriginal=JSON.parse(readFileSync(new URL('./fixtures/stage8-bier/before-stage8.json',import.meta.url),'utf8'));
const f=stage8BierBefore,o=stage8BierOriginal;
assert.equal(f.sourceCommit,'bf8b108eb1f27110b2363e6c9211af2f98828c07');
assert.equal(f.sourceTree,'a14f5e985a85361a372750065e35d0713c101e00');
assert.equal(o.sourceCommit,f.sourceCommit);assert.equal(o.sourceTree,f.sourceTree);
assert.equal(hash(o.stage),f.stages.find(s=>s.id==='stage-8').sha256);
assert.equal(f.library.length,580);assert.equal(f.runtime.files.length,130);assert.equal(f.protectedFixtures.length,31);
// Separately approved post-bf8 render-only23 correction. Neither a new current
// baseline nor permission to change any other source. Stored source never runs.
export const stage23StoneScaleDelta=Object.freeze({path:'shared/runtime/stage23-escort-art.js',commit:'274c1a518bad1db2c4c989d59ca9b37165e5068c',beforeSha256:'10ad7bbaaa48acc121d556a97688400bae204a6adbe2b3a2be7a58d7393fb6e7',afterSha256:'309607319dde8b97ca6b8acc95ce87fab925c794e9322c0699bb004713dc4970'});
const stage23StoneScaleBefore="(function(G){'use strict';\n// Exact authored polygons and one translated cargo drawing. Story owns timing;\n// this pass cannot move an actor, change geography, or write a saved value.\nconst S=G.HonroScene.prototype,C=G.HONRO_CORE,cache=new WeakMap(),skyCache=new WeakMap();\nconst active=b=>b?.honroStage===23&&!b.honroCustom&&b.honroEscortYardRevision===1;\nconst reduced=G.matchMedia?.('(prefers-reduced-motion: reduce)');\nconst state=b=>b.honroState?.escortYard||{},spec=b=>b.honroEscortYardSpec?.cargo||{};\nfunction path(ps){const p=new Path2D();ps.forEach((v,i)=>i?p.lineTo(v.x??v[0],v.y??v[1]):p.moveTo(v.x??v[0],v.y??v[1]));p.closePath();return p;}\nfunction shape(t,b){let q=cache.get(t);if(q?.vertices===t.vertices&&q.version===b.sceneVersion)return q;\n const ps=C.poly(t),profile=t.id==='sy-ground'?b.honroMap?.act3?.primaryContour:null;\n // The extended v6 polygon starts outside Play Bounds. Its vertex indices are\n // not the authored road indices; paint only the actual contour's top edge.\n const pairs=profile?profile.slice(1).map((z,i)=>[profile[i],z].map(p=>({x:p[0],y:p[1]}))):(t.honroWalkEdges||[]).map(i=>[ps[i],ps[(i+1)%ps.length]]);\n const edges=pairs.filter(([a,z])=>a&&z&&Math.abs(a.x-z.x)>.001&&Math.abs((a.y-z.y)/(a.x-z.x))<=1.35),rim=new Path2D();for(const[a,z]of edges){rim.moveTo(a.x,a.y+7);rim.lineTo(z.x,z.y+7);}\n q={vertices:t.vertices,version:b.sceneVersion,body:path(ps),edges,rim};cache.set(t,q);return q;\n}\nfunction terrain(c,t,b){if(!active(b)||!t.id?.startsWith('sy-'))return false;\n // The bound bundle asset is the visible body of both collision poses.\n if(t.id==='sy-cargo-stored'||t.id==='sy-cargo-settled')return true;\n const q=shape(t,b),earth=t.id==='sy-ground',wood=t.mat==='wood',stone=/bridge|pier|corner/.test(t.id),top=earth?4100:t.y,depth=earth?2200:Math.max(24,Math.min(850,t.h));\n // Local vertical values, never the huge v6 world-bound width/height, own tone.\n const g=c.createLinearGradient(0,top,0,top+depth);g.addColorStop(0,wood?'#ab9868':earth?'#727e65':'#88937a');g.addColorStop(.38,wood?'#7b6c48':earth?'#54674f':'#667d62');g.addColorStop(1,earth?'#304c40':'#3f5948');\n c.save();c.clip(q.body);c.fillStyle=g;c.fill(q.body);\n if(earth){\n  // A broad worn road and its compacted earth shoulder follow every true\n  // incline; the water-cut cliffs deliberately receive no walkable rim.\n  for(const[a,z]of q.edges){c.fillStyle='#9b9e7d';c.fill(path([[a.x,a.y],[z.x,z.y],[z.x,z.y+43],[a.x,a.y+43]]));c.fillStyle='#758367';c.fill(path([[a.x,a.y+43],[z.x,z.y+43],[z.x,z.y+112],[a.x,a.y+112]]));}\n }else if(wood){c.strokeStyle='#3d4a36';c.lineWidth=4;for(const f of [.19,.46,.81]){const x=t.x+t.w*f;c.beginPath();c.moveTo(x,t.y);c.lineTo(x+6,t.y+t.h);c.stroke();}}\n else if(stone){\n  // Human-scale dressed courses tie each true solid core to the rear masonry.\n  const rows=Math.max(1,Math.ceil(t.h/150));c.strokeStyle='#354d3d99';c.lineWidth=5;\n  for(let row=1;row<rows;row++){const y=t.y+t.h*row/rows;c.beginPath();c.moveTo(t.x,y);c.lineTo(t.x+t.w,y+4);c.stroke();}\n  for(let row=0;row<rows;row++)for(const f of row%2?[.32,.76]:[.53]){const x=t.x+t.w*f,y=t.y+t.h*row/rows;c.beginPath();c.moveTo(x,y+6);c.lineTo(x+3,y+t.h/rows-5);c.stroke();}\n  if(t.id==='sy-stone-corner'){c.fillStyle='#9ca183';c.fill(path([[t.x,t.y],[t.x+24,t.y],[t.x+24,t.y+t.h],[t.x,t.y+t.h]]));c.fillStyle='#314a3c66';c.fill(path([[t.x+t.w-30,t.y],[t.x+t.w,t.y],[t.x+t.w,t.y+t.h],[t.x+t.w-30,t.y+t.h]]));}\n }\n c.strokeStyle=wood?'#c9b88b99':earth?'#c3bea078':'#bdc0a278';c.lineWidth=earth?9:7;c.stroke(q.rim);c.restore();return true;\n}\nconst originalTerrain=S.terrain;S.terrain=function(c,t){if(terrain(c,t,this.battle))return;return originalTerrain.call(this,c,t);};\nconst skyAsset=b=>b.honroMap?.escortYardArt?.backdropAsset;\nfunction skyRaster(asset){let q=skyCache.get(asset);if(q)return q;const cv=G.document.createElement('canvas'),[x,y,w,h]=asset.vector.viewBox;cv.width=1800;cv.height=1080;const c=cv.getContext('2d');c.scale(cv.width/w,cv.height/h);c.translate(-x,-y);G.HonroVectorArt.draw(c,asset,{x:0,y:0,scale:1,rotation:0});skyCache.set(asset,cv);return cv;}\nconst background=S.background;S.background=function(c,w,h,b){if(!active(b)||!skyAsset(b))return background.call(this,c,w,h,b);const cv=skyRaster(skyAsset(b)),frame=G.HonroEnvironment.act1BackdropFrame(this,w,h,b,cv.width,cv.height);c.drawImage(cv,frame.x,frame.y,frame.w,frame.h);this.environmentStats={groups:0,visibleAssets:1,cachedPaths:0,backgroundAnimatedPrimitives:0,animatedPrimitives:0};};\nfunction motion(b){const s=state(b),ps=spec(b).path||[],u=s.status==='settled'?1:s.status==='sliding'?(reduced?.matches?0:Math.max(0,Math.min(1,(s.elapsed||0)/(s.duration||1)))):0;if(ps.length<2)return{x:0,y:0,progress:u};\n const lengths=ps.slice(1).map((p,i)=>Math.hypot(p.x-ps[i].x,p.y-ps[i].y)),total=lengths.reduce((a,z)=>a+z,0);let remaining=total*(u*u*(3-2*u));for(let i=0;i<lengths.length;i++){if(remaining<=lengths[i]||i===lengths.length-1){const f=lengths[i]?Math.min(1,remaining/lengths[i]):1;return{x:ps[i].x+(ps[i+1].x-ps[i].x)*f-ps[0].x,y:ps[i].y+(ps[i+1].y-ps[i].y)*f-ps[0].y,progress:u};}remaining-=lengths[i];}return{x:0,y:0,progress:u};}\nfunction body(b){return b.honroLandmarks?.find(l=>l.id===(spec(b).elementId||'sy-art-cargo'));}\nfunction drawBody(c,l,m){c.save();c.translate(m.x,m.y);G.HonroVectorArt.draw(c,l.asset,l);c.restore();return true;}\nconst landmarks=S._landmarkLayer;S._landmarkLayer=function(c,list,layer){const b=this.battle;if(!active(b))return landmarks.call(this,c,list,layer);const id=spec(b).elementId||'sy-art-cargo',l=list.find(l=>l.id===id),out=landmarks.call(this,c,list.filter(l=>l.id!==id),layer);if(l&&layer===(l.layer||'back')&&state(b).status!=='sliding')drawBody(c,l,motion(b));return out;};\n// The loading trough sits behind the narrow upper front walkway. Repaint only\n// its actual 24-unit solid strip over the moving rear bundle, before actors and\n// aiming guides. Its occupants are still part of the unchanged safety sweep.\nfunction cargoForeground(c,b){const t=b.terrain.find(t=>t.id==='sy-west-upper');if(!t||t.broken)return;terrain(c,t,b);}\nconst live=S.liveWater;S.liveWater=function(c,b){const out=live?.call(this,c,b);if(active(b)&&state(b).status==='sliding'){const l=body(b);if(l?.asset){drawBody(c,l,motion(b));cargoForeground(c,b);}}return out;};\nconst omitReadability=(group,b)=>active(b)&&['sy-cargo-stored','sy-cargo-settled'].includes(group.id);\nG.HonroStage23EscortArt={active,shape,terrain,skyAsset,skyRaster,motion,body,drawBody,cargoForeground,omitReadability};\n})(globalThis);\n";
assert.equal(hash(stage23StoneScaleBefore),stage23StoneScaleDelta.beforeSha256);
export function beforeStage23StoneScaleSource(source){const digest=hash(source),d=stage23StoneScaleDelta;assert([d.beforeSha256,d.afterSha256].includes(digest),'Exact separately approved Stage23 stone-scale source bytes');return digest===d.afterSha256?stage23StoneScaleBefore:source;}
export function beforeStage23StoneScaleSources(sources){return{...sources,[stage23StoneScaleDelta.path]:beforeStage23StoneScaleSource(sources[stage23StoneScaleDelta.path])};}
export const stage8BierScope=Object.freeze({...plain(f.scope),approvedPostBaselineRuntime:[plain(stage23StoneScaleDelta)],allowedChangedAuthoring:['tools/map-forge/apply-act1.mjs','tools/environment/act1-scene-composition.mjs'],allowedAddedAuthoring:['tools/map-forge/stage8-bier.mjs','tools/map-forge/stage8-bier-geometry.mjs','tools/environment/stage8-bier-art.mjs','shared/assets/environment/stage8-bier-far.svg']});
const scope=stage8BierScope,reviewRuntimePaths=[...scope.allowedChangedRuntime,...scope.allowedAddedRuntime,stage23StoneScaleDelta.path],added=a=>typeof a.id==='string'&&a.id.startsWith(scope.addedAssetPrefix);
const globals=p=>Object.fromEntries(Object.entries(p).filter(([k])=>!['stages','library'].includes(k)));
const selected=(rows,s)=>s==='full'?rows:rows.filter(row=>Number((row.id||row).slice(6))<=20);
function scopeOf(p){if(p.stages?.length===30)return'full';assert.equal(p.stages?.length,20,'Only complete full/Act12 projects cross Stage8');return'act12';}
export function stage8BierReview(){return JSON.parse(readFileSync(new URL('./fixtures/stage8-bier/history-reviewed.json',import.meta.url),'utf8'));}
// Same raw source membership as the immutable collectors, resolved relative to
// this module so npm --prefix game and repository-root audits see equal bytes.
export function stage8BierRuntimeSources(){const dirs=['shared/runtime','shared/map','shared/engine/src'],extra=['shared/build.mjs','game/engine/build.mjs','game/config/balance.json',...readdirSync(new URL('shared/data',repoRoot)).filter(p=>p.endsWith('.json')&&p!=='campaign.json').map(p=>'shared/data/'+p)];return Object.fromEntries([...dirs.flatMap(dir=>readdirSync(new URL(dir,repoRoot)).filter(p=>/\.(js|ts)$/.test(p)).map(p=>dir+'/'+p)),...extra].sort().map(p=>[p,readFileSync(new URL(p,repoRoot),'utf8')]));}
export const stage23EscortRuntimeSources=stage8BierRuntimeSources,stage12QuarryRuntimeSources=stage8BierRuntimeSources,stage30FerryRuntimeSources=stage8BierRuntimeSources,stage18BellRuntimeSources=stage8BierRuntimeSources;
function reviewFor(review){const r=review??stage8BierReview();assert.equal(r.version,1);assert.equal(r.sourceCommit,f.sourceCommit);assert.equal(r.sourceTree,f.sourceTree);assert.deepEqual(r.scope,scope,'Immutable explicit Stage8 scope');return r;}
function libraryBase(library,s){const out=plain(library).filter(a=>!added(a)),expected=f.library.filter(a=>s==='full'||!a.id.startsWith('a3-'));assert.deepEqual(out.map(a=>a.id),expected.map(a=>a.id),'All580 original asset membership/order (or exact Act12 subset)');for(const[i,a]of out.entries())assert.equal(hash(a),expected[i].sha256,'Exact original asset '+a.id);return out;}
function contract(stage){
 assert.equal(stage.id,'stage-8');assert.deepEqual(stage.metadata,o.stage.metadata,'Original campaign identity');assert(stage.width>0&&stage.width<=11200&&stage.height>0&&stage.height<=6400,'Approved size ceiling');
 const init=stage.initialState;assert.equal(init.honroStage8BierRevision,1);assert.equal(init.honroActiveLimit,4);assert.deepEqual(stage.objectives,o.stage.objectives,'Original two seals + boss + settle1 objective system');
 assert.deepEqual(stage.units.filter(u=>u.team==='player').map(u=>u.kind).sort(),['archer','knight','mage']);
 assert.equal(stage.units.filter(u=>!['player','enemy'].includes(u.team)).length,0,'No new civilian or early companion');
 assert.equal(stage.units.filter(u=>u.id==='boss'&&u.kind==='boss:bier').length,1,'Exactly one original bier boss');
 assert.equal(stage.terrains.filter(t=>t.properties?.honroSeal).length,2,'Exactly two freely ordered original seals');
 assert.equal(stage.markers.filter(m=>m.type==='rest').length,3,'Original three one-use rest fires');
 assert.equal(stage.markers.filter(m=>m.type==='hauntHabitat').length,0,'No unlimited habitat reinforcement in new8');
 assert.deepEqual(init.honroState,{flags:{},collected:[],hold:0,lastRound:1,rescued:false,combatLog:[]},'No pre-completed goals or prepaid rewards');
 const budgets={candidate28e5:[28,5,37],oldBudget20e0:[20,0,29]},budget=budgets[init.honroStage8BierRoster];assert(budget,'Explicit original-budget/proposed roster');const foes=stage.units.filter(u=>u.team==='enemy'&&u.id!=='boss');assert.deepEqual([foes.length,foes.filter(u=>u.stageOverrides?.honroStage8BierElite).length,init.honroStage8BierPopulationCap],budget);assert.equal(init.enemyLimit,4);
 assert.deepEqual(Object.keys(init).sort(),['honroStage8BierRevision','honroStage8BierRoster','honroActiveLimit','enemyLimit','honroStage8BierPopulationCap','honroState','honroStage8BierSpec'].sort(),'Exact new initial-state schema');
 for(const u of stage.units.filter(u=>u.team==='player'))assert.deepEqual(Object.keys(u).sort(),['id','kind','team','x','y','surfaceId','facing'].sort(),'Profile-owned hero attributes; no stat/rank overrides');
 const oldBoss=plain(o.stage.units.find(u=>u.id==='boss')),boss=plain(stage.units.find(u=>u.id==='boss'));for(const k of ['x','y','spawnX','spawnY'])boss[k]=oldBoss[k];delete boss.surfaceId;assert.deepEqual(boss,oldBoss,'Original boss complete combat attributes; only pose changes');
 for(const u of foes){assert(['hound','boar','crow','warden','lantern','ghost'].includes(u.kind),'Only approved possessed creature species, with no new human or early Sodan');assert.deepEqual(Object.keys(u).sort(),['id','kind','team','x','y','facing','spawnIndex','encounterGroup','stageOverrides'].sort());const keys=['honroStage8BierEnemy','honroStage8BierElite','elite','honroCohort','honroEncounterRole','honroEncounterSupport','honroCluster'];if(Object.hasOwn(u.stageOverrides,'fixed'))keys.push('fixed');assert.deepEqual(Object.keys(u.stageOverrides).sort(),keys.sort(),'No enemy combat-stat overrides');assert.equal(u.stageOverrides.honroStage8BierEnemy,true);assert.equal(typeof u.stageOverrides.elite,'boolean');assert.equal(u.stageOverrides.elite,u.stageOverrides.honroStage8BierElite);}
 for(const t of stage.terrains.filter(t=>t.properties?.honroSeal)){const old=o.stage.terrains.find(v=>v.id===t.id);assert(old,'Original seal identity');for(const k of ['hp','maxHp','device','honroSeal'])assert.deepEqual(t.properties[k],old.properties[k],'Original seal '+k);}
 for(const m of stage.markers.filter(m=>m.type==='rest')){const old=o.stage.markers.find(v=>v.id===m.id),v=plain(m);assert(old);v.x=old.x;v.y=old.y;delete v.surfaceId;assert.deepEqual(v,old,'Original one-use rest-fire semantics');}
 for(const key of ['honroGrowth','heroes','startXP','honroStage8BierContent'])assert(!Object.hasOwn(init,key),'No growth injection or substitute story '+key);
 const spec=init.honroStage8BierSpec;assert(spec?.movement?.destinations?.length&&spec.movement.routes?.length&&spec.entries,'Saved motion/entry specifications');
 for(const[name,rows]of [['unit',stage.units],['terrain',stage.terrains],['marker',stage.markers],['event',stage.events]])assert.equal(new Set(rows.map(r=>r.id)).size,rows.length,'Unique Stage8 '+name+' IDs');
 assert.deepEqual(stage.events.map(e=>[e.id,e.when.after,e.action.kind,e.action.n]),[['stage8-first-seal','stage8-gate-first-seal','hound',3],['stage8-settled-crows','stage8-gate-settled-crows','crow',3],['stage8-low-health','stage8-gate-low-health','hound',2]],'Exact finite sources, gates and counts');assert.equal(stage.events.reduce((n,e)=>n+e.action.n,0),8,'Eight finite reinforcements');
 assert.deepEqual(Object.keys(spec.entries),stage.events.map(e=>e.id),'Exact event entry membership/order');
 for(const e of stage.events){assert.deepEqual(Object.keys(e).sort(),['id','once','when','warning','text','entry','action'].sort(),'Exact finite event schema');assert.deepEqual(Object.keys(e.when),['after']);assert.deepEqual(Object.keys(e.action).sort(),['type','kind','n','x','y','spacing','maxDistance','source','honroStage8Bier'].sort(),'No wave combat-stat or elite additions');assert.deepEqual(e.entry,{x:e.action.x,y:e.action.y});assert.equal(e.action.honroStage8Bier,true);assert(e.action.spacing>0&&e.action.spacing<=200);assert(typeof e.warning==='string'&&e.warning.trim()&&typeof e.text==='string'&&e.text.trim());assert.equal(e.once,true);assert.equal(e.action.type,'spawn');assert(Number.isInteger(e.action.n)&&e.action.n>0);assert.equal(e.action.source,e.id);assert(Number.isFinite(e.action.x)&&Number.isFinite(e.action.y));assert.equal(e.action.maxDistance,0,'Authored finite spawn location');assert(typeof e.when?.after==='string'&&e.when.after.length,'Supported explicit runtime gate');}
}
/** Scope checks never constitute a review. The recorder separately verifies
 * exact generator reproduction, immutable inputs and complete source scope. */
export function assertStage8BierScope(project){const p=beforeEncounterDensity(project),s=scopeOf(p);assert.deepEqual(p.stages.map(r=>r.id),selected(f.stageOrder,s));assert.deepEqual(globals(p),f.globals,'Unchanged project globals');for(const row of selected(f.stages,s)){const st=p.stages.find(x=>x.id===row.id);assert.equal(st.metadata.stageId,Number(row.id.slice(6)));if(row.id==='stage-8')contract(st);else assert.equal(hash(st),row.sha256,'Exact unaffected complete map '+row.id);}
 const library=libraryBase(p.library,s),assets=p.library.filter(added);assert(assets.length,'Explicit new8 editable artwork');assert.deepEqual(p.library.map(a=>a.id),[...library.map(a=>a.id),...assets.map(a=>a.id)],'New artwork appended in reviewed order');assert.equal(new Set(assets.map(a=>a.id)).size,assets.length);for(const a of assets){assert.deepEqual(a.collision,[]);assert(a.vector?.root,'Editable non-collision vector art');}
 const out={...p,stages:p.stages.map(st=>st.id==='stage-8'?plain(o.stage):st),library};if(s==='full')assert.equal(hash(out),f.projectSha256,'Exact frozen bf8b108 project after Stage8 reversal');E.assertStage23EscortCurrent(out);return out;
}
const baseSource=path=>{const row=f.runtime.files.find(r=>r.path===path);assert(row&&Object.hasOwn(row,'before'),'Frozen original source '+path);return row.before;};
export function assertStage8BierRuntimeScope(sources){sources=beforeEncounterDensityRuntimeSources(sources);assert.deepEqual(Object.keys(sources).sort(),[...f.runtime.files.map(r=>r.path),...scope.allowedAddedRuntime].sort(),'Exact130 original +2 new source membership');for(const row of f.runtime.files){const value=row.path===stage23StoneScaleDelta.path?beforeStage23StoneScaleSource(sources[row.path]):sources[row.path];if(!scope.allowedChangedRuntime.includes(row.path)){assert.equal(hash(value),row.sha256,'Unchanged complete runtime '+row.path);continue;}
 if(row.path==='shared/build.mjs'){const expected=row.before.replace("'story-staging','story-direction']","'story-staging','story-direction','stage8-bier']").replace("'stage23-escort-art','combat-feedback'","'stage23-escort-art','stage8-bier-art','combat-feedback'");assert.notEqual(expected,row.before);assert.equal(value,expected,'Only two model/render registrations');}
 else if(row.path==='shared/runtime/terrain-readability.js'){const expected=row.before.replace('G.HonroStage23EscortArt?.omitReadability(group,b)','G.HonroStage23EscortArt?.omitReadability(group,b)||G.HonroStage8BierArt?.omitReadability(group,b)');assert.notEqual(expected,row.before);assert.equal(value,expected,'Only the stage-local readability hook');}
 else if(row.path==='game/config/balance.json'){const b=JSON.parse(value),old=JSON.parse(row.before),count=b.stages[7].initialEnemies;assert([10,28].includes(count),'Only original or proposed28 initial count');b.stages[7].initialEnemies=old.stages[7].initialEnemies;assert.deepEqual(b,old,'Only Stage8 initial count; every XP, maxAlive, active and other balance field stays frozen');const prefix='\"id\": 8,\n      \"entryLevel\": 8.5,\n      \"exitLevel\": 10,\n      \"initialEnemies\": ';assert.equal(row.before.split(prefix+'10').length-1,1);assert.equal(value,row.before.replace(prefix+'10',prefix+count),'Only exact Stage8 initial-count bytes, without whole-file reformatting');}
 }for(const path of scope.allowedAddedRuntime)assert(typeof sources[path]==='string'&&sources[path].length>100,'Complete new runtime '+path);return sources;}
export function createStage8BierReview(project,sources,{label,authoringSources={},fingerprints={}}={}){assert(!project.stages?.some(s=>Object.hasOwn(s.initialState||{},'honroEncounterDensityRevision')),'Density must use its separate delta; never replace the original Stage8 review');assert(typeof label==='string'&&label.trim(),'Explicit reviewed checkpoint label required');assert.equal(scopeOf(project),'full');assertStage8BierScope(project);assertStage8BierRuntimeScope(sources);assertStage8BierAuthoringScope(authoringSources);return{version:1,sourceCommit:f.sourceCommit,sourceTree:f.sourceTree,label,scope:plain(scope),stage:plain(project.stages[7]),addedAssets:plain(project.library.filter(added)),projectSha256:hash(project),runtime:Object.fromEntries(reviewRuntimePaths.map(path=>[path,sources[path]])),authoringSources:Object.fromEntries(Object.entries(authoringSources).map(([path,bytes])=>[path,rawHash(bytes)])),fingerprints:plain(fingerprints)};}
export function assertStage8BierCurrent(project,{review}={}){const r=reviewFor(review),p=beforeEncounterDensity(project);assertStage8BierScope(p);assert.deepEqual(p.stages[7],r.stage,'Exact complete reviewed Stage8');if(scopeOf(p)==='full')assert.equal(hash(p),r.projectSha256);assert.deepEqual(p.library.filter(added),r.addedAssets,'Exact reviewed new assets, membership/order');return p;}
export function beforeStage8Bier(project,{review}={}){const p=beforeEncounterDensity(project),rows=p.stages?.filter(s=>s.id==='stage-8'||s.metadata?.stageId===8)||[];assert(rows.length<=1,'No duplicate/aliased Stage8');if(rows.length){assert.equal(rows[0].id,'stage-8');assert.equal(rows[0].metadata.stageId,8);}
 // Historical input is passed through without deleting a byte. Older immutable
 // layers still enforce their own exact maps/assets and original assertions.
 if(!p.library?.some(added)&&(!rows.length||hash(rows[0])===hash(o.stage)))return p;
 assertStage8BierCurrent(p,{review});return assertStage8BierScope(p);}
export function beforeStage8BierLibrary(library,{review}={}){const p=plain(library);if(!p.some(added))return p;const r=reviewFor(review);assert.deepEqual(p.filter(added),r.addedAssets);const s=p.filter(a=>!added(a)).length===f.library.length?'full':'act12',out=libraryBase(p,s);assert.deepEqual(p.map(a=>a.id),[...out.map(a=>a.id),...r.addedAssets.map(a=>a.id)]);return out;}
export function beforeStage8BierRuntimeSources(sources=stage8BierRuntimeSources(),{review}={}){sources=beforeEncounterDensityRuntimeSources(sources);const expected=f.runtime.files.map(r=>r.path).sort();if(Object.keys(sources).length===expected.length){assert.deepEqual(Object.keys(sources).sort(),expected);const original=beforeStage23StoneScaleSources(sources);for(const row of f.runtime.files)assert.equal(hash(original[row.path]),row.sha256,'Exact frozen runtime '+row.path);return original;}
 const r=reviewFor(review);assertStage8BierRuntimeScope(sources);assert.deepEqual(Object.keys(r.runtime).sort(),reviewRuntimePaths.slice().sort());for(const[path,value]of Object.entries(r.runtime))assert.equal(sources[path],value,'Exact reviewed runtime '+path);const out={...sources};for(const path of scope.allowedAddedRuntime)delete out[path];for(const path of scope.allowedChangedRuntime)out[path]=baseSource(path);return beforeStage8BierRuntimeSources(out);}
const projectPrefix='globalThis.HONRO_PROJECT=HonroObjectiveRevision.author(HonroAct1Roster.author(',projectSuffix='));';
export function beforeStage8BierFingerprintParts(parts,{sources=stage8BierRuntimeSources(),review}={}){parts=beforeEncounterDensityFingerprintParts(parts);sources=beforeEncounterDensityRuntimeSources(sources);const r=reviewFor(review),prior=beforeStage8BierRuntimeSources(sources,{review:r}),digest=hash(parts.join('\n'));
 const immutable=[f.runtime.beforeFingerprintSha256,...Object.values(E.stage23EscortReview().fingerprints).flatMap(x=>[x.current,x.before]),E.stage12QuarryBefore.runtime.beforeFingerprintSha256,E.stage30FerryBefore.runtime.beforeFingerprintSha256,E.stage18BellHistoryDelta.runtime.beforeFingerprintSha256];if(immutable.includes(digest))return[...parts];
 const known=Object.values(r.fingerprints||{}).find(x=>x.current===digest||x.before===digest);assert(known,'Exact reviewed raw-model or historical temple parts/order');if(digest===known.before)return[...parts];
 const remove=new Set(scope.allowedAddedRuntime.map(path=>norm(sources[path]))),out=parts.flatMap(part=>{if(remove.has(part))return[];if(part==='globalThis.HONRO_BALANCE='+norm(sources['game/config/balance.json'])+';')return['globalThis.HONRO_BALANCE='+norm(prior['game/config/balance.json'])+';'];if(part.startsWith('globalThis.HONRO_PROJECT=')){assert(part.startsWith(projectPrefix)&&part.endsWith(projectSuffix));return[projectPrefix+JSON.stringify(beforeStage8Bier(JSON.parse(part.slice(projectPrefix.length,-projectSuffix.length)),{review:r}))+projectSuffix];}return[part];});assert.equal(hash(out.join('\n')),known.before,'Exact original fingerprint after bounded Stage8 reversal');return out;}
function semantics(value,original,kind,{review}={}){const out=plain(value),rows=out.stages.filter(s=>s.id===8);if(!rows.length)return out;assert.equal(rows.length,1);const row=rows[0];if(hash(row)===hash(original))return out;const r=reviewFor(review),expected=plain(original);expected[kind==='balance'?'initialEnemies':'enemies']=JSON.parse(r.runtime['game/config/balance.json']).stages[7].initialEnemies;assert.deepEqual(row,expected,'Only reviewed count-derived Stage8 '+kind);out.stages[out.stages.indexOf(row)]=plain(original);return out;}
export const beforeStage8BierBalance=(v,opt)=>semantics(v,o.balance,'balance',opt);
export const beforeStage8BierContent=(v,opt)=>semantics(v,o.content,'content',opt);
function rows(g,next,fn,{forceStageIds=[]}={}){const saved=g.HONRO_PROJECT,edits=[];for(const[key,value]of Object.entries(next))if(key!=='HONRO_PROJECT'){assert.deepEqual(plain({...g[key],stages:[]}),plain({...value,stages:[]}));assert.deepEqual(plain(g[key].stages.map(s=>s.id)),value.stages.map(s=>s.id));for(const[i,row]of value.stages.entries())if(forceStageIds.includes(row.id)||hash(g[key].stages[i])!==hash(row))edits.push({target:g[key].stages,i,old:g[key].stages[i],row});}try{g.HONRO_PROJECT=next.HONRO_PROJECT;for(const e of edits)e.target[e.i]=e.row;return fn();}finally{g.HONRO_PROJECT=saved;for(const e of edits)e.target[e.i]=e.old;}}
export function withHistoricalStage8(g,fn){beforeStage8BierRuntimeSources();return rows(g,{HONRO_PROJECT:beforeStage8Bier(g.HONRO_PROJECT),HONRO_BALANCE:beforeStage8BierBalance(g.HONRO_BALANCE),HONRO_CONTENT:beforeStage8BierContent(g.HONRO_CONTENT)},fn,{forceStageIds:[8]});}
// The raw source collector stays raw. Older already-projected source collections
// flow directly into their immutable validators, which check every remaining byte.
const priorSources=p=>Object.keys(p).length>=f.runtime.files.length?beforeStage8BierRuntimeSources(p):p;
export const beforeStage23Escort=(p,opt)=>E.beforeStage23Escort(beforeStage8Bier(p),opt);
export const assertStage23EscortCurrent=(p,opt)=>E.assertStage23EscortCurrent(beforeStage8Bier(p),opt);
export const beforeStage23EscortLibrary=(p,opt)=>E.beforeStage23EscortLibrary(beforeStage8BierLibrary(p),opt);
export const beforeStage23EscortRuntimeSources=(p=stage8BierRuntimeSources(),opt)=>E.beforeStage23EscortRuntimeSources(priorSources(p),opt);
export const beforeStage23EscortBalance=(p,opt)=>E.beforeStage23EscortBalance(beforeStage8BierBalance(p),opt);
export const beforeStage23EscortContent=(p,opt)=>E.beforeStage23EscortContent(beforeStage8BierContent(p),opt);
export const beforeStage23EscortFingerprintParts=(p,{sources=stage8BierRuntimeSources(),...opt}={})=>E.beforeStage23EscortFingerprintParts(beforeStage8BierFingerprintParts(p,{sources}),{...opt,sources:beforeStage8BierRuntimeSources(sources)});
export const beforeStage12Quarry=(p,opt)=>E.beforeStage12Quarry(beforeStage8Bier(p),opt);
export const assertStage12QuarryCurrent=(p,opt)=>E.assertStage12QuarryCurrent(beforeStage8Bier(p),opt);
export const beforeStage12QuarryLibrary=(p,opt)=>E.beforeStage12QuarryLibrary(beforeStage8BierLibrary(p),opt);
export const beforeStage12QuarryRuntimeSources=(p=stage8BierRuntimeSources(),opt)=>E.beforeStage12QuarryRuntimeSources(priorSources(p),opt);
export const beforeStage12QuarryBalance=(p,opt)=>E.beforeStage12QuarryBalance(beforeStage8BierBalance(p),opt);
export const beforeStage12QuarryContent=(p,opt)=>E.beforeStage12QuarryContent(beforeStage8BierContent(p),opt);
export const beforeStage12QuarryFingerprintParts=(p,{sources=stage8BierRuntimeSources(),...opt}={})=>E.beforeStage12QuarryFingerprintParts(beforeStage8BierFingerprintParts(p,{sources}),{...opt,sources:beforeStage8BierRuntimeSources(sources)});
export const beforeStage30Ferry=(p,opt)=>E.beforeStage30Ferry(beforeStage8Bier(p),opt);
export const assertStage30FerryCurrent=(p,opt)=>E.assertStage30FerryCurrent(beforeStage8Bier(p),opt);
export const beforeStage30FerryLibrary=(p,opt)=>E.beforeStage30FerryLibrary(beforeStage8BierLibrary(p),opt);
export const beforeStage30FerryRuntimeSources=(p=stage8BierRuntimeSources(),opt)=>E.beforeStage30FerryRuntimeSources(priorSources(p),opt);
export const beforeStage30FerryBalance=(p,opt)=>E.beforeStage30FerryBalance(beforeStage8BierBalance(p),opt);
export const beforeStage30FerryContent=(p,opt)=>E.beforeStage30FerryContent(beforeStage8BierContent(p),opt);
export const beforeStage30FerryFingerprintParts=(p,{sources=stage8BierRuntimeSources(),...opt}={})=>E.beforeStage30FerryFingerprintParts(beforeStage8BierFingerprintParts(p,{sources}),{...opt,sources:beforeStage8BierRuntimeSources(sources)});
export const beforeStage18Bell=(p,opt)=>E.beforeStage18Bell(beforeStage8Bier(p),opt);
export const assertStage18BellCurrent=(p,opt)=>E.assertStage18BellCurrent(beforeStage8Bier(p),opt);
export const beforeStage18BellLibrary=(p,opt)=>E.beforeStage18BellLibrary(beforeStage8BierLibrary(p),opt);
export const beforeStage18BellFingerprintParts=(p,{sources=stage8BierRuntimeSources(),...opt}={})=>E.beforeStage18BellFingerprintParts(beforeStage8BierFingerprintParts(p,{sources}),{...opt,sources:beforeStage8BierRuntimeSources(sources)});
export const createStage23EscortReview=(p,s,opt)=>E.createStage23EscortReview(beforeStage8Bier(p),priorSources(s),opt);
export const createStage12QuarryReview=(p,s,opt)=>E.createStage12QuarryReview(beforeStage8Bier(p),priorSources(s),opt);
export const assertStage18BellRuntimeSources=(p=stage8BierRuntimeSources())=>{beforeStage30FerryRuntimeSources(p);return p;};
function historical(g,fn,level){beforeStage30FerryRuntimeSources();
 const project=level===23?beforeStage23Escort(g.HONRO_PROJECT):level===12?beforeStage12Quarry(g.HONRO_PROJECT):level===30?beforeStage30Ferry(g.HONRO_PROJECT):beforeStage18Bell(g.HONRO_PROJECT);
 const balance=level===23?beforeStage23EscortBalance(g.HONRO_BALANCE):level===12?beforeStage12QuarryBalance(g.HONRO_BALANCE):beforeStage30FerryBalance(g.HONRO_BALANCE);
 const content=level===23?beforeStage23EscortContent(g.HONRO_CONTENT):level===12?beforeStage12QuarryContent(g.HONRO_CONTENT):beforeStage30FerryContent(g.HONRO_CONTENT);
 const plan=level===23?plain(g.HonroAct2Plan):E.beforeStage12QuarryPlan(g.HonroAct2Plan);
 if(level===18)for(const row of E.stage18BellHistoryDelta.runtime.stages){for(const[key,value]of Object.entries({content:content.stages[row.id-1],plan:plan.stages[row.id-11],balance:balance.stages[row.id-1]}))assert.deepEqual(value,row.after[key],'Exact reviewed current Stage'+row.id+' runtime '+key);content.stages[row.id-1]=plain(row.before.content);plan.stages[row.id-11]=plain(row.before.plan);balance.stages[row.id-1]=plain(row.before.balance);}
 return rows(g,{HONRO_PROJECT:project,HONRO_BALANCE:balance,HONRO_CONTENT:content,HonroAct2Plan:plan},fn,{forceStageIds:level===23?[8]:level===12?[8,12]:level===30?[8,12,30]:[8,12,30,18,19]});
}
export const withHistoricalStage23=(g,fn)=>historical(g,fn,23);
export const withHistoricalStage12=(g,fn)=>historical(g,fn,12);
export const withHistoricalStage30=(g,fn)=>historical(g,fn,30);
export const withHistoricalStage18=(g,fn)=>historical(g,fn,18);
const rawHash=v=>createHash('sha256').update(v).digest('hex');
// Fixed bf8b108 tree evidence captured before any Stage8 production edit.
export const stage8BierAuthoringBefore=Object.freeze([
 {
  "path": "shared/assets/environment/act1-far-master.png",
  "sha256": "b83c0f0f60cbec1a94c0de36f66ad2b228265509dc493ab1a739f4418fc1d4bc"
 },
 {
  "path": "shared/assets/environment/act1-far.prompt.md",
  "sha256": "68ee1c50d470aa3ed3521ebb52816e210ffa7849c45a7ff4517623c789db74f3"
 },
 {
  "path": "shared/assets/environment/act1-far.svg",
  "sha256": "e61d8ba2f23bdb72a2b753e18d261719ac48add8fc19f1c176491a5b23d7fdb4"
 },
 {
  "path": "shared/assets/environment/act1-far.webp",
  "sha256": "07cd067d3c5c7b6b245c0c19172439b581c7075ffa7c7e1e3ea2607c02005b56"
 },
 {
  "path": "shared/assets/environment/act1-gorge.svg",
  "sha256": "38d2033f7a1bd874eb6e9a2324fc0c66cbed5150835b974792b42a8a2a49d787"
 },
 {
  "path": "shared/assets/environment/act1-scene-bridge-abutment.svg",
  "sha256": "2a835db793645397582ca082bca052428857b398e97efc5639bc1011b2a9cdd3"
 },
 {
  "path": "shared/assets/environment/act1-scene-ferry-house.svg",
  "sha256": "5d9087c85241863c2e96112a5ac467bfb5e329d481887eb8a9a1a04d55c704c0"
 },
 {
  "path": "shared/assets/environment/act1-scene-guardian-tree.svg",
  "sha256": "a6059d3cf315c43487143eb7d937f46c58b07cc32a4584df5a28ca9c5e91593a"
 },
 {
  "path": "shared/assets/environment/act1-scene-pine-grove.svg",
  "sha256": "a18f243328285700f2d8f837072a278e8fcb1c3396ad634b12c94e59ffd0640d"
 },
 {
  "path": "shared/assets/environment/act1-scene-refuge-courtyard.svg",
  "sha256": "90eb5accb876810680c7e6e7b090afa021f8392a149b85b9a540cb32588cc826"
 },
 {
  "path": "shared/assets/environment/act1-scene-refuge-gate.svg",
  "sha256": "d0a1c81c85cfe5f67c87d2b69402334f5948be4706dc3752fa10d0cf3ef90c8c"
 },
 {
  "path": "shared/assets/environment/act1-scene-ritual-grove.svg",
  "sha256": "d5cdf06c95dcf7525865324e31f98c355015deee131f7fe76ac6d99a0c5db3f5"
 },
 {
  "path": "shared/assets/environment/act1-scene-ritual-hall.svg",
  "sha256": "7f1489d509391e74f76b3e3f82848c69e3a5d8c44adbfa77c07f3be100c64356"
 },
 {
  "path": "shared/assets/environment/act1-scene-root-sanctuary.svg",
  "sha256": "086d706f0fb846dd0d0a59f8d1dc610e67c3fe85a804e0299305dd41b7293fee"
 },
 {
  "path": "shared/assets/environment/act1-scene-rooted-pine.svg",
  "sha256": "757d9fd82e2c75bdf85935c3d12526b0b87e2b5c5c12c57d723a39377ce7470e"
 },
 {
  "path": "shared/assets/environment/act1-scene-rooted-sacred.svg",
  "sha256": "1970bfb083b1bb02b3c0be238cae029d7398ff4c52154fd63bf78dd95e5b489c"
 },
 {
  "path": "shared/assets/environment/act1-scene-ruined-court.svg",
  "sha256": "f82162438d05dcbf25b45b6529d766cf2b7da7e666f5c9347185e454ebb2fbbd"
 },
 {
  "path": "shared/assets/environment/act1-scene-valley-granite.svg",
  "sha256": "474c1bd977749c9b6eaadf2d48654f3d9bb66324334b911f097ccd6f26b55072"
 },
 {
  "path": "shared/assets/environment/act2-cave-home-lean.svg",
  "sha256": "70b0f3c04247d99a25f2af446fadd7eb1cb0e33ac32088c2f4f0c82f9617fc12"
 },
 {
  "path": "shared/assets/environment/act2-cave-home.svg",
  "sha256": "b8ae36dcac64333d07c03272db15dbfd1a3cb114811c8d38b07e7b8bc1210c8e"
 },
 {
  "path": "shared/assets/environment/act2-clouded-granite.svg",
  "sha256": "86ae2f37d1af7644c36eea4235c9d765f86e7fca5526a74c9e086e405a3dc8c1"
 },
 {
  "path": "shared/assets/environment/act2-dawn.svg",
  "sha256": "a0f4c8bf917cf471d0bb9dffdf05189ce8f5e4acd96c9d8a4961e0f4ebf90297"
 },
 {
  "path": "shared/assets/environment/act2-hoist-frame.svg",
  "sha256": "1eadc89dfd5acb78c5b5d1a8eee7e05f5fca7693417d6ed8233dc23592f854ac"
 },
 {
  "path": "shared/assets/environment/act2-pine.svg",
  "sha256": "9f7186b21ff5abe51dfb51bfb5918b6bec18ca89d4fcfa98288ac45fef12c96b"
 },
 {
  "path": "shared/assets/environment/act2-scene-court-wall.svg",
  "sha256": "c504f76b0ac2fbaf29915c2543ed35e794b4d482cd293b3f1f7b10a9475bf96d"
 },
 {
  "path": "shared/assets/environment/act2-scene-longhouse.svg",
  "sha256": "40d9aceaf6679c784169399c5148ef22faea182a9495257ef8addab467c05bb4"
 },
 {
  "path": "shared/assets/environment/act2-scene-market-awning.svg",
  "sha256": "435fc881525aa4760916666818739f22acbbc8ce991ea13846a8cdf853b97c3a"
 },
 {
  "path": "shared/assets/environment/act2-scene-market-walkway.svg",
  "sha256": "47e978ef79653cf64cd1553e56b4fad3061251ba5c9cb907711b6b1c83773aa9"
 },
 {
  "path": "shared/assets/environment/act2-scene-stone-threshold.svg",
  "sha256": "3294d862f1efa312cca2eb21fc700e08f37d735126ee6fc92a9c25d1fc1143e5"
 },
 {
  "path": "shared/assets/environment/act2-scene-temple-corridor.svg",
  "sha256": "9c15f01ea64c30fc26d545796829e4202316e5ec9efa73eabee866ddb9a98772"
 },
 {
  "path": "shared/assets/environment/act2-scene-upper-stair.svg",
  "sha256": "473cf1411fc3df51448d94e72542279f0a98e81c77e677e39147258c0fdf6681"
 },
 {
  "path": "shared/assets/environment/act2-scene-work-shelter.svg",
  "sha256": "2a4089502e1e8171ab90180d045446ec6a50bc7e2f003c8a8be0179221358551"
 },
 {
  "path": "shared/assets/environment/act2-sluice.svg",
  "sha256": "e750e222790dee68fcc91cb2884e1c020fbe977874cee9e956660e45ddfca46f"
 },
 {
  "path": "shared/assets/environment/act2-stone-lamp.svg",
  "sha256": "8c206a9380246c48737961e16d6a8b0490ab0b12e5b804813907c294c6f583a3"
 },
 {
  "path": "shared/assets/environment/act2-temple-hall.svg",
  "sha256": "c31553e48897d5da91a210061f635851df1e06baca0cb27c659649b5ea3ba130"
 },
 {
  "path": "shared/assets/environment/act2-wedged-bell.svg",
  "sha256": "3525141353182b1542f2845b8d3648eb2aee114102c5b350adfeeff45ba5e74a"
 },
 {
  "path": "shared/assets/environment/act3-architecture/archive-cutaway-frame.svg",
  "sha256": "c42323155644148f8341db78c080f714106b89e210603dc8a555c2280dd9fce7"
 },
 {
  "path": "shared/assets/environment/act3-architecture/eupseong-gate.svg",
  "sha256": "faf650485463aeb0acd0deed490fdacb2700610563b9438711deaeda9e5b1abd"
 },
 {
  "path": "shared/assets/environment/act3-architecture/ferry-loading-pavilion.svg",
  "sha256": "84f755103450b3a2e5e85b9dff1e4b0ff4a8add589b850a6d7811ae5c90c59cf"
 },
 {
  "path": "shared/assets/environment/act3-architecture/granary-loading-wall.svg",
  "sha256": "7eb94170054f41f67b8b10a37233136351ca9018ba65ec03bf54bc2451833812"
 },
 {
  "path": "shared/assets/environment/act3-architecture/mansion-open-gallery.svg",
  "sha256": "152713dd7f6e4b722990848038a0877b4b1557f05f7463948bd616648e2ae5c9"
 },
 {
  "path": "shared/assets/environment/act3-architecture/office-wall-entry.svg",
  "sha256": "9739f52bce0f69223cc43054205c37aa19fb3e47fb9fa97876a859774b75cb03"
 },
 {
  "path": "shared/assets/environment/act3-architecture/open-two-storey-gallery.svg",
  "sha256": "6817d37dba2569adffcd3f27cb5ce7ed3d43448c7baa9ae9861e1cb3c6014f47"
 },
 {
  "path": "shared/assets/environment/act3-architecture/production-manifest.json",
  "sha256": "159a5364aaa8b4fc0ac048081f84472ef4120a71bc86cef6327f9398147f457e"
 },
 {
  "path": "shared/assets/environment/act3-architecture/ruined-foundry.svg",
  "sha256": "40a7920da51c1306714c4e987b1be9658eea6c25b213751841e0e4705025bd23"
 },
 {
  "path": "shared/assets/environment/act3-architecture/sluice-pavilion.svg",
  "sha256": "d21fee86c1d068dd09401db8c9b610279a3e53952ddb0e34b7e34534aa3cf1a5"
 },
 {
  "path": "shared/assets/environment/act3-architecture/three-arch-stone-bridge.svg",
  "sha256": "f01f1fa40034f8db2d74227d879c7c5488a67a662210b476b537e7e428bd083e"
 },
 {
  "path": "shared/assets/environment/act3-far.svg",
  "sha256": "9814017ddf0062287b1c0146f7978657b83b9fa3d031d4fd5852eb4b7fb45315"
 },
 {
  "path": "shared/assets/environment/stage11-ravine-far-readable.svg",
  "sha256": "6086c44708d98554eb15fe5051bc67d8788aac8dd2ea98009297d49676af5f19"
 },
 {
  "path": "shared/assets/environment/stage11-ravine-far.svg",
  "sha256": "d98826e1df41f3feadabb9113cf13b7638c07047d3aab666154a96b7469aefb6"
 },
 {
  "path": "shared/assets/environment/stage12-quarry-far.svg",
  "sha256": "807576694f184ca2c9ff841189717caa985085251279fe8331573e03e35d3466"
 },
 {
  "path": "shared/assets/environment/stage18-bell-rear-cavern.svg",
  "sha256": "5cfc8026cbea80b439ecbeb784e1b7e6a3dac0fcc737349bdec7667770c8b917"
 },
 {
  "path": "shared/assets/environment/stage18-hollow-bell.svg",
  "sha256": "aaa81c1f24595ce492917a2262fd006973374b024893440dede9c1c312c22122"
 },
 {
  "path": "shared/assets/environment/stage23-yard-far.svg",
  "sha256": "d41dc0bdda9eb84261832a799506a7ce2df62b3f9b6f04465e27c5cef15cd6d7"
 },
 {
  "path": "shared/assets/environment/stage30-ferry-far.svg",
  "sha256": "425a160d93acfe96363d3aa370831880eb166770a3cb65caeb4fab7f8eefd16e"
 },
 {
  "path": "shared/assets/environment/title-first-ferry.svg",
  "sha256": "687bde9257f2593b6a68298211745444ced0b7a39c6a6757e52288d0402ea468"
 },
 {
  "path": "shared/assets/environment/title-wordmark.svg",
  "sha256": "43afcab31dea6bb8de3d38634ee105d0e94b104cdd75e799e8635a6f81d3d86c"
 },
 {
  "path": "tools/environment/act1-backdrop-geometry.mjs",
  "sha256": "97270ecf9106576161ad5a74060f2f4c5962c69e1fec3d102492df4c25ec2d1b"
 },
 {
  "path": "tools/environment/act1-scene-composition.mjs",
  "sha256": "0a5316767316b456ca7fcb01b1650e4f8dd55ce1fc769ba603cfa5be64ae31fb"
 },
 {
  "path": "tools/environment/act2-scene-composition.mjs",
  "sha256": "875da97fa548319e7716619a5ed4d9940cad4bb3d2b54f65682325ef1c429ec5"
 },
 {
  "path": "tools/environment/act3-pine-art.mjs",
  "sha256": "33bb08311efea247898576bc25115867bd5ccf7709cb17e8b9aefad1bd9e6567"
 },
 {
  "path": "tools/environment/atlas-proof.mjs",
  "sha256": "959342dbc6729f287dd15f95911ba8fa8a2fcf5dff6fabf7820100e3f3d6a99a"
 },
 {
  "path": "tools/environment/build-act1-art.mjs",
  "sha256": "382be7b0ec8785baefe6a9ff61acf76c9e0f2df25a53f6ae94d3dc07fa114711"
 },
 {
  "path": "tools/environment/build-act2-art.mjs",
  "sha256": "d4fb36ee3c0f804eb5daf4d2ce24ccb61922db068c0c3f36e6a9a9f50366bd10"
 },
 {
  "path": "tools/environment/capture-act1-collision.mjs",
  "sha256": "ddb80be6e05261cc91b9afb28b8197e1176aac367f27efec39f94840316f2066"
 },
 {
  "path": "tools/environment/capture-act1.mjs",
  "sha256": "95b40283f9828e287fba72adb3307a91fa83eedef287cdf7d905d92fa4cc0505"
 },
 {
  "path": "tools/environment/capture-act2-guidance.mjs",
  "sha256": "244c85afa11054a1135fe3bf8302ec2dc3d851d4111d73df9984032b299078ec"
 },
 {
  "path": "tools/environment/capture-act2.mjs",
  "sha256": "e5e636ced34d39cf8bdc2b2524c03b72f4c455927777405fee1363eb77b4bd5d"
 },
 {
  "path": "tools/environment/capture-act3-drafts.mjs",
  "sha256": "9b0ccebfecb715b04dcbe2870772f799cc72a998d45a0f58a91db3ca2e899eac"
 },
 {
  "path": "tools/environment/capture-act3-production.mjs",
  "sha256": "a70660a3c44e4244fff68a41c78c6d05f56b1e939dba7f155f9d3bc74b532cc1"
 },
 {
  "path": "tools/environment/capture-granite-alignment.mjs",
  "sha256": "d9e74151ea77921b8e105585f99945ea5cf0f499f827984575d73bc9ebcee720"
 },
 {
  "path": "tools/environment/capture-guardian-tree.mjs",
  "sha256": "a329fb2b77eb992e79b9e870c3974d9a69e79e5d4fdff25d426ebf43292d0284"
 },
 {
  "path": "tools/environment/capture-hidden-waterworks.mjs",
  "sha256": "91c9068f950669183a8e2c4cbb5aead3bbf63c5f95f8aaa38478ad2b9217a98f"
 },
 {
  "path": "tools/environment/capture-rest-journey.mjs",
  "sha256": "c36789af9a55cd236be3c3358c6c9b3c185e86732f049ab1c91e42164d9f144f"
 },
 {
  "path": "tools/environment/capture-stage11-encounters.mjs",
  "sha256": "4f4dc66122438e1981d483638dde69b239146035c21c02ac769ba3b985695f58"
 },
 {
  "path": "tools/environment/capture-stage16-temple.mjs",
  "sha256": "b069dd56d0894bc3cf08c1185ae15244a33e73424cc392b7b5b418edbf5a7a2b"
 },
 {
  "path": "tools/environment/capture-stage17-worksite.mjs",
  "sha256": "4642afc506927555ce5691830d4f73cae4139cce28bc42b80b50a66e6840aa41"
 },
 {
  "path": "tools/environment/capture-stage18-bell.mjs",
  "sha256": "9920edc2fff90722bfeb21ff8e2b2a50fe4efe038624b5cfe55c205216e4b76b"
 },
 {
  "path": "tools/environment/capture-terrain-domain.mjs",
  "sha256": "55d94276ee5ecd84a3a216d2445f81c7fd46822abbcef4ed695990e5ec608731"
 },
 {
  "path": "tools/environment/capture-terrain-readability.mjs",
  "sha256": "69107d29e542bc8571d86cc590f47b9940e36390f3b4e7bbca767661717f9b6d"
 },
 {
  "path": "tools/environment/granite-visuals.mjs",
  "sha256": "d36e5ad3d0ebb9863f80b80ff0f29e72d8e461b5102a98172a90cb156afafc82"
 },
 {
  "path": "tools/environment/inventory.mjs",
  "sha256": "65e26a852aa2fc2100f65f0c9fa033a844ff96bf67e1201aec01cf4f74daa19b"
 },
 {
  "path": "tools/environment/korean-late-town-art.mjs",
  "sha256": "2bd11422f4fd36aa9fec77e1736b92d134f800bcfef6ba37e8a7fe50143144ac"
 },
 {
  "path": "tools/environment/korean-town-art.mjs",
  "sha256": "ce45f1a0be9fbfef5c87f3e19630c3dd6e1def058e11bb0d87ccc9f121ed3917"
 },
 {
  "path": "tools/environment/polish-assets.mjs",
  "sha256": "01975878cfaeb8af5f5d93d40e52b0e809e71c8d2ba24a5d8a452dbb8ae6240a"
 },
 {
  "path": "tools/environment/preview-act3-dense-assets.mjs",
  "sha256": "41926a1974308fb535371ad888b89d50ebaffadcb038a680020a6e0def1a239b"
 },
 {
  "path": "tools/environment/preview-act3-town-assets.mjs",
  "sha256": "009999c458458c839774b679632a28cb5053f957db7bd1e5b4822f00cc5bdcfa"
 },
 {
  "path": "tools/environment/regenerate.mjs",
  "sha256": "fd93db8d3d63e2ee40ef05f6211404fc37c917f0f60394afd40557796ed3fd47"
 },
 {
  "path": "tools/environment/review.mjs",
  "sha256": "240d3349828bab00a9ab2a0aa0e59a03a7b8110d7ed835479aba9beb4b2ac7aa"
 },
 {
  "path": "tools/environment/stage11-ravine-art.mjs",
  "sha256": "f9185b27c6e8792fd68cb5ff468dbd1939c641d79f3d98c9bb761ee018483b46"
 },
 {
  "path": "tools/environment/stage12-quarry-art.mjs",
  "sha256": "61bfd1dd1ed2411af57a56e55f93caeefd4c1a84737409b23d5b1921541b57b1"
 },
 {
  "path": "tools/environment/stage16-temple-art.mjs",
  "sha256": "690cc19d3b4acbc6999a1f9e13f4e2412c56fe2cbcfd07735e64813a09624ad1"
 },
 {
  "path": "tools/environment/stage16-temple-buddha-art.mjs",
  "sha256": "c2abcd6dfdef28516c1c2cad7d614bc8de56e08d8430d7482f984603487cf7ed"
 },
 {
  "path": "tools/environment/stage17-worksite-art.mjs",
  "sha256": "adbf2b8d0e158e8345d76bdb547d168b9a2017b31cd3ccb908155476af4ae1aa"
 },
 {
  "path": "tools/environment/stage18-bell-art.mjs",
  "sha256": "7dc946311441deae0378a0a431c53ad83806b8ae78b0f48611368243d8277194"
 },
 {
  "path": "tools/environment/stage23-yard-art.mjs",
  "sha256": "16fa3858335ef0fa3123cce8fcc05f7a81a3eaa3cde86ded5b18787e88d962ae"
 },
 {
  "path": "tools/environment/stage30-ferry-art.mjs",
  "sha256": "6b0322e0230e2c1d233da608dbf14697580771d4e40be10d462575c18b3421cd"
 },
 {
  "path": "tools/environment/validate.mjs",
  "sha256": "0be82bb73b3b983b7a99a802664834f3cdf4391eda5395d53cf4622fce1e66ce"
 },
 {
  "path": "tools/map-forge/act1-collision-repair.mjs",
  "sha256": "9241496fd02f4f91ddf94742f1434a1096579b1dc5bf68306837252d73a0bf48"
 },
 {
  "path": "tools/map-forge/act3-dense-drafts.mjs",
  "sha256": "e7a1f62c4cac55360b1465e283c399123ef8f7d78e1d7d1f0288f32bedd9a8d5"
 },
 {
  "path": "tools/map-forge/act3-draft.json",
  "sha256": "fff490d41419020a598384dca3d0db8119f4c1b4122e47355b89302d7103d4d3"
 },
 {
  "path": "tools/map-forge/act3-encounters.mjs",
  "sha256": "aacdd3ad91d201de7eebf9da81e01f9333c8317ec41f471c665f6bff37bea79d"
 },
 {
  "path": "tools/map-forge/act3-foundation.mjs",
  "sha256": "3239141e67fdf937f847ca179dd8a19127ba16cafa8f3e23d4b78231fba5d689"
 },
 {
  "path": "tools/map-forge/act3-hidden-waterworks.mjs",
  "sha256": "ee2fa00e9b9b5d44acdf0be2e256b6b23b90091b556525e03f52b4d9f88a7f76"
 },
 {
  "path": "tools/map-forge/act3-location-detail.mjs",
  "sha256": "eef2f1257c2261d415ae4ffbb43ffcc274a84560401707278289fde0fa3cc995"
 },
 {
  "path": "tools/map-forge/act3-location-encounters.mjs",
  "sha256": "c10239a63549f80c6070c5110109e8dfa99e4c7c7e5abd3a7a1c56b42ce7ba57"
 },
 {
  "path": "tools/map-forge/act3-location-rebuild.mjs",
  "sha256": "c83d2166bfee2024fe9fbb4bf2d384ed8c831b444f1dcf7042888cd8cecc561f"
 },
 {
  "path": "tools/map-forge/act3-map-kit.mjs",
  "sha256": "98e66ad72d46a63d7f6209dd6a74d6b5dc2a90a7d90b27857d59912e17ada443"
 },
 {
  "path": "tools/map-forge/act3-production-maps.mjs",
  "sha256": "b65af3bbe15ba5b1cca59ec4d0eed0adf1a1907a593f8725e411da4499ebd7a4"
 },
 {
  "path": "tools/map-forge/act3-refinement.mjs",
  "sha256": "dd06dfd208c748de6c6ee41e4e9fc59086c3f5ac3974a4bbb12ea72e0e6af311"
 },
 {
  "path": "tools/map-forge/act3-reinforcements.mjs",
  "sha256": "3e7f0b8eec6a2ea37c6fb07fc48215853617923e1719cef8142524a7f22d99b6"
 },
 {
  "path": "tools/map-forge/act3-vertical-waterworks.mjs",
  "sha256": "6c01c385882d1785e3a6f510f3c85fba27a09494c8c28d914a92f07c19da762c"
 },
 {
  "path": "tools/map-forge/apply-act1-roster.mjs",
  "sha256": "719404e4a9b4c68cf36f708d292805e7678f85ef40a5bdad33ae52895ec467cd"
 },
 {
  "path": "tools/map-forge/apply-act1.mjs",
  "sha256": "26205696d6f5c2bd66b14cd4540cc050654c88a069c84279199d9e220be33aa1"
 },
 {
  "path": "tools/map-forge/apply-act2.mjs",
  "sha256": "4b36a4f4a512dceb675328f97db2717145123ceea72ac04fc7c169062d8ae205"
 },
 {
  "path": "tools/map-forge/apply-korean-town-review.mjs",
  "sha256": "bf60b57cc32c1f8fa1093824aeaa7d50b46ef7c583438c75577b95d98aae4dc3"
 },
 {
  "path": "tools/map-forge/apply-objective-revision.mjs",
  "sha256": "b97b2fc0ba34fb3cf948c20a2d5fc5515e6b17f7b49fa0050bbd808af9e0d3f1"
 },
 {
  "path": "tools/map-forge/apply-stage11-ravine.mjs",
  "sha256": "6133ec5ebf9ee45f72f67f982631fe90e32c1a02f70a3bb6f92ff3f9fe1682f7"
 },
 {
  "path": "tools/map-forge/apply-stage12-quarry.mjs",
  "sha256": "7366012cffcdec2bec3c27b599ba7c9e07dcc6a0559c08c3320b1ac71e884e99"
 },
 {
  "path": "tools/map-forge/apply-stage16-temple.mjs",
  "sha256": "1406bda60243b54a71f1bd3b63b2bcc3ec09785b5bea92576c873ad66a0f30b1"
 },
 {
  "path": "tools/map-forge/apply-stage17-worksite.mjs",
  "sha256": "ec158db47610a15f333fe39d58854b25a29b2b71bfdc3a9815a66e2362ec9f8a"
 },
 {
  "path": "tools/map-forge/apply-stage18-bell.mjs",
  "sha256": "eba121516eeb43fff816f9a1302220d980aac19747da217d5ad61a86a1456d79"
 },
 {
  "path": "tools/map-forge/apply-stage30-ferry.mjs",
  "sha256": "ef580d6ee12706b084b8bf90e57fe92c19eee62a1b455563fb6a98b9468e5a09"
 },
 {
  "path": "tools/map-forge/apply-stage36.mjs",
  "sha256": "c35f7b2fb0c58103b1d7b663144236b531140a7eda2096041eeb615784df8221"
 },
 {
  "path": "tools/map-forge/apply-terrain-domain.mjs",
  "sha256": "2f0ca8ab20fdb7cf0c2bd22d8cdf614d2c2063f539e8b0af7a227578370a29c3"
 },
 {
  "path": "tools/map-forge/capture-stage18-history.mjs",
  "sha256": "a2fe9f259854142d3bab3ae458a850fee10996ff022528260f6a797111194917"
 },
 {
  "path": "tools/map-forge/cavern-place-layers.mjs",
  "sha256": "21b13b44ca77eaa310279cadd03957f34c2d22aba44eb74d6b3d75c3eb80876a"
 },
 {
  "path": "tools/map-forge/cavern-transition-layers.mjs",
  "sha256": "2837cd1d6542ea3b98a248f54a57213f03876667ec605a03bf8f85702eeee8be"
 },
 {
  "path": "tools/map-forge/forest-approach-choices.mjs",
  "sha256": "06c4591c7051a50dd6d9e48c55af7a951e7abf1972d6be7b126f68cd591d938b"
 },
 {
  "path": "tools/map-forge/forest-cavern-topology.mjs",
  "sha256": "16d93b82fd573f8f7417721682be8eb7b18c4f2cb6841917b083aaa5bfcb848f"
 },
 {
  "path": "tools/map-forge/korean-late-town.mjs",
  "sha256": "b3192bcf92066f71d66b37bbe64a789aae9354fcf63624aade0809524b4d0aa1"
 },
 {
  "path": "tools/map-forge/open-structure-policy.mjs",
  "sha256": "8bdefe4d08761dc4a47dd4376c7b16611c034f51b4c93e6f61f6eb84c1bbecf5"
 },
 {
  "path": "tools/map-forge/polish.py",
  "sha256": "b0a25140bd1c595c8b44ae8b97aa9cb791eb7eab2e0d2f213e945b00381db5e9"
 },
 {
  "path": "tools/map-forge/record-stage23-escort-history.mjs",
  "sha256": "b9c585d4ce8d147941a8b945e9e3666e9c79b668fe4bb49fea00ac15cb1966e4"
 },
 {
  "path": "tools/map-forge/stage10-guardian-tree.mjs",
  "sha256": "105b9eda8a952f9668172fb92ce03ef1f37b8c0309748925ced6fb36eb521538"
 },
 {
  "path": "tools/map-forge/stage11-ravine-encounters.mjs",
  "sha256": "dddb3754632ecdd46e990ef6b6ead5a4f9b794dbe93e80eb7990d71267de9e2d"
 },
 {
  "path": "tools/map-forge/stage11-ravine.mjs",
  "sha256": "6e7932a60426b15f7d794c41cdc84f8f2453c7a59229ede7fdd7ff6024e235a7"
 },
 {
  "path": "tools/map-forge/stage12-quarry-geometry.mjs",
  "sha256": "6b7d67576e59229a35efb185212030e24dbd84d577b80cd00702f930eeece0b9"
 },
 {
  "path": "tools/map-forge/stage16-temple.mjs",
  "sha256": "e37a18a17164fbe566f0c9cdeab3646eb7c3f7b3c904f66d2961e14d651856db"
 },
 {
  "path": "tools/map-forge/stage17-worksite.mjs",
  "sha256": "d17112bcda912387f912399d9d69bf788b0f86f241e4701dd077ff60a3f4b334"
 },
 {
  "path": "tools/map-forge/stage18-bell.mjs",
  "sha256": "b3d7e118e4730ca2eefbf9fce80295490640a652462bebb40e439fdc68efb2bc"
 },
 {
  "path": "tools/map-forge/stage23-loading-yard.mjs",
  "sha256": "adaf2a087f1916be4a5276cc3e6eb22987662b226c41ee2159bd54c6b72f9da5"
 },
 {
  "path": "tools/map-forge/stage30-ferry-layout.json",
  "sha256": "748736834432eee5f99837a0aea07a7ea95c974894aebf027c1efcc391df57e1"
 },
 {
  "path": "tools/map-forge/stage30-ferry.mjs",
  "sha256": "7be6bb2a238352636c830127963737a163764bf683430a8913238d53994a0f31"
 },
 {
  "path": "tools/map-forge/village-cavern-layers.mjs",
  "sha256": "c8d08fc5c1cbbfba32f2ec126ec4e148bd06fc2ad473d8a4bbe117bfbfe8295c"
 }
]);
const applyAct1Before="import {applyOpenStructures} from './open-structure-policy.mjs';\n/** Reapply ACT1 scene composition without touching later acts or live saves. */\nimport {applyForestApproachChoices} from './forest-approach-choices.mjs';\nimport {applyForestCavernTopology} from './forest-cavern-topology.mjs';\nimport {readFile,writeFile} from 'node:fs/promises';\nimport {applyAct1SceneComposition} from '../environment/act1-scene-composition.mjs';\nconst file='shared/data/campaign.json',source=JSON.parse(await readFile(file,'utf8')),later=JSON.stringify(source.stages.slice(10));\nconst project=applyForestApproachChoices(applyForestCavernTopology(await applyAct1SceneComposition(source),{stages:[7]}));\napplyOpenStructures(project,{minStage:1,maxStage:10});\nif(JSON.stringify(project.stages.slice(10))!==later)throw Error('ACT1 authoring changed ACT2 stages');\nawait writeFile(file,JSON.stringify(project,null,2)+'\\n');\nconsole.log('Authored all 10 ACT1 outdoor scene compositions; ACT2 preserved.');\n";
export const stage8BierApplyAct1Expected=applyAct1Before
 .replace("import {applyOpenStructures} from './open-structure-policy.mjs';", "import {applyOpenStructures} from './open-structure-policy.mjs';\nimport {authorStage8Bier} from './stage8-bier.mjs';\nimport {runtime} from '../../game/tests/helpers.mjs';")
 .replace('const project=applyForestApproachChoices(', 'let project=applyForestApproachChoices(')
 .replace("await writeFile(file,JSON.stringify(project,null,2)+'\\n');", "project=await authorStage8Bier(project,await runtime({legacyMaps:false}),{art:true});\nawait writeFile(file,JSON.stringify(project,null,2)+'\\n');");
function files(dir){return readdirSync(new URL(dir,repoRoot),{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(dir+'/'+d.name):[dir+'/'+d.name]);}
export function stage8BierAuthoringSources(){const paths=['tools/map-forge','tools/environment','shared/assets/environment'].flatMap(files).filter(p=>p!=='tools/map-forge/record-stage8-bier-history.mjs');return Object.fromEntries(paths.sort().map(p=>[p,readFileSync(new URL(p,repoRoot))]));}
export function assertStage8BierAuthoringScope(sources){sources=beforeEncounterDensityAuthoringSources(sources);assert.deepEqual(Object.keys(sources).sort(),[...stage8BierAuthoringBefore.map(r=>r.path),...scope.allowedAddedAuthoring].sort(),'Complete original authoring source membership and explicit Stage8 additions');for(const row of stage8BierAuthoringBefore){if(row.path==='tools/map-forge/apply-act1.mjs'){assert.notEqual(stage8BierApplyAct1Expected,applyAct1Before);assert.equal(String(sources[row.path]),stage8BierApplyAct1Expected,'Only the exact canonical Stage8 authoring call');}else if(row.path==='tools/environment/act1-scene-composition.mjs'){const value=String(sources[row.path]),guard='  if(n===8&&st.initialState?.honroStage8BierRevision===1)continue;\n';assert.equal(value.split(guard).length-1,1,'Exactly one approved new8 scene guard');assert(value.includes('for(const st of project.stages){const n=st.metadata?.stageId;if(n<1||n>10)continue;\n'+guard),'Guard remains directly after existing Act1 range check');assert.equal(rawHash(value.replace(guard,'')),row.sha256,'Exact original ACT1 author after removing its one explicit opt-in guard');}else assert.equal(rawHash(sources[row.path]),row.sha256,'Unchanged original authoring source '+row.path);}for(const path of scope.allowedAddedAuthoring)assert(sources[path].length>100,'Complete new authoring source '+path);return sources;}
