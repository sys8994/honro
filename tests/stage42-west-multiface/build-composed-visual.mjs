import fs from 'node:fs';
if(!process.argv[2])throw Error('explicit pinned candidate module directory required');
const r=process.argv[2],read=n=>fs.readFileSync(new URL(n,'file://'+r.replace(/\/$/,'')+'/'),'utf8').replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'');
const west=['locked-envelope.mjs','multi.mjs','west-owner.mjs'].map(n=>fs.readFileSync(new URL(n,import.meta.url),'utf8').replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'')).join('\n');
const box=(id,body,req,exports)=>'const '+id+'=(()=>{'+req+'\n'+body+'\n;return {'+exports+'};})();\n';
const script='(()=>{"use strict";if(!["127.0.0.1","localhost"].includes(location.hostname)||window.HonroQaBuildNewStage42Visual)throw Error("Only disposable local replay");'+
 box('F',read('model.mjs')+'\n'+read('workshop.mjs'),'','compileFullShape,FRAME,reopenFullWorkshop,exportFullWorkshop,fullWorkshopProject')+
 box('D',read('detail.mjs'),'const {compileFullShape,FRAME}=F;','compileDetailShapes')+
 box('P',read('pack-detail.mjs'),'const {compileDetailShapes}=D;const {reopenFullWorkshop,exportFullWorkshop,fullWorkshopProject}=F;','reopenFullDetails')+
 box('G',read('gate.mjs'),'const {compileFullShape}=F;','composeRouteCompile')+
 box('Q',read('pack-gate.mjs'),'const {composeRouteCompile}=G;const {reopenFullDetails}=P;','pinnedGateParents,gateOpen')+
 box('W',west,'','westParents,westOpen')+
 'Object.defineProperty(window,"HonroQaBuildNewStage42Visual",{value:async(b,d,g,w)=>{if(w===null)return Q.gateOpen(await Q.pinnedGateParents(HonroMaps,b,d),g).project;return W.westOpen(await W.westParents(HonroMaps,b,d,g,Q.pinnedGateParents,Q.gateOpen),w).project}});})();\n';
new Function(script);process.stdout.write(script);
