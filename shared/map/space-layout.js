(function(G){'use strict';
// Read-only validation shared by authoring, runtime imports and Workshop.
// Visual annotations may outlive a deleted decoration; physical surface and
// prerequisite references may not. Drawing code never trusts collection types.
function validateSpace(st){
 const s=st?.design?.space;if(!s)return['Missing design.space'];
 if(s.version!==1)return['Unsupported spatial layout version'];
 const errors=[],fail=m=>errors.push((st.id||'stage')+': '+m);
 const required=['rooms','surfaces','connections','routes','encounterSites'];
 const optional=['landmarks','scenery','lights','views','water'];
 if(!required.every(k=>Array.isArray(s[k]))||!s.sites||typeof s.sites!=='object'||Array.isArray(s.sites))return['Invalid spatial layout collections'];
 for(const k of optional)if(s[k]!==undefined&&!Array.isArray(s[k]))fail('Invalid spatial '+k+' collection');
 if(errors.length)return errors;
 if(!Array.isArray(st.terrains)||!Array.isArray(st.units))return['Missing canonical spatial content'];
 for(const k of [...required,...optional])if((s[k]||[]).some(v=>!v||typeof v!=='object'||Array.isArray(v)))fail('Invalid '+k+' record');
 if(errors.length)return errors;
 const terrains=new Map(st.terrains.map(t=>[t.id,t])),surfaces=new Map(s.surfaces.map(v=>[v.id,v]));
 const rooms=new Set(s.rooms.map(v=>v.id)),routes=new Set(s.routes.map(v=>v.id));
 const validId=id=>typeof id==='string'&&id.length>0&&id.length<=200;
 const unique=(xs,label)=>{const ids=xs.map(v=>v.id);if(ids.some(id=>!validId(id)))fail('Missing '+label+' ID');if(new Set(ids).size!==ids.length)fail('Duplicate '+label+' ID');};
 for(const k of [...required,'landmarks','scenery','lights','views','water'])unique(s[k]||[],k);
 if(!Number.isInteger(s.geometryRevision)||s.geometryRevision<1)fail('Invalid spatial geometry revision');
 if(st.initialState?.honroAct2GeometryRevision!==undefined&&st.initialState.honroAct2GeometryRevision!==s.geometryRevision)fail('Spatial revision mismatch');
 const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 const inWorld=p=>finite(p)&&p.x>=-1e-5&&p.x<=st.width+1e-5&&p.y>=-1e-5&&p.y<=st.height+1e-5;
 const anchor=(p,label,requiredSurface=true)=>{
  if(!finite(p))fail(label+' has non-finite anchor');else if(!inWorld(p))fail(label+' anchor is outside playable bounds');
  if(requiredSurface&&(!validId(p?.surfaceId)||!surfaces.has(p.surfaceId)))fail(label+' references missing surface '+p?.surfaceId);
 };
 const requirements=(list,label)=>{if(list===undefined)return;if(!Array.isArray(list)){fail(label+' has invalid prerequisites');return;}
  for(const r of list){if(!r||!terrains.has(r.terrainId))fail(label+' references missing prerequisite terrain '+r?.terrainId);if(!['broken','restored'].includes(r?.state))fail(label+' has invalid prerequisite state');if(r?.objectiveId!==undefined&&!validId(r.objectiveId))fail(label+' has invalid prerequisite objective');}
 };
 for(const surface of s.surfaces){
  const t=terrains.get(surface.terrainId);if(!t){fail('Missing terrain '+surface.terrainId);continue;}
  if(!Array.isArray(t.points)||!Array.isArray(surface.edgeIndices)||!surface.edgeIndices.length||surface.edgeIndices.some(j=>!Number.isInteger(j)||j<0||j>=t.points.length))fail('Invalid edges on '+surface.id);
  if(!Array.isArray(surface.roomIds)||!surface.roomIds.length||surface.roomIds.some(id=>!rooms.has(id)))fail('Missing room on '+surface.id);
 }
 for(const r of s.rooms){
  if(!finite(r.bounds)||![r.bounds.w,r.bounds.h].every(n=>Number.isFinite(n)&&n>=0))fail('Invalid bounds '+r.id);
  if(!Array.isArray(r.terrainIds)||!Array.isArray(r.ceilingIds)){fail('Invalid room surfaces '+r.id);continue;}
  for(const id of [...r.terrainIds,...r.ceilingIds])if(!terrains.has(id))fail('Missing room terrain '+id);
  if(!['open','cave','transition'].includes(r.sky))fail('Invalid room sky mode '+r.id);
 }
 for(const route of s.routes){
  if(!['required','optional-jump','optional-walk','return'].includes(route.kind))fail('Invalid route kind '+route.id);
  if(!Array.isArray(route.anchors)||route.anchors.length<2){fail('Short route '+route.id);continue;}
  route.anchors.forEach(p=>anchor(p,route.id));requirements(route.requires,route.id);
 }
 for(const c of s.connections){
  if(!rooms.has(c.from)||!rooms.has(c.to))fail('Broken room connection '+c.id);
  if(!routes.has(c.routeId))fail('Missing route '+c.routeId);
  if(!['walk','gated-walk','optional-jump'].includes(c.kind))fail('Invalid connection kind '+c.id);
  anchor(c.entry,c.id);anchor(c.exit,c.id);requirements(c.requires,c.id);
 }
 for(const [id,site] of Object.entries(s.sites)){
  if(!site||typeof site!=='object'){fail('Invalid site '+id);continue;}
  if(!rooms.has(site.roomId))fail('Missing site room '+id);anchor(site,id);anchor(site.standing,id+' standing');
  if(site.target){anchor(site.target,id+' target',false);if(!terrains.has(site.target.terrainId))fail('Missing target '+id);}
 }
 for(const e of s.encounterSites){
  if(!st.units.some(u=>u.id===e.unitId))fail('Missing encounter unit '+e.unitId);anchor(e,e.id);if(!rooms.has(e.roomId))fail('Missing encounter room '+e.id);
 }
 for(const k of ['landmarks','scenery'])for(const v of s[k]||[]){
  if(!finite(v)||!Number.isFinite(v.scale)||v.scale<=0)fail('Invalid '+k+' transform '+v.id);
  if(v.roomId!==undefined&&!rooms.has(v.roomId))fail('Missing '+k+' room '+v.id);
  if(v.surfaceId!==undefined&&!surfaces.has(v.surfaceId))fail('Missing '+k+' surface '+v.id);
  for(const key of ['assetId','elementId','kind'])if(v[key]!==undefined&&!validId(v[key]))fail('Invalid '+k+' '+key+' '+v.id);
  if(v.footOffset!==undefined&&!Number.isFinite(v.footOffset))fail('Invalid '+k+' foot offset '+v.id);
 }
 for(const v of s.lights||[]){if(!finite(v)||v.radius!==undefined&&(!Number.isFinite(v.radius)||v.radius<=0))fail('Invalid light '+v.id);if(v.roomId!==undefined&&!rooms.has(v.roomId))fail('Missing light room '+v.id);if(v.color!==undefined&&(typeof v.color!=='string'||!/^#[\da-f]{6}([\da-f]{2})?$/i.test(v.color)))fail('Invalid light color '+v.id);}
 for(const v of s.views||[]){if(!finite(v)||!Number.isFinite(v.zoom)||v.zoom<=0)fail('Invalid view '+v.id);if(v.roomId!==undefined&&!rooms.has(v.roomId))fail('Missing view room '+v.id);}
 for(const v of s.water||[]){if(!terrains.has(v.terrainId)||!surfaces.has(v.surfaceId)||!rooms.has(v.roomId))fail('Invalid water reference '+v.id);}
 const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 for(const t of st.terrains){const ps=t.points;if(!Array.isArray(ps)){fail('Missing canonical polygon '+t.id);continue;}for(let i=0;i<ps.length;i++)for(let j=i+2;j<ps.length;j++){if(i===0&&j===ps.length-1)continue;const a=ps[i],b=ps[(i+1)%ps.length],c=ps[j],d=ps[(j+1)%ps.length];if(cross(a,b,c)*cross(a,b,d)<-1e-6&&cross(c,d,a)*cross(c,d,b)<-1e-6)fail('Self-intersection '+t.id+' edges '+i+'/'+j);}}
 return errors;
}
function validate(st){try{return validateSpace(st);}catch(error){return[(st?.id||'stage')+': malformed spatial metadata ('+error.message+')'];}}
G.HonroSpaceLayout={VERSION:1,validate};
})(globalThis);
