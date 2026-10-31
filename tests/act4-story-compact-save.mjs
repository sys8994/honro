import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const g={};
vm.runInNewContext(await readFile('shared/runtime/story.js','utf8'),g);
const active=b=>b?.official===true;
g.HonroAct4Campaign={active};
function exercise(flags={},official=true){
 const original={sentinel:true};
 const app={screen:'battle',engine:{b:{official,art:{path:'original'}}},profile:{honroBattle:original},dialogue:{index:1},...flags};
 const calls=[];
 app.persist=(...args)=>{calls.push({args,stored:app.profile.honroBattle});};
 g.HonroStory.save(app);
 return {app,calls,original};
}
const official=exercise();
assert.equal(official.calls.length,1);
assert.equal(official.calls[0].args[0].compactAct4Autosave,true);
assert.equal(official.calls[0].stored,official.original,'wrapper takes the snapshot');
for(const flags of [{done:true},{debugMode:true},{customMap:true}]){
 const x=exercise(flags);assert.equal(x.calls.length,1);assert.equal(x.calls[0].args.length,0);
 assert.notEqual(x.calls[0].stored,x.app.engine.b);assert.equal(x.calls[0].stored.art.path,'original');
}
const other=exercise({},false);assert.equal(other.calls[0].args.length,0);assert.notEqual(other.calls[0].stored,other.app.engine.b);
const training=exercise({training:true});assert.equal(training.calls.length,0);assert.equal(training.app.profile.honroBattle,training.original);
delete g.HonroAct4Campaign;
const unloaded=exercise();assert.equal(unloaded.calls[0].args.length,0);assert.notEqual(unloaded.calls[0].stored,unloaded.app.engine.b);
console.log('PASS official compact story snapshot and legacy/custom/training fallback');
