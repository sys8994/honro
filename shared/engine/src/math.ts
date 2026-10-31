import type { Vec, Terrain } from './types';
export const WORLD_W = 7200, WORLD_H = 1520, G = 320, STEP = 1 / 120;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
export const rad = (d: number) => d * Math.PI / 180;
export const rng = (seed: number) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
export function poly(t: Terrain): Vec[] {
    if (t.vertices?.length) return t.vertices;
    return [{ x: t.x, y: t.y }, { x: t.x + t.w, y: t.y + (t.slope || 0) }, { x: t.x + t.w, y: t.y + t.h }, { x: t.x, y: t.y + t.h }];
}
export function polygonArea(v:Vec[]){let a=0;for(let i=0;i<v.length;i++){const p=v[i],q=v[(i+1)%v.length];a+=p.x*q.y-q.x*p.y;}return a*.5;}
export function canonicalPolygon(v:Vec[]){const pts=v.map(p=>({x:+p.x,y:+p.y}));if(pts.length<3||pts.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw Error('Invalid terrain polygon');return polygonArea(pts)<0?pts.reverse():pts;}
export function terrainSurfaces(t:Terrain,x:number):{y:number;slope:number;edge:number}[]{
    const v=poly(t),out:{y:number;slope:number;edge:number}[]=[];
    for(let i=0;i<v.length;i++){
        const a=v[i],b=v[(i+1)%v.length],dx=b.x-a.x;if(dx<=1e-7)continue;
        if(x<a.x-1e-7||x>b.x+1e-7)continue;
        const f=clamp((x-a.x)/dx,0,1),slope=(b.y-a.y)/dx;
        // In clockwise screen-space solids, left->right edges face upward and can support feet.
        out.push({y:a.y+(b.y-a.y)*f,slope,edge:i});
    }
    return out;
}
export function topAt(t: Terrain, x: number, reference?:number) {
    const hits=terrainSurfaces(t,clamp(x,t.x,t.x+t.w));
    if(!hits.length)return t.y;
    if(reference===undefined)return hits.reduce((a,b)=>a.y<=b.y?a:b).y;
    return hits.reduce((a,b)=>Math.abs(a.y-reference)<=Math.abs(b.y-reference)?a:b).y;
}
export function terrainSlopeAt(t:Terrain,x:number,reference?:number){const h=terrainSurfaces(t,clamp(x,t.x,t.x+t.w));if(!h.length)return 0;return (reference===undefined?h.reduce((a,b)=>a.y<=b.y?a:b):h.reduce((a,b)=>Math.abs(a.y-reference)<=Math.abs(b.y-reference)?a:b)).slope;}
export function terrainContains(t:Terrain,x:number,y:number,epsilon=0){
    if(t.broken||x<t.x-epsilon||x>t.x+t.w+epsilon||y<t.y-epsilon||y>t.y+t.h+epsilon)return false;
    const v=poly(t);let inside=false,minD=Infinity;
    for(let i=0,j=v.length-1;i<v.length;j=i++){
        const a=v[j],b=v[i],dx=b.x-a.x,dy=b.y-a.y,n=dx*dx+dy*dy,q=n?clamp(((x-a.x)*dx+(y-a.y)*dy)/n,0,1):0;
        const ex=x-a.x-q*dx,ey=y-a.y-q*dy;minD=Math.min(minD,ex*ex+ey*ey);
        if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
    }
    return inside||epsilon>=0&&minD<=epsilon*epsilon;
}
export function terrainRectIntersects(t:Terrain,x:number,y:number,w:number,h:number,epsilon=.05){
    if(t.broken||x+w<=t.x+epsilon||x>=t.x+t.w-epsilon||y+h<=t.y+epsilon||y>=t.y+t.h-epsilon)return false;
    const v=poly(t),insideRect=(p:Vec)=>p.x>x+epsilon&&p.x<x+w-epsilon&&p.y>y+epsilon&&p.y<y+h-epsilon;
    if(v.some(insideRect))return true;
    const corners=[[x+epsilon,y+epsilon],[x+w-epsilon,y+epsilon],[x+w-epsilon,y+h-epsilon],[x+epsilon,y+h-epsilon]];
    if(corners.some(([px,py])=>terrainContains(t,px,py,0)))return true;
    for(let i=0;i<v.length;i++)if(segRect(v[i],v[(i+1)%v.length],x+epsilon,y+epsilon,Math.max(0,w-2*epsilon),Math.max(0,h-2*epsilon)))return true;
    return false;
}
export function segRect(a: Vec, b: Vec, x: number, y: number, w: number, h: number, pad = 0): { t: number; n: Vec; } | null {
    let lo = 0, hi = 1, n = { x: 0, y: -1 };
    const d = { x: b.x - a.x, y: b.y - a.y };
    for (const [p, v, min, max, axis] of [[a.x, d.x, x - pad, x + w + pad, 0], [a.y, d.y, y - pad, y + h + pad, 1]] as number[][]) {
        if (Math.abs(v) < 1e-8) { if (p < min || p > max) return null; continue; }
        let t1 = (min - p) / v, t2 = (max - p) / v, normal = v > 0 ? -1 : 1;
        if (t1 > t2) [t1, t2] = [t2, t1];
        if (t1 > lo) { lo = t1; n = axis === 0 ? { x: normal, y: 0 } : { x: 0, y: normal }; }
        hi = Math.min(hi, t2); if (lo > hi) return null;
    }
    return lo >= 0 && lo <= 1 ? { t: lo, n } : null;
}

// Exact snapshot validation deliberately supports in-place authored vertex edits.
const edgeGroupsCache=new WeakMap<Vec[],{coords:number[];groups:{lo:number;hi:number;left:number;right:number;top:number;bottom:number;span:number}[]}>();
function edgeGroups(pts:Vec[]){
 let c=edgeGroupsCache.get(pts),valid=!!c&&c.coords.length===pts.length*2;
 if(valid)for(let i=0;i<pts.length;i++)if(c!.coords[i*2]!==pts[i].x||c!.coords[i*2+1]!==pts[i].y){valid=false;break;}
 if(valid)return c!.groups;
 const coords:number[]=[],groups:{lo:number;hi:number;left:number;right:number;top:number;bottom:number;span:number}[]=[];
 for(const p of pts)coords.push(p.x,p.y);
 for(let lo=0;lo<pts.length;lo+=16){const hi=Math.min(lo+16,pts.length);let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity,span=0;
  for(let i=lo;i<hi;i++){const p=pts[i],q=pts[(i+1)%pts.length];left=Math.min(left,p.x,q.x);right=Math.max(right,p.x,q.x);top=Math.min(top,p.y,q.y);bottom=Math.max(bottom,p.y,q.y);span=Math.max(span,Math.abs(q.x-p.x)+Math.abs(q.y-p.y));}
  groups.push({lo,hi,left,right,top,bottom,span});
 }
 edgeGroupsCache.set(pts,{coords,groups});return groups;
}

function indexedSegmentTerrain(a: Vec, b: Vec, t: Terrain, pad = 0, skipEdges?: number[]): { t: number; n: Vec; } | null {
    if (!skipEdges && !t.vertices?.length && !t.slope) return segRect(a,b,t.x,t.y,t.w,t.h,pad);
    const pts=poly(t),dx=b.x-a.x,dy=b.y-a.y;let best:{t:number;n:Vec}|null=null;
    const left=Math.min(a.x,b.x)-pad,right=Math.max(a.x,b.x)+pad,top=Math.min(a.y,b.y)-pad,bottom=Math.max(a.y,b.y)+pad;
    const groups=pts.length>=32?edgeGroups(pts):[{lo:0,hi:pts.length,left:-Infinity,right:Infinity,top:-Infinity,bottom:Infinity,span:Infinity}];
    const groupLeft=Math.min(a.x,b.x)-Math.abs(pad),groupRight=Math.max(a.x,b.x)+Math.abs(pad),groupTop=Math.min(a.y,b.y)-Math.abs(pad),groupBottom=Math.max(a.y,b.y)+Math.abs(pad);
    for(const group of groups){
      // Deliberately wider than the original per-edge gate, including signed
      // padding and floating-point reassociation of the maximum edge span.
      const margin=2e-7+2e-8*(Math.abs(dx)+Math.abs(dy)+group.span);
      if(group.right<groupLeft-margin||group.left>groupRight+margin||group.bottom<groupTop-margin||group.top>groupBottom+margin)continue;
      for(let i=group.lo;i<group.hi;i++){
        if(skipEdges?.includes(i))continue;
        const p=pts[i],q=pts[(i+1)%pts.length],ex=q.x-p.x,ey=q.y-p.y;
        // Detailed ground contours have many distant edges. Reject those before
        // normalising; retain the narrow phase's extended endpoint tolerance.
        const margin=1e-7+1e-8*(Math.abs(dx)+Math.abs(dy)+Math.abs(ex)+Math.abs(ey));
        if(Math.max(p.x,q.x)<left-margin||Math.min(p.x,q.x)>right+margin||Math.max(p.y,q.y)<top-margin||Math.min(p.y,q.y)>bottom+margin)continue;
        const len=Math.hypot(ex,ey);if(len<1e-8)continue;
        const nx=ey/len,ny=-ex/len;
        // Critical RC11 rule: resting on or moving tangentially along a polygon must not collide with its supporting face.
        // Only motions entering the solid can hit that edge. This removes the move/jump/fire lock on polygon tops.
        if(dx*nx+dy*ny>=-1e-8)continue;
        const px=p.x+nx*pad,py=p.y+ny*pad,den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)continue;
        const st=((px-a.x)*ey-(py-a.y)*ex)/den,et=((px-a.x)*dy-(py-a.y)*dx)/den;
        if(st>=-1e-8&&st<=1+1e-8&&et>=-1e-8&&et<=1+1e-8&&(!best||st<best.t))best={t:clamp(st,0,1),n:{x:nx,y:ny}};
    }
    }
    return best;
}
/** Projectile-only platform policy. Body movement and sight keep their own rules.
 * A platform catches only a swept entry through an upward-facing surface. The
 * previous centre must already be outside that padded face, so a shot travelling
 * up through a thick slab cannot be caught on its next (still embedded) step.
 * Signed normal motion, rather than vy, also handles sloped/horizontal shots. */
