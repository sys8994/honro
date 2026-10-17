export type MusicState='main'|'battle'|'boss'|'silent';

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
    private battleSession:string|undefined; private battleSelected=false;
    constructor(public tracks:string[]=(globalThis as any).HONRO_BGM_TRACKS||[],
      private makeAudio:()=>HTMLAudioElement=()=>new Audio()){}
    configure(enabled:boolean,volume:number){
        this.enabled=enabled;this.volume=Math.max(0,Math.min(1,volume));this.settingsConfigured=true;
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
    select(state:MusicState,battleSession?:string){
        // Different playlists start at their first song and zero seconds.
        // Repeated updates, pauses and unlocks in the same playlist never seek.
        const playlistChanged=state!==this.state;
        if(playlistChanged){this.restartRequested=true;if(state==='battle')this.battleIndex=0;}
        // Direct encounter changes within one playlist keep the existing order.
        const freshEncounter=(state==='battle'||state==='boss')&&battleSession!==undefined&&battleSession!==this.battleSession;
        if(freshEncounter){
            if(!playlistChanged&&this.battleSelected)this.battleIndex=(this.battleIndex+1)%3;
            this.battleSession=battleSession;this.battleSelected=false;
            this.restartRequested=true;
        }
        this.state=state;
        if(state==='battle')this.battleSelected=true;
        if(state==='battle')for(let n=0;n<3&&this.failed.has(1+this.battleIndex);n++)this.battleIndex=(this.battleIndex+1)%3;
        const track=state==='main'?0:state==='boss'?4:state==='battle'?1+this.battleIndex:-1;
        if(track<0){this.silence();return;}
        const prepareTitle=state==='main'&&this.enabled&&this.volume>0&&!this.paused&&(typeof document==='undefined'||!document.hidden);
        if(!this.current&&(!this.enabled||this.volume<=0))return;
        if((!this.unlocked&&!prepareTitle)||!this.tracks[track]||this.failed.has(track))return;
        if(track===this.track&&this.current){if(this.restartRequested)this.current.currentTime=0;this.restartRequested=false;this.tryStartup();this.applyPause();return;}
        if(this.outgoing){this.outgoing.pause();this.outgoing.removeAttribute('src');this.outgoing.load();this.outgoing=null;}
        if(this.current)this.outgoing=this.current;
        this.restartRequested=false;this.track=track;const audio=this.current=this.makeAudio();audio.preload=prepareTitle?'auto':'metadata';audio.src=this.tracks[track];
        this.firstPlay=true;this.startupFade=false;
        audio.loop=state!=='battle';audio.volume=0;this.requested=false;this.transitionStart=performance.now();
        audio.addEventListener('ended',()=>{if(audio!==this.current||this.state!=='battle')return;this.battleIndex=(this.battleIndex+1)%3;this.select('battle');});
        audio.addEventListener('error',()=>{if(audio!==this.current)return;this.errors.push(`BGM ${track+1}: ${audio.error?.code||'media error'}`);this.failed.add(track);this.preloadFailed=track===0&&!this.gestureUnlocked;this.requested=false;
            if(this.state==='battle'&&[1,2,3].some(i=>!this.failed.has(i))){this.battleIndex=(this.battleIndex+1)%3;this.select('battle');}});
        this.tryStartup();this.applyPause();
    }
    setPaused(paused:boolean){if(this.paused===paused)return;this.paused=paused;this.applyPause();}
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
    tick(now=performance.now()){
        let mix=Math.max(0,Math.min(1,(now-this.transitionStart)/this.fadeMs));
        // The startup request must already be audible when play() checks policy.
        // Keep the short ramp, but never qualify as muted/zero-volume autoplay.
        if(this.startupFade){if(mix>=1)this.startupFade=false;else mix=Math.max(1/25,mix);}
        const volume=this.enabled&&this.unlocked?this.volume:0;
        if(this.current)this.current.volume=volume*mix;
        if(this.outgoing){this.outgoing.volume=volume*(1-mix);if(mix>=1){this.outgoing.pause();this.outgoing.removeAttribute('src');this.outgoing.load();this.outgoing=null;}}
    }
    silence(){for(const a of [this.current,this.outgoing])if(a){a.pause();a.removeAttribute('src');a.load();}this.current=null;this.outgoing=null;this.track=-1;this.requested=false;}
    dispose(){this.silence();this.unlocked=false;}
    status(){return{state:this.state,track:this.track<0?null:this.track+1,battleIndex:this.battleIndex,unlocked:this.unlocked,paused:this.paused,starts:this.starts,
        playing:[this.current,this.outgoing].filter(a=>a&&!a.paused).length,currentTime:this.current?.currentTime||0,errors:[...this.errors]};}
}
