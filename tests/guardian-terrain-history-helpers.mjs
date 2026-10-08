// Undo ONLY the four exact approved stage10 bough polygons in older contracts.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
export const guardianTerrainDelta=JSON.parse(readFileSync(new URL('./fixtures/stage10-guardian-branches.json',import.meta.url),'utf8'));
const plain=v=>JSON.parse(JSON.stringify(v));
export function beforeGuardianTerrain(terrain,stage,g){
 if(stage!==10)return plain(terrain);
 return plain(terrain).map(t=>{const row=guardianTerrainDelta.branches.find(r=>r.id===t.id);if(!row)return t;const before=g?plain(g.HonroGeometry.terrain(row.before)):row.before,after=g?plain(g.HonroGeometry.terrain(row.after)):row.after;
 // Historical source fixtures can already have the original polygon.
 if(JSON.stringify(t)===JSON.stringify(before))return t;
 assert.deepEqual(t,after,t.id+' only exact guardian bough geometry is approved');return plain(before);});
}