export function segmentProjectileTerrain(a: Vec, b: Vec, t: Terrain, pad = 0): { t: number; n: Vec; } | null {
    if (!t.oneWay || t.projectileSolid === true) return segmentTerrain(a, b, t, pad);
    return segmentPlatformSurface(a,b,t,pad);
}
/** Upward-facing platform entry for bodies, independent of weapon policy. */
function indexedSegmentPlatformSurface(a: Vec, b: Vec, t: Terrain, pad = 0): { t: number; n: Vec; } | null {
    const pts=poly(t),dx=b.x-a.x,dy=b.y-a.y,epsilon=1e-7;
    let best:{t:number;n:Vec}|null=null;
    const margin=Math.abs(pad)*2+epsilon*(2+Math.abs(dx)+Math.abs(dy));
    const left=Math.min(a.x,b.x)-margin,right=Math.max(a.x,b.x)+margin,top=Math.min(a.y,b.y)-margin,bottom=Math.max(a.y,b.y)+margin;
    const groups=pts.length>=32?edgeGroups(pts):[{lo:0,hi:pts.length,left:-Infinity,right:Infinity,top:-Infinity,bottom:Infinity,span:Infinity}];
    for(const group of groups){
      if(group.right<left||group.left>right||group.bottom<top||group.top>bottom)continue;
      for(let i=group.lo;i<group.hi;i++){
        const p=pts[i],q=pts[(i+1)%pts.length],ex=q.x-p.x,ey=q.y-p.y;
        if(Math.max(p.x,q.x)<left||Math.min(p.x,q.x)>right||Math.max(p.y,q.y)<top||Math.min(p.y,q.y)>bottom)continue;
        if(ex<=epsilon)continue; // Clockwise screen-space: only top faces.
        const len=Math.hypot(ex,ey),nx=ey/len,ny=-ex/len,approach=dx*nx+dy*ny;
        if(approach>=-epsilon)continue;
        const start=(a.x-p.x)*nx+(a.y-p.y)*ny-pad;
        if(start < -epsilon)continue;
        const time=Math.max(0,start)/-approach;
        if(time>1+epsilon||best&&time>=best.t)continue;
        const x=a.x+dx*time-nx*pad,y=a.y+dy*time-ny*pad;
        const along=((x-p.x)*ex+(y-p.y)*ey)/len;
        // Keep the existing narrow phase's footprint: boxes have padded corners,
        // authored polygon edges end at their endpoints. Extending polygon tops
        // sideways would add a new blocker where the old solid already allowed a shot.
        const cornerPad=t.vertices?.length||t.slope?0:pad;
        if(along < -cornerPad-epsilon||along > len+cornerPad+epsilon)continue;
        best={t:clamp(time,0,1),n:{x:nx,y:ny}};
    }
    }
    return best;
}
export function escapeHTML(v: unknown) { return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)); }

