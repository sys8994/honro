/** Official ephemeral CI browser only; no user browser/profile. Real monotonic clock. */
import {createRequire} from 'node:module';import {writeFile} from 'node:fs/promises';import {pathToFileURL} from 'node:url';import path from 'node:path';
if(process.env.GITHUB_ACTIONS!=='true')throw Error('CI only');
const [fixtures,out,label,executable]=process.argv.slice(2),require=createRequire(path.join(process.env.RUNNER_TEMP,'browser-deps/package.json'));
const {chromium}=require('playwright-core');
for(const variant of ['baseline',label]){
 const browser=await chromium.launch({executablePath:executable,headless:true,args:['--force-device-scale-factor=1']});
 try{const context=await browser.newContext({viewport:{width:1331,height:763},deviceScaleFactor:1});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.exposeFunction('probeSetViewport',async(width,height)=>{await page.setViewportSize({width,height});});
 await page.goto(pathToFileURL(path.resolve(fixtures,variant+'.html')).href,{timeout:120000,waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.getElementById('result')?.textContent!=='pending',{},{timeout:600000});
 await writeFile(path.join(out,variant+'.dom.html'),await page.content());await writeFile(path.join(out,variant+'.chrome.log'),JSON.stringify(errors,null,2));
 }finally{await browser.close();}
}
