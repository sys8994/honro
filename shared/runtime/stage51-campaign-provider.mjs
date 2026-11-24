// Shared only between this build's runtime ES modules. No global exposed.
// App's existing trusted rest permission is the only issuer inside its closure.
function session(){
 const pending=new WeakMap(),battles=new WeakMap();
 const find=(st,project,profile,o)=>{
  const r=o&&pending.get(o);
  return r?.st===st&&r?.project===project&&r?.profile===profile?r:null;
 };
 return Object.freeze({
  begin(st,project,profile,content,budget,run){
   if(!st||project?.stages?.[0]!==st||project.stages.length!==1||content?.id!==51||budget?.id!==51||
      st.id!=='stage-51'||st.metadata?.stageId!==51||st.metadata?.campaign!==true||st.metadata?.act!==6)return null;
   const o=Object.freeze({origin:'campaign'}),r=Object.freeze({st,project,profile,content,budget});pending.set(o,r);
   try{const b=run(o);return battles.get(b)===r?b:null;}finally{pending.delete(o);}
  },
  request:(st,p,profile,o)=>find(st,p,profile,o)?.content,
  bind(b,st,p,profile,o){const r=find(st,p,profile,o);if(!r)return;pending.delete(o);b.stageId=r.content.id;battles.set(b,r);},
  content:b=>battles.get(b)?.content,
  budget:b=>battles.get(b)?.budget
 });
}
export const normal51Provider=session();
