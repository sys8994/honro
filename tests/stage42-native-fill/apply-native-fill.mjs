import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const scoped=fs.realpathSync(process.argv[2]||'.');
if(process.env.HONRO_NATIVE_FILL_PROOF!=='1'||path.basename(scoped)!=='stage42-native-fill-disposable')throw Error('Only runner disposable build; never application/source paths');
const f=path.join(scoped,'web/runtime/workshop-app.489f733634454986.js');
const sha=s=>createHash('sha256').update(s).digest('hex');
const stock=fs.readFileSync(f,'utf8');
if(sha(stock)!=='489f733634454986a5f4cd94468e7b7393a18508ee1e02e1ce0cad77ab8b324f')throw Error('Wrong stock asset code input');
function once(s,needle,after){if(s.split(needle).length!==2)throw Error('Unexpected stock anchor: '+needle);return s.replace(needle,after);}
const native=`function fillSelectedNativeShape(){
 const a=activeAsset(),sh=a?.visual?.[selectedShapeIndex];
 if(!a||a.vector||a.category!=="custom"||a.collision?.length||a.breakable||a.oneWay||a.climbable||a.interactionType||
   a.visualRole==="gameplay"||a.params?.visualRole==="gameplay"||a.gameplayLinks||a.params?.gameplayLinks||
   a.params?.terrainId||a.params?.collisionSource||elementTool!=="point"||elementPolygonDraft.length||
   sh?.type!=="polygon"||sh.closed===false||!/^#[0-9a-f]{6}$/i.test(sh.fill))return null;
 const targets=(v)=>[v?.id,v?.elementId,v?.targetId,v?.assetId].filter(id=>typeof id==="string");
 for(const st of project.stages){
  for(const p of st.elements){
   if(p.assetId!==a.id)continue;
   if(p.visualRole==="gameplay"||p.gameplayLinks||[...st.events,...st.objectives,...st.terrains].some(v=>targets(v).includes(p.id)||targets(v).includes(a.id)||v.honroElementId===p.id))return null;
  }
 }
 return sh;
}
function syncSelectedNativeFill(){
 const input=$("#nativeShapeFill");
 if(!input||currentTab!=="element")return;
 const sh=fillSelectedNativeShape();
 input.disabled=!sh;
 if(document.activeElement!==input||!sh)input.value=sh?.fill??"";
}
function bindNativeShapeFill(){
 const input=$("#nativeShapeFill");
 input.onchange=e=>{
  if(!e.isTrusted)return;
  const s=fillSelectedNativeShape(),color=input.value.trim().toLowerCase();
  if(!s||!/^#[0-9a-f]{6}$/.test(color)){input.value=s?.fill??"";return;}
  if(s.fill.toLowerCase()===color){input.value=s.fill;return;}
  commit("Native polygon fill",()=>{s.fill=color;});
 };
 syncSelectedNativeFill();
}
`;
let src=once(stock,'function renderElementPanels(){',native+'function renderElementPanels(){');
const anchor='dom.right.querySelector(".panel-scroll").insertAdjacentHTML("beforeend",assetDetails(a));bindAssetDetails();';
const input='<div class="panel-section"><div class="panel-title"><span>POLYGON</span></div><div class="row"><label for="nativeShapeFill">Fill</label><input id="nativeShapeFill" class="field" inputmode="text" maxlength="7" placeholder="#RRGGBB" autocomplete="off" spellcheck="false"></div></div>';
src=once(src,anchor,'dom.right.querySelector(".panel-scroll").insertAdjacentHTML("beforeend",'+JSON.stringify(input)+'+assetDetails(a));bindAssetDetails();bindNativeShapeFill();');
src=once(src,'function renderElement(){if(!dom.elementCanvas)return;','function renderElement(){syncSelectedNativeFill();if(!dom.elementCanvas)return;');
src=once(src,'selectedShapeIndex=nodeByGlobal(a,selectedNode)?.shapeIndex??selectedShapeIndex;return','selectedShapeIndex=nodeByGlobal(a,selectedNode)?.shapeIndex??selectedShapeIndex;syncSelectedNativeFill();return');
src=once(src,'elementPolygonDraft=[];selectedShapeIndex=-1;toast("새 polygon 점을 클릭하세요','elementPolygonDraft=[];selectedShapeIndex=-1;syncSelectedNativeFill();toast("새 polygon 점을 클릭하세요');
const expected='626fbd653c7efcf03a285e3b602a79b9303873550731c9a117b9af774a56b3ec';
if(sha(src)!==expected)throw Error('Exact resulting host drift');
fs.writeFileSync(f,src);console.log(sha(src));
