import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const dir=process.argv[2];
if(!dir||process.env.HONRO_FULL_DETAIL_WORKSHOP_QA!=='1'||path.resolve(dir)===process.cwd())throw Error('Use exact disposable QA build');
const root=path.resolve(dir),m=JSON.parse(fs.readFileSync(path.join(root,'web/manifest.json'),'utf8'));
if(m.workshopEntry!=='web/entries/workshop.208159c350d98602.js')throw Error('Wrong verified Workshop build entry');
const file=path.join(root,'web/runtime/workshop-app.489f733634454986.js'),text=fs.readFileSync(file,'utf8');
const pin=process.env.HONRO_FULL_DISPOSABLE_SHA256;
if(!/^[a-f0-9]{64}$/.test(pin??'')||createHash('sha256').update(text).digest('hex')!==pin)throw Error('Wrong original disposable full host bytes');
const read=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8').replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'');
function once(s,a,b){if(s.split(a).length!==2)throw Error('Exact host binding drift: '+a);return s.replace(a,b)}
const box=(n,imports,f,out)=>'const '+n+'=(()=>{'+imports+read(f)+'\nreturn {'+out+'};})();\n';
const binding='const FD=(()=>{\n'+
 box('detail','','detail.mjs','compileDetailShapes,snapDetailPoint,detailRoles,fullDetailOwners')+
 box('pack','const {compileDetailShapes}=detail;','pack-detail.mjs','verifiedWholeBase,buildFullDetails,exportFullDetails,reopenFullDetails')+
 box('author','const {compileDetailShapes,snapDetailPoint,detailRoles,fullDetailOwners}=detail;','author-detail.mjs','mountDetails')+
 'return {pack,author};})();\n'+read('host-detail.js');
let next=once(text,'function mountFullHost(){',binding+'\nfunction mountFullHost(){');
next=once(next,"isActive:()=>currentTab==='stage'&&project.activeStageId==='stage-42-whole-native-blockout'","isActive:()=>status.full42DetailMode!=='1'&&currentTab==='stage'&&project.activeStageId==='stage-42-whole-native-blockout'");
next=once(next,'bar.append(file);document.body.append(bar);','bar.append(file);installWholeDetail({bar,status,canvas,baseRaw:()=>raw,onProject:install});document.body.append(bar);');
fs.writeFileSync(file,next);
