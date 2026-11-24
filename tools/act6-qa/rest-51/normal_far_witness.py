"""Optional end-to-end witness, call on stage entry before native input."""
from time import monotonic
import json
import os
DIG={
  51:('7d478815691a79c9e0022f6e0393b58d6748eaa0729b0026ef0cd289842a63cb','48d4036aca6003c5d6757ff3a6119d8272a2fbddf41d53e77ed559434b763ed1'),
  52:('8897aad86e693aec7e6b65227561fd8cbca3c70dacef436c879c96ea30cd0ddb',),
  53:('0d0d3394267326edf7ce343513d587e34eea98a4d4af7bbad59690f8ebff9aac',),
  54:('84a1ead89118f40e6671c7a0d22be91c4f435693076949940c330c9a13826ce4',),
  55:('de7755f7d65a8e2207d4dcce723628fb8017435838cc201fea6249b1a26953a4',),
  56:('bf12114eae958faef4f3619767fd492b241433dfac5ff6c6354d6451e5238d10',),
  57:('a4ae7057fd4a26dcc59d9f8c27fc42ed009dc4a3b7de248af999b2589bf0e7bb',),
  58:('696fd1dfe489567e8032a3f2a2a8be45539ddae488e67baf01f37f82c382e22d',),
  59:('e1b0e699a8349a0af93f4717b06ef4a7ddffa5b4abf15261cd3881d3691383e1',),
  60:('13785df44a84667e09db1184c5c6162f20ba4fdaedeb0bad359c315700fa8b17',),
}
def observe_normal_far(page,stage,mobile,out,case):
    expected=DIG[stage][int(bool(mobile) and stage==51)]
    begin=monotonic()
    result=None
    for _ in range(112):
        result=page.evaluate("""()=>{const a=HonroApp,e=a.engine,scene=a.scene;
          return {stage:e?.b.honroStage,mode:e?.b.mode,normal:a.profile===a.normalProfile,
          terrain:scene?.act6TerrainArtStats??null,far:scene?.environmentStats?.authoredFar??[],n:scene?.environmentStats?.visibleAssets};}""")
        assert result['stage']==stage and result['mode']=='campaign' and result['normal']
        if result['far']==[expected] and (not os.environ.get('HONRO_ACT6_TERRAIN_PROOF') or result['terrain']): break
        page.clock.run_for(24)
        if stage>=58: page.wait_for_timeout(12)
    assert result['far']==[expected],result
    if os.environ.get('HONRO_ACT6_TERRAIN_PROOF'):
        (out/f'{case}-terrain-{stage}.json').write_text(json.dumps(result,indent=2)+'\n')
        assert result['terrain'] and result['terrain']['revision']==2 and result['terrain']['stage']==stage and result['terrain']['drawCalls']>0,result
    page.screenshot(path=out/f'{case}-native-{stage}-normal-far.png')
    return {'stage':stage,'readyWallSeconds':monotonic()-begin,'selected':expected,'frameReadback':result}
