import fs from'node:fs';import{authorStage}from'../stage37-release-scope/qa/candidate.mjs';
const p={library:[]},s={metadata:{stageId:7},initialState:{},units:[],markers:[],objectives:[{}],events:['yard-hounds','upper-crows'].map(id=>({id}))};
const data=JSON.parse(fs.readFileSync('stage7-vector-repo-input/shared/assets/environment/act1-sites/stage07.json')),finish=JSON.parse(fs.readFileSync('stage37-release-scope/candidate/tools/map-forge/stage7-terrain-finish.json'));authorStage(p,s,data,finish);const asset=p.library.find(a=>a.id==='act1-site:7:body');
const recipe=JSON.parse(fs.readFileSync('stage7-integration-842-local/test-reference/game/tools/stage7-registered-study/frozen-original-recipe.json'));for(const [path,key,value]of recipe.paths)path.reduce((a,k)=>a[k],asset.vector)[key]=value;
fs.writeFileSync('stage7-final-edge-study/asset.json',JSON.stringify(asset));fs.writeFileSync('stage7-final-edge-study/stage.json',JSON.stringify(s));
