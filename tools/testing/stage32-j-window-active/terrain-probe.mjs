// Run only AFTER all timed Scene frames. Separate direct-terrain sequence.
// Not a Scene-internal observer or full protected-layer contribution oracle.
export function captureFieldWindowTerrain({battle,frames,width,height}){
 const helper=globalThis.HonroStage32FoundationArt,fl=battle.honroLandmarks.find(l=>l.asset?.id==='act4-handoff:32:foundation'),bl=battle.honroLandmarks.find(l=>l.asset?.id==='act4-handoff:32:body-shared-material');
 if(!helper||!fl||!bl)throw Error('Missing original terrain sources');
 const tc=document.createElement('canvas');tc.width=width;tc.height=height;const c=tc.getContext('2d'),masks={},rows=[],before=JSON.stringify(battle);helper.clear();
 for(const frame of frames){
  if(frame.name==='cold')helper.clear();
  const {x,y,scale}=frame.camera;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,width,height);
  c.setTransform(scale,0,0,scale,width/2-x*scale,height/2-y*scale);
  const route={sceneScale:scale,nativeLive:scale>1.05};
  if(!helper.draw(c,fl,battle,false,route)||!helper.draw(c,bl,battle,false,route))throw Error('Terrain source fallback');
  masks['terrain-'+frame.name]=tc.toDataURL('image/png');
  const rgba=c.getImageData(0,0,width,height).data;let empty=0,partial=0;for(let i=3;i<rgba.length;i+=4){empty+=rgba[i]===0;partial+=rgba[i]>0&&rgba[i]<255;}
  rows.push({name:frame.name,camera:frame.camera,width,height,empty,partial,stats:helper.stats()});
 }
 if(JSON.stringify(battle)!==before)throw Error('Terrain probe mutated original battle');helper.clear();
 return{masks,rows,scope:'DPR1 direct original FOUNDATION+BODY sequence after timings. Same recorded cameras and cache-reset boundaries; not full foreground contribution or actual Scene-internal state proof.'};
}
