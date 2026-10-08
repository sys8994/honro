/** Author command and Workshop data-path checks, not browser UI evidence. */
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {runtime} from '../game/tests/helpers.mjs';
const source=JSON.parse(readFileSync('shared/data/campaign.json','utf8')),dir=mkdtempSync(join(tmpdir(),'honro-waterworks-author-'));
try{
 const target=join(dir,'campaign.json');
 execFileSync(process.execPath,['tools/map-forge/act3-hidden-waterworks.mjs','shared/data/campaign.json',target],{stdio:'pipe'});
 assert.deepEqual(JSON.parse(readFileSync(target,'utf8')),source,'Public author CLI regenerates the entire canonical project exactly');
}finally{rmSync(dir,{recursive:true,force:true});}
const g=await runtime({legacyMaps:false}),plain=x=>JSON.parse(JSON.stringify(x)),imported=g.HonroMaps.finalize(JSON.parse(g.HonroMaps.serialize(source)));
assert.deepEqual(plain(imported),source,'Workshop JSON export/import/finalize preserves all thirty maps and Library');
for(const id of [25,27]){const map=imported.stages[id-1],battle=g.HonroMaps.createBattle(map,imported,undefined,{origin:'workshop'});assert.equal(battle.honroWaterworksRevision,3);assert.deepEqual(plain(battle.honroMap.act3.crossings),source.stages[id-1].design.act3.crossings,'Workshop shared-runtime crossing geometry '+id);}
console.log('PASS C author CLI exact full-project regeneration and Workshop serialize/import/finalize/shared-battle path; browser UI separate');
