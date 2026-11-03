/** Parse all browser expressions and check required production API declarations.
 * This is adapter preflight, not actual browser/gameplay evidence. */
import assert from 'node:assert/strict';import vm from 'node:vm';import{readFileSync}from'node:fs';import{execFileSync}from'node:child_process';
const expressions=JSON.parse(execFileSync('python',['-c',`import ast,json
v=[]
for file in ['tests/monster-natural-browser.py','tests/monster-natural-wave-browser.py']:
 p=ast.parse(open(file).read())
 for n in ast.walk(p):
  if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr in ('evaluate','wait_for_function','add_init_script') and n.args and isinstance(n.args[0],ast.Constant) and isinstance(n.args[0].value,str):v.append(n.args[0].value)
  if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id in ['PAINT','READ'] for t in n.targets):v.append(n.value.value)
print(json.dumps(v))`],{encoding:'utf8'}));
for(const expression of expressions)new vm.Script('('+expression+')');
const script=readFileSync('_local/reports/monster-natural/controller.js','utf8');new vm.Script(script);
assert(!script.includes('app.scene.render=render'));assert(!script.includes('app.scene.render=()=>{}'));assert(!/\.observeEnemyEffectWarning\s*\(/.test(script));assert(!/\.enemyEffectCast\s*=/.test(script));
const runtime=execFileSync('git',['show','7d2655bc:shared/runtime/main.js'],{encoding:'utf8'});for(const method of ['renderBattleFrame','beginCharge','releaseCharge','adjustAngle','selectHero','defend','jump','export','downloadProfile'])assert(runtime.includes(method+'(')||runtime.includes(method+' ('),method);
const f5=JSON.parse(readFileSync('tests/fixtures/monster-natural/stage5-entry.json')),f8=JSON.parse(readFileSync('tests/fixtures/monster-natural/stage8-entry.json'));for(const f of[f5,f8]){assert(!f.profile.honroBattle);assert(!f.profile.settings.debugMode);}assert(!f5.profile.cleared[5]);assert(!f8.profile.cleared[8]);
console.log('PASS',expressions.length,'browser expressions, production API names, legal entry boundary and no observer/render bypass');
const scheduler=JSON.parse(execFileSync('python',['-c',`import ast,json
p=ast.parse(open('tests/monster-natural-browser.py').read())
print(json.dumps(next(n.value.value for n in p.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SCHEDULER' for t in n.targets))))`],{encoding:'utf8'}));
let next=1,callbacks=new Map();const context={requestAnimationFrame:fn=>{const id=next++;callbacks.set(id,fn);return id;},cancelAnimationFrame:id=>callbacks.delete(id)};context.window=context;vm.createContext(context);vm.runInContext(scheduler,context);
vm.runInContext('requestAnimationFrame(()=>requestAnimationFrame(()=>window.bootReady=true))',context);for(let n=0;n<2;n++){const batch=[...callbacks];callbacks.clear();for(const[,fn]of batch)fn(n);}assert(context.bootReady,'Production double-rAF boot must complete');
vm.runInContext('requestAnimationFrame(()=>window.accidentalFrame=true);qaStopScheduling();requestAnimationFrame(()=>window.accidentalFrame=true)',context);assert.equal(callbacks.size,0);assert(!context.accidentalFrame);console.log('PASS normal double-rAF boot, then deterministic queued-frame cancellation');

const driver=readFileSync('tests/monster-natural-browser.py','utf8'),sink=driver.slice(driver.indexOf('  def evidence('),driver.indexOf("  p.expose_binding("));assert(!sink.includes('p.screenshot')&&!sink.includes('p.evaluate'),'Exposed synchronous binding must never reenter Playwright page');console.log('PASS non-reentrant evidence sink');

const wave=readFileSync('tests/monster-natural-wave-browser.py','utf8');const waveSink=wave.slice(wave.indexOf(" def evidence("),wave.indexOf(" p.expose_binding("));assert(!waveSink.includes("p.screenshot")&&!waveSink.includes("p.evaluate"));assert(script.includes("qa.entry.resume||null")&&script.includes("qaStopAtCrowWarning"));assert(!wave.includes(".scene.x="));console.log("PASS wave checkpoint continuation, expression parsing and non-reentrant sink");
