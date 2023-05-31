class synthLoopSonification{
    constructor(type,notePattern,initVolume){
        this.notePattern = notePattern;
        this.type = type;
        this.initVolume = initVolume;
        this.valPlayback = 1;
        this.valPlaybackPrev = 1;

        this.playingFlag = false;
        this.distance = 1000; // some very large value to begin with.. 

        this.synth = new Tone.Synth({
            oscillator: {
                type: this.type,
                volume: this.initVolume,
            }
        });

        // this.loop = new Tone.Loop((time) => {
        //     this.synth.triggerAttackRelease(220, "8n", time); // '8n' plays every 8th note at a default bpm (120).. 
        // },"8n");
        // this.loop.interval = '8n';


        this.loop = new Tone.Pattern((time, note) => {
            this.synth.triggerAttackRelease(note, "16n", time); // '8n' plays every 8th note at a default bpm (120).. 
        },this.notePattern, "upDown");
        this.loop.interval = '16n';
        // this.loop.interval = '8n';

        this.panner = new Tone.Panner3D();
        this.panner.panningModel = 'HRTF';
        this.panner.setPosition(0, 0, 0);

        this.synth.connect(this.panner);
    }

    setPlaybackRate(v,mapInterval) {
        if (v < mapInterval[0]) v = mapInterval[0];
        if (v > mapInterval[1]) v = mapInterval[1];

        let rangeSize = mapInterval[1] - mapInterval[0];
        let perc_interval = 5;

        v = Math.floor(v / (perc_interval * rangeSize / 100)) * (perc_interval * rangeSize / 100);
        if (v < mapInterval[0]) v = mapInterval[0];
        if (v > mapInterval[1]) v = mapInterval[1];

        this.valPlayback = exponentialMapping(0.5, 3.0, mapInterval[1], mapInterval[0], 8.0, v);

        if (this.valPlayback !== this.valPlaybackPrev) {
            this.loop.playbackRate = this.valPlayback;
        }
        this.valPlaybackPrev = this.valPlayback;
    }


    // get synth(){
    //     return this.synth;
    // }

    // get loop(){
    //     return this.loop;
    // }

    // set connectSynthToNode(node){
    //     this.synth.connect(node);
    //     console.log('done')
    //     console.log(node);
    // }

    // startLoopNow(){
    //     this.loop.start(0);
    // }

    // stopLoopNow(){
    //     this.loop.stop(0);
    // }

    // setVolumeRampTo(volume,time){
    //     this.synth.volume.rampTo(volume,time);
    //     console.log('here!')
    // }

    // setVolume(volume){
    //     this.synth.volume.value = volume;
    // }

    // setPlaybackRate(rate){
    //     this.loop.setPlaybackRate(rate);
    // }
}