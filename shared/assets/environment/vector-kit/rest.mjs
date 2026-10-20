/** Rest-only presentation assemblies, in the retained 1600×900 menu frame.
 * Actors remain on the existing y765 plane (visible adult ≈127 units).
 * These support records never enter a campaign map, collision or a save.
 */
import {ASSETS} from './registry.mjs';
import {compileScene} from '../../../runtime/environment-vector-kit.mjs';
import {compileArchitecture} from './architecture.mjs';

// Existing paintings only. Source candidates stay untouched; the build encodes
// right-sized WebP bytes and the retained SVG requests only the displayed image.
export const REST_BACKDROPS=Object.freeze({
 'mountain-dusk':{file:'location-far/source/mountain-dusk.png',rect:[-850,-160,3300,1100],veil:'#35434b',opacity:.24},
 'mountain-wet-valley':{file:'location-far/source/mountain-wet-valley.png',rect:[-850,-160,3300,1100],veil:'#35434b',opacity:.24},
 'mountain-still-night':{file:'location-far/source/mountain-still-night.png',rect:[-850,-160,3300,1100],veil:'#303e43',opacity:.22},
 'cave-entrance':{file:'location-far/source/cave-entrance.png',rect:[-850,-160,3300,1100],veil:'#2d3c40',opacity:.24},
 'cave-settlement':{file:'location-far/source/cave-settlement.png',rect:[-850,-160,3300,1100],veil:'#2e3f42',opacity:.24},
 'cave-waterwork':{file:'location-far/source/cave-waterwork.png',rect:[-850,-160,3300,1100],veil:'#2d3d40',opacity:.24},
 'cave-bell-chamber':{file:'location-far/source/cave-bell-chamber.png',rect:[-850,-160,3300,1100],veil:'#2e3e42',opacity:.24},
 'town-wall':{file:'location-far/source/town-wall.png',rect:[-1210,-140,3300,1100],veil:'#354249',opacity:.25},
 'town-river':{file:'location-far/source/town-river.png',rect:[-850,-160,3300,1100],veil:'#34434a',opacity:.24},
 'underground-channel':{file:'location-far/source/underground-channel.png',rect:[-850,-160,3300,1100],veil:'#2f4043',opacity:.24},
});
const REST_BACKDROP_STAGES=[
 'mountain-dusk','mountain-dusk','mountain-wet-valley','mountain-still-night','mountain-wet-valley',
 'mountain-wet-valley','mountain-dusk','mountain-still-night','mountain-still-night','mountain-still-night',
 'mountain-dusk','cave-entrance','cave-entrance','cave-settlement','cave-waterwork',
 'cave-settlement','cave-waterwork','cave-bell-chamber','cave-bell-chamber','cave-entrance',
 'town-wall','town-wall','town-river','town-wall','underground-channel',
 'town-river','cave-waterwork','town-wall','town-wall','town-river',
];

const REST_PRESETS={
 inn:{palette:'forest',building:'inn',pines:[[-10,708,.8]],rocks:[[1455,732,.65]]},
 ridge:{palette:'cool',pines:[[90,705,.7]],rocks:[[270,711,1.15],[1430,734,.7]]},
 ferry:{palette:'wet',deck:true,pines:[[15,708,.7]],rocks:[[300,716,.7]],water:true},
 gate:{palette:'ash',building:'gate',rocks:[[1490,735,.65]],flag:true},
 waterfall:{palette:'wet',rocks:[[80,710,1.2],[1440,734,.85]],water:true},
 bridge:{palette:'cool',deck:true,rocks:[[85,716,.9]],water:true},
 village:{palette:'forest',building:'house',pines:[[1515,718,.7]]},
 warehouse:{palette:'ash',building:'warehouse',rocks:[[1430,732,.7]]},
 court:{palette:'ash',building:'temple',rocks:[[1450,727,.65]]},
 guardian:{palette:'ink',building:'temple',landmark:'guardian-root-stairs'},
 dawnGate:{palette:'dry',building:'gate',pines:[[1500,715,.7]],flag:true},
 quarry:{palette:'dry',rocks:[[100,708,1.3],[1430,732,.85]]},
 stoneSteps:{palette:'cave',rocks:[[90,707,1.2],[360,712,.7],[1460,728,.9]],underground:true},
 caveVillage:{palette:'cave',building:'house',rocks:[[1440,729,.8]],underground:true},
 caveBridge:{palette:'cave',deck:true,water:true,rocks:[[95,714,.85]],underground:true},
 caveTemple:{palette:'cave',building:'temple',rocks:[[1470,731,.7]],underground:true},
 workshop:{palette:'cave',building:'warehouse',rocks:[[1470,732,.8]],underground:true},
 bellApproach:{palette:'ink',deck:true,rocks:[[120,710,1.15],[1490,729,.9]],underground:true,landmark:'existing-bell-chamber'},
 caveExit:{palette:'cave',rocks:[[40,705,1.2],[1490,732,.7]],underground:true},
 cityFerry:{palette:'city',building:'gate',deck:true,water:true,flag:true},
 archive:{palette:'city',building:'house',rocks:[[1470,733,.65]]},
 freight:{palette:'city',building:'warehouse',deck:true,water:true},
 mansion:{palette:'ash',building:'temple',rocks:[[1450,732,.65]]},
 canal:{palette:'cave',canal:true,water:true,rocks:[[1500,730,.8]],underground:true},
 graveyard:{palette:'ash',building:'house',rocks:[[1430,733,.7]]},
 depot:{palette:'ink',building:'warehouse',canal:true,water:true,underground:true},
 courtyard:{palette:'ash',building:'temple',flag:true},
 sluice:{palette:'ink',building:'gate',canal:true,water:true},
 riverExit:{palette:'city',deck:true,water:true,rocks:[[120,717,.85]]},
};
// Every chapter has an explicit local-place assembly. No variant → forest fallback.
export const REST_STYLES=Object.freeze(Object.fromEntries([
 'inn','ridge','ferry','gate','waterfall','bridge','village','warehouse','court','guardian',
 'dawnGate','quarry','stoneSteps','caveVillage','caveBridge','caveTemple','workshop','bellApproach','bellApproach','caveExit',
 'cityFerry','archive','freight','mansion','canal','graveyard','depot','courtyard','sluice','riverExit',
].map((name,i)=>[i+1,Object.freeze({name,...REST_PRESETS[name],backdrop:REST_BACKDROP_STAGES[i],buildingX:i===20?340:0})])));