export const AIM_MIN=-85, AIM_MAX=265;
export function swipeAxis(delta:number,range=54){const x=clamp(delta/range,-1,1),a=Math.abs(x);return a<.12?0:Math.sign(x)*Math.pow((a-.12)/.88,1.35);}

/** Movement deadzone after intent has been chosen. Vertical aim must not suppress
 * the small lateral movement deliberately requested just outside the aim cone. */
export function joystickAxes(dx:number,dy:number,range:number,wasMoving=false){
 const length=Math.hypot(dx,dy),r=Math.max(1,range),scale=length>r?r/length:1;
 const x=dx*scale/r,y=dy*scale/r;
 const threshold=wasMoving?.10:.12,moving=Math.abs(x)>threshold;
 // Keep vertical aiming independent of whether the movement axis is gated.
 const move=moving?Math.sign(x)*Math.pow((Math.abs(x)-threshold)/(1-threshold),1.1):0;
 return {x:move,y:swipeAxis(y*r,r),moving};
}

export type JoystickIntent='undecided'|'aimOnly'|'moveAim';
export interface JoystickState {
 intent:JoystickIntent; x:number; y:number; visualX:number; visualY:number;
 moving:boolean; facingIntent:number;
}
export const JOYSTICK_AIM_CONE=20, JOYSTICK_START_RATIO=.18, JOYSTICK_START_PX=8;
export const JOYSTICK_FACE_ENGAGE=.60, JOYSTICK_FACE_RELEASE=.35;
/** Deltas are CSS pixels from pointerdown, never from the pad centre. Intent is
 * latched for this pointer, including centre crossings. Facing has its own Schmitt
 * trigger. A vertical-start gesture suppresses movement only while its current
 * vector is inside the aim cone; a move-start gesture never acquires that gate. */
