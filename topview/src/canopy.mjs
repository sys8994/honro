// A tall prop has two paint surfaces. Column strips place each near eave or
// bough at the depth of its own ground footprint in the 2:1 view.
export function sceneryParts(o,at,images){
  const full=images.get(o.asset),tree=o.asset.startsWith('pine'),roof=o.asset==='shrine'||o.asset==='ruin_gate';
  const x=at.x-o.width*o.anchor[0],y=at.y-o.height*o.anchor[1];
  const base={image:(tree||roof)?images.get(o.asset+'-base'):full,x,y,width:o.width,height:o.height,depth:o.deck?-1e6:at.y,part:'base'};
  const result=[base];if(!tree&&!roof&&!o.deck)return result;
  const high=images.get(o.deck?o.asset+'-near':o.asset+(tree?'-crown':'-roof'));
  if(tree||roof){
    // Keep each connected crown or tiled roof intact when adjacent trees overlap.
    result.push({image:high,x,y,width:o.width,height:o.height,depth:at.y+o.width*(tree?.15:o.asset==='ruin_gate'?.06:.13),part:tree?'crown':'roof'});
    return result;
  }
  const n=10;
  for(let j=0;j<n;j++){
    const start=Math.round(j*high.width/n),end=Math.round((j+1)*high.width/n),f=(start+end)/2/high.width;
    const front=(o.asset==='bridge_ne'?1:-1)*(.5-f)*.50*o.width+o.deck.width*.46;
    result.push({image:high,x:x+start/high.width*o.width,y,width:(end-start)/high.width*o.width,
      height:o.height,sx:start,sw:end-start,depth:at.y+front,part:o.deck?'rail':roof?'roof':'crown'});
  }
  return result;
}
export function drawScenery(c,p,time=0){
  const crown=p.part==='crown';
  if(crown){const sway=.009*Math.sin(time*1.18+p.x*.023)+.004*Math.sin(time*.63+p.y*.017);
    c.save();c.transform(1,0,sway,1,-sway*(p.y+p.height*.9),0);}
  if(p.sw)c.drawImage(p.image,p.sx,0,p.sw,p.image.height,p.x,p.y,p.width,p.height);
  else c.drawImage(p.image,p.x,p.y,p.width,p.height);
  if(crown)c.restore();
}
