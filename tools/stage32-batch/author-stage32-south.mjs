import {createHash} from 'node:crypto';
// Only Stage32 signed nonplay art. Authored into native owner coordinates BEFORE
// campaign serialization, AFTER the unmodified pinned terrain path optimizer.
export const stage32SouthFacies = {
  "version": 1,
  "stage": 32,
  "F": {
    "tag": "g",
    "transform": [
      2.146464646464646,
      0,
      0,
      2.146464646464646,
      -777.4545454545454,
      307.5740214646465
    ],
    "children": [
      {
        "tag": "path",
        "fill": "#273d54",
        "d": "M416 251 L431 247 445 243 463 242 476 238 Q489 238 500 243 L521 247 539 250 557 258 574 258 595 271 612 268 631 266 648 268 668 266 684 272 706 269 720 272 741 268 759 268 773 264 795 265 818 262 834 254 855 253 880 251 901 248 921 247 949 239 968 240 985 239 1006 239 1029 238 L1022 253 1009 260 996 271 981 274 969 280 951 282 933 295 915 295 902 301 879 304 862 302 847 307 830 297 814 298 800 289 785 292 768 286 752 291 732 287 717 298 700 301 684 314 672 318 657 335 638 339 622 353 602 352 587 347 566 348 550 339 533 337 521 329 505 325 492 317 479 315 467 305 450 304 438 291 427 283 420 272Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#2d435c",
        "d": "M445 276 L459 271 475 267 493 267 507 271 524 270 537 272 554 280 568 281 583 291 595 289 609 296 630 300 650 299 674 302 689 294 702 294 700 301 684 314 672 318 657 335 638 339 622 353 602 352 587 347 566 348 550 339 533 337 521 329 505 325 492 317 479 315 467 305 450 304 438 291Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#415168",
        "d": "M440 281 L451 273 465 266 477 259 494 258 510 260 526 266 542 266 559 274 575 280 594 287 613 286 631 292 651 295 636 308 620 315 610 326 592 333 588 346 566 348 550 339 533 337 521 329 505 325 492 317 479 315 467 305 450 304 438 291Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#203c59",
        "d": "M505 325 L518 317 528 316 546 318 560 322 575 329 592 333 588 346 566 348 550 339 533 337 521 329Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#727b87",
        "d": "M416 251 L431 247 445 243 463 242 476 238 Q489 238 500 243 L521 247 533 249 530 254 519 260 505 258 494 258 477 259 465 266 451 273 440 281 429 282 420 272Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#575c61",
        "d": "M494 258 L505 258 519 260 530 254 533 249 539 250 557 258 574 258 595 271 612 268 619 274 607 284 585 286 575 280 559 274 542 266 526 266 510 260Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#626d7a",
        "d": "M546 265 L560 260 574 258 595 271 605 270 597 278 584 277 571 270 558 270 551 273Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#665b54",
        "d": "M499 243 L521 247 539 250 551 255 558 255 554 259 540 255 530 254 520 258 510 255 500 251 488 249Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#54535a",
        "d": "M595 271 L612 268 631 266 648 268 668 266 684 272 691 272 678 281 670 282 659 291 650 293 639 301 631 308 617 314 623 306 633 296 640 290 647 281 632 279 622 275 610 276 601 278Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#526075",
        "d": "M542 266 L559 274 575 280 588 285 578 290 566 288 557 291 547 288 536 289 524 284 534 276Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#34445a",
        "d": "M537 291 L548 286 557 291 565 290 558 296 548 298 538 307 530 309 521 315 514 315 522 305Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#464b54",
        "d": "M668 266 L684 272 706 269 720 272 741 268 759 268 773 264 795 265 818 262 834 254 855 253 869 255 861 265 850 267 835 271 822 272 813 279 801 282 788 279 775 283 768 286 752 291 732 287 717 298 700 301 684 314 672 318 682 304 688 292 697 288 686 288 671 291 659 291 670 282 678 281 691 272 684 272Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#5b5150",
        "d": "M688 272 L706 269 720 272 741 268 759 268 773 264 795 265 818 262 834 254 841 254 835 260 821 266 804 268 791 272 776 270 760 277 742 276 728 282 712 279 707 283 691 286 686 288 681 283Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#354963",
        "d": "M800 289 L813 279 822 272 835 271 850 267 861 265 869 255 880 251 901 248 921 247 949 239 968 240 985 239 1006 239 1029 238 L1022 253 1009 260 996 271 981 274 969 280 951 282 933 295 915 295 902 301 879 304 862 302 847 307 830 297 814 298Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#596779",
        "d": "M853 285 L865 274 875 263 888 256 901 248 921 247 949 239 961 240 955 247 941 255 925 255 916 265 904 266 893 273 879 276 871 287 859 293 847 296Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#5d6570",
        "d": "M958 261 L970 254 978 247 1000 243 1028 239 1022 253 1009 260 996 271 981 274 969 280 957 281 967 272 975 268Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#526078",
        "d": "M477 282 L484 277 490 278 485 285 478 288 473 295 466 296Z M907 287 L916 278 929 276 925 283 915 287 909 293 899 295Z",
        "stroke": "none"
      }
    ]
  },
  "B": {
    "tag": "g",
    "transform": [
      0.6558641975308642,
      0,
      0,
      0.6558641975308642,
      526.3333333333333,
      364.81428433641975
    ],
    "children": [
      {
        "tag": "path",
        "fill": "#273d54",
        "d": "M416 251 L431 247 445 243 463 242 476 238 Q489 238 500 243 L521 247 539 250 557 258 574 258 595 271 612 268 631 266 648 268 668 266 684 272 706 269 720 272 741 268 759 268 773 264 795 265 818 262 834 254 855 253 880 251 901 248 921 247 949 239 968 240 985 239 1006 239 1029 238 L1022 253 1009 260 996 271 981 274 969 280 951 282 933 295 915 295 902 301 879 304 862 302 847 307 830 297 814 298 800 289 785 292 768 286 752 291 732 287 717 298 700 301 684 314 672 318 657 335 638 339 622 353 602 352 587 347 566 348 550 339 533 337 521 329 505 325 492 317 479 315 467 305 450 304 438 291 427 283 420 272Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#2d435c",
        "d": "M445 276 L459 271 475 267 493 267 507 271 524 270 537 272 554 280 568 281 583 291 595 289 609 296 630 300 650 299 674 302 689 294 702 294 700 301 684 314 672 318 657 335 638 339 622 353 602 352 587 347 566 348 550 339 533 337 521 329 505 325 492 317 479 315 467 305 450 304 438 291Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#415168",
        "d": "M440 281 L451 273 465 266 477 259 494 258 510 260 526 266 542 266 559 274 575 280 594 287 613 286 631 292 651 295 636 308 620 315 610 326 592 333 588 346 566 348 550 339 533 337 521 329 505 325 492 317 479 315 467 305 450 304 438 291Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#203c59",
        "d": "M505 325 L518 317 528 316 546 318 560 322 575 329 592 333 588 346 566 348 550 339 533 337 521 329Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#727b87",
        "d": "M416 251 L431 247 445 243 463 242 476 238 Q489 238 500 243 L521 247 533 249 530 254 519 260 505 258 494 258 477 259 465 266 451 273 440 281 429 282 420 272Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#575c61",
        "d": "M494 258 L505 258 519 260 530 254 533 249 539 250 557 258 574 258 595 271 612 268 619 274 607 284 585 286 575 280 559 274 542 266 526 266 510 260Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#626d7a",
        "d": "M546 265 L560 260 574 258 595 271 605 270 597 278 584 277 571 270 558 270 551 273Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#665b54",
        "d": "M499 243 L521 247 539 250 551 255 558 255 554 259 540 255 530 254 520 258 510 255 500 251 488 249Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#54535a",
        "d": "M595 271 L612 268 631 266 648 268 668 266 684 272 691 272 678 281 670 282 659 291 650 293 639 301 631 308 617 314 623 306 633 296 640 290 647 281 632 279 622 275 610 276 601 278Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#526075",
        "d": "M542 266 L559 274 575 280 588 285 578 290 566 288 557 291 547 288 536 289 524 284 534 276Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#34445a",
        "d": "M537 291 L548 286 557 291 565 290 558 296 548 298 538 307 530 309 521 315 514 315 522 305Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#464b54",
        "d": "M668 266 L684 272 706 269 720 272 741 268 759 268 773 264 795 265 818 262 834 254 855 253 869 255 861 265 850 267 835 271 822 272 813 279 801 282 788 279 775 283 768 286 752 291 732 287 717 298 700 301 684 314 672 318 682 304 688 292 697 288 686 288 671 291 659 291 670 282 678 281 691 272 684 272Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#5b5150",
        "d": "M688 272 L706 269 720 272 741 268 759 268 773 264 795 265 818 262 834 254 841 254 835 260 821 266 804 268 791 272 776 270 760 277 742 276 728 282 712 279 707 283 691 286 686 288 681 283Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#354963",
        "d": "M800 289 L813 279 822 272 835 271 850 267 861 265 869 255 880 251 901 248 921 247 949 239 968 240 985 239 1006 239 1029 238 L1022 253 1009 260 996 271 981 274 969 280 951 282 933 295 915 295 902 301 879 304 862 302 847 307 830 297 814 298Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#596779",
        "d": "M853 285 L865 274 875 263 888 256 901 248 921 247 949 239 961 240 955 247 941 255 925 255 916 265 904 266 893 273 879 276 871 287 859 293 847 296Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#5d6570",
        "d": "M958 261 L970 254 978 247 1000 243 1028 239 1022 253 1009 260 996 271 981 274 969 280 957 281 967 272 975 268Z",
        "stroke": "none"
      },
      {
        "tag": "path",
        "fill": "#526078",
        "d": "M477 282 L484 277 490 278 485 285 478 288 473 295 466 296Z M907 287 L916 278 929 276 925 283 915 287 909 293 899 295Z",
        "stroke": "none"
      }
    ]
  }
};

