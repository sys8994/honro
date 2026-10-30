/** Native acceptance must consume the actual default canonical campaign source,
 * never a Workshop/imported map. Also verify repository transport manifest bytes.
 * This is not a browser/network-loader assertion. */
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export async function officialWorldIdentity(expected,loaded){
 const worldPath='shared/data/act4/world.json',manifestPath='shared/data/act4/world.parts/manifest.json',bytes=await readFile(worldPath),world=JSON.parse(bytes),manifestBytes=await readFile(manifestPath),manifest=JSON.parse(manifestBytes);
 assert(isDeepStrictEqual(expected,world),'Linked acceptance requires integrated canonical Act4 world, not isolated candidate override');
 assert.equal(manifest.sha256,sha(bytes),'Official transport manifest must identify current canonical world');assert.equal(manifest.bytes,bytes.length);
 const chunks=[];for(const part of manifest.parts){assert(/^part-\d+\.jsonpart$/.test(part.file));const value=await readFile('shared/data/act4/world.parts/'+part.file);assert.equal(value.length,part.bytes);assert.equal(sha(value),part.sha256);chunks.push(value);}assert(Buffer.concat(chunks).equals(bytes),'Manifest parts must reproduce exact canonical world');
 const stages=[],runtimeMetadataAdditions=[];for(const st of world.stages){const actual=loaded.stages.find(s=>s.id===st.id),comparison=JSON.parse(JSON.stringify(actual));
 // These three exact initialState flags are added by official narrative/story
 // loaders. Do not discard arbitrary fields or modify the actual loaded stage.
 for(const key of ['honroNarrativeRevision','honroStoryCanonRevision','honroNarrativeCatalogueRevision'])if(!Object.hasOwn(st.initialState||{},key)&&comparison.initialState?.[key]===1){runtimeMetadataAdditions.push({stage:st.id,path:'initialState.'+key,value:1});delete comparison.initialState[key];}
 assert(isDeepStrictEqual(comparison,st),'Default built campaign stage differs beyond documented narrative flags: '+st.id);stages.push({id:st.id,sourceSHA256:sha(JSON.stringify(st)),loadedSHA256:sha(JSON.stringify(actual))});}
 for(const asset of world.library){const actual=loaded.library.find(a=>a.id===asset.id);assert(actual&&isDeepStrictEqual(JSON.parse(JSON.stringify(actual)),asset),'Default built campaign asset shadowed/missing: '+asset.id);}
 return{worldPath,worldSHA256:sha(bytes),manifestPath,manifestSHA256:sha(manifestBytes),partCount:chunks.length,runtimeMetadataAdditions,defaultBuiltProjectSHA256:sha(JSON.stringify(loaded)),stages,assetCount:world.library.length,entryPath:'Actual App.launch/continue on default runtimeParts campaign, no HONRO_PROJECT substitution, launchMap, importedDraft, customMap or debug mode',limit:'Native default-build source/transport identity, not browser HTTP-loader or UI proof'};
}
