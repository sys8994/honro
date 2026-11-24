"""Optional end-to-end witness, call on stage entry before native input."""
from time import monotonic
DIG={
  51:('7d478815691a79c9e0022f6e0393b58d6748eaa0729b0026ef0cd289842a63cb','48d4036aca6003c5d6757ff3a6119d8272a2fbddf41d53e77ed559434b763ed1'),
  52:('8897aad86e693aec7e6b65227561fd8cbca3c70dacef436c879c96ea30cd0ddb',),
  53:('0d0d3394267326edf7ce343513d587e34eea98a4d4af7bbad59690f8ebff9aac',),
  54:('84a1ead89118f40e6671c7a0d22be91c4f435693076949940c330c9a13826ce4',),
  55:('de7755f7d65a8e2207d4dcce723628fb8017435838cc201fea6249b1a26953a4',),
  56:('bf12114eae958faef4f3619767fd492b241433dfac5ff6c6354d6451e5238d10',),
  57:('a4ae7057fd4a26dcc59d9f8c27fc42ed009dc4a3b7de248af999b2589bf0e7bb',),
}
def observe_normal_far(page,stage,mobile,out,case):
    expected=DIG[stage][int(bool(mobile) and stage==51)]
    begin=monotonic()
    result=None
    for _ in range(56):
        result=page.evaluate("""()=>{const a=HonroApp,e=a.engine,scene=a.scene;
          return {stage:e?.b.honroStage,mode:e?.b.mode,normal:a.profile===a.normalProfile,
          far:scene?.environmentStats?.authoredFar??[],n:scene?.environmentStats?.visibleAssets};}""")
        assert result['stage']==stage and result['mode']=='campaign' and result['normal']
        if result['far']==[expected]: break
        page.clock.run_for(24)
    assert result['far']==[expected],result
    page.screenshot(path=out/f'{case}-native-{stage}-normal-far.png')
    return {'stage':stage,'readyWallSeconds':monotonic()-begin,'selected':expected,'frameReadback':result}
