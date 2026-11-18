// Test-only allocation arithmetic. No renderer integration or allocation.
export const LIMIT=48*1024*1024;
export function plan(x){
 const {width:w,height:h,matrix:m,nativeLive,sceneScale,paintValid,retained}=x;
 if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<1||h<1||!Array.isArray(m)||m.length!==6||!m.every(Number.isFinite))throw Error('Invalid dimensions/matrix');
 for(const k of ['material','work','color','body','ss','mask'])if(!Number.isSafeInteger(retained[k])||retained[k]<0)throw Error('Invalid retained bytes');
 const native=nativeLive===true&&sceneScale>1.05&&Number.isFinite(sceneScale);
 const axis=m[1]===0&&m[2]===0&&m[0]>0&&m[3]>0;
 const y0=Math.max(0,Math.min(h,Math.floor(m[3]*1716+m[5]))), y1=Math.min(h,Math.ceil(m[3]*1988.8+m[5])+2),rows=Math.max(0,y1-y0);
 const target=w*rows*4,material=w*h*4,current=Object.values(retained).reduce((a,b)=>a+b,0);
 const unchangedRetained=retained.ss+retained.mask+retained.color+retained.body;
 // Pre-release projection keeps all prior scratch. Used as evidence, not waived.
 const beforeRelease=material+(rows?target:retained.work)+unchangedRetained;
 // Only native eligible route may release unused SS/color/body. Work is released
 // too when rows==0. Each existing Canvas remains a 1x1 object (4 bytes).
 const inactive=['ss','mask','color','body'];
 const released=inactive.reduce((n,k)=>n+(retained[k]?4:0),0)+(rows?target:(retained.work?4:0));
 const afterRelease=material+released;
 // Old material and work are released BEFORE larger allocations; accounting of
 // that schedule never pretends browser/GPU physically freed old allocations.
 const releasePeak=current;
 const admissible=native&&axis&&paintValid===true&&w*h<=8*1024*1024&&afterRelease<=LIMIT;
 return {native,axis,y0,y1,rows,current,beforeRelease,afterRelease,logicalPeakScheduled:Math.max(releasePeak,afterRelease),admissible,requiresRelease:admissible&&beforeRelease!==afterRelease,scope:'Helper-owned canvas logical RGBA bytes only; not Scene/tile/JS/GPU/process memory. No readbacks in admitted native route.'};
}
