import assert from 'node:assert/strict';import {compileFullShape,emptyDesign} from './model.mjs';
export const technical={version:1,joins:[{top:[1500,2100],bottom:[1500,2520]},{top:[3900,2100],bottom:[3900,2580]},{top:[5500,1200],bottom:[5500,1730]}],
 sections:[{zone:'west',top:[[-140,2100],[600,2110]],bottom:[[-140,2480],[700,2540]]},{zone:'center',top:[[2150,2120],[3100,2115]],bottom:[[2250,2580],[3000,2600]]},{zone:'east-rise',top:[[4500,1800],[5200,1320]],bottom:[[4500,2280],[5200,1790]]},{zone:'gate',top:[[6100,970],[6710,950]],bottom:[[6120,1460],[6710,1560]]}],
 upper:{top:[[1750,1500],[3300,1490],[4660,1190]],bottom:[[1750,1580],[3300,1570],[4660,1270]]},
 bearings:[
 {head:[[2070,1565],[2190,1560]],toe:[[2020,2160],[2260,2190]],sides:[[],[]]},
 {head:[[3190,1555],[3300,1550]],toe:[[3130,2150],[3370,2160]],sides:[[],[]]},
 {head:[[4400,1310],[4480,1290]],toe:[[4340,2050],[4540,2020]],sides:[[],[]]}
 ],
 back:[[[130,1570],[630,800],[1120,850],[1390,1750],[300,1940]],[[4700,1000],[5350,720],[6300,870],[6510,1410],[5250,1450]]],
 margins:[{side:'left',owner:'west',points:[[-140,2480],[-140,2100],[-430,2220],[-850,2550],[-390,2600]]},
 {side:'bottom',owner:'center',points:[[2250,2580],[3000,2600],[3290,2960],[2570,3120],[2330,2900]]},
 {side:'top',owner:'back-0',points:[[1120,850],[630,800],[700,520],[940,480],[1210,630]]},
 {side:'right',owner:'gate',points:[[6710,950],[6710,1560],[7100,1720],[7440,1450],[7160,1080]]}]};
const full=compileFullShape(technical);assert.equal(full.sections.length,4);assert.equal(full.roles.length,14);assert.equal(full.collision.length,0);assert.equal(full.roles.filter(r=>r.owner.startsWith('margin-')).length,4);assert.equal(emptyDesign().joins.length,0);
for(let i=0;i<3;i++){assert.deepEqual(full.sections[i].top.at(-1),full.sections[i+1].top[0]);assert.deepEqual(full.sections[i].bottom.at(-1),full.sections[i+1].bottom[0]);}
const moved=structuredClone(technical);moved.joins[0].top[1]+=10;assert.deepEqual(compileFullShape(moved).sections[1].top[0],[1500,2110]);
const wrong=structuredClone(technical);wrong.joins[0].top[0]=1900;assert.throws(()=>compileFullShape(wrong),/bounded/);
const floating=structuredClone(technical);floating.margins[0].points[0]=[-220,2470];assert.throws(()=>compileFullShape(floating),/exact real/);
const noMargin=structuredClone(technical);noMargin.margins.pop();assert.throws(()=>compileFullShape(noMargin),/four/);
console.log('Four sections, shared drag/joins, separate depth roles and four connected margins verified from SYNTHETIC fixtures only.');
