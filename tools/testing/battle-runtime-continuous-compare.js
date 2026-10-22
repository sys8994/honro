async view=>{
    const a=HonroApp,s=a.scene,e=a.engine,fn=window.compareNativeFrame||battleContinuous.nativeFrame,raf=window.requestAnimationFrame;
    Object.assign(s,{manual:true,x:view.x,y:view.y,scale:view.scale,time:view.time,storyTween:null,goalFocus:null,focusUntil:0,speakerUntil:0});a.selected=view.selected;
    const summary=xs=>{const v=xs.slice().sort((a,b)=>a-b);return {n:v.length,p50:v[Math.floor(v.length*.5)]||0,p95:v[Math.floor(v.length*.95)]||0,max:v.at(-1)||0};};
    const counts=()=>({round:e.b.round,units:e.b.units.length,projectiles:e.b.projectiles.length,fx:s.arcFx?.fxs.length||0,particles:s.arcFx?.fxs.filter(f=>f.kind==='spark').length||0,settledHits:s.settledHits?.size||0,cache:s.renderCacheStats(),tiles:s._domainTiles?.tiles.size||0,far:HonroAuthoredFarArt.stats(),heap:performance.memory?.usedJSHeapSize,dom:document.getElementsByTagName('*').length,battleDom:a.root.querySelectorAll('*').length});
    const before=counts(),frames=[],gaps=[],snapshots=[],tasks=[];let last;
    const observer=new PerformanceObserver(list=>tasks.push(...list.getEntries().map(t=>({at:t.startTime,ms:t.duration}))));observer.observe({type:'longtask'});const start=performance.now();
    for(let i=0;i<180;i++){const now=await new Promise(raf);if(last!==undefined)gaps.push(now-last);last=now;const t=performance.now();window.requestAnimationFrame=()=>0;try{fn(now);}finally{window.requestAnimationFrame=raf;}frames.push(performance.now()-t);if(i%30===0||i===179)snapshots.push({frame:i,...counts()});}
    await new Promise(raf);observer.disconnect();
    return {before,after:counts(),frame:summary(frames),raf:summary(gaps),warmFrame:summary(frames.slice(30)),warmRaf:summary(gaps.slice(30)),rawFrames:frames,rawRaf:gaps,snapshots,longtasks:tasks.filter(t=>t.at>=start),error:a.lastError||null};
}
