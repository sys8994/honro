/** Lightweight mock/AST contract only. No browser, build, live game or full simulation. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const source=await readFile('tools/stage23-qa/road-support-planner.js','utf8');
const normalized=[];
class Engine {
 constructor(b){
  assert.equal(b.rng,0x13579bdf);assert.deepEqual(JSON.parse(JSON.stringify(b.damageSequence)),{version:1,seed:0x2468ace0,index:0});
  normalized.push([b.rng,b.damageSequence.seed,b.damageSequence.index]);this.b=b;
 }
 get active(){return this.unit(this.b.active);}
 unit(id){return this.b.units.find(u=>u.id===id);}
 alive(side){return this.b.units.filter(u=>u.side===side&&!u.dead&&u.hp>0);}
 grounded(u){return !u.airborne&&!u.jumping;}
 canDrop(){return true;}
 jumpCost(){return 75;}
 skillAllowed(){return true;}
 cooldownLeft(){return 0;}
 manaCost(){return 1;}
 projectileOrigin(u){return {x:u.x+u.r+6,y:u.y-u.h*.6};}
 shotSeeds(){return [{angle:20,power:.6}];}
 chargeDuration(){return 1;}
 effective(s){return s;}
}
const unit=(id,side,x,y,extra={})=>({id,side,x,y,cls:'mage',hp:800,maxHp:800,r:22,h:100,moveLeft:1200,focus:100,loadout:[],...extra});
const base={rng:1,damageSequence:{version:1,seed:2,index:35},active:'p-mage',honroState:{act23v4:{carrierStarted:true,carrierGoals:{},escortWaypoints:{}}},honroReviewed23PacingCandidate:{id:'escort-close-130',version:1,roadContact:true,variant:'escort-road-130'},honroMarkers:[{id:'dock-exit',x:9000,y:4170}],goal:{id:'dock-mid',kind:'escort'},units:[
 unit('p-mage',0,3460,5100,{loadout:['M11','O08']}),unit('act3-carrier',2,3500,5100),
 unit('upper',1,3540,4950),unit('body',1,3590,5100),unit('irrelevant',1,4300,5100),unit('hidden',1,3470,5100,{hidden:true}),unit('rear',1,2900,5100),unit('dead',1,3510,5100,{dead:true})]};
const live={b:null};
const C={Engine,SKILLS:{M11:{id:'M11',damage:100,radius:20},O08:{id:'O08',damage:10,radius:20}},shotViable:(e,u,s,t)=>({ok:true,enemyDamage:s.damage,net:s.damage,risk:0,miss:0})};
const near=(u,p,r)=>!!p&&Math.abs(u.y-p.y)<=150&&Math.hypot(u.x-p.x,.75*(u.y-p.y))<=r;
const V={mem:b=>(b.honroState.act23v4.initialized=true,b.honroState.act23v4),current:b=>b.goal,near,marker:(b,id)=>b.honroMarkers.find(p=>p.id===id)};
const context=vm.createContext({HONRO_CORE:C,HonroAct23V4:V,HonroAct3:{visible:(b,u)=>!u.hidden},HonroAct23V4Chapter23Facts:{blocked:()=>false},HonroApp:{engine:live},crypto:webcrypto,TextEncoder});
const plan=vm.runInContext('('+source+')',context);
const clean=r=>JSON.parse(JSON.stringify({...r,liveBeforeSha256:undefined,liveAfterSha256:undefined}));
const results=[];
for(const [rng,seed,index]of [[1,2,35],[34992,77,1000],[0xffffffff,0,0]]){
 live.b=structuredClone(base);Object.assign(live.b,{rng,damageSequence:{version:1,seed,index}});const before=JSON.stringify(live.b);
 const out=await plan({hopTargetId:'upper'});assert.equal(JSON.stringify(live.b),before);assert.equal(out.liveBeforeSha256,out.liveAfterSha256);
 assert.equal(out.plan.skill,'M11');assert.equal(out.hop.kind,'near-upper-platform');assert(out.hop.requestedHorizontalTravel<=280);
 assert.deepEqual(Array.from(out.visibleFoes,t=>t.id).sort(),['body','upper']);results.push(clean(out));
}
assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2]);
assert.equal(normalized.length,3);
live.b=structuredClone(base);assert.equal((await plan({contextOnly:true,hopTargetId:'hidden'})).hop,null,'Hidden hop target must be rejected');
live.b=structuredClone(base);live.b.units[0].moveLeft=50;assert.equal((await plan({contextOnly:true,hopTargetId:'upper'})).hop,null,'Finite jump budget');
live.b=structuredClone(base);live.b.units.find(u=>u.id==='upper').y=4939;assert.equal((await plan({contextOnly:true,hopTargetId:'upper'})).hop,null,'Upper hop bound160');
live.b=structuredClone(base);live.b.units.find(u=>u.id==='body').honroSpirit=true;assert.equal((await plan({targetId:'body'})).plan.skill,'O08','Spirit preference is per selected target');
live.b=structuredClone(base);live.b.honroState.act23v4.carrierGoals['dock-exit']=true;live.b.units.push(unit('exit',1,8750,4170));assert((await plan({contextOnly:true})).visibleFoes.some(t=>t.id==='exit'),'Exit500 threat remains');
// Execute only extracted Python control functions with mock observations/input.
const py=spawnSync('python',['-c',String.raw`
import ast
from pathlib import Path
source=Path('tools/stage23-qa/road-support-browser.py').read_text();tree=ast.parse(source)
needed={'same_actor','terminal','landing_wait','normal_drop'}
namespace={};exec(compile(ast.Module(body=[x for x in tree.body if isinstance(x,ast.FunctionDef) and x.name in needed],type_ignores=[]),'road-support-controls','exec'),namespace)
class Page:
 def __init__(self):self.waits=[]
 def wait_for_timeout(self,ms):self.waits.append(ms)
 def locator(self,s):return self
 def is_enabled(self):return True
page=Page();rows=[];namespace.update(page=page,record=lambda op,**kw:rows.append(dict(op=op,**kw)) or rows[-1],click_battle=lambda q:True)
def state(y=4950,phase=None,ground=True,counter=0):
 return {'phase':'aim','round':8,'can':phase is None,'counter':counter,'dialogue':None,'active':{'id':'p-mage','y':y,'x':3500,'ground':ground,'jumping':False,'airborne':False,'platformDrop':{'phase':phase} if phase else None}}
first=state();sequence=iter([state(phase='prepare'),state(phase='prepare',counter=1),state(phase='prepare',counter=2),state(5000,'fall',False,40),state(5100,'land',True,70)])
namespace['state']=lambda:next(sequence)
assert namespace['normal_drop'](first,{'roadY':5100,'canDrop':True},True)
assert rows[-1]['landed'] and rows[-1]['afterLanding']['active']['y']==5100 and len(page.waits)==2
assert not namespace['normal_drop'](first,{'roadY':5100,'canDrop':True},False),'Combat threshold160 unchanged'
assert not namespace['same_actor']({'phase':'aim','round':8,'active':None},first)
# Check escort drop precedes horizontal-close termination and regular drop waits;
# this is syntax/order evidence, not real browser input success.
road=next(x for x in tree.body if isinstance(x,ast.FunctionDef) and x.name=='road_advance')
code=ast.unparse(road);assert code.index('normal_drop(')<code.index('abs(target_x')
assert 'full-browser-planner.js' not in source
for name in ['HONRO23_ENTRY_CHECKPOINT','HONRO23_ENTRY_SHA256','HONRO23_PRODUCT_COMMIT','HONRO23_HTML_SHA256','HONRO23_RUNTIME_SHA256','HONRO23_SOURCE_RUN','HONRO23_BROWSER_OUT']:assert name in source
assert 'HonroAct23V4.current(copy)' in source
print('Python AST and mock normal-drop/contact controls passed')
`],{encoding:'utf8'});
assert.equal(py.status,0,py.stderr||py.stdout);
console.log(py.stdout.trim());
console.log('Road-support planner mock contract passed: independent random inputs before construction, unchanged input, production visibility, per-target spirit, hop boundaries, exit safety targeting. Not real engine/browser validation.');
