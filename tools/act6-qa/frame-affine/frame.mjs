// Pure 90-degree chart conversion; caller retains responsibility for owning scene and contact.
const directions=new Set(['A','R','C','L']);
const check=(cond,name)=>{if(!cond)throw TypeError(name);};
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const validPoint=p=>p&&finite(p.x)&&finite(p.y);
const signed=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
export function chart(spec,axis) {
  check(spec&&finite(spec.width)&&finite(spec.height)&&spec.width>0&&spec.height>0,'invalid extents');
  check(directions.has(axis),'unknown chart');
  const {width:w,height:h}=spec;
  switch(axis){
    case 'A':return {a:1,b:0,c:0,d:1,x:0,y:0,w,h};
    case 'R':return {a:0,b:-1,c:1,d:0,x:h,y:0,w:h,h:w};
    case 'C':return {a:-1,b:0,c:0,d:-1,x:w,y:h,w,h};
    case 'L':return {a:0,b:1,c:-1,d:0,x:0,y:w,w:h,h:w};
  }
}
const clean=n=>n===0?0:n;
export function frameTransform(spec,from,to){
  const F=chart(spec,from),T=chart(spec,to);
  const mul=(m,x,y)=>({x:clean(m.a*x+m.b*y),y:clean(m.c*x+m.d*y)});
  const inv=(m,x,y)=>({x:clean(m.a*x+m.c*y),y:clean(m.b*x+m.d*y)});
  function point(p){
    check(validPoint(p),'invalid point');
    const w=inv(F,p.x-F.x,p.y-F.y), tip=mul(T,w.x,w.y);
    return {x:clean(tip.x+T.x),y:clean(tip.y+T.y)};
  }
  function vector(v){
    check(validPoint(v),'invalid vector');
    const w=inv(F,v.x,v.y);
    return mul(T,w.x,w.y);
  }
  function bounds(r){
    check(r&&[r.left,r.right,r.top,r.bottom].every(finite)&&r.left<=r.right&&r.top<=r.bottom,'invalid bounds');
    const ps=[{x:r.left,y:r.top},{x:r.left,y:r.bottom},{x:r.right,y:r.top},{x:r.right,y:r.bottom}].map(point);
    return {left:Math.min(...ps.map(p=>p.x)),top:Math.min(...ps.map(p=>p.y)),right:Math.max(...ps.map(p=>p.x)),bottom:Math.max(...ps.map(p=>p.y))};
  }
  function body(u){
    check(validPoint(u)&&finite(u.h)&&u.h>0&&finite(u.vx)&&finite(u.vy),'invalid body pose');
    const sourceCenter={x:u.x,y:u.y-u.h/2}, center=point(sourceCenter), vel=vector({x:u.vx,y:u.vy});
    return {sourceCenter,center,foot:{x:center.x,y:center.y+u.h/2},velocity:{vx:vel.x,vy:vel.y}};
  }
  return Object.freeze({point,vector,bounds,body,size:Object.freeze({width:T.w,height:T.h})});
}
// Fail closed on missing/unpinned frame record; no migration to A and no writes.
// epoch is orientation scene generation, not combat round or timer.
export function checkFrameReceipt(stamp,contract,expectedEpoch) {
  if(!contract||typeof contract.stageKey!=='string'||!contract.stageKey||!signed(contract.ownerSHA256)||!Array.isArray(contract.allowedFrames)||!contract.allowedFrames.length||
     !contract.allowedFrames.every(k=>directions.has(k))||!Number.isSafeInteger(expectedEpoch)||expectedEpoch<0)return 'invalid-contract';
  if(!stamp||stamp.version!==1)return 'unsupported-frame-version';
  if(stamp.stageKey!==contract.stageKey||stamp.ownerSHA256!==contract.ownerSHA256)return 'wrong-scene-owner';
  if(!contract.allowedFrames.includes(stamp.frame))return 'unregistered-frame';
  if(!Number.isSafeInteger(stamp.epoch)||stamp.epoch!==expectedEpoch)return 'wrong-frame-epoch';
  return 'ok';
}
