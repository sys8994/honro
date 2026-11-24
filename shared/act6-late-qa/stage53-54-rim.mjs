const SCOPES=Object.freeze({
 53:{auth:'contact-q-03',group:'upper-threshold-footing',segments:[[2412,590,2460,584],[2460,584,2520,578],[2520,578,2590,578],[2590,578,2656,567],[2656,567,2705,558],[2705,558,2765.0349344978167,531.3178068898593]],tone:.48},
 54:{auth:'stage-54',group:'mid-contact',segments:[[2303,2930,2368,2930],[2368,2930,2430,2978]],tone:.52}
});
const bound=new WeakMap();
const same=(row,s)=>row.every((v,i)=>Math.abs(v-[s.a.x,s.a.y,s.z.x,s.z.y][i])<.0001);
const paintPath=(Path,list)=>{const p=new Path();for(const s of list){p.moveTo(s.a.x,s.a.y);p.lineTo(s.z.x,s.z.y);}return p;};
export function attachChapterContactRim({G,app,scene,engine,verify,permit,onDraw=()=>{}}={}){
 const b=engine?.b,id=+b?.honroStage,rule=SCOPES[id],owner=verify?.(permit,scene,engine);
 const R=G?.HonroTerrainReadability, Path=G?.Path2D??globalThis.Path2D;
 if(!rule||owner?.scene!==scene||owner?.battle!==b||owner?.stage!==id||app?.scene!==scene||app?.engine!==engine||
  b.honroAuthoredId!==rule.auth||b.honroCustom===true||!Path||typeof R?.prepare!=='function'||typeof scene?.terrainReadability!=='function'||bound.has(scene))return null;
 const original=scene.terrainReadability, pathCache=new WeakMap(), colors=new Set([R.STYLE.topLight,R.STYLE.woodLight].map(x=>x.toLowerCase()));
 const wrap=function(c,b0,...args){
  const pass=()=>original.call(this,c,b0,...args);
  if(this!==scene||b0!==b||scene.battle!==b||engine.b!==b||app.scene!==scene||app.engine!==engine||
     verify(permit,scene,engine)!==owner||!owner.ownsChart?.(b0,id===54?'L-':'N'))return pass();
  const g=R.prepare(b0).groups.find(v=>v.id===rule.group);if(!g)return pass();
  let pref=pathCache.get(g);
  if(!pref){
   const tops=g.segments.filter(s=>s.walkable), narrow=tops.filter(s=>rule.segments.some(r=>same(r,s)));
   if(narrow.length!==rule.segments.length)return pass();
   const untouched=tops.filter(s=>!narrow.includes(s));
   pref={untouched:untouched.length?paintPath(Path,untouched):null,narrow:paintPath(Path,narrow),count:narrow.length};pathCache.set(g,pref);
  }
  const f=c.stroke;
  c.stroke=function(path,...p){
   if(path!==g.top||typeof this.strokeStyle!=='string'||!colors.has(this.strokeStyle.toLowerCase()))return f.call(this,path,...p);
   if(pref.untouched)f.call(this,pref.untouched,...p);
   const alpha=this.globalAlpha;
   try{this.globalAlpha=alpha*rule.tone;const ret=f.call(this,pref.narrow,...p);onDraw({stage:id,group:rule.group,segments:pref.count,alphaScale:rule.tone});return ret;}
   finally{this.globalAlpha=alpha;}
  };
  try{return pass();}finally{c.stroke=f;}
 };
 scene.terrainReadability=wrap;
 const t=Object.freeze({detach(){if(bound.get(scene)!==t)return;if(scene.terrainReadability===wrap)scene.terrainReadability=original;bound.delete(scene);}});
 bound.set(scene,t);return t;
}
