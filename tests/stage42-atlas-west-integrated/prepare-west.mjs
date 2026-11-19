import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const dir=process.argv[2],pin='57033ce2d6fb31b3d1984a2c9fecef16cafd07feb5fff327058a7919a32a8926';
if(!dir||process.env.HONRO_WEST_UPPER_QA!=='1'||path.resolve(dir)===process.cwd())throw Error('Use only independently rebuilt Slate QA runtime');
const f=path.join(dir,'web/runtime/workshop-app.489f733634454986.js'),src=fs.readFileSync(f,'utf8');
if(createHash('sha256').update(src).digest('hex')!==pin)throw Error('The actual prior Slate UI host SHA differs');
function once(s,a,b){if(s.split(a).length!==2)throw Error('Exact upper-west UI insertion missing: '+a);return s.replace(a,b);}
const code=n=>fs.readFileSync(new URL(n,import.meta.url),'utf8').replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'');
const author=code('pinned-author-detail.mjs')
 .replaceAll('Detail owning shape','West upper owner').replaceAll('Native detail material','Native West role').replaceAll('Existing editable detail','Existing editable West shape')
 .replaceAll('새 구조 면','New West polygon').replaceAll('구조 면 닫기','Close West polygon').replaceAll('저장된 면 선택','Select West polygon')
 .replaceAll('상세 면 미리보기','Preview Native West').replaceAll('상세 면 묶음 저장','Save Native West');
const bind='const FW=(()=>{'+code('west-upper.mjs')+'\nconst clean=({id,role,points})=>({id,role,points});'+
 'const detailRoles=["upper-west-palisade"],fullDetailOwners=()=>["upper-route"];'+
 'const snapDetailPoint=(base,owner,p,r)=>{const pair=[base.upper.top[0],base.upper.bottom[0]];const n=pair.find(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<=Math.min(r,14));return n?[...n]:p};'+
 'const compileDetailShapes=(b,d,o)=>strictUpperOutline(b,d.map(clean),o);'+author+
 '\nreturn {westParents,westProject,westSave,westOpen,clean,mount:mountDetails};})();\n'+code('host-west.js');
let next=once(src,'function installGate({bar,status,canvas,baseRaw,detailRaw,onProject,closeDetail}){',bind+'\nfunction installGate({bar,status,canvas,baseRaw,detailRaw,onProject,closeDetail}){\n let stopWest=null;');
next=once(next,'if(dispose)dispose();q=parent;showing=false;closeDetail();','if(stopWest)stopWest();if(dispose)dispose();q=parent;showing=false;closeDetail();');
next=once(next,'bar.append(file,controls);','bar.append(file,controls);stopWest=installWestUpper({bar,status,canvas,baseRaw,detailRaw,gateRaw:()=>r,onProject,closeGate:()=>{if(dispose){dispose();dispose=null;}}});');
fs.writeFileSync(f,next);
