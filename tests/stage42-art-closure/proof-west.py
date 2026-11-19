"""Local planned true Workshop + stock actors. Nothing originates from fixture as project bytes."""
import base64, hashlib, json, os, subprocess, sys
from pathlib import Path
from stock_actor_view import capture_initial, _diff
from west_visual_pixels import check_pixels
from walk_probe import initial_only
D=Path(__file__).parent
src=Path(sys.argv[2]).resolve(strict=True)
driver=src.read_bytes()
assert hashlib.sha256(driver).hexdigest()=='375b0346e93af6e51fcee7c6ccb988917ac3ef9260b00206a652f263656e322a'
assert os.environ['HONRO_COMPOSE_LIVE_WALK']=='0' and os.environ['HONRO_C01_DISPOSABLE_QA']=='0'
text=driver.decode()
def once(s,a,b):
    assert s.count(a)==1,a
    return s.replace(a,b)
# The accepted archived art is the historical baseline (no second authoring pass).
ARCHIVE={
 'whole':([3250,1800,.195735],'8d92f489a01ed22cdbd2329c9ff94ee934248750c3c431cac5789f388970754b'),
 'west-entrance':([790,2350,.5],'da2262c4134539c3a630ba697e1e51c56159df7b2c39eb99da1d8b73963add64'),
 'east-rise-far':([5350,1775,.5],'66c1dfcae9b12bbd2649cb55e2440cad3d7da3b6c8300f71aff5a96295f538cf'),
 'bridge-open-bay':([4570,1740,.5],'bf28df976890a3475dff052c0d9ea6136bd3a0793dba1d60ce3b5a93d9e1d350'),
 'left-keyed-plate':([1175,2260,.5],None),
 'right-exposed-lip':([4480,1840,.5],None),
 'gate':([6000,1140,.5],None),
 'gate-detail':([6055,1130,.9],None)
}
# Original exact Gate opening guard uses both whole and gate. Reuse one authentic
# candidate source and specialize only extra screenshot cases below.
text=once(text,"cameras=json.loads((D/'review-cameras.json').read_text())",
          "cameras=[v for v in json.loads((D/'review-cameras.json').read_text()) if v['id'] in ('whole','gate')]\nassert [v['id'] for v in cameras]==['whole','gate']")
