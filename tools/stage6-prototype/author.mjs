/** Unshipped Stage 6 geometry overlay. No production build path imports this.
 * It deliberately preserves old BODY art, so visual/physics alignment is NOT
 * claimed. Use only for clearly labelled compiled-map and App diagnostics. */
export const nodes=[[0,1770],[550,1870],[1250,2050],[1700,2220],[1950,2240],[2350,2550],[3000,3170],[3500,3300],[4100,3270],[4700,3090],[5350,2800],[6600,2450]];
export function floor(x){let i=0;while(i<nodes.length-2&&x>nodes[i+1][0])i++;const[a,z]=[nodes[i],nodes[i+1]],f=(x-a[0])/(z[0]-a[0]);return a[1]+f*(z[1]-a[1]);}
export function authorStage6Prototype(input){const project=structuredClone(input),s=project.stages.find(x=>x.metadata?.stageId===6);if(!s)throw Error('Stage 6 missing');const t=s.terrains.find(x=>x.id==='lower-road'),i=t.points.findIndex(p=>p.x===6600);if(i<1)throw Error('Expected terrain-domain contour');const xs=new Set(nodes.map(x=>x[0]));for(let x=0;x<=6600;x+=30)xs.add(x);const top=[...xs].sort((a,b)=>a-b).map(x=>({x,y:floor(x)})),outer=t.points.slice(i+1).map(p=>({...p}));for(const p of outer){if(p.x===7100&&p.y<4000)p.y=2360;if(p.x===-500&&p.y<4000)p.y=1850;if(p.x===-1000&&p.y<4000)p.y=1950;}t.points=[...top,...outer];
 const ground=new Set(['p-archer','p-mage','p-knight','foe-1','foe-2','foe-5','foe-9','objective','ally-ropeguard','midboss-stage6']);for(const u of s.units)if(ground.has(u.id))u.y=u.spawnY=floor(u.x);
 const clones=s.design?.positioning?.clusterPositions||{};for(const id of ['foe-1-cluster','foe-5-cluster','foe-9-cluster'])if(clones[id])clones[id].y=floor(clones[id].x);
 const water=s.materials.find(m=>m.id==='place6-ravine-water');if(water)Object.assign(water,{x1:3385,x2:4100,surfaceY:3270,depth:0});const exit=s.markers.find(m=>m.type==='exit');if(exit)exit.y=floor(exit.x);return project;}
