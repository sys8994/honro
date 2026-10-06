/** Reconstructed production App harness. DOM, Canvas, audio, storage/download
 * and frame scheduling are doubles. Gameplay, story, navigation and save logic
 * are production code. Fixture terminal states are never normal-play evidence. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime} from '../game/tests/helpers.mjs';
export const plain=x=>JSON.parse(JSON.stringify(x)),KEY='honro-first-act-profile-1';
export async function appHarness(){
 const g=await runtime({legacyMaps:false}),storage=new Map(),listeners=new Map(),nodes=new Map();let exported;
 function node(){const classes=new Set();return {innerHTML:'',dataset:{},children:[],hidden:false,isConnected:true,tagName:'BUTTON',style:{setProperty(){}},
 classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle(k,v){v??=!classes.has(k);v?classes.add(k):classes.delete(k);}},
 querySelector(){return node();},querySelectorAll(){return[];},remove(){},appendChild(){},insertAdjacentHTML(){},getClientRects(){return[{}];},setAttribute(){},matches(){return true;},focus(){g.document.activeElement=this;},click(){},getContext(){return {translate(){},scale(){},save(){},restore(){},clearRect(){}};},toDataURL(){return'';}};}
 g.document={body:node(),getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},querySelector:()=>node(),querySelectorAll:()=>[],createElement:()=>node(),createTreeWalker:()=>({nextNode:()=>false}),addEventListener(type,fn){const set=listeners.get(type)||[];set.push(fn);listeners.set(type,set);}};
 g.window={addEventListener(){}};g.NodeFilter={SHOW_TEXT:4};g.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};g.requestAnimationFrame=()=>0;g.setTimeout=()=>0;g.clearTimeout=()=>{};g.innerWidth=1440;
 g.Blob=Blob;g.URL={createObjectURL(blob){exported=blob;return 'blob:regression';},revokeObjectURL(){}};
 g.HonroAudio=class{configure(){}play(){}update(){}};g.HonroScene=class{event(){}focusUnit(){}human(){}};g.HonroUI={camp:()=>'<div id="armory"></div>',bottom:()=>'',portraits:()=>({})};g.HonroUnitInfo={tick(){}};g.HonroPortraits={draw(){}};
 g.HONRO_STORY_PORTRAITS=new Proxy({}, {get:()=>({src:'data:image/png;base64,',class:'archer'})});
 vm.runInContext(await readFile('game/vendor/ui/fa.js','utf8'),g);
 for(const file of ['journey-art','rest-journey','story','training'])vm.runInContext(await readFile(`shared/runtime/${file}.js`,'utf8'),g);
 const source=await readFile('shared/runtime/main.js','utf8'),hook='G.HonroApp = new App();';assert.equal(source.split(hook).length,2);
 vm.runInContext(source.replace(hook,'G.AppRegression={App,fresh};'),g);const {App,fresh}=g.AppRegression;
 for(const name of ['inputs','updateHUD','updateAudio','updateChargeDisplay','cancelInput','drawPortraits'])App.prototype[name]=function(){};
 App.prototype.notify=function(text){this.lastNotice=text;};
 const reload=()=>{listeners.clear();return new App();};
 const click=(action,extra={})=>{const el={dataset:{action,...extra},disabled:false};for(const fn of listeners.get('click')||[])fn({target:{closest:()=>el}});};
 const finish=app=>{for(let i=0;app.dialogue&&i<30;i++)g.HonroStory.finish(app);assert(!app.dialogue,'dialogue must reach a boundary');};
 const profileThrough=id=>{const p=plain(fresh());p.revision=13;for(let i=1;i<=id;i++)p.cleared[i]={visits:1,rounds:5};p.recruited=id>=10?['archer','mage','knight','occultist']:id>=5?['archer','mage','knight']:id>=2?['archer','mage']:['archer'];p.party=[...p.recruited];for(const cls of p.recruited)p.heroes[cls].xp=g.HONRO_CORE.xpAtLevel(16);return p;};
 return {g,C:g.HONRO_CORE,App,storage,nodes,listeners,reload,click,finish,profileThrough,load(p){storage.set(KEY,JSON.stringify(p));return reload();},async exported(){return JSON.parse(await exported.text());},async import(p){for(const fn of listeners.get('change')||[])await fn({target:{id:'file-import',files:[{text:async()=>JSON.stringify(p)}],dataset:{}}});}};
}
export async function report(name,checks,extra={}){const files=['shared/runtime/main.js','shared/runtime/rest-journey.js','shared/runtime/progression.js'],source={};for(const file of files)source[file]=createHash('sha256').update(await readFile(file)).digest('hex');await mkdir(`_local/reports/${name}`,{recursive:true});await writeFile(`_local/reports/${name}/summary.json`,JSON.stringify({reconstructed:true,status:'passed',completedAt:new Date().toISOString(),source,checks,limits:['DOM/storage/rendering are doubles.','Terminal battle states and XP are explicit fixtures, not normal campaign or browser proof.'],...extra},null,2)+'\n');}
