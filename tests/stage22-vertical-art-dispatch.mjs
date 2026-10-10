/** Reconstructed after executor replacement: pure production dispatch contract,
 * not the unavailable original test bytes, Native capture, or browser proof. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile('shared/runtime/art-dark.js','utf8');
const start=source.indexOf('Scene.prototype.terrain=function(c,t){')+'Scene.prototype.terrain=function(c,t){'.length;
const end=source.indexOf('\n',source.indexOf('return G.HonroAct2SpatialArt.terrain(c,t,this.battle);',start));
assert(start>40&&end>start,'Read the actual shared production dispatch prefix');
const clone=v=>JSON.parse(JSON.stringify(v)),base={honroStage:22,honroVerticalStage22Revision:1,honroMap:{vertical22Art:{revision:1},space:{terrainPlanes:[{terrainId:'solid'}]}}};
const cases=[
 ['fresh',()=>{},false,true],['old22',b=>delete b.honroVerticalStage22Revision,false,false],['future22',b=>b.honroVerticalStage22Revision=2,false,false],['custom',b=>b.honroCustom=true,false,false],['no-art',b=>delete b.honroMap.vertical22Art,false,false],['future-art',b=>b.honroMap.vertical22Art.revision=2,false,false],['no-map',b=>delete b.honroMap,false,false],['no-space',b=>delete b.honroMap.space,false,false],['no-planes',b=>delete b.honroMap.space.terrainPlanes,false,false],['empty-planes',b=>b.honroMap.space.terrainPlanes=[],false,false],['unmatched-plane',b=>b.honroMap.space.terrainPlanes=[{terrainId:'other'}],false,false],
 ['stage21',b=>b.honroStage=21,false,false],['stage23',b=>b.honroStage=23,false,false],['stage30',b=>b.honroStage=30,false,false],['old14',b=>b.honroStage=14,false,false],['act2-existing',b=>b.honroStage=14,true,'surface'],['act2-custom-existing',b=>{b.honroStage=11;b.honroCustom=true;},true,'surface'],['no-painter',()=>{},false,false,false],['no-battle',()=>null,false,false],['not-terrain',()=>{},false,false,true,false]
];
const rows=[];
for(const kind of ['surface','gate'])for(const[name,mutate,act2,expected,painter=true,tag=true]of cases){let b=clone(base);const result=mutate(b);if(result===null)b=null;const t={id:'solid',...(tag?(kind==='surface'?{honroSpaceSurfaceId:'solid'}:{honroAct3Gate:true}):{})},c={},calls=[];
 const G={HonroAct2SpatialArt:painter?{active:()=>act2,terrain:(...args)=>{calls.push(args);return 'painted';}}:undefined},fn=vm.runInNewContext('(function(c,t){'+source.slice(start,end)+'\nreturn "legacy";})',{G}),before=JSON.stringify({b,t});
 const got=fn.call({battle:b},c,t),want=expected==='surface'?kind==='surface':expected;assert.equal(got,want?'painted':'legacy',kind+':'+name);assert.equal(calls.length,want?1:0);if(want){assert.equal(calls[0][0],c);assert.equal(calls[0][1],t);assert.equal(calls[0][2],b);}assert.equal(JSON.stringify({b,t}),before,'Presentation dispatch is pure');rows.push({kind,name,painted:want});}
await mkdir('_local/reports/vertical-stages',{recursive:true});await writeFile('_local/reports/vertical-stages/stage22-art-dispatch-restored.json',JSON.stringify({passed:true,cases:rows,scope:'Reconstructed 40-case pure production-prefix contract; old test SHA unavailable. No native render/normal play/browser claim.'},null,2)+'\n');console.log('PASS reconstructed Stage22 art dispatch: '+rows.length+' pure boundary cases');