export function joystickGesture(dx:number,dy:number,range:number,previous?:JoystickState):JoystickState {
 const r=Math.max(1,range),length=Math.hypot(dx,dy),scale=length>r?r/length:1;
 const visualX=dx*scale/r,visualY=dy*scale/r;
 let intent=previous?.intent||'undecided';
 // Browser PointerEvent coordinates may round to float32: keep the inclusive
 // 20 degree boundary stable with a 0.001 degree numerical tolerance.
 const inAimCone=Math.atan2(Math.abs(dx),Math.abs(dy))*180/Math.PI<=JOYSTICK_AIM_CONE+.001;
 if(intent==='undecided'&&length>=Math.max(JOYSTICK_START_RATIO*r,JOYSTICK_START_PX))
  intent=inAimCone?'aimOnly':'moveAim';
 const allowMove=intent==='moveAim'||intent==='aimOnly'&&!inAimCone;
 const axes=joystickAxes(dx,dy,r,previous?.moving);
 let facingIntent=previous?.facingIntent||0;
 if(Math.abs(visualX)<JOYSTICK_FACE_RELEASE)facingIntent=0;
 else if(Math.abs(visualX)>=JOYSTICK_FACE_ENGAGE)facingIntent=Math.sign(visualX);
 return {intent,x:allowMove?axes.x:0,y:intent==='undecided'?0:axes.y,
  visualX,visualY,moving:allowMove&&axes.moving,facingIntent:intent==='aimOnly'?facingIntent:0};
}

