export async function measureWholeScene({canvas,engine,battle,camera,makeScene,assertPure,drain}){
 const stats=()=>globalThis.HonroStage32FoundationArt?.stats?.()??null,framePNGs={};
 async function run(s,name){const before=stats(),start=performance.now();s.render(engine,0,'',.6,false,0);const ms=performance.now()-start;assertPure();const after=stats(),pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,rgbaSHA256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',pixels)),x=>x.toString(16).padStart(2,'0')).join('');framePNGs[name]=canvas.toDataURL('image/png');return{name,ms,before,after,rgbaSHA256,camera:{x:s.x,y:s.y,scale:s.scale},backing:[canvas.width,canvas.height]};}
 const s0=makeScene(canvas,camera),first=await run(s0,'first');await drain();for(let i=0;i<3;i++){s0.render(engine,0,'',.6,false,0);assertPure();await drain();}
 globalThis.HonroStage32FoundationArt.clear();const s=makeScene(canvas,camera),cold=await run(s,'cold'),pan=[];
 for(let i=0;i<6;i++){const dx=[16,32,32,0,160,176][i],dy=[0,0,16,0,0,16][i],requested={x:camera.x+dx,y:camera.y+dy};s.x=requested.x;s.y=requested.y;HonroBounds.constrain(s,battle);if(s.x!==requested.x||s.y!==requested.y)throw Error('Diagnostic pan clamped');pan.push({...await run(s,'pan'+i),requested});}
 const edgeScene=makeScene(canvas,{x:1689.6,y:1342,scale:1.65}),edge=await run(edgeScene,'edge');
 const terrain=captureFieldWindowTerrain({battle,frames:[first,cold,...pan,edge],width:canvas.width,height:canvas.height});Object.assign(framePNGs,terrain.masks);delete terrain.masks;
 return{first,cold,pan,edge,terrain,framePNGs,scope:'9 observed Scene frames, then direct transparent terrain after timing. RGB resampling changes recorded; alpha/exterior strict, partial foreground not fully proved; not clean performance.'};
}
