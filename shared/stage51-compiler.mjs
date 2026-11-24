const one=(s,a,b)=>{if(s.split(a).length!==2)throw Error('Stage51 compiler source drift: '+a);return s.replace(a,b);};
export function scope51(src){
 if(src.includes('const plan=id=>config.stages[id-1];')) {
  src=one(src,'const budget=id=>{const p=plan(id),','const budget=(id,override)=>{const p=override||plan(id),');
  src=one(src,'clone(state.limit):budget(id);','clone(state.limit):budget(id,normal51Provider.budget(b));');
 }
 if(src.includes('function createBattle(st,project,profile=profileFor(st),options={})')){
  src=one(src,"content=G.HonroSplitCampaign?.content(profile,sid)||G.HONRO_CONTENT.stages[sid-1]","content=normal51Provider.request(st,project,profile,options)||G.HonroSplitCampaign?.content(profile,sid)||G.HONRO_CONTENT.stages[sid-1]");
  src=one(src,"Object.assign(b,clone(st.initialState||{}));const map=compile(st,project);","Object.assign(b,clone(st.initialState||{}));normal51Provider.bind(b,st,project,profile,options);const map=compile(st,project);");
 }
 if(src.includes("get stage(){return data_1.STAGES[this.b.stageId-1]}"))src=one(src,"get stage(){return data_1.STAGES[this.b.stageId-1]}","get stage(){return normal51Provider.content(this.b)||data_1.STAGES[this.b.stageId-1]}");
 return src;
}
