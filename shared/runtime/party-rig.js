(function(){
// Renderer-independent rig math. No package, DOM or network dependency at module load.
const identity = () => [1, 0, 0, 1, 0, 0];
function multiply(a, b) {
  return [a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1], a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3], a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5]];
}
const point = (m, p) => [m[0]*p[0]+m[2]*p[1]+m[4], m[1]*p[0]+m[3]*p[1]+m[5]];
function localMatrix(pivot, transform = {}) {
  const r = (transform.r || 0)*Math.PI/180, c = Math.cos(r), s = Math.sin(r), sx = transform.sx ?? 1, sy = transform.sy ?? 1;
  const [x,y] = pivot;
  return [c*sx, s*sx, -s*sy, c*sy, x+(transform.x||0)-c*sx*x+s*sy*y, y+(transform.y||0)-s*sx*x-c*sy*y];
}
function rigMatrices(asset, poses = {}) {
  const result = {}, visiting = new Set(), byId = Object.fromEntries(asset.rig.parts.map(p => [p.id,p]));
  function visit(id) {
    if (result[id]) return result[id];
    if (visiting.has(id)) throw Error(`Cyclic rig: ${id}`);
    const part = byId[id]; if (!part) throw Error(`Unknown rig part: ${id}`);
    visiting.add(id);
    const base = part.base || {}, pose = poses[id] || {};
    const transform = {x:(base.x||0)+(pose.x||0), y:(base.y||0)+(pose.y||0), r:(base.r||0)+(pose.r||0), sx:(base.sx??1)*(pose.sx??1), sy:(base.sy??1)*(pose.sy??1)};
    result[id] = multiply(part.parent ? visit(part.parent) : identity(), pose.matrix || localMatrix(part.pivot, transform));
    visiting.delete(id); return result[id];
  }
  for (const p of asset.rig.parts) visit(p.id);
  return result;
}
function interpolateTrack(keys, t, fallback, ease) {
  if (!keys.length) return fallback;
  if (keys[0][0] > 0) keys = [[0, fallback], ...keys];
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const a = keys[i-1], b = keys[i]; let u = (t-a[0])/(b[0]-a[0]);
    if (ease) u = u*u*(3-2*u);
    return a[1]+(b[1]-a[1])*u;
  }
  return keys[keys.length-1][1];
}
function sampleAnimation(asset, name = 'idle', seconds = 0, normalized = false) {
  const animation = asset.animation.animations[name];
  if (!animation) throw Error(`Unknown animation: ${name}`);
  let t = normalized ? seconds : seconds*1000/animation.duration_ms;
  t = normalized ? Math.max(0, Math.min(1,t)) : animation.loop ? ((t%1)+1)%1 : Math.max(0,Math.min(1,t));
  const poses = {}, controls = {}, ease = (animation.interpolation || asset.animation.interpolation) !== 'linear';
  for (const part of asset.rig.parts) {
    poses[part.id] = {};
    for (const key of ['x','y','r','sx','sy','opacity']) {
      const keys = animation.keyframes.filter(f => f.parts?.[part.id]?.[key] !== undefined).map(f => [f.t,f.parts[part.id][key]]);
      poses[part.id][key] = interpolateTrack(keys,t,['sx','sy','opacity'].includes(key)?1:0,ease);
    }
  }
  for (const key of ['draw','arrowOpacity']) controls[key] = interpolateTrack(animation.keyframes.filter(f => f.controls?.[key] !== undefined).map(f => [f.t,f.controls[key]]),t,0,ease);
  return {poses,controls,t};
}
function bowFlexPoint(asset,p,t){const f=asset.constraints?.bowFlex;if(!f)return p;const y=p[1]-f.pivot[1],w=Math.pow(Math.min(1,Math.abs(y)/128),1.7);return[p[0]-f.maxSweep*t*w,f.pivot[1]+y*(1-f.shortening*t)];}
function bowTension(asset,m,c){if(!asset.constraints?.bowFlex||!c.draw)return 0;const b=asset.constraints.bowstring,p=point(inverse(m[b.part]),point(m[b.drawPart],b.drawPoint)),grip=asset.constraints.arrow.grip;return Math.max(0,Math.min(1,(grip[0]-p[0]-26)/145));}
function flexPath(asset,d,t){return d.replace(/([MLQCZ])([^MLQCZ]*)/gi,(_,cmd,args)=>{const ns=(args.match(/[-+]?(?:\d*\.)?\d+/g)||[]).map(Number),out=[];for(let i=0;i<ns.length;i+=2)out.push(...bowFlexPoint(asset,[ns[i],ns[i+1]],t));return cmd+out.join(' ');});}
function partDepth(asset,p,sample){if(asset.anatomyRevision>=12&&sample.controls.rearArmLayer>0){if(p.id==='rear_forearm')return asset.character_id==='seol_o'?71:57;if(p.id==='rear_hand')return asset.character_id==='seol_o'?74:66;}return p.z;}
function constrainedPaths(asset, matrices, controls = {}) {
  const extra=[];
  if(asset.character_id==='sodan'&&controls.talismanOpacity>0){
    const hand=asset.rig.handSockets?.rear||asset.rig.parts.find(p=>p.id==='rear_hand').pivot,m=matrices.rear_hand;
    const bend=controls.paperBend||0,xy=(x,y)=>point(m,[hand[0]+x,hand[1]+y]).map(v=>Number(v.toFixed(3))).join(' ');
    extra.push({id:'held_talisman',d:`M${xy(2,0)} L${xy(17,-2)} Q${xy(23+bend,-24)} ${xy(17+bend,-48)} L${xy(1+bend,-46)} Q${xy(7,-20)} ${xy(2,0)}Z`,fill:'ivory',opacity:controls.talismanOpacity});
    extra.push({id:'held_talisman_ink',d:`M${xy(6,-10)} L${xy(13,-12)} M${xy(8,-8)} L${xy(10+bend*.5,-34)} M${xy(5,-23)} L${xy(16,-25)} M${xy(5+bend,-38)} L${xy(13+bend,-40)}`,stroke:'ochre',strokeWidth:2,opacity:controls.talismanOpacity});
  }
  if (!asset.constraints?.bowstring) return {paths:extra};
  const c = asset.constraints, bow = matrices[c.bowstring.part];
  const flex=bowTension(asset,matrices,controls),top = point(bow,bowFlexPoint(asset,c.bowstring.tips[0],flex)), bottom = point(bow,bowFlexPoint(asset,c.bowstring.tips[1],flex));
  const rest = point(bow,c.bowstring.restNock), hand = point(matrices[c.bowstring.drawPart],c.bowstring.drawPoint);
  const draw = controls.draw || 0, nock = rest.map((v,i) => v+(hand[i]-v)*draw);
  const grip = point(matrices[c.arrow.part],c.arrow.grip), dx = grip[0]-nock[0], dy = grip[1]-nock[1], len = Math.hypot(dx,dy)||1;
  const tip = [grip[0]+dx/len*c.arrow.overhang,grip[1]+dy/len*c.arrow.overhang];
  const d = p => p.map(v=>Number(v.toFixed(3))).join(' ');
  const string = {id:'bowstring_constraint',d:`M${d(top)} L${d(nock)} L${d(bottom)}`,stroke:c.bowstring.color||'old_paper',strokeWidth:c.bowstring.width||1.3,opacity:1,z:72};
  const arrow = {id:'arrow_constraint',d:`M${d(nock)} L${d(tip)} M${d([tip[0]-dx/len*8-dy/len*3,tip[1]-dy/len*8+dx/len*3])} L${d(tip)} L${d([tip[0]-dx/len*8+dy/len*3,tip[1]-dy/len*8-dx/len*3])}`,stroke:c.arrow.color||'old_paper',strokeWidth:c.arrow.width||1.8,opacity:controls.arrowOpacity || 0,z:73};
  return {paths:[string,arrow,...extra],top,bottom,nock,grip,hand};
}
function createCanvasRenderer(asset) {
  const cache = new Map(asset.paths.map(p=>[p.id,new Path2D(p.d)]));
  const sorted = [...asset.rig.parts].sort((a,b)=>a.z-b.z || a.id.localeCompare(b.id));
  const groups = new Map(sorted.map(p=>[p.id,asset.paths.filter(s=>s.part===p.id)]));
  return {
    pathCount: cache.size,
    draw(context,{x=0,y=0,height=asset.canvas.visualHeight,facing=1,animation='idle',time=0,normalized=false,silhouette=false,debug=false,detail,sample:providedSample=null}={}) {
      const sample = providedSample || sampleAnimation(asset,animation,time,normalized), matrices = rigMatrices(asset,sample.poses);
      const m=context.getTransform(),ratio=context.canvas.clientWidth?context.canvas.width/context.canvas.clientWidth:1,pixels=height*Math.hypot(m.c,m.d)/ratio,lod=detail??(pixels>=160?2:pixels>=80?1:0);
      context.save(); context.translate(x,y); const scale=height/asset.canvas.visualHeight;
      context.scale(scale*(facing<0?-1:1),scale); context.translate(-asset.canvas.anchor[0],-asset.canvas.anchor[1]);
      const renderPath = (p,path) => { if(p.fill){context.fillStyle=silhouette?'#080A0B':asset.palette[p.fill];context.fill(path);} if(p.stroke){context.strokeStyle=silhouette?'#080A0B':asset.palette[p.stroke];context.lineWidth=p.strokeWidth||1;context.lineCap='round';context.lineJoin='round';context.stroke(path);} };
      const constraint=constrainedPaths(asset,matrices,sample.controls),pending=[...constraint.paths].sort((a,b)=>(a.z??100)-(b.z??100)),flex=bowTension(asset,matrices,sample.controls);
      const paintConstraint=p=>{if(p.opacity>0){context.save();context.globalAlpha*=p.opacity;renderPath(p,new Path2D(p.d));context.restore();}};
      for(const part of [...sorted].sort((a,b)=>partDepth(asset,a,sample)-partDepth(asset,b,sample))){while(pending.length&&(pending[0].z??100)<partDepth(asset,part,sample))paintConstraint(pending.shift()); context.save();context.transform(...matrices[part.id]);context.globalAlpha*=sample.poses[part.id].opacity;
        for(const p of groups.get(part.id))if((p.detail||0)<=lod)renderPath(p,asset.constraints?.bowFlex&&['bow_body','bow_laminate'].includes(p.id)?new Path2D(flexPath(asset,p.d,flex)):cache.get(p.id));context.restore(); }
      for(const p of pending)paintConstraint(p);
      if(debug){context.strokeStyle='#62C9C7';context.lineWidth=1;for(const part of sorted){const [px,py]=point(matrices[part.id],part.pivot);context.beginPath();context.arc(px,py,2.5,0,Math.PI*2);context.stroke();}}
      context.restore();return {sample,matrices,constraint};
    }
  };
}
function poseSVG(asset,animation='idle',time=0,{silhouette=false,sample:providedSample=null}={}) {
  const sample=providedSample||sampleAnimation(asset,animation,time,true),matrices=rigMatrices(asset,sample.poses);
  const paths=(p,d=p.d)=>`<path id="${p.id}" d="${d}" fill="${p.fill?(silhouette?'#080A0B':asset.palette[p.fill]):'none'}"${p.stroke?` stroke="${silhouette?'#080A0B':asset.palette[p.stroke]}" stroke-width="${p.strokeWidth||1}" stroke-linecap="round" stroke-linejoin="round"`:''}/>`;
  const flex=bowTension(asset,matrices,sample.controls),items=asset.rig.parts.map(p=>({z:partDepth(asset,p,sample),part:p}));
  items.push(...constrainedPaths(asset,matrices,sample.controls).paths.map(p=>({z:p.z??100,path:p})));
  const body=items.sort((a,b)=>a.z-b.z).map(item=>{
    if(item.path)return `<g opacity="${item.path.opacity}">${paths(item.path)}</g>`;
    const p=item.part;return `<g id="${p.id}" transform="matrix(${matrices[p.id].map(n=>Number(n.toFixed(5))).join(' ')})" opacity="${sample.poses[p.id].opacity}">${asset.paths.filter(s=>s.part===p.id).map(s=>paths(s,asset.constraints?.bowFlex&&['bow_body','bow_laminate'].includes(s.id)?flexPath(asset,s.d,flex):s.d)).join('')}</g>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${asset.canvas.viewBox.join(' ')}" role="img" aria-label="HONRO ${asset.asset_id} ${animation}">${body}</svg>`;
}

const base={identity,multiply,point,localMatrix,rigMatrices,sampleAnimation,constrainedPaths,createCanvasRenderer,poseSVG};
// Pose authoring/solving: anatomical targets and contacts, not joint-angle tracks.
// Runtime math is dependency-free except the existing shared matrix primitives.
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
const length=v=>Math.hypot(...v),angle=v=>Math.atan2(v[1],v[0])*180/Math.PI;
function inverse(m){const d=m[0]*m[3]-m[1]*m[2];if(Math.abs(d)<1e-8)throw Error('Degenerate pose matrix');return [m[3]/d,-m[1]/d,-m[2]/d,m[0]/d,(m[2]*m[5]-m[3]*m[4])/d,(m[1]*m[4]-m[0]*m[5])/d];}
function segment(a,b,c,d){
  // Map the projected bone length while preserving its transverse thickness.
  // A limb turning in depth may shorten in the image; its geometry still meets
  // the next joint exactly, instead of rotating a full-length shape past it.
  const v=sub(b,a),w=sub(d,c),l=length(v),k=Math.max(1e-8,length(w)),u=v.map(x=>x/l),q=w.map(x=>x/k),s=k/l;
  const m=[q[0]*u[0]*s+q[1]*u[1],q[1]*u[0]*s-q[0]*u[1],q[0]*u[1]*s-q[1]*u[0],q[1]*u[1]*s+q[0]*u[0],0,0];
  m[4]=c[0]-m[0]*a[0]-m[2]*a[1];m[5]=c[1]-m[1]*a[0]-m[3]*a[1];return m;
}
function solveTwoBone(a,target,l1,l2,hint,plane){
  const delta=sub(target,a),requested=length(delta),d=Math.max(Math.abs(l1-l2)+.01,Math.min(l1+l2-.01,requested)),v=requested>1e-6?delta.map(x=>x/requested):[1,0];
  const x=(d*d+l1*l1-l2*l2)/(2*d),y=Math.sqrt(Math.max(0,l1*l1-x*x));
  const candidates=[1,-1].map(s=>[a[0]+v[0]*x-v[1]*y*s,a[1]+v[1]*x+v[0]*y*s]);
  const joint=plane===undefined?candidates.sort((p,q)=>length(sub(p,hint))-length(sub(q,hint)))[0]:[a[0]+v[0]*x-v[1]*y*plane,a[1]+v[1]*x+v[0]*y*plane];
  const depth=plane===undefined?0:y*Math.sqrt(Math.max(0,1-plane*plane));
  const end=add(a,v.map(x=>x*d));
  return {joint,end,depth,reachError:length(sub(end,target)),lengths:[Math.hypot(length(sub(joint,a)),depth),Math.hypot(length(sub(end,joint)),depth)]};
}
function solvePose(asset,target={}){
  const by=Object.fromEntries(asset.rig.parts.map(p=>[p.id,p])),world={root:identity()},poses={},joints={},reach={},depth={};
  const bindPelvis=by.pelvis.pivot,bindThorax=asset.rig.bindThorax||[240,185],pelvis=target.pelvis||bindPelvis,thorax=target.thorax||bindThorax;
  const rotation=angle(sub(thorax,pelvis))-angle(sub(bindThorax,bindPelvis));
  world.pelvis=localMatrix(bindPelvis,{x:pelvis[0]-bindPelvis[0],y:pelvis[1]-bindPelvis[1],r:target.pelvisAngle||0});
  world.thorax=localMatrix(bindPelvis,{x:pelvis[0]-bindPelvis[0],y:pelvis[1]-bindPelvis[1],r:rotation,sy:length(sub(thorax,pelvis))/length(sub(bindThorax,bindPelvis))});
  world.neck=world.thorax;
  // The neck follows the torso; the skull keeps its own aspect and rotation.
  const headAnchor=point(world.thorax,by.head.pivot);
  world.head=localMatrix(by.head.pivot,{x:headAnchor[0]-by.head.pivot[0],y:headAnchor[1]-by.head.pivot[1],r:target.head||0});
  for(const side of ['rear','front']){
    for(const limb of ['arm','leg']){
      const upper=side+(limb==='arm'?'_upper_arm':'_thigh'),lower=side+(limb==='arm'?'_forearm':'_shin'),tip=side+(limb==='arm'?'_hand':'_foot');
      const a=by[upper].pivot,b=by[lower].pivot,c=by[tip].pivot,parent=limb==='arm'?world.thorax:world.pelvis;
      const start=target[side+(limb==='arm'?'Shoulder':'Hip')]||point(parent,a),end=target[side+(limb==='arm'?'Hand':'Foot')]||c;
      const hint=target[side+(limb==='arm'?'Elbow':'Knee')]||point(parent,b);
      // Knees keep the anatomical forward bend. Arms may turn through depth
      // between authored elbow planes, never jump between two planar solutions.
      let solved;
      if(limb==='arm'&&target[side+'ElbowProjection']>0){
        // An authored projected elbow preserves the camera-depth contraction
        // of a drawing arm. Clamp to both bone discs, without choosing/flipping
        // one of two planar circle intersections near the shoulder singularity.
        const l1=length(sub(b,a)),l2=length(sub(c,b));let joint=[...hint];
        for(let n=0;n<12;n++)for(const [center,radius]of [[start,l1],[end,l2]]){const delta=sub(joint,center),d=length(delta);if(d>radius)joint=add(center,delta.map(v=>v*radius/d));}
        solved={joint,end:[...end],depth:Math.sqrt(Math.max(0,l1*l1-length(sub(joint,start))**2)),reachError:Math.max(0,length(sub(joint,start))-l1,length(sub(end,joint))-l2)};
      }else solved=solveTwoBone(start,end,length(sub(b,a)),length(sub(c,b)),hint,limb==='leg'?-1:target[side+'ArmPlane']);
      world[upper]=segment(a,b,start,solved.joint);world[lower]=segment(b,c,solved.joint,solved.end);
      // Hands and feet are authored orientation controls, independent of elbow/knee bend.
      world[tip]=localMatrix(c,{x:solved.end[0]-c[0],y:solved.end[1]-c[1],r:target[side+(limb==='arm'?'HandAngle':'FootAngle')]||0});
      joints[upper]=start;joints[lower]=solved.joint;joints[tip]=solved.end;reach[side+limb]=solved.reachError;depth[side+limb]=solved.depth;
    }
  }
  for(const side of ['rear','front'])if(by[side+'_sleeve']){
    const id=side+'_upper_arm',a=by[id].pivot,b=by[side+'_forearm'].pivot,v=sub(b,a),l=length(v),n=[-v[1]/l,v[0]/l],m=world[id].slice();
    const q=sub(joints[side+'_forearm'],joints[id]),ql=length(q)||1,mix=Math.max(0,Math.min(.45,(.7-q[1]/ql)*.65));
    const nx=m[0]*n[0]+m[2]*n[1],ny=m[1]*n[0]+m[3]*n[1],dx=-nx*mix,dy=(1-ny)*mix;
    // Cloth's transverse direction sags toward gravity as the arm rises. The
    // shoulder/elbow axis stays exact; only the separate sleeve plane shears.
    m[0]+=dx*n[0];m[2]+=dx*n[1];m[1]+=dy*n[0];m[3]+=dy*n[1];
    m[4]=joints[id][0]-m[0]*a[0]-m[2]*a[1];m[5]=joints[id][1]-m[1]*a[0]-m[3]*a[1];world[side+'_sleeve']=m;
  }
  if(by.prop_hip)world.prop_hip=multiply(world.pelvis,localMatrix(by.prop_hip.pivot,{r:target.propSwing||0}));
  if(by.weapon){
    if(asset.rig.handSockets){const grip=point(world.front_hand,asset.rig.handSockets.front),w=by.weapon.pivot;world.weapon=localMatrix(w,{x:grip[0]-w[0],y:grip[1]-w[1],r:target.weapon||0});}
    else world.weapon=multiply(world.front_hand,localMatrix(by.weapon.pivot,{r:(target.weapon||0)-(target.frontHandAngle||0)}));
  }
  for(const side of ['rear','front'])if(by[side+'_cloth'])world[side+'_cloth']=multiply(world.pelvis,localMatrix(by[side+'_cloth'].pivot,{r:target[side+'Cloth']||0}));
  if(by.hair_tail)world.hair_tail=multiply(world.head,localMatrix(by.hair_tail.pivot,{r:target.hair||0}));
  if(by.spirit)world.spirit=localMatrix(by.spirit.pivot,{x:(target.spirit||0)*112,y:-(target.spirit||0)*16,sx:.65+(target.spirit||0)*.55,sy:.65+(target.spirit||0)*.55});
  if(by.qi)world.qi=localMatrix(by.qi.pivot,{x:(target.qi||0)*70,sx:.5+(target.qi||0)*.6,sy:.5+(target.qi||0)*.6});
  function resolve(id){if(world[id])return world[id];world[id]=by[id].parent?resolve(by[id].parent):identity();return world[id];}
  for(const p of asset.rig.parts){resolve(p.id);poses[p.id]={matrix:multiply(inverse(p.parent?resolve(p.parent):identity()),world[p.id]),opacity:p.id==='spirit'?(target.spiritAlpha??(target.spirit?.75:0)):p.id==='qi'?(target.qiAlpha??(target.qi?.65:0)):1};}
  return {poses,controls:{draw:target.draw||0,arrowOpacity:target.arrow||0,rearArmLayer:target.rearArmLayer||0},targets:target,guide:{pelvis,thorax,joints,reach,depth,contacts:target.contacts||['rear','front'],centerOfMass:[pelvis[0]*.55+thorax[0]*.45,pelvis[1]*.55+thorax[1]*.45]},t:target.t||0};
}

const poseKeys=['pelvis','thorax','rearShoulder','frontShoulder','rearHip','frontHip','rearElbow','frontElbow','rearKnee','frontKnee','rearHand','frontHand','rearFoot','frontFoot'];
const scalarKeys=['weapon','head','pelvisAngle','rearHandAngle','frontHandAngle','rearFootAngle','frontFootAngle','frontCloth','rearCloth','hair','spirit','qi','draw','arrow','rearArmPlane','frontArmPlane','propSwing','rearArmLayer','rearElbowProjection','frontElbowProjection'];
const poseCache=new WeakMap();
function completePose(asset,key){
  const p=solvePose(asset,key),j=p.guide.joints;
  const complete={...key,pelvis:p.guide.pelvis,thorax:p.guide.thorax,contacts:key.contacts||['rear','front']};
  for(const side of ['rear','front'])for(const [control,joint]of [['Shoulder','_upper_arm'],['Hip','_thigh'],['Elbow','_forearm'],['Knee','_shin'],['Hand','_hand'],['Foot','_foot']])complete[side+control]=key[side+control]||j[side+joint];
  for(const k of scalarKeys)complete[k]=key[k]||0;
  for(const side of ['rear','front']){
    const a=j[side+'_upper_arm'],b=j[side+'_forearm'],c=j[side+'_hand'];
    complete[side+'ArmPlane']=key[side+'ArmPlane']??(Math.sign((c[0]-a[0])*(b[1]-a[1])-(c[1]-a[1])*(b[0]-a[0]))||1);
  }
  return complete;
}
function blendPoseTargets(a,b,u,{walking=false}={}){
  const smooth=u*u*(3-2*u),p={weaponUnwrapped:!!a.weaponUnwrapped,t:a.t+(b.t-a.t)*u,contacts:a.contacts.filter(s=>b.contacts.includes(s))};
  for(const k of poseKeys){const planted=walking&&k.endsWith('Foot')&&p.contacts.includes(k.startsWith('rear')?'rear':'front');const f=planted?u:smooth;p[k]=a[k].map((v,i)=>v+(b[k][i]-v)*f);}
  for(const k of scalarKeys){let d=b[k]-a[k];if(k==='weapon'&&!a.weaponUnwrapped)d=((d+540)%360)-180;p[k]=a[k]+d*smooth;}
  // Depth is a pose topology, not an interpolated opacity-like number.
  p.rearArmLayer=a.rearArmLayer||b.rearArmLayer?1:0;
  // The arrow leaves on the release boundary. Never fade it during the load.
  p.arrow=u<1?a.arrow:b.arrow;if(a.draw===1&&b.draw===0)p.draw=u<1?1:0;
  return p;
}
function samplePoseAnimation(asset,name='idle',seconds=0,normalized=false){
  if(asset.animation.format!=='pose-targets-v1')return base.sampleAnimation(asset,name,seconds,normalized);
  const animation=asset.animation.animations[name];if(!animation)throw Error(`Unknown animation: ${name}`);
  let t=normalized?seconds:seconds*1000/animation.duration_ms;
  t=normalized?Math.max(0,Math.min(1,t)):animation.loop?((t%1)+1)%1:Math.max(0,Math.min(1,t));
  let cache=poseCache.get(asset);if(!cache){cache={};poseCache.set(asset,cache);}
  const frames=cache[name]??=animation.keyframes.map(f=>completePose(asset,f));
  let index=frames.findIndex((f,i)=>i>0&&f.t>=t);if(index<0)index=frames.length-1;
  const a=frames[Math.max(0,index-1)],b=frames[index],u=Math.max(0,Math.min(1,(t-a.t)/(b.t-a.t||1)));
  const p=blendPoseTargets(a,b,u,{walking:name==='move'});
  if(name==='attack'&&asset.character_id==='sodan'){
    p.spirit=t<.52?0:.15+(t-.52)/(.74-.52)*.85;
    p.spiritAlpha=t<.52?0:t<.8?.75:Math.max(0,.75*(1-(t-.8)/.15));
  }
  if(name==='attack'&&asset.character_id==='damheo'){
    p.qi=t<.5?0:.6+(t-.5)*2;
    p.qiAlpha=t<.5?0:t<.76?.65:Math.max(0,.65*(1-(t-.76)/.17));
  }
  const sample=solvePose(asset,p);sample.t=t;sample.animation=name;return sample;
}
function createPoseRenderer(asset){
  const renderer=base.createCanvasRenderer(asset);
  return {pathCount:renderer.pathCount,draw(context,options={}){return renderer.draw(context,{...options,sample:options.sample||samplePoseAnimation(asset,options.animation,options.time,options.normalized)});}};
}
function poseTargetSVG(asset,name='idle',time=0,options={}){return base.poseSVG(asset,name,time,{...options,sample:options.sample||samplePoseAnimation(asset,name,time,true)});}
const RebuildRig={...base,solvePose,completePose,blendPoseTargets,sampleAnimation:samplePoseAnimation,createCanvasRenderer:createPoseRenderer,poseSVG:poseTargetSVG};

globalThis.HonroVectorRig=RebuildRig;
})();
