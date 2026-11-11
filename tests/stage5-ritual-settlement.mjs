import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const g={};
vm.runInNewContext(await readFile('shared/runtime/objectives.js','utf8'),g);
const O=g.HonroObjectives,stage={id:5,objective:'seals'};
function battle(start){return{round:8,side:0,phase:'aim',teamEnds:[8,7],honroState:{ritual:{active:true,holderId:'mage',enemyEndAtStart:start}},units:[{id:'mage',hp:500,x:110,y:230}],honroMarkers:[{id:'receiver-5',x:100,y:200}]};}
for(const [start,expected] of [[5,2],[6,1],[7,0],[undefined,0]]){
 const b=battle(start);O.updateSettlement(b,stage,false);O.updateSettlement(b,stage,true);
 assert.equal(O.settlement(b,stage).progress,expected);
}
const departed=battle(5);departed.units[0].x=900;
O.updateSettlement(departed,stage,true);assert.equal(O.settlement(departed,stage).progress,0);
const saved=battle(6);saved.honroState.ritual.creditAtBreak=O.waterfallHoldCredit(saved,stage);saved.honroState.ritual.active=false;
const resumed=JSON.parse(JSON.stringify(saved));O.updateSettlement(resumed,stage,true);
assert.equal(O.settlement(resumed,stage).progress,1);
resumed.teamEnds[1]++;assert.equal(O.settlement(resumed,stage).progress,2);
console.log('PASS Stage 5 ritual progress overlaps real enemy turns, survives Continue and preserves old saves');
