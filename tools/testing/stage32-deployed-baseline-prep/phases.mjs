// Browser-side clean phase module; no monkeypatches and no test helper injection.
// Caller must finish image/font readiness, freeze only visual-time arguments,
// keep performance.now real, establish official fresh battle/tide and purity.
export async function measureWholeScene({canvas,engine,battle,camera,makeScene,assertPure,drain}){
 const helper=globalThis.HonroStage32FoundationArt;const stats=()=>({helper:helper?.stats?.()??null});const run=s=>{const before=stats(),worldBefore=s._cacheStats?.worldBuilds??0,t=performance.now();s.render(engine,0,'',.6,false,0);const ms=performance.now()-t;assertPure();return{ms,worldRebuilds:(s._cacheStats?.worldBuilds??0)-worldBefore,sceneCache:{...s._cacheStats},before,after:stats()};};
 // First render explicitly includes lazy original geometry AND native/band preparation.
 // Counters are read if registered provider exposes them; absence is null, NOT zero.
 const pristine=stats(),firstScene=makeScene(canvas,camera),first=run(firstScene);assertPure();await drain();const readinessRenders=[];for(let i=0;i<3;i++){readinessRenders.push(run(firstScene));assertPure();await drain();}const prepared=stats();const cold=[],warm=[],pan=[];let scene;
 for(let i=0;i<5;i++){helper?.clear?.();scene=makeScene(canvas,camera);cold.push(run(scene));assertPure();}
 for(let i=0;i<30;i++)warm.push(run(scene));
 for(let i=0;i<60;i++){scene.x=camera.x+16*(i+1);scene.y=camera.y;HonroBounds.constrain(scene,battle);pan.push({...run(scene),camera:{x:scene.x,y:scene.y,scale:scene.scale}});}
 assertPure();return{pristine,firstIncludingLazyPreparation:first,readinessRenders,prepared,cold,warm,pan,scope:'Whole registered Scene; helper absent at842 is valid. World-cache rebuild and helper material rebuild are separate. Live path may rebuild no world tile; retain per-frame helper stats. Initial geometry and band preparation measured separately only if provider exposes counters. Without them report unknown, not zero.',memoryScope:'Record scene and helper canvas logical bytes; native/GPU heap unmeasured'};
}
