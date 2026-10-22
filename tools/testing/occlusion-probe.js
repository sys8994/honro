// Browser-only diagnostic injection. Never imported by production bundles.
// phase: elapsed command submission, no readback. alpha: separate forced-readback run.
async ({mode,frames,source})=>{
 const a=HonroApp,s=a.scene,original=s.occludedUnitSilhouettes,rows=[],totals=[],phase={};
 const stat=v=>{const n=[...v].sort((a,b)=>a-b);return {n:n.length,p50:n[Math.floor(n.length*.5)]||0,p95:n[Math.floor(n.length*.95)]||0,total:n.reduce((a,b)=>a+b,0),max:n.at(-1)||0};};
 let last;
 window.occlusionMark=name=>{const now=performance.now();if(name)(phase[name]??=[]).push(now-last);last=now;};
 window.occlusionAlpha=(c,u,covers,left,top,rs,body,edge)=>{
  const m=c.getTransform(),w=body.width,h=body.height,ba=body.getContext('2d').getImageData(0,0,w,h).data,ea=edge.getContext('2d').getImageData(0,0,w,h).data;
  let count=0,onScreen=0,x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(ba[(y*w+x)*4+3]||ea[(y*w+x)*4+3]){
   count++;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
   const px=left+(x+.5)/rs,py=top+(y+.5)/rs,sx=m.a*px+m.c*py+m.e,sy=m.b*px+m.d*py+m.f;
   if(sx>=-2&&sx<c.canvas.width+2&&sy>=-2&&sy<c.canvas.height+2)onScreen++;
  }
  rows.push({time:s.time,id:u.id,cls:u.cls,type:u.honroType,x:u.x,y:u.y,h:u.h,scale:s.scale,charge:a.charging?a.power:0,covers:covers.map(v=>({id:v.id,x:v.x,y:v.y,h:v.h,type:v.honroType})),count,onScreen,bounds:count?[x0,y0,x1+1,y1+1]:null,rs,left,top});
 };
 const insert=(needle,value)=>{if(!source.includes(needle))throw Error('probe source anchor missing: '+needle);source=source.replace(needle,value);};
 if(mode==='phase'){
  insert('const extent=',"occlusionMark();const extent=");
  insert('this.unitBody(bc,u,',"occlusionMark('setup-clear');this.unitBody(bc,u,");
  insert('for(const v of covers)',"occlusionMark('body-redraw');for(const v of covers)");
  insert('bc.setTransform(1,0,0,1,0,0);cc.setTransform',"occlusionMark('cover-redraw');bc.setTransform(1,0,0,1,0,0);cc.setTransform");
  insert('const r=1.6',"occlusionMark('body-color');const r=1.6");
  insert("ec.globalCompositeOperation='destination-out'", "occlusionMark('edge-expand-eight');ec.globalCompositeOperation='destination-out'");
  insert("ec.globalCompositeOperation='destination-in'", "occlusionMark('edge-subtract');ec.globalCompositeOperation='destination-in'");
  insert("bc.globalCompositeOperation='destination-in'", "occlusionMark('edge-intersect');bc.globalCompositeOperation='destination-in'");
  insert('c.save();c.globalAlpha=.38',"occlusionMark('body-intersect');c.save();c.globalAlpha=.38");
  insert('this._occludedUnitIds.push(u.id);',"occlusionMark('final-copy');this._occludedUnitIds.push(u.id);");
 }else if(mode==='alpha')insert('this._occludedUnitIds.push(u.id);','occlusionAlpha(c,u,covers,left,top,rs,body,edge);this._occludedUnitIds.push(u.id);');
 else throw Error('unknown diagnostic mode');
 const injected=new Function('G','return ({'+source+'}).occludedUnitSilhouettes;')(globalThis);
 s.occludedUnitSilhouettes=function(...args){const t=performance.now();try{return injected.apply(this,args);}finally{totals.push(performance.now()-t);}};
 await new Promise(resolve=>{let n=0;const next=()=>++n>=frames?resolve():requestAnimationFrame(next);requestAnimationFrame(next);});
 s.occludedUnitSilhouettes=original;delete window.occlusionMark;delete window.occlusionAlpha;
 return {mode,frames,total:stat(totals),phase:Object.fromEntries(Object.entries(phase).map(([k,v])=>[k,stat(v)])),phaseSamples:phase,rows,icons:HonroSkillImages.status(),state:{round:a.engine.b.round,phase:a.engine.b.phase,units:a.engine.b.units.length}};
}
