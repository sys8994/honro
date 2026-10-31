import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness} from './app-regression-helpers.mjs';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const legacy=await read('_local/act4-rc/candidates/stage33-legacy.json'),current=await read('_local/act4-rc/candidates/stage33.json');
const ids=['approved33:near-west','approved33:body'], signatures=['446435:980e0bba','2183752:7b7b6e'];
const old=ids.map(id=>legacy.library.find(a=>a.id===id));const now=ids.map(id=>current.library.find(a=>a.id===id));assert(old.every(Boolean)&&now.every(Boolean));
const aliases=old.map(a=>({...structuredClone(a),id:'act4compat33:v1:'+a.id}));
const h=await appHarness({productionStory:true}),g=h.g;g.HONRO_PROJECT={library:[...now,...aliases]};const api=g.HonroProfileStore;
const battle=()=>({mode:'campaign',honroAct4Official:1,honroStage:33,round:9,phase:'aim',units:[{id:'mage',x:753.374,y:2488.35,hp:1814}],terrain:[{id:'test-ground',x:0,y:10,w:20}],honroAct4PreviewState:{reader:{key:'test',cursor:1},events:{test:{presented:['first'],terminal:false}},completionProof:{marker:'keep'}},honroLandmarks:old.map(a=>({asset:structuredClone(a)})),honroElements:old.map(a=>({asset:structuredClone(a)}))});
let b=battle();assert.equal(api.needsLegacy33Art(b),true);assert.equal(api.verifyLegacy33Assets(aliases),true);let c=api.compactBattleArt(b);assert.equal(api.needsLegacy33Art(c),true);assert.deepEqual(c.honroLandmarks.map(x=>x.asset.signature),signatures);assert.equal(api.restoreBattleArt(c),true);assert.deepEqual(JSON.parse(JSON.stringify(c)),JSON.parse(JSON.stringify(b)));assert.deepEqual(JSON.parse(JSON.stringify(c.honroLandmarks.map(x=>x.asset))),old);
let modified=battle();modified.honroLandmarks[0].asset.vector.qaUserEdit='keep';c=api.compactBattleArt(modified);assert.equal(c.honroLandmarks[0].asset.vector.qaUserEdit,'keep');assert(!c.honroLandmarks[0].asset.honroStaticAssetRef);
c=api.compactBattleArt(battle());c.honroLandmarks[1].asset.signature='2183752:bad';let before=JSON.stringify(c);assert.equal(api.restoreBattleArt(c),false);assert.equal(JSON.stringify(c),before);
c=api.compactBattleArt(battle());c.honroCustom=true;assert.equal(api.needsLegacy33Art(c),false);before=JSON.stringify(c);assert.equal(api.restoreBattleArt(c),false);assert.equal(JSON.stringify(c),before);
c=api.compactBattleArt(battle());g.HONRO_PROJECT.library[2].vector.qaBad=true;assert.equal(api.verifyLegacy33Assets(aliases),false);before=JSON.stringify(c);assert.equal(api.restoreBattleArt(c),false);assert.equal(JSON.stringify(c),before);
console.log('PASS exact old art compact/restore; user modifications inline; wrong signatures, custom battles and altered archive fail atomically');

{const invalid=battle();for(const k of ['honroLandmarks','honroElements'])for(const row of invalid[k])row.asset={honroStaticAssetRef:1,id:row.asset.id,signature:'not-a-known-version'};assert.equal(api.needsLegacy33Art(invalid),false);assert.equal(api.restoreBattleArt(invalid),false);}
