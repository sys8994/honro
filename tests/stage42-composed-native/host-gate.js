function installGate({bar,status,canvas,baseRaw,detailRaw,onProject,closeDetail}){
 let q=null,r=null,dispose=null,showing=false;
 const controls=document.createElement('span');controls.id='nativeGateControls';
 const report=s=>{status.gateError=s;toast(s)},say=s=>{status.gateStatus=s;toast(s)};
 async function mount(parent,records=[]){
  if(dispose)dispose();q=parent;showing=false;closeDetail();status.full42DetailMode='1';status.gateError='';
  dispose=FG.author.mountDetails({canvas,toolbar:controls,base:q.base,record:records.map(row=>({...row,owner:'gate-seat'})),getCamera:()=>stageView,
   isActive:()=>currentTab==='stage'&&project.activeStageId==='stage-42-whole-native-blockout',
   report,show:w=>{status.gateCount=String(w.details.length);if(!showing&&w.pending?.points.length>1){invalidateRuntime();renderStage();drawTransientLine(w.pending.points.map(([x,y])=>({x,y})),'#73acb3');}},
   preview:d=>{showing=true;previewProject=FG.pack.gateProject(q,d.map(FG.clean));invalidateRuntime();renderStage();say('gate-preview');},
   save:d=>{const v=d.map(FG.clean),next=FG.pack.gateProject(q,v),raw=FG.pack.gateSave(q,v);onProject(next);r=raw;showing=false;say('gate-saved');}
  });
 }
 const button=(name,fn)=>{const t=document.createElement('button');t.type='button';t.textContent=name;t.onclick=async e=>{if(!e.isTrusted)return;try{await fn()}catch(x){report(x.message)}};bar.append(t);};
 button('Start Native Gate',async()=>{const prev=project,parent=await FG.pack.pinnedGateParents(HonroMaps,baseRaw(),detailRaw());if(project!==prev)throw Error('Gate parent changed during open');await mount(parent);say('gate-started');});
 button('Download Native Gate',()=>{if(!r)throw Error('Save Gate first');download('honro-stage42-native-gate.json',r,'application/json')});
 const file=document.createElement('input');file.type='file';file.hidden=true;file.accept='.json';
 button('Open Native Gate',()=>{status.gateImport='waiting';file.click()});
 file.onchange=async()=>{try{const f=file.files?.[0],prev=project;if(!f||f.size>8500)throw Error('Wrong bounded Gate draft');
  const p=await FG.pack.pinnedGateParents(HonroMaps,baseRaw(),detailRaw()),x=await f.text(),v=FG.pack.gateOpen(p,x);if(project!==prev)throw Error('Gate parent changed during fresh open');
  await mount(p,v.records);if(Number(status.gateCount)!==v.records.length)throw Error('Gate editable state did not mount');
  onProject(v.project);r=x;status.gateImport='opened';say('gate-reopened');
 }catch(e){status.gateImport='error';report(e.message)}finally{file.value=''}};
 bar.append(file,controls);
}
