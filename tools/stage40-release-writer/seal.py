"""Pin the actual plan, compatibility result, and native canonical build; no network or writes to refs."""
import io,json,os,re,sys,zipfile
from pathlib import Path
from plan import P,B,T,A,S,need,fact,sha,git,at,plan

def receipts(verified,remote=True):
    data={}
    for lane,p in P['producers'].items():
        q=verified/lane
        if remote:
            r,j,a,c=(json.loads(at(q,k)) for k in ('run.json','job.json','art.json','commit.json'))
            need((r['id'],r['head_sha'],r['head_branch'],r['status'],r['conclusion'])==(p['run'],p['head'],p['branch'],'completed','success'),'wrong official run '+lane)
            need((j['id'],j['run_id'],j['head_sha'],j['name'],j['status'],j['conclusion'])==(p['job'],p['run'],p['head'],p['jobName'],'completed','success') and all(x['conclusion']=='success' for x in j['steps']),'wrong official job '+lane)
            need((c['sha'],[x['sha'] for x in c['parents']])==(p['head'],[B]),'wrong exact QA base '+lane)
            if lane=='canonical':need(c['tree']['sha']=='15e1f93419d905e4073887a38abfeebd9dd6080b','wrong reviewed author tree')
            need((a['id'],a['name'],a['workflow_run']['id'],a['workflow_run']['head_sha'],a['digest'],a['size_in_bytes'],a['expired'])==(p['artifact'],p['name'],p['run'],p['head'],'sha256:'+p['outer']['sha256'],p['outer']['bytes'],False),'wrong official artifact '+lane)
        raw=at(q,'archive.zip');need(fact(raw)==p['outer'],'wrong archive digest '+lane)
        with zipfile.ZipFile(io.BytesIO(raw)) as z:
            need(len(z.namelist())==len(set(z.namelist())) and sum(x.file_size for x in z.infolist())<35<<20 and z.testzip() is None,'broken artifact archive '+lane)
            proof={k:z.read(k) for k in p['receipts']};need({k:sha(v) for k,v in proof.items()}==p['receipts'],'receipt digest differs '+lane)
        data[lane]=proof
    pp=json.loads(data['plan']['ASSEMBLY.json'])
    f,g,c=(json.loads(data['fallback'][k]) for k in ('NATIVE-ACCEPTANCE.json','NORMAL-GRAPH.json','OFFICIAL-C2-ARM.json'))
    need(pp['base']==B and pp['tree']==P['expectedTree'] and pp['status']=='PLAN_ONLY_NO_COMMIT_NO_PUSH' and len(pp['diff'])==len(pp['files'])==13 and pp['retained']==1315,'invalid prior verified plan')
    need(g['base']==B and g['status']=='PASS_EXACT_FORWARD_FALLBACK_NO_DEPLOY' and g['active']==808 and len(g['aliases'])==4,'invalid fallback compiled evidence')
    need(c['status']=='QA_ONLY_ARCHIVED_NORMAL_C2_NOT_PUBLICATION' and c['currentBody']=='1647277:af3b90a3' and c['prior']['artifact']==P['producers']['canonical']['artifact'] and c['prior']['outer']==P['producers']['canonical']['outer'],'fallback did not author from authentic C2')
    need(f['status']=='PASS_EXACT_FALLBACK_ALL_DEVICE_SAVES_FROM_C2_AND_OLDER' and set(f['cases'])=={'PC','M'},'fallback native not qualified')
    for d in f['cases'].values():
        need(set(d['fresh'])==set(d['continue'])==set('HBCF') and all(n['checkpoint']=='complete' for lane in d.values() for n in lane.values()),'fallback native cases not all complete')
        need(d['fresh']['C']['save']['refs']['approved40:body']=='1647277:af3b90a3' and d['continue']['C']['input']==d['fresh']['C']['save']['digest'] and d['continue']['C']['refs']['approved40:body']=='1644042:df21ebc3' and d['continue']['C']['routes'],'fallback C2 actual cold cannot be established')
    return pp

def seal(repo,v,src,out):
    need(P['enabled'] is P['scopeApproval'] is P['refWriteEnabled'] is True and __debug__,'disabled')
    expected=receipts(v)
    plan(repo,v/'canonical/archive.zip',src,out)
    exact=json.loads(at(out,'ASSEMBLY.json'));need(exact==expected,'new exact assembly differs from independent plan')
    a=out/'base';tree=P['expectedTree']
    os.environ['GIT_AUTHOR_DATE']=os.environ['GIT_COMMITTER_DATE']=P['exactCommitDate']
    new=git(a,'-c','user.name=HONRO Release Writer','-c','user.email=41898282+github-actions[bot]@users.noreply.github.com','commit-tree',tree,'-p',B,'-m','Restore Stage 4-10 east masonry detail and preserve older saves')
    need(new==P['exactCandidateCommit'] and git(a,'show','-s','--format=%P %T',new)==B+' '+tree,'not exact sole-parent release candidate')
    exact.update(status='EXACT_STAGE40_C2_RELEASE_TREE_NO_PUSH',candidateCommit=new,exactReleaseDiff=expected['diff'],producers=P['producers'])
    (out/'ASSEMBLY.json').write_text(json.dumps(exact,indent=2)+'\n')

if __name__=='__main__':
    need(len(sys.argv)==5,'wrong seal invocation')
    seal(*(Path(x).resolve() for x in sys.argv[1:]))
