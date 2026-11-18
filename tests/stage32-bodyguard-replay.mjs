/** Independent static geometry support, using actual recorded blit args/clips. */
export function replayBlitSupport(info,coverageD,apronD,width,height){
 const coverage=new Path2D(coverageD),apron=new Path2D(apronD),outputs=[];
 for(const mode of ['coverage','binary-tile-support']){
  const screen=document.createElement('canvas');screen.width=width;screen.height=height;const c=screen.getContext('2d'),cache=new Map(),seen=new Set();
  for(const row of info.rows){const key=JSON.stringify(row);if(seen.has(key))continue;seen.add(key);const source=info.tiles.find(t=>t.id===row.tile);if(source.matrix[0]<.05)continue;let tile=cache.get(source.id);if(!tile){tile=document.createElement('canvas');tile.width=source.canvas[0];tile.height=source.canvas[1];const t=tile.getContext('2d');t.setTransform(...source.matrix);t.clip(apron);t.scale(2.2,2.2);t.clip(coverage);t.setTransform(1,0,0,1,0,0);t.fillStyle='#fff';t.fillRect(0,0,tile.width,tile.height);if(mode==='binary-tile-support'){const im=t.getImageData(0,0,tile.width,tile.height);for(let k=0;k<im.data.length;k+=4)if(im.data[k+3]){im.data[k]=im.data[k+1]=im.data[k+2]=im.data[k+3]=255;}t.putImageData(im,0,0);}cache.set(source.id,tile);}
   c.save();for(const clip of row.clips){if(clip.args.some(a=>a==='Path2D')||!clip.rects.length)throw Error('Unrecorded non-rectangular screen clip; do not approximate');c.beginPath();for(const rect of clip.rects){c.setTransform(...rect.matrix);c.rect(...rect.args);}c.clip(clip.args[0]||'nonzero');}c.setTransform(...row.matrix);c.globalAlpha=row.globalAlpha;c.globalCompositeOperation=row.composite;c.imageSmoothingEnabled=row.smoothing;c.imageSmoothingQuality=row.smoothingQuality;c.drawImage(tile,...row.args);c.restore();
  }
  outputs.push({mode,png:screen.toDataURL('image/png'),pixel253_648:Array.from(c.getImageData(253,648,1,1).data)});
 }
 return {scope:'Recorded numeric tile blit/clips replay. Binary mode is the resampled support of nonzero tile coverage, not an alpha magnitude or expanded geometric radius. Legacy coverage and strict original checks retained.',outputs};
}
