({width,height,expectedDpr})=>{
 const a=HonroApp,s=a.scene,e=a.engine,c=s.canvas,old=c.width,oldKey=s._screenWorldCache?.key;
 if(Math.abs(devicePixelRatio-expectedDpr)>.01)throw Error(`DPR change did not apply: ${devicePixelRatio}`);
 s.render(e,0,'',.6,false,0);const next=c.width;if(next===old)throw Error('DPR transition did not resize backing canvas');
 if(s._screenWorldCache?.key===oldKey||s._screenWorldCache?.canvas)throw Error('DPR transition did not evict screen raster');
 s.render(e,0,'',.6,false,0);if(!s._screenWorldCache?.canvas)throw Error('DPR transition failed to rebuild raster');
 return {devicePixelRatio,oldWidth:old,newWidth:next,newHeight:c.height};
}
