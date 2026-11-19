import fs from 'node:fs';
const r=new URL('../stage42-full-native-workshop/',import.meta.url),read=n=>fs.readFileSync(new URL(n,r),'utf8').replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'');
const box=(id,body,req,exports)=>'const '+id+'=(()=>{'+req+'\n'+body+'\n;return {'+exports+'};})();\n';
const script='(()=>{"use strict";if(!["127.0.0.1","localhost"].includes(location.hostname)||window.HonroQaBuildNewStage42Visual)throw Error("Only disposable local replay");'+
 box('F',read('model.mjs')+'\n'+read('workshop.mjs'),'','compileFullShape,FRAME,reopenFullWorkshop,exportFullWorkshop,fullWorkshopProject')+
 box('D',read('detail.mjs'),'const {compileFullShape,FRAME}=F;','compileDetailShapes')+
 box('P',read('pack-detail.mjs'),'const {compileDetailShapes}=D;const {reopenFullWorkshop,exportFullWorkshop,fullWorkshopProject}=F;','reopenFullDetails')+
 box('G',read('gate.mjs'),'','gateCompile')+
 box('Q',read('pack-gate.mjs'),'const {gateCompile}=G;const {reopenFullDetails}=P;','pinnedGateParents,gateOpen')+
 'Object.defineProperty(window,"HonroQaBuildNewStage42Visual",{value:async(b,d,g)=>Q.gateOpen(await Q.pinnedGateParents(HonroMaps,b,d),g).project});})();\n';
new Function(script);process.stdout.write(script);
