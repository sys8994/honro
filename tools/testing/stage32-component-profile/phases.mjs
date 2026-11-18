export async function measureWholeScene({canvas,engine,battle,camera,makeScene,assertPure,drain}){
 const stats=()=>({helper:globalThis.HonroStage32FoundationArt?.stats?.()??null,components:globalThis.__stage32ComponentProfile?.snapshot()??null});
 const run=async s=>{const before=stats(),t=performance.now();s.render(engine,0,'',.6,false,0);const ms=performance.now()-t;assertPure();const after=stats(),pixels=snapshotPixels();const rgbaSHA256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',pixels)),x=>x.toString(16).padStart(2,'0')).join('');return{ms,before,after,rgbaSHA256};};
 const snapshotPixels=()=>canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
 const firstScene=makeScene(canvas,camera),first=await run(firstScene);await drain();for(let i=0;i<3;i++){await run(firstScene);await drain();}
 globalThis.HonroStage32FoundationArt?.clear?.();const s=makeScene(canvas,camera),cold=await run(s),pan=[];
 for(let i=0;i<5;i++){s.x=camera.x+16*(i+1);s.y=camera.y;HonroBounds.constrain(s,battle);pan.push(await run(s));}
 return{first,cold,pan,scope:'Instrumented diagnostic only; no clean cost or FPS acceptance'};
}
