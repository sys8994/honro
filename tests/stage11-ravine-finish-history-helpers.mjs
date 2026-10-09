/** Last two art-only shoulders above the immutable first ravine snapshot.
 * This layer is exact, additive and independently frozen. */
import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
export const ravineFinishDelta=JSON.parse(readFileSync(new URL('./fixtures/stage11-ravine-art-finish-delta.json',import.meta.url),'utf8'));
const plain=v=>JSON.parse(JSON.stringify(v)),hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function beforeStage11RavineFinishLibrary(library,{required=false}={}){
 const out=plain(library),f=ravineFinishDelta,ids=new Set(f.assets.map(a=>a.id));if(!required&&!out.some(a=>ids.has(a.id)))return out;
 for(const asset of f.assets){const found=out.filter(a=>a.id===asset.id);assert.equal(found.length,1,'Exact final-ravine art asset presence '+asset.id);assert.deepEqual(found[0],asset,'Exact final-ravine art asset value '+asset.id);assert.deepEqual(asset.collision,[],'Final art stays noncolliding');}
 return out.filter(a=>!ids.has(a.id));
}
export function beforeStage11RavineFinish(project){
 const out=plain(project),f=ravineFinishDelta,maps=out.stages?.filter(s=>s.metadata?.stageId===11)||[];if(!maps.length)return out;assert.equal(maps.length,1,'Exact ravine delta needs one Stage11');const st=maps[0];
 if(!st.initialState?.honroRavineVersion)return out;
 if(hash(st)===f.beforeStageSha256){assert(!out.library?.some(a=>f.assets.some(v=>v.id===a.id)),'Prior ravine stage cannot retain final-art assets');return out;}
 assert.equal(hash(st),f.afterStageSha256,'Exact reviewed current Stage11 map: final art layer');
 assert.deepEqual(st.elements.map(e=>e.id),f.elementOrderAfter,'Exact final-art placement order');
 assert.deepEqual(st.design.ravineArt.artAssetIds,f.artOrderAfter,'Exact final-art asset-ID order');
 const ids=new Set(f.elements.map(e=>e.id));for(const expected of f.elements){const found=st.elements.filter(e=>e.id===expected.id);assert.equal(found.length,1);assert.deepEqual(found[0],expected,'Exact final-art placement');}
 st.elements=st.elements.filter(e=>!ids.has(e.id));st.design.ravineArt.artAssetIds=st.design.ravineArt.artAssetIds.filter(id=>!f.assets.some(a=>a.id===id));
 assert.deepEqual(st.elements.map(e=>e.id),f.elementOrderBefore);assert.deepEqual(st.design.ravineArt.artAssetIds,f.artOrderBefore);assert.equal(hash(st),f.beforeStageSha256,'Complete immutable first-ravine map recovered');
 if(out.library)out.library=beforeStage11RavineFinishLibrary(out.library,{required:true});return out;
}
