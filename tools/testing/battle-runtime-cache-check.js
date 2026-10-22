()=>{
    const canvas=document.createElement('canvas');canvas.width=80;canvas.height=60;
    const s=new HonroScene(canvas),c=canvas.getContext('2d'),slot='_screenWorldCache';
    const paint=color=>cc=>{cc.fillStyle=color;cc.fillRect(0,0,80,60);};
    const check=(v,message)=>{if(!v)throw new Error(message);};
    const use=(key,color)=>s._screenRaster(c,key,80,60,paint(color),slot);
    check(!use('red','#ff0000'),'First view remains live');check(use('red','#ff0000'),'Second identical view creates cache');
    const first=s[slot].canvas;
    check(!use('blue','#0000ff'),'New content invalidates cached pixels immediately');
    check(use('blue','#0000ff'),'Stable new content is painted');
    check(s[slot].canvas===first,'Same-size content/camera change reuses a surface');
    check(c.getImageData(20,20,1,1).data[2]===255,'Reused buffer has new pixels');
    const resized=()=>s._screenRaster(c,'resized',160,60,paint('#00ff00'),slot);
    canvas.width=160;check(!resized(),'Resize remains live');check(first.width===1&&first.height===1,'Resize releases old backing');check(resized(),'Resized stable view paints');
    c.globalAlpha=.5;check(!resized(),'Non-opaque context stays live');c.globalAlpha=1;
    c.globalCompositeOperation='multiply';check(!resized(),'Non-default composition stays live');c.globalCompositeOperation='source-over';
    const large={globalAlpha:1,globalCompositeOperation:'source-over',canvas:{width:3001,height:2000},getTransform:()=>c.getTransform()};
    check(!s._screenRaster(large,'large',3001,2000,paint('#fff'),slot),'Large first view stays live');
    check(!s._screenRaster(large,'large',3001,2000,paint('#fff'),slot),'6M pixel limit prevents allocation');
    check(!s[slot].canvas,'Oversized viewport retains no old raster');
    return {passed:true,checks:['camera/content invalidation','new pixel replacement','same-size surface reuse','resize release','alpha fallback','composite fallback','6M pixel cap'],stats:s.renderCacheStats()};
}
