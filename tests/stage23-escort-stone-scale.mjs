/** Render-only masonry cache, stage gates and whole saved-state purity. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtimeParts} from '../shared/build.mjs';
const native=createRequire(import.meta.url)('@napi-rs/canvas'),hash=v=>createHash('sha256').update(v).digest('hex');
const fixture=JSON.parse(await readFile('tests/fixtures/stage23-escort-approved-entry.json','utf8')),b=structuredClone(fixture.initial.battle),before=JSON.stringify(b);
class Image extends native.Image{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
const g=vm.createContext({console,performance,structuredClone,Path2D:native.Path2D,DOMMatrix:native.DOMMatrix,Image,document:{createElement:()=>native.createCanvas(64,64)},navigator:{userAgent:'honro-native-stone-contract'},matchMedia:()=>({matches:false}),devicePixelRatio:1,setTimeout,clearTimeout});g.window=g;
let previousLandmark;for(const part of await runtimeParts({vector:true,render:true})){if(part.includes('G.HonroStage23EscortArt='))previousLandmark=g.HonroScene.prototype.landmark;vm.runInContext(part,g);}
assert.equal(typeof previousLandmark,'function');const A=g.HonroStage23EscortArt,scene=Object.create(g.HonroScene.prototype);scene.battle=b;
const rear=b.honroLandmarks.find(l=>l.id==='sy-art-rear-plinths'),bridge=b.honroLandmarks.find(l=>l.id==='sy-art-stone-bridge'),faces=A.rearPaint(rear.asset);assert.equal(faces.length,16);assert.equal(A.rearPaint(rear.asset),faces,'Asset cache reused');assert.equal(A.rearPaint(bridge.asset).length,2,'Only two rear bridge abutments, not water gate');
const all=[...faces,...A.rearPaint(bridge.asset)].map(q=>q.detail);for(const t of b.terrain.filter(t=>/^sy-.*(bridge|pier|corner)/.test(t.id)))all.push(A.masonryDetail(t,g.HONRO_CORE.poly(t)));
for(const q of all){assert(q.rows.length>0&&q.rows.length<81);assert(q.rows.every(r=>r.height>0&&r.height<=76));assert(q.washes.length<=2);assert(q.bounds.w>0&&q.bounds.h>0);}
function paint(fn,stage=23){const cv=native.createCanvas(1600,1000),c=cv.getContext('2d');c.scale(.147,.147);c.translate(-400,-3000);scene.battle={...b,honroStage:stage};fn(c,rear);return {cv,bytes:cv.toBuffer('image/png')};}
for(const id of [8,12,18,30]){const a=paint((c,l)=>previousLandmark.call(scene,c,l),id),z=paint((c,l)=>scene.landmark(c,l),id);assert(a.bytes.equals(z.bytes),'Other chapter landmark fallback pixel-exact '+id);a.cv.width=z.cv.width=1;}
scene.battle=b;const a=paint((c,l)=>previousLandmark.call(scene,c,l)),z=paint((c,l)=>scene.landmark(c,l));assert(!a.bytes.equals(z.bytes),'23 material changes actual pixels');a.cv.width=z.cv.width=1;
// All drawing uses original instance transforms and runs before actors. Repeat
// cached passes to reject hidden mutation of the saved battle or asset vectors.
const cv=native.createCanvas(1600,1000),c=cv.getContext('2d');c.scale(.2,.2);c.translate(-400,-3000);for(let i=0;i<3;i++){scene.battle=b;scene.landmark(c,rear);scene.landmark(c,bridge);for(const t of b.terrain.filter(t=>/^sy-.*(bridge|pier|corner)/.test(t.id)))scene.terrain(c,t);}assert.equal(JSON.stringify(b),before,'Three cached render passes preserve whole production battle');cv.width=1;
await mkdir('_local/reports/stage23-stone-scale',{recursive:true});await writeFile('_local/reports/stage23-stone-scale/contract.json',JSON.stringify({passed:true,stageLocal:[8,12,18,30],rearFaces:faces.length,bridgeAbutments:2,detailFaces:all.length,maximumCourseHeight:76,wholeBattleExact:true,battleSha256:hash(before),scope:'Native renderer-only face detail and cache tests. No new combat/browser claim.'},null,2)+'\n');console.log('PASS Stage23 stone scale:18 rear faces,stage gates8/12/18/30,whole saved battle pure');
