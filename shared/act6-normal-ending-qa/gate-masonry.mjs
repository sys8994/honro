// Stage-local, world-absolute, uncollidable vestiges of the same wet stone
// sill / snapped black timber visible at the 6-9 end ridge. No target/door/waypoint.
export function gateMasonry(b,gate,topAt){
 const terrain=b.terrain.find(t=>t.id==='return-cutout-near-body');
 if(!terrain)throw new Error('6-10 principal surface missing');
 const x=gate[0], y=gate[1], pts=(p)=>p.map(([dx,dy])=>({x:x+dx,y:topAt(terrain,x+dx)+dy}));
 const p=(fill,path)=>({fill,points:pts(path)});
 const id='act6-10-main-gate-footings-r1';
 const sill=[
  p('#59616a',[[-143,3],[-108,-.2],[-59,-.2],[-37,4],[8,2],[29,.5],[68,1],[102,0],[139,3],[130,18],[110,23],[62,18],[29,24],[-17,16],[-55,22],[-109,20],[-137,12]]),
  p('#777778',[[-137,3],[-99,1],[-83,2],[-70,7],[-91,9],[-124,9]]),
  p('#424951',[[-52,5],[-20,3],[4,6],[0,17],[-29,16],[-53,20],[-62,12]]),
  p('#74716a',[[19,3],[50,1],[74,3],[64,8],[28,11]]),
  p('#41494f',[[77,4],[106,2],[122,6],[118,13],[90,17],[73,12]])
 ];
 const ruins=[
  p('#424951',[[-143,3],[-143,-13],[-138,-29],[-132,-43],[-121,-48],[-113,-37],[-114,-24],[-107,-13],[-109,4],[-123,9],[-141,11]]),
  p('#66656a',[[-139,-19],[-133,-39],[-123,-45],[-125,-29],[-128,-22],[-128,-7],[-137,-4]]),
  p('#343a40',[[-119,-36],[-112,-30],[-115,-18],[-108,-11],[-109,7],[-123,8],[-122,-14]]),
  p('#424951',[[95,3],[99,-16],[98,-35],[110,-42],[127,-45],[137,-36],[135,-18],[141,-12],[141,5],[121,11],[102,11]]),
  p('#777671',[[102,-33],[113,-38],[126,-42],[133,-34],[118,-32],[106,-28]]),
  p('#354047',[[125,-31],[136,-33],[135,-18],[141,-12],[140,6],[129,10],[124,-5]]),
  p('#303136',[[101,-35],[102,-57],[107,-82],[114,-68],[119,-62],[117,-45],[123,-39],[114,-31]]),
  p('#5c5553',[[105,-57],[109,-73],[113,-64],[112,-53],[110,-40],[104,-39]]),
  p('#4c4743',[[-106,-14],[-91,-27],[-76,-26],[-73,-18],[-87,-14],[-104,0],[-106,3]]),
  p('#615856',[[-91,-25],[-81,-25],[-84,-19],[-101,-9],[-99,-18]])
 ];
 const points=sill.concat(ruins).flatMap(s=>s.points), xmin=Math.min(...points.map(p=>p.x)), xmax=Math.max(...points.map(p=>p.x)), ymin=Math.min(...points.map(p=>p.y)), ymax=Math.max(...points.map(p=>p.y));
 // No floating block: stumps are rear, feet below the true surface;
 // the narrow central sill is equal to or below the native collision profile.
 for(const f of sill)for(const z of f.points)if(z.y<topAt(terrain,z.x)-.25)throw Error('floating overlay sill');
 return {id,assetId:id,kind:'canonical-element',asset:{id,renderer:'shape',category:'architecture',anchor:{x:0,y:0},bounds:{x:xmin,y:ymin,w:xmax-xmin,h:ymax-ymin},collision:[],visual:sill.concat(ruins)},layer:'prop',depthLayer:'L1',visualRole:'scenery',x:0,y:0,rotation:0,scale:1,collisionIds:[]};
}
