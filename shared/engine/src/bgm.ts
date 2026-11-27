export type MusicState='main'|'battle'|'boss'|'silent';
type StageMusic={start:number;loop:number[];event?:number};

/** Streaming BGM channel owned by AudioEngine. Never decodes an MP3 into an AudioBuffer. */
export class BgmPlayer {
    state:MusicState='main'; battleIndex=0; unlocked=false; enabled=true; volume=.35; paused=false;
    current:HTMLAudioElement|null=null; outgoing:HTMLAudioElement|null=null; track=-1;
    transitionStart=0; transitionMs=420; starts=0; errors:string[]=[];
    private failed=new Set<number>();
    private restartRequested=false;
    private requested=false;
    private firstPlay=true;
    private settingsConfigured=false;
    private startupAttempted=false;
    private startupFade=false;
    private gestureUnlocked=false;
    private playSerial=0;
    private fadeMs=25;
    private preloadFailed=false;
    private duckAt=-Infinity; private duckRelease=0; private duckEnd=0; private duckFrom=1;
    private battleSession:string|undefined;
    private battleStage=1;
    private eventActive=false;
    constructor(public tracks:string[]=(globalThis as any).HONRO_BGM_TRACKS||[],
      private makeAudio:()=>HTMLAudioElement=()=>new Audio(),
      private stages:Record<number,StageMusic>=(globalThis as any).HONRO_BGM_STAGES||{1:{start:1,loop:[1]}}){}
    configure(enabled:boolean,volume:number){
        this.enabled=enabled;this.volume=Math.max(0,Math.min(1,volume));this.settingsConfigured=true;if(!enabled||this.volume<=0)this.clearDucking();
        // Prepare only the current title song after applying the saved music settings.
        // Try audible title playback once. The browser may still require unlock()
        // from the existing trusted-input handlers before allowing this stream.
        if(!this.current&&this.state==='main'&&this.enabled&&this.volume>0)this.select('main');
        this.tryStartup();
        this.applyPause();this.tick();
    }
    private tryStartup(){
        if(this.settingsConfigured&&!this.startupAttempted&&!this.unlocked&&this.current&&this.state==='main'&&this.enabled&&this.volume>0&&!this.paused&&(typeof document==='undefined'||!document.hidden)){
            this.startupAttempted=true;this.startupFade=true;this.unlocked=true;
        }
    }
    unlock(){if(this.preloadFailed){this.failed.delete(0);this.silence();this.preloadFailed=false;}this.gestureUnlocked=true;this.unlocked=true;this.requested=false;this.select(this.state);this.applyPause();}
    select(state:MusicState,battleSession?:string,stage?:number,event?:boolean){
        // Generic boss calls keep the chapter score. Only its authored cue can override it.
        if(state==='boss')state='battle';
        const nextStage=stage===undefined?this.battleStage:this.stages[stage]?stage:1;
        const score=this.stages[nextStage];
        const entering=state==='battle'&&(this.state!=='battle'||nextStage!==this.battleStage||
            (battleSession!==undefined&&battleSession!==this.battleSession));
        const nextEvent=state==='battle'&&score.event!==undefined&&(event??(!entering&&this.eventActive));
        if(entering)this.battleIndex=score.loop.indexOf(score.start);
        if(entering||state!==this.state||nextEvent!==this.eventActive){
            this.clearDucking();
            this.restartRequested=true;
        }
        if(battleSession!==undefined)this.battleSession=battleSession;
        this.battleStage=nextStage;
        this.eventActive=nextEvent;
        this.state=state;
        let track=0,loop=true;
        if(state==='silent'){if(this.current||this.outgoing)this.silence();return;}
        if(state==='battle'){
            if(this.eventActive){track=score.event!;}
            else{
                track=score.loop[this.battleIndex]??score.start;
                for(let i=0;i<score.loop.length&&this.failed.has(track);i++){
                    this.battleIndex=(this.battleIndex+1)%score.loop.length;
                    track=score.loop[this.battleIndex];
                }
                loop=score.loop.length===1&&track===score.loop[0];
            }
        }
        const prepareTitle=state==='main'&&this.enabled&&this.volume>0&&!this.paused&&(typeof document==='undefined'||!document.hidden);
        if(!this.current&&(!this.enabled||this.volume<=0))return;
        if(!this.tracks[track]||this.failed.has(track)){if(this.current||this.outgoing)this.silence();return;}
        if(!this.unlocked&&!prepareTitle)return;
        if(track===this.track&&this.current){
            this.current.loop=loop;
            if(this.restartRequested){this.current.currentTime=0;this.requested=false;}
            this.restartRequested=false;this.tryStartup();this.applyPause();return;
        }
        this.clearDucking();
        if(this.outgoing){this.outgoing.pause();this.outgoing.removeAttribute('src');this.outgoing.load();this.outgoing=null;}
        if(this.current)this.outgoing=this.current;
        this.restartRequested=false;this.track=track;const audio=this.current=this.makeAudio();audio.preload=prepareTitle?'auto':'metadata';audio.src=this.tracks[track];
        this.firstPlay=true;this.startupFade=false;
        audio.loop=loop;audio.volume=0;this.requested=false;this.transitionStart=performance.now();
        audio.addEventListener('ended',()=>{
            if(audio!==this.current||audio.loop||this.state!=='battle')return;
            const length=this.stages[this.battleStage].loop.length;
            this.battleIndex=(this.battleIndex+1)%length;
            this.restartRequested=true;this.select('battle');
        });
        audio.addEventListener('error',()=>{if(audio!==this.current)return;this.errors.push(`BGM ${this.tracks[track]}: ${audio.error?.code||'media error'}`);this.failed.add(track);this.preloadFailed=track===0&&!this.gestureUnlocked;this.requested=false;
            if(this.state==='battle')this.select('battle');});
        this.tryStartup();this.applyPause();
    }
    setPaused(paused:boolean){if(paused)this.clearDucking();if(this.paused===paused)return;this.paused=paused;this.applyPause();}
    private applyPause(){
        const stop=this.paused||!this.enabled||this.volume<=0||!this.unlocked;
        if(stop){this.current?.pause();this.outgoing?.pause();this.requested=false;return;}
        if(this.current?.paused&&!this.requested&&!this.failed.has(this.track)){
            const audio=this.current,serial=++this.playSerial;this.requested=true;
            // A prepared stream may have waited on the title for seconds. Fade from
            // the actual play request, not from creation of the silent media element.
            // Initial playback only needs a short anti-click ramp; retain the full
            // 420 ms crossfade when replacing an existing stream.
            if(this.firstPlay){this.transitionStart=performance.now();this.fadeMs=this.outgoing?this.transitionMs:25;this.firstPlay=false;this.tick(this.transitionStart);}
            const rejected=(error:any)=>{if(this.current!==audio||serial!==this.playSerial)return;this.errors.push(String(error?.name||error));
                // Autoplay rejection waits for another real gesture. No per-frame retries.
                if(error?.name==='NotAllowedError'){this.unlocked=false;this.firstPlay=true;this.startupFade=false;this.applyPause();this.tick();}
            };
            try{const promise=audio.play();this.starts++;promise?.catch(rejected);}catch(error){rejected(error);}
        }
    }
    duck(durationSeconds:number){
        if(!this.current||!this.enabled||!this.unlocked||this.paused||this.volume<=0||typeof document!=='undefined'&&document.hidden)return false;
        const now=performance.now();this.duckFrom=this.duckingFactor(now);this.duckAt=now;this.duckRelease=now+Math.max(140,durationSeconds*1000-900);this.duckEnd=this.duckRelease+900;this.tick(now);return true;
    }
    duckingFactor(now=performance.now()){
        if(now>=this.duckEnd)return 1;
        if(now<this.duckAt+140)return this.duckFrom+(.63-this.duckFrom)*Math.max(0,(now-this.duckAt)/140);
        if(now<this.duckRelease)return .63;
        const t=Math.max(0,Math.min(1,(now-this.duckRelease)/900));return .63+.37*t*t*(3-2*t);
    }
    clearDucking(){this.duckAt=-Infinity;this.duckRelease=this.duckEnd=0;this.duckFrom=1;this.tick();}
    tick(now=performance.now()){
        let mix=Math.max(0,Math.min(1,(now-this.transitionStart)/this.fadeMs));
        // The startup request must already be audible when play() checks policy.
        // Keep the short ramp, but never qualify as muted/zero-volume autoplay.
        if(this.startupFade){if(mix>=1)this.startupFade=false;else mix=Math.max(1/25,mix);}
        const volume=this.enabled&&this.unlocked?this.volume*this.duckingFactor(now):0;
        if(this.current)this.current.volume=volume*mix;
        if(this.outgoing){this.outgoing.volume=volume*(1-mix);if(mix>=1){this.outgoing.pause();this.outgoing.removeAttribute('src');this.outgoing.load();this.outgoing=null;}}
    }
    silence(){this.clearDucking();for(const a of [this.current,this.outgoing])if(a){a.pause();a.removeAttribute('src');a.load();}this.current=null;this.outgoing=null;this.track=-1;this.requested=false;}
    dispose(){this.silence();this.unlocked=false;}
    status(){return{state:this.state,track:this.track<0?null:this.track+1,battleIndex:this.battleIndex,battleAct:Math.ceil(this.battleStage/10),battleStage:this.battleStage,eventActive:this.eventActive,unlocked:this.unlocked,paused:this.paused,starts:this.starts,
        duckGain:this.duckingFactor(),ducking:performance.now()<this.duckEnd,playing:[this.current,this.outgoing].filter(a=>a&&!a.paused).length,currentTime:this.current?.currentTime||0,errors:[...this.errors]};}
}
