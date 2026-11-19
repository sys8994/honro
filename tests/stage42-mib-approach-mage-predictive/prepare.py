"""QA only. One detatched original worktree and scoped Stage42 return-time input."""
import hashlib,json,pathlib,sys,subprocess,os
P=pathlib.Path(__file__).resolve().parent
m=json.loads((P/'manifest.json').read_bytes());sha=lambda s:hashlib.sha256(s).hexdigest()
root=pathlib.Path(sys.argv[1]).resolve(strict=True); temp=pathlib.Path(os.environ['RUNNER_TEMP']).resolve(strict=True)
assert root==temp/'c-stage42-entry-fixture' and pathlib.Path(sys.argv[1]).absolute()==root and (root/'.git').is_file()
assert root!=pathlib.Path(os.environ['GITHUB_WORKSPACE']).resolve(strict=True)
def git(*a):return subprocess.check_output(['git','-C',str(root),*a],text=True).strip()
assert git('rev-parse','HEAD')==m['pin'] and git('rev-parse','--show-toplevel')==str(root)
assert subprocess.run(['git','-C',str(root),'symbolic-ref','-q','HEAD'],capture_output=True).returncode==1
assert not git('status','--porcelain','--untracked-files=all')
for k,v in m['stockSha256'].items():
 assert sha(subprocess.check_output(['git','-C',str(root),'show',m['pin']+':'+k]))==v,k
s=(P/'official-qa-stage.json').read_bytes();assert sha(s)==m['inputSha256']
data=json.loads(s);stage=data.get('stage',data)
assert stage['id']=='stage-42' and stage['metadata']['stageId']==42 and stage['metadata']['campaign'] is True
assert stage['width']==6500 and len(stage['units'])==33
assert len(stage['terrains'])>=5 and not stage['elements'],'No old near art or visual assets permitted'
assert [p['id'] for p in stage['terrains']].count('a5-device-0')==1
owned=root/'shared/act5-world.mjs';assert owned.resolve()==owned
packed=root/'shared/data/act5/stage42-c-entry.witness.json';assert not packed.exists() and packed.parent.resolve()==packed.parent
source=owned.read_bytes();assert sha(source)==m['stockSha256']['shared/act5-world.mjs']
src=source.decode()
old=' return {name,library,stages,content};'
new=''' const QA42=JSON.parse(await readFile(new URL('./data/act5/stage42-c-entry.witness.json',import.meta.url),'utf8'));
 const qi=stages.findIndex(s=>s.metadata.stageId===42);
 if(qi<0||QA42.id!==stages[qi].id||QA42.width!==stages[qi].width)throw Error('Isolated Stage 42 source seam');
 stages[qi]=QA42;
 const ci=content.findIndex(s=>s.id===42);if(ci<0)throw Error('Missing official Stage 42 catalog entry');
 content[ci]={...content[ci],h:QA42.height};
 return {name,library,stages,content};'''
assert src.count(old)==1
owned.write_text(src.replace(old,new))
packed.write_text(json.dumps(stage,separators=(',',':'))+'\n')
assert git('diff','--name-only')=='shared/act5-world.mjs'
assert git('ls-files','--others','--exclude-standard')=='shared/data/act5/stage42-c-entry.witness.json'
