/** Read-only configured/entry-instantiated asset cost; not visual or FPS approval. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {appHarness,plain} from '../../tests/app-regression-helpers.mjs';
const [file,out,nText]=process.argv.slice(2),n=Number(nText),p=JSON.parse(await readFile(file,'utf8')),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),bytes=x=>Buffer.byteLength(JSON.stringify(x));
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g;g.HONRO_PROJECT=plain(p);g.HONRO_APP_READY=Promise.resolve();g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
for(const k of ['landmark','background','render','minimap'])g.HonroScene.prototype[k]=function(){};g.HonroScene.prototype.size=()=>({w:1440,h:900,d:1});g.HonroScene.prototype.storyRelease=function(c){Object.assign(this,c);};
const profile=h.profileThrough(n-1);profile.lastStage=n;const app=h.load(profile);g.HonroApp=app;
for(const name of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-campaign'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);
app.launch(n);app.close();assert.equal(app.engine.b.honroStage,n);
const ids=new Set(),instantiated=new Map();function refs(x){if(!x||typeof x!=='object')return;for(const[k,v]of Object.entries(x)){if((k==='assetId'||k.endsWith('AssetId'))&&typeof v==='string')ids.add(v);else if(k==='asset'&&v?.id){ids.add(v.id);instantiated.set(v.id,v);}else if(v&&typeof v==='object')refs(v);}}
refs(p.stages.find(s=>s.metadata.stageId===n));refs(app.engine.b.honroElements);refs(app.engine.b.honroLandmarks);refs(app.engine.b.honroEnvironment);refs(app.engine.b.honroAct4PreviewDynamic);
const validator=vm.createContext({});vm.runInContext(await readFile('shared/map/vector-art.js','utf8'),validator);
const assets=[...ids].map(id=>p.library.find(a=>a.id===id)||instantiated.get(id));assert(assets.every(Boolean),'Unresolved asset');const vectorRows=[];
for(const a of assets.filter(a=>a.vector)){const v=a.vector;assert.deepEqual(Array.from(validator.HonroVectorArt.validate(v)),[],'Vector safety '+a.id);let expandedNodes=0,maxDepth=0,maxPathChars=0,paths=0;const walk=(q,d)=>{expandedNodes++;maxDepth=Math.max(maxDepth,d);if(q.tag==='use')walk(v.symbols[q.symbol],d+1);else if(q.tag==='g')q.children.forEach(c=>walk(c,d+1));else if(q.tag==='path'){paths++;maxPathChars=Math.max(maxPathChars,q.d.length);}};walk(v.root,0);const maxClipPathChars=Math.max(0,...Object.values(v.clips||{}).flat().map(d=>d.length));vectorRows.push({id:a.id,bytes:bytes(a),expandedNodes,maxDepth,maxPathChars,maxClipPathChars,expandedPaths:paths});}
const groups=new Map();for(const a of assets){const c={...a};delete c.id;delete c.name;const key=hash(c),r=groups.get(key)||{ids:[],bytes:bytes(c)};r.ids.push(a.id);groups.set(key,r);}
const duplicates=[...groups.values()].filter(r=>r.ids.length>1);
const report={stage:n,projectSha256:hash(p),scope:'Unique asset definitions referenced by stage/config plus instantiated actual App entry art holders. Future unconfigured runtime selectors/legacy saves may add assets; not a pruning authorization. Serialized JSON and expanded vector tree only, not GPU, FPS or visual approval.',referencedAssetJSONBytes:assets.reduce((s,a)=>s+bytes(a),0),referencedAssets:assets.length,vectorAssets:vectorRows.length,maxExpandedNodes:Math.max(0,...vectorRows.map(r=>r.expandedNodes)),maxDepth:Math.max(0,...vectorRows.map(r=>r.maxDepth)),maxPathChars:Math.max(0,...vectorRows.map(r=>r.maxPathChars)),maxClipPathChars:Math.max(0,...vectorRows.map(r=>r.maxClipPathChars)),exactDefinitionDuplicatesExceptIdName:duplicates,assets:vectorRows};
await mkdir(out.substring(0,out.lastIndexOf('/')),{recursive:true});await writeFile(out,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,assets:undefined}));
