import {portraitMaps,portraitShapes,mapPoint,mapPath} from './portrait-shapes.mjs';
// Hand-authored abstractions of the four 260916 character sheets.
// Coordinates share the existing rig bind space; no raster enters the runtime.
const styles={
 seol_o:{skin:'#C4A184',skinShade:'#A6866C',skinWarm:'#B89578',skinLight:'#D0AF94',hair:'#292B29',hairLight:'#353733',feature:'#454037',eyeLight:'#D6C3AB',eye:'#2D2B28',mouth:'#8F705C'},
 damheo:{skin:'#B99C7D',skinShade:'#9D8064',skinWarm:'#AE8E70',skinLight:'#C7AC8D',hair:'#454540',hairLight:'#72736B',feature:'#454039',eyeLight:'#D0BBA0',eye:'#302C28',mouth:'#876D58'},
 hwigyeom:{skin:'#B6977C',skinShade:'#92745B',skinWarm:'#AA886C',skinLight:'#C8AA8D',hair:'#282A29',hairLight:'#373B38',feature:'#39332C',eyeLight:'#C8B299',eye:'#292A27',mouth:'#765B46'},
 sodan:{skin:'#E1C3B6',skinShade:'#C9A89B',skinWarm:'#D6B2A4',skinLight:'#E9D0C4',hair:'#302D30',hairLight:'#403A40',feature:'#51413E',eyeLight:'#F0E0D6',eye:'#393130',mouth:'#B28A80'}
};
export function rebuildSheetFace(a){
 const id=a.character_id;Object.assign(a.palette,styles[id]);
 a.paths=a.paths.filter(p=>!['head','neck','hair_tail'].includes(p.part));
 a.paths.push({id:'neck',part:'neck',d:id==='sodan'?'M230 123 L246 134 249 152 241 163 227 148Z':'M230 129 L249 134 251 153 241 165 228 149Z',fill:'skin'},
  {id:'neck_turn',part:'neck',d:'M232 134 L248 142 248 150 241 156Z',fill:'skinShade'});
 for(const [name,d,fill='hair',part='head',detail=0,width]of portraitShapes[id]){
  const shape={id:name,part,d:mapPath(id,d),detail};
  if(width){shape.stroke=fill;shape.strokeWidth=width*portraitMaps[id].scale;}else shape.fill=fill;
  a.paths.push(shape);
 }
 if(id==='hwigyeom')a.paths.push(
  {id:'gat_crown',part:'head',d:'M224 95 L226 66 Q238 62 250 64 L258 95Z',fill:'hair'},
  {id:'gat_crown_light',part:'head',d:'M230 68 L240 66 243 92 229 92Z',fill:'hairLight'},
  {id:'gat_brim',part:'head',d:'M180 104 Q199 94 234 91 Q273 89 298 100 Q280 107 241 108 Q203 111 180 104Z',fill:'hair'},
  {id:'gat_rim',part:'head',d:'M187 103 Q239 91 291 100',stroke:'hairLight',strokeWidth:1.4,detail:1},
  {id:'gat_cord',part:'head',d:'M226 108 L227 140 223 165 M270 108 Q265 141 255 166',stroke:'hair',strokeWidth:1.1});
 a.face={landmarks:Object.fromEntries(['eye','farEye','nose','mouth'].map(k=>[k,mapPoint(id,portraitMaps[id][k])])),shapeIds:a.paths.filter(p=>p.part==='head').map(p=>p.id),view:'three-quarter',reference:'260916',authoringMap:portraitMaps[id]};
}

export function applySheetColors(a){
 const id=a.character_id;
 if(id==='seol_o'){
  Object.assign(a.palette,{pine:'#373E35',olive:'#505044',hemp:'#C2B7A2',clothLight:'#51584A',clothShade:'#2D332D',trouser:'#393733',trouserLight:'#4B483D'});
  for(const p of a.paths)if(['rear_trouser','front_trouser'].includes(p.id))p.fill='trouser';else if(['rear_knee_plane','front_knee_plane','rear_trouser_fold'].includes(p.id))p.fill='trouserLight';
  for(const p of a.paths)if(['rear_thigh','front_thigh','rear_shin','front_shin'].includes(p.part)&&p.fill==='hemp')p.fill='trouser';
 }else if(id==='damheo'){
  Object.assign(a.palette,{charcoal:'#363733',ash:'#53534C',paper:'#BDB6AA',clothLight:'#69695F',clothShade:'#3C3E37'});
 }else if(id==='hwigyeom'){
  Object.assign(a.palette,{navy:'#30373F',iron:'#464844',jade:'#BCB9AA',clothLight:'#454D53',clothShade:'#262D32'});
  a.paths=a.paths.filter(p=>!['vambrace_ridges','coat_hem'].includes(p.id));
 }else{
  Object.assign(a.palette,{violet:'#D6D1CB',ivory:'#E2DBD1',indigo:'#9685A5',red:'#8E403F',clothLight:'#E2DCD5',clothShade:'#B4A5C0'});
  for(const p of a.paths)if(p.id==='front_robe_shadow')p.fill='clothShade';
 }
 for(const p of a.paths)if(['collar_edge','collar_seam'].includes(p.id))p.stroke=id==='sodan'?'ivory':id==='damheo'?'paper':id==='hwigyeom'?'jade':'hemp';
}
