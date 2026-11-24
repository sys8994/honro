import {createHash} from 'node:crypto';
const one=(s,a,b)=>{if(s.split(a).length!==2)throw Error('Stage51 compiler source drift: '+a);return s.replace(a,b);};
const pin=(src,expected)=>{const bytes=Buffer.from(src);const got=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');if(got!==expected)throw Error('Unexpected pinned Stage51 source '+got);};
export function scope51(src,name){
 if(name!=='shared/runtime/progression.js'&&name!=='shared/map/compiler.js')return src;
 if(name==='shared/runtime/progression.js') {
  pin(src,'8d778f426fe4d5a37d0e9f9cc588b6f9a85e423e');
  src=one(src,'const budget=id=>{const p=plan(id),','const budget=(id,override)=>{const p=override||plan(id),');
  src=one(src,'clone(state.limit):budget(id);','clone(state.limit):budget(id,normal51Provider.budget(b));');
 }
 if(name==='shared/map/compiler.js'){
  pin(src,'8eaec6a3c9e9c415e651889f97ea81d3f2dd6f14');
  src=one(src,"content=G.HonroSplitCampaign?.content(profile,sid)||G.HONRO_CONTENT.stages[sid-1]","content=normal51Provider.request(st,project,profile,options)||G.HonroSplitCampaign?.content(profile,sid)||G.HONRO_CONTENT.stages[sid-1]");
  src=one(src,"Object.assign(b,clone(st.initialState||{}));\n const map=compile(st,project);","Object.assign(b,clone(st.initialState||{}));\n normal51Provider.bind(b,st,project,profile,options);\n const map=compile(st,project);");
 }
 return src;
}