const stamp=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const bytes=o=>Buffer.byteLength(JSON.stringify(o));
const stockShapes={
 F:[684521,'bf7391da9a43c37aff1388ca12a22a31611b61897f42752b9285c90db085d199'],
 B:[585468,'3305dc0a66ef8934f551a762670979b89674c3670360bbbb8be6280b6de1f668']
};
const newShapes={
 F:[4201,'664f40705420afbbd819bcefe27e68791018eb572af33373869ca4c51b490d50'],
 B:[4203,'a2069d0e525273d78adfd2706e962253b5b75de9e858615b90875f30c5e2f45d']
};
const same=(o,p)=>bytes(o)===p[0]&&stamp(o)===p[1];
function inspect(group,role){
 const f=role==='F', s=f?2.2:7.2, dx=f?0:-5500,dy=f?0:-1950;
 const [sx,sk1,sk2,sy,tx,ty]=group.transform;
 if(!same(group,newShapes[role])||group.tag!=='g'||group.children.length!==17||
    sk1!==0||sk2!==0||sx<=0||sy<=0||Object.keys(group).length!==3)
  throw Error('Stage32 signed facies shape or size changed: '+role);
 for(const {tag,fill,d,stroke,...extra} of group.children){
  if(tag!=='path'||stroke!=='none'||!/^#[0-9a-f]{6}$/.test(fill)||!/^[MLQCZ0-9. -]+Z$/.test(d)||Object.keys(extra).length)
   throw Error('Stage32 invalid alpha, open shape or paint primitive: '+role);
  const n=d.match(/-?(?:[0-9]*[.])?[0-9]+/g).map(Number);
  if(!n.length||n.length%2!==0)throw Error('Stage32 source coordinates malformed');
  for(let i=0;i<n.length;i+=2){
   const x=dx+s*(sx*n[i]+tx), y=dy+s*(sy*n[i+1]+ty);
   if(!Number.isFinite(x)||!Number.isFinite(y)||x<245||x>3166||y<1790||y>2470)
    throw Error('Stage32 control point crossed signed visual-only guard: '+role);
  }
 }
}
export function applyStage32SouthBedrock(project){
 const stage=project.stages.find(s=>s.metadata?.stageId===32);
 if(!stage)return project;
 const F='act4-handoff:32:body-joined',B='approved32:coastal-foundation';
 const find=id=>project.library.filter(a=>a.id===id);
 const used=(id,n,layer,x,y)=>JSON.stringify(project.stages.flatMap(s=>s.elements.filter(e=>e.assetId===id)
   .map(e=>[s.metadata?.stageId,e.id,e.layer,e.x,e.y,e.scale ?? 1,e.rotation ?? 0])))===JSON.stringify([[32,n,layer,x,y,1,0]]);
 // Act4 builds with R10's native joined BODY disabled must keep their old output.
 if(!stage.elements.some(e=>e.assetId===F)){
  if(find(F).length)throw Error('Stage32 joined BODY exists without its canonical placement');
  return project;
 }
 const [f]=find(F),[b]=find(B);
 if(find(F).length!==1||find(B).length!==1||!used(F,'approved32-body','mid',0,0)||
    !used(B,'approved32-coastal-foundation','structural-back',-5500,-1950)||f.collision?.length||b.collision?.length)
   throw Error('Stage32 visual-only owner registrations changed');
 const f2=structuredClone(f),b2=structuredClone(b),fv=f2.vector.root,bv=b2.vector.root;
 const fr=fv.children?.[0],shell=bv.children?.[0],br=shell?.children?.[0];
 if(fv.clipPath!=='portApron'||fr?.transform?.join()!=='2.2,0,0,2.2,0,0'||fr.children?.length!==2||
    bv.transform?.join()!=='7.2,0,0,7.2,0,0'||shell?.clipPath!=='source-alpha-silhouette'||br?.children?.length!==12)
   throw Error('Stage32 optimized art owners no longer match the signed input');
 if(!same(f.vector,stockShapes.F)||!same(b.vector,stockShapes.B))
   throw Error('Stage32 optimized source exact vector digest did not match official owners '+stamp(f.vector)+' / '+stamp(b.vector));
 inspect(stage32SouthFacies.F,'F');inspect(stage32SouthFacies.B,'B');
 fr.children.push(stage32SouthFacies.F);br.children.push(stage32SouthFacies.B);
 if(bytes(f2.vector)-bytes(f.vector)!==4202||bytes(b2.vector)-bytes(b.vector)!==4204)
   throw Error('Stage32 art memory budget unexpectedly changed');
 const cutF=fr.children.pop(),cutB=br.children.pop();
 if(!same(f2.vector,stockShapes.F)||!same(b2.vector,stockShapes.B))throw Error('Stage32 removed old optimized geometry');
 fr.children.push(cutF);br.children.push(cutB);
 return {...project,library:project.library.map(a=>a===f?f2:a===b?b2:a)};
}

// R10 is post-optimizer; compose its two exact visual-provider signatures after
// the existing optimization and Stage33/35 migration publishers. No restore
// rules are added to the profile runtime.
export function stage32SouthProviderSignatures(project,rows){
 const stage=project.stages.find(s=>s.metadata?.stageId===32);
 const F='act4-handoff:32:body-joined',B='approved32:coastal-foundation';
 if(!stage?.elements.some(e=>e.assetId===F))return rows;
 const f=project.library.filter(a=>a.id===F),b=project.library.filter(a=>a.id===B);
 const signature=a=>{const s=JSON.stringify(a);let h=2166136261;
  for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);
  return s.length+':'+(h>>>0).toString(16);
 };
 const old=rows[F];
 if(f.length!==1||b.length!==1||!old||Object.keys(old).length!==3||old.stage!==32||
    old.previous!=='843877:74fe14ea'||old.current!=='685031:cfa8f837'||Object.hasOwn(rows,B)||
    signature(f[0])!=='689233:56f4e60f'||signature(b[0])!=='590366:f90415d3'||
    f[0].collision?.length||b[0].collision?.length)
  throw Error('Stage32 R10 exact art/provider migration ancestry changed');
 return {...rows,
  [F]:{...old,current:'689233:56f4e60f',previousOptimized:old.current},
  [B]:{stage:32,previous:'586162:b287d499',current:'590366:f90415d3'}};
}
