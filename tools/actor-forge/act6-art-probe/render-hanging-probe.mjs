import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const entry=process.env.HONRO_QA_PLAYWRIGHT;
const {chromium}=await import(entry?pathToFileURL(entry).href:'playwright');
const runtime=path.resolve(process.env.HONRO_ROOT??'../honro-monster-runtime','shared/runtime');
const browser=await chromium.launch({executablePath:process.env.HONRO_CHROMIUM_BINARY??undefined,args:['--no-sandbox','--disable-dev-shm-usage'],headless:true});
try{
 const page=await browser.newPage({viewport:{width:1536,height:900}});
 const dir='rig-parts/grot_hanging';
 await page.setContent('<body style="margin:0"><canvas id="c" width="1536" height="900"></canvas></body>');
 await page.addScriptTag({content:'globalThis.HonroScene = class { unitBody(){throw Error("unexpected fallback")} };'});
 await page.addScriptTag({path:path.join(runtime,'monster-vector.js')});
 await page.addScriptTag({path:dir+'/candidate.runtime.js'});
 await page.addScriptTag({path:path.join(runtime,'actor-vector.js')});
 const result=await page.evaluate(()=>{
  const ctx=document.getElementById('c').getContext('2d');
  const poses=[['Idle',{}],['Windup',{honroMonsterWindup:true}],['Strike',{anim:.665}],['Hit',{hurt:.61}]];
  const sizes=[64,140,270], cy=[160,411,795], s=new HonroScene();
  const witnesses=[];
  for(let i=0;i<sizes.length;i++){
   ctx.fillStyle=['#293031','#434347','#213037'][i]; ctx.fillRect(0,i?[0,198,452][i]:0,1536,i===2?448:i===1?254:198);
   for(const [j,[name,state]] of poses.entries()){
    ctx.fillStyle='#e7e4d9';ctx.font='18px Georgia';ctx.fillText(name+' / '+sizes[i]+'px',j*384+44,cy[i]+27);
    const u={id:'probe-unit',h:sizes[i],r:sizes[i]*.42,x:j*384+172,y:cy[i],facing:j%2===0?1:-1,side:1,honroRigAsset:'grot_hanging',...state};
    s.time=0;
    s.unitBody(ctx,u); witnesses.push({key:HonroActorVisual.kind(u),state:HonroActorVisual.state(u),h:u.h});
   }
  }
  return witnesses;
 });
 await page.locator('#c').screenshot({path:dir+'/actual-renderer.png'});
 fs.writeFileSync(dir+'/runtime-witnesses.json',JSON.stringify(result,null,2)+'\n');
 console.log('Rendered via current actor-vector.js unitBody: '+result.length+' actual Canvas draws');
}finally{await browser.close();}
