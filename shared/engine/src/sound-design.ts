import {BgmPlayer, type MusicState} from './bgm';
import type { Profile } from './types';

/** Damped material sounds: no UI bleeps, pitch sweeps or victory jingles. */
export function soundSamples(name:string,sr=24000):Float32Array {
    const recipes:Record<string,number[]>={
        // seconds, body Hz, noise cutoff Hz, body gain, texture gain, decay
        sodanBell:[.72,742,2600,.26,.018,5.5],
        arrow:[.27,146,1800,.29,.26,8], arrowhit:[.30,94,1150,.42,.38,10],
        sword:[.34,108,1900,.24,.40,7], fire:[.55,69,900,.42,.46,5],
        charge:[.22,122,580,.06,.08,9], meteor:[1.15,43,760,.58,.52,3.6],
        spiritCast:[.38,128,1280,.29,.34,6], spiritImpact:[.36,86,1200,.42,.41,8],
        spiritSummon:[.58,72,940,.34,.38,5],
        boom:[.95,49,820,.61,.52,4], hit:[.30,86,1050,.41,.38,9],
        break:[.58,112,1500,.24,.47,6], ricochet:[.22,224,1500,.16,.29,12],
        split:[.32,137,1250,.22,.25,8], heal:[.65,98,500,.15,.18,5],
        qiWave:[.64,76,1650,.32,.48,4.8], qiHit:[.39,103,1350,.52,.38,8],
        qiRebound:[.25,182,1150,.27,.29,11], ceramic:[.23,286,1800,.29,.32,13],
        down:[.57,58,680,.33,.25,5], win:[1.1,64,560,.32,.21,4],
        lose:[.85,47,430,.29,.22,4], turn:[.32,82,600,.15,.13,9], jump:[.20,106,800,.11,.16,10]
    };
    const r=recipes[name];if(!r)return new Float32Array(0);
    const [duration,f,cutoff,body,texture,decay]=r,out=new Float32Array(Math.ceil(sr*duration));
    let seed=[...name].reduce((v,c)=>(Math.imul(v,33)+c.charCodeAt(0))>>>0,71237),low=0,brown=0,dc=0;
    const a=1-Math.exp(-2*Math.PI*cutoff/sr);
    for(let i=0;i<out.length;i++){
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        const noise=seed/2147483648-1,t=i/sr,q=t/duration;
        low+=a*(noise-low);brown=.985*brown+.15*noise;
        const modes=Math.sin(t*f*6.28318)*Math.exp(-decay*q)+.32*Math.sin(t*f*1.71*6.28318)*Math.exp(-decay*1.7*q)+.16*Math.sin(t*f*2.63*6.28318)*Math.exp(-decay*2.4*q);
        const breath=name==='qiWave'?Math.sin(Math.PI*Math.min(1,t/.13))*.3+1:1;
        const air=(low*.75+brown*.25)*Math.exp(-decay*.9*q)*breath;
        const attack=Math.min(1,t/.008),end=Math.min(1,(duration-t)/.035);
        const v=(modes*body+air*texture)*attack*end;
        dc=.996*dc+.004*v;out[i]=Math.tanh((v-dc)*.85)*.8;
    }
    return out;
}

/** One context, unlocked by the same trusted gesture as the controls. */
export class AudioEngine {
    music=new BgmPlayer();
    enabled=true; volume=.55; context:AudioContext|null=null; master:GainNode|null=null;
    buffers=new Map<string,AudioBuffer>(); voices=new Set<AudioBufferSourceNode>();
    private gainTarget=-1; private warming=false;
    pending:{name:string;at:number}[]=[];
    lastPlayed:Record<string,number>={};requestedAt:Record<string,number>={};startedAt:Record<string,number>={};playCount=0;
    static samples=soundSamples;
    configure(s:Profile['settings']){
        const settings=s as Profile['settings']&{music?:boolean;musicVolume?:number};
        this.music.configure(settings.music!==false,(Number(s.volume)||0)*(settings.musicVolume??.65));
        this.enabled=!!s.sound;this.volume=Math.max(0,Math.min(1,Number(s.volume)||0));
        const gain=this.enabled?this.volume:0;
        if(this.master&&this.context&&gain!==this.gainTarget){this.master.gain.setTargetAtTime(gain,this.context.currentTime,.015);this.gainTarget=gain;}
        if(!this.enabled&&(this.pending.length||this.voices.size))this.pause();
    }
    async wake():Promise<boolean>{
        this.music.unlock();
        if(!this.enabled)return false;
        try{
            if(!this.context){
                const Constructor=globalThis.AudioContext||(globalThis as any).webkitAudioContext;if(!Constructor)return false;
                const ctx:AudioContext=this.context=new Constructor({latencyHint:'interactive'});
                this.master=ctx.createGain();this.master.gain.value=this.volume;
                const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-12;compressor.knee.value=12;compressor.ratio.value=5;compressor.attack.value=.003;compressor.release.value=.22;
                this.master.connect(compressor);compressor.connect(ctx.destination);
            }
            if(this.context!.state!=='running')await this.context!.resume();
            const now=performance.now(),queue=this.pending.splice(0);
            for(const item of queue)if(now-item.at<300)this.play(item.name);
            this.warm();
            return this.context!.state==='running';
        }catch{return false;}
    }
    private buffer(name:string){let buffer=this.buffers.get(name);if(!buffer&&this.context){const samples=soundSamples(name,this.context.sampleRate);if(!samples.length)return;buffer=this.context.createBuffer(1,samples.length,this.context.sampleRate);buffer.copyToChannel(samples as Float32Array<ArrayBuffer>,0);this.buffers.set(name,buffer);}return buffer;}
    private warm(){if(this.warming)return;this.warming=true;const names=['arrow','arrowhit','hit','sword','qiHit','break','down','fire','boom','qiWave','ricochet','split','ceramic','heal','turn','jump','charge','spiritCast','spiritImpact','spiritSummon','meteor','qiRebound','win','lose'];const step=()=>{if(!this.context||this.context.state==='closed')return;const name=names.shift();if(name)this.buffer(name);if(names.length){if(typeof requestIdleCallback==='function')requestIdleCallback(step,{timeout:250});else setTimeout(step,20);}};setTimeout(step,0);}
    play(name:string){
        if(!this.enabled||this.volume<=0||name==='click')return;
        const now=performance.now();this.requestedAt[name]=now;
        if(!this.context||this.context.state!=='running'){
            this.pending=this.pending.filter(p=>now-p.at<300&&p.name!==name);this.pending.push({name,at:now});return;
        }
        if(now-(this.lastPlayed[name]??-1e9)<(name==='arrowhit'?0:name==='qiHit'?24:45))return;
        const buffer=this.buffer(name);if(!buffer)return;
        if(this.voices.size>=20){const oldest=this.voices.values().next().value;oldest?.stop();if(oldest)this.voices.delete(oldest);}
        const source=this.context.createBufferSource();source.buffer=buffer;source.connect(this.master!);this.voices.add(source);
        source.onended=()=>{this.voices.delete(source);source.disconnect();};source.start();
        this.lastPlayed[name]=now;this.startedAt[name]=performance.now();this.playCount++;
    }
    pause(){for(const voice of this.voices){try{voice.stop();}catch{}}this.voices.clear();this.pending=[];}
    setTheme(_n:number){}
    update(state?:MusicState,paused=false,battleSession?:string){this.music.setPaused(paused);if(state)this.music.select(state,battleSession);this.music.tick();}
    dispose(){this.pause();this.music.dispose();void this.context?.close();}
}
