"""Build test-only browser adapters from frozen policy sources; no game bundle build."""
import hashlib,json,pathlib,re,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1];F=ROOT/'tests/fixtures/monster-natural';OUT=ROOT/'_local/reports/monster-natural';OUT.mkdir(parents=True,exist_ok=True)
def source(p):return (ROOT/p).read_text()
def strip(s):return re.sub(r'^import .*?;\n','',s,flags=re.M).replace('export function ','function ').replace('export const ','const ')
def helper(path,names):return '(function(){\n'+strip(source(path))+'\nreturn {'+','.join(names)+'};})()'
ops=strip((F/'player-operations.mjs').read_text()).replace('app.scene.render=render;','')
common=source('tests/monster-natural-runtime.js')+'\n'+ops
planner=(F/'stage5-planner.js').read_text()
run5=source('tests/monster-natural-stage5.js').replace('/*PLANNER*/',planner)
s=(F/'stage8-controller.mjs').read_text();s=s[s.index('let virtualMs='):];start=s.index('assert.equal(b.honroStage8BierRevision');s='const resume=null;let virtualMs=0;let app=HonroApp,e=app.engine,b=e.b;'+s[start:]
s=s[:s.rindex("if(b.phase==='won')")]+"\nawait qaFinish({phase:b.phase,round:b.round,stopReason});"
s=s.replace('process.env.HONRO_FULLPLAY_ACTION_LIMIT||450','process.env.HONRO_FULLPLAY_ACTION_LIMIT||150').replace('process.env.HONRO_FULLPLAY_ROUND_LIMIT||65','process.env.HONRO_FULLPLAY_ROUND_LIMIT||25')
s=s.replace('Normal production inputs with DOM/render/storage/clock doubles; not browser proof.','Production App and renderer in Chromium; virtual clock and programmatic App inputs, not manual pointer-only play.')
# Retain exact controller, navigator and detached prediction policy. Node IO becomes
# an awaited browser evidence sink; normal export/Continue still runs production APIs.
helpers='const {escortNavigator}='+helper('tests/fixtures/monster-natural/stage8-navigator.mjs',['escortNavigator'])+';\n'
helpers+='const {representativeTargets,representativeMelee,representativeBladePrediction,analyzeWaits}='+helper('tests/stage18-bell-fullplay-helper.mjs',['representativeTargets','representativeMelee','representativeBladePrediction','analyzeWaits'])+';\n'
helpers+='const {auditQuarryEngine}='+helper('tests/stage12-quarry-fullplay-helper.mjs',['auditQuarryEngine'])+';\n'
base=(F/'baseline-condition.mjs').read_text();det=base[base.index('export function detachedPrediction'):base.index('/** Rewrite')].replace('export function ','function ')
pre='''const out='stage8',fixture=qa.entry,stage=HONRO_PROJECT.stages[7],basicOnly=false,representativeAttacks=true,useSupplies=false;const sourceHash=qa.meta.candidate,runtimeSha256=qa.meta.runtimeSha256,provenance=qa.meta;const baselineAudit={plan:(e,m,args,p)=>detachedPrediction(C,e,m,args,p)};const process={env:{},exitCode:0};
const writeFile=async(name,data)=>{await qaWrite(name,data);},h={exported:async()=>{await qa.pendingExport;return plain(qa.lastExport);},load:profile=>{const a=HonroApp;a.stopBattle();a.event=qa.originalEvent;a.profile=a.normalProfile=plain(profile);return a;}};
'''
script=common+'\nwindow.qaRun5='+run5+';\nwindow.qaRun8=async()=>{'+helpers+det+pre+s+'};\n'
(OUT/'controller.js').write_text(script)
subprocess.run(['node','--check',str(OUT/'controller.js')],check=True)
manifest={'candidate':'7d2655bc3f88a7b20fb2d6ea1bc4c611583e9a15','scope':'INTERMEDIATE natural-route diagnostic on immutable A1 candidate; not final-release gate','adapters':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT/'tests/monster-natural-runtime.js',ROOT/'tests/monster-natural-stage5.js',*F.iterdir()] if p.is_file()},'controllerSha256':hashlib.sha256(script.encode()).hexdigest()}
(OUT/'controller-manifest.json').write_text(json.dumps(manifest,indent=2));print('PASS generated browser policy syntax and frozen fixture provenance')
