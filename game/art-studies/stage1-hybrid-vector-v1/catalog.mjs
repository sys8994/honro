import{ASSETS,MATERIALS,FAMILIES,HUMAN_H}from'../../../shared/assets/environment/vector-kit/registry.mjs';
import{COMPOSITIONS}from'../../../shared/assets/environment/vector-kit/compositions.mjs';
import{compileScene,svgBody}from'../../../shared/runtime/environment-vector-kit.mjs';
import{STAGE1}from'./shared-kit/stage1.scene.mjs';
const stage=compileScene(STAGE1),usage=id=>stage.nodes.filter(n=>n.assetId===id).length;
function bounds(nodes){return{x:Math.min(...nodes.map(n=>n.bounds.x)),y:Math.min(...nodes.map(n=>n.bounds.y)),r:Math.max(...nodes.map(n=>n.bounds.x+n.bounds.w)),b:Math.max(...nodes.map(n=>n.bounds.y+n.bounds.h))};}
function drawing(id,prefix){const c=compileScene({instances:[{id:'sample',assetId:id}]}),b=bounds(c.nodes),left=Math.min(b.x,-30)-14,top=Math.min(b.y,-HUMAN_H)-18,right=b.r+98,bottom=Math.max(b.b,4)+15;const s=HUMAN_H/467.0240478515625,ax=b.r+48;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${right-left} ${bottom-top}" role="img" aria-label="${id} · 설오 H103.5">${svgBody(c,{prefix})}<path d="M${left+6} 1H${right-5}" fill="none" stroke="#62785b" stroke-width="1"/><image href="seol-o-scale.svg" x="${ax-340*s}" y="${-619*s}" width="${880*s}" height="${680*s}"/><text x="${ax-24}" y="${-HUMAN_H-7}">H 103.5</text></svg>`;}
for(const [i,assembly]of Object.values(COMPOSITIONS).entries()){const article=document.createElement('article');article.dataset.composition=assembly.id;article.innerHTML=`<h2>${assembly.name}</h2><p>${assembly.use}</p>${drawing(assembly.id,'assembly-'+i)}`;document.querySelector('#assemblies').append(article);}
for(const [id,m]of Object.entries(MATERIALS)){const d=document.createElement('div');d.className='material';d.innerHTML=`<span class="swatch" style="background:linear-gradient(90deg,${m.colors.light},${m.colors.base},${m.colors.shade})"></span>${m.name}${id==='water'?' · 기존 물 패스':''}`;document.querySelector('#materials').append(d);}
for(const [i,a]of Object.values(ASSETS).entries()){const article=document.createElement('article');article.dataset.assetId=a.id;article.innerHTML=`<h2>${FAMILIES[a.family]} · ${a.name}</h2><p>${a.use}</p>${drawing(a.id,'asset-'+i)}<p class="numbers">${a.id} · ${a.recommendedHeightH.map(x=>x.toFixed(2)).join('–')}H · 숲길 ${usage(a.id)}곳</p>`;document.querySelector('#assets').append(article);}
document.documentElement.dataset.ready='true';
