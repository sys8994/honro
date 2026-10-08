import {beforeVerticalWaterworksLibrary} from './vertical-waterworks-history-helpers.mjs';
import {beforeOpenStructureLibrary} from './open-structure-history-helpers.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const cavernLibraryProvenance=JSON.parse(readFileSync(new URL('./fixtures/cavern-library-provenance.json',import.meta.url),'utf8'));
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function assertCavernLibraryPreserved(library,originalHash){
 library=beforeVerticalWaterworksLibrary(beforeOpenStructureLibrary(library));
 const f=cavernLibraryProvenance;assert.equal(originalHash,f.originalLibrarySha256,'Original village/temple Library fixture is unchanged');
 assert.equal(hash(library),f.approvedLibrarySha256,'B Library exactly equals approved public A');
 const ids=new Set(f.addedAssets.map(a=>a.id));assert.equal(ids.size,f.addedAssets.length,'Unique immutable approved asset IDs');
 for(const row of f.addedAssets){const matches=library.filter(a=>a.id===row.id);assert.equal(matches.length,1,'Unique approved Library addition '+row.id);assert.equal(hash(matches[0]),row.sha256,'Exact approved Library asset '+row.id);}
 const original=f.originalAssetOrder.map(id=>{const matches=library.filter(a=>a.id===id);assert.equal(matches.length,1,'Unique original Library asset '+id);return matches[0];});assert.equal(hash(original),originalHash,'All original Library assets, order and values remain intact');
 return original;
}
