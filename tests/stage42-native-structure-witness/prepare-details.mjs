import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const here=new URL('.',import.meta.url),a=process.argv[2],b=process.env.HONRO_DETAIL_WORKSHOP_QA;
if(!a||b!=='1'||path.resolve(a)===process.cwd())throw Error('Use exact disposable QA build');
const root=path.resolve(a),m=JSON.parse(fs.readFileSync(path.join(root,'web/manifest.json'),'utf8'));
if(m.workshopEntry!=='web/entries/workshop.208159c350d98602.js')throw Error('Wrong published Workshop entry');
const file=path.join(root,'web/runtime/workshop-app.489f733634454986.js');
const text=fs.readFileSync(file,'utf8');
const pin=process.env.HONRO_STRUCT_DISPOSABLE_SHA256;
if(!/^[a-f0-9]{64}$/.test(pin??'')||createHash('sha256').update(text).digest('hex')!==pin)throw Error('Wrong audited disposable V4 host bytes');
const read=f=>fs.readFileSync(new URL(f,here),'utf8').replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'');
function replace(s,a,b){if(s.split(a).length!==2)throw Error('Exact V4 host binding drift: '+a);return s.replace(a,b)}
const scope=(name,imports,f,exports)=>'const '+name+'=(()=>{'+imports+read(f)+'\nreturn {'+exports+'};})();\n';
const binding='const V4D=(()=>{\n'+
 scope('detail','','detail.mjs','compileDetailShapes,snapDetailPoint,detailRoles')+
 scope('pack','const {compileDetailShapes}=detail;','pack-detail.mjs','verifyStructureBaseline,buildDetails,exportDetailWitness,reopenDetailWitness')+
 scope('author','const {compileDetailShapes,snapDetailPoint,detailRoles}=detail;','author-detail.mjs','mountDetails')+
 'return {pack,author};})();\n'+read('host-details.js');
let v=replace(text,'function installStructureWitness(){',binding+'\nfunction installStructureWitness(){');
v=replace(v,'bar.append(file);document.body.append(bar);','bar.append(file);installV4DetailPanel({bar,canvas,status,baseRaw:()=>raw,onProject:set});document.body.append(bar);');
fs.writeFileSync(file,v);
