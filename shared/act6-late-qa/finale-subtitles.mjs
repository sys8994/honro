export function createFinaleSubtitle(scene,engine,authorize,observe){
 const b=engine.b,native=scene.render,seen=new Set();
 let line=null,age=0;
 function paint(s){
  const c=s.ctx,w=s.canvas.clientWidth||s.canvas.width,h=s.canvas.clientHeight||s.canvas.height;
  if(!c||!line||w<280||h<250)return;
  const dpr=s.canvas.width/w, width=Math.min(620,w-28), left=(w-width)/2;
  const y=Math.round(h*.105), font=w<600?14:17, row=font+7;
  c.save();try{
   c.setTransform(dpr,0,0,dpr,0,0);c.font=font+'px "Noto Sans KR", "Noto Sans CJK KR", sans-serif';c.textBaseline='top';
   const lines=[];let last='';
   for(const word of line.text.split(' ')){
    const trial=last?last+' '+word:word;
    if(last&&c.measureText(trial).width>width-30){lines.push(last);last=word;}else last=trial;
   }
   if(last)lines.push(last);
   c.fillStyle='#0f1724ed';c.fillRect(left,y,width,22+(lines.length+1)*row);
   c.fillStyle='#e2bea0';c.fillText(line.speaker,left+14,y+10);
   c.fillStyle='#fff2e3';lines.forEach((t,i)=>c.fillText(t,left+14,y+10+(i+1)*row));
  }finally{c.restore();}
 }
 function wrapped(e,dt,...args){
  const result=native.call(this,e,dt,...args);
  if(this!==scene||e!==engine||e.b!==b||!authorize()||['lost','won'].includes(b.phase))return result;
  const cue=observe();
  if(cue?.id&&!seen.has(cue.id)){seen.add(cue.id);line=cue;age=0;}
  if(Number.isFinite(dt))age+=Math.max(0,Math.min(dt,.1));
  if(age>3.7)line=null;
  paint(scene);return result;
 }
 scene.render=wrapped;
 return function restore(){if(scene.render!==wrapped)return false;scene.render=native;return true;};
}
