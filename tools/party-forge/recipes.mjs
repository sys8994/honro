import {rebuildSheetFace,applySheetColors} from './sheet-faces.mjs';
import {refineProportions} from './proportions.mjs';
import {harmonizeHeads} from './head-scale.mjs';
// Author in the existing v006 bind space. Rig contacts and game dimensions stay fixed.
const common={skinLight:'#D3B899',skinShade:'#92725A',skinWarm:'#B18C70',feature:'#473B34',eye:'#242B2A',eyeLight:'#D8D5C2',hairLight:'#414640',seam:'#858B75',leatherLight:'#927A58',metalLight:'#C0C4B0'};
export function createParty(original,rig){
 const assets=structuredClone(original);
 for(const a of Object.values(assets)){
  a.version=8;a.asset_id=a.character_id+'.v008';Object.assign(a.palette,common);
  a.rig.parts.find(p=>p.id==='head').pivot=[240,143];
  refineBody(a);refineMotion(a);rebuildSheetFace(a);applySheetColors(a);
  a.face.shapeIds=a.paths.filter(p=>p.part==='head').map(p=>p.id);
  refineProportions(a,rig);
  harmonizeHeads(a);
 }
 return assets;
}
function add(a,id,part,d,fill,detail=0){a.paths.push({id,part,d,fill,detail});return a.paths.at(-1);}
function line(a,id,part,d,stroke,width=1,detail=1){a.paths.push({id,part,d,stroke,strokeWidth:width,detail});}
function replace(a,id,d){const p=a.paths.find(p=>p.id===id);if(!p)throw Error('Missing authoring path '+id);p.d=d;}
function refineBody(a){
 const id=a.character_id,old=id==='damheo',warrior=id==='hwigyeom',soft=id==='sodan',robe=old||soft;
 const cloth=soft?'violet':old?'ash':warrior?'navy':'pine',dark=old?'charcoal':soft?'indigo':warrior?'ink':'olive',light=old?'paper':soft?'ivory':warrior?'iron':'hemp';
 Object.assign(a.palette,{clothLight:soft?'#97839B':old?'#8C8D80':warrior?'#4A5A68':'#5F7563',clothShade:soft?'#615367':old?'#464A43':warrior?'#202D36':'#283D34'});
 replace(a,'torso',robe?'M218 149 Q235 144 252 149 L266 157 Q277 178 275 205 L268 237 268 268 240 282 210 268 Q202 244 205 218 L199 189 Q201 165 218 149Z':'M219 149 Q239 144 260 152 L269 161 Q275 177 276 194 L268 230 272 265 246 282 211 267 211 232 Q200 213 201 190 L207 166Z');
 add(a,'shoulder_plane','thorax','M212 156 Q224 150 232 155 L237 167 218 179 207 193 204 182Z','clothLight');
 add(a,'rib_plane','thorax','M260 193 L272 191 263 230 266 253 253 265 249 239Z','clothShade');
 line(a,'chest_fold','thorax','M222 204 Q231 207 235 213 M222 236 L216 253 229 262','clothLight',1.4,1);
 line(a,'collar_edge','thorax',old?'M224 154 L241 173 237 198 M255 154 L259 182':soft?'M223 156 L239 171 228 191 M254 155 L258 182':'M225 151 L239 169 244 179 M255 151 L252 166','skinLight',1.8,0);
 line(a,'lapel_seam','thorax',old?'M245 205 L246 260':soft?'M250 193 L229 222 218 250':'M260 173 L248 195 229 219','clothLight',1.1,1);
 for(const side of ['rear','front']){
  const front=side==='front',arm=a.rig.parts.find(p=>p.id===side+'_upper_arm'),sleeve=a.rig.parts.some(p=>p.id===side+'_sleeve')?side+'_sleeve':side+'_upper_arm';
  line(a,side+'_sleeve_folds',sleeve,front?'M267 170 Q279 188 284 209 L280 220 M263 191 L276 218':'M205 169 Q192 191 185 217 L191 224 M211 184 L199 215','clothLight',1.4,1);
  line(a,side+'_sleeve_seam',sleeve,front?'M276 177 Q286 194 293 217':'M194 177 L179 211 175 228','clothShade',1.2,2);
  const handPart=side+'_hand',h=a.rig.parts.find(p=>p.id===handPart).pivot,[x,y]=h;
  a.paths=a.paths.filter(p=>p.part!==handPart);
  add(a,side+'_hand_shape',handPart,`M${x-12} ${y-6} Q${x-6} ${y-11} ${x+1} ${y-8} L${x+7} ${y-3} Q${x+9} ${y+2} ${x+5} ${y+5} L${x+4} ${y+11} Q${x-1} ${y+15} ${x-7} ${y+10} L${x-13} ${y+4}Z`,'skin');
  add(a,side+'_thumb',handPart,`M${x-5} ${y-5} Q${x+1} ${y-8} ${x+5} ${y-2} L${x+3} ${y+3} ${x-2} ${y} ${x-7} ${y+1}Z`,'skinLight');
  line(a,side+'_knuckles',handPart,`M${x-9} ${y+3} L${x-4} ${y+6} ${x+1} ${y+6} M${x-7} ${y+8} L${x-3} ${y+10}`,'skinShade',1,1);
  if(!robe){line(a,side+'_bracer_lace',side+'_forearm',front?'M301 265 L313 265 304 270 316 271 307 278':'M176 266 L190 269 176 274 188 277','leatherLight',1,1);}
 }
 line(a,'belt_edge','belt','M215 267 Q242 275 269 266','leatherLight',1.5,0);
 add(a,'belt_knot','belt','M239 271 L249 268 255 274 250 282 240 282 236 277Z',soft?'ochre':warrior?'iron':'wood');
 line(a,'belt_knot_stitch','belt','M240 275 L250 275 M241 278 L248 278',light,1,1);
 if(robe){
  line(a,'rear_robe_folds','rear_cloth',old?'M203 289 Q191 357 173 408 L170 429 M213 314 L202 370':'M202 292 Q191 358 168 409 L161 419 M212 318 L200 364','clothLight',1.6,1);
  line(a,'front_robe_folds','front_cloth',old?'M231 302 Q221 358 217 421 L216 447 M259 314 L272 394 274 419':'M224 300 Q217 360 204 411 L204 432 M268 320 L286 405 292 432','clothLight',1.7,1);
  line(a,'robe_hem','front_cloth',old?'M175 445 Q237 461 288 451':'M192 434 Q237 449 279 438','clothShade',2,1);
 }else{
  line(a,'rear_coat_fold','rear_cloth',warrior?'M216 284 L207 325 193 365':'M218 283 L210 310 196 345','clothLight',1.5,1);
  line(a,'front_coat_fold','front_cloth',warrior?'M259 294 Q271 327 281 365 L266 374':'M257 294 Q265 315 270 337 L263 347','clothLight',1.5,1);
  line(a,'rear_trouser_crease','rear_thigh','M217 299 Q224 322 210 345 L209 361',dark,1.5,1);
  line(a,'front_trouser_crease','front_thigh','M267 304 Q273 330 275 348 L270 363',dark,1.5,1);
 }
 line(a,'rear_boot_seam','rear_foot','M191 458 L198 465 206 470','leatherLight',1.3,1);
 line(a,'front_boot_seam','front_foot','M277 459 L284 467 298 472','leatherLight',1.3,1);
 if(id==='seol_o'){
  line(a,'quiver_stitch','prop_back','M180 166 L176 238 M190 177 L188 189 M185 213 L182 235','leatherLight',1.2,1);
  add(a,'quiver_lip','prop_back','M175 149 L202 157 200 166 174 157Z','ink');
  line(a,'bow_laminate','weapon','M351 175 Q340 186 345 201 Q351 227 327 270 M326 307 Q333 349 278 381','leatherLight',2,0);
  line(a,'bow_wrap','weapon','M320 277 L327 282 M321 283 L328 288 M322 290 L329 294','hemp',1.1,1);
  line(a,'ankle_bindings','front_shin','M274 441 L296 436 M275 448 L296 443 M276 455 L297 450','hemp',1,1);
  add(a,'shoulder_guard','front_upper_arm','M260 161 Q270 160 276 170 L284 189 276 197 266 191 258 174Z','olive');
  line(a,'guard_edge','front_upper_arm','M263 166 Q270 166 274 174 L278 186','clothLight',1.4,1);
  add(a,'strap_buckle','thorax','M226 187 L235 183 241 196 232 200Z','leatherLight');
  add(a,'buckle_inset','thorax','M230 188 L233 187 237 195 234 196Z','ink');
  add(a,'rear_knee_plane','rear_thigh','M201 333 Q210 339 217 338 L222 349 212 359 201 354 198 343Z','skinShade');
  add(a,'front_knee_plane','front_thigh','M264 335 L278 336 285 350 280 366 271 369 266 357Z','olive');
  line(a,'hip_stitch','front_cloth','M263 288 L281 341 276 345','leatherLight',1.2,1);
  line(a,'cloth_hems','rear_cloth','M190 356 L217 345 223 329','clothLight',1.4,1);
  add(a,'home_wood_grain','prop_hip','M266 291 L271 290 273 304 269 308Z','wood');
  line(a,'sash_weave','ribbon','M245 293 L236 324 M214 286 L222 291 231 287','leatherLight',1,1);
 }else if(old){
  line(a,'staff_grain','weapon','M328 462 L332 387 326 326 331 256 325 213 M330 189 L338 174 338 159','leatherLight',1.4,1);
  add(a,'staff_wrap','weapon','M324 258 L333 257 332 283 323 284Z','ink');
  line(a,'staff_wrap_cord','weapon','M325 262 L332 265 M324 268 L332 271 M324 275 L331 278','paper',1.1,1);
  line(a,'gourd_cord','prop_hip','M190 299 Q195 291 199 304 M191 317 L206 320 M198 286 Q205 279 211 293','ink',1.8,0);
  add(a,'gourd_light','prop_hip','M190 329 Q186 344 199 348 L205 344 Q194 341 196 327Z','leatherLight');
  add(a,'robe_weight','front_cloth','M228 306 Q228 361 219 396 L214 442 223 445 232 419 235 365 236 311Z','clothLight');
  add(a,'robe_knee_shadow','front_cloth','M256 328 L271 354 280 418 271 427 265 407 260 370Z','clothShade');
  line(a,'robe_bound_edge','rear_cloth','M195 302 Q183 368 163 428 L160 440','ash',1.4,1);
  line(a,'cuff_wear','front_forearm','M307 269 L318 271 M307 274 L318 276','skinLight',1,2);
  add(a,'stake_chisel','prop_back','M179 252 L184 250 188 282 184 283Z','leatherLight');
  line(a,'sleeve_weight','rear_sleeve','M179 210 Q166 236 165 249 L179 263','ash',2,1);
  line(a,'gourd_scratch','prop_hip','M204 333 L207 339 M208 300 L212 304','skinLight',1,2);
 }else if(warrior){
  line(a,'blade_edge','weapon','M329 312 L361 422 364 438','metalLight',1.5,0);
  line(a,'grip_wrap','weapon','M312 279 L320 282 M314 284 L322 288 M316 290 L324 294 M319 296 L326 300','leatherLight',1.2,1);
  line(a,'scabbard_seam','prop_hip','M217 295 L184 398 174 411','iron',1.2,1);
  add(a,'scabbard_end','prop_hip','M174 399 L184 403 179 415 168 419 168 410Z','iron');
  line(a,'vambrace_ridges','front_forearm','M287 243 L300 239 M290 250 L303 246','clothLight',1.3,1);
  add(a,'strap_buckle','thorax','M228 191 L237 187 243 200 234 205Z','leatherLight');
  add(a,'buckle_opening','thorax','M231 192 L235 190 239 199 235 201Z','ink');
  line(a,'coat_hem','rear_cloth','M185 373 L216 380 224 356','clothLight',1.2,1);
 }else{
  add(a,'bell_light','weapon','M324 296 Q328 293 331 297 L333 316 338 323 330 325 324 316Z','leatherLight');
  line(a,'bell_rim','weapon','M316 324 Q329 330 341 325','metalLight',1.2,0);
  line(a,'bell_pattern','weapon','M324 307 L329 304 333 308 329 313Z','ochre',1,1);
  line(a,'paper_script','prop_hip','M214 307 L219 307 211 315 216 318 209 324','red',1.2,1);
  line(a,'sash_seam','ribbon','M242 290 L231 338','leatherLight',1.3,1);
  add(a,'front_robe_shadow','front_cloth','M222 307 Q221 359 207 402 L201 431 211 441 220 413 228 359 230 318Z','skinShade');
  add(a,'front_robe_light','front_cloth','M262 310 L270 322 284 383 294 431 284 433 278 401Z','clothLight');
  add(a,'back_robe_light','rear_cloth','M205 287 L213 294 199 357 178 403 163 419 170 400 188 355Z','clothLight');
  line(a,'robe_binding','front_cloth','M243 299 L248 360 262 432','clothLight',1.7,1);
  line(a,'collar_seam','thorax','M222 160 L229 173 220 192 M249 169 L244 184','skinLight',1.2,1);
  line(a,'rear_cuff_edge','rear_forearm','M187 274 L201 270 M185 280 L203 275','clothLight',1.5,1);
  line(a,'bell_bands','weapon','M322 301 Q328 298 335 302 M321 317 Q330 322 338 318','ochre',1.4,1);
  add(a,'hair_cord_light','head','M209 116 L213 113 219 117 217 120 214 118Z','skinWarm');
  line(a,'sleeve_falling_fold','front_sleeve','M267 183 Q280 214 277 235 L283 240','clothLight',1.5,1);
 }
}
function refineMotion(a){
 // Keep the authored contact phases, tone down the high-knee gait and cloth swing.
 for(const frame of a.animation.animations.move.keyframes){
  for(const side of ['rear','front']){const p=frame[side+'Foot'];if(p&&!(frame.contacts||[]).includes(side))p[1]=459-(459-p[1])*.6;}
  if(['seol_o','hwigyeom'].includes(a.character_id)){
   frame.pelvis[1]=285+(frame.pelvis[1]-285)*.65;frame.thorax[1]=192+(frame.thorax[1]-192)*.65;
   if(frame.frontCloth)frame.frontCloth*=.75;if(frame.rearCloth)frame.rearCloth*=.75;
  }
 }
}
