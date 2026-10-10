import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness} from './app-regression-helpers.mjs';
const source=await readFile('shared/runtime/fullscreen-input.js','utf8');
function harness(){
    const windowListeners=new Map(),documentListeners=new Map();
    let time=1000,exits=0,uiCalls=0,fail=false;
    const add=(map)=>(type,fn,options)=>{const list=map.get(type)||[];list.push({fn,capture:!!options?.capture});map.set(type,list);};
    const document={fullscreenElement:null,addEventListener:add(documentListeners),async exitFullscreen(){exits++;if(fail)throw Error('denied');}};
    const window={addEventListener:add(windowListeners)};
    const g=vm.createContext({window,document,performance:{now:()=>time}});
    vm.runInContext(source,g);
    const change=active=>{document.fullscreenElement=active?{}:null;for(const {fn} of documentListeners.get('fullscreenchange')||[])fn();};
    const send=(type,extra={})=>{const e={code:'Escape',key:'Escape',repeat:false,prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...extra};for(const {fn,capture} of windowListeners.get(type)||[]){assert(capture||type==='blur');fn(e);if(e.stopped)break;}if(!e.stopped&&type==='keydown')uiCalls++;return e;};
    return {g,document,change,send,get exits(){return exits;},get uiCalls(){return uiCalls;},tick(ms){time+=ms;},fail(){fail=true;}};
}
for(const mode of ['generic downstream UI']){
    const h=harness();h.change(true);const e=h.send('keydown');assert(e.prevented&&e.stopped,mode);assert.equal(h.exits,1);assert.equal(h.uiCalls,0);
    h.change(false);h.send('keydown',{repeat:true});assert.equal(h.exits,1);assert.equal(h.uiCalls,0);
    assert(h.send('keyup').stopped);h.send('keydown');assert.equal(h.uiCalls,1,`${mode}: next Escape retains UI routing`);
}
{
    const h=harness();h.change(true);h.change(false); // browser exits before JS keydown
    assert(h.send('keydown').stopped);assert.equal(h.exits,0);h.send('keyup');h.send('keydown');assert.equal(h.uiCalls,1);
}
{
    const h=harness();h.change(true);h.change(false); // browser hides keydown entirely
    h.send('keyup');assert(!h.send('keydown').stopped);assert.equal(h.uiCalls,1);
}
for(const boundary of ['timeout','pointer','other key']){
    const h=harness();h.change(true);h.change(false);
    if(boundary==='timeout')h.tick(301);else if(boundary==='pointer')h.send('pointerdown');else h.send('keydown',{code:'KeyA',key:'a'});
    assert(!h.send('keydown').stopped,`native exit cleanup: ${boundary}`);
}
{
    const h=harness();h.change(true);await h.g.HonroFullscreenInput.exit();h.change(false);assert(!h.send('keydown').stopped,'button exit preserves next Escape');
}
{
    const h=harness();h.send('keydown');h.send('keydown',{repeat:true});h.send('keydown');assert.equal(h.uiCalls,1,'normal Escape has one UI action per press');h.send('keyup');h.send('keydown');assert.equal(h.uiCalls,2);
}
{
    const h=harness();h.change(true);h.fail();assert(h.send('keydown').stopped);await Promise.resolve();h.send('keydown',{repeat:true});assert.equal(h.exits,1);assert.equal(h.uiCalls,0);h.send('keyup');h.send('keydown');assert.equal(h.exits,2,'failed exit is retryable with a fresh press');
}
{
    const h=harness();h.send('keydown');h.send('blur');h.send('keydown');assert.equal(h.uiCalls,2,'blur clears lost keyup');
}
// Exercise production App routing under the capture guard. Canvas/DOM are doubles.
{
    const h=await appHarness(),app=h.load(h.profileThrough(4)),capture=new Map();
    h.g.window.addEventListener=(type,fn)=>{const a=capture.get(type)||[];a.push(fn);capture.set(type,a);};
    let exits=0;h.g.document.exitFullscreen=async()=>{exits++;};
    vm.runInContext(source,h.g);
    const send=type=>{const e={code:'Escape',key:'Escape',target:{tagName:'BUTTON'},preventDefault(){},stopImmediatePropagation(){this.stopped=true;}};for(const fn of capture.get(type)||[])fn(e);if(!e.stopped)for(const fn of h.listeners.get(type)||[]){fn(e);if(e.stopped)break;}return e;};
    for(const screen of ['title','rest','battle']){
        app.screen=screen;app.dialogue=null;app.close();
        for(const modal of [false,true]){
            if(modal)app.open('<button>Settings or journey content</button>','settings-dialog');
            const before=app.modal.classList.contains('open');
            h.g.document.fullscreenElement={};send('keydown');assert.equal(app.modal.classList.contains('open'),before,screen+' first Escape preserves modal');
            h.g.document.fullscreenElement=null;send('keyup');send('keydown');
            assert.equal(app.modal.classList.contains('open'),modal?false:screen==='battle',screen+' next Escape follows existing App routing');
            send('keyup');app.close();
        }
    }
    app.dialogue={index:0};let storyKeys=0;h.g.HonroStory.key=()=>{storyKeys++;};
    h.g.document.fullscreenElement={};send('keydown');assert.equal(storyKeys,0);h.g.document.fullscreenElement=null;send('keyup');send('keydown');assert.equal(storyKeys,1,'next Escape reaches dialogue');send('keyup');
    assert.equal(exits,7);
}
const build=await readFile('shared/build.mjs','utf8');
assert(build.indexOf("await read('shared/runtime/fullscreen-input.js')")<build.indexOf('for(const name of modelFiles)'),'guard precedes all runtime and editor handlers');
assert((await readFile('shared/runtime/main.js','utf8')).includes('await G.HonroFullscreenInput.exit();'));
console.log('PASS fullscreen Escape capture, both native event orders, repeated press, button exit, failure, and shared bundle contracts (VM events, not native browser evidence)');
