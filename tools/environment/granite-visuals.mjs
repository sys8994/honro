/** Authoring-only repair: the existing solid rim is the granite silhouette. */
export const GRANITE_ASSET_IDS=['mockup-granite-large','mockup-granite-small'];
export function graniteVisuals(rock){
 if(!GRANITE_ASSET_IDS.includes(rock.id)||rock.collision?.length!==1||rock.collision[0].length!==12)
  throw Error('Expected the original twelve-point granite solid: '+rock.id);
 const p=rock.collision[0],b=rock.reference.bounds;
 const at=(x,y)=>({x:b.x+b.w*(x+1)/2,y:b.y+b.h*(1-y)});
 const mix=(a,z,t)=>({x:a.x+(z.x-a.x)*t,y:a.y+(z.y-a.y)*t});
 const plane=(points,fill)=>({type:'polygon',points:points.map(q=>({...q})),fill,stroke:null,alpha:1});
 const left=at(-.13,.61),low=at(.07,.39),right=at(.40,.68),foot=at(-.70,.08),center=at(0,.4);
 return[
  // Copy the collider, never derive or move it from a new normalized outline.
  // Keep the same six broad wet/dry/shadow faces and their established palette.
  plane(p,'#263737'),
  plane([p[1],p[2],p[3],left,at(-.48,.34),foot,p[0]],'#596b60'),
  plane([p[4],p[5],p[6],right,low,left,p[3]],'#687b70'),
  plane([p[6],p[7],p[8],p[9],p[10],right],'#3a504d'),
  plane([p[4],at(.11,.80),at(.04,.54),at(.15,.38),low,left,at(-.09,.83)],'#203739'),
  // Follow the original concave foot as well: a flat normalized bottom would
  // paint beyond the collider near its right-hand recess.
  plane([p[0],p[11],p[10],p[9],p[8],p[7],mix(p[7],center,.18),mix(p[9],center,.30),mix(p[10],center,.24),foot],'#17282b')
 ];
}
