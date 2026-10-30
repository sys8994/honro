/** Deterministic arc-length midpoint mask. Sampling bounds are reported, not hidden. */
export function sampleSupport(top,keep,step=.5){
 if(!(step>0))throw Error('Positive world step required');const parts=[];let active=null,totalLength=0,keptLength=0,samples=0,transitions=0,previous;
 const add=p=>{if(!active){active=[];parts.push(active);}const n=active.length;if(n&&Math.hypot(active[n-1][0]-p[0],active[n-1][1]-p[1])<1e-8)return;if(n>1){const a=active[n-2],b=active[n-1];if(Math.abs((b[0]-a[0])*(p[1]-b[1])-(b[1]-a[1])*(p[0]-b[0]))<1e-8)active.pop();}active.push(p);};
 for(let k=1;k<top.length;k++){const a=top[k-1],b=top[k],L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(L/step));totalLength+=L;
  for(let i=0;i<n;i++){const point=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],yes=!!keep(...point((i+.5)/n));samples++;if(previous!==undefined&&previous!==yes)transitions++;previous=yes;if(yes){add(point(i/n));add(point((i+1)/n));keptLength+=L/n;}else active=null;}
 }
 return{parts,totalLength,keptLength,samples,transitions,samplingStepWorld:step,boundaryLengthUncertaintyWorld:transitions*step,limitation:'Midpoint samples can miss features narrower than the sample step; not exact swept/painted visibility proof.'};
}
