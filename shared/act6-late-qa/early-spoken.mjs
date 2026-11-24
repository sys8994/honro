export function bindEarlySpoken({app,engine:e,scene,session,authorize,captions}){
 const b=e?.b,stage=b?.honroStage,original=scene?.render;
 if(stage<51||stage>57||typeof original!=='function'||!authorize())return null;
 const seen=new Set(),queue=[];let age=0,drawn=0,shown=null;
 const current=()=>authorize()&&app.engine===e&&app.scene===scene&&e.b===b;
 function emit(event){
  if(!current()||seen.has(event))return false;
  const rows=captions[stage]?.[event];if(!rows)return false;
  seen.add(event);queue.push(...rows.map((r,i)=>({...r,id:event+':'+i})));return true;
 }
 function render(en,dt,...tail){
  const ret=original.call(this,en,dt,...tail);
  if(this!==scene||en!==e||!current()||app.dialogue||app.modal?.classList.contains('open')||b.phase==='lost'||b.projectiles?.length||['enemy','flight','resolve','review'].includes(b.phase))return ret;
  const c=scene.ctx,w=scene.canvas?.clientWidth||scene.canvas?.width,h=scene.canvas?.clientHeight||scene.canvas?.height;
  if(!c||w<280||h<250)return ret;
  if(!shown&&queue.length){shown=queue.shift();age=0;}
  if(!shown)return ret;
  if(Number.isFinite(dt))age+=Math.max(0,Math.min(.1,dt));
  if(age>3.8){shown=null;return ret;}
  const dpr=scene.canvas.width/w,width=Math.min(w-28,600),left=(w-width)/2,y=Math.round(h*.105),font=w<600?14:17,row=font+7;
  c.save();try{
   c.setTransform(dpr,0,0,dpr,0,0);c.textBaseline='top';c.font=font+'px "Noto Sans KR", "Noto Sans CJK KR", sans-serif';
   const lines=[];let p='';
   for(const word of shown.text.split(' ')){const trial=p?p+' '+word:word;if(p&&c.measureText(trial).width>width-28){lines.push(p);p=word;}else p=trial;}
   if(p)lines.push(p);
   c.fillStyle='#0f1724ed';c.fillRect(left,y,width,22+(lines.length+1)*row);
   c.fillStyle='#e2bea0';c.fillText(shown.label,left+14,y+10);
   c.fillStyle='#fff2e3';for(let i=0;i<lines.length;i++)c.fillText(lines[i],left+14,y+10+(i+1)*row);
   drawn++;
  }finally{c.restore();}
  return ret;
 }
 scene.render=render;
 return Object.freeze({emit,read:()=>({shown,drawn,seen:[...seen]}),detach(){queue.length=0;shown=null;if(scene.render===render)scene.render=original;}});
}
