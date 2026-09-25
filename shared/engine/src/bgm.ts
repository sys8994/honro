export type MusicState='main'|'battle'|'boss'|'silent';

/** Streaming BGM channel owned by AudioEngine. Never decodes an MP3 into an AudioBuffer. */
export class BgmPlayer {
    state:MusicState='main'; battleIndex=0; unlocked=false; enabled=true; volume=.35; paused=false;
    current:HTMLAudioElement|null=null; outgoing:HTMLAudioElement|null=null; track=-1;
    transitionStart=0; transitionMs=420; starts=0; errors:string[]=[];
    private positions=new Map<number,number>(); private failed=new Set<number>();
    private requested=false;
    constructor(public tracks:string[]=(globalThis as any).HONRO_BGM_TRACKS||[],
      private makeAudio:()=>HTMLAudioElement=()=>new Audio()){}
    configure(enabled:boolean,volume:number){
        this.enabled=enabled;this.volume=Math.max(0,Math.min(1,volume));
        this.applyPause();this.tick();
    }
    unlock(){this.unlocked=true;this.requested=false;this.select(this.state);this.applyPause();}
    select(state:MusicState){
        this.state=state;
        if(state==='battle')for(let n=0;n<3&&this.failed.has(1+this.battleIndex);n++)this.battleIndex=(this.battleIndex+1)%3;
        const track=state==='main'?0:state==='boss'?4:state==='battle'?1+this.battleIndex:-1;
        if(track<0){this.silence();return;}
        if(!this.unlocked||!this.tracks[track]||this.failed.has(track))return;
        if(track===this.track&&this.current)return;
        if(this.outgoing){this.outgoing.pause();this.outgoing.removeAttribute('src');this.outgoing.load();this.outgoing=null;}
        if(this.current){this.positions.set(this.track,this.current.currentTime||0);this.outgoing=this.current;}
        this.track=track;const audio=this.current=this.makeAudio();audio.preload='metadata';audio.src=this.tracks[track];
        audio.loop=state!=='battle';audio.volume=0;this.requested=false;this.transitionStart=performance.now();
        audio.addEventListener('loadedmetadata',()=>{if(this.current!==audio)return;const time=this.positions.get(track)||0;if(time>0&&Number.isFinite(audio.duration)&&time<audio.duration)audio.currentTime=time;});
        audio.addEventListener('ended',()=>{if(audio!==this.current||this.state!=='battle')return;this.positions.delete(track);this.battleIndex=(this.battleIndex+1)%3;this.select('battle');});
        audio.addEventListener('error',()=>{if(audio!==this.current)return;this.errors.push(`BGM ${track+1}: ${audio.error?.code||'media error'}`);this.failed.add(track);this.requested=false;
            if(this.state==='battle'&&[1,2,3].some(i=>!this.failed.has(i))){this.battleIndex=(this.battleIndex+1)%3;this.select('battle');}});
        this.applyPause();
    }
    setPaused(paused:boolean){if(this.paused===paused)return;this.paused=paused;this.applyPause();}
    private applyPause(){
        const stop=this.paused||!this.enabled||this.volume<=0||!this.unlocked;
        if(stop){this.current?.pause();this.outgoing?.pause();this.requested=false;return;}
        if(this.current?.paused&&!this.requested&&!this.failed.has(this.track)){
            const audio=this.current;this.requested=true;
            try{const promise=audio.play();this.starts++;promise?.catch(error=>{if(this.current!==audio)return;this.errors.push(String(error?.name||error));
                // Autoplay rejection waits for another real gesture. No per-frame retries.
                if(error?.name==='NotAllowedError')this.unlocked=false;
            });}catch(error){this.errors.push(String(error));}
        }
    }
    tick(now=performance.now()){
        const mix=Math.max(0,Math.min(1,(now-this.transitionStart)/this.transitionMs)),volume=this.enabled?this.volume:0;
        if(this.current)this.current.volume=volume*mix;
        if(this.outgoing){this.outgoing.volume=volume*(1-mix);if(mix>=1){this.outgoing.pause();this.outgoing.removeAttribute('src');this.outgoing.load();this.outgoing=null;}}
    }
    silence(){for(const a of [this.current,this.outgoing])if(a){a.pause();a.removeAttribute('src');a.load();}this.current=null;this.outgoing=null;this.track=-1;this.requested=false;}
    dispose(){this.silence();this.unlocked=false;}
    status(){return{state:this.state,track:this.track<0?null:this.track+1,battleIndex:this.battleIndex,unlocked:this.unlocked,paused:this.paused,starts:this.starts,
        playing:[this.current,this.outgoing].filter(a=>a&&!a.paused).length,currentTime:this.current?.currentTime||0,errors:[...this.errors]};}
}
