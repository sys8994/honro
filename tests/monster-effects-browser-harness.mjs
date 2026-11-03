/** Fast browser-harness preflight, not browser/gameplay evidence. Playwright
 * invokes a function returned by evaluate; installation must return undefined. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const source=await readFile(new URL('./monster-effects-browser.py',import.meta.url),'utf8');
const installers=[...source.matchAll(/p\.evaluate\(("(?:[^"\\]|\\.)*")\)/g)].map(m=>JSON.parse(m[1])).filter(s=>s.includes('window.monsterCanonical=')||s.includes('window.monsterPaint='));
assert.equal(installers.length,2,'exact helper installer coverage');
const g=vm.createContext({HonroApp:{engine:null,scene:null},performance:{now:()=>1}});g.window=g;
for(const code of installers){const evaluated=vm.runInContext(code,g);const result=typeof evaluated==='function'?evaluated(undefined):evaluated;assert.equal(result,undefined,'installer never returns another callable');}
assert.equal(typeof g.monsterCanonical,'function');assert.equal(typeof g.monsterPaint,'function');
assert.equal(g.monsterCanonical({b:2,a:1}),g.monsterCanonical({a:1,b:2}));
const calls=[];Object.assign(g,{HonroStory:{turnPaused:()=>false}});Object.assign(g.HonroApp,{modal:{classList:{contains:()=>false}},renderBattleFrame:(...args)=>calls.push(args)});
assert.equal(g.monsterPaint(),false);assert.equal(calls.length,1);assert.equal(calls[0][3],false);
g.HonroApp.dialogue={};assert.equal(g.monsterPaint(),true);assert.equal(calls[1][3],true);
delete g.HonroApp.dialogue;g.HonroStory.turnPaused=()=>true;assert.equal(g.monsterPaint(),true);
g.HonroStory.turnPaused=()=>false;g.HonroApp.modal.classList.contains=()=>true;assert.equal(g.monsterPaint(),true);
g.HonroApp.modal.classList.contains=()=>false;g.HonroApp.done=true;assert.equal(g.monsterPaint(),true);
g.HonroApp.done=false;assert.equal(g.monsterPaint(),false);
console.log('PASS monster browser helper installation is inert on title and derives App pause state');

// Parse every literal evaluate/wait expression plus named SETUP/RESPOND via the
// Python AST, rather than letting quoting or one forgotten helper fail in CI.
const extractor=`import ast,json,sys
module=ast.parse(sys.stdin.read())
constants={n.targets[0].id:n.value.value for n in module.body if isinstance(n,ast.Assign) and len(n.targets)==1 and isinstance(n.targets[0],ast.Name) and isinstance(n.value,ast.Constant) and isinstance(n.value.value,str)}
expressions=[]
for n in ast.walk(module):
 if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr in ('evaluate','wait_for_function') and n.args:
  arg=n.args[0]
  value=arg.value if isinstance(arg,ast.Constant) else constants.get(arg.id) if isinstance(arg,ast.Name) else None
  if not isinstance(value,str):raise ValueError('Uncovered JavaScript argument at line '+str(n.lineno))
  expressions.append({'line':n.lineno,'code':value})
print(json.dumps(expressions))`;
const expressions=JSON.parse(execFileSync('python3',['-c',extractor],{input:source,encoding:'utf8'}));
assert(expressions.length>=25,'whole browser harness expression coverage');
for(const {line,code} of expressions)new vm.Script('('+code+'\n)',{filename:'monster-effects-browser.py:'+line});
console.log('PASS all '+expressions.length+' browser evaluate/wait expressions parse, including SETUP/RESPOND');
