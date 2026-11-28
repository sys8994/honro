// Extend the coast shown by the authored edge cells. These apron cells only
// paint the view beyond the movement bounds, including the two river outlets.
export function extendGround(map,padding=14) {
  const width=map.width+padding*2,height=map.height+padding*2,terrain=[];
  const clamp=(v,hi)=>Math.min(hi,Math.max(0,v));
  for(let y=-padding;y<map.height+padding;y++)for(let x=-padding;x<map.width+padding;x++){
    let source=map.terrain[clamp(y,map.height-1)*map.width+clamp(x,map.width-1)];
    if((x<0||x>=map.width||y<0||y>=map.height)&&source==='path')source='dirt';
    terrain.push(source);
  }
  const props=[];
  for(let y=-padding+1;y<map.height+padding;y+=2){
    for(let x=-padding+1;x<map.width+padding;x+=2){
      if(x>=0&&x<map.width&&y>=0&&y<map.height)continue;
      const hash=Math.abs((x*313+y*797)^(x*y*61));
      if(hash%5===0||terrain[(y+padding)*width+x+padding]==='water')continue;
      const pine=hash%3!==0;
      props.push({x:x+.2+(hash%11)*.09,y:y+.35+(hash%7)*.11,asset:pine?(hash%2?'pine_a':'pine_b'):'rock_small',width:pine?110+hash%46:36+hash%17,height:pine?108+hash%48:30,anchor:[.5,1]});
    }
  }
  return {map:{...map,width,height,terrain},offset:padding*map.tileHeight,props};
}
