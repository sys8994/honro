function installWestUpper({bar,status,canvas,baseRaw,detailRaw,gateRaw,onProject,closeGate}){
 let q=null,raw=null,dispose=null,busy=false,showing=false;
 const controls=document.createElement('span');controls.id='nativeWestUpperControls';
 const bad=s=>{status.westUpperError=s;toast(s)},ok=s=>{status.westUpperStatus=s;toast(s)};
 const stop=()=>{status.westUpperMode='0';if(dispose){dispose();dispose=null}};
 async function mount(parent,records=[]){
  stop();closeGate();q=parent;status.westUpperMode='1';status.westUpperError='';showing=false;
  dispose=FW.mount({canvas,toolbar:controls,base:q.base,record:records,getCamera:()=>stageView,
   isActive:()=>status.westUpperMode==='1'&&currentTab==='stage'&&project.activeStageId==='stage-42-whole-native-blockout',
   report:bad,show:w=>{status.westUpperCount=String(w.details.length);if(!showing&&w.pending?.points.length>1){invalidateRuntime();renderStage();drawTransientLine(w.pending.points.map(([x,y])=>({x,y})),'#73acb3');}},
   preview:d=>{const {project:p}=FW.westProject(q,d.map(FW.clean));showing=true;previewProject=p;invalidateRuntime();renderStage();ok('west-preview-off-project');},
   save:d=>{const v=d.map(FW.clean),built=FW.westProject(q,v),r=FW.westSave(q,v);onProject(built.project);raw=r;showing=false;ok('west-manual-save');}
  });
 }
 async function parent(){
  const prev=project,p=await FW.westParents(HonroMaps,baseRaw(),detailRaw(),gateRaw(),FG.pack.pinnedGateParents,FG.pack.gateOpen);
  if(project!==prev)throw Error('West upper exact parent changed during re-open');
  return p;
 }
 const button=(name,fn)=>{const t=document.createElement('button');t.type='button';t.textContent=name;t.onclick=async e=>{if(!e.isTrusted||busy)return;busy=true;try{await fn()}catch(x){bad(x.message)}finally{busy=false}};bar.append(t);};
 button('Start Native West Upper',async()=>{await mount(await parent());ok('west-ready')});
 button('Download Native West Upper',()=>{if(!raw)throw Error('Save West Upper first');download('honro-stage42-native-west-upper-multiface.json',raw,'application/json')});
 const f=document.createElement('input');f.type='file';f.hidden=true;f.accept='.json';
 button('Open Native West Upper',()=>{status.westUpperImport='waiting';f.click()});
 f.onchange=async()=>{if(busy)return;busy=true;
  try{const file=f.files?.[0],prev=project;if(!file||file.size>6300)throw Error('Wrong bounded west face draft');
   const x=await file.text(),p=await parent(),v=FW.westOpen(p,x);if(project!==prev)throw Error('West Upper native parent changed while opening');
   await mount(p,v.records);if(Number(status.westUpperCount)!==11)throw Error('West saved editable role did not mount');
   onProject(v.project);raw=x;status.westUpperImport='opened';ok('west-opened');
  }catch(e){status.westUpperImport='error';bad(e.message)}finally{busy=false;f.value=''}};
 bar.append(f,controls);
 return stop;
}
