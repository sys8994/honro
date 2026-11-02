"""Closed-loop normal pointer input. Runtime reads are observation only."""
import math,time

def aim_with_joystick(page,target,state):
    before=state();box=page.locator('#joystick').bounding_box()
    if not box:return {'passed':False,'reason':'joystick not visible'}
    x=box['x']+box['width']/2;y=box['y']+box['height']/2
    radius=.41*min(box['width'],box['height']);samples=[]
    page.mouse.move(x,y);page.mouse.down()
    try:
        direction=1 if (target-before['angle'])*before['facing']>=0 else -1
        page.mouse.move(x,y-direction*(max(.18*radius,8)+1))
        started=time.monotonic()
        while time.monotonic()-started<=20:
            q=state();delta=target-q['angle']
            samples.append({'angle':q['angle'],'delta':delta})
            if q['active']!=before['active'] or q['facing']!=before['facing'] or not q['can']:break
            if abs(delta)<=.07:break
            if time.monotonic()-started>20:break
            speed=min(.8,max(.012,abs(delta)/25))
            displacement=radius*(.12+.88*speed**(1/1.35))
            direction=1 if delta*q['facing']>0 else -1
            page.mouse.move(x,y-direction*displacement)
            page.wait_for_timeout(35)
    finally:
        page.mouse.move(x,y);page.mouse.up()
    page.wait_for_timeout(100);after=state()
    unchanged=all(abs((after.get(k) or 0)-(before.get(k) or 0))<.001 for k in ('x','y','moveLeft'))
    released=page.evaluate('!HonroApp.stickPointer && HonroApp.stick.x===0 && HonroApp.stick.y===0')
    passed=released and after['can'] and after['grounded'] and after['round']==before['round'] and unchanged and after['active']==before['active'] and after['facing']==before['facing'] and abs(after['angle']-target)<=.1
    return {'passed':passed,'target':target,'actual':after['angle'],'unchangedPositionAndMovement':unchanged,'samples':samples,'before':before,'after':after}
