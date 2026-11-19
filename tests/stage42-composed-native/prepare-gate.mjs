import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const dir=process.argv[2],pin=process.env.HONRO_GATE_DETAILS_SHA;
if(!dir||process.env.HONRO_GATE_QA!=='1'||path.resolve(dir)===process.cwd())throw Error('Exact disposable build required');
const f=path.join(dir,'web/runtime/workshop-app.489f733634454986.js'),src=fs.readFileSync(f,'utf8');
if(createHash('sha256').update(src).digest('hex')!==pin)throw Error('Detailed full authoring host SHA drift');
function once(s,a,b){if(s.split(a).length!==2)throw Error('Exact native gate host insertion missing: '+a);return s.replace(a,b);}
const imports=s=>s.replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'');
const local=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8');
const author=imports(local('author-detail.mjs'))
 .replaceAll('Detail owning shape','Gate owning shape').replaceAll('Native detail material','Native Gate role').replaceAll('Existing editable detail','Existing editable Gate role')
 .replaceAll('새 구조 면','New Gate polygon').replaceAll('구조 면 닫기','Close Gate polygon').replaceAll('저장된 면 선택','Select Gate polygon').replaceAll('상세 면 미리보기','Preview Native Gate').replaceAll('상세 면 묶음 저장','Save Native Gate');
const add="const FG=(()=>{const clean=({id,role,points})=>({id,role,points});const validator=(()=>{"+imports(local('gate.mjs'))+"\nreturn {composeRouteCompile,composedRoles};})();"+
 "const pack=(()=>{const {composeRouteCompile}=validator;const {reopenFullDetails}=FD.pack;"+imports(local('pack-gate.mjs'))+"\nreturn {pinnedGateParents,gateProject,gateSave,gateOpen};})();"+
 "const author=parent=>{const detailRoles=validator.composedRoles,fullDetailOwners=()=>['gate-seat'],snapDetailPoint=(_,__,p)=>p,compileDetailShapes=(_,d,o)=>validator.composeRouteCompile(parent.base,parent.details,d.map(clean),o);"+author+"\nreturn {mountDetails};};return {clean,pack,author};})();\n";
let next=once(src,'function installWholeDetail({bar,status,canvas,baseRaw,onProject}){',add+'\n'+local('host-gate.js').replace('FG.author.mountDetails','FG.author(q).mountDetails')+'\nfunction installWholeDetail({bar,status,canvas,baseRaw,onProject}){');
next=once(next,'bar.append(input,controls);','bar.append(input,controls);installGate({bar,status,canvas,baseRaw,detailRaw:()=>r,onProject,closeDetail:()=>{if(dispose){dispose();dispose=null}}});');
fs.writeFileSync(f,next);