start="   r['legal_device_extremes']={}"; end="   ck('device-focus-extrema-captured')"
k=text.index(start); j=text.index(end,k)+len(end)
text=text[:k]+"   ck('stock-slate-gate-control-accepted')"+text[j:]
check="   returned.get_by_label('Existing editable Gate role').select_option('f-11');click(returned,'Select Gate polygon')"
extra="""
   west_path=execute_west(b,returned,start,click,draw,target,camera,get,game,raw,detail_bytes,rb,f,g,h,out,td,gate_state)
   r['west_native']=west_path
   ck('actual-west-native-saved-reopened-and-scoped')
"""
text=once(text,check,extra+check)
def execute_west(browser,page,start,click,draw,target,camera,get,game,raw,detail,gate,f,g,h,out,tmp,baseline):
    # prior Slate context stays exact so old recorder can finish its own re-edit separately
    author=start(browser)
    def files(p,items):
        for label,file,key in items:
            with p.expect_file_chooser() as e:click(p,label)
            e.value.set_files(str(file))
            p.wait_for_function("k=>['opened','error'].includes(document.documentElement.dataset[k])",arg=key)
            assert p.evaluate('k=>document.documentElement.dataset[k]',key)=='opened'
    old=[('전체 초안 열기',f,'full42Import'),('전체 상세 초안 열기',g,'wholeDetailImport'),('Open Native Gate',h,'gateImport')]
    files(author,old);assert get(author)==baseline
    plan=json.loads((D/'upper-structure-pointer.json').read_text())
    rows=[*plan['surfaceArts'],*plan['sparseStructures'],*(dict(x,id=x['role']) for x in json.loads((D/'upper-joint-delta.json').read_text())['add'])]
    owners=['upper-route']*6+[r['owner'] for r in rows[6:]]
    records=[{'owner':o,'id':'f-'+str(i+1),'role':r['id'],'points':r['points']} for i,(o,r) in enumerate(zip(owners,rows))]
    assert len(records)==13
    points=[r['points'] for r in records]
    click(author,'Start Native West Upper')
    author.wait_for_function("document.documentElement.dataset.westUpperStatus==='west-ready'")
    for i,row in enumerate(records):
        author.get_by_label('West upper owner').select_option(row['owner'])
        author.get_by_label('Native West role').select_option(row['role'])
        click(author,'New West polygon')
        for xy in row['points']:
            draw(author,{'at':xy,'ownedEndpoint':xy in ([4030,1339],[4030,1416])})
        click(author,'Close West polygon')
        assert int(author.locator('html').get_attribute('data-west-upper-count'))==i+1,(row['role'],author.locator('#toast').text_content())
    click(author,'Preview Native West');assert get(author)==baseline
    camera(author,[2500,1580,.5]);author.screenshot(path=str(out/'west-native-preview.png'))
    click(author,'Save Native West')
    author.wait_for_function("document.documentElement.dataset.westUpperStatus==='west-manual-save'")
    applied=get(author);uid='new-stage42-upper-west-palisade'
    added=[v for v in applied['asset'] if v[0]==uid]
    assert len(added)==1 and len(added[0][1]['children'])==13 and added[0][2]==0
    assert applied['terrain']==0 and applied['bounds']==baseline['bounds']
    assert [a for a in applied['asset'] if a[0]!=uid]==baseline['asset']
    assert [p for p in applied['placements'] if p[1]!=uid]==baseline['placements']
    with author.expect_download() as e:click(author,'Download Native West Upper')
    w=Path(tmp)/'native-west.json';e.value.save_as(w);wr=w.read_bytes()
    assert b'act5:near:42' not in wr and len(wr)<=6300
    assert hashlib.sha256(wr).hexdigest()=='44385c2819456b2858f71b9d81de2752cfdf3e21cb1c19e93d5ace1cfdd0ad1c','Actual native finish receipt differs from planned pin'
    # Hash calculated locally from geometry is not treated as observed prior evidence.
    saved=json.loads(wr);assert saved['records']==records and list(saved.keys())==['baseSha256','detailSha256','gateSha256','kind','records','version']
    fresh=start(browser);files(fresh,[*old,('Open Native West Upper',w,'westUpperImport')])
    assert fresh.locator('html').get_attribute('data-west-upper-count')=='13' and get(fresh)==applied
    camera(fresh,[2500,1580,.5]);fresh.screenshot(path=str(out/'west-native-reopened.png'))
    (out/'native-west-receipt-proof.json').write_text(json.dumps({
        'actual_upper_pointer_count':sum(map(len,points)),'manually_saved_reopened':True,'editable_west_count':13,'surface_faces':6,'backed_returns':1,'load_posts':2,'stone_shoes':2,'new_true_joints':2,
        'saved_sha256':hashlib.sha256(wr).hexdigest(),'bytes':len(wr),'owners':len(applied['asset']),
        'preexisting_owners_unchanged':True,'workshop_collision_count':0,
        'scope':'actual pointer, exact scoped save and fresh reopen; before stock and actor gates'
    },indent=2))

    matched={}
    for name,(request,archived_sha) in ARCHIVE.items():
        both=[p.evaluate(game,{'expected':expected,'requested':request})
              for p,expected in ((page,baseline),(fresh,applied))]
        entry={'baseline_multiface_run':44495932218 if archived_sha else None,'baseline_multiface_png_sha256':archived_sha,'same_run_control':'closure lower and Gate, upper OFF; not previous whole art baseline','requested_actual':request,'preupper':{},'compiled_upper':{}}
        for label,frame in zip(('preupper','compiled_upper'),both):
            assert frame['actual']==request,'Cannot compare different actual cameras'
            png=base64.b64decode(frame['png'].split(',',1)[1],validate=True)
            (out/f'matched-{label}-{name}.png').write_bytes(png)
            entry[label]={'sha256':hashlib.sha256(png).hexdigest(),'actual':frame['actual']}
        entry.update(check_pixels(*both,points,expect_visible=(name not in ('east-rise-far','gate','gate-detail'))))
        matched[name]=entry
    (out/'matched-art-index.json').write_text(json.dumps(matched,indent=2))
    compare=[]
    for key,request in [('west',[820,1510,.5]),('neck',[1450,1880,.5]),('center',[2770,1610,.5]),('dock',[3955,1500,.5])]:
        a=page.evaluate(game,{'expected':baseline,'requested':request})
        b=fresh.evaluate(game,{'expected':applied,'requested':request})
        compare.append({'view':key,**check_pixels(a,b,points)})
    fresh.get_by_label('Existing editable West shape').select_option('f-12')
    click(fresh,'Select West polygon');q=target(fresh,[2464,1577],.5)
    fresh.mouse.move(*q);fresh.mouse.down();fresh.mouse.move(q[0]-1,q[1],steps=5);fresh.mouse.up()
    click(fresh,'Save Native West');turned=get(fresh)
    assert turned!=applied and [a for a in turned['asset'] if a[0]!=uid]==baseline['asset']
    bundle=subprocess.check_output(['node',str(D/'build-composed-visual.mjs'),str(src.parent)],text=True)
    url=os.environ['HONRO_FULL42_URL'].replace('/HONRO_WORKSHOP.html','/HONRO.html')
    choices={}
    for label,wtext in [('before',None),('after',wr.decode())]:
        folders=out/label;folders.mkdir(exist_ok=True)
        def initial(p):
            try:choices[label]=capture_initial(p,folders,label,exact='a5-foe-7')
            except Exception as e:
                # Scope diagnostic is separate; restore camera and still measure
                # authentic initial movement; never claim a missing actor check.
                choices[label]={'actor_probe_failed':type(e).__name__,'reason':str(e)}
                (folders/f'{label}-actor-failure.json').write_text(json.dumps(choices[label]))
        initial_only(browser,raw.decode(),detail.decode(),gate.decode(),bundle,url,folders/'live-first-walk.json',
                     folders/'actual-stock-first-walk.png',west=wtext,read_only_initial=initial)
    # Compare natural stock initial roster, not visual candidate vs exact NPC state mutations.
    actor_pair=all('actor_probe_failed' not in d for d in choices.values())
    if actor_pair:
        assert choices['before']['stage_actors']['state']==choices['after']['stage_actors']['state'],'Stock phase/mission differs between initial contexts'
        paired_roster_diff={u['id'] for u in choices['before']['stage_actors']['actors']} ^ {u['id'] for u in choices['after']['stage_actors']['actors']}
        pair_deltas=_diff(choices['before']['stage_actors'],choices['after']['stage_actors'])
        (out/'before'/'before-actor-pair.json').write_text(json.dumps({'initial_roster_identity_difference':sorted(paired_roster_diff),'cross_context_exact_actor_deltas':pair_deltas},indent=2))
        assert not pair_deltas,f'Stock initial actor telemetry differs across contexts: {sorted(pair_deltas)}'
        assert not paired_roster_diff,f'Initial stock actor identity difference: {paired_roster_diff}'
        assert choices['before']['selected']==choices['after']['selected']
        assert [(s['name'],s['actual']) for s in choices['before']['shots']]==[(s['name'],s['actual']) for s in choices['after']['shots']],'Independent view camera transforms differ'
    else:
        raise RuntimeError('Native art and both initial lower walks emitted; read-only actor camera witness blocked')
    return {'prompt_clicks':sum(map(len,points)),'saved_sha256':hashlib.sha256(wr).hexdigest(),'saved_bytes':len(wr),
            'editor_fresh_reopen':True,'same_camera_pixel_guards':compare,'archive_linked_matched_views':matched,'upper_natural_actor':choices['after']['selected'],
            'before_after_ground_walk':'actual held D/A observed; never claimed upper or narrow traversal'}
exec(compile(text,str(src),'exec'),{'__file__':str(src),'__name__':'__main__','execute_west':execute_west})