export function compileRestScene(stage){
 const style=REST_STYLES[stage];if(!style)return null;
 const instance=(id,assetId,x,y,scale)=>({id,assetId,palette:style.palette,transform:{x,y,scale}});
 const ground=compileScene({terrain:{profile:[[-80,719],[240,697],[480,707],[800,714],[1130,710],[1390,699],[1680,722]],bottom:950,halfWidths:[9,9,8,8,8,9,9],palette:style.palette,paintBounds:{x:0,y:700,w:1600,h:250}},instances:[]});
 const near=compileScene({instances:[...(style.pines||[]).map(([x,y,s],i)=>instance('rest-pine-'+i,'pine.small',x,y,s)),...(style.rocks||[]).map(([x,y,s],i)=>instance('rest-rock-'+i,'rock.shoulder',x,y,s))]});
 // The same terrain-aware assembly used by the stage3/4 warehouses and gates.
 // Door H157–179 is 1.24–1.41 visible rest adults, with a single storey above it.
 const terrain=[],specs=[];
 if(style.name==='waterfall'){
  plane('rest-waterfall-wall',[[-80,-200],[452,-200],[478,-34],[465,73],[502,160],[485,248],[521,326],[509,429],[550,510],[541,581],[592,683],[536,733],[-80,733],[-100,730],[-100,650],[-100,550],[-100,450],[-100,350],[-100,250],[-100,150],[-100,50],[-100,-50],[-100,-150],[-100,-200]]);
  // Reuse the broad legacy wet-wall contour as a finite rock face.
  support('rest-waterfall-bed',-100,600,734);
  specs.push({id:'rest-wet-wall',type:'ledge',deck:'rest-waterfall-wall',ground:'rest-waterfall-bed'});
 }
 function plane(id,points){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);terrain.push({id,x:Math.min(...xs),y:Math.min(...ys),points:points.map(([x,y])=>({x,y})),honroWalkEdges:Array.from({length:points.length/2-1},(_,i)=>i)});}
 function support(id,left,right,y){plane(id,[[left,y],[right,y],[right,y+20],[left,y+20]]);}
 if(style.building){
  const wide=style.building==='warehouse',left=(wide?-120:-40)+(style.buildingX||0),right=(wide?490:450)+(style.buildingX||0),foot=707;
  const peak=style.building==='temple'?378:420,eave=style.building==='gate'?464:480;
  support('rest-house-floor',left,right,foot);
  plane('rest-house-roof',[[left-32,eave],[left+95,eave-17],[(left+right)/2,peak],[right-95,eave-17],[right+32,eave],[right+32,eave+14],[right-95,eave-3],[(left+right)/2,peak+14],[left+95,eave-3],[left-32,eave+14]]);
  specs.push({id:'rest-'+style.building,type:'building',roof:'rest-house-roof',ground:'rest-house-floor',left:left+20,right:right-20,columns:[left+28,(left+right)/2+85,right-28],openings:[{id:'door',assetId:'hanok.door.open',x:(left+right)/2-38,scale:style.building==='gate'?.8:.7},{id:'wall-bay',assetId:'hanok.wall.bay',x:right-107,scale:.7}]});
 }
 if(style.deck){
  support('rest-pier-bed',1100,1700,788);
  plane('rest-pier-deck',[[1120,707],[1330,630],[1680,644],[1680,660],[1330,646],[1120,723]]);
  specs.push({id:'rest-pier',type:'deck',deck:'rest-pier-deck',ground:'rest-pier-bed',piles:[1170,1430,1630]});
 }
 if(style.canal){
  support('rest-canal-bed',-50,445,770);support('rest-canal-top',-50,445,610);
  specs.push({id:'rest-canal-bank',type:'ledge',deck:'rest-canal-top',ground:'rest-canal-bed',stone:'masonry',stoneFootOffset:-67});
 }
 const core={poly:t=>t.points,topAt:t=>t.y};
 const architecture=compileArchitecture(specs,{terrain},{ASSETS,compileScene,palette:style.palette},core);
 return{style,ground,near,architecture};
}
