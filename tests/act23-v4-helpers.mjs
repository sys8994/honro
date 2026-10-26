import {runtime as production,battlefield as ordinary} from '../game/tests/helpers.mjs';
export const plain=x=>JSON.parse(JSON.stringify(x));
export async function runtimeCandidate(){const g=await production({legacyMaps:false});g.HONRO_ACT23_V4_PHASE_A=true;g.HONRO_PROJECT=g.HonroAct23V4.author(g.HONRO_PROJECT,{enabled:true});return g;}
export function battlefield(g,id,options={}){const q=ordinary(g,id,options),{b,e,app}=q;app.screen='battle';app.modal={classList:{contains:()=>false}};app.persist=()=>{};app.canInput=()=>e.canAct();app.cancelInput=()=>{};app.updateHUD=()=>{};app.checkMission=()=>false;app.actorBoundary=null;
 g.HonroStage19Farewell.prepare(b);g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);g.HonroAct3.attach(app,e);g.HonroSplitCampaign.attach(app,e);g.HonroStakeCrossing.attach(app,e);g.HonroAct3Void?.attach(app,e);return q;}
