import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {runtimeParts} from '../../shared/build.mjs';
import {hash} from './state.mjs';
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(import.meta.url);
export async function loadRuntime({render=false}={}){
 let canvasModule=null,document=null,Image=null;
 if(render){
  canvasModule=require('@napi-rs/canvas');
  const NativeImage=canvasModule.Image;
  Image=class extends NativeImage {set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}};
  document={createElement(tag){if(tag!=='canvas')throw Error('Unexpected DOM request '+tag);return makeCanvas(canvasModule,300,150);}};
 }
 let seed=3910;const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
 const FixedDate=class extends Date{constructor(...a){super(...(a.length?a:[1791187200000]));}static now(){return 1791187200000;}};
 const g=vm.createContext({console,performance,structuredClone,Math:math,Date:FixedDate,document,Image,Path2D:canvasModule?.Path2D,DOMMatrix:canvasModule?.DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'honro-offline-preview'},setTimeout,clearTimeout});g.window=g;
 const parts=await runtimeParts({vector:render,render});for(const source of parts)vm.runInContext(source,g);
 return{g,canvasModule,bundleHash:hash(parts.join('\n'))};
}
export function makeCanvas(module,w,h){const c=module.createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
export const yAt=(points,x)=>{if(x<=points[0][0])return points[0][1];for(let i=1;i<points.length;i++)if(x<=points[i][0]){const a=points[i-1],b=points[i];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return points.at(-1)[1];};
const point=([x,y])=>({x,y});
function solid(id,ps,properties={}){return{id,name:id,type:'solid',points:ps.map(point),baseMaterial:'rock',breakable:false,oneWay:false,layer:'terrain',properties,detail:{spacing:18,roughness:0,seed:1,optimizeEpsilon:0}};}
export function validatePlan(plan){
 if(plan.schema!=='honro-space-plan'||plan.version!==1||plan.stageId!==18)throw Error('Unsupported space plan');
 if(!plan.id||!plan.topologyId||!plan.label||!Array.isArray(plan.floor)||!Array.isArray(plan.roof)||!Array.isArray(plan.mainRoute))throw Error('Incomplete space plan');
 for(const [name,ps] of [['floor',plan.floor],['roof',plan.roof],['mainRoute',plan.mainRoute]]){
  if(ps.length<2||ps.some(p=>p.length!==2||p.some(n=>!Number.isFinite(n))))throw Error('Invalid '+name+' points');
  for(let i=1;i<ps.length;i++)if(ps[i][0]<=ps[i-1][0])throw Error(name+' must progress left to right in this adapter');
 }
 const steps=['clear-wards','silence','hold-silence','upper-chain','lower-chain','leak','keeper','clear-bell'];
 if(steps.some(id=>!Number.isFinite(plan.sites?.[id]?.x)))throw Error('Missing authored objective site');
 if(!Array.isArray(plan.rooms)||!Array.isArray(plan.connections))throw Error('Explicit rooms and connections required');
 return plan;
}
/** This candidate-only adapter writes no campaign or HTML source. Existing story/roster are copied. */
export function compilePlan(g,input,plan){
 validatePlan(plan);const p=structuredClone(input),st=p.stages.find(s=>s.metadata.stageId===plan.stageId),base=structuredClone(st);
 const floor=plan.floor,road=plan.mainRoute,at=x=>yAt(road,x);const {width,height}=st;
 st.metadata={...st.metadata,campaign:false,intentPrototype:true,candidateId:plan.id};st.name='묵종 · '+plan.label+' · 구조 시안';
 st.design={...st.design,intentPipeline:{schemaVersion:1,planId:plan.id,topologyId:plan.topologyId,scope:'layout-prototype',artDirectionApproved:false,rooms:plan.rooms,connections:plan.connections}};
 st.terrains=[solid('act2-floor',[...floor,[width,height+240],[0,height+240]],{route:true,surfaceKind:'cave',honroCave:true}),solid('cave-roof',[[0,0],[width,0],...plan.roof.slice().reverse()],{honroCeiling:true,honroCave:true})];
 for(const extra of plan.solids||[])st.terrains.push(solid(extra.id,extra.points,{honroCave:true,route:extra.route!==false,...extra.properties}));
 st.routes=road.map(point);st.anchors={spawn:{x:300,y:at(300)},exit:{x:width-350,y:at(width-350)}};
 st.materials=[];st.elements=[];st.events=[];st.encounters=[];
 const site=id=>{const q=plan.sites[id];return{x:q.x,y:q.y??at(q.x)};};
 const markerSource=base.markers.filter(m=>!m.id.startsWith('light-'));
 st.markers=markerSource.map(m=>{
  let id=m.id.replace(/^marker-/,'').replace(/^wave-/,'');
  let pos=plan.sites[id]?site(id):m.id==='wave'?site('keeper'):m.id.startsWith('spirit-lamp')?{x:plan.lampX,y:at(plan.lampX)}:null;
  if(!pos)throw Error('Unmapped marker '+m.id);
  if(m.id.startsWith('wave-')){pos={x:Math.min(width-350,pos.x+650),y:at(Math.min(width-350,pos.x+650))};}
  if(m.id==='wave')pos={x:Math.min(width-350,pos.x+500),y:at(Math.min(width-350,pos.x+500))};
  if(m.id==='marker-upper-chain')pos.y-=372;
  return{...m,...pos};
 });
 const originalTarget=base.terrains.find(t=>t.id==='upper-chain'),target=site('upper-chain');
 st.terrains.push({...structuredClone(originalTarget),points:[[target.x-24,target.y-410],[target.x+24,target.y-410],[target.x+25,target.y-334],[target.x-25,target.y-334]].map(point)});
 st.units=base.units.map((u,i)=>{
  let x=u.team==='player'?300+i*75:u.id==='act2-keeper'?site('keeper').x:plan.enemyPositions?.[u.id];
  if(!Number.isFinite(x)){
   const n=Number(u.id.split('-').at(-1)),cohort=u.stageOverrides?.honroCohort;
   const limits=cohort==='west'?[1300,Math.max(1800,site('clear-wards').x+250)]:cohort==='middle'?[site('upper-chain').x-350,site('lower-chain').x+300]:[site('leak').x+200,Math.min(width-400,site('clear-bell').x)];
   x=limits[0]+(limits[1]-limits[0])*((n*7)%17)/17;
  }
  const flying=!!g.HonroWorld.archetypes[u.kind]?.flying;
  return{...u,x,y:at(x)+(flying?280:0)};
 });
 const elem=(assetId,id,x,y,scale=1)=>st.elements.push({id,assetId,x,y,scale,rotation:0,snap:false,layer:'back',depthLayer:'L1'});
 elem('act2:bell','prototype-bell',plan.bell.x,plan.bell.bottomY,plan.bell.scale||1.4);
 // Existing visual vocabulary is a temporary neutral comparison skin, never art approval.
 for(const [i,x] of (plan.oilLampXs||[]).entries()){elem('act2:lamp','prototype-lamp-'+i,x,at(x),.8);st.markers.push({id:'light-prototype-'+i,type:'act2-light',x,y:at(x),color:'#d6b686'});}
 elem('act2:lamp','prototype-spirit-lamp',plan.lampX,at(plan.lampX),1.4);
 for(const id of ['silence','lower-chain','leak']){const q=site(id);elem('act2:ritual','prototype-'+id,q.x,q.y,id==='silence'?1:.7);}
 st.initialState={...st.initialState,honroCaveForms:[],honroCaveEnvelope:{version:1,portals:[{side:'left',x:0,top:yAt(plan.roof,0),bottom:yAt(floor,0)},{side:'right',x:width,top:yAt(plan.roof,width),bottom:yAt(floor,width)}]}};
 st.environment=g.HonroEnvironment.makeEnvironment(st);st.environment.skyVisible=false;st.environment.hiddenLayers=['L2','L3','L4'];
 p.activeStageId=st.id;p.name='HONRO Stage 18 Candidate '+plan.id;
 return g.HonroMaps.finalize(p);
}
export async function writeJSON(file,data){await mkdir(path.dirname(file),{recursive:true});await writeFile(file,JSON.stringify(data,null,2)+'\n');return{path:file,kind:'json',sha256:hash(await readFile(file))};}
export function createBattle(g,project){const stage=project.stages.find(s=>s.metadata.stageId===18),b=g.HonroMaps.createBattle(stage,project),e=new g.HONRO_CORE.Engine(b,()=>{},true);return{stage,b,e};}
export async function renderPlan(runtime,project,plan,dir){
 const {g,canvasModule}=runtime;const captures=[{name:'overview',x:5200,y:3800,scale:.125,width:1440,height:1080,overview:true},{name:'bell',x:plan.bell.x,y:plan.bell.bottomY-650,scale:.5,width:1440,height:1080,overview:false},{name:'portrait',x:plan.sites.silence.x,y:yAt(plan.mainRoute,plan.sites.silence.x)-450,scale:.36,width:720,height:1100,overview:false}];
 const results=[];
 for(const view of captures){
  const {b,e}=createBattle(g,project),canvas=makeCanvas(canvasModule,view.width,view.height),scene=new g.HonroScene(canvas);
  Object.assign(scene,{x:view.x,y:view.y,scale:view.scale,manual:true,time:2,editorView:view.overview,skillPreview:view.overview});
  scene.render(e,0,'',.6,false,0);
  const file=path.join(dir,`${plan.id}-${view.name}.png`);await writeFile(file,canvas.toBuffer('image/png'));
  results.push({kind:'render',path:file,sha256:hash(await readFile(file)),view,source:'Actual shared HonroMaps compiler, Engine and HonroScene; native Canvas; no browser UI',limitations:['Unapproved layout prototype','Temporary existing art vocabulary; not an art-direction proposal','No browser HUD/input/performance validation','Overview is inspection zoom, not gameplay zoom']});
 }
 return results;
}

/** Art may change visual composition, not gameplay or another stage. */
export function validateArtProject(g,expected,styled,stageId=18){
 const old=expected.stages.find(s=>s.metadata.stageId===stageId),next=styled.stages?.find(s=>s.metadata.stageId===stageId);
 if(!next)throw Error('Art project is missing the approved stage');
 const gameplay=s=>{const q=structuredClone(s);for(const key of ['name','backdrop','elements','environment'])delete q[key];return q;};
 if(hash(gameplay(old))!==hash(gameplay(next)))throw Error('Art project changed approved gameplay fields, including dimensions, anchors or initial state; revise the layout decision');
 if(hash(expected.stages.filter(s=>s.metadata.stageId!==stageId))!==hash(styled.stages.filter(s=>s.metadata.stageId!==stageId)))throw Error('Art project changed another stage');
 const structure=p=>{const q=structuredClone(p);for(const key of ['stages','library','name'])delete q[key];return q;};
 if(hash(structure(expected))!==hash(structure(styled)))throw Error('Art project changed structural project settings');
 const assetContract=a=>{const q=structuredClone(a);delete q.visual;delete q.name;return q;};
 const otherStageAssets=new Set(expected.stages.filter(s=>s.metadata.stageId!==stageId).flatMap(s=>[...s.elements,...(s.environment?.placements||[])].map(e=>e.assetId)));
 for(const a of expected.library){const other=styled.library.find(x=>x.id===a.id);if(!other||hash(assetContract(a))!==hash(assetContract(other)))throw Error('Art project changed an existing asset gameplay/placement contract: '+a.id);if(otherStageAssets.has(a.id)&&hash(a)!==hash(other))throw Error('Art asset is shared by another stage; clone it to a stage-specific ID: '+a.id);}
 for(const a of styled.library.filter(a=>!expected.library.some(x=>x.id===a.id)))if((a.collision||[]).length||(a.sockets||[]).length||a.interactionType)throw Error('New art asset adds gameplay collision or interaction: '+a.id);
 const collisions=(st,p)=>{const q=g.HonroMaps.compile(st,p);return{terrain:q.terrain,materials:q.materials};};
 if(hash(collisions(old,expected))!==hash(collisions(next,styled)))throw Error('Art elements changed approved collision or materials');
 return g.HonroMaps.finalize(styled);
}
