// QA host wiring for the real Workshop source closure. No renderer changes.
let qaEastSession=null,qaEastDraft=null,qaEastPreview=null;
function qaEastOwner(p){return p.library.find(a=>a.id==='act5:near:42')}
function qaEastSetProject(prev,next){
 if(project!==prev||project.activeStageId!=='stage-42')throw Error('Stage42 project changed');
 const errs=p=>HonroMaps.validate(p).filter(e=>e.level==='err').map(x=>JSON.stringify(x));
 const allowed=errs(prev);
 for(const e of errs(next)){const i=allowed.indexOf(e);if(i===-1)throw Error('New Stage42 schema issue');allowed.splice(i,1)}
 history.push({label:'동쪽 암반 끝마감',state:structuredClone(prev)});if(history.length>80)history.shift();
 project=next;future=[];previewProject=null;previewCommandsKey=null;qaEastPreview=null;
 invalidateRuntime();const saved=saveAutosave();renderAll();
 setStatus(saved?'동쪽 암반 초안 저장':autosaveFailureMessage());
 qaEastDraft=JSON.stringify(qaEastOwner(next).edgeWall.params[CAP_KEY]);
}
function qaEastInstall(){
 if(document.querySelector('#qaEastCapHost'))return;
 const bar=document.createElement('div');bar.id='qaEastCapHost';
 Object.assign(bar.style,{position:'fixed',right:'12px',bottom:'5px',zIndex:200,padding:'2px',background:'#182024'});
 const helper=(label,act)=>{const b=document.createElement('button');b.textContent=label;b.type='button';
  b.onclick=async e=>{if(!e.isTrusted)return;try{await act();}catch(x){toast(x.message);}};
  bar.append(b);};
 const ui=document.createElement('span');
 helper('동쪽 끝마감 도구',()=>{
  if(qaEastSession)qaEastSession();
  const canvas=document.querySelector('#stageCanvas');
  if(!canvas||project.activeStageId!=='stage-42')throw Error('먼저 5막 2장을 여세요');
  qaEastSession=mountEastCapWorkshopTool({canvas,toolbar:ui,getProject:()=>project,getCamera:()=>stageView,isActive:()=>currentTab==='stage',
   preview:(prev,next)=>{if(project!==prev)throw Error('Stale Stage42 preview');previewProject=next;qaEastPreview=next;previewCommandsKey=null;invalidateRuntime();renderStage();},
   commit:qaEastSetProject,
   onScratch:(s,mode)=>{
    window.HonroEastCapQA={state:s,mode};document.documentElement.dataset.qaEastMode=mode;
    if(!qaEastPreview)renderStage();
    if(s.outline.length>1)drawTransientLine(s.outline.map(v=>({x:v.at[0]*TARGET.scale,y:v.at[1]*TARGET.scale})),'#81c6ff');
   },onStatus:text=>{document.documentElement.dataset.qaEastStatus=text;toast(text);}
  });
 });
 helper('끝마감 내보내기',()=>{if(!qaEastDraft)throw Error('No saved Stage42 cap');download('stage42-east-cap.json',qaEastDraft,'application/json');});
 const file=document.createElement('input');file.type='file';file.hidden=true;file.accept='.json';
 const status=document.documentElement.dataset;
 helper('끝마감 초안 열기',()=>{status.qaEastImport='waiting';file.click();});
 file.onchange=async()=>{
  const input=file.files?.[0];if(!input)return;
  status.qaEastImport='reading';
  try{if(input.size>4096)throw Error('Draft too large');const prev=project;const next=await attachEastCapDraft(prev,await input.text());qaEastSetProject(prev,next);status.qaEastImport='opened';}
  catch(e){status.qaEastImport='error';status.qaEastError=e.message;toast(e.message);}finally{file.value='';}
 };
 bar.append(file,ui);document.body.append(bar);
}
setTimeout(qaEastInstall,0);