export function segmentTerrain(a: Vec, b: Vec, t: Terrain, pad = 0, skipEdges?: number[]): { t: number; n: Vec; } | null {
    if(t.vertices && t.vertices.length>=32)return indexedSegmentTerrain(a,b,t,pad,skipEdges);
    if (!skipEdges && !t.vertices?.length && !t.slope) return segRect(a,b,t.x,t.y,t.w,t.h,pad);
    const pts=poly(t),dx=b.x-a.x,dy=b.y-a.y;let best:{t:number;n:Vec}|null=null;
    const left=Math.min(a.x,b.x)-pad,right=Math.max(a.x,b.x)+pad,top=Math.min(a.y,b.y)-pad,bottom=Math.max(a.y,b.y)+pad;
    for(let i=0;i<pts.length;i++){
        if(skipEdges?.includes(i))continue;
        const p=pts[i],q=pts[(i+1)%pts.length],ex=q.x-p.x,ey=q.y-p.y;
        // Detailed ground contours have many distant edges. Reject those before
        // normalising; retain the narrow phase's extended endpoint tolerance.
        const margin=1e-7+1e-8*(Math.abs(dx)+Math.abs(dy)+Math.abs(ex)+Math.abs(ey));
        if(Math.max(p.x,q.x)<left-margin||Math.min(p.x,q.x)>right+margin||Math.max(p.y,q.y)<top-margin||Math.min(p.y,q.y)>bottom+margin)continue;
        const len=Math.hypot(ex,ey);if(len<1e-8)continue;
        const nx=ey/len,ny=-ex/len;
        // Critical RC11 rule: resting on or moving tangentially along a polygon must not collide with its supporting face.
        // Only motions entering the solid can hit that edge. This removes the move/jump/fire lock on polygon tops.
        if(dx*nx+dy*ny>=-1e-8)continue;
        const px=p.x+nx*pad,py=p.y+ny*pad,den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)continue;
        const st=((px-a.x)*ey-(py-a.y)*ex)/den,et=((px-a.x)*dy-(py-a.y)*dx)/den;
        if(st>=-1e-8&&st<=1+1e-8&&et>=-1e-8&&et<=1+1e-8&&(!best||st<best.t))best={t:clamp(st,0,1),n:{x:nx,y:ny}};
    }
    return best;
}

export function segmentPlatformSurface(a: Vec, b: Vec, t: Terrain, pad = 0): { t: number; n: Vec; } | null {
    if(t.vertices && t.vertices.length>=32)return indexedSegmentPlatformSurface(a,b,t,pad);
    const pts=poly(t),dx=b.x-a.x,dy=b.y-a.y,epsilon=1e-7;
    let best:{t:number;n:Vec}|null=null;
    for(let i=0;i<pts.length;i++){
        const p=pts[i],q=pts[(i+1)%pts.length],ex=q.x-p.x,ey=q.y-p.y;
        if(ex<=epsilon)continue; // Clockwise screen-space: only top faces.
        const len=Math.hypot(ex,ey),nx=ey/len,ny=-ex/len,approach=dx*nx+dy*ny;
        if(approach>=-epsilon)continue;
        const start=(a.x-p.x)*nx+(a.y-p.y)*ny-pad;
        if(start < -epsilon)continue;
        const time=Math.max(0,start)/-approach;
        if(time>1+epsilon||best&&time>=best.t)continue;
        const x=a.x+dx*time-nx*pad,y=a.y+dy*time-ny*pad;
        const along=((x-p.x)*ex+(y-p.y)*ey)/len;
        // Keep the existing narrow phase's footprint: boxes have padded corners,
        // authored polygon edges end at their endpoints. Extending polygon tops
        // sideways would add a new blocker where the old solid already allowed a shot.
        const cornerPad=t.vertices?.length||t.slope?0:pad;
        if(along < -cornerPad-epsilon||along > len+cornerPad+epsilon)continue;
        best={t:clamp(time,0,1),n:{x:nx,y:ny}};
    }
    return best;
}
