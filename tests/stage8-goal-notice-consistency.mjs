/** Small production objective/notice readers, DOM text doubles; no combat claims. */
import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',hidden:false,setAttribute(k,v){this[k]=v;}});return nodes.get(id);};
const g=vm.createContext({HONRO_CORE:{SKILLS:{}},HonroEncounters:{pending:()=>1,balance(){},populationCap:()=>37,attach(){}},HonroAllies:{execute(){}},HonroProgression:{initialize(){}},HonroMission:{tick(){}},HonroEncounterDensity:{active:()=>true},document:{getElementById:node}});
for(const name of ['content','objectives','objective-guidance','stage8-bier'])vm.runInContext(await readFile(`shared/runtime/${name}.js`,'utf8'),g);
const st=g.HONRO_CONTENT.stages[7],O=g.HonroObjectives,S=g.HonroStage8Bier;
const fixture=(fresh=true)=>{const b={honroStage:8,honroStage8BierRevision:1,...(fresh?{honroNarrativeRevision:1}:{}),round:3,phase:'aim',width:9000,active:'archer',honroMarkers:[],honroState:{flags:{},stage8Bier:{version:1,status:'anchored',warnings:{'stage8-first-seal':{status:'announced'}},entries:{},offered:{},blockers:[]}},terrain:[{id:'bier-knot-0',x:100,y:300,w:80,h:100,honroSeal:true,broken:true},{id:'bier-knot-1',x:900,y:300,w:80,h:100,honroSeal:true,hp:100,maxHp:100}],units:[{id:'archer',cls:'archer',side:0,hp:100,x:800,y:300},{id:'boss',side:1,hp:500,maxHp:500,x:1900,y:300,h:100}]};return{stage:st,engine:{b},scene:{},training:false,events:[],event(text){this.events.push(text);this.eventText=text;}};};
for(const kind of ['warning','blocked-entry','moving-bier','completed']){
 const app=fixture(),b=app.engine.b,m=S.memory(b);if(kind==='blocked-entry')m.warnings['stage8-first-seal'].status='blocked';
 if(kind==='moving-bier'){b.terrain[1].broken=true;m.status='moving';m.reason='상여가 이동 중이다.';}
 if(kind==='completed'){b.terrain[1].broken=true;b.units[1].hp=0;b.units[1].dead=true;}
 const before=JSON.stringify(b),view=O.state(b,st),help=O.help(app);O.refresh(app);
 assert.equal(node('objective-text').textContent,view.currentInstruction,kind+' header uses common current goal');
 assert.equal(help.summary,view.currentInstruction,kind+' help summary agrees');assert.equal(help.guide,view.currentInstruction,kind+' help current guide agrees');
 if(kind==='warning'||kind==='blocked-entry')assert.match(view.currentInstruction,/상여 결박 2.*공격/);
 assert(!view.currentInstruction.includes('안전 확인'));assert.equal(JSON.stringify(b),before,'objective read/refresh leaves encounter state exact');
 const notice=S.publishNotice(app);assert(notice.includes('안전 확인'));assert.equal(app.events.at(-1),notice,'separate event warning retained');assert.equal(node('objective-text').textContent,view.currentInstruction,'event publishing never replaces current goal');
}
const legacy=fixture(false);O.refresh(legacy);assert.equal(node('objective-text').textContent,S.noticeText(legacy.engine.b),'old revision display retains existing behavior');
const custom=fixture();custom.engine.b.honroCustom=true;assert.equal(S.active(custom.engine.b),false);
console.log('PASS fresh stage8 header/help/current reader agree through seal2, blocked reinforcement, bier movement and completion; separate event warning and legacy behavior are preserved.');
