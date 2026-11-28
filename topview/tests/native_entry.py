"""Use the production title, opening player and rest menu for the playable fork."""
def enter_chapter(page, mobile=False):
    def press(button):
        if mobile: button.tap(timeout=30000)
        else: button.click(timeout=30000)
    title=page.locator('.honro-title .title-actions button[data-action]').first
    title.wait_for(timeout=90000)
    press(title)
    page.wait_for_function("HonroApp.screen!=='title' || !!document.getElementById('campaign-opening')")
    cut=page.locator('#campaign-opening')
    if cut.count():
        nodes=[]
        while cut.count():
            page.wait_for_function("!document.getElementById('campaign-opening')||document.getElementById('campaign-opening').dataset.endingBeat!==undefined")
            if not cut.count():break
            previous=[cut.get_attribute('data-ending-still'),cut.get_attribute('data-ending-beat')]
            if previous[0] not in nodes:nodes.append(previous[0])
            if len(nodes)>6:raise AssertionError(nodes)
            if mobile:page.touchscreen.tap(25,page.viewport_size['height']//2)
            else:page.keyboard.press('Space')
            page.wait_for_function("([id,beat])=>{const n=document.getElementById('campaign-opening');return !n||n.dataset.endingStill!==id||n.dataset.endingBeat!==beat;}",arg=previous,timeout=12000)
        assert len(nodes)==5,nodes
    page.wait_for_function("['battle','rest'].includes(HonroApp.screen)")
    if page.evaluate("HonroApp.screen==='rest'"):
        page.wait_for_function("performance.now()>=(HonroApp.journeyInputAfter||0)")
        press(page.locator('[data-action="journey-enter"]:visible').first)
    page.wait_for_function("!!HonroApp.engine?.b.honroTopview",timeout=30000)
