/** Render-call contract for the authored two-sided fire markers; no battle state mutation. */
import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';import {applyAct3Locations} from '../tools/map-forge/act3-location-rebuild.mjs';
const g=await runtime({legacyMaps:false}),p=g.HONRO_PROJECT,s=p.stages[27],b=g.HonroMaps.createBattle(s,p,undefined,{origin:'campaign'});
g.HonroScene=function(){};g.HonroScene.prototype={};vm.runInContext(await readFile(process.env.HONRO_FIRE_ART_SOURCE||'shared/runtime/act3-art.js','utf8'),g);
assert.equal(g.HonroAct3Art.fireSite(b,'fire-screen'),'fire-west');assert.equal(g.HonroAct3Art.fireSite(b,'water-release'),'fire-east');
function flames(done,source=b){const battle=JSON.parse(JSON.stringify(source));battle.honroState.act3??={};battle.honroState.act3.done=done;const hits=[],stack=[];let pose={x:0,y:0};const ctx=new Proxy({save(){stack.push({...pose});},restore(){pose=stack.pop();},translate(x,y){pose.x+=x;pose.y+=y;},createRadialGradient(){hits.push(pose.x);return{addColorStop(){}};}},{get(o,key){return key in o?o[key]:()=>{};},set(o,key,v){o[key]=v;return true;}});const before=JSON.stringify(battle);g.HonroAct3Art.draw(ctx,{scale:1,time:0,editorView:false,skillPreview:false},battle);assert.equal(JSON.stringify(battle),before);return hits.sort((a,b)=>a-b);}
assert.deepEqual(flames({}),[1860,5370]);assert.deepEqual(flames({'fire-screen':true}),[5370]);assert.deepEqual(flames({'water-release':true}),[1860]);assert.deepEqual(flames({'fire-screen':true,'water-release':true}),[]);
const underground=g.HonroMaps.createBattle(p.stages[26],p,undefined,{origin:'campaign'});assert.equal(g.HonroAct3Art.guide(underground).remaining,null);assert.deepEqual(flames({},underground),[]);
const legacy=JSON.parse(JSON.stringify(b));legacy.honroStage=27;legacy.honroAct3Steps=g.HONRO_SPLIT_V1.content.find(s=>s.id===27).steps;assert.deepEqual(flames({},legacy),[1860,5370]);
const old=JSON.parse(JSON.stringify(b));for(const m of old.honroMarkers)delete m.fireSite;assert.equal(g.HonroAct3Art.fireSite(old,'water-release'),'fire-west');assert.equal(g.HonroAct3Art.fireSite(old,'fire-screen'),'fire-east');
console.log('PASS split fire renderer: both on, A-only removes west, B-only removes east, both off, old-map fallback preserved');
