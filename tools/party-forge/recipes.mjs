// Author in the existing v006 bind space. Rig contacts and game dimensions stay fixed.
const common={skinLight:'#D3B899',skinShade:'#92725A',skinWarm:'#B18C70',feature:'#473B34',eye:'#242B2A',eyeLight:'#D8D5C2',hairLight:'#414640',seam:'#858B75',leatherLight:'#927A58',metalLight:'#C0C4B0'};
export function createParty(original){
 const assets=structuredClone(original);
 for(const a of Object.values(assets)){
  a.version=7;a.asset_id=a.character_id+'.v007';Object.assign(a.palette,common);
  a.rig.parts.find(p=>p.id==='head').pivot=[240,143];
  a.face={landmarks:{brow:[251,109],eye:[252,114],nose:[264,124],mouth:[255,132],chin:[251,143],ear:[230,118],neck:[240,151]},shapeIds:[]};
  rebuildFace(a);refineBody(a);refineMotion(a);
  a.face.shapeIds=a.paths.filter(p=>p.part==='head').map(p=>p.id);
 }
 return assets;
}
function add(a,id,part,d,fill,detail=0){a.paths.push({id,part,d,fill,detail});return a.paths.at(-1);}
function line(a,id,part,d,stroke,width=1,detail=1){a.paths.push({id,part,d,stroke,strokeWidth:width,detail});}
function replace(a,id,d){const p=a.paths.find(p=>p.id===id);if(!p)throw Error('Missing authoring path '+id);p.d=d;}
function rebuildFace(a){
 const id=a.character_id,old=id==='damheo',warrior=id==='hwigyeom',soft=id==='sodan';
 a.paths=a.paths.filter(p=>!['head','neck','hair_tail'].includes(p.part));
 if(old)Object.assign(a.palette,{hairLight:'#A9A99D',skinLight:'#C5AD8B',skinShade:'#83694F',skinWarm:'#A58A6A'});
 if(soft)Object.assign(a.palette,{hairLight:'#484552',skinLight:'#DDC9B0',skinShade:'#A88A7D',skinWarm:'#C0A491'});
 const p=(name,d,fill,detail=0)=>add(a,name,'head',d,fill,detail),l=(name,d,color,width=1,detail=1)=>line(a,name,'head',d,color,width,detail);
 add(a,'neck','neck','M231 132 Q240 137 250 132 L251 150 244 165 230 150Z','skin');
 add(a,'neck_turn','neck','M231 136 L240 142 246 144 241 155 231 150Z','skinShade');
 line(a,'neck_tendon','neck','M246 144 L245 151','skinLight',1.2,1);
 p('hair_back',soft?'M222 96 Q226 82 242 81 Q259 79 266 96 L263 119 252 137 233 142 221 128 216 113Z':old?'M222 98 Q222 83 239 83 Q255 80 262 94 L260 115 251 137 234 145 224 135 218 115Z':'M222 100 Q221 87 237 82 Q255 80 263 95 L262 114 252 137 237 143 223 133 218 116Z',old?'ash':'ink');
 p('face_plane',warrior?'M237 94 Q248 88 257 97 L261 107 260 116 266 123 Q265 126 261 126 L262 132 257 141 249 146 238 140 232 130 231 110Z':soft?'M236 96 Q246 88 255 96 Q260 101 260 112 L259 117 265 123 262 126 260 126 261 131 Q257 141 251 143 Q243 142 237 135 L231 123 232 109Z':old?'M236 94 Q247 89 255 96 L260 106 258 117 265 124 262 127 260 127 261 132 256 140 247 144 237 137 232 127 230 110Z':'M235 94 Q247 88 256 96 L260 106 259 116 265 123 262 126 260 126 261 131 256 138 Q251 144 246 141 L237 134 231 124 231 109Z','skin');
 p('temple_shadow','M234 99 L241 100 237 115 238 126 246 140 237 134 231 124 231 111Z','skinShade');
 p('cheek_light',soft?'M245 103 Q250 100 255 105 L255 115 260 120 255 124 245 128 240 119Z':'M244 101 Q251 99 255 105 L255 113 260 121 253 125 243 123 240 115Z','skinLight');
 p('jaw_plane',warrior?'M239 127 L247 131 259 130 256 140 249 143 241 138Z':'M239 128 L246 132 258 130 255 136 249 140 243 136Z','skinWarm');
 p('brow_plane','M244 103 L249 102 254 105 250 105 246 106Z','skinLight',1);
 p('ear','M230 109 Q223 107 224 117 Q224 126 231 128 L235 120 234 112Z','skinWarm');
 l('ear_fold','M229 114 Q225 113 227 120 L231 121','skinShade',1.2,1);
 // Upper lid and pupil occupy the same eye socket; the eyebrow is above it.
 p('brow',old?'M244 108 Q251 104 258 109 L257 111 249 109 244 111Z':warrior?'M245 108 L257 108 259 111 251 111 245 112Z':soft?'M245 108 Q251 106 257 109 L256 110 250 109 245 110Z':'M244 108 L250 106 258 109 256 111 250 109 244 111Z',old?'hairLight':'ink');
 p('eye_socket','M246 114 Q251 111 257 113 L256 116 250 117Z','feature');
 p('eye_light','M248 114 L255 113.6 254 115.1 250 115.1Z','eyeLight');
 p('iris','M252 113.5 L254 113.5 254 115.6 252 115.8Z','eye');
 l('lower_lid','M248 118 L253 118','skinShade',.8,2);
 l('nose_bridge','M258 113 L257.5 119 261 123','skinShade',1,1);
 p('nostril','M260 124 L263 124 262 125.5 260 125.4Z','feature');
 l('mouth','M250 131.5 Q255 130.5 260 131.8','feature',1.3,0);
 l('lower_lip','M253 134 L258 133.8','skinLight',1,1);
 if(old){
  p('hair_front','M221 101 Q220 84 237 83 Q254 79 262 92 L263 98 255 96 250 92 244 99 237 102 233 113 228 114 227 104Z','ash');
  p('hair_sweep','M227 96 Q230 85 243 86 L253 90 243 91 236 96 232 107 229 109Z','hairLight');
  p('topknot','M225 85 Q216 78 221 69 Q227 62 234 70 L235 79 231 86Z','ash');
  l('hair_tie','M221 80 Q227 84 234 81','ink',2,0);
  p('moustache','M247 129 Q253 127 259 130 L261 133 255 132 251 134 245 132 241 133Z','hairLight');
  p('beard','M237 130 Q242 137 249 137 L259 133 Q260 145 251 157 L246 163 242 157 236 148 231 136Z','paper');
  p('beard_plane','M233 135 L240 141 244 157 241 153 236 148Z','ash');
  l('beard_strands','M247 141 Q252 145 246 155 M253 139 L252 148','hairLight',1,1);
  l('age_lines','M240 106 L243 104 M244 121 L249 123 M257 127 L256 130','skinShade',.8,2);
 }else if(warrior){
  p('sideburn','M228 103 L235 104 234 121 238 132 236 137 230 127 227 116Z','ink');
  p('beard','M239 134 L246 139 254 137 260 133 258 143 250 149 243 147 239 141Z','hairLight');
  l('moustache','M251 130 L256 129 260 131','ink',1.6,0);
  l('jaw_stubble','M242 138 L244 143 M247 142 L248 146 M253 140 L252 144','ink',.8,2);
  l('face_scar','M242 117 L242 121 245 125','skinLight',1,2);
  p('gat_crown','M224 92 L227 62 Q237 57 252 61 L258 94Z','ink');
  p('gat_crown_light','M229 65 Q237 62 243 64 L245 90 227 89Z','hairLight');
  p('gat_brim','M181 96 Q203 87 233 89 Q269 88 298 102 Q281 107 239 106 Q200 104 180 100Z','ink');
  p('gat_rim','M184 96 Q233 88 292 101 Q269 99 241 98 L208 97Z','iron');
  l('gat_band','M225 90 Q242 94 258 92','iron',2,1);
  l('gat_cord','M224 104 Q220 126 230 141 Q238 150 250 146','wood',1.1,0);
 }else{
  p('hair_front',soft?'M221 100 Q222 83 242 82 Q259 81 265 97 L265 102 257 98 255 106 250 98 242 105 237 117 231 122 230 107 225 110Z':'M222 100 Q223 86 238 83 Q255 81 262 93 L265 100 257 96 253 105 247 96 240 103 236 114 230 118 231 102Z','ink');
  p('hair_sweep',soft?'M227 98 Q233 85 247 86 L257 92 246 92 236 100 232 109Z':'M227 97 Q232 87 245 86 L254 91 245 91 236 97 232 106Z','hairLight',1);
  if(soft){
   add(a,'low_hair_tail','hair_tail','M220 116 Q208 126 210 144 L204 168 213 162 220 158 Q228 139 228 124Z','ink');
   line(a,'hair_tail_fold','hair_tail','M220 128 Q216 143 213 155','hairLight',1.5,1);
   p('hair_cord','M220 114 Q212 107 207 115 L211 121 219 121 Q226 111 230 116 L229 123 221 123 220 143 215 149 217 127 211 132 214 122Z','red');
  }else{
   p('hair_knot','M224 86 Q217 80 218 73 Q220 66 228 68 Q236 71 232 81 L229 86Z','ink');
   l('hair_tie','M220 81 Q225 85 233 80','red',2,0);
   add(a,'hair_tie_tail','hair_tail','M222 99 Q210 116 207 129 L213 125 212 139 221 131 227 112Z','ink');
   line(a,'tail_strand','hair_tail','M221 110 L215 126','hairLight',1.2,1);
  }
 }
}
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
 a.design={reference:'shared/assets/party.v006.runtime.js',brief:{seol_o:'날렵한 얼굴과 짧게 정리한 턱, 초록 겉옷과 봉인 활',damheo:'눈꺼풀과 광대의 나이, 흐르는 백발·수염과 삼베',hwigyeom:'갓 아래 드러나는 눈썹, 단단한 턱과 짧은 수염, 남색 무복',sodan:'둥근 턱과 차분한 눈, 낮은 머리끈·자줏빛 겉옷과 방울'}[a.character_id],anchorBudget:[1.9,2.1]};
}
