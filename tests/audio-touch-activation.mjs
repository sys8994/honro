// Production App input routing; DOM/WebAudio are doubles, not Android speaker evidence.
import assert from 'node:assert/strict';
import {appHarness} from './app-regression-helpers.mjs';
const h=await appHarness(),app=h.load(h.profileThrough(4)),before=JSON.stringify(app.profile),calls=[];
app.audio={configure(settings){assert.equal(settings,app.profile.settings);},wake(gesture){calls.push(gesture);}};
const send=(type,extra={})=>{for(const fn of h.listeners.get(type)||[])fn({target:{tagName:'BUTTON',closest:()=>null},preventDefault(){},...extra});};
send('pointerdown',{pointerType:'touch'});assert.equal(calls.length,0,'touch press precedes activation');
send('pointerup',{pointerType:'touch'});assert.deepEqual(calls,[true],'touch release retries device resume');
send('pointerdown',{pointerType:'pen'});assert.equal(calls.length,1);
send('pointerup',{pointerType:'pen'});assert.equal(calls.length,2);
send('pointerdown',{pointerType:'mouse'});assert.equal(calls.length,3,'mouse starts on press');
send('pointerup',{pointerType:'mouse'});assert.equal(calls.length,3);
send('touchend');send('click');send('keydown',{code:'KeyQ'});assert.equal(calls.length,6);assert(calls.every(Boolean));
assert.equal(JSON.stringify(app.profile),before,'audio recovery leaves settings and campaign untouched');
console.log('PASS touch/pen release, legacy touch, mouse, keyboard and assistive click activation; profile unchanged');
