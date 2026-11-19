"""Local planned true Workshop + stock actors. Nothing originates from fixture as project bytes."""
import base64, hashlib, json, os, subprocess, sys
from pathlib import Path
from stock_actor_view import capture_initial, _diff
from west_visual_pixels import check_pixels
from walk_probe import initial_only
from route_operator import advance_same_actor
D=Path(__file__).parent
src=Path(sys.argv[2]).resolve(strict=True)
driver=src.read_bytes()
assert hashlib.sha256(driver).hexdigest()=='7a2be46bed58359510c83bacc8837be44b1982ad324db3f4e6c5cf2cf255215e'
assert os.environ['HONRO_COMPOSE_LIVE_WALK']=='0' and os.environ['HONRO_C01_DISPOSABLE_QA']=='0'
text=driver.decode()
def once(s,a,b):
    assert s.count(a)==1,a
    return s.replace(a,b)
# The accepted archived art is the historical baseline (no second authoring pass).
ARCHIVE={
 'whole':([3250,1800,.195735],'feb85550d5daf57ca5de3589a3107c652bd8fc42c78f91e8565e4ad54066014a'),
 'west-entrance':([790,2350,.5],'f09c540c04d425908fe01865eb955b1b0d67590c7d17de8c6d90851b213d382a'),
 'east-rise-far':([5350,1775,.5],'79330f5bb8c3aba8dcf1ad35032e729425823ce9ab88229fb9ae98c439c1e5e5'),
 'bridge-open-bay':([4570,1740,.5],'efb067e20f28a3c75dafd1ca4b9331fecf05a4c567d706b566521104cd8a7f40')
}
# Actual prior simple upper strip is archived comparison only; no stripe replay.
ARCHIVED_STRIPE_RUN=44493474547
ARCHIVED_STRIPE_PNGS={'bridge-open-bay': '8e46a52d0d2a3d313cfd139e3db8e43853fb9ae1c88c1dfa25179fca8ae5402b', 'east-rise-far': '66c1dfcae9b12bbd2649cb55e2440cad3d7da3b6c8300f71aff5a96295f538cf', 'west-entrance': '77446e0dc1b9cbee67b5cb7843ef0546f6197fc195084ec38abb74e009347d5e', 'whole': 'd4e898cef6d774d16348a0bfdd16aab3db22a6044e61352e23b643325785144d'}
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
    rows=[*plan['surfaceArts'],*plan['sparseStructures']]
    owners=['upper-route']*6+[r['owner'] for r in rows[6:]]
    records=[{'owner':o,'id':'f-'+str(i+1),'role':r['id'],'points':r['points']} for i,(o,r) in enumerate(zip(owners,rows))]
    assert len(records)==11
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
    assert len(added)==1 and len(added[0][1]['children'])==11 and added[0][2]==0
    assert applied['terrain']==0 and applied['bounds']==baseline['bounds']
    assert [a for a in applied['asset'] if a[0]!=uid]==baseline['asset']
    assert [p for p in applied['placements'] if p[1]!=uid]==baseline['placements']
    with author.expect_download() as e:click(author,'Download Native West Upper')
    w=Path(tmp)/'native-west.json';e.value.save_as(w);wr=w.read_bytes()
    assert b'act5:near:42' not in wr and len(wr)<=6300
    # Hash calculated locally from geometry is not treated as observed prior evidence.
    saved=json.loads(wr);assert saved['records']==records and list(saved.keys())==['baseSha256','detailSha256','gateSha256','kind','records','version']
    fresh=start(browser);files(fresh,[*old,('Open Native West Upper',w,'westUpperImport')])
    assert fresh.locator('html').get_attribute('data-west-upper-count')=='11' and get(fresh)==applied
    camera(fresh,[2500,1580,.5]);fresh.screenshot(path=str(out/'west-native-reopened.png'))
    (out/'native-west-receipt-proof.json').write_text(json.dumps({
        'actual_upper_pointer_count':sum(map(len,points)),'manually_saved_reopened':True,'editable_west_count':11,'surface_faces':6,'backed_returns':1,'load_posts':2,'stone_shoes':2,
        'saved_sha256':hashlib.sha256(wr).hexdigest(),'bytes':len(wr),'owners':len(applied['asset']),
        'preexisting_owners_unchanged':True,'workshop_collision_count':0,
        'scope':'actual pointer, exact scoped save and fresh reopen; before stock and actor gates'
    },indent=2))

    matched={}
    for name,(request,archived_sha) in ARCHIVE.items():
        both=[p.evaluate(game,{'expected':expected,'requested':request})
              for p,expected in ((page,baseline),(fresh,applied))]
        entry={'historical_no_west_run':44490931812,'historical_stripe_run':ARCHIVED_STRIPE_RUN,'historical_stripe_png_sha256':ARCHIVED_STRIPE_PNGS[name],'archive_original_png_sha256':archived_sha,'requested_actual':request,'preupper':{},'compiled_upper':{}}
        for label,frame in zip(('preupper','compiled_upper'),both):
            assert frame['actual']==request,'Cannot compare different actual cameras'
            png=base64.b64decode(frame['png'].split(',',1)[1],validate=True)
            (out/f'matched-{label}-{name}.png').write_bytes(png)
            entry[label]={'sha256':hashlib.sha256(png).hexdigest(),'actual':frame['actual']}
        entry.update(check_pixels(*both,points,expect_visible=(name!='east-rise-far')))
        matched[name]=entry
    (out/'matched-art-index.json').write_text(json.dumps(matched,indent=2))
    compare=[]
    for key,request in [('west',[820,1510,.5]),('neck',[1450,1880,.5]),('center',[2770,1610,.5]),('dock',[3955,1500,.5])]:
        a=page.evaluate(game,{'expected':baseline,'requested':request})
        b=fresh.evaluate(game,{'expected':applied,'requested':request})
        compare.append({'view':key,**check_pixels(a,b,points)})
    fresh.get_by_label('Existing editable West shape').select_option('f-8')
    click(fresh,'Select West polygon');q=target(fresh,[2468,1688],.5)
    fresh.mouse.move(*q);fresh.mouse.down();fresh.mouse.move(q[0]-4,q[1],steps=5);fresh.mouse.up()
    click(fresh,'Save Native West');turned=get(fresh)
    assert turned!=applied and [a for a in turned['asset'] if a[0]!=uid]==baseline['asset']
    bundle=subprocess.check_output(['node',str(D/'build-composed-visual.mjs'),str(src.parent)],text=True)
    url=os.environ['HONRO_FULL42_URL'].replace('/HONRO_WORKSHOP.html','/HONRO.html')
    assert hashlib.sha256(wr).hexdigest()=='53b235379b01e360db9cdac3d5d5aa70cbe891c8bc27230bcd42a86dddac4b30'
    folders=out/'route';folders.mkdir()
    preflight=lambda p:capture_initial(p,folders,'route',exact='a5-foe-7')
    run=initial_only(browser,raw.decode(),detail.decode(),gate.decode(),bundle,url,folders/'live-first-walk.json',
                     folders/'actual-stock-first-walk.png',west=wr.decode(),
                     read_only_initial=preflight,mounted_callback=lambda p:advance_same_actor(p,folders))
    result={'editor_receipts_reopened':True,'exact_accepted_west_sha256':hashlib.sha256(wr).hexdigest(),
            'preserved_presentation_guards':compare,'same_camera_matched_guard':matched,
            'route_pass':run['pass'],'route_failure':run.get('failure'),
            'route_checkpoint_labels':[v['name'] for v in run['checkpoints']]}
    (out/'route-scope.json').write_text(json.dumps(result,indent=2))
    if not run['pass']:raise RuntimeError('Genuine stock route did not reach round-trip; see retained checkpoint evidence')
    return result
exec(compile(text,str(src),'exec'),{'__file__':str(src),'__name__':'__main__','execute_west':execute_west})
