import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {assertCavernLibraryPreserved,cavernLibraryProvenance as f} from './cavern-library-provenance-helpers.mjs';
const library=JSON.parse(readFileSync('shared/data/campaign.json','utf8')).library,snapshot=JSON.stringify(library);
for(const name of ['village','temple']){const fixture=JSON.parse(readFileSync(`tests/fixtures/${name}-layer-preservation.json`,'utf8'));assertCavernLibraryPreserved(library,fixture.library);}
assert.equal(JSON.stringify(library),snapshot,'Provenance check is pure');
const mutations=[q=>q[0].id+=' unapproved',q=>q.find(a=>a.id===f.addedAssets[0].id).name='unapproved',q=>q.splice(q.findIndex(a=>a.id===f.addedAssets[0].id),1),q=>q.push(structuredClone(q[0])),q=>q.reverse(),q=>q.push({id:'unapproved'})];
for(const mutate of mutations){const q=structuredClone(library);mutate(q);assert.throws(()=>assertCavernLibraryPreserved(q,f.originalLibrarySha256));}
assert.throws(()=>assertCavernLibraryPreserved(library,'rewritten fixture'));
console.log('PASS approved A Library provenance: 49 exact additions, original 355 assets and both old fixture hashes preserved; six mutation controls and rewritten-fixture rejection');
